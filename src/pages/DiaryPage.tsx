import { useMemo, useState } from 'react'
import type { DiaryEntry } from '../types'
import { DIARY_TAGS } from '../types'
import { useDiaryStore } from '../hooks/useDiaryStore'
import { useHapticFeedback } from '../hooks/useHapticFeedback'
import { useToast } from '../components/useToast'
import { Icon } from '../components/icons'
import './DiaryPage.css'

function fmtDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function DiaryPage() {
  const { loading, entries, addEntry, updateEntry, removeEntry } = useDiaryStore()
  const toast = useToast()
  const haptic = useHapticFeedback()

  const [text, setText] = useState('')
  const [tag, setTag] = useState('其他')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterTag, setFilterTag] = useState<string | null>(null)

  const usedTags = useMemo(() => {
    const set = new Set(entries.map((e) => e.tag))
    return ['全部', ...[...set]]
  }, [entries])

  const visible = useMemo(
    () => (filterTag ? entries.filter((e) => e.tag === filterTag) : entries),
    [entries, filterTag]
  )

  const canSave = text.trim().length > 0

  const handleSave = async () => {
    if (!canSave) return
    haptic.onSuccess()
    if (editingId) {
      await updateEntry(editingId, text.trim(), tag)
      toast.show('已更新', 'success')
    } else {
      await addEntry(text.trim(), tag)
      toast.show('已收藏', 'success')
    }
    setText('')
    setTag('其他')
    setEditingId(null)
  }

  const startEdit = (entry: DiaryEntry) => {
    haptic.onTap()
    setEditingId(entry.id)
    setText(entry.text)
    setTag(entry.tag)
    document.querySelector(".app__main")?.scrollTo({ top: 0 })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setText('')
    setTag('其他')
  }

  const handleDelete = async (id: string) => {
    haptic.onSuccess()
    await removeEntry(id)
    if (editingId === id) cancelEdit()
    toast.show('已删除', 'success')
  }

  return (
    <div className="diary-view">
      <div className="diary-view__head">
        <span className="diary-view__title">训练日记</span>
        <span className="diary-view__count">{entries.length} 条</span>
      </div>

      <div className="diary-body">
        {/* 收集框 */}
        <div className="diary-compose">
          <textarea
            className="diary-input"
            placeholder="记下看到的训练技巧、动作心得…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <div className="diary-compose__foot">
            <div className="diary-tags">
              {DIARY_TAGS.map((t) => (
                <button
                  key={t}
                  className={`diary-tag ${tag === t ? 'diary-tag--on' : ''}`}
                  onClick={() => {
                    haptic.onTap()
                    setTag(t)
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="diary-compose__actions">
              {editingId && (
                <button className="diary-cancel" onClick={cancelEdit}>
                  取消
                </button>
              )}
              <button
                className={`diary-save ${canSave ? 'diary-save--on' : ''}`}
                onClick={handleSave}
                disabled={!canSave}
              >
                <Icon name={editingId ? 'check' : 'plus'} size={15} strokeWidth={2.4} />
                {editingId ? '保存' : '收藏'}
              </button>
            </div>
          </div>
        </div>

        {/* 分类筛选 */}
        {usedTags.length > 1 && (
          <div className="diary-filter">
            {usedTags.map((t) => (
              <button
                key={t}
                className={`diary-filter__chip ${(filterTag ?? '全部') === t ? 'diary-filter__chip--on' : ''}`}
                onClick={() => {
                  haptic.onTap()
                  setFilterTag(t === '全部' ? null : t)
                }}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* 列表 */}
        {loading ? (
          <p className="diary-empty">加载中…</p>
        ) : visible.length === 0 ? (
          <div className="diary-empty">
            <div className="diary-empty__icon">
              <Icon name="notebook" size={28} strokeWidth={1.5} />
            </div>
            <p className="diary-empty__text">
              {filterTag ? '这个分类下还没有内容' : '收集的第一条训练技巧'}
            </p>
            <p className="diary-empty__hint">从上面输入框开始记录</p>
          </div>
        ) : (
          visible.map((entry) => (
            <div key={entry.id} className="diary-item">
              <div className="diary-item__head">
                <span className="diary-item__tag">{entry.tag}</span>
                <span className="diary-item__date">
                  {fmtDate(entry.createdAt)}
                  {entry.updatedAt > entry.createdAt && ' · 已编辑'}
                </span>
              </div>
              <p className="diary-item__text">{entry.text}</p>
              <div className="diary-item__actions">
                <button onClick={() => startEdit(entry)} aria-label="编辑">
                  <Icon name="pencil" size={15} />
                </button>
                <button onClick={() => handleDelete(entry.id)} aria-label="删除">
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
