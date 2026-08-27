import { useRef, useCallback } from 'react'
import { Icon } from './icons'
import { getTodayString, parseISO } from '../utils/date'
import './WeekStrip.css'

interface WeekStripProps {
  /** 周一开头的 7 天 ISO 日期 */
  weekDates: string[]
  selectedDate: string
  trainingDates: Set<string>
  onSelectDate: (iso: string) => void
  onLongPressDate?: (iso: string) => void
  onPrevWeek: () => void
  onNextWeek: () => void
}

const WEEKDAY_CHARS = ['一', '二', '三', '四', '五', '六', '日']

export function WeekStrip({
  weekDates,
  selectedDate,
  trainingDates,
  onSelectDate,
  onLongPressDate,
  onPrevWeek,
  onNextWeek,
}: WeekStripProps) {
  const today = getTodayString()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressedRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleTouchStart = useCallback((iso: string) => {
    if (!onLongPressDate) return
    longPressedRef.current = false
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true
      onLongPressDate(iso)
    }, 500)
  }, [onLongPressDate])

  const handleClick = useCallback((iso: string) => {
    if (longPressedRef.current) {
      longPressedRef.current = false
      return
    }
    onSelectDate(iso)
  }, [onSelectDate])

  return (
    <div className="week-strip">
      <button className="week-strip__nav" onClick={onPrevWeek} aria-label="上一周">
        <Icon name="chevronLeft" size={17} />
      </button>
      <div className="week-strip__days">
        {weekDates.map((iso, i) => {
          const dayNum = parseISO(iso).getDate()
          const isSelected = iso === selectedDate
          const isToday = iso === today
          const hasTraining = trainingDates.has(iso)
          let cls = 'week-strip__day'
          if (isSelected) cls += ' week-strip__day--selected'
          else if (isToday) cls += ' week-strip__day--today'
          if (hasTraining && !isSelected) cls += ' week-strip__day--trained'
          return (
            <button
              key={iso}
              className={cls}
              onClick={() => handleClick(iso)}
              onTouchStart={() => handleTouchStart(iso)}
              onTouchEnd={clearTimer}
              onTouchCancel={clearTimer}
              onContextMenu={(e) => {
                e.preventDefault()
                onLongPressDate?.(iso)
              }}
            >
              <span className="week-strip__weekday">{WEEKDAY_CHARS[i]}</span>
              <span className="week-strip__num">{dayNum}</span>
              <span className="week-strip__dot" />
            </button>
          )
        })}
      </div>
      <button className="week-strip__nav" onClick={onNextWeek} aria-label="下一周">
        <Icon name="chevronRight" size={17} />
      </button>
    </div>
  )
}
