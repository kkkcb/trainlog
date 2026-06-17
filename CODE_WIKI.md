# TrainLog — Code Wiki

## 1. 项目概述

**TrainLog** 是一款基于 **React 19 + TypeScript + Vite** 构建的移动端训练日志应用。用户可以通过日历视图查看和管理每日训练记录，支持为训练添加标签（如"推"、"拉"、"蹲"），并通过 **Capacitor** 打包为 Android APK。

- **应用名称**: TrainLog
- **应用 ID**: `com.trainlog.app`
- **目标平台**: Web / Android
- **UI 语言**: 中文
- **设计风格**: 暗色主题，iOS 风格毛玻璃效果

---

## 2. 项目架构

### 2.1 技术栈

| 层级 | 技术选型 |
|------|----------|
| 框架 | React 19 |
| 语言 | TypeScript 6 |
| 构建工具 | Vite 8 |
| 移动端打包 | Capacitor 8 (Android) |
| 本地存储 | `@capacitor/preferences` |
| 代码检查 | ESLint 9 + typescript-eslint |
| 样式方案 | 原生 CSS（CSS Variables + BEM 命名） |

### 2.2 目录结构

```
train/
├── .github/workflows/build.yml   # CI/CD: GitHub Actions 自动构建 APK
├── public/                        # 静态资源
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── main.tsx                   # 应用入口
│   ├── App.tsx                    # 根组件（路由与状态枢纽）
│   ├── App.css                    # 根组件样式
│   ├── types/
│   │   └── index.ts               # 全局类型定义
│   ├── utils/
│   │   └── storage.ts             # 存储层（Capacitor Preferences 封装）
│   ├── hooks/
│   │   ├── useCalendar.ts         # 日历状态管理 Hook
│   │   ├── useTagSettings.ts      # 预设标签管理 Hook
│   │   └── useTrainingStore.ts    # 训练记录 CRUD Hook
│   ├── components/
│   │   ├── CalendarGrid.tsx/css   # 日历网格容器
│   │   ├── CalendarHeader.tsx/css # 日历头部（月份切换 + 今天按钮）
│   │   ├── CalendarDay.tsx/css    # 日历单日单元格（支持长按）
│   │   ├── TrainingList.tsx/css   # 训练记录列表
│   │   ├── TrainingCard.tsx/css   # 单条训练记录卡片
│   │   ├── BottomSheet.tsx/css    # 通用底部弹出确认框
│   │   └── QuickAddSheet.tsx/css  # 快速添加标签弹出层
│   ├── pages/
│   │   └── TrainingFormPage.tsx/css # 训练记录表单页（新增/编辑）
│   └── styles/
│       └── global.css             # 全局样式与 CSS 变量定义
├── capacitor.config.ts            # Capacitor 配置
├── vite.config.ts                 # Vite 配置
├── tsconfig.json                  # TypeScript 项目引用配置
├── tsconfig.app.json              # 应用源码 TS 配置
├── tsconfig.node.json             # 构建脚本 TS 配置
├── eslint.config.js               # ESLint 扁平化配置
├── index.html                     # HTML 入口
└── package.json                   # 项目依赖与脚本
```

### 2.3 架构设计图

