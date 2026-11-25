/* ============================================================
   BANNER ÇERÇEVELERİ: banner + avatar çerçevesi (7 tasarım, resimleri cerceveler/ klasöründe)
   - Kristal Buz, Gotik Zincir, Mor Melek, Turkuaz Damla, Mavi Nilüfer, Ay Balığı, Mor Neon.
   - Çerçevenin ANA ÇİZGİSİ her ekran boyutunda tam banner'ın kenarına (ve avatarın dış kenarına) oturur.
     Köşe ve orta süsler oranını korur, aradaki düz kenarlar banner'ın boyuna göre uzar;
     banner'ın köşe yuvarlaklığı da çerçevenin köşesine eşitlenir.
   - Seçim profiles.fx_cerceve sütunundadır. Takmak için önce Mağaza'dan almak gerekir (cerceve-yeni-kurulum.sql).
   - Mağaza ve "Profil tasarımı" paneli aynı çizimleri kullanır: window.__crDraw.
   - Yeni tasarım: cerceveler/ANAHTAR-ban.webp + ANAHTAR-ring.webp ekle, DES'e ölçülerini yaz,
     SQL'deki fx_cerceve listesine anahtarı ekle.
   - Animasyon ve parıltı yok: çerçeveler resimdeki gibi durur.
   - ux.js içinden otomatik yüklenir.
   ============================================================ */
import { supabase } from './config.js';

const TAU = Math.PI * 2;

function rr(x, X, Y, W, H, R) {
  R = Math.max(0, Math.min(R, W / 2, H / 2));
  x.beginPath(); x.moveTo(X + R, Y);
  x.arcTo(X + W, Y, X + W, Y + H, R); x.arcTo(X + W, Y + H, X, Y + H, R);
  x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath();
}

/* ---------- Çerçeveler (cerceveler/ klasöründeki resimler) ----------
   W0, H0: resimdeki ana çizginin (raya) genişliği / yüksekliği, pad: ana çizginin dışına taşan süs payı,
   rc: ana çizginin köşe yuvarlaklığı, cs: köşe süsünün boyu, cw / ch: üst-alt ve yan orta süsün yarı boyu,
   rr: avatar halkasının ana çizgi yarıçapı (halka resmi kare, merkezde). Hepsi resim pikseli cinsinden. */
