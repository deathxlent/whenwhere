function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)}米`;
  }
  return `${(meters / 1000).toFixed(1)}公里`;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateLocationScore(distance, maxDistance) {
  if (distance <= 500) return 100;
  if (distance >= maxDistance) return 0;
  return Math.round(100 * (1 - distance / maxDistance));
}

function calculateTimeScore(timeDiff, maxTimeDiff) {
  if (timeDiff <= 30) return 100;
  if (timeDiff >= maxTimeDiff) return 0;
  return Math.round(100 * (1 - timeDiff / maxTimeDiff));
}

function calculateTotalScore(locationScore, timeScore, locationWeight, timeWeight) {
  return Math.round((locationScore * locationWeight + timeScore * timeWeight) / (locationWeight + timeWeight));
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}分${remainingSeconds}秒`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}时${remainingMinutes}分`;
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function openImageViewer(src) {
  const overlay = document.createElement('div');
  overlay.className = 'image-viewer';
  overlay.innerHTML = `
    <div class="image-viewer-overlay"></div>
    <img class="image-viewer-img" src="${src}">
    <div class="image-viewer-hint">点击任意处关闭</div>
  `;
  document.body.appendChild(overlay);

  const close = () => {
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 200);
  };

  overlay.addEventListener('click', close);
}

function openVideoPlayer(url) {
  const overlay = document.createElement('div');
  overlay.className = 'video-player-modal';
  overlay.innerHTML = `
    <div class="video-player-overlay"></div>
    <div class="video-player-container">
      <button class="video-player-close">×</button>
      <div class="video-player-content">
        <iframe src="${url}" frameborder="0" allowfullscreen></iframe>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => {
    overlay.remove();
  };

  overlay.querySelector('.video-player-close').addEventListener('click', close);
  overlay.querySelector('.video-player-overlay').addEventListener('click', close);
}
