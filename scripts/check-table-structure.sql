-- Script para verificar a estrutura real das tabelas
-- Execute este script no SQL Editor do Supabase
-- 1. Verificar se a tabela profissionais existe e sua estrutura
SELECT table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'profissionais'
ORDER BY ordinal_position;
-- 2. Verificar se a tabela agendamentos existe e sua estrutura
SELECT table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'agendamentos'
ORDER BY ordinal_position;
-- 3. Verificar quais triggers existem na tabela agendamentos
SELECT trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'agendamentos'
    AND event_object_schema = 'public';
-- 4. Verificar se há funções relacionadas a agendamentos
SELECT routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name LIKE '%agendamento%'
    OR routine_name LIKE '%agenda%';
-- 5. Verificar se há constraints na tabela agendamentos
SELECT constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints
WHERE table_schema = 'public'
    AND table_name = 'agendamentos';
-- 6. Verificar se há RLS (Row Level Security) ativo
SELECT schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('agendamentos', 'profissionais', 'clientes');








