/**
 * 遗传算法核心 - 功能等价于原始 Java GA 系统
 * 包含：染色体编码器、解码器、适应度函数、遗传算子、GA运行器
 */

// ==================== 染色体编码器 ====================
class ChromosomeEncoder {
    constructor(model) {
        this.model = model;
        this.n = model.getLaunchPointCount();
        this.K = model.getTruckCount();
        this.Mmax = Math.ceil(this.n / this.K);
        this.COORD_PRECISION = 1000;
    }
    
    createChromosome() {
        return {
            customerBlocks: new Array(this.model.getCustomerCount()).fill(0),
            launchPointAssignment: new Array(this.K * this.Mmax).fill(0),
            launchPointCoords: new Array(this.n * 2).fill(0)
        };
    }
    
    copyChromosome(chrom) {
        return {
            customerBlocks: chrom.customerBlocks.slice(),
            launchPointAssignment: chrom.launchPointAssignment.slice(),
            launchPointCoords: chrom.launchPointCoords.slice()
        };
    }
    
    createBaseChromosome() {
        const chrom = this.createChromosome();
        const customers = this.model.customers;
        const minX = this.model.minX;
        const maxX = this.model.maxX;
        const minY = this.model.minY;
        const maxY = this.model.maxY;
        
        // 段2：轮询分配发射点给卡车
        const truckLPs = Array.from({ length: this.K }, () => []);
        for (let lpId = 1; lpId <= this.n; lpId++) {
            const truckIdx = (lpId - 1) % this.K;
            truckLPs[truckIdx].push(lpId);
        }
        for (let t = 0; t < this.K; t++) {
            while (truckLPs[t].length < this.Mmax) truckLPs[t].push(0);
        }
        const assignment = [];
        for (let t = 0; t < this.K; t++) assignment.push(...truckLPs[t]);
        chrom.launchPointAssignment = assignment;
        
        // 段1：K-means 聚类结果
        const clusters = ProblemModel.kmeansClustering(customers, this.n, 100);
        const allCentroids = clusters.map(c => ProblemModel.calculateCentroid(c));
        while (allCentroids.length < this.n) {
            const c = customers[Math.floor(Math.random() * customers.length)];
            allCentroids.push([c.x, c.y]);
        }
        
        const customerBlockIds = new Array(customers.length).fill(0);
        for (let lpIdx = 0; lpIdx < clusters.length; lpIdx++) {
            const cluster = clusters[lpIdx];
            const lpId = lpIdx + 1;
            for (const customer of cluster) {
                const custIdx = customers.findIndex(c => c.id === customer.id);
                if (custIdx >= 0) customerBlockIds[custIdx] = lpId;
            }
        }
        
        const validLpIds = [];
        for (let i = 0; i < this.n; i++) {
            if (clusters[i].length > 0) validLpIds.push(i + 1);
        }
        for (let i = 0; i < customerBlockIds.length; i++) {
            if (customerBlockIds[i] === 0) {
                customerBlockIds[i] = validLpIds[Math.floor(Math.random() * validLpIds.length)];
            }
        }
        chrom.customerBlocks = customerBlockIds;
        
        // 段3：聚类中心坐标
        const coords = [];
        for (let i = 0; i < this.n; i++) {
            let x = allCentroids[i][0];
            let y = allCentroids[i][1];
            x = Math.max(minX, Math.min(maxX, x));
            y = Math.max(minY, Math.min(maxY, y));
            coords.push(Math.round(x * this.COORD_PRECISION) / this.COORD_PRECISION);
            coords.push(Math.round(y * this.COORD_PRECISION) / this.COORD_PRECISION);
        }
        chrom.launchPointCoords = coords;
        
        return chrom;
    }
    
