-- Script para corrigir RLS e inserir dados na tabela clientes
-- Execute este script no SQL Editor do Supabase
-- 1. Primeiro, vamos ver as políticas atuais
SELECT schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'clientes';
-- 2. Remover políticas restritivas existentes
DROP POLICY IF EXISTS "Clientes são visíveis para todos os usuários autenticados" ON public.clientes;
DROP POLICY IF EXISTS "Apenas usuários autenticados podem inserir clientes" ON public.clientes;
DROP POLICY IF EXISTS "Apenas usuários autenticados podem atualizar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Apenas usuários autenticados podem deletar clientes" ON public.clientes;
-- 3. Criar políticas mais permissivas
CREATE POLICY "Enable all for authenticated users" ON public.clientes FOR ALL USING (auth.role() = 'authenticated');
-- Alternativamente, se preferir desabilitar RLS temporariamente:
-- ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
-- 4. Inserir dados de exemplo
INSERT INTO public.clientes (nome, email, telefone, unidade)
VALUES (
        'João Silva',
        'joao.silva@email.com',
        '(11) 99999-1111',
        'Trato de Barbados'
    ),
    (
        'Maria Santos',
        'maria.santos@email.com',
        '(11) 99999-2222',
        'Trato de Barbados'
    ),
    (
        'Pedro Oliveira',
        'pedro.oliveira@email.com',
        '(11) 99999-3333',
        'BARBER BEER SPORT CLUB'
    ),
    (
        'Ana Costa',
        'ana.costa@email.com',
        '(11) 99999-4444',
        'BARBER BEER SPORT CLUB'
    ),
    (
        'Carlos Mendes',
        'carlos.mendes@email.com',
        '(11) 99999-5555',
        'Trato de Barbados'
    ),
    (
        'Fernanda Lima',
        'fernanda.lima@email.com',
        '(11) 99999-6666',
        'BARBER BEER SPORT CLUB'
    ) ON CONFLICT DO NOTHING;
-- 5. Verificar se os dados foram inseridos
SELECT id,
    nome,
    unidade,
    telefone
FROM public.clientes
ORDER BY unidade,
    nome;
-- 6. Contar por unidade
SELECT unidade,
    COUNT(*) as total
FROM public.clientes
GROUP BY unidade
ORDER BY unidade;








