// IndexedDB-backed Persistent Video Storage for SIM Salaf Al-Maliki
// Enables users to upload custom MP4/WebM videos of any size without 5MB localStorage limits.

const DB_NAME = 'sim_almaliki_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'videos';
const VIDEO_KEY = 'intro_video_blob';

const LS_VIDEO_URL_KEY = 'sim_intro_video_url';
const LS_VIDEO_NAME_KEY = 'sim_intro_video_name';
const LS_VIDEO_SIZE_KEY = 'sim_intro_video_size';
const LS_VIDEO_TYPE_KEY = 'sim_intro_video_type'; // 'file' | 'url' | 'default'

export interface VideoInfo {
  src: string;
  name: string;
  size?: number; // bytes
  isCustom: boolean;
  sourceType: 'indexeddb' | 'url' | 'default';
  uploadedAt?: string;
}

// Open or create the IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save a File or Blob directly into IndexedDB
export async function saveVideoFile(file: File | Blob, originalName?: string): Promise<string> {
  const db = await openDB();
  const fileName = originalName || (file instanceof File ? file.name : 'intro_video.mp4');
  const fileSize = file.size;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const putReq = store.put(file, VIDEO_KEY);

    putReq.onsuccess = () => resolve();
    putReq.onerror = () => reject(putReq.error);
  });

  // Save metadata into localStorage
  try {
    localStorage.setItem(LS_VIDEO_NAME_KEY, fileName);
    localStorage.setItem(LS_VIDEO_SIZE_KEY, fileSize.toString());
    localStorage.setItem(LS_VIDEO_TYPE_KEY, 'file');
    localStorage.setItem('sim_intro_video_updated', new Date().toISOString());
  } catch (err) {
    console.warn('Could not store video metadata in localStorage:', err);
  }

  // Create an object URL for instant playback
  return URL.createObjectURL(file);
}

// Retrieve video from IndexedDB and return an object URL
export async function getStoredVideoBlobUrl(): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(VIDEO_KEY);

      getReq.onsuccess = () => {
        const result = getReq.result as Blob | undefined;
        if (result && result instanceof Blob) {
          const blobUrl = URL.createObjectURL(result);
          resolve(blobUrl);
        } else {
          resolve(null);
        }
      };

      getReq.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Failed to load video from IndexedDB:', err);
    return null;
  }
}

// Save a streaming / web URL (e.g. Cloudinary, Firebase, YouTube direct, direct MP4 link)
export function saveVideoUrl(url: string, label?: string): void {
  localStorage.setItem(LS_VIDEO_URL_KEY, url);
  localStorage.setItem(LS_VIDEO_NAME_KEY, label || url.split('/').pop() || 'Video URL Online');
  localStorage.setItem(LS_VIDEO_TYPE_KEY, 'url');
  localStorage.setItem('sim_intro_video_updated', new Date().toISOString());
}

// Reset/remove custom video and revert back to default
export async function resetVideoToDefault(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(VIDEO_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Error clearing IndexedDB video:', err);
  }

  localStorage.removeItem(LS_VIDEO_URL_KEY);
  localStorage.removeItem(LS_VIDEO_NAME_KEY);
  localStorage.removeItem(LS_VIDEO_SIZE_KEY);
  localStorage.setItem(LS_VIDEO_TYPE_KEY, 'default');
}

// Get the active video to display
export async function resolveActiveVideo(defaultFallbackUrl: string = '/assets/intro_salaf_almaliki.mp4'): Promise<VideoInfo> {
  const videoType = localStorage.getItem(LS_VIDEO_TYPE_KEY);
  const customUrl = localStorage.getItem(LS_VIDEO_URL_KEY);
  const customName = localStorage.getItem(LS_VIDEO_NAME_KEY);
  const customSize = Number(localStorage.getItem(LS_VIDEO_SIZE_KEY) || '0');
  const updatedAt = localStorage.getItem('sim_intro_video_updated') || undefined;

  // 1. If user previously uploaded a file, check IndexedDB first
  if (videoType === 'file') {
    const blobUrl = await getStoredVideoBlobUrl();
    if (blobUrl) {
      return {
        src: blobUrl,
        name: customName || 'Video Kustom (Tersimpan di IndexedDB)',
        size: customSize,
        isCustom: true,
        sourceType: 'indexeddb',
        uploadedAt: updatedAt
      };
    }
  }

  // 2. If user saved an external URL
  if (videoType === 'url' && customUrl && customUrl.trim()) {
    return {
      src: customUrl.trim(),
      name: customName || 'Video Streaming Online',
      isCustom: true,
      sourceType: 'url',
      uploadedAt: updatedAt
    };
  }

  // 3. Check if an intro URL is stored in sim_settings or localStorage
  const savedSettings = localStorage.getItem('sim_settings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      if (parsed.intro_video_url && parsed.intro_video_url !== 'Camera_moving_through_Islamic_li…_20260925184519.mp4') {
        return {
          src: parsed.intro_video_url,
          name: 'Video Intro Salaf Al-Maliki',
          isCustom: true,
          sourceType: 'url'
        };
      }
    } catch {
      // ignore
    }
  }

  // 4. Default Video: The Journey of Knowledge - Salaf Al Maliki
  return {
    src: defaultFallbackUrl,
    name: 'The Journey of Knowledge — Salaf Al-Maliki (Bawaan)',
    isCustom: false,
    sourceType: 'default'
  };
}
