-- Script para corrigir o erro de agendamento
-- Execute este script no SQL Editor do Supabase
-- 1. Adicionar coluna capacidade_concorrente na tabela profissionais
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS capacidade_concorrente INTEGER NOT NULL DEFAULT 1;
-- 2. Adicionar outras colunas necessárias
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS unidade TEXT CHECK (unidade IN ('trato', 'barberbeer'));
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS cor TEXT;
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;
-- 3. Verificar se as colunas foram criadas
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'profissionais'
ORDER BY ordinal_position;
-- 4. Atualizar valores existentes se necessário
UPDATE public.profissionais
SET capacidade_concorrente = 1
WHERE capacidade_concorrente IS NULL;
UPDATE public.profissionais
SET ativo = true
WHERE ativo IS NULL;
-- 5. Verificar dados na tabela
SELECT id,
    nome,
    unidade,
    capacidade_concorrente,
    ativo
FROM public.profissionais
LIMIT 5;
-- 6. Testar se o trigger de validação funciona
-- (opcional) Se ainda houver problemas, desabilitar temporariamente:
-- ALTER TABLE public.agendamentos DISABLE TRIGGER trg_agenda_validacao;









