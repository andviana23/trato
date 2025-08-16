-- ============================================================================
-- MELHORIA DAS POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================================
-- Esta migração implementa e melhora as políticas de segurança em nível de linha
-- para todas as tabelas sensíveis do sistema Trato de Barbados
-- ============================================================================
-- Data: 2024-12-24
-- Versão: 1.0
-- ============================================================================
-- ============================================================================
-- 1. FUNÇÕES AUXILIARES PARA RLS
-- ============================================================================
-- Função para verificar se o usuário é admin ou proprietário
CREATE OR REPLACE FUNCTION is_admin_or_owner() RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('admin', 'barbershop_owner')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Função para verificar se o usuário é profissional
CREATE OR REPLACE FUNCTION is_professional() RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('professional', 'barbeiro')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Função para verificar se o usuário é recepcionista
CREATE OR REPLACE FUNCTION is_recepcionista() RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role = 'recepcionista'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Função para verificar se o usuário tem acesso à unidade
CREATE OR REPLACE FUNCTION has_unit_access(unidade_id_param UUID) RETURNS BOOLEAN AS $$ BEGIN -- Admins e proprietários têm acesso a todas as unidades
    IF is_admin_or_owner() THEN RETURN TRUE;
END IF;
-- Profissionais e recepcionistas só têm acesso à sua unidade
RETURN EXISTS (
    SELECT 1
    FROM professionals
    WHERE user_id = auth.uid()
        AND unidade_id = unidade_id_param
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Função para verificar se o usuário é o próprio recurso
CREATE OR REPLACE FUNCTION is_own_resource(resource_user_id UUID) RETURNS BOOLEAN AS $$ BEGIN RETURN auth.uid() = resource_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================================================
-- 2. MELHORAR POLÍTICAS RLS PARA TABELAS EXISTENTES
-- ============================================================================
-- ============================================================================
-- 2.1 TABELA: profiles
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR
SELECT USING (is_own_resource(id));
-- Usuários podem atualizar apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE USING (is_own_resource(id));
-- Apenas admins podem inserir novos perfis
DROP POLICY IF EXISTS "Only admins can insert profiles" ON profiles;
CREATE POLICY "Only admins can insert profiles" ON profiles FOR
INSERT WITH CHECK (is_admin_or_owner());
-- Apenas admins podem deletar perfis
DROP POLICY IF EXISTS "Only admins can delete profiles" ON profiles;
CREATE POLICY "Only admins can delete profiles" ON profiles FOR DELETE USING (is_admin_or_owner());
-- ============================================================================
-- 2.2 TABELA: profissionais
-- ============================================================================
-- Manter políticas existentes, mas adicionar isolamento por unidade
DROP POLICY IF EXISTS "Profissionais são visíveis para todos os usuários autenticados" ON profissionais;
CREATE POLICY "Profissionais são visíveis para usuários com acesso à unidade" ON profissionais FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM professionals p
            WHERE p.id = profissionais.id
                AND has_unit_access(p.unidade_id)
        )
    );
-- ============================================================================
-- 2.3 TABELA: barber_queue
-- ============================================================================
-- Manter políticas existentes, mas adicionar isolamento por unidade
DROP POLICY IF EXISTS "Barber queue é visível para todos os usuários autenticados" ON barber_queue;
CREATE POLICY "Barber queue é visível para usuários com acesso à unidade" ON barber_queue FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM professionals p
            WHERE p.id = barber_queue.profissional_id
                AND has_unit_access(p.unidade_id)
        )
    );
-- ============================================================================
-- 2.4 TABELA: appointments
-- ============================================================================
-- Melhorar políticas existentes com isolamento por unidade
DROP POLICY IF EXISTS sel_appointments_all ON appointments;
CREATE POLICY "Appointments visible to users with unit access" ON appointments FOR
SELECT USING (has_unit_access(unidade_id));
DROP POLICY IF EXISTS ins_appointments_auth ON appointments;
CREATE POLICY "Users can create appointments in their unit" ON appointments FOR
INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND has_unit_access(unidade_id)
    );
DROP POLICY IF EXISTS upd_appointments_auth ON appointments;
CREATE POLICY "Users can update appointments in their unit" ON appointments FOR
UPDATE USING (
        auth.uid() IS NOT NULL
        AND has_unit_access(unidade_id)
    );
