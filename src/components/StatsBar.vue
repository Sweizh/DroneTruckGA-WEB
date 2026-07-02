<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
    <div
      v-for="card in cards"
      :key="card.label"
      class="glass-card p-3 flex items-center gap-2.5"
    >
      <div
        class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        :style="{ background: card.bg, color: card.color }"
      >
        <svg
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          v-html="card.icon"
        ></svg>
      </div>
      <div class="min-w-0">
        <div class="text-lg font-bold leading-tight truncate" style="color: var(--text-primary)">
          {{ card.value }}
        </div>
        <div class="text-xs leading-tight" style="color: var(--text-muted)">
          {{ card.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  stats: { type: Object, default: () => ({ depots: 0, customers: 0, trucks: 0, drones: 0 }) },
  bestTime: { type: Number, default: null },
})

const ICONS = {
  building: '<path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12"/><path d="M6 14h12"/><path d="M6 10h12"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  triangle: '<path d="M13.73 4a2 2 0 0 0-3.46 0L2.46 18a2 2 0 0 0 1.73 3h15.62a2 2 0 0 0 1.73-3Z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
}

const cards = computed(() => {
  const s = props.stats || {}
  return [
    { label: '仓库数', value: s.depots ?? 0, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', icon: ICONS.building },
    { label: '客户数', value: s.customers ?? 0, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: ICONS.users },
    { label: '卡车数', value: s.trucks ?? 0, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', icon: ICONS.truck },
    { label: '无人机数', value: s.drones ?? 0, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: ICONS.triangle },
    {
      label: '最优时间',
      value: props.bestTime != null ? props.bestTime.toFixed(2) : '--',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
      icon: ICONS.clock,
    },
  ]
})
</script>
