import type { PlanExercise } from '../types'

/**
 * 计划分享码：把动作列表编码成可文本传递的短码。
 * 格式：TL1.<base64url(JSON)>，TL1=版本标识。
 * JSON: { n: 名字, s: 组数, r: 次数, w: 重量 }，w 省略表示 0。
 */
const PREFIX = 'TL1.'

function toBase64Url(s: string): string {
  const b64 = btoa(unescape(encodeURIComponent(s)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  return decodeURIComponent(escape(atob(b64)))
}

export function encodePlan(exercises: PlanExercise[]): string {
  const payload = exercises.map((e) => {
    const item: Record<string, string | number> = { n: e.name, s: e.sets, r: e.reps }
    if (e.weight > 0) item.w = e.weight
    return item
  })
  return PREFIX + toBase64Url(JSON.stringify(payload))
}

export function decodePlan(code: string): PlanExercise[] | null {
  // 从任意文本中抽取分享码（微信消息里会带前后文/换行）
  const m = code.match(/TL1\.[A-Za-z0-9_-]+/)
  if (!m) return null
  const body = m[0]
  try {
    const arr = JSON.parse(fromBase64Url(body.slice(PREFIX.length))) as Array<{
      n?: unknown
      s?: unknown
      r?: unknown
      w?: unknown
    }>
    if (!Array.isArray(arr) || arr.length === 0) return null
    const out: PlanExercise[] = []
    for (const item of arr) {
      if (typeof item.n !== 'string' || !item.n.trim()) continue
      out.push({
        name: item.n.trim().slice(0, 10),
        sets: Math.min(20, Math.max(1, Math.round(Number(item.s) || 3))),
        reps: typeof item.r === 'string' ? item.r.slice(0, 6) : '8-12',
        weight: Math.max(0, Number(item.w) || 0),
      })
    }
    return out.length > 0 ? out : null
  } catch {
    return null
  }
}
