<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppLogo from './components/AppLogo.vue';

const route = useRoute();

const navItems = [
  { to: '/', label: 'Rtings评分' },
  { to: '/history', label: '详细参数' },
  { to: '/drilldown', label: '维度对比' },
  { to: '/entry', label: '评分录入' },
  { to: '/cloud', label: '云端数据' },
  { to: '/overview', label: '系统介绍' }
];

const currentPath = computed(() => route.path);

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
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="border-b border-gray-200 bg-white">
      <div class="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div class="flex items-center gap-4">
          <AppLogo class="h-14 w-14 shrink-0" />
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              TV Scoring Workbench
            </p>
            <p class="mt-1 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
              BOE Rtings 评测系统
            </p>
          </div>
        </div>

        <nav class="mt-6 inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1" aria-label="功能页面">
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
