<template>
  <div class="glass-card p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-bold" style="color: var(--text-primary)">时间收敛曲线</h2>
      <span
        class="text-xs px-2 py-0.5 rounded-full"
        style="background: var(--bg-tertiary); color: var(--text-muted)"
      >{{ gaState.iterations || 0 }} 次迭代</span>
    </div>

    <div class="grid grid-cols-3 gap-3 mb-4">
      <div class="glass-card p-3 text-center">
        <div class="text-xs mb-1" style="color: var(--text-muted)">最优配送时间</div>
        <div
          class="text-xl font-bold"
          style="background: linear-gradient(135deg, #3b82f6, #06b6d4); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent;"
        >
          {{ gaState.bestTime != null ? gaState.bestTime.toFixed(2) + ' min' : '-- min' }}
        </div>
      </div>
      <div class="glass-card p-3 text-center">
        <div class="text-xs mb-1" style="color: var(--text-muted)">迭代次数</div>
        <div
          class="text-xl font-bold"
          style="background: linear-gradient(135deg, #10b981, #06b6d4); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent;"
        >
          {{ gaState.iterations || '--' }}
        </div>
      </div>
      <div class="glass-card p-3 text-center">
        <div class="text-xs mb-1" style="color: var(--text-muted)">运行耗时</div>
        <div
          class="text-xl font-bold"
          style="background: linear-gradient(135deg, #f59e0b, #fb923c); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent;"
        >
          {{ gaState.duration ? gaState.duration.toFixed(2) + ' s' : '-- s' }}
        </div>
      </div>
    </div>

    <ChartView :data="gaState.timeCurveData" />
  </div>
</template>

<script setup>
import { useGA } from '../../composables/useGA'
import ChartView from '../ChartView.vue'

const { gaState } = useGA()
</script>
