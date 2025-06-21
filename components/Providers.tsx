"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NextUIProvider } from "@nextui-org/react";
import { AuthProvider } from "@/lib/contexts/AuthContext";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          {children}
        </AuthProvider>
      </NextThemesProvider>
    </NextUIProvider>
  );
} 
