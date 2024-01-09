import { type Achievement, type AchievementsResponse } from './apiTypes/achievements'
import { type MeResponse } from './apiTypes/me'
import { type Order, type OrderResponse } from './apiTypes/order'
import { type Drop, type SupplyDropResponse } from './apiTypes/supplyDrop'
import { getCachedPromise } from './promiseCache'

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

const fetchOrdersFresh = async (whId: number): Promise<Order[]> => {
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

export const fetchOrders = async (whId: number): Promise<Order[]> => {
  return await getCachedPromise({
    key: `${whId}-orders`,
    fn: async () => {
      return await fetchOrdersFresh(whId)
    },
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

export interface ProductData {
  id: number
  name: string
  thumbnail: string
  data: Record<string, Record<string, string>>
}
export async function fetchProductData (productId: string | number): Promise<ProductData | null> {
  try {
    const url = new URL(`/api/product/${productId}`, 'https://www.webhallen.com')
    const { product } = await fetch(url)
      .then(async (response) => {
        return await response.json()
      })

    if (!product?.data) {
      console.warn(`Article ${productId} does not contain any data to compare against.`)
      return null
    }

    const filteredProduct = {
      id: product.id,
      name: product.name.split('/')[0].trim(),
      thumbnail: product.thumbnail,
      data: {},
    } as ProductData

    for (const header in product.data) {
      if (!filteredProduct.data[header]) {
        filteredProduct.data[header] = {}
      }

      for (const attribute in product.data[header]) {
        filteredProduct.data[header][attribute] = product.data[header][attribute].value
      }
    }

    return filteredProduct
  } catch (error) {
    console.error(error)
    return null
  }
}
