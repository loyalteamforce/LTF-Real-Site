/* ============================================================
   PROFİL EFEKTLERİ (Discord Nitro tarzı)
   Kurulum:
     1) fx-kurulum.sql dosyasını Supabase > SQL Editor'da bir kez çalıştır.
     2) app.html içinde <script type="module" src="fx.js"></script> satırı olmalı (friends.js'ten sonra).
   Ne yapar:
     - Herkesin profilinde (kendi + başkaları) seçilen efekt banner üzerinde oynar.
       Açılışta yoğun bir giriş yapar, sonra hafif bir döngüde devam eder.
     - Kendi profilinde "Profil efekti" düğmesi çıkar: hazır efektler arasından seç, canlı önizle, kaydet.
   Yeni efekt eklemek için: aşağıdaki EFFECTS listesine bir satır ekle.
     { id, n: ad, L: [ katmanlar ] }
     katman: { e: [çizim adları, ör. petal, leaf#ff9a3c], m: hareket, r: saniyedeki sayı, z: [min,maks boyut] }
     çizimler: petal leaf flake spark star heart flame drop paw bat butterfly feather confetti bubble glow
     hareketler: fall rise walk scurry hop fly swim leap peek burst orbit drift dangle trail
   Kayıt sütunu: profiles.fx (metin, efekt id'si)
   ============================================================ */
import { supabase } from './config.js';

