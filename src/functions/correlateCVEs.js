import { base44 } from '@/api/base44Client';
export const correlateCVEs = (...args) => base44.functions.invoke('correlateCVEs', ...args);