```
┌─────────────────────────────────────────────────┐
│                    index.html                    │
│                      ↓                           │
│                   main.tsx                       │
│                (StrictMode 渲染)                  │
│                      ↓                           │
│ ┌──────────────── App.tsx ────────────────────┐ │
│ │   状态管理中心（页面切换、选中日期、编辑状态）    │ │
│ │                                              │ │
│ │  ┌─────────────── Hooks ──────────────────┐  │ │
│ │  │ useTrainingStore  ←→  storage.ts       │  │ │
│ │  │ useCalendar                           │  │ │
│ │  │ useTagSettings                        │  │ │
│ │  └───────────────────────────────────────┘  │ │
│ │                      ↓                       │ │
│ │  ┌──── Page: home ────┐  ┌── Page: form ──┐ │ │
│ │  │ CalendarHeader      │  │ TrainingFormPage│ │ │
│ │  │ CalendarGrid        │  │  (标签选择/编辑) │ │ │
│ │  │   └ CalendarDay     │  └────────────────┘ │ │
│ │  │ TrainingList        │                      │ │
│ │  │   └ TrainingCard    │                      │ │
│ │  │ BottomSheet (删除)   │                      │ │
│ │  │ QuickAddSheet (快添) │                      │ │
│ │  └────────────────────┘                      │ │
│ └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 3. 数据模型

### 3.1 TrainingRecord

```typescript
// src/types/index.ts
interface TrainingRecord {
  id: string          // 唯一标识，基于时间戳+随机字符串生成
  date: string        // 日期字符串，格式 "YYYY-MM-DD"
  tags: string[]      // 训练标签数组，如 ["推", "拉"]
  createdAt: number   // 创建时间戳 (ms)
  updatedAt: number   // 更新时间戳 (ms)
}
```

**存储格式**: 以 `Record<string, TrainingRecord>`（键为记录 ID）整体序列化为 JSON，存储在 Capacitor Preferences 中，键名为 `trainlog_records`。

### 3.2 预设标签

预设标签存储为 `string[]` JSON 序列化，键名为 `trainlog_preset_tags`，默认值为 `['推', '拉', '蹲']`。

---

## 4. 核心模块详解

### 4.1 Hooks 层

#### `useTrainingStore` — 训练记录状态管理

**文件**: `src/hooks/useTrainingStore.ts`

核心数据管理 Hook，负责训练记录的完整 CRUD 生命周期。

| 方法/属性 | 类型 | 说明 |
|-----------|------|------|
| `records` | `Record<string, TrainingRecord>` | 全量记录字典 |
| `loading` | `boolean` | 初始加载状态 |
| `addRecord(date, data?)` | `(date: string, data?: Partial<TrainingRecord>) => Promise<TrainingRecord>` | 新增一条训练记录 |
| `updateRecord(id, data)` | `(id: string, data: Partial<TrainingRecord>) => Promise<void>` | 按 ID 更新记录 |
| `deleteRecordById(id)` | `(id: string) => Promise<void>` | 按 ID 删除记录 |
| `getRecordsByDate(date)` | `(date: string) => TrainingRecord[]` | 按日期筛选记录（按创建时间排序） |
| `getTrainingDates(year, month)` | `(year: number, month: number) => Set<number>` | 获取某月所有有训练的日期集合 |
| `getTagsByDate(year, month)` | `(year: number, month: number) => Record<number, string[]>` | 获取某月每天的标签汇总 |

**内部函数**:
- `generateId()`: 生成唯一 ID（`Date.now().toString(36) + Math.random().toString(36).substring(2, 9)`）
- `createRecord(date, partial?)`: 工厂函数，创建完整的 `TrainingRecord` 对象

**数据流**: 每次变更操作 → 更新 React state → 持久化到 Capacitor Preferences

---

#### `useCalendar` — 日历状态管理

**文件**: `src/hooks/useCalendar.ts`

管理日历视图的月份切换和日期计算逻辑。

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `year` | `number` | 当前年份 |
| `month` | `number` | 当前月份 (0-11) |
| `monthLabel` | `string` | 显示标签，如 "2026年 5月" |
| `calendarDays` | `Array<{date, month, fullDate}>` | 42 天的网格数据（含上月/下月补位） |
| `goToPrevMonth()` | `() => void` | 切换到上个月 |
| `goToNextMonth()` | `() => void` | 切换到下个月 |
| `goToToday()` | `() => void` | 回到今天所在月份 |
| `isToday(fullDate)` | `(fullDate: string) => boolean` | 判断是否为今天 |

**导出接口**: `CalendarState { year: number; month: number }`

**网格算法**: 以 6×7=42 格为固定网格，首行补上月末尾日期，末行补下月开头日期。每格包含 `fullDate`（`YYYY-MM-DD`）用于精确标识。

---

#### `useTagSettings` — 预设标签管理

**文件**: `src/hooks/useTagSettings.ts`

管理用户自定义的预设标签列表，支持增删和持久化。

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `presetTags` | `string[]` | 当前预设标签列表 |
| `loaded` | `boolean` | 是否已从存储加载 |
| `addPresetTag(tag)` | `(tag: string) => Promise<void>` | 添加预设标签（去重+trim） |
| `removePresetTag(tag)` | `(tag: string) => Promise<void>` | 移除预设标签 |

---

### 4.2 工具层

#### `storage.ts` — 持久化存储

**文件**: `src/utils/storage.ts`

对 `@capacitor/preferences` 的薄封装，提供三个核心函数：

| 函数 | 说明 |
|------|------|
| `loadRecords()` | 从 Preferences 读取并反序列化训练记录 |
| `saveRecords(records)` | 将训练记录序列化后写入 Preferences |
| `deleteRecord(id, currentRecords)` | 删除指定 ID 的记录并持久化 |

**存储键**: `trainlog_records`

---

### 4.3 组件层

#### `CalendarGrid` — 日历网格容器

**文件**: `src/components/CalendarGrid.tsx`

组合 `CalendarHeader` 和 `CalendarDay`，渲染完整日历视图。接收日历状态、训练日期集合、标签数据，分发给子组件。

**Props**:

| 属性 | 类型 | 说明 |
|------|------|------|
| `calendar` | `CalendarState & {...}` | 日历 Hook 的完整返回值 |
| `trainingDates` | `Set<number>` | 当月有训练的日期集合 |
| `tagsByDate` | `Record<number, string[]>` | 当月每天的标签汇总 |
| `selectedDate` | `string` | 当前选中日期 |
| `onSelectDate` | `(date: string) => void` | 点击日期回调 |
| `onLongPressDate` | `(fullDate: string) => void` | 长按日期回调（触发快速添加） |

---

#### `CalendarHeader` — 日历头部导航

**文件**: `src/components/CalendarHeader.tsx`

显示月份标签、前/后月切换按钮、"今天"快捷按钮。

---

#### `CalendarDay` — 日历单日单元格

**文件**: `src/components/CalendarDay.tsx`

单个日期按钮，支持：
- **点击**: 选择日期
- **长按 (500ms)**: 触发快速添加训练
- **右键**: 触发长按（桌面端兼容）
- 视觉状态：今日高亮、选中高亮、有训练标记（小圆点或标签文字）
- 最多显示 2 个标签文字，超出显示 `+`

---

#### `TrainingList` — 训练记录列表

**文件**: `src/components/TrainingList.tsx`

按日期展示训练记录列表。无记录时显示空状态提示。

---

#### `TrainingCard` — 训练记录卡片

**文件**: `src/components/TrainingCard.tsx`

单条训练记录的展示卡片，显示标签列表，提供编辑和删除操作按钮。

---

#### `BottomSheet` — 通用底部弹出确认框

**文件**: `src/components/BottomSheet.tsx`

iOS 风格底部弹出面板，用于删除确认等场景。

**特性**:
- 支持 `danger` 模式（红色确认按钮）
- 点击遮罩关闭
- ESC 键关闭
- 打开时锁定 `body` 滚动

---

#### `QuickAddSheet` — 快速添加弹出层

**文件**: `src/components/QuickAddSheet.tsx`

日历长按日期后弹出，允许用户快速选择预设标签添加训练记录。

**交互流程**: 选择标签 → 点击"添加" → 调用 `onAdd(date, tags)` → 自动关闭

---

### 4.4 页面层

#### `TrainingFormPage` — 训练记录表单页

**文件**: `src/pages/TrainingFormPage.tsx`

全屏表单页面，支持新增和编辑训练记录。从右侧滑入动画。

**功能**:
- 选择/取消预设标签
- 添加自定义标签（回车确认）
- 将自定义标签保存为预设
- 移除预设标签
- 保存验证：至少选择一个标签

---

### 4.5 根组件 `App`

**文件**: `src/App.tsx`

应用的顶层组件，承担以下职责：
1. **页面路由**: 通过 `currentPage` 状态在 `'home'` 和 `'form'` 之间切换（无第三方路由库）
2. **状态中枢**: 管理 `selectedDate`、`editingRecord`、`deleteTarget`、`quickAddDate` 等全局 UI 状态
3. **数据聚合**: 从 `useTrainingStore` 获取记录，结合日历和标签数据分发给子组件
4. **事件协调**: 处理所有子组件的回调，协调增删改查流程

---

## 5. 依赖关系图

### 5.1 运行时依赖

```
@capacitor/core          ← Capacitor 核心运行时
@capacitor/android       ← Android 平台适配
@capacitor/preferences   ← 键值对本地存储
react                    ← UI 框架 (v19)
react-dom                ← React DOM 渲染器
```

### 5.2 开发依赖

```
vite / @vitejs/plugin-react       ← 构建工具
typescript                         ← 类型系统
eslint / typescript-eslint         ← 代码检查
eslint-plugin-react-hooks          ← React Hooks 规则
eslint-plugin-react-refresh        ← React Refresh 支持
@types/react / @types/react-dom    ← 类型声明
@types/node                        ← Node.js 类型
globals                            ← ESLint 全局变量定义
```

### 5.3 模块依赖关系

```
App.tsx
  ├── hooks/useTrainingStore ← utils/storage ← @capacitor/preferences
  ├── hooks/useCalendar
  ├── hooks/useTagSettings   ← @capacitor/preferences
  ├── components/CalendarGrid
  │   ├── components/CalendarHeader
  │   └── components/CalendarDay
  ├── components/TrainingList
  │   └── components/TrainingCard
  ├── components/BottomSheet
  ├── components/QuickAddSheet
  └── pages/TrainingFormPage
