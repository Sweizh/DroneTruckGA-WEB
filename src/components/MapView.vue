<template>
  <div class="glass-card relative overflow-hidden" style="height: min(340px, 42vh)">
    <div ref="chartRef" class="echarts-container"></div>

    <!-- Legend overlay -->
    <div class="absolute top-3 right-3 glass-card px-3 py-2 text-xs space-y-1 pointer-events-none" style="border-radius: 10px">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-sm" style="background: #f43f5e"></span>
        <span style="color: var(--text-secondary)">仓库</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full" style="background: #3b82f6"></span>
        <span style="color: var(--text-secondary)">客户</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="block" style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 10px solid #10b981"></span>
        <span style="color: var(--text-secondary)">发射点</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-4 h-0.5 border-t-2 border-dashed" style="border-color: #3b82f6"></span>
        <span style="color: var(--text-secondary)">卡车路线</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-4 h-0.5 border-t-2 border-dashed" style="border-color: #fb923c"></span>
        <span style="color: var(--text-secondary)">无人机路线</span>
      </div>
    </div>

    <!-- Zoom controls -->
    <div class="absolute bottom-3 left-3 flex flex-col gap-1">
      <button @click="zoomIn" class="w-9 h-9 glass-card flex items-center justify-center text-lg font-bold hover:text-accent-blue transition-colors" style="border-radius: 8px">+</button>
      <button @click="zoomOut" class="w-9 h-9 glass-card flex items-center justify-center text-lg font-bold hover:text-accent-blue transition-colors" style="border-radius: 8px">−</button>
      <button @click="resetView" class="w-9 h-9 glass-card flex items-center justify-center text-xs font-bold hover:text-accent-blue transition-colors" style="border-radius: 8px">R</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  depots: { type: Array, default: () => [] },
  customers: { type: Array, default: () => [] },
  solution: { type: Object, default: null },
  customerMap: { type: Map, default: () => new Map() },
})

const chartRef = ref(null)
let chart = null
let resizeObserver = null
let themeObserver = null

function getThemeColors() {
  const style = getComputedStyle(document.documentElement)
  const isDark = document.documentElement.classList.contains('dark')
  return {
    bg: isDark ? '#0a0f1e' : '#f8fafc',
    grid: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(203,213,225,0.4)',
    text: isDark ? '#64748b' : '#94a3b8',
    depot: '#f43f5e',
    customer: '#3b82f6',
    launch: '#10b981',
    truckRoute: '#3b82f6',
    droneRoute: '#fb923c',
  }
}

function computeRoutes() {
  const truckRoutes = []
  const droneRoutes = []

  if (!props.solution || !props.solution.launchPoints) {
    return { truckRoutes, droneRoutes }
  }

  const sol = props.solution
  const depot = props.depots[0]
  if (!depot) return { truckRoutes, droneRoutes }

  // Truck routes: depot → launch points → depot
  for (const route of sol.truckRoutes) {
    if (route.length <= 2) continue
    const points = []
    for (const id of route) {
      if (id >= 0) {
        // Depot
        points.push([depot.x, depot.y])
      } else {
        const lpIdx = -id - 1
        if (lpIdx < sol.launchPoints.length) {
          const lp = sol.launchPoints[lpIdx]
          points.push([lp[0], lp[1]])
        }
      }
    }
    if (points.length >= 2) {
      truckRoutes.push({ coords: points })
    }
  }

  // Drone routes: launch point → customer → launch point
  for (let droneIdx = 0; droneIdx < sol.droneTasks.length; droneIdx++) {
    const tasks = sol.droneTasks[droneIdx]
    if (!tasks || tasks.length === 0) continue

    const lpIdx = sol.droneToLaunchPoint[droneIdx]
    if (lpIdx < 0 || lpIdx >= sol.launchPoints.length) continue

    const lp = sol.launchPoints[lpIdx]
    for (const customerId of tasks) {
      const customer = props.customerMap.get(customerId)
      if (customer) {
        droneRoutes.push({
          coords: [
            [lp[0], lp[1]],
            [customer.x, customer.y],
            [lp[0], lp[1]],
          ],
        })
      }
    }
  }

  return { truckRoutes, droneRoutes }
}

