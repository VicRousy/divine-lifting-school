import { describe, it, expect, vi } from 'vitest'
import { safeQuery } from './safeQuery'

describe('safeQuery', () => {
  it('returns data on success', async () => {
    const fn = vi.fn().mockResolvedValue({ data: [{ id: 1 }] })
    const result = await safeQuery(fn)
    expect(result.data).toEqual([{ id: 1 }])
  })

  it('retries on Supabase error object and returns fallback', async () => {
    const fn = vi.fn().mockResolvedValue({ error: new Error('DB error') })
    const result = await safeQuery(fn, { retries: 1, fallback: [] })
    expect(result).toEqual([])
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('retries on thrown error and returns fallback', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Network error'))
    const result = await safeQuery(fn, { retries: 2, fallback: null })
    expect(result).toBeNull()
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('succeeds on retry after failure', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Transient error'))
      .mockResolvedValueOnce({ data: 'ok' })
    const result = await safeQuery(fn, { retries: 1 })
    expect(result.data).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('uses default retries and fallback', async () => {
    const fn = vi.fn().mockResolvedValue({ error: new Error('fail') })
    const result = await safeQuery(fn)
    expect(result).toEqual({ data: null, error: null })
    expect(fn).toHaveBeenCalledTimes(3)
  })
})
