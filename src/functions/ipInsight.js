import { base44 } from '@/api/base44Client';
export const ipInsight = (...args) => base44.functions.invoke('ipInsight', ...args);
