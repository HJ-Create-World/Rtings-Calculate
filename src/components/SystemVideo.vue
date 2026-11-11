<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { secondaryButtonClass } from '../utils/ui';

const VIDEO_URL = '/videos/rtings-intro.mp4';

const wrapperRef = ref<HTMLElement | null>(null);
const isFullscreen = ref(false);
const videoUrl = ref('');
const loading = ref(true);
const progress = ref(0);
const loadError = ref('');
let objectUrl: string | null = null;

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

async function loadVideoAsBlob() {
  try {
    // WorkBuddy 静态托管不返回 Range 响应，直接挂 MP4 会导致原生进度条难以拖动。
    // 先完整读取视频并转成 Blob URL，浏览器就能在本地字节上任意 seek。
    const response = await fetch(VIDEO_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const total = Number(response.headers.get('Content-Length') ?? '0');
    if (response.body && total > 0) {
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.byteLength;
          progress.value = Math.min(99, Math.round((received / total) * 100));
        }
      }

      objectUrl = URL.createObjectURL(new Blob(chunks as BlobPart[], { type: 'video/mp4' }));
    } else {
      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);
    }

    videoUrl.value = objectUrl;
    progress.value = 100;
  } catch (error) {
    // 兜底：静态资源 Blob 读取失败时仍挂原始地址，保证视频可见。
    videoUrl.value = VIDEO_URL;
    loadError.value = error instanceof Error ? error.message : '视频加载失败';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', syncFullscreenState);
  void loadVideoAsBlob();
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncFullscreenState);
  if (objectUrl) URL.revokeObjectURL(objectUrl);
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
        :disabled="loading"
        @click="toggleFullscreen"
      >
        {{ isFullscreen ? '退出全屏' : '全屏播放' }}
      </button>
    </div>

    <div class="relative w-full aspect-video overflow-hidden rounded-lg bg-black">
      <video
        v-if="videoUrl"
        class="h-full w-full"
        :src="videoUrl"
        controls
        playsinline
        preload="auto"
      ></video>

      <div
        v-if="loading || loadError"
        class="absolute inset-0 flex items-center justify-center bg-black/90 px-6 text-center"
      >
        <div>
          <p class="text-lg font-semibold text-white">
            {{ loadError ? '视频加载失败' : '正在准备视频' }}
          </p>
          <p class="mt-2 text-sm text-gray-300">
            {{ loadError ? loadError : `已加载 ${progress}%` }}
          </p>
        </div>
      </div>
    </div>
  </article>
</template>
