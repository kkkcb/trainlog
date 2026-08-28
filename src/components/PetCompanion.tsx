import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TrainingRecord } from '../types'
import { useHapticFeedback } from '../hooks/useHapticFeedback'
import { getTodayString } from '../utils/date'
import './PetCompanion.css'

/**
 * 训练养宠（日历栖居 + 小队版）：
 * 主宠按累计训练四阶进化，体型随阶段内进度真实变大；
 * 累计 3 次/10 次分别解锁橙/蓝小伙伴，组成小队同住日历。
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
  feedSignal?: number
  onQuickAdd?: (date: string) => void
}

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
const MINI_MSGS = ['吱！', '陪练打卡~', '小家伙也要变强！', '嘿嘿，戳中啦']

/** 体型：阶段内随喂食进度真实变大（每喂一次肉眼可辨） */
function scaleFor(stage: Stage, total: number): number {
  if (stage === 'legend') return 1.2
  const [lo, hi] = STAGE_RANGE[stage]
  const p = Math.min(1, Math.max(0, (total - lo) / (hi - lo)))
  return 0.82 + p * 0.36
}

const ROAM_MIN_MS = 8000
const ROAM_RAND_MS = 5000
const LONG_PRESS_MS = 480
const MINI_UNLOCK = [3, 10]

