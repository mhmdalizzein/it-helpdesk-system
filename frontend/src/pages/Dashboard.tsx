import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getCurrentUser, logoutUser } from '../services/authService'
import NotificationBell from '../components/NotificationBell'
import {
  getNotifications,
  getTicketStats,
  getTickets,
  markNotificationAsRead,
  type NotificationItem,
  type Ticket,
  type TicketStats,
} from '../services/ticketService'
import '../App.css'

type Role = 'Admin' | 'Agent' | 'User'

const emptyTicketStats: TicketStats = {
  totalTickets: 0,
  openTickets: 0,
  inProgressTickets: 0,
  resolvedTickets: 0,
  byStatus: [],
  byPriority: [],
  byCategory: [],
}

const quickActionsByRole: Record<Role, { label: string; variant: 'primary' | 'secondary' }[]> = {
  Admin: [
    { label: 'View All Tickets', variant: 'primary' },
    { label: 'Assign Ticket', variant: 'secondary' },
    { label: 'Manage Users', variant: 'secondary' },
    { label: 'Generate Report', variant: 'secondary' },
  ],
  Agent: [
    { label: 'View Assigned Tickets', variant: 'primary' },
    { label: 'Update Ticket Status', variant: 'secondary' },
    { label: 'Add Internal Note', variant: 'secondary' },
  ],
  User: [
    { label: 'Create Ticket', variant: 'primary' },
    { label: 'View My Tickets', variant: 'secondary' },
    { label: 'Check Notifications', variant: 'secondary' },
  ],
}

const sidebarNavItems = [
  { label: 'Dashboard', href: '/dashboard', active: true, roles: ['Admin', 'Agent', 'User'] as Role[] },
  { label: 'Tickets', href: '/tickets', active: false, roles: ['Admin', 'Agent', 'User'] as Role[] },
  { label: 'Create Ticket', href: '/tickets/create', active: false, roles: ['User'] as Role[] },
  { label: 'Notifications', href: '/notifications', active: false, roles: ['Admin', 'Agent', 'User'] as Role[] },
  { label: 'Reports', href: '#', active: false, roles: ['Admin'] as Role[] },
  { label: 'Admin Settings', href: '#', active: false, roles: ['Admin'] as Role[] },
  { label: 'User Profile', href: '#', active: false, roles: ['Admin', 'Agent', 'User'] as Role[] },
]

const accentSwatchClass: Record<string, string> = {
  mint: 'bg-[#12d9a8]',
  amber: 'bg-[#e8b84a]',
  teal: 'bg-[#19b99a]',
  rose: 'bg-[#f75d89]',
}

const priorityStyles: Record<string, string> = {
  Low: 'bg-[#eef1ef] text-[#586760] border-[#dde0dc]',
  Medium: 'bg-[#e8f7fb] text-[#1a7a8c] border-[#c5e8ef]',
  High: 'bg-[#fef6e8] text-[#9a6b1a] border-[#f0ddb0]',
  Critical: 'bg-[#fdeef2] text-[#b83d5e] border-[#f5ccd8]',
}

const statusStyles: Record<string, string> = {
  Open: 'bg-[#e6faf5] text-[#0b8e79] border-[#b8ecdc]',
  'In Progress': 'bg-[#e8f7fb] text-[#1a7a8c] border-[#c5e8ef]',
  Pending: 'bg-[#fef6e8] text-[#9a6b1a] border-[#f0ddb0]',
  Resolved: 'bg-[#d7ffe9] text-[#0b8e79] border-[#a8f0d0]',
  Closed: 'bg-[#eef1ef] text-[#586760] border-[#dde0dc]',
}

const statusBarColors: Record<string, string> = {
  Open: 'bg-[#12d9a8]',
  'In Progress': 'bg-[#17cae6]',
  Pending: 'bg-[#e8b84a]',
  Resolved: 'bg-[#19b99a]',
  Closed: 'bg-[#8a9690]',
}

const priorityBarColors: Record<string, string> = {
  Low: 'bg-[#8a9690]',
  Medium: 'bg-[#17cae6]',
  High: 'bg-[#e8b84a]',
  Critical: 'bg-[#f75d89]',
}

const activityDotColors: Record<string, string> = {
  assigned: 'bg-[#17cae6]',
  category: 'bg-[#e8b84a]',
  status: 'bg-[#12d9a8]',
  comment: 'bg-[#19b99a]',
  attachment: 'bg-[#8a9690]',
}

function SparkIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

function formatDate() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())
}

function formatRelativeTime(value: string | null) {
  if (!value) return 'Not updated'

  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} min ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`

  return date.toLocaleDateString()
}

function getRoleIntro(role: Role) {
  if (role === 'Admin') {
    return 'Monitor all support requests, manage users, and review system-wide activity.'
  }

  if (role === 'Agent') {
    return 'Track assigned tickets, update progress, and manage support workflow.'
  }

  return 'Create support tickets, follow your requests, and view important updates.'
}

function getActionRoute(label: string): string | null {
  const map: Record<string, string> = {
    'View All Tickets': '/tickets',
    'View Assigned Tickets': '/tickets',
    'View My Tickets': '/tickets',
    'Create Ticket': '/tickets/create',
    'Assign Ticket': '/tickets',
    'Update Ticket Status': '/tickets',
    'Add Internal Note': '/tickets',
  }
  return map[label] || null
}

function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentUser] = useState(() => getCurrentUser())
  const [stats, setStats] = useState<TicketStats>(emptyTicketStats)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState('')

  useEffect(() => {
    if (!currentUser) {
      navigate('/')
      return
    }

    let cancelled = false

    async function loadDashboard() {
      try {
        setDashboardLoading(true)
        setDashboardError('')
        const [ticketStats, ticketRows, notificationRows] = await Promise.all([
          getTicketStats(),
          getTickets().catch(() => [] as Ticket[]),
          getNotifications().catch(() => [] as NotificationItem[]),
        ])

        if (!cancelled) {
          setStats(ticketStats)
          setTickets(ticketRows)
          setNotifications(notificationRows)
        }
      } catch {
        if (!cancelled) {
          setDashboardError('Failed to load dashboard analytics.')
        }
      } finally {
        if (!cancelled) {
          setDashboardLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [currentUser, navigate])

  if (!currentUser) {
    return null
  }

  const userRole = currentUser.role as Role
  const dashboardStats = [
    {
      key: 'total',
      label: 'Total Tickets',
      value: stats.totalTickets,
      helper: 'All visible support requests',
      accent: 'mint',
    },
    {
      key: 'open',
      label: 'Open Tickets',
      value: stats.openTickets,
      helper: 'Awaiting review or assignment',
      accent: 'amber',
    },
    {
      key: 'in-progress',
      label: 'In Progress',
      value: stats.inProgressTickets,
      helper: 'Currently being handled',
      accent: 'teal',
    },
    {
      key: 'resolved',
      label: 'Resolved Tickets',
      value: stats.resolvedTickets,
      helper: 'Completed support requests',
      accent: 'rose',
    },
  ]
  const recentTickets = tickets.slice(0, 5)
  const recentActivity = recentTickets.map((ticket) => ({
    id: `ticket-${ticket.ticketId}`,
    type: ticket.assignedTo ? 'assigned' : 'status',
    actor: ticket.assignedTo || ticket.createdBy,
    detail: `${ticket.ticketReference} is ${ticket.status}`,
    time: formatRelativeTime(ticket.updatedAt || ticket.createdAt),
  }))
  const statusOverview = stats.byStatus.map((item) => ({
    status: item.label,
    count: item.count,
    total: Math.max(stats.totalTickets, 1),
  }))
  const categoryBreakdown = stats.byCategory.map((item) => ({
    category: item.label,
    count: item.count,
  }))
  const priorityBreakdown = stats.byPriority.map((item) => ({
    priority: item.label,
    count: item.count,
  }))
  const unreadCount = notifications.filter((n) => !n.isRead).length
  const maxCategoryCount = Math.max(1, ...categoryBreakdown.map((c) => c.count))
  const maxPriorityCount = Math.max(1, ...priorityBreakdown.map((p) => p.count))
  const visibleNavItems = sidebarNavItems.filter((item) => item.roles.includes(userRole))
  const quickActions = quickActionsByRole[userRole]

  async function handleNotificationClick(notification: NotificationItem) {
    try {
      if (!notification.isRead) {
        const updated = await markNotificationAsRead(notification.notificationId)
        setNotifications((items) =>
          items.map((item) =>
            item.notificationId === notification.notificationId ? updated : item
          )
        )
      }
    } catch {
      setDashboardError('Failed to update notification.')
    } finally {
      navigate(`/tickets/${notification.ticketId}`)
    }
  }

  return (
    <div className="dashboard-layout h-screen flex bg-[#f6f2ec] text-[#17211d]">
      <aside
        className="dashboard-sidebar hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col relative overflow-hidden"
        aria-label="Main navigation"
      >
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
            {visibleNavItems.map((item) => {
              const active = location.pathname === item.href
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`
                    block px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150
                    ${active
                      ? 'bg-[rgba(255,255,255,0.14)] text-white border border-[rgba(255,255,255,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : 'text-[rgba(247,251,247,0.72)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[rgba(247,251,247,0.92)]'
                    }
                  `}
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
            <p className="text-[rgba(247,251,247,0.7)] text-xs m-0">Dashboard</p>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="relative">
            <div className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full bg-[rgba(25,185,154,0.06)] blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[360px] h-[360px] rounded-full bg-[rgba(12,59,52,0.04)] blur-3xl pointer-events-none translate-y-1/3 -translate-x-1/4" />

            <div className="relative z-10 px-5 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-[1440px]">
              <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                <div>
                  <p className="text-[#a3493d] text-xs font-extrabold uppercase tracking-wide m-0">Overview</p>
                  <h1 className="text-[clamp(28px,4vw,40px)] font-[850] text-[#17211d] m-0 mt-2 leading-tight">
                    Dashboard
                  </h1>
                  <p className="text-[#6b716d] text-[15px] leading-relaxed mt-2 mb-0 max-w-xl">
                    {getRoleIntro(userRole)}
                  </p>
                </div>
                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <NotificationBell variant="surface" />
                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/90 border border-[rgba(19,35,30,0.1)] shadow-[0_4px_16px_rgba(50,36,22,0.06)]">
                      <span className="w-2 h-2 rounded-full bg-[#12d9a8]" />
                      <span className="text-sm font-semibold text-[#26322e]">{currentUser.fullName}</span>
                      <span className="text-xs text-[#8a9690] hidden sm:inline">- {currentUser.role}</span>
                    </div>
                  </div>
                  <time className="text-xs text-[#8a9690] font-medium" dateTime={new Date().toISOString().split('T')[0]}>
                    {formatDate()}
                  </time>
                </div>
              </header>

              {dashboardError && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-[#fdeef2] text-[#b83d5e] border border-[#f5ccd8] text-sm font-medium">
                  {dashboardError}
                </div>
              )}

              {dashboardLoading && !dashboardError && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-[rgba(255,255,255,0.86)] text-[#586760] border border-[rgba(19,35,30,0.1)] text-sm font-medium">
                  Loading dashboard analytics...
                </div>
              )}

              <section aria-label="Dashboard statistics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                {dashboardStats.map((stat) => (
                  <article
                    key={stat.key}
                    className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-5 shadow-[0_22px_52px_rgba(50,36,22,0.08)] transition-transform duration-150 hover:-translate-y-0.5"
                  >
                    <span className={`block w-9 h-2 rounded-sm ${accentSwatchClass[stat.accent]}`} />
                    <p className="text-[#586760] text-sm font-bold mt-4 mb-0">{stat.label}</p>
                    <p className="text-[#15211d] text-[28px] font-[750] mt-1 mb-0 leading-none">{stat.value}</p>
                    <p className="text-[#8a9690] text-xs mt-2 mb-0 leading-relaxed">{stat.helper}</p>
                  </article>
                ))}
              </section>

              <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 mb-6">
                <section
                  aria-label="Recent tickets"
                  className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] shadow-[0_22px_52px_rgba(50,36,22,0.08)] overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-[rgba(22,35,31,0.09)] flex items-center justify-between">
                    <div>
                      <p className="text-[#52625d] text-sm font-bold m-0">Recent Tickets</p>
                      <p className="text-[#8a9690] text-xs mt-1 mb-0">Latest support requests across the organization</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[780px] text-sm">
                      <thead>
                        <tr className="border-b border-[rgba(22,35,31,0.09)] bg-[#faf9f5]">
                          {['Reference', 'Title', 'Category', 'Priority', 'Status', 'Created By', 'Assigned To', 'Updated'].map((col) => (
                            <th
                              key={col}
                              className="px-4 py-3 text-left text-xs font-bold text-[#586760] uppercase tracking-wide whitespace-nowrap"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {recentTickets.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-6 text-center text-[#8a9690]">
                              No tickets found.
                            </td>
                          </tr>
                        ) : (
                          recentTickets.map((ticket) => (
                            <tr
                              key={ticket.ticketId}
                              onClick={() => navigate(`/tickets/${ticket.ticketId}`)}
                              className="border-b border-[rgba(22,35,31,0.06)] hover:bg-[#faf9f5] transition-colors cursor-pointer"
                            >
                              <td className="px-4 py-3.5 font-bold text-[#143a34] whitespace-nowrap">{ticket.ticketReference}</td>
                              <td className="px-4 py-3.5 font-medium text-[#26322e] max-w-[200px] truncate">{ticket.title}</td>
                              <td className="px-4 py-3.5 text-[#586760] whitespace-nowrap">{ticket.category}</td>
                              <td className="px-4 py-3.5">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${priorityStyles[ticket.priority] || priorityStyles.Low}`}>
                                  {ticket.priority}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${statusStyles[ticket.status] || statusStyles.Open}`}>
                                  {ticket.status}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-[#586760] whitespace-nowrap">{ticket.createdBy}</td>
                              <td className="px-4 py-3.5 text-[#586760] whitespace-nowrap">{ticket.assignedTo || 'Unassigned'}</td>
                              <td className="px-4 py-3.5 text-[#8a9690] whitespace-nowrap">
                                {formatRelativeTime(ticket.updatedAt || ticket.createdAt)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="space-y-6">
                  <section
                    aria-label="Quick actions"
                    className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-5 shadow-[0_22px_52px_rgba(50,36,22,0.08)]"
                  >
                    <p className="text-[#52625d] text-sm font-bold m-0">Quick Actions</p>
                    <p className="text-[#8a9690] text-xs mt-1 mb-4">Common workflow shortcuts for {currentUser.role}</p>
                    <div className="grid grid-cols-1 gap-2.5">
                      {quickActions.map((action) => {
                        const actionRoute = getActionRoute(action.label)
                        return (
                          <button
                            key={action.label}
                            type="button"
                            onClick={() => actionRoute && navigate(actionRoute)}
                            className={`
                              w-full px-4 py-3 rounded-lg text-sm font-bold transition-all duration-150
                              ${action.variant === 'primary'
                                ? 'bg-[#143a34] text-white hover:bg-[#0d2d28] hover:-translate-y-px shadow-[0_4px_12px_rgba(20,58,52,0.2)]'
                                : 'bg-[#faf9f5] text-[#26322e] border border-[#ddded8] hover:bg-white hover:border-[#19b99a] hover:shadow-[0_0_0_3px_rgba(25,185,154,0.1)]'
                              }
                            `}
                          >
                            {action.label}
                          </button>
                        )
                      })}
                    </div>
                  </section>

                  <section
                    aria-label="Notifications"
                    className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-5 shadow-[0_22px_52px_rgba(50,36,22,0.08)]"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[#52625d] text-sm font-bold m-0">Notifications</p>
                        <p className="text-[#8a9690] text-xs mt-1 mb-0">
                          {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#fdeef2] text-[#b83d5e] text-xs font-bold border border-[#f5ccd8]">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-center text-[#8a9690] text-sm py-4 m-0">No notifications yet.</p>
                    ) : (
                      <ul className="space-y-3 m-0 p-0 list-none">
                        {notifications.slice(0, 4).map((notif) => (
                          <li key={notif.notificationId}>
                            <button
                              type="button"
                              onClick={() => handleNotificationClick(notif)}
                              className={`w-full text-left flex gap-3 p-3 rounded-lg border transition-colors hover:bg-[#faf9f5] ${
                                !notif.isRead
                                  ? 'bg-[#faf9f5] border-[#ddded8]'
                                  : 'bg-transparent border-transparent'
                              }`}
                            >
                              <span
                                className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${
                                  !notif.isRead ? 'bg-[#f75d89]' : 'bg-[#c5ccc8]'
                                }`}
                              />
                              <span className="min-w-0">
                                <span className={`block text-sm leading-snug ${!notif.isRead ? 'font-bold text-[#26322e]' : 'font-medium text-[#586760]'}`}>
                                  {notif.title}
                                </span>
                                <span className="block text-[#8a9690] text-xs mt-1">
                                  {notif.ticketReference} - {formatRelativeTime(notif.createdAt)}
                                </span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <section
                  aria-label="Status overview"
                  className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-5 shadow-[0_22px_52px_rgba(50,36,22,0.08)]"
                >
                  <p className="text-[#52625d] text-sm font-bold m-0">Status Overview</p>
                  <p className="text-[#8a9690] text-xs mt-1 mb-5">Ticket distribution by current status</p>
                  {statusOverview.length === 0 ? (
                    <p className="text-center text-[#8a9690] text-sm py-4 m-0">No status data yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {statusOverview.map((item) => {
                        const pct = Math.round((item.count / item.total) * 100)
                        return (
                          <div key={item.status}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-semibold text-[#26322e]">{item.status}</span>
                              <span className="text-xs font-bold text-[#586760]">
                                {item.count} <span className="text-[#8a9690] font-medium">({pct}%)</span>
                              </span>
                            </div>
                            <div className="h-2 rounded-sm bg-[#eef1ef] overflow-hidden">
                              <div
                                className={`h-full rounded-sm transition-all ${statusBarColors[item.status] || 'bg-[#8a9690]'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>

                <section
                  aria-label="Tickets by category"
                  className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-5 shadow-[0_22px_52px_rgba(50,36,22,0.08)]"
                >
                  <p className="text-[#52625d] text-sm font-bold m-0">Tickets by Category</p>
                  <p className="text-[#8a9690] text-xs mt-1 mb-5">Volume across support categories</p>
                  {categoryBreakdown.length === 0 ? (
                    <p className="text-center text-[#8a9690] text-sm py-4 m-0">No category data yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {categoryBreakdown.map((item) => (
                        <div key={item.category} className="flex items-center gap-3">
                          <span className="shrink-0 inline-block px-2.5 py-1 rounded text-xs font-bold bg-[#eef1ef] text-[#586760] border border-[#dde0dc] min-w-[110px] text-center">
                            {item.category}
                          </span>
                          <div className="flex-1 h-2 rounded-sm bg-[#eef1ef] overflow-hidden">
                            <div
                              className="h-full rounded-sm bg-gradient-to-r from-[#12d9a8] to-[#19b99a]"
                              style={{ width: `${(item.count / maxCategoryCount) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-[#586760] w-6 text-right">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section
                  aria-label="Priority breakdown"
                  className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-5 shadow-[0_22px_52px_rgba(50,36,22,0.08)]"
                >
                  <p className="text-[#52625d] text-sm font-bold m-0">Priority Breakdown</p>
                  <p className="text-[#8a9690] text-xs mt-1 mb-5">Open tickets by priority level</p>
                  {priorityBreakdown.length === 0 ? (
                    <p className="text-center text-[#8a9690] text-sm py-4 m-0">No priority data yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {priorityBreakdown.map((item) => (
                        <div key={item.priority}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${priorityStyles[item.priority] || priorityStyles.Low}`}>
                              {item.priority}
                            </span>
                            <span className="text-xs font-bold text-[#586760]">{item.count}</span>
                          </div>
                          <div className="h-2 rounded-sm bg-[#eef1ef] overflow-hidden">
                            <div
                              className={`h-full rounded-sm ${priorityBarColors[item.priority] || 'bg-[#8a9690]'}`}
                              style={{ width: `${(item.count / maxPriorityCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <section
                aria-label="Recent activity"
                className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-5 shadow-[0_22px_52px_rgba(50,36,22,0.08)]"
              >
                <p className="text-[#52625d] text-sm font-bold m-0">Recent Activity</p>
                <p className="text-[#8a9690] text-xs mt-1 mb-5">Latest actions from tickets, users, and system events</p>
                {recentActivity.length === 0 ? (
                  <p className="text-center text-[#8a9690] text-sm py-4 m-0">No recent activity yet.</p>
                ) : (
                  <ul className="space-y-0 m-0 p-0 list-none divide-y divide-[rgba(22,35,31,0.06)]">
                    {recentActivity.map((activity) => (
                      <li key={activity.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                        <span className={`shrink-0 w-2.5 h-2.5 rounded-full mt-1.5 ${activityDotColors[activity.type] || 'bg-[#8a9690]'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#26322e] m-0">
                            <span className="font-bold">{activity.actor}</span>{' '}
                            <span className="text-[#586760]">{activity.detail}</span>
                          </p>
                        </div>
                        <time className="shrink-0 text-xs text-[#8a9690] font-medium whitespace-nowrap">{activity.time}</time>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard
