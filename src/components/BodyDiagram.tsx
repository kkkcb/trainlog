import { BODY_MODEL, BODY_BASE_COLORS } from '../data/bodyModel'
import { MUSCLE_BLOCKS, type ExerciseGroup } from '../data/exerciseGroups'
import './BodyDiagram.css'

type GroupId =
  | 'chest' | 'back' | 'shoulders' | 'arms'
  | 'legs' | 'glutes' | 'core' | 'cardio'

/** 图解模式：入门=按肌肉群高亮/点击，专业=按肌肉块高亮/点击 */
export type DiagramMode = 'beginner' | 'pro'

interface BodyDiagramProps {
  side: 'front' | 'back'
  mode: DiagramMode
  /** 当前选中的肌肉群（入门模式生效） */
  activeGroup: GroupId | 'all'
  /** 当前选中的肌肉块 slug（专业模式生效） */
  activeBlock: string | 'all'
  onPickGroup: (group: ExerciseGroup) => void
  onPickBlock: (blockId: string) => void
}

/** 模型肌肉 slug → 肌肉群 */
const SLUG_GROUP: Record<string, ExerciseGroup> = {
  chest: 'chest',
  abs: 'core',
  obliques: 'core',
  deltoids: 'shoulders',
  biceps: 'arms',
  triceps: 'arms',
  forearm: 'arms',
  quadriceps: 'legs',
  calves: 'legs',
  tibialis: 'legs',
  knees: 'legs',
  ankles: 'legs',
  adductors: 'legs',
  hamstring: 'legs',
  trapezius: 'back',
  'upper-back': 'back',
  'lower-back': 'back',
  gluteal: 'glutes',
}

const BLOCK_IDS = new Set(MUSCLE_BLOCKS.map((b) => b.id))

/** 暗色主题下的肌肉基底色（原 #3f3f3f 在深色底上太闷） */
const BASE_OVERRIDE = '#4d525a'
const ACCENT = 'var(--color-accent)'

/** 小白入门：点肌肉图上的部位筛选动作。模型来自 react-native-body-highlighter (MIT) */
export function BodyDiagram({
  side,
  mode,
  activeGroup,
  activeBlock,
  onPickGroup,
  onPickBlock,
}: BodyDiagramProps) {
  const model = BODY_MODEL[side]

  return (
    <svg
      viewBox={model.viewBox}
      className={`body-diagram body-diagram--${side}`}
      role="img"
      aria-label={`${side === 'front' ? '正面' : '背面'}肌肉图，点击部位筛选动作`}
    >
      {model.parts.map((part, i) => {
        const group = SLUG_GROUP[part.slug]
        const on =
          mode === 'pro'
            ? activeBlock === part.slug
            : activeGroup !== 'all' && activeGroup === group
        const base = BODY_BASE_COLORS[part.slug] === '#3f3f3f' ? BASE_OVERRIDE : BODY_BASE_COLORS[part.slug]
        return (
          <g key={`${part.slug}-${i}`}>
            {part.paths.map((d, j) => (
              <path
                key={j}
                d={d}
                fill={on ? ACCENT : base}
                onClick={() => {
                  if (!group) return
                  if (mode === 'pro' && BLOCK_IDS.has(part.slug)) onPickBlock(part.slug)
                  else onPickGroup(group)
                }}
                className={`body-diagram__muscle ${group ? 'body-diagram__muscle--clickable' : ''} ${on ? 'body-diagram__muscle--on' : ''}`}
                aria-label={group ? part.slug : undefined}
              />
            ))}
          </g>
        )
      })}
    </svg>
  )
}
