/** 日期工具：应用内日期统一使用 "YYYY-MM-DD" 字符串 */

const pad = (n: number) => String(n).padStart(2, '0')

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function getTodayString(): string {
  return toISO(new Date())
}

export function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00`)
}

/** 以选定日期所在周为准，返回周一开头的 7 天 ISO 数组 */
export function getWeekOf(iso: string): string[] {
  const d = parseISO(iso)
  const mondayOffset = (d.getDay() + 6) % 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - mondayOffset)
  return Array.from({ length: 7 }, (_, i) => {
    const cur = new Date(monday)
    cur.setDate(monday.getDate() + i)
    return toISO(cur)
  })
}

export function shiftDays(iso: string, delta: number): string {
  const d = parseISO(iso)
  d.setDate(d.getDate() + delta)
  return toISO(d)
}

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** "2026-08-27" -> { main: "8月27日", week: "周四" } */
export function formatDateParts(iso: string): { main: string; week: string } {
  const d = parseISO(iso)
  if (Number.isNaN(d.getTime())) return { main: iso, week: '' }
  return {
    main: `${d.getMonth() + 1}月${d.getDate()}日`,
    week: WEEKDAY_NAMES[d.getDay()],
  }
}
