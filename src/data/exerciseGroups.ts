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

/** 肌肉块：肌肉群下的细分（与图解模型 slug 对齐） */
export interface MuscleBlock {
  id: string
  label: string
  group: ExerciseGroup
  /** 人体图正面/背面 */
  side: 'front' | 'back'
}

export const MUSCLE_BLOCKS: MuscleBlock[] = [
  // 胸
  { id: 'chest', label: '胸大肌', group: 'chest', side: 'front' },
  // 背
  { id: 'lats', label: '背阔肌', group: 'back', side: 'back' },
  { id: 'upper-back', label: '上背/斜方肌', group: 'back', side: 'back' },
  { id: 'trapezius', label: '斜方肌', group: 'back', side: 'back' },
  { id: 'lower-back', label: '下背/竖脊肌', group: 'back', side: 'back' },
  // 肩
  { id: 'deltoids', label: '三角肌', group: 'shoulders', side: 'front' },
  { id: 'rear-delts', label: '三角肌后束', group: 'shoulders', side: 'back' },
  // 手臂
  { id: 'biceps', label: '肱二头肌', group: 'arms', side: 'front' },
  { id: 'triceps', label: '肱三头肌', group: 'arms', side: 'back' },
  { id: 'forearm', label: '前臂', group: 'arms', side: 'front' },
  // 腿
  { id: 'quadriceps', label: '股四头肌', group: 'legs', side: 'front' },
  { id: 'hamstring', label: '腘绳肌', group: 'legs', side: 'back' },
  { id: 'calves', label: '小腿', group: 'legs', side: 'back' },
  { id: 'adductors', label: '内收肌', group: 'legs', side: 'front' },
  { id: 'tibialis', label: '胫前肌', group: 'legs', side: 'front' },
  // 臀
  { id: 'gluteal', label: '臀大肌', group: 'glutes', side: 'back' },
  // 核心
  { id: 'abs', label: '腹直肌', group: 'core', side: 'front' },
  { id: 'obliques', label: '腹斜肌', group: 'core', side: 'front' },
]

/** manifest 的 primaryMuscle → 肌肉块 id */
const PRIMARY_TO_BLOCK: Record<string, string> = {
  Chest: 'chest',
  Lats: 'lats',
  'Upper Back': 'upper-back',
  Traps: 'trapezius',
  'Lower Back': 'lower-back',
  Shoulders: 'deltoids',
  'Rear Delts': 'rear-delts',
  Biceps: 'biceps',
  Triceps: 'triceps',
  Forearms: 'forearm',
  Quads: 'quadriceps',
  Hamstrings: 'hamstring',
  Calves: 'calves',
  Adductors: 'adductors',
  Glutes: 'gluteal',
  Abs: 'abs',
  Core: 'abs',
  'Posterior Chain': 'hamstring',
  Legs: 'quadriceps',
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
  const blockId = PRIMARY_TO_BLOCK[exercise.primaryMuscle]
  const block = MUSCLE_BLOCKS.find((b) => b.id === blockId)
  return block ? block.group : 'core'
}

export function blockFor(exercise: { slug: string; primaryMuscle: string }): string {
  if (CARDIO_SLUGS.has(exercise.slug)) return 'cardio'
  return PRIMARY_TO_BLOCK[exercise.primaryMuscle] ?? 'abs'
}

export function blockLabel(blockId: string): string {
  return MUSCLE_BLOCKS.find((b) => b.id === blockId)?.label ?? blockId
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
