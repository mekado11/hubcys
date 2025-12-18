
/* Deterministic BIA engine: mappings, composites, ALE, RTO/RPO, drivers, actions */
const IMPACT_MAPPING = {
  'Immediate (<1h)': 5,
  '1-4h': 4,
  '4-24h': 3,
  '1-3d': 2,
  '>3d': 1,

  'None/Unknown': 1,
  '<$10k/hr': 2,
  '$10-$50k/hr': 3,
  '$50-$250k/hr': 4,
  '$250k-$1M/hr': 5,
  '>$1M/hr': 5, // treat top band as max

  'None': 1,
  'Minor internal KPIs': 2,
  'Customer credits': 3,
  'Formal SLA penalties': 4,
  'Regulator/market disclosure': 5,

  '0-20%': 1,
  '21-40%': 2,
  '41-60%': 3,
  '61-80%': 4,
  '81-100%': 5,

  'Public': 1,
  'Internal': 2,
  'Confidential': 3,
  'Sensitive IP': 4,
  'Regulated (PII/PHI/Financial)': 5,

  'No': 1,
  'Only if >24h or material': 3,
  'Yes (immediate)': 5,

  'Contractual only': 2,
  'National regulator': 4,
  'Multi-jurisdiction (GDPR/SEC/SOX/DORA/NIS2)': 5,
};

const EXPOSURE_MAPPING = {
  'None': 1,
  'Some third-party': 3,
  'Full external control': 5,

  'Supported & patched': 1,
  'Mixed legacy': 3,
  'EOL core system': 5,

  'Unknown': 3,
  'Yes': 5,
  'No': 1,

  'Few with oversight': 3,
  'Many/critical without oversight': 5,
};

const IMPACT_COMPOSITE_WEIGHTS = {
  bia_impact_time_to_hurt: 0.15,
  bia_impact_revenue_loss_rate: 0.20,
  bia_impact_contract_exposure: 0.15,
  bia_impact_ops_dependency_share: 0.15,
  bia_data_classification: 0.15,
  bia_data_public_notice_required: 0.10,
  bia_data_regulatory_exposure: 0.10,
};

const LIKELIHOOD_COMPOSITE_WEIGHTS = {
  bia_exposure_vendor_control: 0.30,
  bia_exposure_legacy_status: 0.30,
  bia_exposure_single_point_of_failure: 0.20,
  bia_exposure_external_staff_access: 0.20,
};

const DEFAULTS = {
  revenueBandMidpoints: {
    'None/Unknown': 0,
    '<$10k/hr': 5000,
    '$10-$50k/hr': 30000,
    '$50-$250k/hr': 150000,
    '$250k-$1M/hr': 625000,
    '>$1M/hr': 1500000,
  },
  timeToHurtDowntimeHours: {
    'Immediate (<1h)': 6,
    '1-4h': 8,
    '4-24h': 12,
    '1-3d': 24,
    '>3d': 48,
  },
  defaultSlaPenalty: 50000,
  defaultRegulatoryReserve: 250000,
  defaultIncidentsPerYear: 1,
  breachReserveByClass: {
    confidential: 300000,
    regulated: 750000,
    ip: 1500000,
  }
};

export function computeImpactScore(data, weightsOverride = null) {
  let sum = 0;
  let w = 0;
  const weights = weightsOverride || IMPACT_COMPOSITE_WEIGHTS;
  for (const k in weights) {
    const weight = weights[k];
    let score = IMPACT_MAPPING[data[k]] || 0;
    sum += score * weight;
    w += weight;
  }
  return w ? Number((sum / w).toFixed(2)) : 1;
}

export function computeLikelihoodScore(data, weightsOverride = null) {
  let sum = 0;
  let w = 0;
  const weights = weightsOverride || LIKELIHOOD_COMPOSITE_WEIGHTS;
  for (const k in weights) {
    const weight = weights[k];
    const score = EXPOSURE_MAPPING[data[k]] || 0;
    sum += score * weight;
    w += weight;
  }
  return w ? Number((sum / w).toFixed(2)) : 1;
}

// helper to apply multipliers and renormalize to sum 1.0
function applyMultipliers(baseWeights, multipliers) {
  if (!multipliers) return baseWeights;
  const out = {};
  let total = 0;
  Object.keys(baseWeights).forEach(k => {
    const m = typeof multipliers[k] === "number" ? multipliers[k] : 1;
    out[k] = baseWeights[k] * m;
    total += out[k];
  });
  if (total > 0) {
    Object.keys(out).forEach(k => { out[k] = Number((out[k] / total).toFixed(4)); });
  }
  return out;
}

