import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { biaId, assessmentId } = await req.json();

    if (!biaId) {
      return Response.json({ error: 'biaId is required' }, { status: 400 });
    }

    // Fetch the BIA record
    const bia = await base44.entities.BIA.get(biaId);
    if (!bia) {
      return Response.json({ error: 'BIA not found' }, { status: 404 });
    }

    // Fetch linked assessment if provided
    let assessment = null;
    if (assessmentId || bia.linked_assessment_id) {
      const aId = assessmentId || bia.linked_assessment_id;
      assessment = await base44.entities.Assessment.get(aId);
    }

    // Fetch relevant breach case studies
    const breachCases = await base44.entities.BreachCaseStudy.filter({}, '-breach_date', 100);

    // Parse BIA items
    let biaItems = [];
    try {
      biaItems = bia.bia_items ? JSON.parse(bia.bia_items) : [];
    } catch (e) {
      console.warn('Failed to parse bia_items:', e);
      biaItems = [];
    }

    // Calculate control effectiveness from assessment
    const controlEffectiveness = calculateControlEffectiveness(assessment);
    const externalThreatScore = assessment?.surface_exposure_score || 0;

    // Get industry benchmarks, scaled to company revenue
    const industryBenchmarks = getIndustryBenchmarks(assessment?.industry_sector || 'Other', bia.annual_revenue, bia.employee_count);

    // Process each BIA item with FAIR methodology
    const processedItems = biaItems.map(item => 
      processBiaItemWithFAIR(
        item,
        item.inputs || {},
        {},
        assessment,
        controlEffectiveness,
        externalThreatScore,
        industryBenchmarks,
        breachCases || [],
        base44
      )
    );

    // Calculate aggregated FAIR metrics
    const fairMetrics = calculateAggregatedFAIRMetrics(processedItems);

    // Update BIA record with results
    const updatedBia = await base44.entities.BIA.update(biaId, {
      bia_items: JSON.stringify(processedItems),
      fair_metrics: JSON.stringify(fairMetrics),
      industry_benchmarks: JSON.stringify(industryBenchmarks),
      control_effectiveness_score: controlEffectiveness,
      external_threat_score: externalThreatScore,
      bia_last_calculated_date: new Date().toISOString()
    });

    return Response.json({
      bia: updatedBia,
      fair_metrics: fairMetrics,
      industry_benchmarks: industryBenchmarks
    }, { status: 200 });

  } catch (error) {
    console.error('computeBia error:', error);
    return Response.json({ 
      error: error.message || 'Internal server error',
      details: error.stack
    }, { status: 500 });
  }
});

// Calculate control effectiveness from assessment maturity scores
function calculateControlEffectiveness(assessment) {
  if (!assessment) return 50; // Default mid-range

  const maturityFields = [
    'maturity_identity',
    'maturity_asset_management',
    'maturity_infra_security',
    'maturity_app_security',
    'maturity_third_party_risk',
    'maturity_incident_response',
    'maturity_governance_risk',
    'maturity_data_protection',
    'maturity_cloud_security'
  ];

  const scores = maturityFields
    .map(field => assessment[field])
    .filter(score => typeof score === 'number' && score > 0);

  if (scores.length === 0) return 50;

  const avgMaturity = scores.reduce((a, b) => a + b, 0) / scores.length;
  return (avgMaturity / 5) * 100; // Convert 0-5 scale to 0-100
}

// Get industry-specific benchmarks, scaled to the company's actual revenue
function getIndustryBenchmarks(sector, annualRevenue, employeeCount) {
  // Base ratios (downtime cost as % of hourly revenue, using industry multipliers)
  const sectorProfiles = {
    Healthcare:          { breach_freq: 0.35, cost_per_record: 408, downtime_pct: 0.0025, ransomware: 0.42 },
    Financial_Services:  { breach_freq: 0.28, cost_per_record: 321, downtime_pct: 0.0030, ransomware: 0.38 },
    Technology:          { breach_freq: 0.32, cost_per_record: 285, downtime_pct: 0.0020, ransomware: 0.35 },
    Manufacturing:       { breach_freq: 0.25, cost_per_record: 245, downtime_pct: 0.0022, ransomware: 0.40 },
    Retail:              { breach_freq: 0.30, cost_per_record: 298, downtime_pct: 0.0018, ransomware: 0.36 },
    Government:          { breach_freq: 0.20, cost_per_record: 195, downtime_pct: 0.0012, ransomware: 0.45 },
    Other:               { breach_freq: 0.25, cost_per_record: 250, downtime_pct: 0.0018, ransomware: 0.30 }
  };

  const profile = sectorProfiles[sector] || sectorProfiles.Other;

  // If the user provided their annual revenue, derive a realistic hourly downtime cost.
  // Otherwise fall back to a very conservative SMB default ($1,000/hr) instead of $100k/hr.
  let downtimeCostPerHour;
  if (annualRevenue && annualRevenue > 0) {
    const hourlyRevenue = annualRevenue / 8760; // hours in a year
    downtimeCostPerHour = Math.round(hourlyRevenue * (profile.downtime_pct * 100)); // industry multiplier
  } else {
    // Conservative SMB fallback — avoids inflating results for small companies
    downtimeCostPerHour = 1000;
  }

  return {
    avg_breach_frequency: profile.breach_freq,
    avg_cost_per_record: profile.cost_per_record,
    avg_downtime_cost_per_hour: downtimeCostPerHour,
    ransomware_likelihood: profile.ransomware,
    annual_revenue: annualRevenue || null
  };
}

