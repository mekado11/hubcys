/**
 * Firebase client — reads config from Vite env vars.
 *
 * Required env vars (set in Vercel / .env.local):
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_STORAGE_BUCKET
 *   VITE_FIREBASE_MESSAGING_SENDER_ID
 *   VITE_FIREBASE_APP_ID
 */
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const isConfigured = !!firebaseConfig.apiKey;

if (!isConfigured) {
  console.warn('[firebase] VITE_FIREBASE_API_KEY not set — Firebase disabled. Auth and database features will not work.');
}

const app     = isConfigured ? (getApps().length ? getApps()[0] : initializeApp(firebaseConfig)) : null;
export const auth    = isConfigured ? getAuth(app)      : null;
export const db      = isConfigured ? getFirestore(app) : null;
export const storage = isConfigured ? getStorage(app)   : null;
export default app;
