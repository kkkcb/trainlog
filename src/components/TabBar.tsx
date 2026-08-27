import { Icon } from './icons'
import './TabBar.css'

interface TabBarProps {
  activeTab: 'training' | 'stats' | 'achievements'
  onTabChange: (tab: 'training' | 'stats' | 'achievements') => void
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="tab-bar">
      <button
        className={`tab-bar__item ${activeTab === 'training' ? 'tab-bar__item--active' : ''}`}
        onClick={() => onTabChange('training')}
      >
        <span className="tab-bar__icon-wrap">
          <Icon name="dumbbell" size={21} strokeWidth={activeTab === 'training' ? 2.2 : 1.9} />
        </span>
        <span className="tab-bar__label">训练</span>
      </button>
      <button
        className={`tab-bar__item ${activeTab === 'achievements' ? 'tab-bar__item--active' : ''}`}
        onClick={() => onTabChange('achievements')}
      >
        <span className="tab-bar__icon-wrap">
          <Icon name="trophy" size={21} strokeWidth={activeTab === 'achievements' ? 2.2 : 1.9} />
        </span>
        <span className="tab-bar__label">成就</span>
      </button>
      <button
        className={`tab-bar__item ${activeTab === 'stats' ? 'tab-bar__item--active' : ''}`}
        onClick={() => onTabChange('stats')}
      >
        <span className="tab-bar__icon-wrap">
          <Icon name="chart" size={21} strokeWidth={activeTab === 'stats' ? 2.2 : 1.9} />
        </span>
        <span className="tab-bar__label">统计</span>
      </button>
    </nav>
  )
}
