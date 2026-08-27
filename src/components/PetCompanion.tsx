import { useEffect, useMemo, useRef, useState } from 'react'
import { useHapticFeedback } from '../hooks/useHapticFeedback'
import { getTodayString } from '../utils/date'
import type { TrainingRecord } from '../types'
import './PetCompanion.css'

/** 训练养宠：每记一次训练 = 喂一次，累计次数驱动四阶进化 */

type Stage = 'egg' | 'blob' | 'dragon' | 'legend'

const STAGE_ORDER: Stage[] = ['egg', 'blob', 'dragon', 'legend']
const STAGE_NAME: Record<Stage, string> = {
  egg: '神秘蛋',
  blob: '咕噜兽',
  dragon: '烈焰幼龙',
  legend: '雷鸣神龙',
}

function stageFor(total: number): Stage {
  if (total <= 0) return 'egg'
  if (total < 15) return 'blob'
  if (total < 40) return 'dragon'
  return 'legend'
}

const HATCH_AT = 1
const TEEN_AT = 15
const LEGEND_AT = 40

interface PetCompanionProps {
  records: Record<string, TrainingRecord>
  /** 每次成功添加/保存训练时 +1，触发庆祝动画 */
  feedSignal?: number
}

const TAP_MSGS: Record<Stage, string[]> = {
  egg: [
    '咚咚咚……里面好像有动静！',
    `完成 ${HATCH_AT} 次训练我就孵化啦`,
    '别戳了别戳了，晃晕了…',
  ],
  blob: ['嗷呜，浑身是劲！', '力量在涌动 (•̀ω•́)✧', '陪我练一组嘛~'],
  dragon: ['吼——今天也是训练日！', '翅膀越来越有力了！', '下一个目标已在燃烧'],
  legend: ['神龙俯瞰凡间的训练们', '你已经是传奇了，保持住', '呼啸吧！雷霆之息⚡'],
}

/** 喂食后的欢呼气泡（优先于普通语料） */
const FED_MSGS: Record<Exclude<Stage, 'egg'>, string[]> = {
  blob: ['好吃！力量+1！', '嗷！能量在体内翻滚~', '感谢投喂，又要长大啦'],
  dragon: ['这顿真香，火焰要喷出来了', '龙威+1！', '今日份能量已吸收✓'],
  legend: ['传说级也要吃饭的', '雷霆之力 +1⚡', '呜呼——满足了'],
}

