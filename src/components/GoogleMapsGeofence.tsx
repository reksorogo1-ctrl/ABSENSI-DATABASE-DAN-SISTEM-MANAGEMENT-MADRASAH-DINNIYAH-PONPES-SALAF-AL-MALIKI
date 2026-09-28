import React, { useEffect, useState, useRef, useCallback } from 'react';
import { APIProvider, Map, Marker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Compass, Crosshair, Shield, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { GOOGLE_MAPS_API_KEY, DEFAULT_GEOFENCE_ZONE } from '../lib/geofencing';

interface GoogleMapsGeofenceProps {
  zoneLat?: number;
  zoneLng?: number;
  centerLat?: number;
  centerLng?: number;
  radiusMeters: number;
  zoneName?: string;
  userLat?: number | null;
  userLng?: number | null;
  userAccuracy?: number | null;
  interactive?: boolean; // For Admin to pick/drag coordinates
  onCoordinatesChange?: (lat: number, lng: number) => void;
  height?: string;
  isInsideZone?: boolean;
  enabled?: boolean;
}

// Sub-komponen untuk merender lingkaran Geofence Circle menggunakan Google Maps Drawing API
const GeofenceCircleOverlay: React.FC<{
  center: { lat: number; lng: number };
  radius: number;
  isInside?: boolean;
}> = ({ center, radius, isInside = true }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map || !mapsLib) return;

    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        strokeColor: isInside ? '#10b981' : '#f59e0b',
        strokeOpacity: 0.85,
        strokeWeight: 2,
        fillColor: isInside ? '#059669' : '#d97706',
        fillOpacity: 0.22,
        map,
        center,
        radius,
      });
    } else {
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(radius);
      circleRef.current.setOptions({
        strokeColor: isInside ? '#10b981' : '#f59e0b',
        fillColor: isInside ? '#059669' : '#d97706',
      });
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map, mapsLib, center.lat, center.lng, radius, isInside]);

  return null;
};

// Controller untuk auto-center atau fit bounds
const MapAutoFit: React.FC<{
  zoneCenter: { lat: number; lng: number };
  userPos?: { lat: number; lng: number } | null;
}> = ({ zoneCenter, userPos }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (userPos) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(zoneCenter.lat, zoneCenter.lng));
      bounds.extend(new google.maps.LatLng(userPos.lat, userPos.lng));
      map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
    } else {
      map.setCenter(zoneCenter);
      map.setZoom(17);
    }
  }, [map, zoneCenter.lat, zoneCenter.lng, userPos?.lat, userPos?.lng]);

  return null;
};

