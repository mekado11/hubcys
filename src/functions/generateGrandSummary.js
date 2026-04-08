import { base44 } from '@/api/base44Client';
export const generateGrandSummary = (...args) => base44.functions.invoke('generateGrandSummary', ...args);
