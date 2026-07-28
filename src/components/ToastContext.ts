import { createContext } from 'react'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'info' | 'error'
}

interface ToastContextValue {
  show: (message: string, type?: ToastItem['type']) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
export type { ToastContextValue, ToastItem }
