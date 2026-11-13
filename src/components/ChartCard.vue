<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { secondaryButtonClass } from '../utils/ui';

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    fullscreenMode?: 'fill' | 'scroll';
  }>(),
  {
    fullscreenMode: 'fill'
  }
);

const cardRef = ref<HTMLElement | null>(null);
const isFullscreen = ref(false);

function syncFullscreenState() {
  isFullscreen.value = document.fullscreenElement === cardRef.value;
  window.dispatchEvent(new Event('resize'));
}

async function toggleFullscreen() {
  if (!cardRef.value) return;
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  await cardRef.value.requestFullscreen();
}

onMounted(() => {
  document.addEventListener('fullscreenchange', syncFullscreenState);
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncFullscreenState);
});
</script>

<template>
  <article
    ref="cardRef"
    :class="[
      'bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 ease-out',
      isFullscreen ? 'flex h-screen flex-col overflow-hidden !border-0 !shadow-none' : ''
    ]"
  >
    <div class="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="text-xl font-semibold tracking-tight text-gray-900">{{ title }}</h2>
        <p v-if="description" class="mt-1 text-sm text-gray-500">{{ description }}</p>
      </div>
      <div class="flex shrink-0 flex-wrap items-center gap-3">
        <slot name="actions"></slot>
        <button
          type="button"
          :class="secondaryButtonClass"
          :aria-pressed="isFullscreen"
          @click="toggleFullscreen"
        >
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </button>
      </div>
    </div>
    <div
      :class="[
        'min-h-0 flex-1',
        isFullscreen
          ? fullscreenMode === 'scroll'
            ? 'overflow-y-auto fullscreen-chart-host--scroll'
            : 'overflow-hidden fullscreen-chart-host--fill'
          : ''
      ]"
    >
      <slot></slot>
    </div>
  </article>
</template>

<style scoped>
.fullscreen-chart-host--fill {
  height: 100%;
}

.fullscreen-chart-host--fill :deep(> *) {
  height: 100% !important;
}

.fullscreen-chart-host--scroll {
  height: 100%;
}

.fullscreen-chart-host--scroll :deep(> *) {
  height: auto !important;
  max-height: none !important;
}
</style>
