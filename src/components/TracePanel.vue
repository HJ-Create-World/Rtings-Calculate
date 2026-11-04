<script setup lang="ts">
import type { NodeEvaluation, ScoreNode } from '../core/types';
import type { HisenseBaseline } from '../data/rtingsRule';
import {
  formatContribution,
  formatExact,
  formatScore,
  formatWeight,
  statusClass,
  statusLabel,
  warningLabel
} from '../utils/format';

defineProps<{
  node: ScoreNode;
  evaluation: NodeEvaluation;
  baselineRow?: HisenseBaseline['rows'][number];
  children: NodeEvaluation[];
  labelFor: (nodeId: string) => string;
  selectNode: (nodeId: string) => void;
}>();
</script>

<template>
  <section class="trace-panel">
    <header class="panel-header">
      <div>
        <p class="panel-title">{{ node.label }}</p>
        <p class="panel-id">{{ node.id }}</p>
      </div>
      <span :class="['status', statusClass(evaluation.status)]">
        {{ statusLabel(evaluation.status) }}
      </span>
    </header>

    <div class="metric-grid">
      <article>
        <span>分数</span>
        <strong>{{ formatScore(evaluation.value) }}</strong>
      </article>
      <article>
        <span>父项权重</span>
        <strong>{{ formatWeight(node.weight) }}</strong>
      </article>
      <article>
        <span>贡献值</span>
        <strong>{{ formatContribution(evaluation.contributionToParent) }}</strong>
      </article>
      <article>
        <span>部分分</span>
        <strong>{{ formatExact(evaluation.partialValue) }}</strong>
      </article>
    </div>

    <div class="detail-grid">
      <p>
        <span>层级 / 输入</span>
        {{ node.kind }} · {{ node.inputType }} · {{ node.includeInParent ? '计入父项' : '不计入父项' }}
      </p>
      <p>
        <span>基准期望分</span>
        {{ baselineRow?.expectedScore ?? '—' }}
      </p>
      <p>
        <span>原始值</span>
        {{ baselineRow?.rawText || '—' }}
      </p>
    </div>

    <div v-if="evaluation.mappingTrace" class="mapping-box">
      <p class="section-title">区间映射</p>
      <p>映射表：{{ evaluation.mappingTrace.mappingId }}</p>
      <p>输入值：{{ evaluation.mappingTrace.value ?? '—' }}</p>
      <p v-if="evaluation.mappingTrace.matchedInterval">
        命中分数：{{ (evaluation.mappingTrace.matchedInterval.scoreTenths / 10).toFixed(1) }}
        （{{ evaluation.mappingTrace.matchedInterval.rawText }}）
      </p>
    </div>

    <div v-if="evaluation.warnings.length" class="warning-box">
      <p class="section-title">警告</p>
      <ul>
        <li v-for="warning in evaluation.warnings" :key="warning.message">
          <strong>{{ warningLabel(warning.code) }}</strong>
          <span>{{ warning.message }}</span>
        </li>
      </ul>
    </div>

    <div v-if="children.length" class="children-box">
      <p class="section-title">子项</p>
      <div class="children-grid">
        <button
          v-for="child in children"
          :key="child.nodeId"
          type="button"
          class="child-row"
          @click="selectNode(child.nodeId)"
        >
          <span>{{ labelFor(child.nodeId) }}</span>
          <span>{{ formatScore(child.value) }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped src="./TracePanel.css"></style>
