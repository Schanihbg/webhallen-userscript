export const getSetting = (key: string): boolean => {
  const defaults = {
    showComparisons: true,
    showStats: true,
  } as Record<string, boolean>
  return GM_getValue(key, defaults[key] || false)
}

const setSetting = (key: string, value: boolean): void => {
  GM_setValue(key, value)
}

const renderSettingCheckbox = (settingKey: string, labelText: string): Element => {
  const settingValue = getSetting(settingKey)

  const label = document.createElement('label')
  label.classList.add('checkbox-wrap', '_small')
  if (settingValue) label.classList.add('_checked')

  const inputElem = document.createElement('input')
  inputElem.type = 'checkbox'
  label.appendChild(inputElem)

  const checkboxSpan = document.createElement('span')
  checkboxSpan.classList.add('checkbox')
  if (settingValue) {
    checkboxSpan.classList.add('checked')
    const checkmarkSpan = document.createElement('span')
    checkmarkSpan.classList.add('checkmark')
    checkboxSpan.appendChild(checkmarkSpan)
  }
  label.appendChild(checkboxSpan)

  const labelSpan = document.createElement('span')
  labelSpan.classList.add('checkbox-label')
  labelSpan.textContent = labelText
  label.appendChild(labelSpan)

  const renderState = (checked: boolean): void => {
    if (checked) {
      label.classList.add('_checked')
      checkboxSpan.classList.add('checked')
      const checkmarkSpan = document.createElement('span')
      checkmarkSpan.classList.add('checkmark')
      checkboxSpan.appendChild(checkmarkSpan)
    } else {
      label.classList.remove('_checked')
      checkboxSpan.classList.remove('checked')
      if (checkboxSpan.firstElementChild) {
        checkboxSpan.removeChild(checkboxSpan.firstElementChild)
      }
    }
  }

  renderState(getSetting(settingKey))
  label.addEventListener('input', (e) => {
    const newValue = !getSetting(settingKey)

    // update it in storage
    setSetting(settingKey, newValue)

    // update the rendered state
    renderState(newValue)
  })

  return label
}

const renderPanel = (title: string, contents: Element[]): HTMLDivElement => {
  const panelDiv = document.createElement('div')
  panelDiv.classList.add('panel', 'panel-primary')

  const panelHeading = document.createElement('div')
  panelHeading.classList.add('panel-heading')
  panelDiv.appendChild(panelHeading)

  const h3 = document.createElement('h3')
  h3.classList.add('panel-title')
  h3.textContent = title
  panelHeading.appendChild(h3)

  const panelBody = document.createElement('div')
  panelBody.classList.add('text-group', 'panel-body')
  contents.forEach((contentElement) => {
    panelBody.appendChild(contentElement)
  })
  panelDiv.appendChild(panelBody)

  return panelDiv
}

export const appendScriptSettings = (): void => {
  const endOfSettingsClearfix = document.querySelector('.profile-settings > .clearfix')

  if (!endOfSettingsClearfix) {
    console.error('Couldnt find the end of the settings page. Maybe it hasnt rendered yet?')
    return
  }

  const userscriptSettingsDiv = document.createElement('div')
  userscriptSettingsDiv.classList.add('col-md-12')

  const reloadPageDisclaimer = document.createElement('p')
  reloadPageDisclaimer.textContent = 'Ändring av vissa inställningar kräver att sidan laddas om.'

  const settingsContents = [
    reloadPageDisclaimer,
    renderSettingCheckbox('showComparisons', 'Visa jämförelseverktyget på kategorisidor'),
    renderSettingCheckbox('showStats', 'Visa statistiksidan'),
  ]

  const panelDiv = renderPanel('Userscript-inställningar', settingsContents)
  userscriptSettingsDiv.appendChild(panelDiv)

  endOfSettingsClearfix.parentElement?.insertBefore(userscriptSettingsDiv, endOfSettingsClearfix)
}
