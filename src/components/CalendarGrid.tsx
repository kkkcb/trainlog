import type { ReactNode } from 'react'
import { CalendarDay } from './CalendarDay'
import { CalendarHeader } from './CalendarHeader'
import type { CalendarState } from '../hooks/useCalendar'
import './CalendarGrid.css'

interface CalendarGridProps {
  calendar: CalendarState & {
    monthLabel: string
    calendarDays: Array<{ date: number; month: 'prev' | 'current' | 'next'; fullDate: string }>
    goToPrevMonth: () => void
    goToNextMonth: () => void
    goToToday: () => void
    isToday: (fullDate: string) => boolean
  }
  trainingDates: Set<string>
  planDates?: Set<string>
  tagsByDate: Record<string, string[]>
  selectedDate: string
  onSelectDate: (date: string) => void
  onLongPressDate?: (fullDate: string) => void
  /** 栖居在月历格子上的宠物（绝对对齐到候选格） */
  pet?: ReactNode
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

export function CalendarGrid({
  calendar,
  trainingDates,
  planDates,
  tagsByDate,
  selectedDate,
  onSelectDate,
  onLongPressDate,
  pet,
}: CalendarGridProps) {
  // 浏览当前月时隐藏日历自带的「今天」按钮，避免与页面头部徽章重复
  const now = new Date()
  const viewingCurrentMonth =
    calendar.year === now.getFullYear() && calendar.month === now.getMonth()

  return (
    <div className="calendar">
      <CalendarHeader
        monthLabel={calendar.monthLabel}
        onPrev={calendar.goToPrevMonth}
        onNext={calendar.goToNextMonth}
        onToday={calendar.goToToday}
        showToday={!viewingCurrentMonth}
      />
      <div className="calendar__weekdays">
        {WEEKDAYS.map((d) => (
          <span key={d} className="calendar__weekday">{d}</span>
        ))}
      </div>
      <div className="calendar__grid">
        {calendar.calendarDays.map((day) => {
          const hasTraining = trainingDates.has(day.fullDate)
          const dayTags = tagsByDate[day.fullDate]
          return (
            <CalendarDay
              key={day.fullDate}
              date={day.date}
              fullDate={day.fullDate}
              isCurrentMonth={day.month === 'current'}
              isToday={calendar.isToday(day.fullDate)}
              isSelected={day.fullDate === selectedDate}
              hasTraining={hasTraining}
              hasPlan={planDates?.has(day.fullDate)}
              tags={dayTags}
              onClick={onSelectDate}
              onLongPress={onLongPressDate}
            />
          )
        })}
        {/* 宠物以格内元素参与定位，需处于末尾保证覆盖绘制 */}
        {pet && (
          <div style={{ display: 'contents' }} key="pet-layer">
            {pet}
          </div>
        )}
      </div>
    </div>
  )
}
