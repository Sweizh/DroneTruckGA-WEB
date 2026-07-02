# 卡车-无人机协同配送可视化网页 - 美化 / 性能 / 多终端适配 Spec

## Why
当前可视化网页能完成毕业论文中遗传算法的展示，但存在三类明显短板：
1. GA 在主线程同步执行（默认种群 10000 × 迭代 2500），运行时 UI 卡顿、控制台与地图无法实时刷新；
2. 响应式仅做基础断点，平板/手机端右侧控制台被直接隐藏，触控交互不友好，地图与表单在小屏下阅读困难；
3. 视觉表现停留在"可用"层级，缺少加载态、过渡动画与论文展示所需的专业质感。

为达到毕业答辩展示 + GitHub Pages 公开托管交付的要求，需要统一进行美化、性能优化与多终端适配。

## What Changes
- **性能优化（核心）**
  - 将遗传算法（GA）主循环迁移至 Web Worker，主线程仅负责 UI 与 Canvas 渲染，彻底消除卡顿
  - 渲染节流：GA 运行期间地图/曲线按"每 N 代 + requestAnimationFrame"批量刷新，停止无意义的高频重绘
  - 收敛曲线绘制改为增量采样（数据点过多时降采样），避免长序列下的卡顿
  - 优化适应度函数热点（距离计算、Map 查找），减少冗余 `findIndex` / `Math.sqrt`
- **多终端适配**
  - 重构断点：桌面（≥1200px）/ 平板（768–1199px）/ 手机（<768px）三档
  - 平板端右侧控制台改为可折叠抽屉（而非直接隐藏），保留运行日志可见性
  - 手机端：顶栏精简图标化、导航改为底部 Tab Bar、统计卡片自适应、表单单列、Canvas 高度跟随视口
  - 触控支持：地图支持双指缩放与拖拽（pinch-zoom）、按钮增大点击热区
  - Canvas 尺寸随容器 ResizeObserver 自适应，DPR 处理保留
- **视觉美化**
  - 统一设计令牌（间距、圆角、阴影、动效曲线）并补齐浅色主题细节
  - 增加运行态视觉反馈：进度条流光、状态指示灯呼吸、按钮 hover/active 微动效
  - 空状态/加载骨架：地图与曲线在无数据时展示引导文案而非纯"暂无数据"
  - 收敛曲线增加最优值标注线、网格细化、图例
  - 表格、表单在移动端的可读性优化（行间距、字号、粘性表头）
- **GitHub Pages 托管交付**
  - 新增 `.github/workflows/deploy.yml`：push 到 main 时自动构建并部署到 GitHub Pages
  - 校验所有资源路径为相对路径（已是相对路径，需复核）
  - 新增 `README.md` 说明本地预览与部署方式（仅在交付需要时创建，按用户要求）
  - 配置 `base` 路径兼容 Project Pages（`/<repo>/`），保证子路径资源加载正确

## Impact
- 受影响代码：
  - [js/ga.js](file:///workspace/js/ga.js) — GA 主循环抽离为 Worker 脚本
  - [js/canvas.js](file:///workspace/js/canvas.js) — 渲染节流、增量绘制、ResizeObserver
  - [js/app.js](file:///workspace/js/app.js) — Worker 消息桥接、渲染调度
  - [js/ui.js](file:///workspace/js/ui.js) — 移动端导航、抽屉、触控
  - [css/style.css](file:///workspace/css/style.css) — 断点重构、设计令牌、动效
  - [index.html](file:///workspace/index.html) — 结构调整（底部 Tab、抽屉容器）、base 路径
  - 新增 `.github/workflows/deploy.yml`、`README.md`、Worker 脚本
- **BREAKING**：GA 执行方式从主线程改为 Worker，`GARunner` 不再直接在主线程暴露同步 API（仅影响内部调用，对外行为不变）
- 兼容性：保持浏览器原生 ES Module + Web Worker，无需构建工具，零依赖，适配 GitHub Pages 静态托管

## ADDED Requirements

### Requirement: Web Worker 执行遗传算法
系统 SHALL 将遗传算法主循环放入 Web Worker 中执行，主线程通过 `postMessage` 进行控制（启动/停止）与状态回调（进度/日志/路线/收敛曲线/完成）。

#### Scenario: 启动 GA 时 UI 不卡顿
- **WHEN** 用户点击"开始运行"并设置种群 10000、迭代 2500
- **THEN** 顶栏按钮、控制台滚动、地图拖拽均保持流畅响应（主线程帧率 ≥ 30fps）

#### Scenario: 停止 GA 立即生效
- **WHEN** 用户在运行中点击"停止"
- **THEN** Worker 在当前代结束前终止并在 ≤ 500ms 内回传最终结果，主线程恢复"就绪"态

### Requirement: 渲染节流与增量更新
系统 SHALL 在 GA 运行期间对地图与收敛曲线渲染进行节流，按"每 N 代（默认 N=5）+ requestAnimationFrame 合批"刷新，避免每代都触发完整重绘。

#### Scenario: 大规模迭代下渲染不阻塞
- **WHEN** GA 处于运行态且每代产生新数据
- **THEN** 地图路线与收敛曲线最多以约 30fps 更新，且非最新代的数据被合并

### Requirement: 多终端响应式布局
系统 SHALL 提供桌面 / 平板 / 手机三档自适应布局，并在手机端提供底部 Tab 导航与可折叠控制台。

#### Scenario: 手机端导航
- **WHEN** 视口宽度 < 768px
- **THEN** 左侧导航转为底部 Tab Bar，顶栏按钮收缩为图标，统计卡片改为 2 列

#### Scenario: 平板端控制台可见
- **WHEN** 视口宽度在 768–1199px
- **THEN** 右侧控制台以可折叠抽屉形式存在，默认收起，点击可展开覆盖部分主区域

### Requirement: 触控手势支持
系统 SHALL 在地图上支持双指缩放（pinch-zoom）与单指拖拽，按钮点击热区在移动端不小于 40×40px。

#### Scenario: 手机端地图缩放
- **WHEN** 用户在地图上双指捏合
- **THEN** 地图以双指中点为锚点缩放，且不触发页面整体滚动

### Requirement: GitHub Pages 自动部署
项目 SHALL 包含 GitHub Actions 工作流，在推送到 `main` 分支时自动将静态文件部署到 GitHub Pages。

#### Scenario: 推送 main 自动上线
- **WHEN** 代码推送到 `main` 分支
- **THEN** GitHub Actions 构建并通过 Pages 发布，无需手动操作

## MODIFIED Requirements

### Requirement: 视觉设计系统
原有 CSS 变量体系保留，新增统一动效曲线、间距阶梯与组件级阴影；浅色主题补齐 map-legend / map-ctrl 等组件的细节，确保明暗两套主题在所有终端下视觉一致。

### Requirement: 收敛曲线可视化
收敛曲线 SHALL 在原有基础上增加：最优值水平参考线、轴标签单位、图例、数据点降采样（>500 点时按 LTTB 或等距采样至 ≤500 点）。

## REMOVED Requirements
无删除项。所有现有功能保留并增强。
