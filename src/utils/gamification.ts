import type { TrainingRecord } from '../types'

export interface StreakInfo {
  current: number
  longest: number
  lastTrainingDate: string | null
}

export interface GamificationStats {
  streak: StreakInfo
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
    totalWorkouts,
    totalTags: uniqueTags.size,
    thisMonthCount,
  }
}
