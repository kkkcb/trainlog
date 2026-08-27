import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ToastContext, type ToastContextValue, type ToastItem } from './ToastContext'
import { Icon, type IconName } from './icons'
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

const TOAST_ICONS: Record<ToastItem['type'], IconName> = {
  success: 'check',
  error: 'close',
  info: 'info',
}

function Toast({ item }: { item: ToastItem }) {
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setLeaving(true), 1500)
    return () => window.clearTimeout(timer)
  }, [])
  return (
    <div className={`toast toast--${item.type} ${leaving ? 'toast--leave' : ''}`}>
      <span className="toast__icon">
        <Icon name={TOAST_ICONS[item.type] ?? 'check'} size={10} strokeWidth={3} />
      </span>
      <span className="toast__msg">{item.message}</span>
    </div>
  )
}
