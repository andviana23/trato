'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';

export default function RelatoriosLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [loading, user, router]);

  // Garante que exista período padrão (mês corrente) nos params
  useEffect(() => {
    const from = params.get('from');
    const to = params.get('to');
    if (!from || !to) {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const sp = new URLSearchParams(params.toString());
      sp.set('from', first.toISOString().slice(0, 10));
      sp.set('to', last.toISOString().slice(0, 10));
      router.replace(`${pathname}?${sp.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-[100vh] grid place-items-center">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full border-2 border-muted w-5 h-5 border-t-transparent" />
          Carregando...
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <AppShell>{children}</AppShell>;
}







