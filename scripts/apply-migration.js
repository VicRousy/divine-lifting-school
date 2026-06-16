// Usage: node scripts/apply-migration.js <sql-file-path>
// Requires SUPABASE_SERVICE_KEY env var to be set.
// The service key is available on Vercel (vercel env pull) or Supabase dashboard.

import { readFileSync } from 'fs'

const sqlFile = process.argv[2]
if (!sqlFile) {
  console.error('Usage: node scripts/apply-migration.js <sql-file-path>')
  console.error('Example: node scripts/apply-migration.js supabase/migrations/20260616_verify_login_password.sql')
  process.exit(1)
}

const serviceKey = process.env.SUPABASE_SERVICE_KEY
if (!serviceKey) {
  console.error('ERROR: SUPABASE_SERVICE_KEY env var is not set.')
  console.error('')
  console.error('To get it:')
  console.error('  1. Go to https://supabase.com/dashboard/project/dxnsrxfpnbkwdrvkvfpo/settings/api')
  console.error('  2. Copy the service_role key')
  console.error('  3. Or run: vercel env pull (if Vercel CLI is installed)')
  process.exit(1)
}

const sql = readFileSync(sqlFile, 'utf8')
const ref = 'dxnsrxfpnbkwdrvkvfpo'

const { error } = await fetch(`https://${ref}.supabase.co/sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  },
  body: JSON.stringify({ query: sql }),
}).then(async r => {
  const text = await r.text()
  if (!r.ok) return { error: `${r.status}: ${text}` }
  console.log('Migration applied successfully.')
  try { console.log(JSON.parse(text)) } catch { console.log(text) }
  return {}
}).catch(e => ({ error: e.message }))

if (error) {
  console.error('Migration failed:', error)
  // Fallback: try via management API
  console.log('')
  console.log('Alternative: Paste the SQL manually in Supabase SQL Editor:')
  console.log('  https://supabase.com/dashboard/project/dxnsrxfpnbkwdrvkvfpo/sql/new')
  console.log('')
  console.log('SQL to paste:')
  console.log(sql)
}
