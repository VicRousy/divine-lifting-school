import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, serviceKey)

const ALLOWED = [
  'https://divine-lifting-school.vercel.app',
  'https://divine-lifting-website.vercel.app',
  'http://localhost:5173',
  'http://localhost:3001',
]

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const origin = req.headers.origin || req.headers.referer || ''
  if (origin && !ALLOWED.some(a => origin.startsWith(a) && origin.length === a.length)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const key = req.headers['x-api-key']
  if (!key || key !== process.env.EMAIL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { type } = req.body

  try {
    switch (type) {
      case 'create-user':
        return await createUser(req, res)
      case 'reset-password':
        return await resetPassword(req, res)
      case 'delete-user':
        return await deleteUser(req, res)
      default:
        return res.status(400).json({ error: 'Invalid auth type' })
    }
  } catch (error) {
    console.error(`Auth error [${type}]:`, error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

async function createUser(req, res) {
  const { email, password, userData } = req.body
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Missing email or password' })
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: userData || {},
  })

  if (error) {
    if (error.message.includes('already been registered')) {
      return res.json({ success: true, auth_id: null, alreadyExists: true })
    }
    return res.status(400).json({ success: false, error: 'Failed to create user' })
  }

  return res.json({ success: true, auth_id: data.user.id })
}

async function resetPassword(req, res) {
  const { email, newPassword, userId } = req.body
  if (!newPassword) {
    return res.status(400).json({ success: false, error: 'Missing password' })
  }

  let targetId = userId
  if (!targetId) {
    const { data: users, error: listErr } = await supabase.auth.admin.listUsers()
    if (listErr) return res.status(400).json({ success: false, error: 'Failed to find user' })
    const user = users.users.find(u => u.email === email?.trim()?.toLowerCase())
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })
    targetId = user.id
  }

  const { error } = await supabase.auth.admin.updateUserById(targetId, {
    password: newPassword,
  })

  if (error) return res.status(400).json({ success: false, error: 'Failed to reset password' })
  return res.json({ success: true })
}

async function deleteUser(req, res) {
  const { userId, email } = req.body
  let targetId = userId
  if (!targetId) {
    const { data: users, error: listErr } = await supabase.auth.admin.listUsers()
    if (listErr) return res.status(400).json({ success: false, error: 'Failed to find user' })
    const user = users.users.find(u => u.email === email?.trim()?.toLowerCase())
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })
    targetId = user.id
  }

  const { error } = await supabase.auth.admin.deleteUser(targetId)
  if (error) return res.status(400).json({ success: false, error: 'Failed to delete user' })
  return res.json({ success: true })
}
