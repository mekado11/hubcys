import { base44 } from '@/api/base44Client';
export const generateQuestionnairePdf = (...args) => base44.functions.invoke('generateQuestionnairePdf', ...args);
