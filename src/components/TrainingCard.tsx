import { useState } from 'react'
import type { TrainingRecord } from '../types'
import { Icon } from './icons'
import './TrainingCard.css'

interface TrainingCardProps {
  record: TrainingRecord
  onEdit: (record: TrainingRecord) => void
  onDelete: (record: TrainingRecord) => void
}

/** 按标签名哈希取色：余烬橙明度阶，同一「训练=热」的语言（同名标签颜色稳定） */
const TAG_COLORS = ['#ffceb3', '#ffab85', '#ff8552', '#e2602e', '#b8491f']

function tagColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

export function TrainingCard({ record, onEdit, onDelete }: TrainingCardProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const detail = record.detail?.filter((e) => e.sets.length > 0) ?? []

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
      {detail.length > 0 && (
        <div className="training-card__detail">
          <button className="training-card__detail-toggle" onClick={() => setDetailOpen((v) => !v)}>
            <i className={`training-card__detail-arrow ${detailOpen ? 'training-card__detail-arrow--open' : ''}`}>▸</i>
            动作明细 · {detail.length} 个动作
          </button>
          {detailOpen && (
            <div className="training-card__detail-list">
              {detail.map((ex) => (
                <div key={ex.name} className="training-card__detail-ex">
                  <span className="training-card__detail-name">{ex.name}</span>
                  <span className="training-card__detail-sets">
                    {ex.sets.length} 组 ·{' '}
                    {ex.sets.map((g) => `${g.weight === 0 ? '徒手' : g.weight}×${g.reps}`).join(' / ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
