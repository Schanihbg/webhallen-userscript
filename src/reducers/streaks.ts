import { type Order } from '../lib/apiTypes/order'
import MONTH_NAMES from '../lib/months'

interface OrderDatesWithSum {
  sentDate: number
  totalSum: number
}
function getOrderDatesPerMonthWithSumKillstreak (orders: Order[]): OrderDatesWithSum[] {
  const groupedData = Object.entries(
    orders.reduce<Record<number, { totalSum: number }>>((acc, { orderDate, sentDate, totalSum }) => {
      const dateOrdered = new Date(orderDate * 1000)
      const orderedYear = dateOrdered.getUTCFullYear()
      const orderedMonth = dateOrdered.getUTCMonth()

      const dateSent = new Date(sentDate * 1000)
      const sentYear = dateSent.getUTCFullYear()
      const sentMonth = dateSent.getUTCMonth()

      const sentKey = new Date(Date.UTC(sentYear, sentMonth)).getTime() / 1000
      if (!acc[sentKey]) {
        acc[sentKey] = { totalSum }
      } else {
        acc[sentKey].totalSum += totalSum
      }

      if (sentYear !== orderedYear || sentMonth !== orderedMonth) {
        const orderKey = new Date(Date.UTC(orderedYear, orderedMonth)).getTime() / 1000
        if (!acc[orderKey]) {
          acc[orderKey] = { totalSum }
        } else {
          acc[orderKey].totalSum += totalSum
        }
      }

      return acc
    },
    {},
    ),
  ).map(([key, { totalSum }]) => ({
    sentDate: parseInt(key, 10),
    totalSum,
  }))

  const sortedGroupedData = groupedData.sort((a, b) => a.sentDate - b.sentDate)
  return sortedGroupedData
}

interface Streak {
  start: string | null
  end: string | null
  months: number
}
export interface Streaks {
  streaks: Streak[]
  longestStreak: number
  currentStreak: number
}
export const findStreaks = (orders: Order[], minimumSum = 500): Streaks => {
  const cheevoStartDate = Date.parse('2015-09-01')
  const sentDates = getOrderDatesPerMonthWithSumKillstreak(orders)

  const output = { streaks: [], longestStreak: 0, currentStreak: 0 } as Streaks
  let previousDate = null
  let lastYearMonth = null
  let currentStreakStart = null
  for (let i = 0; i < sentDates.length; i++) {
    const currentDate = new Date(sentDates[i].sentDate * 1000)
    const yearMonth = `${currentDate.getUTCFullYear()} ${MONTH_NAMES[currentDate.getUTCMonth()]}`

    // Only count streaks after Killstreak cheevo creation date
    if (currentDate.valueOf() < cheevoStartDate) continue

    if (previousDate === null || lastYearMonth === null || currentStreakStart === null) {
      previousDate = currentDate
      lastYearMonth = yearMonth
      currentStreakStart = yearMonth
    } else {
      const m1 = previousDate.getUTCMonth()
      const m2 = currentDate.getUTCMonth()
      const isConsecutive = m2 - m1 === 1 || m2 - m1 === -11

      if (sentDates[i].totalSum >= minimumSum) {
        if (isConsecutive) {
          output.currentStreak++
        } else {
          if (output.currentStreak > 0) {
            output.streaks.push({ start: currentStreakStart, end: lastYearMonth, months: output.currentStreak })
          }
          output.currentStreak = 0
          currentStreakStart = yearMonth
        }
        lastYearMonth = yearMonth
        previousDate = currentDate
      } else {
        if (output.currentStreak > 0) {
          output.streaks.push({ start: currentStreakStart, end: lastYearMonth, months: output.currentStreak })
        }
        output.currentStreak = 0
        currentStreakStart = yearMonth
      }

      output.longestStreak = Math.max(output.longestStreak, output.currentStreak)
      lastYearMonth = yearMonth
      previousDate = currentDate
    }
  }
  if (output.currentStreak > 0) {
    output.streaks.push({ start: currentStreakStart, end: lastYearMonth, months: output.currentStreak })
  }

  return output
}
