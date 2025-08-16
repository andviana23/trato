"use client";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const ResponsiveAgenda = dynamic(() => import("./components/ResponsiveAgenda"), { ssr: false });

export default function AgendaPage() {
  return (
    <Suspense fallback={<div className="p-6">Carregando…</div>}>
      <ResponsiveAgenda />
    </Suspense>
  );
}