import { useState } from 'react'
import type { TrainingRecord, TrainingTag, TagMetrics, TagDefinition, MetricType } from '../types'
import { METRIC_LABELS } from '../types'
import './TrainingFormPage.css'

interface TrainingFormPageProps {
  date: string
  existingRecord?: TrainingRecord
  tagDefinitions: TagDefinition[]
  onSave: (data: Partial<TrainingRecord>) => void
  onBack: () => void
}

export function TrainingFormPage({
  date,
  existingRecord,
  tagDefinitions,
  onSave,
  onBack,
}: TrainingFormPageProps) {
  const [tags, setTags] = useState<TrainingTag[]>(() => {
    if (!existingRecord) return []
    const validNames = new Set(tagDefinitions.map((d) => d.name))
    return existingRecord.tags.filter((t) => validNames.has(t.name))
  })

  const handleSave = () => {
    onSave({ tags })
  }

  const isValid = tags.length > 0

  const getTagDef = (name: string): TagDefinition | undefined =>
    tagDefinitions.find((d) => d.name === name)

  const toggleTag = (name: string) => {
    setTags((prev) => {
      const existing = prev.find((t) => t.name === name)
      if (existing) return prev.filter((t) => t.name !== name)
      const def = getTagDef(name)
      return [...prev, { name, metrics: def && def.metrics.length > 0 ? {} : undefined }]
    })
  }

  const updateMetricValue = (tagName: string, field: keyof TagMetrics, value: string) => {
    if (value === '') {
      setTags((prev) =>
        prev.map((t) => {
          if (t.name !== tagName) return t
          const rest = { ...t.metrics }
          delete rest[field]
          const hasOther = Object.keys(rest).length > 0
          return { ...t, metrics: hasOther ? rest : undefined }
        })
      )
      return
    }
    const num = Number(value)
    if (Number.isNaN(num) || num < 0) return
    setTags((prev) =>
      prev.map((t) =>
        t.name === tagName
          ? { ...t, metrics: { ...t.metrics, [field]: num } }
          : t
      )
    )
  }

  const selectedTagsWithDefs = tags.map((t) => ({
    tag: t,
    def: getTagDef(t.name),
  }))

  const hasMetricInputs = selectedTagsWithDefs.some(
    ({ def }) => def && def.metrics.length > 0
  )

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
            {tagDefinitions.map((def) => {
              const isSelected = tags.some((t) => t.name === def.name)
              return (
                <button
                  key={def.name}
                  className={`form-field__tag ${isSelected ? 'form-field__tag--active' : ''}`}
                  onClick={() => toggleTag(def.name)}
                >
                  {def.name}
                  {def.metrics.length > 0 && (
                    <span className="form-field__tag-badge">
                      {def.metrics.map((m: MetricType) => METRIC_LABELS[m].label).join('/')}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {hasMetricInputs && (
          <div className="form-field">
            <label className="form-field__label">训练指标</label>
            <div className="metrics-list">
              {selectedTagsWithDefs.map(({ tag, def }) => {
                if (!def || def.metrics.length === 0) return null
                return (
                  <div key={tag.name} className="metrics-item">
                    <div className="metrics-item__name">{tag.name}</div>
                    <div className="metrics-item__fields">
                      {def.metrics.map((metric: MetricType) => (
                        <div key={metric} className="metrics-item__field">
                          <span className="metrics-item__unit">{METRIC_LABELS[metric].label}</span>
                          <input
                            className="metrics-item__input"
                            type="number"
                            inputMode="decimal"
                            placeholder="—"
                            value={tag.metrics?.[metric] ?? ''}
                            onChange={(e) => updateMetricValue(tag.name, metric, e.target.value)}
                            min={0}
                          />
                          <span className="metrics-item__suffix">{METRIC_LABELS[metric].unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
