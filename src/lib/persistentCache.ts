export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
export const CACHE_VERSION = 2

interface CacheEntry<T> {
  version: number
  timestamp: number
  data: T
}

export const readCache = <T>(key: string): CacheEntry<T> | null => {
  try {
    // @ts-expect-error: Cannot find name
    const raw = GM_getValue(key, null) as string | CacheEntry<T> | null
    if (raw === null || raw === undefined) return null

    const entry = (typeof raw === 'string' ? JSON.parse(raw) : raw) as CacheEntry<T>
    if (entry?.version !== CACHE_VERSION) return null
    return entry
  } catch (err) {
    console.warn(`persistentCache: failed to read ${key}`, err)
    return null
  }
}

export const writeCache = <T>(key: string, data: T): void => {
  const entry: CacheEntry<T> = {
    version: CACHE_VERSION,
    timestamp: Date.now(),
    data,
  }
  try {
    // @ts-expect-error: Cannot find name
    GM_setValue(key, JSON.stringify(entry))
  } catch (err) {
    console.warn(`persistentCache: failed to write ${key}`, err)
  }
}

export const clearCache = (key: string): void => {
  try {
    // @ts-expect-error: Cannot find name
    GM_setValue(key, null)
  } catch (err) {
    console.warn(`persistentCache: failed to clear ${key}`, err)
  }
}
