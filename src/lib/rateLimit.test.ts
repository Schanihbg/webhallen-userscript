import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchAPI } from './api'
import { parseRetryAfter, resetThrottle } from './rateLimit'

describe('parseRetryAfter', () => {
  it('parses delta-seconds', () => {
    expect(parseRetryAfter('5')).toBe(5000)
  })
  it('parses HTTP-date', () => {
    const now = Date.parse('Wed, 21 Oct 2026 07:28:00 GMT')
    expect(parseRetryAfter('Wed, 21 Oct 2026 07:28:10 GMT', now)).toBe(10000)
  })
  it('clamps past dates to 0', () => {
    const now = Date.parse('Wed, 21 Oct 2026 07:28:10 GMT')
    expect(parseRetryAfter('Wed, 21 Oct 2026 07:28:00 GMT', now)).toBe(0)
  })
  it('returns null for missing or invalid', () => {
    expect(parseRetryAfter(null)).toBeNull()
    expect(parseRetryAfter('')).toBeNull()
    expect(parseRetryAfter('garbage')).toBeNull()
  })
})

describe('fetchAPI 429 handling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    resetThrottle()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('waits for Retry-After and retries', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': '2' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const promise = fetchAPI('https://example.com/x')
    await vi.advanceTimersByTimeAsync(1500)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1000)
    await expect(promise).resolves.toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('throws after max retries', async () => {
    const fetchMock = vi.fn().mockImplementation(async () =>
      new Response('', { status: 429, headers: { 'Retry-After': '1' } }))
    vi.stubGlobal('fetch', fetchMock)

    const promise = fetchAPI('https://example.com/x')
    const assertion = expect(promise).rejects.toThrow(/429/)
    await vi.advanceTimersByTimeAsync(20000)
    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('throws on other non-ok statuses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })))
    await expect(fetchAPI('https://example.com/x')).rejects.toThrow(/HTTP 500/)
  })
})
