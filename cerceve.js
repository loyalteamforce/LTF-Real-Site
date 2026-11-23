/* ============================================================
   PROFİL ÇERÇEVELERİ: banner + avatar çerçevesi (9 tasarım, hepsi kodla çizilir)
   - Çerçevenin ANA ÇİZGİSİ her ekran boyutunda tam banner'ın kenarına (ve avatarın dış kenarına) oturur:
     çerçeve, banner'ın o anki genişliği, yüksekliği ve köşe yuvarlaklığıyla canlı çizilir; resim kesip uzatma yok.
   - Seçim profiles.fx_cerceve sütunundadır. Takmak için önce Mağaza'dan almak gerekir (magaza-v2-kurulum.sql).
   - Mağaza ve "Profil tasarımı" paneli aynı çizimleri kullanır: window.__crDraw.
   - Yeni tasarım eklemek için DES listesine { n, ban(x, b, R), ring(x, cx, cy, r, s, R) } ekle,
     ANIM'e parlama rengini yaz, SQL'deki fx_cerceve listesine anahtarı ekle.
   - ANİMASYON: parlama süpürmesi + yıldız pırıltıları + hafif nefes alma. "Hareketi azalt" açıksa kapanır.
   - ux.js içinden otomatik yüklenir.
   ============================================================ */
import { supabase } from './config.js';

const TAU = Math.PI * 2;
function rng(seed) { let s = (seed >>> 0) || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }

