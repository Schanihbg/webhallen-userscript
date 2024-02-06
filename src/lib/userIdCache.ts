import { type User } from './apiTypes/me'

let ME: User
export const setCachedUser = (user: User): void => {
  ME = user
}

export const getCachedUser = (): User => ME
