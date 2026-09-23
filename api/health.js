/**
 * GET /api/health — operator-only server configuration check.
 *
 * Disabled (404) unless HEALTH_CHECK_SECRET is set; callers must send it in the
 * `x-hubcys-health-secret` header. Reports booleans and sanitized error codes only:
 * no tokens, credentials, user records or document contents are returned.
 */
import crypto from 'node:crypto';
import { getServerAuth, getServerFirestore, validateServerEnvironment } from '../server/security/firebase.js';
import { syncWorkloadIdentity } from '../server/security/workload-identity.js';

const PROBE_UID = 'hubcys-health-probe';
const PROBE_DOC = 'organizations/hubcys-health-probe';

function secretMatches(expected, supplied) {
  if (typeof supplied !== 'string' || !supplied) return false;
  const a = crypto.createHash('sha256').update(expected).digest();
  const b = crypto.createHash('sha256').update(supplied).digest();
  return crypto.timingSafeEqual(a, b);
}

function safeCode(error) {
  const code = error?.code;
  if (typeof code === 'number') return `grpc/${code}`;
  return typeof code === 'string' && /^[a-z0-9/_-]{1,64}$/i.test(code) ? code : 'error';
}

// Dependency injection is internal test composition, never request configuration.
export function createHealthHandler({
  env = process.env, getAuth = getServerAuth, getFirestore = getServerFirestore,
  syncCredentials = syncWorkloadIdentity,
} = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    const expected = env.HEALTH_CHECK_SECRET;
    if (!expected || expected.length < 32) return res.status(404).json({ error: 'Not found' });
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (!secretMatches(expected, req.headers?.['x-hubcys-health-secret'])) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const report = {
      project_configured: false, credential_mode: 'unconfigured',
      auth_admin: { ok: false }, firestore: { ok: false },
      v2_server_enabled: env.HUBCYS_V2_ENABLED === 'true',
    };
    try {
      validateServerEnvironment(env);
      report.project_configured = true;
      report.credential_mode = syncCredentials({ headers: req.headers, env });
    } catch (error) {
      report.credential_mode = 'invalid';
      report.error = safeCode(error);
      return res.status(503).json(report);
    }

    try {
      await getAuth().getUser(PROBE_UID);
      report.auth_admin = { ok: true };
    } catch (error) {
      // A missing probe user proves the credential reached the Auth admin API.
      report.auth_admin = error?.code === 'auth/user-not-found' ? { ok: true } : { ok: false, error: safeCode(error) };
    }
    try {
      await getFirestore().doc(PROBE_DOC).get();
      report.firestore = { ok: true };
    } catch (error) {
      report.firestore = { ok: false, error: safeCode(error) };
    }
    const healthy = report.auth_admin.ok && report.firestore.ok;
    return res.status(healthy ? 200 : 503).json(report);
  };
}

export default createHealthHandler();
