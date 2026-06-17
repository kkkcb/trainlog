import { useState } from 'react'
import type { TagDefinition } from '../types'
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

  if (!isOpen) return null

  const toggleTag = (tag: string) => {
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
      <div className="quick-add-sheet">
        <div className="quick-add-sheet__handle" />
        <div className="quick-add-sheet__header">
          <span className="quick-add-sheet__date">{date}</span>
          <span className="quick-add-sheet__title">快速添加</span>
        </div>
        <div className="quick-add-sheet__tags">
          {tagDefinitions.map((def) => (
            <button
              key={def.name}
              className={`quick-add-sheet__tag ${selectedTags.includes(def.name) ? 'quick-add-sheet__tag--active' : ''}`}
              onClick={() => toggleTag(def.name)}
            >
              {def.name}
            </button>
          ))}
        </div>
        <button
          className={`quick-add-sheet__btn ${selectedTags.length > 0 ? 'quick-add-sheet__btn--active' : ''}`}
          onClick={handleAdd}
          disabled={selectedTags.length === 0}
        >
          添加
        </button>
      </div>
    </div>
  )
}
