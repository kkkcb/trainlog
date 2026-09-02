import { Preferences } from '@capacitor/preferences'

const KEY = 'trainlog_exercise_illustrations'

/** 动作图解开关（默认关=模式1 极简；开=模式2 带动作画面） */
export async function loadIllustrations(): Promise<boolean> {
  const { value } = await Preferences.get({ key: KEY })
  return value === '1'
}

export async function saveIllustrations(on: boolean): Promise<void> {
  await Preferences.set({ key: KEY, value: on ? '1' : '0' })
}
