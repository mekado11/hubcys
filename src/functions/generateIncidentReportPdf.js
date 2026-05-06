/**
 * generateIncidentReportPdf — generates an incident report PDF.
 *
 * @param {object} params
 * @param {string} params.incidentId  Firestore document ID of the incident
 * @returns {{ data: ArrayBuffer }}   PDF as ArrayBuffer for Blob creation
 */
import { jsPDF } from 'jspdf';
import { Incident } from '@/entities/Incident';

const C = {
  bg:      [15,  23,  42],
  bg2:     [30,  41,  59],
  bg3:     [51,  65,  85],
  cyan:    [6,   182, 212],
  red:     [239, 68,  68],
  orange:  [249, 115, 22],
  yellow:  [234, 179, 8],
  green:   [34,  197, 94],
  purple:  [139, 92,  246],
  white:   [255, 255, 255],
  gray400: [148, 163, 184],
  gray300: [203, 213, 225],
};

function rgb(doc, arr) { doc.setTextColor(arr[0], arr[1], arr[2]); }
function fill(doc, arr) { doc.setFillColor(arr[0], arr[1], arr[2]); }

function addBg(doc, w, h) { fill(doc, C.bg); doc.rect(0, 0, w, h, 'F'); }

function addHeader(doc, w, incidentTitle) {
  fill(doc, C.bg2);
  doc.rect(0, 0, w, 20, 'F');
  fill(doc, C.red);
  doc.rect(0, 0, w, 2, 'F');
  rgb(doc, C.cyan);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('INCIDENT REPORT — Hubcys', 14, 8);
  rgb(doc, C.gray400);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(incidentTitle.slice(0, 80), 14, 15);
}

function addFooter(doc, w, h) {
  const d = new Date().toLocaleString('en-GB');
  rgb(doc, C.gray400);
  doc.setFontSize(7);
  doc.text(`Generated ${d} — Hubcys Incident Management — CONFIDENTIAL`, w / 2, h - 6, { align: 'center' });
}

function checkPage(doc, y, h, w, title) {
  if (y > h - 25) {
    doc.addPage();
    addBg(doc, w, h);
    addHeader(doc, w, title);
    addFooter(doc, w, h);
    return 28;
  }
  return y;
}

function section(doc, title, y, margin, w) {
  fill(doc, C.bg2);
  doc.rect(margin, y - 4, w - margin * 2, 9, 'F');
  fill(doc, C.red);
  doc.rect(margin, y - 4, 3, 9, 'F');
  rgb(doc, C.red);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin + 6, y + 2);
  return y + 13;
}

function row(doc, label, value, y, margin) {
  rgb(doc, C.gray400);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(label + ':', margin, y);
  rgb(doc, C.white);
  doc.setFont('helvetica', 'bold');
  doc.text(String(value ?? '—'), margin + 50, y);
  return y + 8;
}

function textBlock(doc, text, x, y, maxW, lineH, w, h, margin, incTitle) {
  const lines = doc.splitTextToSize(String(text || '—'), maxW);
  for (const line of lines) {
    y = checkPage(doc, y, h, w, incTitle);
    doc.text(line, x, y);
    y += lineH;
  }
  return y;
}

function priorityColor(p) {
  switch (p) {
    case 'Critical': return C.red;
    case 'High':     return C.orange;
    case 'Medium':   return C.yellow;
    default:         return C.green;
  }
}

