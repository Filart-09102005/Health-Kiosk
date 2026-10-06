-- Health Kiosk Supabase schema (PostgreSQL)
--
-- Run this file in the Supabase SQL Editor for the project configured in .env.
-- This is intentionally separate from DATABASE.sql, which is a MySQL backup for
-- the local Laravel/XAMPP database and is not valid PostgreSQL.
--
-- The script is repeatable. It creates or upgrades the three cloud tables used
-- by the kiosk and companion app, then installs constraints, indexes, grants,
-- and Row Level Security policies. If duplicate/orphaned legacy data prevents a
-- constraint from being added, the transaction fails instead of silently
-- leaving a partly configured schema.

begin;

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- User profiles. Passwords belong only in Supabase Auth (auth.users); no
-- password or password hash is stored in this public profile table.
-- ---------------------------------------------------------------------------
create table if not exists public.users (
    id uuid primary key default gen_random_uuid(),
    local_user_id bigint not null,
    auth_user_id uuid,
    firstname text not null,
    lastname text not null,
    student_id text,
    email text not null,
    role text not null default 'student',
    department text,
    grade_level text,
    strand text,
    year_level text,
    program text,
    age integer,
    gender text,
    barcode text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.users add column if not exists id uuid default gen_random_uuid();
alter table public.users add column if not exists local_user_id bigint;
alter table public.users add column if not exists auth_user_id uuid;
alter table public.users add column if not exists firstname text;
alter table public.users add column if not exists lastname text;
alter table public.users add column if not exists student_id text;
alter table public.users add column if not exists email text;
alter table public.users add column if not exists role text default 'student';
alter table public.users add column if not exists department text;
alter table public.users add column if not exists grade_level text;
alter table public.users add column if not exists strand text;
alter table public.users add column if not exists year_level text;
alter table public.users add column if not exists program text;
alter table public.users add column if not exists age integer;
alter table public.users add column if not exists gender text;
alter table public.users add column if not exists barcode text;
alter table public.users add column if not exists is_active boolean default true;
alter table public.users add column if not exists created_at timestamptz default now();
alter table public.users add column if not exists updated_at timestamptz default now();

-- Remove the legacy copied bcrypt hash. Supabase Auth is the only password
-- store, and the Laravel sync no longer sends this field.
alter table public.users drop column if exists password;

update public.users set id = gen_random_uuid() where id is null;
update public.users set role = 'student' where role is null;
update public.users set is_active = true where is_active is null;
update public.users set created_at = now() where created_at is null;
update public.users set updated_at = created_at where updated_at is null;

alter table public.users alter column id set default gen_random_uuid();
alter table public.users alter column id set not null;
alter table public.users alter column local_user_id set not null;
alter table public.users alter column firstname set not null;
alter table public.users alter column lastname set not null;
alter table public.users alter column email set not null;
alter table public.users alter column role set default 'student';
alter table public.users alter column role set not null;
alter table public.users alter column is_active set default true;
alter table public.users alter column is_active set not null;
alter table public.users alter column created_at set default now();
alter table public.users alter column created_at set not null;
alter table public.users alter column updated_at set default now();
alter table public.users alter column updated_at set not null;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.users'::regclass and contype = 'p'
    ) then
        alter table public.users add constraint users_pkey primary key (id);
    end if;
end
$$;

create unique index if not exists users_local_user_id_key
    on public.users (local_user_id);
create unique index if not exists users_auth_user_id_key
    on public.users (auth_user_id) where auth_user_id is not null;
create unique index if not exists users_email_lower_key
    on public.users (lower(email));
create unique index if not exists users_student_id_key
    on public.users (student_id) where student_id is not null;
create unique index if not exists users_barcode_key
    on public.users (barcode) where barcode is not null;
create index if not exists users_role_department_idx
    on public.users (role, department);

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.users'::regclass
          and conname = 'users_auth_user_id_fkey'
    ) then
        alter table public.users
            add constraint users_auth_user_id_fkey
            foreign key (auth_user_id) references auth.users (id)
            on update cascade on delete cascade;
    end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Health measurements uploaded from completed or partial kiosk sessions.
-- ---------------------------------------------------------------------------
create table if not exists public.health_records (
    id uuid primary key default gen_random_uuid(),
    local_health_record_id bigint not null,
    local_user_id bigint not null,
    auth_user_id uuid not null,
    local_kiosk_session_id bigint,
    session_number text,
    session_status text,
    heart_rate numeric,
    spo2 numeric,
    temperature numeric,
    height numeric,
    weight numeric,
    bmi numeric,
    bmi_category text,
    health_status text,
    measurement_statuses jsonb not null default '{}'::jsonb,
    missing_measurements jsonb,
    recorded_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    synced_at timestamptz not null default now()
);

