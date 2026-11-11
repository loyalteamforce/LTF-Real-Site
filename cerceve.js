/* ============================================================
   PROFİL ÇERÇEVELERİ: banner + avatar çerçevesi (3 tasarım, görselden)
   - "Profil efekti" panelinin üstüne iki sekme ekler: Normal efektler / Çerçeve tasarımları
   - Seçim profiles.fx_cerceve sütununa kaydedilir: beyaz | kirmizi | mavi
   - Repo kökünde bu 6 görsel olmalı:
       cr-beyaz-banner.png   cr-beyaz-avatar.png
       cr-kirmizi-banner.png cr-kirmizi-avatar.png
       cr-mavi-banner.png    cr-mavi-avatar.png
   - ux.js içinden otomatik yüklenir.
   - Görsellerin koyu/yarı saydam ARKA PLANI yüklenirken temizlenir (sadece efektler kalır).
   - BANNER çerçevesi her ekran boyutunda parça parça çizilir: sol alttaki oyuk
     profil fotoğrafının etrafına oturur (germe yüzünden oluşan bozukluk yok).
   - Avatar çerçevesi fotoğrafın İÇİNDE durur.
   ============================================================ */
import { supabase } from './config.js';

// hole/out: avatar çerçevesi iç boşluk / halka dış yarıçapı (piksel)
// ban: banner PNG ölçüleri -> L,T,R,B = halka kutusu; bx = alt kenarın başladığı x; ly = sol kenarın bittiği y
const PAL = {
  beyaz:   { n: 'Beyaz Diken', hole: 102, out: 134, glow: 'rgba(255,255,255,.45)', ban: { L: 29, T: 27, R: 883, B: 352, bx: 372, ly: 314 } },
  kirmizi: { n: 'Kızıl Melek', hole: 108, out: 143, glow: 'rgba(255,50,85,.7)',   ban: { L: 19, T: 30, R: 886, B: 358, bx: 368, ly: 304 } },
  mavi:    { n: 'Mavi Zincir', hole: 104, out: 132, glow: 'rgba(80,150,255,.6)',  ban: { L: 30, T: 15, R: 874, B: 348, bx: 373, ly: 282 } }
};
const src = (k, t) => 'cr-' + k + '-' + t + '.png';

/* ---------- Arka plan temizleme: koyu yarı saydam pikselleri sil, avatar deliğinin içini boşalt ---------- */
const CV = {};      // temizlenmiş canvas'lar
const URLS = {};    // dataURL önbelleği
const url = (k, t) => {
  const c = CV[k + t]; if (!c) return src(k, t);
  return URLS[k + t] || (URLS[k + t] = c.toDataURL('image/png'));
};
function cleanImg(k, t) {
  return new Promise(res => {
    const im = new Image();
    im.onload = () => {
      try {
        const w = im.naturalWidth, h = im.naturalHeight;
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const x = c.getContext('2d'); x.drawImage(im, 0, 0);
        const id = x.getImageData(0, 0, w, h), d = id.data;
        const hole = t === 'avatar' ? PAL[k].hole : 0;
        for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
          const i = (y * w + xx) * 4; let a = d[i + 3];
          if (a === 0) continue;
          if (a < 255) {
            const mx = Math.max(d[i], d[i + 1], d[i + 2]);
            a *= Math.min(1, Math.max(0, (mx - 45) / 70));
          }
          if (hole) {
            const dd = Math.hypot(xx - w / 2 + .5, y - h / 2 + .5);
            a *= Math.min(1, Math.max(0, (dd - hole) / 6));
          }
          d[i + 3] = a;
        }
        x.putImageData(id, 0, 0);
        CV[k + t] = c;
      } catch (_) { /* temizlenemezse orijinal görsel kullanılır */ }
      res();
    };
    im.onerror = () => res();
    im.src = src(k, t);
  });
}
const ready = Promise.all(Object.keys(PAL).flatMap(k => ['avatar', 'banner'].map(t => cleanImg(k, t))));

