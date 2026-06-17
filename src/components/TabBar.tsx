import './TabBar.css'

interface TabBarProps {
  activeTab: 'training' | 'stats'
  onTabChange: (tab: 'training' | 'stats') => void
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="tab-bar">
      <button
        className={`tab-bar__item ${activeTab === 'training' ? 'tab-bar__item--active' : ''}`}
        onClick={() => onTabChange('training')}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="tab-bar__label">训练</span>
      </button>
      <button
        className={`tab-bar__item ${activeTab === 'stats' ? 'tab-bar__item--active' : ''}`}
        onClick={() => onTabChange('stats')}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <span className="tab-bar__label">统计</span>
      </button>
    </nav>
  )
}
