import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../config/api', () => ({ API_URL: 'http://test.local' }))

import { sendWelcomeEmail, sendVerificationEmail, sendAnnouncementEmail, sendFeeInvoice, sendApplicationDecision } from './emailService'

beforeEach(() => {
  vi.restoreAllMocks()
})

function mockFetch(ok: boolean, data: any) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok, json: () => Promise.resolve(data) } as any)
}

describe('sendWelcomeEmail', () => {
  it('returns success true on ok response', async () => {
    mockFetch(true, { success: true })
    const result = await sendWelcomeEmail('parent@school.com', 'PAR-001', 'pass123', 'parent', 'Parent Name', 'Student Name')
    expect(result.success).toBe(true)
  })

  it('returns success false with error on failure', async () => {
    mockFetch(false, { error: 'Email service down' })
    const result = await sendWelcomeEmail('x@y.com', 'ID', 'pw', 'student')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Email service down')
  })

  it('handles network errors gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'))
    const result = await sendWelcomeEmail('x@y.com', 'ID', 'pw', 'teacher')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Network error')
  })
})

describe('sendVerificationEmail', () => {
  it('returns success on ok', async () => {
    mockFetch(true, { success: true })
    const result = await sendVerificationEmail('admin@school.com', '123456', 'ADM-001')
    expect(result.success).toBe(true)
  })
})

describe('sendAnnouncementEmail', () => {
  it('sends to recipients', async () => {
    mockFetch(true, { success: true })
    const result = await sendAnnouncementEmail(['a@b.com', 'c@d.com'], 'Title', 'Body', 'all')
    expect(result.success).toBe(true)
  })

  it('handles failure', async () => {
    mockFetch(false, { error: 'Too many recipients' })
    const result = await sendAnnouncementEmail(['a@b.com'], 'Title', 'Body', 'teachers')
    expect(result.success).toBe(false)
  })
})

describe('sendFeeInvoice', () => {
  it('returns success on ok', async () => {
    mockFetch(true, { success: true })
    const result = await sendFeeInvoice('parent@school.com', 'Student Name', 'Tuition', 50000, '2026-09-01')
    expect(result.success).toBe(true)
  })
})

describe('sendApplicationDecision', () => {
  it('sends acceptance email', async () => {
    mockFetch(true, { success: true })
    const result = await sendApplicationDecision('parent@school.com', 'Student Name', 'APP-001', 'accepted', 'JSS 1')
    expect(result.success).toBe(true)
  })

  it('sends rejection email', async () => {
    mockFetch(true, { success: true })
    const result = await sendApplicationDecision('parent@school.com', 'Student Name', 'APP-002', 'rejected', 'SSS 1')
    expect(result.success).toBe(true)
  })
})
