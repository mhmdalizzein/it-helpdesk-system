import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../components/BackButton'
import DashboardShell from '../components/DashboardShell'
import { getCurrentUser } from '../services/authService'
import { getManagedUsers, updateManagedUserActiveState, updateManagedUserRole, type ManagedUser } from '../services/userService'

export default function ManageUsers() {
  const navigate = useNavigate()
  const [currentUser] = useState(() => getCurrentUser())
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [updating, setUpdating] = useState(false)
  const [actionMessage, setActionMessage] = useState('')

  async function loadUsers() {
    setUsers(await getManagedUsers())
  }

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true })
      return
    }
    if (currentUser.role !== 'Admin') {
      navigate('/dashboard', { replace: true, state: { unauthorizedMessage: 'You do not have permission to manage users.' } })
      return
    }

    async function initialLoad() {
      try {
        setUsers(await getManagedUsers())
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load users.')
      } finally {
        setLoading(false)
      }
    }

    initialLoad()
  }, [currentUser, navigate])

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    return users.filter((user) =>
      (!term || user.fullName.toLowerCase().includes(term) || user.email.toLowerCase().includes(term))
      && (!role || user.role === role)
    )
  }, [role, search, users])

  const selectedUser = users.find((user) => user.userId === selectedUserId) || null

  function selectUser(user: ManagedUser) {
    setSelectedUserId(user.userId)
    setSelectedRole(user.role)
    setActionMessage('')
    setError('')
  }

  async function handleRoleUpdate() {
    if (!selectedUser || !selectedRole || selectedRole === selectedUser.role) return
    try {
      setUpdating(true)
      setError('')
      const result = await updateManagedUserRole(selectedUser.userId, selectedRole)
      setActionMessage(result.message)
      await loadUsers()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update user role.')
    } finally {
      setUpdating(false)
    }
  }

  async function handleActiveUpdate() {
    if (!selectedUser) return
    try {
      setUpdating(true)
      setError('')
      const result = await updateManagedUserActiveState(selectedUser.userId, !selectedUser.isActive)
      setActionMessage(result.message)
      await loadUsers()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update account state.')
    } finally {
      setUpdating(false)
    }
  }

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
                  <tr key={user.userId} onClick={() => selectUser(user)} className="border-b border-[rgba(22,35,31,0.06)] last:border-b-0 hover:bg-[#faf9f5] cursor-pointer">
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

      {selectedUser && (
        <section className="mt-6 rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-5 shadow-[0_22px_52px_rgba(50,36,22,0.08)]">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div>
              <p className="text-sm font-bold text-[#52625d] m-0">User Details</p>
              <p className="text-lg font-bold text-[#26322e] mt-2 mb-0">{selectedUser.fullName}</p>
              <p className="text-sm text-[#586760] mt-1 mb-0">{selectedUser.email}</p>
              <p className="text-xs text-[#8a9690] mt-2 mb-0">Department: {selectedUser.department || 'Not set'} · Joined {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
              <p className="text-xs text-[#8a9690] mt-1 mb-0">Created tickets: {selectedUser.createdTicketsCount} · Assigned tickets: {selectedUser.assignedTicketsCount}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 lg:items-end">
              <label className="text-xs font-bold text-[#586760] uppercase tracking-wide">
                Role
                <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)} disabled={selectedUser.userId === currentUser.userId || updating} className="block mt-1 px-4 py-2.5 rounded-lg border border-[#dde0dc] bg-white text-sm text-[#17211d] disabled:opacity-50">
                  <option value="Admin">Admin</option><option value="Agent">Agent</option><option value="User">User</option>
                </select>
              </label>
              <button type="button" onClick={handleRoleUpdate} disabled={selectedUser.userId === currentUser.userId || updating || selectedRole === selectedUser.role} className="px-4 py-2.5 rounded-lg text-sm font-bold bg-[#143a34] text-white hover:bg-[#0d2d28] disabled:opacity-50">Save Role</button>
              <button type="button" onClick={handleActiveUpdate} disabled={selectedUser.userId === currentUser.userId || updating} className="px-4 py-2.5 rounded-lg text-sm font-bold bg-[#faf9f5] text-[#26322e] border border-[#ddded8] disabled:opacity-50">{selectedUser.isActive ? 'Deactivate' : 'Activate'}</button>
            </div>
          </div>
          {selectedUser.userId === currentUser.userId && <p className="text-xs text-[#8a9690] mt-4 mb-0">Your own role and active state cannot be changed here.</p>}
          {actionMessage && <p className="text-sm font-medium text-[#0b8e79] mt-4 mb-0" role="status">{actionMessage}</p>}
        </section>
      )}
    </DashboardShell>
  )
}
