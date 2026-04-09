/**
 * generateRegulatoryReport — generates an EU/UK regulatory readiness PDF
 * covering NIS2, DORA, UK Cyber Essentials, and GDPR.
 *
 * @param {object} params
 * @param {string} [params.assessmentId]  Optional Firestore assessment ID for context
 * @param {string} [params.company_name]  Company name override
 * @returns {{ data: ArrayBuffer }}   PDF as ArrayBuffer for Blob creation
 */
import { jsPDF } from 'jspdf';
import { Assessment } from '@/entities/Assessment';

const C = {
  bg:      [15,  23,  42],
  bg2:     [30,  41,  59],
  blue:    [59,  130, 246],
  purple:  [139, 92,  246],
  cyan:    [6,   182, 212],
  green:   [34,  197, 94],
  yellow:  [234, 179, 8],
  white:   [255, 255, 255],
  gray400: [148, 163, 184],
  gray300: [203, 213, 225],
};

function rgb(doc, c)  { doc.setTextColor(c[0], c[1], c[2]); }
function fill(doc, c) { doc.setFillColor(c[0], c[1], c[2]); }
function addBg(doc, w, h) { fill(doc, C.bg); doc.rect(0, 0, w, h, 'F'); }

function addHeader(doc, w) {
  fill(doc, C.bg2);
  doc.rect(0, 0, w, 20, 'F');
  fill(doc, C.blue);
  doc.rect(0, 0, w, 2, 'F');
  rgb(doc, C.blue);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('EU/UK REGULATORY READINESS REPORT — Hubcys', 14, 8);
  rgb(doc, C.gray400);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('NIS2 • DORA • GDPR • Cyber Essentials — Not Legal Advice', 14, 15);
}

function addFooter(doc, w, h) {
  const d = new Date().toLocaleString('en-GB');
  rgb(doc, C.gray400);
  doc.setFontSize(7);
  doc.text(`Generated ${d} — Hubcys — Confidential`, w / 2, h - 6, { align: 'center' });
}

function newPage(doc, w, h) {
  doc.addPage();
  addBg(doc, w, h);
  addHeader(doc, w);
  addFooter(doc, w, h);
  return 28;
}

function checkPage(doc, y, h, w) {
  if (y > h - 25) return newPage(doc, w, h);
  return y;
}

function section(doc, title, color, y, margin, w) {
  fill(doc, C.bg2);
  doc.rect(margin, y - 4, w - margin * 2, 9, 'F');
  fill(doc, color);
  doc.rect(margin, y - 4, 3, 9, 'F');
  rgb(doc, color);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin + 6, y + 2);
  return y + 13;
}

function bullet(doc, text, y, margin, maxW, w, h) {
  const lines = doc.splitTextToSize('• ' + text, maxW - 4);
  rgb(doc, C.gray300);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  for (const line of lines) {
    y = checkPage(doc, y, h, w);
    doc.text(line, margin + 3, y);
    y += 5.5;
  }
  return y;
}

function statusRow(doc, label, status, y, margin, w) {
  rgb(doc, C.gray400);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(label, margin, y);
  const statusColor = status === 'Compliant' ? C.green : status === 'Partial' ? C.yellow : C.gray400;
  rgb(doc, statusColor);
  doc.setFont('helvetica', 'bold');
  doc.text(status, w - margin - 30, y);
  return y + 8;
}

