-- Script para adicionar o role "recepcionista" ao enum user_role
-- Execute este script no SQL Editor do Supabase
-- Adicionar o role 'recepcionista' ao enum user_role
ALTER TYPE user_role
ADD VALUE 'recepcionista';
-- Verificar os roles disponíveis
SELECT unnest(enum_range(NULL::user_role)) as available_roles;
-- Comentário: Se der erro de "already exists", significa que o role já foi adicionado