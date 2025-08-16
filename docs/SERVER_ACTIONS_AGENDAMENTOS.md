# Server Actions de Agendamentos - Documentação

Este documento descreve as Server Actions implementadas para gerenciamento de agendamentos no sistema Trato.

## Visão Geral

Todas as Server Actions seguem os padrões estabelecidos:
- Retornam `ActionResult<T>` para consistência
- Usam validação com Zod
- Implementam tratamento de erros com try...catch
- Revalidam o cache das páginas relevantes após operações de sucesso

## Funções Implementadas

### 1. createAppointment ✅ (Concluída e Padronizada)

**Objetivo**: Criar um novo agendamento no banco de dados.

**Parâmetros**: `CreateAppointmentInput`
```typescript
{
  clientId: string;           // UUID do cliente
  professionalId: string;      // UUID do profissional
  serviceId: string;          // UUID do serviço
  startTime: string;          // Data/hora de início (ISO)
  endTime: string;            // Data/hora de fim (ISO)
  notes?: string;             // Observações opcionais
  status?: string;            // Status padrão: 'agendado'
  unidadeId: string;          // UUID da unidade
}
```

**Funcionalidades**:
- Validação completa com Zod
- Verificação de conflitos de horário
- Inserção no banco de dados
- Revalidação de cache das páginas de agenda

**Retorno**: `ActionResult<Appointment>`

### 2. updateAppointment ✅ (Concluída e Padronizada)

**Objetivo**: Modificar os detalhes de um agendamento existente.

**Parâmetros**: `UpdateAppointmentInput`
```typescript
{
  id: string;                 // UUID do agendamento (obrigatório)
  clientId?: string;          // UUID do cliente (opcional)
  professionalId?: string;    // UUID do profissional (opcional)
  serviceId?: string;         // UUID do serviço (opcional)
  startTime?: string;         // Nova data/hora de início (opcional)
  endTime?: string;           // Nova data/hora de fim (opcional)
  notes?: string;             // Observações (opcional)
  status?: string;            // Novo status (opcional)
  unidadeId?: string;         // UUID da unidade (opcional)
}
```

**Funcionalidades**:
- Validação com Zod
- Verificação de existência do agendamento
- Proteção contra alteração de agendamentos finalizados
- Atualização no banco de dados
- Revalidação de cache

**Retorno**: `ActionResult<Appointment>`

### 3. cancelAppointment ✅ (Concluída e Padronizada)

**Objetivo**: Cancelar um agendamento.

**Parâmetros**: `CancelAppointmentInput`
```typescript
{
  id: string;                 // UUID do agendamento
  reason: string;             // Motivo do cancelamento
  cancelledBy: string;        // UUID do usuário que cancelou
}
```

**Funcionalidades**:
- Validação com Zod
- Alteração de status para 'cancelado'
- Preservação do histórico (não deleta o registro)
- Revalidação de cache

**Retorno**: `ActionResult<Appointment>`

### 4. blockTimeSlot 🆕 (Nova Implementação)

**Objetivo**: Bloquear um horário para evitar agendamentos futuros.

**Parâmetros**: `BlockTimeSlotInput`
```typescript
{
  unidadeId: string;          // UUID da unidade
  professionalId?: string;     // UUID do profissional (opcional)
  startTime: string;          // Data/hora de início (ISO)
  endTime: string;            // Data/hora de fim (ISO)
  reason: string;             // Motivo do bloqueio
  blockedBy: string;          // UUID do usuário que bloqueou
  isRecurring?: boolean;      // Bloqueio recorrente (padrão: false)
  recurringDays?: number[];   // Dias da semana para recorrência [0-6]
}
```

**Funcionalidades**:
- Validação com Zod
- Verificação de bloqueios existentes
- Suporte a bloqueios recorrentes
- Inserção na tabela `time_blocks`
- Revalidação de cache das páginas de agenda

**Retorno**: `ActionResult<{ id: string; message: string }>`

### 5. checkConflicts 🆕 (Nova Implementação)

**Objetivo**: Verificar se um novo agendamento ou bloqueio se sobrepõe a eventos existentes.

