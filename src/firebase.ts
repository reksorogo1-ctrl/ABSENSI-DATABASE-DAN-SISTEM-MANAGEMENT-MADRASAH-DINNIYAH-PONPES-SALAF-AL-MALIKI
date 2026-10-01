import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  getDocFromServer,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { AppSettings, AbsensiGuruRecord, AbsensiSantriRecord } from './types';

// Nilai authDomain di dalam kode program harus selalu menggunakan domain bawaan Firebase (<projectId>.firebaseapp.com)
export const defaultAuthDomain = firebaseConfig.projectId ? `${firebaseConfig.projectId}.firebaseapp.com` : firebaseConfig.authDomain;

export const safeFirebaseConfig = {
  ...firebaseConfig,
  authDomain: defaultAuthDomain,
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(safeFirebaseConfig) : getApps()[0];

// CRITICAL: Must pass firebaseConfig.firestoreDatabaseId to getFirestore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error Handling conforming strictly to Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection validation
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info('Firebase Firestore connected successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration: Client is offline.');
    } else {
      console.info('Firebase online (test document checked).');
    }
    return false;
  }
}

// Auto-run connection test on boot
testConnection();

// Firebase Auth helper using Popup as instructed in skill
export async function signInWithGoogleFirebase() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Firebase Google Sign-in error:', error);
    throw error;
  }
}

export async function signOutFirebase() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase Sign-out error:', error);
  }
}

// Settings synchronization helpers
export async function loadSettingsFromFirestore(): Promise<Partial<AppSettings> | null> {
  const path = 'settings/general';
  try {
    const snap = await getDoc(doc(db, 'settings', 'general'));
    if (snap.exists()) {
      return snap.data() as Partial<AppSettings>;
    }
    return null;
  } catch (error) {
    console.warn('Could not load settings from Firestore, using local fallback:', error);
    return null;
  }
}

export async function saveSettingsToFirestore(settings: Partial<AppSettings>): Promise<void> {
  const path = 'settings/general';
  try {
    const cleanSettings: Record<string, any> = {
      id: 'general',
      updatedAt: new Date().toISOString()
    };

    // Only set defined keys to avoid invalid schema writes
    if (settings.nama_pondok) cleanSettings.nama_pondok = settings.nama_pondok;
    if (settings.nama_madrasah) cleanSettings.nama_madrasah = settings.nama_madrasah;
    if (settings.judul_aplikasi) cleanSettings.judul_aplikasi = settings.judul_aplikasi;
    if (settings.logo_pondok) cleanSettings.logo_pondok = settings.logo_pondok;
    if (settings.logo_madrasah) cleanSettings.logo_madrasah = settings.logo_madrasah;
    if (settings.background_url) cleanSettings.background_url = settings.background_url;
    if (settings.link_instagram) cleanSettings.link_instagram = settings.link_instagram;
    if (settings.link_tiktok) cleanSettings.link_tiktok = settings.link_tiktok;
    if (settings.link_youtube) cleanSettings.link_youtube = settings.link_youtube;
    if (settings.link_wa) cleanSettings.link_wa = settings.link_wa;
    if (typeof settings.geofencing_enabled === 'boolean') cleanSettings.geofencing_enabled = settings.geofencing_enabled;
    if (typeof settings.geofencing_locked === 'boolean') cleanSettings.geofencing_locked = settings.geofencing_locked;
    if (settings.geofencing_zone_name) cleanSettings.geofencing_zone_name = settings.geofencing_zone_name;
    if (typeof settings.geofencing_latitude === 'number') cleanSettings.geofencing_latitude = settings.geofencing_latitude;
    if (typeof settings.geofencing_longitude === 'number') cleanSettings.geofencing_longitude = settings.geofencing_longitude;
    if (typeof settings.geofencing_radius_meters === 'number') cleanSettings.geofencing_radius_meters = settings.geofencing_radius_meters;
    if (typeof settings.geofencing_max_gps_accuracy === 'number') cleanSettings.geofencing_max_gps_accuracy = settings.geofencing_max_gps_accuracy;
    if (typeof settings.toleransi_keterlambatan_menit === 'number') cleanSettings.toleransi_keterlambatan_menit = settings.toleransi_keterlambatan_menit;

    await setDoc(doc(db, 'settings', 'general'), cleanSettings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Realtime subscription for settings
export function subscribeSettingsFromFirestore(callback: (settings: Partial<AppSettings>) => void) {
  const path = 'settings/general';
  return onSnapshot(
    doc(db, 'settings', 'general'),
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as Partial<AppSettings>);
      }
    },
    (error) => {
      console.warn('Realtime settings subscription error:', error);
    }
  );
}
