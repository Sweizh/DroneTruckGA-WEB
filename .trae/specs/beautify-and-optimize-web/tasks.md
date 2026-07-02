# Tasks

- [x] Task 1: 抽离遗传算法到 Web Worker
  - [x] SubTask 1.1: 创建 `js/ga.worker.js`，将 `ChromosomeEncoder` / `ChromosomeDecoder` / `FitnessFunction` / `GAOperators` / `GARunner` 及其依赖（ProblemModel 静态方法）迁移至 Worker 脚本
  - [x] SubTask 1.2: 主线程 `GARunner` 改为 Worker 代理，通过 `postMessage` 收发指令（start/stop）与回调（log/progress/route/timeCurve/complete）
  - [x] SubTask 1.3: 适配 `js/app.js` 中 `startGA`/`stopGA` 的事件绑定，保留对外行为不变
  - [x] SubTask 1.4: 处理 Worker 错误与意外退出（onerror / onmessageerror），主线程回退到"就绪"态并提示

- [x] Task 2: GA 运行期渲染节流与数据降采样
  - [x] SubTask 2.1: 在 `app.js` 引入渲染调度器，对 `onRouteUpdate` / `onTimeCurveUpdate` 按"每 N 代 + rAF 合批"节流（默认 N=5）
  - [x] SubTask 2.2: `ChartCanvas.setData` 接收原始序列后做降采样（>500 点等距采样至 500），并缓存降采样结果避免重复计算
  - [x] SubTask 2.3: 收敛曲线增加最优值水平参考线、单位标注、图例
  - [x] SubTask 2.4: 优化 `FitnessFunction` 热点：用 Map 替代 `findIndex`、缓存距离平方根

- [x] Task 3: 响应式布局重构（多终端适配）
  - [x] SubTask 3.1: 重写 `css/style.css` 断点：桌面 ≥1200px / 平板 768–1199px / 手机 <768px
  - [x] SubTask 3.2: 平板端右侧控制台改为可折叠抽屉（默认收起，按钮切换），新增遮罩层
  - [x] SubTask 3.3: 手机端：左侧导航转底部 Tab Bar、顶栏图标化、统计卡片 2 列、表单单列
  - [x] SubTask 3.4: 在 `index.html` 增加底部 Tab Bar 与抽屉触发按钮的 DOM 结构，`ui.js` 绑定切换事件
  - [x] SubTask 3.5: 触控支持：地图 pinch-zoom（touch 事件处理）、按钮最小热区 40×40px、禁用双击缩放
    - 备注：按钮最小热区 40×40px 与 touch-action:manipulation 已完成；地图 pinch-zoom 与单指拖拽由 Task 7 补齐（`MapCanvas` 已注册 touchstart/touchmove/touchend/touchcancel，单指更新 offset 平移，双指按距离比缩放并以中点为锚点）。

- [x] Task 4: Canvas 自适应与 ResizeObserver
  - [x] SubTask 4.1: `MapCanvas` / `ChartCanvas` 用 `ResizeObserver` 监听父容器尺寸变化，替代当前 `window.resize` 节流
  - [x] SubTask 4.2: Canvas 高度在手机端按视口百分比自适应（如 `min(45vh, 455px)`）
  - [x] SubTask 4.3: 修复当前 `ctx.scale(dpr)` 累积缩放问题（每次 resize 前重置 transform）

- [x] Task 5: 视觉美化与设计令牌统一
  - [x] SubTask 5.1: 在 `:root` 补齐间距阶梯（`--space-1`…`--space-8`）、动效曲线令牌，并替换硬编码值
  - [x] SubTask 5.2: 浅色主题补齐 `.map-legend` / `.map-ctrl-btn` / `.topbar` 细节，确保明暗一致
  - [x] SubTask 5.3: 运行态视觉反馈：进度条流光动画、状态灯呼吸、`topbar-btn--run` hover 微动效
  - [x] SubTask 5.4: 空状态/加载骨架：地图与曲线无数据时展示引导文案 + 图标，而非纯"暂无数据"
  - [x] SubTask 5.5: 表格粘性表头、行间距、移动端字号优化

- [x] Task 6: GitHub Pages 部署交付
  - [x] SubTask 6.1: 新增 `.github/workflows/deploy.yml`，push 到 main 时部署静态站点到 GitHub Pages
  - [x] SubTask 6.2: 复核所有资源路径为相对路径；为支持 Project Pages 子路径（`/<repo>/`），在引用资源处使用相对路径或注入 base
  - [x] SubTask 6.3: 新增 `README.md`，说明项目简介、本地预览（`python -m http.server`）、部署方式与功能截图占位
  - [x] SubTask 6.4: 本地起静态服务器冒烟验证：加载 C101、运行 GA、切换页面、缩放地图、移动端断点均正常

# 修复任务（验证阶段追加）

- [x] Task 7: 补齐地图触控交互（pinch-zoom + 单指拖拽）
  - 背景：验证发现 `js/canvas.js` 的 `MapCanvas` 未注册任何 `touchstart/touchmove/touchend` 事件，导致触屏设备（手机/平板）上地图既无法单指拖拽也无法双指 pinch-zoom。CSS `.map-container { touch-action:none }` 仅阻止了页面整体滚动，未提供任何触控交互。检查清单第 9 项「地图支持双指 pinch-zoom 与单指拖拽」因此未通过。
  - 修复要点：
    - [x] SubTask 7.1: 在 `MapCanvas.initEvents()` 中注册 `touchstart` / `touchmove` / `touchend`（/ `touchcancel`）处理器。
    - [x] SubTask 7.2: 单指（`e.touches.length === 1`）时复用现有 `onMouseDown/onMouseMove` 的位移逻辑（更新 `offset` 并 `render()`）。
    - [x] SubTask 7.3: 双指（`e.touches.length === 2`）时计算两指间距离，与上一次距离比较得到缩放因子，复用 `onWheel` 的以指针中点为锚点的缩放逻辑（更新 `scale` 与 `offset`），并 `e.preventDefault()` 阻止浏览器默认 pinch 缩放。
    - [x] SubTask 7.4: 触摸结束（`touchend` 且剩余触点 <2）时重置内部 pinch 状态（如 `_lastPinchDist`）。
    - [x] SubTask 7.5: 确保 `.map-container { touch-action: none }` 保留，以阻止页面滚动；并在各 touch 处理器中按需 `e.preventDefault()`。
  - 验收：在手机断点（<768px）与平板断点（768–1199px）下，单指可拖拽地图、双指可缩放地图，且不触发页面整体滚动。✅ 已通过代码验证：`onTouchStart/Move/End` 全部实现，pan 用 offset+=，pinch 用距离比 + 中点锚点缩放 + 中点位移平移，scale 夹紧 [0.1,10]，除零已守卫（lastDist>0），2→1 手指切换已处理。

# Task Dependencies
- Task 2 依赖 Task 1（Worker 完成后再做渲染节流，避免重复改造）
- Task 4 可与 Task 3 并行（均涉及 Canvas/布局，但文件不同）
- Task 5 可与 Task 1/2 并行（纯 CSS/视觉，无逻辑耦合）
- Task 6 依赖 Task 1–5 全部完成后再做冒烟验证
