import './BodyDiagram.css'

type GroupId =
  | 'chest' | 'back' | 'shoulders' | 'arms'
  | 'legs' | 'glutes' | 'core' | 'cardio'

interface BodyDiagramProps {
  side: 'front' | 'back'
  active: GroupId | 'all'
  onToggle: (group: GroupId) => void
}

interface Part {
  id: GroupId
  name: string
  /** 椭圆区域: cx cy rx ry rotate? */
  shape: [number, number, number, number, number?]
}

/** 站姿人形，viewBox 0 0 120 220，坐标为手绘示意 */
const PARTS: Record<'front' | 'back', Part[]> = {
  front: [
    { id: 'shoulders', name: '肩', shape: [33, 52, 14, 11] },
    { id: 'shoulders', name: '肩', shape: [87, 52, 14, 11] },
    { id: 'chest', name: '胸', shape: [60, 66, 19, 16] },
    { id: 'arms', name: '手臂', shape: [22, 88, 8, 30, 4] },
    { id: 'arms', name: '手臂', shape: [98, 88, 8, 30, -4] },
    { id: 'core', name: '核心', shape: [60, 100, 16, 20] },
    { id: 'legs', name: '腿', shape: [48, 155, 10, 40] },
    { id: 'legs', name: '腿', shape: [72, 155, 10, 40] },
  ],
  back: [
    { id: 'shoulders', name: '肩', shape: [33, 52, 14, 11] },
    { id: 'shoulders', name: '肩', shape: [87, 52, 14, 11] },
    { id: 'back', name: '背', shape: [60, 70, 20, 24] },
    { id: 'arms', name: '手臂', shape: [22, 88, 8, 30, 4] },
    { id: 'arms', name: '手臂', shape: [98, 88, 8, 30, -4] },
    { id: 'glutes', name: '臀', shape: [60, 122, 18, 13] },
    { id: 'legs', name: '腿', shape: [48, 162, 10, 36] },
    { id: 'legs', name: '腿', shape: [72, 162, 10, 36] },
  ],
}

/** 简化人形剪影（不可点的底稿） */
const SILHOUETTE = 'M60 6a11 11 0 1 1 0 22 11 11 0 0 1 0-22zM44 32h32c8 0 14 6 16 14l8 34c1 5-2 9-6 9l-4-1-2 30 2 62c0 5-4 8-8 8h-6l-6-56-4-18-4 18-6 56h-6c-4 0-8-3-8-8l2-62-2-30-4 1c-4 0-7-4-6-9l8-34c2-8 8-14 16-14z'

/** 小白入门：点人体上的部位，筛出练那里的动作 */
export function BodyDiagram({ side, active, onToggle }: BodyDiagramProps) {
  return (
    <svg viewBox="0 0 120 220" className={`body-diagram body-diagram--${side}`} role="img" aria-label={`${side === 'front' ? '正面' : '背面'}肌肉图，点击部位筛选动作`}>
      <path d={SILHOUETTE} className="body-diagram__base" />
      {PARTS[side].map((p, i) => {
        const on = active === p.id
        return (
          <g key={`${p.id}-${i}`} onClick={() => onToggle(p.id)} className="body-diagram__part">
            <ellipse
              cx={p.shape[0]}
              cy={p.shape[1]}
              rx={p.shape[2]}
              ry={p.shape[3]}
              transform={p.shape[4] ? `rotate(${p.shape[4]} ${p.shape[0]} ${p.shape[1]})` : undefined}
              className={`body-diagram__region ${on ? 'body-diagram__region--on' : ''}`}
            />
            {on && (
              <text x={p.shape[0]} y={p.shape[1] + 4} textAnchor="middle" className="body-diagram__label">
                {p.name}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
