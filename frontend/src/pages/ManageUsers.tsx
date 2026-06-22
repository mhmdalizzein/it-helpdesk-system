import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../components/BackButton'
import DashboardShell from '../components/DashboardShell'
import { getCurrentUser } from '../services/authService'
import { getManagedUsers, type ManagedUser } from '../services/userService'

export default function ManageUsers() {
  const navigate = useNavigate()
  const [currentUser] = useState(() => getCurrentUser())
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true })
      return
    }
    if (currentUser.role !== 'Admin') {
      navigate('/dashboard', { replace: true, state: { unauthorizedMessage: 'You do not have permission to manage users.' } })
      return
    }

    getManagedUsers()
      .then(setUsers)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load users.'))
      .finally(() => setLoading(false))
  }, [currentUser, navigate])

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    return users.filter((user) =>
      (!term || user.fullName.toLowerCase().includes(term) || user.email.toLowerCase().includes(term))
      && (!role || user.role === role)
    )
  }, [role, search, users])

  if (!currentUser || currentUser.role !== 'Admin') return null

  return (
    <DashboardShell currentUser={currentUser} pageName="Manage Users">
      <BackButton />
      <header className="mb-8">
        <p className="text-[#a3493d] text-xs font-extrabold uppercase tracking-wide m-0">Administration</p>
        <h1 className="text-[clamp(28px,4vw,40px)] font-[850] text-[#17211d] m-0 mt-2 leading-tight">Manage Users</h1>
        <p className="text-[#6b716d] text-[15px] leading-relaxed mt-2 mb-0">Search users and review account roles.</p>
      </header>

      <section className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] shadow-[0_22px_52px_rgba(50,36,22,0.08)] overflow-hidden">
        <div className="p-5 border-b border-[rgba(22,35,31,0.09)] flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email"
            className="flex-1 px-4 py-2.5 rounded-lg border border-[#dde0dc] bg-white text-sm text-[#17211d] focus:outline-none focus:ring-2 focus:ring-[#19b99a]"
          />
          <select value={role} onChange={(event) => setRole(event.target.value)} className="px-4 py-2.5 rounded-lg border border-[#dde0dc] bg-white text-sm text-[#17211d]">
            <option value="">All roles</option>
            <option value="Admin">Admin</option>
            <option value="Agent">Agent</option>
            <option value="User">User</option>
          </select>
        </div>

        {loading ? (
          <p className="p-6 text-center text-sm text-[#8a9690]">Loading users...</p>
        ) : error ? (
          <div className="m-5 px-4 py-3 rounded-lg bg-[#fdeef2] text-[#b83d5e] border border-[#f5ccd8] text-sm font-medium" role="alert">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="bg-[#faf9f5] border-b border-[rgba(22,35,31,0.09)]">
                {['Name', 'Email', 'Role', 'Status'].map((heading) => <th key={heading} className="px-5 py-3 text-left text-xs font-bold text-[#586760] uppercase tracking-wide">{heading}</th>)}
              </tr></thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-6 text-center text-[#8a9690]">No users found.</td></tr>
                ) : filteredUsers.map((user) => (
                  <tr key={user.userId} className="border-b border-[rgba(22,35,31,0.06)] last:border-b-0">
                    <td className="px-5 py-3.5 font-bold text-[#26322e]">{user.fullName}</td>
                    <td className="px-5 py-3.5 text-[#586760]">{user.email}</td>
                    <td className="px-5 py-3.5"><span className="px-2 py-0.5 rounded text-xs font-bold bg-[#eef1ef] text-[#586760] border border-[#dde0dc]">{user.role}</span></td>
                    <td className="px-5 py-3.5 text-[#586760]">{user.isActive ? 'Active' : 'Inactive'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardShell>
  )
}
