# Trato de Barbados — Sistema de Gestão para Barbearias (Next.js + Chakra UI)

Sistema completo para gestão de barbearias, incluindo assinaturas, clientes, profissionais, agendamentos, distribuição de comissões, metas e integrações financeiras.

---

## 🚀 Principais funcionalidades

- Autenticação (login, cadastro, recuperação de senha) com Supabase
- Gestão de assinaturas (planos, assinantes, cancelamento)
- Dashboard financeiro e de clientes
- Integração ASAAS (assinaturas e pagamentos) e pagamentos externos
- Cadastros: profissionais, serviços, produtos
- Fila de atendimento inteligente (lista da vez) com reorganização automática
- Sistema de metas por unidade (Trato/BarberBeer) e bonificações
- Distribuição de comissão mensal (assinaturas + avulsos + vendas de produtos)
- UI responsiva com Chakra UI 3 (100% dos componentes de UI são Chakra) e Tailwind como utilitário
- Tema claro/escuro

---

## 📛 Stack

- Next.js 15 (App Router)
- React 18.3.x
- TypeScript 5
- Chakra UI 3 (+ @chakra-ui/next-js, Emotion)
- Tailwind CSS 3.4
- Supabase (Auth, DB, Storage)
- Radix UI (componentes pontuais)
- DnD Kit, Chart.js/Recharts, Day.js, React Hook Form + Zod

---

## 🖥 Pré-requisitos

- Node.js >= 18
- npm >= 9 (ou yarn >= 1.22)
- Conta no Supabase e (opcional) no ASAAS

---

## ⚙️ Instalação

1. Clonar e instalar

```bash
git clone <repo>
cd trato
npm install
```

2. Variáveis de ambiente (crie `.env.local` na raiz `trato/`)

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
# Chaves ASAAS conforme sua integração
NEXT_PUBLIC_COMMISSION_PERCENT=0.4
NEXT_PUBLIC_COMMISSION_PERCENT_TRATO=0.4
NEXT_PUBLIC_COMMISSION_PERCENT_BBSC=0.4
NEXT_PUBLIC_TRATO_UNIDADE_ID=244c0543-7108-4892-9eac-48186ad1d5e7
NEXT_PUBLIC_BBSC_UNIDADE_ID=87884040-cafc-4625-857b-6e0402ede7d7
```

3. Banco de dados (Supabase)

- Execute as migrações em `supabase/migrations/`
- Para metas, use `trato/sql/metas_tables.sql`
- Para fila de barbeiros, execute `scripts/add_passou_vez_field.sql`

---

## ▶️ Executar

Desenvolvimento

```bash
npm run dev
```

Build/produção

```bash
npm run build
npm start
```

Aplicação em `http://localhost:3000`

---

## 🧭 Estrutura (parcial)

- `app/` — rotas (App Router)
- `components/` — componentes compartilhados (Chakra)
- `lib/` — serviços (`supabase`, `services/*`)
- `hooks/` — hooks de domínio (ex.: `useBarberQueue`)
- `scripts/` — utilitários e SQLs auxiliares
- `docs/` — documentação de metas e troubleshooting

---

## 📚 Documentação Supabase (Relatórios e multi‑unidade)

- Guia completo: [`docs/supabase-relatorios.md`](docs/supabase-relatorios.md)
  - Esquema (`receitas`, `despesas`, `agendamentos`), índices e views
  - RLS por unidade com `current_unidade()`
  - Padrões de integração em Server Actions (Next.js)
  - Blocos SQL de backfill e testes rápidos

---

## 💈 Distribuição de Comissão (Resumo)

- Faturamento do mês = pagamentos ASAAS confirmados + assinaturas internas
- Comissão total = 40% do faturamento
- Rateio por barbeiro proporcional aos minutos trabalhados
- Soma comissão avulsa (tabela `comissoes_avulsas`)
- Exibe metas de produtos (faixas) e progresso por barbeiro

Telas relacionadas

- `dashboard/distribuicao/comissao` (Trato)
- `dashboard/distribuicao-bbsc/comissao` (BarberBeer)
- `dashboard/distribuicao/comissao-avulsa`
- `dashboard/distribuicao/produtos`

---

## 🔐 Autenticação e Roles

- Perfis e permissões documentados em `CORREÇÕES_AUTENTICAÇÃO.md`
- Role `recepcionista` incluído (ver script `scripts/add-recepcionista-role.*`)

---

## 🧪 Testes e qualidade

- ESLint configurado (`npm run lint`)
- Recomenda-se Jest para unitários/integrados

---

## 🐛 Troubleshooting (rápido)

- Variáveis Supabase indefinidas: ver `RESOLVER_ERRO_ENV.md`
- Metas: ver `docs/TROUBLESHOOTING_METAS.md`
- Fila de barbeiros: ver `IMPLEMENTAÇÃO_FILA_BARBEIROS.md`

---

## 📦 Dependências principais (trecho)

- `@chakra-ui/react`, `@chakra-ui/next-js`, `@emotion/*`
- `@supabase/supabase-js`, `@supabase/ssr`
- `react`/`react-dom` 18.3.x, `next` 15
- `tailwindcss`, `postcss`, `autoprefixer`
- `dayjs`, `react-hook-form`, `zod`

---

## 📄 Licença

MIT

---

## ✍️ Créditos

Trato de Barbados — Time de desenvolvimento
