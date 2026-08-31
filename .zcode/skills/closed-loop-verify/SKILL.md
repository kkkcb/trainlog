---
name: closed-loop-verify
description: TrainLog 闭环验证流程——约束(静态门禁)、验证(回归测试+确定性渲染)、纠错(先复现后修复)。任何 UI 改动后必须走此流程；当用户说"验证一下"、"怎么又坏了"、"做到闭环验证"时使用。
---

# TrainLog 闭环验证流程（约束 / 验证 / 纠错）

本流程由两次真实线上事故沉淀（React #310 Hook 顺序违规连犯两遍 + "已验证"声明但点击实际未送达）。核心原则：**未复现的 bug 不修，未通过门禁的改动不算完成，没有证据的"验证"不许说出口。**

## 一、约束（静态门禁，改动后必须全过）

```bash
npm run check   # tsc -b && eslint . --max-warnings 0（严格模式，0 警告容忍）
npm test        # vitest 回归测试
```

**纪律红线（每条都真实踩过）：**
1. **绝不 `npm run check | tail -1`**——管道会吞掉错误行，且 `$?` 是 tail 的退出码不是命令的。必须 `npm run check > /tmp/chk.log 2>&1; echo $?` 看真实退出码
2. **hook 严禁声明在 `if (...) return` 之后**——ESLint `react-hooks/rules-of-hooks` 能 100% 拦截此模式（已用探针文件实证），前提是严格模式跑起来而不是 tail 掉
3. 组件文件**只导出组件**（react-refresh/only-export-components 严格档会拦）
4. 长文件顶部如需 eslint-disable，只保留真正触发的规则名——失效的 disable 指令在严格档是 warning 即 fail

## 二、验证（三层，层层递进）

### 第 1 层：静态门禁
`npm run check` 真实退出码 0。它已经抓过：Hook 条件调用、未用变量、失效 disable、非组件导出。

### 第 2 层：回归测试（`npm test`）
`src/__tests__/` 下按组件写。**核心守护用例：状态翻转渲染**——历史上两次崩溃都是 `open=false → open=true` 翻转触发 Hook 数量变化：

```tsx
it('closed → open 翻转不崩溃，面板完整渲染', () => {
  const { rerender } = render(<AvatarChat open={false} ... />)
  rerender(<AvatarChat open={true} ... />)
  expect(screen.getByPlaceholderText('跟自己说点什么…')).toBeTruthy()
})
```

写法要点：`vi.mock('@capacitor/preferences')` 换内存 Map；jsdom 需 `HTMLElement.prototype.scrollTo = () => {}`；**必须 `afterEach(cleanup)`**（vitest 未开 globals 时 testing-library 不会自动清理，否则跨用例 DOM 累积误报）。

### 第 3 层：浏览器闭环（涉及真实交互时）
顺序不可颠倒：
1. **先复现**：用能用的通道（dom_cua 节点点击 / 坐标点击）触发操作，**捕获完整错误文本**（ErrorBoundary 已升级为直接显示错误信息）
2. **修复后同通道复测**：同样的操作必须不再报错
3. **确定性渲染验证**（不依赖点击，防自动化管线间歇失灵）：临时改初始状态（如 `useState(true) // VERIFY-TEMP`）→ build → reload → 断言关键元素存在且零错误 → **恢复初始值再 build**
4. 点击管线失灵时明说"自动化不可用"，改用第 3 条，**绝不宣称未执行的验证**

## 三、纠错（验证失败时）

1. **根因定位**：读错误文本 + 读代码，不用猜（#310 = "Rendered fewer hooks" 直接指向 early return 后的 hook）
2. **回归测试先行**：为该 bug 写一个"修复前必挂"的测试用例（黄金标准：故意把 bug 塞回去确认测试变红，再恢复确认变绿）
3. 修复源头，`npm run check && npm test` 真实退出码双 0
4. commit message 记录：根因 + 复现方式 + 验证证据，供下次检索
5. 同类 bug 二次出现时（如 Hook 顺序），升级防御：加注释标记禁区 + 确认 lint 规则真的在拦

## 四、门禁覆盖盲区（诚实清单）

- 门禁只覆盖静态可判定的错误；**视觉/布局问题**仍需人眼或浏览器闭环
- 自动化点击在本会话有间歇性失灵史——涉及"点按"的验证优先用确定性渲染法兜底
- 数据层（Capacitor Preferences）在测试中是 mock，真机持久化行为需装机抽查