    applyPerturbation(base) {
        const chrom = this.copyChromosome(base);
        const customers = this.model.customers;
        const minX = this.model.minX;
        const maxX = this.model.maxX;
        const minY = this.model.minY;
        const maxY = this.model.maxY;
        
        // 段1：扰动客户分块
        const swapCount = Math.max(1, Math.floor(customers.length * 0.05));
        for (let i = 0; i < swapCount; i++) {
            const c1 = Math.floor(Math.random() * customers.length);
            const c2 = Math.floor(Math.random() * customers.length);
            [chrom.customerBlocks[c1], chrom.customerBlocks[c2]] = 
                [chrom.customerBlocks[c2], chrom.customerBlocks[c1]];
        }
        
        // 段2：打乱每辆卡车内部访问顺序
        const truckLPs = [];
        for (let t = 0; t < this.K; t++) {
            const lps = [];
            for (let m = 0; m < this.Mmax; m++) {
                const pos = t * this.Mmax + m;
                if (pos < chrom.launchPointAssignment.length) {
                    lps.push(chrom.launchPointAssignment[pos]);
                }
            }
            truckLPs.push(lps);
        }
        for (let t = 0; t < this.K; t++) {
            this.shuffleArray(truckLPs[t]);
        }
        chrom.launchPointAssignment = [];
        for (let t = 0; t < this.K; t++) {
            const lps = truckLPs[t];
            for (let m = 0; m < this.Mmax; m++) {
                chrom.launchPointAssignment.push(m < lps.length ? lps[m] : 0);
            }
        }
        
        // 段3：扰动发射点坐标
        const perturbRange = this.model.launchPointConfig.initialOffset;
        for (let i = 0; i < chrom.launchPointCoords.length; i++) {
            const perturb = (Math.random() - 0.5) * perturbRange * 2;
            let newValue = chrom.launchPointCoords[i] + perturb;
            const isX = i % 2 === 0;
            newValue = Math.max(isX ? minX : minY, Math.min(isX ? maxX : maxY, newValue));
            chrom.launchPointCoords[i] = Math.round(newValue * this.COORD_PRECISION) / this.COORD_PRECISION;
        }
        
        return chrom;
    }
    
    createFullyRandomChromosome() {
        const chrom = this.createChromosome();
        const customers = this.model.customers;
        const minX = this.model.minX;
        const maxX = this.model.maxX;
        const minY = this.model.minY;
        const maxY = this.model.maxY;
        
        // 段2：随机轮询分配
        const allLPs = Array.from({ length: this.n }, (_, i) => i + 1);
        this.shuffleArray(allLPs);
        
        const truckLPs = Array.from({ length: this.K }, () => []);
        for (let lpIdx = 0; lpIdx < this.n; lpIdx++) {
            truckLPs[lpIdx % this.K].push(allLPs[lpIdx]);
        }
        for (let t = 0; t < this.K; t++) {
            while (truckLPs[t].length < this.Mmax) truckLPs[t].push(0);
        }
        chrom.launchPointAssignment = [];
        for (let t = 0; t < this.K; t++) chrom.launchPointAssignment.push(...truckLPs[t]);
        
        // 段1：K-means 聚类
        const clusters = ProblemModel.kmeansClustering(customers, this.n, 100);
        const allCentroids = clusters.map(c => ProblemModel.calculateCentroid(c));
        while (allCentroids.length < this.n) {
            const c = customers[Math.floor(Math.random() * customers.length)];
            allCentroids.push([c.x, c.y]);
        }
        
        const customerBlockIds = new Array(customers.length).fill(0);
        for (let lpIdx = 0; lpIdx < clusters.length; lpIdx++) {
            const cluster = clusters[lpIdx];
            const lpId = lpIdx + 1;
            for (const customer of cluster) {
                const custIdx = customers.findIndex(c => c.id === customer.id);
                if (custIdx >= 0) customerBlockIds[custIdx] = lpId;
            }
        }
        
        const validLpIds = [];
        for (let i = 0; i < this.n; i++) {
            if (clusters[i].length > 0) validLpIds.push(i + 1);
        }
        for (let i = 0; i < customerBlockIds.length; i++) {
            if (customerBlockIds[i] === 0) {
                customerBlockIds[i] = validLpIds[Math.floor(Math.random() * validLpIds.length)];
            }
        }
        chrom.customerBlocks = customerBlockIds;
        
        // 段3：随机坐标
        chrom.launchPointCoords = [];
        for (let i = 0; i < this.n; i++) {
            chrom.launchPointCoords.push(
                Math.round((minX + Math.random() * (maxX - minX)) * this.COORD_PRECISION) / this.COORD_PRECISION,
                Math.round((minY + Math.random() * (maxY - minY)) * this.COORD_PRECISION) / this.COORD_PRECISION
            );
        }
        
        return chrom;
    }
    
    shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
    
    getChromosomeLength() {
        return this.model.getCustomerCount() + this.K * this.Mmax + this.n * 2;
    }
}

// ==================== 染色体解码器 ====================
class ChromosomeDecoder {
    constructor(model) {
        this.model = model;
        this.K = model.getTruckCount();
        this.n = model.getLaunchPointCount();
        this.Mmax = Math.ceil(this.n / this.K);
        this.dronesPerTruck = model.getDronesPerTruck();
    }
    