```

---

## 6. 样式体系

### 6.1 设计令牌 (CSS Variables)

全局样式定义在 `src/styles/global.css`，使用 CSS Variables 构建完整的设计令牌体系：

| 分类 | 变量前缀 | 示例 |
|------|----------|------|
| 背景色 | `--color-bg-*` | `--color-bg-primary: #111114` |
| 强调色 | `--color-accent*` | `--color-accent: #4ae09a` (绿色) |
| 文字色 | `--color-text-*` | `--color-text-primary: #f5f5f7` |
| 边框色 | `--color-border*` | `--color-border: rgba(255,255,255,0.1)` |
| 功能色 | `--color-danger/warning/info` | `--color-danger: #ff453a` |
| 间距 | `--space-*` | `--space-xs` (4px) ~ `--space-5xl` (64px) |
| 圆角 | `--radius-*` | `--radius-sm` (6px) ~ `--radius-full` (9999px) |
| 字体 | `--font-sans/mono` | Noto Sans SC + JetBrains Mono |
| 字号 | `--font-size-*` | `--font-size-2xs` (9px) ~ `--font-size-3xl` (34px) |
| 动画 | `--duration-*` / `--ease-*` | 缓动曲线 + 持续时间 |
| 安全区 | `--safe-area-*` | 适配刘海/底部横条 |
| 布局 | `--max-content-width` | `480px` (移动端最大宽度) |