**Parâmetros**: `CheckConflictsInput`
```typescript
{
  unidadeId: string;          // UUID da unidade
  professionalId?: string;     // UUID do profissional (opcional)
  startTime: string;          // Data/hora de início (ISO)
  endTime: string;            // Data/hora de fim (ISO)
  excludeAppointmentId?: string; // UUID do agendamento a excluir da verificação
}
```

**Funcionalidades**:
- Validação com Zod
- Verificação de conflitos em agendamentos
- Verificação de conflitos em bloqueios de horário
- Suporte a exclusão de agendamento específico (para edições)
- Não revalida cache (apenas consulta)

**Retorno**: `ActionResult<{ isAvailable: boolean; conflicts?: Array<Record<string, unknown>> }>`

## Estrutura de Dados

### Tabela `time_blocks`

Para suportar a funcionalidade de bloqueio de horários, é necessária uma tabela com a seguinte estrutura:

```sql
CREATE TABLE time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidadeId UUID NOT NULL REFERENCES unidades(id),
  professionalId UUID REFERENCES professionals(id),
  startTime TIMESTAMP WITH TIME ZONE NOT NULL,
  endTime TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT NOT NULL,
  blockedBy UUID NOT NULL REFERENCES auth.users(id),
  isRecurring BOOLEAN DEFAULT false,
  recurringDays INTEGER[],
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_time_blocks_unidade_time ON time_blocks(unidadeId, startTime, endTime);
CREATE INDEX idx_time_blocks_professional ON time_blocks(professionalId) WHERE professionalId IS NOT NULL;
CREATE INDEX idx_time_blocks_active ON time_blocks(isActive) WHERE isActive = true;
```

## Exemplos de Uso

### Bloquear Horário de Almoço

```typescript
import { blockTimeSlot } from '@/app/actions/appointments';

const result = await blockTimeSlot({
  unidadeId: 'uuid-da-unidade',
  startTime: '2024-01-15T12:00:00Z',
  endTime: '2024-01-15T13:00:00Z',
  reason: 'Horário de almoço',
  blockedBy: 'uuid-do-usuario',
  isRecurring: true,
  recurringDays: [1, 2, 3, 4, 5] // Segunda a sexta
});

if (result.success) {
  console.log('Horário bloqueado:', result.data.message);
} else {
  console.error('Erro:', result.error);
}
```

### Verificar Disponibilidade

```typescript
import { checkConflicts } from '@/app/actions/appointments';

const result = await checkConflicts({
  unidadeId: 'uuid-da-unidade',
  professionalId: 'uuid-do-profissional',
  startTime: '2024-01-15T14:00:00Z',
  endTime: '2024-01-15T15:00:00Z'
});

if (result.success) {
  if (result.data.isAvailable) {
    console.log('Horário disponível!');
  } else {
    console.log('Conflitos encontrados:', result.data.conflicts);
  }
} else {
  console.error('Erro:', result.error);
}
```

## Revalidação de Cache

As funções que modificam dados revalidam automaticamente os seguintes caminhos:

- `/` - Página principal
- `/agenda` - Página geral de agenda
- `/agenda/{unidadeId}` - Página específica da unidade

## Tratamento de Erros

Todas as funções implementam tratamento de erros consistente:

1. **Validação**: Erros de validação Zod são capturados e retornados
2. **Banco de Dados**: Erros de operações no banco são logados e retornados
3. **Exceções**: Erros inesperados são capturados e logados
4. **Retorno**: Sempre retorna `ActionResult<T>` com `success: false` em caso de erro

## Considerações de Performance

- **Índices**: Certifique-se de que as tabelas tenham índices apropriados
- **Paginação**: A função `searchAppointments` implementa paginação para grandes volumes
- **Cache**: Use a revalidação de cache para manter a interface atualizada
- **Conflitos**: A verificação de conflitos é otimizada para evitar consultas desnecessárias

## Próximos Passos

1. **Implementar tabela `time_blocks`** no banco de dados
2. **Criar interface de usuário** para bloqueio de horários
3. **Integrar verificação de conflitos** no formulário de agendamento
4. **Adicionar testes unitários** para as novas funções
5. **Documentar casos de uso** específicos do negócio
