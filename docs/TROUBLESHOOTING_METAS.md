# Guia de Troubleshooting - Sistema de Metas

## Problemas Comuns e Soluções

### 1. Erro de Conexão com Supabase

**Sintomas:**

- Erro "Erro na conexão com o banco de dados"
- Console mostra erro de conexão

**Soluções:**

1. Verificar se as variáveis de ambiente estão configuradas:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
   ```

2. Verificar se o arquivo `.env.local` existe na raiz do projeto

3. Reiniciar o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

### 2. Tabelas de Metas Não Encontradas

**Sintomas:**

- Erro "Tabela de Metas não encontrada"
- Console mostra erro de tabela inexistente

**Soluções:**

1. Executar o script SQL no Supabase:

   - Acesse o painel do Supabase
   - Vá para SQL Editor
   - Execute o conteúdo do arquivo `trato/sql/metas_tables.sql`

2. Verificar se as tabelas foram criadas:
   ```sql
   SELECT * FROM information_schema.tables
   WHERE table_name IN ('metas_barberbeer', 'metas_trato');
   ```

### 3. Erro de Ícones

**Sintomas:**

- Erro "EditIcon is not exported from @heroicons/react/24/outline"
- Página não carrega

**Solução:**

- ✅ **CORRIGIDO**: Substituído `EditIcon` por `PencilIcon`

### 4. Erro de Dependências

**Sintomas:**

- Erro de módulo não encontrado
- Erro de importação

**Soluções:**

1. Instalar dependências:

   ```bash
   npm install
   ```

2. Limpar cache:
   ```bash
   npm run build
   rm -rf .next
   npm run dev
   ```

### 5. Erro de Cache do Navegador

**Sintomas:**

- Página não atualiza
- Erros inconsistentes

**Soluções:**

1. Limpar cache do navegador (Ctrl+F5)
2. Abrir em aba anônima
3. Limpar cache do Next.js:
   ```bash
   rm -rf .next
   npm run dev
   ```

### 6. Erro de TypeScript

**Sintomas:**

- Erros de tipo
- Erros de compilação

**Soluções:**

1. Verificar se o TypeScript está configurado corretamente
2. Verificar se os tipos estão definidos corretamente
3. Executar:
   ```bash
   npm run lint
   ```

## Verificação Rápida

Para verificar se tudo está funcionando:

1. **Acesse a página de teste:**

   ```
   http://localhost:3000/teste-metas
   ```

2. **Acesse a versão simplificada:**

   ```
   http://localhost:3000/cadastros/metas-barberbeer-simples
   ```

3. **Verifique o console do navegador** para mensagens de erro detalhadas

## Logs de Debug

As páginas de Metas agora incluem logs detalhados no console:

- ✅ "Conexão com Supabase OK"
- ✅ "Tabela metas_barberbeer OK" / "Tabela metas_trato OK"
- ❌ "Erro na conexão com Supabase: [erro]"
- ❌ "Tabela não encontrada: [erro]"

## Contato

Se o problema persistir, forneça:

1. Mensagem de erro exata
2. Screenshot do console do navegador
3. URL da página onde o erro ocorre
4. Passos para reproduzir o erro
