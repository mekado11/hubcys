/**
 * runBackendHealthcheck — tests Firebase Auth + Firestore read/write/delete.
 * Writes a temporary doc to each collection, verifies it, then deletes it.
 * Leaves no residual data.
 */
import { auth, db } from '@/api/firebase';
import {
  collection,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

const TEST_COLLECTIONS = [
  { name: 'Assessments',  col: 'assessments' },
  { name: 'Action Items', col: 'action_items' },
  { name: 'Incidents',    col: 'incidents' },
  { name: 'Users (read)', col: 'users' },
];

export const runBackendHealthcheck = async () => {
  if (!auth || !db) throw new Error('Firebase is not configured.');

  const firebaseUser = auth.currentUser;
  if (!firebaseUser) throw new Error('Not authenticated — please log in first.');

  const startedAt = new Date().toISOString();
  const results = [];

  for (const { name, col } of TEST_COLLECTIONS) {
    const t0 = Date.now();
    let created = false, updated = false, read = false, deleted = false;
    let error = null;
    let docRef = null;

    try {
      // Create
      docRef = await addDoc(collection(db, col), {
        _healthcheck: true,
        _uid: firebaseUser.uid,
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
      // Best-effort cleanup
      if (docRef && !deleted) {
        try { await deleteDoc(docRef); } catch (_) { /* ignore */ }
      }
    }

    results.push({ entity: name, created, updated, read, deleted, error, duration_ms: Date.now() - t0 });
  }

  const finishedAt = new Date().toISOString();
  const ok = results.every(r => !r.error && r.created && r.updated && r.read && r.deleted);

  return {
    data: {
      ok,
      started_at: startedAt,
      finished_at: finishedAt,
      total_duration_ms: new Date(finishedAt) - new Date(startedAt),
      results,
      user: {
        email: firebaseUser.email,
        company_id: firebaseUser.uid,
        company_role: 'checked via Firebase Auth',
      },
    },
  };
};
