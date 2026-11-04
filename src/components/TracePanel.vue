<script setup lang="ts">
import type { NodeEvaluation, ScoreNode } from '../core/types';
import type { ProductBaseline } from '../data/rtingsRule';
import {
  formatContribution,
  formatExact,
  formatScore,
  formatWeight,
  statusClass,
  statusLabel,
  warningLabel
} from '../utils/format';
import { cardClass, mutedTextClass } from '../utils/ui';

defineProps<{
  node: ScoreNode;
  evaluation: NodeEvaluation;
  baselineRow?: ProductBaseline['rows'][number];
  children: NodeEvaluation[];
  labelFor: (nodeId: string) => string;
  selectNode: (nodeId: string) => void;
}>();
</script>

<template>
  <section :class="cardClass" class="grid gap-6 p-6">
    <header class="flex items-start justify-between gap-4">
      <div>
        <h3 class="text-xl font-semibold tracking-tight text-gray-900">{{ node.label }}</h3>
        <p :class="['mt-1 font-mono text-xs', mutedTextClass]">{{ node.id }}</p>
      </div>
      <span :class="['inline-flex rounded-full px-2 py-1 text-xs', statusClass(evaluation.status)]">
        {{ statusLabel(evaluation.status) }}
      </span>
    </header>

    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <article class="rounded-lg bg-gray-50 p-4">
        <p class="text-xs text-gray-500">分数</p>
        <strong class="mt-1 block text-lg text-gray-900">{{ formatScore(evaluation.value) }}</strong>
      </article>
      <article class="rounded-lg bg-gray-50 p-4">
        <p class="text-xs text-gray-500">父项权重</p>
        <strong class="mt-1 block text-lg text-gray-900">{{ formatWeight(node.weight) }}</strong>
      </article>
      <article class="rounded-lg bg-gray-50 p-4">
        <p class="text-xs text-gray-500">贡献值</p>
        <strong class="mt-1 block text-lg text-gray-900">{{ formatContribution(evaluation.contributionToParent) }}</strong>
      </article>
      <article class="rounded-lg bg-gray-50 p-4">
        <p class="text-xs text-gray-500">部分分</p>
        <strong class="mt-1 block text-lg text-gray-900">{{ formatExact(evaluation.partialValue) }}</strong>
      </article>
    </div>

    <dl class="grid gap-3 text-sm text-gray-700">
      <div class="rounded-lg bg-gray-50 p-4">
        <dt class="text-xs text-gray-500">层级 / 输入</dt>
        <dd class="mt-1">{{ node.kind }} · {{ node.inputType }} · {{ node.includeInParent ? '计入父项' : '不计入父项' }}</dd>
      </div>
      <div class="rounded-lg bg-gray-50 p-4">
        <dt class="text-xs text-gray-500">基准期望分</dt>
        <dd class="mt-1">{{ baselineRow?.expectedScore ?? '—' }}</dd>
      </div>
      <div class="rounded-lg bg-gray-50 p-4">
        <dt class="text-xs text-gray-500">原始值</dt>
        <dd class="mt-1">{{ baselineRow?.rawText || '—' }}</dd>
      </div>
    </dl>

    <div v-if="evaluation.mappingTrace" class="rounded-lg bg-blue-50 p-4">
      <h4 class="text-sm font-medium text-blue-700">区间映射</h4>
      <p class="mt-2 text-sm text-blue-700">映射表：{{ evaluation.mappingTrace.mappingId }}</p>
      <p class="mt-1 text-sm text-blue-700">输入值：{{ evaluation.mappingTrace.value ?? '—' }}</p>
      <p v-if="evaluation.mappingTrace.matchedInterval" class="mt-1 text-sm text-blue-700">
        命中分数：{{ (evaluation.mappingTrace.matchedInterval.scoreTenths / 10).toFixed(1) }}
        （{{ evaluation.mappingTrace.matchedInterval.rawText }}）
      </p>
    </div>

    <div v-if="evaluation.warnings.length" class="rounded-lg bg-amber-50 p-4">
      <h4 class="text-sm font-medium text-amber-700">警告</h4>
      <ul class="mt-2 space-y-1 text-sm text-amber-700">
        <li v-for="warning in evaluation.warnings" :key="warning.message">
          <strong class="font-medium">{{ warningLabel(warning.code) }}</strong>
          <span class="ml-1">{{ warning.message }}</span>
        </li>
      </ul>
    </div>

    <div v-if="children.length">
      <h4 class="mb-3 text-sm font-medium text-gray-900">子项</h4>
      <div class="grid gap-2">
        <button
          v-for="child in children"
          :key="child.nodeId"
          type="button"
          class="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-700 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          @click="selectNode(child.nodeId)"
        >
          <span class="truncate">{{ labelFor(child.nodeId) }}</span>
          <span class="font-medium">{{ formatScore(child.value) }}</span>
        </button>
      </div>
    </div>
  </section>
</template>
