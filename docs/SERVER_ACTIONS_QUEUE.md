# Server Actions de Fila - Documentação

Este documento descreve as Server Actions implementadas para gerenciamento de fila de atendimento no sistema Trato.

## Visão Geral

Todas as Server Actions seguem os padrões estabelecidos:

- Retornam `ActionResult<T>` para consistência
- Usam validação com Zod
- Implementam tratamento de erros com try...catch
- Revalidam o cache das páginas relevantes após operações de sucesso

## Funções Implementadas

### 1. addToQueue ✅ (Concluída e Padronizada)

**Objetivo**: Adicionar um novo cliente à fila de atendimento.

**Parâmetros**: `AddToQueueInput`

```typescript
{
  clientId: string;           // UUID do cliente
  unidadeId: string;          // UUID da unidade
  priority: 'normal' | 'prioritaria' | 'urgente'; // Prioridade (padrão: 'normal')
  estimatedWaitTime?: number; // Tempo estimado de espera em minutos
  notes?: string;             // Observações opcionais
  addedBy: string;            // UUID do usuário que adicionou
}
```

**Funcionalidades**:

- Validação completa com Zod
- Verificação de clientes duplicados na fila
- Cálculo automático da próxima posição
- Inserção no banco de dados
- Revalidação de cache das páginas de fila

**Retorno**: `ActionResult<QueueItem>`

### 2. attendNext ✅ (Concluída e Padronizada)

**Objetivo**: Marcar o próximo cliente da fila como "em atendimento".

**Parâmetros**: `CallNextFromQueueInput`

```typescript
{
  unidadeId: string; // UUID da unidade
  professionalId: string; // UUID do profissional
  calledBy: string; // UUID do usuário que chamou
}
```

**Funcionalidades**:

- Validação com Zod
- Busca inteligente do próximo cliente (prioridade + posição)
- Atualização de status para 'em_atendimento'
- Registro do horário de início do atendimento
- Revalidação de cache

**Retorno**: `ActionResult<QueueItem>`

### 3. passaTurn 🆕 (Nova Implementação)

**Objetivo**: Mover um cliente para o final da fila, ou seja, "passar a vez".

**Parâmetros**: `queueId: string`

**Funcionalidades**:

- Validação do ID da posição na fila
- Verificação de status (apenas clientes aguardando)
- Cálculo da nova posição (final da fila)
- Reorganização automática das posições
- Revalidação de cache

**Retorno**: `ActionResult<QueueItem>`

### 4. reorganizeQueue 🆕 (Nova Implementação)

**Objetivo**: Reorganizar a fila inteira, manualmente ou com base em uma nova ordem de prioridade.

**Parâmetros**:

```typescript
{
  unidadeId: string;          // UUID da unidade
  newOrder?: string[];        // Lista opcional de IDs na nova ordem
}
```

**Funcionalidades**:

- Reorganização manual com ordem específica
- Reorganização automática por prioridade e ordem de chegada
- Atualização de todas as posições
- Contagem de itens reorganizados
- Revalidação de cache

**Retorno**: `ActionResult<{ message: string; reorganized: number }>`

### 5. getQueueStatus 🆕 (Nova Implementação)

**Objetivo**: Obter a lista completa de clientes na fila, ordenada corretamente para exibição no frontend.

**Parâmetros**: `unidadeId: string`

**Funcionalidades**:

- Busca de todos os itens ativos da fila
- Ordenação por prioridade, posição e ordem de chegada
- Inclusão de detalhes do cliente, serviço e profissional
- Não revalida cache (apenas consulta)

**Retorno**: `ActionResult<QueueItemWithDetails[]>`

### 6. searchQueue 🆕 (Nova Implementação)

**Objetivo**: Buscar itens da fila com filtros e paginação.

**Parâmetros**: `SearchQueueInput`

```typescript
{
  unidadeId: string;          // UUID da unidade (obrigatório)
  clientId?: string;          // UUID do cliente (opcional)
  priority?: string;          // Prioridade (opcional)
  status?: string;            // Status (opcional)
  page: number;               // Página (padrão: 1)
  limit: number;              // Limite por página (padrão: 20)
}
```

**Funcionalidades**:

- Validação com Zod
- Filtros avançados por cliente, prioridade e status
- Paginação automática
- Ordenação por prioridade, posição e data de criação
- Contagem total de resultados

**Retorno**: `ActionResultPaginated<QueueItemWithDetails>`

### 7. removeFromQueue 🆕 (Nova Implementação)

**Objetivo**: Remover cliente da fila com motivo específico.

**Parâmetros**: `RemoveFromQueueInput`

```typescript
{
  id: string;                 // UUID da posição na fila
  reason: 'atendido' | 'cancelado' | 'faltou' | 'transferido';
  notes?: string;             // Observações adicionais
  removedBy: string;          // UUID do usuário que removeu
}
```

**Funcionalidades**:

- Validação com Zod
- Verificação de existência do item
- Atualização de status para 'cancelado'
- Reorganização automática das posições
- Revalidação de cache

**Retorno**: `ActionResult<QueueItem>`

### 8. getQueueStats 🆕 (Nova Implementação)

**Objetivo**: Obter estatísticas completas da fila.

**Parâmetros**: `unidadeId: string`

**Funcionalidades**:

- Contagem total de clientes aguardando
- Tempo médio de espera
- Breakdown por prioridade
- Breakdown por status
- Tempo estimado de conclusão
- Não revalida cache (apenas consulta)

**Retorno**: `ActionResult<QueueStats>`

## Estrutura de Dados

### Tabela `queue`

