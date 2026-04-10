import { Preferences } from '@capacitor/preferences'

const STORAGE_KEY = 'trainlog_records'

export async function loadRecords(): Promise<Record<string, import('../types').TrainingRecord>> {
  const { value } = await Preferences.get({ key: STORAGE_KEY })
  if (value) {
    try {
      return JSON.parse(value)
    } catch {
      return {}
    }
  }
  return {}
}

export async function saveRecords(records: Record<string, import('../types').TrainingRecord>): Promise<void> {
  await Preferences.set({
    key: STORAGE_KEY,
    value: JSON.stringify(records),
  })
}

export async function deleteRecord(
  id: string,
  currentRecords: Record<string, import('../types').TrainingRecord>
): Promise<Record<string, import('../types').TrainingRecord>> {
  const updated = { ...currentRecords }
  delete updated[id]
  await saveRecords(updated)
  return updated
}
