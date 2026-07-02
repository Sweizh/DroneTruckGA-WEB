<template>
  <div class="glass-card relative overflow-hidden" style="height: 280px">
    <div ref="chartRef" class="echarts-container"></div>

    <!-- Legend overlay (top-left) -->
    <div
      v-if="hasData"
      class="absolute top-3 left-3 glass-card px-3 py-2 text-xs space-y-1 pointer-events-none"
      style="border-radius: 10px"
    >
      <div class="flex items-center gap-2">
        <span class="inline-block w-4 h-0.5" style="background: #3b82f6"></span>
        <span style="color: var(--text-secondary)">收敛曲线</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-block w-4 h-0 border-t-2 border-dashed" style="border-color: rgba(16, 185, 129, 0.75)"></span>
        <span style="color: var(--text-secondary)">最优值</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: { type: Array, default: () => [] },
})

const chartRef = ref(null)
let chart = null
let resizeObserver = null
let themeObserver = null

const hasData = computed(() => Array.isArray(props.data) && props.data.length > 0)

function getThemeColors() {
  const isDark = document.documentElement.classList.contains('dark')
  return {
    bg: isDark ? '#0a0f1e' : '#f8fafc',
    grid: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(203,213,225,0.4)',
    text: isDark ? '#64748b' : '#94a3b8',
    accent: '#3b82f6',
    bestLine: 'rgba(16, 185, 129, 0.75)',
  }
}

// 降采样：保留首、尾及均匀分布的点，总数不超过 500
function downsample(data) {
  const n = data.length
  const max = 500
  if (n <= max) {
    return data.map((v, i) => [i, v])
  }
  const result = []
  const step = (n - 1) / (max - 1)
  const seen = new Set()
  for (let i = 0; i < max - 1; i++) {
    const idx = Math.round(i * step)
    if (!seen.has(idx)) {
      seen.add(idx)
      result.push([idx, data[idx]])
    }
  }
  if (!seen.has(n - 1)) {
    result.push([n - 1, data[n - 1]])
  }
  return result
}

function getMin(data) {
  let min = Infinity
  for (const v of data) {
    if (v < min) min = v
  }
  return min === Infinity ? 0 : min
}

function buildOption() {
  const colors = getThemeColors()

  if (!hasData.value) {
    return {
      backgroundColor: 'transparent',
      animation: false,
      title: {
        text: '暂无数据，请运行 GA 优化',
        left: 'center',
        top: 'center',
        textStyle: { color: colors.text, fontSize: 14, fontWeight: 'normal' },
      },
    }
  }

  const points = downsample(props.data)
  const minVal = getMin(props.data)

  return {
    backgroundColor: 'transparent',
    animation: false,
    grid: {
      left: 52,
      right: 22,
      top: 36,
      bottom: 38,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: colors.bg,
      borderColor: colors.grid,
      textStyle: { color: colors.text, fontSize: 12 },
      formatter: (params) => {
        const p = params[0]
        return `迭代: ${p.value[0]}<br/>有效时间: ${p.value[1].toFixed(2)} min`
      },
    },
    xAxis: {
      type: 'value',
      name: '迭代次数',
      nameLocation: 'middle',
      nameGap: 26,
      nameTextStyle: { color: colors.text, fontSize: 11 },
      splitLine: { show: true, lineStyle: { color: colors.grid } },
      axisLine: { lineStyle: { color: colors.grid } },
      axisLabel: { color: colors.text, fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      name: '有效时间 (min)',
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: { color: colors.text, fontSize: 11 },
      splitLine: { show: true, lineStyle: { color: colors.grid } },
      axisLine: { lineStyle: { color: colors.grid } },
      axisLabel: { color: colors.text, fontSize: 10 },
    },
    dataZoom: [
      { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
    ],
    series: [
      {
        name: '收敛曲线',
        type: 'line',
        showSymbol: false,
        smooth: false,
        data: points,
        lineStyle: { color: colors.accent, width: 2 },
        itemStyle: { color: colors.accent },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.35)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.02)' },
          ]),
        },
        markLine: {
          symbol: 'none',
          silent: true,
          lineStyle: { color: colors.bestLine, type: 'dashed', width: 1.5 },
          label: {
            formatter: `最优: ${minVal.toFixed(1)}`,
            position: 'insideEndTop',
            color: 'rgba(16, 185, 129, 0.95)',
            fontSize: 11,
          },
          data: [{ yAxis: minVal }],
        },
      },
    ],
  }
}

function renderChart() {
  if (!chart) return
  chart.setOption(buildOption(), true)
}

watch(() => props.data, () => {
  nextTick(renderChart)
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    if (chartRef.value) {
      chart = echarts.init(chartRef.value)
      renderChart()

      resizeObserver = new ResizeObserver(() => {
        chart?.resize()
      })
      resizeObserver.observe(chartRef.value)
    }
  })

  // 监听主题切换（html.classList 变化）以重绘
  themeObserver = new MutationObserver(() => {
    nextTick(renderChart)
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
  chart?.dispose()
  chart = null
})
</script>
