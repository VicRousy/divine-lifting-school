import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../config/api', () => ({ API_URL: 'http://test.local' }))

import { createAuthUser, resetAuthPassword, deleteAuthUser } from './authApi'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('createAuthUser', () => {
  it('sends create-user request and returns data on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, auth_id: 'abc-123' }),
    } as any)

    const result = await createAuthUser('test@school.com', 'Password123', { role: 'student' })
    expect(result.success).toBe(true)
    expect(result.auth_id).toBe('abc-123')
  })

  it('throws on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'API key invalid' }),
    } as any)

    await expect(createAuthUser('test@school.com', 'pw', {})).rejects.toThrow('API key invalid')
  })

  it('sends correct headers and body', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, auth_id: 'x' }),
    } as any)

    await createAuthUser('user@school.com', 'secret', { role: 'teacher', name: 'Jane' })

    const callArgs = fetchSpy.mock.calls[0]
    expect(callArgs[0]).toContain('/api/auth')
    expect(callArgs[1]?.headers).toMatchObject({ 'x-api-key': expect.any(String) })

    const body = JSON.parse(callArgs[1]?.body as string)
    expect(body.type).toBe('create-user')
    expect(body.email).toBe('user@school.com')
    expect(body.password).toBe('secret')
    expect(body.userData).toEqual({ role: 'teacher', name: 'Jane' })
  })
})

describe('resetAuthPassword', () => {
  it('sends reset-password request', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as any)

    const result = await resetAuthPassword('admin@school.com', 'NewPass123', 'user-id-1')
    expect(result.success).toBe(true)
  })

  it('works without userId (lookup by email)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as any)

    const result = await resetAuthPassword('admin@school.com', 'NewPass123')
    expect(result.success).toBe(true)
  })
})

describe('deleteAuthUser', () => {
  it('sends delete-user request', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as any)

    const result = await deleteAuthUser('user-id-1', 'user@school.com')
    expect(result.success).toBe(true)
  })
})