export const GoogleMapsGeofence: React.FC<GoogleMapsGeofenceProps> = ({
  zoneLat,
  zoneLng,
  centerLat,
  centerLng,
  radiusMeters,
  zoneName = DEFAULT_GEOFENCE_ZONE.zoneName,
  userLat,
  userLng,
  userAccuracy,
  interactive = false,
  onCoordinatesChange,
  height = '280px',
  isInsideZone = true,
}) => {
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  const [isLocating, setIsLocating] = useState(false);

  const effectiveLat = zoneLat ?? centerLat ?? DEFAULT_GEOFENCE_ZONE.latitude;
  const effectiveLng = zoneLng ?? centerLng ?? DEFAULT_GEOFENCE_ZONE.longitude;

  const zoneCenter = {
    lat: Number(effectiveLat) || DEFAULT_GEOFENCE_ZONE.latitude,
    lng: Number(effectiveLng) || DEFAULT_GEOFENCE_ZONE.longitude,
  };

  const userPos =
    userLat !== null && userLat !== undefined && userLng !== null && userLng !== undefined
      ? { lat: Number(userLat), lng: Number(userLng) }
      : null;

  const handleMapClick = useCallback(
    (e: any) => {
      if (!interactive || !onCoordinatesChange) return;
      const latLng = e.detail?.latLng || e.latLng;
      if (!latLng) return;
      const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
      const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;
      if (lat !== undefined && lng !== undefined) {
        onCoordinatesChange(lat, lng);
      }
    },
    [interactive, onCoordinatesChange]
  );

  const handleMarkerDragEnd = useCallback(
    (e: any) => {
      if (!interactive || !onCoordinatesChange) return;
      const latLng = e.latLng || e.detail?.latLng;
      if (!latLng) return;
      const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
      const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;
      if (lat !== undefined && lng !== undefined) {
        onCoordinatesChange(lat, lng);
      }
    },
    [interactive, onCoordinatesChange]
  );

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser tidak mendukung Geolocation GPS.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        if (onCoordinatesChange) {
          onCoordinatesChange(pos.coords.latitude, pos.coords.longitude);
        }
      },
      (err) => {
        setIsLocating(false);
        alert('Gagal membaca GPS: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#d4af37]/40 shadow-xl bg-[#041a10]">
      {/* Top Header info bar */}
      <div className="bg-[#02130b]/90 backdrop-blur-md px-3.5 py-2 border-b border-[#d4af37]/30 flex flex-wrap items-center justify-between gap-2 z-10 text-xs">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#d4af37]" />
          <span className="font-bold text-white truncate max-w-[220px] sm:max-w-xs">{zoneName}</span>
          <span className="px-2 py-0.5 rounded-md bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#f3e5ab] font-mono text-[10px] font-extrabold">
            Radius: {radiusMeters}m
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Layer switcher */}
          <button
            type="button"
            onClick={() => setMapType(m => (m === 'roadmap' ? 'hybrid' : 'roadmap'))}
            className="px-2 py-1 bg-[#093d25] hover:bg-[#0c4e30] text-emerald-200 border border-emerald-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
            title="Ganti Tampilan Peta Satelit / Peta Jalan"
          >
            <Layers className="w-3 h-3" />
            <span>{mapType === 'roadmap' ? 'Satelit' : 'Peta Jalan'}</span>
          </button>

          {interactive && (
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-lg text-[10px] flex items-center gap-1 transition shadow disabled:opacity-50"
              title="Gunakan Titik Koordinat GPS Saat Ini Sebagai Pusat Zona"
            >
              <Crosshair className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Mencari...' : 'Gunakan GPS Saya'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Google Maps Container */}
      <div style={{ height, width: '100%' }} className="relative">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            defaultCenter={zoneCenter}
            defaultZoom={17}
            mapTypeId={mapType}
            gestureHandling="greedy"
            disableDefaultUI={false}
            onClick={interactive ? handleMapClick : undefined}
            className="w-full h-full"
          >
            {/* Overlay Radius Circle */}
            <GeofenceCircleOverlay center={zoneCenter} radius={radiusMeters} isInside={isInsideZone} />

            {/* Marker Pusat Zona Madrasah / Pondok */}
            <Marker
              position={zoneCenter}
              title={`Pusat Zona: ${zoneName}`}
              draggable={interactive}
              onDragEnd={interactive ? handleMarkerDragEnd : undefined}
            />

            {/* Marker Posisi Ustadz / Pengguna Saat Ini */}
            {userPos && (
              <Marker
                position={userPos}
                title="Posisi Anda Saat Ini"
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                }}
              />
            )}

            <MapAutoFit zoneCenter={zoneCenter} userPos={userPos} />
          </Map>
        </APIProvider>

        {/* Legend / Status Overlay at Bottom */}
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center justify-between gap-1.5 pointer-events-none">
          <div className="bg-[#02130b]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#d4af37]/30 text-[10px] text-white flex items-center gap-2 shadow-lg pointer-events-auto font-mono">
            <span className="flex items-center gap-1 text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              Pusat Zona: {zoneCenter.lat.toFixed(5)}, {zoneCenter.lng.toFixed(5)}
            </span>
            {userPos && (
              <span className="flex items-center gap-1 text-sky-300 border-l border-[#d4af37]/30 pl-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
                Posisi Ustadz: {userPos.lat.toFixed(5)}, {userPos.lng.toFixed(5)}
                {userAccuracy ? ` (±${Math.round(userAccuracy)}m)` : ''}
              </span>
            )}
          </div>

          {interactive && (
            <div className="bg-amber-950/90 text-amber-200 border border-amber-500/50 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow pointer-events-auto">
              Klik / Geser Pin untuk ubah lokasi pusat zona
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
