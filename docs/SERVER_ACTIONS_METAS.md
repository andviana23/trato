# Server Actions de Metas - Documentação

Este documento descreve as Server Actions implementadas para gerenciamento de metas no sistema Trato.

## Visão Geral

Todas as Server Actions seguem os padrões estabelecidos:

- Retornam `ActionResult<T>` para consistência
- Usam validação com Zod
- Implementam tratamento de erros com try...catch
- Revalidam o cache das páginas relevantes após operações de sucesso

## Funções Implementadas

### 1. createMeta ✅ (Concluída e Padronizada)

**Objetivo**: Criar uma nova meta no banco de dados.

**Parâmetros**: `CreateMetaInput`

```typescript
{
  professionalId: string;      // UUID do profissional
  unidadeId: string;          // UUID da unidade
  month: number;              // Mês (1-12)
  year: number;               // Ano (2020-2030)
  targetRevenue: number;      // Meta de faturamento
  targetAppointments: number; // Meta de agendamentos
  targetServices: number;     // Meta de serviços
  commissionRate: number;     // Taxa de comissão (0-1)
  notes?: string;             // Observações opcionais
  createdBy: string;          // UUID do usuário que criou
}
```

**Funcionalidades**:

- Validação completa com Zod
- Verificação de metas duplicadas no mesmo período
- Inserção no banco de dados
- Revalidação de cache das páginas de metas

**Retorno**: `ActionResult<Meta>`

### 2. updateMeta ✅ (Concluída e Padronizada)

**Objetivo**: Modificar os detalhes de uma meta existente.

**Parâmetros**: `UpdateMetaInput`

```typescript
{
  id: string;                 // UUID da meta (obrigatório)
  targetRevenue?: number;     // Nova meta de faturamento (opcional)
  targetAppointments?: number; // Nova meta de agendamentos (opcional)
  targetServices?: number;    // Nova meta de serviços (opcional)
  commissionRate?: number;    // Nova taxa de comissão (opcional)
  notes?: string;             // Observações (opcional)
}
```

**Funcionalidades**:

- Validação com Zod
- Verificação de existência da meta
- Proteção contra alteração de metas inativas
- Atualização no banco de dados
- Revalidação de cache

**Retorno**: `ActionResult<Meta>`

### 3. calculateBonus 🆕 (Nova Implementação)

**Objetivo**: Calcular o valor do bônus para uma meta com base no progresso.

**Parâmetros**: `metaId: string`

**Funcionalidades**:

- Validação do ID da meta
- Cálculo automático do progresso
- Lógica de bônus por metas atingidas:
  - 100% faturamento: 10% do valor da meta
  - 100% agendamentos: 5% do valor da meta
  - 100% serviços: 3% do valor da meta
  - 120%+ faturamento: 15% extra
- Não revalida cache (apenas consulta)

**Retorno**: `ActionResult<{ bonusAmount: number; isEligible: boolean; details: string }>`

### 4. applyMonthlyBonus 🆕 (Nova Implementação)

**Objetivo**: Processar e aplicar bônus mensalmente.

**Parâmetros**: Nenhum (processamento automático)

**Funcionalidades**:

- Processamento automático do mês anterior
- Cálculo de bônus para todas as metas qualificadas
- Criação de registros na tabela `bonus`
- Prevenção de duplicação de bônus
- Revalidação de cache das páginas relevantes

**Retorno**: `ActionResult<{ processed: number; totalBonus: number }>`

### 5. getMetaProgress 🆕 (Nova Implementação)

**Objetivo**: Obter o progresso atual de uma meta específica para exibição.

**Parâmetros**: `metaId: string`

**Funcionalidades**:

- Validação do ID da meta
- Cálculo de métricas em tempo real:
  - Receita atual vs. meta
  - Agendamentos atuais vs. meta
  - Serviços atuais vs. meta
  - Percentuais de progresso
  - Comissões e bônus calculados
- Não revalida cache (apenas consulta)

**Retorno**: `ActionResult<MetaProgress>`

### 6. searchMetas 🆕 (Nova Implementação)

**Objetivo**: Buscar metas com filtros e paginação.

**Parâmetros**: `SearchMetasInput`

```typescript
{
  unidadeId: string;          // UUID da unidade (obrigatório)
  professionalId?: string;     // UUID do profissional (opcional)
  month?: number;             // Mês (opcional)
  year?: number;              // Ano (opcional)
  isActive?: boolean;         // Status ativo (opcional)
  page: number;               // Página (padrão: 1)
  limit: number;              // Limite por página (padrão: 20)
}
```

**Funcionalidades**:

- Validação com Zod
- Filtros avançados
- Paginação automática
- Cálculo de progresso para cada meta
- Ordenação por período (mais recente primeiro)

**Retorno**: `ActionResultPaginated<MetaWithProgress>`

## Estrutura de Dados

### Tabela `metas`

