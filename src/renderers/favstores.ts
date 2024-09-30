import { deleteFavoriteStores } from '../lib/api'

async function _clearAllStores (event: MouseEvent): Promise<void> {
  event.preventDefault()
  await deleteFavoriteStores()
  location.reload()
}

function observeDOM (): void {
  const targetNode = document.body

  const config = { childList: true, subtree: true }

  const callback = function (mutationsList: MutationRecord[], observer: MutationObserver): void {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          const addedNode = node as unknown as HTMLElement
          if (addedNode.className && addedNode.className === 'stores-map') {
            const storelist = addedNode.querySelector('.list-group') as HTMLDivElement
            if (storelist) {
              console.log('Found store list', storelist)
              const li = document.createElement('li')
              li.className = 'list-group-item store-list-item'
              const label = document.createElement('label')
              label.className = 'stock-favorite'
              label.title = 'Rensa'
              const checkbox = document.createElement('input')
              checkbox.type = 'checkbox'
              const span1 = document.createElement('span')
              span1.textContent = 'Rensa alla butiker'
              const link = document.createElement('a')
              link.href = '#'
              link.className = 'store-info'
              link.addEventListener('click', (event) => { _clearAllStores(event).catch(() => { }) })
              const span2 = document.createElement('span')
              span2.className = 'store-location'
              span2.textContent = 'Löser problem me butiker som inte går att ta bort då de försvunnit'
              link.appendChild(span1)
              link.appendChild(span2)
              li.appendChild(label)
              li.appendChild(link)
              storelist.prepend(li)
            }
          }
        })
      }
    }
  }

  const observer = new MutationObserver(callback)
  observer.observe(targetNode, config)
}

let renderedAlready = false
export const renderClearFavoriteStoresUtility = (): void => {
  if (renderedAlready) return
  observeDOM()
  renderedAlready = true
}
