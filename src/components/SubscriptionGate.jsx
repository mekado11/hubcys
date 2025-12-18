import React from 'react';

// --- Subscription checks are temporarily disabled for development ---
// This component will now always grant access to all features.

export default function SubscriptionGate({ 
  children 
}) {
  return <>{children}</>;
}

/*
// --- Original SubscriptionGate Logic ---
const featureLimits = {
  free_trial: {
    assessments: 1,
    reports: 1,
    action_items: 10,
  },
  basic: {
    assessments: 5,
    reports: 5,
    action_items: 50,
  },
  pro: {
    assessments: 'unlimited',
    reports: 'unlimited',
    action_items: 'unlimited',
  },
  enterprise: {
    assessments: 'unlimited',
    reports: 'unlimited',
    action_items: 'unlimited',
  },
};

export default function SubscriptionGate({ 
  userTier, 
  feature, 
  currentUsage, 
  title, 
  description, 
  children 
}) {
  const tierLimit = featureLimits[userTier]?.[feature];
  
  // Grant access if the tier has unlimited access or if usage is below the numeric limit
  if (tierLimit === 'unlimited' || (typeof tierLimit === 'number' && currentUsage < tierLimit)) {
    return <>{children}</>;
  }

  // If usage equals or exceeds limit, show the upgrade gate
  return (
    <Card className="glass-effect border-yellow-500/30">
      <CardHeader>
        <CardTitle className="text-yellow-300 flex items-center">
          <Lock className="w-5 h-5 mr-2" />
          Upgrade Required
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-lg text-white mb-2">You've reached the limit for the '{title}' feature on your current plan.</p>
        <p className="text-gray-400 mb-6">{description} Unlock more by upgrading your plan.</p>
        <Link to={createPageUrl("Pricing")}>
          <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 cyber-glow">
            <TrendingUp className="w-4 h-4 mr-2" />
            View Upgrade Options
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
*/