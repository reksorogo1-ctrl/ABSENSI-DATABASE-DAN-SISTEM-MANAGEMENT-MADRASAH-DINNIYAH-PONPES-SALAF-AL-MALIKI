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
  getDocFromServer,
  runTransaction
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
  'pelanggaran_santri',
  'pelanggaran_template',
  'pelanggaran_counter',
  'pelanggaran_audit',
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

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const INDONESIAN_MONTHS = [
  'januari', 'februari', 'maret', 'april', 'mei', 'juni',
  'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
];

export function formatNomorSuratFromCounter(
  urutan: number,
  formatPattern: string = '{NO}/TAKZIRAN/MD-ALMALIKI/{ROMAWI}/{TAHUN}',
  periodeBulan?: string
): string {
  const paddedNo = String(Math.max(1, urutan)).padStart(3, '0');
  const now = new Date();
  let monthIdx = now.getMonth();
  let yearNum = now.getFullYear();

  if (periodeBulan) {
    const parts = periodeBulan.trim().split(/\s+/);
    if (parts.length >= 2) {
      const mIdx = INDONESIAN_MONTHS.findIndex(m => parts[0].toLowerCase().startsWith(m.slice(0, 3)));
      if (mIdx !== -1) monthIdx = mIdx;
      const yParsed = parseInt(parts[1], 10);
      if (!isNaN(yParsed)) yearNum = yParsed;
    }
  }

  const romawi = ROMAN_MONTHS[monthIdx] || 'XI';
  const tahunStr = String(yearNum);

  if (!formatPattern || !formatPattern.trim()) {
    return `${paddedNo}/TAKZIRAN/MD-ALMALIKI/${romawi}/${tahunStr}`;
  }

  // Jika pengguna menuliskan contoh statis seperti "001/TAKZIRAN/MD-ALMALIKI/XI/2026" tanpa placeholder
  if (
    !formatPattern.includes('{NO}') &&
    !formatPattern.includes('{NOMOR}')
  ) {
    const replacedFirstNum = formatPattern.replace(/^\d+/, paddedNo);
    if (replacedFirstNum !== formatPattern) {
      return replacedFirstNum;
    }
    return `${paddedNo}/${formatPattern}`;
  }

  return formatPattern
    .replace(/\{NO\}|\{NOMOR\}/gi, paddedNo)
    .replace(/\{ROMAWI\}|\{BULAN_ROMAWI\}/gi, romawi)
    .replace(/\{TAHUN\}/gi, tahunStr);
}

/**
 * Penomoran Surat Takziran Otomatis & Atomik via Transaksi Firestore
 * Menjamin nomor berurutan (001, 002, 003...) dan tidak pernah ganda antar perangkat/Admin
 */
export async function generateAtomicNomorSuratTakziran(
  formatPattern: string = '{NO}/TAKZIRAN/MD-ALMALIKI/{ROMAWI}/{TAHUN}',
  periodeBulan?: string,
  existingMaxUrutan: number = 0
): Promise<{ nomorSurat: string; urutan: number }> {
  const counterDocRef = doc(db, 'sim_master_data', 'pelanggaran_counter');
  let nextUrutan = existingMaxUrutan + 1;

  try {
    nextUrutan = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(counterDocRef);
      let currentSeq = 0;
      if (snap.exists()) {
        const data = snap.data();
        const payloadSeq = typeof data?.payload?.lastSeq === 'number'
          ? data.payload.lastSeq
          : typeof data?.lastSeq === 'number'
          ? data.lastSeq
          : 0;
        currentSeq = payloadSeq;
      }
      const nextSeq = Math.max(currentSeq, existingMaxUrutan) + 1;
      transaction.set(counterDocRef, {
        payload: {
          lastSeq: nextSeq,
          updatedAt: new Date().toISOString()
        },
        lastSeq: nextSeq,
        collectionKey: 'pelanggaran_counter',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return nextSeq;
    });
  } catch (e) {
    console.warn('Transaksi nomor surat Firestore fallback ke urutan aman:', e);
    try {
      const localSeq = parseInt(localStorage.getItem('sim_pelanggaran_last_seq') || '0', 10) || 0;
      nextUrutan = Math.max(localSeq, existingMaxUrutan) + 1;
    } catch {}
  }

  try {
    localStorage.setItem('sim_pelanggaran_last_seq', String(nextUrutan));
  } catch {}

  const nomorSurat = formatNomorSuratFromCounter(nextUrutan, formatPattern, periodeBulan);
  return { nomorSurat, urutan: nextUrutan };
}