/* ---------- çizim yardımcıları ---------- */
function rr(x, X, Y, W, H, R) {
  R = Math.max(0, Math.min(R, W / 2, H / 2));
  x.beginPath(); x.moveTo(X + R, Y);
  x.arcTo(X + W, Y, X + W, Y + H, R); x.arcTo(X + W, Y + H, X, Y + H, R);
  x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath();
}
function strokeGlow(x, col, w, blur, glow) { x.save(); x.shadowColor = glow || col; x.shadowBlur = blur; x.strokeStyle = col; x.lineWidth = w; x.stroke(); x.restore(); }
// Ana çizgi tam banner kenarında (yarısı içeride yarısı dışarıda); isteğe bağlı iç ve dış ince çizgi
function frameLines(x, b, o) {
  const s = Math.min(b.s, 1.2), w = (o.w || 2.6) * s;
  rr(x, b.x, b.y, b.w, b.h, b.r); strokeGlow(x, o.c, w, (o.blur == null ? 7 : o.blur) * s, o.glow);
  if (o.halo) { rr(x, b.x, b.y, b.w, b.h, b.r); x.save(); x.strokeStyle = o.halo; x.lineWidth = w + 2.2 * s; x.globalCompositeOperation = 'destination-over'; x.stroke(); x.restore(); }
  if (o.inner !== false) {
    const g = (o.gap || 5.5) * s; rr(x, b.x + g, b.y + g, b.w - 2 * g, b.h - 2 * g, Math.max(2, b.r - g));
    x.save(); x.globalAlpha = o.ia || .75; x.strokeStyle = o.c2 || o.c; x.lineWidth = Math.max(.8, (o.iw || 1) * s); x.stroke(); x.restore();
  }
  if (o.outer) {
    const g = o.outer * s; rr(x, b.x - g, b.y - g, b.w + 2 * g, b.h + 2 * g, b.r + g);
    x.save(); x.globalAlpha = o.oa || .55; x.strokeStyle = o.c3 || o.c2 || o.c; x.lineWidth = Math.max(.8, s); x.stroke(); x.restore();
  }
}
function ringLines(x, cx, cy, r, s, o) {
  s = Math.min(s, 1.2);
  x.beginPath(); x.arc(cx, cy, r, 0, TAU); strokeGlow(x, o.c, (o.w || 2.6) * s, (o.blur == null ? 7 : o.blur) * s, o.glow);
  if (o.halo) { x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.save(); x.strokeStyle = o.halo; x.lineWidth = (o.w || 2.6) * s + 2.2 * s; x.globalCompositeOperation = 'destination-over'; x.stroke(); x.restore(); }
  if (o.inner !== false) { x.beginPath(); x.arc(cx, cy, r - (o.gap || 5) * s, 0, TAU); x.save(); x.globalAlpha = o.ia || .7; x.strokeStyle = o.c2 || o.c; x.lineWidth = Math.max(.8, (o.iw || 1) * s); x.stroke(); x.restore(); }
  if (o.outer) { x.beginPath(); x.arc(cx, cy, r + o.outer * s, 0, TAU); x.save(); x.globalAlpha = o.oa || .55; x.strokeStyle = o.c3 || o.c2 || o.c; x.lineWidth = Math.max(.8, s); x.stroke(); x.restore(); }
}
const P = (cx, cy, r, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
function star4(x, cx, cy, r, col, glow) {
  x.save(); x.fillStyle = col; x.shadowColor = glow || col; x.shadowBlur = r * 1.3; x.beginPath();
  x.moveTo(cx, cy - r); x.quadraticCurveTo(cx + r * .16, cy - r * .16, cx + r, cy); x.quadraticCurveTo(cx + r * .16, cy + r * .16, cx, cy + r);
  x.quadraticCurveTo(cx - r * .16, cy + r * .16, cx - r, cy); x.quadraticCurveTo(cx - r * .16, cy - r * .16, cx, cy - r); x.fill(); x.restore();
}
function diamond(x, cx, cy, r, col, lw) {
  x.save(); x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx + r * .7, cy); x.lineTo(cx, cy + r); x.lineTo(cx - r * .7, cy); x.closePath();
  if (lw) { x.strokeStyle = col; x.lineWidth = lw; x.stroke(); } else { x.fillStyle = col; x.fill(); } x.restore();
}
function pearl(x, cx, cy, r) {
  const g = x.createRadialGradient(cx - r * .35, cy - r * .35, r * .1, cx, cy, r);
  g.addColorStop(0, '#fff'); g.addColorStop(.6, '#ece6ec'); g.addColorStop(1, '#a89aa6');
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
}
function bow(x, cx, cy, S, col, dark, tails, rot) {
  x.save(); x.translate(cx, cy); x.rotate(rot || 0); x.lineJoin = 'round'; x.lineWidth = Math.max(.6, S * .06);
  const fill = () => { const g = x.createLinearGradient(0, -S * .7, 0, S * .5); g.addColorStop(0, col); g.addColorStop(1, dark); return g; };
  if (tails !== false) [-1, 1].forEach(sg => {
    x.beginPath(); x.moveTo(sg * S * .08, S * .1);
    x.bezierCurveTo(sg * S * .35, S * .6, sg * S * .15, S * .95, sg * S * .5, S * 1.4); x.lineTo(sg * S * .68, S * 1.2);
    x.bezierCurveTo(sg * S * .42, S * .85, sg * S * .52, S * .5, sg * S * .22, S * .06); x.closePath();
    x.fillStyle = fill(); x.fill(); x.strokeStyle = dark; x.stroke();
  });
  [-1, 1].forEach(sg => {
    x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(sg * S * .35, -S * .8, sg * S * 1.1, -S * .6, sg * S * 1.02, 0);
    x.bezierCurveTo(sg * S * 1.05, S * .5, sg * S * .4, S * .42, 0, 0); x.closePath();
    x.fillStyle = fill(); x.fill(); x.strokeStyle = dark; x.stroke();
    x.beginPath(); x.moveTo(sg * S * .18, -S * .06); x.quadraticCurveTo(sg * S * .62, -S * .4, sg * S * .88, -S * .08);
    x.strokeStyle = 'rgba(255,255,255,.4)'; x.stroke();
  });
  x.beginPath(); x.ellipse(0, 0, S * .2, S * .25, 0, 0, TAU); x.fillStyle = dark; x.fill();
  x.beginPath(); x.ellipse(-S * .03, -S * .05, S * .11, S * .13, 0, 0, TAU); x.fillStyle = col; x.fill();
  x.restore();
}
function sakura(x, cx, cy, r, rot, col, edge) {
  x.save(); x.translate(cx, cy); x.rotate(rot || 0);
  for (let i = 0; i < 5; i++) {
    x.save(); x.rotate(i * TAU / 5); x.beginPath(); x.moveTo(0, 0);
    x.bezierCurveTo(r * .58, -r * .25, r * .55, -r * .88, r * .13, -r); x.lineTo(0, -r * .85); x.lineTo(-r * .13, -r);
    x.bezierCurveTo(-r * .55, -r * .88, -r * .58, -r * .25, 0, 0);
    const g = x.createRadialGradient(0, 0, 0, 0, -r * .5, r); g.addColorStop(0, '#fff6f9'); g.addColorStop(1, col);
    x.fillStyle = g; x.fill(); if (edge) { x.strokeStyle = edge; x.lineWidth = Math.max(.5, r * .07); x.stroke(); } x.restore();
  }
  x.fillStyle = '#e0457a'; x.beginPath(); x.arc(0, 0, r * .17, 0, TAU); x.fill();
  x.fillStyle = '#fff0a8'; for (let i = 0; i < 5; i++) { const a = i * TAU / 5 + .6; x.beginPath(); x.arc(Math.cos(a) * r * .3, Math.sin(a) * r * .3, r * .055, 0, TAU); x.fill(); }
  x.restore();
}
function petal(x, cx, cy, r, rot, col) {
  x.save(); x.translate(cx, cy); x.rotate(rot); x.beginPath(); x.moveTo(0, r);
  x.bezierCurveTo(r * .9, r * .3, r * .6, -r * .8, .15 * r, -r); x.lineTo(0, -r * .75); x.lineTo(-.15 * r, -r);
  x.bezierCurveTo(-r * .6, -r * .8, -r * .9, r * .3, 0, r); x.fillStyle = col; x.fill(); x.restore();
}
function feather(x, cx, cy, len, ang, col, dark) {
  x.save(); x.translate(cx, cy); x.rotate(ang); const w = len * .23;
  x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(w, -len * .25, w * .9, -len * .78, 0, -len); x.bezierCurveTo(-w * .9, -len * .78, -w, -len * .25, 0, 0);
  const g = x.createLinearGradient(0, 0, 0, -len); g.addColorStop(0, dark); g.addColorStop(1, col);
  x.fillStyle = g; x.globalAlpha = .92; x.fill(); x.globalAlpha = 1;
  x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = Math.max(.6, len * .022);
  x.beginPath(); x.moveTo(0, len * .08); x.quadraticCurveTo(w * .1, -len * .5, 0, -len * .97); x.stroke();
  x.strokeStyle = 'rgba(255,255,255,.3)'; x.lineWidth = Math.max(.4, len * .012);
  for (let i = 1; i < 9; i++) { const t = -len * i / 10, k = w * .85 * Math.sin(Math.PI * i / 10); [-1, 1].forEach(sg => { x.beginPath(); x.moveTo(0, t); x.lineTo(sg * k, t - len * .07); x.stroke(); }); }
  x.restore();
}
function thorn(x, cx, cy, len, ang, col) {
  x.save(); x.translate(cx, cy); x.rotate(ang); x.beginPath(); x.moveTo(-len * .14, 0);
  x.quadraticCurveTo(-len * .04, -len * .55, len * .2, -len); x.quadraticCurveTo(len * .04, -len * .45, len * .14, 0); x.closePath();
  x.fillStyle = col; x.fill(); x.restore();
}
function chainSeg(x, x1, y1, x2, y2, s, col) {
  const L = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1), st = 8.5 * s, n = Math.max(1, Math.floor(L / st));
  x.save(); x.translate(x1, y1); x.rotate(a); x.strokeStyle = col; x.lineWidth = 1.4 * s;
  for (let i = 0; i < n; i++) { x.beginPath(); x.ellipse(i * st + st / 2, 0, st * .62, (i % 2 ? 1.1 : 3) * s, 0, 0, TAU); x.stroke(); }
  x.restore();
}
function butterfly(x, cx, cy, S, col, line, rot) {
  x.save(); x.translate(cx, cy); x.rotate(rot || 0); x.lineWidth = Math.max(.6, S * .06);
  [-1, 1].forEach(sg => {
    x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(sg * S * .4, -S * 1.1, sg * S * 1.45, -S * .95, sg * S * 1.12, -S * .12);
    x.bezierCurveTo(sg * S * 1.0, S * .06, sg * S * .4, 0, 0, 0); x.fillStyle = col; x.fill(); if (line) { x.strokeStyle = line; x.stroke(); }
    x.beginPath(); x.moveTo(0, S * .05); x.bezierCurveTo(sg * S * .3, S * .25, sg * S * .88, S * .55, sg * S * .56, S * .78);
    x.bezierCurveTo(sg * S * .35, S * .88, sg * S * .1, S * .4, 0, S * .05); x.fill(); if (line) x.stroke();
  });
  x.fillStyle = line || col; x.beginPath(); x.ellipse(0, S * .15, S * .07, S * .45, 0, 0, TAU); x.fill();
  x.strokeStyle = line || col; x.lineWidth = Math.max(.5, S * .045);
  [-1, 1].forEach(sg => { x.beginPath(); x.moveTo(0, -S * .25); x.quadraticCurveTo(sg * S * .15, -S * .6, sg * S * .34, -S * .72); x.stroke(); });
  x.restore();
}
function splat(x, cx, cy, r, col, R) {
  x.save(); x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
  const n = 4 + Math.floor(R() * 6);
  for (let i = 0; i < n; i++) { const a = R() * TAU, d = r * (1.3 + R() * 2.4), q = r * (.1 + R() * .35); x.beginPath(); x.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, q, 0, TAU); x.fill(); }
  x.restore();
}
function brush(x, pts, w, col, R) {
  x.save(); x.fillStyle = col;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], a = Math.atan2(by - ay, bx - ax) + Math.PI / 2;
    const t1 = i / (pts.length - 1), t2 = (i + 1) / (pts.length - 1), f = t => Math.sin(Math.PI * Math.min(1, t * 1.15)) * .85 + .15;
    const w1 = w * f(t1) * (.75 + R() * .5), w2 = w * f(t2) * (.75 + R() * .5);
    x.beginPath(); x.moveTo(ax + Math.cos(a) * w1, ay + Math.sin(a) * w1); x.lineTo(bx + Math.cos(a) * w2, by + Math.sin(a) * w2);
    x.lineTo(bx - Math.cos(a) * w2, by - Math.sin(a) * w2); x.lineTo(ax - Math.cos(a) * w1, ay - Math.sin(a) * w1); x.closePath(); x.fill();
  }
  x.restore();
}
function tassel(x, cx, cy, len, cord, fr, s) {
  x.save(); x.strokeStyle = cord; x.lineWidth = 1.6 * s; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx, cy + len * .34); x.stroke();
  x.fillStyle = cord; x.beginPath(); x.ellipse(cx, cy + len * .4, 3.2 * s, 4 * s, 0, 0, TAU); x.fill();
  const g = x.createLinearGradient(0, cy + len * .45, 0, cy + len); g.addColorStop(0, fr); g.addColorStop(1, '#fff');
  x.fillStyle = g; x.beginPath(); x.moveTo(cx - 2.4 * s, cy + len * .45); x.lineTo(cx - 4.4 * s, cy + len); x.lineTo(cx + 4.4 * s, cy + len); x.lineTo(cx + 2.4 * s, cy + len * .45); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(0,0,0,.22)'; x.lineWidth = .6 * s;
  for (let i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(cx + i * .6 * s, cy + len * .5); x.lineTo(cx + i * 1.25 * s, cy + len); x.stroke(); }
  x.fillStyle = cord; x.fillRect(cx - 3 * s, cy + len * .46, 6 * s, 1.8 * s); x.restore();
}
function twisted(x, path, s, c1, c2) {
  x.save(); x.lineCap = 'round'; x.lineWidth = 3.2 * s; x.strokeStyle = c1; path(); x.stroke();
  x.setLineDash([3.2 * s, 3.2 * s]); x.strokeStyle = c2; path(); x.stroke(); x.restore();
}
function katana(x, x1, y1, x2, y2, s) {
  const L = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1), hl = L * .27;
  x.save(); x.translate(x1, y1); x.rotate(a);
  x.beginPath(); x.moveTo(hl + 4 * s, -2.3 * s); x.quadraticCurveTo(L * .72, -4.2 * s, L, 0); x.quadraticCurveTo(L * .72, 1.1 * s, hl + 4 * s, 2.3 * s); x.closePath();
  const g = x.createLinearGradient(0, -3 * s, 0, 3 * s); g.addColorStop(0, '#fbfbfb'); g.addColorStop(.5, '#a3a3a3'); g.addColorStop(1, '#262626');
  x.fillStyle = g; x.fill(); x.strokeStyle = '#0b0b0b'; x.lineWidth = .8 * s; x.stroke();
  x.fillStyle = '#0b0b0b'; x.beginPath(); x.ellipse(hl + 2 * s, 0, 2.3 * s, 6.4 * s, 0, 0, TAU); x.fill(); x.strokeStyle = '#d0d0d0'; x.lineWidth = .7 * s; x.stroke();
  x.fillStyle = '#121212'; x.fillRect(0, -2.7 * s, hl, 5.4 * s); x.strokeStyle = '#e8e8e8'; x.lineWidth = .7 * s;
  for (let t = 3 * s; t < hl - 3 * s; t += 5 * s) { x.beginPath(); x.moveTo(t, -2.7 * s); x.lineTo(t + 2.5 * s, 2.7 * s); x.moveTo(t + 2.5 * s, -2.7 * s); x.lineTo(t, 2.7 * s); x.stroke(); }
  x.restore();
}
function inkTag(x, cx, cy, s, R) {   // zincirle asılı mürekkep etiket (kanji yok: fırça darbesi)
  x.save(); x.strokeStyle = '#d6d6d6'; x.lineWidth = 1.1 * s;
  for (let i = 0; i < 4; i++) { x.beginPath(); x.ellipse(cx, cy + i * 4.6 * s + 2.3 * s, 1.4 * s, 2.4 * s, 0, 0, TAU); x.stroke(); }
  const ty = cy + 18 * s, w = 13 * s, h = 24 * s;
  x.fillStyle = '#0a0a0a'; x.fillRect(cx - w / 2, ty, w, h); x.strokeStyle = '#efefef'; x.lineWidth = 1.2 * s; x.strokeRect(cx - w / 2 + 1.5 * s, ty + 1.5 * s, w - 3 * s, h - 3 * s);
  brush(x, [[cx - 3 * s, ty + 6 * s], [cx, ty + 12 * s], [cx + 2.5 * s, ty + 19 * s]], 1.6 * s, '#f4f4f4', R);
  x.fillStyle = '#f4f4f4'; x.beginPath(); x.arc(cx + 2.8 * s, ty + 7 * s, 1.2 * s, 0, TAU); x.fill();
  x.restore();
}
function knot(x, cx, cy, r, c1, c2) { diamond(x, cx, cy, r, c1); diamond(x, cx, cy, r * .62, c2); diamond(x, cx, cy, r * .3, c1); }
// kenar boyunca eşit aralıklı noktalar (köşe yuvarlaklarının dışında)
function along(b, side, n, pad) {
  const out = [], p = (pad || 0) + b.r;
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    if (side === 't') out.push([b.x + p + (b.w - 2 * p) * t, b.y]);
    if (side === 'b') out.push([b.x + p + (b.w - 2 * p) * t, b.y + b.h]);
    if (side === 'l') out.push([b.x, b.y + p + (b.h - 2 * p) * t]);
    if (side === 'r') out.push([b.x + b.w, b.y + p + (b.h - 2 * p) * t]);
  }
  return out;
}
const corners = b => [[b.x, b.y, -3 * Math.PI / 4], [b.x + b.w, b.y, -Math.PI / 4], [b.x + b.w, b.y + b.h, Math.PI / 4], [b.x, b.y + b.h, 3 * Math.PI / 4]];
// köşe yayının tam üstündeki nokta (köşe süsleri çizginin üstünde dursun)
const cornerPt = (b, i) => { const k = b.r * (1 - Math.SQRT1_2), c = corners(b)[i]; return [c[0] + (i === 0 || i === 3 ? k : -k), c[1] + (i < 2 ? k : -k), c[2]]; };

