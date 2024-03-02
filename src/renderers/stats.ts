import { fetchAchievements, fetchOrders, fetchSupplyDrops } from '../lib/api'
import { addCss } from '../lib/css'
import { getCachedUser } from '../lib/userIdCache'
import { findCategoriesByPeriod } from '../reducers/categories'
import { type ExperienceStats, getExperienceStats } from '../reducers/experience'
import { type HoarderEntry, findTopHoarderCheevoStats } from '../reducers/hoarder'
import { findOrdersPerMonth } from '../reducers/orders'
import { getStoreStats, type StoreSum } from '../reducers/stores'
import { type Streaks, findStreaks } from '../reducers/streaks'
import chartsCss from 'charts.css'

function addDataToDiv (headerText: string, domObject: Element): HTMLDivElement {
  const div = document.createElement('div')
  div.className = 'order my-4'

  const table = document.createElement('table')
  table.className = 'table table-condensed'

  const tbody = document.createElement('tbody')

  const tr = document.createElement('tr')
  tr.className = 'order-id-wrap'

  const td = document.createElement('td')
  td.textContent = headerText

  tr.appendChild(td)
  tbody.appendChild(tr)
  table.appendChild(tbody)
  div.appendChild(table)

  const div1 = document.createElement('div')
  const div2 = document.createElement('div')
  const orderProgression = document.createElement('div')
  const innerContainer = document.createElement('div')
  const orderStatusEvent = document.createElement('div')
  const icon = document.createElement('div')
  const header = document.createElement('h3')
  const secondary = document.createElement('div')

  div1.appendChild(div2)
  div2.appendChild(orderProgression)
  orderProgression.appendChild(innerContainer)
  innerContainer.appendChild(orderStatusEvent)
  orderStatusEvent.appendChild(icon)
  orderStatusEvent.appendChild(header)
  orderStatusEvent.appendChild(secondary)
  secondary.appendChild(domObject)

  header.className = 'level-two-heading'
  icon.className = 'icon'

  header.textContent = ''

  div.appendChild(div1)

  return div
}

function addSortingFunctionality (table: HTMLTableElement, headers: string[]): void {
  const thead = table.querySelector('thead') as HTMLTableSectionElement
  const headerRow = thead.querySelector('tr') as HTMLTableRowElement

  headerRow.childNodes.forEach(function (header, index) {
    header.addEventListener('click', function () {
      sortTable(table, index, headers)
    })
  })

  function sortTable (table: HTMLTableElement, columnIndex: number, headers: string[]): void {
    let rows
    let switching
    let i
    let x
    let y
    let shouldSwitch
    let dir
    let switchcount = 0
    switching = true
    dir = 'asc' // Default sorting direction

    while (switching) {
      switching = false
      rows = table.querySelector('tbody')?.rows ?? []

      for (i = 0; i < rows.length - 1; i++) {
        shouldSwitch = false
        x = rows[i].getElementsByTagName('td')[columnIndex]
        y = rows[i + 1].getElementsByTagName('td')[columnIndex]

        const xContent = x.textContent?.toLowerCase() ?? ''
        const yContent = y.textContent?.toLowerCase() ?? ''

        // Check if sorting is for string or number
        if (columnIndex === 0) {
          shouldSwitch =
              dir === 'asc' ? xContent > yContent : xContent < yContent
        } else if (columnIndex === 1) {
          shouldSwitch =
              dir === 'asc'
                ? parseInt(xContent) > parseInt(yContent)
                : parseInt(xContent) < parseInt(yContent)
        } else if (columnIndex === 2) {
          shouldSwitch =
              dir === 'asc'
                ? parseInt(xContent) > parseInt(yContent)
                : parseInt(xContent) < parseInt(yContent)
        }

        if (shouldSwitch) {
          rows[i].parentNode?.insertBefore(rows[i + 1], rows[i])
          switching = true
          switchcount++
        }
      }

      // Toggle the sorting direction if a switch occurred
      if (switchcount === 0 && dir === 'asc') {
        dir = 'desc'
        switching = true
      }
    }

    // Update header text with arrow indicator
    const arrow = dir === 'asc' ? '▲' : '▼'
    headerRow.childNodes.forEach(function (header, index) {
      const arrowIndicator = index === columnIndex ? arrow : ''
      header.textContent = headers[index] + arrowIndicator
    })
  }
}

