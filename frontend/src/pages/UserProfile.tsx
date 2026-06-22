import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../components/BackButton'
import DashboardShell from '../components/DashboardShell'
import { getCurrentUser } from '../services/authService'
import { getUserProfile, type UserProfileData } from '../services/userService'

export default function UserProfile() {
  const navigate = useNavigate()
  const [currentUser] = useState(() => getCurrentUser())
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true })
      return
    }

    getUserProfile()
      .then(setProfile)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load profile.'))
      .finally(() => setLoading(false))
  }, [currentUser, navigate])

  if (!currentUser) return null

  return (
    <DashboardShell currentUser={currentUser} pageName="User Profile">
      <BackButton />
      <header className="mb-8">
        <p className="text-[#a3493d] text-xs font-extrabold uppercase tracking-wide m-0">Account</p>
        <h1 className="text-[clamp(28px,4vw,40px)] font-[850] text-[#17211d] m-0 mt-2 leading-tight">User Profile</h1>
        <p className="text-[#6b716d] text-[15px] leading-relaxed mt-2 mb-0">Review your account and ticket activity.</p>
      </header>

      {loading && <div className="px-4 py-3 rounded-lg bg-white border border-[rgba(19,35,30,0.1)] text-sm text-[#586760]">Loading profile...</div>}
      {error && <div className="px-4 py-3 rounded-lg bg-[#fdeef2] text-[#b83d5e] border border-[#f5ccd8] text-sm font-medium" role="alert">{error}</div>}

      {profile && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[
            ['Name', profile.fullName],
            ['Email', profile.email],
            ['Role', profile.role],
            ['Created Tickets', String(profile.createdTicketsCount)],
            ...(profile.assignedTicketsCount !== null ? [['Assigned Tickets', String(profile.assignedTicketsCount)]] : []),
            ['Member Since', new Date(profile.createdAt).toLocaleDateString()],
          ].map(([label, value]) => (
            <article key={label} className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-5 shadow-[0_22px_52px_rgba(50,36,22,0.08)]">
              <p className="text-xs font-bold text-[#8a9690] uppercase tracking-wide m-0">{label}</p>
              <p className="text-base font-bold text-[#26322e] mt-2 mb-0 break-words">{value}</p>
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
