import { base44 } from '@/api/base44Client';
export const cveSearch = (...args) => base44.functions.invoke('cveSearch', ...args);
