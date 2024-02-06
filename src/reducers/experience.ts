import { type Achievement } from '../lib/apiTypes/achievements'
import { type User } from '../lib/apiTypes/me'
import { type Order } from '../lib/apiTypes/order'
import { type Drop } from '../lib/apiTypes/supplyDrop'

export interface ExperienceStats {
  purchases: string
  bonusXP: string
  achievements: string
  supplyDrops: string
  other: string
  total: string
}
export function getExperienceStats (
  me: User,
  orders: Order[],
  achievements: Achievement[],
  supplyDrops: Drop[],
): ExperienceStats {
  const output = { purchases: 0, bonusXP: 0, achievements: 0, supplyDrops: 0, other: 0, total: 0 }

  orders.forEach(order => {
    output.purchases += order.totalSum

    if (order.userExperiencePointBoosts) {
      order.userExperiencePointBoosts.forEach(boost => {
        output.bonusXP += boost.experiencePoints
      })
    }
  })

  const earnedAchievements = achievements.filter(item => item.achievedPercentage >= 1)
  earnedAchievements.forEach(achievement => { output.achievements += achievement.experiencePoints })

  supplyDrops.forEach(drop => {
    const xpValue = parseInt(drop.item.description.replace('XP', '').trim())
    if (isNaN(xpValue)) return

    output.supplyDrops += xpValue * drop.count
  })

  output.total = output.purchases + output.bonusXP + output.achievements + output.supplyDrops
  if (output.total < me.experiencePoints) {
    output.other = me.experiencePoints - output.total
    output.total += output.other
  }

  return {
    purchases: output.purchases.toLocaleString('sv'),
    bonusXP: output.bonusXP.toLocaleString('sv'),
    achievements: output.achievements.toLocaleString('sv'),
    supplyDrops: output.supplyDrops.toLocaleString('sv'),
    other: output.other.toLocaleString('sv'),
    total: output.total.toLocaleString('sv'),
  }
}
