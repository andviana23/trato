"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type UnitContextType = {
  unitId: string | null;
  unitName: string | null;
  setUnit: (id: string | null, name?: string | null) => void;
};

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [unitId, setUnitId] = useState<string | null>(null);
  const [unitName, setUnitName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const id = localStorage.getItem("tb.unidade_id");
      const name = localStorage.getItem("tb.unidade_nome");
      if (id) setUnitId(id);
      if (name) setUnitName(name);
    } catch {}
  }, []);

  const setUnit = (id: string | null, name?: string | null) => {
    setUnitId(id);
    if (typeof window !== "undefined") {
      try {
        if (id) localStorage.setItem("tb.unidade_id", id);
        else localStorage.removeItem("tb.unidade_id");
        if (name != null) {
          setUnitName(name);
          localStorage.setItem("tb.unidade_nome", name);
        }
      } catch {}
    }
  };

  return (
    <UnitContext.Provider value={{ unitId, unitName, setUnit }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit(): UnitContextType {
  const ctx = useContext(UnitContext);
  if (!ctx) throw new Error("useUnit must be used within UnitProvider");
  return ctx;
}

// Helper para anexar unidade em queries
export function withUnit<T extends Record<string, any>>(params: T, unitId: string | null): T & { unidade_id?: string } {
  return unitId ? { ...params, unidade_id: unitId } : params;
}



