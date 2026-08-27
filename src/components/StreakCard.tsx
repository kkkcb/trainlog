import type { GamificationStats } from '../utils/gamification'
import { FlameGradientIcon } from './icons'
import './StreakCard.css'

interface StreakCardProps {
  stats: GamificationStats
}

export function StreakCard({ stats }: StreakCardProps) {
  const { streak, level } = stats
  const isHot = streak.current >= 7
  // 等级进度环（conic-gradient，0~360deg）
  const ringDeg = Math.round(Math.min(1, Math.max(0, level.progress)) * 360)

  return (
    <div className={`streak-card ${isHot ? 'streak-card--hot' : ''}`}>
      <div className="streak-card__glow" />

      <div className="streak-card__top">
        <div className="streak-card__streak">
          <div className="streak-card__flame">
            <FlameGradientIcon size={30} className="streak-card__flame-icon" />
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
            <span className="streak-card__streak-num">{streak.current}</span>
            <span className="streak-card__streak-label">天连续打卡</span>
          </div>
        </div>

        <div className="streak-card__level">
          <div
            className="streak-card__level-badge"
            style={{ '--ring': `${ringDeg}deg` } as React.CSSProperties}
          >
            <span className="streak-card__level-num">{level.level}</span>
          </div>
          <div className="streak-card__level-info">
            <span className="streak-card__level-title">{level.title}</span>
            <span className="streak-card__level-exp">
              LV{level.level} · {level.expInCurrentLevel}/{level.expForNextLevel}
            </span>
          </div>
        </div>
      </div>

      <div className="streak-card__progress">
        <div className="streak-card__progress-track">
          <div
            className="streak-card__progress-fill"
            style={{ width: `${Math.min(1, Math.max(0, level.progress)) * 100}%` }}
          />
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
          <span className="streak-card__stat-value">{streak.longest}</span>
          <span className="streak-card__stat-label">最长连续</span>
        </div>
      </div>
    </div>
  )
}
