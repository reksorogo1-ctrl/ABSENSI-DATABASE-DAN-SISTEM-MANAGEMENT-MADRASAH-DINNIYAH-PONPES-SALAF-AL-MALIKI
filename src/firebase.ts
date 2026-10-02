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
      ...settings,
      updatedAt: new Date().toISOString()
    };

    // Remove any undefined keys to prevent Firestore write errors
    Object.keys(cleanSettings).forEach(key => {
      if (cleanSettings[key] === undefined) {
        delete cleanSettings[key];
      }
    });

    await setDoc(doc(db, 'settings', 'general'), cleanSettings, { merge: true });
  } catch (error) {
    console.error('Error saving settings to Firestore:', error);
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

// =========================================================================
// REAL-TIME APP MASTER DATA ENGINE (WEBSITE & WEB APP SINGLE SOURCE OF TRUTH)
// =========================================================================

export interface AppCollectionEnvelope<T = any> {
  id: string;
  list: T[];
  updatedAt: string;
  source?: string;
}

/**
 * Save an entire collection atomically to Firestore.
 * Automatically notifies all connected clients (Website and Web App) via onSnapshot.
 */
export async function saveCollectionToFirestore<T>(collectionKey: string, list: T[]): Promise<void> {
  try {
    // Sanitasi list agar tidak ada nilai undefined
    const sanitizedList = JSON.parse(JSON.stringify(list));
    const envelope: AppCollectionEnvelope<T> = {
      id: collectionKey,
      list: sanitizedList,
      updatedAt: new Date().toISOString(),
      source: 'web_client'
    };

    await setDoc(doc(db, 'app_data', collectionKey), envelope, { merge: true });
  } catch (error) {
    console.error(`Gagal menyimpan koleksi ${collectionKey} ke Firestore:`, error);
  }
}

/**
 * Load a collection once from Firestore (fallback or initialization)
 */
export async function loadCollectionFromFirestore<T>(collectionKey: string): Promise<T[] | null> {
  try {
    const snap = await getDoc(doc(db, 'app_data', collectionKey));
    if (snap.exists()) {
      const data = snap.data() as AppCollectionEnvelope<T>;
      if (data && Array.isArray(data.list)) {
        return data.list;
      }
    }
    return null;
  } catch (error) {
    console.warn(`Gagal memuat ${collectionKey} dari Firestore:`, error);
    return null;
  }
}

/**
 * Subscribe to real-time changes for a collection.
 * Triggers callback immediately on snapshot changes, instantly syncing Website and Web App.
 */
export function subscribeCollectionFromFirestore<T>(
  collectionKey: string,
  callback: (list: T[]) => void
): () => void {
  return onSnapshot(
    doc(db, 'app_data', collectionKey),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AppCollectionEnvelope<T>;
        if (data && Array.isArray(data.list)) {
          callback(data.list);
        }
      }
    },
    (error) => {
      console.warn(`Realtime subscription error for ${collectionKey}:`, error);
    }
  );
}
