import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getCurrentUser, logoutUser } from '../services/authService'
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem,
} from '../services/ticketService'
import '../App.css'

type Role = 'Admin' | 'Agent' | 'User'

const sidebarNavItems = [
  { label: 'Dashboard', href: '/dashboard', roles: ['Admin', 'Agent', 'User'] as Role[] },
  { label: 'Tickets', href: '/tickets', roles: ['Admin', 'Agent', 'User'] as Role[] },
  { label: 'Create Ticket', href: '/tickets/create', roles: ['User'] as Role[] },
  { label: 'Notifications', href: '/notifications', roles: ['Admin', 'Agent', 'User'] as Role[] },
  { label: 'Reports', href: '/reports', roles: ['Admin'] as Role[] },
  { label: 'Admin Settings', href: '/admin/settings', roles: ['Admin'] as Role[] },
  { label: 'User Profile', href: '/profile', roles: ['Admin', 'Agent', 'User'] as Role[] },
]

function SparkIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export default function Notifications() {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentUser] = useState(() => getCurrentUser())
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<number | 'all' | null>(null)

  useEffect(() => {
    if (!currentUser) {
      navigate('/')
      return
    }

    let cancelled = false

    async function loadNotifications() {
      try {
        setLoading(true)
        setError('')
        const data = await getNotifications()

        if (!cancelled) {
          setNotifications(data)
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load notifications.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadNotifications()

    return () => {
      cancelled = true
    }
  }, [currentUser, navigate])

  if (!currentUser) {
    return null
  }

  const userRole = currentUser.role as Role
  const visibleNavItems = sidebarNavItems.filter((item) => item.roles.includes(userRole))
  const unreadCount = notifications.filter((notification) => !notification.isRead).length

  async function handleMarkRead(notification: NotificationItem) {
    if (notification.isRead) return

    try {
      setUpdating(notification.notificationId)
      setError('')
      const updated = await markNotificationAsRead(notification.notificationId)
      setNotifications((items) =>
        items.map((item) =>
          item.notificationId === notification.notificationId ? updated : item
        )
      )
    } catch {
      setError('Failed to update notification.')
    } finally {
      setUpdating(null)
    }
  }

  async function handleMarkAllRead() {
    try {
      setUpdating('all')
      setError('')
      await markAllNotificationsAsRead()
      setNotifications((items) =>
        items.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || new Date().toISOString(),
        }))
      )
    } catch {
      setError('Failed to update notifications.')
    } finally {
      setUpdating(null)
    }
  }

  async function handleOpenNotification(notification: NotificationItem) {
    await handleMarkRead(notification)

    if (notification.ticketId) {
      navigate(`/tickets/${notification.ticketId}`)
    }
  }

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/dashboard')
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
            <p className="text-[rgba(247,251,247,0.7)] text-xs m-0">Notifications</p>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="relative">
            <div className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full bg-[rgba(25,185,154,0.06)] blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[360px] h-[360px] rounded-full bg-[rgba(12,59,52,0.04)] blur-3xl pointer-events-none translate-y-1/3 -translate-x-1/4" />

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
                  <p className="text-[#a3493d] text-xs font-extrabold uppercase tracking-wide m-0">Updates</p>
                  <h1 className="text-[clamp(28px,4vw,40px)] font-[850] text-[#17211d] m-0 mt-2 leading-tight">
                    Notifications
                  </h1>
                  <p className="text-[#6b716d] text-[15px] leading-relaxed mt-2 mb-0 max-w-xl">
                    Review ticket updates and mark alerts as read.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/90 border border-[rgba(19,35,30,0.1)] shadow-[0_4px_16px_rgba(50,36,22,0.06)] w-fit">
                  <span className="w-2 h-2 rounded-full bg-[#12d9a8]" />
                  <span className="text-sm font-semibold text-[#26322e]">{currentUser.fullName}</span>
                  <span className="text-xs text-[#8a9690] hidden sm:inline">- {currentUser.role}</span>
                </div>
              </header>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-[#fdeef2] text-[#b83d5e] border border-[#f5ccd8] text-sm font-medium">
                  {error}
                </div>
              )}

              <section
                aria-label="Notifications list"
                className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] shadow-[0_22px_52px_rgba(50,36,22,0.08)] overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-[rgba(22,35,31,0.09)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-[#52625d] text-sm font-bold m-0">All Notifications</p>
                    <p className="text-[#8a9690] text-xs mt-1 mb-0">
                      {unreadCount} unread alert{unreadCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      disabled={updating === 'all'}
                      className="px-4 py-2 rounded-lg text-sm font-bold bg-[#143a34] text-white hover:bg-[#0d2d28] transition-colors shadow-[0_4px_12px_rgba(20,58,52,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating === 'all' ? 'Marking...' : 'Mark all as read'}
                    </button>
                  )}
                </div>

                {loading ? (
                  <p className="px-5 py-8 text-center text-[#8a9690] text-sm m-0">Loading notifications...</p>
                ) : notifications.length === 0 ? (
                  <p className="px-5 py-8 text-center text-[#8a9690] text-sm m-0">No notifications yet.</p>
                ) : (
                  <ul className="m-0 p-0 list-none divide-y divide-[rgba(22,35,31,0.06)]">
                    {notifications.map((notification) => (
                      <li key={notification.notificationId} className={notification.isRead ? 'bg-white' : 'bg-[#faf9f5]'}>
                        <div className="px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <button
                            type="button"
                            onClick={() => handleOpenNotification(notification)}
                            className="flex-1 min-w-0 text-left flex gap-3"
                          >
                            <span
                              className={`shrink-0 w-2.5 h-2.5 rounded-full mt-1.5 ${
                                notification.isRead ? 'bg-[#c5ccc8]' : 'bg-[#f75d89]'
                              }`}
                            />
                            <span className="min-w-0">
                              <span className={`block text-sm leading-snug ${notification.isRead ? 'font-medium text-[#586760]' : 'font-bold text-[#26322e]'}`}>
                                {notification.title}
                              </span>
                              <span className="block text-sm text-[#586760] mt-1 leading-relaxed">
                                {notification.message}
                              </span>
                              <span className="block text-xs text-[#8a9690] mt-1">
                                {notification.ticketReference} - {formatDate(notification.createdAt)}
                              </span>
                            </span>
                          </button>

                          <div className="flex items-center gap-2 shrink-0 pl-5 lg:pl-0">
                            <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                              notification.isRead
                                ? 'bg-[#eef1ef] text-[#586760] border-[#dde0dc]'
                                : 'bg-[#fdeef2] text-[#b83d5e] border-[#f5ccd8]'
                            }`}>
                              {notification.isRead ? 'Read' : 'Unread'}
                            </span>
                            {!notification.isRead && (
                              <button
                                type="button"
                                onClick={() => handleMarkRead(notification)}
                                disabled={updating === notification.notificationId}
                                className="px-3 py-1.5 rounded-md text-xs font-bold bg-[#faf9f5] text-[#26322e] border border-[#ddded8] hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updating === notification.notificationId ? 'Marking...' : 'Mark read'}
                              </button>
                            )}
                          </div>
                        </div>
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
