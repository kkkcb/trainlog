import { useMemo, useState } from 'react'
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary'
import {
  GROUPS,
  MUSCLE_BLOCKS,
  groupFor,
  blockFor,
  blockLabel,
  equipmentZh,
  type ExerciseGroup,
} from '../data/exerciseGroups'

type Filter = ExerciseGroup | 'all'
import { EXERCISE_TIPS } from '../data/exerciseTips'
import { ExerciseIllustration } from '../components/ExerciseIllustration'
import { BodyDiagram, type DiagramMode } from '../components/BodyDiagram'
import { Icon } from '../components/icons'
import { useHapticFeedback } from '../hooks/useHapticFeedback'
import './ExerciseLibraryPage.css'

interface ExerciseLibraryPageProps {
  onBack: () => void
}

/**
 * 动作库：肌肉图 + 按部位筛选 + 图解和要领。
 * 两个版本：入门版按肌肉群分（小白），专业版按肌肉块分（精准）。
 */
export function ExerciseLibraryPage({ onBack }: ExerciseLibraryPageProps) {
  const haptic = useHapticFeedback()
  const [mode, setMode] = useState<DiagramMode>('beginner')
  const [group, setGroup] = useState<Filter>('all')
  const [block, setBlock] = useState<string | 'all'>('all')
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [expanded, setExpanded] = useState<string | null>(null)

  const list = useMemo(() => {
    return EXERCISE_LIBRARY.filter((e) => {
      if (mode === 'pro') {
        return block === 'all' ? true : blockFor({ slug: e.slug, primaryMuscle: e.muscle }) === block
      }
      return group === 'all' ? true : groupFor({ slug: e.slug, primaryMuscle: e.muscle }) === group
    })
  }, [mode, group, block])

  const resetExpand = () => setExpanded(null)

  const pickGroup = (g: Filter) => {
    haptic.onTap()
    setGroup(g)
    setBlock('all')
    resetExpand()
    const def = GROUPS.find((x) => x.id === g)
    if (def && def.side !== 'both') setSide(def.side)
  }

  const pickBlock = (b: string | 'all') => {
    haptic.onTap()
    setBlock(b)
    resetExpand()
    if (b !== 'all') {
      const def = MUSCLE_BLOCKS.find((x) => x.id === b)
      if (def) setSide(def.side)
    }
  }

  const groupLabel = (e: { slug: string; muscle: string }) =>
    GROUPS.find((g) => g.id === groupFor({ slug: e.slug, primaryMuscle: e.muscle }))?.label ?? ''

  return (
    <div className="exlib">
      <header className="exlib__header">
        <button className="exlib__back" onClick={onBack} aria-label="返回">
          <Icon name="arrowLeft" size={20} />
        </button>
        <span className="exlib__title">动作库 · {EXERCISE_LIBRARY.length} 个</span>
        <div className="exlib__mode" role="tablist" aria-label="筛选版本">
          <button
            className={`exlib__mode-btn ${mode === 'beginner' ? 'exlib__mode-btn--on' : ''}`}
            onClick={() => { haptic.onTap(); setMode('beginner'); setBlock('all') }}
          >
            入门版
          </button>
          <button
            className={`exlib__mode-btn ${mode === 'pro' ? 'exlib__mode-btn--on' : ''}`}
            onClick={() => { haptic.onTap(); setMode('pro') }}
          >
            专业版
          </button>
        </div>
      </header>

      <main className="exlib__body">
        {/* 人体肌肉图：模式决定点击/高亮的粒度 */}
        <div className="exlib__body-map">
          <div className="exlib__diagram">
            <button
              className={`exlib__side-btn ${side === 'front' ? 'exlib__side-btn--on' : ''}`}
              onClick={() => { haptic.onTap(); setSide('front') }}
            >
              正面
            </button>
            <BodyDiagram
              side="front"
              mode={mode}
              activeGroup={group === 'all' ? 'all' : group}
              activeBlock={block}
              onPickGroup={(g) => pickGroup(g)}
              onPickBlock={(b) => pickBlock(b === block ? 'all' : b)}
            />
          </div>
          <div className="exlib__diagram">
            <button
              className={`exlib__side-btn ${side === 'back' ? 'exlib__side-btn--on' : ''}`}
              onClick={() => { haptic.onTap(); setSide('back') }}
            >
              背面
            </button>
            <BodyDiagram
              side="back"
              mode={mode}
              activeGroup={group === 'all' ? 'all' : group}
              activeBlock={block}
              onPickGroup={(g) => pickGroup(g)}
              onPickBlock={(b) => pickBlock(b === block ? 'all' : b)}
            />
          </div>
        </div>
        <p className="exlib__hint">
          {mode === 'beginner' ? '入门版：点人体部位或分类，按肌肉群筛动作' : '专业版：点具体肌肉块，精准到每一块肌肉'}
        </p>

        {/* 筛选 chips：入门=肌肉群；专业=肌肉块 */}
        {mode === 'beginner' ? (
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
        ) : (
          <div className="exlib__filters">
            <button
              className={`exlib__chip ${block === 'all' ? 'exlib__chip--on' : ''}`}
              onClick={() => pickBlock('all')}
            >
              全部肌肉块
            </button>
            {MUSCLE_BLOCKS.map((b) => (
              <button
                key={b.id}
                className={`exlib__chip ${block === b.id ? 'exlib__chip--on' : ''}`}
                onClick={() => pickBlock(b.id)}
              >
                {b.label}
              </button>
            ))}
          </div>
        )}

        {/* 动作列表 */}
        <div className="exlib__list">
          {list.map((e) => {
            const tip = EXERCISE_TIPS[e.slug]
            const open = expanded === e.slug
            const sub =
              mode === 'pro'
                ? `${equipmentZh(e.equipment)} · ${blockLabel(blockFor({ slug: e.slug, primaryMuscle: e.muscle }))}`
                : `${equipmentZh(e.equipment)} · ${groupLabel(e)}`
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
                    <span>{sub}</span>
                  </span>
                  <i className={`exlib__item-arrow ${open ? 'exlib__item-arrow--open' : ''}`}>▸</i>
                </button>
                {open && (
                  <div className="exlib__item-detail">
                    <ExerciseIllustration name={e.zh} size={132} />
                    <p className="exlib__item-tip">{tip ?? '保持动作受控，感受目标肌肉发力。'}</p>
                    <p className="exlib__item-meta">
                      {e.en} · {equipmentZh(e.equipment)} · 主要练
                      {mode === 'pro'
                        ? blockLabel(blockFor({ slug: e.slug, primaryMuscle: e.muscle }))
                        : groupLabel(e)}
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
