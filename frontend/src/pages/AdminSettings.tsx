import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../components/BackButton'
import DashboardShell from '../components/DashboardShell'
import {
  getAllCategories,
  getPrioritySettings,
  getStatusSettings,
  saveCategory,
  savePriority,
  saveStatus,
  type OrderedLookupSetting,
} from '../services/adminService'
import { getAIStatus, type AIStatusResponse } from '../services/aiService'
import { getCurrentUser } from '../services/authService'
import { getSystemCounts, type SystemCounts } from '../services/userService'

type EditableLookup = {
  id: number
  name: string
  description: string
  sortOrder: number
  isActive: boolean
}

function LookupEditor({
  title,
  items,
  categoryMode = false,
  onSave,
}: {
  title: string
  items: EditableLookup[]
  categoryMode?: boolean
  onSave: (item: Omit<EditableLookup, 'id'>, id?: number) => Promise<void>
}) {
  const [editingId, setEditingId] = useState<number | undefined>()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function resetForm() {
    setEditingId(undefined)
    setName('')
    setDescription('')
    setSortOrder(0)
    setIsActive(true)
    setError('')
  }

  function edit(item: EditableLookup) {
    setEditingId(item.id)
    setName(item.name)
    setDescription(item.description)
    setSortOrder(item.sortOrder)
    setIsActive(item.isActive)
    setError('')
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return

    try {
      setSaving(true)
      setError('')
      await onSave({ name: name.trim(), description: description.trim(), sortOrder, isActive }, editingId)
      resetForm()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to save ${title.toLowerCase()}.`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] shadow-[0_22px_52px_rgba(50,36,22,0.08)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[rgba(22,35,31,0.09)]">
        <p className="text-sm font-bold text-[#52625d] m-0">{title}</p>
        <p className="text-xs text-[#8a9690] mt-1 mb-0">Add or update existing {title.toLowerCase()}.</p>
      </div>

      <form onSubmit={submit} className="p-5 bg-[#faf9f5] border-b border-[rgba(22,35,31,0.09)] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" maxLength={100} className="px-4 py-2.5 rounded-lg border border-[#dde0dc] bg-white text-sm text-[#17211d] focus:outline-none focus:ring-2 focus:ring-[#19b99a]" />
          <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" maxLength={500} className="px-4 py-2.5 rounded-lg border border-[#dde0dc] bg-white text-sm text-[#17211d] focus:outline-none focus:ring-2 focus:ring-[#19b99a]" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {categoryMode ? (
            <label className="inline-flex items-center gap-2 text-sm text-[#586760]">
              <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} /> Active
            </label>
          ) : (
            <label className="inline-flex items-center gap-2 text-sm text-[#586760]">
              Sort order
              <input type="number" min={0} max={1000} value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} className="w-24 px-3 py-2 rounded-lg border border-[#dde0dc] bg-white" />
            </label>
          )}
          <button type="submit" disabled={saving || !name.trim()} className="px-4 py-2 rounded-lg text-sm font-bold bg-[#143a34] text-white hover:bg-[#0d2d28] disabled:opacity-50">
            {saving ? 'Saving...' : editingId ? 'Save Changes' : `Add ${title === 'Categories' ? 'Category' : title.slice(0, -1)}`}
          </button>
          {editingId && <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg text-sm font-bold bg-white text-[#26322e] border border-[#ddded8]">Cancel</button>}
        </div>
        {error && <p className="text-sm font-medium text-[#b83d5e] m-0" role="alert">{error}</p>}
      </form>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead><tr className="border-b border-[rgba(22,35,31,0.09)]">
            <th className="px-5 py-3 text-left text-xs font-bold text-[#586760] uppercase tracking-wide">Name</th>
            <th className="px-5 py-3 text-left text-xs font-bold text-[#586760] uppercase tracking-wide">Description</th>
            <th className="px-5 py-3 text-left text-xs font-bold text-[#586760] uppercase tracking-wide">{categoryMode ? 'State' : 'Order'}</th>
            <th className="px-5 py-3 text-right text-xs font-bold text-[#586760] uppercase tracking-wide">Action</th>
          </tr></thead>
          <tbody>{items.map((item) => (
            <tr key={item.id} className="border-b border-[rgba(22,35,31,0.06)] last:border-b-0">
              <td className="px-5 py-3.5 font-bold text-[#26322e]">{item.name}</td>
              <td className="px-5 py-3.5 text-[#586760]">{item.description || '—'}</td>
              <td className="px-5 py-3.5 text-[#586760]">{categoryMode ? (item.isActive ? 'Active' : 'Inactive') : item.sortOrder}</td>
              <td className="px-5 py-3.5 text-right"><button type="button" onClick={() => edit(item)} className="text-sm font-bold text-[#143a34] hover:text-[#19b99a]">Edit</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  )
}

export default function AdminSettings() {
  const navigate = useNavigate()
  const [currentUser] = useState(() => getCurrentUser())
  const [categories, setCategories] = useState<EditableLookup[]>([])
  const [priorities, setPriorities] = useState<EditableLookup[]>([])
  const [statuses, setStatuses] = useState<EditableLookup[]>([])
  const [aiStatus, setAIStatus] = useState<AIStatusResponse | null>(null)
  const [systemCounts, setSystemCounts] = useState<SystemCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadSettings() {
    const [categoryRows, priorityRows, statusRows, status, counts] = await Promise.all([
      getAllCategories(), getPrioritySettings(), getStatusSettings(), getAIStatus(), getSystemCounts(),
    ])
    setCategories(categoryRows.map((item) => ({ id: item.categoryId, name: item.categoryName, description: item.description || '', sortOrder: 0, isActive: item.isActive })))
    setPriorities(priorityRows.map(toEditableLookup))
    setStatuses(statusRows.map(toEditableLookup))
    setAIStatus(status)
    setSystemCounts(counts)
  }

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true })
      return
    }
    if (currentUser.role !== 'Admin') {
      navigate('/dashboard', { replace: true, state: { unauthorizedMessage: 'You do not have permission to access admin settings.' } })
      return
    }

    async function initialLoad() {
      try {
        await loadSettings()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load admin settings.')
      } finally {
        setLoading(false)
      }
    }

    initialLoad()
  }, [currentUser, navigate])

  if (!currentUser || currentUser.role !== 'Admin') return null

  async function saveAndReload(action: () => Promise<unknown>) {
    await action()
    await loadSettings()
  }

  return (
    <DashboardShell currentUser={currentUser} pageName="Admin Settings">
      <BackButton />
      <header className="mb-8">
        <p className="text-[#a3493d] text-xs font-extrabold uppercase tracking-wide m-0">Administration</p>
        <h1 className="text-[clamp(28px,4vw,40px)] font-[850] text-[#17211d] m-0 mt-2 leading-tight">Admin Settings</h1>
        <p className="text-[#6b716d] text-[15px] leading-relaxed mt-2 mb-0">Manage ticket lookup values and review AI configuration status.</p>
      </header>

      {loading && <div className="px-4 py-3 rounded-lg bg-white border border-[rgba(19,35,30,0.1)] text-sm text-[#586760]">Loading settings...</div>}
      {error && <div className="mb-4 px-4 py-3 rounded-lg bg-[#fdeef2] text-[#b83d5e] border border-[#f5ccd8] text-sm font-medium" role="alert">{error}</div>}

      {!loading && !error && (
        <div className="space-y-6">
          {systemCounts && (
            <section className="grid grid-cols-2 lg:grid-cols-5 gap-4" aria-label="System counts">
              {[
                ['Users', systemCounts.totalUsers],
                ['Active Users', systemCounts.activeUsers],
                ['Tickets', systemCounts.totalTickets],
                ['Unassigned', systemCounts.unassignedTickets],
                ['Categories', systemCounts.categories],
              ].map(([label, value]) => (
                <article key={label} className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-4 shadow-[0_22px_52px_rgba(50,36,22,0.08)]">
                  <p className="text-xs font-bold text-[#8a9690] uppercase tracking-wide m-0">{label}</p>
                  <p className="text-2xl font-bold text-[#26322e] mt-2 mb-0">{value}</p>
                </article>
              ))}
            </section>
          )}

          {aiStatus && (
            <section className="rounded-lg border border-[rgba(19,35,30,0.1)] bg-[rgba(255,255,255,0.94)] p-5 shadow-[0_22px_52px_rgba(50,36,22,0.08)]">
              <p className="text-sm font-bold text-[#52625d] m-0">AI Status</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div><p className="text-xs font-bold text-[#8a9690] uppercase m-0">Provider</p><p className="text-sm font-bold text-[#26322e] mt-1 mb-0">{aiStatus.provider}</p></div>
                <div><p className="text-xs font-bold text-[#8a9690] uppercase m-0">Mode</p><p className="text-sm font-bold text-[#26322e] mt-1 mb-0">{aiStatus.mode}</p></div>
                <div><p className="text-xs font-bold text-[#8a9690] uppercase m-0">Model</p><p className="text-sm font-bold text-[#26322e] mt-1 mb-0">{aiStatus.model || 'Not configured'}</p></div>
              </div>
              <p className="text-sm text-[#586760] mt-4 mb-0">{aiStatus.message}</p>
            </section>
          )}

          <LookupEditor title="Categories" categoryMode items={categories} onSave={(item, id) => saveAndReload(() => saveCategory({ categoryName: item.name, description: item.description, isActive: item.isActive }, id))} />
          <LookupEditor title="Priorities" items={priorities} onSave={(item, id) => saveAndReload(() => savePriority({ name: item.name, description: item.description, sortOrder: item.sortOrder }, id))} />
          <LookupEditor title="Statuses" items={statuses} onSave={(item, id) => saveAndReload(() => saveStatus({ name: item.name, description: item.description, sortOrder: item.sortOrder }, id))} />
        </div>
      )}
    </DashboardShell>
  )
}

function toEditableLookup(item: OrderedLookupSetting): EditableLookup {
  return { id: item.id, name: item.name, description: item.description || '', sortOrder: item.sortOrder, isActive: true }
}
