import { useState, useEffect, useCallback } from 'react'
import type { TrainingRecord } from '../types'
import { loadRecords, saveRecords, deleteRecord as removeRecord } from '../utils/storage'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

function createRecord(date: string, partial?: Partial<TrainingRecord>): TrainingRecord {
  return {
    id: generateId(),
    date,
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...partial,
  }
}

export function useTrainingStore() {
  const [records, setRecords] = useState<Record<string, TrainingRecord>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecords().then((data) => {
      setRecords(data)
      setLoading(false)
    })
  }, [])

  const addRecord = useCallback(async (date: string, data?: Partial<TrainingRecord>): Promise<TrainingRecord> => {
    const record = createRecord(date, data)
    const updated = { ...records, [record.id]: record }
    setRecords(updated)
    await saveRecords(updated)
    return record
  }, [records])

  const updateRecord = useCallback(async (id: string, data: Partial<TrainingRecord>): Promise<void> => {
    const existing = records[id]
    if (!existing) return
    const updated = {
      ...existing,
      ...data,
      updatedAt: Date.now(),
    }
    const newRecords = { ...records, [id]: updated }
    setRecords(newRecords)
    await saveRecords(newRecords)
  }, [records])

  const deleteRecordById = useCallback(async (id: string): Promise<void> => {
    const updated = await removeRecord(id, records)
    setRecords(updated)
  }, [records])

  const getRecordsByDate = useCallback((date: string): TrainingRecord[] => {
    return Object.values(records)
      .filter((r) => r.date === date)
      .sort((a, b) => a.createdAt - b.createdAt)
  }, [records])

  const getTrainingDates = useCallback((year: number, month: number): Set<number> => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    const dates = new Set<number>()
    Object.values(records).forEach((r) => {
      if (r.date.startsWith(prefix)) {
        const day = parseInt(r.date.split('-')[2], 10)
        dates.add(day)
      }
    })
    return dates
  }, [records])

  const getTagsByDate = useCallback((year: number, month: number): Record<number, string[]> => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    const result: Record<number, string[]> = {}
    Object.values(records).forEach((r) => {
      if (r.date.startsWith(prefix) && r.tags.length > 0) {
        const day = parseInt(r.date.split('-')[2], 10)
        if (!result[day]) result[day] = []
        r.tags.forEach((tag) => {
          if (!result[day].includes(tag)) result[day].push(tag)
        })
      }
    })
    return result
  }, [records])

  return {
    records,
    loading,
    addRecord,
    updateRecord,
    deleteRecordById,
    getRecordsByDate,
    getTrainingDates,
    getTagsByDate,
  }
}
