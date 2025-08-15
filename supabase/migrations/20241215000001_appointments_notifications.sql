-- Criar tabela de agendamentos
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        barbeiro_id UUID REFERENCES public.professionals(id) ON DELETE
    SET NULL,
        unidade_id UUID NOT NULL,
        start_at TIMESTAMPTZ NOT NULL,
        end_at TIMESTAMPTZ NOT NULL,
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
        servicos JSONB DEFAULT '[]'::jsonb,
        observacoes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Índices para appointments
CREATE INDEX IF NOT EXISTS idx_appointments_barbeiro_id ON public.appointments(barbeiro_id);
CREATE INDEX IF NOT EXISTS idx_appointments_cliente_id ON public.appointments(cliente_id);
CREATE INDEX IF NOT EXISTS idx_appointments_unidade_id ON public.appointments(unidade_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_at ON public.appointments(start_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_barbeiro_start ON public.appointments(barbeiro_id, start_at);
-- RLS para appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sel_appointments_all ON public.appointments;
CREATE POLICY sel_appointments_all ON public.appointments FOR
SELECT USING (true);
DROP POLICY IF EXISTS ins_appointments_auth ON public.appointments;
CREATE POLICY ins_appointments_auth ON public.appointments FOR
INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS upd_appointments_auth ON public.appointments;
CREATE POLICY upd_appointments_auth ON public.appointments FOR
UPDATE USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS del_appointments_auth ON public.appointments;
CREATE POLICY del_appointments_auth ON public.appointments FOR DELETE USING (auth.uid() IS NOT NULL);
-- Criar tabela de fila de notificações
CREATE TABLE IF NOT EXISTS public.notifications_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'sms', 'email', 'push')),
    send_at TIMESTAMPTZ NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'sent', 'failed', 'cancelled')
    ),
    tries INTEGER DEFAULT 0,
    last_error TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Índices para notifications_queue
CREATE INDEX IF NOT EXISTS idx_notifications_appointment_id ON public.notifications_queue(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_send_at ON public.notifications_queue(send_at);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications_queue(status);
CREATE INDEX IF NOT EXISTS idx_notifications_pending ON public.notifications_queue(send_at, status)
WHERE status = 'pending';
-- RLS para notifications_queue
ALTER TABLE public.notifications_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sel_notifications_auth ON public.notifications_queue;
CREATE POLICY sel_notifications_auth ON public.notifications_queue FOR
SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS ins_notifications_auth ON public.notifications_queue;
CREATE POLICY ins_notifications_auth ON public.notifications_queue FOR
INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS upd_notifications_auth ON public.notifications_queue;
CREATE POLICY upd_notifications_auth ON public.notifications_queue FOR
UPDATE USING (auth.uid() IS NOT NULL);
-- Função para criar notificações de agendamento
CREATE OR REPLACE FUNCTION schedule_appointment_notifications(
        p_appointment_id UUID,
        p_channel TEXT DEFAULT 'whatsapp'
    ) RETURNS VOID AS $$
DECLARE v_appointment RECORD;
BEGIN -- Buscar dados do agendamento
SELECT * INTO v_appointment
FROM public.appointments
WHERE id = p_appointment_id;
IF NOT FOUND THEN RAISE EXCEPTION 'Agendamento não encontrado';
END IF;
-- Cancelar notificações existentes
UPDATE public.notifications_queue
SET status = 'cancelled'
WHERE appointment_id = p_appointment_id
    AND status = 'pending';
-- Criar notificação de 24h antes
IF v_appointment.start_at > NOW() + INTERVAL '24 hours' THEN
INSERT INTO public.notifications_queue (appointment_id, channel, send_at, payload)
VALUES (
        p_appointment_id,
        p_channel,
        v_appointment.start_at - INTERVAL '24 hours',
        jsonb_build_object(
            'type',
            '24h_reminder',
            'appointment_id',
            p_appointment_id,
            'start_at',
            v_appointment.start_at
        )
    );
END IF;
-- Criar notificação de 1h antes
IF v_appointment.start_at > NOW() + INTERVAL '1 hour' THEN
INSERT INTO public.notifications_queue (appointment_id, channel, send_at, payload)
VALUES (
        p_appointment_id,
        p_channel,
        v_appointment.start_at - INTERVAL '1 hour',
        jsonb_build_object(
            'type',
            '1h_reminder',
            'appointment_id',
            p_appointment_id,
            'start_at',
            v_appointment.start_at
        )
    );
END IF;
-- Criar notificação de 15min antes
IF v_appointment.start_at > NOW() + INTERVAL '15 minutes' THEN
INSERT INTO public.notifications_queue (appointment_id, channel, send_at, payload)
VALUES (
        p_appointment_id,
        p_channel,
        v_appointment.start_at - INTERVAL '15 minutes',
        jsonb_build_object(
            'type',
            '15min_reminder',
            'appointment_id',
            p_appointment_id,
            'start_at',
            v_appointment.start_at
        )
    );
END IF;
END;
$$ LANGUAGE plpgsql;
-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_appointments_updated_at BEFORE
UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_queue_updated_at BEFORE
UPDATE ON public.notifications_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();