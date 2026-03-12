import Link from "next/link";

export default function PrivacyPage() {
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
          Privacy Policy
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
              SyncPrep helps you find overlapping meeting times across time zones and prepare for meetings. You can connect your Google Calendar so we can see when you’re busy, and you can optionally provide a resume, job description, or meeting context so we can generate prep insights using AI. This policy explains what information we access, how we use it, and how we work with third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Information we access
            </h2>
            <p>
              We only access information that is necessary to run the product:
            </p>
            <ul className="mt-3 list-disc list-inside space-y-2 pl-1">
              <li><strong>Google Calendar</strong> — If you connect your calendar, we read your events to understand your availability.</li>
              <li><strong>User-provided materials</strong> — Anything you type or paste into SyncPrep, such as meeting context, resume text, or job descriptions, when you use the prep or scheduling features.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Google Calendar
            </h2>
            <p>
              If you connect Google Calendar, we use <strong>read-only</strong> access to your events. We use this solely to identify when you are busy and when you have open slots. We do not create, edit, or delete any calendar events. We do not permanently store your Google Calendar data on our servers; we use it to compute availability and show it to you in the app. You can disconnect your calendar at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              User-provided materials
            </h2>
            <p>
              When you enter or paste text such as a resume, job description, or meeting context, we use it to generate prep insights (for example, talking points or interview prep). This text may be sent to and processed by third-party AI services so we can return the generated content to you. We do not use this content for training our own models or for purposes unrelated to providing you the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              How we use information
            </h2>
            <p>
              We use the information above only to provide SyncPrep’s features: calculating availability, suggesting meeting times, and generating prep content. We do not sell your personal information. We do not use your data for advertising or to build profiles about you for third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Third-party services
            </h2>
            <p>
              SyncPrep relies on:
            </p>
            <ul className="mt-3 list-disc list-inside space-y-2 pl-1">
              <li><strong>Google APIs</strong> — For calendar access when you choose to connect. Use of Google Calendar is subject to Google’s Privacy Policy.</li>
              <li><strong>AI services</strong> — To generate meeting prep and similar content. Text you provide may be sent to these providers to produce the output you see. Their use of data is governed by their own policies.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Data storage and security
            </h2>
            <p>
              We do not permanently store your Google Calendar data. Session data such as your time zone and selected meeting slot may be kept in your browser (e.g. session storage). No internet transmission or storage is completely secure; we take reasonable steps to protect the data we handle.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Children’s privacy
            </h2>
            <p>
              SyncPrep is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will take steps to delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Changes to this policy
            </h2>
            <p>
              We may update this privacy policy from time to time. We will post the updated version on this page and update the “Last updated” date. Continued use of SyncPrep after changes means you accept the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Contact
            </h2>
            <p>
              If you have questions about this privacy policy or how we handle your data, contact us at{" "}
              <a
                href="mailto:syncprepapp@gmail.com"
                className="text-slate-900 font-medium underline hover:no-underline"
              >
                syncprepapp@gmail.com
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
