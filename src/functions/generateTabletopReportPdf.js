import { base44 } from '@/api/base44Client';
export const generateTabletopReportPdf = (...args) => base44.functions.invoke('generateTabletopReportPdf', ...args);
