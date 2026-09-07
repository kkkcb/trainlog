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
  onClick: (fullDate: string) => void
  onLongPress?: (fullDate: string) => void
  style?: React.CSSProperties
}

export const CalendarDay = memo(function CalendarDay({
  date,
  fullDate,
  isCurrentMonth,
  isToday,
  isSelected,
  hasTraining,
  hasPlan,
  onClick,
  onLongPress,
  style,
}: CalendarDayProps) {
  let className = 'calendar-day'
  if (!isCurrentMonth) className += ' calendar-day--other'
  if (isToday) className += ' calendar-day--today'
  if (isSelected) className += ' calendar-day--selected'
  if (hasTraining) className += ' calendar-day--training'
  if (hasPlan) className += ' calendar-day--planned'

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
      style={style}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onContextMenu={(e) => { e.preventDefault(); onLongPress?.(fullDate) }}
    >
      <span className="calendar-day__number">{date}</span>
      {hasTraining && <span className="calendar-day__dot" />}
      {hasPlan && <span className="calendar-day__plan-mark" />}
    </button>
  )
})
