-- ============================================================
-- PROFİL ŞARKISI: sevilen 20 saniyelik bölüm
-- Supabase > SQL Editor'de BİR KEZ çalıştır. Tekrar çalıştırmak zararsızdır.
-- (sarki-youtube-kurulum.sql'den SONRA çalıştırılır.)
-- start_sec: 20 saniyelik bölümün YouTube şarkısındaki başlangıç saniyesi.
-- ============================================================
alter table public.profile_songs add column if not exists start_sec integer not null default 0;
alter table public.profile_songs drop constraint if exists profile_songs_start_sec_check;
alter table public.profile_songs add constraint profile_songs_start_sec_check check (start_sec >= 0 and start_sec < 86400);
