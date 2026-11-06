<script setup lang="ts">
import { ref } from 'vue';
import { secondaryButtonClass } from '../utils/ui';

const props = defineProps<{
  title: string;
  description?: string;
}>();

const cardRef = ref<HTMLElement | null>(null);
const isFullscreen = ref(false);

async function toggleFullscreen() {
  if (!cardRef.value) return;
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    isFullscreen.value = false;
    return;
  }
  await cardRef.value.requestFullscreen();
  isFullscreen.value = true;
}
</script>

<template>
  <article
    ref="cardRef"
    class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 ease-out"
  >
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
    <div :class="isFullscreen ? 'h-[calc(100vh-160px)]' : ''">
      <slot></slot>
    </div>
  </article>
</template>
