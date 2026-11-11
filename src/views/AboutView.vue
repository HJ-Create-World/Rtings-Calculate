<script setup lang="ts">
import { computed } from 'vue';
import packageJson from '../../package.json';
import { rtingsBaselinesV3, rtingsRule } from '../data/rtingsRule';
import {
  capabilityCards,
  advantageRows,
  difficultyCards,
  timeline,
  milestoneRows,
  roadmapCards,
  team,
  sourceRows,
  accuracyRows
} from '../data/systemIntro';
import { cardClass, mutedTextClass, primaryButtonClass, sectionTitleClass } from '../utils/ui';

const leafCount = computed(
  () => rtingsRule.nodes.filter(node => node.inputType !== 'aggregate').length
);

const metrics = computed(() => [
  { label: 'Rtings 基准机型', value: rtingsBaselinesV3.items.length, note: 'CSV 官方实测与得分' },
  { label: '测试数据列', value: 344, note: '172 个测试项 × 原始值/得分' },
  { label: '评分节点', value: rtingsRule.nodes.length, note: '主维度、子维度与叶子节点' },
  { label: '评分映射', value: rtingsRule.mappings.length, note: '锚点、区间、类别与恒等映射' },
  { label: '可录入测试项', value: leafCount.value, note: '客观值 / 类别值 / 工程师评分' },
  { label: '自动化测试', value: 14, note: '核心映射、规则聚合与 CSV 回归' }
]);

const engineering = [
  { label: '应用版本', value: `v${packageJson.version}` },
  { label: '规则版本', value: `v${rtingsRule.version}` },
  { label: 'Git 提交', value: '20+ 次' },
  { label: '开发周期', value: '2026-11-04 至 2026-11-11' },
  { label: '前端与核心源码', value: '45+ 个 Vue/TS 文件 · 4,900+ 行' },
  { label: '规则与基准数据', value: '4 个 JSON 文件 · 95,000+ 行' },
  { label: '测试代码', value: '3 个测试文件 · 270+ 行' },
  { label: '文档资产', value: '需求、规则拆解、架构、部署、项目日志' }
];
</script>

