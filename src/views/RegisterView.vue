<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { cardClass, inputClass, primaryButtonClass, secondaryButtonClass } from '../utils/ui';

const router = useRouter();
const { register, submitting } = useAuth();

const account = ref('');
const employeeNo = ref('');
const name = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const showPassword = ref(false);

async function submit() {
  error.value = '';
  if (!account.value.trim() || !employeeNo.value.trim() || !name.value.trim()) {
    error.value = '请填写账号、工号和姓名';
    return;
  }
  if (password.value.length < 8) {
    error.value = '密码至少 8 位';
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致';
    return;
  }

  try {
    await register({
      account: account.value.trim(),
      employeeNo: employeeNo.value.trim(),
      name: name.value.trim(),
      password: password.value
    });
    await router.replace('/');
  } catch (err) {
    error.value = err instanceof Error ? err.message : '注册失败';
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-[68vh] max-w-lg flex-col justify-center">
    <section :class="cardClass" class="p-6 md:p-8">
      <div class="text-center">
        <h1 class="text-2xl font-semibold tracking-tight text-gray-900">注册账号</h1>
        <p class="mt-2 text-sm text-gray-500">
          首个注册账号将成为系统管理员；后续注册默认为普通用户
        </p>
      </div>

      <form class="mt-8 grid gap-4" @submit.prevent="submit">
        <label class="grid gap-2 text-sm">
          <span class="text-gray-700">账号 *</span>
          <input
            v-model="account"
            type="text"
            autocomplete="username"
            :class="inputClass"
            placeholder="3~32 位字母、数字、下划线或短横线"
          />
        </label>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="grid gap-2 text-sm">
            <span class="text-gray-700">工号 *</span>
            <input
              v-model="employeeNo"
              type="text"
              :class="inputClass"
              placeholder="如 R201234"
            />
          </label>
          <label class="grid gap-2 text-sm">
            <span class="text-gray-700">姓名 *</span>
            <input
              v-model="name"
              type="text"
              :class="inputClass"
              placeholder="请输入姓名"
            />
          </label>
        </div>

        <label class="grid gap-2 text-sm">
          <span class="text-gray-700">密码 *</span>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              :class="inputClass"
              class="!pr-12"
              placeholder="至少 8 位"
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

        <label class="grid gap-2 text-sm">
          <span class="text-gray-700">确认密码 *</span>
          <input
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            :class="inputClass"
            placeholder="再次输入密码"
          />
        </label>

        <p v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">{{ error }}</p>

        <button type="submit" :class="primaryButtonClass" :disabled="submitting">
          {{ submitting ? '注册中…' : '注册并登录' }}
        </button>

        <RouterLink
          to="/login"
          :class="secondaryButtonClass"
          class="text-center"
        >
          返回登录
        </RouterLink>
      </form>
    </section>
  </div>
</template>
