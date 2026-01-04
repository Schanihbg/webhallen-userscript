import { type Achievement, type AchievementsResponse } from './apiTypes/achievements'
import { type MeResponse } from './apiTypes/me'
import { type Order, type OrderResponse } from './apiTypes/order'
import { type Review, type ReviewResponse } from './apiTypes/review'
import { type DeleteStoreResponse } from './apiTypes/starred-store'
import { type Drop, type SupplyDropResponse } from './apiTypes/supplyDrop'
import { getCachedPromise } from './promiseCache'

export const fetchAPI = async <ExpectedType = unknown> (
  uri: string,
  params?: Record<string, string | number>,
  method: string = 'GET',
): Promise<ExpectedType> => {
  const url = new URL(uri)
  if (params) {
    Object
      .keys(params)
      .forEach(key => {
        url.searchParams.append(key, params[key].toString())
      })
  }

  return await fetch(url.toString(), {
    method,
    signal: AbortSignal.timeout(30000),
  })
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

function updateProgress (current: number, total: number): void {
  const progressBar = document.getElementById('review-progress-bar') as HTMLElement
  const progressText = document.getElementById('review-progress-text') as HTMLElement

  if (progressBar && progressText) {
    const percentage = (current / total) * 100
    progressBar.style.width = `${percentage}%`
    progressText.innerText = `${current} av ${total}`
  } else {
    console.error('Could not find progress bar!')
  }
}

export interface ProductReview {
  product: number
  review: Review | undefined
}
export const fetchUserReviewsFresh = async (whId: number): Promise<ProductReview[]> => {
  const handledProducts = [] as number[]
  const userReviews = []
  const orders = await fetchOrders(whId)
  let current = 0
  const total = orders.flatMap(order => order.rows).length

  for (const order of orders) {
    for (const item of order.rows) {
      updateProgress(current++, total)
      if (handledProducts.includes(item.product.id)) continue
      handledProducts.push(item.product.id)

      const id = item.product.id
      const productReviews = await fetchProductReviews(id)
      const userProductReview = productReviews.find(review => {
        if (review.isAnonymous) return false

        try {
          return review.user.id === whId
        } catch (error) {
          console.error('Error accessing review:', review, error)
          return false
        }
      })
      if (userProductReview) {
        console.log('Found a review')
      }
      userReviews.push({
        product: id,
        review: userProductReview,
      })
    }
  }

  return userReviews
}

export const fetchUserReviews = async (whId: number): Promise<ProductReview[]> => {
  return await getCachedPromise({
    key: `${whId}-reviews`,
    fn: async () => {
      return await fetchUserReviewsFresh(whId)
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

export async function fetchProductReviews (productId: string | number): Promise<Review[]> {
  let page = 1
  const reviews = []

  while (true) {
    const params = { page }
    const data = await fetchAPI<ReviewResponse>(`https://www.webhallen.com/api/reviews?products[0]=${productId}&sortby=latest`, params)
    if (data.reviews.length === 0) break
    reviews.push(...data.reviews)
    page++
  }

  return reviews
}

export async function deleteFavoriteStores (): Promise<null> {
  for (let i = 0; i <= 40; i++) {
    console.log(`Tar bort butik ${i} från favoriter.`)
    await fetchAPI<DeleteStoreResponse>(`https://www.webhallen.com/api/starred-store/${i}`, {}, 'DELETE')
  }
  return null
}
