import type { IncomingMessage, ServerResponse } from 'node:http';
import { ZodError } from 'zod';
import { getServerFirestore } from '../../server/security/firebase.js';
import { requireIdentity } from '../../server/security/identity.js';
import { getExerciseWorkspace } from '../../server/v2/workspace-query.js';
import { AuthorizationError } from '../../server/v2/authorization.js';
import { CommandError } from '../../server/v2/command-service.js';

type Request = IncomingMessage & { query?: Record<string, unknown> };
type Response = ServerResponse & { status(code: number): Response; json(body: unknown): void };

export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const identity = await requireIdentity(req, res);
  if (!identity) return;
  if (process.env.HUBCYS_V2_ENABLED !== 'true') return res.status(404).json({ error: 'Not found' });
  try {
    const org = req.query?.organization_id;
    const exercise = req.query?.exercise_id;
    if (typeof org !== 'string' || typeof exercise !== 'string') return res.status(400).json({ error: 'Invalid query' });
    const data = await getExerciseWorkspace(getServerFirestore(), identity.uid, org, exercise);
    return res.status(200).json({ data });
  } catch (error) {
    if (error instanceof AuthorizationError) return res.status(403).json({ error: 'Forbidden' });
    if (error instanceof ZodError) return res.status(400).json({ error: 'Invalid query' });
    if (error instanceof CommandError) return res.status(error.status).json({ error: error.code });
    return res.status(503).json({ error: 'Workspace unavailable' });
  }
}
