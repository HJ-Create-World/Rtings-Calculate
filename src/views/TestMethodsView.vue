<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { ChartConfiguration } from 'chart.js';
import BaseChart from '../components/charts/BaseChart.vue';
import UiSelect from '../components/UiSelect.vue';
import { rtingsBaselinesV3, rtingsRule } from '../data/rtingsRule';
import type { ObjectiveMapping, ScoreNode } from '../core/types';
import { cardClass, mutedTextClass, sectionTitleClass } from '../utils/ui';

const route = useRoute();
const router = useRouter();

const props = defineProps<{ rangeMax?: number }>();

const leafNodes = rtingsRule.nodes.filter(
  node => node.kind === 'leaf' && node.includeInParent
);

const nodeById = new Map<string, ScoreNode>(rtingsRule.nodes.map(node => [node.id, node]));
const mappingById = new Map<string, ObjectiveMapping>(rtingsRule.mappings.map(item => [item.id, item]));

const selectedNodeId = ref(
  typeof route.query.nodeId === 'string' && nodeById.has(route.query.nodeId)
    ? route.query.nodeId
    : leafNodes[0]?.id ?? ''
);

const node = computed(() => nodeById.get(selectedNodeId.value) ?? null);
const parent = computed(() =>
  node.value?.parentId ? nodeById.get(node.value.parentId) ?? null : null
);
const grandParent = computed(() =>
  parent.value?.parentId ? nodeById.get(parent.value.parentId) ?? null : null
);
const mapping = computed(() =>
  node.value?.mappingId ? mappingById.get(node.value.mappingId) ?? null : null
);

watch(
  () => route.query.nodeId,
  value => {
    if (typeof value === 'string' && nodeById.has(value)) {
      selectedNodeId.value = value;
    }
  }
);

const nodeOptions = computed(() =>
  leafNodes.map(item => {
    const parentNode = item.parentId ? nodeById.get(item.parentId) : null;
    return {
      value: item.id,
      label: parentNode ? `${parentNode.label} / ${item.label}` : item.label
    };
  })
);

interface OfficialSample {
  product: string;
  raw: number | null;
  rawText: string;
  score: number | null;
}

const officialSamples = computed<OfficialSample[]>(() =>
  rtingsBaselinesV3.items
    .map(product => ({
      product: product.label,
      raw: product.inputs[selectedNodeId.value]?.objective?.value ?? null,
      rawText: product.inputs[selectedNodeId.value]?.objective?.text ?? '',
      score: product.expectedScores[selectedNodeId.value] ?? null
    }))
    .sort((left, right) => (right.score ?? -1) - (left.score ?? -1))
);

const scoredSamples = computed(() =>
  officialSamples.value.filter(sample => sample.score !== null)
);

const scatterData = computed(() =>
  scoredSamples.value
    .filter(sample => sample.raw !== null)
    .map(sample => ({ x: sample.raw!, y: sample.score! }))
);

const normalizedAnchors = computed(() =>
  (mapping.value?.anchors ?? []).map(item =>
    Array.isArray(item)
      ? { value: item[0], score: item[1] }
      : item
  )
);

const curveDataset = computed(() => {
  if (mapping.value?.kind === 'anchors') {
    return normalizedAnchors.value.map(anchor => ({ x: anchor.value, y: anchor.score }));
  }
  if (mapping.value?.kind === 'intervals') {
    return (mapping.value.intervals ?? []).map(interval => ({
      x: interval.min === null
        ? props.rangeMax ?? 10
        : (interval.min + (interval.max ?? interval.min + 1)) / 2,
      y: interval.scoreTenths / 10
    }));
  }
  return scatterData.value;
});

