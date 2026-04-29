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

async function saveToGallery(dataUrl) {
  const Media = plugins().Media
  if (!Media) { console.error('Media plugin missing'); return }
  await Media.savePhoto({ path: dataUrl })
}
