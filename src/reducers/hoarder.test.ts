import { describe, test, expect } from 'vitest'
import { findTopHoarderCheevoStats } from './hoarder'
import { type Order } from '../lib/apiTypes/order'

describe('findTopHoarderCheevoStats', () => {
  test('returns empty array if user never bought anything', () => {
    const orders = [] as Order[]

    const result = findTopHoarderCheevoStats(orders)

    expect(result.length).toBe(0)
  })
})
