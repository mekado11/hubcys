/**
 * computeBia — runs FAIR-based BIA calculations client-side.
 * Uses the biaEngine to score each BIA item, aggregates FAIR metrics,
 * saves results back to Firestore, and returns the updated BIA record.
 */
import { BIA } from '@/entities/BIA';
import { Assessment } from '@/entities/Assessment';
import { runBIA } from '@/components/bia/biaEngine';

// Industry benchmark annualised loss ranges by risk tier (USD)
const BENCHMARKS = {
  'Tier-1': { p25: 200000,  p50: 750000,  p75: 2500000,  label: 'Critical' },
  'Tier-2': { p25: 50000,   p50: 200000,  p75: 750000,   label: 'High'     },
  'Tier-3': { p25: 10000,   p50: 50000,   p75: 200000,   label: 'Moderate' },
};

export const computeBia = async ({ biaId, assessmentId }) => {
  if (!biaId) throw new Error('biaId is required.');

  // Load BIA record via entity (uses correct Firestore collection)
  const biaData = await BIA.get(biaId);
  if (!biaData) throw new Error(`BIA record ${biaId} not found.`);

  // Load linked assessment risk profile (optional)
  let riskProfile = null;
  if (assessmentId) {
    try {
      const assessment = await Assessment.get(assessmentId);
      if (assessment) riskProfile = assessment.risk_profile || null;
    } catch (_) { /* non-fatal */ }
  }

  // Parse BIA items
  let items = [];
  try { items = JSON.parse(biaData.bia_items || '[]'); } catch (_) { items = []; }

  if (!items.length) {
    return { status: 400, message: 'No BIA items found. Add at least one process before calculating.' };
  }

  // Run FAIR engine on each item
  const scoredItems = items.map(item => {
    const result = runBIA(item, riskProfile);
    return { ...item, ...result };
  });

  // Aggregate: highest-risk item drives the summary
  const topItem = [...scoredItems].sort((a, b) => b.riskScore - a.riskScore)[0];
  const totalALE = scoredItems.reduce((s, i) => s + (i.annualizedLoss || 0), 0);
  const avgImpact = scoredItems.reduce((s, i) => s + (i.impact || 0), 0) / scoredItems.length;
  const avgLikelihood = scoredItems.reduce((s, i) => s + (i.likelihood || 0), 0) / scoredItems.length;

  const tier = topItem.rtoRpoTier || 'Tier-3';
  const bench = BENCHMARKS[tier] || BENCHMARKS['Tier-3'];

  const fairMetrics = {
    lef:              Number(avgLikelihood.toFixed(2)),  // Loss Event Frequency proxy
    lm:               totalALE,                           // Loss Magnitude (annualised)
    risk_score:       Number(topItem.riskScore.toFixed(2)),
    impact_score:     Number(avgImpact.toFixed(2)),
    likelihood_score: Number(avgLikelihood.toFixed(2)),
    ale:              totalALE,
    rto_hours:        topItem.rtoHours,
    rpo_hours:        topItem.rpoHours,
    rto_rpo_tier:     tier,
    top_drivers:      topItem.topDrivers || '',
    action_plan:      topItem.actionPlan  || {},
    items_count:      scoredItems.length,
  };

  const industryBenchmarks = {
    tier,
    label:       bench.label,
    p25:         bench.p25,
    p50:         bench.p50,
    p75:         bench.p75,
    our_ale:     totalALE,
    vs_median:   totalALE > bench.p50 ? 'above' : totalALE < bench.p25 ? 'below' : 'within',
  };

  // Persist results back to Firestore via entity (uses correct collection)
  await BIA.update(biaId, {
    fair_metrics:        JSON.stringify(fairMetrics),
    industry_benchmarks: JSON.stringify(industryBenchmarks),
    bia_items:           JSON.stringify(scoredItems),
    status:              'calculated',
  });

  const updatedBia = {
    ...biaData,
    fair_metrics:       JSON.stringify(fairMetrics),
    industry_benchmarks: JSON.stringify(industryBenchmarks),
    bia_items:          JSON.stringify(scoredItems),
    status:             'calculated',
  };

  return { status: 200, data: { bia: updatedBia } };
};
