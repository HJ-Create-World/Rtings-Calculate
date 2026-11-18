<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { cardClass, inputClass, primaryButtonClass, secondaryButtonClass } from '../utils/ui';

const router = useRouter();
const { login, submitting } = useAuth();

const account = ref('');
const password = ref('');
const error = ref('');
const showPassword = ref(false);

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
  <div class="mx-auto flex min-h-[68vh] max-w-md flex-col justify-center">
    <section :class="cardClass" class="p-6 md:p-8">
      <div class="text-center">
        <h1 class="text-2xl font-semibold tracking-tight text-gray-900">登录系统</h1>
        <p class="mt-2 text-sm text-gray-500">使用账号和密码进入 BOE Rtings 评测系统</p>
      </div>

      <form class="mt-8 grid gap-4" @submit.prevent="submit">
        <label class="grid gap-2 text-sm">
          <span class="text-gray-700">账号</span>
          <input
            v-model="account"
            type="text"
            autocomplete="username"
            :class="inputClass"
            placeholder="请输入账号"
          />
        </label>

        <label class="grid gap-2 text-sm">
          <span class="text-gray-700">密码</span>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              :class="inputClass"
              class="!pr-12"
              placeholder="请输入密码"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '隐藏' : '显示' }}
            </button>
          </div>
        </label>

        <p v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">{{ error }}</p>

        <button type="submit" :class="primaryButtonClass" :disabled="submitting">
          {{ submitting ? '登录中…' : '登录' }}
        </button>

        <RouterLink
          to="/register"
          :class="secondaryButtonClass"
          class="text-center"
        >
          注册新账号
        </RouterLink>
      </form>
    </section>
  </div>
</template>
