import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TermsOfService() {
  const lastUpdated = "October 17, 2025";

  return (
    <div className="min-h-screen cyber-gradient">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Terms of Service</h1>
          <Link to={createPageUrl('LandingPage')}>
            <Button variant="outline" className="border-slate-600 text-gray-300 hover:bg-slate-800">
              Back to Home
            </Button>
          </Link>
        </div>

        <Card className="glass-effect border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Agreement</CardTitle>
            <div className="text-gray-400 text-sm">Last updated: {lastUpdated}</div>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-gray-300 leading-relaxed">
            <p>
              These Terms of Service ("Terms") govern your access to and use of the Hubcys platform and services
              ("Services"). By accessing or using the Services, you agree to be bound by these Terms.
            </p>

            <section>
              <h2 className="text-white font-semibold mb-1">1. Accounts, Access, and Approval</h2>
              <p>
                Accounts may require administrator approval prior to full access. We may reject, suspend, or terminate
                accounts that do not meet our eligibility, security, or compliance requirements. You are responsible for
                maintaining the confidentiality of your account and for all activities under your account.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold mb-1">2. Plans and Scope of Use</h2>
              <ul className="list-disc ml-5 space-y-2">
                <li>
                  Early Career (Individuals): Personal, non-commercial use only. Limited features. One user per
                  subscription. No company work or sharing.
                </li>
                <li>
                  Business Plans (Starter, Growth, Enterprise): Organizational use for approved company users. Feature
                  access varies by tier.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold mb-1">3. Manual Billing & Invoicing (No Auto-Charge)</h2>
              <p className="mb-2">
                Payments are handled manually via emailed invoices. When you request a paid plan, we will confirm your
                order and email an invoice. Access is activated upon receipt and confirmation of payment. We do not
                process card payments within the app and do not store cardholder data.
              </p>
              <ul className="list-disc ml-5 space-y-2">
                <li>
                  Early Career: One-year, non-recurring license. You can renew manually each year by contacting{" "}
                  <a className="text-cyan-300 hover:text-cyan-200" href="mailto:sales@hubcys.com">sales@hubcys.com</a>.
                </li>
                <li>
                  Business Plans: Billed by invoice based on the selected tier and term. Seat counts and overages
                  (where applicable) are defined per order form or invoice.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold mb-1">4. Trials</h2>
              <p>
                Free trials are time-limited. At trial end, access to paid features stops unless a paid plan is
                purchased. Your data remains intact according to our Privacy Policy and data retention practices.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold mb-1">5. Cancellations & Refunds</h2>
              <ul className="list-disc ml-5 space-y-2">
                <li>
                  Early Career: Non-recurring one-year access. Once activated, fees are non-refundable except where
                  required by law.
                </li>
                <li>
                  Business Plans: Invoiced subscriptions run for the agreed term. Cancellations take effect at the end
                  of the current term; fees already invoiced are not refundable unless otherwise stated in your order
                  form or required by law.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold mb-1">6. Acceptable Use</h2>
              <p className="mb-2">
                You agree not to misuse the Services. Prohibited actions include (without limitation): violating
                applicable laws, attempting to gain unauthorized access, reverse engineering, interfering with service
                integrity, sharing accounts, or using the Services to store, process, or transmit unlawful content.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold mb-1">7. Confidentiality & Data</h2>
              <p className="mb-2">
                We handle data in accordance with the Privacy Policy. You retain ownership of your content. You grant us
                a limited right to process your content to provide and improve the Services, comply with law, and
                protect the Services. We implement reasonable security measures; however, no system is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold mb-1">8. Intellectual Property</h2>
              <p>
                The Services, including software, logos, and content, are owned by Hubcys or its licensors and are
                protected by intellectual property laws. Except for the rights expressly granted, we reserve all rights.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold mb-1">9. Warranty Disclaimer</h2>
              <p>
                The Services are provided "as is" and "as available." To the maximum extent permitted by law, we disclaim
                all warranties, express or implied, including merchantability, fitness for a particular purpose, and
                non-infringement.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold mb-1">10. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Hubcys will not be liable for indirect, incidental, special,
                consequential, or punitive damages, or any loss of profits, revenues, data, or use, even if advised of
                the possibility. Our aggregate liability is limited to the amounts paid by you to Hubcys for the
                Services in the twelve (12) months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold mb-1">11. Indemnification</h2>
              <p>
                You will indemnify and hold Hubcys harmless from claims arising from your use of the Services or your
                violation of these Terms or applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold mb-1">12. Termination</h2>
              <p>
                We may suspend or terminate access for violations of these Terms or for security, legal, or operational
                reasons. Upon termination, your right to use the Services ceases. Certain sections survive termination.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold mb-1">13. Governing Law; Disputes</h2>
              <p>
                These Terms are governed by the laws of the State of Delaware, U.S.A., without regard to conflicts of
                law principles. Courts located in Delaware will have exclusive jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold mb-1">14. Contact</h2>
              <ul className="list-none space-y-1">
                <li>Sales: <a href="mailto:sales@hubcys.com" className="text-cyan-300 hover:text-cyan-200">sales@hubcys.com</a></li>
                <li>Support: <a href="mailto:support@hubcys.com" className="text-cyan-300 hover:text-cyan-200">support@hubcys.com</a></li>
                <li>Legal: <a href="mailto:legal@hubcys.com" className="text-cyan-300 hover:text-cyan-200">legal@hubcys.com</a></li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}