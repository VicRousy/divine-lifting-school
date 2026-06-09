/**
 * Executes a Supabase query with automatic retry on failure.
 * Handles both promise rejections (network errors) and Supabase's { error } responses.
 *
 * @param {() => Promise<{ data: any, error?: any }>} fn - A function that returns a Supabase query promise
 * @param {{ retries?: number, fallback?: any }} [options] - Retry count (default 2) and fallback value (default null)
 * @returns {Promise<{ data: any }|null>} The Supabase result on success, or fallback on failure
 *
 * @example
 * const { data } = await safeQuery(() => supabase.from('students').select('*'))
 * const { data } = await safeQuery(() => supabase.from('students').select('*'), { retries: 3, fallback: [] })
 */
export async function safeQuery(fn, { retries = 2, fallback = null } = {}) {
  for (let i = 0; i <= retries; i++) {
    try {
      const result = await fn()
      if (result?.error) throw result.error
      return result
    } catch (err) {
      if (i === retries) {
        console.warn(`Query failed after ${retries} retries:`, err?.message || err)
        return fallback
      }
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  return fallback
}
