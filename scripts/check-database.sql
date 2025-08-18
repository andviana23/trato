-- Script SQL para verificar tabelas de clientes no Supabase
-- Execute este script no SQL Editor do Supabase
-- 1. Verificar todas as tabelas que contém 'client' ou 'cliente'
SELECT table_name,
    table_type,
    table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
    AND (
        table_name ILIKE '%client%'
        OR table_name ILIKE '%cliente%'
    )
ORDER BY table_name;
-- 2. Verificar se a tabela 'clientes' existe e sua estrutura
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'clientes'
ORDER BY ordinal_position;
-- 3. Verificar se a tabela 'clients' existe e sua estrutura
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'clients'
ORDER BY ordinal_position;
-- 4. Verificar views relacionadas a clientes
SELECT table_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
    AND (
        table_name ILIKE '%client%'
        OR table_name ILIKE '%cliente%'
    )
ORDER BY table_name;
-- 5. Se a tabela 'clientes' existir, verificar os dados
-- (Remova o comentário da linha abaixo para executar)
-- SELECT * FROM public.clientes LIMIT 10;
-- 6. Se a tabela 'clients' existir, verificar os dados
-- (Remova o comentário da linha abaixo para executar)
-- SELECT * FROM public.clients LIMIT 10;
-- 7. Verificar todas as tabelas públicas para ter uma visão geral
SELECT table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;









