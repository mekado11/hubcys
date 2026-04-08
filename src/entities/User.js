import { auth, db } from '@/api/firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { createEntity } from './_entity.js';

const _userEntity = createEntity('User');

/** Fetch the Firestore user profile merged with Firebase Auth identity */
async function fetchMe() {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) throw new Error('Not authenticated');

  const userRef = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    // First login — bootstrap the user document
    const defaults = {
      email: firebaseUser.email,
      full_name: firebaseUser.displayName || firebaseUser.email,
      approval_status: 'approved',           // Auto-approve on Firebase (no review queue needed unless you want one)
      company_onboarding_completed: false,
      disclaimer_acknowledged: false,
      subscription_tier: 'free_trial',
      company_role: 'admin',
      created_date: serverTimestamp(),
      updated_date: serverTimestamp(),
    };
    await setDoc(userRef, defaults);
    return { id: firebaseUser.uid, ...defaults };
  }

  return { id: firebaseUser.uid, ...snap.data() };
}

export const User = {
  /** Returns the current user's full profile (Firebase Auth + Firestore) */
  async me() {
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
    // Create Firestore profile immediately
    const userRef = doc(db, 'users', cred.user.uid);
    await setDoc(userRef, {
      email,
      full_name: fullName || email,
      approval_status: 'approved',
      company_onboarding_completed: false,
      disclaimer_acknowledged: false,
      subscription_tier: 'free_trial',
      company_role: 'admin',
      created_date: serverTimestamp(),
      updated_date: serverTimestamp(),
    });
    return cred;
  },

  /** Sign out */
  async logout() {
    await signOut(auth);
    window.location.href = '/';
  },

  /** Update the current user's Firestore profile */
  async updateMyUserData(data) {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('Not authenticated');
    const userRef = doc(db, 'users', firebaseUser.uid);
    await updateDoc(userRef, { ...data, updated_date: serverTimestamp() });
    return data;
  },

  // Expose Firestore entity methods for admin use (filter/list users, etc.)
  ..._userEntity,
};
