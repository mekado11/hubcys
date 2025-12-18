
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BookOpen, ArrowLeft, Shield, Share2, Network, Database } from "lucide-react";

export default function PCIScopingGuide() {
  return (
    <div className="min-h-screen cyber-gradient p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("ResponseReadiness?tab=tools&tool=pci-scoping")} className="text-cyan-300 hover:text-cyan-200 flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to PCI DSS Scoping
          </Link>
          <Badge className="bg-cyan-500/20 text-cyan-300">PCI DSS</Badge>
        </div>

        <Card className="glass-effect border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-cyan-300 flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              PCI DSS Scoping & CDE Identification – Quick Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-4">
            <p>
              This guide explains how to use the PCI DSS Scoping tool to define your Cardholder Data Environment (CDE) and reduce audit fatigue.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center text-white font-semibold mb-2">
                  <Database className="w-4 h-4 mr-2 text-cyan-400" /> CDE Assets
                </div>
                <p className="text-sm">
                  Add systems that store, process, or transmit cardholder data (CHD/SAD), such as payment apps, databases, and payment processors.
                  These are fully in scope for PCI DSS.
                </p>
              </div>

              <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center text-white font-semibold mb-2">
                  <Network className="w-4 h-4 mr-2 text-cyan-400" /> Connected Systems
                </div>
                <p className="text-sm">
                  Add systems that don’t handle CHD directly but connect to or impact the CDE (e.g., AD, logging, monitoring). These are partially in scope.
                </p>
              </div>

              <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center text-white font-semibold mb-2">
                  <Share2 className="w-4 h-4 mr-2 text-cyan-400" /> Data Flows
                </div>
                <p className="text-sm">
                  Document how cardholder data enters, moves through, and exits your environment. Note encryption in transit and at rest where applicable.
                </p>
              </div>

              <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center text-white font-semibold mb-2">
                  <Shield className="w-4 h-4 mr-2 text-cyan-400" /> Scope Summary
                </div>
                <p className="text-sm">
                  Provide a narrative of scope boundaries, segmentation, and justification for in/out of scope decisions. Auditors love clarity here.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-white font-semibold">Best Practices</div>
              <ul className="list-disc ml-5 text-sm space-y-1">
                <li>Use segmentation to reduce scope and risk; document boundaries clearly.</li>
                <li>Keep an inventory of all systems touching CHD or the CDE.</li>
                <li>Ensure encryption for CHD in transit and at rest; record where it applies.</li>
                <li>Review scope quarterly or when architecture changes.</li>
              </ul>
            </div>

            <div className="pt-2">
              <Link to={createPageUrl("ResponseReadiness?tab=tools&tool=pci-scoping")} className="text-cyan-300 hover:text-cyan-200">
                Open PCI DSS Scoping Tool →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
