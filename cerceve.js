/* ============================================================
   PROFİL ÇERÇEVELERİ: banner + avatar çerçevesi (3 tasarım, görselden)
   - "Profil efekti" panelinin üstüne iki sekme ekler: Normal efektler / Çerçeve tasarımları
   - Seçim profiles.fx_cerceve sütununa kaydedilir: beyaz | kirmizi | mavi
   - Repo kökünde bu 6 görsel olmalı:
       cr-beyaz-banner.png   cr-beyaz-avatar.png
       cr-kirmizi-banner.png cr-kirmizi-avatar.png
       cr-mavi-banner.png    cr-mavi-avatar.png
   - ux.js içinden otomatik yüklenir.
   - Görsellerin ARKA PLANI yüklenirken temizlenir (sadece efektler kalır):
       1) koyu yarı saydam pikseller silinir
       2) dışarıdan ve boş pencereden sel doldurma ile soluk gri/beyaz sis ve plaka silinir
          (köşelerde kalan beyaz lekeler bunlardı)
   - BANNER çerçevesi her ekran boyutunda parça parça çizilir: halkanın dış kenarı
     banner kenarına oturur, sol alttaki oyuk profil fotoğrafının etrafına oturur.
   - Banner fotoğrafı oyuk bölgesinden kesilir (çerçevenin dışına taşan köşe kalmaz).
     Giriş animasyonları bittikten sonra ölçüm yeniden yapılır, yoksa kesim yanlış yere oturuyordu.
   - Avatar çerçevesi fotoğrafın İÇİNDE durur.
   - ANİMASYON: parlama süpürmesi + yıldız pırıltıları + hafif nefes alma (sadece çerçevenin
     kendi piksellerinde). Çerçeve değişince giriş animasyonu, kaldırınca solma animasyonu.
     "Hareketi azalt" ayarı açıksa animasyonlar kapanır.
   ============================================================ */
import { supabase } from './config.js';

// hole/out: avatar çerçevesi iç boşluk / halka dış yarıçapı (piksel)
// ban: banner PNG ölçüleri -> L,T,R,B = halka çubuklarının DIŞ kenarı; bx = alt kenarın başladığı x; ly = sol kenarın bittiği y
const PAL = {
  beyaz:   { n: 'Beyaz Diken', hole: 102, out: 134, ban: { L: 30, T: 30, R: 882, B: 352, bx: 372, ly: 314 } },
  kirmizi: { n: 'Kızıl Melek', hole: 108, out: 143, ban: { L: 30, T: 30, R: 880, B: 358, bx: 368, ly: 304 } },
  mavi:    { n: 'Mavi Zincir', hole: 104, out: 132, ban: { L: 30, T: 30, R: 874, B: 348, bx: 373, ly: 282 } }
};
const src = (k, t) => 'cr-' + k + '-' + t + '.png';

/* ---------- Arka plan temizleme: koyu yarı saydam pikselleri sil, soluk beyaz/gri sisi sil, avatar deliğinin içini boşalt ---------- */
const CV = {};      // temizlenmiş canvas'lar
const URLS = {};    // dataURL önbelleği
const url = (k, t) => {
  const c = CV[k + t]; if (!c) return src(k, t);
  return URLS[k + t] || (URLS[k + t] = c.toDataURL('image/png'));
};

