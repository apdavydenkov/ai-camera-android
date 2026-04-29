const PHOTOS_DIR = 'photos'
const DATA_DIR = 'DATA'

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

async function ensurePhotosDir() {
  try {
    await plugins().Filesystem.mkdir({ path: PHOTOS_DIR, directory: DATA_DIR, recursive: true })
  } catch {}
}

function stripDataUrl(dataUrl) {
  return dataUrl.replace(/^data:image\/\w+;base64,/, '')
}

async function writePhoto(name, base64) {
  await ensurePhotosDir()
  await plugins().Filesystem.writeFile({
    path: PHOTOS_DIR + '/' + name,
    data: base64,
    directory: DATA_DIR
  })
}

async function deletePhotoFile(name) {
  try {
    await plugins().Filesystem.deleteFile({ path: PHOTOS_DIR + '/' + name, directory: DATA_DIR })
  } catch {}
}

async function listPhotoFiles() {
  await ensurePhotosDir()
  try {
    const r = await plugins().Filesystem.readdir({ path: PHOTOS_DIR, directory: DATA_DIR })
    return (r.files || []).filter(f => f.type === 'file' && /\.(jpg|jpeg|png)$/i.test(f.name))
  } catch (e) { console.error('readdir:', e); return [] }
}

async function photoUrl(name) {
  const r = await plugins().Filesystem.getUri({ path: PHOTOS_DIR + '/' + name, directory: DATA_DIR })
  return window.Capacitor.convertFileSrc(r.uri)
}

async function readPhotoBase64(name) {
  const r = await plugins().Filesystem.readFile({ path: PHOTOS_DIR + '/' + name, directory: DATA_DIR })
  return r.data
}