export const generateRegulatoryReport = async ({ assessmentId, company_name: nameOverride } = {}) => {
  let assessment = null;
  if (assessmentId) {
    try { assessment = await Assessment.get(assessmentId); } catch (_) { /* proceed without */ }
  }

  const companyName = nameOverride || assessment?.company_name || 'Your Organisation';
  const score       = assessment?.overall_score ?? null;
  const maturity    = assessment?.maturity_level ?? null;
  const industry    = assessment?.industry_sector ?? null;

  const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW  = doc.internal.pageSize.getWidth();
  const pageH  = doc.internal.pageSize.getHeight();
  const margin = 14;
  const maxW   = pageW - margin * 2;

  // ── Cover ──────────────────────────────────────────────────────────────────
  addBg(doc, pageW, pageH);
  fill(doc, C.blue);
  doc.rect(0, 0, pageW, 4, 'F');

  rgb(doc, C.blue);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('EU/UK REGULATORY READINESS', margin, 30);

  rgb(doc, C.white);
  doc.setFontSize(18);
  doc.text('Cyber Regulatory Compliance Summary', margin, 42);

  rgb(doc, C.gray400);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(companyName, margin, 52);
  doc.text(new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }), margin, 60);
  if (industry) doc.text(`Industry: ${industry}`, margin, 68);

  if (score !== null) {
    fill(doc, C.bg2);
    doc.circle(pageW - 35, 52, 20, 'F');
    const scoreColor = score >= 70 ? C.green : score >= 40 ? C.yellow : C.gray400;
    rgb(doc, scoreColor);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`${Math.round(score)}%`, pageW - 35, 49, { align: 'center' });
    rgb(doc, C.gray400);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Security Score', pageW - 35, 57, { align: 'center' });
    if (maturity) doc.text(maturity, pageW - 35, 63, { align: 'center' });
  }

  addFooter(doc, pageW, pageH);

  // ── Page 2: Regulatory Status ─────────────────────────────────────────────
  let y = newPage(doc, pageW, pageH);

  y = section(doc, 'Regulatory Framework Status Summary', C.blue, y, margin, pageW);

  const frameworks = [
    { name: 'NIS2 Directive (EU 2022/2555)',    status: score !== null ? (score >= 65 ? 'Partial' : 'Assessment Required') : 'Not Assessed' },
    { name: 'DORA (EU 2022/2554)',               status: score !== null ? (score >= 70 ? 'Partial' : 'Assessment Required') : 'Not Assessed' },
    { name: 'GDPR / UK GDPR',                   status: 'Partial' },
    { name: 'UK Cyber Essentials',               status: score !== null ? (score >= 60 ? 'Partial' : 'Assessment Required') : 'Not Assessed' },
    { name: 'ISO/IEC 27001:2022',                status: score !== null ? (score >= 75 ? 'Partial' : 'Assessment Required') : 'Not Assessed' },
  ];

  for (const fw of frameworks) {
    y = checkPage(doc, y, pageH, pageW);
    y = statusRow(doc, fw.name, fw.status, y, margin, pageW);
  }

  y += 6;

  // ── NIS2 ──────────────────────────────────────────────────────────────────
  y = checkPage(doc, y + 10, pageH, pageW);
  y = section(doc, 'NIS2 — Key Requirements (EU 2022/2555)', C.blue, y, margin, pageW);

  const nis2Items = [
    'Risk analysis and information system security policies (Art. 21)',
    'Incident handling: Early warning 24h, notification 72h, final report 1 month (Art. 23)',
    'Business continuity and crisis management',
    'Supply chain security and third-party risk management',
    'Multi-factor authentication for all critical systems',
    'Cybersecurity training for management and staff',
    'Registration with national competent authority (due Oct 2024)',
  ];
  for (const item of nis2Items) y = bullet(doc, item, y, margin, maxW, pageW, pageH);

  // ── DORA ──────────────────────────────────────────────────────────────────
  y = checkPage(doc, y + 10, pageH, pageW);
  y = section(doc, 'DORA — Digital Operational Resilience (EU 2022/2554)', C.purple, y, margin, pageW);

  const doraItems = [
    'Applies to: Financial institutions including banks, insurers, investment firms, crypto-asset service providers',
    'ICT Risk Management Framework (Art. 5–16): Governance, identification, protection, detection, response',
    'Major ICT-related incident reporting to competent authorities within 4 hours (initial), 72 hours, and 1 month',
    'Digital operational resilience testing: TLPT (Threat-Led Penetration Testing) for significant entities',
    'ICT third-party risk management: comprehensive contract requirements, exit strategies, concentration risk',
    'Information sharing arrangements encouraged for cyber threat intelligence',
    'Applies from 17 January 2025',
  ];
  for (const item of doraItems) y = bullet(doc, item, y, margin, maxW, pageW, pageH);

  // ── GDPR ──────────────────────────────────────────────────────────────────
  y = checkPage(doc, y + 10, pageH, pageW);
  y = section(doc, 'GDPR / UK GDPR — Cybersecurity Obligations', C.cyan, y, margin, pageW);

  const gdprItems = [
    'Art. 32: Implement appropriate technical and organisational security measures',
    'Personal data breach notification to supervisory authority within 72 hours (Art. 33)',
    'Notification to affected individuals "without undue delay" when high risk (Art. 34)',
    'Data Protection Impact Assessment (DPIA) required for high-risk processing (Art. 35)',
    'Principle of data minimisation and purpose limitation applies to security logging',
    'UK GDPR: Identical requirements post-Brexit, enforced by ICO',
  ];
  for (const item of gdprItems) y = bullet(doc, item, y, margin, maxW, pageW, pageH);

  // ── UK Cyber Essentials ───────────────────────────────────────────────────
  y = checkPage(doc, y + 10, pageH, pageW);
  y = section(doc, 'UK Cyber Essentials — 5 Technical Controls', C.green, y, margin, pageW);

  const ceItems = [
    'Firewalls: Secure network boundary with firewall protection on all internet-facing services',
    'Secure Configuration: Remove unnecessary software, disable unused ports, use secure settings',
    'User Access Control: Principle of least privilege, MFA for all cloud/remote access',
    'Malware Protection: Up-to-date anti-malware on all devices',
    'Patch Management: Apply security updates within 14 days of release for high/critical vulnerabilities',
    'CE Plus: Independent on-site assessment with penetration testing for higher assurance',
  ];
  for (const item of ceItems) y = bullet(doc, item, y, margin, maxW, pageW, pageH);

  // ── Recommended Actions ────────────────────────────────────────────────────
  y = checkPage(doc, y + 10, pageH, pageW);
  y = section(doc, 'Priority Actions for Regulatory Readiness', C.blue, y, margin, pageW);

  const actions = [
    '1. Determine which regulations apply to your organisation based on sector and size',
    '2. Conduct a gap analysis against NIS2 Article 21 security measures',
    '3. Update your incident response plan to include 24h/72h reporting timelines',
    '4. Implement MFA across all cloud services, VPNs, and privileged accounts',
    '5. Review and update all ICT supplier contracts for DORA/NIS2 compliance',
    '6. Register with your national NIS2 competent authority (if applicable)',
    '7. Deliver management-level cybersecurity training as required by NIS2 Art. 20',
    '8. Run a tabletop exercise simulating a significant cyber incident with regulatory notification',
  ];

  rgb(doc, C.gray300);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  for (const action of actions) {
    y = checkPage(doc, y, pageH, pageW);
    const ls = doc.splitTextToSize(action, maxW);
    for (const l of ls) { doc.text(l, margin, y); y += 5.5; }
    y += 2;
  }

  // ── Disclaimer ────────────────────────────────────────────────────────────
  y = checkPage(doc, y + 10, pageH, pageW);
  fill(doc, C.bg2);
  doc.rect(margin, y, maxW, 22, 'F');
  rgb(doc, C.yellow);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DISCLAIMER', margin + 4, y + 8);
  rgb(doc, C.gray400);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const disc = 'This document is for informational purposes only and does not constitute legal advice. Regulatory obligations vary by entity type, size, and jurisdiction. Engage qualified legal and compliance professionals for your specific situation.';
  const dls = doc.splitTextToSize(disc, maxW - 8);
  let dy = y + 14;
  for (const l of dls) { doc.text(l, margin + 4, dy); dy += 5; }

  return { data: doc.output('arraybuffer') };
};
