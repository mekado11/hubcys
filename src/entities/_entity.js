/**
 * Entity proxy factory — mirrors the @base44/vite-plugin/compat/entities.cjs
 * pattern so that builds work without BASE44_LEGACY_SDK_IMPORTS=true.
 */
import { base44 } from '@/api/base44Client';

export function createEntity(name) {
  return new Proxy(
    {},
    {
      get(_, prop) {
        const store = base44?.entities?.[name];
        if (!store) return () => Promise.reject(new Error(`Entity "${name}" not available`));
        return store[prop];
      }
    }
  );
}
