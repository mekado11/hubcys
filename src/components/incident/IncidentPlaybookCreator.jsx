
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileText,
  Loader2,
  Sparkles,
  Copy,
  CheckCircle,
  Download,
  AlertTriangle,
  Users,
  Clock,
  Shield
} from "lucide-react";
import { InvokeLLM } from "@/integrations/Core";
import { User } from "@/entities/User";
import ReactMarkdown from 'react-markdown';
import PlaybookGenerationAnimation from "./PlaybookGenerationAnimation";

const incidentTypes = [
  { value: "Malware/Ransomware", label: "Malware/Ransomware" },
  { value: "Data Breach", label: "Data Breach" },
  { value: "Phishing Attack", label: "Phishing Attack" },
  { value: "Insider Threat", label: "Insider Threat" },
  { value: "DDoS Attack", label: "DDoS Attack" },
  { value: "Network Intrusion", label: "Network Intrusion" },
  { value: "System Compromise", label: "System Compromise" },
  { value: "Physical Security", label: "Physical Security" },
  { value: "Supply Chain Attack", label: "Supply Chain Attack" },
  { value: "Social Engineering", label: "Social Engineering" },
  { value: "Other", label: "Other" }
];

export default function IncidentPlaybookCreator() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedIncidentType, setSelectedIncidentType] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedPlaybook, setGeneratedPlaybook] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
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

  const generateAIPlaybook = async () => {
    if (!selectedIncidentType) {
      alert("Please select an incident type first");
      return;
    }

    setGenerating(true);
    setCopied(false);
    setGeneratedPlaybook(null);
    
    try {
      const prompt = `Create a comprehensive incident response playbook for ${selectedIncidentType} incidents. 

Company Context:
- Industry: ${currentUser?.company_industry || 'Technology'}
- Size: ${currentUser?.company_size || 'Medium'}

Please provide a detailed, actionable playbook with the following structure using proper Markdown formatting:

# ${selectedIncidentType} Incident Response Playbook

## 1. Incident Overview & Objectives
- Clear description of this incident type
- Primary objectives for response

## 2. Response Team Roles
Use proper Markdown table format:
| Role | Responsibilities |
|------|------------------|
| Role Name | Specific responsibilities for this incident type |

Include technical, business, legal, and communication roles as appropriate.

## 3. Response Phases
For each phase, use this format:
### Phase N: [Name]
- **Estimated Duration:** [time]
- **Key Steps:**
  1. [Step 1]
  2. [Step 2]
- **Critical Decisions:**
  - [Decision point 1]
  - [Decision point 2]

Include Detection, Containment, Eradication, Recovery, and Lessons Learned phases.

## 4. Communication Plan
### Internal Stakeholders
- [List stakeholders to notify]

### External Parties
- [Customers, regulators, law enforcement]

### Timing & Escalation
- [When to escalate and communication timing]

## 5. Key Decision Points & Escalation Criteria
### Escalation to Senior Management
- [Specific criteria]

### Law Enforcement/Regulatory Involvement
- [When to involve external authorities]

### ${selectedIncidentType}-Specific Thresholds
- [Incident-specific escalation triggers]

## 6. Tools and Resources
### Recommended Tools
- **[Category]:** [Tool names]
- **[Category]:** [Tool names]

### Contact Templates
- **Internal:** [Template info]
- **External:** [Template info]

### Documentation Requirements
- [What to document]
- [Required reports]

## 7. Industry-Specific Considerations
[Tailor this section specifically to ${currentUser?.company_industry || 'Technology'} companies]

Make this practical and specific to ${selectedIncidentType} incidents, not generic. Use proper Markdown table syntax for the roles section. Include industry-specific considerations for ${currentUser?.company_industry || 'Technology'} companies.`;

      const response = await InvokeLLM({
        prompt,
        feature: 'incident_playbook',
        add_context_from_internet: false
      });

      setGeneratedPlaybook(response);
    } catch (error) {
      console.error("Error generating playbook:", error);
      alert("Failed to generate playbook. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePhaseChange = (phaseName, currentPhase, totalPhases) => {
    console.log(`Generation phase: ${phaseName} (${currentPhase}/${totalPhases})`);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const downloadPlaybook = () => {
    const playbookContent = generatedPlaybook;
    const blob = new Blob([playbookContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedIncidentType.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-incident-playbook.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Simplified markdown components that preserve proper list hierarchy
  const markdownComponents = {
    h1: ({children}) => (
      <div className="mb-8 pb-4 border-b-2 border-cyan-500/30">
        <h1 className="text-3xl font-bold text-cyan-300 flex items-center">
          <FileText className="w-8 h-8 mr-3" />
          {children}
        </h1>
      </div>
    ),
    h2: ({children}) => {
      const text = children.toString().toLowerCase();
      let icon = Shield;
      let colorClass = 'text-cyan-300';
      
      if (text.includes('team roles')) {
        icon = Users;
        colorClass = 'text-emerald-300';
      } else if (text.includes('phases')) {
        icon = Clock;
        colorClass = 'text-blue-300';
      } else if (text.includes('communication')) {
        colorClass = 'text-purple-300';
      } else if (text.includes('decision') || text.includes('escalation')) {
        icon = AlertTriangle;
        colorClass = 'text-orange-300';
      }
      
      const IconComponent = icon;
      
      return (
        <Card className="bg-slate-800/40 border-slate-700/50 mb-6 mt-8">
          <CardHeader className="pb-3">
            <CardTitle className={`text-xl font-bold ${colorClass} flex items-center`}>
              <IconComponent className="w-6 h-6 mr-3" />
              {children}
            </CardTitle>
          </CardHeader>
        </Card>
      );
    },
    h3: ({children}) => (
      <div className="mb-4 mt-6">
        <h3 className="text-lg font-semibold text-white bg-slate-800/30 px-4 py-2 rounded-lg border-l-4 border-cyan-500">
          {children}
        </h3>
      </div>
    ),
    p: ({children}) => (
      <p className="text-gray-300 mb-4 leading-relaxed">
        {children}
      </p>
    ),
    // Remove custom list components entirely to preserve browser default behavior
    strong: ({children}) => (
      <strong className="text-white font-semibold">
        {children}
      </strong>
    ),
    em: ({children}) => (
      <em className="text-cyan-300 font-medium">
        {children}
      </em>
    ),
    code: ({children}) => (
      <code className="bg-slate-800 text-cyan-300 px-2 py-1 rounded text-sm border border-slate-700">
        {children}
      </code>
    ),
    pre: ({children}) => (
      <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto my-4 border border-slate-700">
        {children}
      </pre>
    ),
    hr: () => (
      <hr className="border-slate-700/50 my-8" />
    ),
    blockquote: ({children}) => (
      <blockquote className="border-l-4 border-cyan-500/50 pl-4 italic text-gray-400 my-4 bg-slate-800/20 py-2 rounded-r-lg">
        {children}
      </blockquote>
    ),
    table: ({children}) => (
      <div className="my-6 overflow-x-auto">
        <Table className="bg-slate-800/30 border border-slate-700/50 rounded-lg">
          {children}
        </Table>
      </div>
    ),
    thead: ({children}) => (
      <TableHeader className="bg-slate-700/50">
        {children}
      </TableHeader>
    ),
    tbody: ({children}) => (
      <TableBody>
        {children}
      </TableBody>
    ),
    tr: ({children}) => (
      <TableRow className="border-slate-700/50 hover:bg-slate-700/20">
        {children}
      </TableRow>
    ),
    th: ({children}) => (
      <TableHead className="text-cyan-300 font-semibold">
        {children}
      </TableHead>
    ),
    td: ({children}) => (
      <TableCell className="text-gray-300">
        {children}
      </TableCell>
    ),
  };

  return (
    <Card className="glass-effect border-slate-700/50 mb-6">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-xl font-semibold text-cyan-300 mb-2">
          Automated Playbook Generator
        </CardTitle>
        <p className="text-gray-400 text-center max-w-2xl mx-auto">
          Generate AI-powered incident response playbooks tailored to specific threat scenarios
        </p>
      </CardHeader>
      <CardContent className="text-center space-y-6">
        <div className="max-w-md mx-auto">
          <Select value={selectedIncidentType} onValueChange={setSelectedIncidentType}>
            <SelectTrigger className="bg-slate-800/50 border-gray-600 text-white">
              <SelectValue placeholder="Select incident type" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-gray-600">
              {incidentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value} className="text-white">
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={generateAIPlaybook}
          disabled={!selectedIncidentType || generating}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Playbook...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Playbook
            </>
          )}
        </Button>

        <p className="text-gray-500 text-sm max-w-lg mx-auto">
          AI will create a comprehensive, industry-specific incident response playbook
        </p>

        {/* Generation Animation */}
        {generating && (
          <PlaybookGenerationAnimation
            isGenerating={generating}
            incidentType={selectedIncidentType}
            onPhaseChange={handlePhaseChange}
          />
        )}

        {generatedPlaybook && (
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Generated Playbook</CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(generatedPlaybook)}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  onClick={downloadPlaybook}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Custom prose styling with proper list indentation */}
              <div className="bg-slate-900/50 rounded-lg p-6 max-h-[600px] overflow-y-auto">
                <div className="max-w-4xl mx-auto prose prose-invert prose-slate max-w-none
                  prose-headings:text-white 
                  prose-p:text-gray-300 
                  prose-strong:text-white 
                  prose-em:text-cyan-300
                  prose-ul:text-gray-300
                  prose-ol:text-gray-300
                  prose-li:text-gray-300
                  prose-li:leading-relaxed
                  prose-ul:space-y-2
                  prose-ol:space-y-2
                  prose-li:my-1
                  [&_ul]:list-disc
                  [&_ol]:list-decimal
                  [&_ul]:pl-6
                  [&_ol]:pl-6
                  [&_li]:ml-0
                  [&_ul_ul]:mt-2
                  [&_ol_ol]:mt-2
                  [&_ul_ul]:mb-2
                  [&_ol_ol]:mb-2
                  [&_ul_ul]:pl-6
                  [&_ol_ol]:pl-6
                  [&_ul_ol]:pl-6
                  [&_ol_ul]:pl-6
                ">
                  <ReactMarkdown components={markdownComponents}>
                    {generatedPlaybook}
                  </ReactMarkdown>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
