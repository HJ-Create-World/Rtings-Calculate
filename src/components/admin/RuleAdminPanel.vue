<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import UiSelect from '../UiSelect.vue';
import { useAuth } from '../../composables/useAuth';
import { useRuleRuntime } from '../../composables/useRuleRuntime';
import {
  createRuleVersion,
  generateDataDiff,
  getDataDiff,
  listDataDiffs,
  listDataSnapshots,
  listRuleActivationLogs,
  listRuleVersions,
  readRtingsCsvSnapshot,
  ruleAdminErrorMessage,
  uploadDataSnapshot,
  activateRuleVersion,
  type DataDiff,
  type DataSnapshot,
  type RuleActivationLog,
  type RuleVersion
} from '../../services/ruleAdministration';
import { inputClass, mutedTextClass, primaryButtonClass, secondaryButtonClass, sectionTitleClass } from '../../utils/ui';

const { session } = useAuth();
const { currentRule, initializeRuleRuntime } = useRuleRuntime();

const snapshots = ref<DataSnapshot[]>([]);
const diffs = ref<DataDiff[]>([]);
const ruleVersions = ref<RuleVersion[]>([]);
const logs = ref<RuleActivationLog[]>([]);
const loading = ref(false);
const uploading = ref(false);

const generating = ref(false);
const importing = ref(false);
const switchingVersionId = ref('');
const error = ref('');
const notice = ref('');

const uploadFile = ref<File | null>(null);
const versionLabel = ref('');
const baseSnapshotId = ref('');
const targetSnapshotId = ref('');
const ruleVersionName = ref('');
const ruleDisplayName = ref('');
const ruleDescription = ref('');

const activeVersion = computed(() =>
  ruleVersions.value.find(version => version.status === 'active') ?? null
);

const snapshotOptions = computed(() => [
  { value: '', label: '选择数据快照' },
  ...snapshots.value.map(snapshot => ({
    value: snapshot.id,
    label: `${snapshot.versionLabel} · ${snapshot.productCount} 款 · ${snapshot.columnCount} 列`
  }))
]);

const latestSummary = computed(() => diffs.value[0]?.summary ?? null);

const statusLabels: Record<string, string> = {
  active: '当前生效',
  draft: '草稿',
  retired: '历史版本'
};

const actionLabels: Record<string, string> = {
  activate: '激活',
  rollback: '回滚'
};

async function load() {
  const token = session.value?.token;
  if (!token) return;
  loading.value = true;
  error.value = '';
  try {
    const [snapshotSettled, diffSettled, versionSettled, logsSettled] = await Promise.allSettled([
      listDataSnapshots(token),
      listDataDiffs(token),
      listRuleVersions(token),
      listRuleActivationLogs(token)
    ]);

    const snapshotList = snapshotSettled.status === 'fulfilled' ? snapshotSettled.value : [];
    diffs.value = diffSettled.status === 'fulfilled' ? diffSettled.value : diffs.value;
    ruleVersions.value = versionSettled.status === 'fulfilled' ? versionSettled.value : ruleVersions.value;
    logs.value = logsSettled.status === 'fulfilled' ? logsSettled.value : logs.value;

    if (snapshotSettled.status === 'fulfilled') {
      snapshots.value = snapshotList;
      if (!baseSnapshotId.value && snapshotList.length >= 2) {
        baseSnapshotId.value = snapshotList[snapshotList.length - 2].id;
        targetSnapshotId.value = snapshotList[snapshotList.length - 1].id;
      } else if (!targetSnapshotId.value && snapshotList.length) {
        targetSnapshotId.value = snapshotList[0].id;
      }
    }

    const failures = [snapshotSettled, diffSettled, versionSettled, logsSettled]
      .filter(result => result.status === 'rejected') as Array<PromiseRejectedResult>;
    if (failures.length) {
      error.value = ruleAdminErrorMessage(failures[0].reason, `部分云端数据加载失败（${failures.length}/4 项），已显示可加载部分`);
    }
  } catch (err) {
    error.value = ruleAdminErrorMessage(err, '加载规则管理数据失败');
  } finally {
    loading.value = false;
  }
}

function selectUploadFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null;
  uploadFile.value = file;
  if (file && !versionLabel.value) {
    versionLabel.value = file.name.replace(/\.csv$/i, '').replace(/[^\w-]+/g, '-').slice(0, 32);
  }
}

