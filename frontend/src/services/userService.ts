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
  recentTickets: Array<{
    ticketId: number
    ticketReference: string
    title: string
    status: string
    priority: string
    createdAt: string
  }>
}

export type ManagedUser = {
  userId: number
  fullName: string
  email: string
  role: string
  isActive: boolean
  department: string | null
  createdAt: string
  createdTicketsCount: number
  assignedTicketsCount: number
}

export type SystemCounts = {
  totalUsers: number
  activeUsers: number
  adminUsers: number
  agentUsers: number
  employeeUsers: number
  totalTickets: number
  unassignedTickets: number
  categories: number
  priorities: number
  statuses: number
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  const text = await response.text()
  const result = text ? JSON.parse(text) : null
  if (!response.ok) throw new Error(result.message || 'Request failed.')
  return result as T
}

export function getUserProfile(): Promise<UserProfileData> {
  return request('/Users/profile')
}

export function getManagedUsers(search = '', role = ''): Promise<ManagedUser[]> {
  const query = new URLSearchParams()
  if (search.trim()) query.set('search', search.trim())
  if (role) query.set('role', role)
  const suffix = query.toString() ? `?${query}` : ''
  return request(`/Users${suffix}`)
}

export function changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> {
  return request('/Users/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  })
}

export function updateManagedUserRole(userId: number, role: string): Promise<{ message: string }> {
  return request(`/Users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) })
}

export function updateManagedUserActiveState(userId: number, isActive: boolean): Promise<{ message: string }> {
  return request(`/Users/${userId}/active`, { method: 'PUT', body: JSON.stringify({ isActive }) })
}

export function getSystemCounts(): Promise<SystemCounts> {
  return request('/Users/system-counts')
}
