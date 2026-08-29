import { useEffect, useState } from 'react'
import type { TagDefinition, MetricType } from '../types'
import { METRIC_LABELS } from '../types'
import { Icon } from '../components/icons'
import {
  loadAIConfig,
  saveAIConfig,
  DEFAULT_AI_CONFIG,
  DEFAULT_SYSTEM_PROMPT,
  type AIConfig,
} from '../utils/life'
import {
  loadPetSettings,
  savePetSettings,
  DEFAULT_PET_SETTINGS,
  type PetSettings,
} from '../utils/petSettings'
import { useHapticFeedback } from '../hooks/useHapticFeedback'
import { useToast } from '../components/useToast'
import './TagSettingsPage.css'

interface TagSettingsPageProps {
  tagDefinitions: TagDefinition[]
  totalWorkouts: number
  onAddTag: (def: TagDefinition) => void
  onRemoveTag: (name: string) => void
  onUpdateTagMetrics: (name: string, metrics: MetricType[]) => void
  onOpenBackup: () => void
  onBack: () => void
}

const ALL_METRICS: MetricType[] = ['duration', 'distance']

export function TagSettingsPage({
  tagDefinitions,
  totalWorkouts,
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
  const [pets, setPets] = useState<PetSettings>(DEFAULT_PET_SETTINGS)
  useEffect(() => {
    loadAIConfig().then(setAi).catch(() => {})
    loadPetSettings().then(setPets).catch(() => {})
  }, [])
  const togglePet = (kind: string | null) => {
    haptic.onTap()
    setPets((prev) => {
      const next = kind
        ? { ...prev, enabledMinis: { ...prev.enabledMinis, [kind]: prev.enabledMinis[kind] === false } }
        : { ...prev, showMain: !prev.showMain }
      savePetSettings(next).catch(() => {})
      return next
    })
  }
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

        {/* 宠物军团显示设置 */}
        <div className="ai-card">
          <div className="ai-card__head">
            <span className="ai-card__title">宠物军团</span>
            <span className="ai-card__hint">按训练次数解锁 · 点击开关显示</span>
          </div>
          <div className="pet-setting-list">
            <div className="pet-setting">
              <span className="pet-setting__name">主宠 · 进化系</span>
              <button
                className={`ai-switch ${pets.showMain ? 'ai-switch--on' : ''}`}
                onClick={() => togglePet(null)}
                role="switch"
                aria-checked={pets.showMain}
                aria-label="主宠开关"
              >
                <span className="ai-switch__knob" />
              </button>
            </div>
            {[
              { kind: 'dog', label: '柴犬', unlock: 2 },
              { kind: 'cat', label: '猫咪', unlock: 3 },
              { kind: 'frog', label: '青蛙', unlock: 4 },
              { kind: 'panda', label: '熊猫', unlock: 5 },
              { kind: 'rabbit', label: '兔兔', unlock: 6 },
              { kind: 'unicorn', label: '独角兽', unlock: 7 },
            ].map((m) => (
              <div key={m.kind} className="pet-setting">
                <span className={`pet-setting__name ${totalWorkouts < m.unlock ? 'pet-setting__name--locked' : ''}`}>
                  {m.label}
                  <small>{totalWorkouts < m.unlock ? ` · ${m.unlock} 次解锁` : ''}</small>
                </span>
                <button
                  className={`ai-switch ${pets.enabledMinis[m.kind] !== false ? 'ai-switch--on' : ''}`}
                  onClick={() => togglePet(m.kind)}
                  role="switch"
                  aria-checked={pets.enabledMinis[m.kind] !== false}
                  aria-label={`${m.label}开关`}
                >
                  <span className="ai-switch__knob" />
                </button>
              </div>
            ))}
          </div>
        </div>

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
          <div className="ai-card__row">
            <div className="ai-card__thinking-label">
              <span>深度思考</span>
              <small>{ai.thinkingEnabled ? '回复带思考过程' : '关闭后秒回'}</small>
            </div>
            <button
              className={`ai-switch ${ai.thinkingEnabled ? 'ai-switch--on' : ''}`}
              onClick={() => {
                haptic.onTap()
                setAi({ ...ai, thinkingEnabled: !ai.thinkingEnabled })
              }}
              role="switch"
              aria-checked={ai.thinkingEnabled}
              aria-label="深度思考开关"
            >
              <span className="ai-switch__knob" />
            </button>
          </div>
          <div className="ai-card__prompt-wrap">
            <textarea
              className="ai-card__prompt"
              rows={5}
              maxLength={1200}
              placeholder="生命提示词（描述你是谁、它该如何说话）"
              value={ai.systemPrompt}
              onChange={(e) => setAi({ ...ai, systemPrompt: e.target.value })}
            />
            <button
              className="ai-card__reset"
              onClick={() => {
                haptic.onTap()
                setAi({ ...ai, systemPrompt: DEFAULT_SYSTEM_PROMPT })
              }}
            >
              恢复默认
            </button>
          </div>
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
