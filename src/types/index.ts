export interface TrainingRecord {
  id: string
  date: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

export const DEFAULT_TAGS = ['推', '拉', '蹲']
