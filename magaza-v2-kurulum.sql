-- ============================================================
-- MAĞAZA v2 · Supabase SQL Editor'de bir kez çalıştır (tekrar çalıştırmak zararsız).
-- 1) Çerçeve sütunu artık 9 çerçeveyi kabul eder (eskiden sadece beyaz/kirmizi/mavi takılabiliyordu,
--    Gece Kelebeği, Mürekkep ve Kurdele satın alınsa bile takılamıyordu).
-- 2) profiles.pf_tema: mağazadan alınan profil teması (arka plan).
--    profiles.rozet  : takılı rozet (adın yanında görünür).
-- 3) Çerçeve, tema ve rozet sadece mağazadan alındıysa takılabilir (magaza_cerceve_kontrol tetikleyicisi).
-- 4) Yeni ürünler: 3 çerçeve, 5 profil teması, 4 rozet.
-- ============================================================

alter table public.profiles drop constraint if exists profiles_fx_cerceve_chk;
alter table public.profiles add constraint profiles_fx_cerceve_chk check (fx_cerceve is null or fx_cerceve = any (array[
  'beyaz','kirmizi','mavi','kelebek','murekkep','kurdele','dantel','katana','sakura']));

alter table public.profiles add column if not exists pf_tema text;
alter table public.profiles drop constraint if exists profiles_pf_tema_chk;
alter table public.profiles add constraint profiles_pf_tema_chk check (pf_tema is null or pf_tema = any (array[
  'higanbana','gece','sakura','murekkep','zumrut']));

alter table public.profiles add column if not exists rozet text;
alter table public.profiles drop constraint if exists profiles_rozet_chk;
alter table public.profiles add constraint profiles_rozet_chk check (rozet is null or rozet = any (array[
  'gri-tik','altin-tik','tac','yildiz','alev']));

grant select (fx_cerceve, pf_tema, rozet), update (fx_cerceve, pf_tema, rozet) on public.profiles to authenticated;

-- Sahip olunmayan çerçeve/tema/rozet takılamaz
create or replace function public.magaza_cerceve_kontrol()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  k text; v text; o text;
begin
  foreach k in array array['cerceve','tema','rozet'] loop
    v := case k when 'cerceve' then new.fx_cerceve when 'tema' then new.pf_tema else new.rozet end;
    o := case k when 'cerceve' then old.fx_cerceve when 'tema' then old.pf_tema else old.rozet end;
    if v is distinct from o and v is not null
       and exists (select 1 from public.magaza_urunler where id = k || '-' || v and aktif)
       and not exists (select 1 from public.magaza_sahip where user_id = new.id and urun_id = k || '-' || v)
    then
      raise exception 'owned_required: bunu önce Mağaza''dan almalısın';
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists magaza_cerceve_kontrol on public.profiles;
create trigger magaza_cerceve_kontrol before update of fx_cerceve, pf_tema, rozet on public.profiles
  for each row execute function public.magaza_cerceve_kontrol();

-- Gri tiki olanlarda rozet takılı başlasın (eskiden sahip olmak yetiyordu)
update public.profiles p set rozet = 'gri-tik'
 where p.rozet is null and exists (select 1 from public.magaza_sahip s where s.user_id = p.id and s.urun_id = 'rozet-gri-tik');

-- Ürünler (tur: rozet | cerceve | tema | kart)
alter table public.magaza_urunler drop constraint if exists magaza_urunler_tur_check;
alter table public.magaza_urunler add constraint magaza_urunler_tur_check check (tur = any (array['cerceve','rozet','kart','tema']));

insert into public.magaza_urunler (id, tur, ad, fiyat, aciklama, sira, aktif) values
  ('rozet-gri-tik',    'rozet',   'Gri Tik',          1000, 'Profil adının yanında gri doğrulama işareti.', 1, true),
  ('rozet-yildiz',     'rozet',   'Yıldız',            600, 'Adının yanında parlayan bir yıldız.', 2, true),
  ('rozet-alev',       'rozet',   'Alev',              800, 'Adının yanında turuncu bir alev.', 3, true),
  ('rozet-tac',        'rozet',   'Taç',              1500, 'Adının yanında altın bir taç.', 4, true),
  ('rozet-altin-tik',  'rozet',   'Altın Tik',        2500, 'Adının yanında altın doğrulama işareti.', 5, true),
  ('cerceve-beyaz',    'cerceve', 'Beyaz Diken',       300, 'Beyaz dikenli ince çizgi çerçeve.', 10, true),
  ('cerceve-kirmizi',  'cerceve', 'Kızıl Melek',       450, 'Kızıl tüylü, kanatlı çerçeve.', 11, true),
  ('cerceve-mavi',     'cerceve', 'Mavi Zincir',       450, 'Mavi zincir halkalı çerçeve.', 12, true),
  ('cerceve-kelebek',  'cerceve', 'Gece Kelebeği',     600, 'Beyaz çizgili, kelebekli çerçeve.', 13, true),
  ('cerceve-murekkep', 'cerceve', 'Mürekkep',          600, 'Fırça darbeli siyah mürekkep çerçeve.', 14, true),
  ('cerceve-kurdele',  'cerceve', 'Kurdele',           750, 'Gümüş kurdeleli fiyonklu çerçeve.', 15, true),
  ('cerceve-dantel',   'cerceve', 'Kızıl Dantel',      900, 'Beyaz dantel, kırmızı kurdele ve inci süslü çerçeve.', 16, true),
  ('cerceve-katana',   'cerceve', 'Kara Kılıç',        900, 'Mürekkep lekeli, kılıçlı ve püsküllü siyah çerçeve.', 17, true),
  ('cerceve-sakura',   'cerceve', 'Sakura Püskülü',   1000, 'Sakura çiçekli, kırmızı-beyaz kordonlu çerçeve.', 18, true),
  ('tema-gece',        'tema',    'Gece Yarısı',       800, 'Lacivert profil arka planı, hilal ve yıldızlar.', 30, true),
  ('tema-murekkep',    'tema',    'Mürekkep Gölgesi',  800, 'Siyah-gri profil arka planı, fırça izleri.', 31, true),
  ('tema-zumrut',      'tema',    'Zümrüt Orman',      800, 'Koyu yeşil profil arka planı, yapraklar.', 32, true),
  ('tema-sakura',      'tema',    'Sakura Bahçesi',   1000, 'Gül kurusu profil arka planı, sakura dalları.', 33, true),
  ('tema-higanbana',   'tema',    'Kızıl Zambak',     1200, 'Koyu kızıl profil arka planı, örümcek zambakları.', 34, true)
on conflict (id) do update set tur = excluded.tur, ad = excluded.ad, fiyat = excluded.fiyat,
  aciklama = excluded.aciklama, sira = excluded.sira, aktif = excluded.aktif;
