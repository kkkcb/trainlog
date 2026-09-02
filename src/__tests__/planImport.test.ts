import { describe, it, expect } from 'vitest'
import { parsePlanText } from '../utils/planImport'

describe('parsePlanText 计划文本导入', () => {
  it('解析标准写法：卧推 4组 8-12次 40kg', () => {
    const r = parsePlanText('卧推 4组 8-12次 40kg')
    expect(r.exercises).toHaveLength(1)
    expect(r.exercises[0]).toEqual({ name: '卧推', sets: 4, reps: '8-12', weight: 40 })
  })

  it('解析紧凑写法：深蹲 5x5 100', () => {
    const r = parsePlanText('深蹲 5x5 100')
    expect(r.exercises[0]).toEqual({ name: '深蹲', sets: 5, reps: '5', weight: 100 })
  })

  it('解析无重量写法：引体向上 4组x8', () => {
    const r = parsePlanText('引体向上 4组x8')
    expect(r.exercises[0]).toEqual({ name: '引体向上', sets: 4, reps: '8', weight: 0 })
  })

  it('多行批量解析并跳过空行/注释/无效行', () => {
    const r = parsePlanText(`
# 周一推日
卧推 4组 8-12 40kg

上斜卧推 3x10 30kg
这行没有数字
// 备注
硬拉 3组5次 80公斤
`)
    expect(r.exercises.map((e) => e.name)).toEqual(['卧推', '上斜卧推', '硬拉'])
    expect(r.exercises[2]).toEqual({ name: '硬拉', sets: 3, reps: '5', weight: 80 })
    expect(r.skipped).toBe(1)
  })

  it('全无效输入返回空', () => {
    expect(parsePlanText('随便写写\n哈哈哈').exercises).toHaveLength(0)
  })
})
