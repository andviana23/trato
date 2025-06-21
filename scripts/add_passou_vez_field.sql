-- Script para adicionar campo passou_vez na tabela barber_queue
-- Execute este script diretamente no SQL Editor do Supabase
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
-- Verificar se o campo foi adicionado corretamente
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'barber_queue'
    AND column_name = 'passou_vez';