const $ = id => document.getElementById(id)

function escAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

let camSettings = { grid: false, hdr: true, sound: true, originals: false }
let appSettings = { apiKey: '', prompt: '', model: 'nanabanana1' }

const logBuffer = []
const LOG_MAX = 500

function log(...args) {
  const t = new Date().toISOString().slice(11, 23)
  const msg = args.map(a => {
    if (a instanceof Error) return a.message + (a.stack ? '\n' + a.stack : '')
    if (typeof a === 'object') { try { return JSON.stringify(a) } catch { return String(a) } }
    return String(a)
  }).join(' ')
  logBuffer.push(t + ' ' + msg)
  if (logBuffer.length > LOG_MAX) logBuffer.shift()
  if (typeof _origConsoleLog === 'function') _origConsoleLog(t, ...args)
}

const _origConsoleLog = console.log.bind(console)
const _origConsoleError = console.error.bind(console)
console.log = (...args) => { log('[log]', ...args); _origConsoleLog(...args) }
console.error = (...args) => { log('[err]', ...args); _origConsoleError(...args) }
window.addEventListener('error', e => log('[window.error]', e.message, 'at', e.filename + ':' + e.lineno))
window.addEventListener('unhandledrejection', e => log('[unhandled]', e.reason?.message || e.reason))

function getLogs() { return logBuffer.join('\n') }
function clearLogs() { logBuffer.length = 0 }

const screenStack = ['logsView', 'devView', 'settingsView']

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
      else if (id === 'logsView') closeLogs()
      return true
    }
  }
  return false
}

async function setupNative() {
  log('setupNative: plugins=', Object.keys(window.Capacitor?.Plugins || {}))
  const App = window.Capacitor?.Plugins?.App
  if (App) {
    App.addListener('backButton', () => {
      if (!closeTopScreen()) App.exitApp()
    })
    log('App.backButton: listener added')
  } else log('App plugin missing')

  const StatusBar = window.Capacitor?.Plugins?.StatusBar
  if (StatusBar) {
    try {
      await StatusBar.setOverlaysWebView({ overlay: true })
      await StatusBar.setStyle({ style: 'DARK' })
      log('StatusBar: overlay+DARK ok')
    } catch (e) { log('StatusBar error:', e) }
  } else log('StatusBar plugin missing')

  const SplashScreen = window.Capacitor?.Plugins?.SplashScreen
  if (SplashScreen) {
    try { await SplashScreen.hide(); log('SplashScreen.hide ok') } catch (e) { log('SplashScreen error:', e) }
  }
}

async function ensureCameraPermission() {
  try {
    const Camera = window.Capacitor?.Plugins?.Camera
    if (!Camera) { log('Camera plugin missing — skip permission'); return }
    const status = await Camera.checkPermissions()
    log('permissions before:', status)
    const needed = []
    if (status.camera !== 'granted') needed.push('camera')
    if (status.photos !== 'granted') needed.push('photos')
    if (needed.length) {
      const after = await Camera.requestPermissions({ permissions: needed })
      log('permissions after request', needed, '→', after)
    } else log('permissions already granted')
  } catch (e) { log('permission error:', e) }
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
