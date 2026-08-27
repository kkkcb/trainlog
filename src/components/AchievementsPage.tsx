import type { GamificationStats } from '../utils/gamification'
import { Icon, type IconName } from './icons'
import './AchievementsPage.css'

interface AchievementsPageProps {
  stats: GamificationStats
}

type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond'

const TIER_CONFIG: Record<BadgeTier, { color: string; label: string }> = {
  bronze: { color: '#d97706', label: '铜' },
  silver: { color: '#64748b', label: '银' },
  gold: { color: '#f59e0b', label: '金' },
  diamond: { color: '#0ea5e9', label: '钻' },
}

/** 徽章 icon 字段（语义键）→ 图标组件 */
const BADGE_ICONS: Record<string, IconName> = {
  target: 'target',
  dumbbell: 'dumbbell',
  medal: 'medal',
  trophy: 'trophy',
  flame: 'flame',
  grid: 'grid',
  calendar: 'calendar',
  zap: 'zap',
}

export function AchievementsPage({ stats }: AchievementsPageProps) {
  const { level, streak, badges, totalWorkouts, thisMonthCount } = stats
  const unlockedCount = badges.filter(b => b.unlocked).length
  const progress = Math.round((unlockedCount / badges.length) * 100)
  const ringDeg = Math.round(Math.min(1, Math.max(0, level.progress)) * 360)

  return (
    <div className="ach-page">
      <div className="ach-page__header">
        <span className="ach-page__title">成就</span>
      </div>

      <div className="ach-page__body">
        <div className="ach-hero">
          <div
            className="ach-hero__level-circle"
            style={{ '--ring': `${ringDeg}deg` } as React.CSSProperties}
          >
            <span className="ach-hero__level-num">{level.level}</span>
            <span className="ach-hero__level-prefix">LV</span>
          </div>
          <span className="ach-hero__title">{level.title}</span>
          <div className="ach-hero__exp-bar">
            <div
              className="ach-hero__exp-fill"
              style={{ width: `${Math.min(1, Math.max(0, level.progress)) * 100}%` }}
            />
          </div>
          <span className="ach-hero__exp-text">
            {level.expInCurrentLevel} / {level.expForNextLevel} XP · 再训练 {level.expForNextLevel - level.expInCurrentLevel} 次升级
          </span>
        </div>

        <div className="ach-stats-grid">
          <div className="ach-stat-tile">
            <span className="ach-stat-tile__icon ach-stat-tile__icon--orange">
              <Icon name="flame" size={16} />
            </span>
            <span className="ach-stat-tile__value">{streak.current}</span>
            <span className="ach-stat-tile__label">当前连续</span>
          </div>
          <div className="ach-stat-tile">
            <span className="ach-stat-tile__icon ach-stat-tile__icon--blue">
              <Icon name="trendingUp" size={16} />
            </span>
            <span className="ach-stat-tile__value">{streak.longest}</span>
            <span className="ach-stat-tile__label">最长连续</span>
          </div>
          <div className="ach-stat-tile">
            <span className="ach-stat-tile__icon ach-stat-tile__icon--violet">
              <Icon name="dumbbell" size={16} />
            </span>
            <span className="ach-stat-tile__value">{totalWorkouts}</span>
            <span className="ach-stat-tile__label">总训练</span>
          </div>
          <div className="ach-stat-tile">
            <span className="ach-stat-tile__icon ach-stat-tile__icon--green">
              <Icon name="calendar" size={16} />
            </span>
            <span className="ach-stat-tile__value">{thisMonthCount}</span>
            <span className="ach-stat-tile__label">本月</span>
          </div>
        </div>

        <div className="ach-section">
          <div className="ach-section__header">
            <span className="ach-section__title">徽章墙</span>
            <span className="ach-section__count">{unlockedCount}/{badges.length}</span>
          </div>
          <div className="ach-badges-grid">
            {badges.map((badge) => {
              const tier = TIER_CONFIG[badge.tier]
              const iconName = BADGE_ICONS[badge.icon] ?? 'medal'
              return (
                <div
                  key={badge.id}
                  className={`ach-badge ${badge.unlocked ? 'ach-badge--unlocked' : ''}`}
                  style={
                    badge.unlocked
                      ? ({ '--tier-color': tier.color } as React.CSSProperties)
                      : undefined
                  }
                >
                  <div className="ach-badge__icon-wrap">
                    <Icon name={iconName} size={22} strokeWidth={1.8} />
                    {!badge.unlocked && (
                      <span className="ach-badge__lock">
                        <Icon name="lock" size={9} strokeWidth={2.4} />
                      </span>
                    )}
                  </div>
                  <span className="ach-badge__name">{badge.name}</span>
                  <span className="ach-badge__desc">{badge.description}</span>
                </div>
              )
            })}
          </div>
        </div>

        <p className="ach-page__footer">已解锁 {unlockedCount} / {badges.length} 枚徽章 · 完成度 {progress}%</p>
      </div>
    </div>
  )
}