export function PetCompanion({ records, feedSignal = 0 }: PetCompanionProps) {
  const haptic = useHapticFeedback()
  const today = getTodayString()

  const totalWorkouts = useMemo(() => Object.keys(records).length, [records])
  const stage = stageFor(totalWorkouts)
  const fedToday = useMemo(
    () => Object.values(records).some((r) => r.date === today),
    [records, today]
  )

  const prevTotalRef = useRef(totalWorkouts)
  const [evolvingFrom, setEvolvingFrom] = useState<Stage | null>(null)

  // 进化检测：会话内向上跨过阈值 → 播放全屏进化过场
  useEffect(() => {
    const prev = prevTotalRef.current
    prevTotalRef.current = totalWorkouts
    const wasIdx = STAGE_ORDER.indexOf(stageFor(prev))
    const nowIdx = STAGE_ORDER.indexOf(stage)
    if (nowIdx > wasIdx && prev !== totalWorkouts) {
      setEvolvingFrom(STAGE_ORDER[Math.max(0, wasIdx - 1)])
      haptic.onSuccess()
      const t = setTimeout(() => setEvolvingFrom(null), 2400)
      return () => clearTimeout(t)
    }
  }, [totalWorkouts, stage, haptic])

  // 喂养庆祝：feedSignal 变化触发派对动画 + 粒子
  const firstFeedRef = useRef(true)
  const [party, setParty] = useState(false)
  const [burstKey, setBurstKey] = useState(0)
  useEffect(() => {
    if (firstFeedRef.current) {
      firstFeedRef.current = false
      return
    }
    setParty(true)
    setBurstKey((k) => k + 1)
    const t = setTimeout(() => setParty(false), 1600)
    return () => clearTimeout(t)
  }, [feedSignal])

  // 戳一戳
  const [poked, setPoked] = useState(false)
  const [tapIdx, setTapIdx] = useState(0)
  const pokeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handlePoke = () => {
    haptic.onTap()
    setPoked(true)
    setTapIdx((i) => i + 1)
    if (pokeTimer.current) clearTimeout(pokeTimer.current)
    pokeTimer.current = setTimeout(() => setPoked(false), 700)
  }

  const particles = useMemo(
    () =>
      burstKey === 0
        ? []
        : Array.from({ length: 10 }, (_, i) => ({
            id: i,
            angle: (i / 10) * Math.PI * 2 + Math.random(),
            dist: 34 + Math.random() * 30,
            size: 8 + Math.random() * 8,
            color: ['#34d399', '#fbbf24', '#f472b6', '#60a5fa'][i % 4],
            star: i % 3 === 0,
          })),
    [burstKey]
  )

  const bubbleText = party
    ? FED_MSGS[stage as Exclude<Stage, 'egg'>]?.[tapIdx % 3] ?? FED_MSGS.blob[0]
    : TAP_MSGS[stage][tapIdx % TAP_MSGS[stage].length]

  const wrapClass = [
    'pet-wrap',
    `pet-wrap--${stage}`,
    poked ? 'pet-wrap--poke' : '',
    party ? 'pet-wrap--party' : '',
  ].join(' ')

  return (
    <>
      <div className="pet-card" onClick={handlePoke} role="button" aria-label="训练宠物">
        <div className="pet-stage">
          <div className={wrapClass}>
            <PetArt stage={stage} total={totalWorkouts} />
          </div>
          {/* 庆祝粒子 */}
          {particles.map((p) => (
            <span
              key={`${burstKey}-${p.id}`}
              className="pet-particle"
              style={
                {
                  '--tx': `${Math.cos(p.angle) * p.dist}px`,
                  '--ty': `${Math.sin(p.angle) * p.dist - 26}px`,
                  width: p.size,
                  height: p.size,
                  background: p.star ? 'transparent' : p.color,
                } as React.CSSProperties
              }
            >
              {p.star ? '★' : ''}
            </span>
          ))}
        </div>

        <div className="pet-info">
          <div className="pet-name-row">
            <span className="pet-name">{STAGE_NAME[stage]}</span>
            {!fedToday && (
              <span className={`pet-need ${stage === 'egg' ? 'pet-need--hunger' : ''}`}>
                {stage === 'egg' ? '未孵化' : '饿饿'}
              </span>
            )}
          </div>
          <span className={`pet-bubble ${fedToday || party ? 'pet-bubble--happy' : ''}`}>
            {bubbleText}
          </span>
        </div>
      </div>

      {/* 进化全屏过场 */}
      {evolvingFrom && (
        <div className="evolve-overlay" onClick={() => setEvolvingFrom(null)}>
          <div className="evolve-rays" />
          <div className="evolve-body">
            <div className="evolve-old">
              <PetArt stage={evolvingFrom} total={totalWorkouts} />
            </div>
            <span className="evolve-arrow">➜</span>
            <div className="evolve-new">
              <PetArt stage={stage} total={totalWorkouts} />
            </div>
            <span className="evolve-title">进化！{STAGE_NAME[stage]}</span>
            <span className="evolve-sub">
              累计训练 {totalWorkouts} 次
              {totalWorkouts >= LEGEND_AT
                ? ''
                : totalWorkouts >= TEEN_AT
                  ? ` · ${LEGEND_AT} 次觉醒最终形态`
                  : ` · ${TEEN_AT} 次进化为幼龙`}
            </span>
          </div>
        </div>
      )}
    </>
  )
}

/* ---------- 四阶段 SVG ---------- */

export function PetArt({ stage }: { stage: Stage; total?: number }) {
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
      {/* 触角 */}
      <path d="M24 12q1-6 7-7" stroke="#38dfa2" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="31.6" cy="5" r="2.4" fill="#fbbf24" />
      {/* 身体 */}
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
      {/* 小手 */}
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
      {/* 光环（最终形态） */}
      {legend && (
        <g className="pet-halo">
          <circle cx="32" cy="26" r="22" fill="none" stroke="#fbbf24" strokeWidth="1.6" strokeDasharray="6 9" strokeLinecap="round" />
        </g>
      )}
      {/* 翅膀 */}
      <path d="M18 22Q4 12 6 26q2 10 14 8Z" fill={legend ? '#7c3aed' : '#0ea571'} opacity=".8" />
      <path d="M46 22q14-10 12 4-2 10-14 8Z" fill={legend ? '#7c3aed' : '#0ea571'} opacity=".8" />
      {/* 尾巴 */}
      <path d="M44 40q10 2 12-4l3 5-6 4q-6 2-11-3Z" fill={legend ? '#8b5cf6' : '#2dd4a0'} />
      {/* 身体 */}
      <path
        d="M14 30q0-16 18-16t18 16q0 12-18 12T14 30Z"
        fill="url(#pgDra)"
        stroke={legend ? '#4c1d95' : '#0b6b4d'}
        strokeWidth="1.4"
      />
      {/* 角 */}
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
      {/* 胸口纹章 */}
      <polygon points="32,36 28.6,41 31,41 29.4,46 34.6,39.6 32,39.6 34,36" fill={legend ? '#fef3c7' : '#fbbf24'} />
    </svg>
  )
}
