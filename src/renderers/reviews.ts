import { fetchUserReviews, type ProductReview } from '../lib/api'
import { getCachedUser } from '../lib/userIdCache'
import { timeAgo, unixTimestampToLocale } from '../lib/datetime'
import { getPostedReviews, getProductsWithoutReviews } from '../reducers/reviews'
import { addDataToDiv, findInjectPath } from '../lib/builders'

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

function generateReviewTable (reviewData: ProductReview[]): HTMLTableElement {
  const table = document.createElement('table')
  table.className = 'table table-condensed table-striped tech-specs-table'

  for (const review of reviewData) {
    if (!review.review) continue

    const tbody = document.createElement('tbody')

    const row1 = document.createElement('tr')
    const row2 = document.createElement('tr')
    const productCell = document.createElement('td')
    const timestampCell = document.createElement('td')
    const scoreCell = document.createElement('td')
    const voteCell = document.createElement('td')
    const reviewCell = document.createElement('td')

    productCell.style.whiteSpace = 'normal'
    productCell.style.wordBreak = 'normal'
    const link = document.createElement('a')
    link.href = 'https://www.webhallen.com/' + review.product
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    const linkText = document.createTextNode(`${review.product} ${review.review.product.name}`)
    link.appendChild(linkText)
    productCell.appendChild(link)

    timestampCell.style.textAlign = 'center'
    const timestampSpan = document.createElement('span')
    timestampSpan.title = unixTimestampToLocale(review.review.createdAt)
    timestampSpan.textContent = timeAgo(review.review.createdAt)
    timestampCell.appendChild(timestampSpan)

    scoreCell.style.textAlign = 'center'
    const starsDiv = document.createElement('div')
    starsDiv.className = 'stars'
    starsDiv.title = `${review.review.rating} / 5`
    starsDiv.style.textAlign = 'middle'
    const starsContentDiv = document.createElement('div')
    starsContentDiv.className = 'stars-content stars-content-bg'
    starsContentDiv.style.width = `${(review.review.rating / 5) * 100}%`
    starsDiv.appendChild(starsContentDiv)
    scoreCell.appendChild(starsDiv)

    voteCell.style.textAlign = 'right'
    const votesDiv = document.createElement('div')
    votesDiv.className = 'votes'
    const thumbUpSpan = document.createElement('span')
    thumbUpSpan.title = 'Tumme upp'
    thumbUpSpan.className = 'vote vote-up secondary'
    thumbUpSpan.style.cursor = 'auto'
    thumbUpSpan.style.userSelect = 'auto'
    thumbUpSpan.textContent = review.review.upvotes.toString()

    const thumbDownSpan = document.createElement('span')
    thumbDownSpan.title = 'Tumme ner'
    thumbDownSpan.className = 'vote vote-down secondary'
    thumbDownSpan.style.cursor = 'auto'
    thumbDownSpan.style.userSelect = 'auto'
    thumbDownSpan.textContent = review.review.downvotes.toString()
    votesDiv.appendChild(thumbUpSpan)
    votesDiv.appendChild(thumbDownSpan)
    voteCell.append(votesDiv)

    reviewCell.style.whiteSpace = 'normal'
    reviewCell.style.wordBreak = 'normal'
    reviewCell.colSpan = 4
    reviewCell.textContent = review.review.text

    row1.appendChild(productCell)
    row1.appendChild(timestampCell)
    row1.appendChild(scoreCell)
    row1.appendChild(voteCell)

    row2.appendChild(reviewCell)

    tbody.appendChild(row1)
    tbody.appendChild(row2)

    table.appendChild(tbody)
  }

  return table
}

function generateMissingReviewTable (reviewData: ProductReview[]): HTMLTableElement {
  const table = document.createElement('table')
  table.className = 'table table-condensed table-striped tech-specs-table'

  const tbody = document.createElement('tbody')

  for (const review of reviewData) {
    const row = document.createElement('tr')
    const productCell = document.createElement('td')

    const link = document.createElement('a')
    link.href = 'https://www.webhallen.com/' + review.product
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    const linkText = document.createTextNode(`${review.product}`)
    link.appendChild(linkText)
    productCell.appendChild(link)

    row.appendChild(productCell)
    tbody.appendChild(row)
  }

  table.appendChild(tbody)

  return table
}

function _clearAndShowReviewButton (event: MouseEvent): void {
  event.preventDefault()

  const paths = ['section',
    'div.member-subpage',
    'div.container']
  const injectPath = findInjectPath(paths)
  if (!injectPath) return

  const content = `
  <h2 class="level-one-heading mb-5">Mina recensioner</h2><hr>
  <div class="mb-5">
  <span>Innan du trycker på hämta recensioner nedan är det viktig att du förstår att detta kommer hämta samtliga produkter från alla dina hanterade ordrar och sedan hämta alla recensioner för dessa produkter. Detta kommer generera en hel del trafik mot Webhallen från din webbläsare beroende på hur många ordrar och produkter du har i din historik. Om du hämtar denna information för ofta kan det hända att ditt konto eller IP address blir temporärt eller i värsta fall permanent blockerad från att besöka Webhallen.</span>
  <br/><br/>
  <span style="color: #d50855; font-size: 15px; font-weight:bold;">Genom att trycka på "Hämta recensioner" nedan godkänner du att du läst ovan och förstår innebörden av det samt att utvecklarna av detta userscript inte tar något ansvar för eventuella händelser!</span></div>
  `

  injectPath.innerHTML = content

  const reviewsButton = document.createElement('button')
  reviewsButton.type = 'button'
  reviewsButton.className = 'review-section-button text-btn'
  const reviewsButtonText = document.createElement('span')
  reviewsButtonText.textContent = 'Hämta recensioner'
  reviewsButtonText.addEventListener('click', (event) => { _clearAndAddReviews(event).catch(() => { }) })
  reviewsButton.appendChild(reviewsButtonText)

  injectPath.appendChild(reviewsButton)
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

  const productReviews = await fetchUserReviews(getCachedUser().id)
  const userReviews = getPostedReviews(productReviews)
  const missingReviews = getProductsWithoutReviews(productReviews)

  injectPath.innerHTML = content

  if (userReviews && userReviews.length > 0) {
    injectPath.appendChild(addDataToDiv('Recensioner', generateReviewTable(userReviews)))
  } else {
    console.log('Hittade inga recensioner')
  }

  if (missingReviews && missingReviews.length > 0) {
    injectPath.appendChild(addDataToDiv('Produkter du köpt som saknar recension', generateMissingReviewTable(missingReviews)))
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
    link.addEventListener('click', (event) => { _clearAndShowReviewButton(event) })
    li.appendChild(link)
    ul.appendChild(li)
  } else {
    console.error('UL element not found using XPath.')
  }
}
