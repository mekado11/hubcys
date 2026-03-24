import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

function normalizeList(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((f) => ({
    title: f.title || f.ruleId || f.name || "Finding",
    severity: (f.severity || f.level || "medium").toString().toLowerCase(),
    description: f.description || f.message || "",
    recommendation: f.recommendation || f.fix || f.remediation || "",
    file: f.file || f.path || f.location?.file || "",
    line: typeof f.line === "number" ? f.line : (f.location?.line || f.startLine || null),
    code_snippet: f.code_snippet || f.snippet || "",
    cwe: f.cwe || f.cwe_id || "",
    owasp_category: f.owasp_category || f.owasp || "",
    owasp_cwe_mapping: Array.isArray(f.owasp_cwe_mapping) ? f.owasp_cwe_mapping : (f.cwe ? [f.cwe] : []),
    owasp_cheat_sheet_url: f.owasp_cheat_sheet_url || "",
    owasp_guidance_snippet: f.owasp_guidance_snippet || "",
    source: f.source || f.tool || "unknown",
    confidence: (f.confidence || "medium").toString().toLowerCase(),
  }));
}

function keyOf(f) {
  return [f.title, f.file, f.line, f.owasp_category].filter(Boolean).join('::').toLowerCase();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const llm = normalizeList(body.llmFindings || []);
    const semgrep = normalizeList(body.semgrepFindings || []);
    const zap = normalizeList(body.zapFindings || []);
    const deps = normalizeList(body.dependencyFindings || []);

    const map = new Map();
    const add = (list) => {
      for (const f of list) {
        const k = keyOf(f);
        if (!map.has(k)) {
          map.set(k, { ...f, sources: f.source ? [f.source] : [] });
        } else {
          const existing = map.get(k);
          const merged = {
            ...existing,
            severity: rankSeverity(existing.severity, f.severity),
            sources: Array.from(new Set([...(existing.sources || []), f.source].filter(Boolean))),
            owasp_category: existing.owasp_category || f.owasp_category || "",
            cwe: existing.cwe || f.cwe || "",
            owasp_cwe_mapping: Array.from(new Set([...(existing.owasp_cwe_mapping || []), ...(f.owasp_cwe_mapping || [])])),
            recommendation: existing.recommendation || f.recommendation || "",
            description: existing.description || f.description || "",
            owasp_cheat_sheet_url: existing.owasp_cheat_sheet_url || f.owasp_cheat_sheet_url || "",
            owasp_guidance_snippet: existing.owasp_guidance_snippet || f.owasp_guidance_snippet || ""
          };
          map.set(k, merged);
        }
      }
    };

    add(llm);
    add(semgrep);
    add(zap);
    add(deps);

    const unified = Array.from(map.values());

    return Response.json({
      count: unified.length,
      findings: unified
    });
  } catch (error) {
    return Response.json({ error: error.message || "Internal error" }, { status: 500 });
  }
});

function rankSeverity(a, b) {
  const order = ["info", "low", "medium", "high", "critical"];
  const ia = order.indexOf((a || "").toLowerCase());
  const ib = order.indexOf((b || "").toLowerCase());
  return (ib > ia) ? b : a;
}