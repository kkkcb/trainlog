/** 最近用过的动作（自定义/库内），供选择器记忆展示 */
const RECENT_KEY = 'trainlog_recent_exercises'

export function loadRecentExercises(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(arr) ? (arr as string[]).slice(0, 12) : []
  } catch {
    return []
  }
}

export function pushRecentExercise(name: string): void {
  try {
    const list = loadRecentExercises().filter((n) => n !== name)
    list.unshift(name)
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 12)))
  } catch {
    // ignore
  }
}