(async function main() {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var uid = null;
  try { var ss = await supabase.auth.getSession(); uid = ss.data.session && ss.data.session.user.id; } catch (_) {}
  if (!uid) return;

  var wrap = $('.pf-bwrap'), pv = $('#v-profil'), info = $('.pf-info');
  if (!wrap || !pv || !info) return;

  /* ---------- Efekt listesi ---------- */
  var EFFECTS = [
    { id: 'kar', n: 'Kar', L: [{ e: ['flake'], m: 'fall', r: 1.2, z: [12, 22] }] },
    { id: 'sakura', n: 'Sakura', L: [{ e: ['petal'], m: 'fall', r: 1, z: [14, 22] }] },
    { id: 'sonbahar', n: 'Sonbahar', L: [{ e: ['leaf#ff9a3c', 'leaf#d9480f', 'leaf#f2c14e'], m: 'fall', r: .9, z: [18, 28] }] },
    { id: 'kivilcim', n: 'Kıvılcım', L: [{ e: ['spark'], m: 'rise', r: 1.5, z: [10, 20] }] },
    { id: 'yildiz', n: 'Yıldızlar', L: [{ e: ['star', 'spark'], m: 'burst', r: .5, z: [14, 22] }] },
    { id: 'kalp', n: 'Kalpler', L: [{ e: ['heart'], m: 'rise', r: .8, z: [14, 24] }] },
    { id: 'ates', n: 'Ateş', L: [{ e: ['flame'], m: 'rise', r: 1.4, z: [18, 30] }, { e: ['spark'], m: 'rise', r: .8, z: [8, 12] }] },
    { id: 'yagmur', n: 'Yağmur', L: [{ e: ['drop'], m: 'fall', r: 3, z: [8, 12] }] },
    { id: 'kabarcik', n: 'Kabarcıklar', L: [{ e: ['bubble'], m: 'rise', r: 1.3, z: [8, 22] }] },
    { id: 'atesbocegi', n: 'Ateşböcekleri', L: [{ e: ['glow'], m: 'drift', r: 1.3, z: [8, 16] }] },
    { id: 'kelebek', n: 'Kelebekler', L: [{ e: ['butterfly#ff8fc7', 'butterfly#7dd3fc', 'butterfly#fcd34d'], m: 'fly', r: .8, z: [26, 38], flap: 1 }, { e: ['petal'], m: 'rise', r: .4, z: [12, 18] }] },
    { id: 'yarasa', n: 'Yarasalar', L: [{ e: ['bat'], m: 'fly', r: 1.2, z: [22, 34], flap: 1 }] },
    { id: 'pati', n: 'Pati İzleri', L: [{ e: ['paw'], m: 'trail', r: 5, z: [18, 22] }, { e: ['spark'], m: 'rise', r: .5, z: [12, 18] }] },
    { id: 'konfeti', n: 'Konfeti', L: [{ e: ['confetti#ff5d73', 'confetti#ffd34d', 'confetti#4ade80', 'confetti#38bdf8', 'confetti#c084fc'], m: 'burst', r: 1.6, z: [8, 12] }] },
    { id: 'tuy', n: 'Tüyler', L: [{ e: ['feather'], m: 'fall', r: .5, z: [20, 30] }] }
  ];
  var BY = {}; EFFECTS.forEach(function (c) { BY[c.id] = c; });

  /* ---------- Tuval ---------- */
  var cv = document.createElement('canvas'); cv.id = 'pfFx'; cv.setAttribute('aria-hidden', 'true');
  wrap.appendChild(cv);
  var ctx = cv.getContext('2d');
  var W = 0, B = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2), TAIL = 90;

  var css = document.createElement('style');
  css.textContent =
    '#pfFx{position:absolute;left:0;top:0;width:100%;height:calc(100% + ' + TAIL + 'px);z-index:3;pointer-events:none}' +
    '.fx-open{margin-top:8px;height:32px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;font:inherit;font-size:13px;cursor:pointer}' +
    '.fx-open:hover{background:rgba(255,255,255,.16)}.fx-open[hidden]{display:none}' +
    '.fx-sh{position:fixed;inset:0;z-index:75;display:flex;align-items:flex-end;justify-content:center}.fx-sh[hidden]{display:none}' +
    '.fx-bd{position:absolute;inset:0}' +
    '.fx-card{position:relative;width:min(600px,100%);max-height:50vh;display:flex;flex-direction:column;background:rgba(16,16,19,.97);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.1);border-bottom:none;border-radius:20px 20px 0 0;padding:14px 14px calc(14px + env(safe-area-inset-bottom));box-shadow:0 -12px 40px rgba(0,0,0,.5);animation:fxUp .32s cubic-bezier(.2,.9,.3,1) both}' +
    '@keyframes fxUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}' +
    '.fx-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;font-size:15px}' +
    '.fx-hd span{font-size:12px;color:#9ca3af}.fx-hd span.err{color:#ffb3b3}' +
    '.fx-grid{flex:1;overflow-y:auto;overscroll-behavior:contain;display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:8px;padding:2px 2px 10px}' +
    '.fx-it{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;height:84px;padding:6px 4px;border-radius:14px;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#e5e7eb;font:inherit;font-size:11.5px;cursor:pointer;line-height:1.2;text-align:center}' +
    '.fx-it i{display:grid;place-items:center;width:34px;height:34px;font-style:normal;font-size:22px;line-height:1;color:#9ca3af}.fx-it i img{width:34px;height:34px;display:block}' +
    '.fx-it:hover{background:rgba(255,255,255,.1)}.fx-it.on{border-color:#fff;background:rgba(255,255,255,.14);color:#fff}' +
    '.fx-ft{display:flex;justify-content:flex-end;gap:8px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08)}' +
    '.fx-b{height:38px;padding:0 20px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:transparent;color:#fff;font:inherit;font-size:14px;cursor:pointer}' +
    '.fx-b.pri{background:#fff;color:#111;border-color:#fff;font-weight:600}.fx-b:disabled{opacity:.5;cursor:default}';
  document.head.appendChild(css);

  function resize() {
    W = wrap.clientWidth; B = wrap.clientHeight; H = B + TAIL;
    if (!W || !B) return;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (cur) start();
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(wrap); else window.addEventListener('resize', resize);

  /* ---------- Sprite önbelleği (çizimler tek sefer çizilir) ---------- */
  var cache = {};
  function sprite(e, s) {
    var sz = Math.max(12, Math.round(s / 6) * 6), key = e + '|' + sz;
    if (cache[key]) return cache[key];
    var px = Math.ceil(sz * 1.5 * DPR), c = document.createElement('canvas'); c.width = c.height = px;
    var x = c.getContext('2d'), m = px / 2;
    if (e === 'glow') {
      var g = x.createRadialGradient(m, m, 0, m, m, m);
      g.addColorStop(0, 'rgba(255,244,150,1)'); g.addColorStop(.25, 'rgba(255,226,90,.55)'); g.addColorStop(1, 'rgba(255,220,80,0)');
      x.fillStyle = g; x.fillRect(0, 0, px, px);
    } else if (e === 'bubble') {
      var r = px * .36, bg = x.createRadialGradient(m - r * .3, m - r * .3, r * .1, m, m, r);
      bg.addColorStop(0, 'rgba(255,255,255,.28)'); bg.addColorStop(1, 'rgba(200,235,255,.06)');
      x.fillStyle = bg; x.beginPath(); x.arc(m, m, r, 0, 6.2832); x.fill();
      x.lineWidth = Math.max(1, px * .03); x.strokeStyle = 'rgba(255,255,255,.65)'; x.stroke();
      x.beginPath(); x.arc(m, m, r * .72, 3.5, 4.4); x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = Math.max(1, px * .035); x.stroke();
    } else {
      var kd = e.split('#'), kind = kd[0], col = kd[1] ? '#' + kd[1] : null, rr = px * .3;
      x.save(); x.translate(m, m); x.lineJoin = 'round'; x.lineCap = 'round';
      var gr = function (y0, y1, c0, c1) { var g2 = x.createLinearGradient(0, y0, 0, y1); g2.addColorStop(0, c0); g2.addColorStop(1, c1); return g2; };
      if (kind === 'petal') {
        x.beginPath(); x.moveTo(0, -rr); x.bezierCurveTo(rr * .95, -rr * .7, rr * .8, rr * .8, 0, rr); x.bezierCurveTo(-rr * .8, rr * .8, -rr * .95, -rr * .7, 0, -rr);
        x.fillStyle = gr(-rr, rr, '#ffe3f1', '#ff8fc7'); x.fill();
      } else if (kind === 'leaf') {
        x.beginPath(); x.moveTo(0, -rr * 1.1); x.quadraticCurveTo(rr * 1.05, -rr * .1, 0, rr * 1.1); x.quadraticCurveTo(-rr * 1.05, -rr * .1, 0, -rr * 1.1);
        x.fillStyle = col || '#f59e0b'; x.fill();
        x.beginPath(); x.moveTo(0, -rr * .8); x.lineTo(0, rr * 1.1); x.strokeStyle = 'rgba(0,0,0,.28)'; x.lineWidth = Math.max(1, px * .03); x.stroke();
      } else if (kind === 'flake') {
        x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = Math.max(1.2, px * .045);
        for (var i = 0; i < 6; i++) {
          x.save(); x.rotate(i * Math.PI / 3);
          x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -rr); x.moveTo(0, -rr * .55); x.lineTo(rr * .26, -rr * .8); x.moveTo(0, -rr * .55); x.lineTo(-rr * .26, -rr * .8); x.stroke(); x.restore();
        }
      } else if (kind === 'spark' || kind === 'star') {
        x.beginPath();
        if (kind === 'spark') { x.moveTo(0, -rr * 1.1); x.quadraticCurveTo(rr * .12, -rr * .12, rr * 1.1, 0); x.quadraticCurveTo(rr * .12, rr * .12, 0, rr * 1.1); x.quadraticCurveTo(-rr * .12, rr * .12, -rr * 1.1, 0); x.quadraticCurveTo(-rr * .12, -rr * .12, 0, -rr * 1.1); x.fillStyle = gr(-rr, rr, '#ffffff', '#ffe27a'); }
        else { for (var k = 0; k < 10; k++) { var ra = k % 2 ? rr * .45 : rr * 1.05, an = -Math.PI / 2 + k * Math.PI / 5; x[k ? 'lineTo' : 'moveTo'](Math.cos(an) * ra, Math.sin(an) * ra); } x.closePath(); x.fillStyle = gr(-rr, rr, '#ffe27a', '#ffb21e'); }
        x.fill();
      } else if (kind === 'heart') {
        x.beginPath(); x.moveTo(0, rr * .95); x.bezierCurveTo(-rr * 1.6, -rr * .1, -rr * .7, -rr * 1.1, 0, -rr * .4); x.bezierCurveTo(rr * .7, -rr * 1.1, rr * 1.6, -rr * .1, 0, rr * .95);
        x.fillStyle = gr(-rr, rr, '#ff7a98', '#e11d48'); x.fill();
      } else if (kind === 'flame') {
        x.beginPath(); x.moveTo(0, -rr * 1.15); x.bezierCurveTo(rr * .95, -rr * .2, rr * .85, rr * .95, 0, rr); x.bezierCurveTo(-rr * .85, rr * .95, -rr * .95, -rr * .2, 0, -rr * 1.15);
        x.fillStyle = gr(-rr, rr, '#ff4d2e', '#ffd54a'); x.fill();
        x.beginPath(); x.ellipse(0, rr * .42, rr * .32, rr * .5, 0, 0, 6.2832); x.fillStyle = 'rgba(255,250,210,.9)'; x.fill();
      } else if (kind === 'drop') {
        x.beginPath(); x.moveTo(0, -rr * 1.1); x.bezierCurveTo(rr * .9, rr * .1, rr * .8, rr * .95, 0, rr * .95); x.bezierCurveTo(-rr * .8, rr * .95, -rr * .9, rr * .1, 0, -rr * 1.1);
        x.fillStyle = gr(-rr, rr, '#cfeaff', '#3b8fff'); x.fill();
      } else if (kind === 'paw') {
        x.fillStyle = 'rgba(255,255,255,.88)';
        x.beginPath(); x.ellipse(0, rr * .35, rr * .52, rr * .42, 0, 0, 6.2832); x.fill();
        [[-.62, -.15, .2], [-.22, -.62, .21], [.22, -.62, .21], [.62, -.15, .2]].forEach(function (t) { x.beginPath(); x.ellipse(t[0] * rr, t[1] * rr, rr * t[2], rr * (t[2] + .06), 0, 0, 6.2832); x.fill(); });
      } else if (kind === 'bat') {
        x.fillStyle = '#1c1c25'; x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = Math.max(1, px * .02);
        [1, -1].forEach(function (sg) {
          x.save(); x.scale(sg, 1); x.beginPath(); x.moveTo(0, -rr * .1);
          x.quadraticCurveTo(rr * .45, -rr * .95, rr * 1.35, -rr * .45); x.quadraticCurveTo(rr * 1.1, -rr * .1, rr * 1.0, rr * .2);
          x.quadraticCurveTo(rr * .72, -rr * .05, rr * .5, rr * .4); x.quadraticCurveTo(rr * .25, rr * .08, 0, rr * .5); x.closePath(); x.fill(); x.stroke(); x.restore();
        });
        x.beginPath(); x.ellipse(0, rr * .05, rr * .2, rr * .38, 0, 0, 6.2832); x.fill();
      } else if (kind === 'butterfly') {
        var bc = col || '#ff8fc7';
        [1, -1].forEach(function (sg) {
          x.save(); x.scale(sg, 1);
          x.beginPath(); x.ellipse(rr * .5, -rr * .32, rr * .55, rr * .72, -.5, 0, 6.2832); x.fillStyle = bc; x.fill();
          x.beginPath(); x.ellipse(rr * .4, rr * .5, rr * .38, rr * .5, .45, 0, 6.2832); x.fillStyle = 'rgba(255,255,255,.55)'; x.fill();
          x.restore();
        });
        x.beginPath(); x.moveTo(0, -rr * .55); x.lineTo(0, rr * .7); x.strokeStyle = 'rgba(30,30,40,.8)'; x.lineWidth = Math.max(1.4, px * .05); x.stroke();
      } else if (kind === 'feather') {
        x.rotate(.7); x.beginPath(); x.ellipse(0, 0, rr * .38, rr * 1.15, 0, 0, 6.2832); x.fillStyle = 'rgba(255,255,255,.9)'; x.fill();
        x.beginPath(); x.moveTo(0, -rr * 1.15); x.lineTo(0, rr * 1.3); x.strokeStyle = 'rgba(160,170,190,.9)'; x.lineWidth = Math.max(1, px * .03); x.stroke();
      } else if (kind === 'confetti') {
        x.rotate(.5); x.fillStyle = col || '#ffd34d'; x.fillRect(-rr * .5, -rr * .26, rr, rr * .52);
      }
      x.restore();
    }
    cache[key] = c; return c;
  }

  /* ---------- Parçacık motoru ---------- */
  var R = function (a, b) { return a + Math.random() * (b - a); };
  var ease = function (u) { return u < 0 ? 0 : u > 1 ? 1 : u * u * (3 - 2 * u); };
  var cur = null, parts = [], accs = [], T = 0, raf = 0, last = 0, trailX = 0;

  function avatar() {
    var a = $('#pfAv'), cr = cv.getBoundingClientRect();
    if (!a || !cr.width) return { x: 80, y: B, r: 150 };
    var r = a.getBoundingClientRect();
    return { x: r.left + r.width / 2 - cr.left, y: r.top + r.height / 2 - cr.top, r: r.right - cr.left };
  }

  function spawn(L) {
    var e = L.e[Math.floor(Math.random() * L.e.length)], s = R(L.z[0], L.z[1]), dir = Math.random() < .5 ? -1 : 1;
    var p = { e: e, s: s, m: L.m, L: L, t: 0, life: 5, x: 0, y: 0, rot: 0, a: 1, dir: dir, ph: R(0, 6.283), flip: false, sx: 1, sy: 1 };
    var sp, av, fl;
    switch (L.m) {
      case 'fall': p.x0 = R(0, W); p.vy = R(55, 115); p.sw = R(8, 26); p.y = -s; p.life = (H + 2 * s) / p.vy; break;
      case 'rise': p.x0 = R(0, W); p.vy = -R(35, 80); p.sw = R(8, 24); p.y = H + s; p.life = (H + 2 * s) / -p.vy; break;
      case 'walk': case 'scurry': case 'hop':
        sp = L.m === 'scurry' ? R(150, 210) : L.sp ? R(L.sp[0], L.sp[1]) : R(46, 64);
        p.vx = dir * sp; p.x = dir > 0 ? -s : W + s; p.life = (W + 2 * s) / sp; p.flip = dir > 0; break;
      case 'fly':
        sp = L.fast ? R(170, 230) : R(70, 120); p.y0 = R(.08 * B, .6 * B); p.vx = dir * sp; p.x = dir > 0 ? -s : W + s;
        p.y = p.y0; p.life = (W + 2 * s) / sp; p.flip = dir > 0; break;
      case 'swim':
        sp = R(34, 62); p.y0 = L.shore ? R(B - s * .7, B - s * .35) : R(.2 * B, B - s * .6); p.vx = dir * sp; p.x = dir > 0 ? -s : W + s;
        p.y = p.y0; p.life = (W + 2 * s) / sp; p.flip = dir > 0; break;
      case 'leap':
        sp = R(110, 150); p.vx = dir * sp; p.x = dir > 0 ? -s : W + s; p.life = (W + 2 * s) / sp; p.h = R(.35 * B, .65 * B); p.flip = dir > 0; break;
      case 'peek':
        av = avatar(); p.x = av.r < W * .6 ? R(av.r + 30, W - 30) : R(30, W - 30); p.life = 3; p.clip = B; p.y = B + s; break;
      case 'burst':
        av = avatar(); p.x = av.x; p.y = av.y; var ang = R(-2.9, -.25), v = R(130, 300);
        p.vx = Math.cos(ang) * v; p.vy = Math.sin(ang) * v; p.vr = R(-3, 3); p.life = R(1.4, 2.2); break;
      case 'orbit':
        av = avatar(); p.cx = av.x; p.cy = av.y; p.rad = R(76, 112); p.w = R(1.1, 1.9) * dir; p.life = R(4.5, 7); break;
      case 'drift':
        p.x = R(.05 * W, .95 * W); p.y = R(.1 * B, B + TAIL * .5); p.vx = R(-10, 10); p.vy = R(-8, 8); p.life = R(5, 8); break;
      case 'dangle':
        p.x = R(.15 * W, .95 * W); p.tg = R(.25 * B, .6 * B); p.line = true; p.life = 5; p.y = 0; break;
      case 'trail':
        fl = B - 22; trailX += 30; if (trailX > W + 20) trailX = -20;
        p.x = trailX; p.y = fl + (Math.round(trailX / 30) % 2 ? 7 : -7); p.rot = Math.PI / 2 + R(-.12, .12); p.life = 2.2; break;
    }
    return p;
  }

  function update(p, dt) {
    p.t += dt; if (p.t >= p.life) return false;
    var t = p.t, u = t / p.life, fl = B - p.s * .42, k, uu;
    p.a = Math.min(1, t / .35, (p.life - t) / .45);
    switch (p.m) {
      case 'fall': p.y += p.vy * dt; p.x = p.x0 + Math.sin(t * 1.7 + p.ph) * p.sw; p.rot = Math.sin(t * 2 + p.ph) * .35; break;
      case 'rise': p.y += p.vy * dt; p.x = p.x0 + Math.sin(t * 1.5 + p.ph) * p.sw; p.rot = Math.sin(t * 1.8 + p.ph) * .25; break;
      case 'walk': p.x += p.vx * dt; p.y = fl - Math.abs(Math.sin(t * 6)) * 5; p.rot = Math.sin(t * 6) * .14; break;
      case 'scurry': p.x += p.vx * dt; p.y = fl - Math.abs(Math.sin(t * 16)) * 3; p.rot = Math.sin(t * 16) * .06; break;
      case 'hop': p.x += p.vx * dt; uu = (t % .85) / .85; p.y = fl - 88 * uu * (1 - uu); p.rot = (uu - .5) * .3 * -Math.sign(p.vx); break;
      case 'fly':
        p.x += p.vx * dt; p.y = p.y0 + Math.sin(t * 2.6 + p.ph) * 16; p.rot = Math.sin(t * 2.6 + p.ph) * .18;
        if (p.L.flap) p.sx = .7 + .3 * Math.abs(Math.sin(t * 10)); break;
      case 'swim': p.x += p.vx * dt; p.y = p.y0 + Math.sin(t * 1.6 + p.ph) * 9; p.rot = Math.cos(t * 1.6 + p.ph) * .1; break;
      case 'leap': {
        p.x += p.vx * dt; var base = B + p.s * .35; p.y = base - 4 * p.h * u * (1 - u);
        var vy = -4 * p.h * (1 - 2 * u) / p.life, th = Math.atan2(vy, p.vx);
        p.rot = p.vx < 0 ? th - Math.PI : th; if (p.rot < -Math.PI) p.rot += 2 * Math.PI; p.a = 1; break; }
      case 'peek':
        k = t < .55 ? ease(t / .55) : t > 2.45 ? 1 - ease((t - 2.45) / .55) : 1;
        p.y = B + p.s * .45 - k * p.s * .95; p.rot = (t > .55 && t < 2.45) ? Math.sin(t * 6) * .1 : 0; p.a = 1; break;
      case 'burst':
        p.vy += 300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.a = Math.min(1, t / .1, (p.life - t) / .6); break;
      case 'orbit': {
        var ang = p.ph + p.w * t; p.x = p.cx + Math.cos(ang) * p.rad; p.y = p.cy + Math.sin(ang) * p.rad * .55;
        p.sx = p.sy = .85 + .25 * Math.sin(ang); p.rot = Math.cos(ang) * .2; break; }
      case 'drift':
        p.x += p.vx * dt; p.y += (p.vy + Math.sin(t * 1.3 + p.ph) * 14) * dt;
        if (p.e === 'glow') p.a *= (.55 + .45 * Math.sin(t * 3 + p.ph)); else p.rot = Math.sin(t + p.ph) * .15;
        break;
      case 'dangle':
        p.y = u < .25 ? p.tg * ease(u / .25) : u > .8 ? p.tg * (1 - ease((u - .8) / .2)) : p.tg + Math.sin(t * 3) * 4;
        p.rot = Math.sin(t * 2.5) * .12; p.a = Math.min(1, t / .2, (p.life - t) / .2); break;
      case 'trail': p.a = Math.min(1, t / .15) * (1 - u) * .85; break;
    }
    return true;
  }

  function draw(p) {
    if (p.a <= .01) return;
    ctx.save(); ctx.globalAlpha = Math.min(1, p.a);
    if (p.clip != null) { ctx.beginPath(); ctx.rect(0, 0, W, p.clip); ctx.clip(); }
    if (p.line) { ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, 0); ctx.lineTo(p.x, p.y - p.s * .3); ctx.stroke(); }
    var spr = sprite(p.e, p.s), d = p.s * 1.5 * (p.e === 'glow' ? 1.4 : 1);
    ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale((p.flip ? -1 : 1) * p.sx, p.sy);
    ctx.drawImage(spr, -d / 2, -d / 2, d, d);
    ctx.restore();
  }

  function frame(ts) {
    raf = requestAnimationFrame(frame);
    var dt = Math.min(.05, (ts - last) / 1000); last = ts; T += dt;
    ctx.clearRect(0, 0, W, H);
    var boost = T < 2.5 ? 3 : .8;                       // açılışta yoğun giriş, sonra hafif döngü
    cur.L.forEach(function (L, i) {
      accs[i] += L.r * boost * dt;
      while (accs[i] >= 1) { accs[i] -= 1; if (parts.length < 34) parts.push(spawn(L)); }
    });
    parts = parts.filter(function (p) { return update(p, dt); });
    for (var i = 0; i < parts.length; i++) draw(parts[i]);
  }

  function active() { return cur && !reduce && !document.hidden && pv.classList.contains('on') && W > 0; }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; parts = []; if (W) ctx.clearRect(0, 0, W, H); }
  function start() {
    stop(); if (!active()) return;
    T = 0; trailX = -20; accs = cur.L.map(function () { return 0; }); last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function apply(id) { cur = BY[id] || null; if (cur) start(); else stop(); }

  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (cur) start(); });
  new MutationObserver(function () { if (pv.classList.contains('on')) { if (cur && !raf) start(); } else stop(); })
    .observe(pv, { attributes: true, attributeFilter: ['class'] });

  /* ---------- Veri: profiles.fx ---------- */
  var memo = {}, curId = null;
  async function load(id) {
    if (Object.prototype.hasOwnProperty.call(memo, id)) return memo[id];
    try {
      var r = await supabase.from('profiles').select('fx').eq('id', id).maybeSingle();
      if (r.error) return null;                                  // sütun yoksa sessizce efektsiz
      memo[id] = (r.data && BY[r.data.fx]) ? r.data.fx : null; return memo[id];
    } catch (_) { return null; }
  }
  async function onProfile() {
    var P = window.__lefProfile; if (!P) return;
    btn.hidden = !P.mine;
    var same = curId === P.id; curId = P.id;
    var fx = await load(P.id);
    if (curId !== P.id) return;
    if (same && cur && cur.id === fx && raf) return;             // aynı profil yeniden çizildi: efekti baştan başlatma
    apply(fx);
  }

  /* ---------- Seçici (sadece kendi profilinde) ---------- */
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'fx-open'; btn.hidden = true; btn.textContent = 'Profil efekti';
  info.appendChild(btn);

  var sh = document.createElement('div');
  sh.className = 'fx-sh ux-noswipe'; sh.hidden = true;
  sh.innerHTML = '<div class="fx-bd"></div><div class="fx-card" role="dialog" aria-modal="true" aria-label="Profil efekti">' +
    '<div class="fx-hd"><b>Profil efekti</b><span id="fxMsg"></span></div><div class="fx-grid" id="fxGrid"></div>' +
    '<div class="fx-ft"><button type="button" class="fx-b" id="fxCancel">İptal</button><button type="button" class="fx-b pri" id="fxSave">Kaydet</button></div></div>';
  document.body.appendChild(sh);
  var grid = $('#fxGrid', sh), msg = $('#fxMsg', sh), saveB = $('#fxSave', sh), pick = null, saved = null;

  function mark() { grid.querySelectorAll('.fx-it').forEach(function (b) { b.classList.toggle('on', (b.dataset.id || '') === (pick || '')); }); }
  function say(t, err) { msg.textContent = t || ''; msg.className = err ? 'err' : ''; }
  function build() {
    if (grid.firstChild) return;
    var list = [{ id: '', n: 'Yok' }].concat(EFFECTS);
    list.forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'fx-it'; b.dataset.id = c.id;
      var i = document.createElement('i');
      if (c.L) { var im = document.createElement('img'); im.alt = ''; im.width = im.height = 34; im.src = sprite(c.L[0].e[0], 24).toDataURL(); i.appendChild(im); } else { i.textContent = '\u2013'; }
      var s = document.createElement('span'); s.textContent = c.n;
      b.appendChild(i); b.appendChild(s); grid.appendChild(b);
    });
  }
  grid.addEventListener('click', function (e) {
    var b = e.target.closest('.fx-it'); if (!b) return;
    pick = b.dataset.id || null; mark(); say(''); apply(pick);   // canlı önizleme
  });
  async function open() {
    var P = window.__lefProfile; if (!P || !P.mine) return;
    build(); saved = await load(P.id); pick = saved; mark(); say('');
    window.scrollTo(0, 0); sh.hidden = false;
  }
  function close(revert) { sh.hidden = true; if (revert) apply(saved); }
  btn.addEventListener('click', open);
  $('.fx-bd', sh).addEventListener('click', function () { close(true); });
  $('#fxCancel', sh).addEventListener('click', function () { close(true); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sh.hidden) close(true); });
  saveB.addEventListener('click', async function () {
    saveB.disabled = true; say('Kaydediliyor...');
    var r = await supabase.from('profiles').update({ fx: pick }).eq('id', uid);
    saveB.disabled = false;
    if (r.error) {
      say(/fx/i.test(r.error.message) ? 'Kaydedilemedi: fx-kurulum.sql henüz çalıştırılmamış.' : 'Kaydedilemedi: ' + r.error.message, true);
      return;
    }
    memo[uid] = pick; saved = pick; close(false);
  });

  window.addEventListener('lef-profile', onProfile);
  resize();
  onProfile();                                                     // fx.js, profil çizildikten sonra yüklendiyse
})();
