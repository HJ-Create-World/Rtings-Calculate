<script setup lang="ts">
import { computed } from 'vue';
import { rtingsBaselinesV3, rtingsRule } from '../data/rtingsRule';
import { cardClass, mutedTextClass, sectionTitleClass } from '../utils/ui';

const features = [
  {
    title: '评分规则可追溯',
    description:
      '每个叶子分都能追溯到输入值、CSV 锚点、权重和聚合路径，不做黑盒计算。'
  },
  {
    title: '真实数据支撑',
    description:
      '融合工程师拆解与 107 款 Rtings 官方实测数据，推断值均标注证据等级。'
  },
  {
    title: '规则持续演化',
    description:
      '支持规则版本化管理，后续可记录变更、回档历史版本，并适配 Rtings 更新。'
  },
  {
    title: '离线优先',
    description:
      '评分计算、录入和图表可离线使用；联网主要用于历史数据落库与复用。'
  }
];

const stats = computed(() => [
  { label: '评分节点', value: rtingsRule.nodes.length },
  { label: 'CSV 基准机型', value: rtingsBaselinesV3.items.length },
  { label: '规则版本', value: rtingsRule.version },
  { label: '聚合模式', value: '缺失重归一' }
]);
</script>

<template>
  <section :class="cardClass" class="mb-8 p-6 md:p-8">
    <div class="grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <h2 :class="['text-2xl md:text-3xl', sectionTitleClass]">
          让 TV 评分计算从表格走向可审计的工程系统
        </h2>
        <p :class="['mt-4 text-sm md:text-base', mutedTextClass]">
          Rtings Calculate 把人工 Excel 拆解、Rtings 官方实测数据和工程师经验锚点融合成一套可执行、可解释、可迭代的评分系统。
          它既服务实验室的日常评分录入，也支持产品团队做横向对比和内部报告。
        </p>
        <div class="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <article
            v-for="stat in stats"
            :key="stat.label"
            class="rounded-lg bg-gray-50 p-4 text-sm text-gray-700"
          >
            <p class="text-xs text-gray-500">{{ stat.label }}</p>
            <strong class="mt-1 block text-lg font-semibold text-gray-900">{{ stat.value }}</strong>
          </article>
        </div>
      </div>
      <div class="rounded-xl bg-blue-50 p-6 text-sm text-blue-700">
        <p class="text-base font-semibold">当前规则版本</p>
        <p class="mt-2">v{{ rtingsRule.version }}</p>
        <p class="mt-4">
          规则来源包含工程师表、CSV 反推和人工锚点；所有推断处均保留证据等级，不虚构数值。
        </p>
      </div>
    </div>
  </section>

  <section class="grid gap-6 md:grid-cols-2">
    <article v-for="feature in features" :key="feature.title" :class="cardClass" class="p-6">
      <h3 class="text-xl font-semibold tracking-tight text-gray-900">{{ feature.title }}</h3>
      <p :class="['mt-3 text-sm', mutedTextClass]">{{ feature.description }}</p>
    </article>
  </section>
</template>
