# 📊 Documentação Completa das Tabelas do Supabase - Trato de Barbados

## 🎯 Visão Geral

Este documento mapeia todas as tabelas e views do banco de dados Supabase utilizadas pelo sistema Trato de Barbados, incluindo sua estrutura, relacionamentos e como são utilizadas no sistema.

---

## 🏗️ Estrutura das Tabelas

### 1. **Tabelas de Autenticação e Usuários**

#### `profiles`

**Propósito**: Perfis de usuários do sistema
**Relacionamentos**: Referencia `auth.users` (Supabase Auth)

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  role TEXT CHECK (role IN ('barbershop_owner', 'professional', 'client', 'admin', 'recepcionista')),
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Uso no Sistema**:

- Autenticação e autorização
- Controle de acesso por roles
- Perfis de usuários (clientes, barbeiros, proprietários)

---

#### `user_roles`

**Propósito**: Definição de roles e permissões
**Relacionamentos**: Referenciada por `profiles.role`

```sql
-- Enum de roles disponíveis
CREATE TYPE user_role AS ENUM (
  'admin',
  'barbershop_owner',
  'professional',
  'recepcionista',
  'client'
);
```

---

### 2. **Tabelas de Estrutura Organizacional**

#### `unidades`

**Propósito**: Unidades físicas (barbearias)
**Relacionamentos**: Referenciada por múltiplas tabelas

```sql
CREATE TABLE unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  horario_funcionamento JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Uso no Sistema**:

- Separação de dados por unidade (Trato vs BarberBeer)
- Controle de acesso por unidade
- Relatórios separados por unidade

---

#### `barbershops`

**Propósito**: Informações das barbearias
**Relacionamentos**: Referenciada por `professionals`

```sql
CREATE TABLE barbershops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  business_hours JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3. **Tabelas de Profissionais**

#### `professionals`

**Propósito**: Barbeiros e profissionais
**Relacionamentos**: Referencia `profiles`, `barbershops`

