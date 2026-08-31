import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { AvatarChat } from '../components/AvatarChat'

/**
 * 闭环回归守护：历史两次线上事故均为「hook 声明在 if(!open) return 之后」，
 * open 翻转时 hook 数量变化 → React #310/#318 整树崩溃。
 * 本组测试直接复刻触发路径：closed → open → closed 全翻转渲染。
 */

vi.mock('@capacitor/preferences', () => {
  const store = new Map<string, string>()
  return {
    Preferences: {
      get: async ({ key }: { key: string }) => ({ value: store.get(key) ?? null }),
      set: async ({ key, value }: { key: string; value: string }) => {
        store.set(key, value)
      },
      remove: async ({ key }: { key: string }) => {
        store.delete(key)
      },
    },
  }
})

const ctx = {
  todayCount: 1,
  todayTags: ['推'],
  weekCount: 2,
  streakDays: 1,
  totalWorkouts: 5,
  diaryCount: 0,
}

beforeEach(() => {
  // jsdom 未实现元素滚动
  window.HTMLElement.prototype.scrollTo = () => {}
})

afterEach(cleanup)

describe('AvatarChat — Hook 顺序回归（两次事故的守护）', () => {
  it('closed → open 翻转不崩溃，面板完整渲染', () => {
    const { rerender } = render(<AvatarChat open={false} onClose={() => {}} context={ctx} />)
    rerender(<AvatarChat open={true} onClose={() => {}} context={ctx} />)
    expect(screen.getByPlaceholderText('跟自己说点什么…')).toBeTruthy()
    expect(screen.getByText('在线')).toBeTruthy()
    expect(screen.getByLabelText('发运动截图')).toBeTruthy()
  })

  it('open → closed 再翻转不崩溃', () => {
    const { rerender } = render(<AvatarChat open={true} onClose={() => {}} context={ctx} />)
    rerender(<AvatarChat open={false} onClose={() => {}} context={ctx} />)
    expect(screen.queryByPlaceholderText('跟自己说点什么…')).toBeNull()
  })

  it('核心控件存在：历史/新建/关闭/发送', () => {
    render(<AvatarChat open={true} onClose={() => {}} context={ctx} />)
    expect(screen.getByLabelText('对话历史')).toBeTruthy()
    expect(screen.getByLabelText('新建对话')).toBeTruthy()
    expect(screen.getByLabelText('关闭')).toBeTruthy()
    expect(screen.getByLabelText('发送')).toBeTruthy()
  })

  it('输入并 Enter 不抛错', () => {
    render(<AvatarChat open={true} onClose={() => {}} context={ctx} />)
    const input = screen.getByPlaceholderText('跟自己说点什么…')
    fireEvent.change(input, { target: { value: '今天练了啥' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('今天练了啥')).toBeTruthy()
  })
})
