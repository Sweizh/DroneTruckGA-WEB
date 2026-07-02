<template>
  <div class="glass-card p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-bold" style="color: var(--text-primary)">卡车参数</h2>
      <span
        class="text-xs px-2 py-0.5 rounded-full"
        style="background: var(--bg-tertiary); color: var(--text-muted)"
      >{{ stats.trucks }} 辆</span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">卡车数量</label>
        <input type="number" min="1" class="input-field" v-model.number="config.vehicles.trucks.count" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">载重(kg)</label>
        <input type="number" min="0" class="input-field" v-model.number="config.vehicles.trucks.capacity" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">速度(km/h)</label>
        <input type="number" min="0" class="input-field" v-model.number="config.vehicles.trucks.speed" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">每车无人机数</label>
        <input type="number" min="0" class="input-field" v-model.number="config.vehicles.trucks.dronesPerTruck" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">最大续航(km)</label>
        <input type="number" min="0" class="input-field" v-model.number="config.vehicles.trucks.range" />
      </div>
    </div>

    <div
      class="rounded-lg p-3 mt-3 text-xs"
      style="background: var(--bg-tertiary); color: var(--text-secondary)"
    >
      无人机总数 = 卡车数 × 每车无人机数 = <span style="color: var(--accent-cyan); font-weight: 600">{{ stats.drones }}</span> 架
    </div>
  </div>
</template>

<script setup>
import { useConfig } from '../../composables/useConfig'

const { config, stats } = useConfig()
</script>