```sql
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID REFERENCES barbershops(id),
  user_id UUID REFERENCES profiles(id),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  specialty TEXT,
  bio TEXT,
  avatar_url TEXT,
  hourly_rate DECIMAL(10,2),
  commission_rate DECIMAL(5,2) DEFAULT 50.00,
  is_active BOOLEAN DEFAULT true,
  can_receive_appointments BOOLEAN DEFAULT true,
  work_schedule JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Uso no Sistema**:

- Lista de barbeiros disponíveis
- Cálculo de comissões
- Agendamentos por profissional
- Fila de atendimento

---

#### `profissionais`

**Propósito**: Tabela alternativa para profissionais (legacy)
**Relacionamentos**: Similar a `professionals`

---

### 4. **Tabelas de Clientes**

#### `clients`

**Propósito**: Clientes da barbearia
**Relacionamentos**: Referenciada por agendamentos e vendas

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  preferences JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Uso no Sistema**:

- Cadastro de clientes
- Histórico de atendimentos
- Preferências e observações

---

#### `clientes`

**Propósito**: Tabela alternativa para clientes (legacy)
**Relacionamentos**: Similar a `clients`

---

### 5. **Tabelas de Serviços**

#### `servicos`

**Propósito**: Catálogo de serviços oferecidos
**Relacionamentos**: Referenciada por agendamentos

```sql
CREATE TABLE servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  duracao_minutos INTEGER DEFAULT 30,
  preco DECIMAL(10,2) NOT NULL,
  categoria_id UUID REFERENCES categorias(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Uso no Sistema**:

- Agendamentos com duração e preço
- Cálculo de tempo de atendimento
- Categorização de serviços

---

#### `servicos_avulsos`

**Propósito**: Serviços pontuais realizados
**Relacionamentos**: Referencia `professionals`, `clients`

```sql
CREATE TABLE servicos_avulsos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES professionals(id),
  cliente_id UUID REFERENCES clients(id),
  servico_id UUID REFERENCES servicos(id),
  data_realizacao DATE NOT NULL,
  valor DECIMAL(10,2) NOT NULL, 
  comissao DECIMAL(10,2),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Uso no Sistema**:

- Registro de serviços realizados
- Cálculo de comissões
- Histórico de atendimentos

---

#### `servicos_realizados`

**Propósito**: Histórico detalhado de serviços
**Relacionamentos**: Similar a `servicos_avulsos`

---

### 6. **Tabelas de Agendamentos**

#### `appointments`

**Propósito**: Agendamentos principais do sistema
**Relacionamentos**: Referencia `professionals`, `clients`, `unidades`

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  barbeiro_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  unidade_id UUID NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'agendado' CHECK (
    status IN ('agendado', 'confirmado', 'atendido', 'cancelado', 'no_show', 'bloqueado')
  ),
  servicos JSONB DEFAULT '[]'::jsonb,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Uso no Sistema**:

- Sistema principal de agendamentos
- Controle de status
- Integração com notificações
- Separação por unidade

---

#### `agendamentos`

**Propósito**: Tabela alternativa para agendamentos (legacy)
**Relacionamentos**: Similar a `appointments`

---

#### `agendamentos_barberbeer`

**Propósito**: Agendamentos específicos da unidade BarberBeer
**Relacionamentos**: Referencia `unidades`

---

#### `agendamentos_trato`

**Propósito**: Agendamentos específicos da unidade Trato
**Relacionamentos**: Referencia `unidades`

---

### 7. **Tabelas de Fila de Atendimento**

#### `barber_queue`

**Propósito**: Fila inteligente de barbeiros
**Relacionamentos**: Referencia `professionals`

```sql
CREATE TABLE barber_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES professionals(id),
  queue_position INTEGER NOT NULL,
  daily_services INTEGER DEFAULT 0,
  total_services INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_service_date DATE,
  passou_vez INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Uso no Sistema**:

- Fila inteligente com reorganização automática
- Controle de atendimentos por barbeiro
- Sistema de "fila indiana" (quem atende mais vai para o final)

---

#### `queue`

**Propósito**: Fila de clientes aguardando
**Relacionamentos**: Referencia `clients`, `professionals`

---

### 8. **Tabelas de Produtos**

#### `produtos_trato_de_barbados`

**Propósito**: Produtos da unidade Trato
**Relacionamentos**: Referencia `categorias`, `unidades`

```sql
CREATE TABLE produtos_trato_de_barbados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  categoria_id UUID REFERENCES categorias(id),
  estoque_atual INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 5,
  unidade_id UUID REFERENCES unidades(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Uso no Sistema**:

- Controle de estoque
- Vendas de produtos
- Metas de vendas por barbeiro

---

#### `produtos_barberbeer`

**Propósito**: Produtos da unidade BarberBeer
**Relacionamentos**: Similar a `produtos_trato_de_barbados`

---

#### `categorias`

**Propósito**: Categorias de produtos
**Relacionamentos**: Referenciada por produtos

---

#### `categories`

**Propósito**: Tabela alternativa para categorias (legacy)

---

#### `marcas`

**Propósito**: Marcas dos produtos
**Relacionamentos**: Referenciada por produtos

---

### 9. **Tabelas de Vendas**

#### `vendas_produtos`

**Propósito**: Registro de vendas de produtos
**Relacionamentos**: Referencia produtos, profissionais, clientes

```sql
CREATE TABLE vendas_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL,
  profissional_id UUID REFERENCES professionals(id),
  cliente_id UUID REFERENCES clients(id),
  quantidade INTEGER NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  preco_total DECIMAL(10,2) NOT NULL,
  data_venda DATE NOT NULL,
  comissao DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Uso no Sistema**:

- Controle de vendas
- Cálculo de comissões
- Metas de vendas

---

#### `vendas_produtos_barbeiro`

**Propósito**: Vendas específicas por barbeiro
**Relacionamentos**: Similar a `vendas_produtos`

---

### 10. **Tabelas de Assinaturas**

#### `subscriptions`

**Propósito**: Assinaturas mensais
**Relacionamentos**: Referencia `clients`, `planos`

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clients(id),
  plano_id UUID REFERENCES planos(id),
  status TEXT NOT NULL DEFAULT 'ativa',
  data_inicio DATE NOT NULL,
  data_fim DATE,
  valor_mensal DECIMAL(10,2) NOT NULL,
  forma_pagamento TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Uso no Sistema**:

- Controle de assinaturas mensais
- Integração com ASAAS
- Faturamento recorrente

---

#### `assinaturas`

**Propósito**: Tabela alternativa para assinaturas (legacy)

---

#### `planos`

**Propósito**: Planos de assinatura disponíveis
**Relacionamentos**: Referenciada por assinaturas

---

#### `plans`

**Propósito**: Tabela alternativa para planos (legacy)

---

#### `plan_categories`

**Propósito**: Categorias de planos
**Relacionamentos**: Referenciada por planos

---

### 11. **Tabelas de Pagamentos**

#### `payments`

**Propósito**: Pagamentos gerais
**Relacionamentos**: Referencia múltiplas entidades

---

#### `pagamentos_eseas`

**Propósito**: Pagamentos específicos (legacy)

---

#### `external_payments`

**Propósito**: Pagamentos externos
**Relacionamentos**: Referencia múltiplas entidades

---

### 12. **Tabelas de Metas**

#### `metas_barberbeer`

**Propósito**: Metas dos barbeiros da BarberBeer
**Relacionamentos**: Referencia `professionals`, `unidades`

```sql
CREATE TABLE metas_barberbeer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbeiro_id UUID REFERENCES professionals(id),
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL,
  meta_venda_produto DECIMAL(10,2) DEFAULT 0,
  meta_faturamento DECIMAL(10,2) DEFAULT 0,
  tipo_bonificacao TEXT CHECK (tipo_bonificacao IN ('fixo', 'percentual')),
  valor_bonificacao DECIMAL(10,2) DEFAULT 0,
  foi_batida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Uso no Sistema**:

- Metas mensais por barbeiro
- Cálculo de bonificações
- Performance tracking

---

#### `metas_trato_faixas`

**Propósito**: Faixas de metas para Trato
**Relacionamentos**: Referencia `unidades`

---

#### `metas_barberbeer_faixas`

**Propósito**: Faixas de metas para BarberBeer
**Relacionamentos**: Referencia `unidades`

---

#### `monthly_goals`

**Propósito**: Metas mensais gerais
**Relacionamentos**: Referencia `unidades`

---

#### `monthly_revenue`

**Propósito**: Receita mensal por unidade
**Relacionamentos**: Referencia `unidades`

---

### 13. **Tabelas de Comissões**

#### `comissoes_avulses`

**Propósito**: Comissões de serviços avulsos
**Relacionamentos**: Referencia `professionals`, `servicos_avulsos`

```sql
CREATE TABLE comissoes_avulses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES professionals(id),
  servico_avulso_id UUID REFERENCES servicos_avulsos(id),
  valor_comissao DECIMAL(10,2) NOT NULL,
  valor_comissao DECIMAL(10,2) NOT NULL,
  percentual_comissao DECIMAL(5,2) NOT NULL,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  pago BOOLEAN DEFAULT false,
  data_pagamento DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Uso no Sistema**:

- Cálculo de comissões mensais
- Controle de pagamentos
- Relatórios financeiros

---

### 14. **Tabelas de Faturamento**

#### `faturamento_assinatura`

**Propósito**: Faturamento de assinaturas
**Relacionamentos**: Referencia `assinaturas`, `unidades`

---

#### `faturamento_assinatura_unidades`

**Propósito**: Faturamento por unidade
**Relacionamentos**: Referencia `unidades`

---

#### `receitas`

**Propósito**: Receitas gerais
**Relacionamentos**: Referencia múltiplas entidades

---

#### `despesas`

**Propósito**: Despesas gerais
**Relacionamentos**: Referencia múltiplas entidades

---

### 15. **Tabelas de Notificações**

#### `notifications`

**Propósito**: Sistema de notificações
**Relacionamentos**: Referencia múltiplas entidades

---

### 16. **Tabelas de Bloqueios**

#### `bloqueios_trato`

**Propósito**: Horários bloqueados da unidade Trato
**Relacionamentos**: Referencia `unidades`

---

#### `bloqueios_barberbeer`

**Propósito**: Horários bloqueados da unidade BarberBeer
**Relacionamentos**: Referencia `unidades`

---

### 17. **Views do Sistema**

#### `vw_atendimentos_por_cliente`

**Propósito**: View de atendimentos agregados por cliente
**Uso**: Relatórios de clientes

#### `vw_clientes_resumo`

**Propósito**: Resumo de informações dos clientes
**Uso**: Dashboard e relatórios

#### `vw_pagamentos_por_cliente`

**Propósito**: View de pagamentos por cliente
**Uso**: Relatórios financeiros

#### `vw_pendencias_por_cliente`

**Propósito**: View de pendências por cliente
**Uso**: Controle de inadimplência

---

## 🔗 Relacionamentos Principais

### Hierarquia de Unidades

```
unidades
├── professionals (barbeiros)
├── appointments (agendamentos)
├── produtos_*
├── metas_*
└── vendas_*
```

### Fluxo de Agendamentos

```
clients → appointments → professionals
    ↓
servicos → servicos_avulsos → comissoes_avulses
```

### Sistema de Metas

```
professionals → metas_* → vendas_produtos
    ↓
monthly_goals → monthly_revenue
```

---

## 📊 Padrões de Uso

### 1. **Separação por Unidade**

- Todas as tabelas principais têm referência a `unidade_id`
- RLS (Row Level Security) implementado por unidade
- Função `current_unidade()` para isolamento de dados

### 2. **Controle de Status**

- Padrão: `is_active` para soft delete
- Status específicos para agendamentos e assinaturas
- Histórico de mudanças com `created_at` e `updated_at`

### 3. **Sistema de Comissões**

- Padrão de 40% sobre faturamento
- Separação entre comissões de assinaturas e avulsas
- Metas mensais com bonificações

### 4. **Controle de Estoque**

- `estoque_atual` e `estoque_minimo`
- Alertas automáticos de estoque baixo
- Rastreamento de vendas por produto

---

## 🚀 Próximos Passos

### 1. **Consolidação de Tabelas**

- Unificar tabelas duplicadas (ex: `clients` vs `clientes`)
- Padronizar nomenclatura em inglês
- Migrar dados legados para novas estruturas

### 2. **Implementação de RLS**

- Aplicar RLS em todas as tabelas
- Testar isolamento por unidade
- Configurar políticas de acesso por role

### 3. **Otimização de Performance**

- Revisar índices existentes
- Implementar materialized views para relatórios
- Otimizar queries complexas

### 4. **Backup e Migração**

- Scripts de migração para produção
- Backup automático das tabelas críticas
- Versionamento de schema

---

## 📝 Notas de Manutenção

### Variáveis de Ambiente Necessárias

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service
```

### Comandos Úteis

```bash
# Verificar estrutura das tabelas
\d+ nome_da_tabela

# Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';

# Verificar relacionamentos
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY';
```

---

**Versão**: 1.0  
**Última atualização**: Dezembro 2024  
**Responsável**: Documentação do Sistema
