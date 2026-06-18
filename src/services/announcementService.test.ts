import { describe, it, expect, beforeEach, vi } from 'vitest'
import { seed, clear, mockSupabase } from '../utils/__mocks__/supabaseData'

vi.mock('@supabase/supabase-js', () => ({ createClient: () => mockSupabase }))

import { loadAnnouncementFeed, publishAnnouncement } from './announcementService'

beforeEach(() => { clear() })

describe('loadAnnouncementFeed', () => {
  it('returns announcements for matching audiences', async () => {
    seed('announcements', [
      { id: 1, title: 'A1', body: 'B1', audience: 'all', created_at: '2026-01-01' },
      { id: 2, title: 'A2', body: 'B2', audience: 'teachers', created_at: '2026-01-02' },
    ])
    const result = await loadAnnouncementFeed(['all', 'teachers'])
    expect(result.data).toHaveLength(2)
    expect(result.source).toBe('database')
  })

  it('returns empty when no matches', async () => {
    expect((await loadAnnouncementFeed(['students'])).data).toEqual([])
  })

  it('defaults to all audiences', async () => {
    seed('announcements', [{ id: 1, title: 'T', body: 'B', audience: 'all', created_at: '2026-01-01' }])
    expect((await loadAnnouncementFeed()).data).toHaveLength(1)
  })
})

describe('publishAnnouncement', () => {
  it('publishes successfully', async () => {
    const r = await publishAnnouncement({ title: 'Title', body: 'Body', audience: 'all' })
    expect(r.error).toBeNull()
  })
})
