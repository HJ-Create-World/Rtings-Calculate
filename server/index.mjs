import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { PORT, DIST_DIR } from './config.mjs';
import {
  listProviderConfigs,
  upsertProviderConfig,
  deleteProviderConfig,
  getProviderSecret,
  insertUsageEvent,
  listUsageEvents,
  callExternalModel,
} from './aiService.mjs';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function readBody(req) {
  return new Promise((resolvePromise, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 2_000_000) reject(new Error('请求体过大'));
    });
    req.on('end', () => {
      try {
        resolvePromise(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('请求体不是有效 JSON'));
      }
    });
    req.on('error', reject);
  });
}

function bearerToken(req) {
  const header = req.headers.authorization ?? '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

async function handleApi(req, res, url) {
  const token = bearerToken(req);
  const path = url.pathname;

  if (!token) return sendJson(res, 401, { error: '缺少登录 token' });

  if (req.method === 'GET' && path === '/api/ai/models') {
    return sendJson(res, 200, { configs: await listProviderConfigs(token) });
  }

  if (req.method === 'GET' && path === '/api/ai/usage') {
    const limit = Number(url.searchParams.get('limit') ?? 50);
    return sendJson(res, 200, { events: await listUsageEvents(token, limit) });
  }

  if (req.method === 'POST' && path === '/api/ai/providers') {
    const body = await readBody(req);
    return sendJson(res, 200, { config: await upsertProviderConfig(token, body.config ?? body) });
  }

  if (req.method === 'DELETE' && path.startsWith('/api/ai/providers/')) {
    const configId = path.split('/').pop();
    await deleteProviderConfig(token, configId);
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === 'POST' && path === '/api/ai/chat') {
    const body = await readBody(req);
    if (!body.configId || !body.model || !Array.isArray(body.messages)) {
      return sendJson(res, 400, { error: '缺少 configId、model 或 messages' });
    }
    if (body.messages[0]?.role !== 'system') {
      return sendJson(res, 400, { error: 'messages[0] 必须是 system 消息' });
    }

    const provider = await getProviderSecret(token, body.configId);
    try {
      const result = await callExternalModel({
        provider: provider.provider,
        baseUrl: provider.baseUrl,
        chatPath: provider.chatPath,
        apiKey: provider.apiKey,
        model: body.model,
        messages: body.messages,
        temperature: body.temperature,
        maxTokens: body.maxTokens,
      });
      await insertUsageEvent(token, {
        providerId: provider.id,
        provider: provider.provider,
        model: result.model,
        status: 'success',
        promptTokens: result.usage?.promptTokens ?? null,
        completionTokens: result.usage?.completionTokens ?? null,
        totalTokens: result.usage?.totalTokens ?? null,
        credits: result.usage?.credits ?? null,
        durationMs: result.durationMs,
        requestId: result.requestId,
        businessId: body.businessId ?? null,
      });
      return sendJson(res, 200, result);
    } catch (error) {
      await insertUsageEvent(token, {
        providerId: provider.id,
        provider: provider.provider,
        model: body.model,
        status: 'error',
        durationMs: 0,
        businessId: body.businessId ?? null,
      });
      throw error;
    }
  }

  return sendJson(res, 404, { error: '接口不存在' });
}

async function serveStatic(res, pathname) {
  const safePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = resolve(join(DIST_DIR, safePath));
  if (!filePath.startsWith(resolve(DIST_DIR))) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error('not file');
    const content = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    res.end(content);
  } catch {
    const content = await readFile(join(DIST_DIR, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    res.end(content);
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: '方法不支持' });
    await serveStatic(res, url.pathname);
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误';
    sendJson(res, 400, { error: message });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`AI server listening on http://0.0.0.0:${PORT}`);
});
