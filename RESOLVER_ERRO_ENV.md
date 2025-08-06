# Como Resolver o Erro de Variáveis de Ambiente

## Problema Identificado

O erro no console mostra que as variáveis de ambiente do Supabase não estão configuradas:

- `NEXT_PUBLIC_SUPABASE_URL` está undefined
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` está undefined

## Solução Passo a Passo

### 1. Criar o arquivo .env.local

Na pasta `Tratodebarbadossistema`, crie um arquivo chamado `.env.local` com o seguinte conteúdo:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui

# Outras configurações
NEXTAUTH_SECRET=gere-um-secret-aleatorio-aqui
NEXTAUTH_URL=http://localhost:3000
```

### 2. Obter as credenciais do Supabase

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione o projeto que você está usando
4. No menu lateral, clique em **Settings** (Configurações)
5. Clique em **API**
6. Você verá três informações importantes:
   - **Project URL**: Copie e cole no lugar de `https://seu-projeto.supabase.co`
   - **anon public**: Copie e cole no lugar de `sua-chave-anon-aqui`
   - **service_role**: Copie e cole no lugar de `sua-chave-service-role-aqui`

### 3. Gerar o NEXTAUTH_SECRET

Execute este comando no terminal para gerar um secret aleatório:

```bash
openssl rand -base64 32
```

Ou use qualquer gerador de string aleatória online.

### 4. Reiniciar o servidor

Após criar o arquivo `.env.local`, você precisa reiniciar o servidor Next.js:

1. Pare o servidor atual (Ctrl+C no terminal)
2. Execute novamente:

```bash
npm run dev
```

### 5. Verificar se funcionou

Após reiniciar, o erro deve desaparecer e a aplicação deve conectar corretamente ao Supabase.

## Estrutura do arquivo .env.local

O arquivo deve ficar assim (com seus valores reais):

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXTAUTH_SECRET=kH8Q2T5W9P3M6N1R4V7Y0L3G6J9C2F5A8
NEXTAUTH_URL=http://localhost:3000
```

## Importante

- O arquivo `.env.local` já está no `.gitignore` e não será enviado para o Git
- Nunca compartilhe suas chaves do Supabase publicamente
- Cada projeto Supabase tem suas próprias chaves únicas
