"use client";
import { useUnidadeStore } from '@/lib/stores';

// Componente de compatibilidade para migração gradual
export function UnidadeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Hook de compatibilidade que usa a store Zustand
export const useUnidade = () => {
  const { unidade, setUnidade } = useUnidadeStore();
  return { unidade, setUnidade };
};