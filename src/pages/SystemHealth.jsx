
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ShieldAlert, Play, RefreshCcw } from "lucide-react";
import { runBackendHealthcheck } from "@/functions/runBackendHealthcheck";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function SystemHealth() {
  const [user, setUser] = useState(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await User.me();
        setUser(me);
      } catch (e) {
        setUser(null);
      }
    })();
  }, []);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await runBackendHealthcheck();
      setResult(data);
    } catch (e) {
      setError(e?.message || "Failed to run healthcheck");
    } finally {
      setRunning(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center text-white p-6">
        <Card className="glass-effect border-cyan-500/30 w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-cyan-300">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-200 mb-4">Please log in to access system diagnostics.</p>
            <Button onClick={() => User.login()} className="bg-gradient-to-r from-cyan-500 to-blue-600">Log in</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.company_role !== "admin" && user.company_role !== "super_admin" && !user.is_super_admin) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center text-white p-6">
        <Card className="glass-effect border-yellow-500/30 w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-yellow-300">Insufficient Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-200">Only admins can run backend diagnostics.</p>
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="outline" className="border-gray-600 text-gray-300">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allGood = result?.ok;

  return (
    <div className="min-h-screen cyber-gradient text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold cyber-text-glow">System Health</h1>
          <div className="flex gap-2">
            <Button onClick={handleRun} disabled={running} className="bg-gradient-to-r from-cyan-500 to-blue-600">
              {running ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running...</>) : (<><Play className="w-4 h-4 mr-2" /> Run Diagnostics</>)}
            </Button>
            {result && (
              <Button variant="outline" onClick={handleRun} disabled={running} className="border-gray-600 text-gray-300">
                <RefreshCcw className="w-4 h-4 mr-2" /> Re-run
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Card className="glass-effect border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-300">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-200">{error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className={`glass-effect ${allGood ? "border-green-500/30" : "border-red-500/30"}`}>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                {allGood ? <ShieldCheck className="w-5 h-5 text-green-400" /> : <ShieldAlert className="w-5 h-5 text-red-400" />}
                Backend Save Diagnostics
              </CardTitle>
              <Badge className={allGood ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}>{allGood ? "PASS" : "ISSUES FOUND"}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-slate-200">
                Started: {new Date(result.started_at).toLocaleString()} • Finished: {new Date(result.finished_at).toLocaleString()} • Duration: {result.total_duration_ms}ms
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.results.map((r, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-700 p-4 bg-slate-900/40 text-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-slate-100">{r.entity}</div>
                      <Badge className={(!r.error && r.created && r.updated && r.read && r.deleted) ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}>
                        {(!r.error && r.created && r.updated && r.read && r.deleted) ? "OK" : "ERROR"}
                      </Badge>
                    </div>
                    <div className="text-xs">Duration: {r.duration_ms}ms</div>
                    <div className="text-xs mt-2 grid grid-cols-2 gap-1">
                      <div>Created: {String(r.created)}</div>
                      <div>Updated: {String(r.updated)}</div>
                      <div>Read: {String(r.read)}</div>
                      <div>Deleted: {String(r.deleted)}</div>
                    </div>
                    {r.error && <div className="text-xs text-red-300 mt-2">Error: {r.error}</div>}
                  </div>
                ))}
              </div>
              <div className="text-xs text-slate-200">
                User: {result.user.email} • Company: {result.user.company_id} • Role: {result.user.company_role}
              </div>
            </CardContent>
          </Card>
        )}

        {!result && !error && (
          <Card className="glass-effect border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-300">Run the diagnostics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-200 mb-4">
                This test safely creates, updates, reads, and deletes test records in Assessment, Incident, ActionItem, and TabletopExercise using your company scope. It leaves no residual data.
              </p>
              <Button onClick={handleRun} disabled={running} className="bg-gradient-to-r from-cyan-500 to-blue-600">
                {running ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running...</>) : (<><Play className="w-4 h-4 mr-2" /> Run Diagnostics</>)}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
