<script setup lang="ts">
defineProps<{
  className?: string;
}>();
</script>

<template>
  <svg :class="className" viewBox="0 0 40 40" role="img" aria-label="BOE Rtings 评测系统 Logo">
    <rect x="2" y="2" width="36" height="36" rx="12" fill="#2563eb" />
    <path
      d="M10 27 C17 27 19 14 24 14 S30 21 30 21"
      fill="none"
      stroke="#ffffff"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="30" cy="21" r="3" fill="#bfdbfe" />
  </svg>
</template>
