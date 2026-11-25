-- ============================================================
-- YENİ ÇERÇEVELER · Supabase SQL Editor'de bir kez çalıştır (tekrar çalıştırmak zararsız).
-- Eski 9 çerçeve (Beyaz Diken ... Sakura Püskülü) mağazadan kaldırılır, yerine 5 yeni çerçeve gelir:
-- Turkuaz Damla, Mavi Nilüfer, Mor Melek, Kristal Buz, Gotik Zincir.
-- Eski çerçeveyi takmış olanların çerçevesi çıkarılır. Satın alma kayıtları silinmez (geçmiş kalır).
-- ============================================================

-- eski çerçeveyi takanların çerçevesini çıkar
update public.profiles set fx_cerceve = null
 where fx_cerceve is not null and fx_cerceve <> all (array['damla','nilufer','melek','buz','gotik']);

alter table public.profiles drop constraint if exists profiles_fx_cerceve_chk;
alter table public.profiles add constraint profiles_fx_cerceve_chk check (fx_cerceve is null or fx_cerceve = any (array[
  'damla','nilufer','melek','buz','gotik']));

-- eski çerçeveler satıştan kalkar
update public.magaza_urunler set aktif = false
 where tur = 'cerceve' and id <> all (array['cerceve-damla','cerceve-nilufer','cerceve-melek','cerceve-buz','cerceve-gotik']);

insert into public.magaza_urunler (id, tur, ad, fiyat, aciklama, sira, aktif) values
  ('cerceve-damla',   'cerceve', 'Turkuaz Damla',  600, 'Turkuaz ışıklı, damla süslü ince çerçeve.', 10, true),
  ('cerceve-nilufer', 'cerceve', 'Mavi Nilüfer',   750, 'Mavi parıltılı, yaprak işlemeli çerçeve.', 11, true),
  ('cerceve-melek',   'cerceve', 'Mor Melek',      900, 'Mor ışıklı, tüy süslü çerçeve.', 12, true),
  ('cerceve-buz',     'cerceve', 'Kristal Buz',   1000, 'Gümüş, buz kristalli çerçeve.', 13, true),
  ('cerceve-gotik',   'cerceve', 'Gotik Zincir',  1200, 'Siyah metal, mor taşlı ve zincirli gotik çerçeve.', 14, true)
on conflict (id) do update set tur = excluded.tur, ad = excluded.ad, fiyat = excluded.fiyat,
  aciklama = excluded.aciklama, sira = excluded.sira, aktif = true;
