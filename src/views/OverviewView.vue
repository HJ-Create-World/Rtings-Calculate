<script setup lang="ts">
import { computed } from 'vue';
import GroupCard from '../components/GroupCard.vue';
import { useScoring } from '../composables/useScoring';
import { formatExact, formatScore, statusClass, statusLabel, warningLabel } from '../utils/format';
import { cardClass, mutedTextClass, sectionTitleClass } from '../utils/ui';

const {
  rule,
  baseline,
  result,
  warnings,
  topGroups,
  nodeById
} = useScoring();

const warningCount = computed(() => warnings.value.length);
const metricCards = computed(() => [
  { label: '规则节点', value: rule.nodes.length },
  { label: '客观映射', value: rule.mappings.length },
  { label: '基准输入', value: Object.keys(baseline.expectedScores).length },
  { label: '计算警告', value: warningCount.value }
]);
</script>

<template>
  <section class="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
    <div>
      <h1 :class="['text-3xl md:text-4xl', sectionTitleClass]">评分总览</h1>
      <p :class="['mt-2 text-sm md:text-base', mutedTextClass]">
        规则版本 {{ rule.version }} · 数据来源 {{ baseline.label }}
      </p>
    </div>
    <div :class="['w-full md:w-80', cardClass]" class="p-6">
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
  </section>

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

  <section>
    <div class="mb-4">
      <h2 :class="['text-2xl md:text-3xl', sectionTitleClass]">核心能力摘要</h2>
      <p :class="['mt-2 text-sm', mutedTextClass]">点击子项可前往单机追溯查看完整计算过程</p>
    </div>
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <GroupCard
        v-for="group in topGroups"
        :key="group.nodeId"
        :node="nodeById.get(group.nodeId)!"
        :evaluation="group"
        :label-for="(id: string) => nodeById.get(id)?.label ?? id"
      />
    </div>
  </section>
</template>
