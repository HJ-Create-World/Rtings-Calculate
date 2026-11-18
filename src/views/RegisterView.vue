<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import PasswordInput from '../components/PasswordInput.vue';
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
  <div class="mx-auto flex min-h-[70vh] max-w-5xl items-center">
    <div class="grid w-full gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <section class="hidden flex-col justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-slate-50 p-8 lg:flex">
        <span class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 20v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" />
            <circle cx="10" cy="7" r="3" />
            <path d="M19 8v6M16 11h6" />
          </svg>
        </span>
        <h2 class="mt-6 text-3xl font-semibold tracking-tight text-gray-900">创建账号</h2>
        <p class="mt-4 text-sm leading-6 text-gray-600">
          使用工号建立系统身份。管理员可在后台调整角色、模块权限和账号状态。
        </p>
        <div class="mt-8 grid gap-3 text-sm text-gray-700">
          <div class="rounded-xl bg-white/80 p-3 shadow-sm">首个注册账号自动成为系统管理员</div>
          <div class="rounded-xl bg-white/80 p-3 shadow-sm">后续账号默认为普通用户</div>
          <div class="rounded-xl bg-white/80 p-3 shadow-sm">普通用户默认开放数据查看与评分录入</div>
        </div>
      </section>

      <section :class="cardClass" class="p-6 md:p-8">
        <div class="mx-auto w-full max-w-lg">
          <div class="text-center lg:text-left">
            <h1 class="text-2xl font-semibold tracking-tight text-gray-900">注册账号</h1>
            <p class="mt-2 text-sm text-gray-500">请填写系统身份信息并设置登录密码</p>
          </div>

          <form class="mt-8 grid gap-5" @submit.prevent="submit">
            <label class="grid gap-2 text-sm">
              <span class="font-medium text-gray-700">账号 *</span>
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
                <span class="font-medium text-gray-700">工号 *</span>
                <input
                  v-model="employeeNo"
                  type="text"
                  :class="inputClass"
                  placeholder="如 R201234"
                />
              </label>
              <label class="grid gap-2 text-sm">
                <span class="font-medium text-gray-700">姓名 *</span>
                <input
                  v-model="name"
                  type="text"
                  :class="inputClass"
                  placeholder="请输入姓名"
                />
              </label>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="grid gap-2 text-sm">
                <span class="font-medium text-gray-700">密码 *</span>
                <PasswordInput
                  v-model="password"
                  placeholder="至少 8 位"
                  autocomplete="new-password"
                  aria-label="注册密码"
                />
              </label>
              <label class="grid gap-2 text-sm">
                <span class="font-medium text-gray-700">确认密码 *</span>
                <PasswordInput
                  v-model="confirmPassword"
                  placeholder="再次输入密码"
                  autocomplete="new-password"
                  aria-label="确认注册密码"
                />
              </label>
            </div>

            <p v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">{{ error }}</p>

            <button type="submit" :class="primaryButtonClass" :disabled="submitting">
              {{ submitting ? '注册中…' : '注册并登录' }}
            </button>

            <RouterLink to="/login" :class="secondaryButtonClass" class="text-center">
              返回登录
            </RouterLink>
          </form>
        </div>
      </section>
    </div>
  </div>
</template>