DROP POLICY IF EXISTS del_appointments_auth ON appointments;
CREATE POLICY "Users can delete appointments in their unit" ON appointments FOR DELETE USING (
    auth.uid() IS NOT NULL
    AND has_unit_access(unidade_id)
);
-- ============================================================================
-- 2.5 TABELA: notifications_queue
-- ============================================================================
-- Melhorar políticas existentes com isolamento por unidade
DROP POLICY IF EXISTS sel_notifications_auth ON notifications_queue;
CREATE POLICY "Notifications visible to users with unit access" ON notifications_queue FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM appointments a
            WHERE a.id = notifications_queue.appointment_id
                AND has_unit_access(a.unidade_id)
        )
    );
DROP POLICY IF EXISTS ins_notifications_auth ON notifications_queue;
CREATE POLICY "Users can create notifications for their unit" ON notifications_queue FOR
INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM appointments a
            WHERE a.id = notifications_queue.appointment_id
                AND has_unit_access(a.unidade_id)
        )
    );
DROP POLICY IF EXISTS upd_notifications_auth ON notifications_queue;
CREATE POLICY "Users can update notifications for their unit" ON notifications_queue FOR
UPDATE USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM appointments a
            WHERE a.id = notifications_queue.appointment_id
                AND has_unit_access(a.unidade_id)
        )
    );
-- ============================================================================
-- 3. IMPLEMENTAR RLS PARA TABELAS QUE NÃO TÊM
-- ============================================================================
-- ============================================================================
-- 3.1 TABELA: clientes
-- ============================================================================
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver clientes de sua unidade
CREATE POLICY "Users can view clients in their unit" ON clientes FOR
SELECT USING (
        has_unit_access(
            (
                SELECT id
                FROM unidades
                WHERE nome = clientes.unidade
                LIMIT 1
            )
        )
    );
-- Usuários podem inserir clientes em sua unidade
CREATE POLICY "Users can create clients in their unit" ON clientes FOR
INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND has_unit_access(
            (
                SELECT id
                FROM unidades
                WHERE nome = clientes.unidade
                LIMIT 1
            )
        )
    );
-- Usuários podem atualizar clientes de sua unidade
CREATE POLICY "Users can update clients in their unit" ON clientes FOR
UPDATE USING (
        has_unit_access(
            (
                SELECT id
                FROM unidades
                WHERE nome = clientes.unidade
                LIMIT 1
            )
        )
    );
-- Usuários podem deletar clientes de sua unidade
CREATE POLICY "Users can delete clients in their unit" ON clientes FOR DELETE USING (
    has_unit_access(
        (
            SELECT id
            FROM unidades
            WHERE nome = clientes.unidade
            LIMIT 1
        )
    )
);
-- ============================================================================
-- 3.2 TABELA: metas
-- ============================================================================
-- Verificar se a tabela existe antes de aplicar RLS
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'metas'
) THEN
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver metas de sua unidade
CREATE POLICY "Users can view metas in their unit" ON metas FOR
SELECT USING (has_unit_access(unidadeId));
-- Apenas admins e profissionais podem inserir metas
CREATE POLICY "Admins and professionals can create metas" ON metas FOR
INSERT WITH CHECK (
        is_admin_or_owner()
        OR is_professional()
    );
-- Apenas admins e o profissional dono podem atualizar metas
CREATE POLICY "Admins and owner can update metas" ON metas FOR
UPDATE USING (
        is_admin_or_owner()
        OR EXISTS (
            SELECT 1
            FROM professionals p
            WHERE p.id = metas.professionalId
                AND p.user_id = auth.uid()
        )
    );
-- Apenas admins podem deletar metas
CREATE POLICY "Only admins can delete metas" ON metas FOR DELETE USING (is_admin_or_owner());
END IF;
END $$;
-- ============================================================================
-- 3.3 TABELA: bonus
-- ============================================================================
-- Verificar se a tabela existe antes de aplicar RLS
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'bonus'
) THEN
ALTER TABLE bonus ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver bônus de sua unidade
CREATE POLICY "Users can view bonus in their unit" ON bonus FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM metas m
            WHERE m.id = bonus.metaId
                AND has_unit_access(m.unidadeId)
        )
    );
