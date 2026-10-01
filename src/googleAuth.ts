import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
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
let cachedAccessToken: string | null = null;
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

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      currentGoogleUser = user;
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
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

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    
    // 1. Coba flow resmi Firebase Popup
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Gagal mendapatkan token akses dari Google Auth.');
      }

      cachedAccessToken = credential.accessToken;
      currentGoogleUser = result.user;
      return { user: result.user, accessToken: cachedAccessToken };
    } catch (firebaseErr: any) {
      console.warn('Firebase signInWithPopup gagal, mengecek tipe error:', firebaseErr);

      // Jika error adalah unauthorized-domain, coba Google Identity Services client-side langsung
      if (isUnauthorizedDomainError(firebaseErr)) {
        console.info('Mencoba fallback otomatis melalui Google Identity Services (GIS)...');
        if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
          try {
            const gisResult = await requestGISToken();
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
};
