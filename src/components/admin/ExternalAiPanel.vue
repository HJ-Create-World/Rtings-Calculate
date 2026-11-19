<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAuth } from '../../composables/useAuth';
import {
  deleteExternalAiConfig,
  externalAiErrorMessage,
  listExternalAiConfigs,
  listExternalAiUsage,
  saveExternalAiConfig,
  type ExternalAiConfig,
  type ExternalAiUsageEvent
} from '../../services/externalAi';
import {
  inputClass,
  mutedTextClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionTitleClass
} from '../../utils/ui';

const { isAdmin } = useAuth();

const configs = ref<ExternalAiConfig[]>([]);
const usage = ref<ExternalAiUsageEvent[]>([]);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const notice = ref('');
const editingId = ref<string | null>(null);
const formOpen = ref(false);

const form = ref({
  provider: 'deepseek',
  label: '',
  baseUrl: 'https://api.deepseek.com/v1',
  chatPath: '/chat/completions',
  apiKey: '',
  models: '',
  isEnabled: true
});

const providerPresets = [
  { provider: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', chatPath: '/chat/completions', models: 'deepseek-chat,deepseek-reasoner' },
  { provider: 'glm', label: 'GLM 智谱', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', chatPath: '/chat/completions', models: 'glm-4.7,glm-4.6,glm-4.6v' },
  { provider: 'kimi', label: 'Kimi', baseUrl: 'https://api.moonshot.cn/v1', chatPath: '/chat/completions', models: 'kimi-k3-1,kimi-k2.8-preview,kimi-k2.5' },
  { provider: 'minimax', label: 'MiniMax', baseUrl: 'https://api.minimaxi.com/v1', chatPath: '/chat/completions', models: 'MiniMax-M3.1-Flash' }
];

const providerOptions = computed(() => [
  { value: '', label: '选择服务商' },
  ...providerPresets.map(preset => ({ value: preset.provider, label: preset.label }))
]);

function selectPreset(provider: string) {
  const preset = providerPresets.find(item => item.provider === provider);
  if (!preset) return;
  form.value.label = preset.label;
  form.value.baseUrl = preset.baseUrl;
  form.value.chatPath = preset.chatPath;
  form.value.models = preset.models;
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [configList, usageList] = await Promise.allSettled([
      listExternalAiConfigs(),
      listExternalAiUsage(50)
    ]);
    if (configList.status === 'fulfilled') configs.value = configList.value;
    if (usageList.status === 'fulfilled') usage.value = usageList.value;
  } catch (err) {
    error.value = externalAiErrorMessage(err, '外部模型配置加载失败');
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  formOpen.value = true;
  form.value = {
    provider: '',
    label: '',
    baseUrl: '',
    chatPath: '/chat/completions',
    apiKey: '',
    models: '',
    isEnabled: true
  };
}

function openEdit(config: ExternalAiConfig) {
  editingId.value = config.id;
  formOpen.value = true;
  form.value = {
    provider: config.provider,
    label: config.label,
    baseUrl: config.baseUrl,
    chatPath: config.chatPath,
    apiKey: '',
    models: config.models.join(','),
    isEnabled: config.isEnabled
  };
}

async function saveConfig() {
  saving.value = true;
  error.value = '';
  notice.value = '';
  try {
    await saveExternalAiConfig({
      id: editingId.value ?? undefined,
      provider: form.value.provider,
      label: form.value.label,
      baseUrl: form.value.baseUrl,
      chatPath: form.value.chatPath,
      apiKey: form.value.apiKey,
      models: form.value.models.split(',').map(item => item.trim()).filter(Boolean),
      isEnabled: form.value.isEnabled
    });
    notice.value = editingId.value ? '外部模型配置已更新' : '外部模型配置已保存';
    formOpen.value = false;
    editingId.value = null;
    await load();
  } catch (err) {
    error.value = externalAiErrorMessage(err, '保存外部模型配置失败');
  } finally {
    saving.value = false;
  }
}

async function removeConfig(configId: string) {
  try {
    await deleteExternalAiConfig(configId);
    notice.value = '外部模型配置已删除';
    await load();
  } catch (err) {
    error.value = externalAiErrorMessage(err, '删除外部模型配置失败');
  }
}

onMounted(load);
</script>

<template>
  <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <div class="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h3 :class="['text-xl', sectionTitleClass]">外部模型接入</h3>
        <p :class="['mt-2 text-sm', mutedTextClass]">API Key 只保存在云数据库，前端不会展示；调用记录按账号留档</p>
      </div>
      <div class="flex gap-2">
        <button :class="secondaryButtonClass" :disabled="loading" @click="load">
          {{ loading ? '刷新中…' : '刷新' }}
        </button>
        <button v-if="isAdmin" :class="primaryButtonClass" @click="openCreate">添加服务商</button>
      </div>
    </div>

    <p v-if="notice" class="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{{ notice }}</p>
    <p v-if="error" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{{ error }}</p>

    <section v-if="isAdmin && formOpen" class="mb-6 rounded-xl border border-gray-200 p-5">
      <h4 class="text-base font-semibold text-gray-900">服务商配置</h4>
      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label class="text-sm text-gray-600">服务商</label>
          <select v-model="form.provider" :class="inputClass" @change="selectPreset(form.provider)">
            <option v-for="option in providerOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="text-sm text-gray-600">显示名称</label>
          <input v-model="form.label" :class="inputClass" />
        </div>
        <div>
          <label class="text-sm text-gray-600">Base URL</label>
          <input v-model="form.baseUrl" :class="inputClass" />
        </div>
        <div>
          <label class="text-sm text-gray-600">Chat Path</label>
          <input v-model="form.chatPath" :class="inputClass" />
        </div>
        <div class="md:col-span-2">
          <label class="text-sm text-gray-600">API Key（保存后不再展示）</label>
          <input v-model="form.apiKey" type="password" :class="inputClass" />
        </div>
        <div class="md:col-span-2">
          <label class="text-sm text-gray-600">模型 ID（逗号分隔）</label>
          <input v-model="form.models" :class="inputClass" />
        </div>
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button :class="secondaryButtonClass" @click="formOpen = false">取消</button>
        <button :class="primaryButtonClass" :disabled="saving" @click="saveConfig">
          {{ saving ? '保存中…' : '保存配置' }}
        </button>
      </div>
    </section>

    <div class="mb-6 overflow-x-auto rounded-xl border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-3 text-left font-semibold text-gray-900">服务商</th>
            <th class="px-3 py-3 text-left font-semibold text-gray-900">Base URL</th>
            <th class="px-3 py-3 text-left font-semibold text-gray-900">模型</th>
            <th class="px-3 py-3 text-right font-semibold text-gray-900">状态</th>
            <th v-if="isAdmin" class="px-3 py-3 text-right font-semibold text-gray-900">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="config in configs" :key="config.id" class="hover:bg-gray-50">
            <td class="px-3 py-3 font-medium text-gray-900">{{ config.label }}</td>
            <td class="px-3 py-3 text-gray-700">{{ config.baseUrl }}</td>
            <td class="px-3 py-3 text-gray-700">{{ config.models.join(', ') }}</td>
            <td class="px-3 py-3 text-right text-emerald-700">启用</td>
            <td v-if="isAdmin" class="px-3 py-3 text-right">
              <button :class="secondaryButtonClass" @click="openEdit(config)">编辑</button>
              <button :class="secondaryButtonClass" class="ml-2" @click="removeConfig(config.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <section class="rounded-xl border border-gray-200 p-5">
      <h4 class="text-base font-semibold text-gray-900">最近调用用量</h4>
      <div class="mt-4 max-h-[320px] overflow-auto rounded-xl border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="sticky top-0 bg-gray-50">
            <tr>
              <th class="px-3 py-3 text-left font-semibold text-gray-900">模型</th>
              <th class="px-3 py-3 text-right font-semibold text-gray-900">Tokens</th>
              <th class="px-3 py-3 text-right font-semibold text-gray-900">耗时</th>
              <th class="px-3 py-3 text-right font-semibold text-gray-900">状态</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="event in usage" :key="event.id" class="hover:bg-gray-50">
              <td class="px-3 py-3 text-gray-900">{{ event.provider }} / {{ event.model }}</td>
              <td class="px-3 py-3 text-right text-gray-700">{{ event.totalTokens ?? '—' }}</td>
              <td class="px-3 py-3 text-right text-gray-700">{{ event.durationMs ? `${event.durationMs} ms` : '—' }}</td>
              <td
                :class="[
                  'px-3 py-3 text-right',
                  event.status === 'success' ? 'text-emerald-700' : 'text-red-600'
                ]"
              >
                {{ event.status }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
