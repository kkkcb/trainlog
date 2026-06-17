import { useState, useEffect, useCallback, useRef } from 'react'
import { Preferences } from '@capacitor/preferences'
import { DEFAULT_TAG_DEFINITIONS } from '../types'
import type { TagDefinition, MetricType } from '../types'

const TAGS_KEY = 'trainlog_preset_tags'
const TAG_DEFS_KEY = 'trainlog_tag_definitions'

async function loadTagDefinitions(): Promise<TagDefinition[]> {
  const { value } = await Preferences.get({ key: TAG_DEFS_KEY })
  if (value) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed
    } catch {
      return [...DEFAULT_TAG_DEFINITIONS]
    }
  }
  const { value: legacyValue } = await Preferences.get({ key: TAGS_KEY })
  if (legacyValue) {
    try {
      const names: string[] = JSON.parse(legacyValue)
      return names.map((name) => ({ name, metrics: [] as MetricType[] }))
    } catch {
      return [...DEFAULT_TAG_DEFINITIONS]
    }
  }
  return [...DEFAULT_TAG_DEFINITIONS]
}

async function saveTagDefinitions(tags: TagDefinition[]): Promise<void> {
  await Preferences.set({ key: TAG_DEFS_KEY, value: JSON.stringify(tags) })
}

export function useTagSettings() {
  const [tagDefinitions, setTagDefinitions] = useState<TagDefinition[]>(DEFAULT_TAG_DEFINITIONS)
  const initialized = useRef(false)

  useEffect(() => {
    loadTagDefinitions().then((defs) => {
      setTagDefinitions(defs)
      initialized.current = true
    })
  }, [])

  useEffect(() => {
    if (initialized.current) {
      saveTagDefinitions(tagDefinitions)
    }
  }, [tagDefinitions])

  const addTag = useCallback((def: TagDefinition): void => {
    setTagDefinitions((prev) => {
      if (prev.some((t) => t.name === def.name)) return prev
      return [...prev, def]
    })
  }, [])

  const removeTag = useCallback((name: string): void => {
    setTagDefinitions((prev) => prev.filter((t) => t.name !== name))
  }, [])

  const updateTagMetrics = useCallback((name: string, metrics: MetricType[]): void => {
    setTagDefinitions((prev) => prev.map((t) => (t.name === name ? { ...t, metrics } : t)))
  }, [])

  return {
    tagDefinitions,
    presetTagNames: tagDefinitions.map((t) => t.name),
    addTag,
    removeTag,
    updateTagMetrics,
  }
}
