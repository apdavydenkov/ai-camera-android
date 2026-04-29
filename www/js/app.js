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
    const needed = []
    if (status.camera !== 'granted') needed.push('camera')
    if (status.photos !== 'granted') needed.push('photos')
    if (needed.length) await Camera.requestPermissions({ permissions: needed })
  } catch (e) { console.error('permission:', e) }
}

function notify(msg) {
  let n = document.getElementById('toast')
  if (!n) {
    n = document.createElement('div')
    n.id = 'toast'
    n.className = 'absolute bottom-44 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-lg px-4 py-2 rounded-full text-sm z-50 transition-opacity duration-300'
    document.body.appendChild(n)
  }
  n.textContent = msg
  n.style.opacity = '1'
  clearTimeout(n._t)
  n._t = setTimeout(() => { n.style.opacity = '0' }, 3000)
}
