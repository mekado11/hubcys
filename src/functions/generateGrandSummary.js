/**
 * generateGrandSummary — AI-generated executive grand summary for a security assessment.
 *
 * Fetches the assessment from Firestore, calls InvokeLLM, and writes the result
 * back to the assessment document.
 *
 * @param {object} params
 * @param {string} params.assessmentId  Firestore document ID of the assessment
 * @returns {{ status: number, data: { grand_summary: string } }}
 */
import { Assessment } from '@/entities/Assessment';
import { InvokeLLM } from '@/integrations/Core';

export const generateGrandSummary = async ({ assessmentId }) => {
  if (!assessmentId) throw new Error('generateGrandSummary: assessmentId is required');

  // Fetch assessment data
  const assessment = await Assessment.get(assessmentId);
  if (!assessment) throw new Error('Assessment not found');

  const companyName  = assessment.company_name || 'the organisation';
  const industry     = assessment.industry_sector || 'technology';
  const employees    = assessment.company_size || 'unknown size';
  const overallScore = typeof assessment.overall_score === 'number'
    ? `${assessment.overall_score}%`
    : 'not yet scored';
  const maturity = assessment.maturity_level || 'Beginner';

  // Build domain scores summary
  const domains = [
    { label: 'Endpoint Security',         score: assessment.endpoint_security_score },
    { label: 'Data & Monitoring',          score: assessment.data_monitoring_score },
    { label: 'Identity & Access',          score: assessment.identity_access_score },
    { label: 'Governance & Compliance',    score: assessment.governance_score },
    { label: 'Incident Response',          score: assessment.incident_response_score },
    { label: 'Vulnerability Management',   score: assessment.vulnerability_management_score },
  ].filter(d => d.score !== undefined && d.score !== null);

  const domainText = domains.length > 0
    ? domains.map(d => `- ${d.label}: ${d.score}%`).join('\n')
    : 'Domain scores not yet captured.';

  const prompt = `You are a senior cybersecurity consultant. Generate a comprehensive Grand Summary Report for ${companyName}.

ASSESSMENT DETAILS:
- Industry: ${industry}
- Size: ${employees} employees
- Overall Security Score: ${overallScore}
- Maturity Level: ${maturity}

DOMAIN SCORES:
${domainText}

ADDITIONAL CONTEXT:
${assessment.description || 'No additional context provided.'}

Write a professional Grand Summary in Markdown format with these sections:

## Executive Summary
A 2-3 paragraph executive-level overview of the organisation's current security posture, key strengths, and critical gaps.

## Key Strengths
3-5 bullet points highlighting what the organisation is doing well.

## Critical Gaps & Risks
3-5 bullet points of the most significant security gaps and associated risks.

## Prioritised Recommendations
Numbered list of the top 5-7 actionable recommendations, ordered by impact/urgency.

## Maturity Roadmap
A brief 12-month roadmap with phases: Immediate (0-30 days), Short-term (1-3 months), Medium-term (3-12 months).

## Compliance Notes
Brief notes on relevant regulatory considerations (GDPR, NIS2, ISO 27001, etc.) based on the industry.

Keep the tone professional, specific to the data, and actionable.`;

  const grandSummaryText = await InvokeLLM({
    prompt,
    feature: 'smart_analysis',
  });

  const grand_summary = typeof grandSummaryText === 'string'
    ? grandSummaryText
    : JSON.stringify(grandSummaryText);

  // Write back to Firestore
  await Assessment.update(assessmentId, { grand_summary });

  return { status: 200, data: { grand_summary } };
};
