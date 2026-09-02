/** 动作按身体部位分组（小白视角：练的是哪儿） */
export type ExerciseGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'glutes'
  | 'core'
  | 'cardio'

export const GROUPS: Array<{ id: ExerciseGroup | 'all'; label: string; side: 'front' | 'back' | 'both' }> = [
  { id: 'all', label: '全部', side: 'both' },
  { id: 'chest', label: '胸', side: 'front' },
  { id: 'back', label: '背', side: 'back' },
  { id: 'shoulders', label: '肩', side: 'front' },
  { id: 'arms', label: '手臂', side: 'both' },
  { id: 'core', label: '核心', side: 'front' },
  { id: 'glutes', label: '臀', side: 'back' },
  { id: 'legs', label: '腿', side: 'both' },
  { id: 'cardio', label: '有氧', side: 'both' },
]

/** manifest 的 primaryMuscle → 分组 */
const MUSCLE_GROUP: Record<string, ExerciseGroup> = {
  Chest: 'chest',
  Back: 'back',
  Lats: 'back',
  'Upper Back': 'back',
  Shoulders: 'shoulders',
  Biceps: 'arms',
  Triceps: 'arms',
  Forearms: 'arms',
  Quads: 'legs',
  Hamstrings: 'legs',
  Calves: 'legs',
  'Posterior Chain': 'legs',
  Glutes: 'glutes',
  Core: 'core',
  Abs: 'core',
  'Full Body': 'cardio',
}

/** 纯有氧动作（无力量肌群语义） */
export const CARDIO_SLUGS = new Set([
  'running', 'cycling', 'jump-rope', 'rowing', 'elliptical', 'treadmill-incline-walk',
  'assault-bike', 'skierg', 'stair-climber', 'swimming', 'hiking', 'walking',
  'high-knees', 'fast-feet', 'jump-squat', 'skater-hop', 'sprawl', 'squat-thrust',
  'bear-crawl', 'crab-walk', 'lateral-shuffle', 'plank-jack', 'seal-jack',
])

export function groupFor(exercise: { slug: string; primaryMuscle: string }): ExerciseGroup {
  if (CARDIO_SLUGS.has(exercise.slug)) return 'cardio'
  return MUSCLE_GROUP[exercise.primaryMuscle] ?? 'core'
}

/** 器械中文 */
export const EQUIPMENT_ZH: Record<string, string> = {
  Barbell: '杠铃',
  Dumbbell: '哑铃',
  Machine: '器械',
  Cable: '绳索',
  Bodyweight: '自重',
  'Resistance Band': '弹力带',
  Kettlebell: '壶铃',
  Cardio: '有氧',
  Other: '其他',
}

export function equipmentZh(equipment: string): string {
  return EQUIPMENT_ZH[equipment] ?? equipment
}
