import { base44 } from '@/api/base44Client';
export const generateIncidentActionItems = (...args) => base44.functions.invoke('generateIncidentActionItems', ...args);