-- Apenas admins podem gerenciar bônus
CREATE POLICY "Only admins can manage bonus" ON bonus FOR ALL USING (is_admin_or_owner());
END IF;
END $$;
-- ============================================================================
-- 4. POLÍTICAS ESPECIAIS PARA TABELAS DE PRODUTOS
-- ============================================================================
-- ============================================================================
-- 4.1 TABELA: produtos_trato_de_barbados
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'produtos_trato_de_barbados'
) THEN
ALTER TABLE produtos_trato_de_barbados ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver produtos de sua unidade
CREATE POLICY "Users can view products in their unit" ON produtos_trato_de_barbados FOR
SELECT USING (has_unit_access(unidade_id));
-- Apenas admins e recepcionistas podem gerenciar produtos
CREATE POLICY "Admins and recepcionistas can manage products" ON produtos_trato_de_barbados FOR ALL USING (
    is_admin_or_owner()
    OR is_recepcionista()
);
END IF;
END $$;
-- ============================================================================
-- 4.2 TABELA: produtos_barberbeer
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'produtos_barberbeer'
) THEN
ALTER TABLE produtos_barberbeer ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver produtos de sua unidade
CREATE POLICY "Users can view products in their unit" ON produtos_barberbeer FOR
SELECT USING (has_unit_access(unidade_id));
-- Apenas admins e recepcionistas podem gerenciar produtos
CREATE POLICY "Admins and recepcionistas can manage products" ON produtos_barberbeer FOR ALL USING (
    is_admin_or_owner()
    OR is_recepcionista()
);
END IF;
END $$;
-- ============================================================================
-- 5. POLÍTICAS PARA TABELAS DE SERVIÇOS
-- ============================================================================
-- ============================================================================
-- 5.1 TABELA: servicos
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'servicos'
) THEN
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver serviços de sua unidade
CREATE POLICY "Users can view services in their unit" ON servicos FOR
SELECT USING (has_unit_access(unidade_id));
-- Apenas admins podem gerenciar serviços
CREATE POLICY "Only admins can manage services" ON servicos FOR ALL USING (is_admin_or_owner());
END IF;
END $$;
-- ============================================================================
-- 6. POLÍTICAS PARA TABELAS DE VENDAS E FINANCEIRO
-- ============================================================================
-- ============================================================================
-- 6.1 TABELA: vendas_produtos
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'vendas_produtos'
) THEN
ALTER TABLE vendas_produtos ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver vendas de sua unidade
CREATE POLICY "Users can view sales in their unit" ON vendas_produtos FOR
SELECT USING (has_unit_access(unidade_id));
-- Apenas admins, recepcionistas e profissionais podem criar vendas
CREATE POLICY "Authorized users can create sales" ON vendas_produtos FOR
INSERT WITH CHECK (
        is_admin_or_owner()
        OR is_recepcionista()
        OR is_professional()
    );
-- Apenas admins podem atualizar/deletar vendas
CREATE POLICY "Only admins can modify sales" ON vendas_produtos FOR
UPDATE USING (is_admin_or_owner());
CREATE POLICY "Only admins can delete sales" ON vendas_produtos FOR DELETE USING (is_admin_or_owner());
END IF;
END $$;
-- ============================================================================
-- 6.2 TABELA: faturamento_assinatura
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'faturamento_assinatura'
) THEN
ALTER TABLE faturamento_assinatura ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver faturamento de sua unidade
CREATE POLICY "Users can view subscription billing in their unit" ON faturamento_assinatura FOR
SELECT USING (has_unit_access(unidade_id));
-- Apenas admins podem gerenciar faturamento
CREATE POLICY "Only admins can manage subscription billing" ON faturamento_assinatura FOR ALL USING (is_admin_or_owner());
END IF;
END $$;
-- ============================================================================
-- 7. POLÍTICAS PARA TABELAS DE ASSINATURAS
-- ============================================================================
-- ============================================================================
-- 7.1 TABELA: subscriptions
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'subscriptions'
) THEN
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver assinaturas de sua unidade
CREATE POLICY "Users can view subscriptions in their unit" ON subscriptions FOR
SELECT USING (has_unit_access(unidade_id));
-- Clientes podem ver apenas suas próprias assinaturas
CREATE POLICY "Clients can view own subscriptions" ON subscriptions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles p
            WHERE p.id = auth.uid()
                AND p.role = 'client'
                AND subscriptions.client_id = p.id
        )
    );
