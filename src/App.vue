<script setup lang="ts">
import { computed } from 'vue';
import GroupCard from './components/GroupCard.vue';
import TracePanel from './components/TracePanel.vue';
import { useScoring } from './composables/useScoring';
import { formatExact, formatScore, statusClass, statusLabel, warningLabel } from './utils/format';

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

const selectedPath = computed(() => pathFor(selectedNodeId.value));
const warningCount = computed(() => warnings.value.length);
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Rtings Calculate</p>
        <h1>Mixed Usage 评分视图</h1>
        <p class="subtitle">规则版本 {{ rule.version }} · 基准 {{ baseline.label }}</p>
      </div>
      <div class="total-card">
        <span>Mixed Usage 总分</span>
        <strong>{{ formatScore(result.value) }}</strong>
        <small>期望 {{ formatExact(baseline.expectedTotal) }}</small>
        <span :class="['status', statusClass(result.status)]">
          {{ statusLabel(result.status) }}
        </span>
      </div>
    </header>

    <section class="overview-grid">
      <article class="overview-card">
        <p>规则节点</p>
        <strong>{{ rule.nodes.length }}</strong>
      </article>
      <article class="overview-card">
        <p>客观映射</p>
        <strong>{{ rule.mappings.length }}</strong>
      </article>
      <article class="overview-card">
        <p>基准输入</p>
        <strong>{{ Object.keys(baseline.expectedScores).length }}</strong>
      </article>
      <article class="overview-card">
        <p>计算警告</p>
        <strong>{{ warningCount }}</strong>
      </article>
    </section>

    <section v-if="warnings.length" class="warning-strip">
      <div v-for="warning in warnings" :key="warning.code + warning.message" class="warning-item">
        <strong>{{ warningLabel(warning.code) }}</strong>
        <span>{{ warning.message }}</span>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>顶层分组</h2>
        <span>点击任意子项查看计算过程</span>
      </div>
      <div class="groups-grid">
        <GroupCard
          v-for="group in topGroups"
          :key="group.nodeId"
          :node="nodeById.get(group.nodeId)!"
          :evaluation="group"
          :label-for="labelFor"
          :select-node="selectNode"
        />
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>计算追踪</h2>
        <span>展示输入、权重、区间和贡献</span>
      </div>

      <nav class="breadcrumb">
        <button
          v-for="(node, index) in selectedPath"
          :key="node.id"
          type="button"
          @click="selectNode(node.id)"
        >
          {{ node.label }}
          <span v-if="index < selectedPath.length - 1">/</span>
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

    <footer class="page-footer">
      当前视图基于权威基准只读展示；可录入表单与规则管理将在后续版本接入。
    </footer>
  </div>
</template>

<style scoped src="./App.css"></style>
