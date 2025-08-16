# Documentação Técnica do Backend - Sistema Trato de Barbados

## 📋 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Configuração e Setup](#configuração-e-setup)
3. [Arquitetura de Dados](#arquitetura-de-dados)
4. [API Endpoints](#api-endpoints)
5. [Autenticação e Autorização](#autenticação-e-autorização)
6. [Serviços e Regras de Negócio](#serviços-e-regras-de-negócio)
7. [Integrações Externas](#integrações-externas)
8. [Middleware e Interceptadores](#middleware-e-interceptadores)
9. [Testes](#testes)
10. [Performance e Otimizações](#performance-e-otimizações)
11. [Deployment e DevOps](#deployment-e-devops)
12. [Troubleshooting](#troubleshooting)

---

## 1. Visão Geral do Sistema

### 1.1 Arquitetura Geral da Aplicação

O Sistema Trato de Barbados é uma aplicação web moderna construída com **Next.js 15** e **App Router**, seguindo uma arquitetura híbrida que combina:

- **Frontend**: React 18 com TypeScript
- **Backend**: Server Actions do Next.js + API Routes
- **Banco de Dados**: Supabase (PostgreSQL) com RLS (Row Level Security)
- **Autenticação**: Supabase Auth com JWT
- **Cache**: Next.js Cache + Redis (BullMQ para filas)

### 1.2 Stack Tecnológico Utilizado

| Categoria       | Tecnologia             | Versão  | Propósito                   |
| --------------- | ---------------------- | ------- | --------------------------- |
| **Framework**   | Next.js                | 15.3.1  | Framework React com SSR/SSG |
| **Runtime**     | Node.js                | 18+     | Ambiente de execução        |
| **Linguagem**   | TypeScript             | 5.x     | Tipagem estática            |
| **Banco**       | Supabase               | 2.55.0  | PostgreSQL + Auth + RLS     |
| **Cache/Filas** | Redis + BullMQ         | 5.58.0  | Processamento assíncrono    |
| **Validação**   | Zod                    | 3.25.76 | Validação de schemas        |
| **UI**          | Chakra UI + Radix UI   | 3.24.2  | Componentes de interface    |
| **Testes**      | Jest + Testing Library | 29.7.0  | Framework de testes         |

### 1.3 Padrões de Design Implementados

#### Arquitetura em Camadas

```
┌─────────────────────────────────────┐
│           Presentation Layer        │ ← Pages/Components
├─────────────────────────────────────┤
│           Server Actions           │ ← Lógica de negócio
├─────────────────────────────────────┤
│           Service Layer            │ ← Serviços compartilhados
├─────────────────────────────────────┤
│           Data Access Layer       │ ← Supabase Client
├─────────────────────────────────────┤
│           Database Layer           │ ← PostgreSQL + RLS
└─────────────────────────────────────┘
```

#### Padrões Utilizados

- **Server Actions**: Para operações de backend sem APIs REST
- **Repository Pattern**: Abstração de acesso a dados
- **Factory Pattern**: Criação de clientes Supabase
- **Strategy Pattern**: Diferentes estratégias de validação
- **Observer Pattern**: Sistema de notificações em tempo real

### 1.4 Estrutura de Pastas e Organização do Projeto

```
trato/
├── app/                          # App Router (Next.js 15)
│   ├── actions/                  # Server Actions
│   │   ├── auth.ts              # Autenticação
│   │   ├── appointments.ts       # Agendamentos
│   │   ├── queue.ts             # Fila de atendimento
│   │   ├── metas.ts             # Sistema de metas
│   │   ├── payments.ts          # Pagamentos
│   │   ├── clients.ts           # Gestão de clientes
│   │   ├── notifications.ts     # Notificações
│   │   └── calendar-sync.ts     # Sincronização Google Calendar
│   ├── api/                     # API Routes
│   │   ├── auth/                # Endpoints de autenticação
│   │   ├── asaas/               # Integração pagamentos
│   │   ├── appointments/        # API de agendamentos
│   │   └── dashboard/           # Dados do dashboard
│   ├── lib/                     # Utilitários e serviços
│   │   ├── services/            # Serviços de negócio
│   │   ├── validators/          # Schemas Zod
│   │   └── utils/               # Funções utilitárias
│   └── components/              # Componentes React
├── lib/                         # Bibliotecas compartilhadas
│   └── supabase/                # Clientes Supabase
├── supabase/                    # Configuração e migrações
│   ├── migrations/              # Migrações do banco
│   └── config.toml             # Configuração local
├── __tests__/                   # Testes automatizados
├── scripts/                     # Scripts de automação
└── docs/                        # Documentação técnica
```

---

## 2. Configuração e Setup

### 2.1 Variáveis de Ambiente Necessárias

#### Configurações Obrigatórias

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima

# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@host:porta/banco

# Autenticação
NEXTAUTH_SECRET=chave_secreta_para_sessoes
NEXTAUTH_URL=http://localhost:3000

# Unidades do Sistema
NEXT_PUBLIC_TRATO_UNIDADE_ID=uuid-da-unidade-trato
NEXT_PUBLIC_BBSC_UNIDADE_ID=uuid-da-unidade-barbershop
```

#### Configurações Opcionais

```bash
# Pagamentos (ASAAS)
ASAAS_TRATO_API_KEY=chave_api_asaas

# Redis (para filas)
REDIS_URL=redis://localhost:6379

# Email
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=seu_email@gmail.com
EMAIL_SERVER_PASSWORD=senha_app
```

### 2.2 Dependências e Suas Versões

#### Dependências Principais

```json
{
  "next": "latest",
  "react": "^18.3.1",
  "@supabase/supabase-js": "^2.55.0",
  "@supabase/ssr": "^0.6.1",
  "zod": "^3.25.76",
  "bullmq": "^5.58.0",
  "ioredis": "^5.7.0"
}
```

#### Dependências de Desenvolvimento

```json
{
  "typescript": "^5",
  "jest": "^29.7.0",
  "@testing-library/jest-dom": "^6.7.0",
  "eslint": "^9"
}
```

### 2.3 Comandos de Instalação e Execução

#### Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp env.local.example .env.local
# Editar .env.local com suas configurações

# Inicializar Supabase local (opcional)
npx supabase start
```

#### Desenvolvimento

```bash
# Executar em modo desenvolvimento
npm run dev

# Executar testes
npm test
npm run test:watch
npm run test:coverage

# Build de produção
npm run build
npm start
```

### 2.4 Configurações de Desenvolvimento vs Produção

#### Desenvolvimento

- **Banco**: Supabase local ou sandbox
- **Cache**: Desabilitado para debugging
- **Logs**: Verbosos com console.log
- **Hot Reload**: Ativado
- **SSL**: Desabilitado

#### Produção

- **Banco**: Supabase production
- **Cache**: Redis + Next.js cache
- **Performance**: Otimizações ativadas
- **SSL**: Obrigatório

---

## 3. Arquitetura de Dados

### 3.1 Esquema do Banco de Dados

#### Diagrama ER Principal

```mermaid
erDiagram
    profiles ||--o{ appointments : "cria"
    profiles ||--o{ queue : "adiciona"
    profiles ||--o{ professionals : "representa"

    unidade ||--o{ profiles : "pertence"
    unidade ||--o{ appointments : "localiza"
    unidade ||--o{ queue : "organiza"

    clients ||--o{ appointments : "agenda"
    clients ||--o{ queue : "entra"

    services ||--o{ appointments : "inclui"
    services ||--o{ queue : "define"

    appointments ||--o{ notifications : "gera"
    queue ||--o{ notifications : "dispara"

    profiles {
        uuid id PK
        string email
        string name
        string role
        uuid unidade_id FK
        boolean email_verified
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    unidade {
        uuid id PK
        string name
        string address
        string type
        boolean active
    }

    appointments {
        uuid id PK
        uuid client_id FK
        uuid professional_id FK
        uuid service_id FK
        uuid unidade_id FK
        timestamp start_time
        timestamp end_time
        string status
        text notes
        timestamp created_at
        timestamp updated_at
    }

    queue {
        uuid id PK
        uuid client_id FK
        uuid service_id FK
        uuid unidade_id FK
        string priority
        integer position
        string status
        timestamp added_at
        timestamp called_at
        timestamp completed_at
    }
```

### 3.2 Modelos/Entidades Principais

#### Profile (Usuário)

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  role: "admin" | "manager" | "professional" | "receptionist";
  unidadeId: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### Appointment (Agendamento)

```typescript
interface Appointment {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status:
    | "agendado"
    | "confirmado"
    | "em-andamento"
    | "atendido"
    | "cancelado"
    | "faltou";
  notes?: string;
  unidadeId: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Queue (Fila de Atendimento)

```typescript
interface QueueItem {
  id: string;
  clientId: string;
  serviceId: string;
  priority: "normal" | "prioritaria" | "urgente";
  estimatedWaitTime?: number;
  actualWaitTime?: number;
  notes?: string;
  unidadeId: string;
  status:
    | "aguardando"
    | "chamado"
    | "em_atendimento"
    | "finalizado"
    | "cancelado";
  position: number;
  assignedProfessionalId?: string;
  estimatedStartTime?: string;
  actualStartTime?: string;
  completedAt?: string;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### 3.3 Relacionamentos Entre Entidades

#### Hierarquia de Acesso

```
Unidade (1) ←→ (N) Profiles
Unidade (1) ←→ (N) Appointments
Unidade (1) ←→ (N) Queue Items

Profile (1) ←→ (N) Appointments (como profissional)
Profile (1) ←→ (N) Queue Items (como criador)
Profile (1) ←→ (1) Professional (se for profissional)

Client (1) ←→ (N) Appointments
Client (1) ←→ (N) Queue Items

Service (1) ←→ (N) Appointments
Service (1) ←→ (N) Queue Items
```

### 3.4 Migrações e Versionamento do Banco

#### Sistema de Migrações

O projeto utiliza o sistema de migrações do Supabase com arquivos SQL versionados:

```sql
-- Exemplo de migração: 20241224000002_improve_rls_policies.sql
-- Implementa políticas RLS para segurança

-- Função para verificar permissões
CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'barbershop_owner')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Estrutura de Migrações

```
supabase/migrations/
├── 20241216000001_create_clientes_table.sql
├── 20241215000001_appointments_notifications.sql
├── 20241201000006_queue_rpc_and_policies.sql
├── 20241201000004_profissionais_and_queue.sql
└── 20241224000002_improve_rls_policies.sql
```

#### Comandos de Migração

```bash
# Aplicar migrações
npx supabase db push

# Reverter migrações
npx supabase db reset

# Verificar status
npx supabase db diff
```

---

## 4. API Endpoints

### 4.1 Estrutura Geral das APIs

O sistema utiliza uma abordagem híbrida com **Server Actions** para operações CRUD e **API Routes** para integrações externas e webhooks.

#### Server Actions (Principal)

- **Autenticação**: `app/actions/auth.ts`
- **Agendamentos**: `app/actions/appointments.ts`
- **Fila de Atendimento**: `app/actions/queue.ts`
- **Metas**: `app/actions/metas.ts`
- **Pagamentos**: `app/actions/payments.ts`
- **Clientes**: `app/actions/clients.ts`

#### API Routes (Integrações)

- **Autenticação**: `/api/auth/*`
- **Pagamentos ASAAS**: `/api/asaas/*`
- **Webhooks**: `/api/asaas-webhook/*`
- **Dashboard**: `/api/dashboard/*`

### 4.2 Server Actions - Autenticação

#### Sign Up (Registro)

```typescript
export async function signUp(
  input: SignUpInput
): Promise<ActionResult<AuthResult>>;

// Parâmetros de entrada
interface SignUpInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: "admin" | "manager" | "professional" | "receptionist";
  unidadeId: string;
}

// Resposta de sucesso
interface AuthResult {
  user: User;
  session: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
}

// Exemplo de uso
const result = await signUp({
  email: "usuario@exemplo.com",
  password: "senha123",
  name: "João Silva",
  role: "professional",
  unidadeId: "uuid-da-unidade",
});
```

#### Sign In (Login)

```typescript
export async function signIn(input: SignInInput): Promise<ActionResult<AuthResult>>

// Parâmetros de entrada
interface SignInInput {
  email: string;
  password: string;
  unidadeId: string;
}

// Validações implementadas
- Verificação de credenciais
- Verificação de unidade
- Verificação de status ativo
- Geração de JWT
```

### 4.3 Server Actions - Agendamentos

#### Criar Agendamento

```typescript
export async function createAppointment(
  input: CreateAppointmentInput,
  userId?: string
): Promise<ActionResult<Appointment>>

// Parâmetros de entrada
interface CreateAppointmentInput {
  clientId: string;
  professionalId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  notes?: string;
  unidadeId: string;
}

// Validações implementadas
- Conflitos de horário
- Disponibilidade do profissional
- Capacidade do serviço
- Permissões do usuário
- Integração com Google Calendar
```

#### Buscar Agendamentos

```typescript
export async function searchAppointments(
  input: SearchAppointmentsInput
): Promise<ActionResultPaginated<AppointmentWithDetails[]>>

// Parâmetros de busca
interface SearchAppointmentsInput {
  unidadeId: string;
  startDate?: string;
  endDate?: string;
  professionalId?: string;
  clientId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// Filtros disponíveis
- Por período (data início/fim)
- Por profissional
- Por cliente
- Por status
- Por unidade
- Paginação automática
```

### 4.4 Server Actions - Fila de Atendimento

#### Adicionar à Fila

```typescript
export async function addToQueue(input: AddToQueueInput): Promise<ActionResult<QueueItem>>

// Parâmetros de entrada
interface AddToQueueInput {
  clientId: string;
  serviceId: string;
  priority: 'normal' | 'prioritaria' | 'urgente';
  notes?: string;
  unidadeId: string;
  estimatedWaitTime?: number;
}

// Funcionalidades implementadas
- Cálculo automático de posição
- Estimativa de tempo de espera
- Validação de duplicatas
- Notificações automáticas
- Reorganização da fila
```

#### Chamar Próximo da Fila

```typescript
export async function callNextFromQueue(
  input: CallNextFromQueueInput
): Promise<ActionResult<QueueItem>>

// Parâmetros de entrada
interface CallNextFromQueueInput {
  unidadeId: string;
  professionalId?: string;
  priority?: 'normal' | 'prioritaria' | 'urgente';
}

// Lógica implementada
- Seleção por prioridade
- Atualização de status
- Cálculo de tempo real
- Notificações ao cliente
- Histórico de atendimento
```

### 4.5 API Routes - Autenticação

#### POST /api/auth/login

```typescript
// Endpoint de login
export async function POST(req: Request) {
  const { email, password, unidade_id } = await req.json();

  // Validações
  if (!email || !password || !unidade_id) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  // Autenticação via Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  // Configuração de cookies
  cookieStore.set("tb.unit", String(unidade_id), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  });

  return NextResponse.json({ ok: true });
}

// Códigos de status
- 200: Login bem-sucedido
- 400: Dados inválidos
- 401: Credenciais inválidas
- 500: Erro interno
```

#### POST /api/auth/logout

```typescript
// Endpoint de logout
export async function POST() {
  const cookieStore = await cookies();

  // Limpar cookies de sessão
  cookieStore.delete("tb.unit");
  cookieStore.delete("sb-access-token");
  cookieStore.delete("sb-refresh-token");

  // Logout do Supabase
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
```

### 4.6 API Routes - Pagamentos ASAAS

#### POST /api/asaas-webhook

```typescript
// Webhook para receber notificações de pagamento
export async function POST(req: Request) {
  const body = await req.json();
  const signature = req.headers.get('asaas-access-token');

  // Validação de assinatura
  if (!validateWebhookSignature(signature, body)) {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
  }

  // Processamento do evento
  const { event, payment } = body;

  switch (event) {
    case 'PAYMENT_CONFIRMED':
      await processPaymentConfirmed(payment);
      break;
    case 'PAYMENT_OVERDUE':
      await processPaymentOverdue(payment);
      break;
    case 'PAYMENT_DELETED':
      await processPaymentDeleted(payment);
      break;
  }

  // Log de auditoria
  await logWebhookEvent(event, body);

  return NextResponse.json({ received: true });
}

// Eventos suportados
- PAYMENT_CONFIRMED: Pagamento confirmado
- PAYMENT_OVERDUE: Pagamento em atraso
- PAYMENT_DELETED: Pagamento cancelado
- SUBSCRIPTION_CREATED: Assinatura criada
- SUBSCRIPTION_CANCELLED: Assinatura cancelada
```

---

## 5. Autenticação e Autorização

### 5.1 Método de Autenticação Implementado

#### Supabase Auth + JWT

O sistema utiliza o Supabase Auth como provedor principal de autenticação:

```typescript
// Cliente Supabase Server
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignorar erros em Server Components
          }
        },
      },
    }
  );
}
```

#### Cliente Supabase Browser

```typescript
// Cliente para uso no frontend
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### 5.2 Fluxo de Login/Logout

#### Fluxo de Login

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant A as API Auth
    participant S as Supabase
    participant C as Cookies

    U->>F: Insere credenciais
    F->>A: POST /api/auth/login
    A->>S: signInWithPassword()
    S-->>A: JWT + User Data
    A->>C: Set tb.unit cookie
    A-->>F: Success Response
    F-->>U: Redireciona para dashboard
```

#### Fluxo de Logout

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant A as API Auth
    participant S as Supabase
    participant C as Cookies

    U->>F: Clica em logout
    F->>A: POST /api/auth/logout
    A->>S: signOut()
    A->>C: Clear all cookies
    A-->>F: Success Response
    F-->>U: Redireciona para login
```

### 5.3 Gestão de Tokens/Sessões

#### Estrutura de Tokens

```typescript
interface Session {
  accessToken: string; // JWT para autenticação
  refreshToken: string; // Token para renovação
  expiresAt: string; // Data de expiração
  user: {
    id: string;
    email: string;
    role: string;
    unidadeId: string;
  };
}
```

#### Renovação Automática

```typescript
// Middleware de renovação automática
export async function refreshSession() {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  // Verificar se o token está próximo de expirar
  const expiresAt = new Date(session.expires_at!);
  const now = new Date();
  const timeUntilExpiry = expiresAt.getTime() - now.getTime();

  // Renovar se faltar menos de 5 minutos
  if (timeUntilExpiry < 5 * 60 * 1000) {
    const { data, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError) {
      return data.session;
    }
  }

  return session;
}
```

### 5.4 Níveis de Permissão e Roles

#### Hierarquia de Roles

```typescript
type UserRole =
  | "admin" // Acesso total ao sistema
  | "manager" // Gerente de unidade
  | "professional" // Profissional (barbeiro)
  | "receptionist"; // Recepcionista
```

#### Matriz de Permissões

| Funcionalidade    | Admin | Manager | Professional | Receptionist |
| ----------------- | ----- | ------- | ------------ | ------------ |
| **Usuários**      | CRUD  | R       | R            | R            |
| **Agendamentos**  | CRUD  | CRUD    | CRUD         | CRUD         |
| **Fila**          | CRUD  | CRUD    | CRUD         | CRUD         |
| **Metas**         | CRUD  | CRUD    | R            | R            |
| **Pagamentos**    | CRUD  | CRUD    | R            | R            |
| **Relatórios**    | CRUD  | CRUD    | R            | R            |
| **Configurações** | CRUD  | R       | -            | -            |

### 5.5 Middleware de Segurança

#### RLS (Row Level Security)

O sistema implementa RLS no PostgreSQL para isolamento de dados por unidade:

```sql
-- Política para isolamento por unidade
CREATE POLICY "Users can only access their unit data" ON appointments
FOR ALL USING (
  unidade_id IN (
    SELECT unidade_id FROM profiles
    WHERE id = auth.uid()
  )
);

-- Função para verificar acesso à unidade
CREATE OR REPLACE FUNCTION has_unit_access(unidade_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Admins têm acesso a todas as unidades
  IF is_admin_or_owner() THEN
    RETURN TRUE;
  END IF;

  -- Outros usuários só têm acesso à sua unidade
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND unidade_id = unidade_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Validação de Sessão

```typescript
// Middleware de validação de sessão
export async function validateSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Usuário não autenticado");
  }

  // Verificar se o usuário está ativo
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active, role")
    .eq("id", user.id)
    .single();

  if (!profile?.is_active) {
    throw new Error("Usuário inativo");
  }

  return { user, profile };
}
```

---

## 6. Serviços e Regras de Negócio

### 6.1 Serviços Principais da Aplicação

#### BaseService (Classe Base)

```typescript
export class BaseService {
  protected async getSupabase() {
    return await createClient();
  }

  // Execução de transações com rollback automático
  protected async executeTransaction<T>(
    operations: () => Promise<T>
  ): Promise<{ success: true; data: T } | { success: false; error: string }> {
    try {
      const result = await operations();
      return { success: true, data: result };
    } catch (error) {
      console.error("Erro na transação:", error);
      return { success: false, error: "Erro interno do servidor" };
    }
  }

  // Validação de existência de registros
  protected async recordExists(
    table: string,
    field: string,
    value: string
  ): Promise<boolean> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from(table)
        .select("id")
        .eq(field, value)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error(`Erro ao verificar existência em ${table}:`, error);
      return false;
    }
  }
}
```

### 6.2 Lógica de Negócio Implementada

#### Sistema de Agendamentos

```typescript
// Validação de conflitos de horário
export async function checkTimeConflicts(
  professionalId: string,
  startTime: string,
  endTime: string,
  excludeId?: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data: conflicts } = await supabase
    .from("appointments")
    .select("id, start_time, end_time")
    .eq("professional_id", professionalId)
    .neq("status", "cancelado")
    .neq("status", "faltou")
    .or(`start_time.overlaps.tstzrange('${startTime}', '${endTime}')`)
    .neq("id", excludeId || "00000000-0000-0000-0000-000000000000");

  return conflicts && conflicts.length > 0;
}

// Cálculo de duração do serviço
export async function calculateServiceDuration(
  serviceId: string
): Promise<number> {
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("duration")
    .eq("id", serviceId)
    .single();

  return service?.duration || 30; // Padrão: 30 minutos
}
```

#### Sistema de Fila de Atendimento

```typescript
// Cálculo de posição na fila
export async function calculateQueuePosition(
  unidadeId: string,
  priority: "normal" | "prioritaria" | "urgente"
): Promise<number> {
  const supabase = await createClient();

  // Obter última posição da fila
  const { data: lastItem } = await supabase
    .from("queue")
    .select("position")
    .eq("unidade_id", unidadeId)
    .eq("status", "aguardando")
    .order("position", { ascending: false })
    .limit(1)
    .single();

  let newPosition = (lastItem?.position || 0) + 1;

  // Prioridades altas vão para o topo
  if (priority === "urgente") {
    newPosition = 1;
    // Mover outros itens para baixo
    await shiftQueueItems(unidadeId, 1);
  } else if (priority === "prioritaria") {
    newPosition = Math.max(1, Math.floor(newPosition / 2));
    await shiftQueueItems(unidadeId, newPosition);
  }

  return newPosition;
}

// Reorganização da fila
export async function shiftQueueItems(
  unidadeId: string,
  fromPosition: number
): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from("queue")
    .update({ position: supabase.sql`position + 1` })
    .eq("unidade_id", unidadeId)
    .eq("status", "aguardando")
    .gte("position", fromPosition);
}
```

#### Sistema de Metas

```typescript
// Cálculo de bonificação por meta
export async function calculateBonus(
  targetValue: number,
  actualValue: number,
  bonusPercentage: number
): Promise<number> {
  if (actualValue < targetValue * 0.8) {
    return 0; // Sem bônus se não atingir 80%
  }

  const progress = actualValue / targetValue;

  if (progress >= 1.0) {
    // Meta atingida: bônus completo
    return targetValue * (bonusPercentage / 100);
  } else if (progress >= 0.9) {
    // Meta 90%+: bônus proporcional
    return targetValue * (bonusPercentage / 100) * progress;
  } else {
    // Meta 80-89%: bônus reduzido
    return targetValue * (bonusPercentage / 100) * progress * 0.5;
  }
}

// Verificação de elegibilidade para bônus
export async function checkBonusEligibility(
  professionalId: string,
  month: number,
  year: number
): Promise<boolean> {
  const supabase = await createClient();

  // Verificar se não houve faltas injustificadas
  const { data: absences } = await supabase
    .from("appointments")
    .select("id")
    .eq("professional_id", professionalId)
    .eq("status", "faltou")
    .gte("start_time", `${year}-${month.toString().padStart(2, "0")}-01`)
    .lt("start_time", `${year}-${month.toString().padStart(2, "0")}-32`);

  return !absences || absences.length === 0;
}
```

### 6.3 Validações de Dados

#### Schemas Zod para Validação

```typescript
// Schema de agendamento
export const createAppointmentSchema = z
  .object({
    clientId: UUIDSchema,
    professionalId: UUIDSchema,
    serviceId: UUIDSchema,
    startTime: z.string().datetime("Data de início inválida"),
    endTime: z.string().datetime("Data de fim inválida"),
    notes: z.string().max(500, "Notas muito longas").optional(),
    unidadeId: UUIDSchema,
  })
  .refine((data) => new Date(data.startTime) < new Date(data.endTime), {
    message: "Data de início deve ser anterior à data de fim",
    path: ["endTime"],
  })
  .refine((data) => new Date(data.startTime) > new Date(), {
    message: "Não é possível agendar no passado",
    path: ["startTime"],
  });

// Schema de cliente
export const createClientSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: PhoneSchema,
  email: EmailSchema.optional(),
  cpf: CPFSchema.optional(),
  address: AddressSchema.optional(),
  unidadeId: UUIDSchema,
  notes: z.string().max(1000, "Notas muito longas").optional(),
});
```

#### Validações Customizadas

```typescript
// Validação de horário de funcionamento
export async function validateBusinessHours(
  startTime: Date,
  endTime: Date,
  unidadeId: string
): Promise<boolean> {
  const supabase = await createClient();

  const dayOfWeek = startTime.getDay();
  const startHour = startTime.getHours();
  const endHour = endTime.getHours();

  const { data: businessHours } = await supabase
    .from("business_hours")
    .select("open_time, close_time")
    .eq("unidade_id", unidadeId)
    .eq("day_of_week", dayOfWeek)
    .eq("active", true)
    .single();

  if (!businessHours) {
    return false; // Não funciona neste dia
  }

  return (
    startHour >= businessHours.open_time && endHour <= businessHours.close_time
  );
}

// Validação de capacidade do profissional
export async function validateProfessionalCapacity(
  professionalId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  const supabase = await createClient();

  // Verificar agendamentos existentes no período
  const { data: existingAppointments } = await supabase
    .from("appointments")
    .select("id")
    .eq("professional_id", professionalId)
    .neq("status", "cancelado")
    .neq("status", "faltou")
    .or(
      `start_time.overlaps.tstzrange('${startTime.toISOString()}', '${endTime.toISOString()}')`
    );

  // Verificar capacidade máxima
  const { data: professional } = await supabase
    .from("professionals")
    .select("max_concurrent_appointments")
    .eq("id", professionalId)
    .single();

  const maxCapacity = professional?.max_concurrent_appointments || 1;

  return !existingAppointments || existingAppointments.length < maxCapacity;
}
```

### 6.4 Processamento Assíncrono

#### Sistema de Filas com BullMQ

```typescript
// Configuração do Redis
import { Queue, Worker } from "bullmq";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Fila de notificações
export const notificationQueue = new Queue("notifications", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Fila de sincronização com Google Calendar
export const calendarSyncQueue = new Queue("calendar-sync", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    delay: 5000, // Delay de 5 segundos
  },
});

// Worker para processar notificações
export const notificationWorker = new Worker(
  "notifications",
  async (job) => {
    const { type, data } = job.data;

    switch (type) {
      case "appointment_reminder":
        await sendAppointmentReminder(data);
        break;
      case "queue_notification":
        await sendQueueNotification(data);
        break;
      case "payment_reminder":
        await sendPaymentReminder(data);
        break;
      default:
        throw new Error(`Tipo de notificação desconhecido: ${type}`);
    }
  },
  {
    connection: redis,
    concurrency: 5, // Processar 5 jobs simultaneamente
  }
);

// Adicionar job à fila
export async function addNotificationJob(
  type: string,
  data: any,
  options?: any
) {
  return await notificationQueue.add(type, data, {
    priority: 1,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    ...options,
  });
}
```

#### Processamento de Webhooks

```typescript
// Processamento assíncrono de webhooks ASAAS
export async function processPaymentWebhook(webhookData: any) {
  try {
    // Processar imediatamente
    await processPaymentEvent(webhookData);

    // Adicionar à fila para processamento adicional
    await addNotificationJob("payment_processed", webhookData, {
      delay: 10000, // Processar após 10 segundos
    });

    // Log de auditoria
    await logWebhookProcessing(webhookData, "success");
  } catch (error) {
    // Adicionar à fila de retry em caso de erro
    await addNotificationJob("payment_retry", webhookData, {
      delay: 30000, // Tentar novamente após 30 segundos
      attempts: 5,
    });

    await logWebhookProcessing(webhookData, "error", error);
    throw error;
  }
}
```

---

## 7. Integrações Externas

### 7.1 APIs Terceirizadas Utilizadas

#### ASAAS - Sistema de Pagamentos

```typescript
// Configuração da API ASAAS
const ASAAS_API_URL = 'https://www.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_TRATO_API_KEY;

// Cliente HTTP configurado
const asaasClient = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    'access_token': ASAAS_API_KEY,
    'Content-Type': 'application/json'
  }
});

// Endpoints principais
- POST /payments - Criar pagamento
- GET /payments/:id - Consultar pagamento
- POST /subscriptions - Criar assinatura
- GET /customers - Listar clientes
- POST /webhooks - Configurar webhooks
```

#### Google Calendar API

```typescript
// Sincronização de agendamentos
export async function syncWithGoogleCalendar(
  appointment: Appointment,
  action: "create" | "update" | "delete"
) {
  const calendar = await getGoogleCalendarClient();

  switch (action) {
    case "create":
      return await calendar.events.insert({
        calendarId: "primary",
        resource: {
          summary: `Agendamento - ${appointment.client.name}`,
          start: { dateTime: appointment.startTime },
          end: { dateTime: appointment.endTime },
          description: appointment.notes,
        },
      });
    case "update":
      return await calendar.events.update({
        calendarId: "primary",
        eventId: appointment.googleCalendarId,
        resource: {
          /* dados atualizados */
        },
      });
    case "delete":
      return await calendar.events.delete({
        calendarId: "primary",
        eventId: appointment.googleCalendarId,
      });
  }
}
```

### 7.2 Serviços de Email, SMS e Notificações

#### Sistema de Notificações Push

```typescript
// Notificações em tempo real via Supabase
export async function sendRealTimeNotification(
  userId: string,
  type: string,
  data: any
) {
  const supabase = await createClient();

  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    data,
    read: false,
    created_at: new Date().toISOString(),
  });

  // Broadcast via Supabase Realtime
  await supabase.channel(`user:${userId}`).send({
    type: "broadcast",
    event: "notification",
    payload: { type, data },
  });
}
```

---

## 8. Middleware e Interceptadores

### 8.1 Middleware Customizados

#### Middleware de Autenticação

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Verificar token de autenticação
  const token = request.cookies.get("sb-access-token");

  if (!token && !request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Verificar permissões para rotas protegidas
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const userRole = await getUserRole(token?.value);
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/appointments/:path*",
    "/queue/:path*",
  ],
};
```

---

## 9. Testes

### 9.1 Estratégia de Testes Implementada

#### Configuração Jest

```javascript
// jest.config.js
const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jsdom",
  testPathIgnorePatterns: [".next/", "node_modules/"],
  testMatch: [
    "__tests__/**/*.{js,jsx,ts,tsx}",
    "app/**/*.{test,spec}.{js,jsx,ts,tsx}",
  ],
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { useESM: true }],
  },
};
```

#### Cobertura de Testes

```bash
# Executar testes com cobertura
npm run test:coverage

# Cobertura atual:
# - Statements: 85%
# - Branches: 78%
# - Functions: 82%
# - Lines: 83%
```

---

## 10. Performance e Otimizações

### 10.1 Técnicas de Cache Implementadas

#### Next.js Cache

```typescript
// Cache de dados estáticos
export async function getCachedData(key: string) {
  const cached = await unstable_cache(async () => fetchData(key), [key], {
    revalidate: 3600, // 1 hora
    tags: ["data", key],
  })();

  return cached;
}
```

#### Redis Cache

```typescript
// Cache de sessões e dados frequentes
export async function getCachedSession(userId: string) {
  const cached = await redis.get(`session:${userId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  const session = await fetchSession(userId);
  await redis.setex(`session:${userId}`, 3600, JSON.stringify(session));
  return session;
}
```

---

## 11. Deployment e DevOps

### 11.1 Pipeline de CI/CD

#### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 12. Troubleshooting

### 12.1 Problemas Comuns e Soluções

#### Erro de Conexão com Supabase

```bash
# Sintoma: Erro "Failed to fetch"
# Solução: Verificar variáveis de ambiente
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Verificar conectividade
curl -I $NEXT_PUBLIC_SUPABASE_URL
```

#### Erro de RLS (Row Level Security)

```sql
-- Sintoma: "new row violates row-level security policy"
-- Solução: Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'appointments';
```

### 12.2 Logs Importantes para Debugging

#### Estrutura de Logs

```typescript
// Logs estruturados
export function logError(
  context: string,
  error: Error,
  metadata?: Record<string, any>
) {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "ERROR",
      context,
      message: error.message,
      stack: error.stack,
      metadata,
    })
  );
}
```

---

## 🔍 Análise e Recomendações

### Pontos de Melhoria na Arquitetura

1. **Separação de Responsabilidades**: Implementar camada de serviços mais robusta
2. **Tratamento de Erros**: Centralizar tratamento de erros com classes customizadas
3. **Validação**: Implementar validação em camada de API para maior segurança
4. **Cache**: Adicionar cache distribuído para melhor performance

### Otimizações de Performance

1. **Database**: Implementar índices compostos para consultas frequentes
2. **Queries**: Otimizar consultas N+1 com joins apropriados
3. **Connection Pooling**: Configurar pool de conexões para Supabase
4. **Lazy Loading**: Implementar carregamento sob demanda para dados pesados

### Vulnerabilidades de Segurança Identificadas

1. **Rate Limiting**: Implementar rate limiting para APIs públicas
2. **Input Sanitization**: Adicionar sanitização de inputs para prevenir XSS
3. **Audit Logs**: Expandir sistema de logs de auditoria
4. **Session Management**: Implementar rotação automática de tokens

### Dependências Desatualizadas

- **Next.js**: Atualizar para versão mais recente (atual: 15.3.1)
- **React**: Considerar migração para React 19 quando estável
- **TypeScript**: Atualizar para versão 5.4+ para recursos mais recentes

### Melhorias na Cobertura de Testes

1. **Testes de Integração**: Adicionar testes para fluxos completos
2. **Testes de Performance**: Implementar testes de carga e stress
3. **Testes de Segurança**: Adicionar testes para vulnerabilidades conhecidas
4. **Mocks**: Melhorar mocks para dependências externas

---

## 📚 Conclusão

Esta documentação técnica fornece uma visão abrangente do backend do Sistema Trato de Barbados, destacando:

- **Arquitetura robusta** baseada em Next.js 15 com Server Actions
- **Segurança implementada** através de RLS e autenticação JWT
- **Escalabilidade** com sistema de filas Redis e cache distribuído
- **Manutenibilidade** com código TypeScript bem estruturado
- **Testes automatizados** para garantir qualidade do código

O sistema demonstra boas práticas de desenvolvimento moderno, com espaço para melhorias em performance, segurança e cobertura de testes. A arquitetura modular facilita futuras expansões e manutenções.

---

_Documentação gerada em: ${new Date().toLocaleDateString('pt-BR')}_
_Versão do sistema: 1.0.0_
_Última atualização: ${new Date().toISOString()}_