    decode(chrom) {
        const result = {
            truckRoutes: [],
            droneTasks: [],
            allLaunchPoints: [],
            droneToLaunchPoint: []
        };
        
        // 步骤3：解析发射点坐标
        for (let i = 0; i < this.n; i++) {
            result.allLaunchPoints.push([
                chrom.launchPointCoords[i * 2],
                chrom.launchPointCoords[i * 2 + 1]
            ]);
        }
        
        // 步骤1：解析客户分块
        const lpCustomers = new Map();
        for (let lpId = 1; lpId <= this.n; lpId++) {
            lpCustomers.set(lpId, []);
        }
        
        const customers = this.model.customers;
        for (let i = 0; i < customers.length; i++) {
            const lpId = chrom.customerBlocks[i];
            if (lpId >= 1 && lpId <= this.n) {
                lpCustomers.get(lpId).push(customers[i].id);
            }
        }
        
        // 步骤2：解析发射点分配
        const truckLaunchPoints = [];
        for (let t = 0; t < this.K; t++) {
            truckLaunchPoints.push([]);
            for (let m = 0; m < this.Mmax; m++) {
                const idx = t * this.Mmax + m;
                if (idx < chrom.launchPointAssignment.length) {
                    const lpId = chrom.launchPointAssignment[idx];
                    if (lpId > 0) truckLaunchPoints[t].push(lpId);
                }
            }
        }
        
        // 步骤4：生成配送方案
        const depotId = this.model.depots[0].id;
        for (let t = 0; t < this.K; t++) {
            const route = [depotId];
            for (const lpId of truckLaunchPoints[t]) {
                route.push(-lpId);
            }
            route.push(depotId);
            result.truckRoutes.push(route);
        }
        
        // 发射点→卡车映射
        const lpToTruck = new Map();
        for (let t = 0; t < this.K; t++) {
            for (const lpId of truckLaunchPoints[t]) {
                lpToTruck.set(lpId, t);
            }
        }
        
        // 构建无人机任务
        const droneCount = this.K * this.dronesPerTruck;
        for (let d = 0; d < droneCount; d++) {
            result.droneTasks.push([]);
            result.droneToLaunchPoint.push(-1);
        }
        
        const dronesUsedPerTruck = new Array(this.K).fill(0);
        
        for (let lpId = 1; lpId <= this.n; lpId++) {
            const custList = lpCustomers.get(lpId);
            if (custList.length === 0) continue;
            
            let truckIdx = lpToTruck.has(lpId) ? lpToTruck.get(lpId) : (lpId - 1) % this.K;
            const droneIdx = truckIdx * this.dronesPerTruck + (dronesUsedPerTruck[truckIdx] % this.dronesPerTruck);
            
            result.droneTasks[droneIdx].push(...custList);
            result.droneToLaunchPoint[droneIdx] = lpId - 1;
            dronesUsedPerTruck[truckIdx]++;
        }
        
        return result;
    }
}

// ==================== 适应度函数 ====================
class FitnessFunction {
    constructor(model) {
        this.model = model;
        this.decoder = new ChromosomeDecoder(model);
    }
    
    evaluate(chrom) {
        const result = this.decoder.decode(chrom);
        
        const allLaunchPoints = [];
        for (const lp of result.allLaunchPoints) {
            allLaunchPoints.push(lp[0], lp[1]);
        }
        
        const totalTime = this.calculateTotalTime(
            result.truckRoutes, result.droneTasks, result.droneToLaunchPoint, allLaunchPoints);
        
        const extraTime = this.calculateExtraTimeCost(
            result.truckRoutes, result.droneTasks, result.droneToLaunchPoint, allLaunchPoints);
        
        const totalLaunchDistance = this.calculateLaunchPointDistanceSum(
            result.truckRoutes, result.droneTasks, result.droneToLaunchPoint, allLaunchPoints);
        const distancePenaltyTime = totalLaunchDistance * this.model.distancePenalty;
        
        let servedCustomers = 0;
        for (const tasks of result.droneTasks) servedCustomers += tasks.length;
        const unservedCustomers = this.model.getCustomerCount() - servedCustomers;
        const unservedPenalty = unservedCustomers * this.model.maxTime;
        
        const penaltyWeight = this.model.penaltyEnabled ? 1.0 : 0.0;
        const effectiveTime = totalTime + (extraTime + distancePenaltyTime + unservedPenalty) * penaltyWeight;
        
        return { totalTime, effectiveTime };
    }
    
    calculateFitness(chrom) {
        const result = this.evaluate(chrom);
        return 1.0 / (1.0 + result.effectiveTime);
    }
    
