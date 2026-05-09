// ===== GLOBAL VARIABLES =====
let stream = null;
let isMirrored = false;
let isProcessing = false;
let photoCount = 0;
let currentBackgroundColor = 'transparent';
let stickers = [];
let stickerIdCounter = 0;
let currentFrame = null;
let frameImage = null;
let soundEnabled = true;
let audioCtx = null;

// Review variables
let reviewTimeout = null;
let reviewCountdownInterval = null;
let currentReviewPhoto = null;
let currentPhotoIndex = 0;
let collagePhotos = [];
let isReviewing = false;

// Slide & Timer variables
let currentSlide = 1;
let slideCountdowns = { 1: null, 2: null, 3: null };
const SLIDE_DURATIONS = { 1: 7 * 60, 2: 7 * 60, 3: 3 * 60 };

// Edit slide state
let previewImageData = null;
let previewStickers = [];
let previewFilter = 'none';
let previewIsMirrored = false;

// ===== DOM ELEMENTS (dengan safe check) =====
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas?.getContext('2d');

// Elements that might not exist in all slides
const gallery = document.getElementById('gallery');
const emptyGallery = document.getElementById('emptyGallery');
const countdownEl = document.getElementById('countdown');
const countdownNumber = document.getElementById('countdownNumber');
const flashEl = document.getElementById('flash');
const progressBar = document.getElementById('progressBar');
const errorMsg = document.getElementById('errorMsg');
const statusText = document.getElementById('statusText');
const galleryCount = document.getElementById('galleryCount');
const filterSelect = document.getElementById('filterSelect');
const timerSelect = document.getElementById('timer');
const layoutSelect = document.getElementById('layoutSelect');

// ===== MUSIC CONTROL =====
const bgMusic = document.getElementById('bgMusic');
const sfxShutter = document.getElementById('sfxShutter');
const musicBtn = document.getElementById('musicBtn');
let isMusicPlaying = false;

if (bgMusic) {
  bgMusic.volume = 0.3;
}

if (musicBtn && bgMusic) {
  musicBtn.addEventListener('click', async () => {
    initAudio();
    try {
      if (isMusicPlaying) {
        bgMusic.pause();
        isMusicPlaying = false;
        musicBtn.textContent = '🔇 Musik: OFF';
        musicBtn.classList.remove('btn-primary');
        if (statusText) statusText.textContent = '🔇 Musik dimatikan';
      } else {
        await bgMusic.play();
        isMusicPlaying = true;
        musicBtn.textContent = '🎵 Musik: ON';
        musicBtn.classList.add('btn-primary');
        if (statusText) statusText.textContent = '🎵 Musik latar dinyalakan';
      }
    } catch (err) {
      console.error('Music error:', err);
      isMusicPlaying = false;
      musicBtn.textContent = '🔇 Musik: OFF';
      musicBtn.classList.remove('btn-primary');
    }
  });
  
  bgMusic.addEventListener('ended', () => {
    isMusicPlaying = false;
    musicBtn.textContent = '🔇 Musik: OFF';
    musicBtn.classList.remove('btn-primary');
  });
  
  bgMusic.addEventListener('pause', () => {
    if (isMusicPlaying) {
      isMusicPlaying = false;
      musicBtn.textContent = '🔇 Musik: OFF';
      musicBtn.classList.remove('btn-primary');
    }
  });
}

// ===== FRAME HANDLING =====
const frameUpload = document.getElementById('frameUpload');
const framePreview = document.getElementById('framePreview');
const framePreviewImg = document.getElementById('framePreviewImg');
const removeFrameBtn = document.getElementById('removeFrameBtn');

