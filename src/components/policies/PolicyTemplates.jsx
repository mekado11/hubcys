// 13 Professional Policy Templates — aligned to SOC 2 Type II (2026) & NIST SP 800-53 Rev 5
// Auto-fills company name from user profile

export const FRAMEWORK_MAPPINGS = {
  NIST_CSF:       { name: "NIST CSF" },
  ISO_27001:      { name: "ISO 27001" },
  SOC2:           { name: "SOC 2" },
  CIS_Controls:   { name: "CIS Controls" },
  HIPAA:          { name: "HIPAA" },
  GDPR:           { name: "GDPR" },
  NIST_800_53:    { name: "NIST 800-53" },
  PCI_DSS:        { name: "PCI DSS" },
};

const today = () => new Date().toLocaleDateString("en-GB");
const nextYear = () => new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString("en-GB");

export const POLICY_TEMPLATES = {

  Access_Control: {
    title: "Access Control Policy",
    category: "Identity & Access",
    frameworks: ["NIST_CSF", "ISO_27001", "SOC2", "NIST_800_53"],
    priority: "critical",
    content: (companyName) => `# Access Control Policy

**Organisation:** ${companyName}
**Policy ID:** ISP-01 | **Version:** 1.0 | **Effective Date:** ${today()} | **Next Review:** ${nextYear()}
**Owner:** Chief Information Security Officer (CISO) | **Classification:** Internal

---

## 1. Purpose

The purpose of this policy is to ensure that access to information systems, applications, data, and physical resources is granted only to authorised individuals and entities, on a least-privilege and need-to-know basis, and that such access is promptly reviewed and revoked when no longer required. This policy reduces the risk of unauthorised disclosure, modification, or destruction of organisational information assets.

## 2. Scope

This policy applies to all employees, contractors, consultants, temporary staff, third-party service providers, and any other individuals or automated systems (including service accounts and APIs) that access organisation-owned or organisation-managed systems, networks, applications, data repositories, or facilities. It covers all environments including production, staging, development, and cloud platforms.

## 3. Definitions

- **Least Privilege:** The principle that an account or process is granted only the minimum permissions necessary to perform its defined function.
- **Need-to-Know:** Access is restricted to information required for an individual's specific role or task.
- **Privileged Account:** An account with elevated rights, such as system administrator, database administrator, or root access.
- **Role-Based Access Control (RBAC):** A method of restricting system access to authorised users based on defined roles within the organisation.
- **Multi-Factor Authentication (MFA):** An authentication mechanism requiring two or more verification factors from independent categories.
- **Access Review:** A formal, documented process to verify that current access assignments remain appropriate.

## 4. Policy Requirements

### 4.1 Access Management Lifecycle

- **REQ-AC-01:** All access to information systems must be formally requested, approved, and provisioned through an identity and access management (IAM) process before access is granted. Access requests must include business justification, system name, role or permission level, and authorising manager approval.
- **REQ-AC-02:** Access must be provisioned using role-based access control. Generic or shared accounts (other than approved service accounts) are prohibited.
- **REQ-AC-03:** The principle of least privilege must be enforced for all user, service, and privileged accounts.
- **REQ-AC-04:** Privileged accounts must be distinct from standard user accounts.
- **REQ-AC-05:** Access rights must be reviewed at a minimum every ninety (90) days for privileged accounts and every six (6) months for standard user accounts.
- **REQ-AC-06:** Upon employee termination, transfer, or role change, access rights must be modified or revoked within one (1) business day for standard accounts and within four (4) hours for privileged accounts.

### 4.2 Authentication Requirements

- **REQ-AC-07:** All user accounts must authenticate using a unique identifier. Shared or anonymous access to sensitive systems is prohibited.
- **REQ-AC-08:** Multi-factor authentication (MFA) is mandatory for: all remote access; all cloud administration consoles; all privileged accounts; all access to Restricted or Confidential systems; and all externally-facing portals.
- **REQ-AC-09:** Session time-outs must lock inactive sessions after a maximum of fifteen (15) minutes on workstations and thirty (30) minutes on server console sessions.

### 4.3 Remote Access

- **REQ-AC-10:** Remote access must traverse an approved, encrypted VPN or Zero Trust Network Access (ZTNA) solution.
- **REQ-AC-11:** Remote access sessions must be logged, retaining user identity, source IP, session start/end times, and systems accessed for a minimum of twelve (12) months.

### 4.4 Privileged Access Management

- **REQ-AC-12:** Privileged accounts must be managed within a Privileged Access Management (PAM) solution with vaulted, automatically rotated credentials.
- **REQ-AC-13:** Administrative access to production systems must be via jump servers or bastion hosts with full session recording retained for a minimum of twelve (12) months.
- **REQ-AC-14:** Just-in-Time (JIT) access provisioning is the preferred model for privileged tasks.

### 4.5 Third-Party and Service Account Access

- **REQ-AC-15:** Third-party access must be time-limited, scoped to the minimum systems and data required, and subject to the same access review controls as internal accounts.
- **REQ-AC-16:** Service accounts and API credentials must be documented in an inventory, assigned to a named system owner, and rotated at least annually.

## 5. Roles & Responsibilities

| Role | Responsibility |
|------|---------------|
| CISO | Own and enforce this policy; approve exceptions |
| IT Security | Administer IAM systems; conduct access reviews |
| System Owners | Approve access requests; participate in access reviews |
| HR | Notify IT Security on employee termination or role change |
| All Personnel | Safeguard credentials; report unauthorised access |

## 6. Compliance Framework Mapping

- **NIST SP 800-53 Rev 5:** AC-1 through AC-25, IA-1 through IA-12
- **SOC 2 TSC:** CC6.1, CC6.2, CC6.3
- **ISO/IEC 27001:2022:** A.5.15, A.5.16, A.5.17, A.5.18, A.8.2, A.8.3, A.8.4, A.8.5

## 7. Enforcement

Violation of this policy may result in disciplinary action up to and including termination of employment, and/or termination of third-party contracts. Incidents involving deliberate circumvention of access controls may be referred to law enforcement.

## 8. Exceptions

Exceptions must be formally requested in writing to the CISO, with documented business justification, compensating controls, and a time-limited approval (maximum 90 days, renewable). All approved exceptions must be recorded in the risk register.

## 9. Review & Revision

This policy shall be reviewed at least annually by the CISO, or sooner following a significant security incident, material change to the organisation's technology environment, or relevant regulatory update.`
  },

  Incident_Response: {
    title: "Incident Response Policy",
    category: "Security Operations",
    frameworks: ["NIST_CSF", "ISO_27001", "SOC2", "NIST_800_53"],
    priority: "critical",
    content: (companyName) => `# Incident Response Policy

**Organisation:** ${companyName}
**Policy ID:** ISP-02 | **Version:** 1.0 | **Effective Date:** ${today()} | **Next Review:** ${nextYear()}
**Owner:** Chief Information Security Officer (CISO) | **Classification:** Internal

---

## 1. Purpose

This policy establishes a structured and consistent approach to detecting, reporting, containing, eradicating, and recovering from information security incidents. Its purpose is to minimise the business impact of incidents, preserve forensic evidence, satisfy legal and regulatory notification obligations, and drive continuous improvement through post-incident analysis.

## 2. Scope

This policy applies to all employees, contractors, and third parties who identify, or are involved in responding to, any actual or suspected security incident affecting the organisation's systems, data, networks, or facilities. It covers all incident types including data breaches, ransomware, denial-of-service attacks, unauthorised access, malware infections, insider threats, and physical security events.

## 3. Definitions

- **Security Event:** Any observable occurrence in a system or network that may have security implications.
- **Security Incident:** A security event that actually or potentially jeopardises the confidentiality, integrity, or availability of information or systems.
- **Data Breach:** A security incident resulting in accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, personal or sensitive organisational data.
- **Incident Response Team (IRT):** The cross-functional team responsible for managing the incident response lifecycle.
- **MTTR:** Mean Time to Respond — the average time from incident detection to containment.

## 4. Policy Requirements

### 4.1 Incident Response Programme

- **REQ-IR-01:** The organisation must maintain a formal, documented Incident Response Plan (IRP) defining roles, responsibilities, escalation paths, communication procedures, and technical response playbooks. The IRP must be reviewed and updated at least annually and following every major incident.
- **REQ-IR-02:** An Incident Response Team (IRT) must be formally designated with named primary and backup members, including representatives from IT Security, IT Operations, Legal/Compliance, Communications/PR, and executive leadership.
- **REQ-IR-03:** All personnel must complete annual incident response awareness training.
- **REQ-IR-04:** A tabletop exercise or simulated incident drill must be conducted at least once per year.

### 4.2 Incident Lifecycle — Six Phases

- **REQ-IR-05 (Preparation):** Maintain incident response tools, out-of-band communication channels, forensic capabilities, and documented contact lists.
- **REQ-IR-06 (Identification & Classification):** All suspected incidents must be reported immediately to the IT Security team. Incidents must be classified (Critical / High / Medium / Low) within four (4) hours of initial report.
- **REQ-IR-07 (Containment):** For Critical and High severity incidents, initial containment must begin within two (2) hours of classification. For Medium incidents, within twenty-four (24) hours.
- **REQ-IR-08 (Eradication):** Root cause must be identified and all traces of the threat removed prior to recovery. Eradication steps must be documented.
- **REQ-IR-09 (Recovery):** Systems must be restored from verified clean backups where practicable and must pass security validation before returning to production.
- **REQ-IR-10 (Post-Incident Review):** A formal Post-Incident Review (PIR) must be completed within fourteen (14) calendar days of incident closure for Critical/High incidents, and within thirty (30) days for Medium severity.

### 4.3 Evidence Preservation

- **REQ-IR-11:** Digital evidence must be handled in a forensically sound manner with chain-of-custody documentation, hash verification, and write-protection. Evidence must be retained for a minimum of three (3) years.

### 4.4 Notification and Reporting

- **REQ-IR-12:** Incidents involving personal data must be assessed for regulatory notification obligations within twenty-four (24) hours of discovery. Notifications must be made within seventy-two (72) hours for regulatory authorities where required by law.
- **REQ-IR-13:** Executive leadership must be notified of Critical and High severity incidents within four (4) hours of classification. The Board must be notified of Critical incidents within twenty-four (24) hours.
- **REQ-IR-14:** All incidents must be logged in the organisation's incident tracking system and records retained for a minimum of five (5) years.

### 4.5 Metrics

- **REQ-IR-15:** Monthly reporting to the CISO must include: number of incidents by severity; MTTR by severity; percentage of incidents with completed PIRs on schedule; and status of open remediation actions.

## 5. Roles & Responsibilities

| Role | Responsibility |
|------|---------------|
| CISO | Own IRP; lead Critical incident response; approve notifications |
| IRT Lead | Coordinate incident response activities |
| IT Security | Technical investigation, containment, and eradication |
| Legal/Compliance | Regulatory notification obligations; evidence preservation |
| Communications/PR | Internal and external communications |
| All Personnel | Report suspected incidents immediately |

## 6. Compliance Framework Mapping

- **NIST SP 800-53 Rev 5:** IR-1 through IR-10
- **SOC 2 TSC:** CC7.3, CC7.4, CC7.5, CC9.1
- **ISO/IEC 27001:2022:** A.5.24, A.5.25, A.5.26, A.5.27, A.5.28

## 7. Enforcement

Failure to report a suspected incident promptly, or to co-operate with the Incident Response Team, may result in disciplinary action. Deliberate suppression or concealment of an incident is grounds for immediate termination and potential legal referral.

## 8. Exceptions

No exceptions to the mandatory reporting requirements of this policy are permitted. Exceptions to procedural elements must be approved by the CISO with documented rationale.

## 9. Review & Revision

This policy shall be reviewed annually, or within thirty (30) days following any Critical or High severity incident whose PIR identifies policy deficiencies.`
  },

  Data_Backup_and_Recovery: {
    title: "Data Backup & Recovery Policy",
    category: "Data Protection",
    frameworks: ["NIST_CSF", "ISO_27001", "SOC2", "NIST_800_53"],
    priority: "critical",
    content: (companyName) => `# Data Backup & Recovery Policy

**Organisation:** ${companyName}
**Policy ID:** ISP-03 | **Version:** 1.0 | **Effective Date:** ${today()} | **Next Review:** ${nextYear()}
**Owner:** Chief Information Security Officer (CISO) | **Classification:** Internal

---

## 1. Purpose

This policy ensures that all critical organisational data and system configurations are regularly backed up, securely stored, and recoverable within defined timeframes following data loss, system failure, ransomware, or disaster events.

## 2. Scope

This policy applies to all data, databases, application configurations, and system images that support the organisation's operations, including on-premises servers, cloud-hosted platforms, SaaS applications with exportable data, and endpoint devices storing organisational data.

## 3. Definitions

- **Recovery Time Objective (RTO):** The maximum acceptable period within which a system or service must be restored following a disruption.
- **Recovery Point Objective (RPO):** The maximum acceptable amount of data loss measured in time.
- **Immutable Backup:** A backup copy that cannot be altered, deleted, or encrypted by ransomware for a defined retention period.
- **3-2-1 Strategy:** Three copies of data, on two different storage media types, with one copy stored offsite or in a geographically separated region.

## 4. Policy Requirements

### 4.1 Backup Classification and Frequency

- **REQ-BK-01:** All data must be classified by criticality tier. Tier 1 (Mission-Critical) systems must be backed up daily at minimum, with continuous replication where technically feasible. Tier 2 (Business-Important) systems must be backed up daily. Tier 3 (Standard) systems must be backed up at a minimum weekly.
- **REQ-BK-02:** Backup schedules must be documented and aligned to defined RTO and RPO targets.
- **REQ-BK-03:** At minimum, a 3-2-1 backup strategy must be implemented.

### 4.2 Backup Security

- **REQ-BK-04:** All backup data must be encrypted in transit using TLS 1.2 or higher and at rest using AES-256 or equivalent.
- **REQ-BK-05:** At least one backup copy per system must be stored as an immutable backup.
- **REQ-BK-06:** Access to backup systems must be restricted to authorised personnel only.

### 4.3 Retention

- **REQ-BK-07:** Minimum backup retention periods:
  - Daily backups — thirty (30) days
  - Weekly backups — twelve (12) weeks
  - Monthly backups — twelve (12) months
  - Annual backups — seven (7) years (or as required by applicable law)

### 4.4 Backup Testing and Verification

- **REQ-BK-08:** Backup jobs must be monitored daily. Failed jobs must be investigated and remediated within twenty-four (24) hours.
- **REQ-BK-09:** Restoration tests must be conducted for all Tier 1 systems at least quarterly, and for Tier 2 systems at least semi-annually.
- **REQ-BK-10:** Restoration test results must be documented and retained for a minimum of three (3) years.

### 4.5 Cloud and SaaS Considerations

- **REQ-BK-11:** Organisations using cloud or SaaS platforms must not rely solely on provider-managed backups unless the provider's backup SLA meets or exceeds this policy's requirements and is contractually guaranteed.

## 5. Roles & Responsibilities

| Role | Responsibility |
|------|---------------|
| CISO | Own and enforce this policy |
| IT Operations | Execute backup schedules; monitor backup jobs; conduct restoration tests |
| System Owners | Define and document RTO/RPO for systems under their ownership |

## 6. Compliance Framework Mapping

- **NIST SP 800-53 Rev 5:** CP-6, CP-9, CP-10
- **SOC 2 TSC:** A1.2
- **ISO/IEC 27001:2022:** A.8.13

## 7. Enforcement

Failure to comply with backup schedules or retention requirements, or falsifying restoration test results, constitutes a disciplinary violation.

## 8. Exceptions

Exceptions requiring reduced backup frequency or retention must be formally approved by the CISO with documented compensating controls and accepted risk.

## 9. Review & Revision

This policy shall be reviewed annually, or following any data loss event, significant infrastructure change, or modification to business continuity RTO/RPO targets.`
  },

  Data_Retention_and_Disposal: {
    title: "Data Retention & Disposal Policy",
    category: "Data Governance",
    frameworks: ["NIST_CSF", "ISO_27001", "SOC2", "GDPR"],
    priority: "high",
    content: (companyName) => `# Data Retention & Disposal Policy

**Organisation:** ${companyName}
**Policy ID:** ISP-04 | **Version:** 1.0 | **Effective Date:** ${today()} | **Next Review:** ${nextYear()}
**Owner:** Chief Information Security Officer (CISO) | **Classification:** Internal

---

## 1. Purpose

This policy governs the retention, archiving, and secure disposal of organisational data and information assets throughout their lifecycle. It ensures that data is retained for the period required by law, regulation, or business need, and is securely and irreversibly destroyed when retention obligations expire.

## 2. Scope

This policy applies to all data in any format (electronic, paper, or other physical media) owned, created, received, transmitted, or maintained by the organisation or on its behalf.

## 3. Definitions

- **Retention Period:** The minimum duration for which a record or category of data must be kept.
- **Legal Hold:** A directive to preserve data beyond normal retention periods when litigation or regulatory investigation is reasonably anticipated.
- **Secure Disposal:** Permanent and irreversible destruction of data such that it cannot be reconstructed.
- **Sanitisation:** The process of rendering data on a storage medium irrecoverable using approved methods.

## 4. Policy Requirements

### 4.1 Data Classification and Retention Schedule

- **REQ-RD-01:** The organisation must maintain a Data Retention Schedule specifying retention periods for all major data categories. The schedule must be reviewed annually.
- **REQ-RD-02:** Data must not be retained beyond its scheduled retention period unless subject to a legal hold.
- **REQ-RD-03:** Minimum retention guidance:
  - Financial records — seven (7) years
  - Employee records — seven (7) years post-termination
  - Contracts — ten (10) years post-expiry
  - Audit logs — three (3) years
  - Incident records — five (5) years
  - Personal data — minimum period necessary for the stated purpose

### 4.2 Data Archiving

- **REQ-RD-04:** Data approaching end-of-active-use but within its retention period must be archived to cost-effective, secure long-term storage.
- **REQ-RD-05:** Archived data must be encrypted at rest (AES-256 minimum) and subject to the same access controls as active data.

### 4.3 Legal Holds

- **REQ-RD-06:** Upon receiving notice of litigation or regulatory investigation, Legal/Compliance must issue a formal legal hold notice. IT Security must immediately suspend automated deletion processes for in-scope data.
- **REQ-RD-07:** Legal holds must be documented and released only upon written instruction from Legal/Compliance.

### 4.4 Secure Data Disposal

- **REQ-RD-08:** Data that has reached its retention end date must be disposed of using NIST SP 800-88 Rev 1 approved sanitisation methods:
  - Magnetic media (HDDs, tapes): Multi-pass overwrite or degaussing
  - Solid-state media (SSDs): Cryptographic erasure or physical destruction
  - Cloud storage: Provider-certified deletion or cryptographic erasure
  - Physical paper records: Cross-cut shredding (DIN 66399 Level P-4 or higher) or incineration

- **REQ-RD-09:** Physical destruction must be carried out by a certified data destruction vendor. A Certificate of Destruction (CoD) must be obtained and retained.
- **REQ-RD-10:** Disposal activities must be recorded in an asset disposal log retained for five (5) years.
- **REQ-RD-11:** IT assets must be sanitised before redeployment, donation, return to lessor, or disposal.

## 5. Compliance Framework Mapping

- **NIST SP 800-53 Rev 5:** SI-12, MP-6
- **SOC 2 TSC:** C1.2
- **ISO/IEC 27001:2022:** A.8.10
- **GDPR:** Article 5(1)(e), Article 17

## 6. Enforcement

Improper disposal of sensitive or confidential data — including failure to obtain a Certificate of Destruction — is a disciplinary violation. Disposal of data subject to a legal hold is a serious violation and may result in legal consequences.

## 7. Exceptions

All exceptions require written CISO and Legal/Compliance approval with documented justification.

## 8. Review & Revision

This policy shall be reviewed annually, and immediately following any change in applicable data protection law or significant data disposal incident.`
  },

  Vendor_Security_Management: {
    title: "Vendor Security Policy",
    category: "Third-Party Risk",
    frameworks: ["NIST_CSF", "ISO_27001", "SOC2", "NIST_800_53"],
    priority: "high",
    content: (companyName) => `# Vendor Security Policy

**Organisation:** ${companyName}
**Policy ID:** ISP-05 | **Version:** 1.0 | **Effective Date:** ${today()} | **Next Review:** ${nextYear()}
**Owner:** Chief Information Security Officer (CISO) | **Classification:** Internal

---

## 1. Purpose

This policy establishes security requirements for the selection, onboarding, ongoing management, and offboarding of vendors, suppliers, and other third parties that access, process, store, or transmit the organisation's information assets or operate on its behalf.

## 2. Scope

This policy applies to all vendors, suppliers, subcontractors, cloud service providers, managed service providers, software vendors, and any other third party that: accesses the organisation's systems, networks, or data; processes personal data on behalf of the organisation; or provides technology components integrated into the organisation's systems.

## 3. Policy Requirements

### 3.1 Pre-Engagement Security Assessment

- **REQ-VS-01:** Before engaging any vendor that will access organisational systems or data, a security risk assessment must be performed proportionate to the sensitivity of data accessed and the criticality of the service.
- **REQ-VS-02:** Vendors providing Tier 1 (Critical/High Risk) services must provide evidence of current ISO 27001 certification, SOC 2 Type II report, or equivalent third-party audit within the preceding twelve (12) months.
- **REQ-VS-03:** Vendors must complete a security questionnaire covering: access control practices, data encryption, incident response capabilities, sub-processor use, penetration testing frequency, and compliance with applicable data protection laws.

### 3.2 Contractual Security Requirements

- **REQ-VS-04:** All vendor contracts involving access to organisational data or systems must include security clauses covering: data processing obligations; security incident notification within 24 hours of discovery; audit rights; data return and deletion upon contract termination; and sub-processor restrictions.
- **REQ-VS-05:** Where a vendor processes personal data, a Data Processing Agreement (DPA) or equivalent instrument must be executed prior to any data sharing.

### 3.3 Ongoing Monitoring

- **REQ-VS-06:** A vendor risk register must be maintained and updated at least annually.
- **REQ-VS-07:** Vendors must notify the organisation of any security incident or material change to their security posture within twenty-four (24) hours of discovery.
- **REQ-VS-08:** Annual security reviews of Critical and High risk vendors must include review of updated security certifications, re-assessment against the security questionnaire, and where contractually permitted, on-site audit or independent penetration test.

### 3.4 Vendor Offboarding

- **REQ-VS-09:** Upon contract termination, all vendor access must be revoked on or before the contract end date. Vendors must provide written confirmation of data deletion or return within thirty (30) days of termination.

## 4. Compliance Framework Mapping

- **NIST SP 800-53 Rev 5:** SR-1 through SR-12, SA-9
- **SOC 2 TSC:** CC9.2
- **ISO/IEC 27001:2022:** A.5.19, A.5.20, A.5.21, A.5.22, A.5.23

## 5. Enforcement

Engaging a vendor without completing the required pre-engagement security assessment, or failing to include mandatory security clauses in contracts, is a disciplinary violation.

## 6. Exceptions

Emergency vendor engagements may proceed with documented risk acceptance, provided the full assessment is completed within thirty (30) days of engagement commencement.

## 7. Review & Revision

This policy shall be reviewed annually, and following any security incident involving a vendor, or material change to the vendor landscape.`
  },

  Acceptable_Use: {
    title: "Acceptable Use Policy",
    category: "User Governance",
    frameworks: ["NIST_CSF", "ISO_27001", "SOC2"],
    priority: "high",
    content: (companyName) => `# Acceptable Use Policy

**Organisation:** ${companyName}
**Policy ID:** ISP-06 | **Version:** 1.0 | **Effective Date:** ${today()} | **Next Review:** ${nextYear()}
**Owner:** Chief Information Security Officer (CISO) | **Classification:** Internal

---

## 1. Purpose

This policy defines acceptable and prohibited uses of the organisation's information technology resources, including computing equipment, networks, software, data, and communication systems. It protects the organisation from legal liability, reputational harm, and security risk arising from inappropriate use of its technology assets.

## 2. Scope

This policy applies to all employees, contractors, consultants, and other individuals granted access to the organisation's IT resources, whether on-site, remote, or via personally owned devices.

## 3. General Principles

Organisation IT resources are provided for business purposes. Limited, incidental personal use is permitted provided it does not interfere with work responsibilities, consume excessive bandwidth or storage, create legal liability, or violate any provision of this policy. Users have no expectation of privacy when using organisation-provided systems.

## 4. Policy Requirements

### 4.1 Acceptable Use

- **REQ-AU-01:** Users must use IT resources in a manner consistent with their job responsibilities and in compliance with all applicable laws, regulations, and organisation policies.
- **REQ-AU-02:** Users must protect their authentication credentials and must not share usernames, passwords, or authentication tokens with any other person.
- **REQ-AU-03:** Users must lock their workstation whenever leaving it unattended.
- **REQ-AU-04:** Users must report any suspected security incident, vulnerability, or policy violation to IT Security immediately upon discovery.

### 4.2 Prohibited Activities — Absolute Prohibitions

The following activities are strictly prohibited under all circumstances:

- Accessing, transmitting, downloading, or storing material illegal under applicable law
- Launching or facilitating cyberattacks or any unauthorised access to internal or external systems
- Installing, distributing, or using malware, spyware, key-loggers, or any other malicious software
- Circumventing or disabling security controls including firewalls, endpoint protection, MFA, or logging
- Using the organisation's network for commercial activities unrelated to the business
- Accessing, copying, or transmitting proprietary, confidential, or personal data without authorisation
- Engaging in harassment, discrimination, or creation of a hostile work environment via organisation communication channels
- Intentionally corrupting, deleting, or modifying data without authorisation

### 4.3 Internet and Email Use

- **REQ-AU-05:** Internet access must not be used to access sites that promote illegal activities, contain malicious code, or are explicitly blocked by organisation content filtering controls.
- **REQ-AU-06:** Organisation email accounts must not be used for personal commercial activities or transmission of confidential data to personal accounts without CISO approval.
- **REQ-AU-07:** Users must not open email attachments or click links from unknown or suspicious senders. Suspected phishing emails must be reported immediately.

### 4.4 Software and Installations

- **REQ-AU-08:** Users must not install software, browser extensions, or applications on organisation-managed devices without prior IT approval.
- **REQ-AU-09:** Use of unapproved cloud storage, file-sharing, or collaboration tools to process or transmit organisational data (Shadow IT) is prohibited.

### 4.5 Monitoring

- **REQ-AU-10:** The organisation reserves the right to monitor, log, and audit use of its IT resources. Users consent to such monitoring as a condition of access.

## 5. Compliance Framework Mapping

- **NIST SP 800-53 Rev 5:** PL-4, AC-8, AU-6
- **SOC 2 TSC:** CC2.2, CC6.1
- **ISO/IEC 27001:2022:** A.6.2, A.5.10

## 6. Enforcement

Violations may result in immediate suspension of IT access, disciplinary action up to and including termination, and referral to law enforcement for criminal violations. All users must acknowledge this policy annually.

## 7. Exceptions

Security research activities that may involve otherwise-prohibited techniques require prior written authorisation from the CISO specifying scope, methods, and timeframe.

## 8. Review & Revision

This policy shall be reviewed annually. User acknowledgement must be renewed each time the policy is materially updated.`
  },

  Password_Policy: {
    title: "Password Policy",
    category: "Identity & Access",
    frameworks: ["NIST_CSF", "ISO_27001", "SOC2", "NIST_800_53"],
    priority: "high",
    content: (companyName) => `# Password Policy

**Organisation:** ${companyName}
**Policy ID:** ISP-07 | **Version:** 1.0 | **Effective Date:** ${today()} | **Next Review:** ${nextYear()}
**Owner:** Chief Information Security Officer (CISO) | **Classification:** Internal

---

## 1. Purpose

This policy establishes minimum requirements for the creation, complexity, management, and protection of passwords and passphrases used to authenticate to organisation systems. It is aligned to NIST SP 800-63B Digital Identity Guidelines (2024 revision) and the NCSC Password Guidance.

## 2. Scope

This policy applies to all user accounts, service accounts, administrator accounts, and application accounts that authenticate using a password to access organisation systems, applications, networks, and data.

## 3. Policy Requirements

### 3.1 Password Construction

- **REQ-PW-01:** User passwords must be a minimum of twelve (12) characters in length. Passphrase formats are encouraged.
- **REQ-PW-02:** Privileged account passwords must be a minimum of sixteen (16) characters.
- **REQ-PW-03:** Passwords must not contain: the user's account name or display name; sequential characters; repeated characters; commonly used passwords or dictionary words alone; or any value known to appear in data breach corpuses.
- **REQ-PW-04:** Systems must be configured to check new passwords against known-breached password lists (e.g., Have I Been Pwned API) and reject matches. This is mandatory for all internet-facing and cloud-hosted systems.

### 3.2 Password Expiry and Rotation

- **REQ-PW-06:** Consistent with NIST SP 800-63B guidance, mandatory periodic password expiry is not required for standard accounts where MFA is enforced and continuous breach monitoring is implemented. Passwords must be changed immediately upon any suspected or confirmed compromise.
- **REQ-PW-07:** Privileged account passwords must be rotated at least every ninety (90) days.
- **REQ-PW-08:** Service account and API key credentials must be rotated at least annually.

### 3.3 Password Storage

- **REQ-PW-09:** Passwords must never be stored in plain text. Password hashing must use: bcrypt (cost factor ≥12), Argon2id (recommended), or PBKDF2 (≥600,000 iterations with HMAC-SHA256). MD5 and SHA-1 are prohibited for password storage.
- **REQ-PW-10:** Passwords must not be transmitted in plain text. All authentication flows must use encrypted channels (TLS 1.2+).

### 3.4 Password Manager and Credential Protection

- **REQ-PW-11:** The organisation must provide or approve a password manager solution for use by all personnel.
- **REQ-PW-12:** Users must not write down passwords in physical form or store them in unencrypted digital files.
- **REQ-PW-13:** The IT Help Desk must never ask a user for their password. Password resets must be performed via an identity-verified mechanism.

### 3.5 Account Lockout

- **REQ-PW-14:** Account lockout must be configured on all systems to lock an account after a maximum of ten (10) consecutive failed login attempts. Lockout duration must be at least thirty (30) minutes for automatic unlock, or require manual administrator intervention for privileged accounts.

### 3.6 Default Credentials

- **REQ-PW-15:** All default manufacturer passwords on any device, application, or system must be changed before deployment. Deployment of any system retaining default credentials is prohibited.

## 4. Compliance Framework Mapping

- **NIST SP 800-53 Rev 5:** IA-5
- **SOC 2 TSC:** CC6.1
- **ISO/IEC 27001:2022:** A.8.5

## 5. Enforcement

Non-compliance with password requirements is a security policy violation subject to disciplinary action.

## 6. Exceptions

Systems that cannot technically enforce these requirements must implement compensating controls approved by the CISO and documented in the risk register.

## 7. Review & Revision

This policy shall be reviewed annually and updated to reflect current NIST SP 800-63B guidance and emerging threat intelligence.`
  },

  Change_Management: {
    title: "Change Management Policy",
    category: "IT Operations",
    frameworks: ["NIST_CSF", "ISO_27001", "SOC2", "NIST_800_53"],
    priority: "high",
    content: (companyName) => `# Change Management Policy

**Organisation:** ${companyName}
**Policy ID:** ISP-08 | **Version:** 1.0 | **Effective Date:** ${today()} | **Next Review:** ${nextYear()}
**Owner:** Chief Information Security Officer (CISO) | **Classification:** Internal

---

## 1. Purpose

This policy establishes a structured process for managing changes to information systems, infrastructure, applications, and configurations. It ensures that changes are assessed for security risk, properly authorised, tested, documented, and implemented in a controlled manner to prevent unintended disruption, security vulnerabilities, or compliance failures.

## 2. Scope

This policy applies to all changes to production systems, including but not limited to: server and network infrastructure; operating systems and middleware; applications and application code; database schemas; security controls and configurations; cloud platform configurations; firewall rules; and third-party integrations.

## 3. Definitions

- **Standard Change:** A pre-approved, low-risk, frequently performed change with documented procedures and known outcome.
- **Normal Change:** A change that requires risk assessment and formal approval before implementation.
- **Emergency Change:** A change required to restore service or address an active security incident, requiring expedited authorisation.
- **Change Advisory Board (CAB):** The group responsible for approving Normal changes. Membership must include IT Security, IT Operations, and relevant Business Owners.
- **Rollback Plan:** A documented, tested procedure to revert a change to the prior state.

## 4. Policy Requirements

### 4.1 Change Request and Documentation

- **REQ-CM-01:** All Normal changes must be submitted via a formal Change Request (CR) that includes: description of the change and business justification; risk assessment (including security impact); systems and services affected; implementation plan; testing plan; rollback plan; and required approvals.
- **REQ-CM-02:** Security impact assessment must be completed for all Normal and Emergency changes. Changes that introduce new attack surface, modify access controls, or affect security monitoring must receive CISO or IT Security sign-off.

### 4.2 Change Authorisation

- **REQ-CM-03:** Normal changes must be approved by the Change Advisory Board (CAB) before implementation.
- **REQ-CM-04:** Emergency changes may be implemented with verbal or immediate written authorisation from the CISO or IT leadership. Full change documentation must be completed within twenty-four (24) hours of implementation.
- **REQ-CM-05:** Segregation of duties must be enforced. Individuals who develop or request a change must not be the sole approver of that change.

### 4.3 Testing and Validation

- **REQ-CM-06:** All Normal changes must be tested in a non-production environment before production deployment.
- **REQ-CM-07:** Security testing must be incorporated into the change testing process for changes classified as Medium risk or higher.

### 4.4 Implementation and Rollback

- **REQ-CM-08:** Changes must be implemented during approved maintenance windows unless classified as Emergency.
- **REQ-CM-09:** Every change must have a documented, tested rollback plan.

### 4.5 Post-Change Review

- **REQ-CM-10:** All changes must undergo a post-implementation review within five (5) business days to verify successful implementation and confirm no unintended consequences.

### 4.6 Unauthorised Changes

- **REQ-CM-11:** Unauthorised changes are prohibited. Detected unauthorised changes must be treated as security incidents and investigated accordingly.

## 5. Compliance Framework Mapping

- **NIST SP 800-53 Rev 5:** CM-3, CM-4, CM-5, CM-9
- **SOC 2 TSC:** CC8.1
- **ISO/IEC 27001:2022:** A.8.32

## 6. Enforcement

Implementing changes without following this policy is a disciplinary violation. Unauthorised changes that result in security incidents may result in more severe disciplinary action.

## 7. Exceptions

Exceptions to mandatory change procedures must be approved by the CISO and documented. Emergency change procedures are the approved exception pathway for urgent situations.

## 8. Review & Revision

This policy shall be reviewed annually and following any change-related incident or significant process failure.`
  },

  Vulnerability_Management: {
    title: "Vulnerability Management Policy",
    category: "Security Operations",
    frameworks: ["NIST_CSF", "ISO_27001", "SOC2", "NIST_800_53"],
    priority: "critical",
    content: (companyName) => `# Vulnerability Management Policy

**Organisation:** ${companyName}
**Policy ID:** ISP-09 | **Version:** 1.0 | **Effective Date:** ${today()} | **Next Review:** ${nextYear()}
**Owner:** Chief Information Security Officer (CISO) | **Classification:** Internal

---

## 1. Purpose

This policy establishes a systematic, risk-based process for identifying, assessing, prioritising, remediating, and verifying the remediation of security vulnerabilities across the organisation's technology environment.

## 2. Scope

This policy applies to all organisation-owned, managed, or operated information systems including servers, workstations, network devices, cloud infrastructure, web and mobile applications, APIs, IoT devices, and OT/ICS systems.

## 3. Policy Requirements

### 3.1 Asset Inventory

- **REQ-VM-01:** A current, comprehensive inventory of all in-scope technology assets must be maintained and updated continuously, recording at minimum: asset type, system owner, OS/platform and version, network location, criticality classification, and last-scan date.

### 3.2 Vulnerability Scanning

- **REQ-VM-02:** Authenticated vulnerability scans must be performed at the following minimum frequencies:
  - Internal network infrastructure — weekly
  - Internet-facing (external) systems — weekly
  - Web applications — monthly (DAST) and upon each major release (SAST)
  - Cloud environments — continuous posture monitoring plus weekly authenticated scan

- **REQ-VM-03:** Vulnerability scanners must be kept up to date with current vulnerability definitions within forty-eight (48) hours of availability.
- **REQ-VM-04:** Scan results must be reviewed by the IT Security team within five (5) business days of scan completion. All Critical and High vulnerabilities must be reviewed within forty-eight (48) hours.

### 3.3 Vulnerability Prioritisation

- **REQ-VM-05:** Vulnerabilities must be prioritised using: CVSS v3.1 base score; CISA Known Exploited Vulnerabilities (KEV) Catalogue status; exploitability in the wild; asset criticality; and compensating controls already in place.

### 3.4 Remediation Timeframes

| Severity | CVSS Score | Standard SLA | CISA KEV SLA |
|----------|-----------|-------------|-------------|
| Critical | 9.0–10.0 | 15 days | 72 hours |
| High | 7.0–8.9 | 30 days | — |
| Medium | 4.0–6.9 | 90 days | — |
| Low | 0.1–3.9 | 180 days | — |

- **REQ-VM-06:** Where patching within the defined SLA is not technically feasible, a documented risk exception with compensating controls must be approved by the CISO and recorded in the risk register.

### 3.5 Penetration Testing

- **REQ-VM-07:** External penetration testing by a qualified, independent third party must be conducted at least annually. Internal network penetration testing must also be conducted at least annually.
- **REQ-VM-08:** Penetration test reports must be reviewed by the CISO. All Critical and High findings must be remediated and verified within sixty (60) days of report receipt.

### 3.6 Patch Management

- **REQ-VM-09:** Patches must be deployed through a managed patching process aligned to the Change Management Policy (ISP-08). Critical security patches may be deployed as Emergency Changes.

### 3.7 Reporting and Metrics

- **REQ-VM-10:** Monthly vulnerability management dashboard reporting to the CISO must include: open vulnerabilities by severity; mean time to remediate vs. SLA; percentage of assets scanned; overdue remediations; and top vulnerability categories.

## 4. Compliance Framework Mapping

- **NIST SP 800-53 Rev 5:** RA-5, SI-2, SI-3, CA-7
- **SOC 2 TSC:** CC7.1
- **ISO/IEC 27001:2022:** A.8.8

## 5. Enforcement

System owners are responsible for ensuring patches are applied within defined SLAs. Chronic non-compliance may result in system isolation from the production network.

## 6. Exceptions

SLA exceptions require written CISO approval with documented compensating controls, defined review date, and risk register entry.

## 7. Review & Revision

This policy shall be reviewed annually, and following any significant vulnerability exploitation affecting the organisation's environment.`
  },

  Physical_Security: {
    title: "Physical Security Policy",
    category: "Physical & Environmental",
    frameworks: ["NIST_CSF", "ISO_27001", "SOC2", "NIST_800_53"],
    priority: "high",
    content: (companyName) => `# Physical Security Policy

**Organisation:** ${companyName}
**Policy ID:** ISP-10 | **Version:** 1.0 | **Effective Date:** ${today()} | **Next Review:** ${nextYear()}
**Owner:** Chief Information Security Officer (CISO) | **Classification:** Internal

---

## 1. Purpose

This policy establishes requirements to protect organisation personnel, information systems, data, and physical assets from unauthorised physical access, damage, interference, and environmental threats.

## 2. Scope

This policy applies to all organisation-owned or leased facilities, including offices, data centres, server rooms, wiring closets, and storage areas. It applies to all employees, contractors, visitors, and any other individuals accessing organisation premises.

## 3. Policy Requirements

### 3.1 Facility Access Controls

- **REQ-PS-01:** All organisation facilities must have physical access controls proportionate to the sensitivity of information within, including at minimum: electronic access cards or equivalent for main entry points; visitor management procedures; and CCTV surveillance of entry/exit points and sensitive areas.
- **REQ-PS-02:** Sensitive areas (data centres, server rooms) must implement additional layered access controls including multi-factor physical authentication, access restricted to individuals with documented business need, and access logs retained for a minimum of twelve (12) months.
- **REQ-PS-03:** Physical access rights must be reviewed at least every six (6) months and adjusted promptly upon personnel changes.

### 3.2 Visitor Management

- **REQ-PS-04:** All visitors must be registered at reception, issued visitor credentials, and escorted at all times within secure areas. Visitor logs must be retained for a minimum of twelve (12) months. Unescorted visitors in secure areas must be challenged and reported to security immediately.

### 3.3 Data Centre and Server Room Physical Security

- **REQ-PS-05:** Data centres and server rooms must be located in areas not identifiable from outside the building.
- **REQ-PS-06:** Equipment racks must be locked. Cabling must be protected from interference or damage.
- **REQ-PS-07:** Equipment must be physically secured to prevent theft.

### 3.4 Environmental Controls

- **REQ-PS-08:** Critical IT infrastructure areas must be equipped with: fire detection and suppression systems; UPS and backup power generation; temperature and humidity monitoring with automated alerts; water/flood detection sensors; and redundant cooling systems.
- **REQ-PS-09:** Environmental monitoring logs must be retained for a minimum of twelve (12) months and reviewed at least monthly for anomalies.

### 3.5 Clean Desk and Physical Media

- **REQ-PS-10:** Personnel must follow a clean desk policy. Sensitive documents must be locked in cabinets when not in use.
- **REQ-PS-11:** Removable media must be encrypted and stored securely. Lost or stolen removable media must be reported to IT Security immediately.
- **REQ-PS-12:** Physical media containing sensitive information must be disposed of in accordance with the Data Retention & Disposal Policy (ISP-04).

### 3.6 Physical Security Incidents

- **REQ-PS-13:** Physical security incidents must be reported to Facilities and IT Security immediately and handled per the Incident Response Policy (ISP-02).

## 4. Compliance Framework Mapping

- **NIST SP 800-53 Rev 5:** PE-1 through PE-20
- **SOC 2 TSC:** CC6.4
- **ISO/IEC 27001:2022:** A.7.1 through A.7.14

## 5. Enforcement

Tailgating, propping open secure doors, failing to challenge unescorted visitors, or removing sensitive physical media without authorisation are disciplinary violations.

## 6. Exceptions

Exceptions to standard physical security controls must be approved by the CISO and Head of Facilities, with documented compensating controls.

## 7. Review & Revision

This policy shall be reviewed annually and following any physical security incident or significant change to premises or facility layout.`
  },

  Business_Continuity: {
    title: "Business Continuity Policy",
    category: "Resilience",
    frameworks: ["NIST_CSF", "ISO_27001", "SOC2", "NIST_800_53"],
    priority: "critical",
    content: (companyName) => `# Business Continuity Policy

**Organisation:** ${companyName}
**Policy ID:** ISP-11 | **Version:** 1.0 | **Effective Date:** ${today()} | **Next Review:** ${nextYear()}
**Owner:** Chief Information Security Officer (CISO) | **Classification:** Internal

---

## 1. Purpose

This policy establishes the framework for the organisation's Business Continuity Management (BCM) programme. Its purpose is to ensure that critical business functions and IT services can be maintained or rapidly restored following a disruptive event — including natural disasters, infrastructure failure, cyber incidents, pandemic events, or supply chain disruptions.

## 2. Scope

This policy applies to all business functions, IT systems, and third-party services that support the organisation's critical operations.

## 3. Definitions

- **Business Impact Analysis (BIA):** A systematic process to determine the potential effects of disruption to business functions and identify critical dependencies.
- **Business Continuity Plan (BCP):** A documented set of procedures and resources to enable key business functions to continue during and after a disruption.
- **IT Disaster Recovery Plan (ITDRP):** Technical procedures to recover IT systems and data after a disruption.
- **Maximum Tolerable Downtime (MTD):** The maximum time a business function can be unavailable before the disruption causes unacceptable harm.
- **Recovery Time Objective (RTO):** Target time within which a system or service must be restored.
- **Recovery Point Objective (RPO):** Maximum acceptable data loss measured in time.

## 4. Policy Requirements

### 4.1 Business Impact Analysis

- **REQ-BC-01:** A Business Impact Analysis (BIA) must be conducted at least every two (2) years, and following any material change to the organisation's operations, technology environment, or regulatory obligations.

### 4.2 Business Continuity Plan

- **REQ-BC-02:** A Business Continuity Plan (BCP) must be documented and maintained for all critical business functions, including: activation criteria; alternative operating procedures; communication plans; key contact lists; roles and responsibilities; and resource requirements.
- **REQ-BC-03:** An IT Disaster Recovery Plan (ITDRP) must document procedures for recovering all Tier 1 and Tier 2 IT systems.

### 4.3 RTO and RPO Targets

- **REQ-BC-04:** RTO and RPO targets must be defined for all critical systems and approved by the relevant Business Owners and the CISO.

### 4.4 Testing and Exercises

- **REQ-BC-05:** The BCP and ITDRP must be tested at the following minimum frequency:
  - Tabletop exercise: Annually (all critical function teams)
  - Partial failover / component recovery test: Semi-annually (IT systems)
  - Full failover / recovery test: Every two (2) years

- **REQ-BC-06:** Exercise results must be formally documented including objectives, scenario, participants, findings, and remediation actions. Results must be presented to executive leadership.

### 4.5 Plan Maintenance

- **REQ-BC-07:** The BCP and ITDRP must be reviewed at least annually and updated following significant infrastructure or business changes, exercise findings, or real-world activations.
- **REQ-BC-08:** All personnel with BCM roles must receive awareness training at least annually. BCP documents must have offline access copies available during an IT outage scenario.

### 4.6 Crisis Communication

- **REQ-BC-09:** A crisis communication plan must document internal notification chains, external stakeholder communication, and spokesperson designations. Communication templates must be maintained for common disruption scenarios.

## 5. Compliance Framework Mapping

- **NIST SP 800-53 Rev 5:** CP-1 through CP-13
- **SOC 2 TSC:** A1.3
- **ISO/IEC 27001:2022:** A.5.29, A.5.30

## 6. Enforcement

Failure to participate in scheduled exercises, or to maintain up-to-date contact information in the BCP, is a policy violation.

## 7. Exceptions

Modifications to RTO/RPO targets must be approved by the COO and CISO, with documented business justification and risk acceptance.

## 8. Review & Revision

This policy shall be reviewed annually, and within thirty (30) days following any activation of the BCP or ITDRP.`
  },

  BYOD: {
    title: "Bring Your Own Device (BYOD) Policy",
    category: "Endpoint Security",
    frameworks: ["NIST_CSF", "ISO_27001", "SOC2", "NIST_800_53"],
    priority: "high",
    content: (companyName) => `# Bring Your Own Device (BYOD) Policy

**Organisation:** ${companyName}
**Policy ID:** ISP-12 | **Version:** 1.0 | **Effective Date:** ${today()} | **Next Review:** ${nextYear()}
**Owner:** Chief Information Security Officer (CISO) | **Classification:** Internal

---

## 1. Purpose

This policy governs the use of personally owned devices — including smartphones, tablets, laptops, and wearables — to access organisation systems, data, or networks. It establishes minimum security requirements that personal devices must meet, and defines the organisation's rights to manage security on enrolled devices while protecting employee privacy.

## 2. Scope

This policy applies to all employees, contractors, and other individuals who access organisational systems, email, applications, or data using a personally owned device.

## 3. Definitions

- **BYOD:** Bring Your Own Device — use of personally owned devices to access organisation resources.
- **MDM/EMM:** Mobile Device Management / Enterprise Mobility Management — software used to manage, monitor, and secure mobile devices.
- **Corporate Container:** An isolated, encrypted partition on a personal device that segregates corporate data and applications from personal content.
- **Remote Wipe:** The ability to remotely delete data from a lost or compromised device.

## 4. Policy Requirements

### 4.1 Eligibility and Enrolment

- **REQ-BD-01:** Access to organisational systems from personal devices requires prior approval from the individual's line manager and IT Security. Approved devices must be enrolled in the organisation's approved MDM/MAM solution before accessing any organisation data.
- **REQ-BD-02:** Only devices running currently supported operating system versions are eligible for BYOD enrolment. Devices running end-of-life or unsupported operating systems are prohibited.

### 4.2 Minimum Security Requirements

- **REQ-BD-03:** All enrolled personal devices must meet the following minimum security requirements:
  - Full-disk encryption enabled
  - Screen lock enabled with a minimum 6-digit PIN, biometric, or equivalent; auto-lock within five (5) minutes
  - Operating system and applications kept up to date; critical security patches applied within thirty (30) days
  - Anti-malware protection enabled where applicable
  - Device must not be jailbroken or rooted
  - Remote wipe capability must be enabled and accepted by the device owner

### 4.3 Data Management and Corporate Container

- **REQ-BD-04:** Corporate data must be confined to the approved corporate container or MAM-managed applications. Transfer of corporate data to personal applications is prohibited.
- **REQ-BD-05:** Organisation data must not be stored in the device's local non-containerised storage.
- **REQ-BD-06:** Users must not print, screenshot, or screen-record organisational confidential or restricted data from their personal devices unless explicitly authorised.

### 4.4 Network Access

- **REQ-BD-07:** Personal devices accessing organisation systems must connect via the organisation's approved VPN or ZTNA solution. Access via untrusted or public Wi-Fi networks without VPN is prohibited.

### 4.5 Lost, Stolen, or Compromised Devices

- **REQ-BD-08:** Users must report a lost, stolen, or compromised enrolled device to IT Security within four (4) hours of discovery. IT Security will initiate remote wipe of the corporate container immediately upon notification.

### 4.6 Privacy and Monitoring

- **REQ-BD-09:** The organisation will manage only the corporate container on enrolled devices. The organisation will not access personal data, personal applications, call logs, SMS/personal messages, or location data outside the scope of the enrolled corporate profile.

### 4.7 Programme Exit and Offboarding

- **REQ-BD-10:** Upon termination of employment or revocation of BYOD access, the corporate container will be remotely wiped. Personal data on the device will not be affected by this wipe.

## 5. Compliance Framework Mapping

- **NIST SP 800-53 Rev 5:** AC-19, SC-43, MP-7
- **SOC 2 TSC:** CC6.1, CC6.7
- **ISO/IEC 27001:2022:** A.6.7

## 6. Enforcement

Attempting to access organisation data on a non-enrolled personal device, removing corporate containers without authorisation, or using personal devices to exfiltrate corporate data are disciplinary violations.

## 7. Exceptions

Exceptions to device eligibility or security requirements must be approved by the CISO with documented compensating controls.

## 8. Review & Revision

This policy shall be reviewed annually and updated to reflect changes in mobile platform capabilities, MDM technology, and emerging mobile threats.`
  },

  Third_Party_Risk_Management: {
    title: "Third-Party Risk Management Policy",
    category: "Third-Party Risk",
    frameworks: ["NIST_CSF", "ISO_27001", "SOC2", "NIST_800_53"],
    priority: "high",
    content: (companyName) => `# Third-Party Risk Management Policy

**Organisation:** ${companyName}
**Policy ID:** ISP-13 | **Version:** 1.0 | **Effective Date:** ${today()} | **Next Review:** ${nextYear()}
**Owner:** Chief Information Security Officer (CISO) | **Classification:** Internal

---

## 1. Purpose

This policy establishes a comprehensive framework for identifying, assessing, monitoring, and managing risks introduced by third-party relationships throughout the engagement lifecycle. It acknowledges that third-party security failures can result in data breaches, regulatory penalties, operational disruption, and reputational harm.

This policy complements the Vendor Security Policy (ISP-05). ISP-05 addresses technical security requirements for vendors accessing organisational systems. This policy addresses the broader third-party risk management (TPRM) programme and risk governance.

## 2. Scope

This policy applies to all third-party relationships including suppliers, subcontractors, technology partners, outsourced service providers, professional service firms, cloud providers, data processors, joint venture partners, and any other external entity with which the organisation shares data, systems, or operational processes.

## 3. Definitions

- **Third Party:** Any external organisation or individual engaged to provide goods, services, or data to the organisation.
- **Inherent Risk:** The level of risk present in a third-party relationship before any controls are applied.
- **Residual Risk:** The remaining risk after controls and mitigations are applied.
- **Fourth Party:** Subcontractors or sub-processors engaged by a third party that also process the organisation's data.
- **Critical Third Party:** A third party whose failure or security compromise would have a material impact on the organisation's operations.

## 4. Policy Requirements

### 4.1 Third-Party Inventory and Classification

- **REQ-TP-01:** A comprehensive, current inventory of all active third-party relationships must be maintained recording: third-party name; nature of service; data types accessed; systems accessible; contract dates; business owner; inherent risk rating; and last assessment date.
- **REQ-TP-02:** Third parties must be classified by inherent risk tier:
  - **Tier 1 (Critical):** Access to highly sensitive data (PII, financial, health, IP) or provision of critical operational services
  - **Tier 2 (High):** Access to internal systems or data with material sensitivity
  - **Tier 3 (Moderate):** Limited data access; operationally non-critical services
  - **Tier 4 (Low):** No data access; commodity services with minimal integration

### 4.2 Pre-Engagement Due Diligence

- **REQ-TP-03:** Risk-tiered due diligence must be conducted before entering any material third-party relationship:
  - Tier 1: Full security assessment including SOC 2 / ISO 27001 review, financial viability check, legal and regulatory screening, and reference checks
  - Tier 2: Security questionnaire, review of available audit reports/certifications, financial screening
  - Tier 3: Abbreviated security questionnaire, regulatory screening
  - Tier 4: Registration in inventory; standard contractual terms

### 4.3 Contractual Protections

- **REQ-TP-04:** All Tier 1 and Tier 2 contracts must include: security requirements clause; data protection obligations; right-to-audit clause; security incident notification requirements (maximum 24 hours); sub-processor/fourth-party notification; and data return/deletion upon termination clause.
- **REQ-TP-05:** Tier 1 providers must provide evidence of their BCP and participate in joint continuity exercises at least every two (2) years.

### 4.4 Ongoing Monitoring

- **REQ-TP-06:** Ongoing monitoring frequency by risk tier:
  - Tier 1: Annual full reassessment; continuous threat intelligence monitoring; quarterly business review
  - Tier 2: Annual security questionnaire refresh and review of updated certifications
  - Tier 3: Biennial review
  - Tier 4: Inventory update upon contract renewal

- **REQ-TP-07:** External threat intelligence and public breach disclosure monitoring must be implemented for Tier 1 providers.

### 4.5 Fourth-Party Risk

- **REQ-TP-08:** Tier 1 and Tier 2 third parties must disclose all sub-processors and material subcontractors. Changes to sub-processors must require advance notice and organisation approval.
- **REQ-TP-09:** The organisation must assess concentration risk where multiple critical processes rely on a single third party.

### 4.6 Third-Party Offboarding

- **REQ-TP-10:** Upon relationship termination, all organisation data must be returned or securely deleted. Written confirmation of deletion must be obtained. All system and physical access must be revoked.

### 4.7 Governance and Reporting

- **REQ-TP-11:** Third-party risk management must be reviewed at board or senior leadership level at least annually, covering: number of active third parties by tier; critical third parties with outstanding findings; incidents involving third parties; overdue reassessments; and fourth-party concentration risks.

## 5. Compliance Framework Mapping

- **NIST SP 800-53 Rev 5:** SR-1 through SR-12, SA-9, CA-3
- **SOC 2 TSC:** CC9.2
- **ISO/IEC 27001:2022:** A.5.19, A.5.20, A.5.21, A.5.22

## 6. Enforcement

Engaging a Tier 1 or Tier 2 third party without completing required due diligence, or failing to include mandatory contract terms, is a disciplinary violation and may expose the organisation to regulatory liability.

## 7. Exceptions

Emergency engagements may proceed with documented risk acceptance. A full assessment must be completed within sixty (60) days of engagement commencement and is not waivable.

## 8. Review & Revision

This policy shall be reviewed annually, and following any significant third-party security incident, regulatory development affecting supply chain risk management, or material change to the organisation's third-party portfolio.`
  },
};

// Helper exports
export const getAvailablePolicyTemplates = () => Object.keys(POLICY_TEMPLATES);
export const hasTemplate = (policyType) => Object.prototype.hasOwnProperty.call(POLICY_TEMPLATES, policyType);
export const getTemplateInfo = (policyType) => POLICY_TEMPLATES[policyType] || null;