import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-[780px] px-5 py-12 sm:px-6">
        <Link
          href="/"
          className="inline-block text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          ← Back to home
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: March 2026
        </p>

        <div className="mt-10 space-y-10 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Introduction
            </h2>
            <p>
              SyncPrep is a tool that helps you find overlapping meeting times across time zones and prepare for meetings. You can connect your Google Calendar to see your availability, enter working hours and time zones to get scheduling suggestions, and use AI-generated prep insights (such as meeting briefs or interview talking points). By using SyncPrep, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Eligibility and lawful use
            </h2>
            <p>
              You must be at least 13 years old and able to form a binding agreement to use SyncPrep. You agree to use the service only for lawful purposes and in a way that does not violate any applicable laws or the rights of others.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Your responsibility for content
            </h2>
            <p>
              You are responsible for the accuracy and appropriateness of anything you upload, paste, or enter into SyncPrep—including resumes, job descriptions, meeting context, and time zone or availability information. We do not verify this content. You should not include sensitive personal data (such as full social security numbers or financial account details) unless you are comfortable with it being processed as described in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              What SyncPrep provides
            </h2>
            <p>
              SyncPrep provides scheduling suggestions based on time zones and working hours (and, if you connect it, your Google Calendar). It also provides AI-generated prep insights such as meeting briefs or interview prep. These outputs are for general assistance only. We do not guarantee that they are error-free, complete, or suitable for any particular professional, legal, or employment decision. You should use your own judgment and, where appropriate, seek qualified advice before relying on them for important decisions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Prohibited use
            </h2>
            <p>
              You may not use SyncPrep to:
            </p>
            <ul className="mt-3 list-disc list-inside space-y-2 pl-1">
              <li>Violate any law or encourage others to do so</li>
              <li>Infringe or misuse anyone’s intellectual property or privacy rights</li>
              <li>Transmit malware, spam, or harmful or deceptive content</li>
              <li>Attempt to gain unauthorized access to our systems, other users’ accounts, or any third-party services</li>
              <li>Resell or redistribute SyncPrep’s service in a way that competes with or substitutes for the product we provide</li>
            </ul>
            <p className="mt-3">
              We may suspend or terminate access if we believe you have violated these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Third-party services
            </h2>
            <p>
              SyncPrep uses third-party services, including Google (for calendar integration) and AI providers (for generating prep content). Your use of those features is subject to the relevant third parties’ terms and policies. We are not responsible for the availability, conduct, or policies of those services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Intellectual property
            </h2>
            <p>
              SyncPrep’s app, branding, and content we provide (other than your own data) are owned by SyncPrep or our licensors. You do not acquire any ownership rights by using the service. You may use SyncPrep for your personal or internal business use in line with these terms, but you may not copy, modify, or create derivative works of our product or branding without permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Disclaimer of warranties
            </h2>
            <p>
              SyncPrep is provided “as is” and “as available.” We do not warrant that the service will be uninterrupted, error-free, or free of harmful components. To the fullest extent permitted by law, we disclaim all warranties, express or implied, including any implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Limitation of liability
            </h2>
            <p>
              To the fullest extent permitted by law, SyncPrep and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or goodwill, arising from your use of or inability to use the service. Our total liability for any claims related to the service shall not exceed the amount you paid us in the twelve months before the claim (or, if you have not paid us, one hundred U.S. dollars). Some jurisdictions do not allow certain limitations; in those jurisdictions, our liability will be limited to the maximum extent permitted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Changes to these terms
            </h2>
            <p>
              We may update these terms from time to time. We will post the updated version on this page and update the “Last updated” date. If changes are material, we may provide additional notice (for example, in the app or by email). Continued use of SyncPrep after changes means you accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Contact
            </h2>
            <p>
              If you have questions about these terms, contact us at{" "}
              <a
                href="mailto:kylerhu1549@gmail.com"
                className="text-slate-900 font-medium underline hover:no-underline"
              >
                kylerhu1549@gmail.com
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-14 pt-8 border-t border-slate-200">
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
