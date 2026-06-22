import API_BASE_URL from '../api'
import { getToken } from './authService'

export type UserProfileData = {
  userId: number
  fullName: string
  email: string
  role: string
  createdAt: string
  createdTicketsCount: number
  assignedTicketsCount: number | null
}

export type ManagedUser = {
  userId: number
  fullName: string
  email: string
  role: string
  isActive: boolean
}

async function get<T>(path: string): Promise<T> {
  const token = getToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.message || 'Request failed.')
  return result as T
}

export function getUserProfile(): Promise<UserProfileData> {
  return get('/Users/profile')
}

export function getManagedUsers(search = '', role = ''): Promise<ManagedUser[]> {
  const query = new URLSearchParams()
  if (search.trim()) query.set('search', search.trim())
  if (role) query.set('role', role)
  const suffix = query.toString() ? `?${query}` : ''
  return get(`/Users${suffix}`)
}
