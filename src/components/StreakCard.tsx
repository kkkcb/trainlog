import type { GamificationStats } from '../utils/gamification'
import './StreakCard.css'

interface StreakCardProps {
  stats: GamificationStats
}

export function StreakCard({ stats }: StreakCardProps) {
  const { streak, level } = stats
  const fireIntensity = Math.min(streak.current, 30)
  const isHot = streak.current >= 7

  return (
    <div className={`streak-card ${isHot ? 'streak-card--hot' : ''}`}>
      <div className="streak-card__glow" />
      <div className="streak-card__top">
        <div className="streak-card__streak">
          <div className="streak-card__flame">
            <span className="streak-card__flame-icon" style={{ fontSize: `${32 + fireIntensity * 0.4}px` }}>
              🔥
            </span>
            {streak.current > 0 && (
              <span className="streak-card__flame-particle streak-card__flame-particle--1" />
            )}
            {streak.current >= 3 && (
              <span className="streak-card__flame-particle streak-card__flame-particle--2" />
            )}
            {streak.current >= 7 && (
              <span className="streak-card__flame-particle streak-card__flame-particle--3" />
            )}
          </div>
          <div className="streak-card__streak-info">
            <span className="streak-card__streak-num">
              {streak.current}
            </span>
            <span className="streak-card__streak-label">天连续</span>
          </div>
        </div>

        <div className="streak-card__level">
          <div className="streak-card__level-badge">
            <span className="streak-card__level-num">{level.level}</span>
          </div>
          <div className="streak-card__level-info">
            <span className="streak-card__level-title">{level.title}</span>
            <span className="streak-card__level-exp">
              {level.expInCurrentLevel}/{level.expForNextLevel}
            </span>
          </div>
        </div>
      </div>

      <div className="streak-card__progress">
        <div className="streak-card__progress-track">
          <div
            className="streak-card__progress-fill"
            style={{ width: `${level.progress * 100}%` }}
          >
            <div className="streak-card__progress-shine" />
          </div>
        </div>
      </div>

      <div className="streak-card__stats">
        <div className="streak-card__stat">
          <span className="streak-card__stat-value">{stats.totalWorkouts}</span>
          <span className="streak-card__stat-label">总训练</span>
        </div>
        <div className="streak-card__stat">
          <span className="streak-card__stat-value">{stats.thisMonthCount}</span>
          <span className="streak-card__stat-label">本月</span>
        </div>
        <div className="streak-card__stat">
          <span className="streak-card__stat-value">{stats.badges.filter(b => b.unlocked).length}</span>
          <span className="streak-card__stat-label">徽章</span>
        </div>
      </div>
    </div>
  )
}
