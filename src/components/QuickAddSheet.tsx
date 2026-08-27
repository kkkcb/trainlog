import { useState } from 'react'
import type { TagDefinition } from '../types'
import { Icon } from './icons'
import { useHapticFeedback } from '../hooks/useHapticFeedback'
import './QuickAddSheet.css'

interface QuickAddSheetProps {
  isOpen: boolean
  date: string
  tagDefinitions: TagDefinition[]
  onAdd: (date: string, tagNames: string[]) => void
  onClose: () => void
}

export function QuickAddSheet({ isOpen, date, tagDefinitions, onAdd, onClose }: QuickAddSheetProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const haptic = useHapticFeedback()

  if (!isOpen) return null

  const toggleTag = (tag: string) => {
    haptic.onTap()
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleAdd = () => {
    if (selectedTags.length > 0) {
      onAdd(date, selectedTags)
      setSelectedTags([])
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedTags([])
      onClose()
    }
  }

  return (
    <div className="quick-add-overlay" onClick={handleOverlayClick}>
      <div className="quick-add-sheet" role="dialog" aria-label="快速添加训练">
        <div className="quick-add-sheet__handle" />
        <div className="quick-add-sheet__header">
          <span className="quick-add-sheet__title">快速添加</span>
          <span className="quick-add-sheet__date">
            <Icon name="calendar" size={13} />
            {date}
          </span>
        </div>
        <div className="quick-add-sheet__tags">
          {tagDefinitions.map((def) => {
            const active = selectedTags.includes(def.name)
            return (
              <button
                key={def.name}
                className={`quick-add-sheet__tag ${active ? 'quick-add-sheet__tag--active' : ''}`}
                onClick={() => toggleTag(def.name)}
              >
                {def.name}
                {active && (
                  <span className="quick-add-sheet__tag-check">
                    <Icon name="check" size={11} strokeWidth={3} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <button
          className={`quick-add-sheet__btn ${selectedTags.length > 0 ? 'quick-add-sheet__btn--active' : ''}`}
          onClick={handleAdd}
          disabled={selectedTags.length === 0}
        >
          <Icon name="plus" size={17} strokeWidth={2.4} />
          添加{selectedTags.length > 0 ? ` ${selectedTags.length} 项` : ''}
        </button>
      </div>
    </div>
  )
}
