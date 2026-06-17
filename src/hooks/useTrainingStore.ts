import { useState, useEffect, useCallback, useRef } from 'react'
import type { TrainingRecord } from '../types'
import { loadRecords, saveRecords } from '../utils/storage'

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
  const initialized = useRef(false)

  useEffect(() => {
    loadRecords().then((data) => {
      setRecords(data)
      setLoading(false)
      initialized.current = true
    })
  }, [])

  useEffect(() => {
    if (initialized.current) {
      saveRecords(records)
    }
  }, [records])

  const addRecord = useCallback((date: string, data?: Partial<TrainingRecord>): TrainingRecord => {
    const record = createRecord(date, data)
    setRecords((prev) => ({ ...prev, [record.id]: record }))
    return record
  }, [])

  const updateRecord = useCallback((id: string, data: Partial<TrainingRecord>): void => {
    setRecords((prev) => {
      const existing = prev[id]
      if (!existing) return prev
      return { ...prev, [id]: { ...existing, ...data, updatedAt: Date.now() } }
    })
  }, [])

  const deleteRecordById = useCallback((id: string): void => {
    setRecords((prev) => {
      if (!prev[id]) return prev
      const updated = { ...prev }
      delete updated[id]
      return updated
    })
  }, [])

  const reload = useCallback((): void => {
    loadRecords().then((data) => {
      setRecords(data)
    })
  }, [])

  return {
    records,
    loading,
    addRecord,
    updateRecord,
    deleteRecordById,
    reload,
  }
}
