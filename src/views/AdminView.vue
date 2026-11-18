<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import UiSelect from '../components/UiSelect.vue';
import RuleAdminPanel from '../components/admin/RuleAdminPanel.vue';
import RuleReviewPanel from '../components/admin/RuleReviewPanel.vue';
import { useAuth } from '../composables/useAuth';
import {
  fetchAppSystemStats,
  listAppUsers,
  updateAppUser,
  authErrorMessage,
  type AppPermissions,
  type AppRole,
  type AppStatus,
  type AppSystemStats,
  type AppUser
} from '../services/auth';
import { cardClass, inputClass, mutedTextClass, primaryButtonClass, secondaryButtonClass, sectionTitleClass } from '../utils/ui';

const { session, currentUser, isAdmin, refreshUser, submitting } = useAuth();

const users = ref<AppUser[]>([]);
const stats = ref<AppSystemStats | null>(null);
const loading = ref(false);
const error = ref('');
const notice = ref('');
const search = ref('');
const editingId = ref<string | null>(null);
const editing = ref<{
  role: AppRole;
  status: AppStatus;
  permissions: AppPermissions;
  employeeNo: string;
  name: string;
} | null>(null);

const adminTab = ref<'users' | 'rules' | 'reviews'>('users');
const adminTabs = [
  { value: 'users' as const, label: '用户与权限' },
  { value: 'rules' as const, label: '数据与规则版本' },
  { value: 'reviews' as const, label: '差异审阅 / AI 建议' }
];

const filteredUsers = computed(() => {
  const text = search.value.trim().toLowerCase();
  if (!text) return users.value;
  return users.value.filter(user =>
    `${user.account} ${user.employeeNo} ${user.name}`.toLowerCase().includes(text)
  );
});

const roleOptions = [
  { value: 'admin', label: '系统管理员' },
  { value: 'engineer', label: '内部工程师' },
  { value: 'user', label: '普通用户' }
];

const statusOptions = [
  { value: 'active', label: '启用' },
  { value: 'banned', label: '封禁' }
];

async function load() {
  if (!session.value?.token) return;
  loading.value = true;
  error.value = '';
  try {
    const [userList, systemStats] = await Promise.all([
      listAppUsers(session.value.token),
      fetchAppSystemStats(session.value.token)
    ]);
    users.value = userList;
    stats.value = systemStats;
  } catch (err) {
    error.value = authErrorMessage(err, '加载系统管理数据失败');
  } finally {
    loading.value = false;
  }
}

function startEdit(user: AppUser) {
  editingId.value = user.id;
  editing.value = {
    role: user.role,
    status: user.status,
    permissions: { ...user.permissions },
    employeeNo: user.employeeNo,
    name: user.name
  };
  notice.value = '';
  error.value = '';
}

function cancelEdit() {
  editingId.value = null;
  editing.value = null;
}

async function saveEdit(userId: string) {
  if (!session.value?.token || !editing.value) return;
  error.value = '';
  notice.value = '';
  try {
    const updated = await updateAppUser(session.value.token, userId, editing.value);
    const index = users.value.findIndex(item => item.id === userId);
    if (index >= 0) users.value[index] = updated;
    if (currentUser.value?.id === userId) refreshUser(updated);
    notice.value = '用户权限已更新';
    cancelEdit();
    await load();
  } catch (err) {
    error.value = authErrorMessage(err, '保存失败');
  }
}

onMounted(() => {
  if (isAdmin.value) void load();
});
</script>

