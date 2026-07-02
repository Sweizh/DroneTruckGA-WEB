<template>
  <div class="glass-card p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-bold" style="color: var(--text-primary)">遗传算法参数</h2>
      <span
        class="text-xs px-2 py-0.5 rounded-full"
        style="background: var(--bg-tertiary); color: var(--text-muted)"
      >GA</span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">种群规模</label>
        <input type="number" min="1" class="input-field" v-model.number="config.genetic.populationSize" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">最大迭代次数</label>
        <input type="number" min="1" class="input-field" v-model.number="config.genetic.maxGenerations" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">交叉率</label>
        <input type="number" min="0" max="1" step="0.05" class="input-field" v-model.number="config.genetic.crossoverRate" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">变异率</label>
        <input type="number" min="0" max="1" step="0.05" class="input-field" v-model.number="config.genetic.mutationRate" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">精英率</label>
        <input type="number" min="0" max="1" step="0.05" class="input-field" v-model.number="config.genetic.eliteRate" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1" style="color: var(--text-secondary)">锦标赛规模</label>
        <input type="number" min="1" class="input-field" v-model.number="config.genetic.tournamentSize" />
      </div>
    </div>

    <div class="flex items-start gap-2 mt-3 text-xs" style="color: var(--accent-amber)">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="mt-0.5 shrink-0"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
      <span>注意: 种群规模和迭代次数过大会增加计算时间</span>
    </div>
  </div>
</template>

<script setup>
import { useConfig } from '../../composables/useConfig'

const { config } = useConfig()
</script>
