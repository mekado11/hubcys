import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Bug, ExternalLink, Calendar, AlertTriangle, Lightbulb, Plus, Shield, Target } from "lucide-react";
import { cveSearch } from "@/functions/cveSearch";
import { InvokeLLM } from "@/integrations/Core";
import { ActionItem } from "@/entities/ActionItem";
import { User } from "@/entities/User";
import AnimatedResultsDisplay from "../ui/AnimatedResultsDisplay";
import ReactMarkdown from 'react-markdown';

function getSeverityColor(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    case 'low': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
}

function getCvssColor(score) {
  if (score >= 9.0) return 'bg-red-500/20 text-red-300';
  if (score >= 7.0) return 'bg-orange-500/20 text-orange-300';
  if (score >= 4.0) return 'bg-yellow-500/20 text-yellow-300';
  return 'bg-blue-500/20 text-blue-300';
}

export default function CveSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [selectedCve, setSelectedCve] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [cveAnalysis, setCveAnalysis] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [creatingActionItems, setCreatingActionItems] = useState(false);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError("Please enter a CVE ID or keyword");
      setResults([]);
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);
    setSelectedCve(null);
    setCveAnalysis(null);

    try {
      const { data } = await cveSearch({ query: searchTerm.trim() });
      setResults(data.vulnerabilities || []);
    } catch (err) {
      setError(err?.message || "Failed to search CVE database");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const generateCveAnalysis = async (cve) => {
    setAnalysisLoading(true);
    setCveAnalysis(null);
    
    try {
      const prompt = `You are a cybersecurity expert analyzing CVE findings. Provide a comprehensive analysis for ${cve.id}.

CVE DETAILS:
- ID: ${cve.id}
- Description: ${cve.description}
- Severity: ${cve.severity?.toUpperCase()} (CVSS: ${cve.cvss_score || 'N/A'})
- Published: ${cve.published_date ? new Date(cve.published_date).toLocaleDateString() : 'Unknown'}
- Status: ${cve.vulnStatus || 'Unknown'}

ORGANIZATION CONTEXT:
- Industry: ${currentUser?.company_industry || 'Technology'}
- Company Size: ${currentUser?.company_size || 'Medium'}

Please provide your analysis in the following structured format:

## Executive Summary
Brief overview of the vulnerability and its criticality for organizations like this one.

## Technical Impact Analysis
- What systems/software are affected
- How the vulnerability can be exploited
- Potential attack vectors and scenarios
- Business impact if exploited

## Risk Assessment
- Likelihood of exploitation (consider if public exploits exist)
- Impact severity for this industry/company size
- Overall risk rating (Critical/High/Medium/Low)
- Factors that increase or decrease risk

## Immediate Actions Required
Prioritized list of specific actions to take:
1. **Most Critical (0-24 hours)**
2. **High Priority (1-7 days)**  
3. **Medium Priority (7-30 days)**

## Remediation Strategy
- Primary remediation approach (patching, configuration, etc.)
- Alternative mitigations if primary fix isn't immediately available
- Verification steps to confirm remediation
- Rollback considerations

## Detection & Monitoring
- How to detect if this vulnerability is being exploited
- Monitoring recommendations
- Log analysis strategies
- Indicators of compromise to watch for

## Long-term Improvements
- Process improvements to prevent similar issues
- Technology investments to consider
- Policy updates needed

Be specific, actionable, and explain technical concepts in business-friendly terms where appropriate.`;

      const analysis = await InvokeLLM({
        prompt,
        feature: 'cve_lookup',
        add_context_from_internet: true
      });

      setCveAnalysis(analysis);
    } catch (error) {
      console.error("CVE Analysis error:", error);
      setError("Failed to generate CVE analysis. Please try again.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const createActionItemsFromCve = async (cve) => {
    if (!currentUser?.company_id) {
      alert("Company information is required to create action items.");
      return;
    }

    setCreatingActionItems(true);
    
    try {
      // Create immediate action item for critical/high CVEs
      const isHighRisk = cve.severity === 'critical' || cve.severity === 'high' || (cve.cvss_score && cve.cvss_score >= 7.0);
      
      const immediateAction = await ActionItem.create({
        company_id: currentUser.company_id,
        title: `Address ${cve.id} - ${cve.severity?.toUpperCase()} Severity Vulnerability`,
        description: `${cve.description}\n\nCVSS Score: ${cve.cvss_score || 'N/A'}\nPublished: ${cve.published_date ? new Date(cve.published_date).toLocaleDateString() : 'Unknown'}\n\nThis CVE requires immediate attention due to its ${cve.severity} severity rating.`,
        category: isHighRisk ? "30_day" : "60_day",
        priority: isHighRisk ? "critical" : "high",
        status: "not_started",
        estimated_effort: isHighRisk ? "4-8 hours" : "2-4 hours",
        responsible_team: "IT Security Team"
      });

      // Create monitoring action item
      const monitoringAction = await ActionItem.create({
        company_id: currentUser.company_id,
        title: `Implement monitoring for ${cve.id} exploitation`,
        description: `Set up monitoring and detection capabilities to identify potential exploitation of ${cve.id}.\n\nThis includes:\n- Log monitoring for indicators of compromise\n- Network traffic analysis\n- System integrity checks\n- Alert configurations`,
        category: "30_day",
        priority: "medium",
        status: "not_started",
        estimated_effort: "2-3 hours",
        responsible_team: "SOC/Monitoring Team"
      });

      alert(`Created ${2} action items for ${cve.id}. Check your Action Items page to track progress.`);
      
    } catch (error) {
      console.error("Error creating action items:", error);
      alert("Failed to create action items. Please try again.");
    } finally {
      setCreatingActionItems(false);
    }
  };

  return (
    <Card className="glass-effect border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-cyan-300 flex items-center">
          <Bug className="w-5 h-5 mr-2" />
          CVE Database Search & Analysis
        </CardTitle>
        <p className="text-gray-400">Search for Common Vulnerabilities and Exposures (CVE) by ID or keyword, get actionable insights</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Enter CVE ID (e.g., CVE-2024-1234) or keyword"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 bg-slate-800/50 border-gray-600 text-white"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading || !searchTerm.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center text-red-300">
              <AlertTriangle className="w-4 h-4 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <Tabs defaultValue="results" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="results">Search Results ({results.length})</TabsTrigger>
              <TabsTrigger value="analysis" disabled={!selectedCve}>
                Detailed Analysis {selectedCve && `(${selectedCve.id})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="space-y-4">
              <AnimatedResultsDisplay results={results} type="cve_search" />
              
              {/* Enhanced CVE Cards */}
              <div className="space-y-4 mt-6">
                {results.map((cve, index) => (
                  <Card key={cve.id} className="glass-effect border-slate-700/50 hover:border-purple-500/40 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-white text-lg">{cve.id}</h4>
                            {cve.cvss_score && (
                              <Badge className={getCvssColor(cve.cvss_score)}>
                                CVSS: {cve.cvss_score}
                              </Badge>
                            )}
                            <Badge className={getSeverityColor(cve.severity)}>
                              {cve.severity?.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-gray-300 text-sm mb-3 leading-relaxed">{cve.description}</p>
                          {cve.published_date && (
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>Published: {new Date(cve.published_date).toLocaleDateString()}</span>
                              </div>
                              {cve.vulnStatus && (
                                <span>Status: {cve.vulnStatus}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 mb-4">
                        <Button
                          onClick={() => {
                            setSelectedCve(cve);
                            generateCveAnalysis(cve);
                          }}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          disabled={analysisLoading}
                        >
                          {analysisLoading && selectedCve?.id === cve.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Lightbulb className="w-4 h-4 mr-2" />
                              Get Analysis
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={() => createActionItemsFromCve(cve)}
                          variant="outline"
                          className="border-green-600 text-green-300 hover:bg-green-600/20"
                          disabled={creatingActionItems}
                        >
                          {creatingActionItems ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Create Action Items
                            </>
                          )}
                        </Button>

                        {/* Risk Assessment Badge */}
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-orange-400" />
                          <span className="text-sm text-orange-300">
                            {cve.severity === 'critical' || (cve.cvss_score && cve.cvss_score >= 9.0) ? 'Immediate Action Required' :
                             cve.severity === 'high' || (cve.cvss_score && cve.cvss_score >= 7.0) ? 'High Priority' :
                             'Monitor & Plan'}
                          </span>
                        </div>
                      </div>

                      {/* References */}
                      {cve.references && cve.references.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-300 mb-2">References:</h5>
                          <div className="flex flex-wrap gap-2">
                            {cve.references.slice(0, 3).map((ref, i) => (
                              <a
                                key={i}
                                href={ref}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-cyan-300 hover:text-cyan-200 underline flex items-center gap-1 font-semibold"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Reference {i + 1}
                              </a>
                            ))}
                            {cve.references.length > 3 && (
                              <span className="text-xs text-gray-500">+{cve.references.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              {selectedCve && (
                <Card className="glass-effect border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-purple-300 flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      Detailed Analysis: {selectedCve.id}
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <Badge className={getSeverityColor(selectedCve.severity)}>
                        {selectedCve.severity?.toUpperCase()}
                      </Badge>
                      {selectedCve.cvss_score && (
                        <Badge className={getCvssColor(selectedCve.cvss_score)}>
                          CVSS: {selectedCve.cvss_score}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {analysisLoading ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
                        <p className="text-gray-400">Generating comprehensive security analysis...</p>
                      </div>
                    ) : cveAnalysis ? (
                      <div className="prose prose-invert max-w-none">
                        <ReactMarkdown
                          className="text-gray-300 leading-relaxed"
                          components={{
                            h2: ({children}) => (
                              <h2 className="text-xl font-bold text-cyan-300 mb-4 mt-6 first:mt-0 border-b border-slate-700/50 pb-2">
                                {children}
                              </h2>
                            ),
                            h3: ({children}) => (
                              <h3 className="text-lg font-semibold text-white mb-3 mt-5">
                                {children}
                              </h3>
                            ),
                            p: ({children}) => (
                              <p className="text-gray-300 mb-3 leading-relaxed">
                                {children}
                              </p>
                            ),
                            ul: ({children}) => (
                              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">
                                {children}
                              </ul>
                            ),
                            ol: ({children}) => (
                              <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-1">
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
                            )
                          }}
                        >
                          {cveAnalysis}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">Click "Get Analysis" on a CVE to see detailed security analysis</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Display message when no results found after a search and not loading */}
        {!loading && !error && searchTerm.trim() && results.length === 0 && (
          <div className="text-center py-8">
            <Bug className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No CVEs Found</h3>
            <p className="text-gray-400">
              No vulnerabilities found for "{searchTerm}". Try searching with different keywords or CVE IDs.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}