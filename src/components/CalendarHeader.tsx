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
      <button className="calendar-header__nav" onClick={onPrev}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <div className="calendar-header__center">
        <span className="calendar-header__label">{monthLabel}</span>
        <button className="calendar-header__today" onClick={onToday}>今天</button>
      </div>
      <button className="calendar-header__nav" onClick={onNext}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  )
}
