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

const _userEntity = createEntity('users');

// NOTE: VITE_ variables are bundled into the client JS. Keep this value non-sensitive
// (e.g. set it to an opaque role ID in future). The email itself is used only to
// bootstrap the super-admin Firestore document on first login; Firestore Security Rules
// and the is_super_admin flag are the real enforcement layer.
const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL?.toLowerCase().trim();

function isSuperAdminEmail(email) {
  if (!SUPER_ADMIN_EMAIL || !email) return false;
  return email.toLowerCase().trim() === SUPER_ADMIN_EMAIL;
}

const SUPER_ADMIN_DEFAULTS = {
  approval_status: 'approved',
  company_onboarding_completed: true,
  disclaimer_acknowledged: true,
  subscription_tier: 'enterprise',
  company_role: 'super_admin',
  is_super_admin: true,
};

/** Fetch the Firestore user profile merged with Firebase Auth identity */
async function fetchMe() {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) throw new Error('Not authenticated');

  const userRef = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(userRef);

  // Super admin: email must be verified (prevents account takeover via unverified email registration)
  const superAdmin = isSuperAdminEmail(firebaseUser.email) && firebaseUser.emailVerified !== false;

  // Super admins use their own UID as their company_id (virtual single-org account).
  // This ensures they can create/read company-scoped documents without going through
  // the multi-tenant company onboarding flow.
  const superAdminCompanyId = firebaseUser.uid;

  if (!snap.exists()) {
    // First login — bootstrap the user document
    const defaults = superAdmin
      ? {
          email: firebaseUser.email,
          full_name: firebaseUser.displayName || firebaseUser.email,
          company_id: superAdminCompanyId,
          ...SUPER_ADMIN_DEFAULTS,
          created_date: serverTimestamp(),
          updated_date: serverTimestamp(),
        }
      : {
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
    return { id: firebaseUser.uid, ...defaults };
  }

  const data = snap.data();

  // Ensure existing super admin doc always has the right flags (in case email was set later)
  // Also backfill company_id for super admins who were bootstrapped before this fix.
  if (superAdmin && (!data.is_super_admin || !data.company_id)) {
    const patch = {
      ...SUPER_ADMIN_DEFAULTS,
      company_id: data.company_id || superAdminCompanyId,
      updated_date: serverTimestamp(),
    };
    await updateDoc(userRef, patch);
    return { id: firebaseUser.uid, ...data, ...patch };
  }

  // Backfill company_id for any user who completed onboarding or has is_super_admin
  // but somehow ended up without a company_id (e.g. bootstrapped before this fix,
  // or VITE_SUPER_ADMIN_EMAIL env var was not set when the account was created).
  if (!data.company_id && (data.is_super_admin || data.company_onboarding_completed)) {
    const fallbackCompanyId = firebaseUser.uid;
    await updateDoc(userRef, { company_id: fallbackCompanyId, updated_date: serverTimestamp() });
    return { id: firebaseUser.uid, ...data, company_id: fallbackCompanyId };
  }

  return { id: firebaseUser.uid, ...data };
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
    const userRef = doc(db, 'users', cred.user.uid);
    const superAdmin = isSuperAdminEmail(email);
    await setDoc(userRef, superAdmin
      ? {
          email,
          full_name: fullName || email,
          company_id: cred.user.uid,
          ...SUPER_ADMIN_DEFAULTS,
          created_date: serverTimestamp(),
          updated_date: serverTimestamp(),
        }
      : {
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
        }
    );
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
