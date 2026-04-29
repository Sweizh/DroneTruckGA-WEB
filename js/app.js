/**
 * 主应用 - 整合所有模块
 */

class App {
    constructor() {
        this.config = getDefaultConfig();
        this.ui = new UIManager();
        this.mapCanvas = new MapCanvas('map-canvas');
        this.chartCanvas = new ChartCanvas('chart-canvas');
        this.ga = null;
        this.timeCurveData = [];
        
        this.init();
    }
    
    init() {
        this.initEventListeners();
        
        // 默认载入 C101 算例
        this.loadSolomon('C101');
        
        // 页面切换回调
        this.ui.onPageChange = (page) => {
            this.updateChartIfVisible();
        };
        
        this.ui.addLog('系统初始化完成', 'success');
        this.ui.setStatus('就绪');
    }
    
    initEventListeners() {
        document.getElementById('btn-import').addEventListener('click', () => this.importConfig());
        document.getElementById('btn-export').addEventListener('click', () => this.exportConfig());
        document.getElementById('file-import').addEventListener('change', (e) => this.handleFileImport(e));
        
        document.getElementById('solomon-select').addEventListener('change', (e) => this.loadSolomon(e.target.value));
        
        document.getElementById('btn-zoom-in').addEventListener('click', () => this.mapCanvas.zoomIn());
        document.getElementById('btn-zoom-out').addEventListener('click', () => this.mapCanvas.zoomOut());
        document.getElementById('btn-zoom-reset').addEventListener('click', () => this.mapCanvas.resetView());
        
        document.getElementById('btn-start').addEventListener('click', () => this.startGA());
        document.getElementById('btn-stop').addEventListener('click', () => this.stopGA());
        document.getElementById('btn-reset').addEventListener('click', () => this.resetGA());
        
        document.getElementById('btn-console-clear').addEventListener('click', () => this.ui.clearConsole());
        
        document.querySelectorAll('#form-container input').forEach(input => {
            input.addEventListener('change', () => this.onFormChange());
        });
        
        document.getElementById('truck-count').addEventListener('change', () => this.updateDroneCount());
        document.getElementById('truck-drones').addEventListener('change', () => this.updateDroneCount());
        
        document.querySelector('#customer-table tbody').addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete');
            if (deleteBtn) {
                const index = parseInt(deleteBtn.dataset.index);
                this.config.problem.customers.splice(index, 1);
                this.ui.renderCustomerTable(this.config.problem.customers);
                this.ui.updateFooterStatus(this.config);
                this.updateMap();
            }
        });
    }
    
    onFormChange() {
        this.config = this.ui.getFormValues();
        this.ui.updateFooterStatus(this.config);
        this.updateMap();
    }
    
    updateDroneCount() {
        const truckCount = parseInt(document.getElementById('truck-count').value) || 6;
        const dronesPerTruck = parseInt(document.getElementById('truck-drones').value) || 4;
        document.getElementById('drone-count').value = truckCount * dronesPerTruck;
        this.onFormChange();
    }
    
    importConfig() {
        document.getElementById('file-import').click();
    }
    
    handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                this.config = loadConfigFromJSON(event.target.result);
                this.ui.loadFormValues(this.config);
                this.ui.updateFooterStatus(this.config);
                this.updateMap();
                this.ui.addLog('配置导入成功', 'success');
            } catch (err) {
                this.ui.addLog('配置导入失败: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }
    
    exportConfig() {
        this.config = this.ui.getFormValues();
        const json = exportConfig(this.config);
        
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'config.json';
        a.click();
        
        URL.revokeObjectURL(url);
        this.ui.addLog('配置已导出', 'success');
    }
    
    loadSolomon(instanceName) {
        if (!instanceName) return;
        
        const config = loadSolomonInstance(instanceName);
        if (config) {
            this.config = config;
            this.ui.loadFormValues(this.config);
            this.ui.updateFooterStatus(this.config);
            this.updateMap();
            this.ui.addLog(`已加载 Solomon 算例: ${instanceName}`, 'success');
            document.getElementById('solomon-select').value = instanceName;
        }
    }
    
    updateMap() {
        this.mapCanvas.setData({
            depots: this.config.problem.depots,
            customers: this.config.problem.customers,
            launchPoints: [],
            truckRoutes: [],
            droneRoutes: []
        });
    }
    
    updateMapWithSolution(solution) {
        const depot = this.config.problem.depots[0];
        
        const truckRoutes = [];
        for (const route of solution.truckRoutes) {
            if (route.length > 0) {
                const points = [{ x: depot.x, y: depot.y }];
                for (const id of route) {
                    if (id < 0) {
                        const lpIdx = -id - 1;
                        if (lpIdx < solution.launchPoints.length) {
                            const lp = solution.launchPoints[lpIdx];
                            points.push({ x: lp[0], y: lp[1] });
                        }
                    }
                }
                points.push({ x: depot.x, y: depot.y });
                truckRoutes.push(points);
            }
        }
        
        const droneRoutes = [];
        for (let droneIdx = 0; droneIdx < solution.droneTasks.length; droneIdx++) {
            const tasks = solution.droneTasks[droneIdx];
            if (tasks.length === 0) continue;
            
            const lpIdx = solution.droneToLaunchPoint[droneIdx];
            if (lpIdx < 0 || lpIdx >= solution.launchPoints.length) continue;
            
            const lp = solution.launchPoints[lpIdx];
            
            for (const customerId of tasks) {
                const customer = this.config.problem.customers.find(c => c.id === customerId);
                if (customer) {
                    droneRoutes.push([
                        { x: lp[0], y: lp[1] },
                        { x: customer.x, y: customer.y },
                        { x: lp[0], y: lp[1] }
                    ]);
                }
            }
        }
        
        this.mapCanvas.setData({
            depots: this.config.problem.depots,
            customers: this.config.problem.customers,
            launchPoints: solution.launchPoints,
            truckRoutes,
            droneRoutes
        });
    }
    
    async startGA() {
        if (this.ga && this.ga.isRunning) return;
        
        this.config = this.ui.getFormValues();
        
        if (this.config.problem.customers.length === 0) {
            this.ui.addLog('请先添加客户', 'error');
            return;
        }
        
        if (this.config.problem.depots.length === 0) {
            this.ui.addLog('请先添加仓库', 'error');
            return;
        }
        
        // 自动跳转到收敛曲线页面
        this.ui.navigateTo('result');
        
        const model = new ProblemModel(this.config);
        this.ga = new GARunner(model);
        
        this.ga.onLog = (msg, type) => this.ui.addLog(msg, type);
        this.ga.onProgress = (progress, gen, maxGen, time) => {
            this.ui.updateProgress(progress, gen, maxGen, time);
            this.ui.setStatus(`运行中 ${progress.toFixed(1)}%`, 'var(--accent)');
        };
        
        this.ga.onRouteUpdate = (solution) => {
            this.updateMapWithSolution(solution);
        };
        
        this.ga.onTimeCurveUpdate = (timeCurve) => {
            this.timeCurveData = timeCurve;
            if (this.ui.currentPage === 'result') {
                // 延迟渲染，确保 canvas 已经正确获取父容器尺寸
                requestAnimationFrame(() => {
                    this.chartCanvas.resize();
                    this.chartCanvas.setData(timeCurve);
                });
            }
        };
        
        this.ga.onComplete = (result) => {
            this.ui.updateResult(result);
            this.updateResultView(result);
            document.getElementById('btn-start').style.display = 'flex';
            document.getElementById('btn-stop').style.display = 'none';
        };
        
        document.getElementById('btn-start').style.display = 'none';
        document.getElementById('btn-stop').style.display = 'flex';
        document.getElementById('footer-status').textContent = '运行中...';
        document.getElementById('footer-status').style.color = 'var(--accent)';
        document.getElementById('statusIndicator').className = 'status-indicator status-indicator--running';
        document.getElementById('statusbar-dot').className = 'statusbar-dot statusbar-dot--running';
        
        await this.ga.run();
    }
    
    stopGA() {
        if (this.ga) {
            this.ga.stop();
            this.ui.addLog('已停止优化', 'warning');
            document.getElementById('btn-start').style.display = 'flex';
            document.getElementById('btn-stop').style.display = 'none';
            document.getElementById('statusIndicator').className = 'status-indicator';
            document.getElementById('statusbar-dot').className = 'statusbar-dot';
        }
    }
    
    resetGA() {
        this.stopGA();
        this.timeCurveData = [];
        
        document.getElementById('progress-fill').style.width = '0%';
        document.getElementById('footer-iteration').textContent = '迭代: 0/0';
        document.getElementById('statusbar-time').textContent = '-- min';
        document.getElementById('stat-best-time').textContent = '--';
        
        document.getElementById('result-time').textContent = '-- min';
        document.getElementById('result-iter').textContent = '--';
        document.getElementById('result-duration').textContent = '-- s';
        
        this.ui.setStatus('就绪');
        this.ui.addLog('已重置', 'info');
        this.updateMap();
    }
    
    updateResultView(result) {
        this.timeCurveData = result.timeCurve;
        this.chartCanvas.setData(result.timeCurve);
        this.renderPlan(result.solution);
    }
    
    updateChartIfVisible() {
        if (this.timeCurveData.length > 0 && this.ui.currentPage === 'result') {
            // 延迟渲染，确保页面切换动画完成
            requestAnimationFrame(() => {
                this.chartCanvas.resize();
                this.chartCanvas.setData(this.timeCurveData);
            });
        }
    }
    
    renderPlan(solution) {
        const container = document.getElementById('plan-content');
        const depot = this.config.problem.depots[0];
        
        let text = '配送方案\n';
        text += '='.repeat(50) + '\n\n';
        
        text += `仓库: (${depot.x}, ${depot.y})\n`;
        text += `发射点数量: ${solution.launchPoints.length}\n`;
        text += `卡车路线数: ${solution.truckRoutes.filter(r => r.length > 2).length}\n\n`;
        
        for (let t = 0; t < solution.truckRoutes.length; t++) {
            const route = solution.truckRoutes[t];
            if (route.length <= 2) continue;
            
            text += `卡车 ${t + 1}:\n`;
            text += `  路线: 仓库`;
            
            for (const id of route) {
                if (id < 0) {
                    const lpIdx = -id - 1;
                    if (lpIdx < solution.launchPoints.length) {
                        const lp = solution.launchPoints[lpIdx];
                        text += ` -> L${lpIdx + 1}(${lp[0].toFixed(1)}, ${lp[1].toFixed(1)})`;
                    }
                }
            }
            
            text += ' -> 仓库\n';
            
            const dronesPerTruck = this.config.vehicles.trucks.dronesPerTruck;
            for (let d = 0; d < dronesPerTruck; d++) {
                const droneIdx = t * dronesPerTruck + d;
                const tasks = solution.droneTasks[droneIdx];
                if (tasks.length > 0) {
                    text += `  无人机${d + 1}: 客户 ${tasks.join(', ')}\n`;
                }
            }
            
            text += '\n';
        }
        
        container.textContent = text;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
