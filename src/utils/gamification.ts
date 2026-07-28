import type { TrainingRecord } from '../types'

export interface StreakInfo {
  current: number
  longest: number
  lastTrainingDate: string | null
}

export interface LevelInfo {
  level: number
  exp: number
  expInCurrentLevel: number
  expForNextLevel: number
  progress: number
  title: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: number
  tier: 'bronze' | 'silver' | 'gold' | 'diamond'
}

export interface GamificationStats {
  streak: StreakInfo
  level: LevelInfo
  badges: Badge[]
  totalWorkouts: number
  totalTags: number
  thisMonthCount: number
}

function getDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function calculateStreak(records: Record<string, TrainingRecord>): StreakInfo {
  const trainingDates = new Set<string>()
  Object.values(records).forEach((r) => trainingDates.add(r.date))

  if (trainingDates.size === 0) {
    return { current: 0, longest: 0, lastTrainingDate: null }
  }

  const sortedDates = Array.from(trainingDates).sort()
  const lastDate = sortedDates[sortedDates.length - 1]

  let current = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cursor = new Date(today)
  const hasToday = trainingDates.has(getDateStr(today))
  if (!hasToday) {
    cursor.setDate(cursor.getDate() - 1)
  }
  let count = 0
  // eslint-disable-next-line prefer-const
  let cur = new Date(cursor)
  while (trainingDates.has(getDateStr(cur))) {
    count++
    cur.setDate(cur.getDate() - 1)
  }
  current = count

  let longest = 0
  let tempStreak = 0
  let prev: Date | null = null
  sortedDates.forEach((ds) => {
    const d = new Date(ds + 'T00:00:00')
    if (prev) {
      const diff = Math.round((d.getTime() - prev.getTime()) / 86400000)
      if (diff === 1) {
        tempStreak++
      } else {
        longest = Math.max(longest, tempStreak)
        tempStreak = 1
      }
    } else {
      tempStreak = 1
    }
    prev = d
  })
  longest = Math.max(longest, tempStreak, current)

  return { current, longest, lastTrainingDate: lastDate }
}

const LEVEL_TITLES = [
  '健身新手', '初露锋芒', '渐入佳境', '坚持不懈', '稳定前行',
  '日益精进', '熟能生巧', '游刃有余', '小有成就', '身经百战',
  '游刃有余', '出类拔萃', '登峰造极', '一代宗师', '传奇王者',
]

export function calculateLevel(totalWorkouts: number): LevelInfo {
  const exp = totalWorkouts
  const baseExp = 3
  let level = 1
  let needed = baseExp
  let remaining = exp

  while (remaining >= needed && level < 99) {
    remaining -= needed
    level++
    needed = Math.floor(baseExp * (1 + level * 0.3))
  }

  const expInCurrentLevel = remaining
  const expForNextLevel = needed
  const progress = Math.min(1, expInCurrentLevel / expForNextLevel)
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]

  return { level, exp, expInCurrentLevel, expForNextLevel, progress, title }
}

export function calculateBadges(records: Record<string, TrainingRecord>): Badge[] {
  const stats = {
    total: Object.keys(records).length,
    streak: calculateStreak(records),
    uniqueTags: new Set<string>(),
    monthCount: 0,
    now: new Date(),
  }
  const monthPrefix = `${stats.now.getFullYear()}-${String(stats.now.getMonth() + 1).padStart(2, '0')}`
  Object.values(records).forEach((r) => {
    r.tags.forEach((t) => stats.uniqueTags.add(t.name))
    if (r.date.startsWith(monthPrefix)) stats.monthCount++
  })

  const badges: Badge[] = [
    { id: 'first', name: '初战告捷', description: '完成第一次训练', icon: '🎯', tier: 'bronze', unlocked: stats.total >= 1 },
    { id: 'ten', name: '十全十美', description: '累计训练 10 次', icon: '💪', tier: 'bronze', unlocked: stats.total >= 10 },
    { id: 'fifty', name: '半百达人', description: '累计训练 50 次', icon: '🏅', tier: 'silver', unlocked: stats.total >= 50 },
    { id: 'hundred', name: '百战雄师', description: '累计训练 100 次', icon: '🏆', tier: 'gold', unlocked: stats.total >= 100 },
    { id: 'streak3', name: '三连发', description: '连续训练 3 天', icon: '🔥', tier: 'bronze', unlocked: stats.streak.longest >= 3 },
    { id: 'streak7', name: '一周不歇', description: '连续训练 7 天', icon: '🔥', tier: 'silver', unlocked: stats.streak.longest >= 7 },
    { id: 'streak30', name: '月度狂人', description: '连续训练 30 天', icon: '🌟', tier: 'diamond', unlocked: stats.streak.longest >= 30 },
    { id: 'tags5', name: '多面手', description: '使用 5 种不同训练', icon: '🎨', tier: 'silver', unlocked: stats.uniqueTags.size >= 5 },
    { id: 'month10', name: '本月活跃', description: '本月训练 10 次', icon: '📅', tier: 'silver', unlocked: stats.monthCount >= 10 },
    { id: 'month20', name: '本月狂热', description: '本月训练 20 次', icon: '⚡', tier: 'gold', unlocked: stats.monthCount >= 20 },
  ]

  return badges
}

export function calculateGamification(records: Record<string, TrainingRecord>): GamificationStats {
  const totalWorkouts = Object.keys(records).length
  const uniqueTags = new Set<string>()
  const now = new Date()
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  let thisMonthCount = 0

  Object.values(records).forEach((r) => {
    r.tags.forEach((t) => uniqueTags.add(t.name))
    if (r.date.startsWith(monthPrefix)) thisMonthCount++
  })

  return {
    streak: calculateStreak(records),
    level: calculateLevel(totalWorkouts),
    badges: calculateBadges(records),
    totalWorkouts,
    totalTags: uniqueTags.size,
    thisMonthCount,
  }
}
