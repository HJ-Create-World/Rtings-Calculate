<script setup lang="ts">
import { computed } from 'vue';
import ComparisonTable from './components/ComparisonTable.vue';
import GroupCard from './components/GroupCard.vue';
import ProductSelector from './components/ProductSelector.vue';
import TracePanel from './components/TracePanel.vue';
import GroupRadarChart from './components/charts/GroupRadarChart.vue';
import TotalScoreChart from './components/charts/TotalScoreChart.vue';
import { useComparison } from './composables/useComparison';
import { useScoring } from './composables/useScoring';
import { formatExact, formatScore, statusClass, statusLabel, warningLabel } from './utils/format';
import { cardClass, mutedTextClass, sectionTitleClass } from './utils/ui';

const {
  rule,
  baseline,
  result,
  warnings,
  topGroups,
  nodeById,
  selectedNodeId,
  selectedNode,
  selectedEvaluation,
  selectedBaselineRow,
  selectedChildren,
  selectNode,
  labelFor,
  pathFor
} = useScoring();

const {
  allBaselines,
  selectedIds,
  selectedResults,
  topGroups: comparisonGroups,
  totalEntries,
  radarLabels,
  radarSeries,
  toggleProduct
} = useComparison();

const selectedPath = computed(() => pathFor(selectedNodeId.value));
const warningCount = computed(() => warnings.value.length);
const metricCards = computed(() => [
  { label: '规则节点', value: rule.nodes.length },
  { label: '客观映射', value: rule.mappings.length },
  { label: '基准输入', value: Object.keys(baseline.expectedScores).length },
  { label: '计算警告', value: warningCount.value }
]);
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <main class="mx-auto max-w-6xl px-4 py-12 md:px-6 lg:px-8">
      <header class="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 :class="['text-3xl md:text-4xl', sectionTitleClass]">Rtings 评分对比工作台</h1>
          <p :class="['mt-2 text-sm md:text-base', mutedTextClass]">
            规则版本 {{ rule.version }} · 数据来源 {{ baseline.label }}
          </p>
        </div>
        <div :class="['w-full md:w-72', cardClass]" class="p-6">
          <p class="text-sm text-gray-500">Mixed Usage 总分</p>
          <div class="mt-2 flex items-end gap-3">
            <strong class="text-4xl font-semibold tracking-tight text-blue-700">
              {{ formatScore(result.value) }}
            </strong>
            <span :class="['rounded-full px-2 py-1 text-xs', statusClass(result.status)]">
              {{ statusLabel(result.status) }}
            </span>
          </div>
          <p class="mt-2 text-xs text-gray-500">权威基准 {{ formatExact(baseline.expectedTotal) }}</p>
        </div>
      </header>

      <section class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article v-for="metric in metricCards" :key="metric.label" :class="cardClass" class="p-6">
          <p class="text-sm text-gray-500">{{ metric.label }}</p>
          <strong class="mt-2 block text-2xl font-semibold tracking-tight text-gray-900">
            {{ metric.value }}
          </strong>
        </article>
      </section>

      <section v-if="warnings.length" class="mb-8 space-y-3">
        <div
          v-for="warning in warnings"
          :key="warning.code + warning.message"
          class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700"
        >
          <strong class="font-medium">{{ warningLabel(warning.code) }}</strong>
          <span class="ml-2">{{ warning.message }}</span>
        </div>
      </section>

      <section class="mb-12">
        <div class="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 :class="['text-2xl md:text-3xl', sectionTitleClass]">多产品横向对比</h2>
            <p :class="['mt-2 text-sm', mutedTextClass]">选择产品后同步更新图表和明细表</p>
          </div>
        </div>

        <ProductSelector
          class="mb-6"
          :products="allBaselines"
          :selected-ids="selectedIds"
          @toggle="toggleProduct"
        />

        <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article :class="cardClass" class="p-6">
            <h3 class="mb-4 text-xl font-semibold tracking-tight text-gray-900">总分对比</h3>
            <TotalScoreChart :entries="totalEntries" />
          </article>
          <article :class="cardClass" class="p-6">
            <h3 class="mb-4 text-xl font-semibold tracking-tight text-gray-900">顶层能力分布</h3>
            <GroupRadarChart :labels="radarLabels" :series="radarSeries" />
          </article>
        </div>

        <ComparisonTable :groups="comparisonGroups" :results="selectedResults" />
      </section>

      <section class="mb-12">
        <div class="mb-4">
          <h2 :class="['text-2xl md:text-3xl', sectionTitleClass]">单机评分与追溯</h2>
          <p :class="['mt-2 text-sm', mutedTextClass]">点击任意子项查看输入、权重、区间和贡献</p>
        </div>

        <div class="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <GroupCard
            v-for="group in topGroups"
            :key="group.nodeId"
            :node="nodeById.get(group.nodeId)!"
            :evaluation="group"
            :label-for="labelFor"
            :select-node="selectNode"
          />
        </div>

        <nav class="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <button
            v-for="(node, index) in selectedPath"
            :key="node.id"
            type="button"
            class="rounded-lg px-2 py-1 font-medium text-blue-700 transition-all duration-200 ease-out hover:bg-blue-50 active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="selectNode(node.id)"
          >
            {{ node.label }}
            <span v-if="index < selectedPath.length - 1" class="ml-1 text-gray-400">/</span>
          </button>
        </nav>

        <TracePanel
          v-if="selectedNode && selectedEvaluation"
          :node="selectedNode"
          :evaluation="selectedEvaluation"
          :baseline-row="selectedBaselineRow"
          :children="selectedChildren"
          :label-for="labelFor"
          :select-node="selectNode"
        />
      </section>

      <footer class="border-t border-gray-200 pt-6 text-center text-xs text-gray-500">
        当前视图基于工作簿基准只读展示；可录入表单与规则管理将在后续版本接入。
      </footer>
    </main>
  </div>
</template>
