<script setup lang="ts">
import type { NodeEvaluation, ScoreNode } from '../core/types';
import { formatScore, formatWeight, statusClass, statusLabel } from '../utils/format';
import { cardClass, mutedTextClass } from '../utils/ui';

defineProps<{
  node: ScoreNode;
  evaluation: NodeEvaluation;
  labelFor: (nodeId: string) => string;
  selectNode: (nodeId: string) => void;
}>();
</script>

<template>
  <section :class="cardClass" class="flex flex-col gap-4 p-6">
    <header class="flex items-start justify-between gap-4">
      <div>
        <h3 class="text-xl font-semibold tracking-tight text-gray-900">{{ node.label }}</h3>
        <p :class="['mt-1 text-sm', mutedTextClass]">权重 {{ formatWeight(node.weight) }}</p>
      </div>
      <div class="text-right">
        <strong class="block text-2xl font-semibold tracking-tight text-blue-700">
          {{ formatScore(evaluation.value) }}
        </strong>
        <span :class="['mt-1 inline-flex rounded-full px-2 py-1 text-xs', statusClass(evaluation.status)]">
          {{ statusLabel(evaluation.status) }}
        </span>
      </div>
    </header>

    <ul class="grid gap-2">
      <li v-for="child in evaluation.children" :key="child.nodeId">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-left text-sm text-gray-700 transition-all duration-200 ease-out hover:bg-blue-50 hover:text-blue-700 active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          @click="selectNode(child.nodeId)"
        >
          <span class="truncate">{{ labelFor(child.nodeId) }}</span>
          <span class="font-medium">{{ formatScore(child.value) }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>
