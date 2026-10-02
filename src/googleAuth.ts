import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { auth, isStandaloneApp, checkFirebaseRedirectResult } from './firebase';
import firebaseConfig from '../firebase-applet-config.json';

export { auth };

/**
 * Cakupan Izin OAuth 2.0 (Prinsip Hak Akses Minimal / Least Privilege)
 * Sesuai dengan pedoman OAuth 2.0 untuk Aplikasi Web Sisi Klien Google Workspace.
 */
export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

export const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));

// Sesuai standar keamanan OAuth 2.0 Web Sisi Klien:
// Token Akses HANYA disimpan di memori runtime (in-memory caching), TIDAK di localStorage/sessionStorage.
let cachedAccessToken: string | null = null;
let currentGoogleUser: User | null = null;
let isSigningIn = false;

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Deteksi error unauthorized-domain Firebase
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
 * Google Identity Services (GIS) Token Client Resmi
 * Mengikuti standar "OAuth 2.0 for Client-Side Web Applications"
 * https://developers.google.com/identity/oauth2/web/guides/use-token-model
 */
export const requestGISToken = (prompt: string = ''): Promise<{ user: User; accessToken: string }> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services (GIS) client library belum termuat di peramban.'));
      return;
    }

    const clientId = firebaseConfig.oAuthClientId;
    if (!clientId) {
      reject(new Error('OAuth Client ID tidak ditemukan dalam konfigurasi aplikasi.'));
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES.join(' '),
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }
          if (tokenResponse.access_token) {
            cachedAccessToken = tokenResponse.access_token;
            const pseudoUser: any = {
              uid: 'google-gis-user',
              displayName: 'Akun Google (OAuth 2.0 Web Client)',
              email: 'Terhubung via Google OAuth 2.0 Client-Side',
              photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
              emailVerified: true
            };
            currentGoogleUser = pseudoUser;
            resolve({ user: pseudoUser, accessToken: tokenResponse.access_token });
          } else {
            reject(new Error('Tidak ada Access Token yang diterima dari Google OAuth.'));
          }
        },
        error_callback: (err: any) => {
          reject(err);
        }
      });

      tokenClient.requestAccessToken({ prompt });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Set Access Token manual jika user menggunakan token dari Google OAuth Playground / Console
 * Tetap dipatuhi disimpan hanya di memori runtime.
 */
export const setManualAccessToken = (token: string, email?: string): { user: User; accessToken: string } => {
  cachedAccessToken = token.trim();
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
 * Memeriksa apakah baru saja kembali dari redirect pada browser HP
 */
export const checkGoogleAuthRedirectResult = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const res = await checkFirebaseRedirectResult();
    if (res && res.user) {
      if (res.accessToken) {
        cachedAccessToken = res.accessToken;
      }
      currentGoogleUser = res.user;
      return { user: res.user, accessToken: cachedAccessToken || '' };
    }
  } catch (err: any) {
    console.warn('Google redirect result check:', err);
  }
  return null;
};

/**
 * Inisialisasi Auth State Listener sisi klien (OAuth 2.0 Lifecycle)
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Cek hasil redirect saat aplikasi dimuat
  checkGoogleAuthRedirectResult().then((res) => {
    if (res && onAuthSuccess) {
      onAuthSuccess(res.user, res.accessToken);
    }
  }).catch(() => {});

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      currentGoogleUser = user;
      if (cachedAccessToken && onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      currentGoogleUser = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Login Google Sisi Klien (OAuth 2.0 Client-Side Flow)
 * Menggunakan Popup / GIS token client murni tanpa manipulasi server side redirect
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;

    // 1. Jika GIS tersedia secara native di peramban, coba token client langsung
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        const gisResult = await requestGISToken('');
        return gisResult;
      } catch (gisErr) {
        console.warn('Percobaan GIS dialihkan ke Firebase Popup:', gisErr);
      }
    }

    // 2. Gunakan Firebase Auth Google Provider Popup Client-Side
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Gagal mendapatkan Access Token OAuth 2.0.');
      }

      cachedAccessToken = credential.accessToken;
      currentGoogleUser = result.user;
      return { user: result.user, accessToken: cachedAccessToken };
    } catch (popupErr: any) {
      if (isUnauthorizedDomainError(popupErr)) {
        // Fallback langsung ke Google Identity Services jika domain Firebase belum ter-whitelist
        if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
          const gisResult = await requestGISToken('select_account');
          return gisResult;
        }
      }
      throw popupErr;
    }
  } catch (error: any) {
    console.error('OAuth 2.0 Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Mengambil Access Token yang tersimpan aman di memori runtime
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Mengambil informasi pengguna Google yang sedang aktif
 */
export const getCurrentGoogleUser = (): User | null => {
  return currentGoogleUser || auth.currentUser;
};

/**
 * Logout Google sisi klien dan bersihkan token dari memori runtime
 */
export const logoutGoogle = async () => {
  try {
    await auth.signOut();
  } catch {}
  cachedAccessToken = null;
  currentGoogleUser = null;
};
