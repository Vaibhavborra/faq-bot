import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Button, Card, Flex, Heading, Loader, Text, View, useAuthenticator } from '@aws-amplify/ui-react'
import { AIConversation, type ConversationMessage, type SendMesageParameters } from '@aws-amplify/ui-react-ai'
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth'
import { Icon, Logo, TOPICS } from '../components/icons'
import { Link, navigate } from '../router'

const SUGGESTIONS = [
  'What time do you close on Sunday?',
  'Can I rent a tent for the weekend?',
  'Is shipping free?',
  'Can I return a sale item?',
]

const FACTS = [
  ['Mon – Sat', '9am – 8pm'],
  ['Sunday', '10am – 6pm'],
  ['Free shipping', 'Orders $50+'],
  ['Returns', '30 days'],
  ['Support', '555-0142'],
]

let nextId = 0
function makeMessage(role: 'user' | 'assistant', text: string): ConversationMessage {
  return {
    id: `m${++nextId}`,
    conversationId: 'trailhead',
    role,
    content: [{ text }],
    createdAt: new Date().toISOString(),
  } as unknown as ConversationMessage
}

/** Render **bold** from the model safely (no HTML injection). */
function FormattedText({ text }: { text: string }) {
  const parts: ReactNode[] = text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  )
  return <span className="msg-text">{parts}</span>
}

function textOf(m: ConversationMessage): string {
  return m.content.map((c) => c.text ?? '').join('')
}

export function Chat() {
  const { authStatus, signOut } = useAuthenticator((c) => [c.authStatus])
  const [name, setName] = useState('')
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [loading, setLoading] = useState(false)
  const messagesRef = useRef(messages)
  messagesRef.current = messages

  useEffect(() => {
    if (authStatus === 'unauthenticated') navigate('/login', true)
    if (authStatus === 'authenticated') {
      fetchUserAttributes().then((a) => setName(a.name ?? a.email ?? '')).catch(() => {})
    }
  }, [authStatus])

  const send = useCallback(async (question: string) => {
    question = question.trim()
    if (!question || loading) return
    const history = messagesRef.current.slice(-10).map((m) => ({ role: m.role, content: textOf(m) }))
    setMessages((prev) => [...prev, makeMessage('user', question)])
    setLoading(true)
    try {
      const token = (await fetchAuthSession()).tokens?.accessToken?.toString()
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
        body: JSON.stringify({ question, history }),
      })
      if (res.status === 401) {
        signOut()
        navigate('/login', true)
        return
      }
      const body = await res.json().catch(() => ({}))
      const answer = res.ok ? body.answer : body.error || 'Something went wrong. Please try again.'
      setMessages((prev) => [...prev, makeMessage('assistant', answer)])
    } catch {
      setMessages((prev) => [...prev, makeMessage('assistant', 'I couldn’t reach the server. Check your connection and try again.')])
    } finally {
      setLoading(false)
    }
  }, [loading, signOut])

  const handleSendMessage = (input: SendMesageParameters) => {
    send(input.content.map((c) => ('text' in c ? c.text ?? '' : '')).join(' '))
  }

  if (authStatus !== 'authenticated') {
    return <Flex height="100vh" alignItems="center" justifyContent="center"><Loader size="large" /></Flex>
  }

  const first = name.split(/\s+/)[0] || 'there'
  const initial = (name.charAt(0) || '?').toUpperCase()

  return (
    <div className="app">
      <Flex as="header" className="topbar" justifyContent="space-between" alignItems="center">
        <Link href="/" className="brand"><Logo />Trailhead Assistant</Link>
        <Flex alignItems="center" gap="10px">
          <span className="avatar-me">{initial}</span>
          <Text className="hide-sm" fontSize="14px" fontWeight={500}>{name}</Text>
          <Button size="small" gap="6px" onClick={() => { signOut(); navigate('/', true) }}>
            <Icon name="logout" size={16} /> <span className="hide-sm">Sign out</span>
          </Button>
        </Flex>
      </Flex>

      <div className="layout">
        <aside className="sidebar">
          <Text className="side-label">Browse topics</Text>
          {TOPICS.map((t) => (
            <button key={t.title} className="topic" onClick={() => send(t.question)} disabled={loading}>
              <span className="icon-tile small"><Icon name={t.icon} size={18} /></span>
              <span>{t.title}<small>{t.blurb}</small></span>
            </button>
          ))}
          <Card variation="outlined" className="facts">
            <Text className="side-label">At a glance</Text>
            {FACTS.map(([k, v]) => (
              <Flex key={k} justifyContent="space-between" className="fact"><span>{k}</span><b>{v}</b></Flex>
            ))}
          </Card>
        </aside>

        <section className="chat">
          <div className="mobile-chips">
            {TOPICS.map((t) => (
              <button key={t.title} className="chip" onClick={() => send(t.question)} disabled={loading}>{t.title}</button>
            ))}
          </div>
          <View className="conversation">
            <AIConversation
              messages={messages}
              isLoading={loading}
              handleSendMessage={handleSendMessage}
              variant="bubble"
              allowAttachments={false}
              avatars={{
                user: { username: name || 'You', avatar: <span className="avatar-me">{initial}</span> },
                ai: { username: 'Trailhead Assistant', avatar: <span className="avatar-bot"><Logo size={20} /></span> },
              }}
              welcomeMessage={
                <Card variation="outlined" className="welcome">
                  <Flex gap="16px" alignItems="flex-start" direction={{ base: 'column', medium: 'row' }}>
                    <span className="avatar-bot big"><Logo size={30} /></span>
                    <View>
                      <Heading level={3}>Hi {first} 👋</Heading>
                      <Text color="font.secondary" marginTop="6px">
                        I’m the Trailhead Assistant. I answer questions about our stores and policies using only our
                        official FAQ, so you always get the real answer. Pick a question or type your own below.
                      </Text>
                    </View>
                  </Flex>
                </Card>
              }
              suggestedPrompts={SUGGESTIONS.map((s) => ({ inputText: s }))}
              messageRenderer={{ text: ({ text }) => <FormattedText text={text} /> }}
              displayText={{ getMessageTimestampText: (date: Date) => date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }}
            />
          </View>
          <Text className="hint">Answers come from the Trailhead customer FAQ. For anything else, email help@trailhead-example.com.</Text>
        </section>
      </div>
    </div>
  )
}
