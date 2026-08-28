import { useEffect, useState } from 'react'
import type { TagDefinition, MetricType } from '../types'
import { METRIC_LABELS } from '../types'
import { Icon } from '../components/icons'
import {
  loadAIConfig,
  saveAIConfig,
  DEFAULT_AI_CONFIG,
  type AIConfig,
} from '../utils/life'
import { useHapticFeedback } from '../hooks/useHapticFeedback'
import { useToast } from '../components/useToast'
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

  // AI 生命配置
  const toast = useToast()
  const haptic = useHapticFeedback()
  const [ai, setAi] = useState<AIConfig>(DEFAULT_AI_CONFIG)
  const [aiSaved, setAiSaved] = useState(false)
  useEffect(() => {
    loadAIConfig().then(setAi).catch(() => {})
  }, [])
  const handleSaveAI = async () => {
    await saveAIConfig(ai)
    haptic.onSuccess()
    setAiSaved(true)
    setTimeout(() => setAiSaved(false), 1500)
    toast.show('AI 生命已点亮', 'success')
  }

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
        <button className="tag-settings__back" onClick={onBack} aria-label="返回">
          <Icon name="arrowLeft" size={20} />
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
                        {active && <Icon name="check" size={10} strokeWidth={3.4} />}
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

        {/* AI 生命配置 */}
        <div className="ai-card">
          <div className="ai-card__head">
            <span className="ai-card__title">AI 生命</span>
            <span className="ai-card__hint">点头像即可对话 · 保存后长期生效</span>
          </div>
          <input
            className="ai-card__input"
            type="password"
            placeholder="Z.ai API Key（填写一次，永久保存在本机）"
            value={ai.apiKey}
            onChange={(e) => setAi({ ...ai, apiKey: e.target.value.trim() })}
          />
          <textarea
            className="ai-card__prompt"
            rows={5}
            maxLength={1200}
            placeholder="生命提示词（描述你是谁、它该如何说话）"
            value={ai.systemPrompt}
            onChange={(e) => setAi({ ...ai, systemPrompt: e.target.value })}
          />
          <button
            className={`ai-card__save ${ai.apiKey ? 'ai-card__save--on' : ''} ${aiSaved ? 'ai-card__save--done' : ''}`}
            onClick={handleSaveAI}
            disabled={!ai.apiKey}
          >
            {aiSaved ? '✓ 已保存' : '保存并点亮'}
          </button>
        </div>

        <button className="tag-settings__backup-btn" onClick={onOpenBackup}>
          <Icon name="database" size={17} />
          <span>数据备份 / 导入导出</span>
        </button>
      </div>
    </div>
  )
}
