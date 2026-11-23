import { KeyRound, Plus, SendHorizonal, Settings2, Sparkles, Trash2, User } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import {
  getAIKey,
  getAIModel,
  getAIProvider,
  sendChatMessage,
  setAIKey,
  setAIModel,
  setAIProvider,
  type AIProvider,
  type ChatMessage,
} from '@/lib/ai'
import { useI18n } from '@/lib/i18n'

const SUGGESTED_PROMPTS = [
  'Explain cap rate vs. cash-on-cash return for a retail acquisition',
  'What NOI assumptions are typical for a neighborhood retail strip?',
  'Help me sanity-check a lease escalation structure (CPI + 3% bumps)',
  'What due diligence items matter most for an office-to-residential conversion?',
]

interface StoredConversation {
  id: string
  title: string
  messages: ChatMessage[]
  updatedAt: number
}

const CONV_KEY = 'retailscope.ai.conversations'

function loadConversations(): StoredConversation[] {
  try {
    return JSON.parse(localStorage.getItem(CONV_KEY) ?? '[]') as StoredConversation[]
  } catch {
    return []
  }
}

function saveConversations(convs: StoredConversation[]) {
  localStorage.setItem(CONV_KEY, JSON.stringify(convs.slice(0, 20)))
}

export function AIAssistantPage() {
  const { t } = useI18n()
  const [conversations, setConversations] = React.useState<StoredConversation[]>(loadConversations)
  const [activeId, setActiveId] = React.useState<string | null>(conversations[0]?.id ?? null)
  const [input, setInput] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [hasKey, setHasKey] = React.useState(Boolean(getAIKey()))
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const active = conversations.find((c) => c.id === activeId) ?? null

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [active?.messages.length, sending])

  const persist = (next: StoredConversation[]) => {
    setConversations(next)
    saveConversations(next)
  }

  const newConversation = () => {
    const conv: StoredConversation = {
      id: crypto.randomUUID(),
      title: 'New conversation',
      messages: [],
      updatedAt: Date.now(),
    }
    persist([conv, ...conversations])
    setActiveId(conv.id)
    setInput('')
  }

  const deleteConversation = (id: string) => {
    const next = conversations.filter((c) => c.id !== id)
    persist(next)
    if (activeId === id) setActiveId(next[0]?.id ?? null)
  }

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    let conv = active
    if (!conv) {
      conv = {
        id: crypto.randomUUID(),
        title: trimmed.slice(0, 48),
        messages: [],
        updatedAt: Date.now(),
      }
      persist([conv, ...conversations])
      setActiveId(conv.id)
    }

    const history: ChatMessage[] = [...(conv.messages ?? []), { role: 'user', content: trimmed }]
    const updated: StoredConversation = {
      ...conv,
      title: conv.messages.length === 0 ? trimmed.slice(0, 48) : conv.title,
      messages: history,
      updatedAt: Date.now(),
    }
    persist(conversations.map((c) => (c.id === updated.id ? updated : c)))
    setInput('')
    setSending(true)

    try {
      const reply = await sendChatMessage(history)
      const withReply: StoredConversation = {
        ...updated,
        messages: [...history, { role: 'assistant', content: reply }],
      }
      persist(conversations.map((c) => (c.id === withReply.id ? withReply : c)))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'The assistant could not respond.')
      // Roll back the user message so the thread stays clean
      persist(conversations.map((c) => (c.id === updated.id ? conv! : c)))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col">
      <PageHeader
        title={t('ai.title')}
        subtitle={t('ai.subtitle')}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
              <Settings2 /> AI settings
            </Button>
            <Button size="sm" onClick={newConversation}>
              <Plus /> New chat
            </Button>
          </>
        }
      />

      <div className="flex min-h-0 flex-1 gap-4">
        {/* Conversation list */}
        <Card className="hidden w-56 shrink-0 flex-col md:flex">
          <CardContent className="flex min-h-0 flex-1 flex-col p-2">
            <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-secondary">
              Conversations
            </p>
            <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
              {conversations.length === 0 && (
                <p className="px-2 py-4 text-[12px] text-slate-muted">No conversations yet.</p>
              )}
              {conversations.map((c) => (
                <div
                  key={c.id}
                  className={`group flex items-center rounded-md ${
                    c.id === activeId ? 'bg-navy-50' : 'hover:bg-navy-50/60'
                  }`}
                >
                  <button
                    onClick={() => setActiveId(c.id)}
                    className="min-w-0 flex-1 truncate px-2 py-2 text-left text-[13px] text-ink"
                  >
                    {c.title}
                  </button>
                  <button
                    onClick={() => deleteConversation(c.id)}
                    aria-label="Delete conversation"
                    className="mr-1 rounded p-1 text-slate-muted opacity-0 hover:bg-surface hover:text-danger group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat panel */}
        <Card className="flex min-w-0 flex-1 flex-col">
          {!hasKey ? (
            <CardContent className="flex flex-1 items-center justify-center p-6">
              <EmptyState
                icon={KeyRound}
                title="Connect an AI provider"
                description="The assistant runs on your own API key (Anthropic or OpenAI) stored only in this browser. Add a key to start chatting — or continue exploring with demo data elsewhere in the app."
                action={
                  <Button size="sm" onClick={() => setSettingsOpen(true)}>
                    <KeyRound /> Configure API key
                  </Button>
                }
              />
            </CardContent>
          ) : (
            <>
              <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-5">
                {!active || active.messages.length === 0 ? (
                  <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center text-center">
                    <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-teal/10 text-teal">
                      <Sparkles className="size-5" />
                    </div>
                    <p className="text-[15px] font-medium text-ink">How can I help with your CRE work?</p>
                    <p className="mt-1 text-[13px] text-ink-secondary">
                      Market research, deal math, due diligence and terminology.
                    </p>
                    <div className="mt-5 grid w-full gap-2">
                      {SUGGESTED_PROMPTS.map((p) => (
                        <button
                          key={p}
                          onClick={() => send(p)}
                          className="rounded-md border border-line bg-surface px-3 py-2.5 text-left text-[13px] text-ink-secondary transition-colors hover:border-teal/50 hover:text-ink"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto max-w-2xl space-y-4">
                    {active.messages.map((m, i) => (
                      <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div
                          className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                            m.role === 'user' ? 'bg-navy-900 text-white' : 'bg-teal/10 text-teal'
                          }`}
                        >
                          {m.role === 'user' ? <User className="size-3.5" /> : <Sparkles className="size-3.5" />}
                        </div>
                        <div
                          className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed ${
                            m.role === 'user'
                              ? 'bg-navy-900 text-white'
                              : 'border border-line bg-surface text-ink'
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {sending && (
                      <div className="flex gap-3">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
                          <Sparkles className="size-3.5" />
                        </div>
                        <div className="rounded-lg border border-line bg-surface px-3.5 py-2.5 text-[13px] text-ink-secondary">
                          Thinking…
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void send(input)
                }}
                className="border-t border-line p-4"
              >
                <div className="mx-auto flex max-w-2xl gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about CRE markets, deals, underwriting…"
                    disabled={sending}
                  />
                  <Button type="submit" disabled={sending || !input.trim()} aria-label="Send message">
                    <SendHorizonal />
                  </Button>
                </div>
              </form>
            </>
          )}
        </Card>
      </div>

      <AISettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSaved={() => setHasKey(Boolean(getAIKey()))}
      />
    </div>
  )
}

function AISettingsDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved: () => void
}) {
  const [provider, setProvider] = React.useState<AIProvider>(getAIProvider())
  const [model, setModel] = React.useState(getAIModel())
  const [key, setKey] = React.useState(getAIKey())

  React.useEffect(() => {
    if (open) {
      setProvider(getAIProvider())
      setModel(getAIModel())
      setKey(getAIKey())
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>AI provider settings</DialogTitle>
          <DialogDescription>
            Your API key is stored only in this browser (localStorage) and sent directly to the
            provider. RETAILSCOPE never sees it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="ai-provider">Provider</Label>
            <Select
              id="ai-provider"
              value={provider}
              onChange={(e) => {
                const p = e.target.value as AIProvider
                setProvider(p)
                setModel('')
              }}
            >
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="openai">OpenAI (GPT)</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-model">Model</Label>
            <Input
              id="ai-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={provider === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-4o-mini'}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-key">API key</Label>
            <Input
              id="ai-key"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-ant-… or sk-…"
              autoComplete="off"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setAIKey('')
              setKey('')
              onSaved()
            }}
          >
            Remove key
          </Button>
          <Button
            onClick={() => {
              setAIProvider(provider)
              if (model.trim()) setAIModel(model.trim())
              setAIKey(key.trim())
              onSaved()
              onOpenChange(false)
              toast.success('AI settings saved')
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