<template>
  <section v-if="!isAdmin" :class="cardClass" class="p-6">
    <h1 :class="['text-2xl', sectionTitleClass]">无访问权限</h1>
    <p :class="['mt-2 text-sm', mutedTextClass]">该页面仅系统管理员可见。</p>
  </section>

  <template v-else>
    <section :class="cardClass" class="mb-6 p-6">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 :class="['text-2xl md:text-3xl', sectionTitleClass]">系统管理</h1>
          <p :class="['mt-2 text-sm', mutedTextClass]">管理用户权限、数据快照、规则版本与系统运行状态</p>
        </div>
        <button :class="secondaryButtonClass" :disabled="loading" @click="load">
          {{ loading ? '刷新中…' : '刷新数据' }}
        </button>
      </div>

      <div class="mt-5 inline-flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
        <button
          v-for="tab in adminTabs"
          :key="tab.value"
          type="button"
          :class="[
            'rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
            adminTab === tab.value
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:bg-white/70'
          ]"
          @click="adminTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <article class="rounded-xl bg-gray-50 p-4">
          <p class="text-xs text-gray-500">用户总数</p>
          <strong class="mt-1 block text-2xl text-blue-700">{{ stats?.totalUsers ?? '—' }}</strong>
        </article>
        <article class="rounded-xl bg-gray-50 p-4">
          <p class="text-xs text-gray-500">启用用户</p>
          <strong class="mt-1 block text-2xl text-blue-700">{{ stats?.activeUsers ?? '—' }}</strong>
        </article>
        <article class="rounded-xl bg-gray-50 p-4">
          <p class="text-xs text-gray-500">封禁用户</p>
          <strong class="mt-1 block text-2xl text-red-600">{{ stats?.bannedUsers ?? '—' }}</strong>
        </article>
        <article class="rounded-xl bg-gray-50 p-4">
          <p class="text-xs text-gray-500">活跃会话</p>
          <strong class="mt-1 block text-2xl text-blue-700">{{ stats?.activeSessions ?? '—' }}</strong>
        </article>
        <article class="rounded-xl bg-gray-50 p-4">
          <p class="text-xs text-gray-500">评测总数</p>
          <strong class="mt-1 block text-2xl text-blue-700">{{ stats?.totalEvaluations ?? '—' }}</strong>
        </article>
        <article class="rounded-xl bg-gray-50 p-4">
          <p class="text-xs text-gray-500">24h 更新</p>
          <strong class="mt-1 block text-2xl text-blue-700">{{ stats?.recentEvaluations ?? '—' }}</strong>
        </article>
      </div>
    </section>

    <section v-if="adminTab === 'users'" :class="cardClass" class="p-6">
      <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 class="text-xl font-semibold tracking-tight text-gray-900">用户与权限</h2>
        <input
          v-model="search"
          type="search"
          placeholder="搜索账号 / 工号 / 姓名"
          :class="inputClass"
        />
      </div>

      <p v-if="notice" class="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{{ notice }}</p>
      <p v-if="error" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{{ error }}</p>

      <div class="overflow-x-auto rounded-xl border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-900">账号</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-900">角色</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-900">状态</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-900">模块权限</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-900">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <p class="font-medium text-gray-900">{{ user.name }}</p>
                <p class="text-xs text-gray-500">{{ user.account }} · {{ user.employeeNo }}</p>
              </td>
              <td v-if="editingId !== user.id" class="px-4 py-3 text-gray-700">
                {{ roleOptions.find(item => item.value === user.role)?.label }}
              </td>
              <td v-else class="px-4 py-3">
                <UiSelect v-model="editing!.role" :options="roleOptions" aria-label="用户角色" />
              </td>
              <td v-if="editingId !== user.id" class="px-4 py-3">
                <span
                  :class="[
                    'rounded-full px-2 py-1 text-xs',
                    user.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                  ]"
                >
                  {{ statusOptions.find(item => item.value === user.status)?.label }}
                </span>
              </td>
              <td v-else class="px-4 py-3">
                <UiSelect v-model="editing!.status" :options="statusOptions" aria-label="用户状态" />
              </td>
              <td v-if="editingId !== user.id" class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="permission in ['data_view','score_entry','test_method'] as const"
                    :key="permission"
                    :class="[
                      'rounded-full px-2 py-1 text-xs',
                      user.permissions[permission] ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400'
                    ]"
                  >
                    {{ permission === 'data_view' ? '数据查看' : permission === 'score_entry' ? '评分录入' : '测试方法' }}
                  </span>
                </div>
              </td>
              <td v-else class="px-4 py-3">
                <div class="grid gap-2">
                  <label class="flex items-center gap-2 text-xs text-gray-700">
                    <input v-model="editing!.permissions.data_view" type="checkbox" class="h-4 w-4" />
                    数据查看
                  </label>
                  <label class="flex items-center gap-2 text-xs text-gray-700">
                    <input v-model="editing!.permissions.score_entry" type="checkbox" class="h-4 w-4" />
                    评分录入
                  </label>
                  <label class="flex items-center gap-2 text-xs text-gray-700">
                    <input v-model="editing!.permissions.test_method" type="checkbox" class="h-4 w-4" />
                    测试方法
                  </label>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <template v-if="editingId === user.id">
                  <button :class="primaryButtonClass" class="!px-3 !py-1 !text-xs" :disabled="submitting" @click="saveEdit(user.id)">
                    保存
                  </button>
                  <button :class="secondaryButtonClass" class="ml-2 !px-3 !py-1 !text-xs" @click="cancelEdit">
                    取消
                  </button>
                </template>
                <button v-else :class="secondaryButtonClass" class="!px-3 !py-1 !text-xs" @click="startEdit(user)">
                  编辑
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <RuleAdminPanel v-if="adminTab === 'rules'" class="mb-6" />
    <RuleReviewPanel v-if="adminTab === 'reviews'" class="mb-6" />
  </template>
</template>
