/* eslint-disable no-multi-spaces */
/* eslint-disable @typescript-eslint/key-spacing */

export interface AchievementsResponse {
  achievements: Achievement[]
  counts:       Counts
}

export interface Achievement {
  id:                 number
  name:               string
  level:              number
  modifiedAt?:        number
  isSecret:           boolean
  description:        null | string
  experiencePoints:   number
  rarity:             Rarity
  rarityOrder:        number
  achievedPercentage: number
  imageName:          string
}

export type Rarity = 'Common' | 'Legendary' | 'Epic' | 'Rare' | 'Uncommon' | 'Exclusive'

export interface Counts {
  unlocked:   number
  inProgress: number
  locked:     number
}
