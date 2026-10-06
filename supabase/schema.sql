-- 42nd Street dashboard: Supabase schema
-- Run this once in the Supabase SQL editor of a TEST project first, then review before production.
-- Status: written for the adapter in src/adapters/supabase.js; not yet exercised against a live project.
--
-- Model: every record is a JSON "document" at a slash separated path (for example clients/abc123 or
-- clients/abc123/data/gsc_daily-0), scoped to an organization. Row level security limits every read and
-- write to members of that organization, and keeps data/users/<uid>/... private to that user.

create extension if not exists pgcrypto;

create table if not exists public.orgs (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  org_id     uuid not null references public.orgs(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'member' check (role in ('owner','admin','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table if not exists public.documents (
  org_id     uuid not null references public.orgs(id) on delete cascade,
  path       text not null,
  parent     text not null,
  data       jsonb not null,
  updated_by uuid default auth.uid(),
  updated_at timestamptz not null default now(),
  primary key (org_id, path),
  check (parent = regexp_replace(path, '/[^/]+$', '')),
  check (octet_length(data::text) <= 262144)
);
create index if not exists documents_parent_idx on public.documents (org_id, parent);

alter table public.orgs      enable row level security;
alter table public.members   enable row level security;
alter table public.documents enable row level security;

-- Role lookup used by the policies (security definer so the policies do not recurse into members).
create or replace function public.org_role(o uuid) returns text
language sql stable security definer set search_path = public as $$
  select role from public.members where org_id = o and user_id = auth.uid()
$$;

-- orgs and members
drop policy if exists orgs_select on public.orgs;
create policy orgs_select on public.orgs for select using (public.org_role(id) is not null);

drop policy if exists members_select on public.members;
create policy members_select on public.members for select using (user_id = auth.uid() or public.org_role(org_id) in ('owner','admin'));

drop policy if exists members_insert on public.members;
create policy members_insert on public.members for insert with check (public.org_role(org_id) = 'owner');

drop policy if exists members_delete on public.members;
create policy members_delete on public.members for delete using (public.org_role(org_id) = 'owner' or user_id = auth.uid());

-- documents: viewers read, members/admins/owners write, data/users/<uid>/ is private to that user
drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents for select using (
  public.org_role(org_id) is not null
  and (path not like 'data/users/%' or path like 'data/users/' || auth.uid()::text || '/%')
);

drop policy if exists documents_insert on public.documents;
create policy documents_insert on public.documents for insert with check (
  public.org_role(org_id) in ('owner','admin','member')
  and (path not like 'data/users/%' or path like 'data/users/' || auth.uid()::text || '/%')
);

drop policy if exists documents_update on public.documents;
create policy documents_update on public.documents for update
  using (
    public.org_role(org_id) in ('owner','admin','member')
    and (path not like 'data/users/%' or path like 'data/users/' || auth.uid()::text || '/%')
  )
  with check (
    public.org_role(org_id) in ('owner','admin','member')
    and (path not like 'data/users/%' or path like 'data/users/' || auth.uid()::text || '/%')
  );

drop policy if exists documents_delete on public.documents;
create policy documents_delete on public.documents for delete using (
  public.org_role(org_id) in ('owner','admin','member')
  and (path not like 'data/users/%' or path like 'data/users/' || auth.uid()::text || '/%')
);

-- First sign-in: create an organization and make the caller its owner (idempotent).
create or replace function public.bootstrap_org(org_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare o uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select org_id into o from public.members where user_id = auth.uid() limit 1;
  if o is not null then return o; end if;
  insert into public.orgs (name) values (coalesce(nullif(trim(org_name), ''), 'My agency')) returning id into o;
  insert into public.members (org_id, user_id, role) values (o, auth.uid(), 'owner');
  return o;
end $$;
revoke all on function public.bootstrap_org(text) from public;
grant execute on function public.bootstrap_org(text) to authenticated;

-- Realtime: lets the dashboard update live when a teammate saves.
alter publication supabase_realtime add table public.documents;

-- Inviting teammates (until there is an invite screen): after they have signed in once, add them from the
-- SQL editor, e.g.
--   insert into public.members (org_id, user_id, role)
--   select '<org id>', id, 'member' from auth.users where email = 'teammate@example.com';

-- ============================================================================
-- Live data connections (used by the edge functions in supabase/functions)
-- ============================================================================
-- connections: one row per client and source. Safe metadata only, readable by members.
-- connection_secrets: encrypted refresh tokens and API keys. RLS is enabled with NO policies, so only the
-- service role (the edge functions) can read or write it. The browser can never read a token.

create table if not exists public.connections (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.orgs(id) on delete cascade,
  client_id     text not null,
  provider      text not null check (provider in ('gsc','ga4','gbp','gads','bing')),
  account_label text,
  status        text not null default 'connected' check (status in ('connected','needs_reconnect','error')),
  last_sync_at  timestamptz,
  last_error    text,
  created_by    uuid,
  created_at    timestamptz not null default now(),
  unique (org_id, client_id, provider)
);

create table if not exists public.connection_secrets (
  connection_id uuid primary key references public.connections(id) on delete cascade,
  secret_enc    text not null,
  updated_at    timestamptz not null default now()
);

alter table public.connections        enable row level security;
alter table public.connection_secrets enable row level security;

drop policy if exists connections_select on public.connections;
create policy connections_select on public.connections for select using (public.org_role(org_id) is not null);
-- No insert, update or delete policies on connections, and no policies at all on connection_secrets:
-- only the edge functions (service role) change them.

alter publication supabase_realtime add table public.connections;
