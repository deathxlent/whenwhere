function expandBoundsByKm(lat1, lng1, lat2, lng2, km) {
  const R = 6371;
  const latDelta = (km / R) * (180 / Math.PI);
  const avgLat = (lat1 + lat2) / 2;
  const lngDelta = (km / (R * Math.cos(avgLat * Math.PI / 180))) * (180 / Math.PI);

  const north = Math.max(lat1, lat2) + latDelta;
  const south = Math.min(lat1, lat2) - latDelta;
  const east = Math.max(lng1, lng2) + lngDelta;
  const west = Math.min(lng1, lng2) - lngDelta;

  return { north, south, east, west };
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function distanceToRectBounds(guessLat, guessLng, lat1, lng1, lat2, lng2) {
  const R = 6371;

  const north = Math.max(lat1, lat2);
  const south = Math.min(lat1, lat2);
  const east = Math.max(lng1, lng2);
  const west = Math.min(lng1, lng2);

  if (guessLat >= south && guessLat <= north && guessLng >= west && guessLng <= east) {
    const distToNorth = haversineDistance(guessLat, guessLng, north, guessLng);
    const distToSouth = haversineDistance(guessLat, guessLng, south, guessLng);
    const distToEast = haversineDistance(guessLat, guessLng, guessLat, east);
    const distToWest = haversineDistance(guessLat, guessLng, guessLat, west);
    return Math.min(distToNorth, distToSouth, distToEast, distToWest);
  }

  let closestLat = guessLat;
  let closestLng = guessLng;

  if (guessLat < south) closestLat = south;
  else if (guessLat > north) closestLat = north;

  if (guessLng < west) closestLng = west;
  else if (guessLng > east) closestLng = east;

  return haversineDistance(guessLat, guessLng, closestLat, closestLng);
}

module.exports = {
  expandBoundsByKm,
  haversineDistance,
  distanceToRectBounds
};