export function CalendarPet({
  candidates,
  records,
  trainingDates,
  feedSignal = 0,
  onQuickAdd,
}: CalendarPetProps) {
  const haptic = useHapticFeedback()
  const today = getTodayString()

  const totalWorkouts = useMemo(() => Object.keys(records).length, [records])
  const stage = stageFor(totalWorkouts)

  // ---------- 主宠栖息位（与散步） ----------
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
  candidatesRef.current = candidates

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
  const curDate =
    candidates.find((c) => c.index === posIdx)?.date ?? today

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

  // ---------- 喂食庆祝（真实变大：体型由 scaleFor 驱动） ----------
  const [party, setParty] = useState(false)
  const [burstKey, setBurstKey] = useState(0)
  const prevTotalRef = useRef(totalWorkouts)
  useEffect(() => {
    const prev = prevTotalRef.current
    prevTotalRef.current = totalWorkouts
    if (feedSignal <= 0 || totalWorkouts <= prev) return
    setParty(true)
    setBurstKey((k) => k + 1)
    const nowIdx = STAGE_ORDER.indexOf(stage)
    const prevIdx = STAGE_ORDER.indexOf(stageFor(prev))
    if (nowIdx > prevIdx) say(`进化！${STAGE_NAME[stage]}`, 2400)
    else if (stage !== 'egg')
      say(FED_MSGS[stage][Math.floor(Math.random() * FED_MSGS[stage].length)], 2400)
    else say('破壳了！！')
    const t = setTimeout(() => setParty(false), 1600)
    return () => clearTimeout(t)
  }, [feedSignal, totalWorkouts, stage, say, haptic])

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

  // ---------- 粒子 ----------
  const particles = useMemo(
    () =>
      burstKey === 0
        ? []
        : Array.from({ length: 12 }, (_, i) => ({
            id: i,
            angle: (i / 12) * Math.PI * 2 + Math.random(),
            dist: 30 + Math.random() * 34,
            size: 9 + Math.random() * 8,
            color: ['#34d399', '#fbbf24', '#f472b6', '#60a5fa'][i % 4],
            star: i % 2 === 0,
          })),
    [burstKey]
  )

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

      {/* 小伙伴小队 */}
      {MINI_UNLOCK.map((unlockAt, i) =>
        totalWorkouts >= unlockAt ? (
          <MiniPet
            key={`mini-${i}`}
            id={`mini-${i}`}
            candidates={candidates}
            avoidIdx={posIdx}
            party={party}
            today={today}
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

/* ---------- 小伙伴（mini）：换色缩小，独立游走，可戳 ---------- */

function MiniPet({
  id,
  candidates,
  avoidIdx,
  party,
  today,
}: {
  id: string
  candidates: PetCandidate[]
  avoidIdx: number
  party: boolean
  today: string
}) {
  const haptic = useHapticFeedback()
  const hueClass = id === 'mini-0' ? 'cal-pet--hue-orange' : 'cal-pet--hue-blue'

  const [posIdx, setPosIdx] = useState(() => {
    const pool = candidates.filter((c) => c.index !== avoidIdx && c.date <= today)
    return pool.length > 0
      ? pool[Math.floor(Math.random() * pool.length)].index
      : candidates[0]?.index ?? 20
  })
  const [walking, setWalking] = useState(false)
  const posRef = useRef(posIdx)
  const candRef = useRef(candidates)
  candRef.current = candidates

  useEffect(() => {
    if (!candidates.some((c) => c.index === posRef.current)) {
      const pool = candidates.filter((c) => c.date <= today && c.index !== avoidIdx)
      if (pool.length > 0) setPosIdx(pool[Math.floor(Math.random() * pool.length)].index)
    }
  }, [candidates, today, avoidIdx])

  useEffect(() => {
    let alive = true
    const schedule = () => {
      const timer = setTimeout(() => {
        if (!alive) return
        const pool = candRef.current.filter(
          (c) => c.index !== posRef.current && c.index !== avoidIdx && c.date <= today
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
  }, [today, avoidIdx])

  const [poked, setPoked] = useState(false)
  const [bubble, setBubble] = useState<string | null>(null)
  const bt = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [spawn] = useState(true)

  const handlePoke = (e: React.MouseEvent) => {
    e.stopPropagation()
    haptic.onTap()
    setPoked(true)
    setBubble(MINI_MSGS[Math.floor(Math.random() * MINI_MSGS.length)])
    setTimeout(() => setPoked(false), 600)
    if (bt.current) clearTimeout(bt.current)
    bt.current = setTimeout(() => setBubble(null), 2000)
  }

  const cand = candidates.find((c) => c.index === posIdx)
  const col = cand ? (cand.index % 7) + 1 : 5
  const row = cand ? Math.floor(cand.index / 7) + 1 : 3

  return (
    <div
      className={`cal-pet cal-pet--mini ${hueClass} ${walking ? 'cal-pet--walking' : ''} ${spawn ? 'cal-pet--spawn' : ''}`}
      style={{ gridColumn: col, gridRow: row }}
      onClick={handlePoke}
      role="button"
      aria-label="宠物小伙伴"
    >
      {bubble && <span className="cal-pet__bubble">{bubble}</span>}
      <div className={`cal-pet__scaler ${party ? 'cal-pet__body--party' : ''} ${poked ? 'cal-pet__body--poke' : ''}`}>
        <div className={`cal-pet__body ${walking ? 'cal-pet__body--walk' : ''}`}>
          <BlobArt />
        </div>
      </div>
    </div>
  )
}

/* ---------- 四阶段 SVG ---------- */

export function PetArt({ stage }: { stage: Stage }) {
  if (stage === 'egg') return <EggArt />
  if (stage === 'legend') return <DragonArt legend />
  if (stage === 'dragon') return <DragonArt />
  return <BlobArt />
}

function EggArt() {
  return (
    <svg viewBox="0 0 48 48" className="pet-svg" aria-hidden>
      <defs>
        <linearGradient id="pgEgg" x1="24" y1="44" x2="24" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#cfd8e3" />
          <stop offset="1" stopColor="#f5f7fa" />
        </linearGradient>
      </defs>
      <path
        d="M24 4C14 4 9 16 9 27a15 15 0 0 0 30 0C39 16 34 4 24 4Z"
        fill="url(#pgEgg)"
        stroke="#334155"
        strokeWidth="1.6"
      />
      <circle cx="18" cy="20" r="2.4" fill="#34d399" opacity=".55" />
      <circle cx="29" cy="30" r="2.8" fill="#8b5cf6" opacity=".45" />
      <circle cx="19" cy="33" r="1.7" fill="#60a5fa" opacity=".5" />
      <path d="M17 25l4 3-3 3 5 3" stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="28" cy="13" rx="3.2" ry="4.5" fill="#fff" opacity=".5" transform="rotate(-18 28 13)" />
    </svg>
  )
}

function BlobArt() {
  return (
    <svg viewBox="0 0 48 48" className="pet-svg" aria-hidden>
      <defs>
        <linearGradient id="pgBlob" x1="24" y1="42" x2="24" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0ea571" />
          <stop offset="1" stopColor="#38dfa2" />
        </linearGradient>
      </defs>
      <path d="M24 12q1-6 7-7" stroke="#38dfa2" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="31.6" cy="5" r="2.4" fill="#fbbf24" />
      <path
        d="M8 29q0-17 16-17t16 17q0 12-16 12T8 29Z"
        fill="url(#pgBlob)"
        stroke="#0b6b4d"
        strokeWidth="1.4"
      />
      <ellipse cx="17" cy="21" rx="4.5" ry="6" fill="#eafff5" opacity=".35" transform="rotate(-16 17 21)" />
      <g className="pet-eye">
        <circle cx="18.5" cy="28" r="3.4" fill="#fff" />
        <circle cx="29.5" cy="28" r="3.4" fill="#fff" />
        <circle cx="19.6" cy="28.4" r="1.8" fill="#0b0e11" />
        <circle cx="30.6" cy="28.4" r="1.8" fill="#0b0e11" />
      </g>
      <g className="pet-lid">
        <rect x="15" y="24" width="7" height="8" rx="2" fill="url(#pgBlob)" />
        <rect x="26" y="24" width="7" height="8" rx="2" fill="url(#pgBlob)" />
      </g>
      <path d="M21 34q3 3 6 0" stroke="#063b2b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="7" cy="32" r="3" fill="#38dfa2" />
      <circle cx="41" cy="32" r="3" fill="#38dfa2" />
    </svg>
  )
}

function DragonArt({ legend = false }: { legend?: boolean }) {
  return (
    <svg viewBox="0 0 64 52" className="pet-svg pet-svg--wide" aria-hidden>
      <defs>
        <linearGradient id="pgDra" x1="32" y1="46" x2="32" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={legend ? '#6d28d9' : '#0ea571'} />
          <stop offset="1" stopColor={legend ? '#a78bfa' : '#38dfa2'} />
        </linearGradient>
      </defs>
      {legend && (
        <g className="pet-halo">
          <circle cx="32" cy="26" r="22" fill="none" stroke="#fbbf24" strokeWidth="1.6" strokeDasharray="6 9" strokeLinecap="round" />
        </g>
      )}
      <path d="M18 22Q4 12 6 26q2 10 14 8Z" fill={legend ? '#7c3aed' : '#0ea571'} opacity=".8" />
      <path d="M46 22q14-10 12 4-2 10-14 8Z" fill={legend ? '#7c3aed' : '#0ea571'} opacity=".8" />
      <path d="M44 40q10 2 12-4l3 5-6 4q-6 2-11-3Z" fill={legend ? '#8b5cf6' : '#2dd4a0'} />
      <path
        d="M14 30q0-16 18-16t18 16q0 12-18 12T14 30Z"
        fill="url(#pgDra)"
        stroke={legend ? '#4c1d95' : '#0b6b4d'}
        strokeWidth="1.4"
      />
      <path d="M20 14 16 7l6 3M44 14l4-7-6 3" stroke="#fbbf24" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <ellipse cx="24" cy="21" rx="5" ry="6.5" fill="#fff" opacity=".3" transform="rotate(-14 24 21)" />
      <g className="pet-eye">
        <circle cx="26" cy="30" r="3.6" fill="#fff" />
        <circle cx="38" cy="30" r="3.6" fill="#fff" />
        <circle cx="27.2" cy="30.4" r="1.9" fill="#0b0e11" />
        <circle cx="39.2" cy="30.4" r="1.9" fill="#0b0e11" />
      </g>
      <g className="pet-lid">
        <rect x="22" y="26" width="8" height="8" rx="2" fill="url(#pgDra)" />
        <rect x="34" y="26" width="8" height="8" rx="2" fill="url(#pgDra)" />
      </g>
      <path d="M28.5 36q3.5 3 7 0" stroke="#08131f" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <polygon points="32,36 28.6,41 31,41 29.4,46 34.6,39.6 32,39.6 34,36" fill={legend ? '#fef3c7' : '#fbbf24'} />
    </svg>
  )
}
