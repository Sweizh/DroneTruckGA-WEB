/**
 * 问题模型 - 功能等价于原始 Java ProblemModel.java
 * 包含 K-means 聚类、肘部法则、完整的时间计算
 */

export class ProblemModel {
    constructor(config) {
        this.config = config;
        this.depots = config.problem.depots.map(d => ({
            id: d.id, x: d.x, y: d.y, isDepot: true
        }));
        this.customers = config.problem.customers.map(c => ({
            id: c.id, x: c.x, y: c.y,
            demand: c.demand, depotId: c.depotId,
            startTimeWindow: c.timeWindow[0],
            endTimeWindow: c.timeWindow[1],
            serviceTime: c.serviceTime || 1.5
        }));
        
        this.depotMap = new Map();
        this.depots.forEach(d => this.depotMap.set(d.id, d));
        
        this.customerMap = new Map();
        this.customers.forEach(c => this.customerMap.set(c.id, c));
        
        this.truckCount = config.vehicles.trucks.count;
        this.truckCapacity = config.vehicles.trucks.capacity;
        this.truckSpeed = config.vehicles.trucks.speed;
        this.truckRange = config.vehicles.trucks.range;
        this.dronesPerTruck = config.vehicles.trucks.dronesPerTruck;

        this.droneCount = this.truckCount * this.dronesPerTruck;
        this.droneRange = config.vehicles.drones.range;
        this.droneSpeed = config.vehicles.drones.speed;
        this.droneMaxPayload = config.vehicles.drones.maxPayload;
        this.droneRechargeTime = config.vehicles.drones.rechargeTime;
        this.droneServiceTime = config.vehicles.drones.serviceTime;

        this.launchPointConfig = config.launchPoint;

        this.penaltyEnabled = config.penalty.enabled;
        this.timeWindowEarly = config.penalty.timeWindowEarly;
        this.timeWindowLate = config.penalty.timeWindowLate;
        this.droneRangePenalty = config.penalty.droneRangePenalty;
        this.dronePayloadPenalty = config.penalty.dronePayloadPenalty;
        this.truckRangeTimePenalty = config.penalty.truckRangeTimePenalty;
        this.distancePenalty = config.penalty.distancePenalty;
        
        this.maxTime = config.normalization.maxTime;
        
        this.minX = null; this.maxX = null;
        this.minY = null; this.maxY = null;
        this.calculateBounds();
        
        this.launchPointCount = this.calculateLaunchPointCount();
    }
    
    calculateBounds() {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        for (const depot of this.depots) {
            minX = Math.min(minX, depot.x);
            maxX = Math.max(maxX, depot.x);
            minY = Math.min(minY, depot.y);
            maxY = Math.max(maxY, depot.y);
        }
        
        for (const customer of this.customers) {
            minX = Math.min(minX, customer.x);
            maxX = Math.max(maxX, customer.x);
            minY = Math.min(minY, customer.y);
            maxY = Math.max(maxY, customer.y);
        }
        
        this.minX = minX; this.maxX = maxX;
        this.minY = minY; this.maxY = maxY;
    }
    
    calculateLaunchPointCount() {
        const targetN = this.launchPointConfig.launchPointCount;
        
        if (targetN <= 0) {
            const optimalK = this.determineOptimalKByElbow();
            return this.validateAndAdjustLaunchPointCount(optimalK);
        } else {
            return this.validateAndAdjustLaunchPointCount(targetN);
        }
    }
    
    validateAndAdjustLaunchPointCount(n) {
        const K = this.truckCount;
        const N = this.customers.length;
        const U = this.dronesPerTruck;
        
        let maxN = Math.ceil(N / U) - 1;
        if (maxN < K + 1) maxN = K + 1;
        
        if (n < K) n = K;
        if (n >= maxN) n = maxN;
        if (n < 1) n = 1;
        
        return n;
    }
    
    determineOptimalKByElbow() {
        const K = this.truckCount;
        const N = this.customers.length;
        const U = this.dronesPerTruck;
        
        let maxPossibleK = Math.ceil(N / U) - 1;
        if (maxPossibleK < K + 1) maxPossibleK = K + 1;
        
        const minK = K;
        const maxK = maxPossibleK;
        
        if (minK >= maxK) return minK;
        
        const sseValues = [];
        const kValues = [];
        
        for (let k = minK; k <= maxK; k++) {
            const clusters = ProblemModel.kmeansClustering(this.customers, k, this.launchPointConfig.kmeansMaxIterations);
            const centroids = clusters.map(c => ProblemModel.calculateCentroid(c));
            sseValues.push(ProblemModel.calculateSSE(clusters, centroids));
            kValues.push(k);
        }
        
        if (sseValues.length < 3) return minK;
        
        const firstDiff = [];
        for (let i = 0; i < sseValues.length - 1; i++) {
            firstDiff.push(sseValues[i] - sseValues[i + 1]);
        }
        
        const secondDiff = [];
        for (let i = 0; i < firstDiff.length - 1; i++) {
            secondDiff.push(firstDiff[i] - firstDiff[i + 1]);
        }
        
        let minCurvature = Infinity;
        let optimalK = minK;
        
        for (let i = 0; i < secondDiff.length; i++) {
            if (secondDiff[i] < minCurvature) {
                minCurvature = secondDiff[i];
                optimalK = kValues[i + 2];
            }
        }
        
        return optimalK;
    }
    
