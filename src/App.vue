<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const navItems = [
  { to: '/', label: '评分总览' },
  { to: '/comparison', label: '横向对比' },
  { to: '/drilldown', label: '自定义下钻' },
  { to: '/trace', label: '单机追溯' }
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
    <header class="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
        <RouterLink
          to="/"
          class="text-xl font-semibold tracking-tight text-gray-900 transition-all duration-200 ease-out hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Rtings Calculate
        </RouterLink>
        <nav class="flex gap-3 overflow-x-auto pb-1 md:pb-0" aria-label="功能页面">
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
