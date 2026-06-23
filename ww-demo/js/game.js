function calculateResult(guessLat, guessLng, guessYear, elapsedSeconds) {
  const event = appState.currentEvent;
  const subCategory = appState.currentSubCategory;
  
  const correctLat = event.location_lat;
  const correctLng = event.location_lng;
  const correctLat2 = event.location_lat2;
  const correctLng2 = event.location_lng2;
  const locationOnly = event.location_only === true;
  
  const startTs = event.start_ts;
  const endTs = event.end_ts;
  const startPrecision = event.start_precision || 0;
  const endPrecision = event.end_precision || 0;
  
  const correctYear = startTs ? Math.floor(startTs / 10000) : null;
  
  let distanceKm = null;
  let preciseLocation = false;
  
  if (guessLat != null && guessLng != null && correctLat != null && correctLng != null) {
    distanceKm = haversineDistance(guessLat, guessLng, correctLat, correctLng);
    
    if (correctLat2 != null && correctLng2 != null) {
      const dist1 = haversineDistance(guessLat, guessLng, correctLat, correctLng);
      const dist2 = haversineDistance(guessLat, guessLng, correctLat2, correctLng2);
      distanceKm = Math.min(dist1, dist2);
    }
    
    if (distanceKm <= 50) {
      preciseLocation = true;
    }
  }
  
  let timeDiffYears = null;
  let preciseTime = false;
  
  if (!locationOnly && guessYear != null && correctYear != null) {
    timeDiffYears = guessYear - correctYear;
    if (timeDiffYears === 0) {
      preciseTime = true;
    }
  }
  
  const startDisplay = formatTimestamp(startTs, startPrecision);
  const endDisplay = formatTimestamp(endTs, endPrecision);
  
  return {
    correct_title: event.title,
    correct_description: event.description,
    correct_tips: event.tips,
    correct_video_url: event.video_url,
    correct_audio_url: event.audio_url,
    correct_start_display: startDisplay,
    correct_end_display: endDisplay,
    correct_location_name: event.location_name,
    correct_lat: correctLat,
    correct_lng: correctLng,
    location_only: locationOnly,
    distance_km: distanceKm,
    distance_unit: 'km',
    time_diff_years: timeDiffYears,
    precise_location: preciseLocation,
    precise_time: preciseTime,
    guess_lat: guessLat,
    guess_lng: guessLng,
    guess_year: guessYear,
    elapsed_seconds: elapsedSeconds,
    new_achievements: []
  };
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatTimestamp(ts, precision) {
  if (ts == null) return '-';
  
  const year = Math.floor(ts / 10000);
  const month = Math.floor((ts % 10000) / 100);
  const day = ts % 100;
  
  if (precision === 0) {
    return year < 0 ? `${Math.abs(year)} BC` : `${year} AD`;
  } else if (precision === 1) {
    return `${year}-${String(month).padStart(2, '0')}`;
  } else {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
}
