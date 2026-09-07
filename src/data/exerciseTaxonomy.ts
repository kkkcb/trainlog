import type { ExerciseLibraryEntry } from '../types'
import { EXERCISE_LIBRARY } from './exerciseLibrary'
import { equipmentZh, groupFor } from './exerciseGroups'

/** 侧边栏分类：肌群 / 动作家族 / 器械 三段 */
export type CategoryId =
  | 'all'
  | 'recent'
  | `g:${string}` // 肌群（ExerciseGroup）
  | `f:${string}` // 动作家族
  | `e:${string}` // 器械

export interface CategoryDef {
  id: CategoryId
  label: string
  match: (e: ExerciseLibraryEntry) => boolean
}

/** 动作家族：按中文名/slug 归类（俯卧撑全家、深蹲全家…） */
const FAMILY_DEFS: Array<{ id: string; label: string; match: (e: ExerciseLibraryEntry) => boolean }> = [
  { id: 'pushup', label: '俯卧撑', match: (e) => e.zh.includes('俯卧撑') || e.slug.includes('push-up') },
  { id: 'squat', label: '深蹲', match: (e) => e.zh.includes('蹲') || (e.slug.includes('squat') && !e.zh.includes('蹲')) },
  { id: 'pullup', label: '引体', match: (e) => e.zh.includes('引体') || e.slug.includes('pull-up') || e.slug.includes('chin-up') },
  { id: 'deadlift', label: '硬拉', match: (e) => e.zh.includes('硬拉') || e.zh.includes('体前屈') },
  { id: 'row', label: '划船', match: (e) => e.zh.includes('划船') || e.slug.includes('-row') },
  { id: 'pulldown', label: '下拉', match: (e) => e.zh.includes('下拉') },
  { id: 'bench', label: '卧推', match: (e) => e.zh.includes('卧推') || e.zh.includes('推胸') || e.zh.includes('夹胸') || e.zh.includes('飞鸟') },
  { id: 'press', label: '推举', match: (e) => e.zh.includes('推举') || e.zh.includes('平举') || e.zh.includes('倒立撑') },
  { id: 'curl', label: '弯举', match: (e) => e.zh.includes('弯举') || e.zh.includes('锤式') },
  { id: 'tricep', label: '臂屈伸', match: (e) => e.zh.includes('臂屈伸') || e.zh.includes('下压') || e.zh.includes('三头') },
  { id: 'bridge', label: '臀桥', match: (e) => e.zh.includes('臀桥') || e.zh.includes('臀推') },
  { id: 'core', label: '核心', match: (e) => e.zh.includes('平板') || e.zh.includes('卷腹') || e.zh.includes('举腿') || e.zh.includes('中空') || e.zh.includes('支撑') && e.zh.includes('L') },
  { id: 'stretch', label: '拉伸', match: (e) => e.zh.includes('拉伸') || e.zh.includes('伸展') || e.slug.includes('stretch') || e.slug.includes('pose') },
  { id: 'band', label: '弹力带', match: (e) => e.zh.startsWith('弹力带') || e.slug.startsWith('band') || e.slug.startsWith('banded') },
  { id: 'kettlebell', label: '壶铃', match: (e) => e.zh.startsWith('壶铃') || e.slug.includes('kettlebell') },
]

/** 器械分类（含自重） */
const EQUIPMENT_IDS = ['Bodyweight', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Kettlebell', 'Resistance Band']
const EQUIPMENT_ORDER = ['自重', '杠铃', '哑铃', '绳索', '器械', '壶铃', '弹力带']

export function buildCategories(recentCount: number): Array<{ section: string; items: CategoryDef[] }> {
  const groups: CategoryDef[] = [
    { id: 'g:chest', label: '胸', match: (e) => groupFor({ slug: e.slug, primaryMuscle: e.muscle }) === 'chest' },
    { id: 'g:back', label: '背', match: (e) => groupFor({ slug: e.slug, primaryMuscle: e.muscle }) === 'back' },
    { id: 'g:shoulders', label: '肩', match: (e) => groupFor({ slug: e.slug, primaryMuscle: e.muscle }) === 'shoulders' },
    { id: 'g:arms', label: '手臂', match: (e) => groupFor({ slug: e.slug, primaryMuscle: e.muscle }) === 'arms' },
    { id: 'g:core', label: '核心', match: (e) => groupFor({ slug: e.slug, primaryMuscle: e.muscle }) === 'core' },
    { id: 'g:glutes', label: '臀', match: (e) => groupFor({ slug: e.slug, primaryMuscle: e.muscle }) === 'glutes' },
    { id: 'g:legs', label: '腿', match: (e) => groupFor({ slug: e.slug, primaryMuscle: e.muscle }) === 'legs' },
    { id: 'g:cardio', label: '有氧', match: (e) => groupFor({ slug: e.slug, primaryMuscle: e.muscle }) === 'cardio' },
  ]
  const families: CategoryDef[] = FAMILY_DEFS.map((f) => ({
    id: `f:${f.id}` as CategoryId,
    label: f.label,
    match: (e: ExerciseLibraryEntry) => f.match(e),
  }))
  const equipments: CategoryDef[] = EQUIPMENT_IDS.map((eq) => ({
    id: `e:${eq}` as CategoryId,
    label: equipmentZh(eq),
    match: (e: ExerciseLibraryEntry) => e.equipment === eq,
  })).sort((a, b) => EQUIPMENT_ORDER.indexOf(a.label) - EQUIPMENT_ORDER.indexOf(b.label))

  const top: CategoryDef[] = [
    { id: 'all', label: '全部', match: () => true },
  ]
  if (recentCount > 0) {
    top.push({ id: 'recent', label: '最近', match: () => false }) // recent 由 Picker 特判
  }
  return [
    { section: '', items: top },
    { section: '部位', items: groups },
    { section: '动作', items: families },
    { section: '器械', items: equipments },
  ]
}

/** 多关键词命中：中文名/英文名/slug/器械/练什么/家族 */
export function matchesQuery(e: ExerciseLibraryEntry, qRaw: string): boolean {
  const q = qRaw.trim().toLowerCase()
  if (!q) return true
  const hay = [
    e.zh,
    e.en.toLowerCase(),
    e.slug.replace(/-/g, ' '),
    equipmentZh(e.equipment),
    ...(e.targets ?? []),
  ]
  const familyHit = FAMILY_DEFS.some((f) => (f.label.toLowerCase().includes(q) || f.id.includes(q)) && f.match(e))
  if (familyHit) return true
  return hay.some((h) => h.toLowerCase().includes(q))
}

export function countFor(cat: CategoryDef): number {
  if (cat.id === 'all') return EXERCISE_LIBRARY.length
  return EXERCISE_LIBRARY.filter(cat.match).length
}
