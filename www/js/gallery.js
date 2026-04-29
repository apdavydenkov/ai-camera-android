let cachedPhotos = [], viewerPhotos = [], viewerIdx = 0
let processingSet = new Set()

async function buildPhotosList() {
  const files = await listPhotoFiles()
  const byTs = {}
  files.forEach(f => {
    const ts = f.name.split('_')[0]
    if (!byTs[ts]) byTs[ts] = {}
    if (f.name.includes('_proc')) byTs[ts].proc = f.name
    if (f.name.includes('_orig')) byTs[ts].orig = f.name
  })
  const list = Object.keys(byTs).sort().reverse().map(ts => ({
    ts,
    name: byTs[ts].proc || byTs[ts].orig,
    origName: byTs[ts].orig || null,
    procName: byTs[ts].proc || null,
    processing: !!byTs[ts].orig && !byTs[ts].proc && processingSet.has(ts)
  }))
  for (const p of list) {
    p.url = await photoUrl(p.name)
    p.origUrl = p.origName ? await photoUrl(p.origName) : null
  }
  return list
}

async function preloadPhotos() {
  try {
    cachedPhotos = await buildPhotosList()
    updateThumb()
    refreshGallery()
  } catch (e) { console.error('preload:', e) }
}

function updateThumb(url) {
  const btn = $('galleryThumb')
  if (url) {
    btn.innerHTML = '<img src="' + escAttr(url) + '" class="w-full h-full object-cover">'
    return
  }
  if (cachedPhotos.length) {
    btn.innerHTML = '<img src="' + escAttr(cachedPhotos[0].url) + '" class="w-full h-full object-cover">'
  } else {
    btn.innerHTML = '<svg class="w-5 h-5 m-auto text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M5 3v2"/></svg>'
  }
}

function startProcessing(ts) {
  processingSet.add(ts)
  updateProcBadge()
}

function finishProcessing(ts) {
  processingSet.delete(ts)
  updateProcBadge()
}

function updateProcBadge() {
  const el = $('procBadge')
  if (processingSet.size > 0) {
    el.classList.remove('hidden'); el.classList.add('flex')
    $('procBadgeText').textContent = processingSet.size > 1
      ? 'Обработка (' + processingSet.size + ')...'
      : 'Обработка...'
  } else {
    el.classList.add('hidden'); el.classList.remove('flex')
  }
}

async function openGallery() {
  openScreen('galleryView')
  await preloadPhotos()
}

function closeGallery() {
  closeScreen('galleryView')
  startCamera()
}

function renderGallery() {
  const items = cachedPhotos.map(p => {
    const spinner = p.processing
      ? '<div class="absolute inset-0 bg-black/40 flex items-center justify-center"><div class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full" style="animation:spin .6s linear infinite"></div></div>'
      : ''
    return '<div class="relative aspect-square bg-neutral-900">' +
      '<img src="' + escAttr(p.url) + '" onclick="openPhoto(\'' + escAttr(p.url) + '\')" class="w-full h-full object-cover cursor-pointer" loading="lazy">' +
      spinner + '</div>'
  })
  $('galContent').innerHTML = items.length
    ? '<div class="px-3 py-2 text-xs text-neutral-500 font-semibold">Фото</div><div class="grid grid-cols-3 gap-px p-px">' + items.join('') + '</div>'
    : '<div class="flex-1 flex items-center justify-center text-neutral-600 text-sm">Нет фото</div>'
}

function refreshGallery() {
  if (!$('galleryView').classList.contains('open')) return
  renderGallery()
}

async function openOriginals() {
  const orig = cachedPhotos.filter(p => p.origUrl)
  const imgs = orig.map(p =>
    '<img src="' + escAttr(p.origUrl) + '" onclick="openPhoto(\'' + escAttr(p.origUrl) + '\')" loading="lazy" class="w-full aspect-square object-cover cursor-pointer">'
  ).join('')
  $('galContent').innerHTML = '<div class="px-3 py-2 text-xs text-neutral-500 font-semibold">Оригиналы</div>' +
    '<div class="grid grid-cols-3 gap-px p-px">' + (imgs || '<div class="col-span-3 py-10 text-center text-neutral-600">Нет оригиналов</div>') + '</div>'
  openScreen('galleryView')
  closeSettings()
}

