import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../components/BackButton'
import DashboardShell from '../components/DashboardShell'
import {
  askHelpdeskAssistant,
  askHelpdeskAssistantWithTicket,
  getAIStatus,
  type AIMode,
  type AIStatusResponse,
} from '../services/aiService'
import { getCurrentUser } from '../services/authService'
import { getTickets, type Ticket } from '../services/ticketService'

type ChatMessage = {
  role: 'user' | 'assistant'
  text: string
  mode?: AIMode
  ticketReference?: string
}

const suggestedPrompts = [
  { label: 'Summarize ticket', message: 'Summarize this ticket and identify the most important next action.' },
  { label: 'Suggest next steps', message: 'Suggest safe, practical next steps for this ticket.' },
  { label: 'Write user reply', message: 'Draft a concise, professional reply to the user about this ticket.' },
  { label: 'Recommend priority', message: 'Recommend the most appropriate priority for this ticket and explain why.' },
  { label: 'Recommend category', message: 'Recommend the most appropriate existing category for this ticket and explain why.' },
  { label: 'Troubleshoot issue', message: 'Provide safe troubleshooting steps for this ticket.' },
]

export default function AIAssistant() {
  const navigate = useNavigate()
  const [currentUser] = useState(() => getCurrentUser())
  const [status, setStatus] = useState<AIStatusResponse | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [ticketSearch, setTicketSearch] = useState('')
  const [selectedTicketId, setSelectedTicketId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true })
      return
    }

    let cancelled = false
    async function loadAssistant() {
      try {
        setTicketsLoading(true)
        const [aiStatus, ticketRows] = await Promise.all([getAIStatus(), getTickets()])
        if (!cancelled) {
          setStatus(aiStatus)
          setTickets(ticketRows)
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load the AI Assistant.')
      } finally {
        if (!cancelled) setTicketsLoading(false)
      }
    }

    void loadAssistant()
    return () => { cancelled = true }
  }, [currentUser, navigate])

  const filteredTickets = useMemo(() => {
    const query = ticketSearch.trim().toLowerCase()
    if (!query) return tickets
    return tickets.filter((ticket) =>
      `${ticket.ticketReference} ${ticket.title} ${ticket.category} ${ticket.status}`.toLowerCase().includes(query)
    )
  }, [ticketSearch, tickets])

  const selectedTicket = tickets.find((ticket) => ticket.ticketId === Number(selectedTicketId)) ?? null

  if (!currentUser) return null

  async function sendQuestion(question: string) {
    const cleanQuestion = question.trim()
    if (!cleanQuestion || sending) return

    const ticketReference = selectedTicket?.ticketReference
    setMessages((items) => [...items, { role: 'user', text: cleanQuestion, ticketReference }])
    setMessage('')
    setError('')
    try {
      setSending(true)
      const response = selectedTicket
        ? await askHelpdeskAssistantWithTicket(selectedTicket.ticketId, cleanQuestion)
        : await askHelpdeskAssistant(cleanQuestion)
      setMessages((items) => [...items, {
        role: 'assistant',
        text: response.result,
        mode: response.mode,
        ticketReference,
      }])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'The assistant could not answer right now.')
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void sendQuestion(message)
  }

  return (
    <DashboardShell currentUser={currentUser} pageName="AI Assistant">
      <BackButton />
      <header className="mb-8">
        <p className="text-[#a3493d] text-xs font-extrabold uppercase tracking-wide m-0">Helpdesk Support</p>
        <h1 className="text-[clamp(28px,4vw,40px)] font-[850] text-[#17211d] m-0 mt-2 leading-tight">AI Assistant</h1>
        <p className="text-[#6b716d] text-[15px] leading-relaxed mt-2 mb-0">Ask helpdesk questions or select an accessible ticket for contextual assistance.</p>
      </header>

      {status && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-white border border-[rgba(19,35,30,0.1)] text-sm text-[#586760]">
          Mode: <span className="font-bold text-[#26322e]">{status.mode}</span>. {status.message}
        </div>
      )}
      {error && <div className="mb-4 px-4 py-3 rounded-lg bg-[#fdeef2] text-[#b83d5e] border border-[#f5ccd8] text-sm font-medium" role="alert">{error}</div>}

      <section className="mb-5 rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-5 shadow-[0_22px_52px_rgba(50,36,22,0.08)]">
        <p className="text-sm font-bold text-[#52625d] m-0">Ticket Context</p>
        <p className="text-xs text-[#8a9690] mt-1 mb-4">Only tickets your current role can view are available.</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <input
            value={ticketSearch}
            onChange={(event) => setTicketSearch(event.target.value)}
            placeholder="Search by reference, title, category, or status"
            className="px-4 py-2.5 rounded-lg border border-[#dde0dc] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#19b99a]"
          />
          <select
            value={selectedTicketId}
            onChange={(event) => setSelectedTicketId(event.target.value)}
            disabled={ticketsLoading || tickets.length === 0}
            className="px-4 py-2.5 rounded-lg border border-[#dde0dc] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#19b99a] disabled:opacity-60"
          >
            <option value="">No ticket selected</option>
            {filteredTickets.map((ticket) => (
              <option key={ticket.ticketId} value={ticket.ticketId}>
                {ticket.ticketReference} — {ticket.title}
              </option>
            ))}
          </select>
        </div>
        {ticketsLoading ? (
          <p className="text-sm text-[#8a9690] mt-3 mb-0">Loading accessible tickets...</p>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-[#8a9690] mt-3 mb-0">No tickets available to select.</p>
        ) : selectedTicket ? (
          <div className="mt-3 p-3 rounded-lg bg-[#faf9f5] border border-[#ddded8] text-sm text-[#586760]">
            <span className="font-bold text-[#26322e]">{selectedTicket.ticketReference}</span> · {selectedTicket.category} · {selectedTicket.priority} · {selectedTicket.status} · {selectedTicket.assignedTo || 'Unassigned'}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 mt-4" aria-label="Suggested ticket prompts">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt.label}
              type="button"
              onClick={() => void sendQuestion(prompt.message)}
              disabled={!selectedTicket || sending}
              title={selectedTicket ? prompt.message : 'Select a ticket first'}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-[#faf9f5] text-[#26322e] border border-[#ddded8] hover:bg-white hover:border-[#19b99a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {prompt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] shadow-[0_22px_52px_rgba(50,36,22,0.08)] overflow-hidden">
        <div className="p-5 min-h-[320px] space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-[#8a9690] py-16 m-0">Ask about ticket workflows and permissions, or select a ticket for context-aware help.</p>
          ) : messages.map((item, index) => (
            <div key={`${item.role}-${index}`} className={`max-w-[82%] px-4 py-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${item.role === 'user' ? 'ml-auto bg-[#143a34] text-white' : 'bg-[#faf9f5] text-[#26322e] border border-[#ddded8]'}`}>
              {item.ticketReference && <span className={`block text-[11px] font-bold mb-1 ${item.role === 'user' ? 'text-white/70' : 'text-[#8a9690]'}`}>{item.ticketReference}</span>}
              {item.text}
              {item.role === 'assistant' && item.mode && <span className="block text-[11px] font-bold text-[#8a9690] mt-2">Mode: {item.mode}</span>}
            </div>
          ))}
          {sending && <p className="text-sm text-[#8a9690] m-0">Assistant is responding...</p>}
        </div>
        <form onSubmit={handleSubmit} className="p-5 border-t border-[rgba(22,35,31,0.09)] bg-[#faf9f5] flex flex-col sm:flex-row gap-3">
          <input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} placeholder={selectedTicket ? `Ask about ${selectedTicket.ticketReference}...` : 'Ask a helpdesk question...'} className="flex-1 px-4 py-2.5 rounded-lg border border-[#dde0dc] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#19b99a]" />
          <button type="submit" disabled={sending || !message.trim()} className="px-5 py-2.5 rounded-lg text-sm font-bold bg-[#143a34] text-white hover:bg-[#0d2d28] disabled:opacity-50">Send</button>
        </form>
      </section>
    </DashboardShell>
  )
}
