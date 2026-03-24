import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Latest completed assessment
    const assessments = await base44.entities.Assessment.filter({ company_id: user.company_id, status: 'completed' }, '-created_date', 1);
    const assessment = assessments?.[0];

    // EU/UK regulatory requirements
    const reqs = await base44.entities.RegulatoryRequirement.list();
    const nis2 = reqs.filter(r => r.regulation_code === 'NIS2');
    const dora = reqs.filter(r => r.regulation_code === 'DORA');
    const fca = reqs.filter(r => r.regulation_code === 'FCA');

    const doc = new jsPDF();
    const wrap = (text, max = 90) => {
      const words = String(text || '').split(' ');
      const lines = [];
      let line = '';
      words.forEach(w => {
        if ((line + ' ' + w).trim().length > max) {
          lines.push(line);
          line = w;
        } else {
          line = (line ? line + ' ' : '') + w;
        }
      });
      if (line) lines.push(line);
      return lines;
    };

    // Header
    doc.setFontSize(18);
    doc.text('EU/UK Regulatory Readiness Report', 20, 20);
    doc.setFontSize(11);
    doc.text(`Company: ${user.company_name || ''}`, 20, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 34);
    if (assessment?.maturity_level) doc.text(`Latest Assessment: ${assessment.maturity_level} (${assessment.overall_score || 0}%)`, 20, 40);

    // Section helper
    let y = 50;
    const addSection = (title) => {
      doc.setFontSize(14);
      doc.text(title, 20, y);
      y += 6;
      doc.setFontSize(10);
    };

    const addRequirement = (r) => {
      const lines = [
        `${r.article_id}: ${r.title}`,
        ...wrap(r.description, 95),
        `Mapped controls: ${(r.mapped_control_hints || []).join(', ') || '—'}`
      ];
      lines.forEach(line => {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.text(line, 20, y);
        y += 5;
      });
      y += 3;
    };

    addSection('NIS2 – Key Requirements');
    nis2.forEach(addRequirement);

    addSection('DORA – Key Requirements');
    dora.forEach(addRequirement);

    addSection('FCA – Operational Resilience');
    fca.forEach(addRequirement);

    // Simple summary
    addSection('Summary & Next Steps');
    const summary = [
      'This report summarizes selected EU/UK regulatory obligations (sample).',
      'Use Fortigap to map internal controls and action items to each article.',
      'Focus areas likely impacting your readiness: Incident Reporting, Third-Party Risk, Business Continuity.',
    ];
    summary.forEach(line => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(line, 20, y);
      y += 5;
    });

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=regulatory_readiness.pdf'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});