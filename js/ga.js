/**
 * 遗传算法运行器 - 主线程代理
 *
 * 实际的 GA 主循环已迁移至 Web Worker (js/ga.worker.js)，以避免
 * 大种群 (10000) × 多代 (2500) 长时间运行时阻塞 UI。
 *
 * 本类仅作为主线程侧的代理：构造 Worker、转发回调、返回 Promise。
 * 保留与旧 GARunner 完全相同的回调接口 (onLog / onProgress /
 * onRouteUpdate / onTimeCurveUpdate / onComplete) 以及构造签名
 * `new GARunner(model)`，因此 js/app.js 的调用代码无需改动。
 *
 * Worker 通过相对路径 'js/ga.worker.js' 加载，便于在 GitHub Pages
 * 项目子路径下部署运行。
 */

class GARunner {
    constructor(model) {
        // model 仍按旧签名传入以保持 app.js 兼容；代理只需要其中的 config。
        this.config = model ? model.config : null;
        this.worker = null;
        this.isRunning = false;
        this.shouldStop = false;

        // 回调接口（与原 GARunner 保持一致）
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
                // 相对路径，便于在 GitHub Pages 项目子路径下运行
                worker = new Worker('js/ga.worker.js');
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

            // 启动 worker：发送完整 config
            worker.postMessage({ type: 'start', config: this.config });
        });
    }

    stop() {
        this.shouldStop = true;
        if (this.worker) {
            // 仅通知 worker 停止；不在 worker 内部 terminate，
            // 由主循环在下次 yield 后退出，并最终触发 'complete'。
            this.worker.postMessage({ type: 'stop' });
        }
    }
}
