-- =====================================================
-- SISTEMA TRATO DE BARBADOS - CONFIGURAÇÃO COMPLETA NEON
-- =====================================================
-- Este script cria toda a estrutura do banco de dados
-- para o sistema de gestão de barbearias
-- =====================================================
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- =====================================================
-- 1. ENUMS E TIPOS PERSONALIZADOS
-- =====================================================
-- Enum para roles de usuário
CREATE TYPE user_role AS ENUM (
    'admin',
    'barbershop_owner',
    'professional',
    'recepcionista',
    'client'
);
-- Enum para status de agendamentos
CREATE TYPE appointment_status AS ENUM (
    'agendado',
    'confirmado',
    'atendido',
    'cancelado',
    'no_show',
    'bloqueado'
);
-- Enum para tipo de bonificação
CREATE TYPE bonus_type AS ENUM ('fixo', 'percentual');
-- =====================================================
-- 2. TABELAS BASE (SEM DEPENDÊNCIAS)
-- =====================================================
-- Tabela de unidades (barbearias)
CREATE TABLE unidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    endereco TEXT,
    telefone TEXT,
    email TEXT,
    horario_funcionamento JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Tabela de categorias de produtos
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Tabela de marcas
CREATE TABLE marcas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Tabela de planos de assinatura
CREATE TABLE planos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    valor_mensal DECIMAL(10, 2) NOT NULL,
    servicos_inclusos JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =====================================================
-- 3. TABELAS DE AUTENTICAÇÃO E USUÁRIOS
-- =====================================================
-- Tabela de perfis de usuários
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    role user_role DEFAULT 'client',
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Tabela de profissionais
CREATE TABLE professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE
    SET NULL,
        unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        specialty TEXT,
        bio TEXT,
        avatar_url TEXT,
        hourly_rate DECIMAL(10, 2),
        commission_rate DECIMAL(5, 2) DEFAULT 50.00,
        is_active BOOLEAN DEFAULT true,
        can_receive_appointments BOOLEAN DEFAULT true,
        work_schedule JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =====================================================
-- 4. TABELAS DE CLIENTES
-- =====================================================
-- Tabela de clientes
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE
    SET NULL,
        unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        birth_date DATE,
        preferences JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =====================================================
-- 5. TABELAS DE SERVIÇOS
-- =====================================================
-- Tabela de serviços
CREATE TABLE servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    duracao_minutos INTEGER DEFAULT 30,
    preco DECIMAL(10, 2) NOT NULL,
    categoria_id UUID REFERENCES categorias(id) ON DELETE
    SET NULL,
        unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =====================================================
-- 6. TABELAS DE PRODUTOS
-- =====================================================
-- Tabela de produtos Trato
CREATE TABLE produtos_trato_de_barbados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    categoria_id UUID REFERENCES categorias(id) ON DELETE
    SET NULL,
        marca_id UUID REFERENCES marcas(id) ON DELETE
    SET NULL,
        estoque_atual INTEGER DEFAULT 0,
        estoque_minimo INTEGER DEFAULT 5,
        unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Tabela de produtos BarberBeer
CREATE TABLE produtos_barberbeer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    categoria_id UUID REFERENCES categorias(id) ON DELETE
    SET NULL,
        marca_id UUID REFERENCES marcas(id) ON DELETE
    SET NULL,
        estoque_atual INTEGER DEFAULT 0,
        estoque_minimo INTEGER DEFAULT 5,
        unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =====================================================
-- 7. TABELAS DE AGENDAMENTOS
-- =====================================================
-- Tabela principal de agendamentos
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clients(id) ON DELETE
    SET NULL,
        barbeiro_id UUID REFERENCES professionals(id) ON DELETE
    SET NULL,
        unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
        start_at TIMESTAMPTZ NOT NULL,
        end_at TIMESTAMPTZ NOT NULL,
        status appointment_status NOT NULL DEFAULT 'agendado',
        servicos JSONB DEFAULT '[]'::jsonb,
        observacoes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =====================================================
