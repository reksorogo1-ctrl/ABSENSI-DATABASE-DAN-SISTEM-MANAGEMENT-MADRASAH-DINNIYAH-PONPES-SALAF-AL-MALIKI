import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  getDocFromServer 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

export const safeFirebaseConfig = firebaseConfig;
export { firebaseConfig };
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app, firebaseConfig.storageBucket ? `gs://${firebaseConfig.storageBucket}` : undefined);

// Validate Connection to Firestore on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

export function isStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true || document.referrer.includes('android-app://');
}

export async function signInWithGoogleFirebase(redirect: boolean = false): Promise<FirebaseUser | null> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  if (redirect) {
    await signInWithRedirect(auth, provider);
    return null;
  }
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function checkFirebaseRedirectResult(): Promise<any> {
  try {
    return await getRedirectResult(auth);
  } catch (e) {
    console.warn('Firebase redirect result check warning:', e);
    return null;
  }
}

export async function saveSettingsToFirestore(settings: any): Promise<void> {
  try {
    await setDoc(doc(db, 'sim_app_settings', 'main_config'), {
      payload: settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.warn('Gagal menyimpan settings ke Firestore, tersimpan di lokal:', e);
  }
}

export async function loadSettingsFromFirestore(): Promise<any> {
  try {
    const snap = await getDoc(doc(db, 'sim_app_settings', 'main_config'));
    if (snap.exists()) {
      const data = snap.data();
      return data?.payload ?? data;
    }
  } catch (e) {
    console.warn('Gagal memuat settings dari Firestore:', e);
  }
  return null;
}

export function subscribeSettingsFromFirestore(callback: (settings: any) => void): () => void {
  try {
    return onSnapshot(doc(db, 'sim_app_settings', 'main_config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        callback(data?.payload ?? data);
      } else {
        callback(null);
      }
    }, (err) => {
      console.warn('Langganan Firestore settings notice:', err);
    });
  } catch (e) {
    console.warn('Error saat subscribe Firestore settings:', e);
    return () => {};
  }
}

export async function saveMasterDataToFirestore(collectionKey: string, data: any): Promise<void> {
  try {
    await setDoc(doc(db, 'sim_master_data', collectionKey), {
      payload: data,
      collectionKey,
      updatedAt: new Date().toISOString()
    });
  } catch (t) {
    console.warn(`Simpan master data ${collectionKey} ke Firestore notice:`, t);
  }
}

export async function loadMasterDataFromFirestore<T = any>(collectionKey: string): Promise<T | null> {
  try {
    const snap = await getDoc(doc(db, 'sim_master_data', collectionKey));
    if (snap.exists()) {
      const data = snap.data();
      return (data?.payload ?? data?.data ?? data) as T;
    }
  } catch (t) {
    console.warn(`Muat master data ${collectionKey} dari Firestore notice:`, t);
  }
  return null;
}

export function subscribeMasterDataFromFirestore<T = any>(
  collectionKey: string, 
  callback: (data: T | null) => void
): () => void {
  try {
    return onSnapshot(doc(db, 'sim_master_data', collectionKey), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        callback((data?.payload ?? data?.data ?? data) as T);
      } else {
        callback(null);
      }
    }, (err) => {
      console.warn(`Langganan Firestore master data ${collectionKey} notice:`, err);
    });
  } catch (t) {
    console.warn(`Error saat subscribe Firestore master data ${collectionKey}:`, t);
    return () => {};
  }
}

export interface FirestoreBackupPackage {
  version: string;
  exportedAt: string;
  projectId: string;
  databaseId: string;
  storageBucket?: string;
  authDomain?: string;
  appName: string;
  settings: any;
  collections: Record<string, any>;
  summary: Record<string, number>;
}

export const MASTER_COLLECTION_KEYS = [
  'santri',
  'guru',
  'jadwal',
  'absensi_santri',
  'absensi_guru',
  'rekap_santri_history',
  'rekap_guru_history',
  'nilai',
  'nadzhom',
  'syahriyah',
  'kurikulum',
  'pengurus',
  'izin_mengajar',
  'sync_meta'
];

/**
 * Ekspor seluruh database Firestore produksi (Single Source of Truth) ke objek backup JSON
 */
export async function exportFirestoreBackup(): Promise<FirestoreBackupPackage> {
  const collections: Record<string, any> = {};
  const summary: Record<string, number> = {};

  for (const key of MASTER_COLLECTION_KEYS) {
    try {
      const data = await loadMasterDataFromFirestore(key);
      if (data !== null && data !== undefined) {
        collections[key] = data;
        summary[key] = Array.isArray(data) ? data.length : 1;
      } else {
        collections[key] = [];
        summary[key] = 0;
      }
    } catch (err) {
      console.error(`Gagal mengekspor koleksi ${key}:`, err);
      collections[key] = [];
      summary[key] = 0;
    }
  }

  const settings = await loadSettingsFromFirestore();

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
    storageBucket: firebaseConfig.storageBucket,
    authDomain: firebaseConfig.authDomain,
    appName: 'SIM Pondok Pesantren Salaf Al-Maliki',
    settings: settings || null,
    collections,
    summary
  };
}

/**
 * Memulihkan data Firestore dari objek backup JSON yang valid secara non-destruktif
 */
export async function restoreFirestoreBackup(backup: any): Promise<{
  success: boolean;
  restoredKeys: string[];
  summary: Record<string, number>;
  message: string;
}> {
  if (!backup || typeof backup !== 'object') {
    throw new Error('Format file backup tidak valid. Harus berupa JSON.');
  }

  const targetCollections = backup.collections || (backup.santri ? backup : null);
  if (!targetCollections || typeof targetCollections !== 'object') {
    throw new Error('Data backup tidak memiliki struktur koleksi yang dapat dibaca.');
  }

  const restoredKeys: string[] = [];
  const summary: Record<string, number> = {};

  // Pulihkan pengaturan umum jika ada
  if (backup.settings) {
    try {
      await saveSettingsToFirestore(backup.settings);
      restoredKeys.push('settings');
    } catch (err) {
      console.warn('Gagal memulihkan pengaturan umum:', err);
    }
  }

  // Pulihkan masing-masing master collection
  for (const key of MASTER_COLLECTION_KEYS) {
    if (key in targetCollections) {
      const itemData = targetCollections[key];
      if (itemData !== undefined && itemData !== null) {
        await saveMasterDataToFirestore(key, itemData);
        restoredKeys.push(key);
        summary[key] = Array.isArray(itemData) ? itemData.length : 1;
      }
    }
  }

  return {
    success: true,
    restoredKeys,
    summary,
    message: `Berhasil memulihkan ${restoredKeys.length} modul data ke database Firestore produksi.`
  };
}
