import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UnidadeState {
  unidade: string;
  setUnidade: (unidade: string) => void;
}

export const useUnidadeStore = create<UnidadeState>()(
  persist(
    (set) => ({
      unidade: 'Trato de Barbados',
      setUnidade: (unidade: string) => set({ unidade }),
    }),
    {
      name: 'unidade-storage',
      partialize: (state) => ({ unidade: state.unidade }),
    }
  )
);
