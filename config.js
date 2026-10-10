// ============================================================
// SUPABASE AYARLARI — Tüm site bu dosyadaki bağlantıyı kullanır.
// Bilgilerini değiştirmen gerekirse SADECE burayı güncelle.
// ============================================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = "https://mbyyuovlipbpioxtkjcp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_LTLO2qA7KorZC944aF27fg_kKPJ-71Q";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const FUNCTIONS_URL = SUPABASE_URL + '/functions/v1'; // NaphielAI için
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