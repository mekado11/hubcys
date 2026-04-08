/**
 * Firestore entity factory.
 *
 * Mirrors the Base44 entity API so every existing page works without changes:
 *   Entity.list(sortField?, limit?)               → all docs in collection
 *   Entity.filter(conditions, sortField?, limit?) → filtered docs
 *   Entity.get(id)                                → single doc by ID
 *   Entity.create(data)                           → add new doc
 *   Entity.update(id, data)                       → partial update
 *   Entity.delete(id)                             → delete doc
 */
import { db } from '@/api/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit as fbLimit,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

/** CamelCase → snake_case for Firestore collection names */
function toCollectionName(name) {
  return name.replace(/([A-Z])/g, (m, letter, offset) =>
    offset === 0 ? letter.toLowerCase() : '_' + letter.toLowerCase()
  );
}

/** Parse "-field" → { field, dir } */
function parseSortField(raw = '-created_date') {
  const desc = raw.startsWith('-');
  return { field: raw.replace(/^-/, ''), dir: desc ? 'desc' : 'asc' };
}

function docToObj(snap) {
  return { id: snap.id, ...snap.data() };
}

export function createEntity(entityName) {
  const collName = toCollectionName(entityName);
  const colRef = () => collection(db, collName);

  return {
    async list(sortField = '-created_date', maxItems = 200) {
      const { field, dir } = parseSortField(sortField);
      const q = query(colRef(), orderBy(field, dir), fbLimit(maxItems));
      const snap = await getDocs(q);
      return snap.docs.map(docToObj);
    },

    async filter(conditions = {}, sortField = '-created_date', maxItems = 200) {
      const { field, dir } = parseSortField(sortField);
      const constraints = Object.entries(conditions).map(([k, v]) => where(k, '==', v));
      constraints.push(orderBy(field, dir));
      constraints.push(fbLimit(maxItems));
      const q = query(colRef(), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map(docToObj);
    },

    async get(id) {
      const snap = await getDoc(doc(db, collName, id));
      if (!snap.exists()) return null;
      return docToObj(snap);
    },

    async create(data) {
      const payload = { ...data, created_date: serverTimestamp(), updated_date: serverTimestamp() };
      const ref = await addDoc(colRef(), payload);
      return { id: ref.id, ...data };
    },

    async update(id, data) {
      await updateDoc(doc(db, collName, id), { ...data, updated_date: serverTimestamp() });
      return { id, ...data };
    },

    async delete(id) {
      await deleteDoc(doc(db, collName, id));
      return { id };
    },
  };
}
