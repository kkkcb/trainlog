# 训练计划记录 App Spec

## Why
需要一个个人专属的训练记录手机 App，以日历形式直观展示每日训练情况。参考「训记」App 的核心理念——**极简、自由、专注记录**，打造一个轻量级的 Android 训练日志应用，方便随时随地记录和回顾训练内容。

## What Changes
- 从零搭建一个基于 React + TypeScript + Capacitor 的 Android App
- 实现日历视图作为首页核心功能，展示每日训练状态
- 实现训练记录的增删改查功能
- 使用 Capacitor Preferences API 进行本地数据持久化
- 深色主题设计，强调视觉层次与动效体验
- 移动端优先的 UI 设计，适配各种 Android 屏幕尺寸

## Impact
- Affected specs: 无（全新项目）
- Affected code: 全部代码（新建项目）

## ADDED Requirements

### Requirement: 日历视图
系统 SHALL 提供一个月度日历视图作为应用首页，展示每天的训练状态。

#### Scenario: 查看月度训练概览
- **WHEN** 用户打开应用
- **THEN** 显示当前月份的日历网格
- **AND** 每个日期格子上显示训练标记（有训练的日期高亮显示）
- **AND** 支持左右滑动切换上/下月查看历史和未来月份
- **AND** 顶部导航栏显示当前年月，含"回到今天"按钮

#### Scenario: 日期导航
- **WHEN** 用户点击日历上的某一天
- **THEN** 高亮选中该日期
- **AND** 在日历下方展示该日的训练记录摘要

### Requirement: 训练记录管理
系统 SHALL 允许用户记录每次训练的详细信息。

#### Scenario: 添加训练记录
- **WHEN** 用户选中某一天并点击底部"添加训练"按钮
- **THEN** 打开全屏训练记录表单页面
- **AND** 用户可以输入：训练名称、训练类型（力量/有氧/拉伸/其他）、训练时长（分钟）、备注
- **AND** 用户可以为训练添加多个动作，每个动作包含：动作名称、组数、每组次数、重量
- **AND** 保存后返回日历页面，对应日期显示训练标记

#### Scenario: 查看训练详情
- **WHEN** 用户点击有训练标记的日期
- **THEN** 在日历下方显示该日所有训练记录的列表
- **AND** 每条记录显示训练名称、类型、时长
- **AND** 可以点击记录卡片展开查看详细动作信息

#### Scenario: 编辑训练记录
- **WHEN** 用户点击已有训练记录的编辑按钮
- **THEN** 跳转到预填充的训练记录编辑页面
- **AND** 用户修改后保存，返回日历页面并即时更新

#### Scenario: 删除训练记录
- **WHEN** 用户在训练详情页面点击删除按钮
- **THEN** 弹出底部确认弹窗（Bottom Sheet）
- **AND** 用户确认后删除该训练记录
- **AND** 若该日无其他训练，移除日历上的训练标记

### Requirement: 数据持久化
系统 SHALL 使用 Capacitor Preferences API 持久化所有训练数据。

#### Scenario: 数据保存与恢复
- **WHEN** 用户添加或修改训练记录
- **THEN** 数据自动通过 Capacitor Preferences 保存到设备本地
- **WHEN** 用户重新打开应用
- **THEN** 自动从本地存储加载历史数据并展示

### Requirement: 视觉设计
系统 SHALL 采用深色主题，提供专业、现代的移动端视觉体验。

#### Scenario: 设计规范
- **WHEN** 用户使用应用
- **THEN** 界面采用深色背景（#0c0c0c ~ #1a1a1a）
- **AND** 使用翠绿色（#3dd68c）作为强调色标识训练状态
- **AND** 日历格子有点按反馈动效
- **AND** 页面切换有滑动过渡动画
- **AND** 移动端优先布局，适配各种 Android 屏幕尺寸
- **AND** 遵循 Android Material Design 的返回导航规范

### Requirement: GitHub Actions APK 构建
系统 SHALL 通过 GitHub Actions CI/CD 自动构建 Android APK。

#### Scenario: 自动化构建
- **WHEN** 开发者推送代码到 GitHub main 分支
- **THEN** GitHub Actions 自动触发构建流程
- **AND** 流程包括：安装依赖 → Capacitor sync → Gradle 构建 APK
- **AND** 构建完成后 APK 作为 Artifact 上传，可从 GitHub Actions 页面下载

#### Scenario: 手动触发构建
- **WHEN** 开发者在 GitHub Actions 页面手动触发 workflow_dispatch
- **THEN** 同样执行完整的 APK 构建流程
