// eslint-disable-next-line @typescript-eslint/no-explicit-any
const promiseCache = {} as Record<string, Promise<any>>

interface GetCachedPromiseInput <T = unknown> {
  key: string
  fn: () => Promise<T>
}

/**
 * Cache a function execution rather than its resolved value.
 * Helps avoid race conditions where multiple invocations occur
 * because the value hasnt been placed in the cache yet.
 */
export const getCachedPromise = async <T = unknown>({
  key,
  fn,
}: GetCachedPromiseInput): Promise<T> => {
  if (typeof promiseCache[key] === 'undefined') {
    promiseCache[key] = Promise.resolve().then(async () => await fn())
  }
  return await promiseCache[key]
}
