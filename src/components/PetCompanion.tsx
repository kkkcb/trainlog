/* eslint-disable react-hooks/set-state-in-effect, react-hooks/refs, react-hooks/immutability, react-hooks/purity -- 宠物为游戏式命令式动画逻辑(定时游走/冲刺/粒子),非声明式数据流 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TrainingRecord } from '../types'
import { useHapticFeedback } from '../hooks/useHapticFeedback'
import { getTodayString } from '../utils/date'
// 宠物美术资源：Microsoft Fluent Emoji 3D（MIT License）· https://github.com/microsoft/fluentui-emoji
import eggArt from '../assets/pets3d/egg.png'
import hatchArt from '../assets/pets3d/hatch.png'
import dragonFaceArt from '../assets/pets3d/dragon-face.png'
import dragonArt from '../assets/pets3d/dragon.png'
import dogArt from '../assets/pets3d/dog.png'
import catArt from '../assets/pets3d/cat.png'
import frogArt from '../assets/pets3d/frog.png'
import pandaArt from '../assets/pets3d/panda.png'
import rabbitArt from '../assets/pets3d/rabbit.png'
import unicornArt from '../assets/pets3d/unicorn.png'
import './PetCompanion.css'

/**
 * 训练养宠（日历栖居 · 军团版）：
 * 主宠四阶进化 + 最多 6 只小伙伴组成军团同住月历；
 * 喂食时全员冲刺到打卡格子开派对，新伙伴入场自带「我来啦」动画。
 */

type Stage = 'egg' | 'blob' | 'dragon' | 'legend'

const STAGE_ORDER: Stage[] = ['egg', 'blob', 'dragon', 'legend']
const STAGE_NAME: Record<Stage, string> = {
  egg: '神秘蛋',
  blob: '咕噜兽',
  dragon: '烈焰幼龙',
  legend: '雷鸣神龙',
}
const STAGE_RANGE: Record<Stage, [number, number]> = {
  egg: [0, 1],
  blob: [1, 15],
  dragon: [15, 40],
  legend: [40, 41],
}

function stageFor(total: number): Stage {
  if (total <= 0) return 'egg'
  if (total < 15) return 'blob'
  if (total < 40) return 'dragon'
  return 'legend'
}

export interface PetCandidate {
  index: number
  date: string
}

interface CalendarPetProps {
  candidates: PetCandidate[]
  records: Record<string, TrainingRecord>
  trainingDates: Set<string>
  selectedDate: string
  feedSignal?: number
  onQuickAdd?: (date: string) => void
}

type MiniKind = 'dog' | 'cat' | 'frog' | 'panda' | 'rabbit' | 'unicorn'

const MINI_DEFS: Array<{ unlock: number; kind: MiniKind }> = [
  { unlock: 2, kind: 'dog' },
  { unlock: 3, kind: 'cat' },
  { unlock: 4, kind: 'frog' },
  { unlock: 5, kind: 'panda' },
  { unlock: 6, kind: 'rabbit' },
  { unlock: 7, kind: 'unicorn' },
]

const POKE_MSGS: Record<Stage, string[]> = {
  egg: ['咚咚咚……有动静！', '完成 1 次训练我就孵化', '别戳啦，晃晕了…'],
  blob: ['嗷呜，浑身是劲！', '力量在涌动✧', '陪我练一组嘛~'],
  dragon: ['吼——今天也是训练日！', '翅膀越来越有力了！', '目标已在燃烧🔥'],
  legend: ['神龙与你同在⚡', '你已是传奇，保持住', '雷霆之息——呼！'],
}
const FED_MSGS: Record<Exclude<Stage, 'egg'>, string[]> = {
  blob: ['好吃！力量+1！', '能量在翻滚~', '嗷呜，满足！'],
  dragon: ['真香，火焰要喷出来了', '龙威+1！', '能量吸收完毕'],
  legend: ['传说也要吃饭的', '雷霆之力+1⚡', '呜呼——满足！'],
}
const MINI_MSGS = ['吱！', '陪练打卡~', '小家伙也要变强！', '嘿嘿，戳中啦', '开饭啦！']

