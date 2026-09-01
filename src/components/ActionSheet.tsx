import './ActionSheet.css'

export interface SheetAction {
  label: string
  description?: string
  danger?: boolean
  onSelect: () => void
}

interface ActionSheetProps {
  isOpen: boolean
  title: string
  actions: SheetAction[]
  onCancel: () => void
}

/** 轻量操作菜单：长按日期等场景的两三个选项 */
export function ActionSheet({ isOpen, title, actions, onCancel }: ActionSheetProps) {
  if (!isOpen) return null
  return (
    <div className="action-sheet__overlay" onClick={onCancel}>
      <div className="action-sheet" onClick={(e) => e.stopPropagation()}>
        <p className="action-sheet__title">{title}</p>
        <div className="action-sheet__list">
          {actions.map((a) => (
            <button
              key={a.label}
              className={`action-sheet__item ${a.danger ? 'action-sheet__item--danger' : ''}`}
              onClick={() => {
                onCancel()
                a.onSelect()
              }}
            >
              <span className="action-sheet__item-label">{a.label}</span>
              {a.description && <span className="action-sheet__item-desc">{a.description}</span>}
            </button>
          ))}
        </div>
        <button className="action-sheet__cancel" onClick={onCancel}>取消</button>
      </div>
    </div>
  )
}
