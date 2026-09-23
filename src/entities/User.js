import { auth, db } from '@/api/firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signOut,
  getIdTokenResult,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { createEntity } from './_entity.js';

const _userEntity = createEntity('users');

// In-memory cache so every component can call User.me() without a Firestore
// round-trip on each render. Invalidated on update/logout or after 2 minutes.
let _cachedUser = null;
let _cacheTs = 0;
const CACHE_TTL_MS = 120_000;

function _invalidateCache() {
  _cachedUser = null;
  _cacheTs = 0;
}

function _setCache(user) {
  _cachedUser = user;
  _cacheTs = Date.now();
}

/** Fetch the Firestore user profile merged with Firebase Auth identity */
async function fetchMe() {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) throw new Error('Not authenticated');

  const userRef = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(userRef);
  const token = await getIdTokenResult(firebaseUser);
  const superAdmin = token.claims.is_super_admin === true;

  if (!snap.exists()) {
    // Browser clients can create only an ordinary profile. Operator-managed
    // custom claims and server-side provisioning establish super-admin access.
    const defaults = {
      email: firebaseUser.email,
      full_name: firebaseUser.displayName || firebaseUser.email,
      approval_status: 'approved',
      company_onboarding_completed: false,
      disclaimer_acknowledged: false,
      subscription_tier: 'free_trial',
      company_role: 'admin',
      is_super_admin: false,
      created_date: serverTimestamp(),
      updated_date: serverTimestamp(),
    };
    await setDoc(userRef, defaults);
    const result = { id: firebaseUser.uid, ...defaults, is_super_admin: superAdmin };
    _setCache(result);
    return result;
  }

  const data = snap.data();

  // Never derive effective authority from the editable profile document.
  const result = { ...data, id: firebaseUser.uid, email: firebaseUser.email, is_super_admin: superAdmin };
  _setCache(result);
  return result;
}

export const User = {
  /** Returns the current user's full profile (Firebase Auth + Firestore).
   *  Results are cached for 2 minutes — call User.me({ force: true }) to bypass. */
  async me({ force = false } = {}) {
    if (!force && _cachedUser && Date.now() - _cacheTs < CACHE_TTL_MS) {
      return _cachedUser;
    }
    return fetchMe();
  },

  /**
   * Sign in with Google (popup).
   * returnUrl is stored so AuthContext can redirect after sign-in.
   */
  async loginWithRedirect(returnUrl) {
    if (returnUrl) sessionStorage.setItem('hubcys_return_url', returnUrl);
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  },

  /** Email + password sign-in */
  async loginWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  },

  /** Email + password sign-up */
  async registerWithEmail(email, password, fullName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const userRef = doc(db, 'users', cred.user.uid);
    await setDoc(userRef, {
      email,
      full_name: fullName || email,
      approval_status: 'approved',
      company_onboarding_completed: false,
      disclaimer_acknowledged: false,
      subscription_tier: 'free_trial',
      company_role: 'admin',
      is_super_admin: false,
      created_date: serverTimestamp(),
      updated_date: serverTimestamp(),
    });
    _invalidateCache();
    return cred;
  },

  /** Sign out */
  async logout() {
    _invalidateCache();
    await signOut(auth);
    window.location.href = '/';
  },

  /** Update the current user's Firestore profile */
  async updateMyUserData(data) {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('Not authenticated');
    const userRef = doc(db, 'users', firebaseUser.uid);
    await updateDoc(userRef, { ...data, updated_date: serverTimestamp() });
    // Merge update into cache so next me() call reflects it without a re-fetch
    if (_cachedUser) {
      _setCache({ ..._cachedUser, ...data });
    }
    return data;
  },

  // Expose Firestore entity methods for admin use (filter/list users, etc.)
  ..._userEntity,
};