    calculateTotalTime(truckRoutes, droneTasks, droneToLaunchPoint, launchPoints) {
        let maxTruckTime = 0;
        
        // 计算每辆卡车的行驶时间
        for (let truckIdx = 0; truckIdx < truckRoutes.length; truckIdx++) {
            const route = truckRoutes[truckIdx];
            let truckTravelTime = 0;
            
            for (let i = 0; i < route.length - 1; i++) {
                const p1 = this.getPointCoords(route[i], launchPoints);
                const p2 = this.getPointCoords(route[i + 1], launchPoints);
                if (p1 && p2) {
                    const distance = Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
                    truckTravelTime += distance / this.model.truckSpeed * 60;
                }
            }
            
            maxTruckTime = Math.max(maxTruckTime, truckTravelTime);
        }
        
        // 计算每个发射点的无人机飞行时间
        let maxDroneTime = 0;
        let totalTasks = 0;
        
        for (let droneIdx = 0; droneIdx < droneTasks.length; droneIdx++) {
            const tasks = droneTasks[droneIdx];
            if (tasks.length === 0) continue;
            
            const lpIdx = droneIdx < droneToLaunchPoint.length ? droneToLaunchPoint[droneIdx] : 0;
            if (lpIdx < 0 || lpIdx >= launchPoints.length / 2) continue;
            
            const launchX = launchPoints[lpIdx * 2];
            const launchY = launchPoints[lpIdx * 2 + 1];
            
            let droneDeliveryTime = 0;
            
            for (const customerId of tasks) {
                const customer = this.model.customerMap.get(customerId);
                if (customer) {
                    const distance = Math.sqrt(
                        Math.pow(customer.x - launchX, 2) + Math.pow(customer.y - launchY, 2));
                    const flightTime = distance / this.model.droneSpeed * 60;
                    droneDeliveryTime += flightTime + customer.serviceTime;
                    totalTasks++;
                }
            }
            
            maxDroneTime = Math.max(maxDroneTime, droneDeliveryTime);
        }
        
        // 充电时间
        const rechargeTime = totalTasks > 0 ? this.model.droneRechargeTime : 0;
        
        return maxTruckTime + maxDroneTime + rechargeTime;
    }
    
    calculateExtraTimeCost(truckRoutes, droneTasks, droneToLaunchPoint, launchPoints) {
        let extraTime = 0;
        
        for (let droneIdx = 0; droneIdx < droneTasks.length; droneIdx++) {
            const tasks = droneTasks[droneIdx];
            if (tasks.length === 0) continue;
            
            const lpIdx = droneIdx < droneToLaunchPoint.length ? droneToLaunchPoint[droneIdx] : 0;
            if (lpIdx < 0 || lpIdx >= launchPoints.length / 2) continue;
            
            const launchX = launchPoints[lpIdx * 2];
            const launchY = launchPoints[lpIdx * 2 + 1];
            
            const truckIdx = Math.floor(droneIdx / this.model.dronesPerTruck);
            const truckRoute = truckRoutes[Math.min(truckIdx, truckRoutes.length - 1)];
            
            // 计算卡车到达发射点的时间
            let truckArrivalTime = 0;
            let truckDistToLaunch = 0;
            for (let i = 0; i < truckRoute.length - 1; i++) {
                const p1 = this.getPointCoords(truckRoute[i], launchPoints);
                const p2 = this.getPointCoords(truckRoute[i + 1], launchPoints);
                if (p1 && p2) {
                    const segDist = Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
                    truckDistToLaunch += segDist;
                    if (truckRoute[i + 1] < 0) break;
                }
            }
            truckArrivalTime = truckDistToLaunch / this.model.truckSpeed * 60;
            
            // 计算该无人机客户的时间窗惩罚
            let droneMaxFlightTime = 0;
            for (const customerId of tasks) {
                const customer = this.model.customerMap.get(customerId);
                if (!customer) continue;
                
                const dist = Math.sqrt(
                    Math.pow(customer.x - launchX, 2) + Math.pow(customer.y - launchY, 2));
                const droneFlightTime = dist / this.model.droneSpeed * 60;
                droneMaxFlightTime = Math.max(droneMaxFlightTime, droneFlightTime);
            }
            
            const arrivalTime = truckArrivalTime + droneMaxFlightTime;
            
            for (const customerId of tasks) {
                const customer = this.model.customerMap.get(customerId);
                if (!customer) continue;
                
                if (arrivalTime < customer.startTimeWindow) {
                    const waitTime = customer.startTimeWindow - arrivalTime;
                    extraTime += Math.min(waitTime, 30.0) * this.model.timeWindowEarly;
                } else if (arrivalTime > customer.endTimeWindow) {
                    const delayTime = arrivalTime - customer.endTimeWindow;
                    extraTime += Math.min(delayTime, 60.0) * this.model.timeWindowLate;
                }
            }
        }
        
        // 卡车超续航惩罚
        const truckRange = this.model.truckRange;
        if (truckRange > 0) {
            for (const route of truckRoutes) {
                let routeDistance = 0;
                for (let i = 0; i < route.length - 1; i++) {
                    const p1 = this.getPointCoords(route[i], launchPoints);
                    const p2 = this.getPointCoords(route[i + 1], launchPoints);
                    if (p1 && p2) {
                        routeDistance += Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
                    }
                }
                if (routeDistance > truckRange) {
                    const exceedDist = routeDistance - truckRange;
                    const exceedTime = exceedDist / this.model.truckSpeed * 60;
                    extraTime += Math.min(exceedTime, 60.0) * this.model.truckRangeTimePenalty;
                }
            }
        }
        
        return extraTime;
    }
    
