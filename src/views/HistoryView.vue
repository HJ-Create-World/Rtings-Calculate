<script setup lang="ts">
import { computed, ref } from 'vue';
import GroupRadarChart from '../components/charts/GroupRadarChart.vue';
import { rtingsBaselinesV3, rtingsRule } from '../data/rtingsRule';
import { formatScore } from '../utils/format';
import { cardClass, inputClass, mutedTextClass, sectionTitleClass } from '../utils/ui';

const search = ref('');
const selectedId = ref(rtingsBaselinesV3.items[0]?.id ?? '');

const filteredBaselines = computed(() => {
  const text = search.value.trim().toLowerCase();
  if (!text) return rtingsBaselinesV3.items;
  return rtingsBaselinesV3.items.filter(baseline =>
    `${baseline.label} ${baseline.brand ?? ''} ${baseline.model ?? ''} ${baseline.releaseYear ?? ''}`
      .toLowerCase()
      .includes(text)
  );
});

const selectedBaseline = computed(
  () => rtingsBaselinesV3.items.find(baseline => baseline.id === selectedId.value) ?? filteredBaselines.value[0]
);

const topGroups = computed(() =>
  rtingsRule.nodes.filter(node => node.parentId === rtingsRule.rootId && node.includeInParent)
);

const radarSeries = computed(() => {
  if (!selectedBaseline.value) return [];
  return [
    {
      label: selectedBaseline.value.label,
      values: topGroups.value.map(group => selectedBaseline.value.expectedScores[group.id] ?? null)
    }
  ];
});
</script>

<template>
  <section class="mb-8 grid gap-6 lg:grid-cols-5">
    <article :class="cardClass" class="p-6 lg:col-span-2">
      <div class="flex items-center justify-between gap-4">
        <h2 :class="['text-xl md:text-2xl', sectionTitleClass]">历史机型库</h2>
        <span :class="['text-xs', mutedTextClass]">{{ filteredBaselines.length }} 台</span>
      </div>
      <input v-model="search" type="search" placeholder="搜索品牌、型号或年份" :class="[inputClass, 'mt-4 w-full']" />
      <div class="mt-4 max-h-[480px] space-y-2 overflow-y-auto pr-1">
        <button
          v-for="baseline in filteredBaselines"
          :key="baseline.id"
          type="button"
          class="w-full rounded-lg border px-3 py-2 text-left text-sm transition-all duration-200 ease-out"
          :class="
            selectedBaseline?.id === baseline.id
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-700 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow'
          "
          @click="selectedId = baseline.id"
        >
          <span class="block font-medium">{{ baseline.label }}</span>
          <span :class="['mt-1 block text-xs', mutedTextClass]">
            {{ baseline.releaseYear ?? '—' }} · {{ formatScore(baseline.expectedTotal) }}
          </span>
        </button>
      </div>
    </article>

    <article v-if="selectedBaseline" :class="cardClass" class="p-6 lg:col-span-3">
      <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 :class="['text-2xl md:text-3xl', sectionTitleClass]">{{ selectedBaseline.label }}</h2>
          <p :class="['mt-2 text-sm', mutedTextClass]">
            {{ selectedBaseline.brand ?? '—' }} · {{ selectedBaseline.releaseYear ?? '—' }} ·
            {{ selectedBaseline.methodology || 'Rtings 官方数据' }}
          </p>
        </div>
        <div class="rounded-xl bg-blue-50 p-4 text-right">
          <p class="text-xs text-blue-700">Mixed Usage</p>
          <strong class="block text-3xl font-semibold text-blue-700">
            {{ formatScore(selectedBaseline.expectedTotal) }}
          </strong>
        </div>
      </div>

      <div class="mt-6">
        <GroupRadarChart
          :labels="topGroups.map(group => group.label)"
          :series="radarSeries"
          height="420px"
        />
      </div>

      <div class="mt-6 overflow-x-auto rounded-xl border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-900">顶层分组</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-900">得分</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="group in topGroups"
              :key="group.id"
              class="transition-colors duration-200 hover:bg-gray-50"
            >
              <td class="px-4 py-3 text-gray-700">{{ group.label }}</td>
              <td class="px-4 py-3 text-right font-medium text-gray-900">
                {{ formatScore(selectedBaseline.expectedScores[group.id] ?? null) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </section>
</template>
