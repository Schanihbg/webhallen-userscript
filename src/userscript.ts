import { fetchMe } from './lib/api'
import { setCachedUser } from './lib/userIdCache'
import { addStatisticsLink } from './renderers/stats'

GM_addStyle('@import url("https://unpkg.com/charts.css/dist/charts.min.css");')

const doRouting = async (): Promise<void> => {
  const { pathname } = document.location
  if (pathname.startsWith('/se/member')) {
    console.log('On member pages. Requesting user info and appending stats link.')
    await fetchMe()
      .then((user) => {
        if (!user) return
        setCachedUser(user)

        addStatisticsLink()
      })
  }
}

const voidRouting = (): void => {
  doRouting().catch(() => {})
}
if (window.onurlchange === null) {
  window.addEventListener('urlchange', voidRouting)
}
window.addEventListener('load', voidRouting)
voidRouting()
