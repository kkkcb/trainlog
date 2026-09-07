import { useState } from 'react'
import type { PlanExercise } from '../types'
import { Icon } from '../components/icons'
import { makeExercise } from '../utils/workoutStore'
import { ExercisePicker } from '../components/ExercisePicker'
import { encodePlan, decodePlan } from '../utils/planShareCode'
import { useHapticFeedback } from '../hooks/useHapticFeedback'
import './PlanEditorPage.css'

interface PlanEditorPageProps {
  date: string
  initial: PlanExercise[]
  hasExisting: boolean
  onSave: (exercises: PlanExercise[]) => void
  onDelete: () => void
  onBack: () => void
  /** 换一天排（页头 ‹ › 步进器） */
  onDateChange?: (iso: string) => void
}

/** 排计划：某日期的动作清单（动作名/组数/次数/重量） */
export function PlanEditorPage({ date, initial, hasExisting, onSave, onDelete, onBack, onDateChange }: PlanEditorPageProps) {
  const haptic = useHapticFeedback()
  const [exercises, setExercises] = useState<PlanExercise[]>(() =>
    initial.length > 0 ? initial.map((e) => ({ ...e })) : [makeExercise({ name: '' })]
  )
  const [pickFor, setPickFor] = useState<number | null>(null)
  const [shareCode, setShareCode] = useState<string | null>(null)
  const [pasteCode, setPasteCode] = useState('')
  const [pasteError, setPasteError] = useState<string | null>(null)

  const patch = (idx: number, part: Partial<PlanExercise>) => {
    setExercises((prev) => prev.map((e, i) => (i === idx ? { ...e, ...part } : e)))
  }

  const addExercise = (name = '') => {
    haptic.onTap()
    setExercises((prev) => [...prev, makeExercise({ name })])
    setPickFor(null)
  }

  const removeAt = (idx: number) => {
    haptic.onSelect()
    setExercises((prev) => (prev.length === 1 ? [makeExercise({ name: '' })] : prev.filter((_, i) => i !== idx)))
  }

  const step = (idx: number, field: 'sets' | 'weight', delta: number) => {
    haptic.onTap()
    setExercises((prev) =>
      prev.map((e, i) => {
        if (i !== idx) return e
        if (field === 'sets') return { ...e, sets: Math.min(10, Math.max(1, e.sets + delta)) }
        return { ...e, weight: Math.max(0, Math.round((e.weight + delta) * 10) / 10) }
      })
    )
  }

  const canSave = exercises.every((e) => e.name.trim().length > 0)

  const shiftDate = (delta: number) => {
    const d = new Date(`${date}T00:00:00`)
    d.setDate(d.getDate() + delta)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    onDateChange?.(iso)
  }

  const dateLabel = date.slice(5).replace('-', '/')

  return (
    <div className="plan-page">
      <header className="plan-page__header">
        <button className="plan-page__back" onClick={onBack} aria-label="返回">
          <Icon name="arrowLeft" size={20} />
        </button>
        {onDateChange && (
          <button className="plan-page__date-step" onClick={() => shiftDate(-1)} aria-label="前一天">
            ‹
          </button>
        )}
        <span className="plan-page__title">{dateLabel}</span>
        {onDateChange && (
          <button className="plan-page__date-step" onClick={() => shiftDate(1)} aria-label="后一天">
            ›
          </button>
        )}
        <button
          className="plan-page__share"
          onClick={() => {
            haptic.onTap()
            if (shareCode) { setShareCode(null); return }
            const valid = exercises.filter((e) => e.name.trim())
            if (valid.length === 0) return
            const code = encodePlan(valid.map((e) => ({ ...e, name: e.name.trim() })))
            setShareCode(code)
            navigator.clipboard?.writeText(code).catch(() => {})
          }}
          aria-label="导出分享码"
        >
          分享
        </button>
        <button
          className={`plan-page__save ${canSave ? 'plan-page__save--on' : ''}`}
          disabled={!canSave}
          onClick={() => {
            haptic.onSuccess()
            onSave(exercises.map((e) => ({ ...e, name: e.name.trim() })))
          }}
        >
          保存
        </button>
      </header>

      <main className="plan-page__body">
        {hasExisting && (
          <p className="plan-page__hint">这天已有计划，保存将覆盖；删除可清空</p>
        )}

        {shareCode && (
          <div className="plan-share">
            <p className="plan-share__label">计划分享码（已复制，发给朋友即可）</p>
            <textarea readOnly value={shareCode} className="plan-share__code" onFocus={(e) => e.currentTarget.select()} />
            <button className="plan-share__close" onClick={() => setShareCode(null)}>收起</button>
          </div>
        )}

        <div className="plan-share">
          <p className="plan-share__label">粘贴分享码导入计划</p>
          <div className="plan-share__row">
            <input
              value={pasteCode}
              onChange={(e) => { setPasteCode(e.target.value); setPasteError(null) }}
              placeholder="TL1.xxxx 收到的分享码直接粘这里"
            />
            <button
              className="plan-share__go"
              disabled={!pasteCode.trim()}
              onClick={() => {
                const decoded = decodePlan(pasteCode)
                if (!decoded) {
                  setPasteError('分享码无效，检查是否复制完整')
                  return
                }
                haptic.onSuccess()
                setExercises(decoded.map((e) => ({ ...e })))
                setPasteCode('')
                setPasteError(null)
              }}
            >
              导入
            </button>
          </div>
          {pasteError && <p className="plan-share__error">{pasteError}</p>}
        </div>

        {exercises.map((ex, idx) => (
          <div key={idx} className="plan-ex">
            <div className="plan-ex__row">
              <input
                className="plan-ex__name"
                placeholder={`动作 ${idx + 1}，如 卧推`}
                value={ex.name}
                maxLength={10}
                onChange={(e) => patch(idx, { name: e.target.value })}
              />
              <button className="plan-ex__del" onClick={() => removeAt(idx)} aria-label="删除动作">
                <Icon name="trash" size={15} />
              </button>
            </div>
            <div className="plan-ex__row plan-ex__row--params">
              <div className="plan-ex__param">
                <span className="plan-ex__label">组数</span>
                <div className="plan-ex__stepper">
                  <button onClick={() => step(idx, 'sets', -1)}>−</button>
                  <b>{ex.sets}</b>
                  <button onClick={() => step(idx, 'sets', 1)}>＋</button>
                </div>
              </div>
              <div className="plan-ex__param">
                <span className="plan-ex__label">次数</span>
                <input
                  className="plan-ex__reps"
                  value={ex.reps}
                  placeholder="8-12"
                  maxLength={6}
                  onChange={(e) => patch(idx, { reps: e.target.value })}
                />
              </div>
              <div className="plan-ex__param">
                <span className="plan-ex__label">重量 kg</span>
                <div className="plan-ex__stepper">
                  <button onClick={() => step(idx, 'weight', -2.5)}>−</button>
                  <b>{ex.weight === 0 ? '徒手' : ex.weight}</b>
                  <button onClick={() => step(idx, 'weight', 2.5)}>＋</button>
                </div>
              </div>
            </div>
            {pickFor === idx ? (
              <ExercisePicker
                picked={new Set(ex.name ? [ex.name] : [])}
                onToggle={(name) => {
                  haptic.onTap()
                  patch(idx, { name })
                  setPickFor(null)
                }}
              />
            ) : (
              <button className="plan-ex__quick" onClick={() => setPickFor(idx)}>
                换动作（搜索/自定义）
              </button>
            )}
          </div>
        ))}

        <div className="plan-page__add-zone">
          <p className="ex-picker__label">添加动作（可搜索动作库 / 自定义）</p>
          <ExercisePicker picked={new Set()} onToggle={(name) => addExercise(name)} />
        </div>

        {hasExisting && (
          <button
            className="plan-page__delete"
            onClick={() => {
              haptic.onSelect()
              onDelete()
            }}
          >
            删除这天的计划
          </button>
        )}
      </main>
    </div>
  )
}
