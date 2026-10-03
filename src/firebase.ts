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
  onSnapshot 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const safeFirebaseConfig = {
  apiKey: "AIzaSyAsM1VRXNPExGNW75N9yl76z4qfY-cB748",
  authDomain: "absensi-data-santri.firebaseapp.com",
  projectId: "absensi-data-santri",
  storageBucket: "absensi-data-santri.firebasestorage.app",
  messagingSenderId: "220606876180",
  appId: "1:220606876180:web:e6287820b325ed51e6b501",
  firestoreDatabaseId: "ai-studio-absensidatabased-62fd9012-6580-4225-a96d-30d9ad0cca06"
};

export const firebaseConfig = safeFirebaseConfig;

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app, firebaseConfig.storageBucket ? `gs://${firebaseConfig.storageBucket}` : undefined);

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
