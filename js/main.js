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
function startCollage() {
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
  let photoIndex = 0;  // Gunakan nama yang lebih jelas

  function takeNext() {
    // ✅ SAFETY CHECK: Berhenti jika sudah cukup atau dibatalkan
    if (photoIndex >= totalPhotos || !isProcessing) {
      buildCollage(photos, layout);
      isProcessing = false;
      updateButtons(false);
      playSound('success');
      statusText.textContent = `✅ Kolase ${totalPhotos} foto selesai! 🎞️`;
      return;
    }

    startCountdown(timerValue, () => {
      // ✅ Double-check: Jangan lanjut jika sudah dibatalkan
      if (!isProcessing) return;
      
      playSound('shutter');
      flashEl.classList.remove('active');
      void flashEl.offsetWidth;
      flashEl.classList.add('active');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      
      if (currentBackgroundColor !== 'transparent') {
        ctx.fillStyle = currentBackgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Mirror hanya untuk video
      ctx.save();
      if (isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      const filter = filterSelect.value;
      ctx.filter = filter === 'none' ? 'none' : filter;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Sticker & Frame (tidak ikut mirror)
      ctx.filter = 'none';
      stickers.forEach(sticker => {
        ctx.font = `${sticker.size}px Arial`;
        ctx.fillText(sticker.emoji, sticker.x, sticker.y);
      });
      
      if (currentFrame) {
        ctx.drawImage(currentFrame, 0, 0, canvas.width, canvas.height);
      }
      
      photos.push(canvas.toDataURL('image/png'));
      photoIndex++;  // Increment SETELAH foto diambil

      const progress = (photoIndex / totalPhotos) * 100;
      progressBar.style.width = progress + '%';
      statusText.textContent = `📸 Foto ${photoIndex}/${totalPhotos} selesai!`;

      // ✅ Hanya lanjut jika belum mencapai batas
      if (photoIndex < totalPhotos && isProcessing) {
        setTimeout(takeNext, 800);
      } else {
        // ✅ Langsung build collage jika sudah selesai
        buildCollage(photos, layout);
        isProcessing = false;
        updateButtons(false);
        playSound('success');
        statusText.textContent = `✅ Kolase ${totalPhotos} foto selesai! 🎞️`;
      }
    });
  }
  takeNext();  // Start the loop
}

function getPhotoCountForLayout(layout) {
  const counts = { '1': 1, '2': 2, '4': 4, '2x2': 4, '2x3': 6, '3x2': 6 };
  return counts[layout] || 6;
}

function buildCollage(photos, layout) {
  const configs = {
    '1': { cols: 1, rows: 1, w: 600, h: 600, photoW: 540, photoH: 540 },
    '2': { cols: 1, rows: 2, w: 400, h: 800, photoW: 340, photoH: 340 },
    '4': { cols: 1, rows: 4, w: 400, h: 1200, photoW: 340, photoH: 240 },
    '2x2': { cols: 2, rows: 2, w: 600, h: 600, photoW: 270, photoH: 270 },
    '2x3': { cols: 2, rows: 3, w: 600, h: 900, photoW: 270, photoH: 240 },
    '3x2': { cols: 3, rows: 2, w: 900, h: 600, photoW: 270, photoH: 240 }
  };

  const config = configs[layout] || configs['2x3'];
  const { cols, rows, w, h, photoW, photoH } = config;
  const gap = 20;
  const padding = 30;

  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const cx = c.getContext('2d');

  // Background - putih atau sesuai pilihan
  cx.fillStyle = currentBackgroundColor === 'transparent' ? '#ffffff' : currentBackgroundColor;
  cx.fillRect(0, 0, c.width, c.height);

  // Border luar
  cx.strokeStyle = '#d4a843';
  cx.lineWidth = 3;
  cx.strokeRect(2, 2, c.width - 4, c.height - 4);

  // Hitung posisi awal untuk centering
  const totalWidth = cols * photoW + (cols - 1) * gap;
  const totalHeight = rows * photoH + (rows - 1) * gap;
  const startX = (w - totalWidth) / 2;
  const startY = (h - totalHeight) / 2;

  // Draw photos ke dalam grid
  let photoIdx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (photoIdx >= photos.length) break;

      const img = new Image();
      img.src = photos[photoIdx];
      
      img.onload = () => {
        const x = startX + col * (photoW + gap);
        const y = startY + row * (photoH + gap);

        // Border putih untuk setiap foto
        cx.fillStyle = '#ffffff';
        cx.fillRect(x - 3, y - 3, photoW + 6, photoH + 6);
        cx.strokeStyle = '#d4a843';
        cx.lineWidth = 1;
        cx.strokeRect(x - 3, y - 3, photoW + 6, photoH + 6);

        // Draw foto dengan object-fit: cover
        const scale = Math.max(photoW / img.width, photoH / img.height);
        const newW = img.width * scale;
        const newH = img.height * scale;
        const offsetX = (photoW - newW) / 2;
        const offsetY = (photoH - newH) / 2;
        
        cx.drawImage(img, x + offsetX, y + offsetY, newW, newH);

        // Setelah semua foto selesai digambar
        photoIdx++;
        if (photoIdx >= photos.length) {
          // Tambahkan header/footer jika perlu
          const dataUrl = c.toDataURL('image/png', 0.9);
          addPhotoToGallery(dataUrl, true);
          progressBar.style.width = '0%';
        }
      };
    }
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