function generateMonthsTable (jsonData: Record<string, { totalOrders: number, totalSum: number }>): HTMLTableElement {
  const table = document.createElement('table')
  table.className = 'table table-condensed table-striped tech-specs-table'

  const thead = document.createElement('thead')
  const headerRow = document.createElement('tr')
  const headers = ['År Månad', 'Totalt antal ordrar', 'Total summa']
  let finalSum = 0
  let finalOrders = 0

  headers.forEach(function (header) {
    const th = document.createElement('th')
    th.textContent = header
    headerRow.appendChild(th)
  })

  thead.appendChild(headerRow)
  table.appendChild(thead)

  const tbody = document.createElement('tbody')

  for (const month in jsonData) {
    const row = document.createElement('tr')
    const data = jsonData[month]

    const cell1 = document.createElement('td')
    const cell2 = document.createElement('td')
    const cell3 = document.createElement('td')

    cell1.textContent = month
    cell2.textContent = data.totalOrders.toString()
    cell3.textContent = data.totalSum.toString()

    finalOrders += data.totalOrders
    finalSum += data.totalSum

    row.appendChild(cell1)
    row.appendChild(cell2)
    row.appendChild(cell3)

    tbody.appendChild(row)
  }

  const footer = document.createElement('tfoot')
  const finalRow = document.createElement('tr')
  const cell1 = document.createElement('td')
  const cell2 = document.createElement('td')
  const cell3 = document.createElement('td')

  cell1.innerHTML = '<strong>Totalt</strong>'
  cell2.innerHTML = `<strong>${finalOrders}</strong>`
  cell3.innerHTML = `<strong>${finalSum}</strong>`

  finalRow.appendChild(cell1)
  finalRow.appendChild(cell2)
  finalRow.appendChild(cell3)
  footer.appendChild(finalRow)

  table.appendChild(tbody)
  table.appendChild(footer)

  addSortingFunctionality(table, headers)

  return table
}

function generateStreaksTable (jsonData: Streaks): HTMLDivElement {
  const div = document.createElement('div')

  const table1 = document.createElement('table')
  table1.className = 'table table-condensed table-striped tech-specs-table'

  const thead1 = document.createElement('thead')
  const headerRow1 = document.createElement('tr')
  const headers1 = ['Längsta streak', 'Nuvarande streak']

  headers1.forEach(function (header) {
    const th = document.createElement('th')
    th.textContent = header
    headerRow1.appendChild(th)
  })

  thead1.appendChild(headerRow1)
  table1.appendChild(thead1)

  const tbody1 = document.createElement('tbody')
  const firstRow = document.createElement('tr')
  const firstRowCell1 = document.createElement('td')
  const firstRowCell2 = document.createElement('td')

  firstRowCell1.textContent = `${jsonData.longestStreak}`
  firstRowCell2.textContent = `${jsonData.currentStreak}`

  firstRow.appendChild(firstRowCell1)
  firstRow.appendChild(firstRowCell2)

  tbody1.appendChild(firstRow)
  table1.appendChild(tbody1)

  /* --- */

  const table2 = document.createElement('table')
  table2.className = 'table table-condensed table-striped tech-specs-table'

  const thead2 = document.createElement('thead')
  const headerRow2 = document.createElement('tr')
  const headers2 = ['Streak började', 'Streak slutade', 'Antal månader']

  headers2.forEach(function (header) {
    const th = document.createElement('th')
    th.textContent = header
    headerRow2.appendChild(th)
  })

  thead2.appendChild(headerRow2)
  table2.appendChild(thead2)

  const tbody2 = document.createElement('tbody')

  jsonData.streaks.forEach(streak => {
    const row = document.createElement('tr')
    const cell1 = document.createElement('td')
    const cell2 = document.createElement('td')
    const cell3 = document.createElement('td')

    cell1.textContent = streak.start
    cell2.textContent = streak.end
    cell3.textContent = streak.months.toString()

    row.appendChild(cell1)
    row.appendChild(cell2)
    row.appendChild(cell3)

    tbody2.appendChild(row)
  })

  table2.appendChild(tbody2)

  div.appendChild(table1)
  div.appendChild(table2)

  return div
}

