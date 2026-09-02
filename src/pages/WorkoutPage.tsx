import { useEffect, useMemo, useState } from 'react'
import type { SessionExercise, SetLog, TrainingTag, WorkoutMode, WorkoutPlan } from '../types'
import { DEFAULT_REST_SEC, REST_PRESETS } from '../types'
import { Icon } from '../components/icons'
import { BottomSheet } from '../components/BottomSheet'
import { ExerciseIllustration } from '../components/ExerciseIllustration'
import { useHapticFeedback } from '../hooks/useHapticFeedback'
import { useToast } from '../components/useToast'
import { loadIllustrations, saveIllustrations } from '../utils/exerciseSettings'
import './WorkoutPage.css'

interface WorkoutPageProps {
  date: string
  plan: WorkoutPlan | null
  tagNames: string[]
  /** 有未保存内容时置 true，供系统返回键拦截 */
  onDirtyChange?: (dirty: boolean) => void
  onSave: (data: { detail: SessionExercise[]; tags: TrainingTag[]; note: string }) => void
  onExit: () => void
}

const SESSION_KEY = 'trainlog_workout_session'

interface SavedSession {
  date: string
  mode: WorkoutMode
  exs: SessionExercise[]
  cur: number
  weight: number
  reps: number
  restSec: number
  restEndsAt: number | null
  startedAt: number
}

function loadSavedSession(date: string): SavedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as SavedSession
    // 只恢复同一天的会话；跨天视为过期
    if (s.date !== date || !Array.isArray(s.exs) || s.exs.length === 0) return null
    return s
  } catch {
    return null
  }
}

function clearSavedSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

/** "8-12" → 建议次数取中值 10；"10" → 10；解析失败 → 10 */
function suggestReps(target: string): number {
  const nums = target.match(/\d+/g)
  if (!nums || nums.length === 0) return 10
  if (nums.length === 1) return Number(nums[0])
  return Math.round((Number(nums[0]) + Number(nums[1])) / 2)
}

function initFromPlan(plan: WorkoutPlan | null): SessionExercise[] {
  if (!plan) return []
  return plan.exercises.map((e) => ({
    name: e.name,
    targetSets: e.sets,
    targetReps: e.reps,
    targetWeight: e.weight,
    sets: [],
  }))
}

/**
 * 训练进行中页：解决「做到第几组忘了」。
 * 计划/自由两种模式随时切换：计划严格按预设槽位点亮，自由不锁组数参数随改。
 * 会话随写随存（localStorage）：锁屏/杀后台后重进可无缝续练。
 */
