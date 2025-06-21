-- Migração para adicionar campo passou_vez na tabela barber_queue
-- 20241201000005_add_passou_vez_field.sql
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