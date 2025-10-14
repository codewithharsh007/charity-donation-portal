'use client';

export default function UsersPage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">User Management</h1>
          <p className="mt-2 text-gray-400">Manage all users and their permissions</p>
        </div>

        <div className="rounded-2xl bg-gray-800 p-12 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/20">
            <svg className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Coming Soon</h2>
          <p className="mt-2 text-gray-400">User management features will be available here</p>
        </div>
      </div>
    </div>
  );
}
