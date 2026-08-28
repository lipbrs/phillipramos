-- PubliProva — schema de produção (Supabase / Postgres)
-- Rodar no SQL Editor do Supabase. Idempotente.

create extension if not exists "pgcrypto";

create table if not exists agencies (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid references auth.users(id) on delete cascade,
  name         text not null,
  color        text not null default '#4f46e5',
  logo_url     text,
  plan         text not null default 'free',
  created_at   timestamptz not null default now()
);

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
alter table nudges      enable row level security;

drop policy if exists "dono lê a própria agência" on agencies;
create policy "dono lê a própria agência" on agencies
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "dono lê as próprias campanhas" on campaigns;
create policy "dono lê as próprias campanhas" on campaigns
  for all using (agency_id in (select id from agencies where owner_id = auth.uid()));

drop policy if exists "dono lê os próprios creators" on creators;
create policy "dono lê os próprios creators" on creators
  for all using (campaign_id in (
    select c.id from campaigns c join agencies a on a.id = c.agency_id
    where a.owner_id = auth.uid()));

drop policy if exists "dono lê as próprias submissões" on submissions;
create policy "dono lê as próprias submissões" on submissions
  for all using (creator_id in (
    select cr.id from creators cr
    join campaigns c on c.id = cr.campaign_id
    join agencies a on a.id = c.agency_id
    where a.owner_id = auth.uid()));

-- Storage dos prints: bucket privado, servido por URL assinada.
insert into storage.buckets (id, name, public)
values ('prints', 'prints', false)
on conflict (id) do nothing;

-- LGPD: retenção. Apaga prints e submissões de campanhas encerradas há mais de 180 dias.
-- Agendar com pg_cron:
--   select cron.schedule('retencao-publiprova', '0 4 * * *', $$select purge_old_campaigns()$$);
create or replace function purge_old_campaigns() returns void language sql as $$
  delete from campaigns where proof_deadline < current_date - interval '180 days';
$$;
