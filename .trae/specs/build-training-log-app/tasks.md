# Tasks

- [x] Task 1: 项目初始化 - 使用 Vite + React + TypeScript + Capacitor 搭建 Android App 项目
  - [x] SubTask 1.1: 使用 Vite 创建 React + TypeScript 项目
  - [x] SubTask 1.2: 安装并初始化 Capacitor，添加 Android 平台
  - [x] SubTask 1.3: 安装 @capacitor/preferences 用于数据持久化
  - [x] SubTask 1.4: 配置项目目录结构（components / hooks / types / utils / pages / styles）
  - [x] SubTask 1.5: 引入 Google Fonts（Noto Sans SC + JetBrains Mono）
  - [x] SubTask 1.6: 定义全局 CSS 变量（色彩系统、间距、圆角、字体），移动端优先
  - [x] SubTask 1.7: 配置 viewport meta 标签，确保移动端正确渲染（禁止缩放、安全区域适配）

- [x] Task 2: 数据模型与持久化层
  - [x] SubTask 2.1: 定义 TypeScript 类型（TrainingRecord, Exercise, TrainingType）
  - [x] SubTask 2.2: 封装 Capacitor Preferences 工具函数（load / save / delete）
  - [x] SubTask 2.3: 实现 useTrainingStore 自定义 Hook，管理训练数据的增删改查状态

- [x] Task 3: 日历视图组件
  - [x] SubTask 3.1: 实现 useCalendar 自定义 Hook（月份状态管理、日期计算逻辑）
  - [x] SubTask 3.2: 实现 CalendarHeader 组件（当前年月显示、左右滑动/按钮切换月份、"回到今天"按钮）
  - [x] SubTask 3.3: 实现 CalendarDay 组件（单个日期格子，含训练标记、选中状态、点按反馈）
  - [x] SubTask 3.4: 实现 CalendarGrid 组件（月度日历网格渲染，7列布局）

- [x] Task 4: 训练记录列表与详情
  - [x] SubTask 4.1: 实现 TrainingList 组件（展示选中日期的训练记录列表）
  - [x] SubTask 4.2: 实现 TrainingCard 组件（单条训练记录卡片，含展开/收起动作详情）
  - [x] SubTask 4.3: 实现空状态展示（选中日期无训练时的提示图标和文字）

- [x] Task 5: 训练记录表单页面（添加/编辑）
  - [x] SubTask 5.1: 实现训练记录表单页面（全屏页面，含顶部导航栏和保存按钮）
  - [x] SubTask 5.2: 实现表单字段（训练名称、类型选择、时长、备注）
  - [x] SubTask 5.3: 实现 ExerciseForm 组件（动态添加/删除动作列表，每个动作含名称、组数、次数、重量）
  - [x] SubTask 5.4: 实现底部确认弹窗 BottomSheet（用于删除确认）

- [x] Task 6: 首页整合与布局
  - [x] SubTask 6.1: 实现首页布局（顶部导航栏 + 日历区域 + 训练列表区域）
  - [x] SubTask 6.2: 实现底部"添加训练"固定按钮
  - [x] SubTask 6.3: 配置页面路由（首页 / 添加训练页 / 编辑训练页）

- [x] Task 7: 移动端动效与视觉细节
  - [x] SubTask 7.1: 添加日历格子点按动效（scale 缩放反馈）
  - [x] SubTask 7.2: 添加页面切换滑动过渡动画
  - [x] SubTask 7.3: 添加 Bottom Sheet 弹出动效
  - [x] SubTask 7.4: 交互状态优化（按钮按压感、输入框聚焦样式）
  - [x] SubTask 7.5: 适配 Android 安全区域（状态栏、导航栏、刘海屏）

- [x] Task 8: GitHub Actions APK 构建（使用 github-apk-builder skill）
  - [x] SubTask 8.1: 配置 capacitor.config.json（App 名称、包名、webDir）
  - [x] SubTask 8.2: 配置 App 图标和启动画面（Splash Screen）
  - [x] SubTask 8.3: 使用 github-apk-builder skill 创建 .github/workflows/build.yml
  - [ ] SubTask 8.4: 推送代码到 GitHub，触发 GitHub Actions 自动构建 APK
  - [ ] SubTask 8.5: 从 GitHub Actions Artifacts 下载 APK 并安装验证

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 2]
- [Task 5] depends on [Task 2]
- [Task 6] depends on [Task 3], [Task 4], [Task 5]
- [Task 7] depends on [Task 6]
- [Task 8] depends on [Task 6]
