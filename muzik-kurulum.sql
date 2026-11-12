-- ============================================================
-- MÜZİK SEKMESİ KURULUMU
-- Supabase > SQL Editor'de BİR KEZ çalıştır. Tekrar çalıştırmak zarar vermez.
-- ============================================================

create table if not exists public.sarkilar (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  video_id   text not null check (video_id ~ '^[A-Za-z0-9_-]{11}$'),
  baslik     text not null check (char_length(baslik) between 1 and 120),
  created_at timestamptz not null default now(),
  unique (video_id)                                   -- aynı şarkı iki kez eklenmesin
);

create index if not exists sarkilar_created_idx on public.sarkilar (created_at desc);
create index if not exists sarkilar_user_idx    on public.sarkilar (user_id);

alter table public.sarkilar enable row level security;

-- Giriş yapan herkes listeyi görür
drop policy if exists "sarkilar_oku" on public.sarkilar;
create policy "sarkilar_oku" on public.sarkilar
  for select to authenticated using (true);

-- Herkes sadece kendi adına şarkı ekleyebilir
drop policy if exists "sarkilar_ekle" on public.sarkilar;
create policy "sarkilar_ekle" on public.sarkilar
  for insert to authenticated with check (user_id = (select auth.uid()));

-- Herkes sadece kendi eklediği şarkıyı silebilir
drop policy if exists "sarkilar_sil" on public.sarkilar;
create policy "sarkilar_sil" on public.sarkilar
  for delete to authenticated using (user_id = (select auth.uid()));
