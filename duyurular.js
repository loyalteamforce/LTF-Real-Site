/* ============================================================
   DUYURULAR: Ana Sayfa'da, kartın altında son duyurular.
   - Veriler Supabase'teki `announcements` tablosundan gelir (title, content, created_at).
   - Duyuru eklemek için: Supabase > Table Editor > announcements > Insert row.
     title zorunlu, content isteğe bağlı (satır atlamaları korunur). Silersen sitede de kaybolur.
   - Hiç duyuru yoksa kart hiç görünmez.
   - Bu cihazda henüz görülmemiş duyurularda "Yeni" işareti çıkar; karta dokununca okunmuş sayılır.
   - config.js bu dosyayı kendisi yükler; app.html'ye ekleme gerekmez.
   ============================================================ */
import { supabase } from './config.js';

(async function () {
  const home = document.getElementById('v-ana-sayfa');
  if (!home) return;   // bu sayfada Ana Sayfa yok (login, açılış vb.)

  const SHOW = 3, KEY = 'lef_duyuru_son';
  const css = document.createElement('style');
  css.textContent =
    '.dy-card{margin-top:14px;max-width:560px;padding:14px 16px;border-radius:18px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04)}' +
    '.dy-card[hidden]{display:none}' +
    '.dy-h{display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:11px;font-weight:700;letter-spacing:.16em;color:#9ca3af}' +
    '.dy-h svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}' +
    '.dy-it{border-top:1px solid rgba(255,255,255,.07)}.dy-it:first-of-type{border-top:0}' +
    '.dy-b{display:flex;align-items:center;gap:10px;width:100%;padding:11px 0;border:0;background:none;color:#f3f4f6;font:inherit;text-align:left;cursor:pointer}' +
    '.dy-b:focus-visible{outline:2px solid #fff;outline-offset:2px;border-radius:8px}' +
    '.dy-t{flex:1;min-width:0;font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.dy-it.open .dy-t{white-space:normal}' +
    '.dy-d{flex:none;font-size:12px;color:#8b919b;font-variant-numeric:tabular-nums}' +
    '.dy-new{flex:none;padding:2px 7px;border-radius:999px;background:#fff;color:#111;font-size:10px;font-weight:700;letter-spacing:.06em}' +
    '.dy-c{display:none;padding:0 0 12px;font-size:14px;line-height:1.6;color:#cfd3da;white-space:pre-line;overflow-wrap:anywhere}' +
    '.dy-it.open .dy-c{display:block}';
  document.head.appendChild(css);

  const card = document.createElement('section');
  card.className = 'dy-card'; card.hidden = true; card.setAttribute('aria-label', 'Duyurular');

  let rows = [];
  try {
    const { data, error } = await supabase.from('announcements').select('id,title,content,created_at').order('created_at', { ascending: false }).limit(SHOW);
    if (error) throw error;
    rows = (data || []).filter(r => r && r.title);
  } catch (_) { return; }
  if (!rows.length) return;

  let seen = 0; try { seen = Number(localStorage.getItem(KEY)) || 0; } catch (_) {}
  const date = s => { try { return new Date(s).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }); } catch (_) { return ''; } };

  const head = document.createElement('div'); head.className = 'dy-h';
  head.innerHTML = '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 7.5v3h2.5L11 14V4L5.5 7.5Z"/><path d="M13.5 6.5a3 3 0 0 1 0 5"/></svg><span>DUYURULAR</span>';
  card.appendChild(head);
  rows.forEach(r => {
    const it = document.createElement('div'); it.className = 'dy-it';
    const b = document.createElement('button'); b.type = 'button'; b.className = 'dy-b'; b.setAttribute('aria-expanded', 'false');
    const t = document.createElement('span'); t.className = 'dy-t'; t.textContent = r.title;
    const d = document.createElement('span'); d.className = 'dy-d'; d.textContent = date(r.created_at);
    b.appendChild(t);
    if (Number(r.id) > seen) { const n = document.createElement('span'); n.className = 'dy-new'; n.textContent = 'YENİ'; b.appendChild(n); }
    b.appendChild(d);
    const c = document.createElement('div'); c.className = 'dy-c'; c.textContent = r.content || '';
    b.addEventListener('click', () => {
      const on = it.classList.toggle('open'); b.setAttribute('aria-expanded', on ? 'true' : 'false');
      const n = b.querySelector('.dy-new'); if (n) n.remove();
      const top = Math.max(...rows.map(x => Number(x.id) || 0));
      if (!card.querySelector('.dy-new')) { try { localStorage.setItem(KEY, String(top)); } catch (_) {} }
    });
    it.appendChild(b); if (r.content) it.appendChild(c);
    card.appendChild(it);
  });
  card.hidden = false;

  // Kartın (ve kısayolların) hemen altına yerleştir; Ana Sayfa yeniden çizilirse tekrar takılır
  function mount() {
    const anchor = home.querySelector('.ks-row') || home.querySelector('.pc-wrap') || home.querySelector('h2');
    if (!anchor || card.previousElementSibling === anchor) return;
    anchor.after(card);
  }
  mount();
  new MutationObserver(mount).observe(home, { childList: true });
})();
