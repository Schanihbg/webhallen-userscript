const addedCache = {} as Record<string, boolean>

export const addCss = (css: string): void => {
  if (addedCache[css]) return
  const stylesheet = document.createElement('style')
  stylesheet.innerHTML = css
  document.head.appendChild(stylesheet)
  addedCache[css] = true
}
