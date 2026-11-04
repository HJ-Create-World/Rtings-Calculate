<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const navItems = [
  { to: '/', label: '总览', title: '评分总览', description: '查看权威基准总分、规则健康度和关键警告' },
  { to: '/comparison', label: '横向对比', title: '横向对比', description: '多产品总分、顶层能力与明细对比' },
  { to: '/drilldown', label: '自定义下钻', title: '自定义下钻', description: '选择分组、测试项和产品进行测试项级对比' },
  { to: '/trace', label: '单机追溯', title: '单机追溯', description: '查看输入、权重、区间命中和逐层贡献' },
  { to: '/entry', label: '评分录入', title: '评分录入', description: '填写产品档案、客观测试值和主观评分' },
  { to: '/import', label: 'Excel 导入', title: 'Excel 导入', description: '下载模板、导入测试值并检查校验结果' }
];

const currentPath = computed(() => route.path);
const pageMeta = computed(() => navItems.find(item => item.to === currentPath.value) ?? navItems[0]);

function linkClass(path: string) {
  const active = currentPath.value === path;
  return [
    'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ease-out',
    'active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    active
      ? 'bg-white text-gray-900 shadow-sm'
      : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
  ];
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="border-b border-gray-200 bg-white">
      <div class="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <p class="text-sm font-medium text-blue-700">Rtings Calculate</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
          {{ pageMeta.title }}
        </h1>
        <p class="mt-2 max-w-3xl text-sm text-gray-500 md:text-base">
          {{ pageMeta.description }}
        </p>

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
