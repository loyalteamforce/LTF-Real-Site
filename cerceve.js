/* ============================================================
   PROFİL ÇERÇEVELERİ: banner + avatar çerçevesi (3 tasarım)
   - "Profil efekti" panelinin üstüne iki sekme ekler: Normal efektler / Çerçeve tasarımları
   - Seçim profiles.fx_cerceve sütununa kaydedilir: beyaz | kirmizi | mavi
   - ux.js içinden otomatik yüklenir; başka kuruluma gerek yok.
   Yeni çerçeve eklemek için PAL'a renk, banner() ve avatar() içine çizim ekle.
   ============================================================ */
import { supabase } from './config.js';

const PAL = {
  beyaz:   { n: 'Beyaz Diken', s: ['#ffffff', '#d7dbe2', '#636975'], line: '#f4f6fa', glow: 'rgba(255,255,255,.55)' },
  kirmizi: { n: 'Kızıl Melek', s: ['#ffe6ea', '#ff5470', '#a3122f'], line: '#ff8ea0', glow: 'rgba(255,50,85,.85)' },
  mavi:    { n: 'Mavi Zincir', s: ['#eaf3ff', '#6fa8ff', '#1b3f8c'], line: '#a9ccff', glow: 'rgba(80,150,255,.7)' }
};
let UID = 0;
const f = n => Math.round(n * 100) / 100;
const T = (x, y, a, s) => 'translate(' + f(x) + ' ' + f(y) + ') rotate(' + a + ')' + (s ? ' scale(' + s + ')' : '');
const star = (x, y, s) => { const h = s * .6, X = f(x), Y = f(y); return 'M' + X + ' ' + f(y - s) + 'Q' + X + ' ' + Y + ' ' + f(x + h) + ' ' + Y + 'Q' + X + ' ' + Y + ' ' + X + ' ' + f(y + s) + 'Q' + X + ' ' + Y + ' ' + f(x - h) + ' ' + Y + 'Q' + X + ' ' + Y + ' ' + X + ' ' + f(y - s) + 'Z'; };
const thorn = (x, y, a, l) => '<path d="M-7 0Q-2 -4 3 ' + (-l) + 'Q3.5 -7 9 0Z" transform="' + T(x, y, a) + '"/>';
const cross = (x, y, s) => [0, 90, 180, 270].map(a => '<path d="M-.15 -.18L-.38 -1L.38 -1L.15 -.18Z" transform="' + T(x, y, a, s) + '" stroke-width=".07"/>').join('') + '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(s * .2) + '"/>';
const feather = (x, y, a, l) => '<g transform="' + T(x, y, a) + '"><path d="M0 0Q' + f(l * .22) + ' ' + f(-l * .45) + ' 0 ' + (-l) + 'Q' + f(-l * .22) + ' ' + f(-l * .45) + ' 0 0Z"/><path d="M0 -2L0 ' + f(-l * .85) + '" fill="none"/></g>';

function defs(u, P) {
  return '<defs><linearGradient id="g' + u + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P.s[0] + '"/><stop offset=".5" stop-color="' + P.s[1] + '"/><stop offset="1" stop-color="' + P.s[2] + '"/></linearGradient>' +
    '<radialGradient id="b' + u + '" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="' + P.s[0] + '"/><stop offset="1" stop-color="' + P.s[2] + '"/></radialGradient>' +
    '<filter id="l' + u + '" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
}

