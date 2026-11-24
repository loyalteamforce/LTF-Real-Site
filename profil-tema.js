/* ============================================================
   PROFİL TEMALARI: profilin arka planı ve kartlarının rengi (Mağaza'dan alınır)
   - Seçim profiles.pf_tema sütunundadır; herkes başkasının temasını görür.
   - Arka plan desenleri (örümcek zambağı, hilal, sakura dalı, mürekkep, yaprak) kodla çizilir.
   - Mağaza ve "Profil tasarımı" paneli önizleme için window.__lefTema kullanır.
   - Yeni tema eklemek için TEMA listesine bir satır ve aşağıya bir desen çizimi ekle,
     SQL'deki pf_tema listesine anahtarı yaz (magaza-v2-kurulum.sql).
   - config.js bu dosyayı kendisi yükler.
   ============================================================ */
import { supabase } from './config.js';

const TAU = Math.PI * 2;
function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }

// bg: üstten alta arka plan, acc: vurgu, card: kart dolgusu, line: kart kenarı
const TEMA = {
  higanbana: { n: 'Kızıl Zambak',     bg: ['#541123', '#24060f', '#000000'], acc: '#e0435f', motif: 'lily' },
  gece:      { n: 'Gece Yarısı',      bg: ['#13244f', '#070d22', '#000000'], acc: '#9ec5ff', motif: 'moon' },
  sakura:    { n: 'Sakura Bahçesi',   bg: ['#5c2340', '#220b17', '#000000'], acc: '#ffb3cb', motif: 'sakura' },
  murekkep:  { n: 'Mürekkep Gölgesi', bg: ['#2e2e2e', '#111111', '#000000'], acc: '#e6e6e6', motif: 'ink' },
  zumrut:    { n: 'Zümrüt Orman',     bg: ['#0f4233', '#05170f', '#000000'], acc: '#7ee2a8', motif: 'leaf' }
};

