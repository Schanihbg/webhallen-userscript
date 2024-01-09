import { type Order } from '../lib/apiTypes/order'
import MONTH_NAMES from '../lib/months'

interface GroupedData {
  orderDate: number
  totalOrders: number
  totalSum: number
}
function getOrderDatesPerMonthWithSum (orders: Order[]): GroupedData[] {
  const groupedData = Object.entries(
    orders.reduce<Record<string, { totalOrders: number, totalSum: number }>>((acc, { orderDate, sentDate, totalSum }) => {
      const dateOrdered = new Date(orderDate * 1000)
      const orderedYear = dateOrdered.getUTCFullYear()
      const orderedMonth = dateOrdered.getUTCMonth()

      const orderKey = new Date(Date.UTC(orderedYear, orderedMonth)).getTime() / 1000
      if (!acc[orderKey]) {
        acc[orderKey] = { totalOrders: 1, totalSum }
      } else {
        acc[orderKey].totalOrders += 1
        acc[orderKey].totalSum += totalSum
      }

      return acc
    },
    {},
    ),
  ).map(([key, { totalOrders, totalSum }]) => ({
    orderDate: parseInt(key, 10),
    totalOrders,
    totalSum,
  }))

  const sortedGroupedData = groupedData.sort((a, b) => a.orderDate - b.orderDate)
  return sortedGroupedData
}

export function findOrdersPerMonth (orders: Order[]): Record<string, { totalOrders: number, totalSum: number }> {
  const monthCounts = {} as Record<string, { totalOrders: number, totalSum: number }>
  (getOrderDatesPerMonthWithSum(orders)).forEach(period => {
    const currentDate = new Date(period.orderDate * 1000)
    const yearMonth = `${currentDate.getUTCFullYear()} ${MONTH_NAMES[currentDate.getUTCMonth()]}`
    monthCounts[yearMonth] = { totalOrders: period.totalOrders, totalSum: period.totalSum }
  })

  return monthCounts
}