/* ---------- 9 tasarım ---------- */
const DES = {
  beyaz: { n: 'Beyaz Diken',
    ban(x, b, R) {
      frameLines(x, b, { c: '#f5f7fb', glow: '#ffffff', c2: '#dfe5ee' });
      const s = b.s, col = '#f5f7fb';
      ['t', 'b'].forEach(sd => along(b, sd, Math.max(4, Math.round(b.w / (46 * s))), 8 * s).forEach((p, i) => thorn(x, p[0], p[1], 7.5 * s, (sd === 't' ? 0 : Math.PI) + (i % 2 ? .5 : -.5), col)));
      ['l', 'r'].forEach(sd => along(b, sd, Math.max(2, Math.round(b.h / (46 * s))), 6 * s).forEach((p, i) => thorn(x, p[0], p[1], 7 * s, (sd === 'l' ? -Math.PI / 2 : Math.PI / 2) + (i % 2 ? .5 : -.5), col)));
      [0, 1, 2, 3].forEach(i => { const [cx, cy, a] = cornerPt(b, i); [-.45, 0, .45].forEach((d, j) => thorn(x, cx, cy, (j === 1 ? 19 : 13) * s, a + Math.PI / 2 + d, col)); });
      star4(x, b.x + b.w / 2, b.y, 10 * s, '#fff'); thorn(x, b.x + b.w / 2 - 7 * s, b.y, 11 * s, -1.1, col); thorn(x, b.x + b.w / 2 + 7 * s, b.y, 11 * s, 1.1, col);
      star4(x, b.x, b.y + b.h / 2, 6 * s, '#fff'); star4(x, b.x + b.w, b.y + b.h / 2, 6 * s, '#fff');
    },
    ring(x, cx, cy, r, s) {
      ringLines(x, cx, cy, r, s, { c: '#f5f7fb', glow: '#fff', c2: '#dfe5ee' });
      for (let i = 0; i < 10; i++) { const a = i * TAU / 10 + .2, [px, py] = P(cx, cy, r, a); thorn(x, px, py, (i % 2 ? 8 : 12) * s, a + Math.PI / 2 + .35, '#f5f7fb'); }
      const [sx, sy] = P(cx, cy, r, -Math.PI / 4); star4(x, sx, sy, 8 * s, '#fff');
    } },

  kirmizi: { n: 'Kızıl Melek',
    ban(x, b, R) {
      frameLines(x, b, { c: '#ff9db0', glow: '#ff3b6b', c2: '#ffd2db', outer: 3.5, c3: '#ff6f8c' });
      const s = b.s, cx = b.x + b.w / 2;
      [-1, 1].forEach(sg => { [0, 1, 2].forEach(j => feather(x, cx + sg * (8 + j * 9) * s, b.y + 1 * s, (30 - j * 6) * s, sg * (1.25 + j * .18), '#ffd6df', '#d8264c')); });
      diamond(x, cx, b.y, 6 * s, '#fff'); star4(x, cx, b.y - 10 * s, 5 * s, '#fff', '#ff6f8c');
      [0, 1, 2, 3].forEach(i => { const [px, py, a] = cornerPt(b, i); feather(x, px, py, 24 * s, a + Math.PI / 2 - .35, '#ffc2cf', '#c41e44'); feather(x, px, py, 18 * s, a + Math.PI / 2 + .35, '#ffc2cf', '#c41e44'); star4(x, px, py, 5 * s, '#fff', '#ff6f8c'); });
      diamond(x, cx, b.y + b.h, 5 * s, '#ffd2db'); diamond(x, b.x, b.y + b.h / 2, 5 * s, '#ffd2db'); diamond(x, b.x + b.w, b.y + b.h / 2, 5 * s, '#ffd2db');
    },
    ring(x, cx, cy, r, s) {
      ringLines(x, cx, cy, r, s, { c: '#ff9db0', glow: '#ff3b6b', c2: '#ffd2db', outer: 3.5, c3: '#ff6f8c' });
      [-2.35, -.8].forEach(a0 => { const [px, py] = P(cx, cy, r, a0); [-.3, .15].forEach((d, j) => feather(x, px, py, (j ? 20 : 26) * s, a0 + Math.PI / 2 + d, '#ffd6df', '#d8264c')); });
      const [dx, dy] = P(cx, cy, r, Math.PI / 2); diamond(x, dx, dy, 6 * s, '#fff');
    } },

  mavi: { n: 'Mavi Zincir',
    ban(x, b, R) {
      frameLines(x, b, { c: '#9cc4ff', glow: '#3d7bff', c2: '#d8e7ff' });
      const s = b.s, cx = b.x + b.w / 2, p = b.r + 10 * s, col = '#bcd6ff';
      chainSeg(x, b.x + p, b.y, cx - 22 * s, b.y, s, col); chainSeg(x, cx + 22 * s, b.y, b.x + b.w - p, b.y, s, col);
      chainSeg(x, b.x + p, b.y + b.h, cx - 14 * s, b.y + b.h, s, col); chainSeg(x, cx + 14 * s, b.y + b.h, b.x + b.w - p, b.y + b.h, s, col);
      chainSeg(x, b.x, b.y + b.h * .3, b.x, b.y + b.h * .7, s, col); chainSeg(x, b.x + b.w, b.y + b.h * .3, b.x + b.w, b.y + b.h * .7, s, col);
      star4(x, cx, b.y, 11 * s, '#eaf2ff', '#3d7bff'); diamond(x, cx, b.y, 15 * s, '#9cc4ff', 1.2 * s);
      [0, 1, 2, 3].forEach(i => { const [px, py] = cornerPt(b, i); x.beginPath(); x.arc(px, py, 4.5 * s, 0, TAU); x.strokeStyle = '#eaf2ff'; x.lineWidth = 1.6 * s; x.stroke(); });
      star4(x, b.x, b.y + b.h / 2, 7 * s, '#eaf2ff', '#3d7bff'); star4(x, b.x + b.w, b.y + b.h / 2, 7 * s, '#eaf2ff', '#3d7bff');
    },
    ring(x, cx, cy, r, s) {
      ringLines(x, cx, cy, r, s, { c: '#9cc4ff', glow: '#3d7bff', c2: '#d8e7ff' });
      for (let a = 1.75; a < 3.1; a += .17) { const [px, py] = P(cx, cy, r, a); x.save(); x.translate(px, py); x.rotate(a + Math.PI / 2); x.beginPath(); x.ellipse(0, 0, 5 * s, (Math.round(a * 10) % 2 ? 1.2 : 3) * s, 0, 0, TAU); x.strokeStyle = '#bcd6ff'; x.lineWidth = 1.3 * s; x.stroke(); x.restore(); }
      const [sx, sy] = P(cx, cy, r, -Math.PI / 2); star4(x, sx, sy, 9 * s, '#eaf2ff', '#3d7bff');
    } },

  kelebek: { n: 'Gece Kelebeği',
    ban(x, b, R) {
      frameLines(x, b, { c: '#ffffff', glow: '#cfd8ff', c2: '#ffffff', outer: 4, oa: .5 });
      const s = b.s, cx = b.x + b.w / 2;
      x.save(); x.strokeStyle = '#0b0b10'; x.lineWidth = 6 * s; x.beginPath(); x.moveTo(cx - 20 * s, b.y); x.lineTo(cx + 20 * s, b.y); x.stroke(); x.restore();
      butterfly(x, cx, b.y - 1 * s, 13 * s, '#ffffff', '#1a1a22');
      [-1, 1].forEach(sg => { [28, 36, 44].forEach((d, j) => { x.fillStyle = '#fff'; x.beginPath(); x.arc(cx + sg * d * s, b.y, (j === 2 ? 2.4 : 1.4) * s, 0, TAU); x.fill(); }); });
      [0, 1, 2, 3].forEach(i => { const [px, py, a] = cornerPt(b, i); x.save(); x.translate(px, py); x.rotate(a + Math.PI / 4); x.strokeStyle = '#fff'; x.lineWidth = 1.5 * s;
        x.beginPath(); x.arc(-9 * s, 0, 6 * s, -Math.PI / 2, Math.PI); x.stroke(); x.beginPath(); x.arc(0, 9 * s, 6 * s, 0, 1.5 * Math.PI, true); x.stroke(); x.restore(); star4(x, px, py, 4.5 * s, '#fff'); });
      [[b.x, b.y + b.h / 2], [b.x + b.w, b.y + b.h / 2]].forEach(([px, py]) => diamond(x, px, py, 5.5 * s, '#fff'));
      butterfly(x, b.x + b.w - b.r - 30 * s, b.y + b.h, 6 * s, '#ffffff', '#1a1a22', .3);
    },
    ring(x, cx, cy, r, s) {
      ringLines(x, cx, cy, r, s, { c: '#ffffff', glow: '#cfd8ff', c2: '#fff', outer: 4, oa: .5 });
      const [bx, by] = P(cx, cy, r, -.85); butterfly(x, bx, by, 10 * s, '#fff', '#1a1a22', .5);
      [2.2, 2.4, 2.6].forEach((a, j) => { const [px, py] = P(cx, cy, r + 4 * s, a); x.fillStyle = '#fff'; x.beginPath(); x.arc(px, py, (j === 1 ? 2.2 : 1.3) * s, 0, TAU); x.fill(); });
    } },

  murekkep: { n: 'Mürekkep',
    ban(x, b, R) {
      const s = b.s;
      frameLines(x, b, { c: '#0c0c0c', w: 3.6, blur: 5, glow: 'rgba(255,255,255,.9)', c2: '#d0d0d0', ia: .7, halo: 'rgba(255,255,255,.55)' });
      [0, 1, 2, 3].forEach(i => { const [cx0, cy0] = corners(b)[i], sx = i === 0 || i === 3 ? 1 : -1, sy = i < 2 ? 1 : -1;
        brush(x, [[cx0 + sx * 50 * s, cy0], [cx0 + sx * 12 * s, cy0 + sy * 1 * s], [cx0 + sx * 2 * s, cy0 + sy * 10 * s], [cx0, cy0 + sy * 40 * s]], 3.4 * s, '#0c0c0c', R); });
      for (let i = 0; i < 7; i++) { const t = R(), side = Math.floor(R() * 4), px = side < 2 ? b.x + b.w * t : (side === 2 ? b.x : b.x + b.w), py = side === 0 ? b.y : side === 1 ? b.y + b.h : b.y + b.h * t;
        splat(x, px + (R() - .5) * 10 * s, py + (R() - .5) * 10 * s, (1.4 + R() * 2.4) * s, '#0c0c0c', R); }
      brush(x, [[b.x + b.w / 2 - 40 * s, b.y], [b.x + b.w / 2, b.y - 1.5 * s], [b.x + b.w / 2 + 40 * s, b.y]], 3.2 * s, '#0c0c0c', R);
    },
    ring(x, cx, cy, r, s, R) {
      ringLines(x, cx, cy, r, s, { c: '#0c0c0c', w: 3.4, blur: 3, glow: '#fff', c2: '#bdbdbd', halo: 'rgba(255,255,255,.35)' });
      const pts = []; for (let a = 2.3; a <= 3.9; a += .12) pts.push(P(cx, cy, r, a)); brush(x, pts, 3.6 * s, '#0c0c0c', R);
      for (let i = 0; i < 4; i++) { const [px, py] = P(cx, cy, r + (R() * 10 - 2) * s, .2 + R() * 1.2); splat(x, px, py, (1.2 + R() * 2) * s, '#0c0c0c', R); }
    } },

  kurdele: { n: 'Kurdele',
    ban(x, b, R) {
      frameLines(x, b, { c: '#eceef4', glow: '#ffffff', c2: '#ffffff', outer: 3.5, c3: '#c9ccd6' });
      const s = b.s, cx = b.x + b.w / 2;
      bow(x, cx, b.y, 15 * s, '#f6f7fb', '#8d91a0');
      [0, 1].forEach(i => { const [px, py] = cornerPt(b, i); bow(x, px, py, 9 * s, '#f6f7fb', '#8d91a0', true, i ? .5 : -.5); });
      [[b.x, b.y + b.h * .55], [b.x + b.w, b.y + b.h * .55]].forEach(([px, py]) => { x.fillStyle = '#eceef4'; x.beginPath(); x.arc(px, py, 3 * s, 0, TAU); x.fill(); });
      [-1, 1].forEach(sg => { x.save(); x.strokeStyle = 'rgba(236,238,244,.85)'; x.lineWidth = 2.2 * s; x.beginPath(); x.moveTo(cx + sg * 16 * s, b.y + 2 * s);
        x.bezierCurveTo(cx + sg * 60 * s, b.y + 12 * s, cx + sg * 90 * s, b.y - 8 * s, cx + sg * 130 * s, b.y + 1 * s); x.stroke(); x.restore(); });
    },
    ring(x, cx, cy, r, s) {
      ringLines(x, cx, cy, r, s, { c: '#eceef4', glow: '#fff', c2: '#fff', outer: 3.5, c3: '#c9ccd6' });
      bow(x, cx, cy + r, 11 * s, '#f6f7fb', '#8d91a0');
    } },

  dantel: { n: 'Kızıl Dantel',
    ban(x, b, R) {
      const s = b.s, cx = b.x + b.w / 2, RED = '#e3263b', DRK = '#7d0c1a';
      frameLines(x, b, { c: '#ffffff', glow: '#ffc9d2', c2: '#d9283c', ia: .95, iw: 1.3, gap: 4.5, outer: 3.5, c3: '#ffffff', oa: .75 });
      // dantel: iç çizginin hemen içinde dört kenar boyunca kemerler ve noktalar
      x.save(); x.strokeStyle = 'rgba(255,255,255,.9)'; x.fillStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 1.1; const g = 7 * Math.min(s, 1.2), st = 10 * Math.min(s, 1.3);
      const n1 = Math.floor((b.w - 2 * b.r) / st), o1 = b.x + (b.w - n1 * st) / 2;
      for (let i = 0; i < n1; i++) { const xx = o1 + i * st + st / 2;
        x.beginPath(); x.arc(xx, b.y + g, st / 2, 0, Math.PI); x.stroke(); x.beginPath(); x.arc(xx, b.y + g + st * .5, .9, 0, TAU); x.fill();
        x.beginPath(); x.arc(xx, b.y + b.h - g, st / 2, Math.PI, TAU); x.stroke(); x.beginPath(); x.arc(xx, b.y + b.h - g - st * .5, .9, 0, TAU); x.fill(); }
      const n2 = Math.floor((b.h - 2 * b.r) / st), o2 = b.y + (b.h - n2 * st) / 2;
      for (let i = 0; i < n2; i++) { const yy = o2 + i * st + st / 2;
        x.beginPath(); x.arc(b.x + g, yy, st / 2, -Math.PI / 2, Math.PI / 2); x.stroke(); x.beginPath(); x.arc(b.x + b.w - g, yy, st / 2, Math.PI / 2, 3 * Math.PI / 2); x.stroke(); }
      x.restore();
      // sol üst büyük fiyonktan üst kenar boyunca uzanan kurdele
      x.save(); x.strokeStyle = RED; x.lineWidth = 3.6 * s; x.lineCap = 'round';
      x.beginPath(); x.moveTo(b.x + 40 * s, b.y + 18 * s); x.bezierCurveTo(b.x + b.w * .2, b.y + 44 * s, b.x + b.w * .3, b.y - 2 * s, b.x + b.w * .44, b.y + 16 * s); x.stroke();
      x.beginPath(); x.moveTo(b.x + 34 * s, b.y + 24 * s); x.bezierCurveTo(b.x + 10 * s, b.y + 54 * s, b.x + 34 * s, b.y + 70 * s, b.x + 2 * s, b.y + 96 * s); x.stroke();
      // sağdaki fiyonktan aşağı sarkan kurdele
      x.beginPath(); x.moveTo(b.x + b.w - 6 * s, b.y + b.h * .44); x.bezierCurveTo(b.x + b.w - 44 * s, b.y + b.h * .58, b.x + b.w - 26 * s, b.y + b.h * .74, b.x + b.w - 74 * s, b.y + b.h * .9); x.stroke();
      x.beginPath(); x.moveTo(b.x + b.w + 2 * s, b.y + b.h * .44); x.bezierCurveTo(b.x + b.w + 16 * s, b.y + b.h * .58, b.x + b.w - 4 * s, b.y + b.h * .66, b.x + b.w + 10 * s, b.y + b.h * .78); x.stroke();
      x.restore();
      bow(x, b.x + 36 * s, b.y + 16 * s, 22 * s, RED, DRK, true, -.12);
      bow(x, cx, b.y, 14 * s, RED, DRK, true);
      bow(x, b.x + b.w, b.y + b.h * .42, 14 * s, RED, DRK, true, .3);
      bow(x, b.x + b.w * .25, b.y + b.h, 9 * s, RED, DRK, false); bow(x, b.x + b.w * .75, b.y + b.h, 9 * s, RED, DRK, false);
      [-1, 1].forEach(sg => [22, 31, 40, 49].forEach((d, j) => pearl(x, cx + sg * d * s, b.y, (j % 2 ? 2.2 : 3) * s)));
      [1, 2, 3].forEach(i => { const [px, py] = cornerPt(b, i); pearl(x, px, py, 4 * s); });
      [[b.x, b.y + b.h * .6], [b.x + b.w / 2, b.y + b.h]].forEach(([px, py]) => pearl(x, px, py, 3 * s));
    },
    ring(x, cx, cy, r, s) {
      const RED = '#e3263b', DRK = '#7d0c1a';
      ringLines(x, cx, cy, r, s, { c: '#ffffff', glow: '#ffc9d2', c2: '#d9283c', ia: .95, iw: 1.3, gap: 4.5, outer: 3.5, c3: '#fff', oa: .75 });
      x.save(); x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 1; const n = 28, ri = r - 9;
      for (let i = 0; i < n; i++) { const a = i * TAU / n; x.beginPath(); x.arc(cx + Math.cos(a) * ri, cy + Math.sin(a) * ri, ri * Math.PI / n, a - Math.PI / 2, a + Math.PI / 2, true); x.stroke(); }
      x.restore();
      for (let i = 0; i < 14; i++) { const [px, py] = P(cx, cy, r + 4 * Math.min(s, 1.2), i * TAU / 14 + .22); pearl(x, px, py, 2.1 * s); }
      bow(x, cx, cy - r, 15 * s, RED, DRK, true); bow(x, cx, cy + r, 11 * s, RED, DRK, false);
      x.save(); x.strokeStyle = RED; x.lineWidth = 2.6 * s; x.lineCap = 'round'; x.beginPath();
      const [ax, ay] = P(cx, cy, r, -2.3); x.moveTo(ax, ay); x.quadraticCurveTo(ax - 18 * s, ay + 20 * s, ax - 8 * s, ay + 44 * s); x.stroke(); x.restore();
      const [bx2, by2] = P(cx, cy, r, -2.3); bow(x, bx2, by2, 9 * s, RED, DRK, false, -.6);
    } },

  katana: { n: 'Kara Kılıç',
    ban(x, b, R) {
      const s = b.s, INK = '#0a0a0a';
      frameLines(x, b, { c: INK, w: 5, blur: 3, glow: 'rgba(255,255,255,.9)', c2: '#f2f2f2', ia: .95, iw: 1.4, gap: 4.5, outer: 3.2, c3: '#e6e6e6', oa: .85, halo: 'rgba(255,255,255,.5)' });
      // fırça darbeleri ve mürekkep lekeleri
      brush(x, [[b.x + b.w * .05, b.y + 4 * s], [b.x + b.w * .16, b.y - 2 * s], [b.x + b.w * .3, b.y + 3 * s], [b.x + b.w * .38, b.y]], 4.2 * s, INK, R);
      brush(x, [[b.x + b.w * .62, b.y + b.h], [b.x + b.w * .74, b.y + b.h + 3 * s], [b.x + b.w * .9, b.y + b.h - 2 * s]], 4 * s, INK, R);
      brush(x, [[b.x - 2 * s, b.y + b.h * .3], [b.x + 3 * s, b.y + b.h * .5], [b.x - 1 * s, b.y + b.h * .72]], 3.6 * s, INK, R);
      for (let i = 0; i < 16; i++) { const lft = i < 8, px = lft ? b.x + R() * b.w * .4 : b.x + b.w * (.55 + R() * .45), py = lft ? b.y + (R() * 40 - 14) * s : b.y + b.h - (R() * 40 - 14) * s;
        splat(x, px, py, (1 + R() * 3.4) * s, INK, R); }
      katana(x, b.x + b.w + 34 * s, b.y + b.h - 26 * s, b.x + b.w * .42, b.y + b.h + 16 * s, s * 1.25);   // alt kenarda: sağ üstteki düğmeleri kapatmasın
      knot(x, b.x + b.w / 2, b.y, 12 * s, INK, '#e8e8e8');
      [-1, 1].forEach(sg => { x.save(); x.strokeStyle = '#e8e8e8'; x.lineWidth = 1.2 * s; x.beginPath(); x.moveTo(b.x + b.w / 2 + sg * 14 * s, b.y); x.lineTo(b.x + b.w / 2 + sg * 46 * s, b.y); x.stroke(); x.restore(); diamond(x, b.x + b.w / 2 + sg * 50 * s, b.y, 3.4 * s, '#e8e8e8'); });
      inkTag(x, b.x + 20 * s, b.y + 2 * s, s * 1.3, R); inkTag(x, b.x + b.w, b.y + b.h * .42, s * 1.15, R);
      [0, 1, 2, 3].forEach(i => { const [px, py] = cornerPt(b, i); diamond(x, px, py, 6.5 * s, '#e8e8e8'); diamond(x, px, py, 3.8 * s, INK); });
    },
    ring(x, cx, cy, r, s, R) {
      const INK = '#0a0a0a';
      ringLines(x, cx, cy, r, s, { c: INK, w: 5, blur: 3, glow: 'rgba(255,255,255,.9)', c2: '#f2f2f2', ia: .95, iw: 1.4, gap: 4.5, outer: 3.2, c3: '#e6e6e6', oa: .85, halo: 'rgba(255,255,255,.5)' });
      const pts = []; for (let a = -1.4; a <= -.2; a += .1) pts.push(P(cx, cy, r + 1, a)); brush(x, pts, 4.4 * s, INK, R);
      const [tx, ty] = P(cx, cy, r, Math.PI * .96); inkTag(x, tx, ty, s * 1.2, R);
      for (let i = 0; i < 8; i++) { const [px, py] = P(cx, cy, r + (R() * 12 - 2) * s, -1.6 + R() * 1.8); splat(x, px, py, (1 + R() * 2.4) * s, INK, R); }
      const [kx, ky] = P(cx, cy, r, Math.PI / 2); knot(x, kx, ky, 9 * s, INK, '#e8e8e8');
    } },

  sakura: { n: 'Sakura Püskülü',
    ban(x, b, R) {
      const s = b.s, cx = b.x + b.w / 2, PK = '#f8b4c8', ED = '#d4607f';
      frameLines(x, b, { c: '#fae0e8', glow: '#ff8fb1', c2: '#ffffff', outer: 4.5, c3: '#e991ab', oa: .8 });
      // üst köşelerde kırmızı-beyaz kordon kıvrımı ve püsküller
      [0, 1].forEach(i => { const [px, py] = corners(b)[i], sg = i ? -1 : 1;
        twisted(x, () => { x.beginPath(); x.moveTo(px + sg * 70 * s, py - 2 * s); x.bezierCurveTo(px + sg * 30 * s, py - 22 * s, px - sg * 16 * s, py + 2 * s, px + sg * 1 * s, py + 40 * s); }, s, '#c8102e', '#ffffff');
        twisted(x, () => { x.beginPath(); x.ellipse(px + sg * 4 * s, py + 4 * s, 9 * s, 6 * s, .5 * sg, 0, TAU); }, s, '#c8102e', '#ffffff');
        tassel(x, px + sg * 1 * s, py + 38 * s, 46 * s, '#c8102e', '#f4a6b8', s * 1.2); });
      // köşelerde çiçek kümeleri
      const cluster = (px, py, sx, sy, big) => {
        sakura(x, px, py, (big ? 14 : 11) * s, R() * TAU, PK, ED);
        sakura(x, px + sx * 17 * s, py - sy * 4 * s, 9.5 * s, R() * TAU, PK, ED);
        sakura(x, px - sx * 4 * s, py + sy * 17 * s, 8.5 * s, R() * TAU, PK, ED);
        sakura(x, px + sx * 30 * s, py + sy * 2 * s, 6.5 * s, R() * TAU, PK, ED);
        [[px + sx * 10 * s, py + sy * 12 * s], [px + sx * 24 * s, py - sy * 9 * s]].forEach(([qx, qy]) => { x.fillStyle = '#f39bb4'; x.beginPath(); x.ellipse(qx, qy, 2.6 * s, 3.6 * s, R() * 3, 0, TAU); x.fill(); });
      };
      [0, 1, 2, 3].forEach(i => { const [px, py] = cornerPt(b, i); cluster(px, py, i === 0 || i === 3 ? 1 : -1, i < 2 ? 1 : -1, i === 0); });
      sakura(x, cx, b.y, 11 * s, .3, PK, ED); [-1, 1].forEach(sg => { sakura(x, cx + sg * 20 * s, b.y + 1 * s, 7 * s, sg, PK, ED); diamond(x, cx + sg * 34 * s, b.y, 3.5 * s, '#ffffff'); });
      diamond(x, cx, b.y - 17 * s, 5 * s, '#ffffff'); diamond(x, cx, b.y + 16 * s, 3.5 * s, '#ffffff');
      sakura(x, cx, b.y + b.h, 8 * s, .8, PK, ED); [-1, 1].forEach(sg => sakura(x, cx + sg * 15 * s, b.y + b.h, 5.5 * s, sg * 2, PK, ED));
      [[b.x, b.y + b.h / 2], [b.x + b.w, b.y + b.h / 2]].forEach(([px, py]) => { sakura(x, px, py, 7.5 * s, R() * 3, PK, ED); });
      for (let i = 0; i < 18; i++) { const side = i % 3, t = R(); const px = side === 2 ? b.x + b.w + (R() * 12 - 4) * s : b.x + b.w * (.12 + t * .76), py = side === 0 ? b.y + (R() * 14 - 9) * s : side === 1 ? b.y + b.h + (R() * 12 - 3) * s : b.y + b.h * t;
        petal(x, px, py, (2.6 + R() * 2.2) * s, R() * TAU, 'rgba(250,186,206,.95)'); }
    },
    ring(x, cx, cy, r, s, R) {
      const PK = '#f8b4c8', ED = '#d4607f';
      ringLines(x, cx, cy, r, s, { c: '#fae0e8', glow: '#ff8fb1', c2: '#fff', outer: 4.5, c3: '#e991ab', oa: .8 });
      [[-.72, 13], [-.98, 9.5], [-.48, 9], [-1.18, 6.5], [-.28, 6.5]].forEach(([a, q]) => { const [px, py] = P(cx, cy, r, a); sakura(x, px, py, q * s, R() * TAU, PK, ED); });
      [[2.3, 11], [2.55, 8], [2.08, 7]].forEach(([a, q]) => { const [px, py] = P(cx, cy, r, a); sakura(x, px, py, q * s, R() * TAU, PK, ED); });
      const [tx, ty] = P(cx, cy, r, 1.85); tassel(x, tx, ty, 40 * s, '#c8102e', '#f4a6b8', s * 1.1);
      for (let i = 0; i < 6; i++) { const [px, py] = P(cx, cy, r + (R() * 16 - 4) * s, -2 + R() * 2.4); petal(x, px, py, (2.4 + R() * 1.6) * s, R() * TAU, 'rgba(250,186,206,.95)'); }
    } }
};
const KEYS = Object.keys(DES);

