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
