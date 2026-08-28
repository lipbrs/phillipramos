-- PubliProva — schema de produção (Supabase / Postgres)
-- Rodar no SQL Editor do Supabase. Idempotente.

create extension if not exists "pgcrypto";

create table if not exists agencies (
  id           uuid primary key default gen_random_uuid(),
  email        text not null unique,
  name         text not null,
  color        text not null default '#4f46e5',
  logo_url     text,
  plan         text not null default 'free',
  created_at   timestamptz not null default now()
);

-- Login por link mágico (sem senha): token de uso único com validade curta.
create table if not exists login_tokens (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  token      text not null unique,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists login_tokens_email_idx on login_tokens(email);

create table if not exists sessions (
  token      text primary key,
  agency_id  uuid not null references agencies(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_agency_idx on sessions(agency_id);

create table if not exists campaigns (
  id             uuid primary key default gen_random_uuid(),
  agency_id      uuid references agencies(id) on delete cascade,
  slug           text not null unique,
  agency_name    text not null,
  agency_color   text not null default '#4f46e5',
  client         text not null,
  brand          text not null,
  briefing       text default '',
  post_deadline  date not null,
  proof_deadline date not null,
  created_at     timestamptz not null default now()
);
create index if not exists campaigns_agency_idx on campaigns(agency_id);

create table if not exists creators (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references campaigns(id) on delete cascade,
  name         text not null,
  handle       text default '',
  email        text default '',
  whatsapp     text default '',
  deliverables text default '1 post',
  fee          numeric(12,2) not null default 0,
  token        text not null unique,
  created_at   timestamptz not null default now()
);
create index if not exists creators_campaign_idx on creators(campaign_id);

create table if not exists submissions (
  id              uuid primary key default gen_random_uuid(),
  creator_id      uuid not null unique references creators(id) on delete cascade,
  post_url        text not null,
  screenshot_url  text,
  metrics         jsonb not null default '{}'::jsonb,
  extracted_by_ai boolean not null default false,
  submitted_at    timestamptz not null default now()
);

create table if not exists nudges (
  id         uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators(id) on delete cascade,
  kind       text not null,
  sent_at    timestamptz not null default now(),
  unique (creator_id, kind)          -- garante idempotência da régua
);

-- ------------------------------------------------------------------
-- RLS: nada é público por padrão.
-- O app server-side usa a service_role key (ignora RLS) e faz o
-- escopo por agência na aplicação. As policies abaixo protegem o
-- acesso direto via anon key (ex.: futuro app do cliente).
-- ------------------------------------------------------------------
alter table agencies    enable row level security;
alter table campaigns   enable row level security;
alter table creators    enable row level security;
alter table submissions enable row level security;
alter table nudges       enable row level security;
alter table login_tokens enable row level security;
alter table sessions     enable row level security;

-- Nenhuma política pública: todo acesso passa pelo servidor da aplicação
-- (service_role), que escopa cada consulta pela agência da sessão. A anon
-- key não lê nada. Se um dia houver acesso client-side, criar políticas
-- explícitas aqui — nunca desligar o RLS.

-- Storage dos prints: bucket privado, servido por URL assinada.
insert into storage.buckets (id, name, public)
values ('prints', 'prints', false)
on conflict (id) do nothing;

-- LGPD: retenção. Apaga prints e submissões de campanhas encerradas há mais de 180 dias.
-- Agendar com pg_cron:
--   select cron.schedule('retencao-publiprova', '0 4 * * *', $$select purge_old_campaigns()$$);
create or replace function purge_old_campaigns() returns void language sql as $$
  delete from campaigns where proof_deadline < current_date - interval '180 days';
  delete from login_tokens where expires_at < now() - interval '1 day';
  delete from sessions where expires_at < now();
$$;
