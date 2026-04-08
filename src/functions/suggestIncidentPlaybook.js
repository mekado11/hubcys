import { base44 } from '@/api/base44Client';
export const suggestIncidentPlaybook = (...args) => base44.functions.invoke('suggestIncidentPlaybook', ...args);