// Görselin dışından (kenarlar) ve ortasındaki boş pencereden başlayıp "arka plan gibi" piksellere yayılır, hepsini siler.
// Arka plan sayılanlar: neredeyse saydam pikseller, soluk gri/beyaz yarı saydam sis, saf beyaz plaka.
// Halkanın kendisi mavi/kırmızı/renkli olduğu için sel onu geçemez; halkanın içindeki parlaklıklara dokunulmaz.
function floodBg(d, w, h) {
  const N = w * h, seen = new Uint8Array(N), q = new Int32Array(N);
  let qh = 0, qt = 0;
  const isBg = p => {
    const i = p * 4, a = d[i + 3];
    if (a < 24) return true;
    const mx = Math.max(d[i], d[i + 1], d[i + 2]), sat = mx - Math.min(d[i], d[i + 1], d[i + 2]);
    if (sat < 40 && mx > 120 && a < 250) return true;   // soluk gri/beyaz yarı saydam sis
    if (sat < 14 && mx > 200) return true;              // saf beyaz plaka
    return false;
  };
  const push = p => { if (!seen[p] && isBg(p)) { seen[p] = 1; q[qt++] = p; } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  push((h >> 1) * w + (w >> 1));
  while (qh < qt) {
    const p = q[qh++], x = p % w, y = (p / w) | 0;
    d[p * 4 + 3] = 0;
    if (x > 0) push(p - 1);
    if (x < w - 1) push(p + 1);
    if (y > 0) push(p - w);
    if (y < h - 1) push(p + w);
  }
}

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
        floodBg(d, w, h);
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
  const lyRel = Math.max(c * s * 1.4, Math.min(cy - .15 * r, Hd - 8));   // sol kenarın bittiği y (banner içinde)
  const bxRel = Math.min(cx + .92 * r, Wd * .6);                         // alt kenarın başladığı x (banner içinde)
  const LyD = g + lyRel, bxD = g + bxRel;
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
  // güvenlik: avatarın solu ve altı (oyuk bölgesi) kesinlikle boş kalsın, hiçbir leke çıkmasın
  x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
  x.fillRect(0, LyD, bxD, CH - LyD);
  x.restore();
  return { g, rad: 46 * s, ly: lyRel, bx: bxRel };
}

