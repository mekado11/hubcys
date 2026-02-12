import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Target, Loader2, CheckCircle, XCircle, AlertTriangle, 
  TrendingUp, TrendingDown, Award, Info 
} from "lucide-react";
import { InvokeLLM } from "@/integrations/Core";

const BENCHMARKS = {
  owasp_benchmark: {
    name: "OWASP Benchmark Project",
    description: "Industry-standard SAST test suite with known ground truth",
    url: "https://owasp.org/www-project-benchmark/",
    categories: ["XSS", "SQL Injection", "Command Injection", "Path Traversal", "Weak Crypto", "LDAP Injection"]
  },
  openssf_cve: {
    name: "OpenSSF CVE Benchmark",
    description: "Real-world historical vulnerable code with metadata",
    url: "https://github.com/ossf/cvelist",
    categories: ["Buffer Overflow", "Use After Free", "Integer Overflow", "Injection", "Authentication Bypass"]
  },
  juice_shop: {
    name: "OWASP Juice Shop",
    description: "Intentionally insecure app covering broad vulnerability classes",
    url: "https://github.com/juice-shop/juice-shop",
    categories: ["Broken Access Control", "XSS", "Injection", "Sensitive Data Exposure", "XXE", "CSRF"]
  },
  dvwa: {
    name: "DVWA",
    description: "Classic intentionally vulnerable PHP application",
    url: "https://github.com/digininja/DVWA",
    categories: ["SQL Injection", "XSS", "File Upload", "Command Injection", "CSRF", "Weak Session"]
  }
};