```sql
CREATE TABLE queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clientId UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  serviceId UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'prioritaria', 'urgente')),
  estimatedWaitTime INTEGER,
  actualWaitTime INTEGER,
  notes TEXT,
  unidadeId UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'chamado', 'em_atendimento', 'finalizado', 'cancelado')),
  position INTEGER NOT NULL,
  assignedProfessionalId UUID REFERENCES professionals(id) ON DELETE SET NULL,
  estimatedStartTime TIMESTAMP WITH TIME ZONE,
  actualStartTime TIMESTAMP WITH TIME ZONE,
  completedAt TIMESTAMP WITH TIME ZONE,
  addedBy UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Exemplos de Uso

### Adicionar Cliente à Fila

```typescript
import { addToQueue } from "@/app/actions/queue";

const result = await addToQueue({
  clientId: "uuid-do-cliente",
  unidadeId: "uuid-da-unidade",
  priority: "normal",
  estimatedWaitTime: 30,
  notes: "Cliente preferencial",
  addedBy: "uuid-do-usuario",
});

if (result.success) {
  console.log("Cliente adicionado à fila:", result.data);
} else {
  console.error("Erro:", result.error);
}
```

### Atender Próximo Cliente

```typescript
import { attendNext } from "@/app/actions/queue";

const result = await attendNext({
  unidadeId: "uuid-da-unidade",
  professionalId: "uuid-do-profissional",
  calledBy: "uuid-do-usuario",
});

if (result.success) {
  console.log("Próximo cliente chamado:", result.data);
} else {
  console.error("Erro:", result.error);
}
```

### Passar a Vez

```typescript
import { passaTurn } from "@/app/actions/queue";

const result = await passaTurn("uuid-da-posicao-fila");

if (result.success) {
  console.log("Cliente passou a vez:", result.data);
} else {
  console.error("Erro:", result.error);
}
```

### Reorganizar Fila

```typescript
import { reorganizeQueue } from "@/app/actions/queue";

// Reorganização automática
const result = await reorganizeQueue("uuid-da-unidade");

// Reorganização manual
const resultManual = await reorganizeQueue("uuid-da-unidade", [
  "id-posicao-1",
  "id-posicao-2",
  "id-posicao-3",
]);

if (result.success) {
  console.log("Fila reorganizada:", result.data.message);
  console.log("Posições atualizadas:", result.data.reorganized);
} else {
  console.error("Erro:", result.error);
}
```

### Verificar Status da Fila

```typescript
import { getQueueStatus } from "@/app/actions/queue";

const result = await getQueueStatus("uuid-da-unidade");

if (result.success) {
  const queueItems = result.data;
  console.log(`Total de clientes na fila: ${queueItems.length}`);

  queueItems.forEach((item, index) => {
    console.log(
      `${index + 1}. ${item.client.name} - ${item.service.name} (${
        item.priority
      })`
    );
  });
} else {
  console.error("Erro:", result.error);
}
```

### Buscar na Fila

```typescript
import { searchQueue } from "@/app/actions/queue";

const result = await searchQueue({
  unidadeId: "uuid-da-unidade",
  priority: "urgente",
  status: "aguardando",
  page: 1,
  limit: 10,
});

if (result.success) {
  const { data, pagination } = result.data;
  console.log(`Mostrando ${data.length} de ${pagination.total} resultados`);
  console.log(`Página ${pagination.page} de ${pagination.totalPages}`);
} else {
  console.error("Erro:", result.error);
}
```

## Revalidação de Cache

As funções que modificam dados revalidam automaticamente os seguintes caminhos:

- `/queue` - Página geral da fila
- `/dashboard/fila` - Dashboard da fila
- `/dashboard/fila/{unidadeId}` - Dashboard específico da unidade

## Tratamento de Erros

Todas as funções implementam tratamento de erros consistente:

1. **Validação**: Erros de validação Zod são capturados e retornados
2. **Banco de Dados**: Erros de operações no banco são logados e retornados
3. **Exceções**: Erros inesperados são capturados e logados
4. **Retorno**: Sempre retorna `ActionResult<T>` com `success: false` em caso de erro

## Lógica de Prioridade

O sistema implementa uma estrutura de prioridade inteligente:

- **Prioridade Alta**: Clientes com status 'urgente' são atendidos primeiro
- **Prioridade Média**: Clientes com status 'prioritaria' são atendidos em seguida
- **Prioridade Normal**: Clientes com status 'normal' são atendidos por ordem de chegada
- **Posição na Fila**: Dentro de cada prioridade, a ordem é mantida por posição

## Sistema de Posições

- **Posição Automática**: Calculada automaticamente ao adicionar cliente
- **Reorganização Inteligente**: Posições são reorganizadas após remoções
- **Manutenção de Ordem**: A ordem é preservada durante operações de fila
- **Posições Únicas**: Cada cliente ativo tem uma posição única na fila

## Considerações de Performance

- **Índices**: Certifique-se de que a tabela tenha índices apropriados
- **Paginação**: A função `searchQueue` implementa paginação para grandes volumes
- **Cache**: Use a revalidação de cache para manter a interface atualizada
- **Ordenação**: As consultas são otimizadas com índices compostos

## Próximos Passos

1. **Implementar tabela `queue`** no banco de dados
2. **Criar interface de usuário** para gerenciamento da fila
3. **Implementar sistema de notificações** para clientes na fila
4. **Adicionar testes unitários** para as novas funções
5. **Criar dashboard** de acompanhamento da fila em tempo real
6. **Implementar sistema de estimativas** de tempo de espera
7. **Criar relatórios** de performance da fila
