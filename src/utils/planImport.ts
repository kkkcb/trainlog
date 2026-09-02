import type { PlanExercise } from '../types'

export interface ParseResult {
  exercises: PlanExercise[]
  /** 无法识别而被跳过的行数 */
  skipped: number
}

/**
 * 解析粘贴的计划文本：每行一个动作。
 * 支持「卧推 4组 8-12次 40kg」「卧推 4x10 40」「深蹲 5*5」等写法；
 * 名字取行首非数字段，组数=第一个数，次数=区间取原样或第二个数，重量=带 kg/公斤 的数或最后一个数。
 */
export function parsePlanText(text: string): ParseResult {
  const exercises: PlanExercise[] = []
  let skipped = 0

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || line.startsWith('//')) continue

    // 名字：第一个数字之前的部分
    const firstDigit = line.search(/\d/)
    const name = (firstDigit === -1 ? line : line.slice(0, firstDigit))
      .replace(/[\s×xX*·:：\-—]+$/g, '')
      .trim()
    const nums = line.match(/\d+(?:\.\d+)?/g)

    if (!name || !nums || nums.length === 0) {
      skipped++
      continue
    }

    const sets = Math.min(20, Math.max(1, Math.round(Number(nums[0]))))

    // 次数：优先保留 "8-12" 区间写法
    const range = line.match(/(\d+)\s*[-~]\s*(\d+)/)
    const reps = range ? `${range[1]}-${range[2]}` : nums[1] != null ? String(Math.round(Number(nums[1]))) : '10'

    // 重量：优先带 kg/公斤 的数，否则取最后一个未被用作组数/次数的数
    const kgMatch = line.match(/(\d+(?:\.\d+)?)\s*(?:kg|公斤)/i)
    let weight = 0
    if (kgMatch) {
      weight = Number(kgMatch[1])
    } else if (nums.length >= 3) {
      weight = Number(nums[nums.length - 1])
    } else if (range && nums.length === 2) {
      // "4组 8-12"：两个数都被组数/次数用了，无重量
      weight = 0
    }

    exercises.push({
      name: name.slice(0, 10),
      sets,
      reps: reps.slice(0, 6),
      weight: Math.max(0, weight),
    })
  }

  return { exercises, skipped }
}
