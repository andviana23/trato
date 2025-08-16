-- Script para corrigir a tabela profissionais e resolver o erro de agendamento
-- Execute este script no SQL Editor do Supabase
-- 1. Verificar estrutura atual da tabela profissionais
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'profissionais'
ORDER BY ordinal_position;
-- 2. Adicionar coluna capacidade_concorrente se não existir
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS capacidade_concorrente INTEGER NOT NULL DEFAULT 1;
-- 3. Verificar se a coluna foi criada
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'profissionais'
    AND column_name = 'capacidade_concorrente';
-- 4. Atualizar valores existentes para profissionais que não têm a coluna
UPDATE public.profissionais
SET capacidade_concorrente = 1
WHERE capacidade_concorrente IS NULL;
-- 5. Verificar se há outros campos necessários
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS unidade TEXT CHECK (unidade IN ('trato', 'barberbeer'));
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS cor TEXT;
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
-- 6. Verificar estrutura final
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'profissionais'
ORDER BY ordinal_position;
-- 7. Testar se o trigger de validação funciona agora
-- (opcional) Desabilitar temporariamente o trigger se ainda houver problemas
-- ALTER TABLE public.agendamentos DISABLE TRIGGER trg_agenda_validacao;
-- 8. Verificar se há dados na tabela profissionais
SELECT id,
    nome,
    unidade,
    capacidade_concorrente,
    ativo
FROM public.profissionais
LIMIT 5;








