<template>
  <div class="glass-card rounded-none border-y-0 border-r-0 w-72 flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-2.5">
      <span class="text-sm font-semibold" style="color: var(--text-primary)">控制台输出</span>
      <div class="flex items-center gap-1">
        <button class="btn-ghost" title="清空" @click="$emit('clear')">
          <svg
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
        <button v-if="drawerMode" class="btn-ghost" title="关闭" @click="$emit('close')">
          <svg
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Progress -->
    <div class="px-3 pb-2">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      <div class="flex items-center justify-between mt-1.5 text-xs" style="color: var(--text-muted)">
        <span>迭代: {{ currentGen }}/{{ maxGen }}</span>
        <span>{{ progress.toFixed(1) }}%</span>
      </div>
    </div>

    <!-- Console content -->
    <div ref="consoleRef" class="flex-1 overflow-y-auto px-3 pb-3 console-scroll">
      <div
        v-for="(log, i) in logs"
        :key="i"
        class="text-xs font-mono leading-relaxed break-all"
        :style="{ color: typeColor[log.type] || typeColor.info }"
      >
        [{{ log.time }}] {{ log.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  isRunning: { type: Boolean, default: false },
  progress: { type: Number, default: 0 },
  currentGen: { type: Number, default: 0 },
  maxGen: { type: Number, default: 0 },
  logs: { type: Array, default: () => [] },
  open: { type: Boolean, default: true },
  drawerMode: { type: Boolean, default: false },
})

defineEmits(['clear', 'close'])

const consoleRef = ref(null)

const typeColor = {
  info: 'var(--accent)',
  success: 'var(--accent-emerald)',
  warning: 'var(--accent-amber)',
  error: 'var(--accent-rose)',
}

watch(
  () => props.logs.length,
  () => {
    nextTick(() => {
      if (consoleRef.value) {
        consoleRef.value.scrollTop = consoleRef.value.scrollHeight
      }
    })
  }
)
</script>
