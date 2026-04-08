import { base44 } from '@/api/base44Client';
export const suggestIncidentClassification = (...args) => base44.functions.invoke('suggestIncidentClassification', ...args);
