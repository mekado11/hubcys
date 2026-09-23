import type { IncomingMessage, ServerResponse } from "node:http";
import { ZodError } from "zod";
import { requireIdentity } from "../../server/security/identity.js";
import { getServerFirestore } from "../../server/security/firebase.js";
import { AuthorizationError } from "../../server/v2/authorization.js";
import { CommandError } from "../../server/v2/command-service.js";
import {
  getReadinessContext,
  getReadinessIndex,
  getEvidenceDrilldown,
} from "../../server/v2/readiness-query.js";

type Request = IncomingMessage & { query?: Record<string, unknown> };
type Response = ServerResponse & {
  status(code: number): Response;
  json(body: unknown): void;
};
export default async function handler(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  const identity = await requireIdentity(req, res);
  if (!identity) return;
  if (process.env.HUBCYS_V2_ENABLED !== "true")
    return res.status(404).json({ error: "Workspace not enabled" });
  try {
    const query = req.query ?? {};
    const db = getServerFirestore();
    if (query.view === "context")
      return res
        .status(200)
        .json({ data: await getReadinessContext(db, identity.uid) });
    if (typeof query.organization_id !== "string")
      return res.status(400).json({ error: "Organization required" });
    if (query.view === "evidence" && typeof query.exercise_id === "string") {
      return res
        .status(200)
        .json({
          data: await getEvidenceDrilldown(
            db,
            identity.uid,
            query.organization_id,
            query.exercise_id,
          ),
        });
    }
    if (query.view !== "index")
      return res.status(400).json({ error: "Invalid view" });
    return res
      .status(200)
      .json({
        data: await getReadinessIndex(db, identity.uid, query.organization_id),
      });
  } catch (error) {
    if (error instanceof AuthorizationError)
      return res.status(403).json({ error: "Access not permitted" });
    if (error instanceof ZodError)
      return res.status(400).json({ error: "Invalid record or query" });
    if (error instanceof CommandError)
      return res.status(error.status).json({ error: error.code });
    return res.status(503).json({ error: "Evidence workspace unavailable" });
  }
}
