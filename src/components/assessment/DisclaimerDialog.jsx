
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ShieldCheck, CheckCircle } from 'lucide-react';

export default function DisclaimerDialog({ isOpen, onAgree, isLoading = false }) {
  // This modal is controlled by its parent.
  // We prevent closing via Esc or overlay click by not passing onOpenChange.
  return (
    <Dialog open={isOpen}>
      <DialogContent className="bg-slate-900 border-cyan-500/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-300 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            Important Legal Notice
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Please read and acknowledge these terms before proceeding with your security assessment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 max-h-96 overflow-y-auto">
          <div className="bg-slate-800/50 p-4 rounded-lg border border-cyan-500/20">
            <h3 className="font-semibold text-cyan-300 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-white" />
              Assessment Purpose & Limitations
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              This cybersecurity assessment is designed to provide general insights and recommendations
              based on industry best practices and common frameworks. It is not a comprehensive security
              audit, penetration test, or guarantee of your organization's security posture.
            </p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-yellow-300">
                  Important: This is a cybersecurity assessment tool with Smart assistance - not legal or compliance advice.
                </p>

                <div className="space-y-3 text-gray-300">
                  <p>
                    <strong>What FortiGap provides:</strong> Security maturity assessment, gap analysis,
                    Smart-generated insights, and improvement recommendations based on industry frameworks.
                  </p>

                  <p>
                    <strong>What FortiGap does NOT provide:</strong> Legal advice, definitive compliance
                    certification, or guarantee of regulatory approval.
                  </p>

                  <p>
                    <strong>Smart System Limitations:</strong> Our Smart assistance uses advanced language models to
                    provide recommendations based on your inputs. These suggestions should be reviewed
                    by qualified professionals and adapted to your specific environment.
                  </p>

                  <p>
                    <strong>Your Responsibility:</strong> Always consult with qualified legal, compliance,
                    and cybersecurity professionals for decisions affecting your organization's security posture
                    and regulatory compliance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-300 text-sm"> {/* Changed from text-gray-400 to text-gray-300 for consistency */}
            By proceeding, you acknowledge that you understand these limitations and will use FortiGap's
            Smart assistance as a starting point for your security improvement efforts.
          </p>

          <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
            <p>
              FortiGaP is a Smart-powered cybersecurity advisory tool designed to assist with gap analysis, maturity scoring, and framework alignment. It is intended for informational and guidance purposes only and should not be relied upon as a substitute for professional judgment, certified audits, or legal counsel.
            </p>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-200">Data Handling & Confidentiality:</h4>
              <p>
                FortiGaP is designed to process and store the <strong>confidential organizational cybersecurity data</strong> that you input, such as your company's security posture, risks, systems, and processes. This information is used to provide tailored analyses, identify gaps, and generate recommendations for your organization.
              </p>

              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <h5 className="font-semibold text-red-300 mb-2">IMPORTANT: Exclusion of Sensitive Personal Data</h5>
                <p className="text-xs">
                  While this platform handles confidential business information, <strong>it is not designed for the collection, storage, or processing of sensitive personal data</strong> (e.g., protected health information, financial account numbers, government identifiers, or special categories of personal data as defined by data privacy regulations like GDPR/CCPA). You are solely responsible for ensuring that all data you input, especially within free-text fields, is anonymized or de-identified where appropriate, and that it complies with your organization's internal data privacy policies and all relevant legal and regulatory requirements.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-gray-200">No Guarantee of Compliance or Absolute Security:</h5>
                <p>
                  FortiGaP provides cybersecurity assessment guidance and Smart-generated insights for informational purposes only. It does not provide legal advice, guarantee compliance with any regulatory or certification body, or assure absolute security. The Smart assistance leverages advanced language models, and its suggestions are based on your inputs. These suggestions should always be reviewed by qualified professionals and adapted to your specific operational environment.
                </p>
              </div>
            </div>

            <p className="font-semibold text-gray-200">By using FortiGaP, you acknowledge the following:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Your Sole Responsibility:</strong> You are solely responsible for validating any insights, recommendations, or action items generated by this tool before implementation. Always consult with qualified legal, compliance, and cybersecurity professionals for all decisions affecting your organization's security posture, data handling practices, and regulatory compliance.</li>
              <li>FortiGaP does not guarantee compliance with any regulatory or certification body.</li>
              <li>While FortiGaP leverages curated datasets and industry frameworks (e.g., NIST, ISO, SOC 2, CIS), its recommendations may be generalized, incomplete, or not reflect the most current standards, threat intelligence, or regulatory updates.</li>
              <li><strong>Limitation of Liability:</strong> FortiGaP and its creators shall not be held liable for any direct, indirect, incidental, or consequential damages resulting from the use, reliance, or misinterpretation of the tool's output.</li>
            </ul>

            <p className="font-bold text-amber-300 text-center mt-4">
              Always consult with qualified cybersecurity professionals, auditors, and legal advisors before making security or compliance decisions.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-3 pt-4">
          <Button
            onClick={onAgree}
            disabled={isLoading}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                I Acknowledge and Agree
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
