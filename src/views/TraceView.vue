<script setup lang="ts">
import { computed } from 'vue';
import GroupCard from '../components/GroupCard.vue';
import TracePanel from '../components/TracePanel.vue';
import { useScoring } from '../composables/useScoring';
import { mutedTextClass, sectionTitleClass } from '../utils/ui';

const {
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
</script>

<template>
  <section class="mb-8">
    <div class="mb-4">
      <h2 :class="['text-2xl md:text-3xl', sectionTitleClass]">主维度</h2>
      <p :class="['mt-2 text-sm', mutedTextClass]">点击子项查看计算过程</p>
    </div>
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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

  <section>
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
</template>
