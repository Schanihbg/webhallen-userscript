import { type Order } from '../lib/apiTypes/order'

export function findCategoriesByPeriod (
  orders: Order[],
  beginDate = '1999-01-01',
  endDate = new Date(),
): Record<string, number> {
  const catStartDate = Date.parse(beginDate)
  const catEndDate = endDate instanceof Date ? endDate : Date.parse(endDate)

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.orderDate * 1000)
    return orderDate.valueOf() >= catStartDate && orderDate.valueOf() <= catEndDate.valueOf()
  })

  const unsortedCategories = {} as Record<string, number>
  filteredOrders.forEach(order => {
    order.rows.forEach(item => {
      const categories = item.product.categoryTree.split('/')
      const topLevel = categories[0]
      const subcategory = categories.length > 1 ? categories[1] : null
      const categoryString = topLevel + (subcategory !== null ? '/' + subcategory : '')

      unsortedCategories[categoryString] = (unsortedCategories[categoryString] || 0) + 1
    })
  })

  const sortedKeys = Object.keys(unsortedCategories).sort()
  const sortedCategories = {} as Record<string, number>
  sortedKeys.forEach(key => { sortedCategories[key] = unsortedCategories[key] })

  return sortedCategories
}