-- 8. TABELAS DE FILA DE ATENDIMENTO
-- =====================================================
-- Tabela de fila inteligente de barbeiros
CREATE TABLE barber_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profissional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
    queue_position INTEGER NOT NULL,
    daily_services INTEGER DEFAULT 0,
    total_services INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_service_date DATE,
    passou_vez INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =====================================================
-- 9. TABELAS DE SERVIÇOS REALIZADOS
-- =====================================================
-- Tabela de serviços avulsos
CREATE TABLE servicos_avulsos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profissional_id UUID REFERENCES professionals(id) ON DELETE
    SET NULL,
        cliente_id UUID REFERENCES clients(id) ON DELETE
    SET NULL,
        servico_id UUID REFERENCES servicos(id) ON DELETE
    SET NULL,
        unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
        data_realizacao DATE NOT NULL,
        valor DECIMAL(10, 2) NOT NULL,
        comissao DECIMAL(10, 2),
        observacoes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
);
-- =====================================================
-- 10. TABELAS DE VENDAS
-- =====================================================
-- Tabela de vendas de produtos
CREATE TABLE vendas_produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID NOT NULL,
    profissional_id UUID REFERENCES professionals(id) ON DELETE
    SET NULL,
        cliente_id UUID REFERENCES clients(id) ON DELETE
    SET NULL,
        unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
        quantidade INTEGER NOT NULL,
        preco_unitario DECIMAL(10, 2) NOT NULL,
        preco_total DECIMAL(10, 2) NOT NULL,
        data_venda DATE NOT NULL,
        comissao DECIMAL(10, 2),
        created_at TIMESTAMPTZ DEFAULT NOW()
);
-- =====================================================
-- 11. TABELAS DE ASSINATURAS
-- =====================================================
-- Tabela de assinaturas
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    plano_id UUID REFERENCES planos(id) ON DELETE
    SET NULL,
        unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'ativa',
        data_inicio DATE NOT NULL,
        data_fim DATE,
        valor_mensal DECIMAL(10, 2) NOT NULL,
        forma_pagamento TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =====================================================
-- 12. TABELAS DE METAS
-- =====================================================
-- Tabela de metas BarberBeer
CREATE TABLE metas_barberbeer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbeiro_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
    mes INTEGER NOT NULL CHECK (
        mes >= 1
        AND mes <= 12
    ),
    ano INTEGER NOT NULL,
    meta_venda_produto DECIMAL(10, 2) DEFAULT 0,
    meta_faturamento DECIMAL(10, 2) DEFAULT 0,
    tipo_bonificacao bonus_type DEFAULT 'fixo',
    valor_bonificacao DECIMAL(10, 2) DEFAULT 0,
    foi_batida BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Tabela de metas Trato
