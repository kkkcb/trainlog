# Checklist

## 项目初始化
- [x] Vite + React + TypeScript 项目成功创建并可运行
- [x] Capacitor 安装初始化完成，Android 平台已添加
- [x] @capacitor/preferences 依赖已安装
- [x] 项目目录结构符合规范（components / hooks / types / utils / pages / styles）
- [x] Google Fonts（Noto Sans SC + JetBrains Mono）正确引入
- [x] 全局 CSS 变量系统定义完整（色彩、间距、圆角、字体）
- [x] viewport meta 标签正确配置（禁止缩放、安全区域适配）

## 数据层
- [x] TypeScript 类型定义完整（TrainingRecord, Exercise, TrainingType）
- [x] Capacitor Preferences 工具函数正常工作（load / save / delete）
- [x] useTrainingStore Hook 实现完整的增删改查逻辑
- [x] App 重启后数据可正确恢复

## 日历视图
- [x] 月度日历网格正确渲染（包含上月末和下月初的灰色日期）
- [x] 月份切换功能正常（左右按钮/滑动切换、"回到今天"）
- [x] 有训练的日期显示翠绿色标记
- [x] 点击日期可选中并高亮
- [x] 日期格子有点按反馈动效

## 训练记录
- [x] 选中日期后可展示该日训练记录列表
- [x] 点击"添加训练"可跳转到全屏表单页面
- [x] 训练表单可输入名称、类型、时长、备注
- [x] 可动态添加/删除多个动作（含组数、次数、重量）
- [x] 保存后返回日历页面，日期立即显示训练标记
- [x] 可编辑已有训练记录并保存更新
- [x] 可删除训练记录（含底部确认弹窗 BottomSheet）
- [x] 删除后日历标记正确更新
- [x] 无训练日期展示空状态提示

## 视觉与交互
- [x] 深色主题正确应用（背景 #0c0c0c ~ #1a1a1a）
- [x] 翠绿色强调色（#3dd68c）用于训练标记和关键交互元素
- [x] 页面切换有滑动过渡动画
- [x] Bottom Sheet 有弹出/收起动效
- [x] 按钮有按压反馈（scale 动效）
- [x] 输入框聚焦时有边框颜色变化和光晕效果
- [x] Android 安全区域适配正常（状态栏、导航栏、刘海屏）

## GitHub Actions APK 构建
- [x] capacitor.config.json 配置正确（App 名称、包名、webDir）
- [x] App 图标和启动画面配置完成
- [x] .github/workflows/build.yml 工作流文件正确创建
- [ ] 推送到 GitHub 后 Actions 自动触发构建
- [ ] APK Artifact 成功生成并可下载
- [ ] APK 可在真机上安装运行
