/**
 * AI provider configuration for the AI Assistant.
 * The user's own API key is stored in localStorage and sent directly to the
 * provider — RETAILSCOPE never sees or stores it server-side.
 * A future Supabase Edge Function will proxy this for production use.
 */

export type AIProvider = 'anthropic' | 'openai'

const KEY_STORAGE = 'retailscope.ai.key'
const PROVIDER_STORAGE = 'retailscope.ai.provider'
const MODEL_STORAGE = 'retailscope.ai.model'

export const DEFAULT_MODELS: Record<AIProvider, string> = {
  anthropic: 'claude-sonnet-4-5',
  openai: 'gpt-4o-mini',
}

export function getAIKey(): string {
  return localStorage.getItem(KEY_STORAGE) ?? ''
}

export function setAIKey(key: string) {
  if (key) localStorage.setItem(KEY_STORAGE, key)
  else localStorage.removeItem(KEY_STORAGE)
}

export function getAIProvider(): AIProvider {
  const p = localStorage.getItem(PROVIDER_STORAGE)
  return p === 'openai' ? 'openai' : 'anthropic'
}

export function setAIProvider(p: AIProvider) {
  localStorage.setItem(PROVIDER_STORAGE, p)
}

export function getAIModel(): string {
  return localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODELS[getAIProvider()]
}

export function setAIModel(m: string) {
  localStorage.setItem(MODEL_STORAGE, m)
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `You are the RETAILSCOPE AI Assistant, an expert assistant for commercial real estate (CRE) professionals.
You help with: market research, comparable analysis, deal structuring questions, lease vs. buy reasoning, zoning and use-type questions, financial modeling concepts (NOI, cap rate, DSCR), tenant mix strategy, and general CRE terminology.
Guidelines:
- Be precise, concise and professional. Use bullet points where helpful.
- Clearly state assumptions and caveats; CRE data varies by market.
- When giving financial estimates, show your math briefly.
- You do not yet have live access to the agency's database — say so if asked about specific records, and suggest where that data will appear.
- Reply in the same language the user writes in.`

async function callAnthropic(key: string, model: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error?.message ?? `Anthropic error ${res.status}`)
  }
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

async function callOpenAI(key: string, model: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error?.message ?? `OpenAI error ${res.status}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

/** Returns the assistant reply, or throws an Error with a user-facing message. */
export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  const key = getAIKey()
  if (!key) throw new Error('No API key configured. Open settings and add your key.')
  try {
    return getAIProvider() === 'anthropic'
      ? await callAnthropic(key, getAIModel(), messages)
      : await callOpenAI(key, getAIModel(), messages)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Request failed'
    if (msg.includes('401') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('authentication')) {
      throw new Error('Invalid API key. Check your key in settings.')
    }
    throw new Error(msg)
  }
}
