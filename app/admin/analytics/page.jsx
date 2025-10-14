'use client';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">Analytics & Reports</h1>
          <p className="mt-2 text-gray-400">View platform statistics and insights</p>
        </div>

        <div className="rounded-2xl bg-gray-800 p-12 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/20">
            <svg className="h-10 w-10 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Coming Soon</h2>
          <p className="mt-2 text-gray-400">Analytics and reporting features will be available here</p>
        </div>
      </div>
    </div>
  );
}
