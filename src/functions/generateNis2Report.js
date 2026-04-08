import { base44 } from '@/api/base44Client';
export const generateNis2Report = (...args) => base44.functions.invoke('generateNis2Report', ...args);
