import { useState, useEffect, useCallback } from 'react'
import { Preferences } from '@capacitor/preferences'
import { DEFAULT_TAGS } from '../types'

const TAGS_KEY = 'trainlog_preset_tags'

async function loadPresetTags(): Promise<string[]> {
  const { value } = await Preferences.get({ key: TAGS_KEY })
  if (value) {
    try {
      return JSON.parse(value)
    } catch {
      return [...DEFAULT_TAGS]
    }
  }
  return [...DEFAULT_TAGS]
}

async function savePresetTags(tags: string[]): Promise<void> {
  await Preferences.set({ key: TAGS_KEY, value: JSON.stringify(tags) })
}

export function useTagSettings() {
  const [presetTags, setPresetTags] = useState<string[]>(DEFAULT_TAGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadPresetTags().then((tags) => {
      setPresetTags(tags)
      setLoaded(true)
    })
  }, [])

  const addPresetTag = useCallback(async (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed || presetTags.includes(trimmed)) return
    const updated = [...presetTags, trimmed]
    setPresetTags(updated)
    await savePresetTags(updated)
  }, [presetTags])

  const removePresetTag = useCallback(async (tag: string) => {
    const updated = presetTags.filter((t) => t !== tag)
    setPresetTags(updated)
    await savePresetTags(updated)
  }, [presetTags])

  return {
    presetTags,
    loaded,
    addPresetTag,
    removePresetTag,
  }
}
