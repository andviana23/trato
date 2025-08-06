"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NextUIProvider } from "@nextui-org/react";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { UnidadeProvider } from "@/components/UnidadeContext";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <UnidadeProvider>
            {children}
          </UnidadeProvider>
        </AuthProvider>
      </NextThemesProvider>
    </NextUIProvider>
  );
} 
