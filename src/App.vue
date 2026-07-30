<template>
  <div class="h-screen flex flex-col overflow-hidden" style="background: var(--bg-primary)">
    <!-- Top Bar -->
    <TopBar
      :is-running="gaState.isRunning"
      @start="handleStart"
      @stop="handleStop"
      @reset="handleReset"
      @import="handleImport"
      @export="handleExport"
      @load-solomon="handleLoadSolomon"
      @toggle-console="consoleOpen = !consoleOpen"
    />

    <!-- Main Content Area -->
    <div class="flex-1 flex overflow-hidden min-h-0">
      <!-- Sidebar (desktop) -->
      <Sidebar :active-page="activePage" @navigate="navigateTo" class="hidden md:flex" />

      <!-- Center: Map + Stats + Page Content（整体上下滑动） -->
      <main class="flex-1 overflow-y-auto p-2.5 min-w-0">
        <div class="flex flex-col gap-2.5">
          <!-- Map -->
          <MapView
            :depots="config.problem.depots"
            :customers="config.problem.customers"
            :solution="gaState.routeData"
            :customer-map="customerMap"
          />

          <!-- Stats Bar -->
          <StatsBar :stats="stats" :best-time="gaState.bestTime" />

          <!-- Page Content -->
          <KeepAlive>
            <component :is="currentPageComponent" />
          </KeepAlive>
        </div>
      </main>

      <!-- Console Panel -->
      <ConsolePanel
        :is-running="gaState.isRunning"
        :progress="gaState.progress"
        :current-gen="gaState.currentGen"
        :max-gen="gaState.maxGen"
        :logs="gaState.logs"
        :open="consoleOpen"
        @clear="clearLogs"
        @close="consoleOpen = false"
        class="hidden lg:flex"
      />

      <!-- Console Drawer Backdrop (tablet/mobile) -->
      <div
        v-if="consoleOpen"
        class="lg:hidden fixed inset-0 top-14 bg-black/50 backdrop-blur-sm z-40"
        @click="consoleOpen = false"
      />
      <!-- Console Drawer (tablet/mobile) -->
      <ConsolePanel
        v-if="consoleOpen"
        :is-running="gaState.isRunning"
        :progress="gaState.progress"
        :current-gen="gaState.currentGen"
        :max-gen="gaState.maxGen"
        :logs="gaState.logs"
        :open="true"
        :drawer-mode="true"
        @clear="clearLogs"
        @close="consoleOpen = false"
        class="lg:hidden fixed right-0 top-14 bottom-0 w-[85vw] max-w-sm z-50"
      />
    </div>

    <!-- Status Bar -->
    <StatusBar
      :stats="stats"
      :is-running="gaState.isRunning"
      :status-text="statusText"
      :progress="gaState.progress"
      :current-gen="gaState.currentGen"
      :max-gen="gaState.maxGen"
      :best-time="gaState.bestTime"
    />

    <!-- Mobile Tab Bar -->
    <MobileTabBar :active-page="activePage" @navigate="navigateTo" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfig } from './composables/useConfig'
import { useGA } from './composables/useGA'
import TopBar from './components/TopBar.vue'
import Sidebar from './components/Sidebar.vue'
import StatsBar from './components/StatsBar.vue'
import MapView from './components/MapView.vue'
import ConsolePanel from './components/ConsolePanel.vue'
import StatusBar from './components/StatusBar.vue'
import MobileTabBar from './components/MobileTabBar.vue'
import CustomerPage from './components/pages/CustomerPage.vue'
import DepotPage from './components/pages/DepotPage.vue'
import TruckPage from './components/pages/TruckPage.vue'
import DronePage from './components/pages/DronePage.vue'
import LaunchPage from './components/pages/LaunchPage.vue'
import GAPage from './components/pages/GAPage.vue'
import PenaltyPage from './components/pages/PenaltyPage.vue'
import ResultPage from './components/pages/ResultPage.vue'
import PlanPage from './components/pages/PlanPage.vue'

const { config, stats, loadSolomon, importConfigFromJSON, exportCurrentConfig, getConfigForGA } = useConfig()
const { gaState, startGA, stopGA, resetGA, clearLogs, addLog } = useGA()

const activePage = ref('customer')
const consoleOpen = ref(false)

const pageMap = {
  customer: CustomerPage,
  depot: DepotPage,
  truck: TruckPage,
  drone: DronePage,
  launch: LaunchPage,
  ga: GAPage,
  penalty: PenaltyPage,
  result: ResultPage,
  plan: PlanPage,
}

const currentPageComponent = computed(() => pageMap[activePage.value] || CustomerPage)

const statusText = computed(() => {
  if (gaState.isRunning) return `运行中 ${gaState.progress.toFixed(1)}%`
  if (gaState.result) return '优化完成'
  return '就绪'
})

const customerMap = computed(() => {
  const map = new Map()
  for (const c of config.problem.customers) {
    map.set(c.id, c)
  }
  return map
})

function navigateTo(page) {
  activePage.value = page
}

async function handleStart() {
  // 自动跳转到收敛曲线页面
  activePage.value = 'result'
  const configForGA = getConfigForGA()
  await startGA(configForGA)
}

function handleStop() {
  stopGA()
}

function handleReset() {
  resetGA()
}

function handleLoadSolomon(name) {
  if (loadSolomon(name)) {
    addLog(`已加载 Solomon 算例: ${name}`, 'success')
  }
}

function handleImport(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      importConfigFromJSON(e.target.result)
      addLog('配置导入成功', 'success')
    } catch (err) {
      addLog('配置导入失败: ' + err.message, 'error')
    }
  }
  reader.readAsText(file)
}

function handleExport() {
  const json = exportCurrentConfig()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'config.json'
  a.click()
  URL.revokeObjectURL(url)
  addLog('配置已导出', 'success')
}

onMounted(() => {
  loadSolomon('C101')
  addLog('系统初始化完成', 'success')
})
</script>
