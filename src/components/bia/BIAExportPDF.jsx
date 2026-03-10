import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";

const fmt = (n) => {
  if (typeof n !== "number" || isNaN(n)) return "N/A";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
};

const fmtCompact = (n) =>
  n ? new Intl.NumberFormat("en-US", { notation: "compact" }).format(n) : "N/A";

function wrapText(doc, text, x, y, maxWidth, lineHeight) {
  const lines = doc.splitTextToSize(text, maxWidth);
  lines.forEach((line) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, x, y);
    y += lineHeight;
  });
  return y;
}

function drawSectionHeader(doc, title, y, color = [14, 165, 233]) {
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFillColor(...color);
  doc.rect(14, y, 182, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(title, 18, y + 5.5);
  doc.setTextColor(30, 40, 60);
  doc.setFont("helvetica", "normal");
  return y + 13;
}

function drawKV(doc, label, value, x, y, labelWidth = 60) {
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80, 90, 110);
  doc.text(label + ":", x, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(20, 30, 50);
  doc.text(String(value ?? "—"), x + labelWidth, y);
  return y + 6;
}

function riskColor(ale) {
  if (ale > 1_000_000) return [220, 38, 38];
  if (ale > 500_000) return [234, 88, 12];
  if (ale > 100_000) return [202, 138, 4];
  return [22, 163, 74];
}

export default function BIAExportPDF({ selectedBia, fairMetrics, industryBenchmarks }) {
  const [generating, setGenerating] = useState(false);

  const handleExport = async () => {
    if (!selectedBia || !fairMetrics) return;
    setGenerating(true);

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const margin = 14;
      const contentW = pageW - margin * 2;

      // ── COVER PAGE ─────────────────────────────────────────────────────────
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 297, "F");

      // Accent bar
      doc.setFillColor(14, 165, 233);
      doc.rect(0, 0, 6, 297, "F");

      doc.setTextColor(14, 165, 233);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("HUBCYS", 18, 28);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("Business Impact Analysis", 18, 60);
      doc.setFontSize(16);
      doc.text("FAIR Risk Report", 18, 72);

      doc.setFillColor(14, 165, 233, 0.3);
      doc.setDrawColor(14, 165, 233);
      doc.setLineWidth(0.4);
      doc.line(18, 80, 192, 80);

      doc.setFontSize(13);
      doc.setTextColor(200, 220, 255);
      doc.text(selectedBia.title || "Untitled BIA", 18, 92);

      doc.setFontSize(9);
      doc.setTextColor(100, 130, 160);
      const coverMeta = [
        ["Scope", selectedBia.scope || "—"],
        ["Annual Revenue", selectedBia.annual_revenue ? `$${fmtCompact(selectedBia.annual_revenue)}` : "Not provided"],
        ["Employees", selectedBia.employee_count ? String(selectedBia.employee_count) : "Not provided"],
        ["Generated", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
        ["Classification", "CONFIDENTIAL"],
      ];
      let cy = 108;
      coverMeta.forEach(([k, v]) => {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(14, 165, 233);
        doc.text(k + ":", 18, cy);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(180, 200, 230);
        doc.text(v, 65, cy);
        cy += 8;
      });

      // Disclaimer
      doc.setFontSize(7.5);
      doc.setTextColor(80, 100, 120);
      doc.text(
        "This report is generated using the FAIR (Factor Analysis of Information Risk) methodology. Values are estimates\nbased on provided inputs and industry benchmarks. This is not a guarantee of actual losses.",
        18, 270
      );

      // ── PAGE 2: EXECUTIVE SUMMARY ──────────────────────────────────────────
      doc.addPage();
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, 210, 297, "F");

      let y = 20;
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 14, "F");
      doc.setTextColor(14, 165, 233);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("HUBCYS  |  BIA FAIR RISK REPORT  |  CONFIDENTIAL", margin, 9);
      doc.setTextColor(150, 160, 180);
      doc.setFont("helvetica", "normal");
      doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageW - margin - 20, 9);

      y = 24;
      y = drawSectionHeader(doc, "EXECUTIVE SUMMARY", y, [15, 23, 42]);

      // Summary narrative
      const items = selectedBia.bia_items ? JSON.parse(selectedBia.bia_items) : [];
      const totalALE = fairMetrics.total_ale || 0;
      const avgLEF = fairMetrics.avg_lef || 0;
      const revenueNote = selectedBia.annual_revenue
        ? `scaled to $${fmtCompact(selectedBia.annual_revenue)} annual revenue`
        : "using conservative SMB defaults (no revenue provided)";

      doc.setFontSize(9);
      doc.setTextColor(30, 40, 60);
      doc.setFont("helvetica", "normal");
      const execSummary =
        `This Business Impact Analysis assessed ${items.length} critical function(s) ` +
        `using the FAIR (Factor Analysis of Information Risk) quantitative methodology, ${revenueNote}. ` +
        `The total Annualized Loss Expectancy (ALE) across all assessed functions is ${fmt(totalALE)}, ` +
        `representing the expected annual cost of cyber risk to the organisation. ` +
        `The average Loss Event Frequency (LEF) is ${avgLEF.toFixed(2)}x per year, indicating ` +
        `${avgLEF > 1.5 ? "elevated threat exposure requiring urgent remediation" : avgLEF > 0.8 ? "moderate threat exposure warranting prioritised attention" : "manageable threat exposure with ongoing monitoring recommended"}.`;
      y = wrapText(doc, execSummary, margin, y, contentW, 5.5);
      y += 6;

      // FAIR KPI boxes
      const kpis = [
        { label: "Total ALE", value: fmt(totalALE), sub: "Annual Loss Expectancy", color: [14, 165, 233] },
        { label: "Avg LEF", value: `${avgLEF.toFixed(2)}x/yr`, sub: "Loss Event Frequency", color: [124, 58, 237] },
        { label: "Highest SLE", value: fmt(fairMetrics.highest_sle_value), sub: fairMetrics.highest_sle_scenario?.substring(0, 20) || "—", color: [234, 88, 12] },
        { label: "Functions", value: String(items.length), sub: "Assessed", color: [16, 185, 129] },
      ];

      const boxW = (contentW - 6) / 4;
      kpis.forEach((kpi, i) => {
        const bx = margin + i * (boxW + 2);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(230, 235, 245);
        doc.setLineWidth(0.3);
        doc.roundedRect(bx, y, boxW, 22, 2, 2, "FD");
        doc.setFillColor(...kpi.color);
        doc.rect(bx, y, boxW, 2.5, "F");
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...kpi.color);
        doc.text(kpi.value, bx + boxW / 2, y + 13, { align: "center" });
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 90, 110);
        doc.text(kpi.label, bx + boxW / 2, y + 8, { align: "center" });
        doc.text(kpi.sub, bx + boxW / 2, y + 18, { align: "center" });
      });
      y += 30;

      // Risk distribution
      const dist = fairMetrics.risk_distribution || {};
      y = drawSectionHeader(doc, "RISK DISTRIBUTION", y, [30, 41, 59]);
      const distItems = [
        { label: "Critical (ALE > $1M)", count: dist.critical || 0, color: [220, 38, 38] },
        { label: "High (ALE $500k–$1M)", count: dist.high || 0, color: [234, 88, 12] },
        { label: "Medium (ALE $100k–$500k)", count: dist.medium || 0, color: [202, 138, 4] },
        { label: "Low (ALE < $100k)", count: dist.low || 0, color: [22, 163, 74] },
      ];
      distItems.forEach(({ label, count, color }) => {
        doc.setFillColor(...color);
        doc.circle(margin + 3, y - 1.5, 2, "F");
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...color);
        doc.text(String(count), margin + 8, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 50, 70);
        doc.text(label, margin + 15, y);
        y += 7;
      });
      y += 4;

      // Industry benchmarks
      if (industryBenchmarks) {
        y = drawSectionHeader(doc, "INDUSTRY BENCHMARKS USED", y, [30, 41, 59]);
        const bmRows = [
          ["Avg Breach Frequency", `${(industryBenchmarks.avg_breach_frequency * 100).toFixed(1)}% per year`],
          ["Cost per Breached Record", `$${industryBenchmarks.avg_cost_per_record}`],
          ["Downtime Cost / Hour", fmt(industryBenchmarks.avg_downtime_cost_per_hour)],
          ["Ransomware Likelihood", `${(industryBenchmarks.ransomware_likelihood * 100).toFixed(1)}%`],
          ["Revenue Scaling", selectedBia.annual_revenue ? `Based on $${fmtCompact(selectedBia.annual_revenue)} ARR` : "Conservative SMB defaults applied"],
        ];
        bmRows.forEach(([k, v]) => {
          y = drawKV(doc, k, v, margin, y, 70);
        });
        y += 4;
      }

      // ── PER-FUNCTION PAGES ─────────────────────────────────────────────────
      items.forEach((item, idx) => {
        doc.addPage();
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 0, 210, 297, "F");

        // Header bar
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 14, "F");
        doc.setTextColor(14, 165, 233);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("HUBCYS  |  BIA FAIR RISK REPORT  |  CONFIDENTIAL", margin, 9);
        doc.setTextColor(150, 160, 180);
        doc.setFont("helvetica", "normal");
        doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageW - margin - 20, 9);

        y = 24;
        const result = item.result || {};
        const inputs = item.inputs || {};
        const funcName = inputs.bia_process_name || item.name || `Function ${idx + 1}`;
        const ale = result.ale || result.annualizedLoss || 0;
        const rc = riskColor(ale);

        // Function title
        doc.setFillColor(...rc);
        doc.rect(margin, y, contentW, 10, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${idx + 1}. ${funcName}`, margin + 3, y + 7);
        y += 15;

        // FAIR metrics row
        const mets = [
          { k: "ALE", v: fmt(ale) },
          { k: "SLE", v: fmt(result.sle) },
          { k: "LEF", v: result.lef ? `${result.lef.toFixed(2)}x/yr` : "—" },
          { k: "Risk Score", v: result.riskScore ? `${result.riskScore.toFixed(1)}/25` : "—" },
          { k: "RTO", v: result.rtoHours ? `${result.rtoHours}h` : "—" },
          { k: "RPO", v: result.rpoHours ? `${result.rpoHours}h` : "—" },
        ];
        const mw = (contentW - 5) / 3;
        mets.forEach((m, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const mx = margin + col * (mw + 2.5);
          const my = y + row * 16;
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(220, 225, 235);
          doc.setLineWidth(0.3);
          doc.roundedRect(mx, my, mw, 13, 1.5, 1.5, "FD");
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 110, 130);
          doc.text(m.k, mx + mw / 2, my + 4.5, { align: "center" });
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(20, 30, 50);
          doc.text(m.v, mx + mw / 2, my + 10, { align: "center" });
        });
        y += 37;

        // Function details
        y = drawSectionHeader(doc, "FUNCTION DETAILS", y, [30, 41, 59]);
        const details = [
          ["Category", inputs.bia_process_category?.replace(/_/g, " ") || "—"],
          ["Process Type", inputs.bia_process_type || "—"],
          ["Threat Scenario", item.threat_scenario_type?.replace(/_/g, " ") || "—"],
          ["Attack Vector", item.attack_vector?.replace(/_/g, " ") || "—"],
          ["Control Weakness", item.control_weakness_score ? `${item.control_weakness_score.toFixed(0)}/100` : "—"],
          ["FAIR Confidence", result.fair_confidence ? `${result.fair_confidence}%` : "—"],
        ];
        details.forEach(([k, v]) => { y = drawKV(doc, k, v, margin, y, 55); });
        y += 4;

        // Risk narrative
        if (result.riskNarrative) {
          y = drawSectionHeader(doc, "RISK NARRATIVE", y, [30, 41, 59]);
          const cleaned = result.riskNarrative.replace(/\*\*/g, "").replace(/\*/g, "");
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(30, 40, 60);
          y = wrapText(doc, cleaned, margin, y, contentW, 5);
          y += 4;
        }

        // Top drivers
        if (result.topDrivers && result.topDrivers.length > 0) {
          y = drawSectionHeader(doc, "TOP RISK DRIVERS", y, [30, 41, 59]);
          result.topDrivers.slice(0, 4).forEach((driver, di) => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFillColor(234, 88, 12, 0.15);
            doc.setFontSize(8.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(234, 88, 12);
            doc.text(`${di + 1}.`, margin, y);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(30, 40, 60);
            y = wrapText(doc, driver, margin + 6, y, contentW - 6, 5);
            y += 2;
          });
          y += 2;
        }

        // Breach precedents
        if (result.relevantBreachCases && result.relevantBreachCases.length > 0) {
          if (y > 230) { doc.addPage(); y = 20; }
          y = drawSectionHeader(doc, "REAL-WORLD BREACH PRECEDENTS", y, [124, 58, 237]);
          result.relevantBreachCases.slice(0, 3).forEach((breach) => {
            if (y > 255) { doc.addPage(); y = 20; }
            doc.setFillColor(248, 245, 255);
            doc.setDrawColor(180, 150, 230);
            doc.setLineWidth(0.3);
            const bYear = breach.breach_date ? new Date(breach.breach_date).getFullYear() : "?";
            const bImpact = breach.estimated_financial_impact
              ? fmt(breach.estimated_financial_impact)
              : "Undisclosed";
            doc.roundedRect(margin, y, contentW, 18, 1.5, 1.5, "FD");
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(80, 30, 140);
            doc.text(`${breach.company_name || "Unknown"} (${bYear})`, margin + 3, y + 6);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(50, 60, 80);
            doc.setFontSize(8);
            doc.text(`Impact: ${bImpact}  |  Cause: ${breach.primary_cause || "—"}  |  Attack: ${breach.attack_type?.replace(/_/g, " ") || "—"}`, margin + 3, y + 12);
            if (breach.lessons_learned) {
              const lesson = breach.lessons_learned.substring(0, 100) + (breach.lessons_learned.length > 100 ? "…" : "");
              doc.setTextColor(100, 110, 130);
              doc.text(`Lesson: ${lesson}`, margin + 3, y + 17);
            }
            y += 22;
          });
        }
      });

      // ── FINAL PAGE: RECOMMENDATIONS ────────────────────────────────────────
      doc.addPage();
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, 210, 297, "F");
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 14, "F");
      doc.setTextColor(14, 165, 233);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("HUBCYS  |  BIA FAIR RISK REPORT  |  CONFIDENTIAL", margin, 9);

      y = 24;
      y = drawSectionHeader(doc, "STRATEGIC RECOMMENDATIONS", y, [15, 23, 42]);

      // Generate ranked recommendations from items
      const sortedByALE = [...items].sort(
        (a, b) => (b.result?.ale || 0) - (a.result?.ale || 0)
      );

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 40, 60);

      const introText =
        `Based on the FAIR analysis conducted across ${items.length} critical function(s), ` +
        `the following prioritised recommendations are provided to reduce the organisation's total ` +
        `annualized risk exposure of ${fmt(fairMetrics.total_ale)}.`;
      y = wrapText(doc, introText, margin, y, contentW, 5.5);
      y += 6;

      sortedByALE.slice(0, 5).forEach((item, ri) => {
        if (y > 260) { doc.addPage(); y = 20; }
        const result = item.result || {};
        const inputs = item.inputs || {};
        const ale = result.ale || 0;
        const rc2 = riskColor(ale);
        const funcName = inputs.bia_process_name || item.name || `Function ${ri + 1}`;
        const actionPlan = result.actionPlan || "Review and remediate identified control weaknesses.";

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(220, 225, 235);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, y, contentW, 24, 2, 2, "FD");
        doc.setFillColor(...rc2);
        doc.rect(margin, y, 3, 24, "F");

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 30, 50);
        doc.text(`${ri + 1}. ${funcName}`, margin + 6, y + 7);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...rc2);
        doc.text(`ALE: ${fmt(ale)}`, margin + 6, y + 13);
        doc.setTextColor(60, 70, 90);
        const planText = typeof actionPlan === "string"
          ? actionPlan.substring(0, 180) + (actionPlan.length > 180 ? "…" : "")
          : "Review control weaknesses.";
        const planLines = doc.splitTextToSize(planText, contentW - 12);
        doc.text(planLines.slice(0, 2), margin + 6, y + 19);
        y += 28;
      });

      y += 4;
      // Footer note
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(120, 130, 150);
      const footNote =
        "This report was generated by Hubcys using the FAIR (Factor Analysis of Information Risk) methodology. " +
        "Risk figures are probabilistic estimates and should be reviewed alongside qualitative assessments by qualified security professionals. " +
        `Report generated: ${new Date().toLocaleString()}.`;
      y = wrapText(doc, footNote, margin, y, contentW, 5);

      // Save
      const filename = `BIA_FAIR_Report_${(selectedBia.title || "Report").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={generating || !fairMetrics}
      variant="outline"
      size="sm"
      className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200"
    >
      {generating ? (
        <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Generating PDF...</>
      ) : (
        <><FileDown className="w-3 h-3 mr-1.5" />Export PDF Report</>
      )}
    </Button>
  );
}