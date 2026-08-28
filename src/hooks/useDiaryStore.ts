import { useCallback, useEffect, useState } from 'react'
import type { DiaryEntry } from '../types'
import { loadDiary, saveDiary } from '../utils/storage'

export function useDiaryStore() {
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<DiaryEntry[]>([])

  const reload = useCallback(async () => {
    const list = await loadDiary()
    // 新的在前
    list.sort((a, b) => b.createdAt - a.createdAt)
    setEntries(list)
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const persist = useCallback(async (list: DiaryEntry[]) => {
    await saveDiary(list)
    setEntries(list)
  }, [])

  const addEntry = useCallback(
    async (text: string, tag: string) => {
      const now = Date.now()
      const entry: DiaryEntry = {
        id: `d${now}-${Math.random().toString(36).slice(2, 8)}`,
        text,
        tag,
        createdAt: now,
        updatedAt: now,
      }
      await persist([entry, ...entries])
      return entry
    },
    [entries, persist]
  )

  const updateEntry = useCallback(
    async (id: string, text: string, tag: string) => {
      await persist(
        entries.map((e) => (e.id === id ? { ...e, text, tag, updatedAt: Date.now() } : e))
      )
    },
    [entries, persist]
  )

  const removeEntry = useCallback(
    async (id: string) => {
      await persist(entries.filter((e) => e.id !== id))
    },
    [entries, persist]
  )

  return { loading, entries, addEntry, updateEntry, removeEntry, reload }
}
