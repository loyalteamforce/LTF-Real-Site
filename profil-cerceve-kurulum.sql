-- ============================================================
-- PROFİL ÇERÇEVELERİ + 2 YENİ BANNER ÇERÇEVESİ · Supabase SQL Editor'de bir kez çalıştır (tekrar çalıştırmak zararsız).
-- 1) profiles.pf_cerceve: profil ekranını saran süs (ilk tasarım: Mor Kelebek).
-- 2) Yeni banner çerçeveleri: Ay Balığı, Mor Neon.
-- 3) Sahip olunmayan profil çerçevesi de takılamaz (magaza_cerceve_kontrol tetikleyicisi).
-- ============================================================

alter table public.profiles add column if not exists pf_cerceve text;
alter table public.profiles drop constraint if exists profiles_pf_cerceve_chk;
alter table public.profiles add constraint profiles_pf_cerceve_chk check (pf_cerceve is null or pf_cerceve = any (array['mor']));
grant select (pf_cerceve), update (pf_cerceve) on public.profiles to authenticated;

alter table public.profiles drop constraint if exists profiles_fx_cerceve_chk;
alter table public.profiles add constraint profiles_fx_cerceve_chk check (fx_cerceve is null or fx_cerceve = any (array[
  'damla','nilufer','melek','buz','gotik','balik','neon']));

create or replace function public.magaza_cerceve_kontrol()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  k text; v text; o text;
begin
  foreach k in array array['cerceve','pcer','tema','rozet'] loop
    v := case k when 'cerceve' then new.fx_cerceve when 'pcer' then new.pf_cerceve when 'tema' then new.pf_tema else new.rozet end;
    o := case k when 'cerceve' then old.fx_cerceve when 'pcer' then old.pf_cerceve when 'tema' then old.pf_tema else old.rozet end;
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
create trigger magaza_cerceve_kontrol before update of fx_cerceve, pf_cerceve, pf_tema, rozet on public.profiles
  for each row execute function public.magaza_cerceve_kontrol();

alter table public.magaza_urunler drop constraint if exists magaza_urunler_tur_check;
alter table public.magaza_urunler add constraint magaza_urunler_tur_check check (tur = any (array['cerceve','pcer','rozet','kart','tema']));

insert into public.magaza_urunler (id, tur, ad, fiyat, aciklama, sira, aktif) values
  ('cerceve-neon',  'cerceve', 'Mor Neon',     700, 'Mor-pembe neon çizgili, yanları parlayan çerçeve.', 10, true),
  ('cerceve-balik', 'cerceve', 'Ay Balığı',    850, 'Cam gibi dalgalı, hilal ve baloncuk süslü çerçeve.', 12, true),
  ('pcer-mor',      'pcer',    'Mor Kelebek', 1500, 'Profilinin kenarlarını mor kelebekler ve sarmaşıklar sarar.', 20, true)
on conflict (id) do update set tur = excluded.tur, ad = excluded.ad, fiyat = excluded.fiyat,
  aciklama = excluded.aciklama, sira = excluded.sira, aktif = true;

update public.magaza_urunler set sira = case id
  when 'cerceve-damla' then 9 when 'cerceve-neon' then 10 when 'cerceve-nilufer' then 11 when 'cerceve-balik' then 12
  when 'cerceve-melek' then 13 when 'cerceve-buz' then 14 when 'cerceve-gotik' then 15 else sira end
 where tur = 'cerceve';
