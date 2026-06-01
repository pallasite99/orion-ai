'use client';

import { AppShell } from '@/components/layout/app-shell';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // TODO: Check authentication status from Supabase
    // For now, assume authenticated
    setAuthenticated(true);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">ORION</h1>
          <div className="animate-pulse text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    router.push('/auth/login');
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