    calculateLaunchPointDistanceSum(truckRoutes, droneTasks, droneToLaunchPoint, launchPoints) {
        let totalDistance = 0;
        
        for (let droneIdx = 0; droneIdx < droneTasks.length; droneIdx++) {
            const tasks = droneTasks[droneIdx];
            if (tasks.length === 0) continue;
            
            const lpIdx = droneIdx < droneToLaunchPoint.length ? droneToLaunchPoint[droneIdx] : 0;
            if (lpIdx < 0 || lpIdx >= launchPoints.length / 2) continue;
            
            const launchX = launchPoints[lpIdx * 2];
            const launchY = launchPoints[lpIdx * 2 + 1];
            
            for (const customerId of tasks) {
                const customer = this.model.customerMap.get(customerId);
                if (!customer) continue;
                
                totalDistance += Math.sqrt(
                    Math.pow(customer.x - launchX, 2) + Math.pow(customer.y - launchY, 2));
            }
        }
        
        return totalDistance;
    }
    
    getPointCoords(id, launchPoints) {
        if (id < 0) {
            const idx = (-id - 1) * 2;
            if (idx >= 0 && idx < launchPoints.length - 1) {
                return [launchPoints[idx], launchPoints[idx + 1]];
            }
            return null;
        }
        
        const depot = this.model.depotMap.get(id);
        if (depot) return [depot.x, depot.y];
        
        const customer = this.model.customerMap.get(id);
        if (customer) return [customer.x, customer.y];
        
        return null;
    }
}

// ==================== 遗传算子 ====================
class GAOperators {
    constructor(model) {
        this.model = model;
        this.encoder = new ChromosomeEncoder(model);
    }
    
    tournamentSelect(population, fitness, tournamentSize) {
        let bestIdx = Math.floor(Math.random() * population.length);
        let bestFitness = fitness[bestIdx];
        
        for (let i = 1; i < tournamentSize; i++) {
            const idx = Math.floor(Math.random() * population.length);
            if (fitness[idx] > bestFitness) {
                bestIdx = idx;
                bestFitness = fitness[idx];
            }
        }
        
        return this.encoder.copyChromosome(population[bestIdx]);
    }
    
    crossover(parent1, parent2, crossoverRate) {
        const child = this.encoder.createChromosome();
        
        // 段1：客户分块
        if (Math.random() < 0.5) {
            child.customerBlocks = parent1.customerBlocks.slice();
        } else {
            child.customerBlocks = parent2.customerBlocks.slice();
        }
        
        // 段2：发射点分配
        if (Math.random() < crossoverRate) {
            child.launchPointAssignment = parent1.launchPointAssignment.slice();
        } else {
            child.launchPointAssignment = parent2.launchPointAssignment.slice();
        }
        
        // 段3：BLX-α 交叉
        child.launchPointCoords = this.blxAlphaCrossover(
            parent1.launchPointCoords, parent2.launchPointCoords);
        
        this.repairChromosome(child);
        
        return child;
    }
    
    blxAlphaCrossover(parent1, parent2) {
        const child = [];
        const alpha = 0.5;
        
        for (let i = 0; i < parent1.length; i++) {
            const x1 = parent1[i];
            const x2 = parent2[i];
            
            const min = Math.min(x1, x2);
            const max = Math.max(x1, x2);
            const diff = max - min;
            
            const lower = min - alpha * diff;
            const upper = max + alpha * diff;
            
            let childGene = lower + Math.random() * (upper - lower);
            childGene = Math.round(childGene * 1000.0) / 1000.0;
            child.push(childGene);
        }
        
        return child;
    }
    
