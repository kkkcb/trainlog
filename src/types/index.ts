export type MetricType = 'duration' | 'distance'

export interface TagDefinition {
  name: string
  metrics: MetricType[]
}

export interface TagMetrics {
  duration?: number
  distance?: number
}

export interface TrainingTag {
  name: string
  metrics?: TagMetrics
}

export interface TrainingRecord {
  id: string
  date: string
  tags: TrainingTag[]
  createdAt: number
  updatedAt: number
  /** AI 识图来源的备注（如开始时间） */
  note?: string
  /** 动作级训练明细（动作训练会话归档） */
  detail?: SessionExercise[]
}

/** 计划中的单个动作预设 */
export interface PlanExercise {
  name: string
  /** 预设组数 */
  sets: number
  /** 目标次数，如 "8-12" 或 "10" */
  reps: string
  /** 预设重量 kg，0 = 徒手 */
  weight: number
}

/** 某日期的训练计划 */
export interface WorkoutPlan {
  id: string
  date: string
  exercises: PlanExercise[]
  createdAt: number
  updatedAt: number
}

/** 训练模式：自由(组数不锁，参数随改) / 计划(严格按预设槽位)，会话中可切换 */
export type WorkoutMode = 'free' | 'planned'

/** 实际完成的一组 */
export interface SetLog {
  weight: number
  reps: number
  doneAt: number
}

/** 会话中的动作：预设目标 + 实际完成组 */
export interface SessionExercise {
  name: string
  targetSets: number
  targetReps: string
  targetWeight: number
  sets: SetLog[]
}

/** 训练日记：随手收集的训练技巧与心得 */
export interface DiaryEntry {
  id: string
  text: string
  tag: string
  createdAt: number
  updatedAt: number
}

export const DIARY_TAGS = ['胸', '背', '腿', '肩臂', '核心', '饮食', '拉伸', '其他']

export const DEFAULT_TAG_DEFINITIONS: TagDefinition[] = [
  { name: '推', metrics: [] },
  { name: '拉', metrics: [] },
  { name: '蹲', metrics: [] },
]

export const METRIC_LABELS: Record<MetricType, { label: string; unit: string }> = {
  duration: { label: '时长', unit: 'min' },
  distance: { label: '距离', unit: 'km' },
}

/** 组间休息预设（秒） */
export const REST_PRESETS = [30, 60, 90, 120, 180]
export const DEFAULT_REST_SEC = 90

/** 常用动作快捷选择 */
export const COMMON_EXERCISES = [
  '卧推', '上斜卧推', '深蹲', '硬拉', '杠铃划船', '高位下拉',
  '站姿推举', '侧平举', '哑铃弯举', '绳索下压', '引体向上', '卷腹',
]

/** 动作图解素材库条目（生成于 src/data/exerciseLibrary.ts） */
export interface ExerciseLibraryEntry {
  slug: string
  /** 中文名（与 COMMON_EXERCISES/计划动作名对齐） */
  zh: string
  en: string
  equipment: string
  muscle: string
  frames: number
}
