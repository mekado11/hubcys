/**
 * runBackendHealthcheck — tests Firebase Auth + Firestore read/write/delete.
 * Writes a temporary doc to each collection, verifies it, then deletes it.
 * Leaves no residual data.
 */
import { auth, db } from '@/api/firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

const WRITE_COLLECTIONS = [
  { name: 'Assessments',  col: 'assessments' },
  { name: 'Action Items', col: 'action_items' },
  { name: 'Incidents',    col: 'incidents' },
];

export const runBackendHealthcheck = async () => {
  if (!auth || !db) throw new Error('Firebase is not configured.');

  const firebaseUser = auth.currentUser;
  if (!firebaseUser) throw new Error('Not authenticated — please log in first.');

  // Fetch the caller's user document to get company_id — required for sameCompany() rules.
  const userDocRef = doc(db, 'users', firebaseUser.uid);
  const userDocSnap = await getDoc(userDocRef);
  if (!userDocSnap.exists()) {
    throw new Error('User profile document not found in Firestore. Cannot determine company_id.');
  }
  const { company_id } = userDocSnap.data();
  if (!company_id) {
    throw new Error('User profile is missing company_id. Cannot run healthcheck.');
  }

  const startedAt = new Date().toISOString();
  const results = [];

  // ── Users: read-only test (create rules require uid() == userId path, not addDoc) ──
  {
    const t0 = Date.now();
    let read = false;
    let error = null;
    try {
      const snap = await getDoc(userDocRef);
      read = snap.exists();
    } catch (e) {
      error = e.message;
    }
    results.push({
      entity: 'Users (read)',
      created: null,
      updated: null,
      read,
      deleted: null,
      error,
      duration_ms: Date.now() - t0,
    });
  }

  // ── Write/read/delete tests for company-scoped collections ──
  for (const { name, col } of WRITE_COLLECTIONS) {
    const t0 = Date.now();
    let created = false, updated = false, read = false, deleted = false;
    let error = null;
    let docRef = null;

    try {
      // Create — include company_id so sameCompany() succeeds
      docRef = await addDoc(collection(db, col), {
        _healthcheck: true,
        _uid: firebaseUser.uid,
        company_id,
        created_at: serverTimestamp(),
      });
      created = true;

      // Update
      await updateDoc(docRef, { _updated: true });
      updated = true;

      // Read
      const snap = await getDoc(docRef);
      read = snap.exists();

      // Delete
      await deleteDoc(docRef);
      deleted = true;
    } catch (e) {
      error = e.message;
      if (docRef && !deleted) {
        try { await deleteDoc(docRef); } catch (_) { /* ignore */ }
      }
    }

    results.push({ entity: name, created, updated, read, deleted, error, duration_ms: Date.now() - t0 });
  }

  const finishedAt = new Date().toISOString();
  const ok = results.every(r => !r.error && r.read);

  return {
    data: {
      ok,
      started_at: startedAt,
      finished_at: finishedAt,
      total_duration_ms: new Date(finishedAt) - new Date(startedAt),
      results,
      user: {
        email: firebaseUser.email,
        company_id,
        company_role: userDocSnap.data().company_role ?? 'unknown',
      },
    },
  };
};
