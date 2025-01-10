// haversine.js
const EARTH_RADIUS = 6371; // Earth's radius in kilometers

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  // Convert all coordinates to float to ensure proper calculation
  const startLat = parseFloat(lat1);
  const startLon = parseFloat(lon1);
  const endLat = parseFloat(lat2);
  const endLon = parseFloat(lon2);

  // Validate coordinates
  if ([startLat, startLon, endLat, endLon].some((coord) => isNaN(coord))) {
    throw new Error("Invalid coordinates provided");
  }

  const dLat = toRad(endLat - startLat);
  const dLon = toRad(endLon - startLon);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(startLat)) *
      Math.cos(toRad(endLat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

export default calculateDistance;