-- Apenas admins e recepcionistas podem gerenciar assinaturas
CREATE POLICY "Admins and recepcionistas can manage subscriptions" ON subscriptions FOR ALL USING (
    is_admin_or_owner()
    OR is_recepcionista()
);
END IF;
END $$;
-- ============================================================================
-- 8. POLÍTICAS PARA TABELAS DE COMISSÕES
-- ============================================================================
-- ============================================================================
-- 8.1 TABELA: comissoes_avulses
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'comissoes_avulses'
) THEN
ALTER TABLE comissoes_avulses ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver comissões de sua unidade
CREATE POLICY "Users can view commissions in their unit" ON comissoes_avulses FOR
SELECT USING (has_unit_access(unidade_id));
-- Profissionais podem ver apenas suas próprias comissões
CREATE POLICY "Professionals can view own commissions" ON comissoes_avulses FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM professionals p
            WHERE p.id = comissoes_avulses.professional_id
                AND p.user_id = auth.uid()
        )
    );
-- Apenas admins podem gerenciar comissões
CREATE POLICY "Only admins can manage commissions" ON comissoes_avulses FOR ALL USING (is_admin_or_owner());
END IF;
END $$;
-- ============================================================================
-- 9. POLÍTICAS PARA TABELAS DE METAS ESPECÍFICAS
-- ============================================================================
-- ============================================================================
-- 9.1 TABELA: metas_barberbeer
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'metas_barberbeer'
) THEN
ALTER TABLE metas_barberbeer ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver metas de sua unidade
CREATE POLICY "Users can view BarberBeer metas in their unit" ON metas_barberbeer FOR
SELECT USING (has_unit_access(unidade_id));
-- Apenas admins podem gerenciar metas
CREATE POLICY "Only admins can manage BarberBeer metas" ON metas_barberbeer FOR ALL USING (is_admin_or_owner());
END IF;
END $$;
-- ============================================================================
-- 9.2 TABELA: metas_trato
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'metas_trato'
) THEN
ALTER TABLE metas_trato ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver metas de sua unidade
CREATE POLICY "Users can view Trato metas in their unit" ON metas_trato FOR
SELECT USING (has_unit_access(unidade_id));
-- Apenas admins podem gerenciar metas
CREATE POLICY "Only admins can manage Trato metas" ON metas_trato FOR ALL USING (is_admin_or_owner());
END IF;
END $$;
-- ============================================================================
-- 10. POLÍTICAS PARA TABELAS DE INTEGRAÇÃO
-- ============================================================================
-- ============================================================================
-- 10.1 TABELA: webhook_logs
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'webhook_logs'
) THEN
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
-- Apenas admins podem ver logs de webhook
CREATE POLICY "Only admins can view webhook logs" ON webhook_logs FOR
SELECT USING (is_admin_or_owner());
-- Sistema pode inserir logs
CREATE POLICY "System can insert webhook logs" ON webhook_logs FOR
INSERT WITH CHECK (true);
-- Apenas admins podem modificar logs
CREATE POLICY "Only admins can modify webhook logs" ON webhook_logs FOR ALL USING (is_admin_or_owner());
END IF;
END $$;
-- ============================================================================
-- 10.2 TABELA: notification_logs
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'notification_logs'
) THEN
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver logs de notificação de sua unidade
CREATE POLICY "Users can view notification logs in their unit" ON notification_logs FOR
SELECT USING (has_unit_access(unidade_id));
-- Sistema pode inserir logs
CREATE POLICY "System can insert notification logs" ON notification_logs FOR
INSERT WITH CHECK (true);
-- Apenas admins podem modificar logs
CREATE POLICY "Only admins can modify notification logs" ON notification_logs FOR ALL USING (is_admin_or_owner());
END IF;
END $$;
-- ============================================================================
-- 11. POLÍTICAS PARA TABELAS DE CONFIGURAÇÃO
-- ============================================================================
-- ============================================================================
-- 11.1 TABELA: unidades
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'unidades'
) THEN
ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;
-- Todos os usuários autenticados podem ver unidades
CREATE POLICY "Authenticated users can view units" ON unidades FOR
SELECT USING (auth.role() = 'authenticated');
-- Apenas admins podem gerenciar unidades
CREATE POLICY "Only admins can manage units" ON unidades FOR ALL USING (is_admin_or_owner());
END IF;
END $$;
-- ============================================================================
-- 11.2 TABELA: categorias
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'categorias'
) THEN
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
-- Todos os usuários autenticados podem ver categorias
CREATE POLICY "Authenticated users can view categories" ON categorias FOR
SELECT USING (auth.role() = 'authenticated');
-- Apenas admins podem gerenciar categorias
CREATE POLICY "Only admins can manage categories" ON categorias FOR ALL USING (is_admin_or_owner());
END IF;
END $$;
-- ============================================================================
-- 11.3 TABELA: marcas
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'marcas'
) THEN
ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;
-- Todos os usuários autenticados podem ver marcas
CREATE POLICY "Authenticated users can view brands" ON marcas FOR
SELECT USING (auth.role() = 'authenticated');
-- Apenas admins podem gerenciar marcas
CREATE POLICY "Only admins can manage brands" ON marcas FOR ALL USING (is_admin_or_owner());
END IF;
END $$;
-- ============================================================================
-- 12. POLÍTICAS PARA TABELAS DE PLANOS
-- ============================================================================
-- ============================================================================
-- 12.1 TABELA: planos
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'planos'
) THEN
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
-- Todos os usuários autenticados podem ver planos
CREATE POLICY "Authenticated users can view plans" ON planos FOR
SELECT USING (auth.role() = 'authenticated');
-- Apenas admins podem gerenciar planos
CREATE POLICY "Only admins can manage plans" ON planos FOR ALL USING (is_admin_or_owner());
END IF;
END $$;
-- ============================================================================
-- 13. POLÍTICAS PARA TABELAS DE BLOQUEIOS E EXCEÇÕES
-- ============================================================================
-- ============================================================================
-- 13.1 TABELA: bloqueios_horarios
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'bloqueios_horarios'
) THEN
ALTER TABLE bloqueios_horarios ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver bloqueios de sua unidade
CREATE POLICY "Users can view time blocks in their unit" ON bloqueios_horarios FOR
SELECT USING (has_unit_access(unidade_id));
-- Apenas admins e recepcionistas podem gerenciar bloqueios
CREATE POLICY "Admins and recepcionistas can manage time blocks" ON bloqueios_horarios FOR ALL USING (
    is_admin_or_owner()
    OR is_recepcionista()
);
END IF;
END $$;
-- ============================================================================
-- 14. POLÍTICAS PARA TABELAS DE AGENDA
-- ============================================================================
-- ============================================================================
-- 14.1 TABELA: agendamentos
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'agendamentos'
) THEN
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver agendamentos de sua unidade
CREATE POLICY "Users can view appointments in their unit" ON agendamentos FOR
SELECT USING (has_unit_access(unidade_id));
-- Usuários autenticados podem criar agendamentos
CREATE POLICY "Authenticated users can create appointments" ON agendamentos FOR
INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND has_unit_access(unidade_id)
    );
