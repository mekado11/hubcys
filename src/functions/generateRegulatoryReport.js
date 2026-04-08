import { base44 } from '@/api/base44Client';
export const generateRegulatoryReport = (...args) => base44.functions.invoke('generateRegulatoryReport', ...args);
