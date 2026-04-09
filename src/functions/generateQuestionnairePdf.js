/**
 * generateQuestionnairePdf — generates the Hubcys assessment questionnaire
 * as a downloadable PDF using jsPDF (already installed, no extra deps needed).
 */
import { jsPDF } from 'jspdf';

// ── Helpers ────────────────────────────────────────────────────────────────────
function addHeader(doc, pageW) {
  doc.setFillColor(15, 23, 42);          // slate-900
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(6, 182, 212);          // cyan-500
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Hubcys Cybersecurity Assessment Questionnaire', 14, 14);
  doc.setTextColor(148, 163, 184);        // slate-400
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Complete offline and return to your Hubcys administrator', 14, 19);
}

function addSection(doc, title, y, pageW, pageH, margin) {
  if (y > pageH - 30) { doc.addPage(); addHeader(doc, pageW); y = 30; }
  doc.setFillColor(30, 41, 59);           // slate-800
  doc.rect(margin - 2, y - 5, pageW - margin * 2 + 4, 9, 'F');
  doc.setTextColor(139, 92, 246);         // purple-500
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, y);
  return y + 10;
}

function addTableRow(doc, cols, y, pageW, pageH, margin, header = false) {
  if (y > pageH - 20) { doc.addPage(); addHeader(doc, pageW); y = 30; }
  const usable = pageW - margin * 2;
  const colWidths = cols.map((_, i) =>
    i === 0 ? usable * 0.55 : usable * (0.45 / (cols.length - 1))
  );

  if (header) {
    doc.setFillColor(51, 65, 85);
    doc.rect(margin - 2, y - 4, usable + 4, 7, 'F');
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', header ? 'bold' : 'normal');
  doc.setTextColor(header ? 255 : 203, header ? 255 : 213, header ? 255 : 225);

  let x = margin;
  cols.forEach((text, i) => {
    const lines = doc.splitTextToSize(text, colWidths[i] - 2);
    doc.text(lines, x, y);
    x += colWidths[i];
  });

  doc.setDrawColor(71, 85, 105);
  doc.line(margin - 2, y + 3, pageW - margin + 2, y + 3);

  const rowH = Math.max(7, doc.splitTextToSize(cols[0], colWidths[0] - 2).length * 4 + 2);
  return y + rowH;
}

// ── Main export ────────────────────────────────────────────────────────────────
export const generateQuestionnairePdf = async () => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 30;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, pageH, 'F');
  addHeader(doc, pageW);

  // ── Part 1: Company Profile ────────────────────────────────────────────────
  y = addSection(doc, 'Part 1 — Company Profile', y, pageW, pageH, margin);
  const profileRows = [
    ['Company Name', ''],
    ['Website', ''],
    ['Industry Sector', 'Technology / Finance / Healthcare / Retail / Manufacturing / Other'],
    ['Company Size', '1-25 / 26-50 / 51-100 / 101-200 / 200+'],
    ['Compliance Framework', 'NIST CSF / ISO 27001 / PCI DSS / SOC 2 / GDPR / NIS2 / Cyber Essentials'],
    ['Target Completion Date', ''],
    ['Security & Compliance Goals', ''],
    ['Previous Gap Analysis?', 'Yes / No — if yes, describe key findings'],
    ['Current Biggest Risks', ''],
    ['Business-Critical Systems', ''],
    ['Existing Compliance Tooling', ''],
  ];
  y = addTableRow(doc, ['Field', 'Your Answer'], y, pageW, pageH, margin, true);
  for (const row of profileRows) y = addTableRow(doc, row, y, pageW, pageH, margin);

  y += 6;

  // ── Part 2: Operational Security ──────────────────────────────────────────
  y = addSection(doc, 'Part 2 — Operational Security Controls  (Yes / Partial / No / N/A)', y, pageW, pageH, margin);
  const opsRows = [
    ['Local admin privileges restricted (users cannot install software freely)', ''],
    ['Software installation requires IT/security approval', ''],
    ['BYOD devices have security controls (MDM, compliance check)', ''],
    ['Remote access via VPN or Zero Trust (not open RDP/SSH)', ''],
    ['Shadow IT / unsanctioned cloud apps discovered & managed', ''],
    ['Personal cloud storage restricted on corporate devices', ''],
    ['Patch management cadence enforced (≤30 days for critical)', ''],
    ['Mobile devices enrolled in MDM', ''],
    ['Data classification system in place', ''],
    ['Network access control (NAC) — device posture checked before joining network', ''],
    ['Employee offboarding revokes all access within 24 hours', ''],
    ['EDR/AV deployed on ≥90% of endpoints', ''],
    ['Centralised logging / SIEM in place', ''],
    ['Vulnerability scanning runs at least quarterly', ''],
    ['Data Loss Prevention (DLP) controls active', ''],
    ['Security baseline enforcement (CIS Benchmarks, GPO, config management)', ''],
  ];
  y = addTableRow(doc, ['Control', 'Answer'], y, pageW, pageH, margin, true);
  for (const row of opsRows) y = addTableRow(doc, row, y, pageW, pageH, margin);

  y += 6;

  // ── Part 3: Maturity Domains ───────────────────────────────────────────────
  y = addSection(doc, 'Part 3 — Security Maturity Domains  (Score 0–5 or N/A)', y, pageW, pageH, margin);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('0=Not implemented  1=Ad-hoc  2=Defined  3=Managed  4=Measured  5=Optimised', margin, y);
  y += 5;

  const maturityRows = [
    ['Identity & Access Management (MFA, RBAC, PAM, SSO)', '', ''],
    ['Asset Management (hardware/software inventory, lifecycle)', '', ''],
    ['Infrastructure Security (firewalls, segmentation, hardening)', '', ''],
    ['Application Security (SDLC, code review, SAST/DAST, secrets mgmt)', '', ''],
    ['Third-Party / Supply Chain Risk (vendor assessments, contracts)', '', ''],
    ['Incident Response (plan, playbooks, tested, retainer)', '', ''],
    ['Governance, Risk & Compliance (risk register, policies, board reporting)', '', ''],
    ['Data Protection (encryption, DLP, retention, DSAR process)', '', ''],
    ['Security Awareness Training (phishing simulation, annual, role-based)', '', ''],
    ['Cloud Security (CSPM, IAM, logging, cloud config baseline)', '', ''],
    ['Business Continuity / DR (BCP, RPO/RTO defined and tested)', '', ''],
  ];
  y = addTableRow(doc, ['Domain', 'Score (0–5)', 'N/A?'], y, pageW, pageH, margin, true);
  for (const row of maturityRows) y = addTableRow(doc, row, y, pageW, pageH, margin);

  y += 6;

  // ── Part 4: External Attack Surface ───────────────────────────────────────
  y = addSection(doc, 'Part 4 — External Attack Surface (Optional)', y, pageW, pageH, margin);
  const surfaceRows = [
    ['Public-facing domains / subdomains', ''],
    ['Internet-exposed services (web apps, APIs, RDP, SSH, admin portals)', ''],
    ['Known CVEs or unpatched externally-facing systems', ''],
    ['Web Application Firewall (WAF) in use?', 'Yes / No / Partial'],
    ['Last external penetration test', ''],
    ['Bug bounty or responsible disclosure programme?', 'Yes / No'],
  ];
  y = addTableRow(doc, ['Question', 'Answer'], y, pageW, pageH, margin, true);
  for (const row of surfaceRows) y = addTableRow(doc, row, y, pageW, pageH, margin);

  // ── Footer on each page ────────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageH - 10, pageW, 10, 'F');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Hubcys Assessment Questionnaire  ·  Page ${i} of ${pageCount}  ·  hubcys.com`, margin, pageH - 4);
  }

  return doc;
};
