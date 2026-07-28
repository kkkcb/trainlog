import type { GamificationStats } from '../utils/gamification'
import './AchievementsPage.css'

interface AchievementsPageProps {
  stats: GamificationStats
}

type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond'

const TIER_CONFIG: Record<BadgeTier, { color: string; glow: string; label: string }> = {
  bronze: { color: '#cd7f32', glow: 'rgba(205, 127, 50, 0.3)', label: '铜' },
  silver: { color: '#c0c0c0', glow: 'rgba(192, 192, 192, 0.3)', label: '银' },
  gold: { color: '#ffd700', glow: 'rgba(255, 215, 0, 0.4)', label: '金' },
  diamond: { color: '#b9f2ff', glow: 'rgba(185, 242, 255, 0.5)', label: '钻' },
}

export function AchievementsPage({ stats }: AchievementsPageProps) {
  const { level, streak, badges, totalWorkouts, thisMonthCount } = stats
  const unlockedCount = badges.filter(b => b.unlocked).length
  const progress = Math.round((unlockedCount / badges.length) * 100)

  return (
    <div className="ach-page">
      <div className="ach-page__header">
        <span className="ach-page__title">成就</span>
      </div>

      <div className="ach-page__body">
        <div className="ach-hero">
          <div className="ach-hero__bg-glow" />
          <div className="ach-hero__level-circle">
            <div className="ach-hero__level-ring" />
            <div className="ach-hero__level-ring ach-hero__level-ring--2" />
            <span className="ach-hero__level-num">{level.level}</span>
            <span className="ach-hero__level-prefix">LV</span>
          </div>
          <span className="ach-hero__title">{level.title}</span>
          <div className="ach-hero__exp-bar">
            <div
              className="ach-hero__exp-fill"
              style={{ width: `${level.progress * 100}%` }}
            />
            <span className="ach-hero__exp-text">
              {level.expInCurrentLevel} / {level.expForNextLevel} XP
            </span>
          </div>
          <span className="ach-hero__exp-total">总经验 {level.exp} · 再训练 {level.expForNextLevel - level.expInCurrentLevel} 次升级</span>
        </div>

        <div className="ach-stats-grid">
          <div className="ach-stat-tile">
            <span className="ach-stat-tile__icon">🔥</span>
            <span className="ach-stat-tile__value">{streak.current}</span>
            <span className="ach-stat-tile__label">当前连续</span>
          </div>
          <div className="ach-stat-tile">
            <span className="ach-stat-tile__icon">📈</span>
            <span className="ach-stat-tile__value">{streak.longest}</span>
            <span className="ach-stat-tile__label">最长连续</span>
          </div>
          <div className="ach-stat-tile">
            <span className="ach-stat-tile__icon">🏋️</span>
            <span className="ach-stat-tile__value">{totalWorkouts}</span>
            <span className="ach-stat-tile__label">总训练</span>
          </div>
          <div className="ach-stat-tile">
            <span className="ach-stat-tile__icon">📅</span>
            <span className="ach-stat-tile__value">{thisMonthCount}</span>
            <span className="ach-stat-tile__label">本月</span>
          </div>
        </div>

        <div className="ach-section">
          <div className="ach-section__header">
            <span className="ach-section__title">徽章墙</span>
            <span className="ach-section__count">{unlockedCount}/{badges.length} · {progress}%</span>
          </div>
          <div className="ach-badges-grid">
            {badges.map((badge) => {
              const tier = TIER_CONFIG[badge.tier]
              return (
                <div
                  key={badge.id}
                  className={`ach-badge ${badge.unlocked ? 'ach-badge--unlocked' : ''}`}
                  style={badge.unlocked ? { '--tier-color': tier.color, '--tier-glow': tier.glow } as React.CSSProperties : {}}
                >
                  <div className="ach-badge__icon-wrap">
                    <span className="ach-badge__icon">{badge.icon}</span>
                    {!badge.unlocked && <div className="ach-badge__lock">🔒</div>}
                  </div>
                  <span className="ach-badge__name">{badge.name}</span>
                  <span className="ach-badge__desc">{badge.description}</span>
                  {badge.unlocked && <span className="ach-badge__tier" style={{ color: tier.color }}>{tier.label}级</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
