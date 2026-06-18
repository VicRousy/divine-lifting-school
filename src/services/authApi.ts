import { API_URL } from '../config/api'

const API_KEY = import.meta.env.VITE_EMAIL_API_KEY

interface ApiFetchBody {
  type: string
  email?: string | null
  password?: string
  userData?: Record<string, unknown>
  newPassword?: string
  userId?: string | null
}

interface ApiResponse {
  error?: string
  [key: string]: unknown
}

async function apiFetch(body: ApiFetchBody): Promise<ApiResponse> {
  const response = await fetch(`${API_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify(body),
  })
  const data: ApiResponse = await response.json()
  if (!response.ok) throw new Error(data.error || 'Auth request failed')
  return data
}

export async function createAuthUser(email: string, password: string, userData: Record<string, unknown> = {}): Promise<ApiResponse> {
  return apiFetch({ type: 'create-user', email, password, userData })
}

export async function resetAuthPassword(email: string, newPassword: string, userId: string | null = null): Promise<ApiResponse> {
  return apiFetch({ type: 'reset-password', email, newPassword, userId })
}

export async function deleteAuthUser(userId: string, email: string | null = null): Promise<ApiResponse> {
  return apiFetch({ type: 'delete-user', userId, email })
}