const DES = {
  buz:     { n: 'Kristal Buz',   W0: 798, H0: 285, pad: 34, rc: 22, cs: 80, cw: 62, ch: 38, rr: 121 },
  gotik:   { n: 'Gotik Zincir',  W0: 908, H0: 390, pad: 30, rc: 8,  cs: 95, cw: 62, ch: 38, rr: 145 },
  melek:   { n: 'Mor Melek',     W0: 820, H0: 290, pad: 30, rc: 40, cs: 75, cw: 62, ch: 38, rr: 158 },
  damla:   { n: 'Turkuaz Damla', W0: 790, H0: 282, pad: 24, rc: 30, cs: 70, cw: 62, ch: 38, rr: 126 },
  nilufer: { n: 'Mavi Nilüfer',  W0: 798, H0: 276, pad: 26, rc: 36, cs: 85, cw: 62, ch: 38, rr: 131 },
  balik:   { n: 'Ay Balığı',     W0: 804, H0: 281, pad: 32, rc: 28, cs: 90, cw: 62, ch: 38, rr: 125 },
  neon:    { n: 'Mor Neon',      W0: 924, H0: 367, pad: 30, rc: 22, cs: 60, cw: 62, ch: 38, rr: 157 }
};
const KEYS = Object.keys(DES);
const BASE = new URL('./cerceveler/', import.meta.url).href;
const IMG = {};
function img(k, t) {
  const id = k + '-' + t; let im = IMG[id];
  if (!im) {
    im = IMG[id] = new Image(); im.decoding = 'async'; im.wait = [];
    im.onload = () => { const w = im.wait; im.wait = []; w.forEach(f => f()); window.dispatchEvent(new CustomEvent('lef-cr-img')); };
    im.src = BASE + id + '.webp';
  }
  return im;
}
const ready = im => im.complete && im.naturalWidth > 0;
// Çerçevenin banner'a göre ölçeği: ana çizgi tam banner kenarına oturur, köşe / orta süsler oranını korur,
// aradaki düz kenar parçaları banner'ın boyuna göre uzar.
const scaleFor = (D, w, h) => Math.min(w / D.W0, h / D.H0) * 1.02;
const radiusFor = (D, w, h) => D.rc * scaleFor(D, w, h);
function slices(total, pad, c, mid, dst, s, ox) {   // kaynak ve hedef kesim noktaları (5 parça)
  const S = [0, pad + c, pad + total / 2 - mid, pad + total / 2 + mid, pad + total - c, total + 2 * pad + 1];
  const P = pad * s, D = [ox - P, ox + c * s, ox + dst / 2 - mid * s, ox + dst / 2 + mid * s, ox + dst - c * s, ox + dst + P];
  return [S, D];
}
function ban(x, k, b) {
  const D = DES[k], im = img(k, 'ban'); if (!ready(im)) return false;
  const s = scaleFor(D, b.w, b.h);
  const [SX, DX] = slices(D.W0, D.pad, D.cs, D.cw, b.w, s, b.x), [SY, DY] = slices(D.H0, D.pad, D.cs, D.ch, b.h, s, b.y);
  // kaynak tam olarak resmin boyutuna otursun
  SX[5] = im.naturalWidth; SY[5] = im.naturalHeight;
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    if (i > 0 && i < 4 && j > 0 && j < 4) continue;   // iç boşluk (banner resmi görünür)
    const sw = SX[i + 1] - SX[i], sh = SY[j + 1] - SY[j], dw = DX[i + 1] - DX[i], dh = DY[j + 1] - DY[j];
    if (sw > 0 && sh > 0 && dw > .5 && dh > .5) x.drawImage(im, SX[i], SY[j], sw, sh, DX[i], DY[j], dw, dh);
  }
  return true;
}
function ring(x, k, cx, cy, r) {
  const D = DES[k], im = img(k, 'ring'); if (!ready(im)) return false;
  const q = r / D.rr, S = im.naturalWidth * q;
  x.drawImage(im, cx - S / 2, cy - S / 2, S, S);
  return true;
}

