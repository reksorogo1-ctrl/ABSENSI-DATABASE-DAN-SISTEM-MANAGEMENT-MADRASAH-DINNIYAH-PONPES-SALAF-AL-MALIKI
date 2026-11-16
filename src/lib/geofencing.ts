/**
 * Geofencing & Google Maps Service for Ustadz/Ustadzah Attendance
 */

export const GOOGLE_MAPS_API_KEY =
  (import.meta.env?.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyArSH6pWG3xCC_8kwqR-7oqLTjxpUYSwCU';

export const DEFAULT_GEOFENCE_ZONE = {
  zoneName: 'Kompleks Pondok Pesantren & Madrasah Diniyah',
  latitude: -7.428623,
  longitude: 112.441234,
  radiusMeters: 100,
  maxGpsAccuracy: 50,
};

function parseFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function isValidCoordinatePair(lat: unknown, lng: unknown): boolean {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
  if (typeof lat === 'string' && lat.trim() === '') return false;
  if (typeof lng === 'string' && lng.trim() === '') return false;
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return false;
  if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) return false;
  if (latNum === 0 && lngNum === 0) return false;
  return true;
}

/**
 * Hitung jarak antara 2 koordinat (Latitude/Longitude) menggunakan Formula Haversine dalam satuan meter.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);

  if (!isValidCoordinatePair(nLat1, nLon1) || !isValidCoordinatePair(nLat2, nLon2)) {
    return Infinity;
  }

  const R = 6371000; // Radius bumi rata-rata dalam meter
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(nLat2 - nLat1);
  const dLon = toRad(nLon2 - nLon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(nLat1)) *
      Math.cos(toRad(nLat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const clampedA = Math.max(0, Math.min(1, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(Math.max(0, 1 - clampedA)));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

export interface GeofenceCheckResult {
  isValid: boolean;
  isWithinRadius: boolean;
  isAccuracyValid: boolean;
  hasLocation: boolean;
  needsGpsRetry: boolean;
  distanceMeters: number;
  radiusMeters: number;
  accuracyMeters: number;
  maxAccuracyMeters: number;
  zoneName: string;
  message: string;
  statusText: 'DI DALAM RADIUS' | 'DI LUAR RADIUS' | 'GPS KURANG AKURAT' | 'GPS BELUM TERDETEKSI' | 'GEOFENCING NONAKTIF';
}

/**
 * Validasi posisi ustadz terhadap zona geofencing yang ditentukan Admin di Option Panel
 */
export function validateGeofence(
  userLat: number | null,
  userLng: number | null,
  accuracy: number | null,
  config: {
    enabled?: boolean;
    zoneName?: string;
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
    maxGpsAccuracy?: number;
  }
): GeofenceCheckResult {
  const isEnabled = config.enabled !== false;
  const zoneName = (config.zoneName && String(config.zoneName).trim()) || DEFAULT_GEOFENCE_ZONE.zoneName;

  const rawTargetLat = parseFiniteNumber(config.latitude, DEFAULT_GEOFENCE_ZONE.latitude);
  const rawTargetLng = parseFiniteNumber(config.longitude, DEFAULT_GEOFENCE_ZONE.longitude);
  const targetLat = isValidCoordinatePair(rawTargetLat, rawTargetLng) ? rawTargetLat : DEFAULT_GEOFENCE_ZONE.latitude;
  const targetLng = isValidCoordinatePair(rawTargetLat, rawTargetLng) ? rawTargetLng : DEFAULT_GEOFENCE_ZONE.longitude;

  const parsedRadius = parseFiniteNumber(config.radiusMeters, DEFAULT_GEOFENCE_ZONE.radiusMeters);
  const radius = parsedRadius > 0 ? parsedRadius : DEFAULT_GEOFENCE_ZONE.radiusMeters;

  const parsedMaxAcc = parseFiniteNumber(config.maxGpsAccuracy, DEFAULT_GEOFENCE_ZONE.maxGpsAccuracy);
  const maxAcc = parsedMaxAcc > 0 ? parsedMaxAcc : DEFAULT_GEOFENCE_ZONE.maxGpsAccuracy;

  if (!isEnabled) {
    return {
      isValid: true,
      isWithinRadius: true,
      isAccuracyValid: true,
      hasLocation: isValidCoordinatePair(userLat, userLng),
      needsGpsRetry: false,
      distanceMeters: 0,
      radiusMeters: radius,
      accuracyMeters: accuracy && Number.isFinite(Number(accuracy)) ? Number(accuracy) : 0,
      maxAccuracyMeters: maxAcc,
      zoneName,
      message: 'Geofencing dinonaktifkan oleh Admin (Validasi radius dilewati).',
      statusText: 'GEOFENCING NONAKTIF'
    };
  }

  if (!isValidCoordinatePair(userLat, userLng)) {
    return {
      isValid: false,
      isWithinRadius: false,
      isAccuracyValid: false,
      hasLocation: false,
      needsGpsRetry: true,
      distanceMeters: 0,
      radiusMeters: radius,
      accuracyMeters: 0,
      maxAccuracyMeters: maxAcc,
      zoneName,
      message: 'GPS / Lokasi perangkat belum terdeteksi. Pastikan GPS aktif dan izin lokasi browser diizinkan.',
      statusText: 'GPS BELUM TERDETEKSI'
    };
  }

  const latNum = Number(userLat);
  const lngNum = Number(userLng);
  const distance = calculateDistanceMeters(latNum, lngNum, targetLat, targetLng);

  const hasValidAccuracy = accuracy !== null && accuracy !== undefined && Number.isFinite(Number(accuracy)) && Number(accuracy) > 0;
  const currentAcc = hasValidAccuracy ? Number(accuracy) : 10;
  const isAccValid = currentAcc <= maxAcc;
  const isInside = distance <= radius;
  const isValid = isInside && isAccValid;

  // Apabila akurasi GPS buruk (> maxAcc) dan ketidakpastian GPS masih mungkin menjangkau area madrasah
  // (distance - currentAcc <= radius), JANGAN langsung nyatakan guru berada di luar radius!
  const uncertaintyTouchesZone = (distance - currentAcc) <= radius;

  let message = '';
  let statusText: GeofenceCheckResult['statusText'] = 'DI LUAR RADIUS';
  let needsGpsRetry = false;

  if (!isAccValid && (isInside || uncertaintyTouchesZone)) {
    statusText = 'GPS KURANG AKURAT';
    needsGpsRetry = true;
    message = `Sinyal GPS belum akurat (±${Math.round(currentAcc)}m, batas maksimal ${maxAcc}m). Sistem sedang membaca ulang koordinat GPS agar lebih stabil...`;
  } else if (!isInside) {
    statusText = 'DI LUAR RADIUS';
    needsGpsRetry = uncertaintyTouchesZone;
    message = `Posisi Anda ${distance.toFixed(1)}m dari ${zoneName} (Maksimum radius: ${radius}m). Anda harus berada di lokasi madrasah untuk melakukan absensi.`;
  } else {
    statusText = 'DI DALAM RADIUS';
    needsGpsRetry = false;
    message = `Lokasi Valid! Jarak ${distance.toFixed(1)}m dari ${zoneName} (Radius: ${radius}m, Akurasi GPS: ±${Math.round(currentAcc)}m).`;
  }

  return {
    isValid,
    isWithinRadius: isInside,
    isAccuracyValid: isAccValid,
    hasLocation: true,
    needsGpsRetry,
    distanceMeters: distance,
    radiusMeters: radius,
    accuracyMeters: currentAcc,
    maxAccuracyMeters: maxAcc,
    zoneName,
    message,
    statusText
  };
}