/* ---------- Banner ve avatar çizimi ---------- */
// Wd, Hd: banner'ın dış ölçüleri, rad: köşe yuvarlaklığı. Döner: { g } = çerçevenin banner dışına taşma payı
function drawBanner(canvas, k, Wd, Hd, rad, dpr, sc) {
  const D = DES[k]; if (!D) return null;
  const s = sc || Math.max(1.1, Math.min(1.9, Wd / 330)), g = Math.ceil(50 * s);
  const CW = Wd + 2 * g, CH = Hd + 2 * g;
  canvas.width = Math.round(CW * dpr); canvas.height = Math.round(CH * dpr);
  canvas.style.width = CW + 'px'; canvas.style.height = CH + 'px';
  const x = canvas.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, CW, CH);
  x.lineCap = 'round'; x.lineJoin = 'round';
  D.ban(x, { x: g, y: g, w: Wd, h: Hd, r: rad, s }, rng(7 + k.length * 131));
  return { g };
}
// d: avatarın dış çapı. Döner: { m } = halkanın avatar dışına taşma payı
function drawRing(canvas, k, d, dpr, sc) {
  const D = DES[k]; if (!D) return null;
  const s = sc || Math.max(1, Math.min(1.6, d / 96)), m = Math.ceil(40 * s), C = d + 2 * m;
  canvas.width = canvas.height = Math.round(C * dpr); canvas.style.width = canvas.style.height = C + 'px';
  const x = canvas.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, C, C);
  x.lineCap = 'round'; x.lineJoin = 'round';
  D.ring(x, C / 2, C / 2, d / 2, s, rng(11 + k.length * 97));
  return { m };
}
// Mağaza / panel önizlemesi: koyu örnek banner + avatar
function preview(canvas, k, w, h, dpr) {
  dpr = dpr || Math.min(window.devicePixelRatio || 1, 2);
  const bw = w * .78, bh = bw / 2.5, bx = (w - bw) / 2, by = h * .12;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  const x = canvas.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
  const gr = x.createLinearGradient(bx, by, bx + bw, by + bh); gr.addColorStop(0, '#2b2b34'); gr.addColorStop(1, '#3a2230');
  rr(x, bx, by, bw, bh, 14); x.fillStyle = gr; x.fill();
  const ps = Math.max(.45, Math.min(1.5, bw / 330));   // önizleme küçükse süsler de orantılı küçülür
  const t = document.createElement('canvas'); const r = drawBanner(t, k, bw, bh, 14, dpr, ps); if (r) x.drawImage(t, bx - r.g, by - r.g, bw + 2 * r.g, bh + 2 * r.g);
  const ad = bh * .78, ax = bx + bw * .06, ay = by + bh - ad * .45;
  x.fillStyle = '#26262b'; x.beginPath(); x.arc(ax + ad / 2, ay + ad / 2, ad / 2, 0, TAU); x.fill();
  const a = document.createElement('canvas'); const q = drawRing(a, k, ad, dpr, ps * .9); if (q) x.drawImage(a, ax - q.m, ay - q.m, ad + 2 * q.m, ad + 2 * q.m);
}
window.__crDraw = { DES, KEYS, drawBanner, drawRing, preview, name: k => (DES[k] ? DES[k].n : '') };