/* ---------- desenler ---------- */
function lily(x, cx, cy, S, col, R) {     // örümcek zambağı: ince kıvrık taç yapraklar + uzun ercikler
  x.save(); x.translate(cx, cy); x.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const a = i * TAU / 6 + R() * .3, L = S * (.55 + R() * .15);
    x.save(); x.rotate(a); x.fillStyle = col; x.beginPath(); x.moveTo(0, 0);
    x.bezierCurveTo(L * .35, -S * .08, L * .8, -S * .02, L, S * .12); x.bezierCurveTo(L * .9, S * .02, L * .55, S * .06, 0, S * .03); x.fill(); x.restore();
  }
  x.strokeStyle = col; x.lineWidth = Math.max(1, S * .012);
  for (let i = 0; i < 7; i++) {
    const a = i * TAU / 7 + R() * .4, L = S * (1 + R() * .25);
    x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(Math.cos(a) * L * .6, Math.sin(a) * L * .6 - S * .25, Math.cos(a) * L, Math.sin(a) * L - S * .12); x.stroke();
    x.beginPath(); x.arc(Math.cos(a) * L, Math.sin(a) * L - S * .12, S * .018, 0, TAU); x.fill();
  }
  x.restore();
}
function blossom(x, cx, cy, r, col) {
  x.save(); x.translate(cx, cy); x.fillStyle = col;
  for (let i = 0; i < 5; i++) { x.save(); x.rotate(i * TAU / 5); x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(r * .6, -r * .3, r * .55, -r * .9, r * .12, -r); x.lineTo(0, -r * .82); x.lineTo(-r * .12, -r); x.bezierCurveTo(-r * .55, -r * .9, -r * .6, -r * .3, 0, 0); x.fill(); x.restore(); }
  x.restore();
}
function leaf(x, cx, cy, L, a, col) {
  x.save(); x.translate(cx, cy); x.rotate(a); x.fillStyle = col; x.beginPath(); x.moveTo(0, 0);
  x.bezierCurveTo(L * .3, -L * .28, L * .75, -L * .22, L, 0); x.bezierCurveTo(L * .75, L * .22, L * .3, L * .28, 0, 0); x.fill();
  x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = Math.max(1, L * .02); x.beginPath(); x.moveTo(0, 0); x.lineTo(L * .95, 0); x.stroke(); x.restore();
}
function paintMotif(c, k, W, H) {
  const T = TEMA[k], x = c.getContext('2d'), R = rng(91 + k.length * 7);
  c.width = W; c.height = H; x.clearRect(0, 0, W, H);
  const A = T.acc;
  if (T.motif === 'lily') {
    lily(x, W * .84, H * .14, W * .32, '#c0233f', R); lily(x, W * .1, H * .5, W * .22, '#a01a33', R); lily(x, W * .7, H * .78, W * .26, '#b11f38', R);
    x.strokeStyle = '#7a1428'; x.lineWidth = W * .006; [[.84, .14, .5], [.1, .5, .82], [.7, .78, 1]].forEach(([px, py, ey]) => { x.beginPath(); x.moveTo(W * px, H * py); x.quadraticCurveTo(W * (px + .05), H * (py + ey) / 2 + H * .1, W * (px - .02), H * ey + H * .2); x.stroke(); });
  } else if (T.motif === 'moon') {
    x.fillStyle = A; x.beginPath(); x.arc(W * .8, H * .13, W * .14, 0, TAU); x.fill();
    x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(W * .74, H * .1, W * .13, 0, TAU); x.fill(); x.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 90; i++) { const r = R() < .1 ? 2.4 : 1 + R(); x.globalAlpha = .4 + R() * .6; x.beginPath(); x.arc(R() * W, R() * H, r, 0, TAU); x.fill(); }
    x.globalAlpha = 1;
  } else if (T.motif === 'sakura') {
    const br = (x0, y0, x1, y1, w) => { x.strokeStyle = '#3a1222'; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo((x0 + x1) / 2 + w * 6, (y0 + y1) / 2 - w * 8, x1, y1); x.stroke(); };
    br(W * 1.02, H * .04, W * .45, H * .2, W * .022); br(W * .75, H * .1, W * .62, H * .3, W * .012); br(W * -.02, H * .7, W * .4, H * .82, W * .018);
    for (let i = 0; i < 26; i++) { const top = i < 18; blossom(x, top ? W * (.45 + R() * .55) : W * R() * .42, top ? H * (.03 + R() * .26) : H * (.66 + R() * .2), W * (.02 + R() * .025), R() < .3 ? '#ffd3e1' : A); }
    for (let i = 0; i < 30; i++) { blossom(x, R() * W, R() * H, W * .008, 'rgba(255,190,210,.8)'); }
  } else if (T.motif === 'ink') {
    x.fillStyle = A;
    const stroke = (x0, y0, x1, y1, w) => { const n = 22; for (let i = 0; i < n; i++) { const t = i / n, px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t + Math.sin(t * 5) * w, rr = w * Math.sin(Math.PI * t) * (.6 + R() * .5); x.beginPath(); x.arc(px, py, rr, 0, TAU); x.fill(); } };
    stroke(W * .35, H * .1, W * 1.05, H * .02, W * .03); stroke(W * -.05, H * .62, W * .55, H * .74, W * .025); stroke(W * .6, H * .9, W * 1.02, H * .8, W * .02);
    for (let i = 0; i < 40; i++) { x.beginPath(); x.arc(R() * W, R() * H, 1 + R() * W * .008, 0, TAU); x.fill(); }
  } else if (T.motif === 'leaf') {
    for (let i = 0; i < 22; i++) { const top = i < 13; leaf(x, top ? W * (.55 + R() * .5) : W * R() * .45, top ? H * R() * .3 : H * (.6 + R() * .35), W * (.1 + R() * .1), R() * TAU, R() < .5 ? A : '#2f8f66'); }
  }
}

