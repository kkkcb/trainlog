import { useState, useMemo } from 'react'
import type { TrainingRecord } from '../types'
import './StatsPage.css'

type Period = 'week' | 'month' | 'year'

interface StatsPageProps {
  records: Record<string, TrainingRecord>
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

export function StatsPage({ records }: StatsPageProps) {
  const [period, setPeriod] = useState<Period>('month')

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

  const periods: Period[] = ['week', 'month', 'year']

  return (
    <div className="stats">
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
          <span className="stats__summary-value">{stats.totalDays}</span>
          <span className="stats__summary-label">训练天数</span>
        </div>
        <div className="stats__summary-item">
          <span className="stats__summary-value">{stats.totalSessions}</span>
          <span className="stats__summary-label">记录总数</span>
        </div>
      </div>

      {stats.sorted.length === 0 ? (
        <div className="stats__empty">
          <p className="stats__empty-text">暂无训练记录</p>
          <p className="stats__empty-hint">{PERIOD_LABELS[period]}还没有训练数据</p>
        </div>
      ) : (
        <div className="stats__list">
          {stats.sorted.map(([name, count]) => (
            <div key={name} className="stats__item">
              <div className="stats__item-header">
                <span className="stats__item-name">{name}</span>
                <span className="stats__item-count">{count}次</span>
              </div>
              <div className="stats__bar-track">
                <div
                  className="stats__bar-fill"
                  style={{ width: stats.maxCount > 0 ? `${(count / stats.maxCount) * 100}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
