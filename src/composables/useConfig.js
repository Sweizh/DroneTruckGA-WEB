import { reactive, computed } from 'vue'
import { getDefaultConfig, loadConfigFromJSON, exportConfig } from '../lib/config.js'
import { loadSolomonInstance } from '../lib/solomon.js'

// 全局单例状态
const state = reactive({
  config: getDefaultConfig(),
})

export function useConfig() {
  const stats = computed(() => ({
    depots: state.config.problem.depots.length,
    customers: state.config.problem.customers.length,
    trucks: state.config.vehicles.trucks.count,
    drones: state.config.vehicles.trucks.count * state.config.vehicles.trucks.dronesPerTruck,
  }))

  function loadSolomon(name) {
    const config = loadSolomonInstance(name)
    if (config) {
      state.config = config
      return true
    }
    return false
  }

  function importConfigFromJSON(json) {
    const config = loadConfigFromJSON(json)
    state.config = config
  }

  function exportCurrentConfig() {
    return exportConfig(state.config)
  }

  function deleteCustomer(index) {
    state.config.problem.customers.splice(index, 1)
  }

  function addCustomer() {
    const customers = state.config.problem.customers
    const newId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1
    const depot = state.config.problem.depots[0] || { x: 40, y: 50 }
    const angle = Math.random() * Math.PI * 2
    const radius = 10 + Math.random() * 40
    const twStart = Math.floor(Math.random() * 1000)
    customers.push({
      id: newId,
      x: Math.round((depot.x + radius * Math.cos(angle)) * 10) / 10,
      y: Math.round((depot.y + radius * Math.sin(angle)) * 10) / 10,
      demand: (Math.floor(Math.random() * 5) + 1) * 10,
      depotId: depot.id,
      timeWindow: [twStart, twStart + 55 + Math.floor(Math.random() * 70)],
      serviceTime: 1.5,
    })
  }

  function generateRandomCustomers(count) {
    const depot = state.config.problem.depots[0] || { id: 0, x: 40, y: 50 }
    const customers = []
    let startId = state.config.problem.customers.length > 0
      ? Math.max(...state.config.problem.customers.map(c => c.id)) + 1
      : 1
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 10 + Math.random() * 40
      const twStart = Math.floor(Math.random() * 1000)
      customers.push({
        id: startId + i,
        x: Math.round((depot.x + radius * Math.cos(angle)) * 10) / 10,
        y: Math.round((depot.y + radius * Math.sin(angle)) * 10) / 10,
        demand: (Math.floor(Math.random() * 5) + 1) * 10,
        depotId: depot.id,
        timeWindow: [twStart, twStart + 55 + Math.floor(Math.random() * 70)],
        serviceTime: 1.5,
      })
    }
    state.config.problem.customers.push(...customers)
  }

  function addDepot() {
    const depots = state.config.problem.depots
    const newId = depots.length > 0 ? Math.max(...depots.map(d => d.id)) + 1 : 0
    depots.push({ id: newId, x: 40, y: 50 })
  }

  function deleteDepot(index) {
    state.config.problem.depots.splice(index, 1)
  }

  function updateCustomerField(index, field, value) {
    const c = state.config.problem.customers[index]
    if (c) {
      c[field] = field === 'id' || field === 'demand' ? parseInt(value) : parseFloat(value)
    }
  }

  function updateDepotField(index, field, value) {
    const d = state.config.problem.depots[index]
    if (d) {
      d[field] = field === 'id' ? parseInt(value) : parseFloat(value)
    }
  }

  /** 从表单数据更新 config（参数页面使用） */
  function updateParams(params) {
    if (params.trucks) Object.assign(state.config.vehicles.trucks, params.trucks)
    if (params.drones) Object.assign(state.config.vehicles.drones, params.drones)
    if (params.launchPoint) Object.assign(state.config.launchPoint, params.launchPoint)
    if (params.genetic) Object.assign(state.config.genetic, params.genetic)
    if (params.penalty) Object.assign(state.config.penalty, params.penalty)
  }

  /** 获取用于 GA 运行的 config 深拷贝 */
  function getConfigForGA() {
    return JSON.parse(JSON.stringify(state.config))
  }

  return {
    config: state.config,
    stats,
    loadSolomon,
    importConfigFromJSON,
    exportCurrentConfig,
    deleteCustomer,
    addCustomer,
    generateRandomCustomers,
    addDepot,
    deleteDepot,
    updateCustomerField,
    updateDepotField,
    updateParams,
    getConfigForGA,
  }
}
