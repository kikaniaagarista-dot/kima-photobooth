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
    // Initialize audio context
    initAudio();
    
    try {
      if (isMusicPlaying) {
        // PAUSE music
        bgMusic.pause();
        isMusicPlaying = false;
        musicBtn.textContent = '🔇 Musik: OFF';
        musicBtn.classList.remove('btn-primary');
        statusText.textContent = '🔇 Musik dimatikan';
      } else {
        // PLAY music
        await bgMusic.play();
        isMusicPlaying = true;
        musicBtn.textContent = '🎵 Musik: ON';
        musicBtn.classList.add('btn-primary');
        statusText.textContent = '🎵 Musik latar dinyalakan';
      }
    } catch (err) {
      console.error('Music error:', err);
      isMusicPlaying = false;
      musicBtn.textContent = '🔇 Musik: OFF';
      musicBtn.classList.remove('btn-primary');
    }
  });
  
  // Update button state when music ends or errors
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

// ===== DOM ELEMENTS =====
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
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
        framePreviewImg.src = event.target.result;
        framePreview.style.display = 'block';
        statusText.textContent = '✅ Frame berhasil diupload! Siap dipakai 🎨';
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
    framePreview.style.display = 'none';
    framePreviewImg.src = '';
    if (frameUpload) frameUpload.value = '';
    statusText.textContent = '🗑️ Frame dihapus';
    playSound('click');
  });
}

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

// ===== TAB NAVIGATION =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    initAudio();
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.control-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// Fungsi untuk play shutter sound effect
function playShutterSound() {
  if (sfxShutter && soundEnabled) {
    sfxShutter.currentTime = 0;
    sfxShutter.play().catch(() => {
      // Fallback ke oscillator jika file tidak ada
      playSound('shutter');
    });
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
    video.srcObject = stream;
    errorMsg.style.display = 'none';
    statusText.textContent = '✅ Kamera aktif! Siap jepret ✨';
  } catch (err) {
    errorMsg.textContent = '❌ Gagal mengakses kamera: ' + err.message;
    errorMsg.style.display = 'block';
    statusText.textContent = 'Izinkan akses kamera untuk melanjutkan';
  }
}

