import { base44 } from '@/api/base44Client';
export const generateExternalSummary = (...args) => base44.functions.invoke('generateExternalSummary', ...args);