/*ANIM-START*/
// Çerçeve animasyonu: parlama süpürmesi + yıldız pırıltıları (sadece çerçevenin kendi piksellerinde)
const ANIM = {
  beyaz:   { col: '255,255,255', per: 4.2 },
  kirmizi: { col: '255,150,175', per: 4.8 },
  mavi:    { col: '150,200,255', per: 3.6 },
  kelebek: { col: '235,240,255', per: 4.4 },
  murekkep:{ col: '255,255,255', per: 5.2 },
  kurdele: { col: '255,235,245', per: 4.0 },
  dantel:  { col: '255,205,215', per: 4.6 },
  katana:  { col: '255,255,255', per: 5.0 },
  sakura:  { col: '255,200,220', per: 4.3 }
};
function mkAnim(el, circle) { return { el, circle: !!circle, base: null, k: null, cands: [], sp: [], u: 6 }; }
function setAnimBase(A, base, k, count) {
  A.base = base; A.k = k;
  A.el.width = base.width; A.el.height = base.height;
  A.u = Math.max(base.width, base.height) * (A.circle ? .018 : .0065);
  // pırıltı adayları: çerçevenin parlak, opak pikselları
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
    '.cr-av{position:absolute;z-index:4;pointer-events:none;display:none}' +
    '.cr-av canvas{position:absolute;left:0;top:0;display:block;animation:crBreath 4.5s ease-in-out infinite alternate}' +
    '@keyframes crBreath{from{filter:brightness(1)}to{filter:brightness(1.14) saturate(1.08)}}' +
    '.cr-ban.cr-in{animation:crBanIn .75s cubic-bezier(.2,.8,.2,1) backwards,crBreath 4.5s .75s ease-in-out infinite alternate}' +
    '.cr-av canvas.cr-in{animation:crAvIn .8s cubic-bezier(.2,1.25,.3,1) backwards,crBreath 4.5s .8s ease-in-out infinite alternate}' +
    '@keyframes crBanIn{0%{opacity:0;transform:scale(1.04);filter:brightness(2.4)}55%{opacity:1}100%{opacity:1;transform:none;filter:brightness(1)}}' +
    '@keyframes crAvIn{0%{opacity:0;transform:scale(.6) rotate(-40deg);filter:brightness(2.4)}100%{opacity:1;transform:none;filter:brightness(1)}}' +
    '.cr-ban.cr-out,.cr-av.cr-out{animation:crOut .26s ease-in forwards}' +
    '@keyframes crOut{to{opacity:0;filter:brightness(2)}}' +
    '@media (prefers-reduced-motion:reduce){.cr-ban,.cr-av canvas,.cr-ban.cr-in,.cr-av canvas.cr-in,.cr-ban.cr-out,.cr-av.cr-out{animation:none}}';
  document.head.appendChild(css);

  const banEl = document.createElement('canvas'); banEl.className = 'cr-ban'; banEl.setAttribute('aria-hidden', 'true'); wrap.appendChild(banEl);
  const avEl = document.createElement('div'); avEl.className = 'cr-av'; avEl.setAttribute('aria-hidden', 'true'); head.appendChild(avEl);
  const avCan = document.createElement('canvas'); avEl.appendChild(avCan);
  const banBase = document.createElement('canvas'), avBase = document.createElement('canvas');
  const banA = mkAnim(banEl, false), avA = mkAnim(avCan, true);
  let banKey = '', avKey = '', cur = null;

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

  // Çerçeve takılıyken banner'ın kendi kenar çizgisi gizlenir: çerçevenin ana çizgisi onun yerini alır
  const resetBan = () => { bn.style.borderColor = ''; };
  function render() {
    const w = bn.offsetWidth, h = bn.offsetHeight;
    if (!cur || !DES[cur] || !w || !h) { banEl.style.display = 'none'; avEl.style.display = 'none'; resetBan(); banKey = avKey = ''; stopLoop(); return; }
    const dpr = Math.min(window.devicePixelRatio || 1, 2), rad = parseFloat(getComputedStyle(bn).borderTopLeftRadius) || 0;
    const key = [cur, w, h, rad, dpr].join();
    if (key !== banKey) {
      const res = drawBanner(banBase, cur, w, h, rad, dpr);
      banKey = key; banEl.dataset.g = res.g; setAnimBase(banA, banBase, cur, 9);
      banEl.style.width = banBase.style.width; banEl.style.height = banBase.style.height;
      paintAnim(banA, 0);
    }
    const g = Number(banEl.dataset.g) || 0;
    banEl.style.display = 'block';
    banEl.style.left = (bn.offsetLeft - g) + 'px';
    banEl.style.top = (bn.offsetTop - g) + 'px';
    bn.style.borderColor = 'transparent';

    // avatar halkası: ana çizgi avatarın dış kenarında
    const d = av.offsetWidth;
    if (d) {
      const k2 = [cur, d, dpr].join();
      if (k2 !== avKey) {
        const q = drawRing(avBase, cur, d, dpr);
        avKey = k2; avEl.dataset.m = q.m; setAnimBase(avA, avBase, cur, 5);
        avCan.style.width = avBase.style.width; avCan.style.height = avBase.style.height;
        paintAnim(avA, 0);
      }
      const m = Number(avEl.dataset.m) || 0, C = d + 2 * m;
      avEl.style.left = (av.offsetLeft - m) + 'px'; avEl.style.top = (av.offsetTop - m) + 'px';
      avEl.style.width = C + 'px'; avEl.style.height = C + 'px';
      avEl.style.display = 'block';
    } else { avKey = ''; avEl.style.display = 'none'; }
    startLoop();
  }

  let outT = 0;
  function apply(k) {
    clearTimeout(outT);
    const nk = DES[k] ? k : null;
    if (!nk && cur && !reduce) {              // çerçeve kaldırıldı: yumuşakça sol
      banEl.classList.add('cr-out'); avEl.classList.add('cr-out');
      outT = setTimeout(() => { cur = null; banEl.classList.remove('cr-out'); avEl.classList.remove('cr-out'); render(); }, 260);
      return;
    }
    const changed = !!nk && nk !== cur;
    cur = nk; banEl.classList.remove('cr-out'); avEl.classList.remove('cr-out');
    render();
    if (changed) playIn();
  }
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

  // Profil tasarımı paneli (dolap.js) ve mağaza buradan önizler / kaydeder
  window.__lefCerceve = {
    preview: k => apply(k),
    restore: () => { const P = window.__lefProfile; if (P) apply(memo[P.id] || null); },
    saved: (id, k) => { memo[id] = k || null; }
  };
})();
