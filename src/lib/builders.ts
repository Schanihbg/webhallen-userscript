export function findInjectPath (paths: string[]): HTMLElement | null {
  let dom = null
  paths.forEach(path => {
    const d = document.querySelector(path)
    if (d) {
      dom = d
    }
  })

  return dom
}

export function addDataToDiv (headerText: string, domObject: Element): HTMLDivElement {
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
