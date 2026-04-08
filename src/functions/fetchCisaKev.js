import { base44 } from '@/api/base44Client';
export const fetchCisaKev = (...args) => base44.functions.invoke('fetchCisaKev', ...args);
