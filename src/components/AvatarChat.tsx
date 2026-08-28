import { useEffect, useRef, useState } from 'react'
import { useHapticFeedback } from '../hooks/useHapticFeedback'
import {
  loadAIConfig,
  renderContext,
  chatWithLife,
  loadLifeMessages,
  saveLifeMessages,
  clearLifeMessages,
  newMsgId,
  type ChatTurn,
  type LifeContext,
  type LifeMessage,
} from '../utils/life'
import avatarImg from '../assets/avatar.jpg'
import './AvatarChat.css'

interface AvatarChatProps {
  open: boolean
  onClose: () => void
  context: LifeContext
}

const GREETING_TODAY = (n: number) =>
  n > 0 ? `今天练了 ${n} 次，可以，别飘。` : '来了？今天还没练，先动起来。'

export function AvatarChat({ open, onClose, context }: AvatarChatProps) {
  const haptic = useHapticFeedback()
  const [msgs, setMsgs] = useState<LifeMessage[]>([])
  const [loaded, setLoaded] = useState(false)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openReason, setOpenReason] = useState<Record<string, boolean>>({})
  const listRef = useRef<HTMLDivElement>(null)

  // 挂载：读取历史会话
  useEffect(() => {
    if (!open || loaded) return
    loadLifeMessages()
      .then((list) => {
        if (list.length > 0) {
          setMsgs(list)
        } else {
          setMsgs([
            {
              id: newMsgId(),
              role: 'assistant',
              content: GREETING_TODAY(context.todayCount),
              at: Date.now(),
            },
          ])
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [open, loaded, context.todayCount])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, thinking])

  if (!open) return null

  const persist = (list: LifeMessage[]) => {
    setMsgs(list)
    saveLifeMessages(list).catch(() => {})
  }

  const lastAssistantId = [...msgs].reverse().find((m) => m.role === 'assistant')?.id

  /** 发送 / 重试 共用核心 */
  const runCompletion = async (history: LifeMessage[]) => {
    setThinking(true)
    setError(null)
    try {
      const config = await loadAIConfig()
      const apiHistory: ChatTurn[] = history.map((m) => ({ role: m.role, content: m.content }))
      const { content, reasoning } = await chatWithLife(
        config,
        renderContext(context),
        apiHistory.slice(-8)
      )
      haptic.onSuccess()
      persist([
        ...history,
        {
          id: newMsgId(),
          role: 'assistant',
          content,
          reasoning: reasoning || undefined,
          at: Date.now(),
        },
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      haptic.onSelect()
    } finally {
      setThinking(false)
    }
  }

  const send = async () => {
    const text = input.trim()
    if (!text || thinking) return
    haptic.onTap()
    setError(null)
    const userMsg: LifeMessage = {
      id: newMsgId(),
      role: 'user',
      content: text,
      at: Date.now(),
    }
    const next = [...msgs, userMsg]
    setMsgs(next)
    setInput('')
    await runCompletion(next)
  }

  /** 重试最后一条回复 */
  const handleRetry = async () => {
    if (thinking) return
    const last = [...msgs].reverse().find((m) => m.role === 'assistant')
    if (!last) return
    const idx = msgs.findIndex((m) => m.id === last.id)
    const trimmed = msgs.slice(0, idx)
    persist(trimmed)
    haptic.onTap()
    await runCompletion(trimmed)
  }

  /** 删除单条消息 */
  const handleDelete = (id: string) => {
    haptic.onTap()
    persist(msgs.filter((m) => m.id !== id))
  }

  /** 清空对话 */
  const handleClear = () => {
    haptic.onSelect()
    clearLifeMessages().catch(() => {})
    setMsgs([
      {
        id: newMsgId(),
        role: 'assistant',
        content: GREETING_TODAY(context.todayCount),
        at: Date.now(),
      },
    ])
    setError(null)
  }

  return (
    <div className="life-overlay" onClick={onClose}>
      <div className="life-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="life-head">
          <img className="life-avatar" src={avatarImg} alt="" draggable={false} />
          <div className="life-head-info">
            <span className="life-name">kei</span>
            <span className={`life-status ${thinking ? 'life-status--thinking' : ''}`}>
              {thinking ? '正在想…' : '在线'}
            </span>
          </div>
          <button className="life-iconbtn" onClick={handleClear} aria-label="清空对话" title="清空对话">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
          <button className="life-iconbtn" onClick={onClose} aria-label="关闭" title="关闭">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="life-list" ref={listRef}>
          {msgs.map((m) => {
            const isLastAssistant = m.role === 'assistant' && m.id === lastAssistantId
            return (
              <div key={m.id} className={`life-msg-wrap life-msg-wrap--${m.role}`}>
                {m.role === 'assistant' && m.reasoning && (
                  <div className="life-reason">
                    <button
                      className="life-reason__toggle"
                      onClick={() => setOpenReason((s) => ({ ...s, [m.id]: !s[m.id] }))}
                    >
                      ✦ 已深度思考 <span className="life-reason__chev">{openReason[m.id] ? '▾' : '▸'}</span>
                    </button>
                    {openReason[m.id] && (
                      <div className="life-reason__body">{m.reasoning}</div>
                    )}
                  </div>
                )}
                <div className={`life-msg life-msg--${m.role}`}>{m.content}</div>
                <div className="life-msg__ops">
                  <button onClick={() => handleDelete(m.id)} aria-label="删除这条">
                    删除
                  </button>
                  {isLastAssistant && !thinking && (
                    <button onClick={handleRetry}>重试</button>
                  )}
                </div>
              </div>
            )
          })}
          {thinking && msgs[msgs.length - 1]?.role === 'user' && (
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
