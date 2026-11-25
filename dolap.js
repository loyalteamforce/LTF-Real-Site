/* ============================================================
   PROFİL TASARIMI (Dolabım): sadece Mağaza'dan aldıkların
   - Kendi profilinde "Profil tasarımı" düğmesi çıkar. Panelde sahip olduğun çerçeveler, temalar ve rozetler
     listelenir; dokununca canlı önizlenir, "Kaydet" ile profiline uygulanır.
   - Hiçbir şeyin yoksa Mağaza'ya yönlendirir. Satın almadan takmayı sunucu da engeller.
   - Çizimler: cerceve.js (window.__crDraw), profil-tema.js (window.__lefTema), magaza.js (window.__lefRozet).
   - config.js bu dosyayı kendisi yükler.
   ============================================================ */
import { supabase } from './config.js';

(async function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const info = $('.pf-info'); if (!info) return;
  let uid = null;
  try { const ss = await supabase.auth.getSession(); uid = ss.data.session && ss.data.session.user.id; } catch (_) {}
  if (!uid) return;

  const COL = { cerceve: 'fx_cerceve', tema: 'pf_tema', rozet: 'rozet' };
  const TITLE = { cerceve: 'Banner çerçeveleri', tema: 'Profil temaları', rozet: 'Rozetler' };
  const css = document.createElement('style');
  css.textContent =
    '.dl-open{margin-top:8px}' +
    '.dl-sh{position:fixed;inset:0;z-index:76;display:flex;align-items:flex-end;justify-content:center}.dl-sh[hidden]{display:none}' +
    '.dl-bd{position:absolute;inset:0;background:rgba(0,0,0,.55)}' +
    '.dl-card{position:relative;width:min(100%,520px);max-height:88dvh;overflow-y:auto;padding:16px 16px calc(14px + env(safe-area-inset-bottom));border-radius:24px 24px 0 0;background:#0e0e10;border:1px solid rgba(255,255,255,.1);color:#fff}' +
    '@media (min-width:700px){.dl-sh{align-items:center}.dl-card{border-radius:24px}}' +
    '.dl-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px;font-size:16px}' +
    '.dl-hd span{font-size:12px;color:#9ca3af}.dl-hd span.err{color:#ffb3b3}' +
    '.dl-h{margin:14px 2px 8px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af}' +
    '.dl-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}' +
    '.dl-g.wide{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}' +
    '.dl-it{display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 6px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:#e5e7eb;font:inherit;font-size:12px;cursor:pointer;min-width:0}' +
    '.dl-it.on{border-color:#fff;background:rgba(255,255,255,.1)}' +
    '.dl-it:focus-visible{outline:2px solid #fff;outline-offset:2px}' +
    '.dl-it canvas{display:block;max-width:100%}.dl-it .tk{width:34px;height:34px}.dl-it .tk svg{display:block;width:100%;height:100%}' +
    '.dl-it .no{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;border:1px dashed rgba(255,255,255,.3);color:#9ca3af}' +
    '.dl-it b{font-weight:600;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.dl-empty{padding:18px 6px;text-align:center;font-size:14px;color:#9ca3af;line-height:1.5}' +
    '.dl-ft{display:flex;justify-content:flex-end;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.08)}' +
    '.dl-b{height:40px;padding:0 18px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:transparent;color:#fff;font:inherit;font-size:14px;cursor:pointer}' +
    '.dl-b.pri{background:#fff;color:#111;border-color:#fff;font-weight:600}.dl-b:disabled{opacity:.5}';
  document.head.appendChild(css);

  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'fx-open dl-open'; btn.hidden = true; btn.textContent = 'Profil tasarımı';
  info.appendChild(btn);

  const sh = document.createElement('div');
  sh.className = 'dl-sh ux-noswipe'; sh.hidden = true;
  sh.innerHTML = '<div class="dl-bd"></div><div class="dl-card" role="dialog" aria-modal="true" aria-label="Profil tasarımı">' +
    '<div class="dl-hd"><b>Profil tasarımı</b><span id="dlMsg" role="status"></span></div><div id="dlBody"></div>' +
    '<div class="dl-ft"><button type="button" class="dl-b" id="dlShop">Mağazaya git</button><button type="button" class="dl-b" id="dlCancel">İptal</button><button type="button" class="dl-b pri" id="dlSave">Kaydet</button></div></div>';
  document.body.appendChild(sh);
  const body = $('#dlBody', sh), msg = $('#dlMsg', sh), saveB = $('#dlSave', sh);
  const say = (t, err) => { msg.textContent = t || ''; msg.className = err ? 'err' : ''; };

  let saved = {}, pick = {}, names = {};
  const P = () => window.__lefProfile;
  window.addEventListener('lef-profile', () => { const p = P(); btn.hidden = !(p && p.mine); });
  if (P()) btn.hidden = !P().mine;

  function thumb(tur, k) {
    if (!k) { const n = document.createElement('span'); n.className = 'no'; n.textContent = '–'; return n; }
    if (tur === 'rozet') { const d = document.createElement('span'); d.className = 'tk'; d.innerHTML = window.__lefRozet && window.__lefRozet.ROZET[k] ? window.__lefRozet.ROZET[k].svg : ''; return d; }
    const c = document.createElement('canvas');
    if (tur === 'cerceve' && window.__crDraw) window.__crDraw.preview(c, k, 150, 88);
    if (tur === 'tema' && window.__lefTema) window.__lefTema.swatch(c, k, 64, 80);
    return c;
  }
  function previewAll() {
    if (window.__lefCerceve) window.__lefCerceve.preview(pick.cerceve || null);
    if (window.__lefTema) window.__lefTema.preview(pick.tema || null);
    if (window.__lefRozet) window.__lefRozet.preview(pick.rozet || null);
  }
  function restoreAll() {
    if (window.__lefCerceve) window.__lefCerceve.restore();
    if (window.__lefTema) window.__lefTema.restore();
    if (window.__lefRozet) window.__lefRozet.restore();
  }
  function draw(own) {
    body.replaceChildren();
    const any = Object.keys(COL).some(t => own[t].length);
    if (!any) { body.innerHTML = '<p class="dl-empty">Henüz Mağaza\'dan bir şey almadın.<br>Çerçeve, tema ve rozetler Mağaza\'da.</p>'; saveB.disabled = true; return; }
    saveB.disabled = false;
    Object.keys(COL).forEach(tur => {
      if (!own[tur].length) return;
      const h = document.createElement('p'); h.className = 'dl-h'; h.textContent = TITLE[tur]; body.appendChild(h);
      const g = document.createElement('div'); g.className = 'dl-g' + (tur === 'cerceve' ? ' wide' : ''); g.setAttribute('role', 'group'); g.setAttribute('aria-label', TITLE[tur]);
      [''].concat(own[tur]).forEach(k => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'dl-it'; b.dataset.t = tur; b.dataset.k = k;
        b.setAttribute('aria-pressed', String((pick[tur] || '') === k)); b.classList.toggle('on', (pick[tur] || '') === k);
        b.appendChild(thumb(tur, k)); const nm = document.createElement('b'); nm.textContent = k ? (names[tur + '-' + k] || k) : 'Yok'; b.appendChild(nm);
        g.appendChild(b);
      });
      body.appendChild(g);
    });
  }
  body.addEventListener('click', e => {
    const b = e.target.closest('.dl-it'); if (!b) return;
    pick[b.dataset.t] = b.dataset.k || null; say('');
    body.querySelectorAll('.dl-it[data-t="' + b.dataset.t + '"]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
    previewAll();
  });

  async function open() {
    const p = P(); if (!p || !p.mine) return;
    say('Yükleniyor…'); sh.hidden = false; body.replaceChildren();
    try {
      const [o, pr, it] = await Promise.all([
        supabase.from('magaza_sahip').select('urun_id').eq('user_id', uid),
        supabase.from('profiles').select('fx_cerceve,pf_tema,rozet').eq('id', uid).maybeSingle(),
        supabase.from('magaza_urunler').select('id,ad')
      ]);
      if (o.error || pr.error) throw o.error || pr.error;
      names = {}; (it.data || []).forEach(r => { names[r.id] = r.ad; });
      const own = { cerceve: [], tema: [], rozet: [] };
      (o.data || []).forEach(r => { const i = r.urun_id.indexOf('-'), t = r.urun_id.slice(0, i); const k = r.urun_id.slice(i + 1); if (t === 'cerceve' && window.__crDraw && !window.__crDraw.DES[k]) return; if (own[t]) own[t].push(k); });
      const fc = pr.data && pr.data.fx_cerceve; saved = { cerceve: fc && (!window.__crDraw || window.__crDraw.DES[fc]) ? fc : null, tema: pr.data && pr.data.pf_tema || null, rozet: pr.data && pr.data.rozet || null };
      pick = Object.assign({}, saved); say(''); draw(own);
    } catch (_) { say('Yüklenemedi. Tekrar dene.', true); }
  }
  function close(revert) { sh.hidden = true; if (revert) restoreAll(); }
  btn.addEventListener('click', open);
  $('.dl-bd', sh).addEventListener('click', () => close(true));
  $('#dlCancel', sh).addEventListener('click', () => close(true));
  $('#dlShop', sh).addEventListener('click', () => { close(true); location.hash = 'magaza'; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sh.hidden) close(true); });
  saveB.addEventListener('click', async () => {
    const upd = {}; Object.keys(COL).forEach(t => { if ((pick[t] || null) !== (saved[t] || null)) upd[COL[t]] = pick[t] || null; });
    if (!Object.keys(upd).length) { close(false); return; }
    saveB.disabled = true; say('Kaydediliyor…');
    const r = await supabase.from('profiles').update(upd).eq('id', uid);
    saveB.disabled = false;
    if (r.error) { say(/owned_required/.test(r.error.message || '') ? 'Bunu takmak için önce Mağaza\'dan almalısın.' : 'Kaydedilemedi. Tekrar dene.', true); return; }
    const MOD = { cerceve: window.__lefCerceve, tema: window.__lefTema, rozet: window.__lefRozet };
    Object.keys(COL).forEach(t => { if (COL[t] in upd && MOD[t]) MOD[t].saved(uid, pick[t] || null); });
    saved = Object.assign({}, pick); say(''); close(false);
  });
})();