### 6.2 命名规范

- 采用 **BEM** 命名：`.block__element--modifier`
- 例：`.calendar-day--selected`、`.training-card__btn--delete`

### 6.3 动画

- 页面切换：`fade-in-up`（渐入上移）、`form-page-in`（右滑进入）
- 交互反馈：`scale-in`、`slide-up`、`spin`
- 支持 `prefers-reduced-motion` 媒体查询

---

## 7. 项目运行方式

### 7.1 环境要求

- **Node.js**: v22+（CI 使用 Node 22）
- **包管理器**: npm

### 7.2 常用命令

```bash
# 安装依赖
npm install

# 启动开发服务器 (Vite HMR)
npm run dev

# 类型检查 + 生产构建
npm run build

# 代码检查
npm run lint

# 预览生产构建
npm run preview
```

### 7.3 Android 构建

**本地构建**:
```bash
npm run build
npx cap add android     # 首次添加平台
npx cap sync android    # 同步 Web 产物到 Android
cd android && ./gradlew assembleDebug
```

**CI/CD 自动构建** (GitHub Actions):
- 触发条件：推送到 `main` 分支 或 手动触发
- 流程：`checkout → npm install → npm run build → cap add android → cap sync → JDK 21 → gradlew assembleDebug → 上传 APK artifact`
- 产物：`trainlog-debug-apk`，保留 30 天

