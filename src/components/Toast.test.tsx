import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Toast from './Toast'

describe('Toast', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders success message', () => {
    render(<Toast message="Saved!" type="success" onClose={() => {}} />)
    expect(screen.getByText('Saved!')).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(<Toast message="Failed" type="error" onClose={() => {}} />)
    expect(screen.getByText('Failed')).toBeInTheDocument()
  })

  it('has aria-live attributes', () => {
    render(<Toast message="Test" onClose={() => {}} />)
    const toast = screen.getByRole('status')
    expect(toast).toHaveAttribute('aria-live', 'polite')
    expect(toast).toHaveAttribute('aria-atomic', 'true')
  })

  it('calls onClose after 3 seconds', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<Toast message="Auto close" onClose={onClose} />)
    expect(onClose).not.toHaveBeenCalled()

    vi.advanceTimersByTime(3000)
    expect(onClose).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    render(<Toast message="Close me" onClose={onClose} />)
    const user = userEvent.setup()
    await user.click(screen.getByText('\u00D7'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
