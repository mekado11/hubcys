
import React from 'react';

export const getPolicyTemplates = (frameworks = []) => {
  const templates = {
    'Access_Control': {
      pci_requirements: ['7', '8'],
      template_additions: `
## PCI DSS Compliance Requirements

This policy addresses PCI DSS Requirements 7 and 8:
- **Requirement 7**: Restrict access to cardholder data by business need-to-know
- **Requirement 8**: Identify and authenticate access to system components

### Cardholder Data Access Controls

#### 7.1 Access Control Systems and Processes
- Access to cardholder data must be restricted to individuals whose job requires such access
- Access control systems must be configured to enforce restrictions based on business need-to-know
- All access to cardholder data must be logged and monitored

#### 7.2 Role-Based Access Control
- Define roles and responsibilities for accessing cardholder data
- Implement role-based access control (RBAC) for all system components
- Regularly review and update access permissions

#### 8.1 User Identification and Authentication
- Assign unique identification (ID) to each person with computer access
- Implement multi-factor authentication for all access to cardholder data environment
- Use strong authentication methods for remote access

#### 8.2 Password Requirements
- Passwords must be at least 8 characters long (12 characters recommended)
- Passwords must contain both numeric and alphabetic characters
- Passwords must be changed at least every 90 days
- Password history must prevent reuse of last 4 passwords

### Monitoring and Compliance
- All access attempts must be logged and reviewed regularly
- Failed authentication attempts must trigger alerts
- Regular access reviews must be conducted quarterly
    `
    },

    'Data_Backup_and_Recovery': {
      pci_requirements: ['3', '12.10'],
      template_additions: `
## PCI DSS Compliance Requirements

This policy addresses PCI DSS Requirements 3 and 12.10:
- **Requirement 3**: Protect stored cardholder data
- **Requirement 12.10**: Implement an incident response plan

### Cardholder Data Backup Requirements

#### 3.1 Data Protection Standards
- Cardholder data backups must be encrypted using strong cryptography
- Backup media must be stored in secure, offsite locations
- Access to backup media must be logged and restricted

#### 3.2 Backup Procedures
- Daily automated backups of all cardholder data environments
- Full system backups must be performed weekly
- Backup integrity must be verified through regular restore testing
- Backup media must be inventoried and tracked

#### 3.3 Secure Storage and Retention
- Backup media must be stored in fire-resistant, secure facilities
- Physical access to backup storage must be restricted and logged
- Backup retention must comply with business requirements and legal obligations
- Secure destruction of backup media when no longer needed

### Recovery Procedures
#### 12.10.1 Incident Response Integration
- Recovery procedures must be integrated with incident response plan
- Recovery time objectives (RTO) and recovery point objectives (RPO) must be defined
- Regular disaster recovery testing must be conducted
- All recovery activities must be documented and reviewed
    `
    },

    'Incident_Response': {
      pci_requirements: ['12.10'],
      template_additions: `
## PCI DSS Compliance Requirements

This policy addresses PCI DSS Requirement 12.10:
- **Requirement 12.10**: Implement an incident response plan

### PCI DSS Incident Response Requirements

#### 12.10.1 Incident Response Plan Components
- Roles, responsibilities, and communication strategies
- Specific incident response procedures for suspected cardholder data breaches
- Business recovery and continuity procedures
- Data backup processes and restoration procedures
- Analysis of legal requirements for reporting compromises
- Coverage for all critical system components

#### 12.10.2 Breach Response Procedures
- Immediate containment of suspected compromise
- Forensic preservation of evidence
- Assessment of compromise scope and impact
- Notification procedures for payment card brands and acquiring banks
- Communication plan for affected parties

#### 12.10.3 Testing and Maintenance
- Incident response plan must be tested at least annually
- Plan must be modified and evolved according to lessons learned
- Personnel must be trained on their incident response roles
- 24/7 availability of incident response team members

### Cardholder Data Breach Notification
- Suspected compromises must be reported immediately to management
- Payment card brands and acquiring bank must be notified within 72 hours
- Law enforcement notification as required by local regulations
- Affected parties must be notified according to applicable laws
    `
    },

    'Vulnerability_Management': {
      pci_requirements: ['6', '11'],
      template_additions: `
## PCI DSS Compliance Requirements

This policy addresses PCI DSS Requirements 6 and 11:
- **Requirement 6**: Develop and maintain secure systems and applications
- **Requirement 11**: Regularly test security systems and processes

### Vulnerability Management Requirements

#### 6.1 Security Patch Management
- Critical security patches must be installed within one month of release
- All system components must have latest security patches installed
- Patch installation must be tested in isolated environment before production deployment
- Emergency patch procedures for critical vulnerabilities

#### 6.2 Secure Development Practices
- All custom applications must follow secure coding guidelines
- Code reviews must be performed for all custom applications
- Vulnerability testing must be performed before deployment
- Separation of development, test, and production environments

#### 11.1 Vulnerability Scanning Requirements
- Internal vulnerability scans must be performed quarterly
- External vulnerability scans must be performed quarterly by ASV (Approved Scanning Vendor)
- All high-risk vulnerabilities must be resolved
- Rescans must verify vulnerability remediation

#### 11.2 Network Security Testing
- Penetration testing must be performed annually
- Penetration testing must be performed after significant network changes
- Network intrusion detection systems must be deployed
- File integrity monitoring must be implemented for critical files

### Scanning and Testing Procedures
- Vulnerability scans must cover all IP addresses in cardholder data environment
- Authenticated scanning must be performed where possible
- Scan results must be reviewed and remediation tracked
- All testing activities must be documented and retained
    `
    },

    BYOD: {
      title: "Bring Your Own Device (BYOD) Policy",
      description: "Comprehensive policy for managing personal devices in corporate environments",
      sections: [
        "Purpose and Scope",
        "Framework Alignment and Regulatory Compliance",
        "Device Eligibility and Enrollment",
        "Authentication and Access Control",
        "Security Configuration Requirements",
        "Data Protection and Privacy",
        "Device Monitoring and Compliance",
        "Incident Response and Breach Management",
        "Roles and Responsibilities",
        "Implementation and Rollout",
        "Compliance Monitoring and Auditing",
        "Policy Violations and Enforcement",
        "Cost and Reimbursement",
        "Device Lifecycle Management",
        "Exceptions and Waivers",
        "Policy Review and Updates",
        "Related Documents and References"
      ],
      frameworks: {
        NIST_CSF: [
          "PR.AC-1: Identity and credentials for authorized devices",
          "PR.AC-3: Remote access management",
          "PR.DS-1: Data-at-rest protection",
          "PR.DS-2: Data-in-transit protection",
          "DE.CM-7: Unauthorized device monitoring"
        ],
        ISO_27001: [
          "A.6.2.1: Mobile device policy",
          "A.6.2.2: Teleworking controls",
          "A.13.1.1: Network controls",
          "A.13.2.1: Information transfer policies",
          "A.10.1.1: Cryptographic policy"
        ],
        CIS_Controls: [
          "Control 1: Enterprise Asset Inventory",
          "Control 2: Software Asset Inventory",
          "Control 3: Data Protection",
          "Control 6: Access Control Management",
          "Control 12: Network Infrastructure Management"
        ],
        SOC2: [
          "CC6.1: Logical and physical access controls",
          "CC6.2: Access control monitoring",
          "CC6.3: Access control implementation",
          "CC6.7: Data transmission controls"
        ]
      },
      customizations: [
        {
          key: "mdmSolution",
          label: "MDM Solution",
          type: "text",
          placeholder: "Microsoft Intune, VMware Workspace ONE, etc."
        },
        {
          key: "ssoProvider",
          label: "SSO Provider",
          type: "text",
          placeholder: "Azure AD, Okta, Ping Identity, etc."
        },
        {
          key: "allowWearables",
          label: "Allow Wearable Devices",
          type: "boolean",
          default: false
        },
        {
          key: "deviceReimbursement",
          label: "Provide Device Reimbursement",
          type: "boolean",
          default: false
        },
        {
          key: "pilotGroup",
          label: "Pilot Group",
          type: "text",
          placeholder: "Senior management, IT team, etc."
        },
        {
          key: "incidentEmail",
          label: "Security Incident Email",
          type: "email",
          placeholder: "security@company.com"
        },
        {
          key: "securityContact",
          label: "IT Security Team Contact",
          type: "text",
          placeholder: "security@company.com"
        },
        {
          key: "ticketingSystem",
          label: "IT Ticketing System",
          type: "text",
          placeholder: "ServiceNow, Jira Service Desk, etc."
        },
        {
          key: "hardwareTokens",
          label: "Support Hardware Tokens",
          type: "boolean",
          default: false
        },
        {
          key: "gdprCompliance",
          label: "GDPR Compliance Required",
          type: "boolean",
          default: false
        },
        {
          key: "hipaaCompliance",
          label: "HIPAA Compliance Required",
          type: "boolean",
          default: false
        },
        {
          key: "ccpaCompliance",
          label: "CCPA Compliance Required",
          type: "boolean",
          default: false
        },
        {
          key: "soxCompliance",
          label: "SOX Compliance Required",
          type: "boolean",
          default: false
        }
      ]
    },
  };

  return templates;
};

export default function PCIPolicyEnhancer({ policyType, existingContent }) {
  // Retrieve all templates and then access the specific one by policyType
  const allTemplates = getPolicyTemplates();
  const pciTemplate = allTemplates[policyType];

  // Ensure that the template exists and has the expected PCI-specific properties
  if (!pciTemplate || !pciTemplate.pci_requirements || !pciTemplate.template_additions) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
      <h4 className="text-green-300 font-semibold mb-2">
        PCI DSS Enhancement Available
      </h4>
      <p className="text-sm text-gray-300 mb-3">
        This policy can be enhanced with PCI DSS Requirements {pciTemplate.pci_requirements.join(', ')}
      </p>
      <details className="text-sm">
        <summary className="cursor-pointer text-green-300 hover:text-green-200">
          Preview PCI DSS Additions
        </summary>
        <pre className="mt-2 text-xs text-gray-400 whitespace-pre-wrap max-h-40 overflow-y-auto">
          {pciTemplate.template_additions}
        </pre>
      </details>
    </div>
  );
}
