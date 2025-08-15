# 🔧 Correções de Autenticação e Roles

## 📋 Análise do Sistema Existente

Após analisar o README e as migrações, identifiquei que o sistema **JÁ TEM** uma estrutura completa implementada:

### ✅ **O que JÁ existe no banco:**

- **Tabela `profiles`** - Perfis de usuário
- **Tabela `professionals`** - Profissionais (barbeiros)
- **Tabela `queue`** - Fila de atendimento (clientes)
- **Tabela `barbershops`** - Barbearias
- **Tabela `clients`** - Clientes
- **Tabela `services`** - Serviços
- **Tabela `appointments`** - Agendamentos
- **Tabela `subscriptions`** - Assinaturas
- **Tabela `payments`** - Pagamentos
- **Tabela `notifications`** - Notificações

### ❌ **O que estava FALTANDO:**

1. **Role `recepcionista`** - Não estava no enum `user_role`
2. **Adaptação do código Next.js** - Para usar as tabelas existentes

## 🔧 Correções Implementadas

### 1. Adicionar Role "recepcionista"

**Arquivo**: `supabase/migrations/20241201000004_add_recepcionista_role.sql`

```sql
-- Adicionar o role 'recepcionista' ao enum user_role
ALTER TYPE user_role ADD VALUE 'recepcionista';
```

### 2. Corrigir AuthContext

**Arquivo**: `lib/contexts/AuthContext.tsx`

- ✅ Adicionado suporte ao role `recepcionista`
- ✅ Corrigido para buscar na tabela `professionals` (não `profissionais`)
- ✅ Melhorado mapeamento de dados

### 3. Corrigir Hook useBarberQueue

**Arquivo**: `hooks/useBarberQueue.ts`

- ✅ Adaptado para usar tabela `professionals`
- ✅ Busca profissionais ativos
- ✅ Mapeia dados corretamente

### 4. Corrigir Sidebar

**Arquivo**: `components/layout/Sidebar.tsx`

- ✅ Usa hook `usePermissions` corretamente
- ✅ Suporte ao role `recepcionista`

## 🚀 Como Aplicar as Correções

### 1. Adicionar Role "recepcionista"

```bash
cd saas-barbearia-nextjs
node scripts/add-recepcionista-role.js
```

### 2. Verificar Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas no `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

### 3. Reiniciar o Sistema

```bash
# Parar o servidor atual (Ctrl+C)
# Reiniciar o servidor
npm run dev
```

## 📊 Estrutura das Tabelas Existentes

### Tabela `professionals` (JÁ EXISTE)

```sql
CREATE TABLE professionals (
  id UUID PRIMARY KEY,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabela `queue` (JÁ EXISTE)

```sql
CREATE TABLE queue (
  id UUID PRIMARY KEY,
  barbershop_id UUID REFERENCES barbershops(id),
  client_id UUID REFERENCES clients(id),
  professional_id UUID REFERENCES professionals(id),
  queue_number INTEGER NOT NULL,
  status queue_status DEFAULT 'waiting',
  priority INTEGER DEFAULT 0,
  services UUID[] NOT NULL,
  estimated_duration_minutes INTEGER,
  estimated_total_price DECIMAL(10,2),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- ... outros campos
);
```

## 🎯 Roles Suportados Agora

- `admin`: Administrador do sistema
- `barbershop_owner`: Proprietário da barbearia
- `professional`: Profissional (barbeiro)
- `recepcionista`: Recepcionista ⭐ **NOVO**
- `client`: Cliente

## 🔐 Permissões por Role

### Recepcionista

- ✅ Visualizar lista da vez (profissionais)
- ✅ Gerenciar clientes
- ❌ Gerenciar profissionais
- ❌ Gerenciar assinaturas

### Admin/Proprietário

- ✅ Todas as permissões
- ✅ Gerenciar profissionais
- ✅ Gerenciar assinaturas
- ✅ Reorganizar fila manualmente

## 🧪 Testando as Correções

1. **Login como Recepcionista**:

   - Deve conseguir acessar "Lista da Vez"
   - Deve conseguir acessar "Clientes"
   - Não deve ver menus de administração

2. **Login como Admin**:

   - Deve ver todos os menus
   - Deve conseguir gerenciar profissionais
   - Deve conseguir reorganizar a fila

3. **Lista da Vez**:
   - Deve mostrar os nomes dos profissionais
   - Deve permitir ativar/desativar profissionais
   - Deve permitir reorganizar (apenas admin)

## 🔍 Design System

- O sistema utiliza exclusivamente Chakra UI. Quaisquer referências a HeroUI foram removidas.

## 🔍 Troubleshooting

### Se ainda houver loop infinito:

1. Verificar se as variáveis de ambiente estão corretas
2. Limpar o cache do navegador
3. Verificar se o role foi adicionado com sucesso
4. Verificar os logs do console para erros específicos

### Se os nomes não aparecerem:

1. Verificar se existem profissionais cadastrados na tabela `professionals`
2. Verificar se os profissionais estão com `is_active = true`
3. Verificar se o campo `name` está preenchido

### Se a autenticação falhar:

1. Verificar se o usuário existe no Supabase Auth
2. Verificar se o role está definido corretamente no `user_metadata`
3. Verificar se o perfil existe na tabela `professionals` ou `profiles`

## 📝 Notas Importantes

- **NÃO foi necessário criar novas tabelas** - o sistema já tem estrutura completa
- **Apenas adicionamos o role `recepcionista`** ao enum existente
- **Adaptamos o código Next.js** para usar as tabelas existentes
- **A lista da vez agora mostra profissionais** em vez de clientes na fila