// Infer threat scenario from item data
function inferThreatScenario(item, inputs) {
  const processType = inputs.bia_process_type || item.type || '';
  const dataClass = inputs.bia_data_classification || '';
  
  if (dataClass === 'regulated' || dataClass === 'critical') return 'Data_Breach';
  if (processType === 'Database' || processType === 'Application') return 'Data_Breach';
  if (processType === 'SCADA' || processType === 'MES') return 'Ransomware';
  if (processType === 'Network') return 'DDoS';
  
  return 'System_Outage';
}

// Infer attack vector from item data
function inferAttackVector(item, inputs) {
  const vendorControl = inputs.bia_exposure_vendor_control || '';
  const legacyStatus = inputs.bia_exposure_legacy_status || '';
  
  if (legacyStatus === 'eol_critical' || legacyStatus === 'eol_partial') return 'Unpatched_Vulnerability';
  if (vendorControl === 'high_risk' || vendorControl === 'unvetted_vendor') return 'Supply_Chain';
  
  return 'Network_Intrusion';
}

// Calculate CVE correlation using NVD data
function calculateCVECorrelation(item, assessment) {
  if (!assessment?.external_cve_threats) return 0;

  try {
    const cveData = JSON.parse(assessment.external_cve_threats);
    if (!cveData || !Array.isArray(cveData)) return 0;

    // Count critical and high severity CVEs
    const criticalCVEs = cveData.filter(cve => 
      cve.severity === 'CRITICAL' || (cve.cvss_score && cve.cvss_score >= 9.0)
    ).length;

    const highCVEs = cveData.filter(cve => 
      cve.severity === 'HIGH' || (cve.cvss_score && cve.cvss_score >= 7.0 && cve.cvss_score < 9.0)
    ).length;

    // Correlation score (0-100)
    const score = Math.min(100, (criticalCVEs * 20) + (highCVEs * 10));
    return score;
  } catch (e) {
    console.warn('CVE correlation calculation error:', e);
    return 0;
  }
}

// Calculate control weakness score
function calculateControlWeaknessScore(item, inputs, assessment, controlEffectiveness) {
  let weaknessScore = 100 - controlEffectiveness; // Invert control effectiveness
  
  // Adjust based on specific weaknesses
  if (inputs.bia_exposure_vendor_control === 'high_risk') weaknessScore += 15;
  if (inputs.bia_exposure_legacy_status === 'eol_critical') weaknessScore += 20;
  if (inputs.bia_exposure_single_point_of_failure === 'single_point') weaknessScore += 15;
  if (inputs.bia_exposure_external_staff_access === 'unrestricted') weaknessScore += 10;
  
  return Math.min(100, weaknessScore);
}

// Calculate Loss Event Frequency (LEF)
function calculateLEF(
  threatScenario,
  attackVector,
  controlWeakness,
  cveCorrelation,
  externalThreatScore,
  industryBenchmarks
) {
  // Base frequency from industry benchmarks
  let baseLEF = industryBenchmarks.avg_breach_frequency;
  
  // Adjust based on threat scenario
  if (threatScenario === 'Ransomware') baseLEF *= industryBenchmarks.ransomware_likelihood / 0.35;
  if (threatScenario === 'Data_Breach') baseLEF *= 1.2;
  
  // Adjust based on control weakness (0-100 scale)
  const controlMultiplier = 1 + (controlWeakness / 100);
  
  // Adjust based on CVE correlation (0-100 scale)
  const cveMultiplier = 1 + (cveCorrelation / 200);
  
  // Adjust based on external threat exposure (0-100 scale)
  const exposureMultiplier = 1 + (externalThreatScore / 200);
  
  const calculatedLEF = baseLEF * controlMultiplier * cveMultiplier * exposureMultiplier;
  
  return Math.min(5.0, calculatedLEF); // Cap at 5x per year
}

