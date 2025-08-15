# Configuração das Variáveis de Ambiente

## Problema

O script `add-recepcionista-role.js` está falhando porque as variáveis de ambiente do Supabase não estão configuradas.

## Solução

### 1. Criar arquivo .env.local

Crie um arquivo `.env.local` na raiz do projeto `saas-barbearia-nextjs` com o seguinte conteúdo:

```env
# Supabase Configuration
# Substitua pelos valores reais do seu projeto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Outras configurações
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### 2. Obter as credenciais do Supabase

1. Acesse o [painel do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **Settings** > **API**
4. Copie os valores:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Executar o script

Após configurar o arquivo `.env.local`, execute:

```bash
node scripts/add-recepcionista-role.js
```

### 4. Verificar se funcionou

O script deve mostrar:

```
🚀 Adicionando role "recepcionista"...
✅ Role "recepcionista" adicionado!
📋 Roles disponíveis agora:
   - barbershop_owner
   - professional
   - client
   - admin
   - recepcionista
```

## Nota de Segurança

- O arquivo `.env.local` já está no `.gitignore` e não será commitado
- Nunca compartilhe suas chaves do Supabase
- Use sempre a chave `service_role` apenas para scripts administrativos

## UI

- O projeto utiliza exclusivamente Chakra UI. Não há dependências nem configuração de HeroUI.