/* ---------- uygulama ---------- */
const css = document.createElement('style');
css.textContent =
  '#pfBg.tm{background:var(--tm-bg)!important}' +
  '#pfBg.tm::after{content:"";position:absolute;inset:0;background:var(--tm-img) center top/100% auto no-repeat;opacity:.22;pointer-events:none}' +
  '#v-profil[data-tema] .bio,#v-profil[data-tema] .fr-card,#v-profil[data-tema] .fr-row,#v-profil[data-tema] .ps-card{background:color-mix(in srgb,var(--tm-acc) 9%,rgba(0,0,0,.35))!important;border-color:color-mix(in srgb,var(--tm-acc) 28%,transparent)!important}' +
  '#v-profil[data-tema] .pf-av{border-color:var(--tm-dark)!important}' +
  '#v-profil[data-tema] .bio-btn,#v-profil[data-tema] .fx-open,#v-profil[data-tema] .fr-btn{border-color:color-mix(in srgb,var(--tm-acc) 40%,transparent)}' +
  '#v-profil[data-tema] .pf-role{box-shadow:0 0 0 1px color-mix(in srgb,var(--tm-acc) 35%,transparent)}';
document.head.appendChild(css);

const imgCache = {};
function motifUrl(k) {
  if (imgCache[k]) return imgCache[k];
  const c = document.createElement('canvas'); paintMotif(c, k, 900, 1400);
  return (imgCache[k] = c.toDataURL('image/png'));
}
function swatch(canvas, k, w, h) {    // mağaza önizlemesi
  const T = TEMA[k]; if (!T) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  const x = canvas.getContext('2d'); x.scale(dpr, dpr);
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, T.bg[0]); g.addColorStop(.55, T.bg[1]); g.addColorStop(1, T.bg[2]);
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  const m = document.createElement('canvas'); paintMotif(m, k, 600, 930); x.globalAlpha = .4; x.drawImage(m, 0, 0, w, w * 930 / 600); x.globalAlpha = 1;
  x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(w * .08, h * .1, w * .84, h * .3);
  x.fillStyle = T.bg[2] === '#000000' ? '#000' : T.bg[2]; x.beginPath(); x.arc(w * .26, h * .42, h * .13, 0, TAU); x.fill();
  x.fillStyle = T.acc; x.globalAlpha = .18; x.fillRect(w * .08, h * .6, w * .84, h * .3); x.globalAlpha = 1;
  x.strokeStyle = T.acc; x.globalAlpha = .5; x.strokeRect(w * .08 + .5, h * .6 + .5, w * .84 - 1, h * .3 - 1); x.globalAlpha = 1;
}

window.__lefTema = { TEMA, swatch, preview() {}, restore() {}, saved() {} };
(function main() {
  const pv = document.getElementById('v-profil'), bg = document.getElementById('pfBg');
  if (!pv || !bg) return;
  const memo = {};
  function apply(k) {
    const T = TEMA[k];
    if (!T) { delete pv.dataset.tema; bg.classList.remove('tm'); return; }
    pv.dataset.tema = k;
    pv.style.setProperty('--tm-acc', T.acc); pv.style.setProperty('--tm-dark', T.bg[1]);
    bg.style.setProperty('--tm-bg', 'linear-gradient(180deg,' + T.bg[0] + ' 0%,' + T.bg[1] + ' 45%,' + T.bg[2] + ' 100%)');
    bg.style.setProperty('--tm-img', 'url(' + motifUrl(k) + ')');
    bg.classList.add('tm', 'on');
  }
  async function load(id) {
    if (Object.prototype.hasOwnProperty.call(memo, id)) return memo[id];
    try { const r = await supabase.from('profiles').select('pf_tema').eq('id', id).maybeSingle(); if (r.error) return null; memo[id] = (r.data && r.data.pf_tema) || null; return memo[id]; }
    catch (_) { return null; }
  }
  let cur = null;
  async function onProfile() { const P = window.__lefProfile; if (!P) return; cur = P.id; const k = await load(P.id); if (cur === P.id) apply(k); }
  window.addEventListener('lef-profile', onProfile); onProfile();
  Object.assign(window.__lefTema, {
    preview: apply,
    restore: () => { const P = window.__lefProfile; apply(P ? memo[P.id] : null); },
    saved: (id, k) => { memo[id] = k || null; }
  });
})();
