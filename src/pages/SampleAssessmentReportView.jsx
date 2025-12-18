
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RadarChart from '../components/assessment/RadarChart';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Printer } from 'lucide-react';
import { Label } from '@/components/ui/label';

const sampleData = {
  company_name: "Innovatech Solutions",
  industry_sector: "Technology",
  company_size: "Medium_51_500",
  overall_score: 72,
  maturity_level: 'Intermediate',
  maturity_identity: 4,
  maturity_asset_management: 3,
  maturity_infra_security: 3,
  maturity_app_security: 4,
  maturity_third_party_risk: 2,
  maturity_incident_response: 3,
  maturity_governance_risk: 4,
  maturity_data_protection: 3,
  maturity_security_training: 4,
  maturity_cloud_security: 5,
  smart_analysis: {
    executive_summary: {
      overview: "This assessment for Innovatech Solutions, a medium-sized tech company, reveals an 'Intermediate' cybersecurity maturity. The company demonstrates solid practices in cloud security and identity management but shows significant gaps in third-party risk management that require immediate attention.",
      current_maturity_score: "Overall Maturity Score: **72%** (Intermediate)",
      identified_gaps: `
*   **Third-Party Risk Management:** Lack of a formal vendor assessment process and insufficient supply chain security measures.
*   **Asset Management:** Incomplete asset inventory and inconsistent data classification.
*   **Infrastructure Security:** Outdated endpoint protection on several legacy systems.`,
      recommendations: `
*   Implement a formal Vendor Risk Management (VRM) program within the next 90 days.
*   Deploy an automated asset discovery tool to create a comprehensive, real-time asset inventory.
*   Standardize endpoint protection across all devices and decommission unsupported legacy systems.`
    },
    key_findings: `
### Overall Strengths
Innovatech Solutions has established a strong foundation in **Cloud Security**, leveraging native cloud provider tools effectively. Their **Identity and Access Management** program is also mature, with widespread MFA adoption and a clear JML process.

### Critical Gaps & Weaknesses
The most critical weakness lies in **Third-Party Risk Management**. Without a formal process to vet vendors, the company is exposed to significant supply chain risks. This is closely followed by **Asset Management**, where an incomplete inventory makes it impossible to effectively protect all company assets.

### Path to Maturity: Third-Party Risk
From the current level of '2', the path to '5' involves:
1.  **Level 3 (Implemented):** Develop and implement a formal vendor risk assessment questionnaire. Classify all vendors by risk tier.
2.  **Level 4 (Reviewed):** Conduct periodic reviews of high-risk vendors and demand security compliance documentation (e.g., SOC 2 reports).
3.  **Level 5 (Monitored & Improved):** Implement a continuous monitoring solution for key vendors and integrate third-party risk into the overall security program.

### Path to Maturity: Asset Management
From the current level of '3', the path to '5' involves:
1.  **Level 4 (Reviewed):** Implement an automated asset discovery tool to maintain a real-time inventory. Conduct quarterly reviews of the asset inventory and data classification policy with department heads.
2.  **Level 5 (Monitored & Improved):** Integrate the asset inventory with the vulnerability management program to ensure all assets are scanned. Automate alerts for unmanaged or newly discovered devices on the network.`
  }
};

const getMaturityColor = (level) => {
    switch (level) {
      case 'Expert': return 'bg-cyan-500 text-white';
      case 'Advanced': return 'bg-green-500 text-white';
      case 'Intermediate': return 'bg-yellow-500 text-black';
      case 'Developing': return 'bg-orange-500 text-white';
      default: return 'bg-red-500 text-white';
    }
};

