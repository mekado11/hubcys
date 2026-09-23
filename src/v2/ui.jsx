import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, AlertCircle, RefreshCw } from "lucide-react";

export const label = (value) =>
  (value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
export const date = (value) =>
  value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }).format(new Date(value)) + " UTC"
    : "Not recorded";
export const threats = [
  "ransomware",
  "business_email_compromise",
  "identity_compromise",
  "cloud_compromise",
  "data_exfiltration",
  "insider_threat",
  "supply_chain_compromise",
  "oauth_device_code_compromise",
  "credential_compromise",
  "privileged_account_compromise",
  "third_party_compromise",
  "destructive_malware",
];
export function Badge({ children, tone = "" }) {
  return <span className={`v2-badge ${tone}`}>{children}</span>;
}
export function PageHeader({ eyebrow, title, description, children }) {
  const heading = useRef(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    document.title = `${title} | HubCyS`;
  }, [title]);
  return (
    <header className="v2-page-header">
      <div>
        <p className="v2-eyebrow">{eyebrow}</p>
        <h1 ref={heading} tabIndex="-1">
          {title}
        </h1>
        <p className="v2-muted">{description}</p>
      </div>
      {children}
    </header>
  );
}
export function Empty({ title, children }) {
  return (
    <div className="v2-empty">
      <h2>{title}</h2>
      <div className="v2-muted">{children}</div>
    </div>
  );
}
export function LegacyLink({ to, children }) {
  return (
    <Link className="v2-text-link" to={`/${to}`}>
      {children}
      <ArrowUpRight size={16} aria-hidden="true" />
    </Link>
  );
}
export function Loading() {
  return (
    <div role="status" aria-label="Loading workspace" className="v2-loading">
      <span className="v2-skeleton" />
      <span className="v2-skeleton" />
      <span className="v2-skeleton" />
      <span className="v2-sr">Loading workspace</span>
    </div>
  );
}
export function Failure({ error, retry }) {
  return (
    <section className="v2-error" role="alert">
      <AlertCircle size={24} aria-hidden="true" />
      <div>
        <h2>
          {error.status === 403
            ? "Access restricted"
            : error.status === 404
              ? "Workspace not enabled"
              : "Unable to load workspace"}
        </h2>
        <p>{error.message}</p>
        <div className="v2-inline">
          {error.status === 401 ? (
            <Link className="v2-button" to="/Login">
              Sign in
            </Link>
          ) : (
            <button className="v2-button secondary" onClick={retry}>
              <RefreshCw size={16} />
              Retry
            </button>
          )}
          <LegacyLink to="ResponseReadiness">
            Existing command center
          </LegacyLink>
        </div>
      </div>
    </section>
  );
}
export function useResource(key, loader) {
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState({ key: null, loading: true });
  useEffect(() => {
    const controller = new AbortController();
    setState({ key, loading: true });
    if (!key) {
      setState({ key, loading: false });
      return () => controller.abort();
    }
    loader(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ key, loading: false, data });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ key, loading: false, error });
      });
    return () => controller.abort();
    // key defines request identity; callers include organization and record ID.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, retry]);
  return {
    ...(state.key === key ? state : { loading: true }),
    refresh: () => setRetry((value) => value + 1),
  };
}
