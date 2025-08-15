import { cookies } from "next/headers";

export type UnidadeSlug = "trato" | "barberbeer";

export function produtosTableForUnit(unidade: UnidadeSlug): string {
  return unidade === "barberbeer" ? "produtos_barberbeer" : "produtos_trato_de_barbados";
}

// Server-side helper to read unidade from cookies or default to 'trato'
export async function getCurrentUnidade(): Promise<UnidadeSlug> {
  try {
    const c = await cookies();
    const v = c.get("tb.unidade")?.value || c.get("unidade")?.value;
    if (v === "barberbeer" || v === "trato") return v;
  } catch {
    // ignore; fallback below
  }
  return "trato";
}

// Retorna o ID da unidade (uuid em string) quando disponível
export async function getCurrentUnidadeId(): Promise<string | null> {
  try {
    const c = await cookies();
    const id = c.get("tb.unidade_id")?.value;
    return id ?? null;
  } catch {
    return null;
  }
}