// ===== CAPTURE FUNCTIONS =====
function capturePhoto() {
  if (isProcessing) return;
  if (!stream) { startCamera(); return; }
  if (video.readyState !== 4) {
    statusText.textContent = '⏳ Kamera belum siap, tunggu sebentar...';
    return;
  }
  isProcessing = true;
  updateButtons(true);

  const timerValue = parseInt(timerSelect.value) || 0;
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
  playSound('shutter');
  
  flashEl.classList.remove('active');
  void flashEl.offsetWidth;
  flashEl.classList.add('active');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // 1. Background
  if (currentBackgroundColor !== 'transparent') {
    ctx.fillStyle = currentBackgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 2. VIDEO SAJA yang di-mirror
  ctx.save(); // Simpan state canvas
  if (isMirrored) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  const filter = filterSelect.value;
  ctx.filter = filter === 'none' ? 'none' : filter;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore(); // Kembalikan ke normal sebelum gambar frame

  // 3. Sticker
  ctx.filter = 'none';
  stickers.forEach(sticker => {
    ctx.font = `${sticker.size}px Arial`;
    ctx.fillText(sticker.emoji, sticker.x, sticker.y);
  });

  // 4. FRAME TETAP NORMAL (tidak ikut mirror)
  if (currentFrame) {
    ctx.drawImage(currentFrame, 0, 0, canvas.width, canvas.height);
  }

  const dataUrl = canvas.toDataURL('image/png');
  addPhotoToGallery(dataUrl, false);
  playSound('success');
  statusText.textContent = '✅ Foto berhasil diambil! 📸';
}


// ===== COLLAGE FUNCTIONS =====
async function startCollage() {
  if (isProcessing) return;
  if (!stream) { startCamera(); return; }
  if (video.readyState !== 4) {
    statusText.textContent = '⏳ Kamera belum siap...';
    return;
  }

  isProcessing = true;
  updateButtons(true);

  const layout = layoutSelect.value;
  const photos = [];
  const timerValue = parseInt(timerSelect.value) || 3;
  const totalPhotos = getPhotoCountForLayout(layout);

  try {
    for (let i = 0; i < totalPhotos; i++) {
      if (!isProcessing) break; // Stop jika dibatalkan

      // Countdown
      if (timerValue > 0) {
        await new Promise((resolve) => {
          startCountdown(timerValue, resolve);
        });
      }

      // Capture foto
      playSound('shutter');
      flashEl.classList.remove('active');
      void flashEl.offsetWidth;
      flashEl.classList.add('active');

      // Buat canvas baru untuk setiap foto
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = video.videoWidth;
      captureCanvas.height = video.videoHeight;
      const cctx = captureCanvas.getContext('2d');

      // Background
      if (currentBackgroundColor !== 'transparent') {
        cctx.fillStyle = currentBackgroundColor;
        cctx.fillRect(0, 0, captureCanvas.width, captureCanvas.height);
      }

      // Mirror hanya untuk video
      cctx.save();
      if (isMirrored) {
        cctx.translate(captureCanvas.width, 0);
        cctx.scale(-1, 1);
      }
      const filter = filterSelect.value;
      cctx.filter = filter === 'none' ? 'none' : filter;
      cctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
      cctx.restore();

      // Sticker
      cctx.filter = 'none';
      stickers.forEach(sticker => {
        cctx.font = `${sticker.size}px Arial`;
        cctx.fillText(sticker.emoji, sticker.x, sticker.y);
      });

      // Frame
      if (currentFrame) {
        cctx.drawImage(currentFrame, 0, 0, captureCanvas.width, captureCanvas.height);
      }

      // Simpan foto
      const dataUrl = captureCanvas.toDataURL('image/png');
      photos.push(dataUrl);

      // Update progress
      const progress = ((i + 1) / totalPhotos) * 100;
      progressBar.style.width = progress + '%';
      statusText.textContent = `📸 Foto ${i + 1}/${totalPhotos} selesai!`;

      // Delay antar foto
      if (i < totalPhotos - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Build collage setelah semua foto terkumpul
    if (photos.length > 0 && isProcessing) {
      buildCollage(photos, layout);
      playSound('success');
      statusText.textContent = `✅ Kolase ${photos.length} foto selesai! 🎞️`;
    }

  } catch (err) {
    console.error('Collage error:', err);
    statusText.textContent = '❌ Error saat kolase';
  } finally {
    isProcessing = false;
    updateButtons(false);
    progressBar.style.width = '0%';
  }

}


function getPhotoCountForLayout(layout) {
  const counts = { '1': 1, '2': 2, '4': 4, '2x2': 4, '2x3': 6, '3x2': 6 };
  return counts[layout] || 6;
}

function buildCollage(photos, layout) {
  const configs = {
    '1': { cols: 1, rows: 1, w: 600, h: 600 },
    '2': { cols: 1, rows: 2, w: 400, h: 850 },
    '4': { cols: 1, rows: 4, w: 400, h: 1200 },
    '2x2': { cols: 2, rows: 2, w: 650, h: 650 },
    '2x3': { cols: 2, rows: 3, w: 650, h: 950 },
    '3x2': { cols: 3, rows: 2, w: 950, h: 650 }
  };

  const config = configs[layout] || configs['2x3'];
  const { cols, rows, w, h } = config;
  const gap = 15;
  const padding = 25;
  
  // Hitung ukuran foto agar pas di grid
  const availableWidth = w - (padding * 2) - (gap * (cols - 1));
  const availableHeight = h - (padding * 2) - (gap * (rows - 1));
  const photoW = availableWidth / cols;
  const photoH = availableHeight / rows;

  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const cx = c.getContext('2d');

  // Background
  cx.fillStyle = currentBackgroundColor === 'transparent' ? '#ffffff' : currentBackgroundColor;
  cx.fillRect(0, 0, c.width, c.height);

  // Border luar
  cx.strokeStyle = '#d4a843';
  cx.lineWidth = 4;
    cx.strokeRect(2, 2, c.width - 4, c.height - 4);
  
  // Draw photos ke dalam grid
  let loadedCount = 0;
  const totalToLoad = Math.min(photos.length, cols * rows);

  for (let idx = 0; idx < totalToLoad; idx++) {
    const img = new Image();
    img.src = photos[idx];
    
    img.onload = () => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = padding + col * (photoW + gap);
      const y = padding + row * (photoH + gap);

      // Border putih
      cx.fillStyle = '#ffffff';
      cx.fillRect(x - 2, y - 2, photoW + 4, photoH + 4);
      cx.strokeStyle = '#d4a843';
      cx.lineWidth = 1;
      cx.strokeRect(x - 2, y - 2, photoW + 4, photoH + 4);

      // Draw foto dengan cover fit
      const scale = Math.max(photoW / img.width, photoH / img.height);
      const newW = img.width * scale;
      const newH = img.height * scale;
      const offsetX = (photoW - newW) / 2;
      const offsetY = (photoH - newH) / 2;
      
      cx.drawImage(img, x + offsetX, y + offsetY, newW, newH);

      loadedCount++;
      // Setelah semua foto selesai
      if (loadedCount >= totalToLoad) {
        const dataUrl = c.toDataURL('image/png', 0.95);
        addPhotoToGallery(dataUrl, true);
      }
    };

    img.onerror = () => {
      loadedCount++;
      if (loadedCount >= totalToLoad) {
        const dataUrl = c.toDataURL('image/png', 0.95);
        addPhotoToGallery(dataUrl, true);
      }
    };
  }
}

// ===== COUNTDOWN =====
function startCountdown(seconds, callback) {
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
  galleryCount.textContent = photoCount + ' foto';
}

function removePhoto(btn) {
  const item = btn.closest('.photo-item');
  item.style.opacity = '0';
  item.style.transform = 'scale(0.8)';
  setTimeout(() => {
    item.remove();
    photoCount--;
    galleryCount.textContent = photoCount + ' foto';
    if (photoCount === 0) {
      emptyGallery.style.display = 'block';
    }
  }, 300);
}

function downloadPhoto(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  playSound('click');
}

function printPhoto(dataUrl) {
  const printArea = document.getElementById('printArea');
  printArea.innerHTML = `<img src="${dataUrl}" style="max-width: 100%;">`;
  window.print();
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
  const sticker = {
    id: stickerIdCounter++,
    emoji: emoji,
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 80,
    rotation: 0
  };
  stickers.push(sticker);
  
  const videoSection = document.querySelector('.video-section');
  const el = document.createElement('div');
  el.className = 'sticker-on-canvas';
  el.textContent = emoji;
  el.style.left = '50%';
  el.style.top = '50%';
  el.style.transform = 'translate(-50%, -50%)';
  videoSection.appendChild(el);

  setTimeout(() => el.remove(), 1000);
  statusText.textContent = `✅ Sticker ${emoji} ditambahkan!`;
}

document.getElementById('clearStickersBtn').addEventListener('click', () => {
  stickers = [];
  playSound('click');
  statusText.textContent = '🗑️ Semua sticker dihapus';
});

// ===== BACKGROUND COLOR =====
document.querySelectorAll('.color-option').forEach(opt => {
  opt.addEventListener('click', () => {
    playSound('click');
    document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    currentBackgroundColor = opt.dataset.color;
    statusText.textContent = `🌈 Background diubah${currentBackgroundColor === 'transparent' ? ' ke transparan' : ''}`;
  });
});

// ===== UI HELPERS =====
function updateButtons(disabled) {
  document.getElementById('captureBtn').disabled = disabled;
  document.getElementById('collageBtn').disabled = disabled;
  if (disabled) {
    statusText.textContent = '⏳ Sedang memproses...';
  }
}

function applyLiveFilter() {
  const filter = filterSelect.value;
  video.style.filter = filter === 'none' ? 'none' : filter;
}

// ===== FULLSCREEN =====
document.getElementById('fullscreenBtn').addEventListener('click', () => {
  playSound('click');
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// ===== SOUND TOGGLE =====
document.getElementById('soundToggle').addEventListener('click', (e) => {
  initAudio();
  soundEnabled = !soundEnabled;
  e.target.textContent = `🔊 Sound: ${soundEnabled ? 'ON' : 'OFF'}`;
  playSound('click');
});

// ===== PRINT =====
document.getElementById('printBtn').addEventListener('click', () => {
  if (photoCount === 0) {
    statusText.textContent = '❌ Tidak ada foto untuk diprint';
    return;
  }
  window.print();
  playSound('click');
});

// ===== EVENT LISTENERS =====
document.getElementById('captureBtn').addEventListener('click', capturePhoto);
document.getElementById('collageBtn').addEventListener('click', startCollage);
document.getElementById('mirrorBtn').addEventListener('click', () => {
  isMirrored = !isMirrored;
  video.style.transform = isMirrored ? 'scaleX(-1)' : 'scaleX(1)';
  playSound('click');
});
document.getElementById('clearBtn').addEventListener('click', () => {
  if (photoCount === 0) return;
  if (confirm('Hapus semua foto?')) {
    gallery.innerHTML = `
      <div class="empty-gallery" id="emptyGallery">
        <div class="icon">📷</div>
        <p>Belum ada foto. Mulai jepret sekarang!</p>
      </div>
    `;
    photoCount = 0;
    galleryCount.textContent = '0 foto';
    statusText.textContent = '🗑️ Semua foto dihapus';
    playSound('click');
  }
});
filterSelect.addEventListener('change', applyLiveFilter);

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !isProcessing) {
    e.preventDefault();
    capturePhoto();
  }
  if (e.code === 'KeyC' && e.ctrlKey) {
    e.preventDefault();
    startCollage();
  }
});

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  initAudio(); // Init audio context on first load
  startCamera();
  applyLiveFilter();
  statusText.textContent = '🎉 Selamat datang! Tekan SPASI untuk jepret';

});