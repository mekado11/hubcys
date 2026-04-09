/**
 * generateQuestionnaireMarkdown — generates the full Hubcys assessment
 * questionnaire as a Markdown document, ready for download or preview.
 * Pure client-side, no backend required.
 */
export const generateQuestionnaireMarkdown = async () => {
  const md = `# Hubcys Cybersecurity Assessment Questionnaire
*Use this form to gather inputs from your team before running the assessment in the platform.*

---

## Part 1 — Company Profile

| Field | Your Answer |
|---|---|
| Company Name | |
| Website | |
| Industry Sector | (e.g. Technology, Finance, Healthcare, Retail, Manufacturing, Other) |
| Company Size | (1-25 / 26-50 / 51-100 / 101-200 / 200+) |
| Compliance Framework | (NIST CSF / ISO 27001 / PCI DSS / SOC 2 / GDPR / NIS2 / Cyber Essentials) |
| Target Completion Date | |
| Security & Compliance Goals | |
| Previous Gap Analysis? | (Yes / No — if yes, describe key findings) |
| Current Biggest Risks | |
| Business-Critical Systems | |
| CISO / Security Lead Perspective | |
| Existing Compliance Tooling | |

---

## Part 2 — Operational Security Controls

Rate each control: **Yes / Partial / No / N/A**

### Endpoint & Access Controls

| Control | Answer | Notes |
|---|---|---|
| Local admin privileges restricted (users cannot install software freely) | | |
| Software installation requires IT/security approval | | |
| BYOD devices have security controls (MDM, certificate, compliance check) | | |
| Remote access via VPN or Zero Trust (not open RDP/SSH) | | |
| Shadow IT / unsanctioned cloud apps discovered and managed | | |
| Personal cloud storage (Dropbox, personal Google Drive) restricted on corp devices | | |
| Patch management cadence defined and enforced (≤30 days for critical) | | |
| Mobile devices enrolled in MDM | | |

### Data & Monitoring

| Control | Answer | Notes |
|---|---|---|
| Data classification system in place (Public / Internal / Confidential / Regulated) | | |
| Network access control (NAC) — devices checked before joining corp network | | |
| Employee offboarding process revokes all access within 24 hours | | |
| EDR/AV deployed on ≥90% of endpoints | | |
| Centralised logging / SIEM in place | | |
| Vulnerability scanning runs at least quarterly | | |
| Data Loss Prevention (DLP) controls active | | |
| Security baseline enforcement (e.g. CIS Benchmarks, GPO, configuration management) | | |

---

## Part 3 — Security Maturity Domains

Rate each domain 0–5 using the scale below, or mark N/A if not applicable.

**Scale:**
- **0** — Not implemented / chaotic
- **1** — Aware but ad-hoc
- **2** — Defined process, inconsistently applied
- **3** — Managed and consistently applied
- **4** — Measured and monitored with metrics
- **5** — Optimised / continuously improving

| Domain | Score (0–5) | N/A? | Notes |
|---|---|---|---|
| Identity & Access Management (MFA, RBAC, PAM, SSO) | | | |
| Asset Management (hardware/software inventory, lifecycle) | | | |
| Infrastructure Security (firewalls, network segmentation, hardening) | | | |
| Application Security (SDLC, code review, SAST/DAST, secrets management) | | | |
| Third-Party / Supply Chain Risk (vendor assessments, contracts, monitoring) | | | |
| Incident Response (plan, playbooks, tested, retainer) | | | |
| Governance, Risk & Compliance (risk register, policies, board reporting) | | | |
| Data Protection (encryption at rest/transit, DLP, retention, DSAR process) | | | |
| Security Awareness Training (phishing simulation, annual training, role-based) | | | |
| Cloud Security (CSPM, IAM, logging, cloud config baseline) | | | |
| Business Continuity / Disaster Recovery (BCP, RPO/RTO defined, tested) | | | |

---

## Part 4 — External Attack Surface (Optional but recommended)

| Question | Answer |
|---|---|
| Public-facing domains / subdomains | |
| Internet-exposed services (web apps, APIs, RDP, SSH, admin portals) | |
| Known CVEs or unpatched externally-facing systems | |
| Web Application Firewall (WAF) in use? | (Yes / No / Partial) |
| External penetration test — when was the last one? | |
| Bug bounty or responsible disclosure programme? | (Yes / No) |

---

## Part 5 — Compliance & Regulatory Context

| Regulation / Framework | Applicable? | Current Status |
|---|---|---|
| GDPR (EU personal data) | | |
| NIS2 (EU essential/important entities) | | |
| DORA (EU financial sector) | | |
| UK GDPR / DPA 2018 | | |
| Cyber Essentials / Cyber Essentials Plus (UK) | | |
| PCI DSS (payment card data) | | |
| HIPAA (US health data) | | |
| SOC 2 Type I / II | | |
| ISO 27001 | | |
| NIST CSF | | |
| CCPA / CPRA (California) | | |
| SOX (US public companies) | | |

---

*Return completed form to your Hubcys administrator to pre-populate your assessment.*
*Questions? Contact support@hubcys.com*
`;

  return { data: md };
};
