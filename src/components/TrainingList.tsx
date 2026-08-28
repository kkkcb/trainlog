import type { TrainingRecord } from '../types'
import { TrainingCard } from './TrainingCard'
import avatarImg from '../assets/avatar.jpg'
import './TrainingList.css'

interface TrainingListProps {
  records: TrainingRecord[]
  onEdit: (record: TrainingRecord) => void
  onDelete: (record: TrainingRecord) => void
}

/** 头像台词随当日记录数变化 */
function bubbleFor(count: number): string {
  if (count === 0) return '今天还没练哦~'
  if (count === 1) return '开张了，热身完毕！'
  if (count <= 3) return '状态在线，继续保持！'
  return '今天拉满了，猛！'
}

export function TrainingList({ records, onEdit, onDelete }: TrainingListProps) {
  return (
    <div className="training-list">
      <div className="training-list__avatar-wrap">
        <img className="training-list__avatar" src={avatarImg} alt="" />
        <span className="training-list__bubble">{bubbleFor(records.length)}</span>
      </div>

      {records.length === 0 ? (
        <div className="training-list-empty">
          <p className="training-list-empty__text">这一天还没有记录</p>
          <p className="training-list-empty__hint">点右下角 + 添加，或长按日期快速打卡</p>
        </div>
      ) : (
        records.map((record) => (
          <TrainingCard
            key={record.id}
            record={record}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  )
}
