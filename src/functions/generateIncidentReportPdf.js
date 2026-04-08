import { base44 } from '@/api/base44Client';
export const generateIncidentReportPdf = (...args) => base44.functions.invoke('generateIncidentReportPdf', ...args);
