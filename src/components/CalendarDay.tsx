import { useRef, useCallback, useEffect, memo } from 'react'
import './CalendarDay.css'

interface CalendarDayProps {
  date: number
  fullDate: string
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  hasTraining: boolean
  hasPlan?: boolean
  tags?: string[]
  onClick: (fullDate: string) => void
  onLongPress?: (fullDate: string) => void
}

export const CalendarDay = memo(function CalendarDay({
  date,
  fullDate,
  isCurrentMonth,
  isToday,
  isSelected,
  hasTraining,
  hasPlan,
  tags,
  onClick,
  onLongPress,
}: CalendarDayProps) {
  let className = 'calendar-day'
  if (!isCurrentMonth) className += ' calendar-day--other'
  if (isToday) className += ' calendar-day--today'
  if (isSelected) className += ' calendar-day--selected'
  if (hasTraining) className += ' calendar-day--training'
  if (hasPlan) className += ' calendar-day--planned'
  if (tags && tags.length > 0) className += ' calendar-day--has-tags'

  const hasTags = tags && tags.length > 0
  const displayTags = hasTags ? tags.slice(0, 2) : null
  const hasMore = tags && tags.length > 2
  const tagText = displayTags ? displayTags.join(' ') + (hasMore ? ' +' : '') : null

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressedRef = useRef(false)
  const startYRef = useRef(0)

  // 卸载时兜底清理，防止长按 timer 在格子消失后仍弹出浮层
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    longPressedRef.current = false
    startYRef.current = e.touches[0]?.clientY ?? 0
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true
      onLongPress?.(fullDate)
    }, 500)
  }, [fullDate, onLongPress])

  // 手指滑动（滚动日历）即取消长按，避免滚动途中误弹打卡
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!timerRef.current) return
    const y = e.touches[0]?.clientY ?? 0
    if (Math.abs(y - startYRef.current) > 10) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleClick = useCallback(() => {
    if (longPressedRef.current) {
      longPressedRef.current = false
      return
    }
    onClick(fullDate)
  }, [fullDate, onClick])

  return (
    <button
      className={className}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onContextMenu={(e) => { e.preventDefault(); onLongPress?.(fullDate) }}
    >
      <span className="calendar-day__number">{date}</span>
      {hasTraining && !tagText && <span className="calendar-day__dot" />}
      {tagText && <span className="calendar-day__tags">{tagText}</span>}
      {hasPlan && <span className="calendar-day__plan-mark" />}
    </button>
  )
})