export function WorkoutPage({ date, plan, tagNames, onDirtyChange, onSave, onExit }: WorkoutPageProps) {
  const haptic = useHapticFeedback()
  const toast = useToast()

  // 恢复上次未完成的会话（仅限同一天）；restEndsAt 已过期则直接视为休息结束
  const [saved] = useState(() => loadSavedSession(date))
  const [startedAt] = useState(() => saved?.startedAt ?? Date.now())

  const [mode, setMode] = useState<WorkoutMode>(() => saved?.mode ?? (plan ? 'planned' : 'free'))
  const [exs, setExs] = useState<SessionExercise[]>(() => saved?.exs ?? initFromPlan(plan))
  const [cur, setCur] = useState(() => Math.min(saved?.cur ?? 0, Math.max(0, (saved?.exs.length ?? 1) - 1)))
  const [weight, setWeight] = useState(() => {
    if (saved) return saved.weight
    return plan ? plan.exercises[0]?.weight ?? 0 : 20
  })
  const [reps, setReps] = useState(() => {
    if (saved) return saved.reps
    return suggestReps(plan?.exercises[0]?.reps ?? '10')
  })
  const [restSec, setRestSec] = useState(() => saved?.restSec ?? DEFAULT_REST_SEC)
  const [restEndsAt, setRestEndsAt] = useState<number | null>(() => {
    if (!saved?.restEndsAt) return null
    return Date.now() >= saved.restEndsAt ? null : saved.restEndsAt
  })
  const [now, setNow] = useState(() => Date.now())
  const [phase, setPhase] = useState<'run' | 'summary'>('run')
  const [tags, setTags] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  // 动作图解（模式2）：默认关，训练中即点即切
  const [illustrations, setIllustrations] = useState(false)
  useEffect(() => {
    loadIllustrations().then(setIllustrations).catch(() => {})
  }, [])
  const toggleIllustrations = () => {
    setIllustrations((v) => {
      saveIllustrations(!v).catch(() => {})
      return !v
    })
  }

  // 挂载即提示恢复了未完成会话（放 effect 避免渲染期副作用）
  useEffect(() => {
    if (saved) {
      toast.show('已恢复上次没练完的训练', 'info')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅挂载时提示一次
  }, [])

  const curEx = exs[cur]
  const doneCount = curEx?.sets.length ?? 0
  const totalDone = useMemo(() => exs.reduce((n, e) => n + e.sets.length, 0), [exs])
  const elapsedSec = Math.max(0, Math.floor((now - startedAt) / 1000))
  const restLeft = restEndsAt ? Math.max(0, Math.ceil((restEndsAt - now) / 1000)) : 0
  const resting = restEndsAt != null && restLeft > 0
  const volume = useMemo(
    () => exs.reduce((sum, e) => sum + e.sets.reduce((s, g) => s + g.weight * g.reps, 0), 0),
    [exs]
  )

  // 节拍器：驱动已练时长与休息倒计时（时间戳差值，切后台回来照准）
  useEffect(() => {
    const t = setInterval(() => {
      const t2 = Date.now()
      if (restEndsAt != null && t2 >= restEndsAt) {
        setRestEndsAt(null)
        haptic.onSuccess()
      }
      setNow(t2)
    }, 400)
    return () => clearInterval(t)
  }, [restEndsAt, haptic])

  // 会话随写随存：锁屏/杀后台后重进可续练（保存/放弃时显式清除）
  useEffect(() => {
    if (phase !== 'run' || totalDone === 0) return
    try {
      const snapshot: SavedSession = {
        date,
        mode,
        exs,
        cur,
        weight,
        reps,
        restSec,
        restEndsAt,
        startedAt,
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(snapshot))
    } catch {
      // 存储失败不影响训练
    }
  }, [date, mode, exs, cur, weight, reps, restSec, restEndsAt, startedAt, totalDone, phase])

  // 向宿主上报「有未保存内容」，供系统返回键/手势拦截
  const dirty = totalDone > 0 && phase === 'run'
  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])

  // 宿主（系统返回键/手势）请求退出 → 走丢弃确认
  useEffect(() => {
    const handler = () => setConfirmDiscard(true)
    window.addEventListener('workout:exit-request', handler)
    return () => window.removeEventListener('workout:exit-request', handler)
  }, [])

  const applyTarget = (idx: number) => {
    const ex = exs[idx]
    if (!ex) return
    setWeight(ex.targetWeight)
    setReps(suggestReps(ex.targetReps))
  }

  const switchExercise = (idx: number) => {
    if (idx === cur) return
    haptic.onTap()
    setCur(idx)
    const last = exs[idx]?.sets[exs[idx].sets.length - 1]
    if (last) {
      setWeight(last.weight)
      setReps(last.reps)
    } else {
      applyTarget(idx)
    }
  }

  const completeSet = () => {
    if (reps <= 0) return
    haptic.onSuccess()
    const log: SetLog = { weight, reps, doneAt: Date.now() }
    const nextExs = exs.map((e, i) => (i === cur ? { ...e, sets: [...e.sets, log] } : e))
    setExs(nextExs)
    const nextDone = nextExs[cur].sets.length
    // 计划模式：做满预设组数自动进入下一动作
    if (mode === 'planned' && nextDone >= nextExs[cur].targetSets && cur < nextExs.length - 1) {
      setCur(cur + 1)
      const nxt = nextExs[cur + 1]
      setWeight(nxt.targetWeight)
      setReps(suggestReps(nxt.targetReps))
    } else if (mode === 'planned') {
      applyTarget(cur)
    }
    setRestEndsAt(Date.now() + restSec * 1000)
    setNow(Date.now())
  }

  const undoSet = (exIdx: number, setIdx: number) => {
    haptic.onSelect()
    setExs((prev) =>
      prev.map((e, i) => (i === exIdx ? { ...e, sets: e.sets.filter((_, j) => j !== setIdx) } : e))
    )
  }

  const addExercise = () => {
    const name = newName.trim()
    if (!name) return
    haptic.onTap()
    setExs((prev) => [
      ...prev,
      { name, targetSets: 3, targetReps: '8-12', targetWeight: 20, sets: [] },
    ])
    setCur(exs.length)
    setWeight(20)
    setReps(10)
    setNewName('')
    setAdding(false)
  }

  const fmtClock = (sec: number) =>
    `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`

  const finish = () => {
    if (totalDone === 0) {
      setConfirmDiscard(true)
      return
    }
    haptic.onTap()
    setPhase('summary')
  }

  const save = () => {
    haptic.onSuccess()
    clearSavedSession()
    onSave({
      detail: exs.filter((e) => e.sets.length > 0),
      tags: tags.map((name) => ({ name })),
      note: `动作训练 · ${mode === 'planned' ? '计划' : '自由'}模式`,
    })
  }

  const discardAndExit = () => {
    haptic.onSelect()
    clearSavedSession()
    onExit()
  }

  return (
    <div className="workout">
      <header className="workout__header">
        <button className="workout__back" onClick={() => setConfirmDiscard(true)} aria-label="退出训练">
          <Icon name="arrowLeft" size={20} />
        </button>
        <div className="workout__head-main">
          <span className="workout__clock">{fmtClock(elapsedSec)}</span>
          <div className="workout__mode" role="tablist" aria-label="训练模式">
            <button
              className={`workout__mode-btn ${mode === 'planned' ? 'workout__mode-btn--on' : ''}`}
              onClick={() => { haptic.onTap(); setMode('planned') }}
            >
              计划
            </button>
            <button
              className={`workout__mode-btn ${mode === 'free' ? 'workout__mode-btn--on' : ''}`}
              onClick={() => { haptic.onTap(); setMode('free') }}
            >
              自由
            </button>
          </div>
          <button
            className={`workout__mode-btn ${illustrations ? 'workout__mode-btn--on' : ''}`}
            onClick={() => { haptic.onTap(); toggleIllustrations() }}
            aria-label={illustrations ? '关闭动作图解' : '开启动作图解'}
          >
            图解
          </button>
        </div>
        <button className="workout__finish" onClick={finish} disabled={phase === 'summary'}>
          结束
        </button>
      </header>

      {phase === 'run' ? (
        <main className="workout__body">
          {/* 动作进度 chips */}
          <div className="workout__ex-tabs">
            {exs.map((e, i) => (
              <button
                key={i}
                className={`workout__ex-chip ${i === cur ? 'workout__ex-chip--on' : ''}`}
                onClick={() => switchExercise(i)}
              >
                {e.name || `动作${i + 1}`}
                <i>{e.sets.length}/{e.targetSets}</i>
              </button>
            ))}
            <button
              className={`workout__ex-chip workout__ex-chip--add ${adding ? 'workout__ex-chip--on' : ''}`}
              onClick={() => { haptic.onTap(); setAdding((v) => !v) }}
            >
              ＋动作
            </button>
          </div>

          {adding && (
            <div className="workout__add">
              <input
                autoFocus
                placeholder="动作名称，如 龙门架夹胸"
                value={newName}
                maxLength={10}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addExercise()}
              />
              <button onClick={addExercise} disabled={!newName.trim()}>加入</button>
            </div>
          )}

          {curEx ? (
            <>
              <div className="workout__stage">
                {illustrations && <ExerciseIllustration name={curEx.name} size={150} />}
                <h2 className="workout__ex-name">{curEx.name}</h2>
                <div className="workout__count" key={`${cur}-${doneCount}-${resting ? 'r' : ''}`}>
                  {resting ? (
                    <>
                      <span className="workout__count-num workout__count-num--rest" role="timer" aria-label={`休息剩余 ${restLeft} 秒`}>
                        {restLeft}
                      </span>
                      <span className="workout__count-total">秒后开始</span>
                    </>
                  ) : mode === 'planned' && doneCount >= curEx.targetSets ? (
                    <span className="workout__count-done">本动作完成 ✓</span>
                  ) : (
                    <>
                      <span className="workout__count-num">第 {doneCount + 1}</span>
                      <span className="workout__count-total">
                        {mode === 'planned' ? `/ ${curEx.targetSets} 组` : '组'}
                      </span>
                    </>
                  )}
                </div>
                <div className="workout__params">
                  <div className="workout__param">
                    <span className="workout__param-label">重量 kg</span>
                    <div className="workout__stepper">
                      <button onClick={() => { haptic.onTap(); setWeight((w) => Math.max(0, Math.round((w - 2.5) * 10) / 10)) }}>−</button>
                      <b>{weight === 0 ? '徒手' : weight}</b>
                      <button onClick={() => { haptic.onTap(); setWeight((w) => Math.round((w + 2.5) * 10) / 10) }}>＋</button>
                    </div>
                  </div>
                  <div className="workout__param">
                    <span className="workout__param-label">次数</span>
                    <div className="workout__stepper">
                      <button onClick={() => { haptic.onTap(); setReps((r) => Math.max(1, r - 1)) }}>−</button>
                      <b>{reps}</b>
                      <button onClick={() => { haptic.onTap(); setReps((r) => r + 1) }}>＋</button>
                    </div>
                  </div>
                </div>

                {resting ? (
                  <button
                    className="workout__rest-skip-big"
                    onClick={() => { haptic.onTap(); setRestEndsAt(null) }}
                    aria-label="跳过休息"
                  >
                    跳过休息，提前开练
                  </button>
                ) : (
                  <button
                    className={`workout__go ${doneCount >= curEx.targetSets && mode === 'planned' ? 'workout__go--extra' : ''}`}
                    onClick={() => {
                      // 计划模式做满预设：主按钮直接切下一动作（还有下一动作时）
                      if (mode === 'planned' && doneCount >= curEx.targetSets && cur < exs.length - 1) {
                        haptic.onTap()
                        switchExercise(cur + 1)
                        return
                      }
                      completeSet()
                    }}
                    disabled={mode === 'planned' && doneCount >= curEx.targetSets && cur >= exs.length - 1}
                  >
                    {mode === 'planned' && doneCount >= curEx.targetSets
                      ? cur < exs.length - 1
                        ? '已按计划完成，切下一动作 ›'
                        : '本动作已按计划完成 ✓'
                      : '✓ 完成这一组'}
                  </button>
                )}

                {/* 结束此动作：休息中/练习中都可见，没做满预设也能切下一个 */}
                {cur < exs.length - 1 && doneCount < curEx.targetSets && (
                  <button
                    className="workout__skip-ex"
                    onClick={() => { haptic.onSelect(); switchExercise(cur + 1) }}
                  >
                    结束此动作（已练 {doneCount} 组），切下一个 ›
                  </button>
                )}
              </div>

              {/* 休息时长预设 */}
              <div className="workout__rest-presets">
                <span className="workout__rest-presets-label">休息</span>
                {REST_PRESETS.map((s) => (
                  <button
                    key={s}
                    className={`workout__preset ${restSec === s ? 'workout__preset--on' : ''}`}
                    onClick={() => { haptic.onTap(); setRestSec(s) }}
                  >
                    {s < 60 ? `${s}s` : `${s / 60}分`}
                  </button>
                ))}
              </div>

              {/* 已完成组 */}
              {curEx.sets.length > 0 && (
                <div className="workout__log">
                  {curEx.sets.map((g, j) => (
                    <button key={g.doneAt} className="workout__log-chip" onClick={() => undoSet(cur, j)}>
                      <i>{j + 1}</i>
                      {g.weight === 0 ? '徒手' : `${g.weight}kg`}×{g.reps} ✓
                    </button>
                  ))}
                  <span className="workout__log-tip">点一组可撤销</span>
                </div>
              )}
            </>
          ) : (
            <p className="workout__empty">点上方「＋动作」加入第一个动作</p>
          )}
        </main>
      ) : (
        /* ---- 训练小结 ---- */
        <main className="workout__body workout__body--summary">
          <h2 className="workout__sum-title">训练小结</h2>
          <div className="workout__sum-stats">
            <div><b>{fmtClock(elapsedSec)}</b><span>时长</span></div>
            <div><b>{totalDone}</b><span>总组数</span></div>
            <div><b>{Math.round(volume) >= 1000 ? `${(volume / 1000).toFixed(1)}t` : `${Math.round(volume)}kg`}</b><span>容量</span></div>
          </div>
          <div className="workout__sum-list">
            {exs.filter((e) => e.sets.length > 0).map((e) => (
              <div key={e.name} className="workout__sum-ex">
                <span className="workout__sum-name">{e.name}</span>
                <span className="workout__sum-detail">
                  {e.sets.length} 组 · {e.sets.map((g) => `${g.weight === 0 ? '徒手' : g.weight}×${g.reps}`).join(' / ')}
                </span>
              </div>
            ))}
          </div>
          {tagNames.length > 0 && (
            <div className="workout__sum-tags">
              {tagNames.map((name) => (
                <button
                  key={name}
                  className={`workout__preset ${tags.includes(name) ? 'workout__preset--on' : ''}`}
                  onClick={() => {
                    haptic.onTap()
                    setTags((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]))
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
          <div className="workout__sum-actions">
            <button className="workout__sum-save" onClick={save}>保存记录</button>
            <button className="workout__sum-resume" onClick={() => setPhase('run')}>继续训练</button>
          </div>
        </main>
      )}

      <BottomSheet
        isOpen={confirmDiscard}
        title={totalDone > 0 ? '训练还没保存，确定退出吗？' : '还没记录任何一组，退出训练？'}
        confirmText={totalDone > 0 ? '不保存退出' : '退出'}
        cancelText={totalDone > 0 ? '继续训练' : '再看看'}
        danger
        onConfirm={discardAndExit}
        onCancel={() => setConfirmDiscard(false)}
      />
    </div>
  )
}
