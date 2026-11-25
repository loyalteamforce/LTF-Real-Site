-- ============================================================
-- BANNER ÇERÇEVELERİ KALDIRILDI · Supabase SQL Editor'de bir kez çalıştır (tekrar çalıştırmak zararsız).
-- Tüm banner çerçeveleri (cerceve-*) satıştan kalkar ve takılı olanlar çıkarılır.
-- Satın alma kayıtları silinmez (geçmiş kalır). Profil çerçeveleri (pcer-*) etkilenmez.
-- ============================================================

update public.profiles set fx_cerceve = null where fx_cerceve is not null;

alter table public.profiles drop constraint if exists profiles_fx_cerceve_chk;
alter table public.profiles add constraint profiles_fx_cerceve_chk check (fx_cerceve is null);

update public.magaza_urunler set aktif = false where tur = 'cerceve';