    static kmeansClustering(customers, k, maxIterations) {
        if (customers.length === 0 || k <= 0) return [];
        
        const centroids = ProblemModel.kmeansPlusPlusInit(customers, k);
        
        let clusters = Array.from({ length: k }, () => []);
        
        for (let iter = 0; iter < maxIterations; iter++) {
            clusters = Array.from({ length: k }, () => []);
            
            for (const customer of customers) {
                let nearestCluster = 0;
                let minDist = Infinity;
                
                for (let i = 0; i < centroids.length; i++) {
                    const dist = Math.sqrt(
                        Math.pow(customer.x - centroids[i][0], 2) +
                        Math.pow(customer.y - centroids[i][1], 2)
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        nearestCluster = i;
                    }
                }
                
                clusters[nearestCluster].push(customer);
            }
            
            let converged = true;
            for (let i = 0; i < k; i++) {
                if (clusters[i].length === 0) continue;
                
                const newCentroid = ProblemModel.calculateCentroid(clusters[i]);
                if (Math.abs(newCentroid[0] - centroids[i][0]) > 0.001 ||
                    Math.abs(newCentroid[1] - centroids[i][1]) > 0.001) {
                    converged = false;
                }
                centroids[i] = newCentroid;
            }
            
            if (converged) break;
        }
        
        // 空聚类修复逻辑
        for (let i = 0; i < k; i++) {
            if (clusters[i].length === 0) {
                let maxCluster = 0;
                let maxSize = 0;
                for (let j = 0; j < k; j++) {
                    if (clusters[j].length > maxSize) {
                        maxSize = clusters[j].length;
                        maxCluster = j;
                    }
                }
                
                if (maxSize > 1) {
                    const toMove = clusters[maxCluster].splice(0, 1)[0];
                    clusters[i].push(toMove);
                    centroids[i] = ProblemModel.calculateCentroid(clusters[i]);
                    centroids[maxCluster] = ProblemModel.calculateCentroid(clusters[maxCluster]);
                }
            }
        }
        
        return clusters;
    }
    
    static kmeansPlusPlusInit(customers, k) {
        const centroids = [];
        
        const first = customers[Math.floor(Math.random() * customers.length)];
        centroids.push([first.x, first.y]);
        
        while (centroids.length < k) {
            const dists = customers.map(c => {
                let minDist = Infinity;
                for (const center of centroids) {
                    const d = Math.sqrt(
                        Math.pow(c.x - center[0], 2) +
                        Math.pow(c.y - center[1], 2)
                    );
                    minDist = Math.min(minDist, d);
                }
                return minDist * minDist;
            });
            
            const totalDist = dists.reduce((a, b) => a + b, 0);
            let r = Math.random() * totalDist;
            
            for (let i = 0; i < customers.length; i++) {
                r -= dists[i];
                if (r <= 0) {
                    centroids.push([customers[i].x, customers[i].y]);
                    break;
                }
            }
        }
        
        return centroids;
    }
    
    static calculateCentroid(customers) {
        if (customers.length === 0) return [0, 0];
        
        let sumX = 0, sumY = 0;
        for (const c of customers) {
            sumX += c.x;
            sumY += c.y;
        }
        
        return [sumX / customers.length, sumY / customers.length];
    }
    
    static calculateSSE(clusters, centroids) {
        let sse = 0;
        
        for (let i = 0; i < clusters.length && i < centroids.length; i++) {
            for (const customer of clusters[i]) {
                const dist = Math.sqrt(
                    Math.pow(customer.x - centroids[i][0], 2) +
                    Math.pow(customer.y - centroids[i][1], 2)
                );
                sse += dist * dist;
            }
        }
        
        return sse;
    }
    
    getDistance(p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }
    
    getDistanceXY(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }
    
    getDepotCount() { return this.depots.length; }
    getCustomerCount() { return this.customers.length; }
    getTruckCount() { return this.truckCount; }
    getDroneCount() { return this.droneCount; }
    getDronesPerTruck() { return this.dronesPerTruck; }
    getTruckSpeed() { return this.truckSpeed; }
    getDroneSpeed() { return this.droneSpeed; }
    getDroneRange() { return this.droneRange; }
    getDroneMaxPayload() { return this.droneMaxPayload; }
    getTruckRange() { return this.truckRange; }
    getLaunchPointCount() { return this.launchPointCount; }
}
