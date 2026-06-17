import { useState } from 'react'
import type { TagDefinition, MetricType } from '../types'
import { METRIC_LABELS } from '../types'
import './TagSettingsPage.css'

interface TagSettingsPageProps {
  tagDefinitions: TagDefinition[]
  onAddTag: (def: TagDefinition) => void
  onRemoveTag: (name: string) => void
  onUpdateTagMetrics: (name: string, metrics: MetricType[]) => void
  onOpenBackup: () => void
  onBack: () => void
}

const ALL_METRICS: MetricType[] = ['duration', 'distance']

export function TagSettingsPage({
  tagDefinitions,
  onAddTag,
  onRemoveTag,
  onUpdateTagMetrics,
  onOpenBackup,
  onBack,
}: TagSettingsPageProps) {
  const [newTagName, setNewTagName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleAdd = () => {
    const trimmed = newTagName.trim()
    if (!trimmed) return
    if (tagDefinitions.some((d) => d.name === trimmed)) return
    onAddTag({ name: trimmed, metrics: [] })
    setNewTagName('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const toggleMetric = (tagName: string, metric: MetricType) => {
    const def = tagDefinitions.find((d) => d.name === tagName)
    if (!def) return
    const has = def.metrics.includes(metric)
    const updated = has ? def.metrics.filter((m) => m !== metric) : [...def.metrics, metric]
    onUpdateTagMetrics(tagName, updated)
  }

  const handleDelete = (name: string) => {
    if (confirmDelete === name) {
      onRemoveTag(name)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(name)
    }
  }

  return (
    <div className="tag-settings">
      <div className="tag-settings__header">
        <button className="tag-settings__back" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="tag-settings__title">标签管理</span>
        <span className="tag-settings__spacer" />
      </div>

      <div className="tag-settings__body">
        <div className="tag-settings__add">
          <input
            className="tag-settings__input"
            type="text"
            placeholder="输入新标签名称"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={6}
          />
          <button
            className={`tag-settings__add-btn ${newTagName.trim() ? 'tag-settings__add-btn--active' : ''}`}
            onClick={handleAdd}
            disabled={!newTagName.trim()}
          >
            添加
          </button>
        </div>

        <div className="tag-settings__list">
          {tagDefinitions.map((def) => (
            <div key={def.name} className="tag-settings__item">
              <div className="tag-settings__item-top">
                <span className="tag-settings__item-name">{def.name}</span>
                <button
                  className={`tag-settings__delete ${confirmDelete === def.name ? 'tag-settings__delete--confirm' : ''}`}
                  onClick={() => handleDelete(def.name)}
                >
                  {confirmDelete === def.name ? '确认删除' : '删除'}
                </button>
              </div>
              <div className="tag-settings__metrics">
                {ALL_METRICS.map((metric) => {
                  const active = def.metrics.includes(metric)
                  return (
                    <button
                      key={metric}
                      className={`tag-settings__metric ${active ? 'tag-settings__metric--active' : ''}`}
                      onClick={() => toggleMetric(def.name, metric)}
                    >
                      <span className="tag-settings__metric-check">
                        {active && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <span className="tag-settings__metric-label">{METRIC_LABELS[metric].label}</span>
                      <span className="tag-settings__metric-unit">({METRIC_LABELS[metric].unit})</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {tagDefinitions.length === 0 && (
          <div className="tag-settings__empty">
            <p>还没有标签，添加一个开始吧</p>
          </div>
        )}

        <button className="tag-settings__backup-btn" onClick={onOpenBackup}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>数据备份 / 导入导出</span>
        </button>
      </div>
    </div>
  )
}
