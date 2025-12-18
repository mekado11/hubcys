
// Comprehensive policy templates with framework alignments
export const POLICY_TEMPLATES = {
  'BYOD': {
    title: 'Bring Your Own Device (BYOD) Policy',
    category: 'Access Control',
    frameworks: ['NIST_CSF', 'ISO_27001', 'CIS_Controls', 'SOC2'],
    priority: 'high',
    content: (companyName) => `# **Bring Your Own Device (BYOD) Policy**

## 1. Purpose & Scope

This policy establishes the requirements and responsibilities for employees, contractors, and third parties who use personally owned devices (laptops, tablets, smartphones) to access ${companyName} systems, networks, or data.

• **Objective:** Protect confidentiality, integrity, and availability of company information while enabling workforce mobility.
• **Scope:** Applies to all users and all personal devices that connect to corporate resources, whether onsite or remote.

## 2. Guiding Principles

This policy follows industry frameworks including:
• **NIST Cybersecurity Framework** (PR.AC-1, PR.AC-3, PR.DS-1, PR.DS-2, DE.CM-7)
• **ISO/IEC 27001** (A.6.2.1, A.6.2.2, A.13.1.1, A.13.2.1, A.10.1.1)
• **CIS Controls v8** (Control 1, 4, 12, 15)
• **SOC 2 Trust Services Criteria** (CC6.1, CC6.2, CC6.3, CC6.7)

## 3. Policy Requirements

### 3.1 Device Eligibility
• Only devices running supported OS versions (Windows 10+, macOS 12+, iOS 15+, Android 11+) are allowed.
• Devices must support encryption, MFA, and endpoint management.
• Rooted/jailbroken devices are strictly prohibited.

### 3.2 Enrollment & Management
• Devices must be enrolled in ${companyName}'s Mobile Device Management (MDM) or Endpoint Detection & Response (EDR) system before accessing resources.
• Users must allow installation of security profiles, encryption policies, and remote wipe capability.

### 3.3 Authentication & Access Control
• MFA is required for all access to corporate email, VPN, and SaaS applications.
• Access is based on least privilege and conditional access policies.
• Network segmentation must be enforced — BYOD devices connect only to guest/corporate BYOD VLAN.

### 3.4 Security Configuration
Devices must:
• Be protected with a passcode/biometric lock
• Use full-disk encryption (AES-256 or equivalent)
• Receive security patches within 30 days of release
• Run ${companyName}-approved endpoint protection/anti-malware
• Automatic screen lock must activate after 5 minutes of inactivity

### 3.5 Data Protection
• Restricted and confidential data must never be stored locally on personal devices.
• Email attachments and sensitive data must open in secure containers.
• Copy/paste and local downloads may be restricted for high-sensitivity systems.

### 3.6 Monitoring & Logging
• All access from BYOD devices is logged and monitored.
• The security team may collect device metadata (OS version, patch level, compliance status).
• Personal content will not be monitored, ensuring user privacy.

## 4. Roles & Responsibilities
• **Employees/Users:** Maintain compliance, report lost/stolen devices immediately, complete BYOD security awareness training.
• **IT/Security Team:** Enforce MDM/EDR controls, monitor compliance, provide support, disable access for noncompliant devices.
• **Managers:** Ensure team members are aware of policy and report non-compliance.

## 5. Enforcement & Violations
• Non-compliant devices will be automatically quarantined by MDM.
• Repeated violations may result in revocation of BYOD privileges.
• Serious violations may result in disciplinary action up to termination.

## 6. Exceptions
• Exceptions must be approved in writing by the CISO or delegate.
• Exceptions are time-bound, risk-assessed, and reviewed at least annually.

## 7. Review & Maintenance
• This policy will be reviewed annually or when significant changes occur.
• Updates will be communicated to all staff.

## 8. References
• NIST Cybersecurity Framework v1.1
• CIS Controls v8
• ISO/IEC 27001:2022 & ISO/IEC 27002:2022
• SOC 2 Trust Services Criteria`
  },

  'Access_Control': {
    title: 'Access Control Policy',
    category: 'Access Management',
    frameworks: ['NIST_CSF', 'ISO_27001', 'CIS_Controls', 'SOC2'],
    priority: 'critical',
    content: (companyName) => `# **Access Control Policy**

## 1. Purpose and Scope

This policy defines how access to ${companyName}'s systems, applications, networks, and facilities is controlled to protect information assets and ensure compliance with regulatory and contractual requirements.

• **Applies to:** all employees, contractors, and third parties with access to corporate resources.
• **Covers:** digital systems, cloud environments, databases, applications, and physical facilities.

## 2. Policy Principles
• Access will be granted on the principle of least privilege and need-to-know.
• Authentication and authorization must be strong, traceable, and auditable.
• Access must be revoked promptly when no longer required.
• Access controls must align with recognized frameworks: NIST CSF PR.AC, CIS Controls 6 & 16, and ISO/IEC 27001 A.9.

## 3. Requirements and Controls

### 3.1 User Access Management
• All users must have unique IDs; shared accounts are prohibited.
• Multi-Factor Authentication (MFA) required for critical systems, remote access, and privileged accounts.
• Access rights must be requested, approved, and documented via a formal process.
• Offboarding: access revoked within 24 hours of termination or contract end.

### 3.2 Privileged Access
• Privileged accounts (e.g., system administrators, root accounts) must be used only when necessary and logged.
• Privileged sessions should be monitored via Privileged Access Management (PAM) tools where available.
• Default accounts must be disabled or renamed and protected with strong credentials.

### 3.3 Access Reviews
• Access rights for sensitive systems must be reviewed quarterly by system owners and security.
• Evidence of reviews must be retained for audit purposes.
• Exceptions must be documented and approved by the CISO or delegate.

### 3.4 Authentication Standards
• Passwords must follow organizational password policy (minimum length, complexity, rotation).
• Service accounts must be secured with key vaults or secrets managers, not hardcoded in scripts.
• Federated SSO should be used to centralize authentication where possible.

### 3.5 Network and Physical Access
• Segregate user, admin, and guest networks.
• Access to production networks must be controlled through VPN, firewalls, and role-based restrictions.
• Physical access to data centers or sensitive areas requires badge access, logging, and monitoring.

## 4. Roles and Responsibilities
• **CISO / Security Team:** define, monitor, and enforce access control measures.
• **System Owners:** approve and review access to their systems.
• **Managers:** ensure employees have the correct access for their role.
• **All Users:** comply with this policy, report suspicious activity, and safeguard credentials.

## 5. Monitoring and Enforcement
• Access events (logins, privilege escalations, failed attempts) must be logged and monitored.
• Violations (e.g., unauthorized access, credential sharing) may result in disciplinary action, up to and including termination and legal action.

## 6. Exceptions
• Any exceptions to this policy require a documented risk assessment and written approval from the CISO.

## 7. Review Cycle
• This policy must be reviewed annually or when significant changes occur in technology, risk, or regulatory requirements.

## 8. References
• NIST Cybersecurity Framework (PR.AC)
• CIS Controls v8 (Control 6, 16)
• ISO/IEC 27001:2022 Annex A.9 (Access Control)
• SOC 2 Trust Services Criteria (CC6, CC7)`
  },

  'Acceptable_Use': {
    title: 'Acceptable Use Policy',
    category: 'Usage Guidelines',
    frameworks: ['NIST_CSF', 'ISO_27001', 'SOC2'],
    priority: 'high',
    content: (companyName) => `# **Acceptable Use Policy**

## 1. INTRODUCTION

### Policy Statement
This Acceptable Use Policy (AUP) defines the acceptable practices associated with the use of technology and communications resources at ${companyName}. All users are required to adhere to this policy to maintain a secure and productive environment.

### Purpose
The purpose of this Acceptable Use Policy is to outline the responsibilities of users in maintaining the integrity, confidentiality, and availability of ${companyName}'s information systems. This policy seeks to protect the organization's resources from operational risks related to improper use.

### Scope of Application
This Acceptable Use Policy applies to all employees, contractors, consultants, and temporary staff who access **[SPECIFIC SYSTEM/APPLICATION NAMES]** and any other technology resources owned or operated by ${companyName}, including but not limited to computers, mobile devices, and network resources.

### Key Definitions and Terminology
- **User:** Any individual who accesses, uses, or manages ${companyName}'s information systems.
- **Information Systems:** Includes all hardware, software, and network infrastructure utilized by ${companyName}.
- **Acceptable Use:** Behavior that is aligned with the policy's guidelines, fostering security and productivity.

## 2. PRINCIPLES & OBJECTIVES

### High-Level Principles
- Use of ${companyName}'s information systems must align with organizational goals and ethical standards.
- Users must protect the confidentiality and integrity of sensitive information.
- All users have the responsibility to report any misuse or violations of this policy.

### Specific Objectives
- To prevent unauthorized access to and misuse of ${companyName}'s information systems.
- To promote awareness of acceptable use practices among users.
- To ensure compliance with applicable laws and regulations, including **[APPLICABLE REGULATORY REQUIREMENTS]**.

### Organizational Risk Appetite
This policy aligns with ${companyName}'s risk tolerance of **[YOUR ORGANIZATION'S RISK TOLERANCE]**, acknowledging the balance between the need for access to information and the protection of sensitive data.

### Compliance and Regulatory Considerations
This policy adheres to the standards outlined in the NIST Cybersecurity Framework, SOC 2 Trust Services Criteria, and ISO 27001/27002, ensuring a comprehensive approach to acceptable use.

## 3. POLICY REQUIREMENTS & CONTROLS

### 3.1 Core Requirements
- Users must have unique credentials and must not share personal login information.
- All software and systems must be approved by **[DEPARTMENT/ROLE RESPONSIBLE]**.
- Devices that access ${companyName}'s information systems must have up-to-date antivirus and security patches.

### 3.2 Implementation Controls
- **Technical Controls:** Multi-factor authentication, role-based access controls, and encryption of sensitive information.
- **Administrative Controls:** Regular audits of system access and usage, user account management, and incident response procedures.
- **Physical Security:** All devices must be secured in locked locations when not in use and unattended devices must use lock screens.

## 4. ROLES & RESPONSIBILITIES
- **Executive Leadership:** Accountable for the enforcement of this AUP and ensuring compliance across the organization.
- **IT/Security Team:** Responsible for monitoring network traffic, conducting audits, and managing technical safeguards related to acceptable use.
- **Department/Business Unit:** Expected to provide training and monitor adherence to the policy in their respective areas.
- **Individual Employees:** Must familiarize themselves with this AUP and report violations or suspicious activities.
- **Third-Party Vendors:** Must comply with this policy when accessing ${companyName}'s systems or data, ensuring that their employees are also aware of AUP requirements.

## 5. IMPLEMENTATION & COMPLIANCE

### Step-by-Step Implementation Guidance
1. Disseminate the Acceptable Use Policy to all employees.
2. Provide training sessions on the policy, ensuring understanding of responsibilities and implications of violations.
3. Deploy technical controls as outlined in section 3.2 to facilitate compliance with the policy.

### Timeline and Milestones
- **Policy rollout:** [Insert Start Date]
- **Completion of training:** [Insert Deadline]
- **First compliance audit:** [Insert Date]

### Required Documentation and Evidence Collection
Maintain records of user acknowledgment of the AUP, training completion, and system access logs for compliance and auditing purposes.

### Training and Awareness Requirements
All users must complete an AUP training session during onboarding and refresher training on an annual basis.

### Compliance Measurement and Metrics
Success will be measured by monitoring the number of reported violations, audit findings, and user compliance rates.

## 6. VIOLATIONS & ENFORCEMENT

### Types of Acceptable Use Policy Violations
- Unauthorized access to systems or data.
- Use of company resources for illegal activities.
- Sharing of confidential information outside authorized personnel.

### Disciplinary Actions and Consequences
Violations may result in disciplinary actions ranging from a warning to termination of employment, depending on the severity of the violation.

### Investigation Procedures for Acceptable Use Violations
All reported violations will be investigated by the IT Security Team, with findings documented and reviewed for any further action.

### Reporting Mechanisms for Violations
Users may report violations anonymously to **[YOUR INCIDENT RESPONSE TEAM]**, through designated email or hotline.

### Corrective Action Processes
Following an investigation of a violation, corrective actions will be implemented, and involved parties will undergo retraining on policy compliance.

## 7. POLICY REVIEW & MAINTENANCE

### Review Frequency and Triggers
This AUP will be reviewed at least annually, or whenever significant changes occur to technology, legal requirements, or operational practices.

### Approval Process for Changes
Any modifications to this policy require approval from **[EXECUTIVE ROLE/COMMITTEE]**.

### Version Control and Change Documentation
All versions of the policy will be documented with effective dates, summary of changes, and approval records.

### Communication of Policy Updates
Updates will be communicated to all employees via email and through internal communication channels.

### Continuous Improvement Mechanisms
Regular feedback from users and ongoing monitoring of policy effectiveness will be utilized to improve the AUP continually.

## 8. EXCEPTIONS & WAIVERS

### Exception Request Process
Users must submit written requests for exceptions to the AUP to **[DEPARTMENT/ROLE RESPONSIBLE]**, detailing the reasons and proposed term.

### Risk Assessment Requirements for Exceptions
All exception requests will be subject to a risk assessment to determine potential impacts on security and compliance.

### Approval Authority Levels
Exceptions must be approved by **[APPROVAL AUTHORITY LEVEL]**.

### Temporary vs. Permanent Exceptions
Exception approvals will specify if they are temporary or permanent, with set review dates for temporary exceptions.

### Monitoring and Review of Active Exceptions
Active exceptions will be reviewed quarterly to ensure compliance with the conditions set forth in the approval.

## 9. REFERENCES & RELATED DOCUMENTS
- **Related Policies:** [Related Policy Document 1], [Related Policy Document 2]
- **Applicable Laws:** [Cite regulations such as GDPR, HIPAA, etc.]
- **Industry Standards:** NIST, ISO, SOC 2 requirements
- **External Resources:** [List of relevant websites/articles for additional reading and guidance on acceptable use]

---

*This Acceptable Use Policy serves as a foundational document for ${companyName} to guide users in the appropriate use of organizational resources. Specific areas that require customization are indicated throughout, allowing for a tailored approach aligning with ${companyName}'s unique operational and regulatory context.*`
  }
};

// Helper function to get available policy templates
export const getAvailablePolicyTemplates = () => {
  return Object.keys(POLICY_TEMPLATES);
};

// Helper function to check if a policy type has a template
export const hasTemplate = (policyType) => {
  return POLICY_TEMPLATES.hasOwnProperty(policyType);
};

// Helper function to get template info
export const getTemplateInfo = (policyType) => {
  return POLICY_TEMPLATES[policyType] || null;
};
