/* ============================================================
   PROFİL ÇERÇEVELERİ: profil ekranının kenarlarını saran süs (Mağaza'dan alınır)
   - İlk tasarım: Mor Kelebek (mor kelebekler, sarmaşıklar). Resmi cerceveler/pcer-mor.webp, arka planı yok.
   - Profil açıkken ekranın dört kenarını sarar; köşeler oranını korur, aradaki kenarlar ekran boyuna göre uzar.
   - Tıklamaları engellemez, animasyon yok.
   - Seçim profiles.pf_cerceve sütunundadır; herkes başkasının profil çerçevesini görür.
   - Mağaza ve "Profil tasarımı" paneli önizleme için window.__lefPcer kullanır.
   - Yeni tasarım: cerceveler/pcer-ANAHTAR.webp ekle, PC listesine bir satır yaz,
     SQL'deki pf_cerceve listesine anahtarı ekle (profil-cerceve-kurulum.sql).
   - config.js bu dosyayı kendisi yükler.
   ============================================================ */
import { supabase } from './config.js';

// S: resmin kenarı (kare, px), c: köşe parçasının boyu (resim pikseli)
const PC = {
  mor: { n: 'Mor Kelebek', S: 1080, c: 380 }
};
const url = k => new URL('./cerceveler/pcer-' + k + '.webp', import.meta.url).href;

// Mağaza / panel önizlemesi: koyu örnek ekran ve etrafında çerçeve
function preview(canvas, k, w, h, dpr) {
  const P = PC[k]; if (!P) return;
  dpr = dpr || Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  const im = new Image();
  im.onload = () => {
    const x = canvas.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
    const s = Math.min(w, h), ox = (w - s) / 2, oy = (h - s) / 2;
    x.fillStyle = '#17141d'; x.beginPath(); x.roundRect ? x.roundRect(ox, oy, s, s, 10) : x.rect(ox, oy, s, s); x.fill();
    x.drawImage(im, ox, oy, s, s);
  };
  im.src = url(k);
}
window.__lefPcer = { PC, preview, name: k => (PC[k] ? PC[k].n : ''), apply() {}, restore() {}, saved() {} };

(function main() {
  const pv = document.getElementById('v-profil'); if (!pv) return;
  const css = document.createElement('style');
  css.textContent =
    '.pcer{position:fixed;inset:0;z-index:30;pointer-events:none;border-style:solid;border-color:transparent;box-sizing:border-box;' +
    'border-width:var(--pc-w);border-image-repeat:stretch;display:none}' +
    '.pcer.on.vis{display:block}';
  document.head.appendChild(css);
  const el = document.createElement('div'); el.className = 'pcer'; el.setAttribute('aria-hidden', 'true'); document.body.appendChild(el);
  // sadece Profil ekranı açıkken görünür
  const vis = () => el.classList.toggle('vis', pv.classList.contains('on'));
  new MutationObserver(vis).observe(pv, { attributes: true, attributeFilter: ['class'] }); vis();

  function size() {   // köşe parçasının ekrandaki boyu: ekranın kısa kenarının ~%38'i
    const k = el.dataset.k, P = PC[k]; if (!P) return;
    const w = Math.round(Math.min(innerWidth, innerHeight) * (P.c / P.S) * 1.05);
    el.style.setProperty('--pc-w', Math.max(90, Math.min(w, 420)) + 'px');
  }
  function apply(k) {
    const P = PC[k];
    if (!P) { el.classList.remove('on'); delete el.dataset.k; return; }
    el.dataset.k = k;
    el.style.borderImageSource = 'url(' + url(k) + ')';
    el.style.borderImageSlice = String(P.c);
    size(); el.classList.add('on');
  }
  window.addEventListener('resize', size);

  const memo = {};
  async function load(id) {
    if (Object.prototype.hasOwnProperty.call(memo, id)) return memo[id];
    try {
      const r = await supabase.from('profiles').select('pf_cerceve').eq('id', id).maybeSingle();
      if (r.error) return null; memo[id] = (r.data && r.data.pf_cerceve) || null; return memo[id];
    } catch (_) { return null; }
  }
  let cur = null;
  async function onProfile() { const P = window.__lefProfile; if (!P) return; cur = P.id; const k = await load(P.id); if (cur === P.id) apply(k); }
  window.addEventListener('lef-profile', onProfile); onProfile();
  Object.assign(window.__lefPcer, {
    apply,
    restore: () => { const P = window.__lefProfile; apply(P ? memo[P.id] : null); },
    saved: (id, k) => { memo[id] = k || null; }
  });
})();
