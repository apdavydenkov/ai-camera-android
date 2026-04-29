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
  if (albumId) { log('ensureAlbum: cached', albumId); return albumId }
  const Media = plugins().Media
  if (!Media) { log('ensureAlbum: Media plugin missing'); return null }
  try {
    let r = await Media.getAlbums()
    log('getAlbums: count=', (r.albums || []).length, 'names=', (r.albums || []).map(a => a.name))
    let alb = (r.albums || []).find(a => a.name === ALBUM_NAME)
    if (!alb) {
      log('createAlbum:', ALBUM_NAME)
      await Media.createAlbum({ name: ALBUM_NAME })
      r = await Media.getAlbums()
      alb = (r.albums || []).find(a => a.name === ALBUM_NAME)
      log('after createAlbum, found=', !!alb)
    }
    if (alb) { albumId = alb.identifier; log('albumId=', albumId) }
  } catch (e) { log('ensureAlbum error:', e) }
  return albumId
}

async function saveToGallery(dataUrl) {
  const Media = plugins().Media
  if (!Media) { log('saveToGallery: Media plugin missing'); throw new Error('Media plugin missing') }
  const opts = { path: dataUrl }
  const id = await ensureAlbum()
  if (id) opts.albumIdentifier = id
  log('savePhoto: pathLen=', dataUrl.length, 'album=', id)
  try {
    const r = await Media.savePhoto(opts)
    log('savePhoto OK filePath=', r?.filePath)
    return r?.filePath || null
  } catch (e) {
    log('savePhoto error:', e)
    throw e
  }
}

async function openSystemGallery() {
  const GalleryOpener = plugins().GalleryOpener
  if (GalleryOpener) {
    try {
      log('GalleryOpener.open call')
      await GalleryOpener.open()
      log('GalleryOpener.open ok')
      return
    } catch (e) { log('GalleryOpener.open error:', e) }
  } else log('GalleryOpener plugin missing')

  const App = plugins().App
  if (App) {
    try {
      log('App.openUrl fallback')
      await App.openUrl({ url: 'content://media/external/images/media' })
    } catch (e) { log('App.openUrl error:', e) }
  }
}
