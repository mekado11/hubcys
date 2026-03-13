import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Loader2, FileType } from "lucide-react";
import { jsPDF } from "jspdf";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType
} from "docx";

// ─── PDF Export ────────────────────────────────────────────────────────────────

function exportToPdf(policy, companyName = "") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 20;
  const marginR = 20;
  const marginT = 20;
  const marginB = 20;
  const contentW = pageW - marginL - marginR;

  let y = marginT;

  const checkPageBreak = (needed = 8) => {
    if (y + needed > pageH - marginB) {
      doc.addPage();
      y = marginT;
      addPageFooter();
    }
  };

  const addPageFooter = () => {
    const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `${policy.title} | ${companyName} | Version 1.0 | INTERNAL`,
      pageW / 2, pageH - 8,
      { align: "center" }
    );
    doc.text(`Page ${pageNum}`, pageW - marginR, pageH - 8, { align: "right" });
  };

  // ── Cover Page ──────────────────────────────────────────────────────────────
  // Header bar
  doc.setFillColor(13, 71, 161);
  doc.rect(0, 0, pageW, 40, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text((companyName || "Organisation").toUpperCase(), pageW / 2, 18, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Information Security Policy", pageW / 2, 30, { align: "center" });

  // Policy title
  y = 60;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(13, 71, 161);
  const titleLines = doc.splitTextToSize(policy.title, contentW);
  doc.text(titleLines, pageW / 2, y, { align: "center" });
  y += titleLines.length * 10 + 6;

  // Divider
  doc.setDrawColor(13, 71, 161);
  doc.setLineWidth(0.8);
  doc.line(marginL, y, pageW - marginR, y);
  y += 10;

  // Meta table
  const metaData = [
    ["Document Owner", "Chief Information Security Officer (CISO)", "Classification", "Internal"],
    ["Effective Date", new Date().toLocaleDateString("en-GB"), "Next Review", new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB")],
    ["Version", "1.0", "Status", policy.status || "Draft"],
  ];

  const colW = contentW / 4;
  metaData.forEach(([k1, v1, k2, v2]) => {
    doc.setFillColor(240, 244, 255);
    doc.rect(marginL, y, contentW, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 58, 95);
    doc.text(k1, marginL + 3, y + 5.5);
    doc.text(k2, marginL + colW * 2 + 3, y + 5.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.text(v1, marginL + colW + 3, y + 5.5);
    doc.text(v2, marginL + colW * 3 + 3, y + 5.5);
    y += 8;
  });

  y += 14;
  addPageFooter();

  // ── Content Parsing ─────────────────────────────────────────────────────────
  const lines = policy.content.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Skip the header block already rendered on cover (lines like **Organisation:** etc.)
    if (
      line.startsWith("**Organisation:**") ||
      line.startsWith("**Policy ID:**") ||
      line.startsWith("**Owner:**")
    ) continue;

    // Blank line
    if (!line.trim()) {
      y += 3;
      continue;
    }

    // Horizontal rule
    if (line.trim() === "---") {
      checkPageBreak(6);
      doc.setDrawColor(200, 210, 230);
      doc.setLineWidth(0.3);
      doc.line(marginL, y, pageW - marginR, y);
      y += 5;
      continue;
    }

    // H1
    if (line.startsWith("# ")) {
      checkPageBreak(14);
      doc.setFillColor(13, 71, 161);
      doc.rect(marginL, y, contentW, 10, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      const text = line.replace(/^#\s*/, "").replace(/\*\*/g, "");
      doc.text(text, marginL + 3, y + 7);
      y += 14;
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      checkPageBreak(12);
      doc.setFillColor(21, 101, 192);
      doc.rect(marginL, y, contentW, 9, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      const text = line.replace(/^##\s*/, "").replace(/\*\*/g, "");
      doc.text(text, marginL + 3, y + 6.5);
      y += 13;
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      checkPageBreak(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(25, 118, 210);
      const text = line.replace(/^###\s*/, "").replace(/\*\*/g, "");
      doc.text(text, marginL, y + 5);
      y += 9;
      // underline
      doc.setDrawColor(25, 118, 210);
      doc.setLineWidth(0.3);
      doc.line(marginL, y, marginL + doc.getTextWidth(text), y);
      y += 3;
      continue;
    }

    // H4
    if (line.startsWith("#### ")) {
      checkPageBreak(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(51, 51, 51);
      const text = line.replace(/^####\s*/, "").replace(/\*\*/g, "");
      doc.text(text, marginL, y + 5);
      y += 8;
      continue;
    }

    // Table row (markdown | col | col |)
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const cells = line.split("|").filter(c => c.trim() && !c.trim().match(/^[-:]+$/));
      if (cells.length === 0) continue;
      checkPageBreak(7);
      const isHeader = lines[lines.indexOf(rawLine) + 1]?.trim().match(/^\|[-| :]+\|$/);
      const cellW = contentW / cells.length;
      if (isHeader) {
        doc.setFillColor(13, 71, 161);
        doc.rect(marginL, y, contentW, 7, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
      } else {
        doc.setFillColor(248, 250, 255);
        doc.rect(marginL, y, contentW, 7, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(50, 50, 50);
      }
      cells.forEach((cell, i) => {
        const cellText = doc.splitTextToSize(cell.trim().replace(/\*\*/g, ""), cellW - 4);
        doc.text(cellText[0] || "", marginL + cellW * i + 2, y + 5);
      });
      y += 7;
      continue;
    }

    // Skip separator rows |---|---|
    if (line.trim().match(/^\|[-| :]+\|$/)) continue;

    // Bullet
    if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      const text = line.trim().replace(/^[-•]\s*/, "").replace(/\*\*([^*]+)\*\*/g, "$1");
      const wrapped = doc.splitTextToSize(text, contentW - 8);
      checkPageBreak(wrapped.length * 5 + 2);
      doc.setFontSize(9.5);
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "normal");
      doc.text("•", marginL + 2, y + 4.5);
      doc.text(wrapped, marginL + 8, y + 4.5);
      y += wrapped.length * 5 + 2;
      continue;
    }

    // Regular paragraph — handle bold inline
    const cleaned = line.trim().replace(/\*\*([^*]+)\*\*/g, "$1");
    const wrapped = doc.splitTextToSize(cleaned, contentW);
    checkPageBreak(wrapped.length * 5 + 2);
    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    // Check if line was bold-heavy (req IDs like REQ-XX-XX)
    const isBold = /^\*\*REQ-|^\*\*[A-Z]/.test(line.trim());
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.text(wrapped, marginL, y + 4.5);
    y += wrapped.length * 5 + 2;
  }

  // Update all page footers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `${policy.title} | ${companyName} | Version 1.0 | INTERNAL`,
      pageW / 2, pageH - 8,
      { align: "center" }
    );
    doc.text(`Page ${i} of ${totalPages}`, pageW - marginR, pageH - 8, { align: "right" });
  }

  doc.save(`${policy.title.replace(/[^a-z0-9]/gi, "_")}_v1.0.pdf`);
}

// ─── DOCX Export ───────────────────────────────────────────────────────────────

function markdownToDocxParagraphs(content) {
  const paragraphs = [];
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) { paragraphs.push(new Paragraph({ text: "", spacing: { after: 80 } })); continue; }
    if (trimmed.startsWith("**Organisation:**") || trimmed.startsWith("**Policy ID:**") || trimmed.startsWith("**Owner:**")) continue;
    if (trimmed === "---") {
      paragraphs.push(new Paragraph({ border: { bottom: { color: "4A90D9", style: BorderStyle.SINGLE, size: 6 } }, text: "", spacing: { after: 160 } }));
      continue;
    }

    if (trimmed.startsWith("#### ")) {
      paragraphs.push(new Paragraph({ text: trimmed.replace(/^####\s*/, "").replace(/\*\*/g, ""), heading: HeadingLevel.HEADING_4, spacing: { before: 200, after: 100 } }));
    } else if (trimmed.startsWith("### ")) {
      paragraphs.push(new Paragraph({ text: trimmed.replace(/^###\s*/, "").replace(/\*\*/g, ""), heading: HeadingLevel.HEADING_3, spacing: { before: 240, after: 120 } }));
    } else if (trimmed.startsWith("## ")) {
      paragraphs.push(new Paragraph({ text: trimmed.replace(/^##\s*/, "").replace(/\*\*/g, ""), heading: HeadingLevel.HEADING_2, spacing: { before: 320, after: 160 } }));
    } else if (trimmed.startsWith("# ")) {
      paragraphs.push(new Paragraph({ text: trimmed.replace(/^#\s*/, "").replace(/\*\*/g, ""), heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      const text = trimmed.replace(/^[-•]\s*/, "").replace(/\*\*([^*]+)\*\*/g, "$1");
      paragraphs.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text, size: 22 })], spacing: { after: 60 } }));
    } else if (trimmed.match(/^\|[-| :]+\|$/)) {
      // skip md table separator
    } else if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed.split("|").filter(c => c.trim());
      const runs = cells.flatMap((c, i) => [
        new TextRun({ text: c.trim().replace(/\*\*/g, ""), bold: i === 0, size: 20 }),
        i < cells.length - 1 ? new TextRun({ text: "  |  ", size: 20, color: "888888" }) : null
      ]).filter(Boolean);
      paragraphs.push(new Paragraph({ children: runs, spacing: { after: 60 } }));
    } else {
      const runs = [];
      trimmed.split(/\*\*([^*]+)\*\*/g).forEach((part, i) => {
        if (part) runs.push(new TextRun({ text: part, bold: i % 2 === 1, size: 22 }));
      });
      paragraphs.push(new Paragraph({ children: runs.length ? runs : [new TextRun({ text: trimmed, size: 22 })], spacing: { after: 100 } }));
    }
  }
  return paragraphs;
}

async function exportToDocx(policy, companyName = "") {
  const today = new Date().toLocaleDateString("en-GB");
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB");

  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [
        new TableCell({ shading: { type: ShadingType.CLEAR, fill: "0D47A1" }, children: [new Paragraph({ children: [new TextRun({ text: "Document Owner", bold: true, size: 19, color: "FFFFFF" })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Chief Information Security Officer (CISO)", size: 19 })] })] }),
        new TableCell({ shading: { type: ShadingType.CLEAR, fill: "0D47A1" }, children: [new Paragraph({ children: [new TextRun({ text: "Classification", bold: true, size: 19, color: "FFFFFF" })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Internal", size: 19 })] })] }),
      ]}),
      new TableRow({ children: [
        new TableCell({ shading: { type: ShadingType.CLEAR, fill: "0D47A1" }, children: [new Paragraph({ children: [new TextRun({ text: "Effective Date", bold: true, size: 19, color: "FFFFFF" })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: today, size: 19 })] })] }),
        new TableCell({ shading: { type: ShadingType.CLEAR, fill: "0D47A1" }, children: [new Paragraph({ children: [new TextRun({ text: "Next Review", bold: true, size: 19, color: "FFFFFF" })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: nextYear, size: 19 })] })] }),
      ]}),
      new TableRow({ children: [
        new TableCell({ shading: { type: ShadingType.CLEAR, fill: "0D47A1" }, children: [new Paragraph({ children: [new TextRun({ text: "Version", bold: true, size: 19, color: "FFFFFF" })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "1.0", size: 19 })] })] }),
        new TableCell({ shading: { type: ShadingType.CLEAR, fill: "0D47A1" }, children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true, size: 19, color: "FFFFFF" })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: policy.status || "Draft", size: 19 })] })] }),
      ]}),
    ]
  });

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Calibri", size: 22, color: "1A1A2E" } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", run: { font: "Calibri", size: 34, bold: true, color: "0D47A1" }, paragraph: { spacing: { before: 400, after: 200 } } },
        { id: "Heading2", name: "Heading 2", run: { font: "Calibri", size: 28, bold: true, color: "1565C0" }, paragraph: { spacing: { before: 320, after: 160 } } },
        { id: "Heading3", name: "Heading 3", run: { font: "Calibri", size: 24, bold: true, color: "1976D2" }, paragraph: { spacing: { before: 240, after: 120 } } },
        { id: "Heading4", name: "Heading 4", run: { font: "Calibri", size: 22, bold: true, color: "333333" } },
      ]
    },
    sections: [{
      properties: {},
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (companyName || "Organisation").toUpperCase(), size: 52, bold: true, color: "0D47A1", font: "Calibri" })], spacing: { before: 800, after: 200 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: policy.title, size: 40, bold: true, color: "1A1A2E", font: "Calibri" })], spacing: { after: 200 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Information Security Policy", size: 24, color: "555555", font: "Calibri" })], spacing: { after: 400 } }),
        new Paragraph({ border: { bottom: { color: "0D47A1", style: BorderStyle.SINGLE, size: 12 } }, text: "", spacing: { after: 300 } }),
        metaTable,
        new Paragraph({ text: "", spacing: { after: 500 } }),
        ...markdownToDocxParagraphs(policy.content),
        new Paragraph({ border: { top: { color: "CCCCCC", style: BorderStyle.SINGLE, size: 4 } }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${policy.title} | ${companyName} | v1.0 | ${today} | INTERNAL`, size: 18, color: "888888", italics: true })], spacing: { before: 800 } }),
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${policy.title.replace(/[^a-z0-9]/gi, "_")}_v1.0.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PolicyExportButton({ policy, companyName, size = "sm", variant = "outline" }) {
  const [exporting, setExporting] = useState(null); // 'pdf' | 'docx' | null

  const handle = async (type) => {
    setExporting(type);
    try {
      if (type === "pdf") exportToPdf(policy, companyName);
      else await exportToDocx(policy, companyName);
    } catch (e) {
      console.error(`${type} export error:`, e);
      alert(`Export failed: ${e.message}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={!!exporting}
          className="border-gray-600 text-gray-300 hover:bg-gray-700 gap-1"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {size !== "icon" && <span>Export</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-slate-800 border-gray-700 text-white" align="end">
        <DropdownMenuItem
          onClick={() => handle("pdf")}
          disabled={exporting === "pdf"}
          className="cursor-pointer hover:bg-slate-700 gap-2"
        >
          {exporting === "pdf"
            ? <Loader2 className="w-4 h-4 animate-spin text-red-400" />
            : <FileType className="w-4 h-4 text-red-400" />}
          Download as PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-700" />
        <DropdownMenuItem
          onClick={() => handle("docx")}
          disabled={exporting === "docx"}
          className="cursor-pointer hover:bg-slate-700 gap-2"
        >
          {exporting === "docx"
            ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            : <FileText className="w-4 h-4 text-blue-400" />}
          Download as Word (.docx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}