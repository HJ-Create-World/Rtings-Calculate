import { useAuth } from '../composables/useAuth';

export interface ExternalAiConfig {
  id: string;
  provider: string;
  label: string;
  baseUrl: string;
  chatPath: string;
  models: string[];
  isEnabled: boolean;
}

export interface ExternalAiUsageEvent {
  id: string;
  userId: string;
  providerId: string | null;
  provider: string;
  model: string;
  status: 'success' | 'error' | string;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  credits: number | null;
  durationMs: number | null;
  requestId: string | null;
  businessId: string | null;
  createdAt: string;
}

export interface ExternalAiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ExternalAiChatResult {
  content: string;
  usage: {
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    credits: number | null;
  } | null;
  model: string;
  durationMs: number;
  requestId: string | null;
}

export interface ExternalAiConfigInput {
  id?: string;
  provider: string;
  label: string;
  baseUrl: string;
  chatPath: string;
  apiKey?: string;
  models: string[];
  isEnabled?: boolean;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { session } = useAuth();
  const token = session.value?.token;
  if (!token) throw new Error('请先登录');

  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (payload as { error?: string })?.error || `请求失败（HTTP ${response.status}）`;
    throw new Error(message);
  }
  return payload as T;
}

export function listExternalAiConfigs(): Promise<ExternalAiConfig[]> {
  return request<{ configs: ExternalAiConfig[] }>('/api/ai/models').then(result => result.configs ?? []);
}

export function saveExternalAiConfig(config: ExternalAiConfigInput): Promise<ExternalAiConfig> {
  return request<{ config: ExternalAiConfig }>('/api/ai/providers', {
    method: 'POST',
    body: JSON.stringify({ config }),
  }).then(result => result.config);
}

export function deleteExternalAiConfig(configId: string): Promise<void> {
  return request<{ ok: true }>(`/api/ai/providers/${encodeURIComponent(configId)}`, {
    method: 'DELETE',
  }).then(() => undefined);
}

export function listExternalAiUsage(limit = 50): Promise<ExternalAiUsageEvent[]> {
  return request<{ events: ExternalAiUsageEvent[] }>(`/api/ai/usage?limit=${limit}`).then(
    result => result.events ?? []
  );
}

export function callExternalAi(input: {
  configId: string;
  model: string;
  messages: ExternalAiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  businessId?: string;
}): Promise<ExternalAiChatResult> {
  return request<ExternalAiChatResult>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function externalAiErrorMessage(error: unknown, fallback = '外部模型请求失败'): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
