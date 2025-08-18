-- Script para corrigir permissões RLS na tabela clientes
-- Execute no SQL Editor do Supabase
-- 1. Verificar políticas atuais
SELECT schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'clientes';
-- 2. Desabilitar RLS temporariamente para teste
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
-- 3. Verificar se conseguimos acessar os dados
SELECT COUNT(*) as total_clientes
FROM public.clientes;
-- 4. Mostrar alguns clientes
SELECT id,
    nome,
    unidade,
    telefone
FROM public.clientes
LIMIT 5;
-- 5. Reabilitar RLS com política mais permissiva
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
-- 6. Remover políticas antigas
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.clientes;
-- 7. Criar nova política permissiva
CREATE POLICY "Enable all operations for authenticated users" ON public.clientes FOR ALL USING (true);
-- 8. Testar acesso novamente
SELECT COUNT(*) as total_depois_rls
FROM public.clientes;









