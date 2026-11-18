<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLogo from './components/AppLogo.vue';
import { useAuth } from './composables/useAuth';

const route = useRoute();
const router = useRouter();
const { currentUser, isLoggedIn, isAdmin, canViewTestMethod, logout, submitting } = useAuth();

const navItems = computed(() => {
  const items = [
    { to: '/', label: 'Rtings评分' },
    { to: '/history', label: '详细参数' },
    { to: '/drilldown', label: '维度对比' },
    { to: '/entry', label: '评分录入' },
    { to: '/cloud', label: '云端数据' }
  ];
  if (canViewTestMethod.value) {
    items.push({ to: '/methods', label: '测试方法' });
  }
  items.push({ to: '/overview', label: '系统介绍' });
  if (isAdmin.value) {
    items.push({ to: '/admin', label: '系统管理' });
  }
  return items;
});

const currentPath = computed(() => route.path);
const roleLabel = computed(() =>
  currentUser.value?.role === 'admin'
    ? '系统管理员'
    : currentUser.value?.role === 'engineer'
      ? '内部工程师'
      : '普通用户'
);
const roleBadgeClass = computed(() =>
  currentUser.value?.role === 'admin'
    ? 'bg-blue-50 text-blue-700'
    : currentUser.value?.role === 'engineer'
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-gray-100 text-gray-600'
);
const userInitials = computed(() => {
  const name = currentUser.value?.name?.trim() ?? '';
  return name ? name.slice(-2) : '用户';
});

function linkClass(path: string) {
  const active = currentPath.value === path;
  return [
    'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ease-out',
    'active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    active
      ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
      : 'bg-white text-gray-700 border border-gray-300 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow'
  ];
}

async function handleLogout() {
  await logout();
  await router.replace('/login');
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="border-b border-gray-200 bg-white">
      <div class="mx-auto max-w-7xl px-4 py-5 md:px-6 lg:px-8">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center gap-4">
            <AppLogo class="h-11 w-11 shrink-0" />
            <div>
              <h1 class="text-xl font-semibold tracking-tight text-gray-900 md:text-2xl">
                BOE Rtings 评测系统
              </h1>
              <p class="mt-1 hidden text-xs text-gray-500 sm:block">
                统一评分工作台 · 规则可追溯 · 权限分级
              </p>
            </div>
          </div>

          <div
            v-if="isLoggedIn"
            class="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
          >
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {{ userInitials }}
            </span>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <p class="truncate text-sm font-semibold text-gray-900">{{ currentUser?.name }}</p>
                <span :class="['rounded-full px-2 py-0.5 text-[11px] font-medium', roleBadgeClass]">
                  {{ roleLabel }}
                </span>
              </div>
              <p class="mt-0.5 truncate text-xs text-gray-500">工号 {{ currentUser?.employeeNo }}</p>
            </div>
            <button
              type="button"
              class="ml-2 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="submitting"
              @click="handleLogout"
            >
              退出登录
            </button>
          </div>
        </div>

        <nav
          v-if="isLoggedIn"
          class="mt-5 inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1"
          aria-label="功能页面"
        >
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :class="linkClass(item.to)"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
      <RouterView />
    </main>

    <footer class="border-t border-gray-200 bg-white py-6">
      <p class="mx-auto max-w-7xl px-4 text-center text-xs text-gray-500 md:px-6 lg:px-8">
        本地优先 · 规则可追溯 · 支持离线评分与导出
      </p>
    </footer>
  </div>
</template>
