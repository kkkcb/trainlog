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

/** 常见空杆重量 kg：奥杆 20 / 小孔曲杆 15 / W 杆 10-11 / 技术杆 5-8；0=无杆(纯器械数字) */
const BAR_WEIGHTS = [0, 5, 10, 15, 20]

/** 杠铃动作名单（按素材库 slug 判定，训练页用中文名匹配） */
const BARBELL_NAMES = new Set([
  '卧推', '上斜卧推', '窄距卧推', '下斜卧推', '深蹲', '颈前深蹲', '哈克深蹲',
  '硬拉', '罗马尼亚硬拉', '相扑硬拉', '杠铃划船', '站姿推举', '借力推举',
  '曲杆弯举', '仰卧臂屈伸', '臀推', '杠铃耸肩', '直立划船', '高脚杯深蹲',
])

function isBarbellExercise(name: string): boolean {
  return BARBELL_NAMES.has(name)
}

/** 从总重和空杆重推单边片重（除不尽时向下取到 2.5 的倍数） */
function totalToPerSide(total: number, bar: number): number {
  const per = (total - bar) / 2
  return Math.max(0, Math.floor(per / 2.5) * 2.5)
}

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
  // 现场加动作时的组数选择
  const [newSets, setNewSets] = useState(3)
  // 杠铃片换算面板：默认折叠，省屏幕空间
  const [barOpen, setBarOpen] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  // 已完成组调整：展开的行 / 两段确认撤销中的行
  const [armedIdx, setArmedIdx] = useState<number | null>(null)
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null)
  // 杠铃换算：空杆重量 + 单边片重（跟随当前动作/重量联动）
  const [barWeight, setBarWeight] = useState(20)
  const [perSide, setPerSide] = useState(() => totalToPerSide(saved?.weight ?? plan?.exercises[0]?.weight ?? 20, 20))
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
  const isBarbell = curEx ? isBarbellExercise(curEx.name) : false

  /** 杠铃换算：改空杆或单边片 → 总重联动；驱动 weight */
  const applyBarWeight = (bar: number, side: number) => {
    setBarWeight(bar)
    setPerSide(side)
    setWeight(bar + side * 2)
  }

  // 总重被步进器/滑条改了 → 单边片重反向联动（只在杠铃动作时）
  useEffect(() => {
    if (!isBarbell) return
    const expected = barWeight + perSide * 2
    if (weight !== expected) {
      setPerSide(totalToPerSide(weight, barWeight))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅在总重变化时反向联动
  }, [weight, isBarbell])
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

  /** 组顺序挪动：与相邻组交换 */
  const moveSet = (exIdx: number, setIdx: number, delta: number) => {
    setExs((prev) =>
      prev.map((e, i) => {
        if (i !== exIdx) return e
        const next = [...e.sets]
        const to = setIdx + delta
        if (to < 0 || to >= next.length) return e
        ;[next[setIdx], next[to]] = [next[to], next[setIdx]]
        return { ...e, sets: next }
      })
    )
  }

  const addExercise = () => {
    const name = newName.trim()
    if (!name) return
    haptic.onTap()
    setExs((prev) => [
      ...prev,
      { name, targetSets: newSets, targetReps: '8-12', targetWeight: weight, sets: [] },
    ])
    setCur(exs.length)
    // 新动作重量默认沿用上一组的重量（用户约定），次数回到建议值
    setReps(10)
    setNewName('')
    setAdding(false)
    setNewSets(3)
  }

  /** 训练中加减目标组数 */
  const adjustTargetSets = (delta: number) => {
    haptic.onTap()
    setExs((prev) =>
      prev.map((e, i) =>
        i === cur
          ? { ...e, targetSets: Math.min(20, Math.max(1, e.targetSets + delta)) }
          : e
      )
    )
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
              <span className="workout__add-sets" aria-label="新动作组数">
                <button onClick={() => { haptic.onTap(); setNewSets((n) => Math.max(1, n - 1)) }} disabled={newSets <= 1}>−</button>
                <b>{newSets} 组</b>
                <button onClick={() => { haptic.onTap(); setNewSets((n) => Math.min(20, n + 1)) }} disabled={newSets >= 20}>＋</button>
              </span>
              <button onClick={addExercise} disabled={!newName.trim()}>加入</button>
            </div>
          )}

          {curEx ? (
            <>
              {/* 正在训练的状态说明：当前动作 · 这组参数 */}
              <p className="workout__doing">
                正在完成 · <b>{curEx.name}</b>
                {resting ? ' · 组间休息中' : ` · 第 ${doneCount + 1} 组 ${weight === 0 ? '徒手' : `${weight}kg`}×${reps}`}
              </p>
              <div className="workout__stage">
                {illustrations && <ExerciseIllustration name={curEx.name} size={118} />}
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
                      <span className="workout__count-total">/</span>
                      <span className="workout__sets-step">
                        <button
                          onClick={() => adjustTargetSets(-1)}
                          disabled={curEx.targetSets <= 1}
                          aria-label="减少组数"
                        >−</button>
                        <b>{curEx.targetSets}</b>
                        <button
                          onClick={() => adjustTargetSets(1)}
                          disabled={curEx.targetSets >= 20}
                          aria-label="增加组数"
                        >＋</button>
                      </span>
                      <span className="workout__count-total">组</span>
                    </>
                  )}
                </div>
                <div className="workout__params">
                  {/* 重量：整行大步进器（无滑条，杜绝拖动误触） */}
                  <div className="workout__param-row">
                    <span className="workout__param-label">重量 kg</span>
                    <button
                      className="workout__big-btn"
                      aria-label="重量减2.5"
                      onClick={() => { haptic.onTap(); setWeight((w) => Math.max(0, Math.round((w - 2.5) * 10) / 10)) }}
                    >−</button>
                    <b className="workout__param-value">{weight === 0 ? '徒手' : weight}</b>
                    <button
                      className="workout__big-btn"
                      aria-label="重量加2.5"
                      onClick={() => { haptic.onTap(); setWeight((w) => Math.round((w + 2.5) * 10) / 10) }}
                    >＋</button>
                    {isBarbell && (
                      <button
                        className={`workout__bar-toggle ${barOpen ? 'workout__bar-toggle--on' : ''}`}
                        onClick={() => { haptic.onTap(); setBarOpen((v) => !v) }}
                        aria-expanded={barOpen}
                      >
                        片
                      </button>
                    )}
                  </div>

                  {/* 杠铃片换算：默认折叠，按需展开 */}
                  {isBarbell && barOpen && (
                    <div className="workout__barbell">
                      <div className="workout__barbell-row">
                        <span className="workout__barbell-label">空杆</span>
                        <div className="workout__barbell-opts">
                          {BAR_WEIGHTS.map((b) => (
                            <button
                              key={b}
                              className={`workout__barbell-chip ${barWeight === b ? 'workout__barbell-chip--on' : ''}`}
                              onClick={() => { haptic.onTap(); applyBarWeight(b, perSide) }}
                            >
                              {b === 0 ? '无' : `${b}`}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="workout__barbell-row">
                        <span className="workout__barbell-label">单边</span>
                        <div className="workout__barbell-opts">
                          {[0, 5, 10, 15, 20, 25].map((p) => (
                            <button
                              key={p}
                              className={`workout__barbell-chip ${perSide === p ? 'workout__barbell-chip--on' : ''}`}
                              onClick={() => { haptic.onTap(); applyBarWeight(barWeight, p) }}
                            >
                              {p === 0 ? '空杆' : `+${p}`}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="workout__barbell-sum">
                        单边 {perSide}kg×2 + 杆 {barWeight}kg ＝ <b>{barWeight + perSide * 2}</b>kg 总重
                      </p>
                    </div>
                  )}

                  {/* 次数：整行大步进器 */}
                  <div className="workout__param-row">
                    <span className="workout__param-label">次数</span>
                    <button
                      className="workout__big-btn"
                      aria-label="次数减1"
                      onClick={() => { haptic.onTap(); setReps((r) => Math.max(1, r - 1)) }}
                    >−</button>
                    <b className="workout__param-value">{reps}</b>
                    <button
                      className="workout__big-btn"
                      aria-label="次数加1"
                      onClick={() => { haptic.onTap(); setReps((r) => r + 1) }}
                    >＋</button>
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

              {/* 已完成组：行式，支持挪动顺序 + 两段确认撤销 */}
              {curEx.sets.length > 0 && (
                <div className="workout__log">
                  <div className="workout__log-head">
                    <span>已完成 {curEx.sets.length} 组</span>
                    <span>点「调整」挪动顺序或撤销</span>
                  </div>
                  {curEx.sets.map((g, j) => (
                    <div
                      key={g.doneAt}
                      className={`workout__log-row ${armedIdx === j ? 'workout__log-row--armed' : ''} ${confirmIdx === j ? 'workout__log-row--confirm' : ''}`}
                    >
                      <i className="workout__log-idx">{j + 1}</i>
                      <span className="workout__log-val">
                        {g.weight === 0 ? '徒手' : `${g.weight}kg`}×{g.reps} ✓
                      </span>
                      {armedIdx === j ? (
                        <span className="workout__log-ops">
                          {confirmIdx === j ? (
                            <button
                              className="workout__log-confirm"
                              onClick={() => { haptic.onSelect(); setArmedIdx(null); setConfirmIdx(null); undoSet(cur, j) }}
                            >
                              再点一次确认撤销
                            </button>
                          ) : (
                            <>
                              <button
                                className="workout__log-op"
                                disabled={j === 0}
                                aria-label="上移"
                                onClick={() => { haptic.onTap(); moveSet(cur, j, -1); setArmedIdx(j - 1) }}
                              >
                                ↑
                              </button>
                              <button
                                className="workout__log-op"
                                disabled={j === curEx.sets.length - 1}
                                aria-label="下移"
                                onClick={() => { haptic.onTap(); moveSet(cur, j, 1); setArmedIdx(j + 1) }}
                              >
                                ↓
                              </button>
                              <button
                                className="workout__log-op workout__log-op--undo"
                                onClick={() => { haptic.onSelect(); setConfirmIdx(j) }}
                              >
                                撤销
                              </button>
                              <button className="workout__log-op" aria-label="收起" onClick={() => { haptic.onTap(); setArmedIdx(null) }}>
                                ×
                              </button>
                            </>
                          )}
                        </span>
                      ) : (
                        <button
                          className="workout__log-adjust"
                          onClick={() => { haptic.onTap(); setArmedIdx(j); setConfirmIdx(null) }}
                        >
                          调整
                        </button>
                      )}
                    </div>
                  ))}
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