const renderMarkdown = (content) => {
  return (
    <div className="markdown-dark-text">
      <ReactMarkdown 
        components={{
          p: ({children}) => <p style={{color: '#1a202c', margin: '0.5rem 0'}}>{children}</p>,
          strong: ({children}) => <strong style={{color: '#1a202c', fontWeight: 700}}>{children}</strong>,
          ul: ({children}) => <ul style={{color: '#1a202c', listStyleType: 'disc', paddingLeft: '1.25rem'}}>{children}</ul>,
          ol: ({children}) => <ol style={{color: '#1a202c', listStyleType: 'decimal', paddingLeft: '1.25rem'}}>{children}</ol>,
          li: ({children}) => <li style={{color: '#1a202c'}}>{children}</li>,
          h3: ({children}) => <h3 style={{color: '#1a202c', fontSize: '1.125rem', fontWeight: 600, marginTop: '1rem', marginBottom: '0.5rem'}}>{children}</h3>,
          h2: ({children}) => <h2 style={{color: '#1a202c', fontSize: '1.25rem', fontWeight: 600, marginTop: '1rem', marginBottom: '0.5rem'}}>{children}</h2>,
          em: ({children}) => <em style={{color: '#2d3748'}}>{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default function SampleAssessmentReportView() {
  return (
    <div className="bg-gray-100 min-h-screen font-sans">
       <style>{`
          @media print {
            .no-print { display: none; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          
          .markdown-dark-text * {
            color: #1a202c !important;
          }
        `}</style>
      <header className="bg-white shadow-md p-4 no-print">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link to={createPageUrl("LandingPage")}>
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex gap-2">
             <Button variant="outline" onClick={() => window.print()} className="border-gray-300 text-gray-700 hover:bg-gray-100">
                <Printer className="w-4 h-4 mr-2" /> Print Report
             </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-lg shadow-xl p-6 md:p-10">
          {/* Report Header */}
          <section className="text-center border-b border-gray-300 pb-8 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Cybersecurity Gap Analysis Report</h1>
            <h2 className="text-xl md:text-2xl font-semibold text-blue-600 mb-4">{sampleData.company_name}</h2>
            <p className="text-sm text-gray-700">Generated on: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </section>

          {/* Company Overview & Score */}
          <section className="mb-10">
            <Card className="bg-gray-50 border-gray-300">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Executive Overview</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-800 font-semibold">Industry</Label>
                    <p className="font-semibold text-lg text-gray-900">{sampleData.industry_sector}</p>
                  </div>
                  <div>
                    <Label className="text-gray-800 font-semibold">Company Size</Label>
                    <p className="font-semibold text-lg text-gray-900">{sampleData.company_size.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <div className="text-center bg-white p-6 rounded-lg border border-gray-200">
                  <p className="text-5xl font-bold text-gray-900">{sampleData.overall_score}%</p>
                  <div className={`mt-2 inline-block px-4 py-1 rounded-full text-lg font-semibold ${getMaturityColor(sampleData.maturity_level)}`}>
                    {sampleData.maturity_level}
                  </div>
                  <p className="text-sm text-gray-700 mt-1">Overall Maturity Score</p>
                </div>
              </CardContent>
            </Card>
          </section>
          
          {/* Executive Summary */}
          <section className="mb-10 page-break-before">
             <Card className="bg-gray-50 border-gray-300">
                <CardHeader><CardTitle className="text-2xl text-gray-900">AI-Powered Executive Summary</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   {renderMarkdown(sampleData.smart_analysis.executive_summary.overview)}
                   {renderMarkdown(sampleData.smart_analysis.executive_summary.identified_gaps)}
                   {renderMarkdown(sampleData.smart_analysis.executive_summary.recommendations)}
                </CardContent>
             </Card>
          </section>
          
          {/* Overall Security Posture */}
          <section className="mb-10">
            <Card className="bg-gray-50 border-gray-300">
              <CardHeader><CardTitle className="text-2xl text-gray-900">Overall Security Posture</CardTitle></CardHeader>
              <CardContent>
                <div className="h-80 md:h-96 w-full">
                  <RadarChart data={sampleData} />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Key Findings */}
          <section className="page-break-before">
             <Card className="bg-gray-50 border-gray-300">
                <CardHeader><CardTitle className="text-2xl text-gray-900">Key Findings & Analysis</CardTitle></CardHeader>
                <CardContent>
                   {renderMarkdown(sampleData.smart_analysis.key_findings)}
                </CardContent>
             </Card>
          </section>

          <footer className="text-center text-xs text-gray-600 mt-12 pt-6 border-t border-gray-300">
            Confidential and Proprietary | Generated by Hubcys
          </footer>
        </div>
      </main>
    </div>
  );
}