```sql
CREATE TABLE metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professionalId UUID NOT NULL REFERENCES professionals(id),
  unidadeId UUID NOT NULL REFERENCES unidades(id),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2030),
  targetRevenue DECIMAL(10,2) NOT NULL CHECK (targetRevenue > 0),
  targetAppointments INTEGER NOT NULL CHECK (targetAppointments > 0),
  targetServices INTEGER NOT NULL CHECK (targetServices > 0),
  commissionRate DECIMAL(3,2) NOT NULL CHECK (commissionRate >= 0 AND commissionRate <= 1),
  notes TEXT,
  isActive BOOLEAN DEFAULT true,
  createdBy UUID NOT NULL REFERENCES auth.users(id),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabela `bonus`

```sql
CREATE TABLE bonus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metaId UUID NOT NULL REFERENCES metas(id),
  professionalId UUID NOT NULL REFERENCES professionals(id),
  unidadeId UUID NOT NULL REFERENCES unidades(id),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  baseAmount DECIMAL(10,2) NOT NULL,
  bonusAmount DECIMAL(10,2) NOT NULL,
  totalAmount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paidAt TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Exemplos de Uso

### Criar Nova Meta

```typescript
import { createMeta } from "@/app/actions/metas";

const result = await createMeta({
  professionalId: "uuid-do-profissional",
  unidadeId: "uuid-da-unidade",
  month: 1,
  year: 2024,
  targetRevenue: 5000.0,
  targetAppointments: 50,
  targetServices: 60,
  commissionRate: 0.15,
  notes: "Meta de janeiro - alta temporada",
  createdBy: "uuid-do-usuario",
});

if (result.success) {
  console.log("Meta criada:", result.data);
} else {
  console.error("Erro:", result.error);
}
```

### Calcular Bônus

```typescript
import { calculateBonus } from "@/app/actions/metas";

const result = await calculateBonus("uuid-da-meta");

if (result.success) {
  const { bonusAmount, isEligible, details } = result.data;
  if (isEligible) {
    console.log(`Bônus calculado: R$ ${bonusAmount}`);
    console.log("Detalhes:", details);
  } else {
    console.log("Meta ainda não atingida");
  }
} else {
  console.error("Erro:", result.error);
}
```

### Aplicar Bônus Mensal

```typescript
import { applyMonthlyBonus } from "@/app/actions/metas";

const result = await applyMonthlyBonus();

if (result.success) {
  const { processed, totalBonus } = result.data;
  console.log(`${processed} metas processadas`);
  console.log(`Total de bônus: R$ ${totalBonus}`);
} else {
  console.error("Erro:", result.error);
}
```

### Verificar Progresso

```typescript
import { getMetaProgress } from "@/app/actions/metas";

const result = await getMetaProgress("uuid-da-meta");

if (result.success) {
  const progress = result.data;
  console.log(`Progresso faturamento: ${progress.revenuePercentage}%`);
  console.log(`Progresso agendamentos: ${progress.appointmentsPercentage}%`);
  console.log(`Meta atingida: ${progress.isTargetReached ? "Sim" : "Não"}`);
} else {
  console.error("Erro:", result.error);
}
```

## Revalidação de Cache

As funções que modificam dados revalidam automaticamente os seguintes caminhos:

- `/metas` - Página geral de metas
- `/dashboard/metas` - Dashboard de metas
- `/dashboard/metas/{unidadeId}` - Dashboard específico da unidade
- `/dashboard/bonus` - Dashboard de bônus

## Tratamento de Erros

Todas as funções implementam tratamento de erros consistente:

1. **Validação**: Erros de validação Zod são capturados e retornados
2. **Banco de Dados**: Erros de operações no banco são logados e retornados
3. **Exceções**: Erros inesperados são capturados e logados
4. **Retorno**: Sempre retorna `ActionResult<T>` com `success: false` em caso de erro

## Lógica de Bônus

O sistema implementa uma estrutura de bônus baseada em múltiplos critérios:

- **Bônus Base**: Por atingir 100% de cada tipo de meta
- **Bônus Extra**: Por superar 120% da meta de faturamento
- **Cálculo Automático**: Baseado no progresso real dos agendamentos
- **Prevenção de Duplicação**: Verifica se o bônus já foi aplicado

## Considerações de Performance

- **Índices**: Certifique-se de que as tabelas tenham índices apropriados
- **Paginação**: A função `searchMetas` implementa paginação para grandes volumes
- **Cache**: Use a revalidação de cache para manter a interface atualizada
- **Cálculos**: Os cálculos de progresso são otimizados para evitar consultas desnecessárias

## Próximos Passos

1. **Implementar tabelas** `metas` e `bonus` no banco de dados
2. **Criar interface de usuário** para gerenciamento de metas
3. **Configurar job automático** para aplicação mensal de bônus
4. **Adicionar testes unitários** para as novas funções
5. **Implementar relatórios** de performance e bônus
6. **Criar dashboard** de acompanhamento de metas em tempo real
