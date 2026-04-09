/**
 * generateTabletopReportPdf — generates a tabletop exercise report PDF.
 *
 * @param {object} params
 * @param {string} params.exerciseId  Firestore document ID of the tabletop exercise
 * @returns {{ data: ArrayBuffer }}   PDF as ArrayBuffer for Blob creation
 */
import { jsPDF } from 'jspdf';
import { TabletopExercise } from '@/entities/TabletopExercise';

const C = {
  bg:      [15,  23,  42],
  bg2:     [30,  41,  59],
  purple:  [139, 92,  246],
  cyan:    [6,   182, 212],
  white:   [255, 255, 255],
  gray400: [148, 163, 184],
  gray300: [203, 213, 225],
  green:   [34,  197, 94],
  yellow:  [234, 179, 8],
};

function rgb(doc, c)  { doc.setTextColor(c[0], c[1], c[2]); }
function fill(doc, c) { doc.setFillColor(c[0], c[1], c[2]); }
function addBg(doc, w, h) { fill(doc, C.bg); doc.rect(0, 0, w, h, 'F'); }

function addHeader(doc, w, exTitle) {
  fill(doc, C.bg2);
  doc.rect(0, 0, w, 20, 'F');
  fill(doc, C.purple);
  doc.rect(0, 0, w, 2, 'F');
  rgb(doc, C.cyan);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TABLETOP EXERCISE REPORT — Hubcys', 14, 8);
  rgb(doc, C.gray400);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text((exTitle || '').slice(0, 80), 14, 15);
}

function addFooter(doc, w, h) {
  rgb(doc, C.gray400);
  doc.setFontSize(7);
  const d = new Date().toLocaleString('en-GB');
  doc.text(`Generated ${d} — Hubcys — CONFIDENTIAL`, w / 2, h - 6, { align: 'center' });
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
  fill(doc, C.purple);
  doc.rect(margin, y - 4, 3, 9, 'F');
  rgb(doc, C.purple);
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
  doc.text(String(value ?? '—'), margin + 55, y);
  return y + 8;
}

function textBlock(doc, text, x, y, maxW, lineH, w, h, margin, exTitle) {
  const lines = doc.splitTextToSize(String(text || '—'), maxW);
  for (const line of lines) {
    y = checkPage(doc, y, h, w, exTitle);
    doc.text(line, x, y);
    y += lineH;
  }
  return y;
}

export const generateTabletopReportPdf = async ({ exerciseId }) => {
  if (!exerciseId) throw new Error('generateTabletopReportPdf: exerciseId is required');

  const exercise = await TabletopExercise.get(exerciseId);
  if (!exercise) throw new Error('Tabletop exercise not found');

  const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW  = doc.internal.pageSize.getWidth();
  const pageH  = doc.internal.pageSize.getHeight();
  const margin = 14;
  const exTitle = exercise.exercise_name || 'Tabletop Exercise Report';

  // ── Cover ──────────────────────────────────────────────────────────────────
  addBg(doc, pageW, pageH);
  fill(doc, C.purple);
  doc.rect(0, 0, pageW, 4, 'F');

  rgb(doc, C.purple);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TABLETOP EXERCISE REPORT', margin, 30);

  rgb(doc, C.white);
  doc.setFontSize(18);
  doc.text(exTitle, margin, 42);

  rgb(doc, C.gray400);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Report Date: ${dateStr}`, margin, 52);
  if (exercise.company_name) doc.text(`Organisation: ${exercise.company_name}`, margin, 60);

  addFooter(doc, pageW, pageH);

  // ── Page 2: Exercise Details ─────────────────────────────────────────────
  doc.addPage();
  addBg(doc, pageW, pageH);
  addHeader(doc, pageW, exTitle);
  addFooter(doc, pageW, pageH);

  let y = 28;
  y = section(doc, 'Exercise Overview', y, margin, pageW);

  y = row(doc, 'Exercise Name',     exTitle,                           y, margin);
  y = row(doc, 'Company',           exercise.company_name    || '—',  y, margin);
  y = row(doc, 'Industry',          exercise.industry_sector || '—',  y, margin);
  y = row(doc, 'Company Size',      exercise.company_size    || '—',  y, margin);
  y = row(doc, 'Status',            exercise.status          || '—',  y, margin);
  y += 4;

  if (exercise.exercise_description) {
    y = checkPage(doc, y + 15, pageH, pageW, exTitle);
    y = section(doc, 'Exercise Description', y, margin, pageW);
    rgb(doc, C.gray300);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    y = textBlock(doc, exercise.exercise_description, margin, y, pageW - margin * 2, 5.5, pageW, pageH, margin, exTitle);
    y += 6;
  }

  if (exercise.exercise_objectives) {
    y = checkPage(doc, y + 15, pageH, pageW, exTitle);
    y = section(doc, 'Exercise Objectives', y, margin, pageW);
    rgb(doc, C.gray300);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    y = textBlock(doc, exercise.exercise_objectives, margin, y, pageW - margin * 2, 5.5, pageW, pageH, margin, exTitle);
    y += 6;
  }

  if (exercise.business_context) {
    y = checkPage(doc, y + 15, pageH, pageW, exTitle);
    y = section(doc, 'Business Context', y, margin, pageW);
    rgb(doc, C.gray300);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    y = textBlock(doc, exercise.business_context, margin, y, pageW - margin * 2, 5.5, pageW, pageH, margin, exTitle);
    y += 6;
  }

  if (exercise.critical_systems_scope) {
    y = checkPage(doc, y + 15, pageH, pageW, exTitle);
    y = section(doc, 'Critical Systems in Scope', y, margin, pageW);
    rgb(doc, C.gray300);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    y = textBlock(doc, exercise.critical_systems_scope, margin, y, pageW - margin * 2, 5.5, pageW, pageH, margin, exTitle);
    y += 6;
  }

  // ── Scenarios ──────────────────────────────────────────────────────────────
  let scenarios = [];
  try {
    scenarios = typeof exercise.scenarios === 'string'
      ? JSON.parse(exercise.scenarios)
      : (Array.isArray(exercise.scenarios) ? exercise.scenarios : []);
  } catch (_) { /* ignore */ }

  if (scenarios.length > 0) {
    y = checkPage(doc, y + 15, pageH, pageW, exTitle);
    y = section(doc, `Exercise Scenarios (${scenarios.length})`, y, margin, pageW);

    for (let i = 0; i < scenarios.length; i++) {
      const s = scenarios[i];
      y = checkPage(doc, y + 15, pageH, pageW, exTitle);

      rgb(doc, C.cyan);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Scenario ${i + 1}: ${s.title || s.name || 'Scenario'}`, margin, y);
      y += 6;

      if (s.description || s.summary) {
        rgb(doc, C.gray300);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        y = textBlock(doc, s.description || s.summary, margin, y, pageW - margin * 2, 5, pageW, pageH, margin, exTitle);
      }
      y += 4;
    }
  }

  // ── Compliance ──────────────────────────────────────────────────────────────
  if (exercise.compliance_requirements) {
    y = checkPage(doc, y + 15, pageH, pageW, exTitle);
    y = section(doc, 'Compliance Requirements', y, margin, pageW);
    rgb(doc, C.gray300);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    y = textBlock(doc, exercise.compliance_requirements, margin, y, pageW - margin * 2, 5.5, pageW, pageH, margin, exTitle);
  }

  return { data: doc.output('arraybuffer') };
};
