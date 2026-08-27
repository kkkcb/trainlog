import type { GamificationStats } from '../utils/gamification'
import { FlameGradientIcon } from './icons'
import './StreakCard.css'

interface StreakCardProps {
  stats: GamificationStats
}

export function StreakCard({ stats }: StreakCardProps) {
  const { streak } = stats
  const isHot = streak.current >= 7

  return (
    <div className={`streak-card ${isHot ? 'streak-card--hot' : ''}`}>
      <div className="streak-card__glow" />

      <div className="streak-card__top">
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
        {streak.longest > 0 && (
          <span className="streak-card__best">最长 {streak.longest} 天</span>
        )}
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
