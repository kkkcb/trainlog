import { useContext } from 'react'
import { ToastContext } from './ToastContext'

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return { show: () => {} }
  }
  return ctx
}
