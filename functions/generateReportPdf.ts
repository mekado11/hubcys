import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';
import { jsPDF } from 'npm:jspdf@2.5.1';

// Rate limiting tracking
const rateLimitTracker = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3; // Reduced from 5 to 3 for more conservative rate limiting

// Enhanced helper functions
function safeParseJSON(str) {
  if (!str) return null;
  try { 
    return typeof str === 'string' ? JSON.parse(str) : str; 
  } catch (e) {
    console.warn('Failed to parse JSON:', e.message);
    return null;
  }
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight) {
  if (!text) return y;
  try {
    const lines = doc.splitTextToSize(String(text), maxWidth);
    lines.forEach((line) => {
      if (y > 280) { // Near bottom of page
        doc.addPage();
        y = 20;
      }
      doc.text(line, x, y);
      y += lineHeight;
    });
    return y;
  } catch (error) {
    console.error('Error in addWrappedText:', error);
    return y + lineHeight;
  }
}

function toTitleCase(str) {
  if (!str) return '';
  return String(str).replace(/[_-]/g, ' ').replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

function formatDate(dateStr) {
  try {
    const date = dateStr ? new Date(dateStr) : new Date();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Error formatting date:', error);
    return new Date().toLocaleDateString();
  }
}

// Enhanced markdown processing for PDF
function processMarkdownForPDF(text) {
  if (!text) return '';
  
  try {
    // Clean text and handle encoding issues
    let cleaned = String(text)
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Fix common encoding issues from LLM outputs
      .replace(/â€¢/g, '•')
      .replace(/â€"/g, '–')
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"')
      .replace(/ï¿½/g, '•')
      // Remove problematic characters that can break jsPDF
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
      
    return cleaned;
  } catch (error) {
    console.error('Error processing markdown:', error);
    return String(text || '').substring(0, 1000); // Fallback with length limit
  }
}

function addMarkdownText(doc, text, x, y, maxWidth, lineHeight) {
  if (!text) return y;
  
  try {
    const processed = processMarkdownForPDF(text);
    const lines = processed.split('\n');
    
    for (let line of lines) {
      if (!line.trim()) {
        y += lineHeight * 0.3; // Smaller spacing for empty lines
        continue;
      }
      
      // Check page break
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      // Handle bold text **text**
      if (line.includes('**')) {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        let currentX = x;
        
        for (let part of parts) {
          if (part.startsWith('**') && part.endsWith('**')) {
            // Bold text
            const boldText = part.slice(2, -2);
            doc.setFont('helvetica', 'bold');
            const textWidth = doc.getTextWidth(boldText);
            if (currentX + textWidth > x + maxWidth) {
              y += lineHeight;
              currentX = x;
              if (y > 270) {
                doc.addPage();
                y = 20;
              }
            }
            doc.text(boldText, currentX, y);
            currentX += textWidth;
            doc.setFont('helvetica', 'normal');
          } else if (part) {
            // Regular text
            const textWidth = doc.getTextWidth(part);
            if (currentX + textWidth > x + maxWidth) {
              y += lineHeight;
              currentX = x;
              if (y > 270) {
                doc.addPage();
                y = 20;
              }
            }
            doc.text(part, currentX, y);
            currentX += textWidth;
          }
        }
        y += lineHeight;
      } else {
        // Handle bullet points and regular text
        if (line.trim().startsWith('*') || line.trim().startsWith('-')) {
          // Bullet point
          const bulletText = line.trim().substring(1).trim();
          doc.text('•', x, y);
          y = addWrappedText(doc, bulletText, x + 12, y, maxWidth - 12, lineHeight);
        } else {
          // Regular wrapped text
          y = addWrappedText(doc, line, x, y, maxWidth, lineHeight);
        }
      }
    }
    
    return y;
  } catch (error) {
    console.error('Error adding markdown text:', error);
    // Fallback to plain text
    return addWrappedText(doc, String(text).substring(0, 500), x, y, maxWidth, lineHeight);
  }
}

// Enhanced rate limiting check
function checkRateLimit(userId) {
  const now = Date.now();
  const userKey = `pdf_${userId}`;
  
  if (!rateLimitTracker.has(userKey)) {
    rateLimitTracker.set(userKey, []);
  }
  
  const userRequests = rateLimitTracker.get(userKey);
  
  // Remove old requests outside the window
  const validRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (validRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    console.warn(`Rate limit exceeded for user ${userId}. ${validRequests.length} requests in last minute.`);
    return false; // Rate limit exceeded
  }
  
  // Add current request
  validRequests.push(now);
  rateLimitTracker.set(userKey, validRequests);
  
  console.log(`Rate limit check passed for user ${userId}. ${validRequests.length}/${MAX_REQUESTS_PER_WINDOW} requests used.`);
  return true; // OK to proceed
}

Deno.serve(async (req) => {
  let user = null;
  let assessmentId = null;
  
  try {
    // Create base44 client
    const base44 = createClientFromRequest(req);
    user = await base44.auth.me();
    
    if (!user) {
      console.error('Unauthorized PDF generation attempt');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`PDF generation request from user: ${user.email}`);

    // Check rate limit
    if (!checkRateLimit(user.id || user.email)) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded', 
        details: `Please wait before generating another PDF. Maximum ${MAX_REQUESTS_PER_WINDOW} reports per minute allowed.`
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Invalid request body:', error);
      return new Response(JSON.stringify({ 
        error: 'Invalid request', 
        details: 'Request body must be valid JSON'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    assessmentId = body?.assessmentId;
    const customizations = body?.customizations || {};
    
    if (!assessmentId) {
      console.error('Missing assessmentId in request');
      return new Response(JSON.stringify({ 
        error: 'Missing assessmentId', 
        details: 'assessmentId is required in request body'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generating PDF for assessment: ${assessmentId}`);

    // Fetch assessment data
    let assessment;
    try {
      assessment = await base44.entities.Assessment.get(assessmentId);
      if (!assessment) {
        console.error(`Assessment not found: ${assessmentId}`);
        return new Response(JSON.stringify({ 
          error: 'Assessment not found', 
          details: `No assessment found with ID: ${assessmentId}`
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      console.error('Error fetching assessment:', error);
      return new Response(JSON.stringify({ 
        error: 'Database error', 
        details: 'Failed to retrieve assessment data'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate assessment belongs to user's company
    if (assessment.company_id !== user.company_id) {
      console.error(`Access denied: Assessment ${assessmentId} belongs to different company`);
      return new Response(JSON.stringify({ 
        error: 'Access denied', 
        details: 'You can only generate PDFs for assessments from your company'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Assessment data retrieved successfully for: ${assessment.company_name}`);

    // Create PDF document
    let doc;
    try {
      doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      console.log('jsPDF document created successfully');
    } catch (error) {
      console.error('Error creating jsPDF document:', error);
      return new Response(JSON.stringify({ 
        error: 'PDF creation failed', 
        details: 'Failed to initialize PDF document'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate PDF content with enhanced error handling
    try {
      // Set up fonts and colors
      doc.setFont('helvetica');
      
      // Header
      doc.setFontSize(24);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text('Cybersecurity Assessment Report', 20, 30);
      
      // Company name
      doc.setFontSize(18);
      doc.setTextColor(6, 182, 212); // cyan-500
      doc.text(assessment.company_name || 'Unknown Company', 20, 45);
      
      // Date and framework
      doc.setFontSize(12);
      doc.setTextColor(107, 114, 128); // gray-500
      const reportDate = formatDate(assessment.created_date);
      doc.text(`Generated on: ${reportDate}`, 20, 55);
      
      if (assessment.framework) {
        const frameworkDisplay = toTitleCase(assessment.framework);
        doc.text(`Framework: ${frameworkDisplay}`, 20, 62);
      }
      
      // Overall score section
      let yPos = 80;
      
      doc.setFontSize(16);
      doc.setTextColor(51, 65, 85);
      doc.text('Executive Summary', 20, yPos);
      yPos += 15;
      
      // Score display
      doc.setFontSize(14);
      doc.text('Overall Security Score:', 20, yPos);
      doc.setFontSize(20);
      doc.setTextColor(6, 182, 212);
      doc.text(`${assessment.overall_score || 0}%`, 80, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.setTextColor(107, 114, 128);
      doc.text(`Maturity Level: ${assessment.maturity_level || 'Not Assessed'}`, 20, yPos);
      yPos += 20;

      // Smart Analysis section (if available)
      const parsedAnalysis = safeParseJSON(assessment.smart_analysis);
      if (parsedAnalysis?.executive_summary) {
        doc.setFontSize(16);
        doc.setTextColor(51, 65, 85);
        doc.text('AI-Generated Analysis', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        doc.setTextColor(75, 85, 99);
        
        // Add each section of executive summary
        const summary = parsedAnalysis.executive_summary;
        
        if (summary.overview) {
          doc.setFont('helvetica', 'bold');
          doc.text('Overview:', 20, yPos);
          doc.setFont('helvetica', 'normal');
          yPos += 5;
          yPos = addMarkdownText(doc, summary.overview, 20, yPos, 170, 4);
          yPos += 5;
        }
        
        if (summary.identified_gaps) {
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }
          doc.setFont('helvetica', 'bold');
          doc.text('Key Gaps Identified:', 20, yPos);
          doc.setFont('helvetica', 'normal');
          yPos += 5;
          yPos = addMarkdownText(doc, summary.identified_gaps, 20, yPos, 170, 4);
          yPos += 5;
        }
        
        if (summary.recommendations) {
          if (yPos > 230) {
            doc.addPage();
            yPos = 20;
          }
          doc.setFont('helvetica', 'bold');
          doc.text('Strategic Recommendations:', 20, yPos);
          doc.setFont('helvetica', 'normal');
          yPos += 5;
          yPos = addMarkdownText(doc, summary.recommendations, 20, yPos, 170, 4);
        }
      }

      // Domain scores section
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      
      yPos += 15;
      doc.setFontSize(16);
      doc.setTextColor(51, 65, 85);
      doc.text('Security Domain Scores', 20, yPos);
      yPos += 15;
      
      const domains = [
        { key: 'maturity_identity', name: 'Identity & Access Management' },
        { key: 'maturity_asset_management', name: 'Asset Management' },
        { key: 'maturity_infra_security', name: 'Infrastructure Security' },
        { key: 'maturity_app_security', name: 'Application Security' },
        { key: 'maturity_third_party_risk', name: 'Third-Party Risk' },
        { key: 'maturity_incident_response', name: 'Incident Response' },
        { key: 'maturity_governance_risk', name: 'Governance & Risk' },
        { key: 'maturity_data_protection', name: 'Data Protection' },
        { key: 'maturity_security_training', name: 'Security Training' },
        { key: 'maturity_cloud_security', name: 'Cloud Security' }
      ];
      
      doc.setFontSize(10);
      domains.forEach(domain => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        const naKey = `${domain.key}_na`;
        const isNA = assessment[naKey];
        const score = isNA ? 'N/A' : `${assessment[domain.key] || 0}/5`;
        
        doc.setTextColor(75, 85, 99);
        doc.text(domain.name, 20, yPos);
        doc.setTextColor(6, 182, 212);
        doc.text(score, 150, yPos);
        yPos += 6;
      });

      console.log('PDF content generated successfully');

    } catch (error) {
      console.error('Error generating PDF content:', error);
      console.error('Error stack:', error.stack);
      return new Response(JSON.stringify({ 
        error: 'PDF generation failed', 
        details: `Error during PDF content creation: ${error.message}`
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate and return PDF
    try {
      const pdfArrayBuffer = doc.output('arraybuffer');
      console.log(`PDF generated successfully. Size: ${pdfArrayBuffer.byteLength} bytes`);

      return new Response(pdfArrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="FortiGaP_Report_${assessment.company_name?.replace(/\s+/g, '_') || 'Assessment'}.pdf"`
        }
      });

    } catch (error) {
      console.error('Error outputting PDF:', error);
      return new Response(JSON.stringify({ 
        error: 'PDF output failed', 
        details: 'Failed to generate PDF binary data'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Unexpected error in PDF generation:', error);
    console.error('Error stack:', error.stack);
    
    // Log additional context for debugging
    if (user) {
      console.error(`User context: ${user.email}, Company: ${user.company_id}`);
    }
    if (assessmentId) {
      console.error(`Assessment context: ${assessmentId}`);
    }
    
    return new Response(JSON.stringify({ 
      error: 'Unexpected server error', 
      details: 'An unexpected error occurred during PDF generation. Please try again or contact support.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});