import type { TrainingRecord } from '../types'
import { TrainingCard } from './TrainingCard'
import './TrainingList.css'

interface TrainingListProps {
  records: TrainingRecord[]
  onEdit: (record: TrainingRecord) => void
  onDelete: (record: TrainingRecord) => void
}

export function TrainingList({ records, onEdit, onDelete }: TrainingListProps) {
  if (records.length === 0) {
    return (
      <div className="training-list">
        <div className="training-list-empty">
          <p className="training-list-empty__text">这一天还没有记录</p>
          <p className="training-list-empty__hint">点下方 + 添加，或长按日期快速打卡</p>
        </div>
      </div>
    )
  }

  return (
    <div className="training-list">
      {records.map((record) => (
        <TrainingCard
          key={record.id}
          record={record}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
