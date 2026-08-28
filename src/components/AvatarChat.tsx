import { useEffect, useRef, useState } from 'react'
import { useHapticFeedback } from '../hooks/useHapticFeedback'
import {
  loadAIConfig,
  renderContext,
  chatWithLife,
  loadLifeSessions,
  saveLifeSessions,
  newMsgId,
  type ChatTurn,
  type LifeContext,
  type LifeMessage,
  type LifeSession,
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

function fmtSessionTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  if (d.toDateString() === now.toDateString()) return hm
  return `${sameYear ? '' : d.getFullYear() + '/'}${d.getMonth() + 1}月${d.getDate()}日`
}

export function AvatarChat({ open, onClose, context }: AvatarChatProps) {
  const haptic = useHapticFeedback()
  const [msgs, setMsgs] = useState<LifeMessage[]>([])
  const [sessions, setSessions] = useState<LifeSession[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openReason, setOpenReason] = useState<Record<string, boolean>>({})
  const listRef = useRef<HTMLDivElement>(null)
  const activeIdRef = useRef<string | null>(null)
  activeIdRef.current = activeId

  // 挂载：恢复最近一场对话（或新会话问候）
  useEffect(() => {
    if (!open || loaded) return
    loadLifeSessions()
      .then((list) => {
        setSessions(list)
        if (list.length > 0) {
          setMsgs(list[0].messages)
          setActiveId(list[0].id)
        } else {
          setMsgs([{ id: newMsgId(), role: 'assistant', content: GREETING_TODAY(context.todayCount), at: Date.now() }])
          setActiveId(null)
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [open, loaded, context.todayCount])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, thinking])

  if (!open) return null

  /** 持久化当前视图：有用户消息则 upsert 会话，否则不落库 */
  const persist = (list: LifeMessage[]) => {
    setMsgs(list)
    const hasUser = list.some((m) => m.role === 'user')
    let next = sessions
    if (hasUser) {
      const id = activeIdRef.current ?? newMsgId()
      const existing = sessions.find((s) => s.id === id)
      const sess: LifeSession = {
        id,
        title: (list.find((m) => m.role === 'user')?.content ?? '对话').slice(0, 14),
        messages: list,
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      }
      next = [sess, ...sessions.filter((s) => s.id !== id)]
      setActiveId(id)
      activeIdRef.current = id
    } else if (activeIdRef.current) {
      next = sessions.filter((s) => s.id !== activeIdRef.current)
      setActiveId(null)
      activeIdRef.current = null
    }
    setSessions(next)
    saveLifeSessions(next).catch(() => {})
  }

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
          reasoning: config.thinkingEnabled && reasoning ? reasoning : undefined,
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
    const userMsg: LifeMessage = { id: newMsgId(), role: 'user', content: text, at: Date.now() }
    const next = [...msgs, userMsg]
    setMsgs(next)
    setInput('')
    await runCompletion(next)
  }

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

  const handleDeleteMsg = (id: string) => {
    haptic.onTap()
    persist(msgs.filter((m) => m.id !== id))
  }

  /** 新建对话：若当前会话已落库则从列表移除记录后重置 */
  const startNewSession = () => {
    haptic.onSelect()
    if (activeIdRef.current) {
      const next = sessions.filter((s) => s.id !== activeIdRef.current)
      setSessions(next)
      saveLifeSessions(next).catch(() => {})
      setActiveId(null)
      activeIdRef.current = null
    }
    setMsgs([{ id: newMsgId(), role: 'assistant', content: GREETING_TODAY(context.todayCount), at: Date.now() }])
    setError(null)
    setShowHistory(false)
  }

  const switchSession = (s: LifeSession) => {
    haptic.onTap()
    setMsgs(s.messages)
    setActiveId(s.id)
    activeIdRef.current = s.id
    setError(null)
    setShowHistory(false)
  }

  const deleteSession = (id: string) => {
    haptic.onTap()
    const next = sessions.filter((s) => s.id !== id)
    setSessions(next)
    saveLifeSessions(next).catch(() => {})
    if (activeIdRef.current === id) {
      setActiveId(null)
      activeIdRef.current = null
      setMsgs([{ id: newMsgId(), role: 'assistant', content: GREETING_TODAY(context.todayCount), at: Date.now() }])
      setShowHistory(false)
    }
  }

  const lastAssistantId = [...msgs].reverse().find((m) => m.role === 'assistant')?.id

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
          <button
            className={`life-iconbtn ${showHistory ? 'life-iconbtn--on' : ''}`}
            onClick={() => {
              haptic.onTap()
              setShowHistory((v) => !v)
            }}
            aria-label="对话历史"
            title="对话历史"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="8" y1="9" x2="16" y2="9" />
              <line x1="8" y1="13" x2="13" y2="13" />
            </svg>
          </button>
          <button className="life-iconbtn" onClick={startNewSession} aria-label="新建对话" title="新建对话">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button className="life-iconbtn" onClick={onClose} aria-label="关闭" title="关闭">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="life-list-wrap">
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
                      {openReason[m.id] && <div className="life-reason__body">{m.reasoning}</div>}
                    </div>
                  )}
                  <div className={`life-msg life-msg--${m.role}`}>{m.content}</div>
                  <div className="life-msg__ops">
                    <button onClick={() => handleDeleteMsg(m.id)} aria-label="删除这条">
                      删除
                    </button>
                    {isLastAssistant && !thinking && <button onClick={handleRetry}>重试</button>}
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

          {/* 会话历史抽屉 */}
          {showHistory && (
            <div className="life-history">
              <div className="life-history__head">
                <span>对话历史</span>
                <button className="life-history__new" onClick={startNewSession}>
                  ＋ 新对话
                </button>
              </div>
              <div className="life-history__list">
                {sessions.length === 0 ? (
                  <p className="life-history__empty">还没有历史对话</p>
                ) : (
                  sessions.map((s) => (
                    <div
                      key={s.id}
                      className={`life-hitem ${s.id === activeId ? 'life-hitem--on' : ''}`}
                      onClick={() => switchSession(s)}
                    >
                      <div className="life-hitem__main">
                        <span className="life-hitem__title">{s.title}</span>
                        <span className="life-hitem__meta">
                          {fmtSessionTime(s.updatedAt)} · {s.messages.filter((m) => m.role === 'user').length} 问
                        </span>
                      </div>
                      <button
                        className="life-hitem__del"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSession(s.id)
                        }}
                        aria-label="删除这场对话"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
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