if (frameUpload) {
  frameUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      frameImage = new Image();
      frameImage.onload = () => {
        currentFrame = frameImage;
        if (framePreviewImg) framePreviewImg.src = event.target.result;
        if (framePreview) framePreview.style.display = 'block';
        if (statusText) statusText.textContent = '✅ Frame berhasil diupload! Siap dipakai 🎨';
        playSound('success');
      };
      frameImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

if (removeFrameBtn) {
  removeFrameBtn.addEventListener('click', () => {
    currentFrame = null;
    frameImage = null;
    if (framePreview) framePreview.style.display = 'none';
    if (framePreviewImg) framePreviewImg.src = '';
    if (frameUpload) frameUpload.value = '';
    if (statusText) statusText.textContent = '🗑️ Frame dihapus';
    playSound('click');
  });
}

// ===== AUDIO SYSTEM =====
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

const sounds = {
  shutter: () => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.1);
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2); gain2.connect(audioCtx.destination);
      osc2.frequency.value = 600;
      gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc2.start(audioCtx.currentTime); osc2.stop(audioCtx.currentTime + 0.15);
    }, 100);
  },
  beep: () => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.1);
  },
  success: () => {
    if (!audioCtx) return;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      setTimeout(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.2);
      }, i * 100);
    });
  },
  click: () => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.value = 400;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.05);
  }
};

function playSound(soundName) {
  if (soundEnabled && sounds[soundName]) sounds[soundName]();
}

function playShutterSound() {
  if (sfxShutter && soundEnabled) {
    sfxShutter.currentTime = 0;
    sfxShutter.play().catch(() => playSound('shutter'));
  } else {
    playSound('shutter');
  }
}

// ===== CAMERA =====
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false
    });
    if (video) {
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        if (errorMsg) errorMsg.style.display = 'none';
        if (statusText) statusText.textContent = '✅ Kamera aktif! Siap jepret ✨';
      };
    }
  } catch (err) {
    if (errorMsg) {
      errorMsg.textContent = '❌ Gagal mengakses kamera: ' + err.message;
      errorMsg.style.display = 'block';
    }
    if (statusText) statusText.textContent = 'Izinkan akses kamera untuk melanjutkan';
  }
}

// ===== CAPTURE FUNCTIONS =====
function capturePhoto() {
  if (isProcessing || !video) return;
  if (!stream) { startCamera(); return; }
  if (video.readyState !== 4) {
    if (statusText) statusText.textContent = '⏳ Kamera belum siap, tunggu sebentar...';
    return;
  }
  isProcessing = true;
  updateButtons(true);

  const timerValue = parseInt(timerSelect?.value) || 0;
  if (timerValue > 0) {
    startCountdown(timerValue, () => {
      takeSnapshot();
      isProcessing = false;
      updateButtons(false);
    });
  } else {
    takeSnapshot();
    isProcessing = false;
    updateButtons(false);
  }
}