    repairChromosome(chrom) {
        const K = this.model.getTruckCount();
        const Mmax = Math.ceil(this.model.getLaunchPointCount() / K);
        const n = chrom.launchPointCoords.length / 2;
        
        // 确保发射点编号在有效范围
        for (let i = 0; i < chrom.launchPointAssignment.length; i++) {
            if (chrom.launchPointAssignment[i] < 0 || chrom.launchPointAssignment[i] > n) {
                chrom.launchPointAssignment[i] = 0;
            }
        }
        
        // 确保每辆卡车都有发射点
        for (let truckIdx = 0; truckIdx < K; truckIdx++) {
            let hasLaunchPoint = false;
            for (let m = 0; m < Mmax; m++) {
                const pos = truckIdx * Mmax + m;
                if (pos < chrom.launchPointAssignment.length && chrom.launchPointAssignment[pos] > 0) {
                    hasLaunchPoint = true;
                    break;
                }
            }
            
            if (!hasLaunchPoint) {
                for (let otherTruck = 0; otherTruck < K; otherTruck++) {
                    if (otherTruck === truckIdx) continue;
                    for (let m = 0; m < Mmax; m++) {
                        const pos = otherTruck * Mmax + m;
                        if (pos < chrom.launchPointAssignment.length && chrom.launchPointAssignment[pos] > 0) {
                            for (let m2 = 0; m2 < Mmax; m2++) {
                                const targetPos = truckIdx * Mmax + m2;
                                if (targetPos < chrom.launchPointAssignment.length && 
                                    chrom.launchPointAssignment[targetPos] === 0) {
                                    chrom.launchPointAssignment[targetPos] = chrom.launchPointAssignment[pos];
                                    chrom.launchPointAssignment[pos] = 0;
                                    hasLaunchPoint = true;
                                    break;
                                }
                            }
                            if (hasLaunchPoint) break;
                        }
                    }
                    if (hasLaunchPoint) break;
                }
                
                if (!hasLaunchPoint) {
                    for (let m = 0; m < Mmax; m++) {
                        const pos = truckIdx * Mmax + m;
                        if (pos < chrom.launchPointAssignment.length && chrom.launchPointAssignment[pos] === 0) {
                            chrom.launchPointAssignment[pos] = truckIdx + 1;
                            break;
                        }
                    }
                }
            }
        }
        
        // 确保 customerBlocks 中所有值都在有效范围
        for (let i = 0; i < chrom.customerBlocks.length; i++) {
            if (chrom.customerBlocks[i] < 1 || chrom.customerBlocks[i] > n) {
                chrom.customerBlocks[i] = Math.floor(Math.random() * n) + 1;
            }
        }
    }
    
    mutate(chrom, mutationRate, currentGen, maxGenerations) {
        const K = this.model.getTruckCount();
        const Mmax = Math.ceil(this.model.getLaunchPointCount() / K);
        const n = chrom.launchPointCoords.length / 2;
        
        // 段1：客户分块变异
        if (Math.random() < mutationRate) {
            if (Math.random() < 0.7) {
                // 70% 交换变异
                const i = Math.floor(Math.random() * chrom.customerBlocks.length);
                const j = Math.floor(Math.random() * chrom.customerBlocks.length);
                [chrom.customerBlocks[i], chrom.customerBlocks[j]] = 
                    [chrom.customerBlocks[j], chrom.customerBlocks[i]];
            } else {
                // 30% 随机重置
                const truckLPs = new Set(chrom.launchPointAssignment.filter(lp => lp > 0));
                const validLPs = Array.from(truckLPs);
                if (validLPs.length > 0) {
                    const i = Math.floor(Math.random() * chrom.customerBlocks.length);
                    chrom.customerBlocks[i] = validLPs[Math.floor(Math.random() * validLPs.length)];
                }
            }
        }
        
        // 段2：卡车间发射点交换
        if (Math.random() < mutationRate) {
            const trucksWithLP = [];
            for (let t = 0; t < K; t++) {
                let hasLP = false;
                for (let m = 0; m < Mmax; m++) {
                    const pos = t * Mmax + m;
                    if (pos < chrom.launchPointAssignment.length && chrom.launchPointAssignment[pos] > 0) {
                        hasLP = true;
                        break;
                    }
                }
                if (hasLP) trucksWithLP.push(t);
            }
            
            if (trucksWithLP.length >= 2) {
                const idx1 = Math.floor(Math.random() * trucksWithLP.length);
                let idx2 = Math.floor(Math.random() * trucksWithLP.length);
                while (idx2 === idx1) idx2 = Math.floor(Math.random() * trucksWithLP.length);
                
                const k1 = trucksWithLP[idx1];
                const k2 = trucksWithLP[idx2];
                
                const positions1 = [];
                const positions2 = [];
                for (let m = 0; m < Mmax; m++) {
                    const pos1 = k1 * Mmax + m;
                    const pos2 = k2 * Mmax + m;
                    if (pos1 < chrom.launchPointAssignment.length && chrom.launchPointAssignment[pos1] > 0) {
                        positions1.push(pos1);
                    }
                    if (pos2 < chrom.launchPointAssignment.length && chrom.launchPointAssignment[pos2] > 0) {
                        positions2.push(pos2);
                    }
                }
                
                if (positions1.length > 0 && positions2.length > 0) {
                    const pos1 = positions1[Math.floor(Math.random() * positions1.length)];
                    const pos2 = positions2[Math.floor(Math.random() * positions2.length)];
                    [chrom.launchPointAssignment[pos1], chrom.launchPointAssignment[pos2]] = 
                        [chrom.launchPointAssignment[pos2], chrom.launchPointAssignment[pos1]];
                }
            }
        }
        
        // 段3：自适应高斯变异
        if (Math.random() < mutationRate) {
            this.gaussianMutate(chrom.launchPointCoords, currentGen, maxGenerations);
        }
        
        this.repairChromosome(chrom);
    }
    
