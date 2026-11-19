import { createWorkBuddyCloud } from '@tencent-ai/workbuddy-cloud-sdk';
import { CLOUD_ENDPOINT, CLOUD_OAUTH_RELAY, CLOUD_PUBLISHABLE_KEY } from './config.mjs';
import { AI_SERVER_SECRET } from './secrets.mjs';

const cloud = createWorkBuddyCloud({
  endpoint: CLOUD_ENDPOINT,
  oauthRelayBaseUrl: CLOUD_OAUTH_RELAY,
  publishableKey: CLOUD_PUBLISHABLE_KEY,
});

async function rpc(name, params) {
  const result = await cloud.database.rpc(name, params);
  if (result.error) {
    const raw = result.error;
    const message = raw?.message || raw?.error?.message || raw?.message || '云服务请求失败';
    throw new Error(message);
  }
  return result.data;
}

export function listProviderConfigs(token) {
  return rpc('app_ai_list_provider_configs', { p_token: token });
}

export function upsertProviderConfig(token, config) {
  return rpc('app_ai_upsert_provider_config', {
    p_token: token,
    p_config: config,
  });
}

export function deleteProviderConfig(token, configId) {
  return rpc('app_ai_delete_provider_config', {
    p_token: token,
    p_config_id: configId,
  });
}

function normalizeUsage(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const toNumber = value => (Number.isFinite(Number(value)) ? Number(value) : null);
  return {
    promptTokens: toNumber(raw.prompt_tokens ?? raw.promptTokens),
    completionTokens: toNumber(raw.completion_tokens ?? raw.completionTokens),
    totalTokens: toNumber(raw.total_tokens ?? raw.totalTokens),
    credits: toNumber(raw.credit ?? raw.credits),
  };
}

export async function getProviderSecret(token, configId) {
  return rpc('app_ai_get_provider_secret', {
    p_token: token,
    p_server_secret: AI_SERVER_SECRET,
    p_config_id: configId,
  });
}

export async function insertUsageEvent(token, event) {
  await rpc('app_ai_insert_usage_event', {
    p_token: token,
    p_server_secret: AI_SERVER_SECRET,
    p_event: event,
  });
}

export function listUsageEvents(token, limit = 50) {
  return rpc('app_ai_list_usage_events', {
    p_token: token,
    p_limit: limit,
  });
}

export async function callExternalModel(input) {
  const { provider, baseUrl, chatPath, apiKey, model, messages } = input;
  const endpoint = new URL(chatPath || '/chat/completions', baseUrl).toString();
  const startedAt = Date.now();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      temperature: input.temperature ?? 0.2,
      max_tokens: input.maxTokens ?? 2000,
    }),
  });

  const rawText = await response.text();
  let payload;
  try {
    payload = JSON.parse(rawText);
  } catch {
    throw new Error(`模型服务返回非 JSON：${rawText.slice(0, 160)}`);
  }
  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error('模型没有返回内容');

  return {
    content,
    usage: normalizeUsage(payload.usage),
    model: payload?.model ?? model,
    durationMs: Date.now() - startedAt,
    requestId: response.headers.get('x-request-id') ?? null,
  };
}
