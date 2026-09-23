// Intentionally refuses real project IDs, remote hosts and deployed execution.
const env = process.env;
if (env.VERCEL || env.GCLOUD_PROJECT !== 'demo-hubcys-v2' ||
    !/^(127\.0\.0\.1|localhost):9099$/.test(env.FIREBASE_AUTH_EMULATOR_HOST || '') ||
    !/^(127\.0\.0\.1|localhost):8080$/.test(env.FIRESTORE_EMULATOR_HOST || '')) {
  throw new Error('Tests require the isolated demo-hubcys-v2 Auth/Firestore emulators');
}