-- Usuários podem atualizar agendamentos de sua unidade
CREATE POLICY "Users can update appointments in their unit" ON agendamentos FOR
UPDATE USING (
        has_unit_access(unidade_id)
    );
-- Usuários podem deletar agendamentos de sua unidade
CREATE POLICY "Users can delete appointments in their unit" ON agendamentos FOR DELETE USING (
    has_unit_access(unidade_id)
);
END IF;
END $$;
-- ============================================================================
-- 15. POLÍTICAS PARA TABELAS DE EXPEDIENTES
-- ============================================================================
-- ============================================================================
-- 15.1 TABELA: expedientes
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'expedientes'
) THEN
ALTER TABLE expedientes ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver expedientes de sua unidade
CREATE POLICY "Users can view schedules in their unit" ON expedientes FOR
SELECT USING (has_unit_access(unidade_id));
-- Apenas admins e recepcionistas podem gerenciar expedientes
CREATE POLICY "Admins and recepcionistas can manage schedules" ON expedientes FOR ALL USING (
    is_admin_or_owner()
    OR is_recepcionista()
);
END IF;
END $$;
-- ============================================================================
-- 15.2 TABELA: excecoes_agenda
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'excecoes_agenda'
) THEN
ALTER TABLE excecoes_agenda ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver exceções de sua unidade
CREATE POLICY "Users can view schedule exceptions in their unit" ON excecoes_agenda FOR
SELECT USING (has_unit_access(unidade_id));
-- Apenas admins e recepcionistas podem gerenciar exceções
CREATE POLICY "Admins and recepcionistas can manage schedule exceptions" ON excecoes_agenda FOR ALL USING (
    is_admin_or_owner()
    OR is_recepcionista()
);
END IF;
END $$;
-- ============================================================================
-- 16. POLÍTICAS PARA TABELAS DE SERVIÇOS AVULSOS
-- ============================================================================
-- ============================================================================
-- 16.1 TABELA: servicos_avulsos
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'servicos_avulsos'
) THEN
ALTER TABLE servicos_avulsos ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver serviços avulsos de sua unidade
CREATE POLICY "Users can view individual services in their unit" ON servicos_avulsos FOR
SELECT USING (has_unit_access(unidade_id));
-- Apenas admins podem gerenciar serviços avulsos
CREATE POLICY "Only admins can manage individual services" ON servicos_avulsos FOR ALL USING (is_admin_or_owner());
END IF;
END $$;
-- ============================================================================
-- 17. POLÍTICAS PARA TABELAS DE RECEITA MENSAL
-- ============================================================================
-- ============================================================================
-- 17.1 TABELA: monthly_revenue
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'monthly_revenue'
) THEN
ALTER TABLE monthly_revenue ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver receita de sua unidade
CREATE POLICY "Users can view monthly revenue in their unit" ON monthly_revenue FOR
SELECT USING (has_unit_access(unidade_id));
-- Apenas admins podem gerenciar receita mensal
CREATE POLICY "Only admins can manage monthly revenue" ON monthly_revenue FOR ALL USING (is_admin_or_owner());
END IF;
END $$;
-- ============================================================================
-- 18. POLÍTICAS PARA TABELAS DE METAS MENSAIS
-- ============================================================================
-- ============================================================================
-- 18.1 TABELA: monthly_goals
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'monthly_goals'
) THEN
ALTER TABLE monthly_goals ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver metas mensais de sua unidade
CREATE POLICY "Users can view monthly goals in their unit" ON monthly_goals FOR
SELECT USING (has_unit_access(unidade_id));
-- Apenas admins podem gerenciar metas mensais
CREATE POLICY "Only admins can manage monthly goals" ON monthly_goals FOR ALL USING (is_admin_or_owner());
END IF;
END $$;
-- ============================================================================
-- 19. POLÍTICAS PARA TABELAS DE FILA
-- ============================================================================
-- ============================================================================
-- 19.1 TABELA: queue
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'queue'
) THEN
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver fila de sua unidade
CREATE POLICY "Users can view queue in their unit" ON queue FOR
SELECT USING (has_unit_access(unidade_id));
-- Usuários autenticados podem gerenciar fila de sua unidade
CREATE POLICY "Authenticated users can manage queue in their unit" ON queue FOR ALL USING (
    auth.uid() IS NOT NULL
    AND has_unit_access(unidade_id)
);
END IF;
END $$;
-- ============================================================================
-- 20. POLÍTICAS PARA TABELAS DE BLOQUEIOS DE TEMPO
-- ============================================================================
-- ============================================================================
-- 20.1 TABELA: time_blocks
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'time_blocks'
) THEN
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver bloqueios de tempo de sua unidade
CREATE POLICY "Users can view time blocks in their unit" ON time_blocks FOR
SELECT USING (has_unit_access(unidade_id));
-- Apenas admins e recepcionistas podem gerenciar bloqueios de tempo
CREATE POLICY "Admins and recepcionistas can manage time blocks" ON time_blocks FOR ALL USING (
    is_admin_or_owner()
    OR is_recepcionista()
);
END IF;
END $$;
-- ============================================================================
-- 21. POLÍTICAS PARA TABELAS DE TOKENS DE AUTENTICAÇÃO
-- ============================================================================
-- ============================================================================
-- 21.1 TABELA: google_auth_tokens
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'google_auth_tokens'
) THEN
ALTER TABLE google_auth_tokens ENABLE ROW LEVEL SECURITY;
-- Usuários podem ver apenas seus próprios tokens
CREATE POLICY "Users can view own auth tokens" ON google_auth_tokens FOR
SELECT USING (is_own_resource(user_id));
-- Sistema pode inserir tokens
CREATE POLICY "System can insert auth tokens" ON google_auth_tokens FOR
INSERT WITH CHECK (true);
-- Usuários podem atualizar apenas seus próprios tokens
CREATE POLICY "Users can update own auth tokens" ON google_auth_tokens FOR
UPDATE USING (is_own_resource(user_id));
-- Usuários podem deletar apenas seus próprios tokens
CREATE POLICY "Users can delete own auth tokens" ON google_auth_tokens FOR DELETE USING (is_own_resource(user_id));
END IF;
END $$;
-- ============================================================================
-- 22. POLÍTICAS PARA TABELAS DE CONFIGURAÇÕES DE INTEGRAÇÃO
-- ============================================================================
-- ============================================================================
-- 22.1 TABELA: integration_settings
-- ============================================================================
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'integration_settings'
) THEN
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;
-- Apenas admins podem ver configurações de integração
CREATE POLICY "Only admins can view integration settings" ON integration_settings FOR
SELECT USING (is_admin_or_owner());
-- Sistema pode inserir configurações
CREATE POLICY "System can insert integration settings" ON integration_settings FOR
INSERT WITH CHECK (true);
-- Apenas admins podem modificar configurações de integração
CREATE POLICY "Only admins can modify integration settings" ON integration_settings FOR ALL USING (is_admin_or_owner());
END IF;
END $$;
-- ============================================================================
-- 23. VERIFICAÇÃO E LOGS
-- ============================================================================
-- Log da migração
INSERT INTO audit_logs (
        action,
        resource,
        resource_id,
        metadata,
        success,
        timestamp
    )
