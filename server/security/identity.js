import { getServerAuth, validateServerEnvironment } from './firebase.js';
import { syncWorkloadIdentity } from './workload-identity.js';

export class IdentityError extends Error {
  constructor(status = 401) {
    super(status === 401 ? 'Unauthorized' : 'Identity service unavailable');
    this.status = status;
  }
}

const invalidCredentialCodes = new Set([
  'auth/argument-error', 'auth/id-token-expired', 'auth/id-token-revoked',
  'auth/invalid-id-token', 'auth/user-disabled', 'auth/user-not-found',
  'auth/tenant-id-mismatch',
]);

export function bearerToken(headers) {
  const header = headers?.authorization;
  if (typeof header !== 'string' || header.length > 16_384) throw new IdentityError();
  const match = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*)$/.exec(header);
  if (!match) throw new IdentityError();
  return match[1];
}

// Dependency injection is internal test composition, never request configuration.
export function createIdentityVerifier({ getAuth, projectId, prepareCredentials = () => {} }) {
  return async headers => {
    const token = bearerToken(headers);
    try {
      // Server credentials are refreshed only after a syntactically valid bearer token is presented.
      prepareCredentials(headers);
      const expectedProject = projectId();
      const decoded = await getAuth().verifyIdToken(token, true);
      if (!decoded.uid || decoded.sub !== decoded.uid ||
          decoded.aud !== expectedProject || decoded.iss !== `https://securetoken.google.com/${expectedProject}`) {
        throw new IdentityError();
      }
      // Do not propagate client profile fields or privileged custom claims.
      return Object.freeze({ uid: decoded.uid, project_id: expectedProject });
    } catch (error) {
      if (error instanceof IdentityError) throw error;
      if (invalidCredentialCodes.has(error?.code)) throw new IdentityError();
      // Missing credentials / upstream outages fail closed, not as authenticated.
      throw new IdentityError(503);
    }
  };
}

export const verifyRequestIdentity = createIdentityVerifier({
  getAuth: getServerAuth,
  projectId: validateServerEnvironment,
  prepareCredentials: headers => syncWorkloadIdentity({ headers }),
});

export async function requireIdentity(req, res) {
  try {
    return await verifyRequestIdentity(req.headers);
  } catch (error) {
    const status = error instanceof IdentityError ? error.status : 503;
    res.setHeader('Cache-Control', 'no-store');
    res.status(status).json({ error: status === 401 ? 'Unauthorized' : 'Identity service unavailable' });
    return null;
  }
}
