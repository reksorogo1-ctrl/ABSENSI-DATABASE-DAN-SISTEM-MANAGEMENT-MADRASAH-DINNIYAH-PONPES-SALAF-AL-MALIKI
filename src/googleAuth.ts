import { 
  signInWithPopup, 
  signInWithRedirect, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { auth, isMobileDevice, isStandaloneApp, checkFirebaseRedirectResult } from './firebase';
import firebaseConfig from '../firebase-applet-config.json';

export { auth };

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly'
];

export const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));

let isSigningIn = false;
let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('sim_google_access_token') : null;
let currentGoogleUser: User | null = null;

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Memeriksa apakah error disebabkan oleh domain yang belum diizinkan di Firebase Console
 */
export const isUnauthorizedDomainError = (error: any): boolean => {
  if (!error) return false;
  const msg = typeof error === 'string' ? error : (error.message || error.code || '');
  return (
    error.code === 'auth/unauthorized-domain' ||
    msg.includes('auth/unauthorized-domain') ||
    msg.includes('unauthorized-domain')
  );
};

/**
 * Fallback direct OAuth token flow menggunakan Google Identity Services (GIS)
 * Tidak memerlukan whitelist domain di Firebase Auth (beroperasi langsung di client).
 */
export const requestGISToken = (): Promise<{ user: User; accessToken: string }> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services library belum siap di browser. Silakan coba sesaat lagi atau tambahkan domain ke Firebase Console.'));
      return;
    }

    const clientId = firebaseConfig.oAuthClientId;
    if (!clientId) {
      reject(new Error('OAuth Client ID tidak ditemukan dalam konfigurasi.'));
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES.join(' '),
        callback: (resp: any) => {
          if (resp.error) {
            reject(new Error(resp.error_description || resp.error));
            return;
          }
          if (resp.access_token) {
            cachedAccessToken = resp.access_token;
            const pseudoUser: any = {
              uid: 'google-gis-user',
              displayName: 'Akun Google (OAuth Direct)',
              email: 'Terhubung via Google OAuth',
              photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
              emailVerified: true
            };
            currentGoogleUser = pseudoUser;
            resolve({ user: pseudoUser, accessToken: resp.access_token });
          } else {
            reject(new Error('Tidak ada Access Token yang diterima dari Google.'));
          }
        },
        error_callback: (err: any) => {
          reject(err);
        }
      });

      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Set Access Token manual jika user menyalin token dari Google OAuth Playground / Console
 */
export const setManualAccessToken = (token: string, email?: string): { user: User; accessToken: string } => {
  cachedAccessToken = token.trim();
  if (typeof window !== 'undefined') {
    localStorage.setItem('sim_google_access_token', cachedAccessToken);
  }
  const pseudoUser: any = {
    uid: 'google-manual-token',
    displayName: email || 'Google Account (Manual Token)',
    email: email || 'Terhubung via Token Google',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    emailVerified: true
  };
  currentGoogleUser = pseudoUser;
  return { user: pseudoUser, accessToken: cachedAccessToken };
};

/**
 * Memeriksa apakah baru saja kembali dari signInWithRedirect pada browser HP
 */
