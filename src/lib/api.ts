import { type Achievement, type AchievementsResponse } from './apiTypes/achievements'
import { type MeResponse } from './apiTypes/me'
import { type Order, type OrderResponse } from './apiTypes/order'
import { type Drop, type SupplyDropResponse } from './apiTypes/supplyDrop'

export const fetchAPI = async <ExpectedType = unknown> (
  uri: string,
  params?: Record<string, string | number>,
): Promise<ExpectedType> => {
  const url = new URL(uri)
  if (params) {
    Object
      .keys(params)
      .forEach(key => {
        url.searchParams.append(key, params[key].toString())
      })
  }

  return await fetch(url.toString())
    .then(async (response) => {
      // The API call was successful!
      return await response.json()
    })
    .then((jsonData) => {
      // This is the JSON from our response
      console.log('callURL resp', jsonData)
      return jsonData
    })
}

export async function fetchMe (): Promise<MeResponse['user']> {
  const data = await fetchAPI<MeResponse>('https://www.webhallen.com/api/me')
  return data.user
}

export const fetchOrders = async (whId: number): Promise<Order[]> => {
  let page = 1
  const orders = []

  while (true) {
    const params = { page }
    const data = await fetchAPI<OrderResponse>(`https://www.webhallen.com/api/order/user/${whId}?filters[history]=true&sort=orderStatus`, params)
    if (data.orders.length === 0) break
    orders.push(...data.orders)
    page++
  }

  return orders.filter(o => {
    if (o.error) {
      console.warn(`Order ${o.id} is considered broken by the API. It will not be included in calculations.`)
    }
    return !o.error
  })
}

export const fetchAchievements = async (whId: number): Promise<Achievement[]> => {
  const data = await fetchAPI<AchievementsResponse>(`https://www.webhallen.com/api/user/${encodeURIComponent(whId)}/achievements`)
  return data.achievements
}

export const fetchSupplyDrops = async (): Promise<Drop[]> => {
  const data = await fetchAPI<SupplyDropResponse>('https://www.webhallen.com/api/supply-drop/')
  return data.drops
}
