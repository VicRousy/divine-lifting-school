import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useServerPagination } from './useServerPagination'

describe('useServerPagination', () => {
  const mockData = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Student ${i + 1}` }))

  it('fetches first page on mount', async () => {
    const fetchData = vi.fn().mockResolvedValue({ data: mockData.slice(0, 15), error: null })
    const fetchCount = vi.fn().mockResolvedValue({ data: [{ count: 25 }], error: null })

    const { result } = renderHook(() => useServerPagination(fetchData, fetchCount, { pageSize: 15, deps: [] }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toHaveLength(15)
    expect(result.current.totalCount).toBe(25)
    expect(result.current.totalPages).toBe(2)
    expect(result.current.currentPage).toBe(1)
    expect(fetchData).toHaveBeenCalledWith(0, 14)
  })

  it('navigates to next page', async () => {
    const fetchData = vi.fn().mockResolvedValue({ data: mockData.slice(0, 15), error: null })
    const fetchCount = vi.fn().mockResolvedValue({ data: [{ count: 25 }], error: null })

    const { result } = renderHook(() => useServerPagination(fetchData, fetchCount, { pageSize: 15, deps: [] }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    fetchData.mockResolvedValue({ data: mockData.slice(15, 25), error: null })
    result.current.nextPage()

    await waitFor(() => expect(result.current.currentPage).toBe(2))
    expect(fetchData).toHaveBeenCalledWith(15, 29)
  })

  it('navigates to previous page', async () => {
    const fetchData = vi.fn().mockResolvedValue({ data: mockData.slice(0, 15), error: null })
    const fetchCount = vi.fn().mockResolvedValue({ data: [{ count: 25 }], error: null })

    const { result } = renderHook(() => useServerPagination(fetchData, fetchCount, { pageSize: 15, deps: [] }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    fetchData.mockResolvedValue({ data: mockData.slice(15, 25), error: null })
    result.current.nextPage()
    await waitFor(() => expect(result.current.currentPage).toBe(2))

    fetchData.mockResolvedValue({ data: mockData.slice(0, 15), error: null })
    result.current.prevPage()
    await waitFor(() => expect(result.current.currentPage).toBe(1))
  })

  it('stays on first page when navigating prev from page 1', async () => {
    const fetchData = vi.fn().mockResolvedValue({ data: mockData.slice(0, 15), error: null })
    const fetchCount = vi.fn().mockResolvedValue({ data: [{ count: 25 }], error: null })

    const { result } = renderHook(() => useServerPagination(fetchData, fetchCount, { pageSize: 15, deps: [] }))

    await waitFor(() => expect(result.current.loading).toBe(false))
    result.current.prevPage()
    await waitFor(() => expect(result.current.currentPage).toBe(1))
  })

  it('handles empty data', async () => {
    const fetchData = vi.fn().mockResolvedValue({ data: [], error: null })
    const fetchCount = vi.fn().mockResolvedValue({ data: [{ count: 0 }], error: null })

    const { result } = renderHook(() => useServerPagination(fetchData, fetchCount, { pageSize: 15, deps: [] }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toHaveLength(0)
    expect(result.current.totalCount).toBe(0)
    expect(result.current.totalPages).toBe(1)
  })

  it('handles fetch error gracefully', async () => {
    const fetchData = vi.fn().mockResolvedValue({ data: null, error: null })
    const fetchCount = vi.fn().mockResolvedValue({ data: [{ count: 0 }], error: null })

    const { result } = renderHook(() => useServerPagination(fetchData, fetchCount, { pageSize: 15, deps: [] }))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual([])
    expect(result.current.totalCount).toBe(0)
  })
})
