function plugins() { return window.Capacitor?.Plugins || {} }

async function loadCamSettings() {
  try {
    const { value } = await plugins().Preferences.get({ key: 'camSettings' })
    if (value) camSettings = { ...camSettings, ...JSON.parse(value) }
  } catch (e) { log('loadCamSettings:', e) }
}

async function saveCamSettings() {
  try {
    await plugins().Preferences.set({ key: 'camSettings', value: JSON.stringify(camSettings) })
  } catch (e) { log('saveCamSettings:', e) }
}

async function loadAppSettings() {
  try {
    const { value } = await plugins().Preferences.get({ key: 'appSettings' })
    if (value) appSettings = { ...appSettings, ...JSON.parse(value) }
  } catch (e) { log('loadAppSettings:', e) }
}

async function saveAppSettings() {
  try {
    await plugins().Preferences.set({ key: 'appSettings', value: JSON.stringify(appSettings) })
  } catch (e) { log('saveAppSettings:', e) }
}

async function saveToGallery(dataUrl) {
  const Gallery = plugins().Gallery
  if (!Gallery) throw new Error('Gallery plugin missing')
  log('saveToGallery: pathLen=', dataUrl.length)
  try {
    const r = await Gallery.save({ dataUrl })
    log('saveToGallery OK:', r?.filePath)
    return r?.filePath || null
  } catch (e) {
    log('saveToGallery error:', e)
    throw e
  }
}

async function openSystemGallery() {
  const Gallery = plugins().Gallery
  if (!Gallery) { log('Gallery plugin missing'); return }
  try {
    log('Gallery.open call')
    await Gallery.open()
    log('Gallery.open ok')
  } catch (e) { log('Gallery.open error:', e) }
}