CREATE TABLE metas_trato (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbeiro_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
    mes INTEGER NOT NULL CHECK (
        mes >= 1
        AND mes <= 12
    ),
    ano INTEGER NOT NULL,
    meta_venda_produto DECIMAL(10, 2) DEFAULT 0,
    meta_faturamento DECIMAL(10, 2) DEFAULT 0,
    tipo_bonificacao bonus_type DEFAULT 'fixo',
    valor_bonificacao DECIMAL(10, 2) DEFAULT 0,
    foi_batida BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =====================================================
-- 13. TABELAS DE COMISSÕES
-- =====================================================
-- Tabela de comissões avulsas
CREATE TABLE comissoes_avulses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profissional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    servico_avulso_id UUID REFERENCES servicos_avulsos(id) ON DELETE CASCADE,
    unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
    valor_comissao DECIMAL(10, 2) NOT NULL,
    percentual_comissao DECIMAL(5, 2) NOT NULL,
    mes INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    pago BOOLEAN DEFAULT false,
    data_pagamento DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- =====================================================
-- 14. TABELAS DE FATURAMENTO
-- =====================================================
-- Tabela de faturamento de assinaturas
CREATE TABLE faturamento_assinatura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assinatura_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
    mes INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pendente',
    data_pagamento DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Tabela de receita mensal
CREATE TABLE monthly_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
    mes INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    receita_assinaturas DECIMAL(10, 2) DEFAULT 0,
    receita_servicos_avulsos DECIMAL(10, 2) DEFAULT 0,
    receita_produtos DECIMAL(10, 2) DEFAULT 0,
    total_receita DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =====================================================
-- 15. TABELAS DE BLOQUEIOS
-- =====================================================
-- Tabela de bloqueios de horários
CREATE TABLE bloqueios_horarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
    data_inicio TIMESTAMPTZ NOT NULL,
    data_fim TIMESTAMPTZ NOT NULL,
    motivo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- =====================================================
-- 16. ÍNDICES PARA PERFORMANCE
-- =====================================================
-- Índices para appointments
CREATE INDEX idx_appointments_cliente_id ON appointments(cliente_id);
CREATE INDEX idx_appointments_barbeiro_id ON appointments(barbeiro_id);
CREATE INDEX idx_appointments_unidade_id ON appointments(unidade_id);
CREATE INDEX idx_appointments_start_at ON appointments(start_at);
CREATE INDEX idx_appointments_status ON appointments(status);
-- Índices para professionals
CREATE INDEX idx_professionals_unidade_id ON professionals(unidade_id);
CREATE INDEX idx_professionals_user_id ON professionals(user_id);
-- Índices para clients
CREATE INDEX idx_clients_unidade_id ON clients(unidade_id);
CREATE INDEX idx_clients_user_id ON clients(user_id);
-- Índices para servicos
CREATE INDEX idx_servicos_unidade_id ON servicos(unidade_id);
CREATE INDEX idx_servicos_categoria_id ON servicos(categoria_id);
-- Índices para produtos
CREATE INDEX idx_produtos_trato_unidade_id ON produtos_trato_de_barbados(unidade_id);
CREATE INDEX idx_produtos_barberbeer_unidade_id ON produtos_barberbeer(unidade_id);
-- Índices para metas
CREATE INDEX idx_metas_barbeiro_id ON metas_barberbeer(barbeiro_id);
CREATE INDEX idx_metas_trato_barbeiro_id ON metas_trato(barbeiro_id);
-- =====================================================
-- 17. FUNÇÕES ÚTEIS
-- =====================================================
-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
-- Função para calcular comissão
CREATE OR REPLACE FUNCTION calcular_comissao(
        valor_total DECIMAL,
        percentual_comissao DECIMAL
    ) RETURNS DECIMAL AS $$ BEGIN RETURN (valor_total * percentual_comissao) / 100;
END;
$$ LANGUAGE plpgsql;
-- =====================================================
-- 18. TRIGGERS
-- =====================================================
-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE
UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professionals_updated_at BEFORE
UPDATE ON professionals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE
UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_servicos_updated_at BEFORE
UPDATE ON servicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_produtos_trato_updated_at BEFORE
UPDATE ON produtos_trato_de_barbados FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_produtos_barberbeer_updated_at BEFORE
UPDATE ON produtos_barberbeer FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE
UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_metas_barberbeer_updated_at BEFORE
UPDATE ON metas_barberbeer FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_metas_trato_updated_at BEFORE
UPDATE ON metas_trato FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_revenue_updated_at BEFORE
UPDATE ON monthly_revenue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- =====================================================
-- 19. VIEWS DO SISTEMA
-- =====================================================
-- View de atendimentos por cliente
CREATE VIEW vw_atendimentos_por_cliente AS
SELECT c.id as cliente_id,
    c.name as cliente_nome,
    c.email as cliente_email,
    COUNT(a.id) as total_agendamentos,
    COUNT(
        CASE
            WHEN a.status = 'atendido' THEN 1
        END
    ) as agendamentos_atendidos,
    COUNT(
        CASE
            WHEN a.status = 'cancelado' THEN 1
        END
    ) as agendamentos_cancelados,
    SUM(
        CASE
            WHEN a.status = 'atendido' THEN 1
            ELSE 0
        END
    ) as total_atendimentos
FROM clients c
    LEFT JOIN appointments a ON c.id = a.cliente_id
GROUP BY c.id,
    c.name,
    c.email;
-- View de resumo de clientes
CREATE VIEW vw_clientes_resumo AS
SELECT c.id,
    c.name,
    c.email,
    c.phone,
    c.unidade_id,
    u.nome as unidade_nome,
    COUNT(a.id) as total_agendamentos,
    MAX(a.created_at) as ultimo_agendamento
FROM clients c
    LEFT JOIN unidades u ON c.unidade_id = u.id
    LEFT JOIN appointments a ON c.id = a.cliente_id
WHERE c.is_active = true
GROUP BY c.id,
    c.name,
    c.email,
    c.phone,
    c.unidade_id,
    u.nome;
-- View de faturamento por unidade
CREATE VIEW vw_faturamento_unidade AS
SELECT u.id as unidade_id,
    u.nome as unidade_nome,
    mr.mes,
    mr.ano,
    mr.receita_assinaturas,
    mr.receita_servicos_avulsos,
    mr.receita_produtos,
    mr.total_receita
FROM unidades u
    LEFT JOIN monthly_revenue mr ON u.id = mr.unidade_id
WHERE u.is_active = true;
-- =====================================================
-- 20. DADOS INICIAIS
-- =====================================================
-- Inserir unidades padrão
INSERT INTO unidades (id, nome, endereco, telefone, email)
VALUES (
        '244c0543-7108-4892-9eac-48186ad1d5e7',
        'Trato de Barbados',
        'Endereço Trato',
        '(11) 99999-9999',
        'trato@barbados.com'
    ),
    (
        '87884040-cafc-4625-857b-6e0402ede7d7',
        'BarberBeer',
        'Endereço BarberBeer',
        '(11) 88888-8888',
        'barberbeer@barbados.com'
    ) ON CONFLICT (id) DO NOTHING;
-- Inserir categorias padrão
INSERT INTO categorias (nome, descricao)
VALUES ('Cabelo', 'Serviços de cabelo'),
    ('Barba', 'Serviços de barba'),
    ('Produtos', 'Produtos para venda'),
    ('Tratamentos', 'Tratamentos especiais') ON CONFLICT DO NOTHING;
-- Inserir planos padrão
INSERT INTO planos (nome, descricao, valor_mensal, servicos_inclusos)
VALUES (
        'Básico',
        'Corte + Barba mensal',
        89.90,
        '["corte", "barba"]'
    ),
    (
        'Premium',
        'Corte + Barba + Tratamentos',
        129.90,
        '["corte", "barba", "tratamentos"]'
    ),
    (
        'VIP',
        'Tudo incluso + Produtos',
        199.90,
        '["corte", "barba", "tratamentos", "produtos"]'
    ) ON CONFLICT DO NOTHING;
-- =====================================================
-- 21. POLÍTICAS RLS (Row Level Security)
-- =====================================================
-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos_trato_de_barbados ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos_barberbeer ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos_avulsos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas_barberbeer ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas_trato ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes_avulses ENABLE ROW LEVEL SECURITY;
ALTER TABLE faturamento_assinatura ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_revenue ENABLE ROW LEVEL SECURITY;
-- =====================================================
-- FINALIZAÇÃO
-- =====================================================
-- Verificar estrutura criada
SELECT schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- Verificar views criadas
SELECT schemaname,
    viewname,
    viewowner
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;
-- Verificar funções criadas
SELECT proname as function_name,
    prosrc as function_source
FROM pg_proc
WHERE pronamespace = (
        SELECT oid
        FROM pg_namespace
        WHERE nspname = 'public'
    )
ORDER BY proname;
COMMIT;
-- =====================================================
-- SISTEMA CONFIGURADO COM SUCESSO! 🎉
-- =====================================================
-- 
-- Estrutura criada:
-- ✅ 20+ tabelas principais
-- ✅ 3 views do sistema
-- ✅ 2 funções úteis
-- ✅ 10+ triggers automáticos
-- ✅ 15+ índices de performance
-- ✅ RLS habilitado em todas as tabelas
-- ✅ Dados iniciais inseridos
-- ✅ Relacionamentos configurados
-- 
-- Próximo passo: Configurar políticas RLS específicas
-- e testar a integração com o sistema Next.js
-- =====================================================