import { reactive } from 'vue'
import { GARunner } from '../lib/ga.js'
import { ProblemModel } from '../lib/problem.js'

// 全局单例状态
const state = reactive({
  isRunning: false,
  progress: 0,
  currentGen: 0,
  maxGen: 0,
  bestTime: null,
  logs: [],
  routeData: null,       // GA 返回的 solution（地图用）
  timeCurveData: [],     // 收敛曲线数据
  result: null,          // GA 完成后的最终结果
  duration: 0,
  iterations: 0,
})

let runner = null
let renderScheduled = false
let pendingRoute = null
let pendingTimeCurve = null

export function useGA() {

  function addLog(message, type = 'info') {
    const time = new Date().toLocaleTimeString()
    state.logs.push({ time, message, type })
    // 限制日志数量，防止内存溢出
    if (state.logs.length > 500) {
      state.logs.splice(0, state.logs.length - 500)
    }
  }

  function clearLogs() {
    state.logs = []
  }

  function scheduleRender() {
    if (renderScheduled) return
    renderScheduled = true
    requestAnimationFrame(() => {
      renderScheduled = false
      if (pendingRoute) {
        state.routeData = pendingRoute
        pendingRoute = null
      }
      if (pendingTimeCurve) {
        state.timeCurveData = pendingTimeCurve
        pendingTimeCurve = null
      }
    })
  }

  async function startGA(config) {
    if (state.isRunning) return

    if (!config.problem.customers.length) {
      addLog('请先添加客户', 'error')
      return { ok: false, error: 'no-customers' }
    }
    if (!config.problem.depots.length) {
      addLog('请先添加仓库', 'error')
      return { ok: false, error: 'no-depots' }
    }

    const model = new ProblemModel(config)
    runner = new GARunner(config)

    runner.onLog = (msg, type) => addLog(msg, type)
    runner.onProgress = (progress, gen, maxGen, time) => {
      state.progress = progress
      state.currentGen = gen
      state.maxGen = maxGen
      state.bestTime = time
    }
    runner.onRouteUpdate = (solution) => {
      pendingRoute = solution
      scheduleRender()
    }
    runner.onTimeCurveUpdate = (timeCurve) => {
      pendingTimeCurve = timeCurve
      scheduleRender()
    }
    runner.onComplete = (result) => {
      state.result = result
      state.bestTime = result.time
      state.duration = result.duration
      state.iterations = result.iterations
      state.timeCurveData = result.timeCurve
      state.routeData = result.solution
      addLog(`优化完成! 耗时: ${result.duration.toFixed(2)}s`, 'success')
      addLog(`最优配送时间: ${result.time.toFixed(2)} min`, 'success')
    }

    state.isRunning = true
    state.progress = 0
    state.currentGen = 0
    state.result = null
    state.routeData = null
    state.timeCurveData = []

    addLog('开始遗传算法优化...', 'info')
    addLog(`种群规模: ${config.genetic.populationSize}`, 'info')
    addLog(`最大迭代: ${config.genetic.maxGenerations}`, 'info')
    addLog(`发射点数量: ${model.getLaunchPointCount()}`, 'info')

    try {
      await runner.run()
      return { ok: true }
    } catch (err) {
      addLog('GA 运行错误: ' + (err && err.message ? err.message : err), 'error')
      return { ok: false, error: err.message }
    } finally {
      state.isRunning = false
    }
  }

  function stopGA() {
    if (runner) {
      runner.stop()
      addLog('已停止优化', 'warning')
    }
    state.isRunning = false
  }

  function resetGA() {
    stopGA()
    state.progress = 0
    state.currentGen = 0
    state.maxGen = 0
    state.bestTime = null
    state.result = null
    state.routeData = null
    state.timeCurveData = []
    state.duration = 0
    state.iterations = 0
    addLog('已重置', 'info')
  }

  return {
    gaState: state,
    startGA,
    stopGA,
    resetGA,
    addLog,
    clearLogs,
  }
}
