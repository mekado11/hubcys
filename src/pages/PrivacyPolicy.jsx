
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PrivacyPolicy() {
  const lastUpdated = "October 17, 2025";

  return (
    <div className="min-h-screen cyber-gradient">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Privacy Policy</h1>
          <Link to={createPageUrl('LandingPage')}>
            <Button variant="outline" className="border-slate-600 text-gray-300 hover:bg-slate-800">
              Back to Home
            </Button>
          </Link>
        </div>

        <Card className="glass-effect border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Your privacy matters</CardTitle>
            <div className="text-gray-400 text-sm">Last updated: {lastUpdated}</div>
          </CardHeader>

          <CardContent className="space-y-6 text-sm text-gray-300 leading-relaxed">
            <p>
              This Privacy Policy explains how Hubcys ("we", "us") collects, uses, and shares information when you use
              our Services.
            </p>

            <section>
              <h2 className="text-white font-semibold mb-1">1. Information We Collect</h2>
              <ul className="list-disc ml-5 space-y-2">
                <li>
                  Account & Profile: name, email, optional job title and contact fields submitted during onboarding.
                </li>
                <li>
                  Organizational Data: company information and assessment data you choose to store in the platform.
                </li>
                <li>
                  Usage & Device Data: log data, device/browser information, and interactions for security and product
                  analytics (aggregated or de-identified where appropriate).
                </li>
                <li>
                  Support & Communications: messages and attachments you send to support or sales.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold mb-1">2. Payments and Invoicing (Manual)</h2>
              <p>
                We currently use manual invoicing for paid plans. We do not collect or store your credit card numbers in
                the application. If payment details are provided to complete an invoice, they are handled outside the
                app via secure payment channels with our finance team or payment processor.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold mb-1">3. How We Use Information</h2>
              <ul className="list-disc ml-5 space-y-2">
                <li>Provide, maintain, and improve the Services</li>
                <li>Authenticate users, secure accounts, and prevent abuse</li>
                <li>Respond to inquiries, provide support, and send service communications</li>
                <li>Analyze usage to improve features and user experience</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold mb-1">4. Sharing of Information</h2>
              <p className="mb-2">
                We do not sell your personal information. We may share information with:
              </p>
              <ul className="list-disc ml-5 space-y-2">
                <li>Service providers who help operate or support the Services (under confidentiality obligations)</li>
                <li>Law enforcement or regulators if required by law or to protect rights and safety</li>
                <li>Successors in the event of a merger, acquisition, or corporate reorganization</li>
              </ul>
            </section>

            <section>
              {/* Updated H2 styling for "Data Retention" */}
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Retention</h2>
              <p>
                We retain data for as long as necessary to provide the Services, comply with legal obligations, resolve
                disputes, and enforce agreements. You may request deletion as described below.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold mb-1">6. Security</h2>
              <p>
                We implement reasonable administrative, technical, and physical safeguards designed to protect
                information. However, no method of transmission or storage is completely secure.
              </p>
            </section>

            <section>
              {/* Replaced existing Section 7 with new "Data Residency and International Transfers" content */}
              <h2 className="text-2xl font-semibold text-white mb-4">7. Data Residency and International Transfers</h2>
              <p className="text-gray-400 mb-4">
                Our services are hosted globally to provide a resilient and performant experience. While your data may be processed in various locations, we offer specific data residency options for customers with strict jurisdictional requirements.
              </p>
              <p className="text-gray-400">
                For customers in the United Kingdom and European Union, we utilize data centers located within the EU to ensure your data is processed in accordance with UK GDPR and EU GDPR. All international data transfers are protected by appropriate legal safeguards, such as Standard Contractual Clauses (SCCs).
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold mb-1">8. Your Rights & Choices</h2>
              {/* Added new paragraph as per outline */}
              <p className="text-gray-400 mb-2">
                You have the right to request access to, correction of, or deletion of your personal data. You may also have rights to restrict or object to certain processing activities. To exercise these rights, please contact us at <a href="mailto:privacy@hubcys.com" className="text-cyan-400 hover:underline">privacy@hubcys.com</a>.
              </p>
              <ul className="list-disc ml-5 space-y-2">
                <li>Access, update, or correct certain information within your account</li>
                <li>Request deletion of personal information, subject to legal obligations</li>
                <li>Object to or restrict processing in certain circumstances</li>
              </ul>
              <p className="mt-2">
                To exercise these rights, contact{" "}
                <a className="text-cyan-300 hover:text-cyan-200" href="mailto:privacy@hubcys.com">privacy@hubcys.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold mb-1">9. Children's Privacy</h2>
              <p>
                The Services are not intended for children under 16. We do not knowingly collect personal information
                from children under 16.
              </p>
            </section>

            <section>
              <h2 className="text-white font-semibold mb-1">10. Contact</h2>
              <ul className="list-none space-y-1">
                <li>Privacy: <a href="mailto:privacy@hubcys.com" className="text-cyan-300 hover:text-cyan-200">privacy@hubcys.com</a></li>
                <li>Support: <a href="mailto:support@hubcys.com" className="text-cyan-300 hover:text-cyan-200">support@hubcys.com</a></li>
                <li>Sales: <a href="mailto:sales@hubcys.com" className="text-cyan-300 hover:text-cyan-200">sales@hubcys.com</a></li>
                <li>Legal: <a href="mailto:legal@hubcys.com" className="text-cyan-300 hover:text-cyan-200">legal@hubcys.com</a></li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
