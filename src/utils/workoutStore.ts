import { useState, useEffect, useCallback, useRef } from 'react'
import { Preferences } from '@capacitor/preferences'
import type { WorkoutPlan, PlanExercise } from '../types'

const PLANS_KEY = 'trainlog_plans'

/** 计划按日期索引：一天最多一份计划 */
export type PlanMap = Record<string, WorkoutPlan>

export async function loadPlans(): Promise<PlanMap> {
  const { value } = await Preferences.get({ key: PLANS_KEY })
  if (!value) return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? (parsed as PlanMap) : {}
  } catch {
    return {}
  }
}

async function persistPlans(plans: PlanMap): Promise<void> {
  await Preferences.set({ key: PLANS_KEY, value: JSON.stringify(plans) })
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

export function makeExercise(partial?: Partial<PlanExercise>): PlanExercise {
  return { name: '', sets: 3, reps: '8-12', weight: 20, ...partial }
}

export function usePlanStore() {
  const [plans, setPlans] = useState<PlanMap>({})
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  useEffect(() => {
    loadPlans().then((data) => {
      setPlans(data)
      setLoading(false)
      initialized.current = true
    })
  }, [])

  useEffect(() => {
    if (initialized.current) {
      persistPlans(plans).catch(() => {})
    }
  }, [plans])

  const savePlan = useCallback((date: string, exercises: PlanExercise[]): void => {
    setPlans((prev) => {
      const existing = prev[date]
      const next: PlanMap = {
        ...prev,
        [date]: {
          id: existing?.id ?? generateId(),
          date,
          exercises,
          createdAt: existing?.createdAt ?? Date.now(),
          updatedAt: Date.now(),
        },
      }
      return next
    })
  }, [])

  const removePlan = useCallback((date: string): void => {
    setPlans((prev) => {
      if (!prev[date]) return prev
      const next = { ...prev }
      delete next[date]
      return next
    })
  }, [])

  return { plans, loading, savePlan, removePlan }
}
