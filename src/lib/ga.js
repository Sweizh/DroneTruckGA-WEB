/**
 * 遗传算法运行器 - 主线程代理
 * 实际 GA 主循环在 Web Worker 中执行
 */

export class GARunner {
    constructor(config) {
        this.config = config;
        this.worker = null;
        this.isRunning = false;
        this.shouldStop = false;

        this.onLog = null;
        this.onProgress = null;
        this.onComplete = null;
        this.onRouteUpdate = null;
        this.onTimeCurveUpdate = null;
    }

    run() {
        if (this.isRunning) {
            return Promise.reject(new Error('GARunner is already running'));
        }

        this.isRunning = true;
        this.shouldStop = false;

        return new Promise((resolve, reject) => {
            let worker;
            try {
                // Vite 支持的 Worker 导入方式，兼容 GitHub Pages 子路径部署
                worker = new Worker(
                    new URL('./ga.worker.js', import.meta.url),
                    { type: 'module' }
                );
            } catch (err) {
                this.isRunning = false;
                reject(err);
                return;
            }
            this.worker = worker;

            worker.onmessage = (e) => {
                const msg = e.data;
                switch (msg.type) {
                    case 'log':
                        if (this.onLog) this.onLog(msg.message, msg.level);
                        break;
                    case 'progress':
                        if (this.onProgress) {
                            this.onProgress(msg.progress, msg.gen, msg.maxGen, msg.time);
                        }
                        break;
                    case 'route':
                        if (this.onRouteUpdate) this.onRouteUpdate(msg.solution);
                        break;
                    case 'timeCurve':
                        if (this.onTimeCurveUpdate) this.onTimeCurveUpdate(msg.timeCurve);
                        break;
                    case 'complete':
                        this.isRunning = false;
                        if (this.worker) {
                            this.worker.terminate();
                            this.worker = null;
                        }
                        if (this.onComplete) this.onComplete(msg.result);
                        resolve(msg.result);
                        break;
                    case 'error':
                        this.isRunning = false;
                        if (this.worker) {
                            this.worker.terminate();
                            this.worker = null;
                        }
                        reject(new Error(msg.message || 'Worker error'));
                        break;
                    default:
                        break;
                }
            };

            worker.onerror = (err) => {
                this.isRunning = false;
                if (this.worker) {
                    this.worker.terminate();
                    this.worker = null;
                }
                reject(new Error(err.message || 'Worker error'));
            };

            worker.postMessage({ type: 'start', config: this.config });
        });
    }

    stop() {
        this.shouldStop = true;
        if (this.worker) {
            this.worker.postMessage({ type: 'stop' });
        }
    }
}