/* ---------- Banner ve avatar çizimi ---------- */
// Wd, Hd: banner'ın dış ölçüleri. Döner: { g } = çerçevenin banner dışına taşma payı, { r } = banner köşe yuvarlaklığı
function drawBanner(canvas, k, Wd, Hd, rad, dpr) {
  const D = DES[k]; if (!D) return null;
  const s = scaleFor(D, Wd, Hd), g = Math.ceil(D.pad * s + 4);
  const CW = Wd + 2 * g, CH = Hd + 2 * g;
  canvas.width = Math.round(CW * dpr); canvas.height = Math.round(CH * dpr);
  canvas.style.width = CW + 'px'; canvas.style.height = CH + 'px';
  const x = canvas.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, CW, CH);
  x.imageSmoothingQuality = 'high';
  const ok = ban(x, k, { x: g, y: g, w: Wd, h: Hd });
  return { g, r: radiusFor(D, Wd, Hd), ok };
}
// d: avatarın dış çapı. Döner: { m } = halkanın avatar dışına taşma payı
function drawRing(canvas, k, d, dpr) {
  const D = DES[k]; if (!D) return null;
  const im = img(k, 'ring'), q = (d / 2) / D.rr, full = (im.naturalWidth || (D.rr + 40) * 2) * q;
  const m = Math.ceil(Math.max(0, (full - d) / 2) + 3), C = d + 2 * m;
  canvas.width = canvas.height = Math.round(C * dpr); canvas.style.width = canvas.style.height = C + 'px';
  const x = canvas.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, C, C);
  x.imageSmoothingQuality = 'high';
  const ok = ring(x, k, C / 2, C / 2, d / 2);
  return { m, ok };
}
// Mağaza / panel önizlemesi: koyu örnek banner + avatar (resim henüz inmediyse inince kendini yeniden çizer)
function preview(canvas, k, w, h, dpr) {
  const D = DES[k]; if (!D) return;
  dpr = dpr || Math.min(window.devicePixelRatio || 1, 2);
  const bi = img(k, 'ban'), ri = img(k, 'ring');
  if (!ready(bi) || !ready(ri)) { const again = () => { if (ready(bi) && ready(ri)) preview(canvas, k, w, h, dpr); }; bi.wait.push(again); ri.wait.push(again); }
  const bw = w * .8, bh = bw / 2.8, bx = (w - bw) / 2, by = h * .12, s = scaleFor(D, bw, bh), rad = D.rc * s;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  const x = canvas.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h); x.imageSmoothingQuality = 'high';
  const gr = x.createLinearGradient(bx, by, bx + bw, by + bh); gr.addColorStop(0, '#2b2b34'); gr.addColorStop(1, '#1d1d24');
  rr(x, bx, by, bw, bh, rad); x.fillStyle = gr; x.fill();
  ban(x, k, { x: bx, y: by, w: bw, h: bh });
  const ad = bh * .8, acx = bx + bw * .06 + ad / 2, acy = by + bh - ad * .05;
  x.fillStyle = '#26262b'; x.beginPath(); x.arc(acx, acy, ad / 2, 0, TAU); x.fill();
  ring(x, k, acx, acy, ad / 2);
}
window.__crDraw = { DES, KEYS, drawBanner, drawRing, preview, name: k => (DES[k] ? DES[k].n : '') };

