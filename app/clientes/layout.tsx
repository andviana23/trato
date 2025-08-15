"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";

export default function ClientesLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [loading, user, router]);

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
