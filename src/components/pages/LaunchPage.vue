<template>
  <div class="glass-card p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-bold" style="color: var(--text-primary)">发射点配置</h2>
      <span
        class="text-xs px-2 py-0.5 rounded-full"
        style="background: var(--bg-tertiary); color: var(--text-muted)"
      >K-means</span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">发射点数量(0=自动)</label>
        <input type="number" min="0" class="input-field" v-model.number="config.launchPoint.launchPointCount" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">变异范围(km)</label>
        <input type="number" min="0" step="0.1" class="input-field" v-model.number="config.launchPoint.mutationRange" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">历史影响系数</label>
        <input type="number" min="0" max="1" step="0.05" class="input-field" v-model.number="config.launchPoint.historyInfluence" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">K-means最大迭代</label>
        <input type="number" min="1" class="input-field" v-model.number="config.launchPoint.kmeansMaxIterations" />
      </div>
    </div>

    <div
      class="rounded-lg p-3 mt-3 text-xs"
      style="background: var(--bg-tertiary); color: var(--text-secondary)"
    >
      当发射点数量为 0 时，系统将根据客户分布与卡车数量自动计算发射点数量。
    </div>
  </div>
</template>

<script setup>
import { useConfig } from '../../composables/useConfig'

const { config } = useConfig()
</script>
