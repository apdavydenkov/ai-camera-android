let stream = null
let facingMode = 'environment'
let flashMode = 0
let processingCount = 0

const MODELS = {
  nanabanana1: 'google/gemini-2.5-flash-image',
  nb2: 'google/gemini-3.1-flash-image-preview'
}

async function startCamera() {
  try {
    if (stream) stream.getTracks().forEach(t => t.stop())
    log('startCamera:', facingMode)
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false
    })
    $('video').srcObject = stream
    await $('video').play()
    log('startCamera: ok')
  } catch (e) { log('startCamera error:', e); notify('Камера: ' + (e?.message || e)) }
}

function track() { return stream?.getVideoTracks()[0] }

function switchCamera() {
  facingMode = facingMode === 'environment' ? 'user' : 'environment'
  $('switchCamBtn').animate([{ transform: 'rotate(180deg)' }], 300)
  startCamera()
}

$('cameraView').addEventListener('click', e => {
  if (e.target.closest('button') || e.target.closest('input')) return
  const r = $('focusRing')
  r.style.left = (e.clientX - 30) + 'px'
  r.style.top = (e.clientY - 30) + 'px'
  r.classList.remove('hidden')
  r.animate([{ transform: 'scale(1.5)', opacity: 0 }, { opacity: 1, offset: .5 }, { transform: 'scale(1)', opacity: 0 }], 400)
  setTimeout(() => r.classList.add('hidden'), 400)
  try { track()?.applyConstraints({ advanced: [{ focusMode: 'single-shot' }] }) } catch {}
})

;(function() {
  let startDist = 0, startZoom = 1
  const el = $('cameraView')
  const dist = t => Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY)
  el.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      startDist = dist(e.touches)
      try { startZoom = track()?.getSettings()?.zoom || 1 } catch { startZoom = 1 }
    }
  })
  el.addEventListener('touchmove', e => {
    if (e.touches.length !== 2 || !startDist) return
    e.preventDefault()
    try {
      const t = track()
      const caps = t?.getCapabilities?.()
      if (!caps?.zoom) return
      const z = Math.max(caps.zoom.min, Math.min(caps.zoom.max, startZoom * (dist(e.touches) / startDist)))
      t.applyConstraints({ advanced: [{ zoom: z }] })
    } catch {}
  }, { passive: false })
  el.addEventListener('touchend', () => { startDist = 0 })
})()

function playShutter() {
  if (!camSettings.sound) return
  const ctx = new AudioContext()
  const buf = ctx.createBuffer(1, 2000, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < 2000; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 200)
  const src = ctx.createBufferSource()
  src.buffer = buf; src.connect(ctx.destination); src.start()
  setTimeout(() => ctx.close(), 500)
}

function toggleFlashMode() {
  flashMode = (flashMode + 1) % 3
  const btn = $('flashBtn')
  btn.style.opacity = flashMode === 2 ? '0.3' : '1'
  btn.querySelector('svg').setAttribute('stroke', flashMode === 1 ? '#f59e0b' : 'white')
  if (flashMode === 1) torchOn(); else torchOff()
}

async function torchOn() {
  if (flashMode === 2 || !stream) return
  try {
    const t = track()
    if (t?.getCapabilities?.()?.torch) await t.applyConstraints({ advanced: [{ torch: true }] })
  } catch {}
}

async function torchOff() {
  try { await track()?.applyConstraints({ advanced: [{ torch: false }] }) } catch {}
}

function setMode(el, mode) {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.replace('text-cam-accent', 'text-white/50'))
  el.classList.replace('text-white/50', 'text-cam-accent')

  $('modeOverlay').innerHTML = ''
  $('proControls').classList.add('hidden')
  resetCameraAuto()

  if (mode === 'pro') {
    $('proControls').classList.remove('hidden')
    $('modeOverlay').innerHTML = '<span class="bg-black/50 px-2.5 py-1 rounded-lg text-xs font-semibold text-cam-accent">PRO</span>'
    initProControls()
  } else if (mode === 'night') {
    $('modeOverlay').innerHTML = '<span class="flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-full text-xs text-cam-accent"><svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>Ночь</span>'
    applyNightMode()
  }
}

function resetCameraAuto() {
  try { track()?.applyConstraints({ advanced: [{ exposureMode: 'continuous', focusMode: 'continuous', whiteBalanceMode: 'continuous' }] }) } catch {}
}

function initProControls() {
  const t = track()
  const caps = t?.getCapabilities?.()
  const sets = t?.getSettings?.()
  if (!caps) return
  if (caps.exposureCompensation) {
    $('proEV').min = caps.exposureCompensation.min * 10
    $('proEV').max = caps.exposureCompensation.max * 10
    $('proEV').value = (sets.exposureCompensation || 0) * 10
    $('proEVVal').textContent = (sets.exposureCompensation || 0).toFixed(1)
  }
  if (caps.iso) {
    $('proISO').min = caps.iso.min
    $('proISO').max = caps.iso.max
    $('proISO').value = sets.iso || caps.iso.min
    $('proISOVal').textContent = sets.iso || caps.iso.min
  }
  if (caps.colorTemperature) {
    $('proWB').min = caps.colorTemperature.min
    $('proWB').max = caps.colorTemperature.max
    $('proWB').value = sets.colorTemperature || 5000
    $('proWBVal').textContent = (sets.colorTemperature || 5000) + 'K'
  }
  $('proMF').value = 0
  $('proMFVal').textContent = 'AF'
}

