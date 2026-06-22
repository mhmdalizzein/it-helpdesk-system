import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logoutUser, type AuthUser } from '../services/authService'

type Role = 'Admin' | 'Agent' | 'User'

const navItems = [
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

export default function DashboardShell({
  currentUser,
  pageName,
  children,
}: {
  currentUser: AuthUser
  pageName: string
  children: ReactNode
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const visibleItems = navItems.filter((item) => item.roles.includes(currentUser.role))

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
            {visibleItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`block px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 ${location.pathname === item.href
                  ? 'bg-[rgba(255,255,255,0.14)] text-white border border-[rgba(255,255,255,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : 'text-[rgba(247,251,247,0.72)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[rgba(247,251,247,0.92)]'
                }`}
              >
                {item.label}
              </Link>
            ))}
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
            <p className="text-[rgba(247,251,247,0.7)] text-xs m-0">{pageName}</p>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="relative min-h-full">
            <div className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full bg-[rgba(25,185,154,0.06)] blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/4" />
            <div className="relative z-10 px-5 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-[1440px]">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
