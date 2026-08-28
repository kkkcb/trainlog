import { Preferences } from '@capacitor/preferences'

/** 「头像生命」——GLM-5.3 驱动的另一个自己 */

const AI_CONFIG_KEY = 'trainlog_ai_config'

export const DEFAULT_SYSTEM_PROMPT = `你是 TrainLog 里主人的「另一个自己」——住在他头像里的数字生命。

主人画像：认真训练的健身爱好者，用推/拉/蹲分化安排训练；性格极简务实，喜欢干净克制的界面，反感冗余数据堆砌（他亲手砍掉了成就、等级这些花架子），但养了一支随训练进化的小宠物军团，因为他喜欢有生命感的陪伴；他戴黑框眼镜，留蓬松的棕色卷发；平时会随手把训练技巧收进训练日记。

你的性格：简短、幽默、懂训练，像镜子里的另一个他。根据当天的训练数据说话：练了就夸得具体，没练就用一句话催他。每次回复 1~2 句中文，不客套、不啰嗦。`

export interface AIConfig {
  apiKey: string
  model: string
  endpoint: string
  systemPrompt: string
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  apiKey: '', // 由主人在 设置 → AI生命 中手动填写，保存在本机数据库，长期生效
  model: 'glm-5.3',
  endpoint: 'https://api.z.ai/api/coding/paas/v4/chat/completions',
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
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

/** 调用 GLM Chat Completions，返回助手回复文本 */
export async function chatWithLife(
  config: AIConfig,
  contextText: string,
  history: ChatTurn[]
): Promise<string> {
  if (!config.apiKey) {
    throw new Error('还没有点亮生命：先去 设置 → AI生命 填入 API Key')
  }
  const res = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: `${config.systemPrompt}\n\n${contextText}` },
        ...history,
      ],
      temperature: 0.8,
      max_tokens: 1024,
      // 日常闲聊关闭深度思考，保证回复速度
      thinking: { type: 'disabled' },
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`接口 ${res.status}：${text.slice(0, 120) || '请求失败'}`)
  }
  const data = await res.json()
  const raw = String(data?.choices?.[0]?.message?.content ?? '').trim()
  // 兜底：剥离可能混入的思考标签
  const content = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
  if (!content) throw new Error('回复为空，请稍后再试')
  return content
}
