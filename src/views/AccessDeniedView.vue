<script setup lang="ts">
import { cardClass, mutedTextClass, primaryButtonClass, secondaryButtonClass, sectionTitleClass } from '../utils/ui';

defineProps<{ title?: string; message?: string; showBack?: boolean; showHome?: boolean }>();
</script>

<template>
  <section :class="cardClass" class="mx-auto max-w-lg p-6 text-center md:p-8">
    <h1 :class="['text-2xl', sectionTitleClass]">{{ title ?? '无访问权限' }}</h1>
    <p :class="['mt-3 text-sm', mutedTextClass]">
      {{ message ?? '当前账号没有访问该模块的权限，请联系系统管理员。' }}
    </p>
    <div class="mt-6 flex justify-center gap-3">
      <button v-if="showBack !== false" :class="secondaryButtonClass" @click="$router.back()">返回</button>
      <RouterLink v-if="showHome !== false" to="/" :class="primaryButtonClass">回到首页</RouterLink>
    </div>
  </section>
</template>
