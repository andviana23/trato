## Supabase — Esquema e Integração (Relatórios e Multi‑Unidade)

Este documento resume a modelagem, políticas de segurança (RLS), views e padrões de integração usados nos painéis de Relatórios. Serve como referência rápida para novas páginas e manutenções futuras.

### Conceito de Multi‑Unidade

- **Unidades suportadas**: `trato` e `barberbeer`.
- A unidade atual vem da claim/cookie `tb.unidade`. No backend, usamos a função `current_unidade()` para ler essa informação no contexto do Supabase (JWT).

### Função utilitária (JWT → unidade)

```sql
-- Lê a unidade da claim 'tb.unidade'; fallback para 'trato'.
create or replace function current_unidade() returns text
language sql stable
as $$
  select coalesce(nullif((auth.jwt() ->> 'tb.unidade'), ''), 'trato');
$$;
```

### Tabelas

1. Receitas

- Finalidade: registrar entradas efetivamente compensadas.
- Colunas: `id uuid`, `unidade text`, `data_competencia date`, `valor numeric(12,2)`, `forma_pagamento text`, `origem text`, `status text`, `created_at timestamptz`.
- Índices: `(unidade, data_competencia)`, `(unidade, forma_pagamento)`.

2. Despesas

- Finalidade: registrar saídas efetivadas.
- Colunas: `id uuid`, `unidade text`, `data_competencia date`, `valor numeric(12,2)`, `categoria text`, `status text`, `created_at timestamptz`.
- Índices: `(unidade, data_competencia)`, `(unidade, categoria)`.

3. Agendamentos

- Finalidade: registrar agendamentos normalizados.
- Colunas: `id uuid`, `unidade text`, `data date`, `status text`, `origem text`, `created_at timestamptz`.
- Índices: `(unidade, data)`, `(unidade, status)`.

Observações de domínio

- `status` em receitas: usamos `compensado` para filtrar valores recebidos.
- `status` em despesas: usamos `efetivado` para saídas confirmadas.
- `origem` em receitas: `assinatura` | `servico` | `produto` (pode expandir conforme necessário).
- `origem` em agendamentos: `online` | `presencial`.

### RLS (Row‑Level Security)

Todas as tabelas acima têm RLS habilitado e policies que restringem o acesso à unidade corrente:

```sql
alter table public.receitas enable row level security;
alter table public.despesas enable row level security;
alter table public.agendamentos enable row level security;

-- Padrão para criar/atualizar policies (usar DROP + CREATE)
drop policy if exists sel_receitas_unidade on public.receitas;
create policy sel_receitas_unidade on public.receitas
for select using (unidade = current_unidade());

drop policy if exists ins_receitas_unidade on public.receitas;
create policy ins_receitas_unidade on public.receitas
for insert with check (unidade = current_unidade());

drop policy if exists upd_receitas_unidade on public.receitas;
create policy upd_receitas_unidade on public.receitas
for update using (unidade = current_unidade())
with check (unidade = current_unidade());

drop policy if exists del_receitas_unidade on public.receitas;
create policy del_receitas_unidade on public.receitas
for delete using (unidade = current_unidade());

-- Replicar o mesmo padrão para despesas e agendamentos
```

Porque não usar IF NOT EXISTS em policies?

- O PostgreSQL ainda não suporta `create policy if not exists`. Use `drop policy if exists` antes do `create policy` para idempotência.

### Views de Apoio

1. `vw_financeiro_diario`

- Objetivo: agregação diária de receitas e despesas por unidade (base para gráficos de linha).

```sql
create or replace view public.vw_financeiro_diario as
select
  d::date as dia,
  unidade,
  coalesce(sum(valor) filter (where tipo = 'receita'), 0) as receita,
  coalesce(sum(valor) filter (where tipo = 'despesa'), 0) as despesa
from (
  select r.data_competencia as d, r.unidade, r.valor, 'receita'::text as tipo
  from public.receitas r where r.status = 'compensado'
  union all
  select d.data_competencia as d, d.unidade, d.valor, 'despesa'::text as tipo
  from public.despesas d where d.status = 'efetivado'
) t
group by d::date, unidade;
```

2. `vw_agenda_status_periodo`

- Objetivo: contagem por status/dia/unidade (base para tabelas e séries da Agenda).

```sql
create or replace view public.vw_agenda_status_periodo as
select
  unidade,
  date_trunc('day', data)::date as dia,
  status,
  count(*)::int as quantidade
from public.agendamentos
group by unidade, date_trunc('day', data)::date, status;
```

3. `vw_pagamentos_por_forma`

- Objetivo: somatório por forma de pagamento da unidade (base para gráfico de pizza).

```sql
create or replace view public.vw_pagamentos_por_forma as
select
  unidade,
  forma_pagamento,
  sum(valor)::numeric(12,2) as total
from public.receitas
where status = 'compensado'
group by unidade, forma_pagamento;
```

### Padrões de Integração no Next.js

- Cliente servidor: `@/lib/supabase/server` → `createClient()`.
- Unidade atual: `@/lib/unidade` → `getCurrentUnidade()`.
- Filtro de período: datas `YYYY-MM-DD` via query string (`from`, `to`).
- Server Actions sempre limitam por `unidade` + intervalo de datas.

Exemplo (resumo) de Server Action para Relatórios — Principal

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUnidade } from "@/lib/unidade";

export async function getPrincipalData({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  const supabase = await createClient();
  const unidade = await getCurrentUnidade();
  const receitas = await supabase
    .from("receitas")
    .select("*")
    .eq("unidade", unidade)
    .gte("data_competencia", from)
    .lte("data_competencia", to)
    .eq("status", "compensado");
  // ... despesas, agendamentos, agregações
  return {
    /* kpis, séries, percentuais */
  };
}
```

### Boas práticas

- Sempre use `getCurrentUnidade()` e verifique RLS ativo.
- Para migrações, prefira `drop ... if exists` antes de `create` ao lidar com policies.
- Indexe colunas usadas em filtros (ex.: `(unidade, data_competencia)`).
- Para janelas longas (ex.: 12 meses), considere materialized views ou RPCs dedicadas.

### Backfill / Ajustes comuns

```sql
-- Se precisar padronizar colunas em bases existentes
alter table public.agendamentos add column if not exists origem text default 'presencial';
alter table public.receitas add column if not exists forma_pagamento text default 'dinheiro';
alter table public.receitas add column if not exists origem text default 'servico';
alter table public.receitas add column if not exists status text default 'compensado';
alter table public.despesas add column if not exists categoria text default 'geral';
alter table public.despesas add column if not exists status text default 'efetivado';
```

### Testes rápidos

1. Verificar isolamento por unidade:

```sql
select * from public.receitas where unidade <> current_unidade(); -- deve retornar 0 linhas
```

2. Conferir views:

```sql
select * from public.vw_financeiro_diario where unidade = current_unidade() order by dia desc limit 5;
```

### Glossário

- "Projetado": projeção de faturamento diário (distribuição simples da meta mensal por dias úteis; pode ser substituída por metas específicas quando existirem).
- "Realizado": somatória de receitas compensadas por dia no período.
















