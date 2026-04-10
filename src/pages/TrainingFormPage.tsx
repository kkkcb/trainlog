import { useState, useEffect, useRef } from 'react'
import type { TrainingRecord } from '../types'
import './TrainingFormPage.css'

interface TrainingFormPageProps {
  date: string
  existingRecord?: TrainingRecord
  presetTags: string[]
  onAddPresetTag: (tag: string) => void
  onRemovePresetTag: (tag: string) => void
  onSave: (data: Partial<TrainingRecord>) => void
  onBack: () => void
}

export function TrainingFormPage({
  date,
  existingRecord,
  presetTags,
  onAddPresetTag,
  onRemovePresetTag,
  onSave,
  onBack,
}: TrainingFormPageProps) {
  const [tags, setTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const tagInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (existingRecord) {
      setTags(existingRecord.tags || [])
    } else {
      setTags([])
    }
  }, [existingRecord])

  const handleSave = () => {
    onSave({ tags })
  }

  const isValid = tags.length > 0

  const toggleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  const addCustomTag = () => {
    const trimmed = customTag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
      setCustomTag('')
    }
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomTag()
    }
  }

  const handlePresetRemove = (tag: string) => {
    onRemovePresetTag(tag)
  }

  const handleSaveCustomAsPreset = () => {
    const trimmed = customTag.trim()
    if (trimmed) {
      onAddPresetTag(trimmed)
      setCustomTag('')
    }
  }

  const customSelectedTags = tags.filter((t) => !presetTags.includes(t))

  return (
    <div className="form-page">
      <div className="form-page__header">
        <button className="form-page__back" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="form-page__header-title">{existingRecord ? '编辑记录' : '添加记录'}</span>
        <button
          className={`form-page__save ${isValid ? 'form-page__save--active' : ''}`}
          onClick={handleSave}
          disabled={!isValid}
        >
          保存
        </button>
      </div>

      <div className="form-page__body">
        <div className="form-page__date">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{date}</span>
        </div>

        <div className="form-field">
          <label className="form-field__label">标签</label>
          <div className="form-field__tags">
            {presetTags.map((tag) => (
              <button
                key={tag}
                className={`form-field__tag ${tags.includes(tag) ? 'form-field__tag--active' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
                <span
                  className="form-field__tag-preset-remove"
                  onClick={(e) => { e.stopPropagation(); handlePresetRemove(tag) }}
                >×</span>
              </button>
            ))}
            {customSelectedTags.map((tag) => (
              <button
                key={tag}
                className="form-field__tag form-field__tag--active form-field__tag--custom"
                onClick={() => toggleTag(tag)}
              >
                {tag}
                <span className="form-field__tag-remove">×</span>
              </button>
            ))}
            <div className="form-field__tag-input-wrap">
              <input
                ref={tagInputRef}
                className="form-field__tag-input"
                type="text"
                placeholder="自定义"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
                maxLength={6}
              />
              {customTag.trim() && !presetTags.includes(customTag.trim()) && (
                <button
                  className="form-field__tag-add-btn"
                  onClick={handleSaveCustomAsPreset}
                  title="添加为预设标签"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
