-- ============================================================
-- SINIF EKRANI (Classroom of the Elite tarzı) · Supabase SQL Editor'de bir kez çalıştır.
-- Neden: profiles tablosundaki yetenek sütunları (academic, physical, adaptability, social)
-- üyelerin doğrudan okumasına kapalı. Sınıf ekranı bu yüzden "yüklenemedi" diyordu.
-- Bu fonksiyon sadece sınıf ekranının ihtiyaç duyduğu alanları, giriş yapmış üyelere döndürür:
--   class_screen('A') -> { "cp": 1004, "students": [ {id, username, display_name, avatar_url,
--                                                     name_color, academic, physical, adaptability, social}, ... ] }
-- cp: class_points tablosundaki sınıf puanı (yoksa 0).
-- ============================================================
create or replace function public.class_screen(p_class text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'cp', coalesce((select cp.points from public.class_points cp where cp.class = p_class), 0),
    'students', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'username', p.username, 'display_name', p.display_name, 'avatar_url', p.avatar_url,
        'name_color', p.name_color, 'academic', p.academic, 'physical', p.physical,
        'adaptability', p.adaptability, 'social', p.social) order by p.username)
      from public.profiles p
      where p.class = p_class
    ), '[]'::jsonb)
  )
  where auth.uid() is not null;
$$;

revoke all on function public.class_screen(text) from public, anon;
grant execute on function public.class_screen(text) to authenticated;
