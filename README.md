# 卡车-无人机协同配送路径优化的遗传算法设计 — 可视化系统

本项目是「卡车-无人机协同配送路径优化（遗传算法）」毕业设计的可视化前端。基于 **Vue 3 + Vite + Tailwind CSS + ECharts** 现代前端技术栈实现，支持 Solomon 基准算例加载、遗传算法（GA）参数可视化配置、实时收敛曲线与地图路线可视化、配送方案输出，并提供深色/浅色主题切换及桌面/平板/手机多终端响应式布局。

## 功能特性

- **Solomon 算例加载**：内置 C101 / C201 / R101 / R201 / RC101 / RC201 等经典基准算例，一键切换。
- **GA 参数可视化配置**：种群规模、迭代次数、交叉率、变异率、精英率、锦标赛规模、各类惩罚权重等均可调。
- **实时地图可视化**：仓库、客户、发射点、卡车与无人机路线分层渲染，支持缩放与拖拽交互（ECharts）。
- **收敛曲线**：实时绘制目标值随迭代的变化，含最优值参考线与大数据量降采样。
- **配送方案输出**：结构化展示每辆卡车 / 每架无人机的配送任务与时间安排。
- **主题切换**：深色 / 浅色 / 跟随系统三档自适应，毛玻璃（Glassmorphism）设计语言。
- **响应式多终端**：桌面侧边栏、平板抽屉、手机底部标签栏，覆盖主流设备。
- **Web Worker 异步执行**：GA 主循环在 Worker 线程运行，主线程 UI 不卡顿；requestAnimationFrame 合并渲染调度。
- **配置导入 / 导出**：参数以 JSON 一键保存与加载，便于复现实验。

## 技术栈

- **Vue 3** — 组合式 API（`<script setup>`）+ 响应式状态管理（Composable 单例模式）
- **Vite 6** — 极速开发与构建（`base: './'` 适配 GitHub Pages 子路径部署）
- **Tailwind CSS 3** — 原子化样式 + CSS 变量主题系统
- **ECharts 5** — 地图散点 / 路线与收敛曲线可视化
- **Web Worker** — GA 主循环异步执行（Vite ES Module Worker）
- **ResizeObserver / MutationObserver** — 图表自适应尺寸与主题切换重绘

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 生产构建（输出至 dist/）
npm run build

# 本地预览构建产物
npm run preview
```

## 部署：GitHub Pages 自动部署

本项目已配置 GitHub Actions 工作流（`.github/workflows/deploy.yml`），推送到 `main` 分支即自动构建并部署到 GitHub Pages。

部署步骤：

1. 将本仓库推送到 GitHub。
2. 进入仓库 **Settings → Pages → Source**，选择 **GitHub Actions**。
3. 推送代码到 `main` 分支，工作流自动触发：安装依赖 → `npm run build` → 部署 `dist/`。
4. 部署完成后访问：<https://<用户名>.github.io/<仓库名>/>

> Vite 构建配置使用 `base: './'`，所有资源引用均为相对路径，无论部署在用户主页（`username.github.io`）还是项目子路径（`username.github.io/<repo>/`）下均可正常运行。

## 使用说明

1. 在顶栏选择 **Solomon 算例**（如 C101）。
2. 在左侧导航中调整 **卡车 / 无人机 / 发射点 / GA 参数 / 惩罚参数** 等配置。
3. 点击顶栏 **「开始运行」** 按钮。
4. 在 **「收敛曲线」** 页查看迭代过程，在地图区观察卡车与无人机路线。
5. 运行结束后切换到 **「配送方案」** 页查看详细配送安排。

## 目录结构

```
.
├── index.html              # Vite 入口 HTML
├── package.json            # 依赖与脚本
├── vite.config.js          # Vite 构建配置（base、worker、chunk 限制）
├── tailwind.config.js      # Tailwind 主题扩展（颜色、字体、动画）
├── postcss.config.js       # PostCSS（Tailwind + autoprefixer）
├── src/
│   ├── main.js             # 应用入口
│   ├── App.vue             # 根布局（TopBar + Sidebar + MapView + Console + StatusBar）
│   ├── styles/
│   │   └── main.css        # Tailwind 指令 + CSS 变量主题 + 组件类
│   ├── composables/
│   │   ├── useConfig.js    # 配置状态管理（全局单例）
│   │   ├── useGA.js        # GA 运行状态管理（全局单例 + rAF 渲染调度）
│   │   └── useTheme.js     # 主题切换（深色/浅色/自动）
│   ├── lib/
│   │   ├── config.js       # 默认配置与参数定义
│   │   ├── solomon.js      # Solomon 基准算例数据
│   │   ├── problem.js      # 问题模型（K-means 聚类、肘方法）
│   │   ├── ga.js           # GA 运行器（主线程代理，Vite Worker 构造）
│   │   └── ga.worker.js    # GA 主循环（Web Worker，三段式染色体编码）
│   └── components/
│       ├── TopBar.vue          # 顶栏（主题/算例/导入导出/启停/重置）
│       ├── Sidebar.vue         # 桌面侧边导航
│       ├── MobileTabBar.vue    # 移动端底部标签栏
│       ├── MapView.vue         # ECharts 地图（仓库/客户/发射点/路线）
│       ├── ChartView.vue       # ECharts 收敛曲线
│       ├── StatsBar.vue        # 统计卡片
│       ├── ConsolePanel.vue    # 控制台日志面板
│       ├── StatusBar.vue       # 底部状态栏
│       └── pages/              # 各配置/结果页面
│           ├── CustomerPage.vue
│           ├── DepotPage.vue
│           ├── TruckPage.vue
│           ├── DronePage.vue
│           ├── LaunchPage.vue
│           ├── GAPage.vue
│           ├── PenaltyPage.vue
│           ├── ResultPage.vue
│           └── PlanPage.vue
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Pages 自动部署工作流（Node 构建）
└── README.md
```

## 说明

本项目为学术性毕业设计可视化系统，旨在直观展示卡车-无人机协同配送路径优化中遗传算法的求解过程与结果，仅供学习与学术交流使用。