<template>
  <section :class="cardClass" class="mb-8 overflow-hidden p-6 md:p-8">
    <div class="grid gap-8 lg:grid-cols-5">
      <div class="lg:col-span-3">
        <p class="text-sm font-semibold text-blue-600">BOE Rtings 评测系统</p>
        <h2 :class="['mt-3 text-3xl md:text-4xl', sectionTitleClass]">
          把不可复算的评分经验，变成可审计的工程系统
        </h2>
        <p :class="['mt-4 text-sm md:text-base', mutedTextClass]">
          Rtings 官方不公开评分公式。工程师通过拆解实测数据、整理权重树与 7/8
          分门槛，再把 CSV 反推锚点融合进规则引擎，让每次评分都能回答“分数从哪里来”。
        </p>
        <div class="mt-6 flex flex-wrap gap-3">
          <span class="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">规则可追溯</span>
          <span class="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">数据可复算</span>
          <span class="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">评测可沉淀</span>
          <span class="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">报告可导出</span>
        </div>
      </div>
      <div class="rounded-xl bg-blue-50 p-6 lg:col-span-2">
        <p class="text-lg font-semibold text-blue-700">一句话价值</p>
        <p class="mt-3 text-sm text-blue-700">
          把 Excel 评分表升级为带证据等级、计算追踪、历史数据和报告导出的评分工作台。
        </p>
        <div class="mt-5 grid grid-cols-2 gap-3">
          <div class="rounded-lg bg-white p-3 text-center">
            <strong class="block text-2xl text-blue-700">{{ rtingsBaselinesV3.items.length }}</strong>
            <p class="text-xs text-gray-500">基准机型</p>
          </div>
          <div class="rounded-lg bg-white p-3 text-center">
            <strong class="block text-2xl text-blue-700">{{ leafCount }}</strong>
            <p class="text-xs text-gray-500">测试项</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="mb-10">
    <h3 :class="['text-2xl md:text-3xl', sectionTitleClass]">系统能力</h3>
    <div class="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <article v-for="item in capabilityCards" :key="item.title" :class="cardClass" class="p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
        <h4 class="text-lg font-semibold tracking-tight text-gray-900">{{ item.title }}</h4>
        <p :class="['mt-2 text-sm', mutedTextClass]">{{ item.description }}</p>
        <ul class="mt-4 space-y-2 text-sm text-gray-700">
          <li v-for="point in item.points" :key="point" class="flex items-start gap-2">
            <span class="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            <span>{{ point }}</span>
          </li>
        </ul>
      </article>
    </div>
  </section>

  <section class="mb-10 grid gap-6 lg:grid-cols-2">
    <article :class="cardClass" class="p-6">
      <h3 class="text-xl font-semibold tracking-tight text-gray-900">数据源与口径</h3>
      <div class="mt-4 space-y-3">
        <div v-for="row in sourceRows" :key="row.label" class="rounded-lg bg-gray-50 p-4">
          <p class="text-sm font-semibold text-gray-900">{{ row.label }}</p>
          <p :class="['mt-1 text-sm', mutedTextClass]">{{ row.value }}</p>
        </div>
      </div>
    </article>
    <article :class="cardClass" class="p-6">
      <h3 class="text-xl font-semibold tracking-tight text-gray-900">精确性验证</h3>
      <div class="mt-4 space-y-3">
        <div v-for="row in accuracyRows" :key="row.label" class="rounded-lg bg-gray-50 p-4">
          <p class="text-sm font-semibold text-gray-900">{{ row.label }}</p>
          <p :class="['mt-1 text-sm', mutedTextClass]">{{ row.value }}</p>
        </div>
      </div>
    </article>
  </section>

  <section class="mb-10">
    <h3 :class="['text-2xl md:text-3xl', sectionTitleClass]">关键指标</h3>
    <div class="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
      <article v-for="metric in metrics" :key="metric.label" :class="cardClass" class="p-5">
        <strong class="block text-3xl font-semibold text-blue-700">{{ metric.value }}</strong>
        <p class="mt-2 text-sm font-medium text-gray-900">{{ metric.label }}</p>
        <p :class="['mt-1 text-xs', mutedTextClass]">{{ metric.note }}</p>
      </article>
    </div>
  </section>

  <section class="mb-10">
    <h3 :class="['text-2xl md:text-3xl', sectionTitleClass]">没有系统 vs 有了系统</h3>
    <div class="mt-5 overflow-hidden rounded-xl border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">原来的问题</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">系统带来的突破</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="row in advantageRows" :key="row.before" class="transition-colors duration-200 hover:bg-gray-50">
            <td class="px-4 py-4 text-gray-600">{{ row.before }}</td>
            <td class="px-4 py-4 font-medium text-gray-900">{{ row.after }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="mb-10 grid gap-6 lg:grid-cols-2">
    <article :class="cardClass" class="p-6">
      <h3 class="text-xl font-semibold tracking-tight text-gray-900">从 0 到 1 的实现路径</h3>
      <ol class="mt-5 space-y-5">
        <li v-for="item in timeline" :key="item.date" class="relative border-l border-blue-200 pl-5">
          <span class="absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-600"></span>
          <p class="text-xs font-medium text-blue-700">{{ item.date }}</p>
          <p class="mt-1 font-semibold text-gray-900">{{ item.title }}</p>
          <p :class="['mt-1 text-sm', mutedTextClass]">{{ item.description }}</p>
        </li>
      </ol>
    </article>
    <article :class="cardClass" class="p-6">
      <h3 class="text-xl font-semibold tracking-tight text-gray-900">核心难点与突破</h3>
      <div class="mt-5 grid gap-4 md:grid-cols-2">
        <div v-for="item in difficultyCards" :key="item.title" class="rounded-lg bg-gray-50 p-4">
          <p class="font-semibold text-gray-900">{{ item.title }}</p>
          <p :class="['mt-2 text-sm', mutedTextClass]">{{ item.description }}</p>
          <p class="mt-2 text-xs text-blue-700">{{ item.points?.join(' · ') }}</p>
        </div>
      </div>
    </article>
  </section>

  <section class="mb-10">
    <h3 :class="['text-2xl md:text-3xl', sectionTitleClass]">工程量与版本</h3>
    <div class="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <article v-for="item in engineering" :key="item.label" :class="cardClass" class="p-5">
        <p class="text-xs text-gray-500">{{ item.label }}</p>
        <strong class="mt-2 block text-sm font-semibold text-gray-900">{{ item.value }}</strong>
      </article>
    </div>
    <div class="mt-5 overflow-hidden rounded-xl border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">版本</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">时间</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">关键内容</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="row in milestoneRows" :key="row.version" class="transition-colors duration-200 hover:bg-gray-50">
            <td class="px-4 py-3 font-semibold text-gray-900">{{ row.version }}</td>
            <td class="px-4 py-3 text-gray-700">{{ row.date }}</td>
            <td class="px-4 py-3 text-gray-700">{{ row.summary }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section :class="cardClass" class="mb-10 p-6">
    <div class="grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <h3 class="text-xl font-semibold tracking-tight text-gray-900">系统展示视频</h3>
        <p :class="['mt-2 text-sm', mutedTextClass]">
          视频位已预留，后续上传系统演示后可替换当前占位区域。
        </p>
        <div class="mt-5 flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/60 text-center">
          <div>
            <p class="text-lg font-semibold text-blue-700">系统演示视频位</p>
            <p :class="['mt-2 text-sm', mutedTextClass]">建议内容：30~60 秒覆盖录入、追踪、对比与导出</p>
            <button :class="primaryButtonClass" class="mt-4" disabled>视频待上传</button>
          </div>
        </div>
      </div>
      <div class="rounded-xl bg-gray-50 p-5">
        <p class="text-sm font-semibold text-gray-900">开发团队</p>
        <div class="mt-4 space-y-3 text-sm">
          <div v-for="member in team" :key="member.role">
            <p class="text-xs text-gray-500">{{ member.role }}</p>
            <p class="font-medium text-gray-900">{{ member.name }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="mb-4">
    <h3 :class="['text-2xl md:text-3xl', sectionTitleClass]">后续迭代计划</h3>
    <div class="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <article v-for="item in roadmapCards" :key="item.title" :class="cardClass" class="p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
        <h4 class="text-lg font-semibold tracking-tight text-gray-900">{{ item.title }}</h4>
        <p :class="['mt-2 text-sm', mutedTextClass]">{{ item.description }}</p>
        <p class="mt-3 text-xs font-medium text-blue-700">{{ item.points?.join(' · ') }}</p>
      </article>
    </div>
  </section>
</template>
