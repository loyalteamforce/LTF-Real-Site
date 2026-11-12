-- ============================================================
-- PROFİL ŞARKISI KURULUMU
-- Supabase > SQL Editor'de BİR KEZ çalıştır. Tekrar çalıştırmak zararsızdır.
-- Ne yapar:
--   1) profile_songs tablosu: her üyenin en fazla 1 şarkısı olur.
--   2) profile-songs kovası: sadece MP3, en fazla 6 MB, herkes dinleyebilir.
--   3) Güvenlik: her üye yalnızca KENDİ şarkısını ekleyip silebilir.
-- 6 MB sınırını değiştirirsen profil-sarki.js'deki MAX_BYTES'ı da değiştir.
-- ============================================================

-- 1) Tablo
create table if not exists public.profile_songs (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 60),
  path       text not null,
  updated_at timestamptz not null default now()
);

alter table public.profile_songs enable row level security;

drop policy if exists profile_songs_select on public.profile_songs;
create policy profile_songs_select on public.profile_songs
  for select using (true);

drop policy if exists profile_songs_insert on public.profile_songs;
create policy profile_songs_insert on public.profile_songs
  for insert to authenticated
  with check (user_id = auth.uid() and path = auth.uid()::text || '/song.mp3');

drop policy if exists profile_songs_update on public.profile_songs;
create policy profile_songs_update on public.profile_songs
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and path = auth.uid()::text || '/song.mp3');

drop policy if exists profile_songs_delete on public.profile_songs;
create policy profile_songs_delete on public.profile_songs
  for delete to authenticated
  using (user_id = auth.uid());

-- 2) Depolama kovası (herkese açık okuma, sadece MP3, 6 MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-songs', 'profile-songs', true, 6291456, array['audio/mpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 3) Dosya erişim kuralları: herkes sadece kendi klasörüne (<kullanıcı id>/) yazabilir.
--    Dinleme, kova herkese açık olduğu için ayrı kural gerektirmez.
drop policy if exists profile_songs_obj_select on storage.objects;
create policy profile_songs_obj_select on storage.objects
  for select to authenticated
  using (bucket_id = 'profile-songs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists profile_songs_obj_insert on storage.objects;
create policy profile_songs_obj_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-songs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists profile_songs_obj_update on storage.objects;
create policy profile_songs_obj_update on storage.objects
  for update to authenticated
  using (bucket_id = 'profile-songs' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'profile-songs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists profile_songs_obj_delete on storage.objects;
create policy profile_songs_obj_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-songs' and (storage.foldername(name))[1] = auth.uid()::text);
