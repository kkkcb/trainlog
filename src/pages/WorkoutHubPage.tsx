import { useMemo } from 'react'
import type { PlanMap } from '../utils/workoutStore'
import { getTodayString } from '../utils/date'
import { useHapticFeedback } from '../hooks/useHapticFeedback'
import './WorkoutHubPage.css'

interface WorkoutHubPageProps {
  plans: PlanMap
  /** 开始沉浸训练（date 有计划按计划练，没有就自由练边练边记） */
  onStartWorkout: (date: string) => void
  /** 打开某天的计划编辑 */
  onEditPlan: (date: string) => void
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function dateLabel(iso: string, today: string): string {
  const d = new Date(`${iso}T00:00:00`)
  const base = `${d.getMonth() + 1}/${d.getDate()} ${WEEKDAYS[d.getDay()]}`
  if (iso === today) return `今天 · ${base}`
  const diff = Math.round((d.getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000)
  if (diff === 1) return `明天 · ${base}`
  return base
}

/** 训练 tab：开始训练 / 制订计划 / 已排的计划 */
export function WorkoutHubPage({ plans, onStartWorkout, onEditPlan }: WorkoutHubPageProps) {
  const haptic = useHapticFeedback()
  const today = getTodayString()

  const todayPlan = plans[today]
  const sortedPlans = useMemo(
    () =>
      Object.values(plans)
        .filter((p) => p.exercises.length > 0)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [plans]
  )

  return (
    <div className="workout-hub">
      {/* 开始训练：今天有计划按计划，没有就自由练边练边记 */}
      <button
        className="workout-hub__start"
        onClick={() => {
          haptic.onSuccess()
          onStartWorkout(today)
        }}
      >
        <span className="workout-hub__start-title">⚡ 开始训练</span>
        <span className="workout-hub__start-sub">
          {todayPlan && todayPlan.exercises.length > 0
            ? `今天有计划：${todayPlan.exercises.map((e) => e.name).join(' · ')}`
            : '自由练，边练边记组数和重量'}
        </span>
      </button>

      <div className="workout-hub__section">
        <p className="workout-hub__section-title">制订计划</p>
        <button
          className="workout-hub__plan-new"
          onClick={() => {
            haptic.onTap()
            onEditPlan(today)
          }}
        >
          ＋ 排一天的训练动作（组数 / 次数 / 重量）
        </button>
      </div>

      {sortedPlans.length > 0 && (
        <div className="workout-hub__section">
          <p className="workout-hub__section-title">已排的计划</p>
          <div className="workout-hub__plans">
            {sortedPlans.map((p) => (
              <button key={p.date} className="workout-hub__plan" onClick={() => onEditPlan(p.date)}>
                <span className="workout-hub__plan-date">{dateLabel(p.date, today)}</span>
                <span className="workout-hub__plan-exs">
                  {p.exercises.map((e) => `${e.name} ${e.sets}组`).join(' · ')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
