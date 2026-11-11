<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { secondaryButtonClass } from '../utils/ui';

const wrapperRef = ref<HTMLElement | null>(null);
const isFullscreen = ref(false);

function syncFullscreenState() {
  isFullscreen.value = document.fullscreenElement === wrapperRef.value;
}

async function toggleFullscreen() {
  if (!wrapperRef.value) return;
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  await wrapperRef.value.requestFullscreen();
}

onMounted(() => {
  document.addEventListener('fullscreenchange', syncFullscreenState);
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncFullscreenState);
});
</script>

<template>
  <article ref="wrapperRef" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 class="text-xl font-semibold tracking-tight text-gray-900">系统展示视频</h3>
        <p class="mt-2 text-sm text-gray-500">
          系统演示视频：覆盖评分录入、计算追踪、维度对比与报告导出
        </p>
      </div>
      <button
        type="button"
        :class="secondaryButtonClass"
        :aria-pressed="isFullscreen"
        @click="toggleFullscreen"
      >
        {{ isFullscreen ? '退出全屏' : '全屏播放' }}
      </button>
    </div>

    <video
      class="w-full aspect-video rounded-lg bg-black"
      src="/videos/rtings-intro.mp4"
      controls
      playsinline
      preload="metadata"
    ></video>
  </article>
</template>
