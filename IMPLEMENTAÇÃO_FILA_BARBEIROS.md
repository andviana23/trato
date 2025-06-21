# Implementação da Lógica dos Botões da Fila de Barbeiros

## ✅ Funcionalidades Implementadas

### 1. Botão "+1" (Atendeu)

- ✅ Adiciona +1 no campo `total_services` do barbeiro
- ✅ Adiciona +1 no campo `daily_services` do barbeiro
- ✅ Atualiza `last_service_date` para hoje
- ✅ REORGANIZA a fila: quem tem mais atendimentos vai para o final (fila indiana)

### 2. Botão "Passar" (Passou a vez)

- ✅ Adiciona +1 no campo `total_services`
- ✅ Adiciona +1 no campo `daily_services`
- ✅ Adiciona +1 no campo `passou_vez` (novo campo criado)
- ✅ REORGANIZA a fila (para ser justo)

### 3. Toggle "Ativo/Inativo"

- ✅ Alterna o campo `is_active` entre true/false
- ✅ Se inativo, remove da fila temporariamente
- ✅ Se ativo, volta para a fila

### 4. Botão "Reorganizar por Atendimentos"

- ✅ Ordena a fila por `total_services` (menor para maior)
- ✅ Atualiza `queue_position` de acordo

### 5. Botão "Zerar Lista"

- ✅ Zera `total_services` de todos os barbeiros
- ✅ Zera `daily_services` de todos os barbeiros
- ✅ Zera `passou_vez` de todos os barbeiros
- ✅ Reorganiza posições (1, 2, 3, 4, 5...)

## 🗄️ Migração do Banco de Dados

### Passo 1: Executar a Migração

Execute o seguinte SQL no SQL Editor do Supabase:

```sql
-- Adicionar campo passou_vez na tabela barber_queue
ALTER TABLE barber_queue
ADD COLUMN IF NOT EXISTS passou_vez INTEGER DEFAULT 0;

-- Comentário explicativo
COMMENT ON COLUMN barber_queue.passou_vez IS 'Contador de quantas vezes o profissional passou a vez';

-- Índice para otimizar consultas por passou_vez
CREATE INDEX IF NOT EXISTS idx_barber_queue_passou_vez ON barber_queue(passou_vez);

-- Atualizar registros existentes para ter o campo com valor padrão
UPDATE barber_queue
SET passou_vez = 0
WHERE passou_vez IS NULL;
```

**Arquivo da migração:** `scripts/add_passou_vez_field.sql`

## 🔧 Arquivos Modificados

### 1. Hook Principal

- **Arquivo:** `hooks/useBarberQueue.ts`
- **Funcionalidades:**
  - `handleAtendimento()` - Botão +1
  - `handlePassarVez()` - Botão Passar
  - `handleToggleAtivo()` - Toggle Ativo/Inativo
  - `reorganizarPorAtendimentos()` - Reorganizar fila
  - `zerarLista()` - Zerar lista
  - `reorganizarFila()` - Lógica de reorganização (fila indiana)

### 2. Página Principal

- **Arquivo:** `app/lista-da-vez/page.tsx`
- **Melhorias:**
  - Interface atualizada com estatísticas
  - Botões funcionais com as novas funções
  - Drag and drop para reordenação manual
  - Exibição do campo `passou_vez`

### 3. Componente de Teste

- **Arquivo:** `components/BarberQueueTest.tsx`
- **Funcionalidade:** Teste automatizado de todas as funcionalidades

### 4. Página de Teste

- **Arquivo:** `app/teste-fila/page.tsx`
- **Funcionalidade:** Interface para testar as funcionalidades

## 🎯 Lógica de Reorganização (Fila Indiana)

A reorganização segue esta ordem de prioridade:

1. **Ativos primeiro** (`is_active = true`)
2. **Menor número de atendimentos** (`total_services` - menor primeiro)
3. **Menor número de "passou vez"** (`passou_vez` - menor primeiro)
4. **Posição atual** (em caso de empate)

```javascript
const novaOrdem = barbeiros.sort((a, b) => {
  // 1. Ativos primeiro
  if (a.is_active !== b.is_active) return b.is_active ? 1 : -1;

  // 2. Menor número de atendimentos primeiro (fila indiana)
  if (a.total_services !== b.total_services)
    return a.total_services - b.total_services;

  // 3. Menor número de "passou vez" primeiro
  if ((a.passou_vez || 0) !== (b.passou_vez || 0))
    return (a.passou_vez || 0) - (b.passou_vez || 0);

  // 4. Posição atual em caso de empate
  return a.queue_position - b.queue_position;
});
```

## 🧪 Como Testar

### 1. Acessar a Página de Teste

Navegue para: `/teste-fila`

### 2. Executar Testes

- **Testar +1:** Verifica se o atendimento é registrado e a fila reorganizada
- **Testar Passar:** Verifica se "passou vez" é registrado e a fila reorganizada
- **Testar Toggle:** Verifica se o status ativo/inativo é alterado
- **Testar Reorganizar:** Verifica se a fila é reorganizada por atendimentos
- **Testar Zerar:** Verifica se todos os contadores são zerados

### 3. Verificar Logs

Os logs mostram o resultado de cada teste em tempo real.

## 📊 Campos da Tabela `barber_queue`

| Campo               | Tipo    | Descrição                  |
| ------------------- | ------- | -------------------------- |
| `id`                | UUID    | ID único do registro       |
| `profissional_id`   | UUID    | ID do profissional         |
| `queue_position`    | INTEGER | Posição na fila            |
| `daily_services`    | INTEGER | Atendimentos do dia        |
| `total_services`    | INTEGER | Total de atendimentos      |
| `is_active`         | BOOLEAN | Status ativo/inativo       |
| `last_service_date` | DATE    | Data do último atendimento |
| `passou_vez`        | INTEGER | Contador de "passou a vez" |

## 🔄 Fluxo de Funcionamento

1. **Atendimento (+1):**

   - Incrementa contadores
   - Atualiza data do último serviço
   - Reorganiza fila automaticamente

2. **Passar a Vez:**

   - Incrementa contadores + passou_vez
   - Reorganiza fila automaticamente

3. **Toggle Ativo/Inativo:**

   - Altera status
   - Reorganiza fila se ativou

4. **Reorganização Automática:**
   - Acontece após cada ação
   - Segue a lógica da fila indiana
   - Atualiza posições no banco

## 🚀 Resultado Esperado

✅ Todos os botões funcionam conforme as regras de negócio
✅ Reorganização automática após cada ação
✅ Interface atualiza em tempo real
✅ Lógica de fila indiana implementada
✅ Campo `passou_vez` adicionado e funcionando
✅ Testes automatizados disponíveis

## 📝 Próximos Passos

1. Execute a migração SQL no Supabase
2. Teste as funcionalidades na página `/teste-fila`
3. Verifique se a página `/lista-da-vez` está funcionando corretamente
4. Monitore os logs para identificar possíveis problemas

## 🐛 Solução de Problemas

### Erro: "Campo passou_vez não existe"

- Execute a migração SQL primeiro

### Erro: "Fila não reorganiza"

- Verifique se há barbeiros ativos na fila
- Verifique os logs do console

### Erro: "Botões não funcionam"

- Verifique se o usuário tem permissões de admin
- Verifique a conexão com o Supabase
