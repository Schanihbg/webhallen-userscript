/* eslint-disable no-multi-spaces */
/* eslint-disable @typescript-eslint/key-spacing */

export interface SupplyDropResponse {
  airplanePosition: number
  nextDropTime:     number
  drops:            Drop[]
  crateTypes:       CrateType[]
}

export interface CrateType {
  name:            string
  icon:            string
  progress:        number
  openableCount:   number
  nextResupplyIn?: number
}

export interface Drop {
  item:  Item
  count: number
}

export interface Item {
  id:          number
  name:        string
  iconName:    string
  description: string
}