    gaussianMutate(values, currentGen, maxGenerations) {
        const lpConfig = this.model.launchPointConfig;
        const baseRange = lpConfig.mutationRange;
        
        let range = baseRange;
        if (lpConfig.adaptiveRange && maxGenerations > 0) {
            const progress = currentGen / maxGenerations;
            range = baseRange * (1.0 - progress * 0.5);
            range = Math.max(range, baseRange * 0.3);
        }
        
        const minX = this.model.minX;
        const maxX = this.model.maxX;
        const minY = this.model.minY;
        const maxY = this.model.maxY;
        
        const marginX = (maxX - minX) * 0.1;
        const marginY = (maxY - minY) * 0.1;
        const boundMinX = minX + marginX;
        const boundMaxX = maxX - marginX;
        const boundMinY = minY + marginY;
        const boundMaxY = maxY - marginY;
        
        for (let i = 0; i < values.length; i += 2) {
            const angle = Math.random() * 2 * Math.PI;
            const dx = Math.cos(angle) * range;
            const dy = Math.sin(angle) * range;
            
            let newX = values[i] + dx;
            newX = Math.max(boundMinX, Math.min(boundMaxX, newX));
            values[i] = Math.round(newX * 1000.0) / 1000.0;
            
            let newY = values[i + 1] + dy;
            newY = Math.max(boundMinY, Math.min(boundMaxY, newY));
            values[i + 1] = Math.round(newY * 1000.0) / 1000.0;
        }
    }
    
    createNextGeneration(population, fitness, config, fitnessFunc) {
        const popSize = config.genetic.populationSize;
        const eliteCount = Math.floor(popSize * config.genetic.eliteRate);
        const tournamentSize = config.genetic.tournamentSize;
        const crossoverRate = config.genetic.crossoverRate;
        const mutationRate = config.genetic.mutationRate;
        
        // 按适应度排序
        const indices = Array.from({ length: population.length }, (_, i) => i);
        indices.sort((a, b) => fitness[b] - fitness[a]);
        
        const sortedPopulation = indices.map(i => population[i]);
        
        const nextGen = [];
        
        // 精英保留
        for (let i = 0; i < eliteCount && i < sortedPopulation.length; i++) {
            nextGen.push(this.encoder.copyChromosome(sortedPopulation[i]));
        }
        
        // 生成剩余个体
        while (nextGen.length < popSize) {
            const parent = this.tournamentSelect(sortedPopulation, fitness, tournamentSize);
            
            let child;
            if (Math.random() < crossoverRate) {
                const parent2 = this.tournamentSelect(sortedPopulation, fitness, tournamentSize);
                child = this.crossover(parent, parent2, crossoverRate);
            } else {
                child = this.encoder.copyChromosome(parent);
            }
            
            this.mutate(child, mutationRate, nextGen.length, popSize);
            nextGen.push(child);
        }
        
        return nextGen;
    }
}

// ==================== GA 运行器 ====================
class GARunner {
    constructor(model) {
        this.model = model;
        this.config = model.config;
        this.encoder = new ChromosomeEncoder(model);
        this.decoder = new ChromosomeDecoder(model);
        this.fitnessFunc = new FitnessFunction(model);
        this.operators = new GAOperators(model);
        
        this.isRunning = false;
        this.shouldStop = false;
        this.generation = 0;
        this.bestChromosome = null;
        this.bestFitness = 0;
        this.bestTime = Infinity;
        this.timeCurve = [];
        this.startTime = 0;
        
        this.onProgress = null;
        this.onLog = null;
        this.onComplete = null;
        this.onRouteUpdate = null;
        this.onTimeCurveUpdate = null;
    }
    
    log(message, type = 'info') {
        if (this.onLog) this.onLog(message, type);
    }
    
