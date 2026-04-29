const $ = id => document.getElementById(id)

function escAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

let camSettings = { grid: false, hdr: true, sound: true, originals: false }
let appSettings = { apiKey: '', prompt: '', model: 'nanabanana1' }

const screenStack = ['devView', 'photoView', 'galleryView', 'settingsView']

function openScreen(id) {
  history.pushState({ view: id }, '')
  $(id).classList.add('open')
}

function closeScreen(id) {
  $(id).classList.remove('open')
}

function closeTopScreen() {
  for (const id of screenStack) {
    if ($(id).classList.contains('open')) {
      if (id === 'devView') closeDevSettings()
      else if (id === 'photoView') closePhoto()
      else if (id === 'galleryView') closeGallery()
      else if (id === 'settingsView') closeSettings()
      return true
    }
  }
  return false
}

history.pushState(null, '', location.href)
window.addEventListener('popstate', () => {
  history.pushState(null, '', location.href)
  closeTopScreen()
})

;(function() {
  let sx = 0, sy = 0, edge = false
  document.addEventListener('touchstart', e => {
    sx = e.touches[0].clientX; sy = e.touches[0].clientY
    edge = sx < 30
  })
  document.addEventListener('touchend', e => {
    if (!edge) return
    const dx = e.changedTouches[0].clientX - sx
    const dy = Math.abs(e.changedTouches[0].clientY - sy)
    if (dx > 60 && dy < 100) {
      e.preventDefault()
      closeTopScreen()
    }
  })
})()

async function ensureCameraPermission() {
  try {
    const Camera = window.Capacitor?.Plugins?.Camera
    if (!Camera) return
    const status = await Camera.checkPermissions()
    if (status.camera !== 'granted') {
      await Camera.requestPermissions({ permissions: ['camera'] })
    }
  } catch (e) { console.error('permission:', e) }
}