function generateCategoriesTable (jsonData: Record<string, number>): HTMLTableElement {
  const table = document.createElement('table')
  table.className = 'table table-condensed table-striped tech-specs-table'

  const thead = document.createElement('thead')
  const headerRow = document.createElement('tr')
  const headers = ['Kategori', 'Antal produkter']

  headers.forEach(function (header) {
    const th = document.createElement('th')
    th.textContent = header
    headerRow.appendChild(th)
  })

  thead.appendChild(headerRow)
  table.appendChild(thead)

  const tbody = document.createElement('tbody')

  for (const category in jsonData) {
    const row = document.createElement('tr')
    const data = jsonData[category]

    const cell1 = document.createElement('td')
    const cell2 = document.createElement('td')

    cell1.textContent = category
    cell2.textContent = data.toString()

    row.appendChild(cell1)
    row.appendChild(cell2)

    tbody.appendChild(row)
  }

  table.appendChild(tbody)

  addSortingFunctionality(table, headers)

  return table
}

function generateExperienceTable (jsonData: ExperienceStats): HTMLTableElement {
  const table = document.createElement('table')
  table.className = 'table table-condensed table-striped tech-specs-table'

  const thead = document.createElement('thead')
  const headerRow = document.createElement('tr')
  const headers = ['Köp XP', 'Bonus XP', 'Cheevo XP', 'Supply drop XP', 'Övriga XP', 'Totalt']

  headers.forEach(function (header) {
    const th = document.createElement('th')
    th.textContent = header
    headerRow.appendChild(th)
  })

  thead.appendChild(headerRow)
  table.appendChild(thead)

  const tbody = document.createElement('tbody')

  const row = document.createElement('tr')
  const cell1 = document.createElement('td')
  const cell2 = document.createElement('td')
  const cell3 = document.createElement('td')
  const cell4 = document.createElement('td')
  const cell5 = document.createElement('td')
  const cell6 = document.createElement('td')

  cell1.textContent = jsonData.purchases
  cell2.textContent = jsonData.bonusXP
  cell3.textContent = jsonData.achievements
  cell4.textContent = jsonData.supplyDrops
  cell5.textContent = jsonData.other
  cell6.textContent = jsonData.total

  row.appendChild(cell1)
  row.appendChild(cell2)
  row.appendChild(cell3)
  row.appendChild(cell4)
  row.appendChild(cell5)
  row.appendChild(cell6)

  tbody.appendChild(row)

  table.appendChild(tbody)

  return table
}
function findInjectPath (paths: string[]): HTMLElement | null {
  let dom = null
  paths.forEach(path => {
    const d = document.querySelector(path)
    if (d) {
      dom = d
    }
  })

  return dom
}

function generateHoarderTable (jsonData: HoarderEntry[]): HTMLTableElement {
  const table = document.createElement('table')
  table.className = 'table table-condensed table-striped tech-specs-table'

  const thead = document.createElement('thead')
  const headerRow = document.createElement('tr')
  const headers = ['Produkt', 'Antal köpta']

  headers.forEach(function (header) {
    const th = document.createElement('th')
    th.textContent = header
    headerRow.appendChild(th)
  })

  thead.appendChild(headerRow)
  table.appendChild(thead)

  const tbody = document.createElement('tbody')

  jsonData.forEach(product => {
    const row = document.createElement('tr')
    const cell1 = document.createElement('td')
    const cell2 = document.createElement('td')

    const link = document.createElement('a')
    link.href = 'https://www.webhallen.com/' + product.id
    link.appendChild(document.createTextNode('[' + product.id + '] ' + product.name))

    cell1.appendChild(link)
    cell2.textContent = product.bought.toString()

    row.appendChild(cell1)
    row.appendChild(cell2)

    tbody.appendChild(row)
  })

  table.appendChild(tbody)

  return table
}
function generateStoresChart (storeSums: Map<string, StoreSum>): HTMLDivElement {
  const div = document.createElement('div')
  div.setAttribute('id', 'stores-chart')
  div.style.width = '100%'
  div.style.maxWidth = '900px'
  div.style.margin = '0 auto'
  div.style.display = 'flex'
  div.style.flexDirection = 'row'
  div.style.gap = '40px'

  const table = document.createElement('table')
  table.className = 'table table-condensed charts-css pie hide-data show-primary-axis'

  const thead = document.createElement('thead')
  const theadtr = document.createElement('tr')
  const thStore = document.createElement('th')
  thStore.scope = 'col'
  const thCount = document.createElement('th')
  thCount.scope = 'col'

  theadtr.appendChild(thStore)
  theadtr.appendChild(thCount)
  thead.appendChild(theadtr)

  const tbody = document.createElement('tbody')
  const ul = document.createElement('ul')
  ul.className = 'charts-css legend legend-square'
  ul.setAttribute('style', 'flex-direction: column-reverse;')

  let prev = 0
  storeSums.forEach((value, store) => {
    console.log(`${store}: Purchases = ${value.purchases}, Normalized Value = ${value.normalizedValue}`)
    const tr = document.createElement('tr')
    const th = document.createElement('th')
    th.scope = 'col'
    th.textContent = store

    const td = document.createElement('td')
    td.setAttribute('style', `--start: ${prev}; --end: ${prev + value.normalizedValue};`)
    prev += value.normalizedValue

    const span = document.createElement('span')
    span.className = 'data'
    span.textContent = value.purchases.toString()

    td.appendChild(span)

    tr.appendChild(th)
    tr.appendChild(td)
    tbody.appendChild(tr)

    const li = document.createElement('li')
    li.textContent = `${store}: ${value.purchases}`
    ul.appendChild(li)
  })

  table.appendChild(thead)
  table.appendChild(tbody)

  div.appendChild(table)
  div.appendChild(ul)

  return div
}

