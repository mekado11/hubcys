import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertTriangle, Database, Cloud, HardDrive } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function DataPersistenceGuide() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Data Persistence Guide
        </h1>
        <p className="text-gray-400">Understanding how data is saved and persisted in Hubcys</p>
      </div>

      {/* Overview */}
      <Card className="glass-effect border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-300 flex items-center gap-2">
            <Database className="w-5 h-5" />
            How Data Persistence Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-5 h-5 text-yellow-400" />
                <h3 className="font-semibold text-yellow-300">Session Storage</h3>
              </div>
              <p className="text-sm text-gray-400">Temporary auto-saves cleared on logout/refresh (used by Assessment)</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="w-5 h-5 text-green-400" />
                <h3 className="font-semibold text-green-300">Database</h3>
              </div>
              <p className="text-sm text-gray-400">Permanent storage when you click "Save" buttons</p>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <h3 className="font-semibold text-orange-300">No Auto-Save</h3>
              </div>
              <p className="text-sm text-gray-400">Some pages require manual save to persist data</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Page-by-Page Breakdown */}
      <Card className="glass-effect border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-purple-300">Data Persistence by Module</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            
            {/* Assessments */}
            <AccordionItem value="assessments" className="border-b border-slate-700">
              <AccordionTrigger className="text-white hover:text-cyan-300">
                Security Assessments
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-gray-300">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white mb-1">Session Auto-Save (Temporary)</p>
                    <p className="text-sm">Forms auto-save to session storage every 2 seconds as you type. <strong className="text-yellow-300">Lost on refresh/logout.</strong></p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white mb-1">Permanent Save to Database</p>
                    <p className="text-sm">Click <strong className="text-cyan-300">"Save Draft"</strong> or <strong className="text-cyan-300">"Complete"</strong> buttons to permanently save to database.</p>
                  </div>
                </div>

                <Alert className="bg-blue-900/20 border-blue-500/30">
                  <AlertDescription className="text-blue-200 text-sm">
                    <strong>Best Practice:</strong> Click "Save Draft" regularly to avoid losing work if you refresh the page or your session expires.
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>

            {/* BIA */}
            <AccordionItem value="bia" className="border-b border-slate-700">
              <AccordionTrigger className="text-white hover:text-cyan-300">
                Business Impact Analysis (BIA)
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-gray-300">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white mb-1">No Automatic Save</p>
                    <p className="text-sm">BIA data is <strong className="text-red-300">NOT auto-saved</strong>. Changes are only saved when you click buttons.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white mb-1">Manual Save Required</p>
                    <p className="text-sm">Click <strong className="text-cyan-300">"Save BIA"</strong> or <strong className="text-cyan-300">"Save Linked BIA"</strong> to persist to database.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white mb-1">Auto-Save After Wizard (New)</p>
                    <p className="text-sm">After completing the streamlined wizard, changes auto-save after 2 seconds.</p>
                  </div>
                </div>

                <Alert className="bg-orange-900/20 border-orange-500/30">
                  <AlertDescription className="text-orange-200 text-sm">
                    <strong>Important:</strong> Always click "Save BIA" before refreshing or navigating away to ensure your work is saved to the database.
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>

            {/* Incidents */}
            <AccordionItem value="incidents" className="border-b border-slate-700">
              <AccordionTrigger className="text-white hover:text-cyan-300">
                Incident Management
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-gray-300">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white mb-1">Immediate Database Save</p>
                    <p className="text-sm">All incident updates are saved immediately to the database when you click "Save" or update fields.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white mb-1">Real-time Persistence</p>
                    <p className="text-sm">Notes, status changes, and AI enrichment are persisted immediately.</p>
                  </div>
                </div>

                <Alert className="bg-green-900/20 border-green-500/30">
                  <AlertDescription className="text-green-200 text-sm">
                    <strong>Reliable:</strong> Incident data is saved to the database on every update - no risk of data loss on refresh.
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>

            {/* Action Items */}
            <AccordionItem value="actionitems" className="border-b border-slate-700">
              <AccordionTrigger className="text-white hover:text-cyan-300">
                Action Items (Tasks)
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-gray-300">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white mb-1">Immediate Database Save</p>
                    <p className="text-sm">All action item updates save immediately to the database.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white mb-1">Network Resilience</p>
                    <p className="text-sm">Uses automatic retry with exponential backoff for failed saves.</p>
                  </div>
                </div>

                <Alert className="bg-green-900/20 border-green-500/30">
                  <AlertDescription className="text-green-200 text-sm">
                    <strong>Reliable:</strong> Action items use cached data and automatic retries for maximum reliability.
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>

            {/* Policies */}
            <AccordionItem value="policies" className="border-b border-slate-700">
              <AccordionTrigger className="text-white hover:text-cyan-300">
                Policy Library
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-gray-300">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white mb-1">Manual Save Required</p>
                    <p className="text-sm">Click <strong className="text-cyan-300">"Save Policy"</strong> to persist policy changes to database.</p>
                  </div>
                </div>

                <Alert className="bg-blue-900/20 border-blue-500/30">
                  <AlertDescription className="text-blue-200 text-sm">
                    <strong>Note:</strong> Policy content is saved when you explicitly click save buttons.
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>

            {/* Tabletop Exercises */}
            <AccordionItem value="tabletop" className="border-b border-slate-700">
              <AccordionTrigger className="text-white hover:text-cyan-300">
                Tabletop Exercises
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-gray-300">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white mb-1">Immediate Database Save</p>
                    <p className="text-sm">All exercise updates, scenarios, and execution data save immediately to database.</p>
                  </div>
                </div>

                <Alert className="bg-green-900/20 border-green-500/30">
                  <AlertDescription className="text-green-200 text-sm">
                    <strong>Reliable:</strong> Exercise data persists immediately on every update.
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card className="glass-effect border-green-500/30">
        <CardHeader>
          <CardTitle className="text-green-300">Quick Reference: When Data is Saved</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-900/20 rounded-lg border border-green-500/30">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Immediately Saved (Database)</p>
                <p className="text-sm text-gray-400">Incidents, Action Items, Tabletop Exercises, Comments</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Requires Manual Save (Database)</p>
                <p className="text-sm text-gray-400">Assessments, BIA, Policies - click "Save" buttons</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-orange-900/20 rounded-lg border border-orange-500/30">
              <HardDrive className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Session Auto-Save (Temporary)</p>
                <p className="text-sm text-gray-400">Assessment forms - lost on refresh unless saved to database</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Common Issues */}
      <Card className="glass-effect border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-300">Common Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
              <h4 className="font-semibold text-white mb-2">❌ "My changes disappeared after refresh"</h4>
              <p className="text-sm text-gray-300 mb-2"><strong>Cause:</strong> You didn't click the "Save" button before refreshing.</p>
              <p className="text-sm text-green-300"><strong>Solution:</strong> Always click "Save Draft" or "Save BIA" before navigating away or refreshing.</p>
            </div>

            <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
              <h4 className="font-semibold text-white mb-2">❌ "BIA data is not saving"</h4>
              <p className="text-sm text-gray-300 mb-2"><strong>Cause:</strong> BIA does not have automatic save - you must click "Save BIA".</p>
              <p className="text-sm text-green-300"><strong>Solution:</strong> After adding/editing functions, click "Save BIA" or "Save Linked BIA" button.</p>
            </div>

            <div className="bg-orange-900/20 rounded-lg p-4 border border-orange-500/30">
              <h4 className="font-semibold text-white mb-2">⚠️ "Session expired" warning</h4>
              <p className="text-sm text-gray-300 mb-2"><strong>Cause:</strong> 30 minutes of inactivity triggers automatic logout for security.</p>
              <p className="text-sm text-green-300"><strong>Solution:</strong> Save your work regularly. You'll get a 60-second warning before auto-logout.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card className="glass-effect border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-300">Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <p className="text-gray-300">Always click <strong className="text-white">"Save Draft"</strong> buttons when working on assessments, BIA, or policies</p>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <p className="text-gray-300">Look for <strong className="text-white">green success notifications</strong> at the bottom of screen confirming saves</p>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <p className="text-gray-300">If you get a <strong className="text-white">"session expiring"</strong> warning, save immediately</p>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <p className="text-gray-300">Action items and incidents auto-save - no manual action needed</p>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}