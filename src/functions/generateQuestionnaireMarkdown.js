import { base44 } from '@/api/base44Client';
export const generateQuestionnaireMarkdown = (...args) => base44.functions.invoke('generateQuestionnaireMarkdown', ...args);
