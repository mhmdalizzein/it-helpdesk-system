import API_BASE_URL from '../api'
import { getToken } from './authService'

export type CategorySetting = {
  categoryId: number
  categoryName: string
  description: string | null
  isActive: boolean
}

export type OrderedLookupSetting = {
  id: number
  name: string
  description: string | null
  sortOrder: number
}

type RawPriority = {
  priorityId: number
  priorityName: string
  description: string | null
  sortOrder: number
}

type RawStatus = {
  statusId: number
  statusName: string
  description: string | null
  sortOrder: number
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
  if (!response.ok) {
    throw new Error(result?.message || 'Request failed.')
  }
  return result as T
}

export function getAllCategories(): Promise<CategorySetting[]> {
  return request('/Lookups/categories/all')
}

export async function getPrioritySettings(): Promise<OrderedLookupSetting[]> {
  const items = await request<RawPriority[]>('/Lookups/priorities')
  return items.map((item) => ({ id: item.priorityId, name: item.priorityName, description: item.description, sortOrder: item.sortOrder }))
}

export async function getStatusSettings(): Promise<OrderedLookupSetting[]> {
  const items = await request<RawStatus[]>('/Lookups/statuses')
  return items.map((item) => ({ id: item.statusId, name: item.statusName, description: item.description, sortOrder: item.sortOrder }))
}

export function saveCategory(item: Omit<CategorySetting, 'categoryId'>, id?: number): Promise<CategorySetting> {
  return request(`/Lookups/categories${id ? `/${id}` : ''}`, {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify({ name: item.categoryName, description: item.description, isActive: item.isActive }),
  })
}

export function savePriority(item: Omit<OrderedLookupSetting, 'id'>, id?: number): Promise<unknown> {
  return request(`/Lookups/priorities${id ? `/${id}` : ''}`, {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(item),
  })
}

export function saveStatus(item: Omit<OrderedLookupSetting, 'id'>, id?: number): Promise<unknown> {
  return request(`/Lookups/statuses${id ? `/${id}` : ''}`, {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(item),
  })
}
