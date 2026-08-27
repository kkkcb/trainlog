import type { TrainingRecord } from '../types'
import { Icon } from './icons'
import './TrainingCard.css'

interface TrainingCardProps {
  record: TrainingRecord
  onEdit: (record: TrainingRecord) => void
  onDelete: (record: TrainingRecord) => void
}

/** 按标签名哈希取色，保证同名标签颜色稳定 */
const TAG_COLORS = [
  '#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899',
  '#14b8a6', '#f97316', '#6366f1', '#84cc16',
]

function tagColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

export function TrainingCard({ record, onEdit, onDelete }: TrainingCardProps) {
  return (
    <div className="training-card">
      <div className="training-card__header">
        <div className="training-card__tags">
          {record.tags.map((tag) => (
            <span key={tag.name} className="training-card__tag">
              <span
                className="training-card__tag-dot"
                style={{ background: tagColor(tag.name) }}
              />
              <span className="training-card__tag-name">{tag.name}</span>
              {(tag.metrics?.duration != null || tag.metrics?.distance != null) && (
                <span className="training-card__tag-metrics">
                  {tag.metrics?.duration != null && <span>{tag.metrics.duration}<i>min</i></span>}
                  {tag.metrics?.distance != null && <span>{tag.metrics.distance}<i>km</i></span>}
                </span>
              )}
            </span>
          ))}
        </div>
        <div className="training-card__actions">
          <button
            className="training-card__btn training-card__btn--edit"
            onClick={() => onEdit(record)}
            aria-label="编辑"
          >
            <Icon name="pencil" size={16} />
          </button>
          <button
            className="training-card__btn training-card__btn--delete"
            onClick={() => onDelete(record)}
            aria-label="删除"
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
