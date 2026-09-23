export class WorkspaceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function createReadinessClient(getToken, fetcher = fetch) {
  const read = async (query, signal) => {
    const token = await getToken();
    if (!token)
      throw new WorkspaceError(
        401,
        "Sign in to open your readiness workspace.",
      );
    const response = await fetcher(
      `/api/v2/readiness?${new URLSearchParams(query)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal,
      },
    );
    if (!response.ok) {
      const messages = {
        401: "Your session has expired. Sign in again to continue.",
        403: "Your current role or exercise assignment does not permit this view.",
        404: "The V2 workspace is not enabled for this environment yet.",
        409: "This evidence chain cannot be displayed completely. No score has been inferred.",
      };
      throw new WorkspaceError(
        response.status,
        messages[response.status] ||
          "The workspace could not be loaded. Retry without changing your data.",
      );
    }
    const body = await response.json();
    if (!body.data)
      throw new WorkspaceError(
        503,
        "The workspace returned an incomplete response.",
      );
    return body.data;
  };
  return {
    setup: (org, signal) => read({ view: 'setup', organization_id: org }, signal),
    workspace: async (org, exercise, signal) => {
      const token = await getToken();
      if (!token) throw new WorkspaceError(401, 'Sign in to continue.');
      const response = await fetcher(`/api/v2/exercise?${new URLSearchParams({ organization_id: org, exercise_id: exercise })}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal,
      });
      const body = await response.json();
      if (!response.ok) throw new WorkspaceError(response.status, response.status === 403 ? 'Your assignment does not permit this exercise.' : 'The exercise could not be loaded. Retry.');
      return body.data;
    },
    command: async command => {
      const token = await getToken();
      if (!token) throw new WorkspaceError(401, 'Sign in to continue.');
      const response = await fetcher('/api/v2/commands', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        cache: 'no-store', body: JSON.stringify(command),
      });
      const body = await response.json();
      if (!response.ok) throw new WorkspaceError(response.status, response.status === 409
        ? 'The exercise state changed or this operation is not valid. Refresh and review before trying again.'
        : response.status === 403 ? 'Your current role or assignment does not permit this action.' : 'The action was not confirmed. Retry the same action to check its receipt.');
      return body.data;
    },
    context: (signal) => read({ view: "context" }, signal),
    index: (org, signal) =>
      read({ view: "index", organization_id: org }, signal),
    evidence: (org, exercise, signal) =>
      read(
        { view: "evidence", organization_id: org, exercise_id: exercise },
        signal,
      ),
  };
}
