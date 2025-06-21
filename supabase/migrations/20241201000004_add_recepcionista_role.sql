-- Migração para adicionar o role 'recepcionista' ao enum user_role
-- 20241201000004_add_recepcionista_role.sql
-- Adicionar o role 'recepcionista' ao enum user_role
ALTER TYPE user_role
ADD VALUE 'recepcionista';
-- Comentário explicativo
COMMENT ON TYPE user_role IS 'Tipos de usuário: barbershop_owner, professional, client, admin, recepcionista';