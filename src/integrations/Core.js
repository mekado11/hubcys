import { base44 } from '@/api/base44Client';

export const UploadFile              = (...args) => base44.integrations.Core.UploadFile(...args);
export const InvokeLLM               = (...args) => base44.integrations.Core.InvokeLLM(...args);
export const ExtractDataFromUploadedFile = (...args) => base44.integrations.Core.ExtractDataFromUploadedFile(...args);
