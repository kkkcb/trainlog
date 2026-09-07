import { useMemo, useState } from 'react'
import { EXERCISE_LIBRARY, findExerciseByName } from '../data/exerciseLibrary'
import { equipmentZh } from '../data/exerciseGroups'
import { loadRecentExercises, pushRecentExercise } from '../utils/exerciseRecent'
import './ExercisePicker.css'

interface ExercisePickerProps {
  /** 已选动作名集合 */
  picked: Set<string>
  onToggle: (name: string) => void
}

/**
 * 动作选择器：常用 chips + 库内搜索(带器械标签) + 自定义输入。
 * 选过的名字都会记忆，供计划编辑/自由训练共用。
 */
export function ExercisePicker({ picked, onToggle }: ExercisePickerProps) {
  const [query, setQuery] = useState('')
  const [customName, setCustomName] = useState('')
  const [showLib, setShowLib] = useState(false)
  const recent = useMemo(() => loadRecentExercises(), [])

  const results = useMemo(() => {
    const q = query.trim()
    if (!q) return EXERCISE_LIBRARY.slice(0, 30)
    return EXERCISE_LIBRARY.filter(
      (e) => e.zh.includes(q) || e.en.toLowerCase().includes(q.toLowerCase()) || e.slug.includes(q.toLowerCase())
    ).slice(0, 30)
  }, [query])

  const addCustom = () => {
    const name = customName.trim()
    if (!name) return
    onToggle(name)
    pushRecentExercise(name)
    setCustomName('')
  }

  return (
    <div className="ex-picker">
      {/* 自定义动作名 */}
      <div className="ex-picker__custom">
        <input
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustom()}
          placeholder="自定义动作名，如 器械夹胸"
          maxLength={10}
        />
        <button className="ex-picker__add" onClick={addCustom} disabled={!customName.trim()}>
          ＋添加
        </button>
      </div>

      {/* 最近用过（含自定义） */}
      {recent.length > 0 && (
        <div className="ex-picker__section">
          <p className="ex-picker__label">最近</p>
          <div className="ex-picker__chips">
            {recent.map((name) => (
              <button
                key={name}
                className={`ex-picker__chip ${picked.has(name) ? 'ex-picker__chip--on' : ''}`}
                onClick={() => onToggle(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 动作库搜索 */}
      <div className="ex-picker__section">
        <div className="ex-picker__lib-head" onClick={() => setShowLib((v) => !v)}>
          <p className="ex-picker__label">动作库 · {EXERCISE_LIBRARY.length} 个</p>
          <i className={`ex-picker__arrow ${showLib ? 'ex-picker__arrow--open' : ''}`}>▸</i>
        </div>
        {showLib && (
          <>
            <input
              className="ex-picker__search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索：名字 / 器械 / 拼音首字母暂不支持"
            />
            <div className="ex-picker__list">
              {results.map((e) => (
                <button
                  key={e.slug}
                  className={`ex-picker__row ${picked.has(e.zh) ? 'ex-picker__row--on' : ''}`}
                  onClick={() => {
                    onToggle(e.zh)
                    pushRecentExercise(e.zh)
                  }}
                >
                  <span className="ex-picker__row-name">
                    {e.zh}
                    {findExerciseByName(e.zh) && <i>{equipmentZh(e.equipment)}</i>}
                  </span>
                  <span className="ex-picker__row-check">{picked.has(e.zh) ? '✓' : ''}</span>
                </button>
              ))}
              {results.length === 0 && <p className="ex-picker__empty">没有匹配，用上方自定义添加</p>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