// Calculate Single Loss Expectancy (SLE)
function calculateSLE(
  item,
  inputs,
  threatScenario,
  assessment,
  industryBenchmarks,
  relevantBreaches
) {
  let sle = 0;
  
  // Downtime costs
  const timeToHurtMap = {
    'immediate': 8,
    '1hour': 12,
    '4hours': 24,
    '1day': 48,
    '3days': 96,
    '1week': 168,
    '1month': 720
  };
  
  const downtimeHours = timeToHurtMap[inputs.bia_impact_time_to_hurt] || 24;
  
  const revenueLossMap = {
    '$0–$5k/hr': 2500,
    '$5k–$25k/hr': 15000,
    '$25k–$100k/hr': 62500,
    '$100k–$500k/hr': 300000,
    '$500k+/hr': 750000
  };
  
  const hourlyLoss = inputs.bia_impact_revenue_loss_rate_override || 
                     revenueLossMap[inputs.bia_impact_revenue_loss_rate] || 
                     industryBenchmarks.avg_downtime_cost_per_hour;
  
  sle += downtimeHours * hourlyLoss;
  
  // Data breach costs
  if (threatScenario === 'Data_Breach') {
    const recordCount = 10000; // Estimate, could be parameterized
    sle += recordCount * industryBenchmarks.avg_cost_per_record;
  }
  
  // Contract/SLA penalties
  const contractExposureMap = {
    'none': 0,
    'low': 50000,
    'moderate': 150000,
    'high': 400000,
    'severe': 1000000
  };
  
  sle += contractExposureMap[inputs.bia_impact_contract_exposure] || 0;
  
  // Regulatory fines
  const regulatoryExposureMap = {
    'none': 0,
    'low': 75000,
    'moderate': 500000,
    'high': 5000000,
    'severe': 20000000
  };
  
  sle += regulatoryExposureMap[inputs.bia_data_regulatory_exposure] || 0;
  
  // Use breach precedents for calibration
  if (relevantBreaches && relevantBreaches.length > 0) {
    const avgBreachCost = relevantBreaches.reduce((sum, b) => sum + (b.estimated_financial_impact || 0), 0) / relevantBreaches.length;
    if (avgBreachCost > 0) {
      sle = (sle + avgBreachCost) / 2; // Average with precedent data
    }
  }
  
  return sle;
}

// Find matching breach cases
function findMatchingBreaches(threatScenario, attackVector, relevantBreaches) {
  if (!relevantBreaches || relevantBreaches.length === 0) return [];
  
  const scenarioMap = {
    'Ransomware': 'Ransomware',
    'Data_Breach': 'Data_Breach',
    'DDoS': 'DDoS',
    'System_Outage': 'Unpatched_Vulnerability'
  };
  
  const matchingAttackType = scenarioMap[threatScenario];
  
  return relevantBreaches
    .filter(breach => breach.attack_type === matchingAttackType)
    .sort((a, b) => (b.estimated_financial_impact || 0) - (a.estimated_financial_impact || 0))
    .slice(0, 5);
}

// Generate risk narrative with breach references
function generateRiskNarrative(
  item,
  threatScenario,
  attackVector,
  lef,
  sle,
  ale,
  matchingBreaches,
  controlWeakness
) {
  const itemName = item.name || item.inputs?.bia_process_name || 'This system';
  
  let narrative = `**${itemName}** faces a **${threatScenario.replace(/_/g, ' ')}** threat via **${attackVector.replace(/_/g, ' ')}**.\n\n`;
  
  narrative += `**FAIR Analysis:**\n`;
  narrative += `- **LEF (Loss Event Frequency):** ${lef.toFixed(2)}x per year\n`;
  narrative += `- **SLE (Single Loss Expectancy):** $${(sle / 1000).toFixed(0)}k per event\n`;
  narrative += `- **ALE (Annualized Loss Expectancy):** $${(ale / 1000).toFixed(0)}k per year\n\n`;
  
  if (controlWeakness > 60) {
    narrative += `⚠️ **Control Weakness Score: ${controlWeakness.toFixed(0)}/100** - Significant control gaps increase likelihood.\n\n`;
  }
  
  if (matchingBreaches.length > 0) {
    narrative += `**Real-World Precedents:**\n`;
    matchingBreaches.slice(0, 2).forEach(breach => {
      narrative += `- **${breach.company_name}** (${new Date(breach.breach_date).getFullYear()}): `;
      narrative += `$${((breach.estimated_financial_impact || 0) / 1000000).toFixed(1)}M impact from ${breach.primary_cause}\n`;
    });
    narrative += `\n`;
  }
  
  narrative += `**Recommendation:** ${lef > 1.5 ? 'Urgent' : 'Timely'} remediation of control weaknesses is advised to reduce frequency and impact.`;
  
  return narrative;
}

