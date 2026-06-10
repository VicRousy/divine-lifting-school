import { describe, it, expect, vi } from 'vitest'
import { withTimeout } from './asyncUtils'

describe('withTimeout', () => {
  it('resolves when promise resolves before timeout', async () => {
    const p = Promise.resolve('ok')
    await expect(withTimeout(p, 'test', 5000)).resolves.toBe('ok')
  })
  it('rejects when promise rejects before timeout', async () => {
    const p = Promise.reject(new Error('fail'))
    await expect(withTimeout(p, 'test', 5000)).rejects.toThrow('fail')
  })
  it('rejects with timeout error when promise is slow', async () => {
    const p = new Promise(() => {})
    await expect(withTimeout(p, 'slow', 10)).rejects.toThrow('slow timed out')
  })
  it('uses default label and timeout', async () => {
    const p = new Promise(() => {})
    await expect(withTimeout(p, undefined, 10)).rejects.toThrow('request timed out')
  })
  it('cleans up timer on resolve', async () => {
    const p = Promise.resolve('ok')
    await expect(withTimeout(p, 'test', 100)).resolves.toBe('ok')
  })
})