function takeSnapshot() {
  if (!canvas || !ctx || !video) return;
  playSound('shutter');
  if (flashEl) { flashEl.classList.remove('active'); void flashEl.offsetWidth; flashEl.classList.add('active'); }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset total
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (currentBackgroundColor !== 'transparent') {
    ctx.fillStyle = currentBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // ✅ TERAPKAN MIRROR SAAT CAPTURE
  ctx.save();
  if (isMirrored) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  const filter = filterSelect?.value || 'none';
  ctx.filter = filter === 'none' ? 'none' : filter;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore(); // Kembalikan ke normal untuk elemen selanjutnya

  // Sticker & Frame (tidak ikut mirror)
  ctx.filter = 'none';
  stickers.forEach(s => { ctx.font = `${s.size}px Arial`; ctx.fillText(s.emoji, s.x, s.y); });
  if (currentFrame) ctx.drawImage(currentFrame, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL('image/png');
  window.lastCapturedPhoto = dataUrl; // Simpan foto (sudah include mirror state)
  if (gallery) addPhotoToGallery(dataUrl, false);
  playSound('success');
  if (statusText) statusText.textContent = '✅ Foto berhasil diambil! 📸';
}

// ===== COLLAGE FUNCTIONS =====
async function startCollage() {
  if (isProcessing || !video) return;
  if (!stream) { startCamera(); return; }
  if (video.readyState !== 4) {
    if (statusText) statusText.textContent = '⏳ Kamera belum siap...';
    return;
  }

  isProcessing = true;
  updateButtons(true);
  collagePhotos = [];
  currentPhotoIndex = 0;

  const layout = layoutSelect?.value || '2x3';
  const timerValue = parseInt(timerSelect?.value) || 3;
  const totalPhotos = getPhotoCountForLayout(layout);

  try {
    await takeCollagePhoto(timerValue, totalPhotos);
  } catch (err) {
    console.error('Collage error:', err);
    if (statusText) statusText.textContent = '❌ Error saat kolase';
    isProcessing = false;
    updateButtons(false);
    if (progressBar) progressBar.style.width = '0%';
  }
}

async function takeCollagePhoto(timerValue, totalPhotos) {
  if (!isProcessing || isReviewing || !video) return;
  if (timerValue > 0) await new Promise(resolve => startCountdown(timerValue, resolve));

  playSound('shutter');
  if (flashEl) { flashEl.classList.remove('active'); void flashEl.offsetWidth; flashEl.classList.add('active'); }

  const c = document.createElement('canvas');
  c.width = video.videoWidth; c.height = video.videoHeight;
  const cctx = c.getContext('2d');
  cctx.setTransform(1, 0, 0, 1, 0, 0);

  if (currentBackgroundColor !== 'transparent') {
    cctx.fillStyle = currentBackgroundColor;
    cctx.fillRect(0, 0, c.width, c.height);
  }
    cctx.save();
  if (isMirrored) {
    cctx.translate(c.width, 0);
    cctx.scale(-1, 1);
  }
  const filter = filterSelect?.value || 'none';
  cctx.filter = filter === 'none' ? 'none' : filter;
  cctx.drawImage(video, 0, 0, c.width, c.height);
  cctx.restore();

  cctx.filter = 'none';
  stickers.forEach(s => { cctx.font = `${s.size}px Arial`; cctx.fillText(s.emoji, s.x, s.y); });
  if (currentFrame) cctx.drawImage(currentFrame, 0, 0, c.width, c.height);

  const dataUrl = c.toDataURL('image/png');
  currentReviewPhoto = dataUrl;
  window.lastCapturedPhoto = dataUrl;
  isReviewing = true;
  showReviewOverlay(dataUrl, totalPhotos);
}

function showReviewOverlay(photoDataUrl, totalPhotos) {
  const overlay = document.getElementById('reviewOverlay');
  const reviewImg = document.getElementById('reviewImage');
  const countdownSec = document.getElementById('countdownSec');
  const timerBar = document.getElementById('timerBar');

  if (!overlay || !reviewImg) return;

  reviewImg.src = photoDataUrl;
  overlay.style.display = 'flex';
  
  if (timerBar) {
    timerBar.style.animation = 'none';
    void timerBar.offsetWidth;
    timerBar.style.animation = 'shrinkBar 10s linear';
  }

  let seconds = 10;
  if (countdownSec) countdownSec.textContent = seconds;
  
  if (reviewCountdownInterval) clearInterval(reviewCountdownInterval);
  reviewCountdownInterval = setInterval(() => {
    seconds--;
    if (countdownSec) countdownSec.textContent = seconds;
    if (seconds <= 0) clearInterval(reviewCountdownInterval);
  }, 1000);

  if (reviewTimeout) clearTimeout(reviewTimeout);
  reviewTimeout = setTimeout(() => continuePhoto(), 10000);
}

function retakePhoto() {
  if (reviewTimeout) clearTimeout(reviewTimeout);
  if (reviewCountdownInterval) clearInterval(reviewCountdownInterval);
  
  const overlay = document.getElementById('reviewOverlay');
  if (overlay) overlay.style.display = 'none';
  isReviewing = false;
  
  if (statusText) statusText.textContent = '📸 Retake foto...';
  
  setTimeout(() => {
    const timerValue = parseInt(timerSelect?.value) || 0;
    const layout = layoutSelect?.value || '2x3';
    const totalPhotos = getPhotoCountForLayout(layout);
    takeCollagePhoto(timerValue, totalPhotos);
  }, 500);
}

function continuePhoto() {
  if (reviewTimeout) clearTimeout(reviewTimeout);
  if (reviewCountdownInterval) clearInterval(reviewCountdownInterval);
  
  const overlay = document.getElementById('reviewOverlay');
  if (overlay) overlay.style.display = 'none';
  
  if (currentReviewPhoto) collagePhotos.push(currentReviewPhoto);
  isReviewing = false;
  
  currentPhotoIndex++;
  const layout = layoutSelect?.value || '2x3';
  const totalPhotos = getPhotoCountForLayout(layout);
  
  const progress = (currentPhotoIndex / totalPhotos) * 100;
  if (progressBar) progressBar.style.width = progress + '%';
  if (statusText) statusText.textContent = `📸 Foto ${currentPhotoIndex}/${totalPhotos} disimpan!`;

  if (currentPhotoIndex >= totalPhotos) {
    setTimeout(() => {
      buildCollage(collagePhotos, layout);
      playSound('success');
      if (statusText) statusText.textContent = `✅ Kolase ${totalPhotos} foto selesai! 🎞️`;
      isProcessing = false;
      updateButtons(false);
      if (progressBar) progressBar.style.width = '0%';
    }, 500);
  } else {
    setTimeout(() => {
      const timerValue = parseInt(timerSelect?.value) || 3;
      takeCollagePhoto(timerValue, totalPhotos);
    }, 500);
  }
}

function getPhotoCountForLayout(layout) {
  const counts = { '1': 1, '2': 2, '4': 4, '2x2': 4, '2x3': 6, '3x2': 6 };
  return counts[layout] || 6;
}

function buildCollage(photos, layout) {
  if (!photos || photos.length === 0) return;
  
  const configs = {
    '1': { cols: 1, rows: 1 }, '2': { cols: 1, rows: 2 }, '4': { cols: 1, rows: 4 },
    '2x2': { cols: 2, rows: 2 }, '2x3': { cols: 2, rows: 3 }, '3x2': { cols: 3, rows: 2 }
  };

  const config = configs[layout] || configs['2x3'];
  const { cols, rows } = config;
  
  const gap = 10, padding = 20, headerHeight = 60;

  const tempImg = new Image();
  tempImg.src = photos[0];
  
  tempImg.onload = () => {
    const photoW = tempImg.width, photoH = tempImg.height;
    const totalGridWidth = cols * photoW + (cols - 1) * gap;
    const totalGridHeight = rows * photoH + (rows - 1) * gap;
    const canvasW = totalGridWidth + (padding * 2);
    const canvasH = totalGridHeight + (padding * 2) + headerHeight;

    const c = document.createElement('canvas');
    c.width = canvasW; c.height = canvasH;
    const cx = c.getContext('2d');

    cx.fillStyle = currentBackgroundColor === 'transparent' ? '#ffffff' : currentBackgroundColor;
    cx.fillRect(0, 0, canvasW, canvasH);

    cx.strokeStyle = '#d4a843'; cx.lineWidth = 4;
    cx.strokeRect(4, 4, canvasW - 8, canvasH - 8);

    cx.fillStyle = '#d4a843'; cx.font = 'bold 24px Pacifico, cursive'; cx.textAlign = 'center';
    cx.fillText('Kima Photo Booth', canvasW / 2, 35);
    
    const now = new Date();
    cx.fillStyle = '#a0334d'; cx.font = '14px Poppins, sans-serif';
    cx.fillText(`${now.toLocaleDateString('id-ID')} • ${now.toLocaleTimeString('id-ID')}`, canvasW / 2, 55);

    let loadedCount = 0;
    const totalToLoad = Math.min(photos.length, cols * rows);

    for (let idx = 0; idx < totalToLoad; idx++) {
      const img = new Image();
      img.src = photos[idx];
      
      img.onload = () => {
        const col = idx % cols, row = Math.floor(idx / cols);
        const x = padding + col * (photoW + gap);
        const y = padding + headerHeight + row * (photoH + gap);

        // Border putih
        cx.fillStyle = '#ffffff';
        cx.fillRect(x - 2, y - 2, photoW + 4, photoH + 4);
        
        // Gambar foto (tidak ada transform)
        cx.save();
        cx.setTransform(1, 0, 0, 1, 0, 0);
        cx.drawImage(img, x, y, photoW, photoH);
        cx.restore();

        loadedCount++;
        if (loadedCount >= totalToLoad && gallery) {
          const dataUrl = c.toDataURL('image/png', 0.95);
          addPhotoToGallery(dataUrl, true);
        }
      };

      img.onerror = () => {
        loadedCount++;
        if (loadedCount >= totalToLoad && gallery) {
          const dataUrl = c.toDataURL('image/png', 0.95);
          addPhotoToGallery(dataUrl, true);
        }
      };
    }
  };
  
  tempImg.onerror = () => {
    console.error('Gagal load foto untuk kolase');
    if (statusText) statusText.textContent = '❌ Error: Foto tidak bisa diproses';
    isProcessing = false;
    updateButtons(false);
  };
}

// ===== COUNTDOWN =====
function startCountdown(seconds, callback) {
  if (!countdownEl || !countdownNumber) { callback(); return; }
  
  countdownEl.style.display = 'flex';
  let count = seconds;
  countdownNumber.textContent = count;

  const interval = setInterval(() => {
    count--;
    if (count <= 0) {
      clearInterval(interval);
      countdownEl.style.display = 'none';
      callback();
    } else {
      countdownNumber.textContent = count;
      countdownNumber.style.animation = 'none';
      void countdownNumber.offsetWidth;
      countdownNumber.style.animation = 'countPop 0.8s ease-out';
      playSound('beep');
    }
  }, 1000);
}

// ===== GALLERY FUNCTIONS =====
function addPhotoToGallery(dataUrl, isCollage) {
  if (!gallery) return;
  if (emptyGallery) emptyGallery.style.display = 'none';

  const div = document.createElement('div');
  div.className = 'photo-item fade-in' + (isCollage ? ' collage-item' : '');
  const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  div.innerHTML = `
    <img src="${dataUrl}" alt="Foto ${timestamp}">
    <div class="photo-actions">
      <button class="btn btn-primary" onclick="downloadPhoto('${dataUrl}', 'photobooth_${Date.now()}.png')">💾 Unduh</button>
      <button class="btn btn-secondary" onclick="printPhoto('${dataUrl}')">🖨️ Print</button>
      <button class="btn btn-danger" onclick="removePhoto(this)">🗑️</button>
    </div>
  `;

  gallery.insertBefore(div, gallery.firstChild);
  photoCount++;
  if (galleryCount) galleryCount.textContent = photoCount + ' foto';
}

function removePhoto(btn) {
  const item = btn.closest('.photo-item');
  if (!item) return;
  item.style.opacity = '0';
  item.style.transform = 'scale(0.8)';
  setTimeout(() => {
    item.remove();
    photoCount--;
    if (galleryCount) galleryCount.textContent = photoCount + ' foto';
    if (photoCount === 0 && emptyGallery) emptyGallery.style.display = 'block';
  }, 300);
}

function downloadPhoto(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  playSound('click');
}

function printPhoto(dataUrl) {
  const printArea = document.getElementById('printArea');
  if (printArea) {
    printArea.innerHTML = `<img src="${dataUrl}" style="max-width: 100%;">`;
    window.print();
  }
  playSound('click');
}

// ===== STICKERS =====
document.querySelectorAll('.sticker-item').forEach(item => {
  item.addEventListener('click', () => {
    playSound('click');
    addSticker(item.textContent);
  });
});

function addSticker(emoji) {
  if (!canvas) return;
  const sticker = {
    id: stickerIdCounter++, emoji: emoji,
    x: canvas.width / 2, y: canvas.height / 2, size: 80, rotation: 0
  };
  stickers.push(sticker);
  
  const videoSection = document.querySelector('.video-section');
  if (videoSection) {
    const el = document.createElement('div');
    el.className = 'sticker-on-canvas';
    el.textContent = emoji;
    el.style.left = '50%'; el.style.top = '50%';
    el.style.transform = 'translate(-50%, -50%)';
    videoSection.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
  if (statusText) statusText.textContent = `✅ Sticker ${emoji} ditambahkan!`;
}

document.getElementById('clearStickersBtn')?.addEventListener('click', () => {
  stickers = [];
  playSound('click');
  if (statusText) statusText.textContent = '🗑️ Semua sticker dihapus';
});

// ===== BACKGROUND COLOR =====
document.querySelectorAll('.color-option').forEach(opt => {
  opt.addEventListener('click', () => {
    playSound('click');
    document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    currentBackgroundColor = opt.dataset.color;
    if (statusText) statusText.textContent = `🌈 Background diubah${currentBackgroundColor === 'transparent' ? ' ke transparan' : ''}`;
  });
});

// ===== UI HELPERS =====
function updateButtons(disabled) {
  const captureBtn = document.getElementById('captureBtn');
  const collageBtn = document.getElementById('collageBtn');
  if (captureBtn) captureBtn.disabled = disabled;
  if (collageBtn) collageBtn.disabled = disabled;
  if (disabled && statusText) statusText.textContent = '⏳ Sedang memproses...';
}

function applyLiveFilter() {
  if (!filterSelect || !video) return;
  const filter = filterSelect.value;
  video.style.filter = filter === 'none' ? 'none' : filter;
}

// ===== SLIDE NAVIGATION =====
function goToSlide(slideNum) {
  // Stop timer slide sebelumnya
  if (slideCountdowns[currentSlide]) clearInterval(slideCountdowns[currentSlide]);
  
  const currentSlideEl = document.getElementById(`slide${currentSlide}`);
  if (currentSlideEl) currentSlideEl.classList.add('exit-left');
  
  setTimeout(() => {
    document.querySelectorAll('.slide').forEach(s => {
      s.classList.remove('active', 'exit-left', 'enter-right');
    });
    
    const targetSlide = document.getElementById(`slide${slideNum}`);
    if (targetSlide) {
      targetSlide.classList.add('active', 'enter-right');
      currentSlide = slideNum;
      startSlideTimer(slideNum);
      
      if (slideNum === 2) initEditSlide();
      if (slideNum === 3) initExportSlide();
    }
  }, 300);
}

function startSlideTimer(slideNum) {
  const duration = SLIDE_DURATIONS[slideNum];
  let seconds = duration;
  const timerEl = document.getElementById(`timer${slideNum}`);
  
  if (!timerEl) return;
  
  timerEl.textContent = formatTime(seconds);
  timerEl.classList.remove('timer-warning');
  
  if (slideCountdowns[slideNum]) clearInterval(slideCountdowns[slideNum]);
  
  slideCountdowns[slideNum] = setInterval(() => {
    seconds--;
    timerEl.textContent = formatTime(seconds);
    
    if (seconds <= 60) timerEl.classList.add('timer-warning');
    
    if (seconds <= 0) {
      clearInterval(slideCountdowns[slideNum]);
      handleSlideTimeout(slideNum);
    }
  }, 1000);
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function handleSlideTimeout(slideNum) {
  const messages = {
    1: '⏰ Waktu habis! Lanjut ke edit...',
    2: '⏰ Waktu habis! Lanjut ke export...',
    3: '⏰ Waktu habis! Mengunduh & mulai ulang...'
  };
  
  if (statusText) statusText.textContent = messages[slideNum];
  playSound('beep');
  
  setTimeout(() => {
    if (slideNum === 1) goToSlide(2);
    else if (slideNum === 2) goToSlide(3);
    else if (slideNum === 3) {
      if (window.finalImageData) downloadFinal();
      resetToStart();
    }
  }, 2000);
}

function resetToStart() {
  previewImageData = null;
  previewStickers = [];
  previewFilter = 'none';
  previewIsMirrored = false;
  
  const editPreview = document.getElementById('editPreview');
  const finalPreview = document.getElementById('finalPreview');
  
  if (editPreview) editPreview.innerHTML = '<p style="color:var(--gold);">📸 Foto akan muncul di sini setelah dijepret</p>';
  if (finalPreview) finalPreview.innerHTML = '<p style="color:var(--gold);">🎁 Hasil akhir akan muncul di sini</p>';
  
  goToSlide(1);
  currentFrame = null; 
  if(framePreview) framePreview.style.display = 'none';
}

// ===== EDIT SLIDE FUNCTIONS =====
function initEditSlide() {
  if (window.lastCapturedPhoto) {
    previewImageData = window.lastCapturedPhoto;
    updateEditPreview();
  }
  if (filterSelect) filterSelect.value = previewFilter;
  const mirrorBtn = document.getElementById('mirrorBtn');
  if (mirrorBtn) mirrorBtn.textContent = previewIsMirrored ? '🪞 Mirror: ON' : '🪞 Mirror';
}

function updateEditPreview() {
  const previewBox = document.getElementById('editPreview');
  if (!previewBox) return;
  if (!previewImageData) {
    previewBox.innerHTML = '<p style="color:var(--gold);">📸 Foto akan muncul di sini</p>';
    return;
  }

  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');

    // ✅ RESET & GAMBAR NORMAL (tidak double mirror)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    
    ctx.filter = previewFilter === 'none' ? 'none' : previewFilter;
    ctx.drawImage(img, 0, 0); // Foto sudah ter-mirror dari capture, tinggal tampilkan
    ctx.filter = 'none';

    previewStickers.forEach(s => {
      ctx.font = `${s.size}px Arial`;
      ctx.fillText(s.emoji, s.x, s.y);
    });

    if (currentFrame) {
      ctx.drawImage(currentFrame, 0, 0, c.width, c.height);
    }

    previewBox.innerHTML = '';
    previewBox.appendChild(c);
  };
  img.src = previewImageData;
}

function applyPreviewFilter() {
  if (filterSelect) previewFilter = filterSelect.value;
  updateEditPreview();
}

function addStickerToPreview(emoji) {
  const previewBox = document.getElementById('editPreview');
  if (!previewImageData) {
    alert('📸 Jepret foto dulu di halaman 1!');
    return;
  }
  
  previewStickers.push({
    emoji: emoji,
    x: 200 + Math.random() * 200,
    y: 150 + Math.random() * 150,
    size: 50
  });
  updateEditPreview();
}

function clearPreviewStickers() {
  previewStickers = [];
  updateEditPreview();
}

const mirrorBtnEdit = document.getElementById('mirrorBtn');
if (mirrorBtnEdit) {
  mirrorBtnEdit.addEventListener('click', () => {
    previewIsMirrored = !previewIsMirrored;
    mirrorBtnEdit.textContent = previewIsMirrored ? '🪞 Mirror: ON' : '🪞 Mirror';
    updateEditPreview();
  });
}

// ===== EXPORT SLIDE FUNCTIONS =====
function initExportSlide() {
  if (previewImageData) generateFinalImage();
}

function generateFinalImage() {
  if (!previewImageData) return;
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');

    // ✅ RESET & GAMBAR NORMAL
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    
    ctx.filter = previewFilter === 'none' ? 'none' : previewFilter;
    ctx.drawImage(img, 0, 0);
    ctx.filter = 'none';

    previewStickers.forEach(s => {
      ctx.font = `${s.size}px Arial`;
      ctx.fillText(s.emoji, s.x, s.y);
    });

    if (currentFrame) {
      ctx.drawImage(currentFrame, 0, 0, c.width, c.height);
    }

    const finalBox = document.getElementById('finalPreview');
    if (finalBox) { finalBox.innerHTML = ''; finalBox.appendChild(c); }
    window.finalImageData = c.toDataURL('image/png');
  };
  img.src = previewImageData;
}

function downloadFinal() {
  if (!window.finalImageData) {
    const exportStatus = document.getElementById('exportStatus');
    if (exportStatus) exportStatus.textContent = '❌ Tidak ada foto untuk diunduh';
    return;
  }
  
  const a = document.createElement('a');
  a.href = window.finalImageData;
  a.download = `kima-photobooth_${Date.now()}.png`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  
  const exportStatus = document.getElementById('exportStatus');
  if (exportStatus) exportStatus.textContent = '✅ File berhasil diunduh! 🎉';
  playSound('success');
}

function printFinal() {
  if (!window.finalImageData) {
    const exportStatus = document.getElementById('exportStatus');
    if (exportStatus) exportStatus.textContent = '❌ Tidak ada foto untuk diprint';
    return;
  }
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html><head><title>Print - Kima Photo Booth</title>
      <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh}
      img{max-width:90vw;max-height:90vh}@media print{img{max-width:100%;max-height:100%}}</style></head>
      <body><img src="${window.finalImageData}"></body></html>
    `);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  }
  
  const exportStatus = document.getElementById('exportStatus');
  if (exportStatus) exportStatus.textContent = '🖨️ Membuka dialog print...';
}

// ===== FULLSCREEN =====
document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
  playSound('click');
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});

// ===== SOUND TOGGLE =====
document.getElementById('soundToggle')?.addEventListener('click', (e) => {
  initAudio();
  soundEnabled = !soundEnabled;
  e.target.textContent = `🔊 Sound: ${soundEnabled ? 'ON' : 'OFF'}`;
  playSound('click');
});

// ===== PRINT =====
document.getElementById('printBtn')?.addEventListener('click', () => {
  if (photoCount === 0) {
    if (statusText) statusText.textContent = '❌ Tidak ada foto untuk diprint';
    return;
  }
  window.print();
  playSound('click');
});

// ===== EVENT LISTENERS =====
document.getElementById('captureBtn')?.addEventListener('click', capturePhoto);
document.getElementById('collageBtn')?.addEventListener('click', startCollage);

// Mirror button (untuk kamera di Slide 1)
document.getElementById('mirrorBtn')?.addEventListener('click', () => {
  isMirrored = !isMirrored;
  if (video) {
    video.style.transform = isMirrored ? 'scaleX(-1)' : 'scaleX(1)';
  }
  playSound('click');
});

document.getElementById('clearBtn')?.addEventListener('click', () => {
  if (!gallery) return;
  if (photoCount === 0) return;
  if (confirm('Hapus semua foto?')) {
    gallery.innerHTML = `<div class="empty-gallery" id="emptyGallery"><div class="icon">📷</div><p>Belum ada foto. Mulai jepret sekarang!</p></div>`;
    photoCount = 0;
    if (galleryCount) galleryCount.textContent = '0 foto';
    if (statusText) statusText.textContent = '🗑️ Semua foto dihapus';
    playSound('click');
  }
});

if (filterSelect) filterSelect.addEventListener('change', applyLiveFilter);

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !isProcessing && currentSlide === 1) {
    e.preventDefault();
    capturePhoto();
  }
  if (e.code === 'KeyC' && e.ctrlKey && !isProcessing && currentSlide === 1) {
    e.preventDefault();
    startCollage();
  }
});

// ===== INIT & AUTO-PLAY MUSIC =====
window.addEventListener('DOMContentLoaded', async () => {
  initAudio();
  startCamera();
  applyLiveFilter();
  if (statusText) statusText.textContent = '🎉 Selamat datang! Musik & Mirror siap!';
  
  // 🎵 Auto-play music saat web load
  await playBackgroundMusic();
  
  // Fallback: play music on first user interaction
  document.addEventListener('click', playBackgroundMusic, { once: true });
  document.addEventListener('keydown', playBackgroundMusic, { once: true });
});

// Fungsi untuk auto-play background music
async function playBackgroundMusic() {
  if (!bgMusic) return;
  
  try {
    initAudio();
    bgMusic.volume = 0.3;
    bgMusic.loop = true;
    
    if (bgMusic.paused) {
      await bgMusic.play();
      console.log('🎵 Music started');
      
      // Update button text jika ada
      const musicBtn = document.getElementById('musicBtn');
      if (musicBtn) {
        musicBtn.textContent = '🎵 Musik: ON';
        musicBtn.classList.add('btn-primary');
      }
    }
  } catch (err) {
    console.log('⏳ Music waiting for user interaction:', err.message);
  }
}