async function _clearAndAddStatistics (event: MouseEvent): Promise<void> {
  event.preventDefault()

  addCss(chartsCss)

  const clickedLink = event.target as HTMLElement

  const allLinks = document.querySelectorAll('.router-link-exact-active.router-link-active')
  allLinks.forEach(function (link) {
    link.classList.remove('router-link-exact-active', 'router-link-active')
  })

  clickedLink.classList.add('router-link-exact-active', 'router-link-active')

  const content = `
      <h2 class="level-one-heading mb-5">Min statistik</h2><hr>
      <div class="mb-5">Här hittar du statistik om din aktivitet på webhallen.</div>
      `

  const paths = ['section',
    'div.member-subpage',
    'div.container']
  const injectPath = findInjectPath(paths)
  if (!injectPath) return

  injectPath.innerHTML = content

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const image = document.createElementNS('http://www.w3.org/2000/svg', 'image')
  image.setAttribute('href', 'https://cdn.webhallen.com/img/loading_light.svg')
  svg.appendChild(image)

  injectPath.appendChild(svg)

  const orders = await fetchOrders(getCachedUser().id)
  const supplyDrops = await fetchSupplyDrops()
  const achievements = await fetchAchievements(getCachedUser().id)

  injectPath.innerHTML = content

  if (orders) {
    const experience = getExperienceStats(getCachedUser(), orders, achievements, supplyDrops)
    if (experience) {
      injectPath.appendChild(addDataToDiv('Experience', generateExperienceTable(experience)))
    }

    const stores = getStoreStats(orders)
    if (stores) {
      injectPath.appendChild(addDataToDiv('Stores', generateStoresChart(stores)))
    }

    const streaks = findStreaks(orders)
    if (streaks) {
      injectPath.appendChild(addDataToDiv('Streaks', generateStreaksTable(streaks)))
    }

    const hoarder = findTopHoarderCheevoStats(orders, 10)
    if (hoarder) {
      injectPath.appendChild(addDataToDiv('Hoarder Top 10', generateHoarderTable(hoarder)))
    }

    const categories = findCategoriesByPeriod(orders)
    if (categories) {
      injectPath.appendChild(addDataToDiv('Kategorier', generateCategoriesTable(categories)))
    }

    const orderMonths = findOrdersPerMonth(orders)
    if (orderMonths) {
      injectPath.appendChild(addDataToDiv('Ordrar per månad', generateMonthsTable(orderMonths)))
    }
  }
}

export function addStatisticsLink (): void {
  const statsLink = document.querySelector('.member-nav li img[alt="Statistik"]')
  if (statsLink) return

  const ul = document.querySelector('.member-nav .desktop-wrap .nav')

  if (ul) {
    const li = document.createElement('li')
    li.className = 'tile'
    const link = document.createElement('a')
    link.href = '#'

    const image = document.createElement('img')
    image.src = '//cdn.webhallen.com/img/icons/member/topplistor.svg'
    image.className = 'member-icon'
    image.alt = 'Statistik'

    link.appendChild(image)
    link.appendChild(document.createTextNode('Statistik'))
    link.addEventListener('click', (event) => { _clearAndAddStatistics(event).catch(() => {}) })
    li.appendChild(link)
    ul.appendChild(li)
  } else {
    console.error('UL element not found using XPath.')
  }
}
