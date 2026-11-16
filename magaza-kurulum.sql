-- ============================================================
-- MAĞAZA: puanla banner çerçevesi ve gri tik satın alma
-- Supabase > SQL Editor'de BIR KEZ çalıştır (puan-kurulum.sql'den SONRA; wallets ve wallet_tx tabloları olmalı).
-- Fiyatlar aşağıdaki INSERT'te; istediğin zaman ürün tablosundan güncelleyebilirsin:
--   update public.magaza_urunler set fiyat = 500 where id = 'cerceve-kelebek';
-- ============================================================

create table if not exists public.magaza_urunler (
  id        text primary key,                       -- cerceve-<anahtar> | rozet-gri-tik
  tur       text not null check (tur in ('cerceve','rozet')),
  ad        text not null,
  fiyat     int  not null check (fiyat >= 0),
  aciklama  text,
  sira      int  not null default 0,
  aktif     boolean not null default true
);

create table if not exists public.magaza_sahip (
  user_id    uuid not null references auth.users(id) on delete cascade,
  urun_id    text not null references public.magaza_urunler(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, urun_id)
);

alter table public.magaza_urunler enable row level security;
alter table public.magaza_sahip  enable row level security;

drop policy if exists magaza_urunler_oku on public.magaza_urunler;
create policy magaza_urunler_oku on public.magaza_urunler for select to authenticated using (true);

-- Herkes herkesin sahip olduğu ürünleri görebilir (gri tik başkalarının profilinde de görünsün diye).
-- Yazma izni YOK: sadece magaza_al() fonksiyonu ekleyebilir.
drop policy if exists magaza_sahip_oku on public.magaza_sahip;
create policy magaza_sahip_oku on public.magaza_sahip for select to authenticated using (true);

insert into public.magaza_urunler (id, tur, ad, fiyat, aciklama, sira) values
  ('rozet-gri-tik',   'rozet',   'Gri Tik',         1000, 'Profil adının yanında gri doğrulama işareti.', 1),
  ('cerceve-beyaz',   'cerceve', 'Beyaz Diken',      300, 'Beyaz ince çizgili banner ve avatar çerçevesi.', 2),
  ('cerceve-kirmizi', 'cerceve', 'Kızıl Melek',     450, 'Kızıl mağara ışıltılı çerçeve.', 3),
  ('cerceve-mavi',    'cerceve', 'Mavi Zincir',      450, 'Mavi zincir efektli çerçeve.', 4),
  ('cerceve-kelebek', 'cerceve', 'Gece Kelebeği',   600, 'Beyaz çizgili kelebek çerçevesi.', 5),
  ('cerceve-murekkep','cerceve', 'Mürekkep',        600, 'Siyah mürekkep çizgili çerçeve.', 6),
  ('cerceve-kurdele', 'cerceve', 'Kurdele',          750, 'Parlak kurdele şeritli çerçeve.', 7)
on conflict (id) do nothing;

-- Satın alma: puanı düşer, ürünü hesaba ekler, yeni bakiyeyi döndürür. Hepsi tek işlemde (yarım kalmaz).
create or replace function public.magaza_al(p_urun text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_fiyat int;
  v_ad    text;
  v_bal   bigint;
begin
  if v_uid is null then raise exception 'auth'; end if;

  select fiyat, ad into v_fiyat, v_ad from public.magaza_urunler where id = p_urun and aktif;
  if not found then raise exception 'not_found'; end if;

  if exists (select 1 from public.magaza_sahip where user_id = v_uid and urun_id = p_urun) then
    raise exception 'owned';
  end if;

  update public.wallets set balance = balance - v_fiyat
   where user_id = v_uid and balance >= v_fiyat
  returning balance into v_bal;
  if not found then raise exception 'insufficient'; end if;

  insert into public.magaza_sahip (user_id, urun_id) values (v_uid, p_urun);

  -- hareket geçmişine yaz (tablo şeması farklıysa satın alma yine de başarılı olur)
  begin
    insert into public.wallet_tx (user_id, kind, amount, note) values (v_uid, 'spend', v_fiyat, 'Mağaza: ' || v_ad);
  exception when others then null;
  end;

  return v_bal;
end;
$$;

revoke all on function public.magaza_al(text) from public, anon;
grant execute on function public.magaza_al(text) to authenticated;

-- Satın alınmamış mağaza çerçevesi profile TAKILAMASIN (sadece fx_cerceve değiştiğinde ve mağazada satilan bir çerçeveyse kontrol eder).
create or replace function public.magaza_cerceve_kontrol()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.fx_cerceve is distinct from old.fx_cerceve and new.fx_cerceve is not null
     and exists (select 1 from public.magaza_urunler where id = 'cerceve-' || new.fx_cerceve and aktif)
     and not exists (select 1 from public.magaza_sahip where user_id = new.id and urun_id = 'cerceve-' || new.fx_cerceve)
  then
    raise exception 'owned_required: bu çerçeveyi önce Mağaza’dan almalısın';
  end if;
  return new;
end;
$$;

drop trigger if exists magaza_cerceve_kontrol on public.profiles;
create trigger magaza_cerceve_kontrol
  before update of fx_cerceve on public.profiles
  for each row execute function public.magaza_cerceve_kontrol();