alter table public.health_records add column if not exists id uuid default gen_random_uuid();
alter table public.health_records add column if not exists local_health_record_id bigint;
alter table public.health_records add column if not exists local_user_id bigint;
alter table public.health_records add column if not exists auth_user_id uuid;
alter table public.health_records add column if not exists local_kiosk_session_id bigint;
alter table public.health_records add column if not exists session_number text;
alter table public.health_records add column if not exists session_status text;
alter table public.health_records add column if not exists heart_rate numeric;
alter table public.health_records add column if not exists spo2 numeric;
alter table public.health_records add column if not exists temperature numeric;
alter table public.health_records add column if not exists height numeric;
alter table public.health_records add column if not exists weight numeric;
alter table public.health_records add column if not exists bmi numeric;
alter table public.health_records add column if not exists bmi_category text;
alter table public.health_records add column if not exists health_status text;
alter table public.health_records add column if not exists measurement_statuses jsonb default '{}'::jsonb;
alter table public.health_records add column if not exists missing_measurements jsonb;
alter table public.health_records add column if not exists recorded_at timestamptz;
alter table public.health_records add column if not exists created_at timestamptz default now();
alter table public.health_records add column if not exists updated_at timestamptz default now();
alter table public.health_records add column if not exists synced_at timestamptz default now();

update public.health_records set id = gen_random_uuid() where id is null;
update public.health_records
set measurement_statuses = '{}'::jsonb
where measurement_statuses is null;
update public.health_records set created_at = now() where created_at is null;
update public.health_records set updated_at = created_at where updated_at is null;
update public.health_records set synced_at = updated_at where synced_at is null;

alter table public.health_records alter column id set default gen_random_uuid();
alter table public.health_records alter column id set not null;
alter table public.health_records alter column local_health_record_id set not null;
alter table public.health_records alter column local_user_id set not null;
alter table public.health_records alter column auth_user_id set not null;
alter table public.health_records alter column measurement_statuses set default '{}'::jsonb;
alter table public.health_records alter column measurement_statuses set not null;
alter table public.health_records alter column created_at set default now();
alter table public.health_records alter column created_at set not null;
alter table public.health_records alter column updated_at set default now();
alter table public.health_records alter column updated_at set not null;
alter table public.health_records alter column synced_at set default now();
alter table public.health_records alter column synced_at set not null;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.health_records'::regclass and contype = 'p'
    ) then
        alter table public.health_records
            add constraint health_records_pkey primary key (id);
    end if;
end
$$;

create unique index if not exists health_records_local_health_record_id_key
    on public.health_records (local_health_record_id);
create index if not exists health_records_auth_recorded_idx
    on public.health_records (auth_user_id, recorded_at desc);
create index if not exists health_records_local_user_id_idx
    on public.health_records (local_user_id);
create index if not exists health_records_health_status_idx
    on public.health_records (health_status);

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.health_records'::regclass
          and conname = 'health_records_local_user_id_fkey'
    ) then
        alter table public.health_records
            add constraint health_records_local_user_id_fkey
            foreign key (local_user_id) references public.users (local_user_id)
            on update cascade on delete cascade;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.health_records'::regclass
          and conname = 'health_records_auth_user_id_fkey'
    ) then
        alter table public.health_records
            add constraint health_records_auth_user_id_fkey
            foreign key (auth_user_id) references auth.users (id)
            on update cascade on delete cascade;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.health_records'::regclass
          and conname = 'health_records_measurement_statuses_object_check'
    ) then
        alter table public.health_records
            add constraint health_records_measurement_statuses_object_check
            check (jsonb_typeof(measurement_statuses) = 'object');
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.health_records'::regclass
          and conname = 'health_records_missing_measurements_array_check'
    ) then
        alter table public.health_records
            add constraint health_records_missing_measurements_array_check
            check (
                missing_measurements is null
                or jsonb_typeof(missing_measurements) = 'array'
            );
    end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Expo/native push tokens registered by companion-app devices.
