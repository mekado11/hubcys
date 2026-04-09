
export const SUBSCRIPTION_TIERS = {
  EARLY_CAREER: 'early_career',
  FREE_TRIAL: 'free_trial',
  STARTER: 'starter',
  GROWTH: 'growth',
  ENTERPRISE: 'enterprise'
};

export const TIER_HIERARCHY = [
  SUBSCRIPTION_TIERS.FREE_TRIAL,
  SUBSCRIPTION_TIERS.EARLY_CAREER,
  SUBSCRIPTION_TIERS.STARTER,
  SUBSCRIPTION_TIERS.GROWTH,
  SUBSCRIPTION_TIERS.ENTERPRISE
];

// Early free-trial helper (treat trial as full access; expiry is enforced in Layout)
function isFreeTrial(tier) {
  return String(tier || '').toLowerCase() === SUBSCRIPTION_TIERS.FREE_TRIAL;
}

function isEarlyCareer(tier) {
  return String(tier || '').toLowerCase() === SUBSCRIPTION_TIERS.EARLY_CAREER;
}

// Helper to check if user is on Enterprise tier
function isEnterprise(tier) {
  return String(tier || '').toLowerCase() === SUBSCRIPTION_TIERS.ENTERPRISE;
}

export const getTierLevel = (tier) => {
  const index = TIER_HIERARCHY.indexOf(tier?.toLowerCase());
  return index >= 0 ? index : 0;
};

export const hasMinimumTier = (userTier, requiredTier) => {
  return getTierLevel(userTier) >= getTierLevel(requiredTier);
};

export const getAssessmentLimit = (tier) => {
  if (isEnterprise(tier)) return Infinity;
  const t = tier?.toLowerCase();
  switch (t) {
    case SUBSCRIPTION_TIERS.EARLY_CAREER:
      return 0; // assessments disabled for early career
    case SUBSCRIPTION_TIERS.FREE_TRIAL:
      return 2;
    case SUBSCRIPTION_TIERS.STARTER:
      return 4;
    case SUBSCRIPTION_TIERS.GROWTH:
      return Infinity;
    default:
      return 2;
  }
};

export const getAllowedFrameworks = (tier) => {
  if (isEnterprise(tier)) {
    // Enterprise can access all frameworks, including TISAX
    return ['NIST_CSF', 'ISO_27001', 'ISO_27002', 'SOC2', 'HIPAA', 'PCI_DSS', 'GDPR', 'CIS_Controls', 'FEDRAMP', 'CMMC', 'TISAX'];
  }
  const t = tier?.toLowerCase();
  switch (t) {
    case SUBSCRIPTION_TIERS.EARLY_CAREER:
      return []; // no frameworks in early career mode
    case SUBSCRIPTION_TIERS.FREE_TRIAL:
      return ['NIST_CSF'];
    case SUBSCRIPTION_TIERS.STARTER:
      return ['NIST_CSF', 'ISO_27001'];
    case SUBSCRIPTION_TIERS.GROWTH:
      return ['NIST_CSF', 'ISO_27001', 'ISO_27002', 'SOC2'];
    default:
      return ['NIST_CSF'];
  }
};

export const getCommandCenterFeatures = (tier) => {
  if (isFreeTrial(tier) || isEnterprise(tier)) {
    return ['url-scanner', 'cve-search', 'surface-recon', 'phishing-check'];
  }
  const t = tier?.toLowerCase();
  switch (t) {
    case SUBSCRIPTION_TIERS.EARLY_CAREER:
      return ['url-scanner', 'cve-search']; // limited tools
    case SUBSCRIPTION_TIERS.STARTER:
      return ['url-scanner', 'cve-search'];
    case SUBSCRIPTION_TIERS.GROWTH:
      return ['url-scanner', 'cve-search', 'surface-recon', 'phishing-check'];
    default:
      return ['url-scanner'];
  }
};

export const canAccessBIA = (tier) => isEnterprise(tier) || hasMinimumTier(tier, SUBSCRIPTION_TIERS.GROWTH);
export const canAccessTabletops = (tier) => {
  if (isFreeTrial(tier) || isEnterprise(tier)) return true;
  return hasMinimumTier(tier, SUBSCRIPTION_TIERS.ENTERPRISE);
};
export const canAccessAIFeatures = (tier) => isEnterprise(tier) || hasMinimumTier(tier, SUBSCRIPTION_TIERS.GROWTH);
export const canAccessAdvancedAI = (tier) => isEnterprise(tier) || hasMinimumTier(tier, SUBSCRIPTION_TIERS.ENTERPRISE);
export const canCustomizeBranding = (tier) => isEnterprise(tier) || hasMinimumTier(tier, SUBSCRIPTION_TIERS.GROWTH);
export const canAccessFullCustomization = (tier) => isEnterprise(tier) || hasMinimumTier(tier, SUBSCRIPTION_TIERS.ENTERPRISE);
export const canAccessSAST = (tier) => {
  if (isFreeTrial(tier) || isEnterprise(tier)) return true;
  return hasMinimumTier(tier, SUBSCRIPTION_TIERS.STARTER);
};
export const canAccessIncidentReporting = (tier) => {
  if (isEnterprise(tier)) return true;
  return hasMinimumTier(tier, SUBSCRIPTION_TIERS.GROWTH);
};
export const canAccessTeamManagement = (tier) => {
  if (isEnterprise(tier)) return true;
  return hasMinimumTier(tier, SUBSCRIPTION_TIERS.GROWTH);
};

