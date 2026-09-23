import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "@/api/firebase";
import { useAuth } from "@/lib/AuthContext";
import { createReadinessClient } from "./api-client";
import ReadinessApp from "./ReadinessApp";
import { Empty, Loading } from "./ui";

const client = createReadinessClient(() => auth?.currentUser?.getIdToken());
export default function V2Route() {
  const { isLoadingAuth, isAuthenticated, logout } = useAuth();
  const [warning, setWarning] = useState(false);
  const [idleError, setIdleError] = useState(false);
  const deadline = useRef(Date.now() + 30 * 60_000);
  useEffect(() => {
    if (!isAuthenticated) return;
    let signingOut = false;
    const activity = () => {
      if (Date.now() < deadline.current - 60_000)
        deadline.current = Date.now() + 30 * 60_000;
    };
    const timer = setInterval(() => {
      const remaining = deadline.current - Date.now();
      setWarning(remaining <= 60_000);
      if (remaining <= 0 && !signingOut) {
        signingOut = true;
        logout().catch(() => {
          setIdleError(true);
        });
      }
    }, 1000);
    window.addEventListener("pointerdown", activity);
    window.addEventListener("keydown", activity);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
    };
  }, [isAuthenticated, logout]);
  if (isLoadingAuth)
    return (
      <div className="v2-app">
        <Loading />
      </div>
    );
  if (!isAuthenticated || idleError)
    return (
      <div className="v2-app v2-gate">
        <Empty title={idleError ? "Session locked" : "Sign in to HubCyS"}>
          <p>
            {idleError
              ? "Automatic sign out could not complete. Workspace data is hidden; sign in again."
              : "Your organization and evidence access are verified by the server."}
          </p>
          <Link className="v2-button" to="/Login">
            Sign in
          </Link>
        </Empty>
      </div>
    );
  return (
    <>
      {warning && (
        <div className="v2-session-warning" role="alert">
          Your session is about to expire from inactivity.
          <button
            onClick={() => {
              deadline.current = Date.now() + 30 * 60_000;
              setWarning(false);
            }}
          >
            Stay signed in
          </button>
        </div>
      )}
      <ReadinessApp
        key={auth?.currentUser?.uid}
        client={client}
        userLabel={auth?.currentUser?.email || "Signed-in user"}
        onSignOut={() => logout()}
      />
    </>
  );
}
