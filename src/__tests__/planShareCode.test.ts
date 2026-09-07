import { describe, it, expect } from 'vitest'
import { encodePlan, decodePlan } from '../utils/planShareCode'

const PLAN = [
  { name: '卧推', sets: 4, reps: '8-12', weight: 40 },
  { name: '自定义动作', sets: 3, reps: '10', weight: 0 },
  { name: '硬拉', sets: 5, reps: '5', weight: 80 },
]

describe('计划分享码', () => {
  it('编码 → 解码还原', () => {
    const code = encodePlan(PLAN)
    expect(code.startsWith('TL1.')).toBe(true)
    const back = decodePlan(code)
    expect(back).toEqual(PLAN)
  })

  it('换行/空格污染后仍可解码', () => {
    const code = encodePlan(PLAN)
    const dirty = `  照这个练：\n${code}\n加油！ `
    expect(decodePlan(dirty)).toEqual(PLAN)
  })

  it('非法输入返回 null', () => {
    expect(decodePlan('随便写的')).toBeNull()
    expect(decodePlan('TL1.!!!')).toBeNull()
    expect(decodePlan('TL1.W10vbg==')).toBeNull()
  })

  it('字段越界被夹紧', () => {
    const code = encodePlan([{ name: '深蹲', sets: 99, reps: '999999', weight: -5 }])
    const back = decodePlan(code)!
    expect(back[0].sets).toBe(20)
    expect(back[0].weight).toBe(0)
  })
})
