-- Kas OMK St. Carolus Houben — Supabase Cloud Sync
-- Jalankan sekali di Supabase Dashboard > SQL Editor > New query > Run.
-- Kebijakan ini membatasi tiap akun hanya dapat membaca/menulis baris miliknya sendiri.

create table if not exists public.kas_omk_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.kas_omk_data enable row level security;

grant select, insert, update on public.kas_omk_data to authenticated;

 drop policy if exists "Read own Kas OMK data" on public.kas_omk_data;
create policy "Read own Kas OMK data"
  on public.kas_omk_data for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Insert own Kas OMK data" on public.kas_omk_data;
create policy "Insert own Kas OMK data"
  on public.kas_omk_data for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Update own Kas OMK data" on public.kas_omk_data;
create policy "Update own Kas OMK data"
  on public.kas_omk_data for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
