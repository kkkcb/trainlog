import { Preferences } from '@capacitor/preferences'

/** 宠物军团显示设置：主宠 + 各小伙伴独立开关，持久化本机 */

const KEY = 'trainlog_pet_settings'

export interface PetSettings {
  /** 主宠（四阶进化） */
  showMain: boolean
  /** 小伙伴开关，键为 kind；缺省 = 开启 */
  enabledMinis: Record<string, boolean>
}

export const DEFAULT_PET_SETTINGS: PetSettings = {
  showMain: true,
  enabledMinis: {},
}

export async function loadPetSettings(): Promise<PetSettings> {
  const { value } = await Preferences.get({ key: KEY })
  if (!value) return { ...DEFAULT_PET_SETTINGS, enabledMinis: {} }
  try {
    const parsed = JSON.parse(value)
    return { ...DEFAULT_PET_SETTINGS, ...parsed, enabledMinis: parsed.enabledMinis ?? {} }
  } catch {
    return { ...DEFAULT_PET_SETTINGS, enabledMinis: {} }
  }
}

export async function savePetSettings(s: PetSettings): Promise<void> {
  await Preferences.set({ key: KEY, value: JSON.stringify(s) })
}

export function isMiniEnabled(s: PetSettings, kind: string): boolean {
  return s.enabledMinis[kind] !== false
}
