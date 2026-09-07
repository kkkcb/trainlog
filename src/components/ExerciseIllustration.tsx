import { useEffect, useState } from 'react'
import type { ExerciseLibraryEntry } from '../types'
import { findExerciseByName } from '../data/exerciseLibrary'
import './ExerciseIllustration.css'

// 帧素材经 import.meta.glob 全量打包（约 243 个 SVG，构建期静态分析）
const frames = import.meta.glob('../assets/exercises/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/** 按素材库条目取 3 帧轮播地址 */
function framesFor(entry: ExerciseLibraryEntry): string[] {
  const out: string[] = []
  for (let i = 1; i <= entry.frames; i++) {
    const key = Object.keys(frames).find((k) => k.includes(`/${entry.slug}.f${i}.svg`))
    if (key) out.push(frames[key])
  }
  return out
}

const CACHE = new Map<string, string[]>()

function framesByName(name: string): string[] | null {
  if (CACHE.has(name)) return CACHE.get(name)!
  const entry = findExerciseByName(name)
  if (!entry) return null
  const f = framesFor(entry)
  CACHE.set(name, f.length > 0 ? f : [])
  return f.length > 0 ? f : null
}

interface ExerciseIllustrationProps {
  /** 动作名（支持中文名或 slug） */
  name: string
  /** 显示宽度 px，默认 160 */
  size?: number
  /** 静态首帧（列表缩略图用，不跑动画） */
  animate?: boolean
}

/** 动作图解：3 帧轮播动画（尊重系统减弱动效设置，静态显示第 1 帧） */
export function ExerciseIllustration({ name, size = 160, animate = true }: ExerciseIllustrationProps) {
  const framesList = framesByName(name)
  const [frameIdx, setFrameIdx] = useState(0)
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!animate || !framesList || framesList.length < 2 || reduced) return
    const t = setInterval(() => setFrameIdx((i) => (i + 1) % framesList.length), 600)
    return () => clearInterval(t)
  }, [framesList, reduced, animate])

  if (!framesList) return null
  const src = framesList[Math.min(frameIdx, framesList.length - 1)]

  return (
    <div
      className="exercise-illustration"
      style={{ width: size, height: size }}
      aria-label={`${name} 动作图解`}
      role="img"
    >
      <img src={src} alt="" draggable={false} loading="lazy" />
    </div>
  )
}
