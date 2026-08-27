import { useState, useMemo } from 'react'
import type { TrainingRecord } from '../types'
import { useCalendar } from '../hooks/useCalendar'
import { CalendarGrid } from './CalendarGrid'
import { Icon } from './icons'
import './StatsPage.css'

type Period = 'week' | 'month' | 'year'

interface StatsPageProps {
  records: Record<string, TrainingRecord>
  selectedDate: string
  onSelectDay?: (iso: string) => void
  onLongPressDay?: (iso: string) => void
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getRange(period: Period): [string, string] {
  const now = new Date()
  if (period === 'week') {
    const day = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((day + 6) % 7))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return [formatDate(monday), formatDate(sunday)]
  }
  if (period === 'month') {
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    return [start, end]
  }
  const y = now.getFullYear()
  return [`${y}-01-01`, `${y}-12-31`]
}

const PERIOD_LABELS: Record<Period, string> = { week: '本周', month: '本月', year: '本年' }

/** 分类条形图配色，按名次循环 */
const BAR_COLORS = [
  'linear-gradient(90deg, #34d399, #10b981)',
  'linear-gradient(90deg, #a78bfa, #8b5cf6)',
  'linear-gradient(90deg, #60a5fa, #3b82f6)',
  'linear-gradient(90deg, #fbbf24, #f59e0b)',
  'linear-gradient(90deg, #f472b6, #ec4899)',
]

export function StatsPage({ records, selectedDate, onSelectDay, onLongPressDay }: StatsPageProps) {
  const [period, setPeriod] = useState<Period>('month')
  const calendar = useCalendar()

  const stats = useMemo(() => {
    const [start, end] = getRange(period)
    const counts: Record<string, number> = {}
    let totalSessions = 0
    const sessionDates = new Set<string>()

    Object.values(records).forEach((r) => {
      if (r.date >= start && r.date <= end) {
        totalSessions++
        sessionDates.add(r.date)
        r.tags.forEach((tag) => {
          counts[tag.name] = (counts[tag.name] || 0) + 1
        })
      }
    })

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    const maxCount = sorted.length > 0 ? sorted[0][1] : 0
    const totalDays = sessionDates.size

    return { sorted, maxCount, totalSessions, totalDays }
  }, [records, period])

  /** 月历所需的当月训练日期与标签 */
  const monthPrefix = useMemo(
    () => `${calendar.year}-${String(calendar.month + 1).padStart(2, '0')}`,
    [calendar.year, calendar.month]
  )
  const trainingDates = useMemo(() => {
    const dates = new Set<string>()
    Object.values(records).forEach((r) => {
      if (r.date.startsWith(monthPrefix)) dates.add(r.date)
    })
    return dates
  }, [monthPrefix, records])
  const tagsByDate = useMemo(() => {
    const result: Record<string, string[]> = {}
    const seen: Record<string, Set<string>> = {}
    Object.values(records).forEach((r) => {
      if (r.date.startsWith(monthPrefix) && r.tags.length > 0) {
        if (!seen[r.date]) {
          seen[r.date] = new Set()
          result[r.date] = []
        }
        r.tags.forEach((tag) => {
          if (!seen[r.date].has(tag.name)) {
            seen[r.date].add(tag.name)
            result[r.date].push(tag.name)
          }
        })
      }
    })
    return result
  }, [monthPrefix, records])

  const periods: Period[] = ['week', 'month', 'year']

  return (
    <div className="stats">
      <div className="stats__calendar">
        <CalendarGrid
          calendar={calendar}
          trainingDates={trainingDates}
          tagsByDate={tagsByDate}
          selectedDate={selectedDate}
          onSelectDate={(d) => onSelectDay?.(d)}
          onLongPressDate={onLongPressDay}
        />
        <p className="stats__calendar-hint">点日期查看当天记录 · 长按快速添加</p>
      </div>

      <div className="stats__period">
        {periods.map((p) => (
          <button
            key={p}
            className={`stats__period-btn ${period === p ? 'stats__period-btn--active' : ''}`}
            onClick={() => setPeriod(p)}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="stats__summary">
        <div className="stats__summary-item">
          <span className="stats__summary-icon stats__summary-icon--green">
            <Icon name="calendar" size={16} />
          </span>
          <span className="stats__summary-value">{stats.totalDays}</span>
          <span className="stats__summary-label">训练天数</span>
        </div>
        <div className="stats__summary-item">
          <span className="stats__summary-icon stats__summary-icon--violet">
            <Icon name="dumbbell" size={16} />
          </span>
          <span className="stats__summary-value">{stats.totalSessions}</span>
          <span className="stats__summary-label">记录总数</span>
        </div>
      </div>

      {stats.sorted.length === 0 ? (
        <div className="stats__empty">
          <div className="stats__empty-icon">
            <Icon name="chart" size={30} strokeWidth={1.5} />
          </div>
          <p className="stats__empty-text">暂无训练记录</p>
          <p className="stats__empty-hint">{PERIOD_LABELS[period]}还没有训练数据</p>
        </div>
      ) : (
        <div className="stats__list">
          {stats.sorted.map(([name, count], i) => (
            <div key={name} className="stats__item">
              <div className="stats__item-header">
                <span className="stats__item-name">{name}</span>
                <span className="stats__item-count">{count}<i>次</i></span>
              </div>
              <div className="stats__bar-track">
                <div
                  className="stats__bar-fill"
                  style={{
                    width: stats.maxCount > 0 ? `${(count / stats.maxCount) * 100}%` : '0%',
                    background: BAR_COLORS[i % BAR_COLORS.length],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
