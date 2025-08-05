'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminNav from '@/components/layouts/AdminNav';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log('Admin Layout - Status:', status, 'Session:', session);
    if (status === 'unauthenticated' || (session && !session.user?.isAdmin)) {
      console.log('Redirecting to login - Not admin or not authenticated');
      router.push('/auth/login?error=AdminAccessRequired');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session || !session.user?.isAdmin) {
    return null;
  }

  return (
    <div className="container grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <aside className="border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2 py-4">
          <div className="flex-1">
            <AdminNav />
          </div>
        </div>
      </aside>
      <main className="flex flex-col p-4 lg:p-6">{children}</main>
    </div>
  );
}