// Calculate confidence score
function calculateConfidenceScore(cveCorrelation, controlWeakness, breachCount) {
  let confidence = 50; // Base confidence
  
  if (cveCorrelation > 0) confidence += 15;
  if (controlWeakness > 0) confidence += 15;
  if (breachCount > 0) confidence += 20;
  
  return Math.min(100, confidence);
}

// Process individual BIA item with FAIR methodology
function processBiaItemWithFAIR(
  item,
  inputs,
  weights,
  assessment,
  controlEffectiveness,
  externalThreatScore,
  industryBenchmarks,
  relevantBreaches,
  base44
) {
  // Determine threat scenario type if not already set
  const threatScenario = item.threat_scenario_type || inferThreatScenario(item, inputs);
  const attackVector = item.attack_vector || inferAttackVector(item, inputs);

  // Calculate CVE correlation score
  const cveCorrelation = calculateCVECorrelation(item, assessment);

  // Calculate control weakness score
  const controlWeakness = calculateControlWeaknessScore(item, inputs, assessment, controlEffectiveness);

  // Calculate Loss Event Frequency (LEF)
  const lef = calculateLEF(
    threatScenario,
    attackVector,
    controlWeakness,
    cveCorrelation,
    externalThreatScore,
    industryBenchmarks
  );

  // Calculate Single Loss Expectancy (SLE)
  const sle = calculateSLE(
    item,
    inputs,
    threatScenario,
    assessment,
    industryBenchmarks,
    relevantBreaches
  );

  // Calculate Annualized Loss Expectancy (ALE)
  const ale = lef * sle;

  // Find relevant breach cases for this scenario
  const matchingBreaches = findMatchingBreaches(threatScenario, attackVector, relevantBreaches);

  // Generate risk narrative with breach case references
  const narrative = generateRiskNarrative(
    item,
    threatScenario,
    attackVector,
    lef,
    sle,
    ale,
    matchingBreaches,
    controlWeakness
  );

  return {
    ...item,
    threat_scenario_type: threatScenario,
    attack_vector: attackVector,
    cve_correlation_score: cveCorrelation,
    control_weakness_score: controlWeakness,
    lef_estimate: lef,
    result: {
      ...item.result,
      lef: parseFloat(lef.toFixed(3)),
      sle: Math.round(sle),
      ale: Math.round(ale),
      annualizedLoss: Math.round(ale),
      relevantBreachCases: matchingBreaches.slice(0, 3),
      riskNarrative: narrative,
      fair_confidence: calculateConfidenceScore(cveCorrelation, controlWeakness, matchingBreaches.length)
    }
  };
}

// Calculate aggregated FAIR metrics across all BIA items
function calculateAggregatedFAIRMetrics(processedItems) {
  if (!processedItems || processedItems.length === 0) {
    return {
      total_ale: 0,
      avg_lef: 0,
      highest_sle_scenario: 'None',
      highest_sle_value: 0,
      risk_distribution: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    };
  }

  let totalALE = 0;
  let totalLEF = 0;
  let highestSLE = 0;
  let highestSLEScenario = 'None';
  
  // Initialize risk distribution
  const riskDistribution = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  processedItems.forEach(item => {
    const result = item.result || {};
    const ale = result.ale || 0;
    const lef = result.lef || 0;
    const sle = result.sle || 0;

    totalALE += ale;
    totalLEF += lef;

    if (sle > highestSLE) {
      highestSLE = sle;
      highestSLEScenario = item.name || item.inputs?.bia_process_name || 'Unknown';
    }

    // Categorize risk
    if (ale > 1000000) {
      riskDistribution.critical++;
    } else if (ale > 500000) {
      riskDistribution.high++;
    } else if (ale > 100000) {
      riskDistribution.medium++;
    } else {
      riskDistribution.low++;
    }
  });

  const avgLEF = processedItems.length > 0 ? totalLEF / processedItems.length : 0;

  return {
    total_ale: Math.round(totalALE),
    avg_lef: parseFloat(avgLEF.toFixed(3)),
    highest_sle_scenario: highestSLEScenario,
    highest_sle_value: Math.round(highestSLE),
    risk_distribution: riskDistribution
  };
}