/** 体型：阶段内随喂食进度真实变大 */
function scaleFor(stage: Stage, total: number): number {
  if (stage === 'legend') return 1.2
  const [lo, hi] = STAGE_RANGE[stage]
  const p = Math.min(1, Math.max(0, (total - lo) / (hi - lo)))
  return 0.82 + p * 0.36
}

const ROAM_MIN_MS = 8000
const ROAM_RAND_MS = 5000
const LONG_PRESS_MS = 480

export function CalendarPet({
  candidates,
  records,
  trainingDates,
  selectedDate,
  feedSignal = 0,
  onQuickAdd,
}: CalendarPetProps) {
  const haptic = useHapticFeedback()
  const today = getTodayString()

  const totalWorkouts = useMemo(() => Object.keys(records).length, [records])
  const stage = stageFor(totalWorkouts)

  // ---------- 主宠栖息位 ----------
  const [posIdx, setPosIdx] = useState<number>(() => {
    const empty = candidates.filter(
      (c) => c.date < today && !trainingDates.has(c.date)
    )
    if (empty.length === 0) return candidates[0]?.index ?? 26
    return empty[Math.floor(Math.random() * empty.length)].index
  })
  const [walking, setWalking] = useState(false)
  const posRef = useRef(posIdx)
  const candidatesRef = useRef(candidates)
  useEffect(() => {
    candidatesRef.current = candidates
  }, [candidates])

  useEffect(() => {
    if (!candidates.some((c) => c.index === posRef.current)) {
      const pool = candidates.filter((c) => c.date < today)
      if (pool.length > 0) setPosIdx(pool[Math.floor(Math.random() * pool.length)].index)
    }
  }, [candidates, today])

  useEffect(() => {
    let alive = true
    const schedule = () => {
      const timer = setTimeout(() => {
        if (!alive) return
        const pool = candidatesRef.current.filter(
          (c) => c.index !== posRef.current && c.date <= today
        )
        if (pool.length > 0) {
          setWalking(true)
          setPosIdx(pool[Math.floor(Math.random() * pool.length)].index)
          setTimeout(() => alive && setWalking(false), 620)
        }
        timer2 = schedule()
      }, ROAM_MIN_MS + Math.random() * ROAM_RAND_MS)
      return timer
    }
    let timer2 = schedule()
    return () => {
      alive = false
      clearTimeout(timer2)
    }
  }, [today])

  // ---------- 气泡 ----------
  const [bubble, setBubble] = useState<string | null>(null)
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const say = useCallback((text: string, ms = 2200) => {
    setBubble(text)
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current)
    bubbleTimer.current = setTimeout(() => setBubble(null), ms)
  }, [])

  // ---------- 戳一戳 / 双击 / 长按 ----------
  const [poked, setPoked] = useState(false)
  const [spin, setSpin] = useState(false)
  const [tapIdx, setTapIdx] = useState(0)
  const lastTapRef = useRef(0)
  const pokeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lpTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lpFiredRef = useRef(false)
  const curDate = candidates.find((c) => c.index === posIdx)?.date ?? today

  const clearLp = () => {
    if (lpTimer.current) clearTimeout(lpTimer.current)
    lpTimer.current = null
  }
  const startLp = () => {
    lpFiredRef.current = false
    lpTimer.current = setTimeout(() => {
      if (lpFiredRef.current) return
      lpFiredRef.current = true
      haptic.onSelect()
      say('这天的能量给我！！')
      onQuickAdd?.(curDate)
    }, LONG_PRESS_MS)
  }
  const handleUp = () => clearLp()

  const handlePoke = () => {
    clearLp()
    if (lpFiredRef.current) return
    haptic.onTap()
    const now = Date.now()
    if (now - lastTapRef.current < 320) {
      setSpin(true)
      say(stage === 'egg' ? '晕车了…' : '看我的转圈圈！')
      setTimeout(() => setSpin(false), 900)
      lastTapRef.current = 0
      return
    }
    lastTapRef.current = now
    setPoked(true)
    setTapIdx((i) => i + 1)
    say(POKE_MSGS[stage][tapIdx % POKE_MSGS[stage].length])
    if (pokeTimer.current) clearTimeout(pokeTimer.current)
    pokeTimer.current = setTimeout(() => setPoked(false), 650)
  }

  // ---------- 喂食：全员冲刺到打卡格子 + 派对 ----------
  const [party, setParty] = useState(false)
  const [burstKey, setBurstKey] = useState(0)
  const [rushIdx, setRushIdx] = useState<number | null>(null)
  const [particles, setParticles] = useState<
    Array<{ id: number; angle: number; dist: number; size: number; color: string; star: boolean }>
  >([])
  const prevTotalRef = useRef(totalWorkouts)

  useEffect(() => {
    const prev = prevTotalRef.current
    prevTotalRef.current = totalWorkouts
    if (feedSignal <= 0 || totalWorkouts <= prev) return

    // 冲刺目标：优先刚打卡的日期所在格
    const target = candidates.find((c) => c.date === selectedDate)
    if (target && target.index !== posRef.current) {
      setRushIdx(target.index)
      setWalking(true)
      setPosIdx(target.index)
      posRef.current = target.index
      setTimeout(() => setWalking(false), 620)
    }
    setParty(true)
    setBurstKey((k) => k + 1)
    setParticles(
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        angle: (i / 12) * Math.PI * 2 + Math.random(),
        dist: 30 + Math.random() * 34,
        size: 9 + Math.random() * 8,
        color: ['#34d399', '#fbbf24', '#f472b6', '#60a5fa'][i % 4],
        star: i % 2 === 0,
      }))
    )
    const nowIdx = STAGE_ORDER.indexOf(stage)
    const prevIdx = STAGE_ORDER.indexOf(stageFor(prev))
    if (nowIdx > prevIdx) say(`进化！${STAGE_NAME[stage]}`, 2400)
    else if (stage !== 'egg')
      say(FED_MSGS[stage][Math.floor(Math.random() * FED_MSGS[stage].length)], 2400)
    else say('破壳了！！')
    const t = setTimeout(() => {
      setParty(false)
      setRushIdx(null)
    }, 1900)
    return () => clearTimeout(t)
  }, [feedSignal, totalWorkouts, stage, say, haptic, candidates, selectedDate])

  // ---------- 进化全屏过场 ----------
  const [evolvingFrom, setEvolvingFrom] = useState<Stage | null>(null)
  const evolvePrevRef = useRef(totalWorkouts)
  useEffect(() => {
    const prev = evolvePrevRef.current
    evolvePrevRef.current = totalWorkouts
    const wasIdx = STAGE_ORDER.indexOf(stageFor(prev))
    const nowIdx = STAGE_ORDER.indexOf(stage)
    if (nowIdx > wasIdx && prev !== totalWorkouts) {
      setEvolvingFrom(STAGE_ORDER[Math.max(0, wasIdx)])
      haptic.onSuccess()
      const t = setTimeout(() => setEvolvingFrom(null), 2400)
      return () => clearTimeout(t)
    }
  }, [totalWorkouts, stage, haptic])

  const cand = candidates.find((c) => c.index === posIdx)
  const col = cand ? (cand.index % 7) + 1 : 6
  const row = cand ? Math.floor(cand.index / 7) + 1 : 4

  const wrapClass = [
    'cal-pet__body',
    `cal-pet__body--${stage}`,
    walking ? 'cal-pet__body--walk' : '',
    poked ? 'cal-pet__body--poke' : '',
    spin ? 'cal-pet__body--spin' : '',
    party ? 'cal-pet__body--party' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const scalerStyle = { transform: `scale(${scaleFor(stage, totalWorkouts)})` }

  return (
    <>
      <div
        className={`cal-pet ${walking ? 'cal-pet--walking' : ''}`}
        style={{ gridColumn: col, gridRow: row }}
        onClick={handlePoke}
        onMouseDown={startLp}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
        onTouchStart={startLp}
        onTouchEnd={handleUp}
        onTouchCancel={handleUp}
        role="button"
        aria-label="训练宠物"
      >
        {bubble && <span className="cal-pet__bubble cal-pet__bubble--anim">{bubble}</span>}

        <div className="cal-pet__scaler" style={scalerStyle}>
          <div className={wrapClass}>
            <PetArt stage={stage} />
          </div>
          {stage !== 'egg' && <PetLids seed={posIdx} />}
        </div>

        {particles.map((p) => (
          <span
            key={`${burstKey}-${p.id}`}
            className="cal-pet__particle"
            style={
              {
                '--tx': `${Math.cos(p.angle) * p.dist}px`,
                '--ty': `${Math.sin(p.angle) * p.dist - 24}px`,
                width: p.size,
                height: p.size,
                color: p.color,
              } as React.CSSProperties
            }
          >
            {p.star ? '★' : '●'}
          </span>
        ))}
      </div>

      {/* 小伙伴军团 */}
      {MINI_DEFS.map((def, i) =>
        totalWorkouts >= def.unlock ? (
          <MiniPet
            key={`${def.kind}-${i}`}
            kind={def.kind}
            candidates={candidates}
            avoidIdxes={[posIdx, rushIdx ?? -1]}
            today={today}
            party={party}
            rushIdx={rushIdx}
            spawnDelay={i * 260}
          />
        ) : null
      )}

      {/* 进化全屏过场 */}
      {evolvingFrom && (
        <div className="evolve-overlay" onClick={() => setEvolvingFrom(null)}>
          <div className="evolve-rays" />
          <div className="evolve-body">
            <div className="evolve-old">
              <PetArt stage={evolvingFrom} />
            </div>
            <span className="evolve-arrow">➜</span>
            <div className="evolve-new">
              <PetArt stage={stage} />
            </div>
            <span className="evolve-title">进化！{STAGE_NAME[stage]}</span>
            <span className="evolve-sub">累计训练 {totalWorkouts} 次</span>
          </div>
        </div>
      )}
    </>
  )
}