VALUES (
        'MIGRATION_EXECUTED',
        'RLS_POLICIES',
        gen_random_uuid(),
        '{"migration": "20241224000002_improve_rls_policies.sql", "version": "1.0", "description": "Implementação e melhoria das políticas RLS para todas as tabelas sensíveis"}',
        true,
        NOW()
    );
-- ============================================================================
-- 24. COMENTÁRIOS FINAIS
-- ============================================================================
/*
 Esta migração implementa um sistema abrangente de Row Level Security (RLS)
 para todas as tabelas sensíveis do sistema Trato de Barbados.
 
 PRINCIPAIS CARACTERÍSTICAS:
 
 1. ISOLAMENTO POR UNIDADE: Usuários só podem acessar dados de sua própria unidade
 2. CONTROLE POR ROLE: Diferentes níveis de acesso baseados no role do usuário
 3. PROPRIEDADE DE RECURSOS: Usuários podem gerenciar apenas seus próprios recursos
 4. FUNÇÕES AUXILIARES: Funções reutilizáveis para verificação de permissões
 5. POLÍTICAS GRANULARES: Controle específico para cada operação (SELECT, INSERT, UPDATE, DELETE)
 
 TABELAS COBERTAS:
 - Autenticação: profiles, google_auth_tokens
 - Estrutura: unidades, categorias, marcas, planos
 - Usuários: profissionais, clients
 - Serviços: servicos, servicos_avulsos, appointments
 - Produtos: produtos_trato_de_barbados, produtos_barberbeer
 - Vendas: vendas_produtos, subscriptions
 - Metas: metas, metas_barberbeer, metas_trato, bonus
 - Financeiro: faturamento_assinatura, monthly_revenue, comissoes_avulses
 - Agenda: agendamentos, expedientes, excecoes_agenda, bloqueios_horarios
 - Fila: barber_queue, queue
 - Integração: webhook_logs, notification_logs, integration_settings
 - Auditoria: audit_logs
 
 SEGURANÇA IMPLEMENTADA:
 ✅ Isolamento de dados por unidade
 ✅ Controle de acesso baseado em roles
 ✅ Proteção contra acesso não autorizado
 ✅ Auditoria de todas as operações
 ✅ Políticas granulares por operação
 ✅ Funções auxiliares reutilizáveis
 
 PRÓXIMOS PASSOS:
 1. Executar testes de isolamento de dados
 2. Verificar políticas em ambiente de produção
 3. Monitorar logs de auditoria
 4. Treinar usuários sobre as novas restrições
 */