function setProEV(v) {
  const ev = v / 10
  $('proEVVal').textContent = ev.toFixed(1)
  try { track()?.applyConstraints({ advanced: [{ exposureCompensation: ev }] }) } catch {}
}

function setProISO(v) {
  $('proISOVal').textContent = v
  try { track()?.applyConstraints({ advanced: [{ exposureMode: 'manual', iso: v }] }) } catch {}
}

function setProWB(v) {
  $('proWBVal').textContent = v + 'K'
  try { track()?.applyConstraints({ advanced: [{ whiteBalanceMode: 'manual', colorTemperature: v }] }) } catch {}
}

function setProMF(v) {
  const t = track()
  const caps = t?.getCapabilities?.()
  if (!caps?.focusDistance) return
  if (v === 0) {
    $('proMFVal').textContent = 'AF'
    try { t.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }) } catch {}
  } else {
    const d = caps.focusDistance.min + (caps.focusDistance.max - caps.focusDistance.min) * (v / 100)
    $('proMFVal').textContent = d.toFixed(1) + 'm'
    try { t.applyConstraints({ advanced: [{ focusMode: 'manual', focusDistance: d }] }) } catch {}
  }
}

function applyNightMode() {
  const t = track()
  const caps = t?.getCapabilities?.()
  if (!caps) return
  const adv = { exposureMode: 'manual' }
  if (caps.exposureTime) adv.exposureTime = Math.min(caps.exposureTime.max, 100000)
  if (caps.iso) adv.iso = Math.min(caps.iso.max, 800)
  try { t.applyConstraints({ advanced: [adv] }) } catch {}
}

function showProcessing(active) {
  processingCount = active ? processingCount + 1 : Math.max(0, processingCount - 1)
  const el = $('procBadge')
  el.classList.toggle('hidden', processingCount === 0)
  el.classList.toggle('flex', processingCount > 0)
  $('procBadgeText').textContent = processingCount > 1 ? 'Обработка (' + processingCount + ')...' : 'Обработка...'
}

function showSaveOverlay(show) {
  $('saveOverlay').classList.toggle('hidden', !show)
  $('saveOverlay').classList.toggle('flex', show)
}

function updateThumb(dataUrl) {
  $('galleryThumb').innerHTML = '<img src="' + escAttr(dataUrl) + '" class="w-full h-full object-cover">'
}

async function shoot() {
  const btn = $('shutter')
  if (btn.dataset.busy) return
  btn.dataset.busy = '1'
  $('shutterInner').classList.add('scale-85')
  setTimeout(() => $('shutterInner').classList.remove('scale-85'), 150)

  playShutter()
  if (flashMode === 0) await torchOn()
  $('flash').animate([{ opacity: .9 }, { opacity: 0 }], 250)

  const v = $('video'), c = $('canvas')
  let w = v.videoWidth, h = v.videoHeight
  const max = 1920
  if (w > max || h > max) {
    const r = Math.min(max / w, max / h)
    w = Math.round(w * r); h = Math.round(h * r)
  }
  c.width = w; c.height = h
  c.getContext('2d').drawImage(v, 0, 0, w, h)
  const dataUrl = c.toDataURL('image/jpeg', 0.85)

  if (flashMode === 0) torchOff()

  const aiActive = !!(appSettings.apiKey && appSettings.prompt)
  log('shoot: aiActive=', aiActive, 'originals=', camSettings.originals, 'size=', w + 'x' + h)

  showSaveOverlay(true)
  try {
    if (!aiActive || camSettings.originals) await saveToGallery(dataUrl)
    updateThumb(dataUrl)
    showSaveOverlay(false)
    if (aiActive) {
      showProcessing(true)
      processAI(dataUrl).finally(() => showProcessing(false))
    }
  } catch (e) {
    log('shoot error:', e)
    showSaveOverlay(false)
    notify('Не удалось сохранить: ' + (e?.message || e))
  }
  btn.dataset.busy = ''
}

async function processAI(dataUrl) {
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + appSettings.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODELS[appSettings.model] || MODELS.nanabanana1,
        messages: [{ role: 'user', content: [
          { type: 'text', text: appSettings.prompt + '\nKeep the original photo composition and scene. Apply the effect naturally as if it was captured by the camera. Return only the image.' },
          { type: 'image_url', image_url: { url: dataUrl } }
        ]}],
        max_tokens: 4096,
        modalities: ['image']
      })
    })
    const data = await r.json()
    const img = data.choices?.[0]?.message?.images?.[0]?.image_url?.url
    if (img) {
      await saveToGallery(img)
      updateThumb(img)
    } else if (!camSettings.originals) {
      await saveToGallery(dataUrl)
    }
  } catch (e) {
    log('AI error:', e)
    notify('AI: ' + (e?.message || e))
    if (!camSettings.originals) {
      try { await saveToGallery(dataUrl) } catch {}
    }
  }
}
