
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UploadFile, InvokeLLM } from "@/integrations/Core";
import {
  ImagePlus,
  Shield,
  AlertTriangle,
  Loader2,
  RefreshCw,
  CheckCircle,
  FileText,
  MessageCircle, // Added MessageCircle import
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import RationalizePanel from "./RationalizePanel";

const severityColors = {
  critical: "bg-red-500/20 text-red-300 border-red-500/30",
  high: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  low: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  info: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

export default function ArchitectureAudit() {
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState("");
  const [uploadedUrl, setUploadedUrl] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState(null);
  const [contextNotes, setContextNotes] = React.useState("");
  const [showRationalizePanel, setShowRationalizePanel] = React.useState(false); // New state for RationalizePanel visibility

  const handleFileChange = async (e) => {
    setError("");
    setResult(null);
    setShowRationalizePanel(false); // Reset RationalizePanel visibility on new file
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setUploadedUrl(file_url);
    } catch (err) {
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const analyzeImage = async () => {
    if (!uploadedUrl) {
      setError("Please upload an architecture image first.");
      return;
    }
    setAnalyzing(true);
    setError("");
    setResult(null);
    setShowRationalizePanel(false); // Hide RationalizePanel on new analysis

    // Refined and enriched JSON schema: adds strengths, assumptions, user_access_paths,
    // and per-weakness confidence and evidence_nodes.
    const responseSchema = {
      type: "object",
      properties: {
        summary: { type: "string" },
        strengths: { type: "array", items: { type: "string" } },
        assumptions_made: { type: "array", items: { type: "string" } },
        user_access_paths: { type: "array", items: { type: "string" } },
        detected_components: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              type: {
                type: "string",
                enum: ["user", "network", "server", "database", "application", "device", "cloud", "unknown"],
              },
              notes: { type: "string" },
            },
            required: ["label", "type"],
          },
        },
        zones: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              trust_level: { type: "string", enum: ["high", "medium", "low"] },
              components: { type: "array", items: { type: "string" } },
            },
            required: ["name", "trust_level"],
          },
        },
        weaknesses: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
              confidence: { type: "string", enum: ["low", "medium", "high"] },
              affected_components: { type: "array", items: { type: "string" } },
              evidence_nodes: { type: "array", items: { type: "string" } },
              rationale: { type: "string" },
              remediation_steps: { type: "array", items: { type: "string" } },
              mapping: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    framework: { type: "string", enum: ["NIST_CSF", "ISO_27001", "CIS", "PCI_DSS", "NIS2", "Other"] },
                    control: { type: "string" },
                  },
                  required: ["framework", "control"],
                },
              },
            },
            required: ["title", "description", "severity"],
          },
        },
        network_findings: {
          type: "object",
          properties: {
            segmentation_gaps: { type: "array", items: { type: "string" } },
            single_points_of_failure: { type: "array", items: { type: "string" } },
            identity_access_issues: { type: "array", items: { type: "string" } },
            data_flow_risks: { type: "array", items: { type: "string" } },
          },
        },
        priority_actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              action: { type: "string" },
              timeframe: { type: "string", enum: ["30_day", "60_day", "90_day"] },
              impact: { type: "string" },
            },
            required: ["action", "timeframe"],
          },
        },
      },
      required: ["summary", "weaknesses"],
    };

    const prompt = `
You are a seasoned security architect. Analyze the uploaded cyber/IT architecture diagram image and produce a structured audit.

A. How to interpret the diagram
- Read labels literally and cite them in your findings (e.g., "Firewall", "App Server", "DB").
- Pay attention to arrow directions, connection paths, and any legend or zone boundaries in the drawing.
- Do NOT assume a risk merely because a component exists (e.g., a firewall is not a risk by itself).
- Unless the image contradicts it, assume standard controls are reasonably configured (e.g., firewalls enforce rules, routers route, switches segment VLANs if shown).
- If something is unclear, state an assumption with LOW confidence.

B. Specific items to check and call out explicitly
1) Perimeter and user access:
   - Identify user entry points and confirm they pass through the firewall/security edge.
   - If a WAF, VPN, or SSO/MFA is implied or labeled, treat as a strength; if missing, suggest it as an improvement.
2) Network zones and segmentation:
   - Identify clear zones (e.g., Internet, DMZ, App tier, DB tier) and whether internal users traverse appropriate perimeters.
   - Highlight segmentation strengths and any flat network risks.
3) Application placement and isolation:
   - If the application is isolated (e.g., its own subnet/segment/DMZ), recognize it as a strength.
   - Recommend placement patterns if unclear (e.g., front-end in DMZ, back-end in app net, DB in data net).
4) Data paths and dependencies:
   - Note sensitive data stores (databases, file servers) and whether access paths are appropriately gated.
   - Call out encryption in transit/at rest considerations if unknown.
5) Identity, monitoring, and resilience:
   - Comment on IAM (SSO/MFA), logging/monitoring/SIEM, backups/DR, and SPOFs (e.g., single firewall/switch).
6) Cloud components and external services (if present):
   - Assess connector security, private links, exposure points, and key management.
7) Evidence and confidence:
   - For each weakness, cite evidence_nodes (the labels you used) and set confidence: high/medium/low.
   - Also list observed strengths (e.g., "All user traffic funnels through Firewall").

C. Output format
- Follow the provided JSON schema strictly.
- Include:
  - strengths (array)
  - assumptions_made (array)
  - user_access_paths (array describing key access flows, e.g., "Users -> Firewall -> Load Balancer -> App Server")
  - weaknesses with confidence and evidence_nodes populated
- Be concise, accurate, and cite exact labels from the image.

Additional context from the user (optional):
${contextNotes ? contextNotes : "(no additional context provided)"}
`;

    try {
      const analysis = await InvokeLLM({
        prompt,
        feature: 'architecture_audit',
        file_urls: [uploadedUrl],
        add_context_from_internet: false,
        response_json_schema: responseSchema,
      });

      setResult(analysis);
    } catch (err) {
      setError("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAll = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadedUrl("");
    setResult(null);
    setError("");
    setContextNotes("");
    setShowRationalizePanel(false); // Reset RationalizePanel visibility
  };

  return (
    <Card className="glass-effect border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-cyan-300 flex items-center">
          <ImagePlus className="w-5 h-5 mr-2" />
          Audit Architecture Image (AI)
        </CardTitle>
        <p className="text-gray-400">
          Upload a cyber/IT architecture diagram (PNG/JPG/PDF). AI will identify strengths, weaknesses and suggest improvements with cited evidence.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload + Analyze */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              disabled={uploading || analyzing}
              className="bg-slate-800/50 border-gray-600 text-white"
            />
            <Button
              onClick={analyzeImage}
              disabled={!uploadedUrl || uploading || analyzing}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Analyze Architecture
                </>
              )}
            </Button>
            {selectedFile && (
              <Button
                variant="outline"
                onClick={resetAll}
                disabled={analyzing || uploading}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
          {uploading && (
            <div className="flex items-center text-cyan-300">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading image...
            </div>
          )}
        </div>

        {/* Optional context to guide analysis */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Optional context/notes (e.g., "Users must pass the firewall to access internal apps")
          </label>
          <Textarea
            value={contextNotes}
            onChange={(e) => setContextNotes(e.target.value)}
            placeholder="Add assumptions, constraints, or clarifications to guide the audit..."
            className="bg-slate-800/50 border-gray-600 text-white"
            rows={3}
            disabled={analyzing}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center text-red-300">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Preview */}
        {previewUrl && (
          <div className="bg-slate-900/50 rounded-lg p-4 overflow-auto">
            <img
              src={previewUrl}
              alt="Architecture preview"
              className="max-w-full h-auto mx-auto"
              style={{ maxHeight: 360 }}
            />
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Summary */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-purple-300 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">{result.summary}</p>
              </CardContent>
            </Card>

            {/* Strengths */}
            {Array.isArray(result.strengths) && result.strengths.length > 0 && (
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-emerald-300">Strengths Observed</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {result.strengths.map((s, idx) => <li key={idx}>{s}</li>)}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* User access paths */}
            {Array.isArray(result.user_access_paths) && result.user_access_paths.length > 0 && (
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-cyan-300">User Access Paths</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {result.user_access_paths.map((p, idx) => <li key={idx}>{p}</li>)}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Detected components */}
            {Array.isArray(result.detected_components) && result.detected_components.length > 0 && (
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-cyan-300">Detected Components</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {result.detected_components.map((c, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-slate-700/50 bg-slate-900/40">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-medium">{c.label}</p>
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-none capitalize">
                            {c.type || "unknown"}
                          </Badge>
                        </div>
                        {c.notes && <p className="text-gray-400 text-sm mt-1">{c.notes}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Zones */}
            {Array.isArray(result.zones) && result.zones.length > 0 && (
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-green-300">Zones & Trust Levels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.zones.map((z, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-slate-700/50 bg-slate-900/40">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-medium">{z.name}</p>
                          <Badge className={
                            z.trust_level === "high" ? "bg-emerald-500/20 text-emerald-300" :
                            z.trust_level === "medium" ? "bg-yellow-500/20 text-yellow-300" :
                            "bg-red-500/20 text-red-300"
                          }>
                            {z.trust_level}
                          </Badge>
                        </div>
                        {Array.isArray(z.components) && z.components.length > 0 && (
                          <p className="text-gray-400 text-sm mt-1">
                            Components: {z.components.join(", ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weaknesses */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-red-300 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Key Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.isArray(result.weaknesses) && result.weaknesses.length > 0 ? (
                  result.weaknesses.map((w, idx) => (
                    <div key={idx} className="p-4 bg-slate-900/40 rounded-lg border border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <p className="text-white font-semibold">{w.title}</p>
                        <div className="flex items-center gap-2">
                          {w.confidence && (
                            <Badge className="bg-slate-700/70 text-gray-200">
                              Confidence: {w.confidence}
                            </Badge>
                          )}
                          <Badge className={severityColors[w.severity || "info"]}>
                            {String(w.severity || "info").toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mt-2">{w.description}</p>
                      {w.rationale && (
                        <p className="text-gray-400 text-xs mt-2">
                          Rationale: {w.rationale}
                        </p>
                      )}
                      {Array.isArray(w.affected_components) && w.affected_components.length > 0 && (
                        <p className="text-gray-400 text-xs mt-2">
                          Affected: {w.affected_components.join(", ")}
                        </p>
                      )}
                      {Array.isArray(w.evidence_nodes) && w.evidence_nodes.length > 0 && (
                        <p className="text-gray-400 text-xs mt-2">
                          Evidence: {w.evidence_nodes.join(", ")}
                        </p>
                      )}
                      {Array.isArray(w.remediation_steps) && w.remediation_steps.length > 0 && (
                        <div className="text-gray-300 text-sm mt-3">
                          <p className="font-medium text-emerald-300">Remediation:</p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {w.remediation_steps.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                      {Array.isArray(w.mapping) && w.mapping.length > 0 && (
                        <div className="text-gray-400 text-xs mt-3">
                          <span className="font-medium text-gray-300">Mappings:</span>{" "}
                          {w.mapping.map((m, i) => `${m.framework}: ${m.control}`).join("; ")}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No explicit weaknesses found from the image analysis.</p>
                )}
              </CardContent>
            </Card>

            {/* Network findings */}
            {result.network_findings && (
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-cyan-300">Network & Architecture Findings</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["segmentation_gaps", "single_points_of_failure", "identity_access_issues", "data_flow_risks"].map((key) => {
                    const items = result.network_findings[key];
                    if (!Array.isArray(items) || items.length === 0) return null;
                    const titleMap = {
                      segmentation_gaps: "Segmentation Gaps",
                      single_points_of_failure: "Single Points of Failure",
                      identity_access_issues: "Identity & Access Issues",
                      data_flow_risks: "Data Flow Risks",
                    };
                    return (
                      <div key={key} className="p-3 rounded-lg border border-slate-700/50 bg-slate-900/40">
                        <p className="text-white font-medium mb-2">{titleMap[key]}</p>
                        <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                          {items.map((i, idx) => <li key={idx}>{i}</li>)}
                        </ul>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Priority actions */}
            {Array.isArray(result.priority_actions) && result.priority_actions.length > 0 && (
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-emerald-300 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Priority Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.priority_actions.map((a, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-700/50 bg-slate-900/40">
                      <div className="flex items-center justify-between">
                        <p className="text-white font-medium">{a.action}</p>
                        <Badge className={
                          a.timeframe === "30_day" ? "bg-red-500/20 text-red-300" :
                          a.timeframe === "60_day" ? "bg-yellow-500/20 text-yellow-300" :
                          "bg-blue-500/20 text-blue-300"
                        }>
                          {a.timeframe.replace("_", " ")}
                        </Badge>
                      </div>
                      {a.impact && <p className="text-gray-300 text-sm mt-1">{a.impact}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Assumptions */}
            {Array.isArray(result.assumptions_made) && result.assumptions_made.length > 0 && (
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-yellow-300">Assumptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {result.assumptions_made.map((s, idx) => <li key={idx}>{s}</li>)}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Rationalize Chat Toggle / Panel */}
            {!showRationalizePanel && (
              <Button
                onClick={() => setShowRationalizePanel(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full flex items-center justify-center py-2"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Ask AI about these findings
              </Button>
            )}
            {showRationalizePanel && (
              <RationalizePanel analysis={result} imageUrl={uploadedUrl} contextNotes={contextNotes} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
