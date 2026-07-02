<template>
  <div class="glass-card p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-bold" style="color: var(--text-primary)">无人机参数</h2>
      <span
        class="text-xs px-2 py-0.5 rounded-full"
        style="background: var(--bg-tertiary); color: var(--text-muted)"
      >{{ stats.drones }} 架</span>
    </div>

    <div
      class="rounded-lg p-3 mb-3 text-sm"
      style="background: var(--bg-tertiary); color: var(--text-secondary)"
    >
      无人机总数 = 卡车数 × 每车无人机数 = <span style="color: var(--accent-cyan); font-weight: 600">{{ stats.drones }}</span> 架
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">续航(km)</label>
        <input type="number" min="0" class="input-field" v-model.number="config.vehicles.drones.range" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">速度(km/h)</label>
        <input type="number" min="0" class="input-field" v-model.number="config.vehicles.drones.speed" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">最大载重(kg)</label>
        <input type="number" min="0" class="input-field" v-model.number="config.vehicles.drones.maxPayload" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">充电时间(min)</label>
        <input type="number" min="0" class="input-field" v-model.number="config.vehicles.drones.rechargeTime" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">服务时间(min)</label>
        <input type="number" min="0" class="input-field" v-model.number="config.vehicles.drones.serviceTime" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useConfig } from '../../composables/useConfig'

const { config, stats } = useConfig()
</script>
