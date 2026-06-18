interface SafeQueryOptions {
  retries?: number
  fallback?: any
  cacheKey?: string
}

interface QueryResult {
  data: any
  error?: any
}

const queryCache = new Map<string, { data: any; ts: number }>()
const CACHE_TTL = 5_000

export async function safeQuery<T extends QueryResult>(
  fn: () => PromiseLike<T>,
  { retries = 2, fallback = { data: null, error: null }, cacheKey }: SafeQueryOptions = {}
): Promise<T> {
  if (cacheKey) {
    const cached = queryCache.get(cacheKey)
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data
  }

  for (let i = 0; i <= retries; i++) {
    try {
      const result = await fn()
      if (result?.error) throw result.error
      if (cacheKey) queryCache.set(cacheKey, { data: result, ts: Date.now() })
      return result
    } catch (err) {
      if (i === retries) {
        console.warn(`Query failed after ${retries} retries:`, (err as Error)?.message || err)
        return fallback
      }
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  return fallback
}

export function invalidateCache(key?: string) {
  if (key) queryCache.delete(key)
  else queryCache.clear()
}
