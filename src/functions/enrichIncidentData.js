import { base44 } from '@/api/base44Client';
export const enrichIncidentData = (...args) => base44.functions.invoke('enrichIncidentData', ...args);
