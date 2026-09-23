import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export class ServerConfigurationError extends Error {
  constructor() { super('Server identity configuration unavailable'); this.code = 'server/configuration'; }
}

export function validateServerEnvironment(env = process.env) {
  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId || !/^[a-z][a-z0-9-]{4,62}$/.test(projectId)) throw new ServerConfigurationError();
  const emulatorHosts = [env.FIREBASE_AUTH_EMULATOR_HOST, env.FIRESTORE_EMULATOR_HOST].filter(Boolean);
  if (emulatorHosts.length) {
    if (env.NODE_ENV !== 'test' || env.VERCEL || !projectId.startsWith('demo-') ||
        emulatorHosts.some(host => !/^(127\.0\.0\.1|localhost):\d{2,5}$/.test(host))) {
      throw new ServerConfigurationError();
    }
  }
  return projectId;
}

export function getServerApp() {
  const projectId = validateServerEnvironment();
  const name = `hubcys-server-${projectId}`;
  return getApps().find(app => app.name === name) || initializeApp({
    projectId,
    // Deploy with a server-only workload identity / application credentials.
    // Never use VITE_ configuration or accept credentials in a request.
    credential: applicationDefault(),
  }, name);
}

export function getServerAuth() { return getAuth(getServerApp()); }
export function getServerFirestore() { return getFirestore(getServerApp()); }