    async run() {
        this.isRunning = true;
        this.shouldStop = false;
        this.startTime = Date.now();
        this.generation = 0;
        this.bestChromosome = null;
        this.bestFitness = 0;
        this.bestTime = Infinity;
        this.timeCurve = [];
        
        const config = this.config;
        const populationSize = config.genetic.populationSize;
        const maxGenerations = config.genetic.maxGenerations;
        
        this.log('开始遗传算法优化...', 'info');
        this.log(`种群规模: ${populationSize}`, 'info');
        this.log(`最大迭代: ${maxGenerations}`, 'info');
        this.log(`发射点数量: ${this.model.getLaunchPointCount()}`, 'info');
        
        // 种群初始化：1个基础 + 90%扰动 + 10%随机
        const population = [];
        
        this.log('初始化种群...', 'info');
        const base = this.encoder.createBaseChromosome();
        population.push(base);
        
        const perturbedCount = Math.floor(populationSize * 0.9);
        const randomCount = populationSize - 1 - perturbedCount;
        
        for (let i = 0; i < perturbedCount; i++) {
            population.push(this.encoder.applyPerturbation(base));
        }
        
        for (let i = 0; i < randomCount; i++) {
            population.push(this.encoder.createFullyRandomChromosome());
        }
        
        this.log(`种群初始化完成: ${populationSize} 个个体`, 'success');
        
        // 计算初始适应度
        let fitness = population.map(chrom => this.fitnessFunc.calculateFitness(chrom));
        
        // 主循环
        for (let gen = 0; gen < maxGenerations && !this.shouldStop; gen++) {
            this.generation = gen + 1;
            
            // 排序
            const indices = Array.from({ length: population.length }, (_, i) => i);
            indices.sort((a, b) => fitness[b] - fitness[a]);
            
            const sortedPopulation = indices.map(i => population[i]);
            const sortedFitness = indices.map(i => fitness[i]);
            
            // 更新最优
            if (sortedFitness[0] > this.bestFitness) {
                this.bestFitness = sortedFitness[0];
                this.bestChromosome = this.encoder.copyChromosome(sortedPopulation[0]);
                
                const evalResult = this.fitnessFunc.evaluate(this.bestChromosome);
                this.bestTime = evalResult.totalTime;
            }
            
            // 记录收敛曲线
            const currentResult = this.fitnessFunc.evaluate(sortedPopulation[0]);
            this.timeCurve.push(currentResult.effectiveTime);
            
            // 每代更新收敛曲线
            if (this.onTimeCurveUpdate) {
                this.onTimeCurveUpdate([...this.timeCurve]);
            }
            
            // 进度回调
            if (gen % 10 === 0 && this.onProgress) {
                const progress = (gen / maxGenerations) * 100;
                this.onProgress(progress, gen, maxGenerations, this.bestTime);
            }
            
            if (gen % 100 === 0) {
                this.log(`迭代 ${gen}/${maxGenerations}: 最优时间 = ${this.bestTime.toFixed(2)} min`, 'success');
            }
            
            // 每代更新路线图
            if (this.onRouteUpdate && this.bestChromosome) {
                const decodeResult = this.decoder.decode(this.bestChromosome);
                this.onRouteUpdate({
                    launchPoints: decodeResult.allLaunchPoints,
                    truckRoutes: decodeResult.truckRoutes,
                    droneTasks: decodeResult.droneTasks,
                    droneToLaunchPoint: decodeResult.droneToLaunchPoint
                });
            }
            
            // 创建下一代
            const nextGen = this.operators.createNextGeneration(
                sortedPopulation, sortedFitness, config, this.fitnessFunc);
            
            population.length = 0;
            population.push(...nextGen);
            
            fitness = population.map(chrom => this.fitnessFunc.calculateFitness(chrom));
            
            // 让出控制权
            if (gen % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        const duration = (Date.now() - this.startTime) / 1000;
        
        this.log(`优化完成! 耗时: ${duration.toFixed(2)}s`, 'success');
        this.log(`最优配送时间: ${this.bestTime.toFixed(2)} min`, 'success');
        
        this.isRunning = false;
        
        if (this.onComplete) {
            const decodeResult = this.decoder.decode(this.bestChromosome);
            this.onComplete({
                solution: {
                    launchPoints: decodeResult.allLaunchPoints,
                    truckRoutes: decodeResult.truckRoutes,
                    droneTasks: decodeResult.droneTasks,
                    droneToLaunchPoint: decodeResult.droneToLaunchPoint
                },
                time: this.bestTime,
                iterations: this.generation,
                duration,
                timeCurve: this.timeCurve
            });
        }
    }
    
    stop() {
        this.shouldStop = true;
    }
}
