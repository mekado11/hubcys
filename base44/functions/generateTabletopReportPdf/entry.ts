import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';
import { jsPDF } from 'npm:jspdf@2.5.1';

// Helper functions
function safeParseJSON(str) {
  if (!str) return null;
  try { return typeof str === 'string' ? JSON.parse(str) : str; } catch { return null; }
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight) {
  if (!text) return y;
  const lines = doc.splitTextToSize(String(text), maxWidth);
  lines.forEach((ln) => { doc.text(ln, x, y); y += lineHeight; });
  return y;
}

function formatDate(d) {
  try {
    const dt = d ? new Date(d) : new Date();
    return dt.toLocaleDateString();
  } catch { return ''; }
}

function formatDateTime(d) {
  try {
    const dt = d ? new Date(d) : new Date();
    return dt.toLocaleString();
  } catch { return ''; }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const exerciseId = body?.exerciseId;
    if (!exerciseId) {
      return new Response(JSON.stringify({ error: 'exerciseId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const exercise = await base44.entities.TabletopExercise.get(exerciseId);
    if (!exercise) {
      return new Response(JSON.stringify({ error: 'Exercise not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = margin;

    // Header
    doc.setFont('helvetica', 'bold'); 
    doc.setFontSize(22);
    doc.text('Tabletop Exercise Report', pageWidth / 2, y, { align: 'center' });
    y += 30;

    doc.setFont('helvetica', 'normal'); 
    doc.setFontSize(16);
    doc.text(exercise.exercise_name, pageWidth / 2, y, { align: 'center' });
    y += 20;

    doc.setFontSize(10);
    doc.text(`Generated on ${formatDate(new Date())}`, pageWidth / 2, y, { align: 'center' });
    y += 20;

    // Line separator
    doc.setDrawColor(100);
    doc.line(margin, y, pageWidth - margin, y);
    y += 25;

    // Exercise Overview
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Exercise Overview', margin, y);
    y += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    // Basic Info
    const basicInfo = [
      ['Company:', exercise.company_name || '—'],
      ['Industry:', exercise.industry_sector || '—'],
      ['Company Size:', exercise.company_size?.replace('_', ' ') || '—'],
      ['Exercise Date:', exercise.scheduled_date ? formatDateTime(exercise.scheduled_date) : 'Not scheduled'],
      ['Duration:', exercise.duration_minutes ? `${exercise.duration_minutes} minutes` : '—'],
      ['Facilitator:', exercise.facilitator_email || '—'],
      ['Status:', exercise.status?.replace('_', ' ') || '—']
    ];

    basicInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 80, y);
      y += 14;
    });

    y += 10;

    // Description
    if (exercise.exercise_description) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Description', margin, y);
      y += 16;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      y = addWrappedText(doc, exercise.exercise_description, margin, y, pageWidth - margin * 2, 14);
      y += 15;
    }

    // Objectives
    if (exercise.exercise_objectives) {
      if (y > pageHeight - margin - 100) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Exercise Objectives', margin, y);
      y += 16;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      y = addWrappedText(doc, exercise.exercise_objectives, margin, y, pageWidth - margin * 2, 14);
      y += 15;
    }

    // Scenarios
    const scenarios = safeParseJSON(exercise.scenarios);
    if (scenarios && scenarios.length > 0) {
      if (y > pageHeight - margin - 150) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Exercise Scenarios', margin, y);
      y += 16;

      scenarios.forEach((scenario, index) => {
        if (y > pageHeight - margin - 80) { doc.addPage(); y = margin; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`${index + 1}. ${scenario.name || `Scenario ${index + 1}`}`, margin, y);
        y += 14;
        
        if (scenario.details) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          y = addWrappedText(doc, scenario.details, margin + 15, y, pageWidth - margin * 2 - 15, 13);
          y += 8;
        }
      });
      y += 10;
    }

    // Participants
    const participants = safeParseJSON(exercise.participants);
    if (participants && participants.length > 0) {
      if (y > pageHeight - margin - 100) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Participants', margin, y);
      y += 16;

      participants.forEach((participant) => {
        if (y > pageHeight - margin - 40) { doc.addPage(); y = margin; }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`• ${participant.name || participant.email} - ${participant.role || 'Participant'}`, margin + 10, y);
        y += 12;
      });
      y += 10;
    }

    // Exercise Results (if completed)
    if (exercise.status === 'Completed') {
      if (y > pageHeight - margin - 150) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Exercise Results', margin, y);
      y += 20;

      // Lessons Learned
      if (exercise.lessons_learned) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Lessons Learned', margin, y);
        y += 16;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        y = addWrappedText(doc, exercise.lessons_learned, margin, y, pageWidth - margin * 2, 14);
        y += 15;
      }

      // Strengths Identified
      if (exercise.strengths_identified) {
        if (y > pageHeight - margin - 100) { doc.addPage(); y = margin; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Strengths Identified', margin, y);
        y += 16;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        y = addWrappedText(doc, exercise.strengths_identified, margin, y, pageWidth - margin * 2, 14);
        y += 15;
      }

      // Gaps Identified
      if (exercise.gaps_identified) {
        if (y > pageHeight - margin - 100) { doc.addPage(); y = margin; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Gaps Identified', margin, y);
        y += 16;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        y = addWrappedText(doc, exercise.gaps_identified, margin, y, pageWidth - margin * 2, 14);
        y += 15;
      }

      // Improvement Recommendations
      if (exercise.improvement_recommendations) {
        if (y > pageHeight - margin - 100) { doc.addPage(); y = margin; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Improvement Recommendations', margin, y);
        y += 16;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        y = addWrappedText(doc, exercise.improvement_recommendations, margin, y, pageWidth - margin * 2, 14);
        y += 15;
      }

      // Action Items
      if (exercise.action_items_generated) {
        if (y > pageHeight - margin - 100) { doc.addPage(); y = margin; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Action Items Generated', margin, y);
        y += 16;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        y = addWrappedText(doc, exercise.action_items_generated, margin, y, pageWidth - margin * 2, 14);
        y += 15;
      }
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Generated by FortiGap • Confidential', pw / 2, ph - 20, { align: 'center' });
      doc.text(`Page ${i}`, pw - 40, ph - 20, { align: 'right' });
    }

    const pdfBytes = doc.output('arraybuffer');
    const filename = `${exercise.exercise_name?.replace(/\s+/g, '_') || 'Tabletop_Exercise'}_Report.pdf`;
    
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate PDF', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});