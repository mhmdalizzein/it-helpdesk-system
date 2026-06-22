import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../components/BackButton'
import DashboardShell from '../components/DashboardShell'
import { getCurrentUser } from '../services/authService'
import { changePassword, getUserProfile, type UserProfileData } from '../services/userService'

export default function UserProfile() {
  const navigate = useNavigate()
  const [currentUser] = useState(() => getCurrentUser())
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

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

  async function handlePasswordChange(event: React.FormEvent) {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }

    try {
      setPasswordSaving(true)
      const result = await changePassword(currentPassword, newPassword, confirmPassword)
      setPasswordSuccess(result.message)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password.')
    } finally {
      setPasswordSaving(false)
    }
  }

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
        <div className="space-y-6">
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

          <section className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] shadow-[0_22px_52px_rgba(50,36,22,0.08)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[rgba(22,35,31,0.09)]">
              <p className="text-sm font-bold text-[#52625d] m-0">Recent Related Tickets</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead><tr className="bg-[#faf9f5] border-b border-[rgba(22,35,31,0.09)]">
                  {['Reference', 'Title', 'Priority', 'Status', 'Created'].map((heading) => <th key={heading} className="px-5 py-3 text-left text-xs font-bold text-[#586760] uppercase tracking-wide">{heading}</th>)}
                </tr></thead>
                <tbody>{profile.recentTickets.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-6 text-center text-[#8a9690]">No recent tickets</td></tr>
                ) : profile.recentTickets.map((ticket) => (
                  <tr key={ticket.ticketId} onClick={() => navigate(`/tickets/${ticket.ticketId}`)} className="border-b border-[rgba(22,35,31,0.06)] cursor-pointer hover:bg-[#faf9f5]">
                    <td className="px-5 py-3.5 font-bold text-[#143a34]">{ticket.ticketReference}</td>
                    <td className="px-5 py-3.5 text-[#26322e]">{ticket.title}</td>
                    <td className="px-5 py-3.5 text-[#586760]">{ticket.priority}</td>
                    <td className="px-5 py-3.5 text-[#586760]">{ticket.status}</td>
                    <td className="px-5 py-3.5 text-[#8a9690]">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-5 shadow-[0_22px_52px_rgba(50,36,22,0.08)]">
            <p className="text-sm font-bold text-[#52625d] m-0">Change Password</p>
            <p className="text-xs text-[#8a9690] mt-1 mb-4">Use at least 8 characters with uppercase, lowercase, and a number.</p>
            <form onSubmit={handlePasswordChange} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Current password" required className="px-4 py-2.5 rounded-lg border border-[#dde0dc] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#19b99a]" />
              <input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" required minLength={8} className="px-4 py-2.5 rounded-lg border border-[#dde0dc] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#19b99a]" />
              <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" required minLength={8} className="px-4 py-2.5 rounded-lg border border-[#dde0dc] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#19b99a]" />
              <div className="lg:col-span-3">
                <button type="submit" disabled={passwordSaving} className="px-5 py-2.5 rounded-lg text-sm font-bold bg-[#143a34] text-white hover:bg-[#0d2d28] disabled:opacity-50">{passwordSaving ? 'Changing...' : 'Change Password'}</button>
                {passwordError && <p className="text-sm font-medium text-[#b83d5e] mt-3 mb-0" role="alert">{passwordError}</p>}
                {passwordSuccess && <p className="text-sm font-medium text-[#0b8e79] mt-3 mb-0" role="status">{passwordSuccess}</p>}
              </div>
            </form>
          </section>
        </div>
      )}
    </DashboardShell>
  )
}
