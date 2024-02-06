import { type Order } from '../lib/apiTypes/order'

export interface StoreSum {
  purchases: number
  normalizedValue: number
}
export const getStoreStats = (orders: Order[]): Map<string, StoreSum> => {
  const storePurchases = orders.reduce<Record<string, number>>((stores, order) => {
    const storeName = order.store?.name
    if (!storeName) return stores
    stores[storeName] = (stores[storeName] || 0) + 1
    return stores
  }, {})

  const stores = new Map<string, number>()
  Object
    .entries(storePurchases)
    .sort((a, b) => b[1] - a[1])
    .forEach(([store, purchases]) => { stores.set(store, purchases) })

  const values = Array.from(stores.values())
  const sumValues = values.reduce((a, b) => a + b, 0)

  const storesNormalized = new Map<string, StoreSum>()
  for (const [store, purchases] of stores) {
    const normalizedValue = (purchases / sumValues)
    storesNormalized.set(store, { purchases, normalizedValue })
  }

  return new Map([...storesNormalized.entries()].sort((a, b) => a[1].normalizedValue - b[1].normalizedValue))
}
