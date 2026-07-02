<template>
  <footer
    class="glass-card h-7 flex items-center justify-between px-4 text-xs rounded-none border-x-0 border-b-0 flex-shrink-0"
  >
    <!-- Left: status + counts -->
    <div class="flex items-center gap-2 min-w-0">
      <span class="status-dot" :class="{ 'status-dot--running': isRunning }"></span>
      <span style="color: var(--text-secondary)">{{ statusText }}</span>
      <span style="color: var(--border-secondary)">|</span>
      <span class="hidden xs:inline" style="color: var(--text-muted)">仓库:<strong style="color: var(--text-secondary)">{{ stats.depots }}</strong></span>
      <span style="color: var(--text-muted)">客户:<strong style="color: var(--text-secondary)">{{ stats.customers }}</strong></span>
      <span class="hidden sm:inline" style="color: var(--text-muted)">卡车:<strong style="color: var(--text-secondary)">{{ stats.trucks }}</strong></span>
      <span class="hidden sm:inline" style="color: var(--text-muted)">无人机:<strong style="color: var(--text-secondary)">{{ stats.drones }}</strong></span>
    </div>

    <!-- Center: iteration -->
    <div class="hidden md:flex items-center gap-1" style="color: var(--text-muted)">
      <span>迭代:</span>
      <strong style="color: var(--accent)">{{ currentGen }}</strong>
      <span>/</span>
      <strong style="color: var(--text-secondary)">{{ maxGen }}</strong>
    </div>

    <!-- Right: best time + version -->
    <div class="flex items-center gap-2 flex-shrink-0">
      <span style="color: var(--text-muted)">最优时间:</span>
      <strong v-if="bestTime != null" style="color: var(--accent-emerald)">{{ bestTime.toFixed(2) }} min</strong>
      <strong v-else style="color: var(--text-muted)">-- min</strong>
      <span style="color: var(--border-secondary)">|</span>
      <span class="hidden sm:inline" style="color: var(--text-muted)">DroneTruckGA v5.0</span>
    </div>
  </footer>
</template>

<script setup>
defineProps({
  stats: {
    type: Object,
    default: () => ({ depots: 0, customers: 0, trucks: 0, drones: 0 }),
  },
  isRunning: { type: Boolean, default: false },
  statusText: { type: String, default: '就绪' },
  progress: { type: Number, default: 0 },
  currentGen: { type: Number, default: 0 },
  maxGen: { type: Number, default: 0 },
  bestTime: { type: Number, default: null },
})
</script>
