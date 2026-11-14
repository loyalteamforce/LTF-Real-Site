-- ============================================================
-- PROFİL ŞARKISI: MP3 yerine YouTube
-- Supabase > SQL Editor'de BİR KEZ çalıştır. Tekrar çalıştırmak zararsızdır.
-- (Daha önce sarki-kurulum.sql çalıştırılmış olmalı; çalıştırılmadıysa önce onu çalıştır.)
-- Ne yapar:
--   1) profile_songs tablosuna video_id (YouTube kimliği) ekler; path artık boş olabilir.
--   2) Şarkı adı sınırını 60'tan 120 karaktere çıkarır (YouTube başlıkları uzun olabilir).
--   3) Ekleme/güncelleme kurallarını YouTube'a göre yeniler (herkes yalnızca kendi şarkısını yazar).
-- Eski MP3 şarkılar silinmez; yeni şarkı seçilene kadar çalmaya devam eder.
-- ============================================================

alter table public.profile_songs add column if not exists video_id text;
alter table public.profile_songs alter column path drop not null;

alter table public.profile_songs drop constraint if exists profile_songs_video_id_check;
alter table public.profile_songs add constraint profile_songs_video_id_check
  check (video_id is null or video_id ~ '^[A-Za-z0-9_-]{11}$');

alter table public.profile_songs drop constraint if exists profile_songs_title_check;
alter table public.profile_songs add constraint profile_songs_title_check
  check (char_length(title) between 1 and 120);

alter table public.profile_songs drop constraint if exists profile_songs_kaynak_check;
alter table public.profile_songs add constraint profile_songs_kaynak_check
  check (video_id is not null or path is not null);

drop policy if exists profile_songs_insert on public.profile_songs;
create policy profile_songs_insert on public.profile_songs
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists profile_songs_update on public.profile_songs;
create policy profile_songs_update on public.profile_songs
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
