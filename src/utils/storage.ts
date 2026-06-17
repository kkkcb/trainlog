import { Preferences } from '@capacitor/preferences'
import type { TrainingRecord } from '../types'

const STORAGE_KEY = 'trainlog_records'
const BACKUP_KEY = 'trainlog_records_backup'

type LegacyRecord = Omit<TrainingRecord, 'tags'> & { tags: string[] | TrainingRecord['tags'] }
type RawRecords = Record<string, LegacyRecord>

function migrateOne(record: LegacyRecord): TrainingRecord {
  if (
    record.tags &&
    Array.isArray(record.tags) &&
    record.tags.length > 0 &&
    typeof record.tags[0] === 'string'
  ) {
    return { ...record, tags: (record.tags as string[]).map((name) => ({ name })) }
  }
  return record as TrainingRecord
}

export async function loadRecords(): Promise<Record<string, TrainingRecord>> {
  const { value } = await Preferences.get({ key: STORAGE_KEY })
  if (!value) return {}

  let parsed: RawRecords
  try {
    parsed = JSON.parse(value)
  } catch {
    await Preferences.set({ key: BACKUP_KEY, value })
    return {}
  }

  const migrated: Record<string, TrainingRecord> = {}
  for (const [id, record] of Object.entries(parsed)) {
    try {
      migrated[id] = migrateOne(record)
    } catch {
      migrated[id] = record as unknown as TrainingRecord
    }
  }

  await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(migrated) })
  return migrated
}

export async function saveRecords(records: Record<string, TrainingRecord>): Promise<void> {
  const value = JSON.stringify(records)
  await Preferences.set({ key: STORAGE_KEY, value })
  await Preferences.set({ key: BACKUP_KEY, value })
}

export interface ExportPayload {
  version: 1
  exportedAt: number
  records: Record<string, TrainingRecord>
  tagDefinitions: unknown
}

export async function exportAllData(tagDefinitions: unknown): Promise<string> {
  const { value: recordsValue } = await Preferences.get({ key: STORAGE_KEY })
  let records: Record<string, TrainingRecord> = {}
  if (recordsValue) {
    try {
      records = JSON.parse(recordsValue)
    } catch {
      records = {}
    }
  }
  const payload: ExportPayload = {
    version: 1,
    exportedAt: Date.now(),
    records,
    tagDefinitions,
  }
  return JSON.stringify(payload, null, 2)
}

export async function importAllData(json: string): Promise<ExportPayload> {
  const parsed = JSON.parse(json) as ExportPayload
  if (!parsed || typeof parsed !== 'object' || !parsed.records) {
    throw new Error('数据格式不正确')
  }
  const migrated: Record<string, TrainingRecord> = {}
  for (const [id, record] of Object.entries(parsed.records)) {
    try {
      migrated[id] = migrateOne(record as LegacyRecord)
    } catch {
      migrated[id] = record as TrainingRecord
    }
  }
  await saveRecords(migrated)
  return { ...parsed, records: migrated }
}
