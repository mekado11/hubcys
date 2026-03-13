import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Loader2 } from "lucide-react";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType
} from "docx";

function markdownToDocxParagraphs(content) {
  const lines = content.split("\n");
  const paragraphs = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      paragraphs.push(new Paragraph({ text: "", spacing: { after: 80 } }));
      continue;
    }

    // Headings
    if (trimmed.startsWith("#### ")) {
      paragraphs.push(new Paragraph({
        text: trimmed.replace(/^####\s*\*?\*?/, "").replace(/\*?\*?$/, ""),
        heading: HeadingLevel.HEADING_4,
        spacing: { before: 200, after: 100 }
      }));
    } else if (trimmed.startsWith("### ")) {
      paragraphs.push(new Paragraph({
        text: trimmed.replace(/^###\s*\*?\*?/, "").replace(/\*?\*?$/, ""),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 240, after: 120 }
      }));
    } else if (trimmed.startsWith("## ")) {
      paragraphs.push(new Paragraph({
        text: trimmed.replace(/^##\s*\*?\*?/, "").replace(/\*?\*?$/, ""),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 320, after: 160 }
      }));
    } else if (trimmed.startsWith("# ")) {
      paragraphs.push(new Paragraph({
        text: trimmed.replace(/^#\s*\*?\*?/, "").replace(/\*?\*?$/, ""),
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }));
    }
    // Bullet / list items
    else if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      const text = trimmed.replace(/^[-•]\s*/, "").replace(/\*\*([^*]+)\*\*/g, "$1");
      paragraphs.push(new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text, size: 22 })],
        spacing: { after: 60 }
      }));
    } else if (/^\d+\.\s/.test(trimmed)) {
      const text = trimmed.replace(/^\d+\.\s*/, "").replace(/\*\*([^*]+)\*\*/g, "$1");
      paragraphs.push(new Paragraph({
        numbering: { reference: "default-numbering", level: 0 },
        children: [new TextRun({ text, size: 22 })],
        spacing: { after: 60 }
      }));
    }
    // Horizontal rule
    else if (trimmed === "---" || trimmed === "─────────────────────────────────────────") {
      paragraphs.push(new Paragraph({
        border: { bottom: { color: "4A90D9", style: BorderStyle.SINGLE, size: 6 } },
        text: "",
        spacing: { after: 160 }
      }));
    }
    // Normal paragraph with possible bold
    else {
      const runs = [];
      const parts = trimmed.split(/\*\*([^*]+)\*\*/g);
      parts.forEach((part, i) => {
        if (part) runs.push(new TextRun({ text: part, bold: i % 2 === 1, size: 22 }));
      });
      paragraphs.push(new Paragraph({
        children: runs.length ? runs : [new TextRun({ text: trimmed, size: 22 })],
        spacing: { after: 100 }
      }));
    }
  }

  return paragraphs;
}

async function exportToDocx(policy, companyName = "") {
  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Policy ID", bold: true, size: 20 })] })], shading: { type: ShadingType.CLEAR, fill: "1E3A5F" } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ISP", size: 20, color: "FFFFFF" })] })], shading: { type: ShadingType.CLEAR, fill: "1E3A5F" } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Version", bold: true, size: 20 })] })], shading: { type: ShadingType.CLEAR, fill: "1E3A5F" } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "1.0", size: 20, color: "FFFFFF" })] })], shading: { type: ShadingType.CLEAR, fill: "1E3A5F" } }),
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Owner", bold: true, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Chief Information Security Officer (CISO)", size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Classification", bold: true, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Internal", size: 20 })] })] }),
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Effective Date", bold: true, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: new Date().toLocaleDateString("en-GB"), size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Next Review", bold: true, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString("en-GB"), size: 20 })] })] }),
        ]
      }),
    ]
  });

  const doc = new Document({
    numbering: {
      config: [{
        reference: "default-numbering",
        levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.LEFT }]
      }]
    },
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22, color: "1A1A2E" } },
      },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", run: { font: "Calibri", size: 36, bold: true, color: "0D47A1" }, paragraph: { spacing: { before: 400, after: 200 } } },
        { id: "Heading2", name: "Heading 2", run: { font: "Calibri", size: 28, bold: true, color: "1565C0" }, paragraph: { spacing: { before: 320, after: 160 } } },
        { id: "Heading3", name: "Heading 3", run: { font: "Calibri", size: 24, bold: true, color: "1976D2" }, paragraph: { spacing: { before: 240, after: 120 } } },
        { id: "Heading4", name: "Heading 4", run: { font: "Calibri", size: 22, bold: true, color: "333333" } },
      ]
    },
    sections: [{
      properties: {},
      children: [
        // Cover block
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: (companyName || "Organisation").toUpperCase(), size: 48, bold: true, color: "0D47A1", font: "Calibri" })],
          spacing: { before: 600, after: 200 }
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: policy.title, size: 40, bold: true, color: "1A1A2E", font: "Calibri" })],
          spacing: { after: 400 }
        }),
        new Paragraph({
          border: { bottom: { color: "0D47A1", style: BorderStyle.SINGLE, size: 12 } },
          text: "",
          spacing: { after: 300 }
        }),
        metaTable,
        new Paragraph({ text: "", spacing: { after: 400 } }),
        ...markdownToDocxParagraphs(policy.content),
        // Footer
        new Paragraph({
          border: { top: { color: "CCCCCC", style: BorderStyle.SINGLE, size: 4 } },
          children: [new TextRun({ text: `${policy.title} | ${companyName} | Version 1.0 | ${new Date().toLocaleDateString("en-GB")} | INTERNAL`, size: 18, color: "888888", italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 600 }
        })
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

function exportToMarkdown(policy) {
  const blob = new Blob([policy.content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${policy.title.replace(/[^a-z0-9]/gi, "_")}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PolicyExportButton({ policy, companyName, size = "sm" }) {
  const [exporting, setExporting] = useState(false);

  const handleDocx = async () => {
    setExporting(true);
    try {
      await exportToDocx(policy, companyName);
    } catch (e) {
      console.error("DOCX export error:", e);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          disabled={exporting}
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-slate-800 border-gray-700 text-white">
        <DropdownMenuItem onClick={handleDocx} className="cursor-pointer hover:bg-slate-700">
          <FileText className="w-4 h-4 mr-2 text-blue-400" />
          Download as Word (.docx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToMarkdown(policy)} className="cursor-pointer hover:bg-slate-700">
          <FileText className="w-4 h-4 mr-2 text-gray-400" />
          Download as Markdown (.md)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}