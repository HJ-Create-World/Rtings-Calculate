<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useEvaluationDraft } from '../composables/useEvaluationDraft';
import { downloadImportTemplate, parseImportWorkbook } from '../utils/excelTemplate';
import type { ImportValidation } from '../types/evaluation';
import { cardClass, mutedTextClass, primaryButtonClass, secondaryButtonClass } from '../utils/ui';

const router = useRouter();
const { replaceDraft } = useEvaluationDraft();
const validation = ref<ImportValidation | null>(null);
const fileName = ref('');
const importing = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

async function handleFile(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  fileName.value = file.name;
  validation.value = await parseImportWorkbook(file);
}

function chooseFile() {
  fileInputRef.value?.click();
}

function importDraft() {
  const next = validation.value?.draft;
  if (!next || !validation.value?.valid) return;
  importing.value = true;
  replaceDraft(next);
  router.push('/entry');
}
</script>

<template>
  <section :class="cardClass" class="mb-6 p-6">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-xl font-semibold tracking-tight text-gray-900">第 1 步：下载导入模板</h2>
        <p :class="['mt-2 text-sm', mutedTextClass]">
          模板包含产品信息、测试输入和导入说明；节点ID已预填，避免手写错位
        </p>
      </div>
      <button :class="primaryButtonClass" @click="downloadImportTemplate">下载模板</button>
    </div>
  </section>

  <section :class="cardClass" class="mb-6 p-6">
    <h2 class="text-xl font-semibold tracking-tight text-gray-900">第 2 步：选择 Excel 文件</h2>
    <div class="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <input
        ref="fileInputRef"
        type="file"
        accept=".xlsx,.xls"
        class="hidden"
        @change="handleFile"
      />
      <div>
        <p class="text-sm text-gray-700">{{ fileName || '尚未选择文件' }}</p>
        <p :class="['mt-1 text-xs', mutedTextClass]">支持 .xlsx / .xls，文件只在本机浏览器中解析</p>
      </div>
      <button :class="secondaryButtonClass" @click="chooseFile">选择文件</button>
    </div>
  </section>

  <section v-if="validation" :class="cardClass" class="p-6">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-xl font-semibold tracking-tight text-gray-900">第 3 步：检查导入结果</h2>
        <p :class="['mt-2 text-sm', mutedTextClass]">
          读取到 {{ validation.valueCount }} 个测试值 ·
          {{ validation.valid ? '校验通过' : `发现 ${validation.errors.length} 个错误` }}
        </p>
      </div>
      <button
        :class="primaryButtonClass"
        :disabled="!validation.valid || importing"
        @click="importDraft"
      >
        导入并进入录入页
      </button>
    </div>

    <div v-if="validation.errors.length" class="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
      <p class="font-medium">错误</p>
      <ul class="mt-2 list-disc space-y-1 pl-5">
        <li v-for="error in validation.errors" :key="error">{{ error }}</li>
      </ul>
    </div>

    <div v-if="validation.warnings.length" class="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
      <p class="font-medium">警告</p>
      <ul class="mt-2 list-disc space-y-1 pl-5">
        <li v-for="warning in validation.warnings" :key="warning">{{ warning }}</li>
      </ul>
    </div>

    <div v-if="validation.draft" class="mt-4 grid gap-3 text-sm text-gray-700 md:grid-cols-2">
      <p>品牌：{{ validation.draft.brand || '—' }}</p>
      <p>型号：{{ validation.draft.model || '—' }}</p>
      <p>测试日期：{{ validation.draft.testDate || '—' }}</p>
      <p>测试工程师：{{ validation.draft.engineer || '—' }}</p>
    </div>
  </section>
</template>
