<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import PasswordInput from '../components/PasswordInput.vue';
import { useAuth } from '../composables/useAuth';
import { cardClass, inputClass, primaryButtonClass, secondaryButtonClass } from '../utils/ui';

const router = useRouter();
const { login, submitting } = useAuth();

const account = ref('');
const password = ref('');
const error = ref('');

async function submit() {
  error.value = '';
  if (!account.value.trim() || !password.value) {
    error.value = '请输入账号和密码';
    return;
  }

  try {
    await login(account.value.trim(), password.value);
    await router.replace('/');
  } catch (err) {
    error.value = err instanceof Error ? err.message : '登录失败';
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-[70vh] max-w-5xl items-center">
    <div class="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <section class="hidden flex-col justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-slate-50 p-8 lg:flex">
        <span class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 6h16M4 12h10M4 18h7" />
          </svg>
        </span>
        <h2 class="mt-6 text-3xl font-semibold tracking-tight text-gray-900">BOE Rtings<br />评测系统</h2>
        <p class="mt-4 text-sm leading-6 text-gray-600">
          统一管理评分录入、规则追踪、维度对比与导出。登录后按权限访问对应模块。
        </p>
        <div class="mt-8 grid gap-3">
          <div class="flex items-center gap-3 rounded-xl bg-white/80 p-3 text-sm text-gray-700 shadow-sm">
            <span class="h-2 w-2 rounded-full bg-blue-600"></span>
            数据查看 · Rtings 基线与自建评测
          </div>
          <div class="flex items-center gap-3 rounded-xl bg-white/80 p-3 text-sm text-gray-700 shadow-sm">
            <span class="h-2 w-2 rounded-full bg-blue-600"></span>
            评分录入 · 实测数据与工程师评分
          </div>
          <div class="flex items-center gap-3 rounded-xl bg-white/80 p-3 text-sm text-gray-700 shadow-sm">
            <span class="h-2 w-2 rounded-full bg-blue-600"></span>
            权限控制 · 测试方法按角色开放
          </div>
        </div>
      </section>

      <section :class="cardClass" class="p-6 md:p-8">
        <div class="mx-auto w-full max-w-sm">
          <div class="text-center lg:text-left">
            <h1 class="text-2xl font-semibold tracking-tight text-gray-900">登录系统</h1>
            <p class="mt-2 text-sm text-gray-500">使用账号和密码进入评测工作台</p>
          </div>

          <form class="mt-8 grid gap-5" @submit.prevent="submit">
            <label class="grid gap-2 text-sm">
              <span class="font-medium text-gray-700">账号</span>
              <input
                v-model="account"
                type="text"
                autocomplete="username"
                :class="inputClass"
                placeholder="请输入账号"
              />
            </label>

            <label class="grid gap-2 text-sm">
              <span class="font-medium text-gray-700">密码</span>
              <PasswordInput
                v-model="password"
                placeholder="请输入密码"
                autocomplete="current-password"
                aria-label="登录密码"
              />
            </label>

            <p v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">{{ error }}</p>

            <button type="submit" :class="primaryButtonClass" :disabled="submitting">
              {{ submitting ? '登录中…' : '登录' }}
            </button>

            <div class="flex items-center gap-3 text-xs text-gray-400">
              <span class="h-px flex-1 bg-gray-200"></span>
              <span>还没有账号</span>
              <span class="h-px flex-1 bg-gray-200"></span>
            </div>

            <RouterLink to="/register" :class="secondaryButtonClass" class="text-center">
              注册新账号
            </RouterLink>
          </form>
        </div>
      </section>
    </div>
  </div>
</template>
