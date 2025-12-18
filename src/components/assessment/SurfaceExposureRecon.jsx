
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Search,
  Globe,
  Eye,
  Server,
  MapPin,
  Sparkles, // Added for executive summary
  Calendar // Added for executive summary
} from "lucide-react";
import { surfaceExposureRecon } from "@/functions/surfaceExposureRecon";
import { correlateCVEs } from "@/functions/correlateCVEs";
import { generateExternalSummary } from "@/functions/generateExternalSummary"; // New import
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown'; // New import

export default function SurfaceExposureRecon() {
  const [targetDomain, setTargetDomain] = useState("");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [cveResults, setCveResults] = useState(null);
  const [error, setError] = useState("");
  const [correlatingCVEs, setCorrelatingCVEs] = useState(false);

  // New states for executive summary
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const handleScan = async () => {
    if (!targetDomain.trim()) {
      setError("Please enter a target domain");
      return;
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(targetDomain.trim())) {
      setError("Please enter a valid domain (e.g., example.com)");
      return;
    }

    setScanning(true);
    setError("");
    setResults(null);
    setCveResults(null);
    setExecutiveSummary(null); // Reset executive summary on new scan

    try {
      const { data } = await surfaceExposureRecon({ target: targetDomain.trim() });
      setResults(data);

      // Auto-correlate CVEs if we found exposed assets
      if (data?.exposed_assets && data.exposed_assets.length > 0) {
        setCorrelatingCVEs(true);
        try {
          const cveData = await correlateCVEs({
            exposed_assets: data.exposed_assets,
            target_domain: targetDomain.trim()
          });
          setCveResults(cveData.data);
        } catch (cveError) {
          console.error("CVE correlation failed:", cveError);
          // Don't show error for CVE correlation failure, it's supplementary
        } finally {
          setCorrelatingCVEs(false);
        }
      }
    } catch (err) {
      console.error("Surface exposure scan error:", err);
      setError(err.message || "Failed to perform surface exposure scan");
    } finally {
      setScanning(false);
    }
  };

  const handleGenerateExecutiveSummary = async () => {
    if (!results) {
      setError("No scan results available to generate summary");
      return;
    }

    setGeneratingSummary(true);
    setError("");

    try {
      const { data } = await generateExternalSummary({
        externalData: results,
        cveData: cveResults?.correlatedCVEs || [],
        targetDomain: targetDomain
      });

      if (data.success) {
        setExecutiveSummary(data);
      } else {
        setError(data.error || "Failed to generate executive summary");
      }
    } catch (err) {
      console.error("Error generating executive summary:", err);
      setError("Failed to generate executive summary. Please try again.");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  const getRiskColor = (score) => {
    if (score >= 80) return 'bg-red-500/20 text-red-300 border-red-500/30';
    if (score >= 60) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    if (score >= 40) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    return 'bg-green-500/20 text-green-300 border-green-500/30';
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="glass-effect border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-orange-300 flex items-center">
            <motion.div
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mr-3"
            >
              <Eye className="w-5 h-5" />
            </motion.div>
            External Attack Surface Reconnaissance
          </CardTitle>
          <p className="text-gray-400">
            Discover what attackers can see about your organization from public sources using Shodan intelligence and CVE correlation
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scan Input */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Enter target domain (e.g., example.com)"
                value={targetDomain}
                onChange={(e) => setTargetDomain(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 bg-slate-800/50 border-gray-600 text-white"
                disabled={scanning}
              />
            </div>
            <Button
              onClick={handleScan}
              disabled={scanning || !targetDomain.trim()}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-md hover:shadow-lg focus:ring-2 focus:ring-orange-400/30 px-6"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning Surface...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Scan External Attack Surface
                </>
              )}
            </Button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert className="border-red-500/30 bg-red-500/10">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-red-300">
                  {error}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Information Box */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50"
          >
            <h3 className="text-white font-semibold mb-2 flex items-center">
              <Shield className="w-4 h-4 mr-2 text-cyan-400" />
              What This Scan Reveals
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="text-gray-300 font-medium">Network Exposure</h4>
                <ul className="text-gray-400 space-y-1">
                  <li>• Open ports and services</li>
                  <li>• Server technologies in use</li>
                  <li>• SSL certificate details</li>
                  <li>• Geographic distribution</li>
                </ul>
              </div>
              <div>
                <h4 className="text-gray-300 font-medium">Security Intelligence</h4>
                <ul className="text-gray-400 space-y-1">
                  <li>• Known vulnerabilities (CVEs)</li>
                  <li>• Outdated software versions</li>
                  <li>• Configuration weaknesses</li>
                  <li>• Attack surface scoring</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="space-y-6"
          >
            {/* Summary Card with Generate Executive Summary Button */}
            <Card className="glass-effect border-slate-700/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-orange-300 flex items-center">
                      <Server className="w-5 h-5 mr-2" />
                      Scan Summary for {targetDomain}
                    </CardTitle>
                    <p className="text-gray-400 mt-1">
                      External attack surface analysis completed
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {results.exposure_score !== undefined && (
                      <div className="text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-2xl font-bold text-white"
                        >
                          {results.exposure_score}/100
                        </motion.div>
                        <Badge className={getRiskColor(results.exposure_score)}>
                          {results.exposure_score >= 80 ? 'HIGH RISK' :
                           results.exposure_score >= 60 ? 'MEDIUM RISK' :
                           results.exposure_score >= 40 ? 'LOW RISK' : 'MINIMAL RISK'}
                        </Badge>
                      </div>
                    )}
                    <Button
                      onClick={handleGenerateExecutiveSummary}
                      disabled={generatingSummary}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg"
                    >
                      {generatingSummary ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Executive Summary
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">
                      {results.exposed_assets?.length || 0}
                    </div>
                    <div className="text-gray-400">Exposed Assets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">
                      {results.open_ports?.length || 0}
                    </div>
                    <div className="text-gray-400">Open Ports</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {results.technologies?.length || 0}
                    </div>
                    <div className="text-gray-400">Technologies</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Executive Summary Display */}
            {executiveSummary && (
              <Card className="glass-effect border-slate-700/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-purple-300 flex items-center">
                        <Sparkles className="w-5 h-5 mr-2" />
                        Executive Summary - External Attack Surface Analysis
                      </CardTitle>
                      <p className="text-gray-400 mt-1">
                        AI-powered analysis of your organization's external security posture
                      </p>
                    </div>
                    {executiveSummary.scan_timestamp && (
                      <div className="flex items-center text-sm text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(executiveSummary.scan_timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown
                      className="text-gray-300 leading-relaxed"
                      components={{
                        h1: ({children}) => (
                          <h1 className="text-2xl font-bold text-purple-300 mb-4 mt-6 first:mt-0 border-b border-slate-700/50 pb-2">
                            {children}
                          </h1>
                        ),
                        h2: ({children}) => {
                          const text = children.toString().toLowerCase();
                          let colorClass = 'text-purple-300';

                          if (text.includes('executive') || text.includes('overview')) {
                            colorClass = 'text-purple-300';
                          } else if (text.includes('risk') || text.includes('critical')) {
                            colorClass = 'text-red-300';
                          } else if (text.includes('attack') || text.includes('surface')) {
                            colorClass = 'text-orange-300';
                          } else if (text.includes('action') || text.includes('recommendation')) {
                            colorClass = 'text-cyan-300';
                          }

                          return (
                            <h2 className={`text-xl font-bold ${colorClass} mb-4 mt-8 first:mt-0 border-b border-slate-700/50 pb-2`}>
                              {children}
                            </h2>
                          );
                        },
                        h3: ({children}) => (
                          <h3 className="text-lg font-semibold text-white mb-3 mt-6">
                            {children}
                          </h3>
                        ),
                        p: ({children}) => (
                          <p className="text-gray-300 mb-4 leading-relaxed">
                            {children}
                          </p>
                        ),
                        ul: ({children}) => (
                          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                            {children}
                          </ul>
                        ),
                        ol: ({children}) => (
                          <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-2">
                            {children}
                          </ol>
                        ),
                        li: ({children}) => (
                          <li className="text-gray-300 leading-relaxed">
                            {children}
                          </li>
                        ),
                        strong: ({children}) => (
                          <strong className="text-white font-semibold">
                            {children}
                          </strong>
                        ),
                        code: ({children}) => (
                          <code className="bg-slate-800 text-cyan-300 px-2 py-1 rounded text-sm">
                            {children}
                          </code>
                        ),
                        blockquote: ({children}) => (
                          <blockquote className="border-l-4 border-purple-500 pl-4 py-2 bg-slate-800/30 rounded-r-lg my-4">
                            <div className="text-gray-300 italic">
                              {children}
                            </div>
                          </blockquote>
                        )
                      }}
                    >
                      {executiveSummary.executive_summary}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Exposed Assets */}
            {results.exposed_assets && results.exposed_assets.length > 0 && (
              <Card className="glass-effect border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-red-300 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Exposed Assets ({results.exposed_assets.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {results.exposed_assets.map((asset, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-lg border border-slate-700/50 bg-slate-900/40"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Server className="w-4 h-4 text-orange-400" />
                            <span className="text-white font-mono font-bold">{asset.ip}</span>
                            {asset.hostname && (
                              <span className="text-gray-300">({asset.hostname})</span>
                            )}
                          </div>
                          {asset.location && (
                            <div className="flex items-center gap-1 text-gray-300">
                              <MapPin className="w-3 h-3" />
                              <span className="text-xs">{asset.location}</span>
                            </div>
                          )}
                        </div>

                        {asset.ports && asset.ports.length > 0 && (
                          <div className="mb-2">
                            <span className="text-gray-300 text-sm font-semibold">Open Ports: </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {asset.ports.map((port, portIndex) => (
                                <Badge
                                  key={portIndex}
                                  className="bg-cyan-500/20 text-cyan-200 border-cyan-500/30 text-xs font-bold"
                                >
                                  {port.port}{port.service ? `/${port.service}` : ''}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {asset.technologies && asset.technologies.length > 0 && (
                          <div className="mb-2">
                            <span className="text-gray-300 text-sm font-semibold">Technologies: </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {asset.technologies.map((tech, techIndex) => (
                                <Badge
                                  key={techIndex}
                                  className="bg-blue-500/20 text-blue-200 border-blue-500/30 text-xs font-bold"
                                >
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CVE Correlation Results */}
            {correlatingCVEs && (
              <Card className="glass-effect border-slate-700/50">
                <CardContent className="p-6 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
                  <p className="text-white">Correlating with CVE database...</p>
                  <p className="text-gray-400 text-sm">Analyzing exposed technologies for known vulnerabilities</p>
                </CardContent>
              </Card>
            )}

            {cveResults && (
              <Card className="glass-effect border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-purple-300 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    CVE Correlation Results
                  </CardTitle>
                  <p className="text-gray-400">
                    Known vulnerabilities found in exposed technologies
                  </p>
                </CardHeader>
                <CardContent>
                  {cveResults.correlatedCVEs && cveResults.correlatedCVEs.length > 0 ? (
                    <div className="space-y-3">
                      {cveResults.correlatedCVEs.map((cve, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 rounded-lg border border-slate-700/50 bg-slate-900/40"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <code className="text-cyan-300 bg-slate-800/50 px-2 py-1 rounded text-sm font-bold">
                                {cve.cve_id}
                              </code>
                              {cve.severity && (
                                <Badge className={getSeverityColor(cve.severity)}>
                                  {cve.severity.toUpperCase()}
                                </Badge>
                              )}
                              {cve.cvss_score && (
                                <Badge className="bg-emerald-500/20 text-white border-emerald-500/30 font-bold">
                                  CVSS: {cve.cvss_score}
                                </Badge>
                              )}
                            </div>
                            {cve.published_date && (
                              <span className="text-gray-400 text-xs">
                                {new Date(cve.published_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          <h4 className="text-white font-medium mb-2">{cve.description}</h4>

                          {cve.affected_technology && (
                            <p className="text-gray-400 text-sm mb-2">
                              <strong className="text-white">Affects:</strong> {cve.affected_technology}
                            </p>
                          )}

                          {cve.remediation && (
                            <p className="text-green-300 text-sm">
                              <strong className="text-white">Remediation:</strong> {cve.remediation}
                            </p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">No Critical CVEs Found</h3>
                      <p className="text-gray-400">
                        No known critical vulnerabilities were found in the exposed technologies.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {results.recommendations && (
              <Card className="glass-effect border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-green-300 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Security Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {results.recommendations.map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 rounded-lg border border-slate-700/50 bg-slate-900/40"
                      >
                        <p className="text-gray-300">{rec}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
