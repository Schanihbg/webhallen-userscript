export const MIN_INTERVAL_MS = 1000
export const MAX_RETRIES = 3
export const MAX_BACKOFF_MS = 60_000

export const sleep = async (ms: number): Promise<void> => {
  await new Promise<void>(resolve => setTimeout(resolve, ms))
}

/**
 * Parses a Retry-After header (delta-seconds or HTTP-date) into milliseconds.
 * Returns null when missing or invalid.
 */
export const parseRetryAfter = (header: string | null | undefined, now: number = Date.now()): number | null => {
  if (header == null) return null
  const value = header.trim()
  if (value === '') return null

  if (/^\d+(\.\d+)?$/.test(value)) {
    return Math.round(parseFloat(value) * 1000)
  }

  const date = Date.parse(value)
  if (Number.isNaN(date)) return null
  return Math.max(0, date - now)
}

// Earliest time (ms epoch) at which the next request may start.
let nextSlot = 0

/**
 * Resolves when it is this caller's turn to send a request. Guarantees at least
 * MIN_INTERVAL_MS between request starts, even when callers run concurrently.
 */
export const throttle = async (): Promise<void> => {
  const now = Date.now()
  const slot = Math.max(now, nextSlot)
  nextSlot = slot + MIN_INTERVAL_MS
  if (slot > now) await sleep(slot - now)
}

/** Delay all requests (including queued ones) for at least `ms` from now. */
export const backOff = (ms: number): void => {
  nextSlot = Math.max(nextSlot, Date.now() + ms)
}

export const resetThrottle = (): void => {
  nextSlot = 0
}
