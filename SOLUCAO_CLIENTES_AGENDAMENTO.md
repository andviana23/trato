# 🔧 Solução para Clientes Não Aparecerem no Modal de Agendamento

## 🚨 **Problema Identificado**

O modal de agendamento não estava encontrando os clientes cadastrados na barbearia selecionada porque:

1. **A tabela `clientes` não existia** no Supabase
2. **O sistema estava tentando acessar uma tabela inexistente**
3. **Não havia filtros por unidade** implementados corretamente

## ✅ **Soluções Implementadas**

### **1. Criação da Tabela `clientes`**

Criamos uma nova migração para criar a tabela `clientes` com o campo `unidade`:

```sql
-- Arquivo: trato/supabase/migrations/20241216000001_create_clientes_table.sql
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    cpf_cnpj VARCHAR(18),
    endereco TEXT,
    data_nascimento DATE,
    observacoes TEXT,
    unidade TEXT NOT NULL, -- Campo para separar por unidade
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **2. Funções de Filtro por Unidade**

Implementamos funções no `agenda.ts` para filtrar dados por unidade:

```typescript
// Buscar clientes por unidade
export async function getClientesByUnidade(
  unidadeNome?: string
): Promise<Array<{ id: string; nome: string; telefone?: string | null }>>;

// Buscar profissionais por unidade
export async function getProfissionaisByUnidade(
  unidadeNome?: string
): Promise<Profissional[]>;

// Buscar serviços por unidade
export async function getServicosByUnidade(
  unidadeNome?: string
): Promise<Array<{ id: string; nome: string; tempo_minutos?: number | null }>>;
```

### **3. Modal de Agendamento Atualizado**

O modal agora usa as funções de filtro por unidade:

```typescript
useEffect(() => {
  (async () => {
    // Buscar profissionais da unidade selecionada
    const profissionaisUnidade = await getProfissionaisByUnidade(unidade);
    setProfissionais(profissionaisUnidade);

    // Buscar serviços da unidade selecionada
    const servicosUnidade = await getServicosByUnidade(unidade);
    setServicos(servicosUnidade);

    // Buscar clientes da unidade selecionada
    const clientesUnidade = await getClientesByUnidade(unidade);
    setClientes(clientesUnidade);
  })();
}, [supabase, unidade]);
```

### **4. Seletor de Unidade**

Adicionamos um dropdown no modal para permitir troca de unidade:

```typescript
<Select
  value={unidade}
  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
    setUnidade(e.target.value);
  }}
>
  <option value="Trato de Barbados">Trato de Barbados</option>
  <option value="BARBER BEER SPORT CLUB">BARBER BEER SPORT CLUB</option>
</Select>
```

## 🚀 **Como Aplicar a Solução**

### **Passo 1: Criar a Tabela no Supabase**

1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Execute o script: `trato/scripts/create-clientes-table.sql`

### **Passo 2: Verificar as Migrações**

As migrações já foram criadas:

- ✅ `20241216000001_create_clientes_table.sql`

### **Passo 3: Testar o Sistema**

1. **Reinicie** o servidor Next.js
2. **Abra o modal** de agendamento
3. **Verifique os logs** no console do navegador
4. **Teste a troca** de unidade

## 🔍 **Verificações de Debug**

### **Logs no Console**

O modal agora exibe logs para debug:

```javascript
console.log("Modal de agendamento - Unidade atual:", unidade);
console.log("Profissionais encontrados:", profissionaisUnidade);
console.log("Serviços encontrados:", servicosUnidade);
console.log("Clientes encontrados:", clientesUnidade);
```

### **Verificar no Supabase**

```sql
-- Verificar se a tabela existe
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'clientes';

-- Verificar dados inseridos
SELECT * FROM public.clientes ORDER BY unidade, nome;

-- Verificar estrutura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'clientes';
```

## 📊 **Estrutura da Tabela `clientes`**

| Campo             | Tipo         | Descrição            | Constraints   |
| ----------------- | ------------ | -------------------- | ------------- |
| `id`              | UUID         | Identificador único  | PK, AUTO      |
| `nome`            | VARCHAR(200) | Nome do cliente      | NOT NULL      |
| `email`           | VARCHAR(255) | Email do cliente     | NULL          |
| `telefone`        | VARCHAR(20)  | Telefone do cliente  | NULL          |
| `cpf_cnpj`        | VARCHAR(18)  | CPF/CNPJ             | NULL          |
| `endereco`        | TEXT         | Endereço completo    | NULL          |
| `data_nascimento` | DATE         | Data de nascimento   | NULL          |
| `observacoes`     | TEXT         | Observações          | NULL          |
| `unidade`         | TEXT         | Unidade da barbearia | NOT NULL      |
| `is_active`       | BOOLEAN      | Status ativo         | DEFAULT true  |
| `created_at`      | TIMESTAMPTZ  | Data de criação      | DEFAULT NOW() |
| `updated_at`      | TIMESTAMPTZ  | Última atualização   | DEFAULT NOW() |

## 🔐 **Segurança (RLS)**

A tabela `clientes` tem Row Level Security habilitado:

- ✅ **SELECT**: Usuários autenticados podem visualizar
- ✅ **INSERT**: Usuários autenticados podem inserir
- ✅ **UPDATE**: Usuários autenticados podem atualizar
- ✅ **DELETE**: Usuários autenticados podem deletar

## 🎯 **Benefícios da Solução**

1. **✅ Isolamento de dados** por unidade
2. **✅ Performance melhorada** (menos dados carregados)
3. **✅ Segurança** (dados de uma unidade não visíveis para outra)
4. **✅ UX melhorada** (seletor de unidade no modal)
5. **✅ Código organizado** e reutilizável
6. **✅ Logs de debug** para manutenção

## 🚨 **Possíveis Problemas**

### **1. Tabela não criada**

- Verifique se o script SQL foi executado
- Confirme permissões no Supabase

### **2. Dados não aparecem**

- Verifique se há clientes cadastrados na unidade
- Confirme se o campo `unidade` está correto

### **3. Erro de permissão**

- Verifique se o RLS está configurado
- Confirme se o usuário está autenticado

## 📝 **Próximos Passos**

1. **Testar** o modal com diferentes unidades
2. **Implementar** o mesmo padrão em outros modais
3. **Adicionar** validações de unidade
4. **Criar** testes automatizados
5. **Documentar** outras tabelas que precisam do mesmo tratamento

## 🔗 **Arquivos Modificados**

- ✅ `trato/lib/services/agenda.ts` - Novas funções de filtro
- ✅ `trato/app/dashboard/agendamentos/components/AgendamentoModal.tsx` - Modal atualizado
- ✅ `trato/supabase/migrations/20241216000001_create_clientes_table.sql` - Nova migração
- ✅ `trato/scripts/create-clientes-table.sql` - Script SQL
- ✅ `trato/scripts/run-clientes-migration.js` - Script Node.js

---

**🎉 Com essas correções, o modal de agendamento deve funcionar corretamente, mostrando apenas os clientes, profissionais e serviços da unidade selecionada!**









