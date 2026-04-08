import { base44 } from '@/api/base44Client';
export const generateReportPdf = (...args) => base44.functions.invoke('generateReportPdf', ...args);
