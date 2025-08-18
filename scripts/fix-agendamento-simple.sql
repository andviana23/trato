-- Script SIMPLES para corrigir o erro de agendamento
-- Execute este script no SQL Editor do Supabase
-- 1. Verificar se a tabela profissionais existe
SELECT EXISTS (
        SELECT
        FROM information_schema.tables
        WHERE table_schema = 'public'
            AND table_name = 'profissionais'
    ) as profissionais_existe;
-- 2. Se a tabela profissionais não existir, criar
CREATE TABLE IF NOT EXISTS public.profissionais (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    funcao VARCHAR(100) DEFAULT 'barbeiro',
    unidade TEXT CHECK (unidade IN ('trato', 'barberbeer')),
    cor TEXT,
    ativo BOOLEAN DEFAULT true,
    capacidade_concorrente INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 3. Adicionar colunas se a tabela já existir
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS capacidade_concorrente INTEGER DEFAULT 1;
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS unidade TEXT CHECK (unidade IN ('trato', 'barberbeer'));
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS cor TEXT;
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;
-- 4. Verificar se a tabela agendamentos existe
SELECT EXISTS (
        SELECT
        FROM information_schema.tables
        WHERE table_schema = 'public'
            AND table_name = 'agendamentos'
    ) as agendamentos_existe;
-- 5. Se a tabela agendamentos não existir, criar
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unidade TEXT NOT NULL CHECK (unidade IN ('trato', 'barberbeer')),
    cliente_id UUID REFERENCES public.clientes(id),
    profissional_id UUID REFERENCES public.profissionais(id),
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'agendado' CHECK (
        status IN (
            'agendado',
            'confirmado',
            'atendido',
            'cancelado',
            'no_show',
            'bloqueado'
        )
    ),
    titulo TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 6. Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_agendamentos_profissional_id ON public.agendamentos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente_id ON public.agendamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_unidade ON public.agendamentos(unidade);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_inicio ON public.agendamentos(data_inicio);
-- 7. Verificar estrutura final
SELECT 'profissionais' as tabela,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'profissionais'
UNION ALL
SELECT 'agendamentos' as tabela,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'agendamentos'
ORDER BY tabela,
    column_name;
-- 8. Inserir dados de teste se as tabelas estiverem vazias
INSERT INTO public.profissionais (
        nome,
        funcao,
        unidade,
        capacidade_concorrente,
        ativo
    )
SELECT 'Barbeiro Teste',
    'barbeiro',
    'trato',
    1,
    true
WHERE NOT EXISTS (
        SELECT 1
        FROM public.profissionais
        LIMIT 1
    );
-- 9. Verificar dados
SELECT 'Profissionais' as tipo,
    COUNT(*) as total
FROM public.profissionais
UNION ALL
SELECT 'Agendamentos' as tipo,
    COUNT(*) as total
FROM public.agendamentos
UNION ALL
SELECT 'Clientes' as tipo,
    COUNT(*) as total
FROM public.clientes;









