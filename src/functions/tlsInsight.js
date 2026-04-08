import { base44 } from '@/api/base44Client';
export const tlsInsight = (...args) => base44.functions.invoke('tlsInsight', ...args);