const curveConfiguration = computed<ChartConfiguration<'scatter'>>(() => ({
  type: 'scatter',
  data: {
    datasets: [
      {
        label: '评分规则曲线',
        data: curveDataset.value,
        showLine: true,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.14)',
        pointRadius: 3,
        borderWidth: 2,
        tension: 0.2
      },
      {
        label: '官方实测样本',
        data: scatterData.value,
        borderColor: 'transparent',
        backgroundColor: '#f59e0b',
        pointRadius: 4
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: {
      x: {
        type: 'linear',
        title: { display: true, text: mapping.value?.unit || '实测值' },
        grid: { color: '#f3f4f6' }
      },
      y: {
        min: 0,
        max: 10,
        title: { display: true, text: '得分' },
        grid: { color: '#f3f4f6' },
        ticks: { stepSize: 2 }
      }
    }
  }
}));

const distributionConfiguration = computed<ChartConfiguration<'bar'>>(() => {
  const values = officialSamples.value
    .map(sample => sample.raw)
    .filter((value): value is number => value !== null && Number.isFinite(value));

  if (!values.length) {
    return {
      type: 'bar',
      data: { labels: ['暂无实测数据'], datasets: [{ label: '样本数', data: [0], backgroundColor: '#94a3b8' }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const bucketCount = 10;
  const width = max === min ? 1 : (max - min) / bucketCount;
  const labels: string[] = [];
  const counts = Array.from({ length: bucketCount }, () => 0);

  values.forEach(value => {
    const index = max === min
      ? 0
      : Math.min(bucketCount - 1, Math.floor((value - min) / width));
    counts[index] += 1;
  });

  for (let index = 0; index < bucketCount; index += 1) {
    const start = min + index * width;
    const end = min + (index + 1) * width;
    labels.push(`${start.toFixed(max - min > 20 ? 0 : 1)}~${end.toFixed(max - min > 20 ? 0 : 1)}`);
  }

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '官方样本数',
        data: counts,
        backgroundColor: 'rgba(37,99,235,0.72)',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { precision: 0 } }
      }
    }
  };
});

const methodPlaceholders = [
  {
    title: '测试设备',
    placeholder: '待补充：设备型号、校准状态、连接方式与关键参数'
  },
  {
    title: '测试环境',
    placeholder: '待补充：环境光照、温湿度、屏幕设置与测试距离'
  },
  {
    title: '测试步骤',
    placeholder: '待补充：测试准备、执行动作、判定口径与复测规则'
  },
  {
    title: '数据处理',
    placeholder: '待补充：采样方式、平均值/中位数、剔除规则与单位换算'
  },
  {
    title: '备注与风险',
    placeholder: '待补充：边界情况、方法差异、机型注意事项'
  }
];

const mappingTypeLabel = computed(() => {
  const kind = mapping.value?.kind;
  if (kind === 'anchors') return '锚点插值';
  if (kind === 'intervals') return '区间映射';
  if (kind === 'categorical') return '类别映射';
  if (kind === 'identity') return '主观直评';
  return '未配置';
});

function goToTestMethod(nodeId: string) {
  void router.push({ path: '/methods', query: { nodeId } });
}

defineExpose({ goToTestMethod });
</script>

<template>
  <section :class="cardClass" class="mb-6 p-6">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 :class="['text-2xl md:text-3xl', sectionTitleClass]">测试方法与评分规则</h1>
        <p :class="['mt-2 text-sm', mutedTextClass]">
          展示测试项的推断依据：评分曲线、官方数据分布、实测样本与规则映射
        </p>
      </div>
      <UiSelect
        v-model="selectedNodeId"
        :options="nodeOptions"
        aria-label="选择测试项"
        searchable
      />
    </div>
  </section>

  <section v-if="node" :class="cardClass" class="mb-6 p-6">
    <div class="grid gap-6 lg:grid-cols-3">
      <article class="lg:col-span-2">
        <h2 class="text-xl font-semibold tracking-tight text-gray-900">{{ node.label }}</h2>
        <p :class="['mt-2 text-sm', mutedTextClass]">
          {{ grandParent?.label ?? '' }} / {{ parent?.label ?? '' }} · {{ mappingTypeLabel }}
        </p>
        <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-lg bg-gray-50 p-4">
            <p class="text-xs text-gray-500">相对父项权重</p>
            <strong class="mt-1 block text-lg text-blue-700">
              {{ node.weight === null ? '不计入' : `${(node.weight * 100).toFixed(1)}%` }}
            </strong>
          </div>
          <div class="rounded-lg bg-gray-50 p-4">
            <p class="text-xs text-gray-500">评分方向</p>
            <strong class="mt-1 block text-lg text-gray-900">
              {{ mapping?.direction === 'lowerBetter' ? '越小越好' : '越大越好' }}
            </strong>
          </div>
          <div class="rounded-lg bg-gray-50 p-4">
            <p class="text-xs text-gray-500">证据来源</p>
            <strong class="mt-1 block text-lg text-gray-900">
              {{ mapping?.source ?? '工程师评分' }}
            </strong>
          </div>
          <div class="rounded-lg bg-gray-50 p-4">
            <p class="text-xs text-gray-500">证据等级</p>
            <strong class="mt-1 block text-lg text-gray-900">{{ mapping?.evidence ?? '—' }}</strong>
          </div>
        </div>
      </article>

      <article class="rounded-xl bg-blue-50 p-5">
        <h3 class="text-base font-semibold text-blue-700">测试方法</h3>
        <p class="mt-2 text-sm text-blue-700">
          方法资料暂未录入；当前页面先展示系统内部已确认的评分规则与数据分布。
        </p>
      </article>
    </div>
  </section>

  <section :class="cardClass" class="mb-6 p-6">
    <h2 class="text-xl font-semibold tracking-tight text-gray-900">评分预测曲线</h2>
    <p :class="['mt-2 text-sm', mutedTextClass]">
      蓝线是当前规则映射出的分数曲线；黄色点为 107 款官方机型的实测值与官方得分。
    </p>
    <BaseChart
      class="mt-4"
      :configuration="curveConfiguration"
      height="420px"
      :chart-title="`${node?.label ?? '测试项'} 评分预测曲线`"
      label="测试项评分预测曲线"
    />
  </section>

  <section :class="cardClass" class="mb-6 p-6">
    <h2 class="text-xl font-semibold tracking-tight text-gray-900">测试数据分布</h2>
    <p :class="['mt-2 text-sm', mutedTextClass]">基于 Rtings 官方基线数据的实测值分布。</p>
    <BaseChart
      class="mt-4"
      :configuration="distributionConfiguration"
      height="320px"
      :chart-title="`${node?.label ?? '测试项'} 测试数据分布`"
      label="测试项数据分布"
    />
  </section>

  <section :class="cardClass" class="mb-6 p-6">
    <h2 class="text-xl font-semibold tracking-tight text-gray-900">测试方法资料</h2>
    <p :class="['mt-2 text-sm', mutedTextClass]">以下内容留空待工程师后续录入。</p>
    <div class="mt-4 grid gap-4 md:grid-cols-2">
      <article
        v-for="item in methodPlaceholders"
        :key="item.title"
        class="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4"
      >
        <h3 class="text-sm font-semibold text-gray-900">{{ item.title }}</h3>
        <p :class="['mt-2 text-sm', mutedTextClass]">{{ item.placeholder }}</p>
      </article>
    </div>
  </section>

  <section :class="cardClass" class="p-6">
    <div class="mb-4 flex items-center justify-between gap-4">
      <h2 class="text-xl font-semibold tracking-tight text-gray-900">官方实测样本</h2>
      <span :class="['text-xs', mutedTextClass]">{{ officialSamples.length }} 条</span>
    </div>
    <div class="max-h-[560px] overflow-auto rounded-xl border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="sticky top-0 bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">机型</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-900">实测值</th>
            <th class="px-4 py-3 text-right font-semibold text-gray-900">官方得分</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="sample in officialSamples" :key="sample.product" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-gray-900">{{ sample.product }}</td>
            <td class="px-4 py-3 text-gray-700">{{ sample.raw ?? sample.rawText ?? '—' }}</td>
            <td class="px-4 py-3 text-right font-medium text-blue-700">
              {{ sample.score === null ? '—' : sample.score.toFixed(1) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
