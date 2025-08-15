-- Extensões para ranges e performance (motivo: permitir índice por intervalo de tempo e checagem de overlap eficiente)
create extension if not exists btree_gist;
create extension if not exists pgcrypto;
-- Função utilitária para obter a unidade corrente a partir de app.unidade ou claims do JWT
create or replace function public.get_unidade() returns text language sql stable as $$
select coalesce(
        nullif(current_setting('app.unidade', true), ''),
        nullif(
            (
                current_setting('request.jwt.claims', true)::jsonb->>'unidade'
            ),
            ''
        ),
        nullif(
            (
                current_setting('request.jwt.claims', true)::jsonb->>'app_unidade'
            ),
            ''
        )
    );
$$;
-- Tabela de profissionais (motivo: recursos/colunas do calendário por profissional e multiunidade)
alter table if exists public.profissionais
add column if not exists unidade text check (unidade in ('trato', 'barberbeer'));
alter table if exists public.profissionais
add column if not exists cor text;
alter table if exists public.profissionais
add column if not exists ativo boolean not null default true;
alter table if exists public.profissionais
add column if not exists capacidade_concorrente int not null default 1;
create index if not exists idx_profissionais_unidade_ativo on public.profissionais (unidade, ativo);
-- Tabela de agendamentos (motivo: armazenar eventos do calendário com intervalo)
create table if not exists public.agendamentos (
    id uuid primary key default gen_random_uuid(),
    unidade text not null check (unidade in ('trato', 'barberbeer')),
    cliente_id uuid references public.clientes(id),
    profissional_id uuid references public.profissionais(id),
    data_inicio timestamptz not null,
    data_fim timestamptz not null,
    status text not null check (
        status in (
            'agendado',
            'confirmado',
            'atendido',
            'cancelado',
            'no_show',
            'bloqueado'
        )
    ),
    origem text check (origem in ('online', 'presencial', 'interno')) default 'interno',
    titulo text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_agenda_prof_intervalo on public.agendamentos using gist (
    profissional_id,
    tstzrange(data_inicio, data_fim, '[)')
);
create index if not exists idx_agenda_status on public.agendamentos (status);
create index if not exists idx_agenda_unidade_data on public.agendamentos (unidade, data_inicio);
-- Trigger updated_at (motivo: manter atualização automática)
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now();
return new;
end $$;
drop trigger if exists trg_agenda_touch on public.agendamentos;
create trigger trg_agenda_touch before
update on public.agendamentos for each row execute function public.touch_updated_at();
-- RLS (motivo: isolar dados por unidade)
alter table public.agendamentos enable row level security;
drop policy if exists "ag_select" on public.agendamentos;
create policy "ag_select" on public.agendamentos for
select using (unidade = public.get_unidade());
drop policy if exists "ag_mod" on public.agendamentos;
create policy "ag_mod" on public.agendamentos for all using (unidade = public.get_unidade()) with check (unidade = public.get_unidade());
-- View opcional para listagem (motivo: acelerar resposta agregando join de cliente)
create or replace view public.vw_agenda_diaria as
select a.*,
    c.nome as cliente_nome,
    c.telefone_e164 as cliente_telefone
from public.agendamentos a
    left join public.clientes c on c.id = a.cliente_id;
-- Ajustes adicionais: default de status, validação temporal e índice por cliente
alter table if exists public.agendamentos
alter column status
set default 'agendado';
do $$ begin if not exists (
    select 1
    from pg_constraint
    where conname = 'ag_data_valida'
        and conrelid = 'public.agendamentos'::regclass
) then
alter table public.agendamentos
add constraint ag_data_valida check (data_fim > data_inicio);
end if;
end $$;
create index if not exists idx_agenda_cliente on public.agendamentos (cliente_id);
-- Função/trigger de validação: capacidade, expediente e exceções
create or replace function public.fn_valida_agendamento() returns trigger language plpgsql as $$
declare capacidade_concorrente_profissional int;
total_concorrentes int;
dow_agendamento int;
begin -- Ignora validações para cancelado/no_show
if coalesce(NEW.status, 'agendado') in ('cancelado', 'no_show') then return NEW;
end if;
-- Impedir atravessar dias
if date_trunc('day', NEW.data_inicio) <> date_trunc('day', NEW.data_fim) then raise exception 'Agendamento não pode atravessar dias (%% → %%)',
NEW.data_inicio,
NEW.data_fim;
end if;
-- Verificar capacidade concorrente do profissional
select p.capacidade_concorrente into capacidade_concorrente_profissional
from public.profissionais p
where p.id = NEW.profissional_id for
update;
if capacidade_concorrente_profissional is null then raise exception 'Profissional % não encontrado',
NEW.profissional_id;
end if;
select count(*) into total_concorrentes
from public.agendamentos a
where a.profissional_id = NEW.profissional_id
    and a.id is distinct
from coalesce(
        NEW.id,
        '00000000-0000-0000-0000-000000000000'::uuid
    )
    and a.status not in ('cancelado', 'no_show')
    and tstzrange(a.data_inicio, a.data_fim, '[)') && tstzrange(NEW.data_inicio, NEW.data_fim, '[)');
if total_concorrentes >= capacidade_concorrente_profissional then raise exception 'Capacidade excedida para o profissional % no intervalo % - % (capacidade %)',
NEW.profissional_id,
NEW.data_inicio,
NEW.data_fim,
capacidade_concorrente_profissional;
end if;
-- Verificar cobertura por expediente do profissional (se tabela existir)
if to_regclass('public.expedientes') is not null then dow_agendamento := extract(
    dow
    from NEW.data_inicio
);
if not exists (
    select 1
    from public.expedientes e
    where e.profissional_id = NEW.profissional_id
        and e.unidade = NEW.unidade
        and e.ativo
        and e.dia_semana = dow_agendamento
        and NEW.data_inicio::time >= e.hora_inicio
        and NEW.data_fim::time <= e.hora_fim
) then raise exception 'Fora do expediente do profissional % em % (%% → %%)',
NEW.profissional_id,
dow_agendamento,
NEW.data_inicio,
NEW.data_fim;
end if;
end if;
-- Verificar exceções/bloqueios do profissional (se tabela existir)
if to_regclass('public.excecoes_agenda') is not null then if exists (
    select 1
    from public.excecoes_agenda x
    where x.profissional_id = NEW.profissional_id
        and x.unidade = NEW.unidade
        and tstzrange(x.data_inicio, x.data_fim, '[)') && tstzrange(NEW.data_inicio, NEW.data_fim, '[)')
        and x.tipo in ('bloqueio', 'ferias', 'folga')
) then raise exception 'Intervalo indisponível por exceção/bloqueio para o profissional % (%% → %%)',
NEW.profissional_id,
NEW.data_inicio,
NEW.data_fim;
end if;
end if;
return NEW;
end;
$$;
drop trigger if exists trg_agenda_validacao on public.agendamentos;
create trigger trg_agenda_validacao before
insert
    or
update of profissional_id,
    data_inicio,
    data_fim,
    status,
    unidade on public.agendamentos for each row execute function public.fn_valida_agendamento();
-- RLS também em profissionais (mesmo escopo de unidade)
alter table if exists public.profissionais enable row level security;
drop policy if exists "prof_select" on public.profissionais;
create policy "prof_select" on public.profissionais for
select using (unidade = public.get_unidade());
drop policy if exists "prof_mod" on public.profissionais;
create policy "prof_mod" on public.profissionais for all using (unidade = public.get_unidade()) with check (unidade = public.get_unidade());
-- Tabela de expedientes (horário de trabalho)
create table if not exists public.expedientes (
    id uuid primary key default gen_random_uuid(),
    unidade text not null check (unidade in ('trato', 'barberbeer')),
    profissional_id uuid not null references public.profissionais(id) on delete cascade,
    dia_semana int not null check (
        dia_semana between 0 and 6
    ),
    hora_inicio time not null,
    hora_fim time not null,
    ativo boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint xp_horas_validas check (hora_fim > hora_inicio)
);
create index if not exists idx_exp_prof_dia on public.expedientes (profissional_id, dia_semana, ativo);
create index if not exists idx_exp_unidade on public.expedientes (unidade);
drop trigger if exists trg_exp_touch on public.expedientes;
create trigger trg_exp_touch before
update on public.expedientes for each row execute function public.touch_updated_at();
alter table public.expedientes enable row level security;
drop policy if exists "exp_select" on public.expedientes;
create policy "exp_select" on public.expedientes for
select using (unidade = public.get_unidade());
drop policy if exists "exp_mod" on public.expedientes;
create policy "exp_mod" on public.expedientes for all using (unidade = public.get_unidade()) with check (unidade = public.get_unidade());
-- Tabela de exceções de agenda (bloqueios, férias, folgas, etc.)
create table if not exists public.excecoes_agenda (
    id uuid primary key default gen_random_uuid(),
    unidade text not null check (unidade in ('trato', 'barberbeer')),
    profissional_id uuid not null references public.profissionais(id) on delete cascade,
    data_inicio timestamptz not null,
    data_fim timestamptz not null,
    tipo text not null check (tipo in ('bloqueio', 'ferias', 'folga', 'outro')),
    motivo text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
do $$ begin if not exists (
    select 1
    from pg_constraint
    where conname = 'ex_data_valida'
        and conrelid = 'public.excecoes_agenda'::regclass
) then
alter table public.excecoes_agenda
add constraint ex_data_valida check (data_fim > data_inicio);
end if;
end $$;
create index if not exists idx_exc_prof_intervalo on public.excecoes_agenda using gist (
    profissional_id,
    tstzrange(data_inicio, data_fim, '[)')
);
create index if not exists idx_exc_unidade on public.excecoes_agenda (unidade);
drop trigger if exists trg_exc_touch on public.excecoes_agenda;
create trigger trg_exc_touch before
update on public.excecoes_agenda for each row execute function public.touch_updated_at();
alter table public.excecoes_agenda enable row level security;
drop policy if exists "exc_select" on public.excecoes_agenda;
create policy "exc_select" on public.excecoes_agenda for
select using (unidade = public.get_unidade());
drop policy if exists "exc_mod" on public.excecoes_agenda;
create policy "exc_mod" on public.excecoes_agenda for all using (unidade = public.get_unidade()) with check (unidade = public.get_unidade());
-- RPCs úteis
-- Criar agendamento (retorna a linha criada)
create or replace function public.criar_agendamento(
        p_cliente_id uuid,
        p_profissional_id uuid,
        p_data_inicio timestamptz,
        p_data_fim timestamptz,
        p_titulo text default null,
        p_origem text default 'interno',
        p_status text default 'agendado'
    ) returns public.agendamentos language plpgsql security definer
set search_path = public as $$
declare v_unidade text;
v_row public.agendamentos;
begin v_unidade := public.get_unidade();
if v_unidade is null then raise exception 'Unidade não definida no contexto';
end if;
insert into public.agendamentos (
        unidade,
        cliente_id,
        profissional_id,
        data_inicio,
        data_fim,
        status,
        origem,
        titulo
    )
values (
        v_unidade,
        p_cliente_id,
        p_profissional_id,
        p_data_inicio,
        p_data_fim,
        coalesce(p_status, 'agendado'),
        coalesce(p_origem, 'interno'),
        p_titulo
    )
returning * into v_row;
return v_row;
end;
$$;
-- Cancelar agendamento (retorna a linha atualizada)
create or replace function public.cancelar_agendamento(p_agendamento_id uuid) returns public.agendamentos language plpgsql security definer
set search_path = public as $$
declare v_row public.agendamentos;
begin
update public.agendamentos
set status = 'cancelado'
where id = p_agendamento_id
    and unidade = public.get_unidade()
returning * into v_row;
if not found then raise exception 'Agendamento não encontrado ou você não tem permissão';
end if;
return v_row;
end;
$$;
-- Listar agenda diária (por profissional e dia)
create or replace function public.listar_agenda_diaria(p_profissional_id uuid, p_dia date) returns setof public.vw_agenda_diaria language sql stable as $$
select v.*
from public.vw_agenda_diaria v
where v.unidade = public.get_unidade()
    and v.profissional_id = p_profissional_id
    and v.data_inicio >= p_dia::timestamptz
    and v.data_inicio < (p_dia + 1)::timestamptz
order by v.data_inicio;
$$;