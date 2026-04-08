import { base44 } from '@/api/base44Client';
export const runBackendHealthcheck = (...args) => base44.functions.invoke('runBackendHealthcheck', ...args);
