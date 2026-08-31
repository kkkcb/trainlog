import { Icon } from './icons'
import './TabBar.css'

export type HomeTab = 'calendar' | 'diary'

interface TabBarProps {
  active: HomeTab
  onChange: (tab: HomeTab) => void
  /** 中央添加按钮：快速记录 */
  onAdd?: () => void
}

export function TabBar({ active, onChange, onAdd }: TabBarProps) {
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
      {onAdd && (
        <button className="tab-bar__add" onClick={onAdd} aria-label="添加训练">
          <Icon name="plus" size={22} strokeWidth={2.6} />
        </button>
      )}
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
