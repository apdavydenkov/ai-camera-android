let devTapCount = 0

function applyToggle(btn, on) {
  btn.classList.toggle('bg-green-500', on)
  btn.classList.toggle('bg-neutral-700', !on)
  btn.querySelector('span').classList.toggle('translate-x-5', on)
}

function toggleSetting(btn, key) {
  camSettings[key] = !camSettings[key]
  applyToggle(btn, camSettings[key])
  saveCamSettings()
  btn.closest('.s-row')?.animate([{ background: 'rgba(255,255,255,.06)' }, { background: 'transparent' }], 300)
  if (key === 'grid') $('gridOverlay').classList.toggle('hidden', !camSettings[key])
  if (key === 'hdr') updateHdrBtn()
}

function syncToggles() {
  ;[['Grid','grid'],['Hdr','hdr'],['Sound','sound'],['Orig','originals']].forEach(([id, key]) => {
    const btn = $('tog' + id)
    if (btn) applyToggle(btn, camSettings[key])
  })
}

function openSettings() {
  $('settingsView').querySelector('.s-body').scrollTop = 0
  openScreen('settingsView')
  $('promptInput').value = appSettings.prompt || ''
  $('apiKeyInput').value = appSettings.apiKey || ''
  selectModel(appSettings.model || 'nanabanana1')
  syncToggles()
}

function closeSettings() {
  closeScreen('settingsView')
  startCamera()
}

async function saveSettings() {
  appSettings.prompt = $('promptInput').value
  appSettings.apiKey = $('apiKeyInput').value.trim()
  appSettings.model = $('modelSelect').value
  await saveAppSettings()
  closeSettings()
  closeDevSettings()
}

function selectModel(val) {
  $('modelSelect').value = val
  for (const m of ['nanabanana1', 'nb2']) {
    const btn = $('mdl-' + m)
    const on = m === val
    btn.className = 'flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ' + (on ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-500')
  }
}

function openDevSettings() {
  devTapCount++
  if (devTapCount >= 5) {
    devTapCount = 0
    openScreen('devView')
  }
}

function closeDevSettings() {
  closeScreen('devView')
}

function refreshLogs() {
  $('logsContent').textContent = getLogs() || '(empty)'
}

function openLogs() {
  refreshLogs()
  openScreen('logsView')
}

function closeLogs() {
  closeScreen('logsView')
}

function clearLogsAndRefresh() {
  clearLogs()
  refreshLogs()
}

async function copyLogs() {
  const text = getLogs()
  const Clipboard = window.Capacitor?.Plugins?.Clipboard
  try {
    if (Clipboard) {
      await Clipboard.write({ string: text })
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      throw new Error('No clipboard API')
    }
    notify('Логи скопированы (' + text.length + ' симв.)')
  } catch (e) {
    notify('Копировать не удалось: ' + (e?.message || e))
  }
}

async function shareLogs() {
  const text = getLogs()
  const Share = window.Capacitor?.Plugins?.Share
  if (!Share) { notify('Share плагин недоступен'); return }
  try {
    await Share.share({ title: 'Логи AI Camera', text, dialogTitle: 'Отправить логи' })
  } catch (e) {
    notify('Поделиться не удалось: ' + (e?.message || e))
  }
}
