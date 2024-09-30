import { fetchUserReviews, type OrderReview } from '../lib/api'
import { getCachedUser } from '../lib/userIdCache'

function injectCSS (): void {
  const style = document.createElement('style')
  style.textContent = `
            .review-progress-container {
                width: 300px;
                height: 30px;
                border: 2px solid white;
                position: relative;
                margin: 20px 0;
                background-color: #272a4c;
                border-radius: 50rem;
            }

            .review-progress-bar {
              background-color: #29bb59;
              border-radius: 50rem 100rem 1px 50rem;
              box-shadow: none;
              height: 100%;
              position: absolute;
              transition: width .6s ease;
            }

            .review-progress-text {
                position: absolute;
                width: 100%;
                text-align: center;
                line-height: 30px;
                color: white;
            }
        `

  // Append the style element to the head
  document.head.appendChild(style)
}

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

function generateReviewTable (reviewData: OrderReview[]): HTMLTableElement {
  const table = document.createElement('table')
  table.className = 'table table-condensed table-striped tech-specs-table'

  const thead = document.createElement('thead')
  const headerRow = document.createElement('tr')
  const headers = ['Artikel id', 'Omdöme', 'Betyg']

  headers.forEach(function (header) {
    const th = document.createElement('th')
    th.textContent = header
    headerRow.appendChild(th)
  })

  thead.appendChild(headerRow)
  table.appendChild(thead)

  const tbody = document.createElement('tbody')

  for (const review of reviewData) {
    const row = document.createElement('tr')
    const cell1 = document.createElement('td')
    const cell2 = document.createElement('td')
    const cell3 = document.createElement('td')

    const link = document.createElement('a')
    link.href = 'https://www.webhallen.com/' + review.product
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    const linkText = document.createTextNode('[' + review.product + ']')

    if (!review.review) {
      cell2.textContent = 'Denna produkt saknar recenssion'
    } else {
      cell2.textContent = review.review.text.toString()
      cell3.textContent = review.review.rating.toString()
      linkText.textContent = `${linkText.textContent} ${review.review.product.name}`
    }
    link.appendChild(linkText)
    cell1.appendChild(link)

    row.appendChild(cell1)
    row.appendChild(cell2)
    row.appendChild(cell3)

    tbody.appendChild(row)
  }

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

async function _clearAndAddReviews (event: MouseEvent): Promise<void> {
  event.preventDefault()

  injectCSS()

  const clickedLink = event.target as HTMLElement

  const allLinks = document.querySelectorAll('.router-link-exact-active.router-link-active')
  allLinks.forEach(function (link) {
    link.classList.remove('router-link-exact-active', 'router-link-active')
  })

  clickedLink.classList.add('router-link-exact-active', 'router-link-active')

  const content = `
        <h2 class="level-one-heading mb-5">Mina recensioner</h2><hr>
        <div class="mb-5">Här hittar du dina recensioner. Notera att endast recensioner på köpta produkter kan visas i dagsläget.</div>
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

  const progressContainer = document.createElement('div')
  progressContainer.className = 'review-progress-container mb-3'

  const progressBar = document.createElement('div')
  progressBar.id = 'review-progress-bar'
  progressBar.className = 'review-progress-bar'

  const progressText = document.createElement('div')
  progressText.id = 'review-progress-text'
  progressText.className = 'review-progress-text'
  progressText.textContent = '0 av 0'

  progressContainer.appendChild(progressBar)
  progressContainer.appendChild(progressText)

  injectPath.appendChild(progressContainer)
  injectPath.appendChild(svg)

  const userReviews = await fetchUserReviews(getCachedUser().id)

  injectPath.innerHTML = content

  if (userReviews) {
    injectPath.appendChild(addDataToDiv('Recensioner', generateReviewTable(userReviews)))
  }
}

export function addReviewsLink (): void {
  const reviewsLink = document.querySelector('.member-nav li img[alt="Recensioner"]')
  if (reviewsLink) return

  const ul = document.querySelector('.member-nav .desktop-wrap .nav')

  if (ul) {
    const li = document.createElement('li')
    li.className = 'tile'
    const link = document.createElement('a')
    link.href = '#'

    const image = document.createElement('img')
    image.src = '//cdn.webhallen.com/img/icons/feed/feed_review.svg'
    image.className = 'member-icon'
    image.alt = 'Recensioner'

    link.appendChild(image)
    link.appendChild(document.createTextNode('Recensioner'))
    link.addEventListener('click', (event) => { _clearAndAddReviews(event).catch(() => { }) })
    li.appendChild(link)
    ul.appendChild(li)
  } else {
    console.error('UL element not found using XPath.')
  }
}