### 7.4 Capacitor 配置

```typescript
// capacitor.config.ts
{
  appId: 'com.trainlog.app',
  appName: 'TrainLog',
  webDir: 'dist'   // Vite 构建输出目录
}
```

---

## 8. 数据流与交互流程

### 8.1 新增训练记录

```
用户点击 FAB(+) → setCurrentPage('form') → TrainingFormPage 展示
→ 用户选择标签 → 点击保存 → handleFormSave()
→ addRecord(date, {tags}) → useTrainingStore.addRecord()
→ createRecord() 生成记录 → 更新 React state → saveRecords() 持久化
→ setCurrentPage('home') → 日历视图刷新
```

### 8.2 快速添加（长按日历日期）

```
用户长按日期(500ms) → handleLongPressDate(fullDate)
→ setQuickAddDate(fullDate) → QuickAddSheet 弹出
→ 用户选择标签 → 点击添加 → handleQuickAdd()
→ addRecord(date, tags) → 持久化 → 关闭弹窗
```

### 8.3 编辑记录

```
用户点击编辑按钮 → handleEdit(record)
→ setEditingRecord(record) → setCurrentPage('form')
→ TrainingFormPage 加载已有标签数据
→ 用户修改 → 点击保存 → handleFormSave()
→ updateRecord(id, data) → 持久化 → 返回首页
```

### 8.4 删除记录

```
用户点击删除按钮 → handleDelete(record) → setDeleteTarget(record)
→ BottomSheet 弹出确认 → 用户点击"删除"
→ handleConfirmDelete() → deleteRecordById(id) → 持久化 → 关闭弹窗
```

---

## 9. 关键设计决策

| 决策 | 说明 |
|------|------|
| **无路由库** | 仅两个页面（home/form），通过 state 切换，避免引入额外依赖 |
| **无全局状态库** | 使用自定义 Hook + Props 传递，数据流清晰可追踪 |
| **全量存储策略** | 所有记录作为单一 JSON 存储，适合小数据量场景 |
| **CSS Variables + BEM** | 无 CSS-in-JS 依赖，零运行时开销，构建时优化 |
| **Capacitor Preferences** | 跨平台键值存储 API，Web 端降级为 localStorage |
| **42 格固定网格** | 保证日历布局稳定（6行×7列），避免行数变化导致布局跳动 |
| **长按检测** | 500ms 触发阈值，通过 `setTimeout` + `ref` 标记实现，避免与点击冲突 |

---

## 10. 构建配置说明

### Vite (`vite.config.ts`)
- 使用 `@vitejs/plugin-react`（基于 Oxc 编译）
- 零自定义配置，开箱即用

### TypeScript
- **项目引用模式**: `tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`
- **编译目标**: ES2023
- **模块解析**: bundler 模式
- **JSX**: react-jsx（自动导入，无需手动 import React）
- **严格检查**: `noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch`

### ESLint
- **扁平化配置** (`eslint.config.js`)
- 集成: `js.configs.recommended` + `tseslint.configs.recommended` + `react-hooks` + `react-refresh`
- 忽略: `dist/` 目录