/*ANIM-START*/
// Çerçeve animasyonu: parlama süpürmesi + yıldız pırıltıları (sadece çerçevenin kendi piksellerinde)
const ANIM = {
  beyaz:   { col: '255,255,255', per: 4.2 },
  kirmizi: { col: '255,150,175', per: 4.8 },
  mavi:    { col: '150,200,255', per: 3.6 }
};
function mkAnim(el, circle) { return { el, circle: !!circle, base: null, k: null, cands: [], sp: [], u: 6 }; }
function setAnimBase(A, base, k, count) {
  A.base = base; A.k = k;
  A.el.width = base.width; A.el.height = base.height;
  A.u = Math.max(base.width, base.height) * (A.circle ? .018 : .0065);
  // pırıltı adayları: çerçevenin parlak, opak pikselleri
  const W = base.width, H = base.height, d = base.getContext('2d').getImageData(0, 0, W, H).data;
  const strong = [], any = [], st = Math.max(2, Math.round(Math.max(W, H) / 220));
  for (let y = 0; y < H; y += st) for (let x = 0; x < W; x += st) {
    const i = (y * W + x) * 4;
    if (d[i + 3] > 200) { any.push(x, y); if (Math.max(d[i], d[i + 1], d[i + 2]) > 150) strong.push(x, y); }
  }
  A.cands = strong.length >= 40 ? strong : any;
  A.sp = Array.from({ length: count }, () => ({ per: 1.5 + Math.random() * 1.6, ph: Math.random() * 3, cyc: -1, i: 0 }));
}
function paintAnim(A, t) {
  if (!A.base) return;
  const c = A.el, x = c.getContext('2d'), W = c.width, H = c.height, cfg = ANIM[A.k]; if (!cfg) return;
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  x.clearRect(0, 0, W, H); x.drawImage(A.base, 0, 0);
  // 1) parlama süpürmesi (source-atop: sadece çerçeve piksellerinin üstüne biner)
  x.globalCompositeOperation = 'source-atop';
  if (A.circle && x.createConicGradient) {
    const g = x.createConicGradient((t / cfg.per) * Math.PI * 2, W / 2, H / 2);
    g.addColorStop(0, 'rgba(' + cfg.col + ',0)'); g.addColorStop(.05, 'rgba(' + cfg.col + ',.75)'); g.addColorStop(.12, 'rgba(' + cfg.col + ',0)');
    g.addColorStop(.55, 'rgba(' + cfg.col + ',0)'); g.addColorStop(.6, 'rgba(' + cfg.col + ',.4)'); g.addColorStop(.66, 'rgba(' + cfg.col + ',0)'); g.addColorStop(1, 'rgba(' + cfg.col + ',0)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  } else {
    const u = (t % cfg.per) / cfg.per;
    if (u < .45) {
      const p = u / .45, cx = -.3 * W + p * 1.6 * W, hw = .16 * W;
      const g = x.createLinearGradient(cx - hw, 0, cx + hw, hw * .55);
      g.addColorStop(0, 'rgba(' + cfg.col + ',0)'); g.addColorStop(.5, 'rgba(' + cfg.col + ',.8)'); g.addColorStop(1, 'rgba(' + cfg.col + ',0)');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
    }
  }
  // 2) yıldız pırıltıları
  x.globalCompositeOperation = 'source-over';
  const n = A.cands.length / 2; if (!n) return;
  for (const s of A.sp) {
    const q = (t + s.ph) / s.per, cyc = Math.floor(q);
    if (cyc !== s.cyc) { s.cyc = cyc; s.i = Math.floor(Math.random() * n); }
    const f = q - cyc, a = Math.sin(Math.PI * f), v = a * a;
    if (v < .02) continue;
    const px = A.cands[s.i * 2], py = A.cands[s.i * 2 + 1], r = A.u * (.6 + .9 * v);
    const g = x.createRadialGradient(px, py, 0, px, py, r * 1.7);
    g.addColorStop(0, 'rgba(255,255,255,' + (.95 * v) + ')'); g.addColorStop(.35, 'rgba(' + cfg.col + ',' + (.55 * v) + ')'); g.addColorStop(1, 'rgba(' + cfg.col + ',0)');
    x.fillStyle = g; x.beginPath(); x.arc(px, py, r * 1.7, 0, 6.2832); x.fill();
    x.fillStyle = 'rgba(255,255,255,' + (.9 * v) + ')';
    x.beginPath();   // 4 uçlu yıldız
    x.moveTo(px, py - r * 2.1); x.quadraticCurveTo(px + r * .18, py - r * .18, px + r * 2.1, py);
    x.quadraticCurveTo(px + r * .18, py + r * .18, px, py + r * 2.1); x.quadraticCurveTo(px - r * .18, py + r * .18, px - r * 2.1, py);
    x.quadraticCurveTo(px - r * .18, py - r * .18, px, py - r * 2.1); x.fill();
  }
}
/*ANIM-END*/

if (typeof document !== 'undefined') (async function main() {
  if (document.readyState === 'loading') await new Promise(r => document.addEventListener('DOMContentLoaded', r));
  const $ = (s, r) => (r || document).querySelector(s);
  const wrap = $('.pf-bwrap'), head = $('.pf-head'), av = $('#pfAv'), bn = $('#pfBan');
  if (!wrap || !head || !av || !bn) return;
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const css = document.createElement('style');
  css.textContent =
    '.cr-ban{position:absolute;z-index:2;pointer-events:none;display:none;animation:crBreath 4.5s ease-in-out infinite alternate}' +
    '.cr-av{position:absolute;z-index:4;pointer-events:none;overflow:hidden;border-radius:50%;display:none}' +
    '.cr-av canvas{position:absolute;left:0;top:0;display:block;animation:crBreath 4.5s ease-in-out infinite alternate}' +
    '@keyframes crBreath{from{filter:brightness(1)}to{filter:brightness(1.16) saturate(1.1)}}' +
    // çerçeve değişince giriş animasyonu (önce parlak flaş, sonra yerine oturur)
    '.cr-ban.cr-in{animation:crBanIn .75s cubic-bezier(.2,.8,.2,1) backwards,crBreath 4.5s .75s ease-in-out infinite alternate}' +
    '.cr-av canvas.cr-in{animation:crAvIn .8s cubic-bezier(.2,1.25,.3,1) backwards,crBreath 4.5s .8s ease-in-out infinite alternate}' +
    '@keyframes crBanIn{0%{opacity:0;transform:scale(1.06);filter:brightness(2.6)}55%{opacity:1}100%{opacity:1;transform:none;filter:brightness(1)}}' +
    '@keyframes crAvIn{0%{opacity:0;transform:scale(.55) rotate(-50deg);filter:brightness(2.6)}100%{opacity:1;transform:none;filter:brightness(1)}}' +
    // çerçeve kaldırılınca solma
    '.cr-ban.cr-out,.cr-av.cr-out{animation:crOut .26s ease-in forwards}' +
    '@keyframes crOut{to{opacity:0;filter:brightness(2)}}' +
    '@media (prefers-reduced-motion:reduce){.cr-ban,.cr-av canvas,.cr-ban.cr-in,.cr-av canvas.cr-in,.cr-ban.cr-out,.cr-av.cr-out{animation:none}}' +
    '.cr-tabs{display:flex;gap:6px;margin:0 0 10px}.cr-tabs button{flex:1;height:34px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:transparent;color:#cfd3da;font:inherit;font-size:13px;cursor:pointer}' +
    '.cr-tabs button.on{background:#fff;color:#111;border-color:#fff;font-weight:600}' +
    '.cr-dot{position:relative;display:block;width:34px;height:34px;border-radius:50%;background:#2b2b31;overflow:hidden;transition:transform .2s}.cr-dot img{position:absolute;left:50%;top:50%;max-width:none;transform:translate(-50%,-50%)}' +
    '.cr-grid .fx-it:active .cr-dot{transform:scale(.9)}' +
    '.cr-grid .fx-it.on .cr-dot{animation:crPop .5s cubic-bezier(.2,1.5,.4,1)}' +
    '@keyframes crPop{from{transform:scale(.7) rotate(-30deg)}to{transform:none}}' +
    '@media (prefers-reduced-motion:reduce){.cr-grid .fx-it.on .cr-dot{animation:none}}';
  document.head.appendChild(css);

  const banEl = document.createElement('canvas'); banEl.className = 'cr-ban'; banEl.setAttribute('aria-hidden', 'true'); wrap.appendChild(banEl);
  const avEl = document.createElement('div'); avEl.className = 'cr-av'; avEl.setAttribute('aria-hidden', 'true'); head.appendChild(avEl);
  const avCan = document.createElement('canvas'); avEl.appendChild(avCan);
  const banBase = document.createElement('canvas'), avBase = document.createElement('canvas');
  const banA = mkAnim(banEl, false), avA = mkAnim(avCan, true);
  let banKey = '', avKey = '';

  /* ---------- Animasyon döngüsü (~30 fps, sekme gizliyken durur) ---------- */
  let raf = 0, last = 0;
  function tick(ts) {
    raf = requestAnimationFrame(tick);
    if (ts - last < 32) return; last = ts;
    if (document.hidden || !cur || !bn.offsetParent) return;
    const t = ts / 1000;
    if (banEl.style.display === 'block' && banA.base) paintAnim(banA, t);
    if (avEl.style.display === 'block' && avA.base) paintAnim(avA, t);
  }
  const startLoop = () => { if (!raf && !reduce) raf = requestAnimationFrame(tick); };
  const stopLoop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  const retrigger = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const playIn = () => { if (reduce) return; retrigger(banEl, 'cr-in'); retrigger(avCan, 'cr-in'); };

  const resetBan = () => { bn.style.borderRadius = ''; bn.style.clipPath = ''; bn.style.borderColor = ''; };
  let cur = null;
  function render() {
    const w = bn.clientWidth, h = bn.clientHeight;
    if (!cur || !w || !h) { banEl.style.display = 'none'; avEl.style.display = 'none'; resetBan(); banKey = avKey = ''; stopLoop(); return; }
    const P = PAL[cur], dpr = Math.min(window.devicePixelRatio || 1, 2);

    // avatarın banner'a göre konumu (oyuğu buna göre açıyoruz)
    const br = bn.getBoundingClientRect(), ar = av.getBoundingClientRect();
    const r = ar.width / 2, cx = ar.left + r - br.left - bn.clientLeft, cy = ar.top + ar.height / 2 - br.top - bn.clientTop;
    const key = [cur, w, h, Math.round(cx), Math.round(cy), Math.round(r), dpr].join();
    const res = drawBanner(banBase, cur, w, h, cx, cy, r, dpr);
    if (res) {
      if (key !== banKey) {
        banKey = key; setAnimBase(banA, banBase, cur, 9);
        banEl.style.width = banBase.style.width; banEl.style.height = banBase.style.height;
        paintAnim(banA, 0);
      }
      banEl.style.display = 'block';
      banEl.style.left = (bn.offsetLeft + bn.clientLeft - res.g) + 'px';
      banEl.style.top = (bn.offsetTop + bn.clientTop - res.g) + 'px';
      // fotoğraf çerçevenin kenarına kadar: köşe yuvarlaklığı halkayla aynı, kenar çizgisi yok
      bn.style.borderRadius = res.rad + 'px';
      bn.style.borderColor = 'transparent';
      // oyuk bölgesindeki (avatarın solu/altı) fotoğraf köşesini kes
      const bl = bn.clientLeft, bt = bn.clientTop;
      bn.style.clipPath = 'polygon(0 0,100% 0,100% 100%,' + (res.bx + bl) + 'px 100%,' + (res.bx + bl) + 'px ' + (res.ly + bt) + 'px,0 ' + (res.ly + bt) + 'px)';
    } else { banKey = ''; banEl.style.display = 'none'; resetBan(); }

    // avatar çerçevesi: halka gövdesinin dış kenarı = fotoğraf kenarı -> çerçeve fotoğrafın içinde kalır
    const d = av.offsetWidth, ring = CV[cur + 'avatar'];
    if (ring && d) {
      const k2 = [cur, d, dpr].join();
      if (k2 !== avKey) {
        avKey = k2;
        const D = Math.round(d * dpr), S = 380 * (d / 2) / P.out * dpr;
        avBase.width = avBase.height = D;
        const bx = avBase.getContext('2d'); bx.clearRect(0, 0, D, D); bx.imageSmoothingQuality = 'high';
        bx.drawImage(ring, (D - S) / 2, (D - S) / 2, S, S);
        setAnimBase(avA, avBase, cur, 5);
        avCan.style.width = d + 'px'; avCan.style.height = d + 'px';
        paintAnim(avA, 0);
      }
      avEl.style.left = av.offsetLeft + 'px'; avEl.style.top = av.offsetTop + 'px'; avEl.style.width = d + 'px'; avEl.style.height = av.offsetHeight + 'px';
      avEl.style.display = 'block';
    } else { avKey = ''; avEl.style.display = 'none'; }
    startLoop();
  }

  let outT = 0;
  function apply(k) {
    clearTimeout(outT);
    const nk = PAL[k] ? k : null;
    if (!nk && cur && !reduce) {              // çerçeve kaldırıldı: yumuşakça sol
      banEl.classList.add('cr-out'); avEl.classList.add('cr-out');
      outT = setTimeout(() => { cur = null; banEl.classList.remove('cr-out'); avEl.classList.remove('cr-out'); render(); }, 260);
      return;
    }
    const changed = !!nk && nk !== cur;
    cur = nk; banEl.classList.remove('cr-out'); avEl.classList.remove('cr-out');
    render();
    if (changed) playIn();                    // yeni çerçeve: giriş animasyonu
  }
  if (window.ResizeObserver) { const ro = new ResizeObserver(render); ro.observe(bn); ro.observe(head); } else window.addEventListener('resize', render);
  ready.then(() => { render(); if (cur) playIn(); });

  // Avatarın konumu giriş animasyonları (kayma/büyüme) sürerken yanlış ölçülüyordu: bu yüzden oyuk
  // yanlış yere kesilip banner fotoğrafının köşesi dışarı taşıyordu. Animasyonlar bitince ve sayfa
  // tam yüklenince ölçümü yeniden yap.
  const again = () => { if (cur) render(); };
  head.addEventListener('animationend', again);
  bn.addEventListener('animationend', again);
  window.addEventListener('load', again);
  window.addEventListener('pageshow', again);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(again);
  [250, 700, 1500].forEach(ms => setTimeout(again, ms));

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
    if (curId === P.id) { apply(v); setTimeout(again, 900); }
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