async function uploadSnapshot() {
  const token = session.value?.token;
  if (!token || !uploadFile.value) return;
  if (!versionLabel.value.trim()) {
    error.value = '请填写数据版本标识';
    return;
  }

  uploading.value = true;
  error.value = '';
  notice.value = '';
  try {
    const parsed = await readRtingsCsvSnapshot(uploadFile.value);
    await uploadDataSnapshot(token, {
      versionLabel: versionLabel.value.trim(),
      ...parsed.input,
      snapshot: parsed.snapshot,
      checksum: parsed.checksum
    });
    notice.value = '数据快照已导入';
    versionLabel.value = '';
    uploadFile.value = null;
    await load();
  } catch (err) {
    error.value = ruleAdminErrorMessage(err, '导入数据快照失败');
  } finally {
    uploading.value = false;
  }
}

async function generateDiff() {
  const token = session.value?.token;
  if (!token || !baseSnapshotId.value || !targetSnapshotId.value) {
    error.value = '请选择基线版本和目标版本';
    return;
  }

  generating.value = true;
  error.value = '';
  notice.value = '';
  try {
    const report = await generateDataDiff(token, baseSnapshotId.value, targetSnapshotId.value);
    const summary = report.report?.summary;
    notice.value = `差异报告已生成：新增列 ${summary?.addedColumns ?? 0}，新增机型 ${summary?.addedProducts ?? 0}`;
    await load();
  } catch (err) {
    error.value = ruleAdminErrorMessage(err, '生成数据差异失败');
  } finally {
    generating.value = false;
  }
}

async function importRule() {
  const token = session.value?.token;
  if (!token || !ruleVersionName.value.trim() || !ruleDisplayName.value.trim()) return;

  importing.value = true;
  error.value = '';
  notice.value = '';
  try {
    await createRuleVersion(token, {
      version: ruleVersionName.value.trim(),
      displayName: ruleDisplayName.value.trim(),
      description: ruleDescription.value.trim() || '从当前系统规则导入的版本快照',
      rule: currentRule.value as unknown as Record<string, unknown>,
      metadata: {
        source: 'frontend-current-rule',
        importedAt: new Date().toISOString(),
        nodeCount: currentRule.value.nodes.length,
        mappingCount: currentRule.value.mappings.length,
        sourceSnapshotLabel: snapshots.value.find(
          snapshot => snapshot.id === targetSnapshotId.value
        )?.versionLabel ?? null
      },
      sourceSnapshotId: targetSnapshotId.value || null,
      basedOnVersionId: activeVersion.value?.id ?? null
    });
    notice.value = '规则版本已创建并写入索引表';
    ruleVersionName.value = '';
    ruleDisplayName.value = '';
    ruleDescription.value = '';
    await load();
    await initializeRuleRuntime(true);
  } catch (err) {
    error.value = ruleAdminErrorMessage(err, '导入规则版本失败');
  } finally {
    importing.value = false;
  }
}

async function switchVersion(versionId: string, action: 'activate' | 'rollback') {
  const token = session.value?.token;
  if (!token) return;
  switchingVersionId.value = versionId;
  error.value = '';
  notice.value = '';
  try {
    await activateRuleVersion(token, versionId, action, `${actionLabels[action]}规则版本`);
    notice.value = action === 'activate' ? '规则版本已激活' : '已回滚到历史规则版本';
    await load();
    await initializeRuleRuntime(true);
  } catch (err) {
    error.value = ruleAdminErrorMessage(err, '切换规则版本失败');
  } finally {
    switchingVersionId.value = '';
  }
}

async function openDiff(diff: DataDiff) {
  const token = session.value?.token;
  if (!token) return;
  try {
    const report = await getDataDiff(token, diff.id);
    const summary = report.report?.summary;
    notice.value = `${summary?.baseVersionLabel} → ${summary?.targetVersionLabel}：新增列 ${summary?.addedColumns ?? 0} / 移除列 ${summary?.removedColumns ?? 0} / 新增机型 ${summary?.addedProducts ?? 0}`;
  } catch (err) {
    error.value = ruleAdminErrorMessage(err, '读取差异报告失败');
  }
}

onMounted(() => {
  void load();
});
</script>

