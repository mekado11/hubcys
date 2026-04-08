import { base44 } from '@/api/base44Client';
export const surfaceExposureRecon = (...args) => base44.functions.invoke('surfaceExposureRecon', ...args);
