import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-semibold text-gray-900">SyncPrep</span>
          <Link
            href="/schedule"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            Get started
          </Link>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center max-w-2xl mb-4">
          Schedule across time zones. Prepare with AI.
        </h1>
        <p className="text-lg text-gray-600 text-center max-w-xl mb-10">
          Find the best meeting times for you and your contact, then get structured prep notes—including resume and job description analysis for interviews.
        </p>
        <Link
          href="/schedule"
          className="rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 transition"
        >
          Start scheduling
        </Link>
        <ul className="mt-16 grid gap-6 sm:grid-cols-3 text-center max-w-3xl">
          <li className="p-4">
            <span className="block text-2xl font-semibold text-gray-900 mb-1">Timezone-aware</span>
            <span className="text-gray-600">Enter two time zones and availability. See overlapping slots and top suggestions.</span>
          </li>
          <li className="p-4">
            <span className="block text-2xl font-semibold text-gray-900 mb-1">Calendar link</span>
            <span className="text-gray-600">One click to open a Google Calendar event for your chosen time.</span>
          </li>
          <li className="p-4">
            <span className="block text-2xl font-semibold text-gray-900 mb-1">AI prep notes</span>
            <span className="text-gray-600">Meeting context plus optional resume & job description for structured prep.</span>
          </li>
        </ul>
      </main>
    </div>
  );
}
