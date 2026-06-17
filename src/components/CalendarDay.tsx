import { useRef, useCallback, memo } from 'react'
import './CalendarDay.css'

interface CalendarDayProps {
  date: number
  fullDate: string
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  hasTraining: boolean
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
  tags,
  onClick,
  onLongPress,
}: CalendarDayProps) {
  let className = 'calendar-day'
  if (!isCurrentMonth) className += ' calendar-day--other'
  if (isToday) className += ' calendar-day--today'
  if (isSelected) className += ' calendar-day--selected'
  if (hasTraining) className += ' calendar-day--training'
  if (tags && tags.length > 0) className += ' calendar-day--has-tags'

  const hasTags = tags && tags.length > 0
  const displayTags = hasTags ? tags.slice(0, 2) : null
  const hasMore = tags && tags.length > 2
  const tagText = displayTags ? displayTags.join(' ') + (hasMore ? ' +' : '') : null

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressedRef = useRef(false)

  const handleTouchStart = useCallback(() => {
    longPressedRef.current = false
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true
      onLongPress?.(fullDate)
    }, 500)
  }, [fullDate, onLongPress])

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
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onContextMenu={(e) => { e.preventDefault(); onLongPress?.(fullDate) }}
    >
      <span className="calendar-day__number">{date}</span>
      {hasTraining && !tagText && <span className="calendar-day__dot" />}
      {tagText && <span className="calendar-day__tags">{tagText}</span>}
    </button>
  )
})
