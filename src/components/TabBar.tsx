import { Icon } from './icons'
import './TabBar.css'

export type HomeTab = 'calendar' | 'workout' | 'diary'

interface TabBarProps {
  active: HomeTab
  onChange: (tab: HomeTab) => void
}

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav className="tab-bar">
      <button
        className={`tab-bar__item ${active === 'calendar' ? 'tab-bar__item--active' : ''}`}
        onClick={() => onChange('calendar')}
      >
        <span className="tab-bar__icon-wrap">
          <Icon name="calendar" size={20} strokeWidth={active === 'calendar' ? 2.2 : 1.9} />
        </span>
        <span className="tab-bar__label">日历</span>
      </button>
      <button
        className={`tab-bar__item ${active === 'workout' ? 'tab-bar__item--active' : ''}`}
        onClick={() => onChange('workout')}
      >
        <span className="tab-bar__icon-wrap">
          <Icon name="dumbbell" size={20} strokeWidth={active === 'workout' ? 2.2 : 1.9} />
        </span>
        <span className="tab-bar__label">训练</span>
      </button>
      <button
        className={`tab-bar__item ${active === 'diary' ? 'tab-bar__item--active' : ''}`}
        onClick={() => onChange('diary')}
      >
        <span className="tab-bar__icon-wrap">
          <Icon name="notebook" size={20} strokeWidth={active === 'diary' ? 2.2 : 1.9} />
        </span>
        <span className="tab-bar__label">训记</span>
      </button>
    </nav>
  )
}
