/* ============================================================
   KEŞFET · ÜYE ARAMA (profildeki "Üye ara" buraya taşındı)
   - Keşfet'in en üstünde arama kutusu: ad veya kullanıcı adıyla üye arar.
   - Arama boşken "Yeni üyeler" listelenir.
   - Bir üyeye dokununca profili açılır (app.html'deki 'lef-open-profile' olayı).
   - Keşfet'in oyun ekranı açıkken arama gizlenir, ana Keşfet ekranına dönünce geri gelir.
   - config.js bu dosyayı kendisi yükler.
   ============================================================ */
import { supabase } from './config.js';

(function () {
  const ex = document.getElementById('v-kesfet');
  if (!ex) return;
  const BASE = supabase.supabaseUrl + '/storage/v1/object/public/';
  const safe = u => (typeof u === 'string' && u.indexOf(BASE) === 0) ? u : null;

  const css = document.createElement('style');
  css.textContent =
    '.ka{position:sticky;top:env(safe-area-inset-top,0px);z-index:20;margin:4px -16px 14px;padding:10px 16px;background:#121212}' +
    '.ka .mg-search{margin:0}' +
    '.ka-h{margin:16px 2px 8px;font-size:13px;font-weight:600;color:#9ca3af}' +
    '.ka-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}' +
    '.ka-it{display:flex;align-items:center;gap:10px;min-width:0;padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#fff;font:inherit;font-size:14px;text-align:left;cursor:pointer}' +
    '.ka-it:hover{background:rgba(255,255,255,.09)}.ka-it:focus-visible{outline:2px solid #fff;outline-offset:2px}' +
    '.ka-it img,.ka-it i{width:36px;height:36px;border-radius:50%;object-fit:cover;background:#26262b;flex:none;display:grid;place-items:center;font-style:normal;font-weight:700;color:#9ca3af}' +
    '.ka-it span{min-width:0}.ka-it b{display:block;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.ka-it small{display:block;color:#9ca3af;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.ka-empty{padding:14px 4px;font-size:14px;color:#9ca3af}' +
    '.ka-games{margin:22px 2px 0;font-size:13px;font-weight:600;color:#9ca3af}';
  document.head.appendChild(css);

  const box = document.createElement('div');
  box.innerHTML =
    '<div class="ka"><label class="mg-search"><svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="8" cy="8" r="5.25"/><line x1="11.9" y1="11.9" x2="15.5" y2="15.5"/></svg>' +
    '<input id="kaQ" type="search" placeholder="Üye ara" autocomplete="off" maxlength="30" aria-label="Üye ara"></label></div>' +
    '<p class="ka-h" id="kaH">Yeni üyeler</p><div class="ka-list" id="kaL" role="list"></div>';
  const q = box.querySelector('#kaQ'), list = box.querySelector('#kaL'), head = box.querySelector('#kaH');
  const gamesH = document.createElement('p'); gamesH.className = 'ka-games'; gamesH.textContent = 'Oyunlar ve eğlence';

  function row(u) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ka-it'; b.setAttribute('role', 'listitem');
    const au = safe(u.avatar_url), av = document.createElement(au ? 'img' : 'i');
    if (au) { av.src = au; av.alt = ''; av.loading = 'lazy'; } else av.textContent = (u.display_name || u.username || '?').trim().charAt(0).toLocaleUpperCase('tr');
    const t = document.createElement('span'), n = document.createElement('b'), s = document.createElement('small');
    n.textContent = u.display_name || u.username; s.textContent = '@' + u.username + (u.class ? ' · ' + u.class + ' sınıfı' : '');
    t.append(n, s); b.append(av, t);
    b.addEventListener('click', () => window.dispatchEvent(new CustomEvent('lef-open-profile', { detail: { id: u.id } })));
    return b;
  }
  function show(rows, title, emptyText) {
    head.textContent = title; list.replaceChildren();
    if (!rows || !rows.length) { const p = document.createElement('p'); p.className = 'ka-empty'; p.textContent = emptyText; list.appendChild(p); return; }
    rows.forEach(u => list.appendChild(row(u)));
  }
  const COLS = 'id,username,display_name,avatar_url,class';
  let recent = null, tok = 0, timer = 0;
  async function loadRecent() {
    if (recent) { show(recent, 'Yeni üyeler', 'Henüz üye yok.'); return; }
    try { const r = await supabase.from('profiles').select(COLS).order('created_at', { ascending: false }).limit(6); recent = r.data || []; }
    catch (_) { recent = []; }
    if (!q.value.trim()) show(recent, 'Yeni üyeler', 'Üyeler yüklenemedi.');
  }
  q.addEventListener('input', () => {
    clearTimeout(timer);
    const v = q.value.trim().replace(/[^\p{L}\p{N}_.]/gu, '');
    if (v.length < 2) { loadRecent(); return; }
    const my = ++tok;
    timer = setTimeout(async () => {
      head.textContent = 'Aranıyor…';
      try {
        const r = await supabase.from('profiles').select(COLS).or('username.ilike.%' + v + '%,display_name.ilike.%' + v + '%').limit(20);
        if (my !== tok) return;
        show(r.error ? [] : r.data, 'Sonuçlar', r.error ? 'Arama başarısız. Tekrar dene.' : 'Kimse bulunamadı.');
      } catch (_) { if (my === tok) show([], 'Sonuçlar', 'Arama başarısız. Tekrar dene.'); }
    }, 250);
  });

  // Keşfet ana ekranındayken başlığın hemen altına yerleştir (extras.js ekranı yeniden çizerse aynı düğümler tekrar takılır)
  const nodes = [...box.children];
  function attach() {
    const grid = ex.querySelector('.x-grid'), h2 = ex.querySelector('h2');
    if (!grid || !h2) return;
    if (nodes[0].isConnected && nodes[0].previousElementSibling === h2 && grid.previousElementSibling === gamesH) return;
    h2.after(...nodes); grid.before(gamesH);
  }
  attach(); loadRecent();
  new MutationObserver(attach).observe(ex, { childList: true });
})();