/* ---------- Banner çerçevesini parça parça çiz (oyuk avatarın etrafına oturur) ---------- */
function drawBanner(canvas, k, Wd, Hd, cx, cy, r, dpr) {
  const B = PAL[k].ban, im = CV[k + 'banner'];
  if (!im) return null;
  const iw = im.width, ih = im.height;
  const c = 110, Gm = 55, tb = 40, cap = 35, capH = 40;
  const s = Wd / (B.R - B.L), g = Gm * s;
  const CW = Wd + 2 * g, CH = Hd + 2 * g;
  canvas.width = Math.round(CW * dpr); canvas.height = Math.round(CH * dpr);
  canvas.style.width = CW + 'px'; canvas.style.height = CH + 'px';
  const x = canvas.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.clearRect(0, 0, CW, CH); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  const P = (sx, sy, sw, sh, dx, dy, dw, dh) => {
    if (dw <= .5 || dh <= .5 || sw <= 0 || sh <= 0) return;
    const x0 = Math.max(sx, 0), y0 = Math.max(sy, 0), x1 = Math.min(sx + sw, iw), y1 = Math.min(sy + sh, ih);
    if (x1 <= x0 || y1 <= y0) return;
    const fx = dw / sw, fy = dh / sh;
    x.drawImage(im, x0, y0, x1 - x0, y1 - y0, dx + (x0 - sx) * fx, dy + (y0 - sy) * fy, (x1 - x0) * fx, (y1 - y0) * fy);
  };
  const LyD = g + Math.max(c * s * 1.4, Math.min(cy - .15 * r, Hd - 8));
  const bxD = g + Math.min(cx + .92 * r, Wd * .6);
  // köşeler
  P(B.L - Gm, B.T - Gm, c + Gm, c + Gm, 0, 0, (c + Gm) * s, (c + Gm) * s);
  P(B.R - c, B.T - Gm, c + Gm, c + Gm, g + Wd - c * s, 0, (c + Gm) * s, (c + Gm) * s);
  P(B.R - c, B.B - c, c + Gm, c + Gm, g + Wd - c * s, g + Hd - c * s, (c + Gm) * s, (c + Gm) * s);
  // üst ve sağ kenar
  P(B.L + c, B.T - Gm, (B.R - B.L) - 2 * c, Gm + tb, g + c * s, 0, Wd - 2 * c * s, (Gm + tb) * s);
  P(B.R - tb, B.T + c, tb + Gm, (B.B - B.T) - 2 * c, g + Wd - tb * s, g + c * s, (tb + Gm) * s, Hd - 2 * c * s);
  // alt kenar: avatarın hemen sağından başlar
  P(B.bx + cap, B.B - tb, (B.R - c) - (B.bx + cap), tb + Gm, bxD + cap * s, g + Hd - tb * s, (g + Wd - c * s) - (bxD + cap * s), (tb + Gm) * s);
  P(B.bx, B.B - tb, cap, tb + Gm, bxD, g + Hd - tb * s, cap * s, (tb + Gm) * s);
  // sol kenar: avatarın üstünde biter
  P(B.L - Gm, B.T + c, Gm + tb, B.ly - capH - (B.T + c), 0, g + c * s, (Gm + tb) * s, LyD - capH * s - (g + c * s));
  P(B.L - Gm, B.ly - capH, Gm + tb, capH, 0, LyD - capH * s, (Gm + tb) * s, capH * s);
  return { g, rad: c * s * .28 };
}

