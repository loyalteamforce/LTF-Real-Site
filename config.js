// ============================================================
// SUPABASE AYARLARI — Tüm site bu dosyadaki bağlantıyı kullanır.
// Bilgilerini değiştirmen gerekirse SADECE burayı güncelle.
// ============================================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = "https://mbyyuovlipbpioxtkjcp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_LTLO2qA7KorZC944aF27fg_kKPJ-71Q";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const FUNCTIONS_URL = SUPABASE_URL + '/functions/v1'; // Ardevyl için
export { SUPABASE_ANON_KEY };

const EMAIL_DOMAIN = '@lefmembers.com';

export function usernameToEmail(username){
  return username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '') + EMAIL_DOMAIN;
}

export function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// Ana Sayfa kısayolu (Ardevyl) ve alt menü düzeni. Yüklenemese bile site normal çalışmaya devam eder.
import('./kisayollar.js').catch(() => {});

// Duyurular: Ana Sayfa'da son duyurular (Supabase > announcements tablosundan eklenir).
import('./duyurular.js').catch(() => {});

// Keşfet: üye arama (profildeki arama buraya taşındı).
import('./kesfet-arama.js').catch(() => {});

// Kart sekmesi: alt menüye Kart butonu ekler (kart seç, fiş animasyonu, LTF üye kartı).
import('./kart-sekme.js').catch(() => {});

// Hız ayarları: profil banner'ı ve fotoğrafı daha öncelikli yüklenir.
import('./hiz.js').catch(() => {});

// Profil teması (Mağaza'dan alınan arka plan) ve Profil tasarımı paneli (sadece Mağaza'dan alınanlar).
import('./profil-tema.js').catch(() => {});
import('./dolap.js').catch(() => {});

// 3D: kitaplar, dönen öne çıkanlar halkası, kart eğilmesi, altın tozu, mağaza ve podyum.
import('./uc-boyut.js').catch(() => {});

// Hikâye kitaplarının kapak resimleri (kodla çizilir, dosya indirmez).
import('./kapaklar.js').catch(() => {});
