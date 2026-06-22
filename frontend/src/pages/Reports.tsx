import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import NotificationBell from '../components/NotificationBell'
import { getCurrentUser, logoutUser } from '../services/authService'
import {
  getReportSummary,
  type ReportSummary,
  type StatBucket,
} from '../services/ticketService'
import '../App.css'

const sidebarNavItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Tickets', href: '/tickets' },
  { label: 'Notifications', href: '/notifications' },
  { label: 'Reports', href: '/reports' },
  { label: 'Admin Settings', href: '/admin/settings' },
  { label: 'User Profile', href: '/profile' },
]

const accentSwatchClass: Record<string, string> = {
  mint: 'bg-[#12d9a8]',
  amber: 'bg-[#e8b84a]',
  teal: 'bg-[#19b99a]',
  rose: 'bg-[#f75d89]',
}

function SparkIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

type BreakdownTableProps = {
  title: string
  description: string
  labelHeading: string
  rows: StatBucket[]
}

function BreakdownTable({ title, description, labelHeading, rows }: BreakdownTableProps) {
  return (
    <section className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] shadow-[0_22px_52px_rgba(50,36,22,0.08)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[rgba(22,35,31,0.09)]">
        <p className="text-[#52625d] text-sm font-bold m-0">{title}</p>
        <p className="text-[#8a9690] text-xs mt-1 mb-0">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(22,35,31,0.09)] bg-[#faf9f5]">
              <th className="px-5 py-3 text-left text-xs font-bold text-[#586760] uppercase tracking-wide">{labelHeading}</th>
              <th className="px-5 py-3 text-right text-xs font-bold text-[#586760] uppercase tracking-wide">Tickets</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-5 py-6 text-center text-[#8a9690]">No report data found.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-[rgba(22,35,31,0.06)] last:border-b-0">
                  <td className="px-5 py-3.5 font-medium text-[#26322e]">{row.label}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-[#143a34]">{row.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function Reports() {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentUser] = useState(() => getCurrentUser())
  const [report, setReport] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/dashboard')
  }

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true })
      return
    }

    if (currentUser.role !== 'Admin') {
      navigate('/dashboard', {
        replace: true,
        state: { unauthorizedMessage: 'You do not have permission to access reports.' },
      })
      return
    }

    let cancelled = false

    async function loadReport() {
      try {
        setLoading(true)
        setError('')
        const data = await getReportSummary()

        if (!cancelled) {
          setReport(data)
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load report data. Please try again.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadReport()

    return () => {
      cancelled = true
    }
  }, [currentUser, navigate])

  if (!currentUser || currentUser.role !== 'Admin') {
    return null
  }

  const summaryCards = [
    { label: 'Total Tickets', value: report?.totalTickets ?? 0, helper: 'All helpdesk requests', accent: 'mint' },
    { label: 'Open Tickets', value: report?.openTickets ?? 0, helper: 'Awaiting action', accent: 'amber' },
    { label: 'In Progress', value: report?.inProgressTickets ?? 0, helper: 'Currently being handled', accent: 'teal' },
    { label: 'Resolved / Closed', value: report?.resolvedClosedTickets ?? 0, helper: 'Completed requests', accent: 'rose' },
  ]

  const agentRows: StatBucket[] = (report?.ticketsAssignedPerAgent ?? []).map((agent) => ({
    id: agent.agentId,
    label: agent.agentName,
    count: agent.count,
  }))

  return (
    <div className="dashboard-layout h-screen flex bg-[#f6f2ec] text-[#17211d]">
      <aside className="dashboard-sidebar hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col relative overflow-hidden" aria-label="Main navigation">
        <div
          className="absolute inset-0"
          style={{
            background: `
              repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 12px),
              linear-gradient(128deg, #0c3b34 0%, #20352f 42%, #3a2f26 70%, #0d211d 100%)
            `,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(2,11,9,0.35)] pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full p-6 lg:p-7">
          <div className="flex items-center gap-3.5 mb-10">
            <div className="w-11 h-11 grid place-items-center rounded-lg bg-white text-[#10251f] shadow-[0_18px_34px_rgba(0,0,0,0.18)]">
              <SparkIcon className="w-[22px] h-[22px]" />
            </div>
            <div>
              <p className="text-[#f7fbf7] text-lg font-extrabold m-0 leading-tight">IT Help Desk</p>
              <p className="text-[rgba(247,251,247,0.74)] text-xs mt-0.5 m-0">Team command center</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {sidebarNavItems.map((item) => {
              const active = location.pathname === item.href
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`block px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 ${active
                    ? 'bg-[rgba(255,255,255,0.14)] text-white border border-[rgba(255,255,255,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'text-[rgba(247,251,247,0.72)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[rgba(247,251,247,0.92)]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-[rgba(255,255,255,0.12)]">
            <div className="px-3.5 py-3 rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)]">
              <p className="text-[#f7fbf7] text-sm font-bold m-0 truncate">{currentUser.fullName}</p>
              <p className="text-[rgba(247,251,247,0.65)] text-xs mt-1 m-0 truncate">{currentUser.email}</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide bg-[rgba(74,213,178,0.18)] text-[#4ad5b2] border border-[rgba(74,213,178,0.25)]">
                {currentUser.role}
              </span>
              <button
                type="button"
                className="block mt-3 w-full px-3 py-2 rounded-md text-xs font-bold bg-white/10 text-white hover:bg-white/15 transition-colors"
                onClick={() => {
                  logoutUser()
                  navigate('/')
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center gap-3 px-5 py-4 bg-[#143a34] text-white">
          <div className="w-9 h-9 grid place-items-center rounded-lg bg-white text-[#10251f]">
            <SparkIcon className="w-[18px] h-[18px]" />
          </div>
          <div>
            <p className="text-sm font-extrabold m-0">IT Help Desk</p>
            <p className="text-[rgba(247,251,247,0.7)] text-xs m-0">Reports</p>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="relative">
            <div className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full bg-[rgba(25,185,154,0.06)] blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/4" />
            <div className="relative z-10 px-5 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-[1440px]">
              <button
                type="button"
                onClick={handleBack}
                className="mb-4 text-sm text-[#586760] hover:text-[#143a34] font-medium transition-colors"
              >
                &larr; Back
              </button>

              <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                <div>
                  <p className="text-[#a3493d] text-xs font-extrabold uppercase tracking-wide m-0">Analytics</p>
                  <h1 className="text-[clamp(28px,4vw,40px)] font-[850] text-[#17211d] m-0 mt-2 leading-tight">Reports</h1>
                  <p className="text-[#6b716d] text-[15px] leading-relaxed mt-2 mb-0 max-w-xl">
                    Review system-wide helpdesk ticket statistics and agent assignments.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <NotificationBell variant="surface" />
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/90 border border-[rgba(19,35,30,0.1)] shadow-[0_4px_16px_rgba(50,36,22,0.06)]">
                    <span className="w-2 h-2 rounded-full bg-[#12d9a8]" />
                    <span className="text-sm font-semibold text-[#26322e]">{currentUser.fullName}</span>
                    <span className="text-xs text-[#8a9690] hidden sm:inline">- {currentUser.role}</span>
                  </div>
                </div>
              </header>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-[#fdeef2] text-[#b83d5e] border border-[#f5ccd8] text-sm font-medium" role="alert">
                  {error}
                </div>
              )}

              {loading && !error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-[rgba(255,255,255,0.86)] text-[#586760] border border-[rgba(19,35,30,0.1)] text-sm font-medium">
                  Loading report data...
                </div>
              )}

              <section aria-label="Report summary" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                {summaryCards.map((card) => (
                  <article key={card.label} className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-5 shadow-[0_22px_52px_rgba(50,36,22,0.08)]">
                    <span className={`block w-9 h-2 rounded-sm ${accentSwatchClass[card.accent]}`} />
                    <p className="text-[#586760] text-sm font-bold mt-4 mb-0">{card.label}</p>
                    <p className="text-[#15211d] text-[28px] font-[750] mt-1 mb-0 leading-none">{card.value}</p>
                    <p className="text-[#8a9690] text-xs mt-2 mb-0 leading-relaxed">{card.helper}</p>
                  </article>
                ))}
              </section>

              {!loading && report && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <BreakdownTable title="Tickets by Category" description="Ticket volume across helpdesk categories" labelHeading="Category" rows={report.ticketsByCategory} />
                  <BreakdownTable title="Tickets by Priority" description="Ticket volume by priority level" labelHeading="Priority" rows={report.ticketsByPriority} />
                  <BreakdownTable title="Tickets by Status" description="Current ticket workflow distribution" labelHeading="Status" rows={report.ticketsByStatus} />
                  <BreakdownTable title="Tickets Assigned per Agent" description="Current ticket assignments for support agents" labelHeading="Agent" rows={agentRows} />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
