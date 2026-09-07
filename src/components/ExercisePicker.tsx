import { useMemo, useState } from 'react'
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary'
import { equipmentZh } from '../data/exerciseGroups'
import { buildCategories, matchesQuery, type CategoryId } from '../data/exerciseTaxonomy'
import { loadRecentExercises, pushRecentExercise } from '../utils/exerciseRecent'
import { ExerciseIllustration } from './ExerciseIllustration'
import './ExercisePicker.css'

interface ExercisePickerProps {
  /** 已选动作名集合 */
  picked: Set<string>
  onToggle: (name: string) => void
}

/**
 * 动作选择器 v2：左侧分类侧边栏（部位/动作家族/器械）+ 关键词搜索 + 静态缩略图列表。
 * 用于自由训练勾选、排计划添加、单个动作更换。
 */
export function ExercisePicker({ picked, onToggle }: ExercisePickerProps) {
  const [cat, setCat] = useState<CategoryId>('all')
  const [query, setQuery] = useState('')
  const [customName, setCustomName] = useState('')

  const recent = useMemo(() => loadRecentExercises(), [])
  const categories = useMemo(() => buildCategories(recent.length), [recent.length])

  const list = useMemo(() => {
    let base = EXERCISE_LIBRARY
    if (cat === 'recent') {
      const recentSet = new Set(recent)
      base = base.filter((e) => recentSet.has(e.zh))
      if (base.length === 0) {
        // 自定义名字不在库里，也保留为行
        return recent
          .filter((n) => !base.some((e) => e.zh === n))
          .map((n) => ({ slug: n, zh: n, en: n, equipment: '自定义', muscle: '', targets: [] as string[], frames: 0 }))
      }
    } else if (cat !== 'all') {
      const def = categories.flatMap((s) => s.items).find((i) => i.id === cat)
      if (def) base = base.filter(def.match)
    }
    const q = query.trim()
    const matched = base.filter((e) => matchesQuery(e, q))
    if (cat === 'recent') {
      // 按最近使用顺序排
      const idx = new Map(recent.map((n, i) => [n, i]))
      matched.sort((a, b) => (idx.get(a.zh) ?? 99) - (idx.get(b.zh) ?? 99))
      const extra = recent
        .filter((n) => !matched.some((e) => e.zh === n))
        .filter((n) => !q || n.toLowerCase().includes(q.toLowerCase()))
        .map((n) => ({ slug: n, zh: n, en: n, equipment: '自定义', muscle: '', targets: [] as string[], frames: 0 }))
      return [...matched, ...extra]
    }
    return matched
  }, [cat, query, recent, categories])

  const addCustom = () => {
    const name = customName.trim()
    if (!name) return
    onToggle(name)
    pushRecentExercise(name)
    setCustomName('')
  }

  const catLabel = (id: CategoryId) =>
    categories.flatMap((s) => s.items).find((i) => i.id === id)?.label ?? ''

  return (
    <div className="ex-picker2">
      {/* 左侧分类侧边栏 */}
      <nav className="ex-picker2__side" aria-label="动作分类">
        {categories.map((sec, si) => (
          <div key={si} className="ex-picker2__side-sec">
            {sec.section && <p className="ex-picker2__side-title">{sec.section}</p>}
            {sec.items.map((item) => (
              <button
                key={item.id}
                className={`ex-picker2__side-item ${cat === item.id ? 'ex-picker2__side-item--on' : ''}`}
                onClick={() => { setCat(item.id); setQuery('') }}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* 右侧：搜索 + 自定义 + 列表 */}
      <div className="ex-picker2__main">
        <input
          className="ex-picker2__search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`搜${cat !== 'all' && cat !== 'recent' ? catLabel(cat) : '动作'}：名字 / 英文 / 器械 / 练什么`}
        />
        <div className="ex-picker2__custom">
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
            placeholder="自定义动作名"
            maxLength={10}
          />
          <button onClick={addCustom} disabled={!customName.trim()}>＋添加</button>
        </div>

        <div className="ex-picker2__list">
          {list.slice(0, 80).map((e) => {
            const on = picked.has(e.zh)
            return (
              <button
                key={e.slug}
                className={`ex-picker2__row ${on ? 'ex-picker2__row--on' : ''}`}
                onClick={() => {
                  onToggle(e.zh)
                  pushRecentExercise(e.zh)
                }}
              >
                <span className="ex-picker2__thumb">
                  {e.frames > 0 ? <ExerciseIllustration name={e.zh} size={44} animate={false} /> : <i className="ex-picker2__custom-mark">自</i>}
                </span>
                <span className="ex-picker2__info">
                  <b>{e.zh}</b>
                  <span>
                    {e.equipment === '自定义' ? '自定义动作' : `${equipmentZh(e.equipment)}${e.targets?.length ? ' · ' + e.targets.slice(0, 3).join(' ') : ''}`}
                  </span>
                </span>
                <i className="ex-picker2__check">{on ? '✓' : ''}</i>
              </button>
            )
          })}
          {list.length === 0 && (
            <p className="ex-picker2__empty">没有匹配「{query}」的动作，换个词或用自定义添加</p>
          )}
        </div>
      </div>
    </div>
  )
}