export const checkGoogleAuthRedirectResult = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const res = await checkFirebaseRedirectResult();
    if (res && res.user) {
      if (res.accessToken) {
        cachedAccessToken = res.accessToken;
        if (typeof window !== 'undefined') {
          localStorage.setItem('sim_google_access_token', res.accessToken);
        }
      }
      currentGoogleUser = res.user;
      return { user: res.user, accessToken: cachedAccessToken || '' };
    }
  } catch (err: any) {
    console.warn('Google redirect result check:', err);
  }
  return null;
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Cek redirect result terlebih dahulu saat aplikasi dimuat di HP
  checkGoogleAuthRedirectResult().then((res) => {
    if (res && onAuthSuccess) {
      onAuthSuccess(res.user, res.accessToken);
    }
  }).catch(() => {});

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      currentGoogleUser = user;
      if (!cachedAccessToken && typeof window !== 'undefined') {
        cachedAccessToken = localStorage.getItem('sim_google_access_token');
      }
      if (cachedAccessToken && onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      // Don't overwrite if manual or GIS token is active
      if (!cachedAccessToken) {
        currentGoogleUser = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (forceRedirect: boolean = false): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    
    // Jika di dalam PWA Standalone (Web App Layar Utama), JANGAN redirect keluar dari app container
    if (isStandaloneApp()) {
      console.info('PWA Standalone Mode: Menggunakan GIS / Popup di dalam app agar tidak terlempar keluar');
      if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
        try {
          const gisResult = await requestGISToken();
          if (gisResult?.accessToken && typeof window !== 'undefined') {
            localStorage.setItem('sim_google_access_token', gisResult.accessToken);
          }
          return gisResult;
        } catch (gisErr) {
          console.warn('GIS di PWA gagal, mencoba Firebase popup:', gisErr);
        }
      }
      try {
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          cachedAccessToken = credential.accessToken;
          localStorage.setItem('sim_google_access_token', credential.accessToken);
        }
        currentGoogleUser = result.user;
        return { user: result.user, accessToken: cachedAccessToken || '' };
      } catch (e: any) {
        throw new Error('Pada Web App (Layar Utama HP), gunakan Masuk dengan Sandi Admin atau salin Access Token untuk menghubungkan Google Sheets tanpa keluar aplikasi.');
      }
    }

    // Pada browser HP biasa (Chrome / Safari), gunakan signInWithRedirect
    if (forceRedirect || isMobileDevice()) {
      console.info('Menggunakan signInWithRedirect untuk lingkungan browser HP/mobile...');
      await signInWithRedirect(auth, provider);
      return null;
    }

    // 1. Coba flow resmi Firebase Popup pada Desktop
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Gagal mendapatkan token akses dari Google Auth.');
      }

      cachedAccessToken = credential.accessToken;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sim_google_access_token', credential.accessToken);
      }
      currentGoogleUser = result.user;
      return { user: result.user, accessToken: cachedAccessToken };
    } catch (firebaseErr: any) {
      console.warn('Firebase signInWithPopup gagal, mengecek tipe error:', firebaseErr);

      // Jika popup diblokir oleh browser, alihkan ke signInWithRedirect
      if (firebaseErr?.code === 'auth/popup-blocked' || firebaseErr?.code === 'auth/popup-closed-by-user') {
        console.warn('Popup terblokir, beralih ke signInWithRedirect...');
        await signInWithRedirect(auth, provider);
        return null;
      }

      // Jika error adalah unauthorized-domain, coba Google Identity Services client-side langsung
      if (isUnauthorizedDomainError(firebaseErr)) {
        console.info('Mencoba fallback otomatis melalui Google Identity Services (GIS)...');
        if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
          try {
            const gisResult = await requestGISToken();
            if (gisResult?.accessToken && typeof window !== 'undefined') {
              localStorage.setItem('sim_google_access_token', gisResult.accessToken);
            }
            return gisResult;
          } catch (gisErr: any) {
            console.warn('GIS fallback juga memerlukan interaksi atau gagal:', gisErr);
          }
        }
      }

      // Lemparkan error dengan properti yang diperjelas
      throw firebaseErr;
    }
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken && typeof window !== 'undefined') {
    cachedAccessToken = localStorage.getItem('sim_google_access_token');
  }
  return cachedAccessToken;
};

export const getCurrentGoogleUser = (): User | null => {
  return currentGoogleUser || auth.currentUser;
};

export const logoutGoogle = async () => {
  try {
    await auth.signOut();
  } catch {}
  cachedAccessToken = null;
  currentGoogleUser = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sim_google_access_token');
  }
};
