
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Globe,
  MapPin,
  Building2,
  Lock,
  Fingerprint,
  ExternalLink,
  Bug,
  Server,
  Bot
} from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  }
};

const pulseVariants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const getSeverityColor = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    case 'low': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'info': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
};

const getRiskColor = (score) => {
  if (score === null || score === undefined) return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  if (score >= 8) return 'bg-red-500/20 text-red-300 border-red-500/30';
  if (score >= 6) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  if (score >= 3) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
  return 'bg-green-500/20 text-green-300 border-green-500/30';
};

export default function AnimatedResultsDisplay({ results, type = "url_scan" }) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (results) {
      // Delay showing details to allow summary animation to complete
      const timer = setTimeout(() => setShowDetails(true), 800);
      return () => clearTimeout(timer);
    }
  }, [results]);

  if (!results) return null;

  if (type === "url_scan") {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6"
      >
        {/* Animated Header */}
        <motion.div variants={itemVariants} className="text-center">
          <motion.div
            variants={pulseVariants}
            initial="initial"
            animate="animate"
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-teal-500 mb-4 shadow-lg"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-green-300 mb-2">Scan Complete</h2>
          <p className="text-gray-400">Analysis for {results.target}</p>
        </motion.div>

        {/* Animated Summary Cards */}
        <motion.div variants={itemVariants}>
          <Card className="glass-effect border-slate-700/50 overflow-hidden">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <motion.div 
                  variants={itemVariants}
                  className="bg-slate-800/30 rounded-lg p-4 text-center border border-slate-700/50"
                >
                  <motion.div className="text-3xl font-bold text-white mb-2">
                    <AnimatedCounter value={results.summary.total_vulnerabilities} />
                  </motion.div>
                  <div className="text-sm text-gray-400">Total Issues</div>
                </motion.div>
                
                <motion.div 
                  variants={itemVariants}
                  className="bg-red-500/10 rounded-lg p-4 text-center border border-red-500/20"
                >
                  <motion.div className="text-3xl font-bold text-red-300 mb-2">
                    <AnimatedCounter value={results.summary.critical} />
                  </motion.div>
                  <div className="text-sm text-red-400">Critical</div>
                </motion.div>
                
                <motion.div 
                  variants={itemVariants}
                  className="bg-orange-500/10 rounded-lg p-4 text-center border border-orange-500/20"
                >
                  <motion.div className="text-3xl font-bold text-orange-300 mb-2">
                    <AnimatedCounter value={results.summary.high} />
                  </motion.div>
                  <div className="text-sm text-orange-400">High</div>
                </motion.div>
                
                <motion.div 
                  variants={itemVariants}
                  className="bg-yellow-500/10 rounded-lg p-4 text-center border border-yellow-500/20"
                >
                  <motion.div className="text-3xl font-bold text-yellow-300 mb-2">
                    <AnimatedCounter value={results.summary.medium} />
                  </motion.div>
                  <div className="text-sm text-yellow-400">Medium</div>
                </motion.div>
                
                <motion.div 
                  variants={itemVariants}
                  className="bg-blue-500/10 rounded-lg p-4 text-center border border-blue-500/20"
                >
                  <motion.div className="text-3xl font-bold text-blue-300 mb-2">
                    <AnimatedCounter value={results.summary.low + results.summary.info} />
                  </motion.div>
                  <div className="text-sm text-blue-400">Low/Info</div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* IP Intelligence */}
        {results.ip_intelligence && (
          <motion.div variants={itemVariants}>
            <Card className="glass-effect border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-cyan-300 flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Network Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div 
                    variants={itemVariants}
                    className="bg-slate-800/30 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 text-white font-medium mb-1">
                      <MapPin className="w-4 h-4 text-cyan-300" />
                      Location
                    </div>
                    <div className="text-gray-300 text-sm">
                      {results.ip_intelligence.geo?.city_name || 'Unknown'}, {results.ip_intelligence.geo?.country_name || 'Unknown'}
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    variants={itemVariants}
                    className="bg-slate-800/30 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 text-white font-medium mb-1">
                      <Building2 className="w-4 h-4 text-cyan-300" />
                      Organization
                    </div>
                    <div className="text-gray-300 text-sm">
                      {results.ip_intelligence.isp_name || 'Unknown ISP'}
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    variants={itemVariants}
                    className="bg-slate-800/30 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 text-white font-medium mb-1">
                      <Shield className="w-4 h-4 text-cyan-300" />
                      Threat Risk
                    </div>
                    <Badge className={getRiskColor(results.ip_intelligence.threat_risk)}>
                      Score: {results.ip_intelligence.threat_risk ?? 'N/A'}
                    </Badge>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* TLS Certificate Info */}
        {results.tls_info && (
          <motion.div variants={itemVariants}>
            <Card className="glass-effect border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-cyan-300 flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  TLS Certificate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <motion.div variants={itemVariants} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                    <div className="text-xs text-gray-400">Issuer</div>
                    <div className="text-white">{results.tls_info.issuer || 'Unknown'}</div>
                  </motion.div>
                  <motion.div variants={itemVariants} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                    <div className="text-xs text-gray-400">Subject/CN</div>
                    <div className="text-white">{results.tls_info.common_name || results.tls_info.subject || 'Unknown'}</div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Findings - CVE and Others */}
        <AnimatePresence>
          {showDetails && results.findings && results.findings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* CVE Findings */}
              {(() => {
                const cveFindings = results.findings.filter(f => !!f.cve);
                if (cveFindings.length === 0) return null;
                
                return (
                  <Card className="glass-effect border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-red-300 flex items-center">
                        <Bug className="w-5 h-5 mr-2" />
                        CVE Findings ({cveFindings.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {cveFindings.map((finding, index) => (
                        <motion.div
                          key={`cve-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-white">{finding.title}</h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-xs px-2 py-0.5 rounded bg-slate-700/60 text-cyan-300 font-mono">
                                  {finding.cve}
                                </span>
                                {typeof finding.cvss_score !== 'undefined' && finding.cvss_score !== null && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                    CVSS: {finding.cvss_score}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge className={getSeverityColor(finding.severity)}>
                              {finding.severity?.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-gray-300 text-sm">{finding.description}</p>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // CVE Search Results
  if (type === "cve_search") {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-4"
      >
        <motion.div variants={itemVariants} className="text-center mb-6">
          <motion.div
            variants={pulseVariants}
            initial="initial"
            animate="animate"
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-3 shadow-lg"
          >
            <Bug className="w-8 h-8 text-white" />
          </motion.div>
          <h3 className="text-xl font-bold text-purple-300">CVE Search Results</h3>
          <p className="text-gray-400">
            <AnimatedCounter value={results.length} /> vulnerabilit{results.length !== 1 ? 'ies' : 'y'} found
          </p>
        </motion.div>

        {results.map((cve, index) => (
          <motion.div
            key={cve.id || index}
            variants={itemVariants}
            custom={index}
          >
            <Card className="glass-effect border-slate-700/50 hover:border-purple-500/40 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-white flex items-center gap-2">
                      <span className="text-cyan-300 font-bold">{cve.id}</span>
                      {cve.cvss_score && (
                        <Badge className="bg-emerald-500/20 text-white border-emerald-500/30 font-bold">
                          CVSS: {cve.cvss_score}
                        </Badge>
                      )}
                    </h4>
                    <p className="text-gray-300 text-sm mt-1">{cve.published_date && `Published: ${new Date(cve.published_date).toLocaleDateString()}`}</p>
                  </div>
                  <Badge className={getSeverityColor(cve.severity)}>
                    {cve.severity?.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-gray-200 text-sm mb-3 leading-relaxed">{cve.description}</p>
                {cve.references && cve.references.length > 0 && (
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
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return null;
}
