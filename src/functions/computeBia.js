import { base44 } from '@/api/base44Client';
export const computeBia = (...args) => base44.functions.invoke('computeBia', ...args);
