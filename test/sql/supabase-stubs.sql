-- Stubs mínimos do Supabase para rodar migrations + testes de integração
-- contra um Postgres cru (CI e dev local). NÃO aplicar em ambiente Supabase:
-- lá o schema `auth` e as funções já existem, e sobrescrevê-las quebra auth.
--
-- Uso:
--   psql "$DATABASE_URL" -f test/sql/supabase-stubs.sql

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Sem JWT no teste, `auth.uid()` devolve null — o que basta, porque a
-- autorização exercitada nos testes é a da camada de aplicação (Drizzle),
-- não a das policies.
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
$$;
