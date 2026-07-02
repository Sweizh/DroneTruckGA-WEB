/**
 * UI 管理器 - 处理界面交互
 */

class UIManager {
    constructor() {
        this.currentPage = 'customer';
        this.onPageChange = null;

        this.initNavigation();
        this.initMobileNav();
        this.initTheme();
    }

    initNavigation() {
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page) this.navigateTo(page);
            });
        });
    }

    initMobileNav() {
        const tabbar = document.getElementById('mobile-tabbar');
        if (tabbar) {
            tabbar.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    const page = btn.dataset.page;
                    if (page) this.navigateTo(page);
                });
            });
        }

        const consoleToggle = document.getElementById('btn-console-toggle');
        const rightPanel = document.querySelector('.right-panel');
        const backdrop = document.getElementById('drawer-backdrop');

        const closeDrawer = () => {
            if (rightPanel) rightPanel.classList.remove('right-panel--open');
            if (backdrop) backdrop.classList.remove('drawer-backdrop--visible');
        };

        if (consoleToggle && rightPanel && backdrop) {
            consoleToggle.addEventListener('click', () => {
                const isOpen = rightPanel.classList.toggle('right-panel--open');
                backdrop.classList.toggle('drawer-backdrop--visible', isOpen);
            });
        }

        if (backdrop) {
            backdrop.addEventListener('click', closeDrawer);
        }
    }
    
    initTheme() {
        const themeSelect = document.getElementById('theme-select');
        const savedTheme = localStorage.getItem('theme') || 'auto';
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (themeSelect) themeSelect.value = savedTheme;
        
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                const theme = e.target.value;
                document.documentElement.setAttribute('data-theme', theme);
                localStorage.setItem('theme', theme);
            });
        }
    }
    
    navigateTo(page) {
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.toggle('sidebar-item--active', item.dataset.page === page);
        });

        document.querySelectorAll('.mobile-tabbar button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        document.querySelectorAll('.page').forEach(p => {
            p.classList.toggle('active', p.id === `page-${page}`);
        });

        this.currentPage = page;

        if (this.onPageChange) {
            this.onPageChange(page);
        }
    }
    
    updateFooterStatus(config) {
        const depotCount = config.problem.depots.length;
        const customerCount = config.problem.customers.length;
        const truckCount = config.vehicles.trucks.count;
        const droneCount = config.vehicles.trucks.count * config.vehicles.trucks.dronesPerTruck;
        
        document.getElementById('footer-depots').textContent = depotCount;
        document.getElementById('footer-customers').textContent = customerCount;
        document.getElementById('footer-trucks').textContent = truckCount;
        document.getElementById('footer-drones').textContent = droneCount;
        
        document.getElementById('statusbar-depots').textContent = depotCount;
        document.getElementById('statusbar-customers').textContent = customerCount;
        document.getElementById('statusbar-trucks').textContent = truckCount;
        document.getElementById('statusbar-drones').textContent = droneCount;
    }
    
    updateProgress(progress, current, total, bestTime) {
        document.getElementById('progress-fill').style.width = `${progress}%`;
        document.getElementById('footer-iteration').textContent = `迭代: ${current}/${total}`;
        document.getElementById('statusbar-time').textContent = `${bestTime.toFixed(2)} min`;
        document.getElementById('stat-best-time').textContent = bestTime.toFixed(2);
    }
    
    updateResult(result) {
        document.getElementById('result-time').textContent = `${result.time.toFixed(2)} min`;
        document.getElementById('result-iter').textContent = result.iterations;
        document.getElementById('result-iterations').textContent = `${result.iterations} 次迭代`;
        document.getElementById('result-duration').textContent = `${result.duration.toFixed(2)} s`;
        
        document.getElementById('stat-best-time').textContent = result.time.toFixed(2);
        document.getElementById('statusbar-time').textContent = `${result.time.toFixed(2)} min`;
        
        document.getElementById('footer-status').textContent = '优化完成';
        document.getElementById('footer-status').style.color = 'var(--accent-emerald)';
        document.getElementById('statusIndicator').className = 'status-indicator';
        document.getElementById('statusbar-dot').className = 'statusbar-dot';
    }
    
    renderDepotList(depots) {
        const container = document.getElementById('depot-list');
        if (!container) return;
        container.innerHTML = '';
        
        depots.forEach((depot, index) => {
            const div = document.createElement('div');
            div.className = 'param-grid';
            div.innerHTML = `
                <div class="param-group">
                    <label class="param-label">仓库 ID</label>
                    <input type="number" value="${depot.id}" data-index="${index}" data-field="id" class="param-input depot-input">
                </div>
                <div class="param-group">
                    <label class="param-label">X 坐标</label>
                    <input type="number" value="${depot.x}" step="0.1" data-index="${index}" data-field="x" class="param-input depot-input">
                </div>
                <div class="param-group">
                    <label class="param-label">Y 坐标</label>
                    <input type="number" value="${depot.y}" step="0.1" data-index="${index}" data-field="y" class="param-input depot-input">
                </div>
            `;
            container.appendChild(div);
        });
    }
    
    renderCustomerTable(customers) {
        const tbody = document.querySelector('#customer-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        customers.forEach((customer, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${customer.id}</td>
                <td><input type="number" value="${customer.x}" step="0.1" class="table-input" data-index="${index}" data-field="x"></td>
                <td><input type="number" value="${customer.y}" step="0.1" class="table-input" data-index="${index}" data-field="y"></td>
                <td><input type="number" value="${customer.demand}" class="table-input" data-index="${index}" data-field="demand"></td>
                <td>[${customer.timeWindow[0]}, ${customer.timeWindow[1]}]</td>
                <td class="table-actions">
                    <button class="delete" data-index="${index}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    addLog(message, type = 'info') {
        const console = document.getElementById('console-content');
        if (!console) return;
        const line = document.createElement('div');
        line.className = `console-line ${type}`;
        line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        console.appendChild(line);
        console.scrollTop = console.scrollHeight;
    }
    
    clearConsole() {
        const console = document.getElementById('console-content');
        if (console) console.innerHTML = '';
    }
    
    setStatus(status, color = 'var(--text-secondary)') {
        const el = document.getElementById('footer-status');
        if (el) {
            el.textContent = status;
            el.style.color = color;
        }
    }
    
    loadFormValues(config) {
        const depotCount = document.getElementById('depot-count');
        if (depotCount) depotCount.value = config.problem.depots.length;
        this.renderDepotList(config.problem.depots);
        
        const customerCount = document.getElementById('customer-count');
        if (customerCount) customerCount.value = config.problem.customers.length;
        this.renderCustomerTable(config.problem.customers);
        
        const truckCount = document.getElementById('truck-count');
        if (truckCount) truckCount.value = config.vehicles.trucks.count;
        const truckCapacity = document.getElementById('truck-capacity');
        if (truckCapacity) truckCapacity.value = config.vehicles.trucks.capacity;
        const truckSpeed = document.getElementById('truck-speed');
        if (truckSpeed) truckSpeed.value = config.vehicles.trucks.speed;
        const truckDrones = document.getElementById('truck-drones');
        if (truckDrones) truckDrones.value = config.vehicles.trucks.dronesPerTruck;
        const truckRange = document.getElementById('truck-range');
        if (truckRange) truckRange.value = config.vehicles.trucks.range;
        
        const droneCount = document.getElementById('drone-count');
        if (droneCount) droneCount.value = config.vehicles.trucks.count * config.vehicles.trucks.dronesPerTruck;
        const droneRange = document.getElementById('drone-range');
        if (droneRange) droneRange.value = config.vehicles.drones.range;
        const droneSpeed = document.getElementById('drone-speed');
        if (droneSpeed) droneSpeed.value = config.vehicles.drones.speed;
        const dronePayload = document.getElementById('drone-payload');
        if (dronePayload) dronePayload.value = config.vehicles.drones.maxPayload;
        const droneRechargeTime = document.getElementById('drone-recharge-time');
        if (droneRechargeTime) droneRechargeTime.value = config.vehicles.drones.rechargeTime;
        const droneServiceTime = document.getElementById('drone-service-time');
        if (droneServiceTime) droneServiceTime.value = config.vehicles.drones.serviceTime;
        
        const launchCount = document.getElementById('launch-count');
        if (launchCount) launchCount.value = config.launchPoint.launchPointCount;
        const launchKmeansIter = document.getElementById('launch-kmeans-iter');
        if (launchKmeansIter) launchKmeansIter.value = config.launchPoint.kmeansMaxIterations;
        const launchMutationRange = document.getElementById('launch-mutation-range');
        if (launchMutationRange) launchMutationRange.value = config.launchPoint.mutationRange;
        const launchHistoryInfluence = document.getElementById('launch-history-influence');
        if (launchHistoryInfluence) launchHistoryInfluence.value = config.launchPoint.historyInfluence;
        
        const gaPopulation = document.getElementById('ga-population');
        if (gaPopulation) gaPopulation.value = config.genetic.populationSize;
        const gaGenerations = document.getElementById('ga-generations');
        if (gaGenerations) gaGenerations.value = config.genetic.maxGenerations;
        const gaCrossover = document.getElementById('ga-crossover');
        if (gaCrossover) gaCrossover.value = config.genetic.crossoverRate;
        const gaMutation = document.getElementById('ga-mutation');
        if (gaMutation) gaMutation.value = config.genetic.mutationRate;
        const gaElite = document.getElementById('ga-elite');
        if (gaElite) gaElite.value = config.genetic.eliteRate;
        const gaTournament = document.getElementById('ga-tournament');
        if (gaTournament) gaTournament.value = config.genetic.tournamentSize;
        
        const penaltyEnabled = document.getElementById('penalty-enabled');
        if (penaltyEnabled) penaltyEnabled.checked = config.penalty.enabled;
        const penaltyEarly = document.getElementById('penalty-early');
        if (penaltyEarly) penaltyEarly.value = config.penalty.timeWindowEarly;
        const penaltyLate = document.getElementById('penalty-late');
        if (penaltyLate) penaltyLate.value = config.penalty.timeWindowLate;
        const penaltyDroneRange = document.getElementById('penalty-drone-range');
        if (penaltyDroneRange) penaltyDroneRange.value = config.penalty.droneRangePenalty;
        const penaltyDronePayload = document.getElementById('penalty-drone-payload');
        if (penaltyDronePayload) penaltyDronePayload.value = config.penalty.dronePayloadPenalty;
        const penaltyTruckTime = document.getElementById('penalty-truck-time');
        if (penaltyTruckTime) penaltyTruckTime.value = config.penalty.truckRangeTimePenalty;
        const penaltyDistance = document.getElementById('penalty-distance');
        if (penaltyDistance) penaltyDistance.value = config.penalty.distancePenalty;
    }
    
    getFormValues() {
        const config = getDefaultConfig();
        
        // 从当前 app 的 config 获取客户和仓库数据
        if (window.app && window.app.config) {
            config.problem.depots = JSON.parse(JSON.stringify(window.app.config.problem.depots));
            config.problem.customers = JSON.parse(JSON.stringify(window.app.config.problem.customers));
        }
        
        const truckCount = document.getElementById('truck-count');
        if (truckCount) config.vehicles.trucks.count = parseInt(truckCount.value) || 6;
        const truckCapacity = document.getElementById('truck-capacity');
        if (truckCapacity) config.vehicles.trucks.capacity = parseFloat(truckCapacity.value) || 2000;
        const truckSpeed = document.getElementById('truck-speed');
        if (truckSpeed) config.vehicles.trucks.speed = parseFloat(truckSpeed.value) || 40;
        const truckDrones = document.getElementById('truck-drones');
        if (truckDrones) config.vehicles.trucks.dronesPerTruck = parseInt(truckDrones.value) || 4;
        const truckRange = document.getElementById('truck-range');
        if (truckRange) config.vehicles.trucks.range = parseFloat(truckRange.value) || 1000;
        
        const droneRange = document.getElementById('drone-range');
        if (droneRange) config.vehicles.drones.range = parseFloat(droneRange.value) || 50;
        const droneSpeed = document.getElementById('drone-speed');
        if (droneSpeed) config.vehicles.drones.speed = parseFloat(droneSpeed.value) || 60;
        const dronePayload = document.getElementById('drone-payload');
        if (dronePayload) config.vehicles.drones.maxPayload = parseFloat(dronePayload.value) || 50;
        const droneRechargeTime = document.getElementById('drone-recharge-time');
        if (droneRechargeTime) config.vehicles.drones.rechargeTime = parseFloat(droneRechargeTime.value) || 10;
        const droneServiceTime = document.getElementById('drone-service-time');
        if (droneServiceTime) config.vehicles.drones.serviceTime = parseFloat(droneServiceTime.value) || 1.5;
        
        const launchCount = document.getElementById('launch-count');
        if (launchCount) config.launchPoint.launchPointCount = parseInt(launchCount.value) || 0;
        const launchKmeansIter = document.getElementById('launch-kmeans-iter');
        if (launchKmeansIter) config.launchPoint.kmeansMaxIterations = parseInt(launchKmeansIter.value) || 100;
        const launchMutationRange = document.getElementById('launch-mutation-range');
        if (launchMutationRange) config.launchPoint.mutationRange = parseFloat(launchMutationRange.value) || 3;
        const launchHistoryInfluence = document.getElementById('launch-history-influence');
        if (launchHistoryInfluence) config.launchPoint.historyInfluence = parseFloat(launchHistoryInfluence.value) || 0.5;
        
        const gaPopulation = document.getElementById('ga-population');
        if (gaPopulation) config.genetic.populationSize = parseInt(gaPopulation.value) || 10000;
        const gaGenerations = document.getElementById('ga-generations');
        if (gaGenerations) config.genetic.maxGenerations = parseInt(gaGenerations.value) || 2500;
        const gaCrossover = document.getElementById('ga-crossover');
        if (gaCrossover) config.genetic.crossoverRate = parseFloat(gaCrossover.value) || 0.9;
        const gaMutation = document.getElementById('ga-mutation');
        if (gaMutation) config.genetic.mutationRate = parseFloat(gaMutation.value) || 0.7;
        const gaElite = document.getElementById('ga-elite');
        if (gaElite) config.genetic.eliteRate = parseFloat(gaElite.value) || 0.5;
        const gaTournament = document.getElementById('ga-tournament');
        if (gaTournament) config.genetic.tournamentSize = parseInt(gaTournament.value) || 2;
        
        const penaltyEnabled = document.getElementById('penalty-enabled');
        if (penaltyEnabled) config.penalty.enabled = penaltyEnabled.checked;
        const penaltyEarly = document.getElementById('penalty-early');
        if (penaltyEarly) config.penalty.timeWindowEarly = parseFloat(penaltyEarly.value) || 2;
        const penaltyLate = document.getElementById('penalty-late');
        if (penaltyLate) config.penalty.timeWindowLate = parseFloat(penaltyLate.value) || 50;
        const penaltyDroneRange = document.getElementById('penalty-drone-range');
        if (penaltyDroneRange) config.penalty.droneRangePenalty = parseFloat(penaltyDroneRange.value) || 50;
        const penaltyDronePayload = document.getElementById('penalty-drone-payload');
        if (penaltyDronePayload) config.penalty.dronePayloadPenalty = parseFloat(penaltyDronePayload.value) || 20;
        const penaltyTruckTime = document.getElementById('penalty-truck-time');
        if (penaltyTruckTime) config.penalty.truckRangeTimePenalty = parseFloat(penaltyTruckTime.value) || 5;
        const penaltyDistance = document.getElementById('penalty-distance');
        if (penaltyDistance) config.penalty.distancePenalty = parseFloat(penaltyDistance.value) || 50;
        
        return config;
    }
}