export function computeAnnualizedLoss(data) {
  const rate =
    typeof data.bia_impact_revenue_loss_rate_override === 'number'
      ? data.bia_impact_revenue_loss_rate_override
      : DEFAULTS.revenueBandMidpoints[data.bia_impact_revenue_loss_rate] || 0;

  const hours =
    typeof data.bia_override_expected_downtime_hours === 'number'
      ? data.bia_override_expected_downtime_hours
      : DEFAULTS.timeToHurtDowntimeHours[data.bia_impact_time_to_hurt] || 0;

  const downtimeLoss = rate * hours;

  let reserves = 0;
  if (data.bia_impact_contract_exposure === 'Formal SLA penalties') reserves += DEFAULTS.defaultSlaPenalty;
  if (data.bia_impact_contract_exposure === 'Regulator/market disclosure') reserves += DEFAULTS.defaultRegulatoryReserve;

  let breach = 0;
  if (data.bia_data_public_notice_required !== 'No') {
    if (data.bia_data_classification === 'Sensitive IP') breach = DEFAULTS.breachReserveByClass.ip;
    else if (data.bia_data_classification === 'Regulated (PII/PHI/Financial)') breach = DEFAULTS.breachReserveByClass.regulated;
    else if (data.bia_data_classification === 'Confidential') breach = DEFAULTS.breachReserveByClass.confidential;
  }

  const incidents =
    typeof data.bia_override_expected_incidents_per_year === 'number'
      ? data.bia_override_expected_incidents_per_year
      : DEFAULTS.defaultIncidentsPerYear;

  const perIncident = downtimeLoss + reserves + breach;
  return Number((perIncident * incidents).toFixed(0));
}

export function recommendRtoRpo(impact, likelihood) {
  if (impact >= 4 && likelihood >= 4) return { rtoHours: 4, rpoHours: 1, tier: 'Tier-1' };
  if (impact >= 4 && likelihood <= 3) return { rtoHours: 12, rpoHours: 4, tier: 'Tier-2' };
  return { rtoHours: 24, rpoHours: 24, tier: 'Tier-3' };
}

export function buildTopDrivers(data) {
  const drivers = [];

  // Impact highlights
  const impactOrdering = Object.keys(IMPACT_COMPOSITE_WEIGHTS)
    .map(k => ({ k, score: IMPACT_MAPPING[data[k]] || 0, w: IMPACT_COMPOSITE_WEIGHTS[k], v: data[k] }))
    .filter(x => x.score > 1)
    .sort((a, b) => (b.score * b.w) - (a.score * a.w))
    .slice(0, 3);

  impactOrdering.forEach(d => {
    const label = d.k.replace(/^bia_/, '').replace(/_/g, ' ');
    drivers.push(`${label}: ${d.v}`);
  });

  // Likelihood highlights (all >1)
  Object.keys(LIKELIHOOD_COMPOSITE_WEIGHTS).forEach(k => {
    const sc = EXPOSURE_MAPPING[data[k]] || 0;
    if (sc > 1) {
      const label = k.replace(/^bia_/, '').replace(/_/g, ' ');
      drivers.push(`${label}: ${data[k]}`);
    }
  });

  return drivers.join(', ');
}

export function generateActionPlan(impact, likelihood, topDrivers) {
  const plan = { '30_day': [], '90_day': [], '6-12_months': [] };
  const d = (topDrivers || '').toLowerCase();

  if (impact >= 4 && likelihood >= 4) {
    plan['30_day'].push('Address single points of failure and enable MFA for admin paths immediately.');
    plan['30_day'].push('Ringfence EOL systems; add compensating controls and monitoring.');
    plan['90_day'].push('Run a tabletop on this process; validate recovery runbooks end-to-end.');
    plan['6-12_months'].push('Refactor platform to reduce foreign/vendor control over core components.');
  } else if (impact >= 4) {
    plan['30_day'].push('Test backups and failover; ensure offsite recovery works.');
    plan['90_day'].push('Harden access controls and DLP around the critical process.');
  } else if (likelihood >= 4) {
    plan['30_day'].push('Patch known legacy components and reduce privileged external accounts.');
    plan['90_day'].push('Engineer redundancy to remove single points of failure.');
  }

  if (d.includes('data classification: regulated') && d.includes('public notice required: yes')) {
    plan['30_day'].push('Review incident communications and counsel approval workflow for regulated disclosures.');
  }
  if (d.includes('time to hurt: immediate')) {
    plan['30_day'].push('Automate recovery steps and rehearse rapid response for sub-1h outages.');
  }
  return plan;
}

export function runBIA(data, riskProfile = null) {
  // derive weights with optional multipliers
  let impactWeights = IMPACT_COMPOSITE_WEIGHTS;
  let likelihoodWeights = LIKELIHOOD_COMPOSITE_WEIGHTS;

  try {
    const profile = typeof riskProfile === "string" ? JSON.parse(riskProfile) : riskProfile;
    if (profile && typeof profile === "object") {
      impactWeights = applyMultipliers(IMPACT_COMPOSITE_WEIGHTS, profile.impactWeightMultipliers);
      likelihoodWeights = applyMultipliers(LIKELIHOOD_COMPOSITE_WEIGHTS, profile.likelihoodWeightMultipliers);
    }
  } catch { /* ignore invalid JSON */ }

  const impact = computeImpactScore(data, impactWeights);
  const likelihood = computeLikelihoodScore(data, likelihoodWeights);
  const riskScore = Number((impact * likelihood).toFixed(2));
  const annualizedLoss = computeAnnualizedLoss(data);
  const { rtoHours, rpoHours, tier } = recommendRtoRpo(impact, likelihood);
  const topDrivers = buildTopDrivers(data);
  const actionPlan = generateActionPlan(impact, likelihood, topDrivers);

  return { impact, likelihood, riskScore, annualizedLoss, rtoHours, rpoHours, rtoRpoTier: tier, topDrivers, actionPlan };
}