-- ---------------------------------------------------------------------------
create table if not exists public.user_push_tokens (
    token text primary key,
    auth_user_id uuid not null,
    platform text,
    device_name text,
    last_seen_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

alter table public.user_push_tokens add column if not exists token text;
alter table public.user_push_tokens add column if not exists auth_user_id uuid;
alter table public.user_push_tokens add column if not exists platform text;
alter table public.user_push_tokens add column if not exists device_name text;
alter table public.user_push_tokens add column if not exists last_seen_at timestamptz default now();
alter table public.user_push_tokens add column if not exists created_at timestamptz default now();

update public.user_push_tokens set last_seen_at = now() where last_seen_at is null;
update public.user_push_tokens set created_at = last_seen_at where created_at is null;

alter table public.user_push_tokens alter column token set not null;
alter table public.user_push_tokens alter column auth_user_id set not null;
alter table public.user_push_tokens alter column last_seen_at set default now();
alter table public.user_push_tokens alter column last_seen_at set not null;
alter table public.user_push_tokens alter column created_at set default now();
alter table public.user_push_tokens alter column created_at set not null;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.user_push_tokens'::regclass and contype = 'p'
    ) then
        alter table public.user_push_tokens
            add constraint user_push_tokens_pkey primary key (token);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.user_push_tokens'::regclass
          and conname = 'user_push_tokens_auth_user_id_fkey'
    ) then
        alter table public.user_push_tokens
            add constraint user_push_tokens_auth_user_id_fkey
            foreign key (auth_user_id) references auth.users (id)
            on update cascade on delete cascade;
    end if;
end
$$;

create index if not exists user_push_tokens_auth_user_id_idx
    on public.user_push_tokens (auth_user_id);

-- Keep updated_at accurate even when a row is changed directly through the
-- Supabase REST API instead of by Laravel.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists health_records_set_updated_at on public.health_records;
create trigger health_records_set_updated_at
before update on public.health_records
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Privileges and Row Level Security.
-- anon receives no table access. Signed-in companion-app users can read their
-- own profile/records and manage only their own push tokens. The server-only
-- service_role can perform the complete kiosk sync, including DELETE.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

revoke all on table public.users from anon, authenticated;
revoke all on table public.health_records from anon, authenticated;
revoke all on table public.user_push_tokens from anon, authenticated;

grant select on table public.users to authenticated;
grant select on table public.health_records to authenticated;
grant select, insert, update, delete on table public.user_push_tokens to authenticated;

grant all privileges on table public.users to service_role;
grant all privileges on table public.health_records to service_role;
grant all privileges on table public.user_push_tokens to service_role;

alter table public.users enable row level security;
alter table public.health_records enable row level security;
alter table public.user_push_tokens enable row level security;

drop policy if exists users_select_own_profile on public.users;
create policy users_select_own_profile
on public.users for select
to authenticated
using ((select auth.uid()) = auth_user_id);

drop policy if exists health_records_select_own on public.health_records;
create policy health_records_select_own
on public.health_records for select
to authenticated
using ((select auth.uid()) = auth_user_id);

drop policy if exists push_tokens_select_own on public.user_push_tokens;
create policy push_tokens_select_own
on public.user_push_tokens for select
to authenticated
using ((select auth.uid()) = auth_user_id);

drop policy if exists push_tokens_insert_own on public.user_push_tokens;
create policy push_tokens_insert_own
on public.user_push_tokens for insert
to authenticated
with check ((select auth.uid()) = auth_user_id);

drop policy if exists push_tokens_update_own on public.user_push_tokens;
create policy push_tokens_update_own
on public.user_push_tokens for update
to authenticated
using ((select auth.uid()) = auth_user_id)
with check ((select auth.uid()) = auth_user_id);

drop policy if exists push_tokens_delete_own on public.user_push_tokens;
create policy push_tokens_delete_own
on public.user_push_tokens for delete
to authenticated
using ((select auth.uid()) = auth_user_id);

commit;

-- Tell PostgREST to pick up schema changes immediately.
notify pgrst, 'reload schema';

-- Verification output shown by the SQL Editor after a successful run.
select table_name, count(*) as column_count
from information_schema.columns
where table_schema = 'public'
  and table_name in ('users', 'health_records', 'user_push_tokens')
group by table_name
order by table_name;

select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('users', 'health_records', 'user_push_tokens')
order by tablename, policyname;

-- The send-measurement-push Edge Function and its health_records INSERT/UPDATE
-- database webhook are Supabase project resources, not portable SQL objects in
-- this repository. Deploy/configure them separately, keep the server secret in
-- Supabase Vault, and send modern sb_secret_ keys only through the apikey header.
