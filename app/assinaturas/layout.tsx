"use client";

import { ReactNode } from "react";

interface AssinaturasLayoutProps {
  children: ReactNode;
}

export default function AssinaturasLayout({ children }: AssinaturasLayoutProps) {
  return (
    <>
      {children}
    </>
  );
} 
