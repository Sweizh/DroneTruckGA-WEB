<template>
  <header
    class="glass-card h-14 flex items-center justify-between px-4 rounded-none border-x-0 border-t-0 flex-shrink-0"
  >
    <!-- Left: Logo + Title -->
    <div class="flex items-center gap-3 min-w-0">
      <div
        class="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0"
        style="background: linear-gradient(135deg, #3b82f6, #06b6d4)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <path d="M15 18H9" />
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
          <circle cx="17" cy="18" r="2" />
          <circle cx="7" cy="18" r="2" />
        </svg>
      </div>
      <div class="flex flex-col leading-tight min-w-0">
        <span class="font-bold text-base truncate" style="color: var(--text-primary)">DroneTruckGA</span>
        <span class="text-[10px] truncate" style="color: var(--text-muted)">配送优化</span>
      </div>
    </div>

    <!-- Right: Controls -->
    <div class="flex items-center gap-2">
      <!-- Theme selector -->
      <select
        v-model="theme"
        @change="onThemeChange"
        class="input-field w-28 py-1.5 text-sm cursor-pointer hidden sm:block"
        title="主题"
      >
        <option value="auto">自动</option>
        <option value="dark">深色</option>
        <option value="light">浅色</option>
      </select>

      <!-- Solomon instance selector -->
      <select
        v-model="solomon"
        @change="onSolomonChange"
        class="input-field w-24 py-1.5 text-sm cursor-pointer"
        title="Solomon 算例"
      >
        <option v-for="name in solomonList" :key="name" :value="name">{{ name }}</option>
      </select>

      <!-- Import -->
      <button class="btn-secondary" @click="triggerImport" title="加载配置">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span class="hidden sm:inline">加载</span>
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        class="hidden"
        @change="onFileChange"
      />

      <!-- Export -->
      <button class="btn-secondary" @click="emit('export')" title="保存配置">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span class="hidden sm:inline">保存</span>
      </button>

      <!-- Start / Stop -->
      <button v-if="!isRunning" class="btn-primary" @click="emit('start')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <span class="hidden sm:inline">开始运行</span>
      </button>
      <button v-else class="btn-danger" @click="emit('stop')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect x="5" y="5" width="14" height="14" rx="1" />
        </svg>
        <span class="hidden sm:inline">停止</span>
      </button>

      <!-- Reset -->
      <button class="btn-ghost" @click="emit('reset')" title="重置">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      </button>

      <!-- Console toggle (mobile/tablet only) -->
      <button class="btn-ghost lg:hidden" @click="emit('toggle-console')" title="控制台">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'

defineProps({
  isRunning: { type: Boolean, default: false },
})

const emit = defineEmits(['start', 'stop', 'reset', 'import', 'export', 'load-solomon', 'toggle-console'])

const solomonList = ['C101', 'C201', 'R101', 'RC201', 'RC101', 'RC201']
const solomon = ref('C101')
const theme = ref('auto')
const fileInput = ref(null)

function applyTheme(value) {
  const isDark =
    value === 'dark' ||
    (value === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}

function onThemeChange() {
  localStorage.setItem('theme', theme.value)
  applyTheme(theme.value)
}

function onSolomonChange() {
  emit('load-solomon', solomon.value)
}

function triggerImport() {
  fileInput.value?.click()
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (file) emit('import', file)
  e.target.value = ''
}

onMounted(() => {
  theme.value = localStorage.getItem('theme') || 'auto'
  applyTheme(theme.value)
})
</script>