<template>
  <section :class="'rounded-xl border border-gray-200 bg-white p-6 shadow-sm'">
    <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 :class="['text-xl md:text-2xl', sectionTitleClass]">数据快照与规则版本</h2>
        <p :class="['mt-2 text-sm', mutedTextClass]">
          管理员上传 Rtings CSV，生成差异报告，创建规则版本并支持激活 / 回滚
        </p>
      </div>
      <button :class="secondaryButtonClass" :disabled="loading" @click="load">
        {{ loading ? '刷新中…' : '刷新' }}
      </button>
    </div>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <article class="rounded-xl bg-gray-50 p-4">
        <p class="text-xs text-gray-500">数据快照</p>
        <strong class="mt-1 block text-2xl text-blue-700">{{ snapshots.length }}</strong>
      </article>
      <article class="rounded-xl bg-gray-50 p-4">
        <p class="text-xs text-gray-500">差异报告</p>
        <strong class="mt-1 block text-2xl text-blue-700">{{ diffs.length }}</strong>
      </article>
      <article class="rounded-xl bg-gray-50 p-4">
        <p class="text-xs text-gray-500">规则版本</p>
        <strong class="mt-1 block text-2xl text-blue-700">{{ ruleVersions.length }}</strong>
      </article>
      <article class="rounded-xl bg-gray-50 p-4">
        <p class="text-xs text-gray-500">当前生效</p>
        <strong class="mt-1 block text-lg text-blue-700">
          {{ activeVersion ? `${activeVersion.version} · ${activeVersion.displayName}` : '未设置' }}
        </strong>
      </article>
    </div>

    <p v-if="notice" class="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{{ notice }}</p>
    <p v-if="error" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{{ error }}</p>

    <div class="grid gap-6 xl:grid-cols-2">
      <section class="rounded-xl border border-gray-200 p-5">
        <h3 class="text-lg font-semibold text-gray-900">导入 Rtings 数据快照</h3>
        <div class="mt-4 grid gap-3">
          <input
            type="file"
            accept=".csv,text/csv"
            :class="inputClass"
            aria-label="选择 Rtings CSV 文件"
            @change="selectUploadFile"
          />
          <input
            v-model="versionLabel"
            type="text"
            :class="inputClass"
            placeholder="数据版本标识，如 20261117"
          />
          <button
            :class="primaryButtonClass"
            :disabled="uploading || !uploadFile"
            @click="uploadSnapshot"
          >
            {{ uploading ? '导入中…' : '导入数据快照' }}
          </button>
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 p-5">
        <h3 class="text-lg font-semibold text-gray-900">生成差异报告</h3>
        <div class="mt-4 grid gap-3">
          <UiSelect
            v-model="baseSnapshotId"
            :options="snapshotOptions"
            aria-label="选择基线数据版本"
            searchable
          />
          <UiSelect
            v-model="targetSnapshotId"
            :options="snapshotOptions"
            aria-label="选择目标数据版本"
            searchable
          />
          <button
            :class="primaryButtonClass"
            :disabled="generating || !baseSnapshotId || !targetSnapshotId"
            @click="generateDiff"
          >
            {{ generating ? '对比中…' : '生成差异报告' }}
          </button>
        </div>
        <div v-if="latestSummary" class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div class="rounded-lg bg-blue-50 p-3">
            <p class="text-xs text-blue-700">新增列</p>
            <strong class="text-xl text-blue-700">{{ latestSummary.addedColumns }}</strong>
          </div>
          <div class="rounded-lg bg-amber-50 p-3">
            <p class="text-xs text-amber-700">移除列</p>
            <strong class="text-xl text-amber-700">{{ latestSummary.removedColumns }}</strong>
          </div>
          <div class="rounded-lg bg-emerald-50 p-3">
            <p class="text-xs text-emerald-700">新增机型</p>
            <strong class="text-xl text-emerald-700">{{ latestSummary.addedProducts }}</strong>
          </div>
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 p-5">
        <h3 class="text-lg font-semibold text-gray-900">创建规则版本</h3>
        <div class="mt-4 grid gap-3">
          <input
            v-model="ruleVersionName"
            type="text"
            :class="inputClass"
            placeholder="规则版本号，如 v3.0-foundation"
          />
          <input
            v-model="ruleDisplayName"
            type="text"
            :class="inputClass"
            placeholder="规则显示名称"
          />
          <input
            v-model="ruleDescription"
            type="text"
            :class="inputClass"
            placeholder="版本说明"
          />
          <button
            :class="primaryButtonClass"
            :disabled="importing || !ruleVersionName.trim() || !ruleDisplayName.trim()"
            @click="importRule"
          >
            {{ importing ? '创建中…' : '导入当前规则为版本快照' }}
          </button>
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 p-5">
        <h3 class="text-lg font-semibold text-gray-900">规则版本激活 / 回滚</h3>
        <div class="mt-4 max-h-[420px] overflow-auto rounded-xl border border-gray-200">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="sticky top-0 bg-gray-50">
              <tr>
                <th class="px-3 py-3 text-left font-semibold text-gray-900">版本</th>
                <th class="px-3 py-3 text-left font-semibold text-gray-900">状态</th>
                <th class="px-3 py-3 text-right font-semibold text-gray-900">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="version in ruleVersions" :key="version.id" class="hover:bg-gray-50">
                <td class="px-3 py-3">
                  <p class="font-medium text-gray-900">{{ version.version }}</p>
                  <p class="text-xs text-gray-500">{{ version.displayName }} · {{ version.nodeCount }} 节点</p>
                </td>
                <td class="px-3 py-3">
                  <span
                    :class="[
                      'rounded-full px-2 py-1 text-xs',
                      version.status === 'active'
                        ? 'bg-green-50 text-green-700'
                        : version.status === 'draft'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-gray-100 text-gray-500'
                    ]"
                  >
                    {{ statusLabels[version.status] }}
                  </span>
                </td>
                <td class="px-3 py-3 text-right">
                  <button
                    v-if="version.status !== 'active'"
                    :class="secondaryButtonClass"
                    class="!px-3 !py-1 !text-xs"
                    :disabled="switchingVersionId === version.id"
                    @click="switchVersion(version.id, version.status === 'retired' ? 'rollback' : 'activate')"
                  >
                    {{ switchingVersionId === version.id ? '切换中…' : version.status === 'retired' ? '回滚' : '激活' }}
                  </button>
                  <span v-else class="text-xs text-green-700">生效中</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <div class="mt-6 grid gap-6 xl:grid-cols-2">
      <section class="rounded-xl border border-gray-200 p-5">
        <h3 class="text-lg font-semibold text-gray-900">差异报告记录</h3>
        <div class="mt-4 max-h-[380px] overflow-auto rounded-xl border border-gray-200">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="sticky top-0 bg-gray-50">
              <tr>
                <th class="px-3 py-3 text-left font-semibold text-gray-900">对比</th>
                <th class="px-3 py-3 text-right font-semibold text-gray-900">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="diff in diffs" :key="diff.id" class="hover:bg-gray-50">
                <td class="px-3 py-3">
                  <p class="font-medium text-gray-900">
                    {{ diff.baseVersionLabel }} → {{ diff.targetVersionLabel }}
                  </p>
                  <p class="text-xs text-gray-500">
                    新增列 {{ diff.summary?.addedColumns ?? 0 }} · 移除列 {{ diff.summary?.removedColumns ?? 0 }} · 新增机型 {{ diff.summary?.addedProducts ?? 0 }}
                  </p>
                </td>
                <td class="px-3 py-3 text-right">
                  <button :class="secondaryButtonClass" class="!px-3 !py-1 !text-xs" @click="openDiff(diff)">
                    查看
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 p-5">
        <h3 class="text-lg font-semibold text-gray-900">激活 / 回滚日志</h3>
        <div class="mt-4 max-h-[380px] overflow-auto rounded-xl border border-gray-200">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="sticky top-0 bg-gray-50">
              <tr>
                <th class="px-3 py-3 text-left font-semibold text-gray-900">操作</th>
                <th class="px-3 py-3 text-left font-semibold text-gray-900">时间</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="log in logs" :key="log.id" class="hover:bg-gray-50">
                <td class="px-3 py-3">
                  <p class="font-medium text-gray-900">
                    {{ actionLabels[log.action] }} · {{ log.version }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ log.performedBy?.name ?? log.performedBy?.account ?? '系统' }}
                    <template v-if="log.previousVersion"> · 原版本 {{ log.previousVersion }}</template>
                  </p>
                </td>
                <td class="px-3 py-3 text-xs text-gray-500">
                  {{ log.createdAt ? new Date(log.createdAt).toLocaleString() : '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </section>
</template>
