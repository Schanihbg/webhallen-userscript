import { type Order } from '../lib/apiTypes/order'

export interface HoarderEntry {
  id: number // product id
  name: string
  bought: number
}
export const findTopHoarderCheevoStats = (orders: Order[], count = 10): HoarderEntry[] => {
  const itemCount = {} as Record<string, HoarderEntry>
  orders.forEach(order => {
    order.rows.forEach(item => {
      const id = item.product.id

      if (!itemCount[id]) {
        itemCount[id] = { id, name: item.product.name, bought: 1 }
      } else {
        itemCount[id].bought += item.quantity
      }
    })
  })

  const dataArray = Object.values(itemCount)
  const filteredArray = dataArray.filter(product => product.bought > 1)
  filteredArray.sort((a, b) => b.bought - a.bought)

  return filteredArray.slice(0, count)
}