export const generateIncidentReportPdf = async ({ incidentId }) => {
  if (!incidentId) throw new Error('generateIncidentReportPdf: incidentId is required');

  const incident = await Incident.get(incidentId);
  if (!incident) throw new Error('Incident not found');

  const doc     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW   = doc.internal.pageSize.getWidth();
  const pageH   = doc.internal.pageSize.getHeight();
  const margin  = 14;
  const title   = incident.title || 'Incident Report';

  // ── Cover ──────────────────────────────────────────────────────────────────
  addBg(doc, pageW, pageH);
  fill(doc, C.red);
  doc.rect(0, 0, pageW, 4, 'F');

  rgb(doc, C.red);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INCIDENT REPORT', margin, 30);

  rgb(doc, C.white);
  doc.setFontSize(18);
  doc.text(title, margin, 42);

  rgb(doc, C.gray400);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Report Date: ${dateStr}`, margin, 52);
  doc.text(`Incident ID: ${incident.incident_id || incidentId.slice(0, 8).toUpperCase()}`, margin, 60);

  // Priority badge
  const pColor = priorityColor(incident.priority);
  fill(doc, pColor);
  doc.roundedRect(pageW - 50, 25, 36, 12, 2, 2, 'F');
  rgb(doc, C.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(incident.priority || 'Medium', pageW - 32, 33, { align: 'center' });

  addFooter(doc, pageW, pageH);

  // ── Page 2: Incident Details ────────────────────────────────────────────────
  doc.addPage();
  addBg(doc, pageW, pageH);
  addHeader(doc, pageW, title);
  addFooter(doc, pageW, pageH);

  let y = 28;
  y = section(doc, 'Incident Details', y, margin, pageW);

  y = row(doc, 'Incident ID',       incident.incident_id || incidentId.slice(0, 8).toUpperCase(), y, margin);
  y = row(doc, 'Status',            incident.status || '—',       y, margin);
  y = row(doc, 'Priority',          incident.priority || '—',     y, margin);
  y = row(doc, 'Category',          incident.category || '—',     y, margin);
  y = row(doc, 'Detection Date',    incident.detection_timestamp ? new Date(incident.detection_timestamp).toLocaleDateString('en-GB') : '—', y, margin);
  y = row(doc, 'Detection Source',  incident.detection_source || '—', y, margin);
  y = row(doc, 'Affected Systems',  incident.affected_systems || '—', y, margin);
  y = row(doc, 'Affected Users',    incident.affected_users || '—',   y, margin);
  y += 4;

  y = checkPage(doc, y + 15, pageH, pageW, title);
  y = section(doc, 'Description', y, margin, pageW);
  rgb(doc, C.gray300);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  y = textBlock(doc, incident.description, margin, y, pageW - margin * 2, 5.5, pageW, pageH, margin, title);
  y += 6;

  y = checkPage(doc, y + 15, pageH, pageW, title);
  y = section(doc, 'Business Impact', y, margin, pageW);
  rgb(doc, C.gray300);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  y = textBlock(doc, incident.business_impact || 'Not yet assessed.', margin, y, pageW - margin * 2, 5.5, pageW, pageH, margin, title);
  y += 6;

  // ── Response Actions ────────────────────────────────────────────────────────
  if (incident.containment_actions) {
    y = checkPage(doc, y + 15, pageH, pageW, title);
    y = section(doc, 'Containment Actions', y, margin, pageW);
    rgb(doc, C.gray300);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    y = textBlock(doc, incident.containment_actions, margin, y, pageW - margin * 2, 5.5, pageW, pageH, margin, title);
    y += 6;
  }

  if (incident.iocs_identified) {
    y = checkPage(doc, y + 15, pageH, pageW, title);
    y = section(doc, 'Indicators of Compromise (IOCs)', y, margin, pageW);
    rgb(doc, C.gray300);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    y = textBlock(doc, incident.iocs_identified, margin, y, pageW - margin * 2, 5.5, pageW, pageH, margin, title);
    y += 6;
  }

  if (incident.root_cause) {
    y = checkPage(doc, y + 15, pageH, pageW, title);
    y = section(doc, 'Root Cause Analysis', y, margin, pageW);
    rgb(doc, C.gray300);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    y = textBlock(doc, incident.root_cause, margin, y, pageW - margin * 2, 5.5, pageW, pageH, margin, title);
    y += 6;
  }

  // ── NIS2 Section ─────────────────────────────────────────────────────────────
  if (incident.nis2_significance && incident.nis2_significance !== 'Not Assessed') {
    y = checkPage(doc, y + 15, pageH, pageW, title);
    y = section(doc, 'NIS2 Compliance', y, margin, pageW);

    y = row(doc, 'NIS2 Significance',    incident.nis2_significance,   y, margin);
    y = row(doc, 'Authorities Notified', incident.nis2_notified_authorities || '—', y, margin);
    y = row(doc, 'Cross-Border Impact',  incident.nis2_cross_border_impact ? 'Yes' : 'No', y, margin);
    y += 4;
  }

  // ── AI Playbook ───────────────────────────────────────────────────────────────
  if (incident.ai_playbook) {
    y = checkPage(doc, y + 15, pageH, pageW, title);
    y = section(doc, 'AI-Generated Response Playbook', y, margin, pageW);
    const cleanPlaybook = incident.ai_playbook.replace(/##? /g, '').replace(/\*\*/g, '').replace(/\*/g, '');
    rgb(doc, C.gray300);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    y = textBlock(doc, cleanPlaybook, margin, y, pageW - margin * 2, 5, pageW, pageH, margin, title);
  }

  return { data: doc.output('arraybuffer') };
};
