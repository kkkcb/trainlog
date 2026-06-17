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
}

export const DEFAULT_TAG_DEFINITIONS: TagDefinition[] = [
  { name: '推', metrics: [] },
  { name: '拉', metrics: [] },
  { name: '蹲', metrics: [] },
]

export const METRIC_LABELS: Record<MetricType, { label: string; unit: string }> = {
  duration: { label: '时长', unit: 'min' },
  distance: { label: '距离', unit: 'km' },
}
