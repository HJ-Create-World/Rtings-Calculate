<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppLogo from './components/AppLogo.vue';

const route = useRoute();

const navItems = [
  { to: '/', label: '首页对比', title: '多机型横向对比', description: '用真实数据快速比较总分、顶层能力与测试项差异' },
  { to: '/overview', label: '产品介绍', title: '产品与规则介绍', description: '了解软件定位、评分逻辑专业性与数据来源' },
  { to: '/history', label: '历史追溯', title: '历史机型追溯', description: '选择已入库机型，查看评分轮廓与关键维度' },
  { to: '/drilldown', label: '测试项对比', title: '测试项对比', description: '选择分组、测试项和产品，进行节点级差异分析' },
  { to: '/entry', label: '评分录入', title: '评分录入', description: '填写产品档案、客观测试值和主观评分' },
  { to: '/import', label: 'Excel 导入', title: 'Excel 导入', description: '下载模板、导入测试值并检查校验结果' },
  { to: '/cloud', label: '云端历史', title: '云端历史', description: '查看云端评测输入，载入修改并导出完整报告' }
];

const currentPath = computed(() => route.path);
const pageMeta = computed(() => navItems.find(item => item.to === currentPath.value) ?? navItems[0]);

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
              Rtings Calculate
            </p>
          </div>
        </div>

        <div class="mt-5">
          <h2 class="text-xl font-semibold tracking-tight text-gray-900 md:text-2xl">
            {{ pageMeta.title }}
          </h2>
          <p class="mt-1 max-w-3xl text-sm text-gray-500 md:text-base">
            {{ pageMeta.description }}
          </p>
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
