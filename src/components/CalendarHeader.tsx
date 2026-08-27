import { Icon } from './icons'
import './CalendarHeader.css'

interface CalendarHeaderProps {
  monthLabel: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export function CalendarHeader({ monthLabel, onPrev, onNext, onToday }: CalendarHeaderProps) {
  return (
    <div className="calendar-header">
      <button className="calendar-header__nav" onClick={onPrev} aria-label="上一月">
        <Icon name="chevronLeft" size={19} />
      </button>
      <div className="calendar-header__center">
        <span className="calendar-header__label">{monthLabel}</span>
        <button className="calendar-header__today" onClick={onToday}>今天</button>
      </div>
      <button className="calendar-header__nav" onClick={onNext} aria-label="下一月">
        <Icon name="chevronRight" size={19} />
      </button>
    </div>
  )
}