/* ---------- 眨眼动效（3D 图片通用的眼睑投影方案）---------- */

function PetLids({ seed = 0 }: { seed?: number }) {
  const timing = useRef({
    dur: (4.4 + ((seed * 7919) % 23) / 10).toFixed(2) + 's',
    delay: (((seed * 3571) % 31) / 10).toFixed(2) + 's',
  }).current
  return (
    <span
      className="pet-lids"
      style={
        {
          '--blink-dur': timing.dur,
          '--blink-delay': timing.delay,
        } as React.CSSProperties
      }
    >
      <i className="pet-lids__lid" />
      <i className="pet-lids__lid" />
    </span>
  )
}

/* ---------- 小伙伴 ---------- */

function MiniPet({
  kind,
  candidates,
  avoidIdxes,
  today,
  party,
  rushIdx,
  spawnDelay,
}: {
  kind: MiniKind
  candidates: PetCandidate[]
  avoidIdxes: number[]
  today: string
  party: boolean
  rushIdx: number | null
  spawnDelay: number
}) {
  const haptic = useHapticFeedback()
  const [posIdx, setPosIdx] = useState(() => {
    const pool = candidates.filter((c) => c.date <= today && !avoidIdxes.includes(c.index))
    return pool.length > 0
      ? pool[Math.floor(Math.random() * pool.length)].index
      : candidates[0]?.index ?? 20
  })
  const [walking, setWalking] = useState(false)
  const [poked, setPoked] = useState(false)
  const [bubble, setBubble] = useState<string | null>(null)
  const bt = useRef<ReturnType<typeof setTimeout> | null>(null)
  const posRef = useRef(posIdx)
  // 候选列表在 effect 内同步，避免渲染期写 ref
  const candRef = useRef(candidates)
  useEffect(() => {
    candRef.current = candidates
  }, [candidates])

  const say = useCallback((text: string, ms = 2000) => {
    setBubble(text)
    if (bt.current) clearTimeout(bt.current)
    bt.current = setTimeout(() => setBubble(null), ms)
  }, [])

  // 入场：延迟 +「我来啦！」
  useEffect(() => {
    const t = setTimeout(() => say('我来啦！', 2000), spawnDelay)
    return () => clearTimeout(t)
  }, [say, spawnDelay])

  useEffect(() => {
    if (!candidates.some((c) => c.index === posRef.current)) {
      const pool = candidates.filter((c) => c.date <= today && !avoidIdxes.includes(c.index))
      if (pool.length > 0) setPosIdx(pool[Math.floor(Math.random() * pool.length)].index)
    }
  }, [candidates, today, avoidIdxes])

  useEffect(() => {
    let alive = true
    const schedule = () => {
      const timer = setTimeout(() => {
        if (!alive) return
        const pool = candRef.current.filter(
          (c) => c.index !== posRef.current && !avoidIdxes.includes(c.index) && c.date <= today
        )
        if (pool.length > 0) {
          setWalking(true)
          setPosIdx(pool[Math.floor(Math.random() * pool.length)].index)
          setTimeout(() => alive && setWalking(false), 620)
        }
        timer2 = schedule()
      }, ROAM_MIN_MS + 2500 + Math.random() * ROAM_RAND_MS)
      return timer
    }
    let timer2 = schedule()
    return () => {
      alive = false
      clearTimeout(timer2)
    }
  }, [today, avoidIdxes])

  // 喂食冲刺：奔向开饭格
  useEffect(() => {
    if (rushIdx == null || rushIdx === posRef.current) return
    setWalking(true)
    setPosIdx(rushIdx)
    posRef.current = rushIdx
    say('干饭啦！！')
    const t = setTimeout(() => setWalking(false), 620)
    return () => clearTimeout(t)
  }, [rushIdx, say])

  const handlePoke = (e: React.MouseEvent) => {
    e.stopPropagation()
    haptic.onTap()
    setPoked(true)
    say(MINI_MSGS[Math.floor(Math.random() * MINI_MSGS.length)])
    setTimeout(() => setPoked(false), 600)
  }

  const cand = candidates.find((c) => c.index === posIdx)
  const col = cand ? (cand.index % 7) + 1 : 5
  const row = cand ? Math.floor(cand.index / 7) + 1 : 3

  return (
    <div
      className={`cal-pet cal-pet--mini ${walking ? 'cal-pet--walking' : ''} cal-pet--spawn`}
      style={{ gridColumn: col, gridRow: row, animationDelay: `${spawnDelay}ms` }}
      onClick={handlePoke}
      role="button"
      aria-label="宠物小伙伴"
    >
      {bubble && <span className="cal-pet__bubble">{bubble}</span>}
      <div
        className={`cal-pet__scaler ${party ? 'cal-pet__body--party' : ''} ${poked ? 'cal-pet__body--poke' : ''}`}
      >
        <div className={`cal-pet__body ${walking ? 'cal-pet__body--walk' : ''}`}>
          <MiniArt kind={kind} />
        </div>
        <PetLids seed={posIdx + 3} />
      </div>    </div>
  )
}

const MINI_ART: Record<MiniKind, string> = {
  dog: dogArt,
  cat: catArt,
  frog: frogArt,
  panda: pandaArt,
  rabbit: rabbitArt,
  unicorn: unicornArt,
}

function MiniArt({ kind }: { kind: MiniKind }) {
  return <img className="pet-art" src={MINI_ART[kind]} alt="" draggable={false} />
}

/* ---------- 主宠四阶段美术 ---------- */

const STAGE_ART: Record<Stage, string> = {
  egg: eggArt,
  blob: hatchArt,
  dragon: dragonFaceArt,
  legend: dragonArt,
}

export function PetArt({ stage }: { stage: Stage }) {
  return <img className="pet-art" src={STAGE_ART[stage]} alt="" draggable={false} />
}
