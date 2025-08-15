-- Funções RPC e políticas para permitir que o profissional registre atendimento e passe a vez
-- e para reorganizar a fila de forma segura via SECURITY DEFINER
-- Reorganiza a fila considerando: ativos primeiro, menor total_services primeiro,
-- menor passou_vez depois, e por fim a posição atual para desempate
CREATE OR REPLACE FUNCTION public.reorganizar_fila() RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE rec RECORD;
pos INTEGER := 1;
BEGIN -- Atualiza a posição na fila para barbeiros ativos com a ordenação definida
FOR rec IN
SELECT bq.id
FROM barber_queue bq
    JOIN profissionais p ON p.id = bq.profissional_id
WHERE bq.is_active = TRUE
    AND p.funcao = 'barbeiro'
ORDER BY bq.is_active DESC,
    bq.total_services ASC,
    COALESCE(bq.passou_vez, 0) ASC,
    bq.queue_position ASC LOOP
UPDATE barber_queue
SET queue_position = pos
WHERE id = rec.id;
pos := pos + 1;
END LOOP;
END;
$$;
-- Profissional registra um atendimento (+1) em daily/total e atualiza last_service_date
CREATE OR REPLACE FUNCTION public.barber_queue_attend() RETURNS TABLE(
        profissional_id uuid,
        queue_position int,
        daily_services int,
        total_services int,
        passou_vez int,
        is_active boolean
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_prof_id uuid;
BEGIN -- Resolve o profissional a partir do usuário autenticado
SELECT id INTO v_prof_id
FROM profissionais
WHERE user_id = auth.uid();
IF v_prof_id IS NULL THEN RAISE EXCEPTION 'Profissional não encontrado para o usuário autenticado';
END IF;
-- Incrementa contadores do próprio registro na fila
UPDATE barber_queue
SET daily_services = COALESCE(daily_services, 0) + 1,
    total_services = COALESCE(total_services, 0) + 1,
    last_service_date = CURRENT_DATE
WHERE profissional_id = v_prof_id
RETURNING profissional_id,
    queue_position,
    daily_services,
    total_services,
    COALESCE(passou_vez, 0) AS passou_vez,
    is_active INTO profissional_id,
    queue_position,
    daily_services,
    total_services,
    passou_vez,
    is_active;
-- Reorganiza a fila após o atendimento
PERFORM public.reorganizar_fila();
-- Retorna o estado atualizado do próprio registro na fila
RETURN QUERY
SELECT bq.profissional_id,
    bq.queue_position,
    bq.daily_services,
    bq.total_services,
    COALESCE(bq.passou_vez, 0) AS passou_vez,
    bq.is_active
FROM barber_queue bq
WHERE bq.profissional_id = v_prof_id;
END;
$$;
-- Profissional passa a vez: incrementa passou_vez além de daily/total
CREATE OR REPLACE FUNCTION public.barber_queue_pass_turn() RETURNS TABLE(
        profissional_id uuid,
        queue_position int,
        daily_services int,
        total_services int,
        passou_vez int,
        is_active boolean
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_prof_id uuid;
BEGIN -- Resolve o profissional a partir do usuário autenticado
SELECT id INTO v_prof_id
FROM profissionais
WHERE user_id = auth.uid();
IF v_prof_id IS NULL THEN RAISE EXCEPTION 'Profissional não encontrado para o usuário autenticado';
END IF;
-- Incrementa contadores do próprio registro na fila
UPDATE barber_queue
SET daily_services = COALESCE(daily_services, 0) + 1,
    total_services = COALESCE(total_services, 0) + 1,
    passou_vez = COALESCE(passou_vez, 0) + 1
WHERE profissional_id = v_prof_id
RETURNING profissional_id,
    queue_position,
    daily_services,
    total_services,
    COALESCE(passou_vez, 0) AS passou_vez,
    is_active INTO profissional_id,
    queue_position,
    daily_services,
    total_services,
    passou_vez,
    is_active;
-- Reorganiza a fila após passar a vez
PERFORM public.reorganizar_fila();
-- Retorna o estado atualizado do próprio registro na fila
RETURN QUERY
SELECT bq.profissional_id,
    bq.queue_position,
    bq.daily_services,
    bq.total_services,
    COALESCE(bq.passou_vez, 0) AS passou_vez,
    bq.is_active
FROM barber_queue bq
WHERE bq.profissional_id = v_prof_id;
END;
$$;
-- Política adicional: permitir que o próprio profissional atualize apenas seu registro na fila
-- (Mantemos a política de admins para ALL; esta permite UPDATE para o próprio registro)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename = 'barber_queue'
        AND policyname = 'Profissional pode atualizar sua própria linha da fila'
) THEN CREATE POLICY "Profissional pode atualizar sua própria linha da fila" ON barber_queue FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM profissionais p
            WHERE p.id = barber_queue.profissional_id
                AND p.user_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profissionais p
            WHERE p.id = barber_queue.profissional_id
                AND p.user_id = auth.uid()
        )
    );
END IF;
END $$;
