import { useEffect, useRef, useState } from 'react'
import { useHapticFeedback } from '../hooks/useHapticFeedback'
import { loadAIConfig, renderContext, chatWithLife, type ChatTurn, type LifeContext } from '../utils/life'
import avatarImg from '../assets/avatar.jpg'
import './AvatarChat.css'

interface AvatarChatProps {
  open: boolean
  onClose: () => void
  context: LifeContext
}

export function AvatarChat({ open, onClose, context }: AvatarChatProps) {
  const haptic = useHapticFeedback()
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // 打开时自动打招呼
  useEffect(() => {
    if (open && turns.length === 0) {
      const greet =
        context.todayCount > 0
          ? `今天练了 ${context.todayCount} 次，状态不错啊。`
          : '来了？今天还没练，先动起来。'
      setTurns([{ role: 'assistant', content: greet }])
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [turns, thinking])

  if (!open) return null

  const send = async () => {
    const text = input.trim()
    if (!text || thinking) return
    haptic.onTap()
    setError(null)
    const history: ChatTurn[] = [...turns, { role: 'user', content: text }]
    setTurns(history)
    setInput('')
    setThinking(true)
    try {
      const config = await loadAIConfig()
      const reply = await chatWithLife(config, renderContext(context), history.slice(-8))
      haptic.onSuccess()
      setTurns((t) => [...t, { role: 'assistant', content: reply }])
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      haptic.onSelect()
    } finally {
      setThinking(false)
    }
  }

  return (
    <div className="life-overlay" onClick={onClose}>
      <div className="life-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="life-head">
          <img className="life-avatar" src={avatarImg} alt="" draggable={false} />
          <div className="life-head-info">
            <span className="life-name">另一个你</span>
            <span className={`life-status ${thinking ? 'life-status--thinking' : ''}`}>
              {thinking ? '正在想…' : '在线'}
            </span>
          </div>
          <button className="life-close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className="life-list" ref={listRef}>
          {turns.map((t, i) => (
            <div key={i} className={`life-msg life-msg--${t.role}`}>
              {t.content}
            </div>
          ))}
          {thinking && (
            <div className="life-msg life-msg--assistant life-msg--typing">
              <span /><span /><span />
            </div>
          )}
          {error && <div className="life-error">{error}</div>}
        </div>

        <div className="life-inputrow">
          <input
            className="life-input"
            placeholder="跟自己说点什么…"
            value={input}
            maxLength={200}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') send()
            }}
          />
          <button
            className={`life-send ${input.trim() ? 'life-send--on' : ''}`}
            onClick={send}
            disabled={!input.trim() || thinking}
            aria-label="发送"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}
