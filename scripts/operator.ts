// HubCyS operator CLI. Dry-run by default; nothing is written without --apply.
//
//   npm run operator -- inspect        --project P (--email E | --uid U)
//   npm run operator -- audit-legacy-admins --project P
//   npm run operator -- grant-operator --project P --uid U [--apply]
//   npm run operator -- revoke-operator --project P --uid U [--apply]
//   npm run operator -- provision-org  --project P --org ID --name N --context TEXT --actor U [--apply]
//   npm run operator -- add-member     --project P --org ID --uid U --roles r1,r2 --actor U [--apply]
//
// Credentials: local Application Default Credentials of a project owner
// (`gcloud auth application-default login`). See docs/v2/activation-runbook.md.
import { parseArgs } from 'node:util';
import { getServerAuth, getServerFirestore, validateServerEnvironment } from '../server/security/firebase.js';
import {
  auditLegacyAdmins, inspectAccount, planMembership, planOperatorClaim, planProvisionOrganization, OperatorError, type Plan,
} from '../server/v2/operator.js';

export async function run(argv: string[], out: (line: string) => void = line => console.log(line)) {
  const [command, ...rest] = argv;
  const { values } = parseArgs({
    args: rest, strict: true,
    options: {
      project: { type: 'string' }, apply: { type: 'boolean', default: false },
      uid: { type: 'string' }, email: { type: 'string' }, org: { type: 'string' }, name: { type: 'string' },
      context: { type: 'string' }, roles: { type: 'string' }, actor: { type: 'string' },
    },
  });
  // Two independent statements of the target project must agree before any read or write.
  const projectId = validateServerEnvironment();
  if (values.project !== projectId) throw new OperatorError('PROJECT_MISMATCH: --project must equal FIREBASE_PROJECT_ID');
  const auth = getServerAuth();
  const db = getServerFirestore();
  const now = new Date().toISOString();
  const need = (key: keyof typeof values) => {
    const value = values[key];
    if (typeof value !== 'string' || !value.trim()) throw new OperatorError(`MISSING_ARGUMENT: --${key}`);
    return value.trim();
  };

  if (command === 'inspect') {
    const report = await inspectAccount(auth, db, values.uid ? { uid: need('uid') } : { email: need('email') });
    out(JSON.stringify({ project: projectId, report }, null, 2));
    return;
  }
  if (command === 'audit-legacy-admins') {
    out(JSON.stringify({ project: projectId, report: await auditLegacyAdmins(auth, db) }, null, 2));
    return;
  }
  let plan: Plan;
  switch (command) {
    case 'grant-operator': plan = await planOperatorClaim(auth, need('uid'), true); break;
    case 'revoke-operator': plan = await planOperatorClaim(auth, need('uid'), false); break;
    case 'provision-org': plan = await planProvisionOrganization(auth, db, {
      organizationId: need('org'), name: need('name'), contextDescription: need('context'), actorUid: need('actor'), now,
    }); break;
    case 'add-member': plan = await planMembership(auth, db, {
      organizationId: need('org'), uid: need('uid'), roles: need('roles').split(',').map(r => r.trim()), actorUid: need('actor'), now,
    }); break;
    default: throw new OperatorError(`UNKNOWN_COMMAND: ${String(command)}`);
  }
  const mode = !plan.changes.length ? 'no-op' : values.apply ? 'applied' : 'dry-run';
  if (values.apply) await plan.apply();
  out(JSON.stringify({ project: projectId, action: plan.action, mode, changes: plan.changes }, null, 2));
  if (mode === 'dry-run') out('Dry run only. Re-run with --apply to write these changes.');
}

if (process.argv[1]?.endsWith('operator.js')) {
  run(process.argv.slice(2)).catch(error => {
    console.error(error instanceof OperatorError ? `Refused: ${error.code}` : `Failed: ${error?.code ?? error?.message ?? 'error'}`);
    process.exitCode = 1;
  });
}
