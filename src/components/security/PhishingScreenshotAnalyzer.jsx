
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import TooltipInfo from "../ui/TooltipInfo";
import {
  Shield,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  FileImage,
  Zap,
  Mail,
  Globe,
  X,
  Info,
  Camera,
  Lock,
  Bug,
  Clock,
  DollarSign,
  User,
  Link as LinkIcon,
  Fingerprint,
  Server,
  FileText, // NEW
  MessageSquare // NEW
} from "lucide-react";
import { base44 } from "@/api/base44Client";

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
    y: 20,
    scale: 0.95
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

// NEW: Helper function to render text with highlighted phrases
const HighlightedText = ({ text, phrases }) => {
  const parts = useMemo(() => {
    if (!phrases || phrases.length === 0) {
      return [{ type: 'text', value: text }];
    }

    const regex = new RegExp(`(${phrases.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    return text.split(regex).filter(Boolean).map(part => {
      if (phrases.some(phrase => part.toLowerCase() === phrase.toLowerCase())) {
        return { type: 'highlight', value: part };
      }
      return { type: 'text', value: part };
    });
  }, [text, phrases]);

  return (
    <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">
      {parts.map((part, i) =>
        part.type === 'highlight' ? (
          <strong key={i} className="bg-orange-500/30 text-orange-200 px-1 rounded">
            {part.value}
          </strong>
        ) : (
          <React.Fragment key={i}>{part.value}</React.Fragment>
        )
      )}
    </pre>
  );
};


export default function PhishingScreenshotAnalyzer() {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // New state for additional metadata
  const [emailHeaders, setEmailHeaders] = useState("");
  const [suspiciousUrls, setSuspiciousUrls] = useState("");
  const [fileHashes, setFileHashes] = useState("");

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    processFiles(files);
  };

  const processFiles = (files) => {
    if (files.length === 0) return;

    // Limit to 3 files
    if (files.length > 3) {
      setError("Please select up to 3 files only");
      return;
    }

    // Validate each file
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB per file

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        setError("Please upload only PNG, JPG, or PDF files");
        return;
      }
      if (file.size > maxSize) {
        setError(`File "${file.name}" is too large. Maximum size is 10MB per file.`);
        return;
      }
    }

    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));

    setSelectedFiles(files);
    setPreviewUrls(newPreviewUrls);
    setError("");
    setResults(null);
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);

    // Revoke the removed URL to prevent memory leaks
    URL.revokeObjectURL(previewUrls[index]);

    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);

    if (newFiles.length === 0) {
      setResults(null);
      // Also clear metadata if files are removed, as it's context-dependent
      setEmailHeaders("");
      setSuspiciousUrls("");
      setFileHashes("");
    }
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one file first");
      return;
    }

    setAnalyzing(true);
    setError("");
    setResults(null);

    try {
      console.log('Starting phishing analysis for', selectedFiles.length, 'files');
      
      // First upload all files and get their URLs with better error handling
      const uploadPromises = selectedFiles.map(async (file, index) => {
        try {
          console.log(`Uploading file ${index + 1}:`, file.name);
          const result = await base44.integrations.Core.UploadFile({ file });
          console.log(`File ${index + 1} uploaded successfully:`, result.file_url);
          return result;
        } catch (uploadError) {
          console.error(`Failed to upload file ${index + 1}:`, uploadError);
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }
      });
      
      const uploadResults = await Promise.all(uploadPromises);
      const fileUrls = uploadResults.map(result => result.file_url);
      
      console.log('All files uploaded successfully. URLs:', fileUrls);

      // Then pass all file URLs AND metadata to the analysis function
      try {
        console.log('Calling phishing analysis function with metadata...');
        const payload = {
          file_urls: fileUrls,
          email_headers: emailHeaders.trim() || undefined,
          suspicious_urls: suspiciousUrls.trim() ? suspiciousUrls.split(/[\s,]+/).filter(url => url) : undefined,
          file_hashes: fileHashes.trim() ? fileHashes.split(/[\s,]+/).filter(hash => hash) : undefined,
        };
        
        const response = await base44.functions.invoke('analyzePhishingScreenshot', payload);

        console.log('Analysis response received:', response);

        if (response.status === 200 && response.data?.verdict) { // Check for verdict
          setResults(response.data);
          console.log('Analysis completed successfully');
        } else {
          const errorMsg = response.data?.error || 'Analysis failed or returned no verdict.';
          console.error('Analysis failed with error:', errorMsg);
          setError(`Analysis failed: ${errorMsg}`);
        }
      } catch (analysisError) {
        console.error('Analysis function error:', analysisError);
        setError(`Analysis failed: ${analysisError.message || 'Unknown error during analysis'}`);
      }
      
    } catch (err) {
      console.error('Overall phishing analysis error:', err);
      
      // Provide more specific error messages based on the error type
      if (err.message && err.message.includes('database timed out')) {
        setError('Upload failed due to server timeout. Please try again with smaller files or check your internet connection.');
      } else if (err.message && err.message.includes('Failed to upload')) {
        setError(err.message);
      } else {
        setError(`Analysis failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'low': return 'bg-green-500/20 text-green-300 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getRiskIcon = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return <XCircle className="w-6 h-6 text-red-400" />;
      case 'medium': return <AlertTriangle className="w-6 h-6 text-orange-400" />;
      case 'low': return <CheckCircle className="w-6 h-6 text-green-400" />;
      default: return <Shield className="w-6 h-6 text-gray-400" />;
    }
  };

  const getArtifactIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'domain': return <Globe className="w-4 h-4" />;
      case 'url': return <LinkIcon className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'ip': return <Server className="w-4 h-4" />;
      case 'hash_md5':
      case 'hash_sha256':
        return <Fingerprint className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getReasonIcon = (reason) => {
    if (reason.toLowerCase().includes('typo') || reason.toLowerCase().includes('domain')) return <Bug className="w-4 h-4 text-red-400" />;
    if (reason.toLowerCase().includes('urgency') || reason.toLowerCase().includes('expires')) return <Clock className="w-4 h-4 text-orange-400" />;
    if (reason.toLowerCase().includes('payment') || reason.toLowerCase().includes('gift')) return <DollarSign className="w-4 h-4 text-yellow-400" />;
    if (reason.toLowerCase().includes('generic') || reason.toLowerCase().includes('dear')) return <User className="w-4 h-4 text-blue-400" />;
    if (reason.toLowerCase().includes('link') || reason.toLowerCase().includes('url')) return <LinkIcon className="w-4 h-4 text-purple-400" />;
    return <AlertTriangle className="w-4 h-4 text-gray-400" />;
  };

  const triggerFileInput = () => {
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.click();
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header Card with Animation */}
      <motion.div variants={itemVariants}>
        <Card className="glass-effect border-slate-700/50 overflow-hidden">
          <CardHeader className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 animate-pulse" />
            <CardTitle className="text-purple-300 flex items-center relative z-10">
              <motion.div
                variants={pulseVariants}
                initial="initial"
                animate="animate"
              >
                <Eye className="w-6 h-6 mr-3" />
              </motion.div>
              Screenshot Phishing Check
            </CardTitle>
            <p className="text-gray-400 relative z-10">
              Upload screenshots of suspicious emails or messages to get an instant AI-powered phishing risk assessment
            </p>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Security Guidelines & Disclaimer */}
      <motion.div variants={itemVariants}>
        <Card className="glass-effect border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-amber-300 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Important: Security Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Camera className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-medium">Screenshot Only</h4>
                    <p className="text-gray-400 text-sm">Never click on suspicious links. Only upload clean screenshots of the content you want analyzed.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-medium">For Informational Use Only</h4>
                    <p className="text-gray-400 text-sm">Analysis is AI-generated and for guidance only. Always verify with official sources when in doubt.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-medium">Privacy Protected</h4>
                    <p className="text-gray-400 text-sm">Your images are not saved after analysis. Data is processed securely and deleted immediately.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-medium">Report Suspicious Content</h4>
                    <p className="text-gray-400 text-sm">If you identify a scam, report it to your IT security team or relevant authorities immediately.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-4 border-t border-slate-700/50">
              <Checkbox
                id="disclaimer"
                checked={disclaimerAccepted}
                onCheckedChange={setDisclaimerAccepted}
              />
              <label htmlFor="disclaimer" className="text-sm text-gray-300 cursor-pointer">
                I understand these guidelines and agree to use this tool responsibly for security analysis only
              </label>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upload Section */}
      <AnimatePresence>
        {disclaimerAccepted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            variants={itemVariants}
          >
            <Card className="glass-effect border-slate-700/50">
              <CardContent className="p-6 space-y-6">
                {/* Drag & Drop Upload Zone */}
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
                    dragOver
                      ? 'border-purple-400 bg-purple-500/10'
                      : 'border-gray-600 hover:border-purple-500/50 hover:bg-purple-500/5'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <motion.div
                      animate={dragOver ? { scale: 1.1 } : { scale: 1 }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-4"
                    >
                      <Upload className="w-8 h-8 text-purple-400" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-white mb-2">Upload Screenshots</h3>
                    <p className="text-gray-400 mb-4">Drag & drop up to 3 files here, or click to browse</p>
                    <Input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,application/pdf"
                      onChange={handleFileChange}
                      multiple
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      variant="outline"
                      className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                      onClick={triggerFileInput}
                      type="button"
                    >
                      <FileImage className="w-4 h-4 mr-2" />
                      Choose Files
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG, PDF • Max 10MB per file</p>
                  </div>
                </div>

                {/* File Previews */}
                <AnimatePresence>
                  {previewUrls.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-slate-900/50 rounded-lg p-4"
                    >
                      <h4 className="text-white font-medium mb-3 flex items-center">
                        <FileImage className="w-4 h-4 mr-2" />
                        Selected Files ({previewUrls.length}/3)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {previewUrls.map((url, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative group"
                          >
                            <div className="aspect-video bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                              <img
                                src={url}
                                alt={`Screenshot preview ${index + 1}`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeFile(index)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {selectedFiles[index]?.name}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* NEW: Optional Metadata Section */}
                <AnimatePresence>
                  {selectedFiles.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-900/50 rounded-lg p-4 space-y-4"
                    >
                      <h4 className="text-white font-medium mb-2">
                        Optional: Add More Context for Deeper Analysis
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="suspiciousUrls" className="text-sm font-medium text-gray-300 flex items-center">
                            Suspicious URL(s)
                            <TooltipInfo>
                              <p className="font-bold">Safely get the URL by hovering your mouse over a link (do NOT click). Copy the URL that appears in the bottom-left of your browser.</p>
                              <p className="mt-2">Multiple URLs can be entered, separated by commas or spaces.</p>
                            </TooltipInfo>
                          </label>
                          <Input
                            id="suspiciousUrls"
                            placeholder="https://suspicious-link.com, https://another.site"
                            value={suspiciousUrls}
                            onChange={(e) => setSuspiciousUrls(e.target.value)}
                            className="mt-1 bg-slate-800/70 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <label htmlFor="fileHashes" className="text-sm font-medium text-gray-300 flex items-center">
                            File Hash (SHA256)
                            <TooltipInfo>
                              <p className="font-bold">If you downloaded a file, you can get its hash without running it. On Windows, open PowerShell and type: Get-FileHash [filename]. On Mac/Linux, open Terminal and type: shasum -a 256 [filename].</p>
                              <p className="mt-2">Multiple hashes can be entered, separated by commas or spaces.</p>
                            </TooltipInfo>
                          </label>
                          <Input
                            id="fileHashes"
                            placeholder="e3b0c44298fc1c14..., 0a1b2c3d4e5f6a7b..."
                            value={fileHashes}
                            onChange={(e) => setFileHashes(e.target.value)}
                            className="mt-1 bg-slate-800/70 border-gray-600 text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="emailHeaders" className="text-sm font-medium text-gray-300 flex items-center">
                          Full Email Headers
                          <TooltipInfo>
                            <p className="font-bold">In your email client, find an option like "View Original," "Show Source," or "View Message Details" to get the full, plain text headers. This provides definitive sender information.</p>
                            <p className="mt-2">Example: From, To, Subject, Received, Message-ID, SPF, DKIM, DMARC records.</p>
                          </TooltipInfo>
                        </label>
                        <Textarea
                          id="emailHeaders"
                          placeholder="Paste full email headers here..."
                          value={emailHeaders}
                          onChange={(e) => setEmailHeaders(e.target.value)}
                          className="mt-1 bg-slate-800/70 border-gray-600 text-white h-24"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Analyze Button */}
                <div className="flex justify-center pt-2">
                  <Button
                    onClick={handleAnalyze}
                    disabled={selectedFiles.length === 0 || analyzing}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 text-lg"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing Screenshots...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 mr-2" />
                        Analyze for Phishing
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
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Section */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="space-y-6"
          >
            {/* Verdict Card */}
            <Card className="glass-effect border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center">
                    {getRiskIcon(results.verdict)}
                    <span className="ml-3">Phishing Risk Assessment</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-3xl font-bold text-white"
                    >
                      {results.score}/100
                    </motion.div>
                    <Badge className={`${getRiskColor(results.verdict)} text-lg px-4 py-2`}>
                      {results.verdict?.toUpperCase()} RISK
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Detected Red Flags */}
                  <div>
                    <h3 className="text-white font-semibold mb-3 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2 text-orange-400" />
                      Detected Red Flags
                    </h3>
                    <div className="space-y-2">
                      {results.reasons?.map((reason, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-2 text-sm"
                        >
                          {getReasonIcon(reason)}
                          <span className="text-gray-300">{reason}</span>
                        </motion.div>
                      )) || <span className="text-gray-400 text-sm">No specific red flags identified</span>}
                    </div>
                  </div>

                  {/* NEW: Risk Assessment Summary */}
                  <div>
                    <h3 className="text-white font-semibold mb-3 flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-cyan-400" />
                      Risk Assessment Summary
                    </h3>
                    <div className="text-sm text-gray-300 bg-slate-800/40 border border-slate-700/50 rounded-lg p-3">
                      <p>{results.overall_risk_assessment_narrative || "No summary provided."}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NEW: Extracted Text with Highlights */}
            {results.extracted_text && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="glass-effect border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-yellow-300 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Extracted Text & Suspicious Phrases
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-900/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <HighlightedText text={results.extracted_text} phrases={results.suspicious_phrases || []} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* NEW: Redesigned Extracted Artifacts */}
            {results.artifacts && results.artifacts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="glass-effect border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-cyan-300 flex items-center">
                      <Zap className="w-5 h-5 mr-2" />
                      Analysis Indicators ({results.artifacts.length})
                    </CardTitle>
                    <p className="text-gray-400">
                      Domains, URLs, emails, and other indicators found in the analysis.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {results.artifacts.map((artifact, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-3 flex-grow min-w-0">
                            {getArtifactIcon(artifact.type)}
                            <code className="text-cyan-300 bg-slate-800/60 px-2 py-1 rounded text-sm break-all truncate">
                              {artifact.value}
                            </code>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                            <Badge variant="outline" className="border-slate-600 text-slate-300 capitalize">
                              {artifact.source?.replace(/_/g, ' ')}
                            </Badge>
                            <Badge className={getRiskColor(artifact.risk || 'low')}>
                              {artifact.risk || 'Unknown'}
                            </Badge>
                          </div>
                        </div>
                        {artifact.reasoning && (
                          <div className="mt-3 pl-8 text-sm text-gray-300 flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span>{artifact.reasoning}</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="glass-effect border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-green-300 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Security Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-white font-medium">If this is suspicious:</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Do not click any links or buttons</li>
                        <li>• Do not enter personal information</li>
                        <li>• Report to your IT security team</li>
                        <li>• Delete the message immediately</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-white font-medium">To verify legitimacy:</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Contact the organization directly</li>
                        <li>• Use official websites or phone numbers</li>
                        <li>• Check the sender's email address carefully</li>
                        <li>• Look for official company signatures</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
