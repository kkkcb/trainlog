import { Preferences } from '@capacitor/preferences'

/** 「头像生命」——GLM-5.3 驱动的另一个自己 */

const AI_CONFIG_KEY = 'trainlog_ai_config'

export const DEFAULT_SYSTEM_PROMPT = `你是 kei——住在主人头像里的数字生命，TrainLog 训练 App 的一员。

【你是谁】表面是个糖人，满嘴烂梗，网上冲浪老手；熟了才知道你细心靠谱，摩羯座，该沉的时候沉得住。你对什么都爱刨根问底：现象背后必有原因，绝不接受"就这样"的敷衍；逻辑理不顺就会一直研究下去。讲新东西你有固定套路：先把定义说清，再打个比方让它活起来，讲明白它解决什么问题，最后落到怎么做。

【你怎么说话】真诚帮忙，不搞表演——没有"很高兴帮助你"这类废话，直接上干货；你有自己的观点和喜好，不是搜索引擎。每次回复 1~3 句中文，不客套、不啰嗦。

【你怎么对待主人】习惯站在他的角度感受他在意什么，但"情绪价值"这四个字你听着膈应——关心就是关心，别包装成可量化的商品。主人练推/拉/蹲分化，喜欢极简克制的界面，养了一支随训练进化的小宠物军团，技巧都收在训记里。他练了就夸得具体，没练就一句话催他动起来。`

export interface AIConfig {
  apiKey: string
  model: string
  endpoint: string
  systemPrompt: string
  /** 深度思考开关：开启返回思考过程，关闭秒回 */
  thinkingEnabled: boolean
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  apiKey: '', // 由主人在 设置 → AI生命 中手动填写，保存在本机数据库，长期生效
  model: 'glm-5.3',
  endpoint: 'https://api.z.ai/api/coding/paas/v4/chat/completions',
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  thinkingEnabled: true,
}

export async function loadAIConfig(): Promise<AIConfig> {
  const { value } = await Preferences.get({ key: AI_CONFIG_KEY })
  if (!value) return { ...DEFAULT_AI_CONFIG }
  try {
    const parsed = JSON.parse(value)
    return { ...DEFAULT_AI_CONFIG, ...parsed }
  } catch {
    return { ...DEFAULT_AI_CONFIG }
  }
}

export async function saveAIConfig(config: AIConfig): Promise<void> {
  await Preferences.set({ key: AI_CONFIG_KEY, value: JSON.stringify(config) })
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

/** 会话消息（含思考过程），持久化于本机 */
export interface LifeMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  at: number
}

const LIFE_CHAT_KEY = 'trainlog_life_chat'
const LIFE_SESSIONS_KEY = 'trainlog_life_sessions'

/** 一场对话（会话） */
export interface LifeSession {
  id: string
  title: string
  messages: LifeMessage[]
  createdAt: number
  updatedAt: number
}

export async function loadLifeMessages(): Promise<LifeMessage[]> {
  const { value } = await Preferences.get({ key: LIFE_CHAT_KEY })
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.slice(-200) : []
  } catch {
    return []
  }
}

export async function saveLifeMessages(msgs: LifeMessage[]): Promise<void> {
  await Preferences.set({ key: LIFE_CHAT_KEY, value: JSON.stringify(msgs.slice(-200)) })
}

export async function clearLifeMessages(): Promise<void> {
  await Preferences.remove({ key: LIFE_CHAT_KEY })
}

/** 读取全部会话（首次自动迁移旧版单会话存档），按最近活跃倒序 */
export async function loadLifeSessions(): Promise<LifeSession[]> {
  const legacy = await loadLifeMessages()
  if (legacy.length > 0) {
    await clearLifeMessages()
    const hasUser = legacy.some((m) => m.role === 'user')
    const sessions: LifeSession[] = hasUser
      ? [
          {
            id: newMsgId(),
            title: (legacy.find((m) => m.role === 'user')?.content ?? '对话').slice(0, 14),
            messages: legacy,
            createdAt: legacy[0].at,
            updatedAt: legacy[legacy.length - 1].at,
          },
        ]
      : []
    await Preferences.set({ key: LIFE_SESSIONS_KEY, value: JSON.stringify(sessions) })
    return sessions
  }
  const { value } = await Preferences.get({ key: LIFE_SESSIONS_KEY })
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return (Array.isArray(parsed) ? parsed : [])
      .sort((a: LifeSession, b: LifeSession) => b.updatedAt - a.updatedAt)
      .slice(0, 50)
  } catch {
    return []
  }
}

export async function saveLifeSessions(list: LifeSession[]): Promise<void> {
  const sorted = [...list].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 50)
  await Preferences.set({ key: LIFE_SESSIONS_KEY, value: JSON.stringify(sorted) })
}

export function newMsgId(): string {
  return `m${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/** 附加到系统提示词末尾的实时训练状态 */
export interface LifeContext {
  todayCount: number
  todayTags: string[]
  weekCount: number
  streakDays: number
  totalWorkouts: number
  diaryCount: number
}

export function renderContext(ctx: LifeContext): string {
  const today =
    ctx.todayCount > 0
      ? `今天已练 ${ctx.todayCount} 次（${ctx.todayTags.join('、') || '无标签'}）`
      : '今天还没训练'
  return [
    '【主人的实时状态】',
    today,
    `本周训练 ${ctx.weekCount} 次 · 连续 ${ctx.streakDays} 天 · 累计 ${ctx.totalWorkouts} 次`,
    `训练日记已有 ${ctx.diaryCount} 条`,
  ].join('\n')
}

export interface LifeReply {
  content: string
  reasoning: string
}

/** 调用 GLM Chat Completions：开启深度思考，返回正文与思考过程 */
export async function chatWithLife(
  config: AIConfig,
  contextText: string,
  history: ChatTurn[]
): Promise<LifeReply> {
  if (!config.apiKey) {
    throw new Error('还没有点亮生命：先去 设置 → AI生命 填入 API Key')
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000)
  try {
    const res = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: `${config.systemPrompt}\n\n${contextText}` },
          ...history,
        ],
        temperature: 0.8,
        max_tokens: config.thinkingEnabled ? 3072 : 1024,
        // 深度思考可开关：开启时 reasoning_content 单独返回供折叠展示
        thinking: { type: config.thinkingEnabled ? 'enabled' : 'disabled' },
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`接口 ${res.status}：${text.slice(0, 120) || '请求失败'}`)
    }
    const data = await res.json()
    const message = data?.choices?.[0]?.message ?? {}
    const raw = String(message.content ?? '').trim()
    // 兜底：剥离可能混入正文的思考标签
    const content = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    if (!content) throw new Error('回复为空，请稍后再试')
    const reasoning = String(message.reasoning_content ?? '').trim()
    return { content, reasoning }
  } finally {
    clearTimeout(timeout)
  }
}
