import type { TrainingRecord } from '../types'
import { TrainingCard } from './TrainingCard'
import { Icon } from './icons'
import './TrainingList.css'

interface TrainingListProps {
  records: TrainingRecord[]
  onEdit: (record: TrainingRecord) => void
  onDelete: (record: TrainingRecord) => void
}

export function TrainingList({ records, onEdit, onDelete }: TrainingListProps) {
  if (records.length === 0) {
    return (
      <div className="training-list-empty">
        <div className="training-list-empty__icon">
          <Icon name="calendar" size={30} strokeWidth={1.5} />
        </div>
        <p className="training-list-empty__text">这一天还没有记录</p>
        <p className="training-list-empty__hint">点右下角 + 添加，或长按日期快速打卡</p>
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
