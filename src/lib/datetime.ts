export function timeAgo (unixTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const secondsAgo = now - unixTimestamp

  const timeUnits = [
    { singular: 'år', plural: 'år', seconds: 365 * 24 * 60 * 60 },
    { singular: 'månad', plural: 'månader', seconds: 30 * 24 * 60 * 60 },
    { singular: 'dag', plural: 'dagar', seconds: 24 * 60 * 60 },
    { singular: 'timma', plural: 'timmar', seconds: 60 * 60 },
    { singular: 'minut', plural: 'minuter', seconds: 60 },
  ]

  for (const { singular, plural, seconds } of timeUnits) {
    const count = Math.floor(secondsAgo / seconds)
    if (count >= 1) {
      return count === 1 ? `1 ${singular} sedan` : `${count} ${plural} sedan`
    }
  }

  return 'Just nu'
}

export function unixTimestampToLocale (unixTimestamp: number): string {
  const date = new Date(unixTimestamp * 1000)
  const locale = navigator.language || 'sv-SE'

  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZoneName: 'short',
  } as Intl.DateTimeFormatOptions

  return new Intl.DateTimeFormat(locale, options).format(date)
}
