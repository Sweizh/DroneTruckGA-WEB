/**
 * 配置系统 - 功能等价于原始 Java Config.java
 * 所有参数均从配置读取，代码中不包含硬编码参数值
 */

const DEFAULT_CONFIG = {
    problem: {
        depots: [{ id: 0, x: 40.0, y: 50.0 }],
        customers: []
    },
    vehicles: {
        trucks: {
            count: 6,
            capacity: 2000.0,
            speed: 40.0,
            dronesPerTruck: 4,
            range: 1000.0
        },
        drones: {
            range: 50.0,
            speed: 60.0,
            maxPayload: 50.0,
            rechargeTime: 10.0,
            serviceTime: 1.5
        }
    },
    launchPoint: {
        initialOffset: 5.0,
        mutationRange: 3.0,
        historyInfluence: 0.5,
        historySize: 20,
        adaptiveRange: true,
        successThreshold: 0.0001,
        launchPointCount: 0,
        minLaunchPointsRatio: 1.0,
        kmeansMaxIterations: 100
    },
    genetic: {
        populationSize: 100,
        maxGenerations: 300,
        crossoverRate: 0.9,
        mutationRate: 0.7,
        eliteRate: 0.3,
        tournamentSize: 2
    },
    penalty: {
        enabled: true,
        timeWindowEarly: 2.0,
        timeWindowLate: 5.0,
        droneRangePenalty: 50.0,
        dronePayloadPenalty: 20.0,
        truckRangeTimePenalty: 5.0,
        distancePenalty: 5.0
    },
    normalization: {
        maxTime: 10000.0
    }
};

export function getDefaultConfig() {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

export function loadConfigFromJSON(json) {
    try {
        const config = JSON.parse(json);
        return mergeConfig(getDefaultConfig(), config);
    } catch (e) {
        console.error('Failed to parse config:', e);
        return getDefaultConfig();
    }
}

export function mergeConfig(defaultConfig, userConfig) {
    const result = JSON.parse(JSON.stringify(defaultConfig));
    
    function deepMerge(target, source) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }
    
    return deepMerge(result, userConfig);
}

export function exportConfig(config) {
    return JSON.stringify(config, null, 2);
}

export function generateRandomCustomers(count, depot) {
    const customers = [];
    for (let i = 1; i <= count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 10 + Math.random() * 40;
        const twStart = Math.floor(Math.random() * 1000);
        const twEnd = twStart + 55 + Math.floor(Math.random() * 70);
        
        customers.push({
            id: i,
            x: Math.round((depot.x + radius * Math.cos(angle)) * 10) / 10,
            y: Math.round((depot.y + radius * Math.sin(angle)) * 10) / 10,
            demand: (Math.floor(Math.random() * 5) + 1) * 10,
            depotId: depot.id,
            timeWindow: [twStart, twEnd],
            serviceTime: 1.5
        });
    }
    return customers;
}
