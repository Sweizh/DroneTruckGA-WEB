<template>
  <div class="glass-card p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-bold" style="color: var(--text-primary)">配送方案</h2>
      <span
        v-if="gaState.result"
        class="text-xs px-2 py-0.5 rounded-full"
        style="background: var(--bg-tertiary); color: var(--text-muted)"
      >{{ gaState.iterations || 0 }} 次迭代</span>
    </div>

    <div v-if="gaState.result" class="max-h-[500px] overflow-y-auto p-3 rounded-lg font-mono text-xs whitespace-pre-wrap" style="background: var(--bg-input); color: var(--text-primary)">{{ planText }}</div>

    <div
      v-else
      class="flex flex-col items-center justify-center py-12 rounded-lg"
      style="color: var(--text-muted); background: var(--bg-input)"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        style="opacity: 0.5"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>
      <p class="text-sm mt-3">请先运行 GA 优化</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useConfig } from '../../composables/useConfig'
import { useGA } from '../../composables/useGA'

const { config } = useConfig()
const { gaState } = useGA()

const planText = computed(() => {
  const solution = gaState.result?.solution
  if (!solution) return ''
  const depot = config.problem.depots[0]
  const dronesPerTruck = config.vehicles.trucks.dronesPerTruck
  const launchPoints = solution.launchPoints || []
  const truckRoutes = solution.truckRoutes || []
  const droneTasks = solution.droneTasks || []

  const lines = []
  lines.push('配送方案')
  lines.push('==================================================')
  lines.push('')
  lines.push(`仓库: (${depot ? depot.x : '--'}, ${depot ? depot.y : '--'})`)
  lines.push(`发射点数量: ${launchPoints.length}`)
  lines.push(`卡车路线数: ${truckRoutes.length}`)
  lines.push('')

  truckRoutes.forEach((route, t) => {
    lines.push(`卡车 ${t + 1}:`)
    const parts = (route || []).map(v => {
      if (v < 0) {
        const lpId = -v
        const coords = launchPoints[lpId - 1]
        return `L${lpId}(${coords ? coords[0] : '--'}, ${coords ? coords[1] : '--'})`
      }
      return '仓库'
    })
    lines.push(`  路线: ${parts.join(' -> ')}`)

    let droneNum = 0
    for (let d = 0; d < dronesPerTruck; d++) {
      const droneIdx = t * dronesPerTruck + d
      const tasks = droneTasks[droneIdx]
      if (tasks && tasks.length > 0) {
        droneNum++
        lines.push(`  无人机${droneNum}: 客户 ${tasks.join(', ')}`)
      }
    }
    lines.push('')
  })

  return lines.join('\n')
})
</script>
