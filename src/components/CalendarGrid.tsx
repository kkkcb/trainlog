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
  trainingDates: Set<number>
  tagsByDate: Record<number, string[]>
  selectedDate: string
  onSelectDate: (date: string) => void
  onLongPressDate?: (fullDate: string) => void
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export function CalendarGrid({ calendar, trainingDates, tagsByDate, selectedDate, onSelectDate, onLongPressDate }: CalendarGridProps) {
  return (
    <div className="calendar">
      <CalendarHeader
        monthLabel={calendar.monthLabel}
        onPrev={calendar.goToPrevMonth}
        onNext={calendar.goToNextMonth}
        onToday={calendar.goToToday}
      />
      <div className="calendar__weekdays">
        {WEEKDAYS.map((d) => (
          <span key={d} className="calendar__weekday">{d}</span>
        ))}
      </div>
      <div className="calendar__grid">
        {calendar.calendarDays.map((day) => {
          const hasTraining = trainingDates.has(day.date)
          const dayTags = tagsByDate[day.date]
          return (
            <CalendarDay
              key={day.fullDate}
              date={day.date}
              fullDate={day.fullDate}
              isCurrentMonth={day.month === 'current'}
              isToday={calendar.isToday(day.fullDate)}
              isSelected={day.fullDate === selectedDate}
              hasTraining={hasTraining}
              tags={dayTags}
              onClick={onSelectDate}
              onLongPress={onLongPressDate}
            />
          )
        })}
      </div>
    </div>
  )
}
