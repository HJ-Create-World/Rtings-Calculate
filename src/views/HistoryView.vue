<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import ChartCard from '../components/ChartCard.vue';
import GroupRadarChart from '../components/charts/GroupRadarChart.vue';
import OptionChips from '../components/OptionChips.vue';
import { rtingsRule } from '../data/rtingsRule';
import { useEvaluationLibrary } from '../composables/useEvaluationLibrary';
import { formatScore } from '../utils/format';
import { cardClass, inputClass, mutedTextClass, primaryButtonClass, sectionTitleClass } from '../utils/ui';

const { allBaselines, refreshEvaluationLibrary } = useEvaluationLibrary();

const search = ref('');
const brand = ref('');
const year = ref('');
const selectedId = ref('');
const expanded = ref(false);
const visibleCount = 24;

onMounted(() => {
  void refreshEvaluationLibrary();
});

const brands = computed(() =>
  [...new Set(allBaselines.value.map(item => item.brand ?? '未分类'))].sort((a, b) =>
    a.localeCompare(b, 'zh-CN')
  )
);

const years = computed(() =>
  [...new Set(allBaselines.value.map(item => item.releaseYear).filter(Boolean) as number[])].sort(
    (a, b) => b - a
  )
);

const filteredBaselines = computed(() => {
  const text = search.value.trim().toLowerCase();
  return allBaselines.value
    .filter(baseline => {
      const matchesText =
        !text ||
        `${baseline.label} ${baseline.brand ?? ''} ${baseline.model ?? ''} ${baseline.releaseYear ?? ''}`
          .toLowerCase()
          .includes(text);
      const matchesBrand = !brand.value || (baseline.brand ?? '未分类') === brand.value;
      const matchesYear = !year.value || String(baseline.releaseYear ?? '') === year.value;
      return matchesText && matchesBrand && matchesYear;
    })
    .sort((a, b) => {
      const yearDiff = (b.releaseYear ?? 0) - (a.releaseYear ?? 0);
      return yearDiff || a.label.localeCompare(b.label, 'zh-CN');
    });
});

const visibleBaselines = computed(() =>
  expanded.value ? filteredBaselines.value : filteredBaselines.value.slice(0, visibleCount)
);

const selectedBaseline = computed(
  () =>
    allBaselines.value.find(baseline => baseline.id === selectedId.value) ??
    filteredBaselines.value[0]
);

const topGroups = computed(() =>
  rtingsRule.nodes.filter(node => node.parentId === rtingsRule.rootId && node.includeInParent)
);

const selectedGroupId = ref(topGroups.value[0]?.id ?? '');

const radarSeries = computed(() => {
  if (!selectedBaseline.value) return [];
  return [
    {
      label: selectedBaseline.value.label,
      values: topGroups.value.map(group => selectedBaseline.value.expectedScores[group.id] ?? null)
    }
  ];
});

function collectLeafNodes(nodeId: string): typeof rtingsRule.nodes {
  return rtingsRule.nodes
    .filter(node => node.parentId === nodeId)
    .flatMap(child =>
      child.inputType === 'aggregate' ? collectLeafNodes(child.id) : [child]
    );
}

const parentById = computed(() => new Map(rtingsRule.nodes.map(node => [node.id, node])));

const detailItems = computed(() => {
  const parentMap = parentById.value;
  return collectLeafNodes(selectedGroupId.value)
    .filter(node => node.includeInParent)
    .map(node => ({
      node,
      parentLabel: parentMap.get(node.parentId ?? '')?.label ?? '',
      score: selectedBaseline.value?.expectedScores[node.id] ?? null
    }))
    .sort((a, b) => a.parentLabel.localeCompare(b.parentLabel, 'zh-CN') || a.node.label.localeCompare(b.node.label, 'zh-CN'));
});

const leafRanking = computed(() => {
  const scored = collectLeafNodes(rtingsRule.rootId)
    .filter(node => node.includeInParent)
    .map(node => ({
      node,
      parentLabel: parentById.value.get(node.parentId ?? '')?.label ?? '',
      score: selectedBaseline.value?.expectedScores[node.id] ?? null
    }))
    .filter(item => item.score !== null)
    .sort((left, right) => right.score! - left.score!);

  return {
    strengths: scored.slice(0, 5),
    weaknesses: scored.slice(-5).reverse()
  };
});
</script>

