import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { WorkoutPage } from '../pages/WorkoutPage'
import { ToastProvider } from '../components/Toast'
import type { WorkoutPlan } from '../types'

vi.mock('../hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({
    trigger: vi.fn(),
    onTap: vi.fn(),
    onSelect: vi.fn(),
    onSuccess: vi.fn(),
  }),
}))

const PLAN: WorkoutPlan = {
  id: 'p1',
  date: '2026-08-31',
  createdAt: 0,
  updatedAt: 0,
  exercises: [
    { name: '卧推', sets: 2, reps: '8-12', weight: 40 },
    { name: '深蹲', sets: 3, reps: '10', weight: 60 },
  ],
}

beforeEach(() => {
  window.HTMLElement.prototype.scrollTo = () => {}
  localStorage.clear()
})

afterEach(cleanup)

function renderWorkout(onSave = vi.fn(), onExit = vi.fn()) {
  return render(
    <ToastProvider>
      <WorkoutPage date={PLAN.date} plan={PLAN} tagNames={['推', '拉']} onSave={onSave} onExit={onExit} />
    </ToastProvider>
  )
}

const completeSet = () => {
  fireEvent.click(screen.getByText('✓ 完成这一组'))
  // 完成一组后自动进入组间休息，跳过才能继续
  fireEvent.click(screen.getByText(/跳过休息/))
}

describe('WorkoutPage 动作训练', () => {
  it('计划模式：大字显示当前组数，完成预设组数后自动进入下一动作', () => {
    const { container } = renderWorkout()
    const stageName = () => container.querySelector('.workout__ex-name')?.textContent
    expect(stageName()).toBe('卧推')
    expect(screen.getByText('第 1')).toBeTruthy()
    expect(screen.getByText('/ 2 组')).toBeTruthy()

    completeSet()
    expect(screen.getByText('第 2')).toBeTruthy()

    // 第 2 组做完达到预设 2 组 → 自动切到「深蹲」
    completeSet()
    expect(stageName()).toBe('深蹲')
    expect(screen.getByText('第 1')).toBeTruthy()
  })

  it('模式可切换：自由模式下组数不封顶、不自动跳动作', () => {
    const { container } = renderWorkout()
    const stageName = () => container.querySelector('.workout__ex-name')?.textContent
    fireEvent.click(screen.getByRole('button', { name: '自由' }))

    completeSet()
    completeSet()
    // 预设 2 组已满，但自由模式继续第 3 组且停在卧推
    expect(screen.getByText('第 3')).toBeTruthy()
    expect(stageName()).toBe('卧推')
  })

  it('完成组可撤销', () => {
    renderWorkout()
    completeSet()
    expect(screen.getByText(/40kg×10/)).toBeTruthy()
    fireEvent.click(screen.getByText(/40kg×10/))
    expect(screen.queryByText(/40kg×10/)).toBeNull()
    expect(screen.getByText('第 1')).toBeTruthy()
  })

  it('结束→小结→保存，归档动作明细', () => {
    const onSave = vi.fn()
    renderWorkout(onSave)
    completeSet()
    fireEvent.click(screen.getByText('结束'))
    expect(screen.getByText('训练小结')).toBeTruthy()
    expect(screen.getByText(/卧推/)).toBeTruthy()

    fireEvent.click(screen.getByText('保存记录'))
    expect(onSave).toHaveBeenCalledTimes(1)
    const arg = onSave.mock.calls[0][0]
    expect(arg.detail).toHaveLength(1)
    expect(arg.detail[0].name).toBe('卧推')
    expect(arg.detail[0].sets).toHaveLength(1)
    expect(arg.detail[0].sets[0].weight).toBe(40)
    expect(arg.detail[0].sets[0].reps).toBe(10)
    expect(arg.note).toContain('计划模式')
  })

  it('一组没练就点结束 → 确认后放弃退出', () => {
    const onExit = vi.fn()
    renderWorkout(vi.fn(), onExit)
    fireEvent.click(screen.getByText('结束'))
    fireEvent.click(screen.getByText('退出'))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('会话持久化：完成组后存档，重进无缝续练并提示', () => {
    const { unmount } = renderWorkout()
    completeSet()
    expect(localStorage.getItem('trainlog_workout_session')).toBeTruthy()
    unmount()

    // 重进：恢复到第 2 组，而不是全新的第 1 组
    renderWorkout()
    expect(screen.getByText('第 2')).toBeTruthy()
    expect(screen.getByText(/已恢复上次没练完的训练/)).toBeTruthy()
  })

  it('保存记录后清除会话存档，不会重复恢复', () => {
    const onSave = vi.fn()
    const { unmount } = renderWorkout(onSave)
    completeSet()
    fireEvent.click(screen.getByText('结束'))
    fireEvent.click(screen.getByText('保存记录'))
    unmount()
    expect(localStorage.getItem('trainlog_workout_session')).toBeNull()
  })
})
