<template>
  <div class="glass-card p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-bold" style="color: var(--text-primary)">惩罚参数</h2>
      <span
        class="text-xs px-2 py-0.5 rounded-full"
        style="background: var(--bg-tertiary); color: var(--text-muted)"
      >{{ config.penalty.enabled ? '已启用' : '已禁用' }}</span>
    </div>

    <label
      class="flex items-center gap-2 mb-4 cursor-pointer"
      style="color: var(--text-primary)"
    >
      <input
        type="checkbox"
        v-model="config.penalty.enabled"
        class="w-4 h-4 rounded"
        style="accent-color: var(--accent)"
      />
      <span class="text-sm font-semibold">启用惩罚机制</span>
    </label>

    <div
      :class="[
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 transition-opacity',
        config.penalty.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'
      ]"
    >
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">早到惩罚权重</label>
        <input type="number" min="0" step="0.1" class="input-field" v-model.number="config.penalty.timeWindowEarly" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">晚到惩罚权重</label>
        <input type="number" min="0" step="0.1" class="input-field" v-model.number="config.penalty.timeWindowLate" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">无人机续航惩罚</label>
        <input type="number" min="0" step="0.1" class="input-field" v-model.number="config.penalty.droneRangePenalty" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">无人机载重惩罚</label>
        <input type="number" min="0" step="0.1" class="input-field" v-model.number="config.penalty.dronePayloadPenalty" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">卡车续航惩罚</label>
        <input type="number" min="0" step="0.1" class="input-field" v-model.number="config.penalty.truckRangeTimePenalty" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">距离惩罚权重</label>
        <input type="number" min="0" step="0.1" class="input-field" v-model.number="config.penalty.distancePenalty" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useConfig } from '../../composables/useConfig'

const { config } = useConfig()
</script>