function banner(k, w, h) {
  const u = ++UID, P = PAL[k], p = 10, R = Math.min(24, h / 5), cx = w / 2, cy = h / 2, L = p, Rt = w - p, Tp = p, Bt = h - p;
  const rect = (i, sw, st, ex) => '<rect x="' + (p + i) + '" y="' + (p + i) + '" width="' + (w - 2 * p - 2 * i) + '" height="' + (h - 2 * p - 2 * i) + '" rx="' + (R - i) + '" fill="none" stroke="' + st + '" stroke-width="' + sw + '" ' + (ex || '') + '/>';
  const k29 = R * .29, G = 'url(#g' + u + ')', B = 'url(#b' + u + ')';
  let g = defs(u, P);
  if (k === 'beyaz') {
    let th = '', n = 0, x, y;
    g += rect(0, 4.5, G) + rect(5, 1.2, P.line, 'opacity=".7"');
    for (x = p + R + 14; x < w - p - R - 10; x += 46, n++) { if (Math.abs(x - cx) < 28) continue; th += thorn(x, Tp, 0, 15 + (n % 3) * 6) + thorn(x + 20, Bt, 180, 13 + (n % 2) * 6); }
    for (y = p + R + 12, n = 0; y < h - p - R - 8; y += 40, n++) { if (Math.abs(y - cy) < 22) continue; th += thorn(L, y, 270, 14 + (n % 3) * 5) + thorn(Rt, y + 14, 90, 14 + (n % 2) * 6); }
    [[L + k29, Tp + k29, 315], [Rt - k29, Tp + k29, 45], [Rt - k29, Bt - k29, 135], [L + k29, Bt - k29, 225]].forEach(c => { th += thorn(c[0], c[1], c[2], 38) + thorn(c[0], c[1], c[2] - 30, 24) + thorn(c[0], c[1], c[2] + 30, 24); });
    g += '<g fill="' + G + '" stroke="#23262c" stroke-width=".5">' + th + '</g>';
    g += '<path fill="#fff" stroke="' + P.line + '" stroke-width=".6" d="' + star(cx, Tp, 13) + star(L, cy, 11) + star(Rt, cy, 11) + star(cx, Bt, 11) + '"/>';
  } else if (k === 'kirmizi') {
    let fe = '';
    g += rect(0, 2.2, G, 'filter="url(#l' + u + ')"') + rect(5, 1, P.line, 'opacity=".8"');
    [[L + k29, Tp + k29, 315], [Rt - k29, Tp + k29, 45], [Rt - k29, Bt - k29, 135], [L + k29, Bt - k29, 225]].forEach(c => { fe += feather(c[0], c[1], c[2] - 20, 46) + feather(c[0], c[1], c[2] + 16, 34); });
    [[-1, [292, 272, 252]], [1, [68, 88, 108]]].forEach(s2 => s2[1].forEach((an, i) => { fe += feather(cx + s2[0] * 18, Tp - 1, an, 50 - i * 9); }));
    fe += feather(w * .2, Tp, 80, 26) + feather(w * .8, Tp, -80, 26) + feather(L, h * .32, 345, 24) + feather(Rt, h * .68, 165, 24) + feather(w * .3, Bt, 100, 20) + feather(w * .72, Bt, -100, 20);
    g += '<g fill="rgba(255,110,135,.28)" stroke="' + P.line + '" stroke-width=".9" filter="url(#l' + u + ')">' + fe + '</g>';
    g += '<path fill="#fff" stroke="' + P.line + '" stroke-width=".6" d="' + star(cx, Tp, 11) + star(L, cy, 7) + star(Rt, cy, 7) + star(cx, Bt, 8) + star(w * .3, Bt, 4) + star(w * .7, Tp, 4) + '"/>';
  } else {
    g += rect(0, 3.6, G) + rect(4.5, 1, P.line, 'opacity=".7"');
    let ch = '', i, x;
    for (i = 0, x = cx - 46; x > cx - Math.min(w * .32, 210); x -= 12, i++) { const e = i % 2 ? [3, 6] : [6, 3]; ch += '<ellipse cx="' + f(x) + '" cy="' + Tp + '" rx="' + e[0] + '" ry="' + e[1] + '"/><ellipse cx="' + f(w - x) + '" cy="' + Tp + '" rx="' + e[0] + '" ry="' + e[1] + '"/>'; }
    g += '<g fill="none" stroke="' + G + '" stroke-width="1.5">' + ch + '</g>';
    let st = '';
    [[L + k29, Tp + k29], [Rt - k29, Tp + k29], [Rt - k29, Bt - k29], [L + k29, Bt - k29], [w * .22, Bt], [w * .78, Bt], [L, h * .3], [Rt, h * .3]].forEach(c => { st += '<circle cx="' + f(c[0]) + '" cy="' + f(c[1]) + '" r="3.2"/>'; });
    g += '<g fill="' + B + '" stroke="#0d2250" stroke-width=".4">' + st + '</g>';
    g += '<g fill="' + G + '" stroke="#0d2250" stroke-width=".07">' + cross(cx, Tp, 19) + cross(L, cy, 14) + cross(Rt, cy, 14) + '</g>';
  }
  return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="overflow:visible">' + g + '</svg>';
}

