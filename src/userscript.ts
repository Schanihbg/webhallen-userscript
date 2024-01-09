import { fetchMe } from './lib/api'
import { setCachedUser } from './lib/userIdCache'
import { addStatisticsLink } from './renderers/stats'

GM_addStyle('@import url("https://unpkg.com/charts.css/dist/charts.min.css");')

function main (): void {
  fetchMe()
    .then((user) => {
      if (!user) return
      setCachedUser(user)

      addStatisticsLink()
      clearInterval(timerId)
    })
    .catch(() => {})
}

const timerId = setInterval(main, 1000)
