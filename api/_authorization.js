import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_KEY

function getBearerToken(req) {
  const header = req.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7) : ''
}

export async function requireAdmin(req, res) {
  const token = getBearerToken(req)
  if (!token || !supabaseUrl || !serviceKey) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (profileError || !profile) {
    res.status(403).json({ error: 'Administrator access required' })
    return null
  }

  return { supabase, user }
}
