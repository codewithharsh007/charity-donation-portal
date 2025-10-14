'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-red-500 border-t-transparent"></div>
        <p className="text-gray-400">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
