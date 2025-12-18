import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

async function runProbe(name, ops) {
  const t0 = Date.now();
  const result = {
    entity: name,
    created: false,
    updated: false,
    read: false,
    deleted: false,
    duration_ms: 0,
    error: null,
    id: null,
  };
  try {
    // CREATE
    const created = await ops.create();
    result.created = !!created?.id;
    result.id = created?.id || null;

    // UPDATE
    if (result.id) {
      const updated = await ops.update(result.id);
      result.updated = !!updated?.id;
    }

    // READ/GET
    if (result.id) {
      const fetched = await ops.read(result.id);
      result.read = !!fetched?.id;
    }

    // DELETE
    if (result.id) {
      await ops.delete(result.id);
      result.deleted = true;
    }
  } catch (e) {
    result.error = e?.message || String(e);
  } finally {
    result.duration_ms = Date.now() - t0;
  }
  return result;
}

Deno.serve(async (req) => {
  const startedAt = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Restrict to admins to avoid noise in prod data
    if (user.company_role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    const companyId = user.company_id;
    const email = user.email || 'unknown@user';

    // Probes for key entities (only required fields + safe defaults)
    const assessmentProbe = () =>
      runProbe('Assessment', {
        create: async () => {
          return await base44.entities.Assessment.create({
            company_id: companyId,
            company_name: user.company_name || 'Healthcheck Co',
            company_website: 'https://healthcheck.example.com',
            framework: 'NIST_CSF',
            status: 'draft',
            security_compliance_goals: '[healthcheck] probe',
          });
        },
        update: async (id) => {
          return await base44.entities.Assessment.update(id, {
            status: 'draft',
            company_id: companyId,
            company_name: user.company_name || 'Healthcheck Co',
            company_website: 'https://healthcheck.example.com',
            framework: 'NIST_CSF',
            previous_gap_analysis_details: 'updated during probe',
          });
        },
        read: async (id) => {
          return await base44.entities.Assessment.get(id);
        },
        delete: async (id) => {
          return await base44.entities.Assessment.delete(id);
        },
      });

    const incidentProbe = () =>
      runProbe('Incident', {
        create: async () => {
          return await base44.entities.Incident.create({
            company_id: companyId,
            title: '[healthcheck] probe incident',
            status: 'Detected',
            priority: 'Medium',
            reporter_email: email,
          });
        },
        update: async (id) => {
          return await base44.entities.Incident.update(id, {
            company_id: companyId,
            status: 'Triaged',
            priority: 'High',
          });
        },
        read: async (id) => {
          return await base44.entities.Incident.get(id);
        },
        delete: async (id) => {
          return await base44.entities.Incident.delete(id);
        },
      });

    const actionItemProbe = () =>
      runProbe('ActionItem', {
        create: async () => {
          return await base44.entities.ActionItem.create({
            company_id: companyId,
            title: '[healthcheck] probe action item',
            category: '30_day',
            priority: 'medium',
          });
        },
        update: async (id) => {
          return await base44.entities.ActionItem.update(id, {
            company_id: companyId,
            status: 'in_progress',
            priority: 'high',
            notes: 'updated during probe',
          });
        },
        read: async (id) => {
          return await base44.entities.ActionItem.get(id);
        },
        delete: async (id) => {
          return await base44.entities.ActionItem.delete(id);
        },
      });

    const tabletopProbe = () =>
      runProbe('TabletopExercise', {
        create: async () => {
          return await base44.entities.TabletopExercise.create({
            company_id: companyId,
            exercise_name: '[healthcheck] probe tabletop',
            facilitator_email: email,
            status: 'Planning',
          });
        },
        update: async (id) => {
          return await base44.entities.TabletopExercise.update(id, {
            company_id: companyId,
            status: 'Ready_to_Execute',
          });
        },
        read: async (id) => {
          return await base44.entities.TabletopExercise.get(id);
        },
        delete: async (id) => {
          return await base44.entities.TabletopExercise.delete(id);
        },
      });

    // Execute probes sequentially to minimize noise
    const results = [];
    results.push(await assessmentProbe());
    results.push(await incidentProbe());
    results.push(await actionItemProbe());
    results.push(await tabletopProbe());

    const ok = results.every(r => r.created && r.updated && r.read && r.deleted && !r.error);

    return Response.json({
      ok,
      started_at: new Date(startedAt).toISOString(),
      finished_at: new Date().toISOString(),
      total_duration_ms: Date.now() - startedAt,
      user: { email, company_id: companyId, company_role: user.company_role },
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});