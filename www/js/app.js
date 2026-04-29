const $ = id => document.getElementById(id)

function escAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

let camSettings = { grid: false, sound: true, originals: false }
let appSettings = { apiKey: '', prompt: '', model: 'nanabanana1' }

const logBuffer = []
const LOG_MAX = 500
const _origLog = console.log.bind(console)
const _origErr = console.error.bind(console)

function log(...args) {
  const t = new Date().toISOString().slice(11, 23)
  const msg = args.map(a => {
    if (a instanceof Error) return a.message + (a.stack ? '\n' + a.stack : '')
    if (typeof a === 'object') { try { return JSON.stringify(a) } catch { return String(a) } }
    return String(a)
  }).join(' ')
  logBuffer.push(t + ' ' + msg)
  if (logBuffer.length > LOG_MAX) logBuffer.shift()
  _origLog(t, ...args)
}

console.log = (...args) => log('[log]', ...args)
console.error = (...args) => { log('[err]', ...args); _origErr(...args) }
window.addEventListener('error', e => log('[window.error]', e.message, 'at', e.filename + ':' + e.lineno))
window.addEventListener('unhandledrejection', e => log('[unhandled]', e.reason?.message || e.reason))

function getLogs() { return logBuffer.join('\n') }
function clearLogs() { logBuffer.length = 0 }

const screens = ['logsView', 'devView', 'settingsView']

function openScreen(id) { $(id).classList.add('open') }
function closeScreen(id) { $(id).classList.remove('open') }

function closeTopScreen() {
  for (const id of screens) {
    if ($(id).classList.contains('open')) { closeScreen(id); return true }
  }
  return false
}

async function setupNative() {
  log('setupNative: plugins=', Object.keys(window.Capacitor?.Plugins || {}))
  const { App, StatusBar } = window.Capacitor?.Plugins || {}
  if (App) {
    App.addListener('backButton', () => { if (!closeTopScreen()) App.exitApp() })
  }
  if (StatusBar) {
    try {
      await StatusBar.setOverlaysWebView({ overlay: true })
      await StatusBar.setStyle({ style: 'DARK' })
    } catch (e) { log('StatusBar error:', e) }
  }
}

function notify(msg) {
  const n = $('toast')
  n.textContent = msg
  n.style.opacity = '1'
  clearTimeout(n._t)
  n._t = setTimeout(() => { n.style.opacity = '0' }, 3000)
}
