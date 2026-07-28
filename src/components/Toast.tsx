import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ToastContext, type ToastContextValue, type ToastItem } from './ToastContext'
import './Toast.css'

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((message: string, type: ToastItem['type'] = 'success') => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 1800)
  }, [])

  const value: ToastContextValue = { show }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast key={t.id} item={t} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function Toast({ item }: { item: ToastItem }) {
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setLeaving(true), 1500)
    return () => window.clearTimeout(timer)
  }, [])
  const icon = item.type === 'success' ? '✓' : item.type === 'error' ? '✕' : '•'
  return (
    <div className={`toast toast--${item.type} ${leaving ? 'toast--leave' : ''}`}>
      <span className="toast__icon">{icon}</span>
      <span className="toast__msg">{item.message}</span>
    </div>
  )
}
