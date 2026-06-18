import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useUnsavedChanges } from './useUnsavedChanges'

describe('useUnsavedChanges', () => {
  it('adds beforeunload listener when dirty is true', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useUnsavedChanges(true))
    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))

    unmount()
    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))

    addSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('does not add listener when dirty is false', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    renderHook(() => useUnsavedChanges(false))
    expect(addSpy).not.toHaveBeenCalled()
    addSpy.mockRestore()
  })

  it('removes listener when dirty changes to false', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { rerender } = renderHook(({ dirty }) => useUnsavedChanges(dirty), {
      initialProps: { dirty: true },
    })
    expect(addSpy).toHaveBeenCalledTimes(1)

    rerender({ dirty: false })
    expect(removeSpy).toHaveBeenCalled()

    addSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('prevents default on beforeunload event', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')

    renderHook(() => useUnsavedChanges(true))

    const handler = addSpy.mock.calls.find(([name]) => name === 'beforeunload')?.[1]
    const event = new Event('beforeunload')
    const preventSpy = vi.spyOn(event, 'preventDefault')

    if (handler) handler(event)
    expect(preventSpy).toHaveBeenCalled()

    addSpy.mockRestore()
  })
})
