import { useEffect, useRef } from 'react'
import './BottomSheet.css'

interface BottomSheetProps {
  isOpen: boolean
  title: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export function BottomSheet({
  isOpen,
  title,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  danger = false,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="bottom-sheet-overlay" onClick={onCancel}>
      <div
        ref={sheetRef}
        className={`bottom-sheet ${danger ? 'bottom-sheet--danger' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bottom-sheet__handle" />
        <div className="bottom-sheet__content">
          <p className="bottom-sheet__title">{title}</p>
        </div>
        <div className="bottom-sheet__actions">
          {danger ? (
            <>
              <button className="bottom-sheet__btn bottom-sheet__btn--cancel" onClick={onCancel}>
                {cancelText}
              </button>
              <button className="bottom-sheet__btn bottom-sheet__btn--confirm" onClick={onConfirm}>
                {confirmText}
              </button>
            </>
          ) : (
            <>
              <button className="bottom-sheet__btn bottom-sheet__btn--confirm" onClick={onConfirm}>
                {confirmText}
              </button>
              <button className="bottom-sheet__btn bottom-sheet__btn--cancel" onClick={onCancel}>
                {cancelText}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
