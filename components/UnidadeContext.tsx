"use client";
import { createContext, useContext, useState, useEffect } from "react";

const UnidadeContext = createContext({ unidade: "Trato de Barbados", setUnidade: (u: string) => {} });

export function UnidadeProvider({ children }: { children: React.ReactNode }) {
  const [unidade, setUnidade] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("unidade") || "Trato de Barbados" : "Trato de Barbados"
  );
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("unidade", unidade);
    }
  }, [unidade]);
  return (
    <UnidadeContext.Provider value={{ unidade, setUnidade }}>
      {children}
    </UnidadeContext.Provider>
  );
}
export const useUnidade = () => useContext(UnidadeContext);