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
      const whereConstraints = Object.entries(conditions)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => where(k, '==', v));

      // Firestore requires a composite index for where+orderBy on different fields.
      // To avoid that infra requirement, fetch with where constraints only and sort client-side.
      const constraints = [...whereConstraints, fbLimit(maxItems)];
      if (whereConstraints.length === 0) {
        // No where clauses — safe to add orderBy server-side
        constraints.splice(0, 0, orderBy(field, dir));
        constraints.pop(); // remove the extra limit
        constraints.push(fbLimit(maxItems));
      }

      const q = query(colRef(), ...constraints);
      const snap = await getDocs(q);
      const docs = snap.docs.map(docToObj);

      // Client-side sort when where constraints are present
      if (whereConstraints.length > 0) {
        docs.sort((a, b) => {
          const av = a[field], bv = b[field];
          if (av == null && bv == null) return 0;
          if (av == null) return dir === 'desc' ? 1 : -1;
          if (bv == null) return dir === 'desc' ? -1 : 1;
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return dir === 'desc' ? -cmp : cmp;
        });
        return docs.slice(0, maxItems);
      }

      return docs;
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
