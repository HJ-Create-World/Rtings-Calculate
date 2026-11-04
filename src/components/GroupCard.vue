<script setup lang="ts">
import type { NodeEvaluation, ScoreNode } from '../core/types';
import { formatScore, formatWeight, statusClass, statusLabel } from '../utils/format';

defineProps<{
  node: ScoreNode;
  evaluation: NodeEvaluation;
  labelFor: (nodeId: string) => string;
  selectNode: (nodeId: string) => void;
}>();
</script>

<template>
  <section class="group-card">
    <header class="group-header">
      <div>
        <p class="group-title">{{ node.label }}</p>
        <p class="group-meta">权重 {{ formatWeight(node.weight) }}</p>
      </div>
      <div class="group-score">
        <strong>{{ formatScore(evaluation.value) }}</strong>
        <span :class="['status', statusClass(evaluation.status)]">
          {{ statusLabel(evaluation.status) }}
        </span>
      </div>
    </header>

    <ul class="dimension-list">
      <li v-for="child in evaluation.children" :key="child.nodeId">
        <button type="button" class="dimension-row" @click="selectNode(child.nodeId)">
          <span class="dimension-name">{{ labelFor(child.nodeId) }}</span>
          <span class="dimension-value">{{ formatScore(child.value) }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.group-card {
  background: #ffffff;
  border: 1px solid #d3d1c7;
  border-radius: 12px;
  padding: 16px;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.group-title {
  font-size: 15px;
  font-weight: 500;
  color: #2c2c2a;
  margin: 0;
}

.group-meta {
  margin: 4px 0 0;
  font-size: 12px;
  color: #5f5e5a;
}

.group-score {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-score strong {
  font-size: 20px;
  color: #0f6e56;
}

.dimension-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

.dimension-row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border: 0;
  border-radius: 8px;
  background: #f1efe8;
  color: #444441;
  font-size: 12px;
  cursor: pointer;
  text-align: left;
}

.dimension-row:hover {
  background: #e6f1fb;
}

.dimension-name {
  overflow: hidden;
  text-overflow: ellipsis;
}

.dimension-value {
  font-weight: 500;
}
</style>
