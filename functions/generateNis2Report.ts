import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Pull latest completed assessment for this company
    const assessments = await base44.entities.Assessment.filter(
      { company_id: user.company_id, status: 'completed' },
      '-created_date',
      1
    );
    const assessment = assessments?.[0];

    // Fetch NIS2 requirements
    const allReqs = await base44.entities.RegulatoryRequirement.list();
    const nis2Reqs = (allReqs || []).filter(r => r.regulation_code === 'NIS2');

    // Prepare derived readiness
    const readinessLevel = assessment?.nis2_readiness_level || 'Not Assessed';
    const readinessScore = typeof assessment?.nis2_compliance_score === 'number'
      ? Math.round(assessment.nis2_compliance_score)
      : (typeof assessment?.overall_score === 'number' ? Math.round(assessment.overall_score) : null);

    const doc = new jsPDF({ unit: 'pt' });

    const writeWrapped = (text, x, y, maxWidth = 520, lineHeight = 14) => {
      const textStr = String(text || '');
      const lines = doc.splitTextToSize(textStr, maxWidth);
      lines.forEach((ln) => {
        doc.text(ln, x, y);
        y += lineHeight;
      });
      return y;
    };

    // Header
    doc.setFontSize(18);
    doc.text('NIS2 Compliance Report', 40, 50);
    doc.setFontSize(11);
    doc.text(`Company: ${user.company_name || ''}`, 40, 70);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 85);
    if (assessment?.maturity_level) {
      doc.text(`Latest Assessment: ${assessment.maturity_level} (${assessment.overall_score || 0}%)`, 40, 100);
    }
    if (readinessScore != null) {
      doc.text(`NIS2 Readiness: ${readinessLevel} (${readinessScore}%)`, 40, 115);
    } else {
      doc.text(`NIS2 Readiness: ${readinessLevel}`, 40, 115);
    }

    let y = 140;

    // Section: Executive Summary
    doc.setFontSize(14);
    doc.text('Executive Summary', 40, y);
    y += 16;
    doc.setFontSize(10);
    y = writeWrapped(
      'This report provides a focused overview of your organization’s current state against NIS2 obligations and highlights concrete steps to close gaps. It combines your latest Fortigap assessment with NIS2 regulatory articles.',
      40, y
    );

    // Section: Organization Context (from Assessment NIS2 fields)
    y += 10;
    doc.setFontSize(14);
    doc.text('Organizational Context (from Assessment)', 40, y);
    y += 16;
    doc.setFontSize(10);
    const contextBlocks = [
      { label: 'Essential/Important Services', value: assessment?.nis2_essential_services },
      { label: 'Governance Framework', value: assessment?.nis2_governance_framework },
      { label: 'Supply Chain Security', value: assessment?.nis2_supply_chain_security },
      { label: 'Business Continuity & Crisis Management', value: assessment?.nis2_business_continuity },
      { label: 'Vulnerability Handling & Disclosure', value: assessment?.nis2_vulnerability_handling },
      { label: 'Use of Cryptography', value: assessment?.nis2_use_of_crypto },
      { label: 'Human Resources Security', value: assessment?.nis2_human_resources_security },
    ];

    for (const block of contextBlocks) {
      if (y > 760) { doc.addPage(); y = 50; }
      y = writeWrapped(`${block.label}: ${block.value ? block.value : '—'}`, 40, y);
      y += 6;
    }

    // Section: Mapped NIS2 Requirements
    y += 6;
    doc.setFontSize(14);
    if (y > 760) { doc.addPage(); y = 50; }
    doc.text('NIS2 Requirements (Articles)', 40, y);
    y += 16;
    doc.setFontSize(10);

    const reqs = nis2Reqs.length ? nis2Reqs : [];
    if (!reqs.length) {
      y = writeWrapped('No NIS2 articles found in your repository. Add RegulatoryRequirement entries with regulation_code=NIS2 to enrich this section.', 40, y);
    } else {
      for (const r of reqs) {
        if (y > 760) { doc.addPage(); y = 50; }
        const header = `${r.article_id || 'Article'}: ${r.title || ''}`;
        doc.setFontSize(11);
        y = writeWrapped(header, 40, y);
        doc.setFontSize(10);
        y = writeWrapped(r.description || '', 56, y, 504);
        if (Array.isArray(r.mapped_control_hints) && r.mapped_control_hints.length) {
          y = writeWrapped(`Mapped controls: ${r.mapped_control_hints.join(', ')}`, 56, y, 504);
        }
        y += 8;
      }
    }

    // Section: Gaps & Next Steps (heuristic)
    if (y > 760) { doc.addPage(); y = 50; }
    doc.setFontSize(14);
    doc.text('Gaps & Next Steps', 40, y);
    y += 16;
    doc.setFontSize(10);

    const gaps = [];
    for (const block of contextBlocks) {
      if (!block.value || String(block.value).trim().length < 10) {
        gaps.push(`Define and document ${block.label.toLowerCase()}.`);
      }
    }
    if (!Array.isArray(gaps) || gaps.length === 0) {
      y = writeWrapped('No obvious narrative gaps detected from the assessment context fields. Review control evidence and implement continuous improvement activities.', 40, y);
    } else {
      y = writeWrapped('The following areas appear incomplete or insufficiently documented:', 40, y);
      for (const g of gaps) {
        if (y > 760) { doc.addPage(); y = 50; }
        y = writeWrapped(`• ${g}`, 40, y);
      }
    }

    // Footer
    if (y > 760) { doc.addPage(); y = 50; }
    y += 14;
    doc.setFontSize(9);
    writeWrapped('Generated by Fortigap — NIS2-focused readiness summary. Use Compliance and Evidence modules to attach proof for each mapped control.', 40, y);

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=fortigap_nis2_compliance_report.pdf'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});