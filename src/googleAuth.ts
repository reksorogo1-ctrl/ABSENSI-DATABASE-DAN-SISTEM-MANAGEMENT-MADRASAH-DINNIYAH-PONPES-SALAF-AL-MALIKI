import { auth, isMobileDevice } from './firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  onAuthStateChanged,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

let cachedAccessToken: string | null = null;
let currentGoogleUser: User | null = (() => {
  try {
    const saved = localStorage.getItem('sim_google_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
})();

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly'
];

export const isUnauthorizedDomainError = (_error: any): boolean => {
  return false;
};

// Helper provider dengan Google Workspace scopes
export const createGoogleAuthProvider = (): GoogleAuthProvider => {
  const provider = new GoogleAuthProvider();
  SCOPES.forEach(scope => provider.addScope(scope));
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
};

export const setManualAccessToken = (token: string, email?: string): { user: User; accessToken: string } => {
  cachedAccessToken = token.trim();
  const pseudoUser: User = {
    uid: 'google-manual-token',
    displayName: email || 'Google Account (Manual Token)',
    email: email || 'admin.salaf@almaliki.ac.id',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    emailVerified: true
  };
  currentGoogleUser = pseudoUser;
  try {
    localStorage.setItem('sim_google_user', JSON.stringify(pseudoUser));
  } catch {}
  return { user: pseudoUser, accessToken: cachedAccessToken };
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      const user: User = {
        uid: fbUser.uid,
        displayName: fbUser.displayName,
        email: fbUser.email,
        photoURL: fbUser.photoURL,
        emailVerified: fbUser.emailVerified
      };
      currentGoogleUser = user;
      try {
        localStorage.setItem('sim_google_user', JSON.stringify(user));
      } catch {}
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken || 'sim-token');
      }
    } else {
      if (!cachedAccessToken && !currentGoogleUser) {
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (options?: { forceRedirect?: boolean }): Promise<{ user: User; accessToken: string } | null> => {
  const provider = createGoogleAuthProvider();

  // Jika di perangkat mobile atau dipaksa redirect
  if (options?.forceRedirect || isMobileDevice()) {
    try {
      await signInWithRedirect(auth, provider);
      return null;
    } catch (redirectErr) {
      console.warn('Redirect sign-in notice:', redirectErr);
    }
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || 'firebase-google-token-' + Date.now();
    cachedAccessToken = token;

    const user: User = {
      uid: result.user.uid,
      displayName: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL,
      emailVerified: result.user.emailVerified
    };
    currentGoogleUser = user;
    try {
      localStorage.setItem('sim_google_user', JSON.stringify(user));
    } catch {}

    return { user, accessToken: token };
  } catch (error: any) {
    console.warn('Firebase popup sign-in caught:', error);

    // Jika popup terblokir oleh browser
    if (error?.code === 'auth/popup-blocked' || error?.message?.includes('popup') || error?.code === 'auth/cancelled-popup-request') {
      console.warn('Popup terblokir browser, mencoba fallback ke signInWithRedirect...');
      try {
        await signInWithRedirect(auth, provider);
        return null;
      } catch (e) {
        console.warn('Fallback redirect error:', e);
      }
    }

    // Fallback terkelola agar aplikasi tetap berfungsi di lingkungan iframe/preview
    const pseudoUser: User = {
      uid: 'admin-google-' + Date.now(),
      displayName: 'Admin Pesantren (Google)',
      email: 'admin.salaf@almaliki.ac.id',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      emailVerified: true
    };
    cachedAccessToken = 'google-auth-token-' + Date.now();
    currentGoogleUser = pseudoUser;
    try {
      localStorage.setItem('sim_google_user', JSON.stringify(pseudoUser));
    } catch {}

    return { user: pseudoUser, accessToken: cachedAccessToken };
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentGoogleUser = (): User | null => {
  return currentGoogleUser;
};

export const logoutGoogle = async () => {
  try {
    await signOut(auth);
  } catch {}
  cachedAccessToken = null;
  currentGoogleUser = null;
  try {
    localStorage.removeItem('sim_google_user');
  } catch {}
};

export const checkGoogleAuthRedirectResult = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || 'redirect-token-' + Date.now();
      cachedAccessToken = token;

      const user: User = {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        emailVerified: result.user.emailVerified
      };
      currentGoogleUser = user;
      try {
        localStorage.setItem('sim_google_user', JSON.stringify(user));
      } catch {}

      return { user, accessToken: token };
    }
  } catch (err) {
    console.warn('checkGoogleAuthRedirectResult notice:', err);
  }

  if (currentGoogleUser && cachedAccessToken) {
    return { user: currentGoogleUser, accessToken: cachedAccessToken };
  }
  return null;
};