function buildOption() {
  const colors = getThemeColors()
  const { truckRoutes, droneRoutes } = computeRoutes()

  const hasData = props.depots.length > 0 || props.customers.length > 0

  // 计算坐标范围
  let minX = 0, maxX = 100, minY = 0, maxY = 100
  if (hasData) {
    minX = Infinity; maxX = -Infinity; minY = Infinity; maxY = -Infinity
    for (const d of props.depots) {
      minX = Math.min(minX, d.x); maxX = Math.max(maxX, d.x)
      minY = Math.min(minY, d.y); maxY = Math.max(maxY, d.y)
    }
    for (const c of props.customers) {
      minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x)
      minY = Math.min(minY, c.y); maxY = Math.max(maxY, c.y)
    }
    if (props.solution && props.solution.launchPoints) {
      for (const lp of props.solution.launchPoints) {
        minX = Math.min(minX, lp[0]); maxX = Math.max(maxX, lp[0])
        minY = Math.min(minY, lp[1]); maxY = Math.max(maxY, lp[1])
      }
    }
    const padX = (maxX - minX) * 0.1 || 5
    const padY = (maxY - minY) * 0.1 || 5
    minX -= padX; maxX += padX
    minY -= padY; maxY += padY
  }

  const launchPoints = props.solution?.launchPoints || []

  const series = []

  // 空状态提示
  if (!hasData) {
    return {
      title: {
        text: '请加载算例或添加客户',
        left: 'center',
        top: 'center',
        textStyle: { color: colors.text, fontSize: 14, fontWeight: 'normal' },
      },
    }
  }

  // Truck routes (lines)
  if (truckRoutes.length > 0) {
    series.push({
      name: '卡车路线',
      type: 'lines',
      coordinateSystem: 'cartesian2d',
      data: truckRoutes,
      polyline: true,
      lineStyle: {
        color: colors.truckRoute,
        width: 2,
        type: 'dashed',
        opacity: 0.7,
      },
      z: 1,
    })
  }

  // Drone routes (lines)
  if (droneRoutes.length > 0) {
    series.push({
      name: '无人机路线',
      type: 'lines',
      coordinateSystem: 'cartesian2d',
      data: droneRoutes,
      polyline: true,
      lineStyle: {
        color: colors.droneRoute,
        width: 1.5,
        type: 'dashed',
        opacity: 0.5,
      },
      z: 1,
    })
  }

  // Depots (scatter)
  series.push({
    name: '仓库',
    type: 'scatter',
    data: props.depots.map(d => ({
      value: [d.x, d.y],
      name: `仓库${d.id}`,
    })),
    symbolSize: 14,
    symbol: 'rect',
    itemStyle: {
      color: colors.depot,
      borderColor: '#fff',
      borderWidth: 1.5,
      shadowBlur: 8,
      shadowColor: colors.depot,
    },
    label: {
      show: true,
      position: 'top',
      formatter: (p) => `W${p.data.name.replace('仓库', '')}`,
      color: colors.text,
      fontSize: 10,
    },
    z: 10,
  })

  // Customers (scatter)
  series.push({
    name: '客户',
    type: 'scatter',
    data: props.customers.map(c => ({
      value: [c.x, c.y],
      name: `客户${c.id}`,
    })),
    symbolSize: 8,
    symbol: 'circle',
    itemStyle: {
      color: colors.customer,
      borderColor: '#fff',
      borderWidth: 0.5,
      opacity: 0.85,
    },
    z: 5,
  })

  // Launch points (scatter)
  if (launchPoints.length > 0) {
    series.push({
      name: '发射点',
      type: 'scatter',
      data: launchPoints.map((lp, i) => ({
        value: [lp[0], lp[1]],
        name: `L${i + 1}`,
      })),
      symbolSize: 12,
      symbol: 'triangle',
      itemStyle: {
        color: colors.launch,
        borderColor: '#fff',
        borderWidth: 1,
        shadowBlur: 6,
        shadowColor: colors.launch,
      },
      label: {
        show: true,
        position: 'bottom',
        formatter: (p) => p.data.name,
        color: colors.text,
        fontSize: 9,
      },
      z: 8,
    })
  }

  return {
    backgroundColor: 'transparent',
    animation: false,
    tooltip: {
      trigger: 'item',
      backgroundColor: colors.bg,
      borderColor: colors.grid,
      textStyle: { color: colors.text, fontSize: 12 },
      formatter: (p) => {
        if (p.seriesName === '卡车路线' || p.seriesName === '无人机路线') return ''
        return `<b>${p.data.name}</b><br/>坐标: (${p.value[0].toFixed(1)}, ${p.value[1].toFixed(1)})`
      },
    },
    grid: {
      left: 10,
      right: 10,
      top: 10,
      bottom: 10,
      containLabel: false,
    },
    xAxis: {
      type: 'value',
      min: minX,
      max: maxX,
      show: false,
    },
    yAxis: {
      type: 'value',
      min: minY,
      max: maxY,
      inverse: true,
      show: false,
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'none',
        zoomOnMouseWheel: true,
        moveOnMouseWheel: false,
        moveOnMouseMove: true,
      },
      {
        type: 'inside',
        yAxisIndex: 0,
        filterMode: 'none',
        zoomOnMouseWheel: false,
        moveOnMouseWheel: true,
        moveOnMouseMove: false,
      },
    ],
    series,
  }
}

function renderChart() {
  if (!chart) return
  chart.setOption(buildOption(), true)
}

function zoomIn() {
  if (!chart) return
  const option = chart.getOption()
  const xZoom = option.dataZoom?.[0]
  const yZoom = option.dataZoom?.[1]
  if (xZoom) {
    const range = xZoom.end - xZoom.start
    const center = (xZoom.start + xZoom.end) / 2
    const newRange = Math.max(5, range * 0.7)
    chart.dispatchAction({ type: 'dataZoom', dataIndex: 0, start: center - newRange / 2, end: center + newRange / 2 })
  }
  if (yZoom) {
    const range = yZoom.end - yZoom.start
    const center = (yZoom.start + yZoom.end) / 2
    const newRange = Math.max(5, range * 0.7)
    chart.dispatchAction({ type: 'dataZoom', dataIndex: 1, start: center - newRange / 2, end: center + newRange / 2 })
  }
}

function zoomOut() {
  if (!chart) return
  chart.dispatchAction({ type: 'dataZoom', start: 0, end: 100 })
}

function resetView() {
  if (!chart) return
  chart.dispatchAction({ type: 'dataZoom', start: 0, end: 100 })
  renderChart()
}

watch(() => [props.depots, props.customers, props.solution, props.customerMap], () => {
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
