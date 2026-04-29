const $ = id => document.getElementById(id)

function escAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

let camSettings = { grid: false, hdr: true, sound: true, originals: false }
let appSettings = { apiKey: '', prompt: '', model: 'nanabanana1' }

const screenStack = ['devView', 'settingsView']

function openScreen(id) {
  $(id).classList.add('open')
}

function closeScreen(id) {
  $(id).classList.remove('open')
}

function closeTopScreen() {
  for (const id of screenStack) {
    if ($(id).classList.contains('open')) {
      if (id === 'devView') closeDevSettings()
      else if (id === 'settingsView') closeSettings()
      return true
    }
  }
  return false
}

async function setupNative() {
  const App = window.Capacitor?.Plugins?.App
  if (App) {
    App.addListener('backButton', () => {
      if (!closeTopScreen()) App.exitApp()
    })
  }

  const StatusBar = window.Capacitor?.Plugins?.StatusBar
  if (StatusBar) {
    try {
      await StatusBar.setOverlaysWebView({ overlay: true })
      await StatusBar.setStyle({ style: 'DARK' })
    } catch (e) { console.error('StatusBar:', e) }
  }

  const SplashScreen = window.Capacitor?.Plugins?.SplashScreen
  if (SplashScreen) {
    try { await SplashScreen.hide() } catch {}
  }
}

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