if (typeof document !== 'undefined') (async function main() {
  if (document.readyState === 'loading') await new Promise(r => document.addEventListener('DOMContentLoaded', r));
  const $ = (s, r) => (r || document).querySelector(s);
  const wrap = $('.pf-bwrap'), head = $('.pf-head'), av = $('#pfAv'), bn = $('#pfBan');
  if (!wrap || !head || !av || !bn) return;

  const css = document.createElement('style');
  css.textContent =
    '.cr-ban{position:absolute;z-index:2;pointer-events:none;display:none;animation:crGlow 3.6s ease-in-out infinite alternate}' +
    '.cr-av{position:absolute;z-index:4;pointer-events:none;overflow:hidden;border-radius:50%}' +
    '.cr-av img{position:absolute;left:50%;top:50%;max-width:none;transform:translate(-50%,-50%);animation:crGlow 3.6s ease-in-out infinite alternate}' +
    '@keyframes crGlow{from{filter:drop-shadow(0 0 2px var(--cg))}to{filter:drop-shadow(0 0 8px var(--cg))}}' +
    '@media (prefers-reduced-motion:reduce){.cr-ban,.cr-av img{animation:none}}' +
    '.cr-tabs{display:flex;gap:6px;margin:0 0 10px}.cr-tabs button{flex:1;height:34px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:transparent;color:#cfd3da;font:inherit;font-size:13px;cursor:pointer}' +
    '.cr-tabs button.on{background:#fff;color:#111;border-color:#fff;font-weight:600}' +
    '.cr-dot{position:relative;display:block;width:34px;height:34px;border-radius:50%;background:#2b2b31;overflow:hidden}.cr-dot img{position:absolute;left:50%;top:50%;max-width:none;transform:translate(-50%,-50%)}';
  document.head.appendChild(css);

  const banEl = document.createElement('canvas'); banEl.className = 'cr-ban'; banEl.setAttribute('aria-hidden', 'true'); wrap.appendChild(banEl);
  const avEl = document.createElement('div'); avEl.className = 'cr-av'; avEl.setAttribute('aria-hidden', 'true'); head.appendChild(avEl);

  let cur = null;
  function render() {
    const w = bn.clientWidth, h = bn.clientHeight;
    if (!cur || !w || !h) { banEl.style.display = 'none'; avEl.innerHTML = ''; bn.style.borderRadius = ''; return; }
    const P = PAL[cur];
    banEl.style.setProperty('--cg', P.glow); avEl.style.setProperty('--cg', P.glow);

    // avatarın banner'a göre konumu (oyuğu buna göre açıyoruz)
    const br = bn.getBoundingClientRect(), ar = av.getBoundingClientRect();
    const r = ar.width / 2, cx = ar.left + r - br.left - bn.clientLeft, cy = ar.top + ar.height / 2 - br.top - bn.clientTop;
    const res = drawBanner(banEl, cur, w, h, cx, cy, r, Math.min(window.devicePixelRatio || 1, 2));
    if (res) {
      banEl.style.display = 'block';
      banEl.style.left = (bn.offsetLeft + bn.clientLeft - res.g) + 'px';
      banEl.style.top = (bn.offsetTop + bn.clientTop - res.g) + 'px';
      bn.style.borderRadius = Math.max(10, res.rad) + 'px';
    } else banEl.style.display = 'none';

    // halka gövdesinin dış kenarı = fotoğraf kenarı  -> çerçeve fotoğrafın içinde kalır
    const d = av.offsetWidth, S = 380 * (d / 2) / P.out;
    avEl.style.left = av.offsetLeft + 'px'; avEl.style.top = av.offsetTop + 'px'; avEl.style.width = d + 'px'; avEl.style.height = av.offsetHeight + 'px';
    avEl.innerHTML = '<img alt="" src="' + url(cur, 'avatar') + '" style="width:' + S + 'px;height:' + S + 'px">';
  }
  const apply = k => { cur = PAL[k] ? k : null; render(); };
  if (window.ResizeObserver) { const ro = new ResizeObserver(render); ro.observe(bn); ro.observe(head); } else window.addEventListener('resize', render);
  ready.then(render);

  const memo = {}; let curId = null;
  async function load(id) {
    if (Object.prototype.hasOwnProperty.call(memo, id)) return memo[id];
    try {
      const r = await supabase.from('profiles').select('fx_cerceve').eq('id', id).maybeSingle();
      if (r.error) return null;
      memo[id] = (r.data && PAL[r.data.fx_cerceve]) ? r.data.fx_cerceve : null; return memo[id];
    } catch (_) { return null; }
  }
  async function onProfile() {
    const P = window.__lefProfile; if (!P) return;
    curId = P.id; const v = await load(P.id);
    if (curId === P.id) apply(v);
  }
  window.addEventListener('lef-profile', onProfile); onProfile();

  /* ---------- "Profil efekti" paneline sekmeler ---------- */
  function whenSheet(cb) {
    const s = $('.fx-sh'); if (s) return cb(s);
    const mo = new MutationObserver(() => { const s2 = $('.fx-sh'); if (s2) { mo.disconnect(); cb(s2); } });
    mo.observe(document.body, { childList: true });
  }
  whenSheet(sh => {
    const hd = $('.fx-hd', sh), grid = $('#fxGrid', sh), ft = $('.fx-ft', sh), msg = $('#fxMsg', sh);
    const tabs = document.createElement('div'); tabs.className = 'cr-tabs';
    tabs.innerHTML = '<button type="button" class="on">Normal efektler</button><button type="button">Çerçeve tasarımları</button>';
    hd.after(tabs);
    const cg = document.createElement('div'); cg.className = 'fx-grid cr-grid'; cg.style.display = 'none'; grid.after(cg);
    const cf = document.createElement('div'); cf.className = 'fx-ft'; cf.style.display = 'none';
    cf.innerHTML = '<button type="button" class="fx-b">İptal</button><button type="button" class="fx-b pri">Kaydet</button>';
    ft.after(cf);
    const cancelB = cf.firstChild, saveB = cf.lastChild;
    let pick = null, saved = null;

    [''].concat(Object.keys(PAL)).forEach(k => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'fx-it'; b.dataset.id = k;
      const i = document.createElement('i'); i.style.cssText = 'width:44px;height:44px';
      if (k) i.innerHTML = '<span class="cr-dot"><img class="cr-th" data-k="' + k + '" alt="" src="' + url(k, 'avatar') + '" style="width:' + (380 * 17 / PAL[k].out) + 'px;height:' + (380 * 17 / PAL[k].out) + 'px"></span>'; else i.textContent = '\u2013';
      const s = document.createElement('span'); s.textContent = k ? PAL[k].n : 'Yok';
      b.appendChild(i); b.appendChild(s); cg.appendChild(b);
    });
    ready.then(() => cg.querySelectorAll('.cr-th').forEach(im => { im.src = url(im.dataset.k, 'avatar'); }));
    const mark = () => cg.querySelectorAll('.fx-it').forEach(b => b.classList.toggle('on', (b.dataset.id || '') === (pick || '')));
    const say = (t, err) => { msg.textContent = t || ''; msg.className = err ? 'err' : ''; };
    function tab(n) {
      tabs.children[0].classList.toggle('on', !n); tabs.children[1].classList.toggle('on', !!n);
      grid.style.display = n ? 'none' : ''; ft.style.display = n ? 'none' : '';
      cg.style.display = n ? '' : 'none'; cf.style.display = n ? '' : 'none';
      say('');
    }
    tabs.children[0].addEventListener('click', () => { tab(0); apply(saved); });
    tabs.children[1].addEventListener('click', () => { tab(1); pick = saved; mark(); apply(pick); });
    cg.addEventListener('click', e => { const b = e.target.closest('.fx-it'); if (!b) return; pick = b.dataset.id || null; mark(); say(''); apply(pick); });
    cancelB.addEventListener('click', () => { sh.hidden = true; });

    saveB.addEventListener('click', async () => {
      saveB.disabled = true; say('Kaydediliyor...');
      try {
        const ss = await supabase.auth.getSession(), id = ss.data.session && ss.data.session.user.id;
        const r = await supabase.from('profiles').update({ fx_cerceve: pick }).eq('id', id);
        if (r.error) throw r.error;
        memo[id] = pick; saved = pick; say(''); sh.hidden = true;
      } catch (err) { say('Kaydedilemedi: ' + ((err && err.message) || 'hata'), true); }
      saveB.disabled = false;
    });

    // Panel açılınca ilk sekme; kapanınca kaydedilmemiş önizleme geri alınır
    new MutationObserver(async () => {
      const P = window.__lefProfile;
      if (!sh.hidden) { tab(0); if (P) { saved = await load(P.id); pick = saved; mark(); } }
      else if (P) apply(await load(P.id));
    }).observe(sh, { attributes: true, attributeFilter: ['hidden'] });
  });
})();
