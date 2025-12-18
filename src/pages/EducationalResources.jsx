
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield, Users, AlertTriangle, ChevronDown, BookOpen, Scale, Globe, Wrench, Target, Lightbulb, AlertCircle, ListChecks, TrendingUp, BarChart3, Gavel, FileText, Sparkles, Search, Brain, UserCog, Settings, Zap, Camera, Key, Code2, ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ReactMarkdown from 'react-markdown';
import SecurityToolsGuide from "../components/security/SecurityToolsGuide";


export default function EducationalResources() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (key) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const educationalContent = [
    // Updated: How to Use Hubcys - now includes operational security form
    {
      key: 'how_to_use',
      type: 'structured_guide',
      name: "How to Use Hubcys",
      icon: BookOpen,
      color: 'blue',
      description: "Complete step-by-step guide to using Hubcys effectively for your cybersecurity assessments.",
      sections: [
        {
          title: 'Getting Started',
          icon: Target,
          frameworks: [
            {
              name: 'Company Profile Setup',
              fullName: 'Step 1: Establish Your Organization Context',
              purpose: 'Provide essential organizational information to tailor the assessment to your specific environment and compliance needs.',
              keyRequirements: [
                'Company Information: Enter organization name and description',
                'Industry Selection: Choose primary industry sector for tailored analysis',
                'Company Size: Select organization size for appropriate recommendations',
                'Compliance Framework: Pick relevant security framework (NIST CSF, ISO 27001, etc.)',
                'Security Goals: Describe specific security and compliance objectives'
              ]
            },
            {
              name: 'Operational Security Assessment',
              fullName: 'Step 2: Evaluate Current Security Operations',
              purpose: 'Assess your organization\'s operational security practices across endpoints, access controls, and daily security processes.',
              keyRequirements: [
                'Endpoint Security: Evaluate admin privileges, software installation controls, and patch management',
                'Access Controls: Assess remote access methods, network access controls, and BYOD policies',
                'Data Management: Review data classification systems, cloud storage policies, and offboarding processes',
                'Security Monitoring: Evaluate EDR coverage, centralized logging, and vulnerability scanning',
                'Mobile Security: Assess mobile device management and security controls'
              ],
              systemComponents: [
                'Local Administrator Privileges Assessment',
                'Software Installation Control Evaluation',
                'BYOD Security Policy Review',
                'Remote Access Security Analysis',
                'Shadow IT Discovery and Management',
                'Personal Cloud Storage Controls',
                'Patch Management Process Review',
                'Mobile Device Management Coverage',
                'Data Classification Implementation',
                'Network Access Control Assessment',
                'Employee Offboarding Security Process',
                'Endpoint Detection and Response Coverage'
              ]
            },
            {
              name: 'Security Maturity Assessment',
              fullName: 'Step 3: Evaluate Your Security Posture',
              purpose: 'Assess your organization across key security domains using a structured maturity model.',
              keyRequirements: [
                'Domain Assessment: Evaluate 10+ security categories',
                'Maturity Rating: Use 0-5 scale for each domain',
                'Contextual Details: Provide qualitative information for accurate analysis',
                'N/A Options: Mark domains as not applicable if relevant'
              ],
              systemComponents: [
                'Identity & Access Management',
                'Asset & Configuration Management',
                'Infrastructure Security',
                'Application Security',
                'Third-Party Risk Management',
                'Incident Response & Recovery',
                'Governance & Risk Management',
                'Data Protection',
                'Security Training & Awareness',
                'Cloud Security'
              ]
            }
          ]
        },
        {
          title: 'Assessment Process',
          icon: Shield,
          frameworks: [
            {
              name: 'Maturity Rating Scale',
              fullName: 'Understanding the 0-5 Assessment Scale',
              purpose: 'Consistent evaluation framework for measuring security control maturity across all domains.',
              keyRequirements: [
                'Level 0: No controls in place',
                'Level 1: Basic/ad-hoc controls',
                'Level 2: Some formal processes',
                'Level 3: Documented and tested procedures',
                'Level 4: Advanced/automated capabilities',
                'Level 5: Industry-leading maturity'
              ]
            },
            {
              name: 'Smart Analysis Generation',
              fullName: 'Step 4: AI-Powered Gap Analysis',
              purpose: 'Leverage artificial intelligence to generate personalized recommendations based on your specific context.',
              keyRequirements: [
                'Contextual Analysis: AI considers your industry, size, and compliance needs',
                'Gap Identification: Pinpoints specific security weaknesses',
                'Prioritized Recommendations: Actions ranked by impact and feasibility',
                'Compliance Mapping: Links recommendations to relevant standards'
              ]
            }
          ]
        },
        {
          title: 'Results and Action Planning',
          icon: TrendingUp,
          frameworks: [
            {
              name: 'Strategic Action Planning',
              fullName: 'Step 5: Convert Insights into Action',
              purpose: 'Transform assessment results into executable improvement plans with clear timelines and priorities.',
              keyRequirements: [
                '30-Day Actions: Quick wins and immediate improvements',
                '60-Day Initiatives: Medium-term strategic projects',
                '90-Day Goals: Long-term transformation objectives',
                'Resource Planning: Effort estimates and team assignments'
              ]
            },
            {
              name: 'Progress Tracking',
              fullName: 'Step 6: Monitor and Measure Improvement',
              purpose: 'Track implementation progress and measure security posture improvements over time.',
              keyRequirements: [
                'Action Item Management: Track task completion and status',
                'Team Collaboration: Assign responsibilities and share progress',
                'Periodic Reassessment: Conduct regular maturity evaluations',
                'Trend Analysis: Visualize improvement over time'
              ]
            }
          ]
        }
      ],
      guidance: {
        selection: {
          title: 'Best Practices for Effective Assessments',
          icon: Lightbulb,
          decisionMatrix: {
            headers: ['Assessment Phase', 'Key Success Factor', 'Common Pitfall to Avoid'],
            rows: [
              ['Company Profile', 'Detailed, honest information', 'Generic or incomplete details'],
              ['Operational Security', 'Evidence-based responses', 'Aspirational rather than current state'],
              ['Maturity Rating', 'Evidence-based scoring', 'Aspirational rather than current state'],
              ['Contextual Details', 'Specific technical information', 'High-level generalizations'],
              ['Action Planning', 'Realistic timelines', 'Overly ambitious schedules'],
              ['Implementation', 'Regular progress updates', 'Set and forget mentality']
            ]
          }
        },
        implementationTips: {
          title: 'Pro Tips for Maximum Value',
          icon: Target,
          tips: [
            '**Involve Multiple Stakeholders:** Include IT, security, compliance, and business teams for comprehensive input',
            '**Be Brutally Honest:** Accurate current state assessment leads to better recommendations',
            '**Provide Technical Details:** Specific tools, configurations, and processes improve AI analysis quality',
            '**Regular Reassessment:** Conduct quarterly or bi-annual evaluations to track progress',
            '**Document Everything:** Maintain records of decisions and implementation progress'
          ]
        },
        commonChallenges: {
          title: 'Common Implementation Challenges',
          icon: AlertCircle,
          challenges: [
            '**Resource Constraints:** Balancing security improvements with operational demands',
            '**Stakeholder Buy-in:** Getting leadership support for recommended investments',
            '**Technical Complexity:** Implementing advanced security controls without disrupting operations',
            '**Change Management:** Ensuring team adoption of new processes and tools',
            '**Compliance Fatigue:** Maintaining momentum across long-term improvement initiatives'
          ]
        }
      }
    },

    // Policy Generation Guide
    {
      key: 'policy_generation',
      type: 'structured_guide',
      name: 'AI Policy Generation',
      icon: Sparkles,
      color: 'purple',
      description: 'Comprehensive guide to generating standards-based security policy templates using AI.',
      sections: [
        {
          title: 'Getting Started with Policy Generation',
          icon: FileText,
          frameworks: [
            {
              name: 'Accessing Policy Generation',
              fullName: 'Navigate to Policy Creation',
              purpose: 'Learn how to access the AI-powered policy generation feature within Hubcys.',
              keyRequirements: [
                'Navigate to Policy Library from the main menu',
                'Click "Create New Policy" button',
                'Select "Generate Policy Template" option',
                'Choose your desired policy type from the dropdown'
              ]
            },
            {
              name: 'Policy Template Standards',
              fullName: 'Standards-Based Template Generation',
              purpose: 'Understand how generated policies align with major compliance frameworks.',
              keyRequirements: [
                'NIST Cybersecurity Framework integration (Identify, Protect, Detect, Respond, Recover)',
                'SOC 2 Trust Services Criteria alignment (Security, Availability, Confidentiality)',
                'ISO 27001/27002 Annex A controls mapping',
                'Industry best practices and common requirements'
              ]
            }
          ]
        }
      ],
      guidance: {
        selection: {
          title: 'Policy Type Selection Guide',
          icon: Target,
          decisionMatrix: {
            headers: ['Policy Type', 'Primary Use Case', 'Key Standards Addressed'],
            rows: [
              ['Access Control', 'User access management and authentication', 'NIST AC family, ISO 27002 A.9, SOC 2 CC6'],
              ['Incident Response', 'Security incident handling procedures', 'NIST Respond function, ISO 27035, SOC 2 CC7'],
              ['Data Protection', 'Data classification and handling', 'NIST PR.DS, ISO 27002 A.8, SOC 2 CC6']
            ]
          }
        },
        implementationTips: {
          title: 'Policy Generation Best Practices',
          icon: Lightbulb,
          tips: [
            '**Start with Core Policies:** Begin with Access Control, Incident Response, and Data Protection policies',
            '**Review Before Customization:** Read the entire generated template to understand its structure',
            '**Copy to Word Processor:** Use external tools for easier editing and collaboration'
          ]
        },
        commonChallenges: {
          title: 'Policy Implementation Challenges',
          icon: AlertCircle,
          challenges: [
            '**Generic Language:** Templates require significant customization for your specific environment',
            '**Technical Accuracy:** Ensure technical requirements match your actual systems and capabilities'
          ]
        }
      }
    },

    // Reports Management Guide
    {
      key: 'reports_management',
      type: 'guide',
      name: 'Reports Management',
      icon: BarChart3,
      color: 'green',
      description: 'Complete guide to viewing, downloading, and managing assessment reports.',
      content: `## Accessing Your Reports

Navigate to **Reports** from the main menu to view all completed assessments and their generated reports.

## Report Dashboard Overview

The Reports page displays:
- Assessment Title & Date: When the assessment was created
- Company Information: Organization details from the assessment  
- Maturity Score: Overall security maturity percentage
- Maturity Level: Classification (Beginner, Developing, Intermediate, Advanced, Expert)
- Status Badge: Current status of the assessment

## Viewing Reports

### Professional Report View
Click "View Report" to see the full professional assessment report including:
- Executive summary with key findings
- Detailed maturity analysis by domain
- Risk assessment and prioritized recommendations
- Action items organized by timeframe (30/60/90 days)
- Compliance framework alignment

## Downloading Reports

### PDF Generation
1. Click "Download PDF" from any assessment row
2. Wait for PDF generation (may take 10-30 seconds)
3. PDF will automatically download to your device
4. Rate Limiting: Wait at least 10 seconds between PDF generations

## Managing Reports

### Deleting Reports
⚠️ Caution: This action permanently deletes the entire assessment and cannot be undone.

To delete a report:
1. Click the three dots menu next to any assessment
2. Select "Delete Report"
3. Confirm deletion in the dialog box
4. Assessment and all related data will be permanently removed

## Best Practices

### Report Organization
- Use clear, descriptive assessment titles
- Include dates in assessment names for version tracking
- Maintain separate assessments for different compliance frameworks

### Sharing Reports
- PDF reports are designed for executive and stakeholder sharing
- Remove sensitive technical details before external sharing
- Consider creating summary versions for different audiences`
    },

    // Security Intelligence & Reconnaissance Tools
    {
      key: 'security_intelligence_tools',
      type: 'structured_guide',
      name: 'Security Intelligence & Reconnaissance Tools',
      icon: Search,
      color: 'cyan',
      description: 'Comprehensive guide to using Hubcys security intelligence and reconnaissance capabilities.',
      sections: [
        {
          title: 'Web Security Scanner',
          icon: Globe,
          frameworks: [
            {
              name: 'URL Security Analysis',
              fullName: 'Comprehensive Website Security Assessment',
              purpose: 'Analyze websites and domains for security risks, vulnerabilities, and threat indicators.',
              keyRequirements: [
                'Enter target URL or domain for analysis',
                'Automated security header analysis (HSTS, CSP, X-Frame-Options)',
                'SSL/TLS certificate validation and security assessment',
                'Common vulnerability detection (missing headers, weak configurations)',
                'Security score calculation and risk assessment'
              ]
            }
          ]
        }
      ],
      guidance: {
        selection: {
          title: 'Tool Selection Guide',
          icon: Target,
          decisionMatrix: {
            headers: ['Tool', 'Primary Use Case', 'When to Use'],
            rows: [
              ['Web Scanner', 'Website security assessment', 'Evaluating external web applications and APIs'],
              ['CVE Database', 'Vulnerability research', 'Investigating known vulnerabilities and patch priority']
            ]
          }
        },
        implementationTips: {
          title: 'Effective Use of Intelligence Tools',
          icon: Lightbulb,
          tips: [
            '**Combine Multiple Sources:** Use multiple tools together for comprehensive analysis',
            '**Regular Monitoring:** Conduct periodic surface exposure scans to track changes'
          ]
        },
        commonChallenges: {
          title: 'Intelligence Gathering Challenges',
          icon: AlertCircle,
          challenges: [
            '**Rate Limiting:** Some tools have usage limits to prevent abuse',
            '**False Positives:** Not all identified vulnerabilities may be exploitable in your environment'
          ]
        }
      }
    },

    // Policy Center explainer 
    {
      key: 'policy_center_overview',
      type: 'guide',
      name: 'Policy Center',
      icon: Gavel,
      color: 'purple',
      description: 'Generate standards-aligned policies in minutes, tailored to your company context.',
      content: `Hubcys Policy Center helps small and mid-sized teams create production-ready security policies—instantly.

What you get:
- Policies aligned to NIST CSF, ISO 27001 Annex A, and SOC 2 Common Criteria
- Clear, enforceable statements and step-by-step procedures
- Small-business friendly language and a practical implementation checklist
- One-click save to your Policy Library

Recommended policies:
- Access Control, Incident Response, Business Continuity
- Third-Party Risk Management, Vulnerability Management, Password Policy

Start here: [Open the Policy Center](/PolicyCenter)`
    },

    {
      key: 'us_privacy_laws',
      type: 'structured_guide',
      name: "US State Privacy Laws",
      icon: Scale,
      color: 'amber',
      description: "Comprehensive overview of major US state privacy legislation and compliance requirements.",
      sections: [
        {
          title: 'Major State Privacy Legislation',
          icon: Globe,
          frameworks: [
            {
              name: 'CCPA/CPRA',
              fullName: 'California Consumer Privacy Act / California Privacy Rights Act',
              purpose: 'Provides comprehensive privacy rights to California residents and regulates how businesses collect, use, and share personal information.',
              whoNeedsIt: [
                'Businesses with gross annual revenues over $25M',
                'Companies processing personal information of 100,000+ CA residents',
                'Organizations deriving 50%+ revenue from selling personal information'
              ],
              keyRequirements: [
                'Consumer Rights: Right to know, delete, correct, and opt-out of sale/sharing',
                'Data Minimization: Collect only necessary data for disclosed purposes',
                'Privacy Notice: Clear disclosure of data collection, use, and sharing practices',
                'Sensitive Data: Enhanced protections for sensitive personal information',
                'Risk Assessments: Mandatory for high-risk processing activities',
                'Data Security: Reasonable security measures to protect personal information'
              ],
              impactLevels: [
                '**Business Obligations:** Implement consumer request processes within 45 days',
                '**Record Keeping:** Maintain detailed records of data processing activities',
                '**Training Requirements:** Train staff on privacy compliance requirements',
                '**Vendor Management:** Establish oversight for third-party processors'
              ]
            }
          ]
        }
      ],
      guidance: {
        selection: {
          title: 'Does This Law Apply to You?',
          icon: Target,
          decisionMatrix: {
            headers: ['State Law', 'Threshold Requirements', 'Key Trigger'],
            rows: [
              ['CCPA/CPRA', '$25M+ revenue OR 100,000+ CA residents', 'Revenue or resident count'],
              ['VCDPA', '100,000+ VA residents OR 25,000+ with sales', 'Processing volume']
            ]
          }
        },
        implementationTips: {
          title: 'Implementation Steps',
          icon: Lightbulb,
          tips: [
            '**Conduct Data Mapping:** Inventory all personal data collection, processing, and sharing activities',
            '**Assess Applicability:** Determine which state laws apply based on your data processing activities'
          ]
        },
        commonChallenges: {
          title: 'Common Compliance Challenges',
          icon: AlertCircle,
          challenges: [
            '**Multi-State Complexity:** Managing compliance across different state requirements simultaneously',
            '**Evolving Regulations:** Keeping up with frequent updates and new state laws'
          ]
        }
      }
    },

    {
      key: 'risk_scoring_methodology',
      type: 'structured_guide',
      name: 'Risk Scoring Methodology: Likelihood & Impact',
      icon: Scale,
      color: 'orange',
      description: 'Understand how to effectively rate the likelihood and impact of cybersecurity risks using the 1-5 scale.',
      sections: [
        {
          title: 'Understanding Likelihood Assessment',
          icon: Target,
          frameworks: [
            {
              name: 'Likelihood Scale (1-5)',
              fullName: 'Probability Assessment Framework',
              purpose: 'Systematic approach to evaluating how probable it is that a risk will occur based on your organization context.',
              keyRequirements: [
                '1 - Very Unlikely/Rare: May occur only in exceptional circumstances',
                '2 - Unlikely/Seldom: Could happen but not expected frequently',
                '3 - Possible/Occasional: Might occur - moderate expectation',
                '4 - Likely/Frequent: Expected in most circumstances',
                '5 - Very Likely/Almost Certain: Expected in almost all circumstances'
              ]
            }
          ]
        }
      ],
      guidance: {
        selection: {
          title: 'Risk Assessment Examples',
          icon: Lightbulb,
          decisionMatrix: {
            headers: ['Risk Scenario', 'Likelihood Factors', 'Impact Considerations', 'Example Score'],
            rows: [
              ['Phishing Attack', 'Common attack vector, user training gaps', 'Potential credential compromise, limited systems', 'L:4 × I:2 = 8'],
              ['Ransomware Incident', 'Industry targeting, endpoint gaps', 'Business disruption, recovery costs', 'L:3 × I:4 = 12']
            ]
          }
        },
        implementationTips: {
          title: 'Effective Risk Scoring Tips',
          icon: Target,
          tips: [
            '**Use Consistent Criteria:** Apply the same evaluation standards across all risks for comparable scoring',
            '**Document Assumptions:** Record the reasoning behind likelihood and impact ratings for future reference'
          ]
        },
        commonChallenges: {
          title: 'Risk Assessment Challenges',
          icon: AlertCircle,
          challenges: [
            '**Subjectivity Bias:** Different evaluators may score the same risk differently',
            '**Limited Historical Data:** New organizations may lack incident history for likelihood assessment'
          ]
        }
      }
    },

    {
      key: 'access_control',
      type: 'domain',
      name: 'Identity & Access Management (IAM)',
      icon: Shield,
      color: 'cyan',
      description: 'IAM is the security discipline that enables the right individuals to access the right resources at the right times for the right reasons. It is the foundation of a secure environment, ensuring that only authorized users can access sensitive data and systems.',
      bestPractices: [
        'Enforce Multi-Factor Authentication (MFA) everywhere, especially for privileged access.',
        'Implement the Principle of Least Privilege (PoLP): users should only have access to what is strictly necessary for their job.',
        'Use Role-Based Access Control (RBAC) to simplify and standardize permissions.',
        'Regularly review and recertify user access rights, removing stale or excessive permissions.',
        'Automate user provisioning and de-provisioning processes to reduce human error.'
      ],
      maturityLevels: [
        { level: 0, title: 'Chaotic', description: 'No formal controls. Shared accounts are common, and password policies are non-existent or not enforced.' },
        { level: 1, title: 'Aware', description: 'Basic password policies are in place. Some individual accounts exist, but access is not based on formal roles.' },
        { level: 2, title: 'Defined', description: 'MFA is deployed on critical systems. User access is based on defined roles, and reviews are conducted manually.' },
        { level: 3, title: 'Managed', description: 'MFA is widely deployed. A Privileged Access Management (PAM) solution is in use, and access reviews are semi-automated.' },
        { level: 4, title: 'Optimized', description: 'IAM is highly automated. Access is dynamically adjusted based on context (Just-in-Time access), and reviews are event-driven.' },
        { level: 5, title: 'Adaptive', description: 'A full Zero Trust Architecture is implemented. Access decisions are continuous, automated, and based on real-time risk signals.' }
      ]
    },

    // NEW: Standalone BIA guide
    {
      key: 'bia_standalone',
      type: 'structured_guide',
      name: 'Business Impact Analysis (Standalone)',
      icon: BarChart3,
      color: 'indigo',
      description: 'Run a full BIA without doing a gap analysis first, then optionally link it to an assessment.',
      sections: [
        {
          title: 'Getting Started',
          icon: Target,
          frameworks: [
            {
              name: 'Create a New BIA',
              fullName: 'Start a standalone BIA from the BIA page',
              purpose: 'You can complete a BIA on its own, then link it to any assessment later.',
              keyRequirements: [
                'Go to BIA from the left menu',
                'Click “New BIA” and enter a clear title and scope',
                'Link to an assessment (optional — can be done later)',
                'Use descriptive names so stakeholders understand the item’s impact'
              ]
            }
          ]
        },
        {
          title: 'Building Your BIA',
          icon: Wrench,
          frameworks: [
            {
              name: 'Add Items and Types',
              fullName: 'Use your custom Asset Types for clarity and consistency',
              purpose: 'Choose a Type (e.g., SaaS, EDR, WAF, SCADA) and the system will suggest types based on keywords.',
              keyRequirements: [
                'Use the Type selector to classify each item',
                'Type is auto‑suggested from the item name and keywords',
                'Ownership hint appears if the type is linked to an Org Unit',
                'Provide impact/likelihood inputs and business context'
              ],
              systemComponents: [
                'Custom Asset Types taxonomy',
                'Org Unit linkage (ownership hint)',
                'Auto‑suggested Type from keywords',
                'Risk register and notes'
              ]
            },
            {
              name: 'Risk & Continuity',
              fullName: 'Compute risk and recovery targets',
              purpose: 'Calculate risk scores and define RTO/RPO expectations per item.',
              keyRequirements: [
                'Set likelihood and impact for each BIA item',
                'Review composite risk and top drivers',
                'Capture recommended RTO/RPO',
                'Export or integrate into reports later'
              ]
            }
          ]
        },
        {
          title: 'Reporting & Linking',
          icon: TrendingUp,
          frameworks: [
            {
              name: 'Link to Assessments Anytime',
              fullName: 'Associate the BIA with a gap assessment on demand',
              purpose: 'Keep BIA work product reusable across multiple assessments.',
              keyRequirements: [
                'Open the BIA and set linked assessment if desired',
                'Use BIA outputs to inform Smart Analysis and Action Items'
              ]
            }
          ]
        }
      ],
      guidance: {
        selection: {
          title: 'What to Include',
          icon: Lightbulb,
          decisionMatrix: {
            headers: ['Item', 'Why It Matters', 'Tip'],
            rows: [
              ['Critical Apps/Processes', 'Largest operational or revenue impact', 'Document upstream/downstream dependencies'],
              ['Data Stores', 'Confidentiality/Integrity/Availability risk', 'Note regulatory drivers (PCI, HIPAA, GDPR)'],
              ['OT/ICS', 'Safety and uptime criticality', 'Capture physical process impact and fail‑safes']
            ]
          }
        },
        implementationTips: {
          title: 'BIA Best Practices',
          icon: Target,
          tips: [
            '**Start small:** Prioritize top 3–5 items for a quick win.',
            '**Name clearly:** Titles should describe the business function, not just the system.',
            '**Revisit quarterly:** Update as systems and dependencies change.'
          ]
        },
        commonChallenges: {
          title: 'Common Pitfalls',
          icon: AlertCircle,
          challenges: [
            '**Too technical:** Keep impacts framed in business language.',
            '**No owners:** Assign ownership via Org Units for accountability.',
            '**Stale data:** Set reminders to refresh RTO/RPO and dependencies.'
          ]
        }
      }
    },

    // NEW: Asset Types & Ownership guide
    {
      key: 'asset_types_taxonomy',
      type: 'structured_guide',
      name: 'Custom Asset Types & Ownership',
      icon: UserCog,
      color: 'cyan',
      description: 'Create company‑defined types (e.g., SaaS, EDR, WAF, SCADA), add keywords for auto‑suggest, link to Org Units, and optionally tune risk weights.',
      sections: [
        {
          title: 'Why Types Matter',
          icon: Lightbulb,
          frameworks: [
            {
              name: 'Consistency & Reporting',
              fullName: 'Standardize how items are classified',
              purpose: 'Clean categories enable better risk views, filtering, and ownership.',
              keyRequirements: [
                'Define a concise set of types used across BIAs',
                'Add keywords to improve auto‑suggest accuracy',
                'Link types to Org Units for default ownership'
              ]
            }
          ]
        },
        {
          title: 'Managing Types',
          icon: Settings,
          frameworks: [
            {
              name: 'Create & Edit Types',
              fullName: 'Maintain your taxonomy as your environment evolves',
              purpose: 'Add, rename, hide, and reorder types for clarity.',
              keyRequirements: [
                'Set category (IT, OT/ICS, Cloud, Data Store, Security, Application, Network, Other)',
                'Add keyword triggers (comma‑separated)',
                'Link a default Org Unit owner',
                'Adjust order to promote common types'
              ]
            },
            {
              name: 'Optional Risk Tweaks',
              fullName: 'Per‑type risk model adjustments',
              purpose: 'You can define optional weight multipliers by type (e.g., OT availability heavier).',
              keyRequirements: [
                'Store a JSON risk_profile on the type',
                'Example: {"impactWeightMultipliers":{"bia_impact_ops_dependency_share":1.2}}',
                'Use conservatively and document rationale'
              ]
            }
          ]
        }
      ],
      guidance: {
        selection: {
          title: 'Good Types vs. Bad Types',
          icon: Target,
          decisionMatrix: {
            headers: ['Pattern', 'Good', 'Avoid'],
            rows: [
              ['Specificity', '“Payroll SaaS”, “Customer Portal”', '“Tool”, “System”'],
              ['Grouping', '“EDR”, “WAF”, “MES”', '“Misc”, “General”']
            ]
          }
        },
        implementationTips: {
          title: 'Operational Tips',
          icon: Wrench,
          tips: [
            '**Keep it small:** 12–20 types covers most orgs.',
            '**Keywords:** Add product names (Okta, O365, SAP) to boost suggestions.',
            '**Review quarterly:** Update owners and visibility (active flag).'
          ]
        },
        commonChallenges: {
          title: 'Anti‑patterns',
          icon: AlertCircle,
          challenges: [
            '**Over‑customization:** Too many types reduce usability.',
            '**No owners:** Always link to an Org Unit where possible.'
          ]
        }
      }
    },

    // NEW: Smart Analysis settings & preflight
    {
      key: 'smart_analysis_settings',
      type: 'structured_guide',
      name: 'Smart Analysis Settings & Preflight',
      icon: Brain,
      color: 'purple',
      description: 'Admins can tune AI behavior; preflight checks guide users to provide high‑quality inputs before generating analysis.',
      sections: [
        {
          title: 'Admin Configuration',
          icon: Settings,
          frameworks: [
            {
              name: 'Open Smart Analysis Settings',
              fullName: 'Admin‑only configuration page',
              purpose: 'Control AI prompt preamble, required sections, minimum recommendations, and data blocks.',
              keyRequirements: [
                'Prompt preamble and private notes to influence tone and focus',
                'Force sections to ensure complete JSON output',
                'Set minimum number of recommendations',
                'Toggle inclusion of external recon and operational security blocks'
              ]
            }
          ]
        },
        {
          title: 'Preflight Checks',
          icon: Shield,
          frameworks: [
            {
              name: 'Improve Input Quality',
              fullName: 'Guidance before generating analysis',
              purpose: 'Encourage better context (framework, goals, risks, critical systems) for more actionable output.',
              keyRequirements: [
                'Fill company description and strategic goals',
                'Score at least 5 maturity domains (excluding N/A)',
                'Run external attack surface scan (recommended)',
                'Proceed anyway option remains available'
              ]
            }
          ]
        }
      ],
      guidance: {
        selection: {
          title: 'When to Tweak Settings',
          icon: Lightbulb,
          decisionMatrix: {
            headers: ['Situation', 'What to Adjust', 'Outcome'],
            rows: [
              ['Industry nuance needed', 'Preamble/notes', 'Tailored language & priorities'],
              ['Output too brief', 'Min recommendations', 'More actionable tasks'],
              ['Missing sections', 'Force sections', 'Consistent structure across reports']
            ]
          }
        },
        implementationTips: {
          title: 'Better Results',
          icon: Target,
          tips: [
            '**Be specific:** Add known risks and critical systems.',
            '**Use external data:** Recon + CVE correlation strengthens findings.'
          ]
        },
        commonChallenges: {
          title: 'If Output Varies',
          icon: AlertCircle,
          challenges: [
            '**Sparse inputs:** Preflight will flag what to add.',
            '**Over‑constraint:** Balance strictness with usefulness.'
          ]
        }
      }
    },

    // NEW: IP/TLS Intelligence and Phishing Analyzer
    {
      key: 'ip_tls_phishing_tools',
      type: 'structured_guide',
      name: 'IP/TLS Intelligence & Phishing Analyzer',
      icon: Search,
      color: 'cyan',
      description: 'On‑demand network intelligence and screenshot analysis to speed investigations.',
      sections: [
        {
          title: 'Network Intelligence',
          icon: Globe,
          frameworks: [
            {
              name: 'IP Intelligence',
              fullName: 'Investigate IPs in incidents',
              purpose: 'Lookup geolocation, reputation, and related context for quicker triage.',
              keyRequirements: [
                'Open an incident detail',
                'Click “Network Intelligence” → IP Intelligence',
                'Paste the IP and review results for enrichment'
              ]
            },
            {
              name: 'TLS Certificate Inspector',
              fullName: 'Analyze TLS details for domains/hosts',
              purpose: 'Review certificate chain, issuer, expiry, and potential misconfigs.',
              keyRequirements: [
                'In “Network Intelligence” choose TLS Certificate',
                'Enter domain/host and view parsed cert details'
              ]
            }
          ]
        },
        {
          title: 'Phishing Screenshot Analyzer',
          icon: Camera,
          frameworks: [
            {
              name: 'Screenshot Triage',
              fullName: 'Aggressive phishing/scam scoring',
              purpose: 'Upload screenshots; system extracts text, detects brand/domain mismatch and urgency language, and returns a risk score with reasons.',
              keyRequirements: [
                'Open Security Tools (Command Center → Security Tools tab)',
                'Upload the screenshot(s) and run analysis',
                'Use score + artifacts (domains/URLs) for response decisions'
              ]
            }
          ]
        }
      ],
      guidance: {
        selection: {
          title: 'When to Use Which',
          icon: Lightbulb,
          decisionMatrix: {
            headers: ['Tool', 'Primary Use', 'Best For'],
            rows: [
              ['IP Intelligence', 'Quick enrichment', 'Suspicious connections or alerts'],
              ['TLS Inspector', 'Cert validation', 'Domain trust and expiry checks'],
              ['Phishing Analyzer', 'UI‑level fraud clues', 'Screenshots of emails/pages/apps']
            ]
          }
        },
        implementationTips: {
          title: 'Investigation Tips',
          icon: Target,
          tips: [
            '**Pivot fast:** Use artifacts to search SIEM/EDR.',
            '**Add tasks:** Convert findings into Action Items directly.'
          ]
        },
        commonChallenges: {
          title: 'Caveats',
          icon: AlertCircle,
          challenges: [
            '**False positives:** Always corroborate with logs.',
            '**Scope creep:** Keep triage focused and time‑boxed.'
          ]
        }
      }
    },

    // NEW: Security Tools overview (Password Generator, BeaTrace SAST, Architecture Audit)
    {
      key: 'security_tools_overview',
      type: 'structured_guide',
      name: 'Security Tools Overview',
      icon: Zap,
      color: 'cyan',
      description: 'Quick reference for built-in security tools: Password Generator (all plans), BeaTrace SAST Scanner (Growth+ and free trial), and Architecture Audit.',
      sections: [
        {
          title: 'Password Generator (All Plans)',
          icon: Key,
          frameworks: [
            {
              name: 'Instant Strong Passwords',
              fullName: 'Generate secure passwords with customizable options',
              purpose: 'Create cryptographically strong passwords with length, character sets, and copy-to-clipboard.',
              keyRequirements: [
                'Available to all subscription tiers (including free trial and starter)',
                'Adjust length and character classes (upper/lower, digits, symbols)',
                'Strength bar and visibility toggle for quick checks'
              ]
            }
          ]
        },
        {
          title: 'BeaTrace SAST Scanner (Growth+ and Free Trial)',
          icon: Code2,
          frameworks: [
            {
              name: 'Static Code Analysis',
              fullName: 'AI-assisted security review of pasted or uploaded code',
              purpose: 'Detect insecure patterns and get prioritized remediation guidance.',
              keyRequirements: [
                'Paste code or upload for analysis; get findings with fixes',
                'Access: Growth and Enterprise tiers; also available during 14-day free trial',
                'Starter plan users will see an upgrade prompt in the Security Tools tab'
              ]
            }
          ]
        },
        {
          title: 'Architecture Audit',
          icon: Wrench,
          frameworks: [
            {
              name: 'Design Review',
              fullName: 'Assess high-level architecture risks and controls',
              purpose: 'Document systems, data flows, and controls to surface risks and improvement opportunities.',
              keyRequirements: [
                'Now located under Security Tools as a sub-tab',
                'Use for quick design reviews and control mapping',
                'Export findings into action items or reports'
              ]
            }
          ]
        }
      ],
      guidance: {
        selection: {
          title: 'Which Tool Should I Use?',
          icon: Target,
          decisionMatrix: {
            headers: ['Need', 'Tool', 'Outcome'],
            rows: [
              ['Create a secure password', 'Password Generator', 'Strong, copyable password'],
              ['Scan source code for issues', 'BeaTrace SAST', 'Findings with remediations'],
              ['Assess system design', 'Architecture Audit', 'Documented risks and control gaps']
            ]
          }
        },
        implementationTips: {
          title: 'Tips',
          icon: Lightbulb,
          tips: [
            '**Free Trial Access:** For 14 days, all tools are unlocked to showcase full value.',
            '**Starter Tier:** BeaTrace SAST is gated; upgrade to Growth to enable it.',
            '**Capture Outcomes:** Convert findings into Action Items to track remediation.'
          ]
        },
        commonChallenges: {
          title: 'Notes',
          icon: AlertCircle,
          challenges: [
            '**Large code blocks:** Break analyses into focused modules for clearer results.',
            '**Architecture scope:** Start with critical systems and data flows first.'
          ]
        }
      }
    },

    // NEW: Admin User Management guide (tiers, roles, approval tracking)
    {
      key: 'admin_user_management',
      type: 'structured_guide',
      name: 'Admin: User Management & Access Controls',
      icon: Users,
      color: 'purple',
      description: 'Manage approvals, subscription tiers, company roles, and audit who approved accounts.',
      sections: [
        {
          title: 'Approvals Workflow',
          icon: Shield,
          frameworks: [
            {
              name: 'Pending → Approved/Rejected/Suspended',
              fullName: 'Track and decide user access requests',
              purpose: 'Approve legitimate users and keep an audit trail.',
              keyRequirements: [
                'Tabs for Pending, Approved, Rejected, Suspended',
                '“Approved By” is auto-set to the admin’s email, with an approved timestamp',
                'Optional rejection/suspension reason for accurate records'
              ]
            }
          ]
        },
        {
          title: 'Tiers & Roles',
          icon: Settings,
          frameworks: [
            {
              name: 'Subscription Tier',
              fullName: 'Set user tier directly from the table',
              purpose: 'Control feature access (e.g., SAST gating) per user/company policy.',
              keyRequirements: [
                'Tiers: free_trial (14-day full access), starter, growth, enterprise',
                'Free trial expires automatically after 14 days per system logic'
              ]
            },
            {
              name: 'Company Role',
              fullName: 'Assign admin or member role',
              purpose: 'Admin users can manage company-wide settings; members have limited scope.',
              keyRequirements: [
                'Prevent self-demotion protections are in place',
                'Changes apply immediately'
              ]
            }
          ]
        }
      ],
      guidance: {
        selection: {
          title: 'Good Practices',
          icon: Target,
          decisionMatrix: {
            headers: ['Scenario', 'Action', 'Why'],
            rows: [
              ['Evaluating new sign-ups', 'Use Pending tab and set Approved By automatically', 'Creates a clean audit trail'],
              ['Trial conversion', 'Set tier to Growth after trial', 'Enables premium tools like BeaTrace SAST'],
              ['Delegating management', 'Assign company_role=admin as needed', 'Shares administrative workload safely']
            ]
          }
        },
        implementationTips: {
          title: 'Efficiency Tips',
          icon: Lightbulb,
          tips: [
            '**Search & Filter:** Use the search box to quickly locate users.',
            '**Bulk mindset:** Process pending users regularly to keep access current.'
          ]
        },
        commonChallenges: {
          title: 'Watchouts',
          icon: AlertCircle,
          challenges: [
            '**Accidental changes:** Confirm tier/role selections before moving off the row.',
            '**Compliance:** Record reasons when rejecting/suspending to support audits.'
          ]
        }
      }
    },

    // NEW: BIA score meters and scales
    {
      key: 'bia_score_meters',
      type: 'structured_guide',
      name: 'BIA Score Meters & Scales',
      icon: BarChart3,
      color: 'indigo',
      description: 'Understand the scales behind Impact, Likelihood, and Risk with clear denominators in the UI.',
      sections: [
        {
          title: 'What the Numbers Mean',
          icon: Target,
          frameworks: [
            {
              name: 'Impact (0–5)',
              fullName: 'Business impact scale',
              purpose: 'Quantifies potential business impact of a risk or disruption.',
              keyRequirements: [
                'Displayed as X/5 in the UI (e.g., 3.9/5)',
                'Higher values indicate greater impact'
              ]
            },
            {
              name: 'Likelihood (0–5)',
              fullName: 'Probability of occurrence',
              purpose: 'Rates how likely a risk is to occur.',
              keyRequirements: [
                'Displayed as X/5 in the UI',
                'Higher values indicate higher probability'
              ]
            },
            {
              name: 'Risk Score (0–25)',
              fullName: 'Composite risk = Impact × Likelihood',
              purpose: 'Combines severity and probability into a single score.',
              keyRequirements: [
                'Displayed as X/25 in the UI',
                'Helps quickly rank risks for action'
              ]
            }
          ]
        }
      ],
      guidance: {
        implementationTips: {
          title: 'Using the Meters',
          icon: Lightbulb,
          tips: [
            '**Prioritize:** Focus first on items with highest Risk (near 25/25).',
            '**Context:** Use meters alongside qualitative notes for better decisions.'
          ]
        },
        commonChallenges: {
          title: 'Interpretation',
          icon: AlertCircle,
          challenges: [
            '**Scale confusion:** The denominator clarifies the scale at a glance.',
            '**Comparability:** Use consistent scoring across items to compare fairly.'
          ]
        }
      }
    },

    {
      key: 'how_to_choose_framework',
      type: 'structured_guide', // Changed type from 'guide' to 'structured_guide'
      name: 'How to choose a framework',
      icon: Scale,
      color: 'indigo',
      description: 'Guidance on selecting the right framework for your gap analysis based on context, goals, and industry.',
      sections: [
        {
          title: 'Key Considerations',
          icon: Target,
          frameworks: [
            {
              name: 'Industry and Regulatory Requirements',
              fullName: 'Align with specific compliance mandates',
              purpose: 'Your industry often dictates mandatory compliance frameworks.',
              keyRequirements: [
                'Healthcare: HIPAA, HITECH',
                'Financial Services/Credit Card: PCI DSS, SOX',
                'EU Data Handling: GDPR, NIS2 Directive (focuses on critical infrastructure and essential services)',
                'US Federal Contractors: CMMC, FedRAMP',
                'California Residents\' Data: CCPA/CPRA'
              ]
            },
            {
              name: 'Your Goals for the Gap Analysis',
              fullName: 'Define the objective of your assessment',
              purpose: 'The reason for the analysis influences the best framework choice.',
              keyRequirements: [
                'General Security Improvement: Overall posture enhancement',
                'Certification/Audit: Preparation for external validation',
                'Client Requirements: Meeting partner demands'
              ]
            },
            {
              name: 'Organization Size and Complexity',
              fullName: 'Match framework scope to organizational resources',
              purpose: 'Some frameworks are more extensive and require more resources to implement and maintain.',
              keyRequirements: [
                'Small-to-Medium Businesses: Simpler, more prescriptive frameworks may be better',
                'Large Enterprises: Comprehensive frameworks can manage broader risks'
              ]
            }
          ]
        },
        {
          title: 'Widely Used Frameworks',
          icon: Gavel,
          frameworks: [
            {
              name: 'NIST Cybersecurity Framework (CSF)',
              fullName: 'Risk-based approach for overall posture improvement',
              purpose: 'Flexible, adaptable to any industry, and focused on risk management. It categorizes security activities into five functions: Identify, Protect, Detect, Respond, Recover.',
              keyRequirements: [
                'Strength: Excellent for establishing a foundational, risk-based programme. Not prescriptive, so it requires tailoring.',
                'Best for: Organizations looking to improve their overall cybersecurity posture, manage risk, and communicate risk internally and externally.'
              ]
            },
            {
              name: "NCSC Cyber Essentials / Plus",
              fullName: "UK Government-backed baseline cybersecurity certification",
              purpose: "A UK government-backed scheme designed to help organizations of any size protect themselves against a wide range of the most common cyber attacks.",
              keyRequirements: [
                "Strength: Practical, implementation-focused, excellent for small-to-medium businesses or those starting their security programmes. A clear signal of good baseline security.",
                "Weakness: Less comprehensive than ISO 27001. It is a baseline and may not be sufficient for organizations with complex risk profiles or high-value assets.",
                "Best for: UK businesses of all sizes, especially those working with the public sector. A great first step for any organization to demonstrate security commitment."
              ]
            },
            {
              name: "NIS2 Directive",
              fullName: "EU-wide legislation for cybersecurity of essential and important entities",
              purpose: "EU-wide legislation on cybersecurity. It provides legal measures to boost the overall level of cybersecurity in the EU for 'essential and important' entities.",
              keyRequirements: [
                "Strength: Mandates a high level of security maturity, formalizes incident reporting with strict timelines (24h/72h), and strengthens supply chain security requirements.",
                "Weakness: Can be complex to interpret and implement. The strict reporting deadlines require a highly mature incident response capability.",
                "Best for: Organizations operating in the EU within critical sectors like energy, transport, health, banking, and digital infrastructure."
              ]
            },
            {
              name: 'ISO 27001/27002',
              fullName: 'International standard for Information Security Management System (ISMS)',
              purpose: 'Ideal for organizations seeking to establish, implement, maintain, and continually improve an ISMS. Aims for international recognition for security practices and certification.',
              keyRequirements: [
                'Strength: Comprehensive, auditable, and globally recognized. Focuses on a management system approach.',
                'Best for: Aiming for certification, demonstrating formal ISMS.'
              ]
            },
            {
              name: 'CIS Controls (Center for Internet Security Critical Security Controls)',
              fullName: 'Prioritized, actionable steps for defensive capabilities',
              purpose: 'Highly prescriptive, prioritized, and actionable steps to improve defensive capabilities. It tells you what to do rather than what to manage.',
              keyRequirements: [
                'Strength: Practical, implementation-focused, excellent for small-to-medium businesses or those starting security programs.',
                'Best for: Organizations looking for concrete, immediate actions to implement.'
              ]
            },
            {
              name: 'SOC 2 (Service Organization Control 2)',
              fullName: 'Auditing controls for service organizations',
              purpose: 'Focuses on auditing controls relevant to security, availability, processing integrity, confidentiality, and privacy of a system.',
              keyRequirements: [
                'Strength: Essential for demonstrating trust and assurance to customers, especially in cloud-based services.',
                'Best for: Service organizations (e.g., SaaS providers, data centers) that store or process customer data.'
              ]
            }
          ]
        }
      ],
      guidance: {
        selection: {
          title: 'Recommendation Summary',
          icon: Lightbulb,
          // Decision matrix removed, replaced with custom content per outline
          // decisionMatrix: { ... } // Original decision matrix is commented out or removed
        },
        implementationTips: {
          title: 'Hubcys Platform Support',
          icon: Target,
          tips: [
            "**Tailored Analysis:** Hubcys' smart intelligence will tailor its analysis based on your framework selection.",
            '**Multiple Frameworks:** The platform is designed to support multiple frameworks, allowing you to choose what best fits your immediate needs.'
          ]
        },
        commonChallenges: {
          title: 'Important Considerations',
          icon: AlertCircle,
          challenges: [
            '**One-Size-Does-Not-Fit-All:** The "best" framework depends on your organization\'s specific context, goals, and industry.',
            '**Regulatory Precedence:** If you have specific compliance requirements, those regulatory frameworks will take precedence.',
            '**Continuous Evaluation:** Revisit your framework choice as your organization and its threat landscape evolve.'
          ]
        }
      }
    }
  ];

  const getColorClass = (color) => {
    const colors = {
      cyan: { text: 'text-cyan-300', border: 'border-cyan-500/30' },
      purple: { text: 'text-purple-300', border: 'border-purple-500/30' },
      green: { text: 'text-green-300', border: 'border-green-300/30' },
      orange: { text: 'text-orange-300', border: 'border-orange-300/30' },
      red: { text: 'text-red-300', border: 'border-red-300/30' },
      blue: { text: 'text-blue-300', border: 'border-blue-500/30' },
      indigo: { text: 'text-indigo-300', border: 'border-indigo-500/30' },
      yellow: { text: 'text-yellow-300', border: 'border-yellow-500/30' },
      amber: { text: 'text-amber-300', border: 'border-amber-500/30' }
    };
    return colors[color] || colors.cyan;
  };

  const filteredContent = educationalContent.filter(item => {
    const itemCategory = item.type === 'guide' && item.tags && item.tags.includes('getting-started') ? 'getting_started' : item.key;
    const matchesCategory = selectedCategory === "all" || itemCategory === selectedCategory;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === "" ||
      item.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      item.description.toLowerCase().includes(lowerCaseSearchTerm);
    return matchesCategory && matchesSearch;
  });

  const renderMarkdown = (content) => {
    if (!content) return null;
    // Render inline-friendly markdown safely (no raw HTML parsing)
    return (
      <ReactMarkdown
        className="prose prose-invert prose-sm max-w-none"
        components={{
          p: ({ children }) => <span className="leading-relaxed">{children}</span>,
          strong: ({ children }) => <strong className="text-white">{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          a: ({ children, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="list-disc pl-5 my-1">{children}</ul>,
          li: ({ children }) => <li className="my-0.5">{children}</li>
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <div className="min-h-screen cyber-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12 card-entrance">
          <h1 className="text-2xl md:text-3xl font-bold cyber-text-glow mb-4">Hubcys Training Guide</h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Master cybersecurity gap analysis and maximize the value of your security assessments with our comprehensive training resources.
          </p>
        </div>

        <div className="space-y-6">
          {filteredContent.map((item) => {
            const Icon = item.icon;
            const colors = getColorClass(item.color);
            const isOpen = openSections[item.key];

            return (
              <Collapsible key={item.key} open={isOpen} onOpenChange={() => toggleSection(item.key)}>
                <Card className={`glass-effect ${colors.border}`}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-slate-800/30 transition-colors">
                      <CardTitle className={`flex items-center justify-between text-lg ${colors.text}`}>
                        <div className="flex items-center">
                          <Icon className="w-6 h-6 mr-3" />
                          {item.name}
                        </div>
                        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <p className="text-gray-300 mb-6">{item.description}</p>

                      {item.type === 'guide' ? (
                        <div className="prose prose-invert max-w-none text-gray-300">
                          <ReactMarkdown>{item.content}</ReactMarkdown>
                        </div>
                      ) : item.type === 'structured_guide' ? (
                        <div className="space-y-8">
                          {item.sections.map((section, secIndex) => {
                            const SectionIcon = section.icon;
                            return (
                              <div key={secIndex}>
                                <h3 className="text-xl font-semibold text-purple-300 mb-4 flex items-center">
                                  <SectionIcon className="w-6 h-6 mr-3" />
                                  {section.title}
                                </h3>
                                <div className="space-y-6">
                                  {section.frameworks.map((fw, fwIndex) => (
                                    <Card key={fwIndex} className="bg-slate-800/60 border-gray-700/50">
                                      <CardHeader>
                                        <CardTitle className="text-base text-cyan-300">{fw.name}</CardTitle>
                                        <p className="text-sm text-gray-400">{fw.fullName}</p>
                                      </CardHeader>
                                      <CardContent className="space-y-4">
                                        <div>
                                          <h4 className="font-semibold text-gray-200 mb-2">Purpose</h4>
                                          <p className="text-gray-400 text-sm">{fw.purpose}</p>
                                        </div>
                                        {fw.keyRequirements && (
                                          <div>
                                            <h4 className="font-semibold text-gray-200 mb-2">Key Requirements</h4>
                                            <div className="flex flex-wrap gap-2">
                                              {fw.keyRequirements.map((req, i) => (
                                                <Badge key={i} variant="secondary" className="bg-slate-700 text-gray-300">
                                                  {req}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {fw.systemComponents && (
                                          <div>
                                            <h4 className="font-semibold text-gray-200 mb-2">System Components</h4>
                                            <div className="flex flex-wrap gap-2">
                                              {fw.systemComponents.map((comp, i) => (
                                                <Badge key={i} variant="outline" className="border-cyan-500/50 text-cyan-300">
                                                  {comp}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {fw.whoNeedsIt && (
                                          <div>
                                            <h4 className="font-semibold text-gray-200 mb-2">Who Needs It</h4>
                                            <div className="flex flex-wrap gap-2">
                                              {fw.whoNeedsIt.map((item, i) => (
                                                <Badge key={i} variant="outline" className="border-purple-500/50 text-purple-300">
                                                  {item}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {fw.impactLevels && (
                                          <div>
                                            <h4 className="font-semibold text-gray-200 mb-2">Impact Levels</h4>
                                            <ul className="list-disc list-inside space-y-1 text-gray-400 text-sm">
                                              {fw.impactLevels.map((item, i) => (
                                                <li key={i}>{renderMarkdown(item)}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                          {item.guidance && (
                            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-slate-700/50">
                              {item.guidance.selection && (
                                <Card className="bg-slate-800/60 border-gray-700/50">
                                  <CardHeader>
                                    <CardTitle className="flex items-center text-yellow-300">
                                      {item.guidance.selection.icon && React.createElement(item.guidance.selection.icon, { className: "w-5 h-5 mr-2" })}
                                      {item.guidance.selection.title}
                                    </CardTitle>
                                    {item.key === 'how_to_choose_framework' && (
                                      <p className="text-gray-400">Use these questions to help guide your decision.</p>
                                    )}
                                  </CardHeader>
                                  <CardContent>
                                    {item.key === 'how_to_choose_framework' ? (
                                      <ul className="space-y-4 text-gray-300">
                                        <li className="flex items-start gap-3">
                                          <ChevronRight className="w-4 h-4 mt-1 text-cyan-400" />
                                          <div>
                                            <strong>Are you a UK-based business or do you work with the UK public sector?</strong>
                                            <p className="text-sm text-gray-400">Start with <span className="text-white font-semibold">NCSC Cyber Essentials</span>. It's a widely recognized UK standard and a great foundation.</p>
                                          </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                          <ChevronRight className="w-4 h-4 mt-1 text-cyan-400" />
                                          <div>
                                            <strong>Do you operate as an 'essential or important entity' within the EU?</strong>
                                            <p className="text-sm text-gray-400">You need to align with the <span className="text-white font-semibold">NIS2 Directive</span>. Use <span className="text-white font-semibold">ISO 27001</span> as your comprehensive framework to help meet NIS2's risk management requirements.</p>
                                          </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                          <ChevronRight className="w-4 h-4 mt-1 text-cyan-400" />
                                          <div>
                                            <strong>Do you need a globally recognized, comprehensive security standard?</strong>
                                            <p className="text-sm text-gray-400">Choose <span className="text-white font-semibold">ISO 27001</span> for a robust ISMS or <span className="text-white font-semibold">NIST CSF</span> for a flexible, risk-based approach.</p>
                                          </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                          <ChevronRight className="w-4 h-4 mt-1 text-cyan-400" />
                                          <div>
                                            <strong>Do you handle customer data for other businesses (are you a SaaS provider)?</strong>
                                            <p className="text-sm text-gray-400"><span className="text-white font-semibold">SOC 2</span> is the gold standard for demonstrating security to your customers.</p>
                                          </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                          <ChevronRight className="w-4 h-4 mt-1 text-cyan-400" />
                                          <div>
                                            <strong>Do you process, store, or transmit cardholder data?</strong>
                                            <p className="text-sm text-gray-400">You must comply with <span className="text-white font-semibold">PCI DSS</span>. This is not optional.</p>
                                          </div>
                                        </li>
                                      </ul>
                                    ) : (item.guidance.selection.decisionMatrix && (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left text-gray-400">
                                          <thead className="text-xs text-gray-200 uppercase bg-slate-700">
                                            <tr>
                                              {item.guidance.selection.decisionMatrix.headers.map((header, i) => (
                                                <th key={i} scope="col" className="px-3 py-2 whitespace-nowrap">
                                                  {header}
                                                </th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {item.guidance.selection.decisionMatrix.rows.map((row, rowIndex) => (
                                              <tr key={rowIndex} className="bg-slate-800 border-b border-gray-700">
                                                {row.map((cell, cellIndex) => (
                                                  <td key={cellIndex} className="px-3 py-2">
                                                    {cell}
                                                  </td>
                                                ))}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    ))}
                                  </CardContent>
                                </Card>
                              )}

                              {item.guidance.implementationTips && (
                                <Card className="bg-slate-800/60 border-gray-700/50">
                                  <CardHeader>
                                    <CardTitle className="flex items-center text-green-300">
                                      <Lightbulb className="w-5 h-5 mr-2" />
                                      {item.guidance.implementationTips.title}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <ul className="space-y-2 text-gray-300 text-sm">
                                      {item.guidance.implementationTips.tips.map((tip, i) => (
                                        <li key={i} className="flex items-start">
                                          <ListChecks className="w-4 h-4 mr-2 mt-1 text-green-400 flex-shrink-0" />
                                          <span>{renderMarkdown(tip)}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </CardContent>
                                </Card>
                              )}
                              {item.guidance.commonChallenges && (
                                <Card className="bg-slate-800/60 border-gray-700/50">
                                  <CardHeader>
                                    <CardTitle className="flex items-center text-orange-300">
                                      <AlertCircle className="w-5 h-5 mr-2" />
                                      {item.guidance.commonChallenges.title}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <ul className="space-y-2 text-gray-300 text-sm">
                                      {item.guidance.commonChallenges.challenges.map((challenge, i) => (
                                        <li key={i} className="flex items-start">
                                          <AlertTriangle className="w-4 h-4 mr-2 mt-1 text-orange-400 flex-shrink-0" />
                                          <span>{renderMarkdown(challenge)}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          )}
                        </div>
                      ) : item.type === 'domain' ? (
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-base font-semibold text-gray-300 mb-3">Best Practices</h4>
                            <ul className="list-disc list-inside space-y-2 text-gray-300">
                              {item.bestPractices.map((practice, index) => (
                                <li key={index}>{practice}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="pt-4">
                            <h4 className="text-base font-semibold text-gray-300 mb-3">Maturity Level Breakdown</h4>
                            <div className="space-y-4">
                              {item.maturityLevels.map((level) => (
                                <div key={level.level} className="p-3 bg-slate-800/50 rounded-lg border border-gray-700/50">
                                  <h5 className={`font-bold ${colors.text}`}>Level {level.level}: {level.title}</h5>
                                  <p className="text-gray-400 text-sm mt-1">{level.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
        {/* Security Tools Tutorials (collapsible sections) */}
        <div className="mt-8"> 
          <SecurityToolsGuide />
        </div>
      </div>
    </div>
  );
}
