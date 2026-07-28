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
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="tab-bar__label">训练</span>
      </button>
      <button
        className={`tab-bar__item ${activeTab === 'achievements' ? 'tab-bar__item--active' : ''}`}
        onClick={() => onTabChange('achievements')}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
        <span className="tab-bar__label">成就</span>
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
