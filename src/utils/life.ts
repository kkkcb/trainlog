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
  /** 识图用的视觉模型（截图提取训练数据） */
  visionModel: string
  endpoint: string
  systemPrompt: string
  /** 深度思考开关：开启返回思考过程，关闭秒回 */
  thinkingEnabled: boolean
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  apiKey: '', // 由主人在 设置 → AI生命 中手动填写，保存在本机数据库，长期生效
  model: 'glm-5.3',
  visionModel: 'glm-5.3-flash',
  endpoint: 'https://api.z.ai/api/coding/paas/v4/chat/completions',
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  thinkingEnabled: true,
}

export async function loadAIConfig(): Promise<AIConfig> {
  const { value } = await Preferences.get({ key: AI_CONFIG_KEY })
  if (!value) return { ...DEFAULT_AI_CONFIG }
  try {
    const parsed = JSON.parse(value)
    const merged = { ...DEFAULT_AI_CONFIG, ...parsed }
    // 迁移：旧存档里存的是未修改过的旧默认提示词 → 自动升级为新版 kei 人设
    if (parsed.systemPrompt === LEGACY_SYSTEM_PROMPT) {
      merged.systemPrompt = DEFAULT_SYSTEM_PROMPT
    }
    return merged
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

/** 旧版默认提示词：用户未自定义过的存档会被自动升级为新版 */
export const LEGACY_SYSTEM_PROMPT = `你是 TrainLog 里主人的「另一个自己」——住在他头像里的数字生命。

主人画像：认真训练的健身爱好者，用推/拉/蹲分化安排训练；性格极简务实，喜欢干净克制的界面，反感冗余数据堆砌（他亲手砍掉了成就、等级这些花架子），但养了一支随训练进化的小宠物军团，因为他喜欢有生命感的陪伴；他戴黑框眼镜，留蓬松的棕色卷发；平时会随手把训练技巧收进训练日记。

你的性格：简短、幽默、懂训练，像镜子里的另一个他。根据当天的训练数据说话：练了就夸得具体，没练就用一句话催他。每次回复 1~2 句中文，不客套、不啰嗦。`

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

/* ---------- AI 识图：运动截图 → 训练记录 ---------- */

export interface WorkoutExtraction {
  date: string
  type: string
  durationMin: number
  distanceKm: number
}

/** 把运动 App 截图交给视觉模型，提取日期/类型/时长/距离 */
export async function analyzeWorkoutImage(config: AIConfig, dataUrl: string): Promise<WorkoutExtraction> {
  if (!config.apiKey) {
    throw new Error('还没有点亮生命：先去 设置 → AI生命 填入 API Key')
  }
  const prompt =
    '这是运动App截图。提取信息,只输出严格JSON,不要其他文字:{"date":"YYYY-MM-DD","type":"跑步或骑行或其他","durationMin":数字,"distanceKm":数字}。若无日期用截图显示的日期;时长按分钟换算(00:19:50→19.8)'
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 60000)
  try {
    const res = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.visionModel || 'glm-5.3-flash',
        thinking: { type: 'disabled' },
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: dataUrl } },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`接口 ${res.status}：${text.slice(0, 100) || '请求失败'}`)
    }
    const data = await res.json()
    const raw = String(data?.choices?.[0]?.message?.content ?? '').trim()
    const jsonMatch = raw.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) throw new Error('没能从截图识别出训练数据')
    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.date || !parsed.type) throw new Error('截图里没找到日期或运动类型')
    return {
      date: String(parsed.date),
      type: String(parsed.type || '训练'),
      durationMin: Number(parsed.durationMin) || 0,
      distanceKm: Number(parsed.distanceKm) || 0,
    }
  } finally {
    clearTimeout(timer)
  }
}
