import { useMemo, useState } from 'react'
import type { PlanExercise, WorkoutPlan } from '../types'
import type { PlanMap } from '../utils/workoutStore'
import { ExercisePicker } from '../components/ExercisePicker'
import { findExerciseByName } from '../data/exerciseLibrary'
import { parsePlanText } from '../utils/planImport'
import { getTodayString } from '../utils/date'
import { useHapticFeedback } from '../hooks/useHapticFeedback'
import './WorkoutHubPage.css'

interface WorkoutHubPageProps {
  plans: PlanMap
  /** 开始沉浸训练：带 plan 按该计划练，不带自由练边练边记 */
  onStartWorkout: (date: string, plan?: WorkoutPlan) => void
  /** 打开某天的计划编辑 */
  onEditPlan: (date: string) => void
  /** 导入的计划交给编辑器预填（date=编辑器里用步进器再定） */
  onImportPlan: (exercises: PlanExercise[]) => void
  /** 打开动作库 */
  onOpenLibrary: () => void
}

const BARBELL_DEFAULTS: Record<string, number> = {
  '卧推': 40, '上斜卧推': 30, '窄距卧推': 40, '深蹲': 60, '硬拉': 80,
  '罗马尼亚硬拉': 60, '相扑硬拉': 80, '杠铃划船': 50, '站姿推举': 35,
  '借力推举': 40, '臀推': 80, '杠铃耸肩': 60,
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

/** 训练 tab：开始训练（可选计划/自由/导入）/ 动作库 / 制订计划 / 已排的计划 */
export function WorkoutHubPage({ plans, onStartWorkout, onEditPlan, onImportPlan, onOpenLibrary }: WorkoutHubPageProps) {
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

  const [choosing, setChoosing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  // 自由训练：预选的动作集
  const [picked, setPicked] = useState<Set<string>>(new Set())

  const handleImport = () => {
    const { exercises } = parsePlanText(importText)
    if (exercises.length === 0) {
      setImportError('没识别出有效动作，检查格式：动作名 组数 次数 重量')
      return
    }
    haptic.onSuccess()
    setImporting(false)
    setChoosing(false)
    setImportText('')
    setImportError(null)
    onImportPlan(exercises)
  }

  return (
    <div className="workout-hub">
      {/* 开始训练：点击展开计划选择 */}
      <button
        className="workout-hub__start"
        onClick={() => {
          haptic.onTap()
          setChoosing((v) => !v)
          setImporting(false)
        }}
      >
        <span className="workout-hub__start-title">⚡ 开始训练</span>
        <span className="workout-hub__start-sub">
          {todayPlan && todayPlan.exercises.length > 0
            ? `今天有计划：${todayPlan.exercises.map((e) => e.name).join(' · ')}`
            : '选一个计划开练，或自由练边练边记'}
        </span>
      </button>

      {choosing && (
        <div className="workout-hub__chooser">
          {/* 自由训练：自定义 + 库内选动作（可多选），再点开始 */}
          <div className="workout-hub__pick">
            <p className="workout-hub__chooser-label">自由训练 · 勾选今天要练的动作</p>
            <ExercisePicker
              picked={picked}
              onToggle={(name) => {
                haptic.onTap()
                setPicked((prev) => {
                  const next = new Set(prev)
                  if (next.has(name)) next.delete(name)
                  else next.add(name)
                  return next
                })
              }}
            />
            <button
              className={`workout-hub__pick-go ${picked.size > 0 ? 'workout-hub__pick-go--on' : ''}`}
              disabled={picked.size === 0}
              onClick={() => {
                haptic.onSuccess()
                onStartWorkout(today, {
                  id: '__adhoc__',
                  date: today,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                  exercises: [...picked].map((name) => {
                    // 与动作库匹配的动作带上默认参数，自定义动作给通用默认
                    const lib = findExerciseByName(name)
                    return {
                      name,
                      sets: 3,
                      reps: '8-12',
                      weight: lib && BARBELL_DEFAULTS[name] ? BARBELL_DEFAULTS[name] : 20,
                    }
                  }),
                })
              }}
            >
              开始训练{picked.size > 0 ? ` · 已选 ${picked.size} 个动作` : ''}
            </button>
          </div>

          {sortedPlans.length > 0 && (
            <>
              <p className="workout-hub__chooser-label">用已排的计划开始</p>
              {sortedPlans.slice(0, 10).map((p) => (
                <button
                  key={p.id}
                  className="workout-hub__option"
                  onClick={() => {
                    haptic.onTap()
                    onStartWorkout(today, p)
                  }}
                >
                  <span className="workout-hub__option-label">
                    {dateLabel(p.date, today)}{p.date === today ? '（推荐）' : ''}
                  </span>
                  <span className="workout-hub__option-desc">
                    {p.exercises.map((e) => `${e.name} ${e.sets}组`).join(' · ')}
                  </span>
                </button>
              ))}
            </>
          )}

          <button
            className="workout-hub__option workout-hub__option--import"
            onClick={() => {
              haptic.onTap()
              setImporting((v) => !v)
            }}
          >
            <span className="workout-hub__option-label">导入计划</span>
            <span className="workout-hub__option-desc">粘贴文本，一键变成可编辑的计划</span>
          </button>

          {importing && (
            <div className="workout-hub__import">
              <textarea
                autoFocus
                rows={5}
                placeholder={'每行一个动作，如：\n卧推 4组 8-12 40kg\n深蹲 5x5 100\n引体向上 4组x8'}
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value)
                  setImportError(null)
                }}
              />
              {importError && <p className="workout-hub__import-error">{importError}</p>}
              <button
                className="workout-hub__import-go"
                onClick={handleImport}
                disabled={!importText.trim()}
              >
                解析并编辑
              </button>
            </div>
          )}

          <button
            className="workout-hub__chooser-cancel"
            onClick={() => { haptic.onTap(); setChoosing(false) }}
          >
            先不了
          </button>
        </div>
      )}

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
        <button
          className="workout-hub__library"
          onClick={() => {
            haptic.onTap()
            onOpenLibrary()
          }}
        >
          <b>动作库</b>
          <span>看图学动作 · 按部位筛选 · 小白入门</span>
          <i>›</i>
        </button>
      </div>

      {sortedPlans.length > 0 && (
        <div className="workout-hub__section">
          <p className="workout-hub__section-title">已排的计划</p>
          <div className="workout-hub__plans">
            {sortedPlans.map((p) => (
              <button key={p.id} className="workout-hub__plan" onClick={() => onEditPlan(p.date)}>
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
