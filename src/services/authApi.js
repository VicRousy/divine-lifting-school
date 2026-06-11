import { API_URL } from '../config/api'

const API_KEY = import.meta.env.VITE_EMAIL_API_KEY

async function apiFetch(body) {
  const response = await fetch(`${API_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Auth request failed')
  return data
}

export async function createAuthUser(email, password, userData = {}) {
  const result = await apiFetch({ type: 'create-user', email, password, userData })
  return result
}

export async function resetAuthPassword(email, newPassword, userId = null) {
  const result = await apiFetch({ type: 'reset-password', email, newPassword, userId })
  return result
}

export async function deleteAuthUser(userId, email = null) {
  const result = await apiFetch({ type: 'delete-user', userId, email })
  return result
}