function openPhoto(url) {
  viewerPhotos = cachedPhotos.map(p => p.url)
  viewerIdx = viewerPhotos.indexOf(url)
  if (viewerIdx < 0) viewerIdx = 0
  showViewerPhoto()
  openScreen('photoView')
}

function showViewerPhoto() {
  $('photoFull').src = viewerPhotos[viewerIdx]
  $('photoCounter').textContent = (viewerIdx + 1) + ' / ' + viewerPhotos.length
}

function closePhoto() {
  closeScreen('photoView')
}

async function deletePhoto() {
  const url = viewerPhotos[viewerIdx]
  const photo = cachedPhotos.find(p => p.url === url)
  if (photo) {
    if (photo.origName) await deletePhotoFile(photo.origName)
    if (photo.procName) await deletePhotoFile(photo.procName)
  }

  viewerPhotos.splice(viewerIdx, 1)
  await preloadPhotos()

  if (!viewerPhotos.length) {
    closePhoto()
    return
  }
  if (viewerIdx >= viewerPhotos.length) viewerIdx = viewerPhotos.length - 1
  showViewerPhoto()
}

;(function() {
  const el = $('photoSwipe'), img = $('photoFull')
  let scale = 1, tx = 0, ty = 0
  let startScale = 1, startDist = 0, startTx = 0, startTy = 0
  let sx = 0, sy = 0, isPinch = false, isPan = false
  let lastTap = 0

  function apply() { img.style.transform = 'scale(' + scale + ') translate(' + tx + 'px,' + ty + 'px)' }
  function resetZoom() { scale = 1; tx = 0; ty = 0; apply() }
  function clampPan() {
    if (scale <= 1) { tx = 0; ty = 0; return }
    const r = el.getBoundingClientRect()
    const maxX = (r.width * (scale - 1)) / (2 * scale)
    const maxY = (r.height * (scale - 1)) / (2 * scale)
    tx = Math.max(-maxX, Math.min(maxX, tx))
    ty = Math.max(-maxY, Math.min(maxY, ty))
  }
  function dist(t) { return Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY) }

  el.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      isPinch = true
      startDist = dist(e.touches)
      startScale = scale
      startTx = tx; startTy = ty
    } else if (e.touches.length === 1) {
      isPinch = false; isPan = false
      sx = e.touches[0].clientX; sy = e.touches[0].clientY
      startTx = tx; startTy = ty
      const now = Date.now()
      if (now - lastTap < 300) {
        e.preventDefault()
        if (scale > 1.1) resetZoom(); else { scale = 3; clampPan(); apply() }
        lastTap = 0; return
      }
      lastTap = now
    }
  })

  el.addEventListener('touchmove', e => {
    e.preventDefault()
    if (e.touches.length === 2 && isPinch) {
      scale = Math.max(1, Math.min(8, startScale * (dist(e.touches) / startDist)))
      if (scale <= 1) { tx = 0; ty = 0 } else clampPan()
      apply()
    } else if (e.touches.length === 1 && !isPinch) {
      const dx = e.touches[0].clientX - sx
      const dy = e.touches[0].clientY - sy
      if (scale > 1.05) {
        isPan = true
        tx = startTx + dx / scale; ty = startTy + dy / scale
        clampPan(); apply()
      }
    }
  }, { passive: false })

  el.addEventListener('touchend', e => {
    if (isPinch && e.touches.length < 2) {
      isPinch = false
      if (scale < 1.05) resetZoom()
      return
    }
    if (e.touches.length === 0 && !isPinch && !isPan && scale <= 1.05) {
      const dx = e.changedTouches[0].clientX - sx
      if (Math.abs(dx) > 50) {
        if (dx < 0 && viewerIdx < viewerPhotos.length - 1) viewerIdx++
        else if (dx > 0 && viewerIdx > 0) viewerIdx--
        else return
        resetZoom(); showViewerPhoto()
      }
    }
    isPan = false
  })

  const origShow = showViewerPhoto
  showViewerPhoto = function() { resetZoom(); origShow() }
})()
