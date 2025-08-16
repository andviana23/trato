"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import ResponsiveAppShell from "@/components/layout/ResponsiveAppShell";

export default function Layout({ children }: { children: React.ReactNode }) {
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

  return <ResponsiveAppShell>{children}</ResponsiveAppShell>;
}


