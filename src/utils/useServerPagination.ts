import { useState, useEffect, useCallback } from 'react'
import { safeQuery } from './safeQuery'

interface QueryResult<T> {
  data: T[] | null
  error: string | null
}

interface PaginationResult<T> {
  data: T[]
  totalCount: number
  totalPages: number
  currentPage: number
  loading: boolean
  error: string | null
  setPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
}

interface PaginationConfig {
  pageSize?: number
  deps?: unknown[]
}

async function runSafe<T>(fn: () => PromiseLike<{ data: T[] | null; error: any }>): Promise<QueryResult<T>> {
  const result = await safeQuery(fn)
  if (!result) return { data: null, error: 'Query returned no result' }
  return {
    data: result.data || null,
    error: result.error || null,
  }
}

export function useServerPagination<T>(
  fetchData: (rangeStart: number, rangeEnd: number) => PromiseLike<{ data: T[] | null; error: any }>,
  fetchCount: () => PromiseLike<{ data: any; error: any; count?: number | null }>,
  config: PaginationConfig = {},
): PaginationResult<T> {
  const { pageSize = 15, deps = [] } = config
  const [data, setData] = useState<T[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPage = useCallback(async (page: number) => {
    setLoading(true)
    setError(null)
    const rangeStart = (page - 1) * pageSize
    const rangeEnd = rangeStart + pageSize - 1

    const [dataResult, countRaw] = await Promise.all([
      runSafe(() => fetchData(rangeStart, rangeEnd)),
      safeQuery(() => fetchCount()),
    ])

    if (dataResult.error) {
      setError(dataResult.error)
    } else {
      setData((dataResult.data || []) as T[])
    }

    if (countRaw?.error) {
      setError(countRaw.error)
    } else {
      const count = countRaw?.count ?? (countRaw?.data as any[])?.[0]?.count ?? (countRaw?.data as any[])?.length ?? 0
      setTotalCount(count)
    }

    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    setCurrentPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    fetchPage(currentPage)
  }, [currentPage, fetchPage])

  const setPage = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const nextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, Math.max(1, Math.ceil(totalCount / pageSize))))
  }, [totalCount, pageSize])

  const prevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1))
  }, [])

  return {
    data,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    currentPage,
    loading,
    error,
    setPage,
    nextPage,
    prevPage,
  }
}
