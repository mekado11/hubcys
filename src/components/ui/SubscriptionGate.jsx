import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SubscriptionGate({ 
  currentTier, 
  requiredTier, 
  featureName, 
  description,
  children,
  showUpgrade = true,
  className = ""
}) {
  return (
    <Card className={`glass-effect border-purple-500/30 ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-purple-400" />
        </div>
        <CardTitle className="text-purple-300 text-xl">
          {featureName} - Premium Feature
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-300">
          {description || `This feature requires a ${requiredTier} plan or higher to access.`}
        </p>
        <div className="bg-slate-800/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">
            Current Plan: <span className="text-cyan-300 capitalize">{currentTier}</span>
          </p>
          <p className="text-sm text-gray-400">
            Required Plan: <span className="text-purple-300 capitalize">{requiredTier}</span>
          </p>
        </div>
        {children}
        {showUpgrade && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={createPageUrl('Pricing')}>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <ArrowRight className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            </Link>
            <Button variant="outline" className="border-gray-600 text-gray-300" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}