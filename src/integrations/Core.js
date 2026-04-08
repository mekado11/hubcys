/**
 * Core integrations — Firebase Storage + AI stubs.
 * Wire in Anthropic API when keys are available.
 */
import { storage } from '@/api/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/** Upload a file to Firebase Storage, return { file_url } */
export const UploadFile = async ({ file }) => {
  if (!file) throw new Error('UploadFile: no file provided');
  const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  return { file_url: url };
};

/** InvokeLLM — stub until Anthropic API is wired in */
export const InvokeLLM = async () => {
  throw new Error('AI features require an Anthropic API key — not yet configured.');
};

/** ExtractDataFromUploadedFile — stub until AI is wired in */
export const ExtractDataFromUploadedFile = async () => {
  throw new Error('AI features require an Anthropic API key — not yet configured.');
};
