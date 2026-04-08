import { base44 } from '@/api/base44Client';
export const analyzeIocs = (...args) => base44.functions.invoke('analyzeIocs', ...args);
