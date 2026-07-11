-- Finanças Pessoais — schema Supabase (rode no SQL Editor uma vez)
-- https://supabase.com/dashboard → SQL → New query → colar → Run

create extension if not exists "pgcrypto";

-- ─── Perfis ───────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  image text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- ─── Contas bancárias ─────────────────────────────────────────────
create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null default 'CARTEIRA',
  initial_balance_cents int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bank_accounts_user_id_idx on public.bank_accounts (user_id);
alter table public.bank_accounts enable row level security;
drop policy if exists "bank_accounts_all_own" on public.bank_accounts;
create policy "bank_accounts_all_own" on public.bank_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Categorias ───────────────────────────────────────────────────
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text,
  color text not null default '#6B7280',
  type text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists categories_user_id_idx on public.categories (user_id);
alter table public.categories enable row level security;
drop policy if exists "categories_all_own" on public.categories;
create policy "categories_all_own" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Formas de pagamento ──────────────────────────────────────────
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists payment_methods_user_id_idx on public.payment_methods (user_id);
alter table public.payment_methods enable row level security;
drop policy if exists "payment_methods_all_own" on public.payment_methods;
create policy "payment_methods_all_own" on public.payment_methods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Períodos mensais ─────────────────────────────────────────────
create table if not exists public.month_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  year_month text not null,
  status text not null default 'ABERTO',
  initial_balance_cents int not null default 0,
  final_balance_cents int,
  closed_at timestamptz,
  snapshot_json text,
  created_at timestamptz not null default now(),
  unique (user_id, year_month)
);
create index if not exists month_periods_user_id_idx on public.month_periods (user_id);
alter table public.month_periods enable row level security;
drop policy if exists "month_periods_all_own" on public.month_periods;
create policy "month_periods_all_own" on public.month_periods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Transações ───────────────────────────────────────────────────
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date timestamptz not null,
  amount_cents int not null,
  type text not null,
  description text not null,
  notes text,
  account_id uuid not null references public.bank_accounts (id),
  category_id uuid not null references public.categories (id),
  payment_method_id uuid not null references public.payment_methods (id),
  month_period_id uuid not null references public.month_periods (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_date_idx on public.transactions (date);
create index if not exists transactions_month_period_id_idx on public.transactions (month_period_id);
alter table public.transactions enable row level security;
drop policy if exists "transactions_all_own" on public.transactions;
create policy "transactions_all_own" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Metas ────────────────────────────────────────────────────────
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  category text not null default 'Geral',
  priority text not null default 'MEDIA',
  icon text default 'target',
  color text not null default '#3B82F6',
  target_cents int not null,
  current_cents int not null default 0,
  deadline timestamptz,
  status text not null default 'ATIVA',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists goals_user_id_idx on public.goals (user_id);
alter table public.goals enable row level security;
drop policy if exists "goals_all_own" on public.goals;
create policy "goals_all_own" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_cents int not null,
  date timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists goal_contributions_goal_id_idx on public.goal_contributions (goal_id);
alter table public.goal_contributions enable row level security;
drop policy if exists "goal_contributions_all_own" on public.goal_contributions;
create policy "goal_contributions_all_own" on public.goal_contributions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Investimentos ────────────────────────────────────────────────
create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution text not null,
  type text not null,
  applied_at timestamptz not null,
  applied_cents int not null,
  current_cents int not null,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists investments_user_id_idx on public.investments (user_id);
alter table public.investments enable row level security;
drop policy if exists "investments_all_own" on public.investments;
create policy "investments_all_own" on public.investments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Configurações ────────────────────────────────────────────────
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  profile_name text not null default 'Usuario',
  profile_photo text,
  theme text not null default 'dark',
  language text not null default 'pt-BR',
  currency text not null default 'BRL',
  month_start_day int not null default 1,
  notifications_enabled boolean not null default true
);
alter table public.settings enable row level security;
drop policy if exists "settings_all_own" on public.settings;
create policy "settings_all_own" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-profile no signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
