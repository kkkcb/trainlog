import type { TrainingRecord } from '../types'
import './TrainingCard.css'

interface TrainingCardProps {
  record: TrainingRecord
  onEdit: (record: TrainingRecord) => void
  onDelete: (record: TrainingRecord) => void
}

export function TrainingCard({ record, onEdit, onDelete }: TrainingCardProps) {
  return (
    <div className="training-card">
      <div className="training-card__header">
        <div className="training-card__tags">
          {record.tags.map((tag) => (
            <span key={tag.name} className="training-card__tag">
              {tag.name}
              {(tag.metrics?.duration || tag.metrics?.distance) && (
                <span className="training-card__tag-metrics">
                  {tag.metrics?.duration != null && <span>{tag.metrics.duration}min</span>}
                  {tag.metrics?.duration != null && tag.metrics?.distance != null && <span>·</span>}
                  {tag.metrics?.distance != null && <span>{tag.metrics.distance}km</span>}
                </span>
              )}
            </span>
          ))}
        </div>
        <div className="training-card__actions">
          <button className="training-card__btn training-card__btn--edit" onClick={() => onEdit(record)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button className="training-card__btn training-card__btn--delete" onClick={() => onDelete(record)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
