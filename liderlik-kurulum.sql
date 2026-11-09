-- ============================================================
-- LİDERLİK TABLOSU — sunucu fonksiyonları
-- Kaynak: wallets (bakiye) ve wallet_tx (kazanç hareketleri).
-- Tarayıcı tabloları doğrudan okumaz; yalnızca bu fonksiyonları çağırır.
--   leaderboard_overall(p_limit)  : genel sıralama (cüzdan bakiyesi)
--   leaderboard_weekly(p_limit)   : haftalık sıralama (yalnızca 'earn' kazançları;
--                                   puan gönderme/alma sayılmaz, hafta Pazartesi 00:00 Europe/Istanbul)
--   leaderboard_classes()         : sınıf sıralaması (toplam, üye sayısı, ortalama)
--   leaderboard_me()              : giriş yapan üyenin genel ve haftalık sırası
-- Yalnızca giriş yapmış (authenticated) üyeler çağırabilir.
-- (Bu dosya Supabase'e zaten uygulandı: migration 'leaderboard_functions'.)
-- ============================================================

create index if not exists wallet_tx_kind_created_idx on public.wallet_tx (kind, created_at desc);

create or replace function public.leaderboard_overall(p_limit int default 50)
returns table (rank bigint, user_id uuid, display_name text, username text, avatar_url text, name_color text, class text, points bigint)
language sql stable security definer set search_path = public as $$
  select rank() over (order by w.balance desc), w.user_id, p.display_name, p.username, p.avatar_url, p.name_color, p.class, w.balance
  from public.wallets w
  join public.profiles p on p.id = w.user_id
  where w.balance > 0
  order by w.balance desc, p.username
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

create or replace function public.leaderboard_weekly(p_limit int default 50)
returns table (rank bigint, user_id uuid, display_name text, username text, avatar_url text, name_color text, class text, points bigint)
language sql stable security definer set search_path = public as $$
  with wk as (
    select (date_trunc('week', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul') as start_at
  ), s as (
    select t.user_id, sum(t.amount)::bigint as pts
    from public.wallet_tx t, wk
    where t.kind = 'earn' and t.created_at >= wk.start_at
    group by t.user_id
  )
  select rank() over (order by s.pts desc), s.user_id, p.display_name, p.username, p.avatar_url, p.name_color, p.class, s.pts
  from s
  join public.profiles p on p.id = s.user_id
  order by s.pts desc, p.username
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

create or replace function public.leaderboard_classes()
returns table (rank bigint, class text, members bigint, total bigint, average numeric)
language sql stable security definer set search_path = public as $$
  with c as (
    select p.class as cls, count(*) as members, coalesce(sum(w.balance), 0)::bigint as total
    from public.profiles p
    left join public.wallets w on w.user_id = p.id
    where p.class is not null
    group by p.class
  )
  select rank() over (order by c.total desc), c.cls, c.members, c.total, round(c.total::numeric / nullif(c.members, 0), 1)
  from c
  order by c.total desc, c.cls;
$$;

create or replace function public.leaderboard_me()
returns table (overall_rank bigint, overall_points bigint, weekly_rank bigint, weekly_points bigint)
language sql stable security definer set search_path = public as $$
  with wk as (
    select (date_trunc('week', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul') as start_at
  ), o as (
    select user_id, balance as pts, rank() over (order by balance desc) as r from public.wallets where balance > 0
  ), w as (
    select t.user_id, sum(t.amount)::bigint as pts, rank() over (order by sum(t.amount) desc) as r
    from public.wallet_tx t, wk where t.kind = 'earn' and t.created_at >= wk.start_at group by t.user_id
  )
  select (select r from o where o.user_id = auth.uid()),
         coalesce((select pts from o where o.user_id = auth.uid()), 0)::bigint,
         (select r from w where w.user_id = auth.uid()),
         coalesce((select pts from w where w.user_id = auth.uid()), 0)::bigint;
$$;

revoke all on function public.leaderboard_overall(int), public.leaderboard_weekly(int), public.leaderboard_classes(), public.leaderboard_me() from public, anon;
grant execute on function public.leaderboard_overall(int), public.leaderboard_weekly(int), public.leaderboard_classes(), public.leaderboard_me() to authenticated;
