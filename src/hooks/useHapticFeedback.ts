import { useCallback } from 'react'

interface HapticOptions {
  enabled?: boolean
}

export function useHapticFeedback(options: HapticOptions = {}) {
  const { enabled = true } = options

  const trigger = useCallback((pattern: number | number[] = 10) => {
    if (!enabled) return
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern)
      } catch {
        // ignore
      }
    }
  }, [enabled])

  const onTap = useCallback(() => {
    trigger(8)
  }, [trigger])

  const onSelect = useCallback(() => {
    trigger(12)
  }, [trigger])

  const onSuccess = useCallback(() => {
    trigger([10, 30, 10])
  }, [trigger])

  return { trigger, onTap, onSelect, onSuccess }
}
