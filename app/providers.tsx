"use client";
import * as React from "react";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { UnitProvider } from "@/src/contexts/UnitContext";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryProvider } from "@/lib/query/QueryProvider";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryProvider>
        <AuthProvider>
          <UnitProvider>
            {children}
            <Toaster richColors position="top-right" />
          </UnitProvider>
        </AuthProvider>
      </QueryProvider>
    </NextThemesProvider>
  );
}