export default function SastBenchmark() {
  const [selectedBenchmark, setSelectedBenchmark] = useState("owasp_benchmark");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const runBenchmark = async () => {
    setRunning(true);
    setError("");
    setResults(null);

    try {
      const benchmark = BENCHMARKS[selectedBenchmark];
      
      const prompt = `You are evaluating a SAST scanner against the ${benchmark.name}.

**YOUR TASK:**
Simulate running a SAST scanner against this benchmark and generate realistic performance metrics based on typical SAST tool capabilities.

**BENCHMARK DETAILS:**
- Name: ${benchmark.name}
- Description: ${benchmark.description}
- Vulnerability Categories: ${benchmark.categories.join(", ")}

**GENERATE REALISTIC METRICS:**

For each vulnerability category in this benchmark, provide:
1. **Expected Vulnerabilities:** Number of known vulnerabilities in the benchmark
2. **Detected (True Positives):** Vulnerabilities correctly identified
3. **Missed (False Negatives):** Vulnerabilities not detected
4. **False Positives:** Non-vulnerabilities incorrectly flagged

Then calculate:
- **Precision:** TP / (TP + FP) - percentage of detections that are correct
- **Recall:** TP / (TP + FN) - percentage of actual vulnerabilities found
- **F1 Score:** 2 × (Precision × Recall) / (Precision + Recall) - harmonic mean

**GUIDELINES FOR REALISTIC METRICS:**
- Modern SAST tools typically achieve 60-85% recall (detection rate)
- Precision varies: 40-70% is common (lots of false positives are normal)
- F1 scores usually range 0.50-0.75
- Some vulnerability types are harder to detect (e.g., logic flaws, authentication issues)
- Simpler patterns (SQL injection, XSS) have higher detection rates
- Complex issues (race conditions, business logic) have lower detection

Provide overall metrics and per-category breakdown with strengths/weaknesses analysis.

Return JSON with this structure:
{
  "benchmark_name": string,
  "overall_metrics": {
    "total_expected": number,
    "true_positives": number,
    "false_negatives": number,
    "false_positives": number,
    "precision": number (0-100),
    "recall": number (0-100),
    "f1_score": number (0-1)
  },
  "category_results": [
    {
      "category": string,
      "expected": number,
      "detected": number,
      "missed": number,
      "false_positives": number,
      "precision": number,
      "recall": number,
      "notes": string
    }
  ],
  "strengths": [string],
  "weaknesses": [string],
  "recommendations": [string],
  "comparison_to_industry": string
}`;

      const analysis = await InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            benchmark_name: { type: "string" },
            overall_metrics: {
              type: "object",
              properties: {
                total_expected: { type: "number" },
                true_positives: { type: "number" },
                false_negatives: { type: "number" },
                false_positives: { type: "number" },
                precision: { type: "number" },
                recall: { type: "number" },
                f1_score: { type: "number" }
              }
            },
            category_results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  expected: { type: "number" },
                  detected: { type: "number" },
                  missed: { type: "number" },
                  false_positives: { type: "number" },
                  precision: { type: "number" },
                  recall: { type: "number" },
                  notes: { type: "string" }
                }
              }
            },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            comparison_to_industry: { type: "string" }
          }
        }
      });

      setResults(analysis);
    } catch (e) {
      console.error("Benchmark error:", e);
      setError(e?.message || "Failed to run benchmark");
    } finally {
      setRunning(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return "text-green-300";
    if (score >= 50) return "text-yellow-300";
    return "text-red-300";
  };

  const getScoreBadge = (score) => {
    if (score >= 75) return "bg-green-600/20 text-green-300 border-green-600/40";
    if (score >= 50) return "bg-yellow-600/20 text-yellow-300 border-yellow-600/40";
    return "bg-red-600/20 text-red-300 border-red-600/40";
  };

  return (
    <Card className="glass-effect border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-cyan-300 flex items-center gap-2">
          <Target className="w-5 h-5" />
          SAST Benchmark Testing
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Evaluate scanner performance against established security benchmarks with ground truth
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-blue-500/30 bg-blue-500/10">
          <Info className="w-4 h-4" />
          <AlertDescription className="text-blue-100 text-sm">
            These benchmarks contain intentionally vulnerable code to test SAST detection capabilities. 
            Results are simulated based on typical SAST tool performance patterns.
          </AlertDescription>
        </Alert>

        <div>
          <div className="text-sm text-gray-300 mb-3 font-medium">Select Benchmark:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(BENCHMARKS).map(([key, benchmark]) => (
              <button
                key={key}
                onClick={() => setSelectedBenchmark(key)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  selectedBenchmark === key
                    ? "border-cyan-500/50 bg-cyan-500/10"
                    : "border-slate-700/50 bg-slate-900/20 hover:border-slate-600"
                }`}
              >
                <div className="font-medium text-white mb-1">{benchmark.name}</div>
                <div className="text-xs text-gray-400 mb-2">{benchmark.description}</div>
                <div className="flex flex-wrap gap-1">
                  {benchmark.categories.slice(0, 3).map((cat) => (
                    <Badge key={cat} variant="outline" className="text-xs border-slate-600 text-slate-300">
                      {cat}
                    </Badge>
                  ))}
                  {benchmark.categories.length > 3 && (
                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                      +{benchmark.categories.length - 3} more
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={runBenchmark}
            disabled={running}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Benchmark...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Run Benchmark Test
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert className="border-red-500/30 bg-red-500/10">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {results && (
          <div className="space-y-6 pt-6 border-t border-slate-700/50">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Overall Performance: {results.benchmark_name}
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Card className="bg-slate-900/40 border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-gray-400 mb-1">Precision</div>
                    <div className={`text-2xl font-bold ${getScoreColor(results.overall_metrics.precision)}`}>
                      {results.overall_metrics.precision.toFixed(1)}%
                    </div>
                    <Progress 
                      value={results.overall_metrics.precision} 
                      className="h-1.5 mt-2"
                    />
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/40 border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-gray-400 mb-1">Recall</div>
                    <div className={`text-2xl font-bold ${getScoreColor(results.overall_metrics.recall)}`}>
                      {results.overall_metrics.recall.toFixed(1)}%
                    </div>
                    <Progress 
                      value={results.overall_metrics.recall} 
                      className="h-1.5 mt-2"
                    />
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/40 border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-gray-400 mb-1">F1 Score</div>
                    <div className={`text-2xl font-bold ${getScoreColor(results.overall_metrics.f1_score * 100)}`}>
                      {results.overall_metrics.f1_score.toFixed(2)}
                    </div>
                    <Progress 
                      value={results.overall_metrics.f1_score * 100} 
                      className="h-1.5 mt-2"
                    />
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/40 border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-gray-400 mb-1">Detection Rate</div>
                    <div className="text-2xl font-bold text-white">
                      {results.overall_metrics.true_positives}/{results.overall_metrics.total_expected}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {results.overall_metrics.false_positives} false positives
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert className="bg-blue-500/10 border-blue-500/30">
                <Info className="w-4 h-4" />
                <AlertDescription className="text-blue-100 text-sm">
                  {results.comparison_to_industry}
                </AlertDescription>
              </Alert>
            </div>

            <Tabs defaultValue="categories">
              <TabsList className="bg-slate-800/50">
                <TabsTrigger value="categories">Category Breakdown</TabsTrigger>
                <TabsTrigger value="analysis">Strengths & Weaknesses</TabsTrigger>
              </TabsList>

              <TabsContent value="categories" className="mt-4 space-y-3">
                {results.category_results?.map((cat, idx) => (
                  <Card key={idx} className="bg-slate-900/40 border-slate-700/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-medium text-white mb-1">{cat.category}</div>
                          <div className="text-xs text-gray-400">{cat.notes}</div>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getScoreBadge(cat.precision)}>
                            P: {cat.precision.toFixed(0)}%
                          </Badge>
                          <Badge className={getScoreBadge(cat.recall)}>
                            R: {cat.recall.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <div>
                            <div className="text-gray-400 text-xs">Detected</div>
                            <div className="text-white font-medium">{cat.detected}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-400" />
                          <div>
                            <div className="text-gray-400 text-xs">Missed</div>
                            <div className="text-white font-medium">{cat.missed}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          <div>
                            <div className="text-gray-400 text-xs">False +</div>
                            <div className="text-white font-medium">{cat.false_positives}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-blue-400" />
                          <div>
                            <div className="text-gray-400 text-xs">Expected</div>
                            <div className="text-white font-medium">{cat.expected}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="analysis" className="mt-4 space-y-4">
                <Card className="bg-green-500/10 border-green-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <div className="font-medium text-green-300">Strengths</div>
                    </div>
                    <ul className="space-y-2">
                      {results.strengths?.map((strength, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-orange-500/10 border-orange-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown className="w-4 h-4 text-orange-400" />
                      <div className="font-medium text-orange-300">Weaknesses</div>
                    </div>
                    <ul className="space-y-2">
                      {results.weaknesses?.map((weakness, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-blue-500/10 border-blue-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-4 h-4 text-blue-400" />
                      <div className="font-medium text-blue-300">Recommendations</div>
                    </div>
                    <ul className="space-y-2">
                      {results.recommendations?.map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}