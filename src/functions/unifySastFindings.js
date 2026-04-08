import { base44 } from '@/api/base44Client';
export const unifySastFindings = (...args) => base44.functions.invoke('unifySastFindings', ...args);
