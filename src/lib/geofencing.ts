/**
 * Geofencing & Google Maps Service for Ustadz/Ustadzah Attendance
 */

export const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyArSH6pWG3xCC_8kwqR-7oqLTjxpUYSwCU';

export const DEFAULT_GEOFENCE_ZONE = {
  zoneName: 'Kompleks Pondok Pesantren & Madrasah Diniyah',
  latitude: -7.428623,
  longitude: 112.441234,
  radiusMeters: 100,
  maxGpsAccuracy: 50,
};

/**
 * Hitung jarak antara 2 koordinat (Latitude/Longitude) menggunakan Formula Haversine dalam satuan meter.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius bumi dalam meter
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

export interface GeofenceCheckResult {
  isValid: boolean;
  isWithinRadius: boolean;
  isAccuracyValid: boolean;
  distanceMeters: number;
  radiusMeters: number;
  accuracyMeters: number;
  maxAccuracyMeters: number;
  zoneName: string;
  message: string;
  statusText: 'DI DALAM RADIUS' | 'DI LUAR RADIUS' | 'GPS KURANG AKURAT' | 'GEOFENCING NONAKTIF';
}

/**
 * Validasi posisi ustadz terhadap zona geofencing yang ditentukan Admin
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
  const zoneName = config.zoneName || DEFAULT_GEOFENCE_ZONE.zoneName;
  const targetLat = config.latitude ?? DEFAULT_GEOFENCE_ZONE.latitude;
  const targetLng = config.longitude ?? DEFAULT_GEOFENCE_ZONE.longitude;
  const radius = config.radiusMeters ?? DEFAULT_GEOFENCE_ZONE.radiusMeters;
  const maxAcc = config.maxGpsAccuracy ?? DEFAULT_GEOFENCE_ZONE.maxGpsAccuracy;

  if (!isEnabled) {
    return {
      isValid: true,
      isWithinRadius: true,
      isAccuracyValid: true,
      distanceMeters: 0,
      radiusMeters: radius,
      accuracyMeters: accuracy || 0,
      maxAccuracyMeters: maxAcc,
      zoneName,
      message: 'Geofencing dinonaktifkan oleh Admin (Validasi radius dilewati).',
      statusText: 'GEOFENCING NONAKTIF'
    };
  }

  if (userLat === null || userLng === null) {
    return {
      isValid: false,
      isWithinRadius: false,
      isAccuracyValid: false,
      distanceMeters: 9999,
      radiusMeters: radius,
      accuracyMeters: 9999,
      maxAccuracyMeters: maxAcc,
      zoneName,
      message: 'GPS / Lokasi perangkat belum terdeteksi. Silakan aktifkan izin lokasi.',
      statusText: 'DI LUAR RADIUS'
    };
  }

  const distance = calculateDistanceMeters(userLat, userLng, targetLat, targetLng);
  const currentAcc = accuracy !== null && !isNaN(accuracy) ? accuracy : 10;
  const isAccValid = currentAcc <= maxAcc;
  const isInside = distance <= radius;
  const isValid = isInside && isAccValid;

  let message = '';
  let statusText: GeofenceCheckResult['statusText'] = 'DI LUAR RADIUS';

  if (!isInside) {
    message = `Posisi Anda ${distance.toFixed(1)}m dari ${zoneName} (Maksimum radius: ${radius}m). Anda harus berada di lokasi madrasah untuk melakukan absensi.`;
    statusText = 'DI LUAR RADIUS';
  } else if (!isAccValid) {
    message = `Akurasi GPS perangkat Anda saat ini ±${currentAcc.toFixed(1)}m (Batas maksimal: ${maxAcc}m). Tunggu hingga sinyal GPS stabil.`;
    statusText = 'GPS KURANG AKURAT';
  } else {
    message = `Lokasi Valid! Jarak ${distance.toFixed(1)}m dari ${zoneName} (Radius: ${radius}m).`;
    statusText = 'DI DALAM RADIUS';
  }

  return {
    isValid,
    isWithinRadius: isInside,
    isAccuracyValid: isAccValid,
    distanceMeters: distance,
    radiusMeters: radius,
    accuracyMeters: currentAcc,
    maxAccuracyMeters: maxAcc,
    zoneName,
    message,
    statusText
  };
}
