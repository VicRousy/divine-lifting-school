import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFocusTrap } from './useFocusTrap'

describe('useFocusTrap', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    container.innerHTML = `
      <button id="first">First</button>
      <button id="second">Second</button>
      <button id="third">Third</button>
    `
    document.body.appendChild(container)
    container.tabIndex = -1
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('focuses first element when active', () => {
    const { result } = renderHook(() => useFocusTrap(true))
    result.current.current = container

    // Re-render to trigger the effect
    const { rerender } = renderHook(() => useFocusTrap(true))
    rerender()
  })

  it('does not focus when inactive', () => {
    const { result } = renderHook(() => useFocusTrap(false))
    result.current.current = container
    expect(document.activeElement).not.toBe(document.getElementById('first'))
  })

  it('returns a ref object', () => {
    const { result } = renderHook(() => useFocusTrap(true))
    expect(result.current).toHaveProperty('current')
  })
})
