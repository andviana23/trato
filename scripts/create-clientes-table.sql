-- Script para criar a tabela clientes no Supabase
-- Execute este script no SQL Editor do Supabase
-- ============================================================================
-- TABELA: clientes (clientes da barbearia)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    cpf_cnpj VARCHAR(18),
    endereco TEXT,
    data_nascimento DATE,
    observacoes TEXT,
    unidade TEXT NOT NULL,
    -- Campo para separar por unidade
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- ============================================================================
-- ÍNDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_clientes_unidade ON public.clientes(unidade);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON public.clientes(nome);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON public.clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
-- ============================================================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================================================
-- Primeiro, criar a função se ela não existir
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_clientes_updated_at BEFORE
UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
-- Políticas para clientes
CREATE POLICY "Clientes são visíveis para todos os usuários autenticados" ON public.clientes FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Apenas usuários autenticados podem inserir clientes" ON public.clientes FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Apenas usuários autenticados podem atualizar clientes" ON public.clientes FOR
UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Apenas usuários autenticados podem deletar clientes" ON public.clientes FOR DELETE USING (auth.role() = 'authenticated');
-- ============================================================================
-- DADOS INICIAIS (opcional)
-- ============================================================================
-- Inserir alguns clientes de exemplo para teste
INSERT INTO public.clientes (nome, email, telefone, unidade)
VALUES (
        'João Silva',
        'joao@email.com',
        '(11) 99999-9999',
        'Trato de Barbados'
    ),
    (
        'Maria Santos',
        'maria@email.com',
        '(11) 88888-8888',
        'Trato de Barbados'
    ),
    (
        'Pedro Oliveira',
        'pedro@email.com',
        '(11) 77777-7777',
        'BARBER BEER SPORT CLUB'
    ),
    (
        'Ana Costa',
        'ana@email.com',
        '(11) 66666-6666',
        'BARBER BEER SPORT CLUB'
    ) ON CONFLICT DO NOTHING;
-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
-- Verificar se a tabela foi criada
SELECT table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'clientes'
ORDER BY ordinal_position;
-- Verificar os dados inseridos
SELECT *
FROM public.clientes
ORDER BY unidade,
    nome;








