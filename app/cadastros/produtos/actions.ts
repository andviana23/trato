"use server";

import { createClient as createSupabaseServer } from "@/lib/supabase/server";
import { getCurrentUnidade, produtosTableForUnit, UnidadeSlug } from "@/lib/unidade";
import { productSchema, type Product, importCsvSchema } from "./schemas";

export type ListParams = {
  search?: string;
  status?: "ativos" | "todos";
  page?: number; // 1-based
  perPage?: number;
  sortBy?: "nome" | "valor" | "quantidade";
  sortDir?: "asc" | "desc";
};

export async function listProducts(params: ListParams) {
  const supabase = await createSupabaseServer();
  const unidade: UnidadeSlug = await getCurrentUnidade();
  const table = produtosTableForUnit(unidade);

  const page = params.page ?? 1;
  const perPage = params.perPage ?? 10;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const term = (params.search ?? "").trim();
  const sortBy = params.sortBy ?? "nome";
  const sortDir = params.sortDir ?? "asc";

  // Tentativas progressivas de select para lidar com colunas ausentes
  const selects = [
    "id, nome, categoria, marca, quantidade, valor, custo, ativo, estoque_minimo",
    "id, nome, categoria, marca, quantidade, valor, custo, ativo",
    "id, nome, categoria, marca, quantidade, valor, ativo",
    "id, nome, categoria, marca, quantidade, valor", // sem ativo
  ];

  let data: any[] | null = null;
  let error: any = null;
  let count: number | null = null;

  for (const sel of selects) {
    let q = supabase.from(table).select(sel, { count: "exact" });
    if (term) q = (q as any).or(`nome.ilike.%${term}%,categoria.ilike.%${term}%,marca.ilike.%${term}%`);
    // status ativos: se 'ativo' está no select, usa OR; caso contrário, apenas quantidade>0
    const hasAtivo = sel.includes("ativo");
    if ((params.status ?? 'ativos') === 'ativos') {
      q = hasAtivo ? (q as any).or("ativo.is.true,quantidade.gt.0") : (q as any).gt('quantidade', 0);
    }
    q = (q as any).order(sortBy, { ascending: sortDir === 'asc' }).range(from, to);
    const res = await (q as any);
    if (res.error && res.error.code === '42703') {
      // tenta próxima seleção
      continue;
    }
    data = res.data as any[];
    count = res.count ?? 0;
    error = res.error;
    break;
  }
  if (error) throw error;
  const rows: Product[] = ((data as any[]) ?? []).map((d: any) => ({
    id: String(d.id),
    nome: d.nome,
    categoria: d.categoria ?? "",
    marca: d.marca ?? "",
    valor: Number(d.valor ?? 0),
    custo: Number((d as any).custo ?? 0),
    quantidade: Number(d.quantidade ?? 0),
    ativo: Boolean(d.ativo ?? true),
    estoque_minimo: Number(d.estoque_minimo ?? 0),
  }));
  return { rows, total: count ?? 0 };
}

export async function createProduct(p: Product) {
  const supabase = await createSupabaseServer();
  const unidade: UnidadeSlug = await getCurrentUnidade();
  const table = produtosTableForUnit(unidade);
  const parsed = productSchema.omit({ id: true }).parse(p);
  const { error } = await supabase.from(table).insert(parsed);
  if (error) throw error;
}

export async function updateProduct(p: Product) {
  if (!p.id) throw new Error("Produto sem id");
  const supabase = await createSupabaseServer();
  const unidade: UnidadeSlug = await getCurrentUnidade();
  const table = produtosTableForUnit(unidade);
  const parsed = productSchema.parse(p);
  const { error } = await supabase.from(table).update(parsed).eq("id", parsed.id);
  if (error) throw error;
}

export async function updateStock(id: string, quantidade: number) {
  const supabase = await createSupabaseServer();
  const unidade: UnidadeSlug = await getCurrentUnidade();
  const table = produtosTableForUnit(unidade);
  const { error } = await supabase.from(table).update({ quantidade }).eq("id", id);
  if (error) throw error;
}

export async function updateMinStock(id: string, estoque_minimo: number) {
  const supabase = await createSupabaseServer();
  const unidade: UnidadeSlug = await getCurrentUnidade();
  const table = produtosTableForUnit(unidade);
  const { error } = await supabase.from(table).update({ estoque_minimo }).eq("id", id);
  if (error) throw error;
}

export async function deleteProducts(ids: string[]) {
  const supabase = await createSupabaseServer();
  const unidade: UnidadeSlug = await getCurrentUnidade();
  const table = produtosTableForUnit(unidade);
  const { error } = await supabase.from(table).delete().in("id", ids);
  if (error) throw error;
}

export async function exportCsv(params: ListParams & { onlyLowStock?: boolean }): Promise<string> {
  const { rows } = await listProducts({ ...params, page: 1, perPage: 10000 });
  const header = ["Id", "Nome", "Categoria", "Preço R$", "Custo R$", "Estoque", "Mínimo"].join(";");
  const data = params.onlyLowStock ? rows.filter(r => (r.quantidade || 0) <= (r.estoque_minimo || 0)) : rows;
  const body = data
    .map((r) => [r.id, r.nome, r.categoria, r.valor.toFixed(2), (r.custo ?? 0).toFixed(2), r.quantidade, (r as any).estoque_minimo ?? 0].join(";"))
    .join("\n");
  return `${header}\n${body}`;
}

export async function importCsv(payload: { content: string }) {
  const supabase = await createSupabaseServer();
  const unidade: UnidadeSlug = await getCurrentUnidade();
  const table = produtosTableForUnit(unidade);
  const { content } = importCsvSchema.parse(payload);
  const lines = content.trim().split(/\r?\n/);
  const items: Product[] = [];
  const errors: { line: number; error: string }[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i].trim();
    if (!raw) continue;
    const parts = raw.split(";");
    if (parts.length < 6) {
      errors.push({ line: i + 1, error: "Colunas insuficientes" });
      continue;
    }
    try {
      const [nome, categoria, preco, custo, estoque, ativo] = parts;
      const item: Product = productSchema
        .omit({ id: true })
        .parse({
          nome: nome.trim(),
          categoria: categoria.trim(),
          valor: Number(String(preco).replaceAll(".", "").replace(",", ".")),
          custo: Number(String(custo).replaceAll(".", "").replace(",", ".")),
          quantidade: Number(estoque),
          ativo: String(ativo ?? "true").toLowerCase().startsWith("t"),
        });
      items.push(item);
    } catch (e: any) {
      errors.push({ line: i + 1, error: e?.message ?? "Linha inválida" });
    }
  }
  if (items.length) {
    const { error } = await supabase.from(table).insert(items);
    if (error) throw error;
  }
  return { inserted: items.length, errors };
}