export const getUpgradeMessage = (currentTier, requiredTier, featureName) => {
  const names = {
    [SUBSCRIPTION_TIERS.EARLY_CAREER]: 'Early Career',
    [SUBSCRIPTION_TIERS.STARTER]: 'Starter',
    [SUBSCRIPTION_TIERS.GROWTH]: 'Growth',
    [SUBSCRIPTION_TIERS.ENTERPRISE]: 'Enterprise'
  };
  return `${featureName} requires ${names[requiredTier]} plan or higher. Upgrade to unlock this feature.`;
};

// Public pages that don't require authentication or subscription
export const PUBLIC_PAGES = [
  'LandingPage',
  'Login',
  'Pricing',
  'PricingAndFeatures',
  'CompanyOnboarding',
  'PendingApproval',
  'AccessDenied',
  'PrivacyPolicy',
  'TermsOfService',
  'TrialExpired',
  'EarlyCareer',
  'SampleAssessmentReportView',
  'SampleIncidentReport',
  'SampleTabletopReport'
];

export const getAllowedPages = (tier) => {
  const base = [
    'Dashboard',
    'Assessment',
    'ActionItems',
    'Reports',
    'SecurityTraining',
    'EducationalResources',
    'ResponseReadiness',
    'PolicyLibrary',
    'PolicyCenter',
    'CompanyManagement',
    'UserManagement',
    'SystemHealth'
  ];

  const enterprisePages = [
    ...base,
    'BIA',
    'SmartAnalysisSettings',
    'TabletopExerciseDetail',
    'TabletopExerciseDraft',
    'IncidentDetail',
    'TeamManagement',
    'IOCAnalyzer' // NEW
  ];

  const t = tier?.toLowerCase();

  if (t === SUBSCRIPTION_TIERS.ENTERPRISE) return enterprisePages;
  if (t === SUBSCRIPTION_TIERS.GROWTH) {
    return [
      ...base,
      'BIA',
      'SmartAnalysisSettings',
      'IncidentDetail',
      'TeamManagement',
      'IOCAnalyzer' // NEW
    ];
  }
  if (t === SUBSCRIPTION_TIERS.STARTER) return base;

  if (t === SUBSCRIPTION_TIERS.EARLY_CAREER) {
    // Very limited, individual-focused
    return [
      'Dashboard',
      'ResponseReadiness', // limited tools internally
      'SecurityTraining',
      'EducationalResources',
      'Pricing'
    ];
  }

  // default or free_trial
  return base;
};

export const canAccessPage = (tier, pageName, user) => {
  if (user?.is_super_admin) return true;
  if (isFreeTrial(tier) || isEnterprise(tier)) return true;
  if (PUBLIC_PAGES.includes(pageName)) return true;
  return getAllowedPages(tier).includes(pageName);
};

export const TIER_CAPABILITIES = {
  [SUBSCRIPTION_TIERS.EARLY_CAREER]: {
    assessments_per_month: 0,
    frameworks: [],
    command_center: ['URL Scanner', 'CVE Search'],
    bia: false,
    ai_features: false,
    tabletop: false,
    branding: false,
    customization: false,
    sast: false,
    incident_reporting: false,
    team_management: false
  },
  [SUBSCRIPTION_TIERS.FREE_TRIAL]: {
    assessments_per_month: 2,
    frameworks: ['NIST CSF'],
    command_center: ['URL Scanner', 'CVE Search', 'Surface Recon', 'Phishing Check'],
    bia: false,
    ai_features: false,
    tabletop: true,
    branding: false,
    customization: false,
    sast: true,
    incident_reporting: false,
    team_management: false
  },
  [SUBSCRIPTION_TIERS.STARTER]: {
    assessments_per_month: 4,
    frameworks: ['NIST CSF', 'ISO 27001'],
    command_center: ['URL Scanner', 'CVE Search'],
    bia: false,
    ai_features: false,
    tabletop: false,
    branding: false,
    customization: false,
    sast: false,
    incident_reporting: false,
    team_management: false
  },
  [SUBSCRIPTION_TIERS.GROWTH]: {
    assessments_per_month: 'Unlimited',
    frameworks: ['NIST CSF', 'ISO 27001', 'ISO 27002', 'SOC 2'],
    command_center: ['URL Scanner', 'CVE Search', 'Surface Recon', 'Phishing Check'],
    bia: true,
    ai_features: true,
    tabletop: false,
    branding: true,
    customization: false,
    sast: true,
    incident_reporting: true,
    team_management: true
  },
  [SUBSCRIPTION_TIERS.ENTERPRISE]: {
    assessments_per_month: 'Unlimited',
    frameworks: ['All (NIST, ISO 27001/2, SOC2, HIPAA, PCI DSS, GDPR, CIS, FedRAMP, CMMC, TISAX)'],
    command_center: ['All'],
    bia: true,
    ai_features: true,
    tabletop: true,
    branding: true,
    customization: true,
    sast: true,
    incident_reporting: true,
    team_management: true
  }
};
