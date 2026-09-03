import { BODY_MODEL, BODY_BASE_COLORS } from '../data/bodyModel'
import type { ExerciseGroup } from '../data/exerciseGroups'
import './BodyDiagram.css'

type GroupId =
  | 'chest' | 'back' | 'shoulders' | 'arms'
  | 'legs' | 'glutes' | 'core' | 'cardio'

interface BodyDiagramProps {
  side: 'front' | 'back'
  active: GroupId | 'all'
  onToggle: (group: ExerciseGroup) => void
}

/** 模型里的肌肉 slug → 8 大部位分组 */
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

/** 暗色主题下的肌肉基底色（原 #3f3f3f 在深色底上太闷） */
const BASE_OVERRIDE = '#4d525a'
const ACCENT = 'var(--color-accent)'

/** 小白入门：点肌肉图上的部位，筛出练那里的动作。模型来自 react-native-body-highlighter (MIT) */
export function BodyDiagram({ side, active, onToggle }: BodyDiagramProps) {
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
        const activeOn = group != null && active === group
        const base = BODY_BASE_COLORS[part.slug] === '#3f3f3f' ? BASE_OVERRIDE : BODY_BASE_COLORS[part.slug]
        return (
          <g key={`${part.slug}-${i}`}>
            {part.paths.map((d, j) => (
              <path
                key={j}
                d={d}
                fill={activeOn ? ACCENT : base}
                onClick={() => group && onToggle(group)}
                className={`body-diagram__muscle ${group ? 'body-diagram__muscle--clickable' : ''} ${activeOn ? 'body-diagram__muscle--on' : ''}`}
                aria-label={group ? part.slug : undefined}
              />
            ))}
          </g>
        )
      })}
    </svg>
  )
}