function avatar(k) {
  const u = ++UID, P = PAL[k], G = 'url(#g' + u + ')', B = 'url(#b' + u + ')';
  const pt = (phi, r) => [50 + r * Math.sin(phi * Math.PI / 180), 50 - r * Math.cos(phi * Math.PI / 180)];
  const ring = (r, sw, st, ex) => '<circle cx="50" cy="50" r="' + r + '" fill="none" stroke="' + st + '" stroke-width="' + sw + '" ' + (ex || '') + '/>';
  let g = defs(u, P), i, a;
  if (k === 'beyaz') {
    let th = '';
    g += ring(52.5, 3.4, G) + ring(49.6, .9, P.line, 'opacity=".7"');
    for (i = 0; i < 10; i++) { a = i * 36 + 18; const c = pt(a, 52.5); th += thorn(c[0], c[1], a, 12 + (i % 3) * 5); }
    g += '<g fill="' + G + '" stroke="#23262c" stroke-width=".5">' + th + '</g>';
    const s1 = pt(180, 58), s2 = pt(312, 58), s3 = pt(48, 58);
    g += '<path fill="#fff" stroke="' + P.line + '" stroke-width=".6" d="' + star(s1[0], s1[1], 9) + star(s2[0], s2[1], 6) + star(s3[0], s3[1], 5) + '"/>';
  } else if (k === 'kirmizi') {
    let fe = '';
    g += ring(52.5, 2.2, G, 'filter="url(#l' + u + ')"') + ring(49.5, .9, P.line, 'opacity=".8"');
    [-65, 25, 115, 205, 300].forEach((p2, j) => { const c = pt(p2, 52); fe += feather(c[0], c[1], p2 + 78, j % 2 ? 30 : 38); });
    g += '<g fill="rgba(255,110,135,.28)" stroke="' + P.line + '" stroke-width=".9" filter="url(#l' + u + ')">' + fe + '</g>';
    const s1 = pt(180, 57), s2 = pt(330, 57);
    g += '<path fill="#fff" stroke="' + P.line + '" stroke-width=".6" d="' + star(s1[0], s1[1], 8) + star(s2[0], s2[1], 5) + '"/>';
  } else {
    let st = '', ch = '';
    g += ring(52.5, 3, G) + ring(49.6, .8, P.line, 'opacity=".7"');
    for (i = 0; i < 8; i++) { const c = pt(i * 45 + 22, 52.5); st += '<circle cx="' + f(c[0]) + '" cy="' + f(c[1]) + '" r="2.5"/>'; }
    for (i = 0, a = 95; a < 175; a += 10, i++) { const c = pt(a, 61), e = i % 2 ? [2.6, 5] : [5, 2.6]; ch += '<ellipse rx="' + e[0] + '" ry="' + e[1] + '" transform="' + T(c[0], c[1], a - 90) + '"/>'; }
    const c1 = pt(180, 59), c2 = pt(300, 58);
    g += '<g fill="none" stroke="' + G + '" stroke-width="1.4">' + ch + '</g><g fill="' + B + '" stroke="#0d2250" stroke-width=".4">' + st + '</g>';
    g += '<g fill="' + G + '" stroke="#0d2250" stroke-width=".07">' + cross(c1[0], c1[1], 14) + cross(c2[0], c2[1], 8) + '</g>';
  }
  return '<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow:visible">' + g + '</svg>';
}

if (typeof document !== 'undefined') (async function main() {
  if (document.readyState === 'loading') await new Promise(r => document.addEventListener('DOMContentLoaded', r));
  const $ = (s, r) => (r || document).querySelector(s);
  const wrap = $('.pf-bwrap'), head = $('.pf-head'), av = $('#pfAv'), bn = $('#pfBan');
  if (!wrap || !head || !av || !bn) return;

  const css = document.createElement('style');
  css.textContent =
    '.cr-ban{position:absolute;inset:0;z-index:2;pointer-events:none}.cr-av{position:absolute;z-index:4;pointer-events:none}' +
    '.cr-ban svg,.cr-av svg{display:block;animation:crGlow 3.6s ease-in-out infinite alternate}' +
    '@keyframes crGlow{from{filter:drop-shadow(0 0 2px var(--cg))}to{filter:drop-shadow(0 0 7px var(--cg))}}' +
    '@media (prefers-reduced-motion:reduce){.cr-ban svg,.cr-av svg{animation:none}}' +
    '.cr-tabs{display:flex;gap:6px;margin:0 0 10px}.cr-tabs button{flex:1;height:34px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:transparent;color:#cfd3da;font:inherit;font-size:13px;cursor:pointer}' +
    '.cr-tabs button.on{background:#fff;color:#111;border-color:#fff;font-weight:600}' +
    '.cr-dot{position:relative;display:block;width:32px;height:32px;border-radius:50%;background:#2b2b31}.cr-dot svg{position:absolute;inset:0}';
  document.head.appendChild(css);

  const banEl = document.createElement('div'); banEl.className = 'cr-ban'; banEl.setAttribute('aria-hidden', 'true'); wrap.appendChild(banEl);
  const avEl = document.createElement('div'); avEl.className = 'cr-av'; avEl.setAttribute('aria-hidden', 'true'); head.appendChild(avEl);

  let cur = null;
  function render() {
    const w = bn.clientWidth, h = bn.clientHeight;
    banEl.style.setProperty('--cg', cur ? PAL[cur].glow : 'transparent');
    avEl.style.setProperty('--cg', cur ? PAL[cur].glow : 'transparent');
    banEl.innerHTML = cur && w && h ? banner(cur, w, h) : '';
    avEl.innerHTML = cur ? avatar(cur) : '';
    avEl.style.left = av.offsetLeft + 'px'; avEl.style.top = av.offsetTop + 'px'; avEl.style.width = av.offsetWidth + 'px'; avEl.style.height = av.offsetHeight + 'px';
  }
  const apply = k => { cur = PAL[k] ? k : null; render(); };
  if (window.ResizeObserver) { const ro = new ResizeObserver(render); ro.observe(bn); ro.observe(head); } else window.addEventListener('resize', render);

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
      if (k) i.innerHTML = '<span class="cr-dot">' + avatar(k) + '</span>'; else i.textContent = '\u2013';
      const s = document.createElement('span'); s.textContent = k ? PAL[k].n : 'Yok';
      b.appendChild(i); b.appendChild(s); cg.appendChild(b);
    });
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

export { PAL, banner, avatar };