<template>
  <section class="mb-8 grid gap-6 lg:grid-cols-5">
    <article :class="cardClass" class="p-6 lg:col-span-2">
      <div class="flex items-center justify-between gap-4">
        <h2 :class="['text-xl md:text-2xl', sectionTitleClass]">详细参数</h2>
        <span :class="['text-xs', mutedTextClass]">
          含云端 / 本机 · {{ filteredBaselines.length }} 台
        </span>
      </div>

      <div class="mt-4 grid gap-3">
        <input v-model="search" type="search" placeholder="搜索品牌、型号或年份" :class="inputClass" />
        <div class="grid grid-cols-2 gap-3">
          <select v-model="brand" :class="inputClass" aria-label="按品牌筛选">
            <option value="">全部品牌</option>
            <option v-for="item in brands" :key="item" :value="item">{{ item }}</option>
          </select>
          <select v-model="year" :class="inputClass" aria-label="按年份筛选">
            <option value="">全部年份</option>
            <option v-for="item in years" :key="item" :value="String(item)">{{ item }}</option>
          </select>
        </div>
      </div>

      <div class="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
        <button
          v-for="baseline in visibleBaselines"
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
          <span class="flex items-center justify-between gap-2">
            <span class="block font-medium">{{ baseline.label }}</span>
            <span
              v-if="baseline.source === 'cloud' || baseline.source === 'local'"
              class="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700"
            >
              {{ baseline.source === 'cloud' ? '云端' : '本机' }}
            </span>
          </span>
          <span :class="['mt-1 block text-xs', mutedTextClass]">
            {{ baseline.releaseYear ?? '—' }} · {{ formatScore(baseline.expectedTotal) }}
          </span>
        </button>
      </div>

      <div v-if="filteredBaselines.length > visibleCount" class="mt-4">
        <button :class="primaryButtonClass" @click="expanded = !expanded">
          {{ expanded ? '收起机型列表' : `展开全部 ${filteredBaselines.length} 台` }}
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

      <ChartCard class="mt-6 !border-0 !p-0 !shadow-none" title="能力轮廓" description="按主维度查看评分分布">
        <GroupRadarChart
          :labels="topGroups.map(group => group.label)"
          :series="radarSeries"
          height="420px"
        />
      </ChartCard>

      <div class="mt-6 overflow-x-auto rounded-xl border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-900">主维度</th>
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

      <div class="mt-8">
        <h3 class="text-xl font-semibold tracking-tight text-gray-900">具体测试项评分</h3>
        <p :class="['mt-2 text-sm', mutedTextClass]">选择子类目，查看其中的节点级得分</p>
        <OptionChips class="mt-4" v-model="selectedGroupId" :options="topGroups.map(group => ({ value: group.id, label: group.label }))" />
        <div class="mt-4 overflow-x-auto rounded-xl border border-gray-200">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-gray-900">子类维度</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-900">具体测试项</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-900">得分</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="item in detailItems"
                :key="item.node.id"
                class="transition-colors duration-200 hover:bg-gray-50"
              >
                <td class="px-4 py-3 text-gray-700">{{ item.parentLabel }}</td>
                <td class="px-4 py-3 text-gray-900">{{ item.node.label }}</td>
                <td class="px-4 py-3 text-right font-medium text-gray-900">
                  {{ formatScore(item.score) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-2">
        <article class="rounded-xl bg-green-50 p-4">
          <h3 class="text-sm font-semibold text-green-700">优势测试项</h3>
          <ul class="mt-3 space-y-2 text-sm text-green-700">
            <li
              v-for="item in leafRanking.strengths"
              :key="`strength-${item.node.id}`"
              class="flex items-start justify-between gap-3"
            >
              <span>
                {{ item.node.label }}
                <span class="block text-xs text-green-600">{{ item.parentLabel }}</span>
              </span>
              <strong>{{ formatScore(item.score) }}</strong>
            </li>
          </ul>
        </article>
        <article class="rounded-xl bg-amber-50 p-4">
          <h3 class="text-sm font-semibold text-amber-700">短板测试项</h3>
          <ul class="mt-3 space-y-2 text-sm text-amber-700">
            <li
              v-for="item in leafRanking.weaknesses"
              :key="`weakness-${item.node.id}`"
              class="flex items-start justify-between gap-3"
            >
              <span>
                {{ item.node.label }}
                <span class="block text-xs text-amber-600">{{ item.parentLabel }}</span>
              </span>
              <strong>{{ formatScore(item.score) }}</strong>
            </li>
          </ul>
        </article>
      </div>
    </article>
  </section>
</template>