// Animasyon yok: çerçeve resmi olduğu gibi görünür (parlama / pırıltı yok)
function mkAnim(el) { return { el, base: null }; }
function setAnimBase(A, base) { A.base = base; A.el.width = base.width; A.el.height = base.height; }
function paintAnim(A) {
  if (!A.base) return;
  const x = A.el.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, A.el.width, A.el.height); x.drawImage(A.base, 0, 0);
}
if (typeof document !== 'undefined') (async function main() {
  if (document.readyState === 'loading') await new Promise(r => document.addEventListener('DOMContentLoaded', r));
  const $ = (s, r) => (r || document).querySelector(s);
  const wrap = $('.pf-bwrap'), head = $('.pf-head'), av = $('#pfAv'), bn = $('#pfBan');
  if (!wrap || !head || !av || !bn) return;

  const css = document.createElement('style');
  css.textContent =
    '.cr-ban{position:absolute;z-index:2;pointer-events:none;display:none}' +
    '.cr-av{position:absolute;z-index:4;pointer-events:none;display:none}' +
    '.cr-av canvas{position:absolute;left:0;top:0;display:block}';
  document.head.appendChild(css);

  const banEl = document.createElement('canvas'); banEl.className = 'cr-ban'; banEl.setAttribute('aria-hidden', 'true'); wrap.appendChild(banEl);
  const avEl = document.createElement('div'); avEl.className = 'cr-av'; avEl.setAttribute('aria-hidden', 'true'); head.appendChild(avEl);
  const avCan = document.createElement('canvas'); avEl.appendChild(avCan);
  const banBase = document.createElement('canvas'), avBase = document.createElement('canvas');
  const banA = mkAnim(banEl), avA = mkAnim(avCan);
  let banKey = '', avKey = '', cur = null;

  // Çerçeve takılıyken banner'ın kendi kenar çizgisi gizlenir: çerçevenin ana çizgisi onun yerini alır
  const resetBan = () => { bn.style.borderColor = ''; bn.style.borderRadius = ''; };
  function render() {
    const w = bn.offsetWidth, h = bn.offsetHeight;
    if (!cur || !DES[cur] || !w || !h) { banEl.style.display = 'none'; avEl.style.display = 'none'; resetBan(); banKey = avKey = ''; return; }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const key = [cur, w, h, dpr].join();
    if (key !== banKey) {
      const res = drawBanner(banBase, cur, w, h, 0, dpr);
      banKey = res.ok ? key : ''; banEl.dataset.g = res.g; banEl.dataset.r = res.r; setAnimBase(banA, banBase);
      banEl.style.width = banBase.style.width; banEl.style.height = banBase.style.height;
      paintAnim(banA);
    }
    const g = Number(banEl.dataset.g) || 0;
    banEl.style.display = 'block';
    banEl.style.left = (bn.offsetLeft - g) + 'px';
    banEl.style.top = (bn.offsetTop - g) + 'px';
    bn.style.borderColor = 'transparent';
    bn.style.borderRadius = (Number(banEl.dataset.r) || 0).toFixed(1) + 'px';   // banner'ın köşesi çerçevenin köşesine uyar

    // avatar halkası: ana çizgi avatarın dış kenarında
    const d = av.offsetWidth;
    if (d) {
      const k2 = [cur, d, dpr].join();
      if (k2 !== avKey) {
        const q = drawRing(avBase, cur, d, dpr);
        avKey = q.ok ? k2 : ''; avEl.dataset.m = q.m; setAnimBase(avA, avBase);
        avCan.style.width = avBase.style.width; avCan.style.height = avBase.style.height;
        paintAnim(avA);
      }
      const m = Number(avEl.dataset.m) || 0, C = d + 2 * m;
      avEl.style.left = (av.offsetLeft - m) + 'px'; avEl.style.top = (av.offsetTop - m) + 'px';
      avEl.style.width = C + 'px'; avEl.style.height = C + 'px';
      avEl.style.display = 'block';
    } else { avKey = ''; avEl.style.display = 'none'; }
  }

  function apply(k) { cur = DES[k] ? k : null; render(); }
  window.addEventListener('lef-cr-img', () => { if (cur) render(); });
  if (window.ResizeObserver) { const ro = new ResizeObserver(render); ro.observe(bn); ro.observe(head); ro.observe(av); } else window.addEventListener('resize', render);

  const memo = {}; let curId = null;
  async function load(id) {
    if (Object.prototype.hasOwnProperty.call(memo, id)) return memo[id];
    try {
      const r = await supabase.from('profiles').select('fx_cerceve').eq('id', id).maybeSingle();
      if (r.error) return null;
      memo[id] = (r.data && r.data.fx_cerceve) ? r.data.fx_cerceve : null; return memo[id];
    } catch (_) { return null; }
  }
  async function onProfile() {
    const P = window.__lefProfile; if (!P) return;
    curId = P.id; const v = await load(P.id);
    if (curId === P.id) apply(v);
  }
  window.addEventListener('lef-profile', onProfile); onProfile();

  // Profil sekmesine her girişte kendi profilinin takılı seçimini sunucudan yeniden oku:
  // Mağaza'dan / başka sekmeden / başka cihazdan takılan şey yenilemeden görünür.
  function fresh() { const P = window.__lefProfile; if (P && P.mine && location.hash.slice(1) === 'profil') { delete memo[P.id]; onProfile(); } }
  window.addEventListener('hashchange', fresh);
  window.addEventListener('lef-equip', () => { const P = window.__lefProfile; if (P && P.mine) { delete memo[P.id]; onProfile(); } });

  // Profil tasarımı paneli (dolap.js) ve mağaza buradan önizler / kaydeder
  window.__lefCerceve = {
    preview: k => apply(k),
    restore: () => { const P = window.__lefProfile; if (P) apply(memo[P.id] || null); },
    saved: (id, k) => { memo[id] = k || null; }
  };
})();
