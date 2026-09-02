import { useMemo, useState } from 'react'
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary'
import { GROUPS, groupFor, equipmentZh, type ExerciseGroup } from '../data/exerciseGroups'
import { EXERCISE_TIPS } from '../data/exerciseTips'
import { ExerciseIllustration } from '../components/ExerciseIllustration'
import { BodyDiagram } from '../components/BodyDiagram'
import { Icon } from '../components/icons'
import { useHapticFeedback } from '../hooks/useHapticFeedback'
import './ExerciseLibraryPage.css'

interface ExerciseLibraryPageProps {
  onBack: () => void
}

type Filter = ExerciseGroup | 'all'

/** 动作库：肌肉图 + 按部位筛选 + 图解和要领，给小白看图学动作 */
export function ExerciseLibraryPage({ onBack }: ExerciseLibraryPageProps) {
  const haptic = useHapticFeedback()
  const [group, setGroup] = useState<Filter>('all')
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [expanded, setExpanded] = useState<string | null>(null)

  const list = useMemo(
    () =>
      EXERCISE_LIBRARY.filter((e) => {
        if (group === 'all') return true
        return groupFor({ slug: e.slug, primaryMuscle: e.muscle }) === group
      }),
    [group]
  )

  const pickGroup = (g: Filter) => {
    haptic.onTap()
    setGroup(g)
    setExpanded(null)
    // 点了分面相关的肌群，自动切到对应人体面
    const def = GROUPS.find((x) => x.id === g)
    if (def && def.side !== 'both') setSide(def.side)
  }

  const toggleBodyPart = (g: ExerciseGroup) => {
    haptic.onTap()
    setGroup((prev) => (prev === g ? 'all' : g))
    setExpanded(null)
  }

  return (
    <div className="exlib">
      <header className="exlib__header">
        <button className="exlib__back" onClick={onBack} aria-label="返回">
          <Icon name="arrowLeft" size={20} />
        </button>
        <span className="exlib__title">动作库 · {EXERCISE_LIBRARY.length} 个</span>
      </header>

      <main className="exlib__body">
        {/* 人体肌肉图：正面/背面切换，点部位筛选 */}
        <div className="exlib__body-map">
          <div className="exlib__diagram">
            <button
              className={`exlib__side-btn ${side === 'front' ? 'exlib__side-btn--on' : ''}`}
              onClick={() => { haptic.onTap(); setSide('front') }}
            >
              正面
            </button>
            <BodyDiagram side="front" active={group === 'all' ? 'all' : group} onToggle={toggleBodyPart} />
          </div>
          <div className="exlib__diagram">
            <button
              className={`exlib__side-btn ${side === 'back' ? 'exlib__side-btn--on' : ''}`}
              onClick={() => { haptic.onTap(); setSide('back') }}
            >
              背面
            </button>
            <BodyDiagram side="back" active={group === 'all' ? 'all' : group} onToggle={toggleBodyPart} />
          </div>
        </div>
        <p className="exlib__hint">点击人体部位或下方分类，筛出练那里的动作</p>

        {/* 肌群筛选 */}
        <div className="exlib__filters">
          {GROUPS.map((g) => (
            <button
              key={g.id}
              className={`exlib__chip ${group === g.id ? 'exlib__chip--on' : ''}`}
              onClick={() => pickGroup(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* 动作列表 */}
        <div className="exlib__list">
          {list.map((e) => {
            const tip = EXERCISE_TIPS[e.slug]
            const open = expanded === e.slug
            return (
              <div key={e.slug} className={`exlib__item ${open ? 'exlib__item--open' : ''}`}>
                <button
                  className="exlib__item-head"
                  onClick={() => {
                    haptic.onTap()
                    setExpanded(open ? null : e.slug)
                  }}
                >
                  <span className="exlib__item-thumb">
                    <ExerciseIllustration name={e.zh} size={56} />
                  </span>
                  <span className="exlib__item-info">
                    <b>{e.zh}</b>
                    <span>
                      {equipmentZh(e.equipment)} · {GROUPS.find((g) => g.id === groupFor({ slug: e.slug, primaryMuscle: e.muscle }))?.label}
                    </span>
                  </span>
                  <i className={`exlib__item-arrow ${open ? 'exlib__item-arrow--open' : ''}`}>▸</i>
                </button>
                {open && (
                  <div className="exlib__item-detail">
                    <ExerciseIllustration name={e.zh} size={132} />
                    <p className="exlib__item-tip">{tip ?? '保持动作受控，感受目标肌肉发力。'}</p>
                    <p className="exlib__item-meta">
                      {e.en} · {equipmentZh(e.equipment)} · 主要练{
                        GROUPS.find((g) => g.id === groupFor({ slug: e.slug, primaryMuscle: e.muscle }))?.label
                      }
                    </p>
                  </div>
                )}
              </div>
            )
          })}
          {list.length === 0 && <p className="exlib__empty">这个部位还没有动作，换个分类看看</p>}
        </div>
      </main>
    </div>
  )
}

