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

// Profil şarkısı aramasında kullanılan YouTube Data API anahtarı (boş bırakılırsa herkese açık Piped sunucularına düşer).
// Anahtar Google Cloud'da "HTTP referrers: loyalteamforce.com/*" ve sadece YouTube Data API v3 ile kısıtlanmalı.
export const YOUTUBE_API_KEY = 'AIzaSyAHn208oZwEIBtG8FacnNlnHoM5Av8EAqE';

const EMAIL_DOMAIN = '@lefmembers.com';

export function usernameToEmail(username){
  return username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '') + EMAIL_DOMAIN;
}

export function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// Profil şarkısı (MP3) modülü. Yüklenemese bile site normal çalışmaya devam eder.
import('./profil-sarki.js').catch(() => {});

// Ana Sayfa kısayolları (Müzik, Ardevyl) ve alt menü düzeni. Yüklenemese bile site normal çalışmaya devam eder.
import('./kisayollar.js').catch(() => {});

// YouTube çalma yardımcısı: hata nedenini ekranda gösterir, çalmazsa oynatıcıyı görünür yapar.
import('./yt-duzelt.js').catch(() => {});

// Kart sekmesi: alt menüye Kart butonu ekler (kart seç, fiş animasyonu, LTF üye kartı).
import('./kart-sekme.js').catch(() => {});
