import { useState } from 'react'
import './QuickAddSheet.css'

interface QuickAddSheetProps {
  isOpen: boolean
  date: string
  presetTags: string[]
  onAdd: (date: string, tags: string[]) => void
  onClose: () => void
}

export function QuickAddSheet({ isOpen, date, presetTags, onAdd, onClose }: QuickAddSheetProps) {
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
      onClose()
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
          {presetTags.map((tag) => (
            <button
              key={tag}
              className={`quick-add-sheet__tag ${selectedTags.includes(tag) ? 'quick-add-sheet__tag--active' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
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
