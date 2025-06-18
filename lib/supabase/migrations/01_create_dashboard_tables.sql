-- Criação da tabela de faturamento mensal
CREATE TABLE IF NOT EXISTS monthly_revenue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    asaas_trato_revenue DECIMAL(10, 2) DEFAULT 0,
    asaas_andrey_revenue DECIMAL(10, 2) DEFAULT 0,
    external_revenue DECIMAL(10, 2) DEFAULT 0,
    total_revenue DECIMAL(10, 2) NOT NULL,
    active_subscribers INTEGER DEFAULT 0,
    overdue_subscribers INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(year, month)
);
-- Criação da tabela de metas mensais
CREATE TABLE IF NOT EXISTS monthly_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    goal_amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(year, month)
);
-- Criação de índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_monthly_revenue_year_month ON monthly_revenue(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_goals_year_month ON monthly_goals(year, month);
-- Criação de políticas de segurança (RLS)
ALTER TABLE monthly_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_goals ENABLE ROW LEVEL SECURITY;
-- Políticas para monthly_revenue
CREATE POLICY "Permitir leitura para todos os usuários autenticados" ON monthly_revenue FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Permitir inserção/atualização apenas para admins" ON monthly_revenue FOR ALL TO authenticated USING (
    auth.uid() IN (
        SELECT user_id
        FROM user_roles
        WHERE role IN ('admin', 'barbershop_owner')
    )
);
-- Políticas para monthly_goals
CREATE POLICY "Permitir leitura para todos os usuários autenticados" ON monthly_goals FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Permitir inserção/atualização apenas para admins" ON monthly_goals FOR ALL TO authenticated USING (
    auth.uid() IN (
        SELECT user_id
        FROM user_roles
        WHERE role IN ('admin', 'barbershop_owner')
    )
);
-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
-- Triggers para atualizar updated_at
CREATE TRIGGER update_monthly_revenue_updated_at BEFORE
UPDATE ON monthly_revenue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_goals_updated_at BEFORE
UPDATE ON monthly_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();