function plugins() { return window.Capacitor?.Plugins || {} }

async function loadCamSettings() {
  try {
    const { value } = await plugins().Preferences.get({ key: 'camSettings' })
    if (value) camSettings = { ...camSettings, ...JSON.parse(value) }
  } catch (e) { console.error('loadCamSettings:', e) }
}

async function saveCamSettings() {
  try {
    await plugins().Preferences.set({ key: 'camSettings', value: JSON.stringify(camSettings) })
  } catch (e) { console.error('saveCamSettings:', e) }
}

async function loadAppSettings() {
  try {
    const { value } = await plugins().Preferences.get({ key: 'appSettings' })
    if (value) appSettings = { ...appSettings, ...JSON.parse(value) }
  } catch (e) { console.error('loadAppSettings:', e) }
}

async function saveAppSettings() {
  try {
    await plugins().Preferences.set({ key: 'appSettings', value: JSON.stringify(appSettings) })
  } catch (e) { console.error('saveAppSettings:', e) }
}

const ALBUM_NAME = 'AI Camera'
let albumId = null

async function ensureAlbum() {
  if (albumId) return albumId
  const Media = plugins().Media
  if (!Media) return null
  try {
    let r = await Media.getAlbums()
    let alb = (r.albums || []).find(a => a.name === ALBUM_NAME)
    if (!alb) {
      await Media.createAlbum({ name: ALBUM_NAME })
      r = await Media.getAlbums()
      alb = (r.albums || []).find(a => a.name === ALBUM_NAME)
    }
    if (alb) albumId = alb.identifier
  } catch (e) { console.error('ensureAlbum:', e) }
  return albumId
}

async function saveToGallery(dataUrl) {
  const Media = plugins().Media
  if (!Media) throw new Error('Media plugin missing')
  const opts = { path: dataUrl }
  const id = await ensureAlbum()
  if (id) opts.albumIdentifier = id
  const r = await Media.savePhoto(opts)
  return r?.filePath || null
}

async function openSystemGallery() {
  const App = plugins().App
  if (!App) return
  try {
    await App.openUrl({ url: 'content://media/external/images/media' })
  } catch (e) {
    console.error('openUrl gallery:', e)
  }
}
