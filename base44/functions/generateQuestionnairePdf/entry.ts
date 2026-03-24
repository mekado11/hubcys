import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { jsPDF } from 'npm:jspdf@2.5.1';

function addQuestion(doc, num, text, x, y, maxWidth, pageHeight) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const qLabel = `${num}. `;
  doc.text(qLabel, x, y);
  const qWidth = doc.getTextWidth(qLabel);
  
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(text, maxWidth - qWidth);
  let currentY = y;
  
  lines.forEach((line, idx) => {
    if (currentY > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }
    doc.text(line, idx === 0 ? x + qWidth : x, currentY);
    currentY += 5;
  });
  
  return currentY;
}

function addAnswerSpace(doc, x, y, maxWidth, lines = 3, pageHeight) {
  let currentY = y + 2;
  doc.setDrawColor(200, 200, 200);
  
  for (let i = 0; i < lines; i++) {
    if (currentY > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }
    doc.line(x, currentY, x + maxWidth, currentY);
    currentY += 6;
  }
  
  return currentY;
}

function addCheckboxOption(doc, option, x, y, maxWidth, pageHeight) {
  if (y > pageHeight - 20) {
    doc.addPage();
    y = 20;
  }
  
  doc.rect(x, y - 3, 3, 3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(option, maxWidth - 6);
  let currentY = y;
  
  lines.forEach((line, idx) => {
    doc.text(line, x + 5, currentY);
    currentY += 4.5;
  });
  
  return currentY + 1;
}

function addSection(doc, title, x, y, maxWidth, pageHeight) {
  if (y > pageHeight - 30) {
    doc.addPage();
    y = 20;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title, x, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  return y + 8;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const maxWidth = pageWidth - margin * 2;
    let y = 30;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Fortigap Cybersecurity Assessment Questionnaire', margin, y);
    y += 10;
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    const instr = doc.splitTextToSize('Instructions: Please provide detailed answers for each question. For multiple-choice, check the box that applies. For maturity assessments, rate 0-5 and provide specific details about your environment.', maxWidth);
    instr.forEach(line => {
      doc.text(line, margin, y);
      y += 5;
    });
    y += 10;

    // Section 1
    y = addSection(doc, 'Section 1: Company & Assessment Information', margin, y, maxWidth, pageHeight);
    
    y = addQuestion(doc, '1.1', 'Describe what your company does, primary business focus, and key services/products:', margin, y, maxWidth, pageHeight);
    y = addAnswerSpace(doc, margin, y, maxWidth, 4, pageHeight);
    
    y = addQuestion(doc, '1.2', 'Industry Sector (check one):', margin, y, maxWidth, pageHeight);
    ['Healthcare & Life Sciences', 'Financial Services & Banking', 'Technology & Software', 'Manufacturing & Industrial', 'Retail & E-commerce', 'Education & Research', 'Government & Public Sector', 'Energy & Utilities', 'Legal & Professional Services', 'Other'].forEach(opt => {
      y = addCheckboxOption(doc, opt, margin + 5, y, maxWidth - 5, pageHeight);
    });
    
    y += 4;
    y = addQuestion(doc, '1.3', 'Company Size (check one):', margin, y, maxWidth, pageHeight);
    ['Small (1-50 employees)', 'Medium (51-500 employees)', 'Large (501-2,000 employees)', 'Enterprise (2,000+ employees)'].forEach(opt => {
      y = addCheckboxOption(doc, opt, margin + 5, y, maxWidth - 5, pageHeight);
    });
    
    y += 4;
    y = addQuestion(doc, '1.4', 'Applicable US State Privacy Laws (check all that apply):', margin, y, maxWidth, pageHeight);
    ['CCPA/CPRA (California)', 'VCDPA (Virginia)', 'CPA (Colorado)', 'UCPA (Utah)', 'CTDPA (Connecticut)', 'NY SHIELD Act', 'BIPA (Illinois)', 'Other state laws'].forEach(opt => {
      y = addCheckboxOption(doc, opt, margin + 5, y, maxWidth - 5, pageHeight);
    });
    
    y += 6;
    y = addQuestion(doc, '1.5', 'What are your organization\'s specific security and compliance goals for this assessment?', margin, y, maxWidth, pageHeight);
    y = addAnswerSpace(doc, margin, y, maxWidth, 4, pageHeight);
    
    y = addQuestion(doc, '1.6', 'Previous Security Assessments & Outstanding Issues:', margin, y, maxWidth, pageHeight);
    y = addAnswerSpace(doc, margin, y, maxWidth, 4, pageHeight);
    
    y = addQuestion(doc, '1.7', 'Current Top Security Concerns & Threat Landscape:', margin, y, maxWidth, pageHeight);
    y = addAnswerSpace(doc, margin, y, maxWidth, 4, pageHeight);
    
    y = addQuestion(doc, '1.8', 'Business-Critical Systems & Data at Risk:', margin, y, maxWidth, pageHeight);
    y = addAnswerSpace(doc, margin, y, maxWidth, 4, pageHeight);
    
    y = addQuestion(doc, '1.9', 'CISO Perspective & Leadership Context (key messages for executives):', margin, y, maxWidth, pageHeight);
    y = addAnswerSpace(doc, margin, y, maxWidth, 4, pageHeight);

    // Section 2
    doc.addPage();
    y = 30;
    y = addSection(doc, 'Section 2: Operational Security Practices', margin, y, maxWidth, pageHeight);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Endpoint & Device Management', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    y = addQuestion(doc, '2.1', 'What percentage of end-user workstations have local administrator privileges?', margin, y, maxWidth, pageHeight);
    ['0-10%', '11-30%', '31-60%', '61-90%', '91-100%'].forEach(opt => {
      y = addCheckboxOption(doc, opt, margin + 5, y, maxWidth - 5, pageHeight);
    });
    
    y += 4;
    y = addQuestion(doc, '2.2', 'How is new software typically installed on company-issued endpoints?', margin, y, maxWidth, pageHeight);
    ['Centrally managed (SCCM, Intune, application store)', 'Requires IT approval and manual installation by IT staff', 'Users can download but require IT approval for admin rights', 'Users can download and install freely using local admin privileges'].forEach(opt => {
      y = addCheckboxOption(doc, opt, margin + 5, y, maxWidth - 5, pageHeight);
    });
    
    y += 4;
    y = addQuestion(doc, '2.3', 'How frequently are security patches deployed to end-user workstations?', margin, y, maxWidth, pageHeight);
    ['Continuously/Weekly (automated)', 'Monthly (standard patch cycles)', 'Quarterly', 'Less often than quarterly or ad-hoc'].forEach(opt => {
      y = addCheckboxOption(doc, opt, margin + 5, y, maxWidth - 5, pageHeight);
    });
    
    y += 4;
    y = addQuestion(doc, '2.4', 'What percentage of endpoints have EDR (Endpoint Detection & Response) deployed?', margin, y, maxWidth, pageHeight);
    ['76-100% (Comprehensive)', '26-75% (Partial)', '1-25% (Pilot/Limited)', '0% (No EDR)'].forEach(opt => {
      y = addCheckboxOption(doc, opt, margin + 5, y, maxWidth - 5, pageHeight);
    });
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('BYOD & Remote Access', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    y = addQuestion(doc, '2.5', 'BYOD Policy & Security Controls:', margin, y, maxWidth, pageHeight);
    ['BYOD is not permitted', 'Comprehensive BYOD policy with strong security controls (MDM, app wrapping)', 'BYOD policy exists but controls are limited or inconsistent', 'BYOD is permitted but no formal policies or controls'].forEach(opt => {
      y = addCheckboxOption(doc, opt, margin + 5, y, maxWidth - 5, pageHeight);
    });
    
    y += 4;
    y = addQuestion(doc, '2.6', 'How do remote employees access internal networks and data?', margin, y, maxWidth, pageHeight);
    ['Zero Trust Network Access (ZTNA)', 'VPN with enforced multi-factor authentication (MFA)', 'Basic VPN without MFA', 'Direct internet access (no VPN)'].forEach(opt => {
      y = addCheckboxOption(doc, opt, margin + 5, y, maxWidth - 5, pageHeight);
    });
    
    y += 4;
    y = addQuestion(doc, '2.7', 'What percentage of company-owned mobile devices are managed by MDM/UEM?', margin, y, maxWidth, pageHeight);
    ['76-100%', '26-75%', '1-25%', '0%'].forEach(opt => {
      y = addCheckboxOption(doc, opt, margin + 5, y, maxWidth - 5, pageHeight);
    });
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Shadow IT & Cloud Services', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    y = addQuestion(doc, '2.8', 'How do you identify and manage unsanctioned cloud applications (Shadow IT)?', margin, y, maxWidth, pageHeight);
    ['Comprehensive monitoring (CASB, network traffic analysis) with policies', 'Basic monitoring tools (firewall logs, manual audits)', 'Reactive approach: investigate only when incident occurs', 'No process to identify or manage unsanctioned apps'].forEach(opt => {
      y = addCheckboxOption(doc, opt, margin + 5, y, maxWidth - 5, pageHeight);
    });
    
    y += 4;
    y = addQuestion(doc, '2.9', 'Policy on employees storing company data on personal cloud storage:', margin, y, maxWidth, pageHeight);
    ['Technical controls (DLP) actively prevent and detect unauthorized uploads', 'Technical controls block access to personal cloud storage', 'Policy prohibits it but no technical enforcement', 'No policy or restrictions'].forEach(opt => {
      y = addCheckboxOption(doc, opt, margin + 5, y, maxWidth - 5, pageHeight);
    });
    
    // Continue with more sections...
    doc.addPage();
    y = 30;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Network & Data Governance', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    y = addQuestion(doc, '2.10', 'How are devices authenticated when connecting to your internal network?', margin, y, maxWidth, pageHeight);
    ['Network Access Control (NAC) solution with posture checks and segmentation', 'Requires credentials for Wi-Fi/wired access with basic registration', 'Basic network authentication (shared Wi-Fi password)', 'Open access'].forEach(opt => {
      y = addCheckboxOption(doc, opt, margin + 5, y, maxWidth - 5, pageHeight);
    });
    
    y += 4;
    y = addQuestion(doc, '2.11', 'Is a formal data classification system defined and applied?', margin, y, maxWidth, pageHeight);
    ['Well-defined and actively enforced with technical controls', 'Defined and documented but enforcement is inconsistent/manual', 'General understanding exists but no formal classification system', 'No formal data classification system'].forEach(opt => {
      y = addCheckboxOption(doc, opt, margin + 5, y, maxWidth - 5, pageHeight);
    });
    
    y += 4;
    y = addQuestion(doc, '2.12', 'When an employee leaves, what is the process for revoking access and securing data?', margin, y, maxWidth, pageHeight);
    ['Automated de-provisioning workflows (IdP + MDM integrated)', 'Standardized checklist including remote wipe for all devices', 'Manual checklist; data removal from personal devices not enforced', 'No formal process'].forEach(opt => {
      y = addCheckboxOption(doc, opt, margin + 5, y, maxWidth - 5, pageHeight);
    });
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Advanced Security Controls', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    y = addQuestion(doc, '2.13', 'Are security logs centrally collected and analyzed by a SIEM or similar system?', margin, y, maxWidth, pageHeight);
    ['Yes, logs fed into SIEM for real-time correlation and alerting', 'Logs centrally collected but analysis is basic or inconsistent', 'Logs collected but only reviewed manually/reactively during incidents', 'No central logging or analysis'].forEach(opt => {
      y = addCheckboxOption(doc, opt, margin + 5, y, maxWidth - 5, pageHeight);
    });
    
    y += 4;
    y = addQuestion(doc, '2.14', 'How often are vulnerability scans performed on endpoints?', margin, y, maxWidth, pageHeight);
    ['Monthly or more frequently (automated)', 'Quarterly or semi-annually', 'Annually or less frequently', 'Never or only upon request/incident'].forEach(opt => {
      y = addCheckboxOption(doc, opt, margin + 5, y, maxWidth - 5, pageHeight);
    });
    
    y += 4;
    y = addQuestion(doc, '2.15', 'Are Data Loss Prevention (DLP) measures implemented on endpoints?', margin, y, maxWidth, pageHeight);
    ['Comprehensive DLP solution deployed, actively monitoring/blocking exfiltration', 'Basic DLP (e.g., blocking USBs, preventing specific websites)', 'Policies exist but no technical enforcement or monitoring', 'No DLP measures'].forEach(opt => {
      y = addCheckboxOption(doc, opt, margin + 5, y, maxWidth - 5, pageHeight);
    });
    
    y += 4;
    y = addQuestion(doc, '2.16', 'Are security baseline configurations enforced across all endpoints?', margin, y, maxWidth, pageHeight);
    ['Baselines centrally managed and automatically enforced/monitored with auto-remediation', 'Baselines defined and implemented with periodic audits for compliance', 'Baselines defined but manually implemented or inconsistently applied', 'No defined security baselines'].forEach(opt => {
      y = addCheckboxOption(doc, opt, margin + 5, y, maxWidth - 5, pageHeight);
    });
    
    // Section 3 - Maturity Assessment
    doc.addPage();
    y = 30;
    y = addSection(doc, 'Section 3: Security Maturity Assessment', margin, y, maxWidth, pageHeight);
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    const matInstr = doc.splitTextToSize('For each domain below: (1) Rate your maturity from 0-5 using the descriptions provided, (2) Check N/A if not applicable, (3) Provide specific details about your environment, tools, and processes.', maxWidth);
    matInstr.forEach(line => {
      doc.text(line, margin, y);
      y += 5;
    });
    y += 6;
    
    const maturityDomains = [
      {
        name: 'Identity (IAM, SSO, MFA, JML)',
        levels: [
          '0 - Ad-Hoc: Shared credentials, no formal access control',
          '1 - Basic IAM: Individual accounts exist, basic password policies',
          '2 - MFA & SSO: MFA enforced on critical apps, some SSO',
          '3 - RBAC: Defined roles, automated Joiner/Mover/Leaver (JML)',
          '4 - PAM: PAM solution for sensitive access, regular reviews',
          '5 - Zero Trust: Continuous verification, context-aware access'
        ]
      },
      {
        name: 'Asset Management (Inventory, ownership, classification)',
        levels: [
          '0 - No Inventory: No formal tracking',
          '1 - Manual: Spreadsheet-based tracking, often outdated',
          '2 - Automated Discovery: Scanning tools identify assets',
          '3 - Centralized CMDB: Central database tracks assets and configurations',
          '4 - Ownership & Classification: Assets have owners and data is classified',
          '5 - Lifecycle Management: Full lifecycle tracking from procurement to disposal'
        ]
      },
      {
        name: 'Infrastructure Security (Endpoints, firewalls, networks)',
        levels: [
          '0 - No Defenses: No endpoint protection or network firewalls',
          '1 - Basic Defenses: Antivirus on endpoints, basic perimeter firewall',
          '2 - Hardening & Patching: Systems hardened, regular vulnerability patching',
          '3 - Network Segmentation: Internal network is segmented',
          '4 - EDR & Advanced Firewalls: EDR and NGFW/WAF deployed',
          '5 - Micro-segmentation: Workloads isolated with granular policies'
        ]
      },
      {
        name: 'Application Security (SDLC, code scanning, dependencies)',
        levels: [
          '0 - No AppSec: No security involvement in software development',
          '1 - Occasional Testing: Annual penetration tests on major applications',
          '2 - Developer Training: Developers receive secure coding training',
          '3 - Integrated SAST/DAST: Static and dynamic scanning integrated into CI/CD',
          '4 - Dependency Management: SCA manages libraries and dependencies',
          '5 - Threat Modeling: Threat modeling is standard part of design'
        ]
      },
      {
        name: 'Supply Chain Risk (Vendor & supplier security)',
        levels: [
          '0 - No Vendor Review: Vendors onboarded without security checks',
          '1 - Basic Questionnaires: Simple security questionnaires sent to vendors',
          '2 - Risk-Based Assessments: Assessments based on vendor criticality',
          '3 - Contractual Requirements: Security requirements in contracts',
          '4 - Continuous Monitoring: Vendor security posture monitored continuously',
          '5 - Supply Chain Integration: Deep integration, SBOM review, vendor validation'
        ]
      }
    ];
    
    maturityDomains.forEach((domain, idx) => {
      if (y > pageHeight - 100) {
        doc.addPage();
        y = 30;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`3.${idx + 1} ${domain.name}`, margin, y);
      y += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      domain.levels.forEach(level => {
        const lines = doc.splitTextToSize(level, maxWidth);
        lines.forEach(line => {
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, margin + 3, y);
          y += 4;
        });
      });
      
      y += 3;
      doc.setFontSize(9);
      doc.text('Your Rating (0-5): _____     Not Applicable: [ ]', margin, y);
      y += 6;
      doc.text('Your Specific Details (tools, processes, examples):', margin, y);
      y += 2;
      y = addAnswerSpace(doc, margin, y, maxWidth, 3, pageHeight);
      y += 6;
    });
    
    // Remaining domains abbreviated for length...
    doc.addPage();
    y = 30;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Additional Maturity Domains (continued):', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Please rate the following domains using the same 0-5 scale and provide details:', margin, y);
    y += 8;
    
    ['Incident Response', 'Governance & Risk', 'Data Protection', 'Security Training', 'Cloud Security', 'Business Continuity'].forEach((dom, idx) => {
      doc.text(`3.${maturityDomains.length + idx + 1} ${dom}`, margin, y);
      y += 5;
      doc.text('Rating (0-5): _____     N/A: [ ]', margin + 3, y);
      y += 5;
      doc.text('Details:', margin + 3, y);
      y = addAnswerSpace(doc, margin + 3, y, maxWidth - 3, 2, pageHeight);
      y += 6;
    });
    
    // Section 4
    doc.addPage();
    y = 30;
    y = addSection(doc, 'Section 4: NIS2 Directive Alignment (if applicable)', margin, y, maxWidth, pageHeight);
    
    y = addQuestion(doc, '4.1', 'Supply Chain & Third-Party Security:', margin, y, maxWidth, pageHeight);
    y = addAnswerSpace(doc, margin, y, maxWidth, 3, pageHeight);
    
    y = addQuestion(doc, '4.2', 'Business Continuity & Crisis Management:', margin, y, maxWidth, pageHeight);
    y = addAnswerSpace(doc, margin, y, maxWidth, 3, pageHeight);
    
    y = addQuestion(doc, '4.3', 'Vulnerability Handling & Disclosure:', margin, y, maxWidth, pageHeight);
    y = addAnswerSpace(doc, margin, y, maxWidth, 3, pageHeight);
    
    y = addQuestion(doc, '4.4', 'Use of Cryptography & Encryption:', margin, y, maxWidth, pageHeight);
    y = addAnswerSpace(doc, margin, y, maxWidth, 3, pageHeight);

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="fortigap_assessment_questionnaire.pdf"',
      },
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
});