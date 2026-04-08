import { base44 } from '@/api/base44Client';
export const webScanner = (...args) => base44.functions.invoke('webScanner', ...args);
