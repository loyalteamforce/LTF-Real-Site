-- ============================================================
-- KART SATIN ALMA: Gümüş ve Altın kartlar puanla alınır (Platin ücretsiz, varsayılan).
-- Supabase > SQL Editor'de BIR KEZ çalıştır (magaza-kurulum.sql'den SONRA).
-- Fiyatları istediğin zaman değiştirebilirsin:
--   update public.magaza_urunler set fiyat = 400 where id = 'kart-g';
-- ============================================================

alter table public.magaza_urunler drop constraint if exists magaza_urunler_tur_check;
alter table public.magaza_urunler add constraint magaza_urunler_tur_check check (tur in ('cerceve','rozet','kart'));

insert into public.magaza_urunler (id, tur, ad, fiyat, aciklama, sira) values
  ('kart-s', 'kart', 'Gümüş Kart', 250, 'LTF üye kartı, gümüş tasarım.', 8),
  ('kart-g', 'kart', 'Altın Kart', 500, 'LTF üye kartı, altın tasarım.', 9)
on conflict (id) do nothing;
