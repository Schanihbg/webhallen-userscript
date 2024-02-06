import { fetchMe } from './lib/api'
import { setCachedUser } from './lib/userIdCache'
import { renderComparisonUtility } from './renderers/comparison'
import { appendScriptSettings, getSetting } from './renderers/settings'
import { addStatisticsLink } from './renderers/stats'

const doRouting = async (): Promise<void> => {
  const { pathname } = document.location
  if (getSetting('showStats') && pathname.startsWith('/se/member')) {
    console.log('On member pages. Requesting user info and appending stats link.')
    await fetchMe()
      .then((user) => {
        if (!user) return
        setCachedUser(user)

        addStatisticsLink()
      })
  }

  if (pathname.match(/\/se\/member\/\d+\/profile/)) {
    console.log('On settings page. Appending userscript settings')
    appendScriptSettings()
  }

  if (getSetting('showComparisons') && (pathname.startsWith('/se/category') || pathname.startsWith('/se/search'))) {
    console.log('On category or search results page, rendering comparison utils')
    renderComparisonUtility()
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
