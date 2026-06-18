import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { clear, setError, mockSupabase } from '../utils/__mocks__/supabaseData'

vi.mock('@supabase/supabase-js', () => ({ createClient: () => mockSupabase }))
vi.mock('bcryptjs', () => ({ default: { hash: (s: string) => Promise.resolve(`h:${s}`) } }))

const noop = () => {}

beforeEach(() => {
  clear()
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: () => Promise.resolve({ ip: '1.2.3.4' }) } as any)
})

afterEach(() => { cleanup(); vi.restoreAllMocks() })

import Login from './Login'

describe('Login component', () => {
  it('renders login form', () => {
    render(<Login onLogin={noop} />)
    expect(screen.getByLabelText('Login ID')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('shows error on empty submit', async () => {
    render(<Login onLogin={noop} />)
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }).closest('form')!)
    await waitFor(() => expect(screen.getByText(/please enter your login id and password/i)).toBeInTheDocument())
  })

  it('shows error on RPC failure', async () => {
    setError(new Error('rate limit'))
    render(<Login onLogin={noop} />)
    const lids = screen.getAllByLabelText('Login ID')
    await userEvent.type(lids[0], 'ADM-001')
    const pws = screen.getAllByLabelText('Password')
    await userEvent.type(pws[0], 'x')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(screen.getByText(/login failed/i)).toBeInTheDocument(), { timeout: 3000 })
  })

  it('shows error on invalid credentials', async () => {
    render(<Login onLogin={noop} />)
    const lids = screen.getAllByLabelText('Login ID')
    await userEvent.type(lids[0], 'ADM-001')
    const pws = screen.getAllByLabelText('Password')
    await userEvent.type(pws[0], 'x')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(screen.getByText(/invalid login id or password/i)).toBeInTheDocument(), { timeout: 3000 })
  })

  it('shows master access link', () => {
    render(<Login onLogin={noop} />)
    expect(screen.getAllByText(/master access/i).length).toBeGreaterThanOrEqual(1)
  })
})
