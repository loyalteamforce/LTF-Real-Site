/* ============================================================
   PROFİL TASARIMLARI (tema + avatar çerçevesi + açılış animasyonu)
   Kurulum:
     1) tema-kurulum.sql dosyasını Supabase > SQL Editor'da bir kez çalıştır.
     2) app.html içinde fx.js satırından sonra şu satır olmalı:
          <script type="module" src="tema.js"></script>
   Ne yapar:
     - Herkesin profili, sahibinin seçtiği tasarımla görünür (renkler, kart stili,
       isim yazı tipi, arka plan ışığı, hafif ortam efekti).
     - Her tasarımın kendi giriş animasyonu vardır. Profil sekmesi her açıldığında
       veya başka birinin profiline girildiğinde baştan oynar.
     - Profil fotoğrafının etrafında animasyonlu çerçeve (halka, yörünge, taç...).
     - Kendi profilinde "Tasarım" düğmesi çıkar: canlı önizle, kaydet.
   Yeni tasarım eklemek: THEMES listesine bir satır ekle.
     { id, n: ad, t: '', a: ana renk, b: ikinci renk, an: animasyon, f: yazı tipi, r: köşe yuvarlaklığı, amb: ortam }
     an: Rise Zoom Flip Slide Drop Glitch Unfold   amb: stars snow embers scan
   Yeni çerçeve eklemek: FRAMES listesine bir satır + aşağıdaki CSS'e [data-f="id"] kuralları.
   Kayıt sütunları: profiles.theme, profiles.frame (metin, sadece id)
   ============================================================ */
import { supabase } from './config.js';

(async function main() {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var uid = null;
  try { var ss = await supabase.auth.getSession(); uid = ss.data.session && ss.data.session.user.id; } catch (_) {}
  if (!uid) return;

  var pv = $('#v-profil'), head = $('.pf-head'), info = $('.pf-info'), ban = $('#pfBan'), bio = $('#bio');
  if (!pv || !head || !info || !ban || !bio) return;

  /* ---------- Tasarım listesi ---------- */
  var THEMES = [
    { id: 'sonbahar',  n: 'Sonbahar',    t: '', a: '#ff9a3c', b: '#c2410c', an: 'Rise',   f: "'Caveat',cursive", r: 18, amb: 'embers' },
    { id: 'neon',      n: 'Neon Gece',   t: '', a: '#00f0ff', b: '#ff2bd6', an: 'Glitch', f: "'Bebas Neue',sans-serif", r: 6, amb: 'scan' },
    { id: 'altin',     n: 'Altın Asalet', t: '', a: '#f5c451', b: '#b8741a', an: 'Unfold', f: "'Cinzel',serif", r: 4 },
    { id: 'buz',       n: 'Buz',         t: '', a: '#8fdcff', b: '#dff7ff', an: 'Flip',   r: 22, amb: 'snow' },
    { id: 'kizil',     n: 'Kızıl',       t: '', a: '#ff3b3b', b: '#7a0c1a', an: 'Zoom',   f: "'Bebas Neue',sans-serif", r: 10, amb: 'embers' },
    { id: 'zumrut',    n: 'Zümrüt',      t: '', a: '#34d399', b: '#0f766e', an: 'Slide',  r: 14 },
    { id: 'okyanus',   n: 'Okyanus',     t: '', a: '#38bdf8', b: '#2563eb', an: 'Rise',   r: 20 },
    { id: 'sakura',    n: 'Sakura',      t: '', a: '#ff8fc7', b: '#c084fc', an: 'Drop',   f: "'Dancing Script',cursive", r: 26 },
    { id: 'galaksi',   n: 'Galaksi',     t: '', a: '#a78bfa', b: '#3b82f6', an: 'Zoom',   r: 16, amb: 'stars' },
    { id: 'ltf',       n: 'LTF Mühür',   t: '', a: '#e5e7eb', b: '#6b7280', an: 'Unfold', f: "'Cinzel',serif", r: 8 },
    { id: 'gunbatimi', n: 'Gün Batimı',  t: '', a: '#fb7185', b: '#f59e0b', an: 'Slide',  r: 18 },
    { id: 'matrix',    n: 'Matrix',      t: '', a: '#22ff88', b: '#0a7d3b', an: 'Glitch', f: "ui-monospace,Menlo,monospace", r: 2, amb: 'scan' }
  ];

  /* ---------- Çerçeve listesi (görünümü aşağıdaki CSS'te) ---------- */
  var SV = function (v, p) { return '<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">' + p + '</svg>'; };
  var leaf = function (c) { return SV(0, '<path d="M12 2c6 4 9 10 0 20C3 12 6 6 12 2Z" fill="' + c + '"/><path d="M12 6v14" stroke="rgba(0,0,0,.3)" stroke-width="1.2" fill="none"/>'); };
  var heart = function (c) { return SV(0, '<path d="M12 21C4 14 2 9.5 2 7a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 2.5-2 7-10 14Z" fill="' + c + '"/>'); };
  var spark = function () { return SV(0, '<path d="M12 1c1 6 5 10 11 11-6 1-10 5-11 11-1-6-5-10-11-11 6-1 10-5 11-11Z" fill="currentColor"/>'); };
  var CROWN = SV(0, '<path d="M3 18 2 7l5.5 4.5L12 4l4.5 7.5L22 7l-1 11Z" fill="#f5c451" stroke="#b8741a" stroke-width="1"/><rect x="3" y="19" width="18" height="2.4" rx="1" fill="#f5c451"/>');
  var LEAVES = [leaf('#ff9a3c'), leaf('#d9480f'), leaf('#ff9a3c'), leaf('#d9480f'), leaf('#ff9a3c'), leaf('#d9480f'), leaf('#ff9a3c'), leaf('#d9480f')];
  function orbit(list, cls) {
    var h = '<b class="o ' + (cls || '') + '" style="--n:' + list.length + '">';
    list.forEach(function (e, i) { h += '<em style="--i:' + i + '">' + e + '</em>'; });
    return h + '</b>';
  }
  var FRAMES = [
    { id: 'orbit',     n: 'Altın Yörünge', t: '', h: '<i class="r r1"></i><i class="r r2"></i><i class="r r3"></i>' },
    { id: 'neon',      n: 'Neon Halka',    t: '', h: '<i class="r g"></i><i class="r"></i>' },
    { id: 'ates',      n: 'Ateş',          t: '', h: '<i class="r g"></i><i class="r"></i>' },
    { id: 'yaprak',    n: 'Sonbahar Çelengi', t: '', h: '<i class="r"></i>' + orbit(LEAVES) },
    { id: 'halo',      n: 'Melek Halkası', t: '', h: '<i class="h"></i>' },
    { id: 'gokkusagi', n: 'Gökkuşağı',     t: '', h: '<i class="r g"></i><i class="r"></i>' },
    { id: 'buz',       n: 'Buz Kristali',  t: '', h: '<i class="r"></i>' + orbit([spark(), spark(), spark(), spark(), spark(), spark()], 'fix') },
    { id: 'kalp',      n: 'Kalp Atışı',    t: '', h: '<i class="r"></i>' + orbit([heart('#ff5d8f'), heart('#ff9ec0'), heart('#ff5d8f'), heart('#ff9ec0')]) },
    { id: 'ltf',       n: 'LTF Mühür',     t: '', h: '<i class="r"></i><i class="r s"></i>' },
    { id: 'glitch',    n: 'Glitch',        t: '', h: '<i class="r c1"></i><i class="r c2"></i><i class="r c3"></i>' },
    { id: 'tac',       n: 'Taç',           t: '', h: '<i class="r"></i><em class="k">' + CROWN + '</em>' },
    { id: 'galaksi',   n: 'Galaksi',       t: '', h: '<i class="r g"></i><i class="r"></i>' + orbit([spark(), spark(), spark(), spark(), spark(), spark()], 'rev') }
  ];
  var TBY = Object.create(null), FBY = Object.create(null);
  THEMES.forEach(function (x) { TBY[x.id] = x; });
  FRAMES.forEach(function (x) { FBY[x.id] = x; });

  function rgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
  }

  /* ---------- CSS ---------- */
  var css = document.createElement('style');
  css.textContent = [
    /* Katmanlar */
    '#v-profil{position:relative}',
    '.tm-aura{position:absolute;left:-16px;right:-16px;top:-24px;height:640px;z-index:-1;pointer-events:none;overflow:hidden;opacity:0;transition:opacity .8s ease;-webkit-mask-image:linear-gradient(#000 55%,transparent);mask-image:linear-gradient(#000 55%,transparent)}',
    '#v-profil[data-tm] .tm-aura{opacity:1}',
    '.tm-aura::before{content:"";position:absolute;inset:-20%;background:var(--tm-bg);animation:tmDrift 14s ease-in-out infinite alternate}',
    '.tm-aura::after{content:"";position:absolute;inset:0}',
    '#v-profil[data-amb=stars] .tm-aura::after{background-image:radial-gradient(1.5px 1.5px at 20px 30px,#fff,transparent),radial-gradient(1px 1px at 80px 90px,#fff,transparent),radial-gradient(2px 2px at 140px 40px,rgba(255,255,255,.9),transparent),radial-gradient(1px 1px at 190px 130px,#fff,transparent);background-size:220px 160px;animation:tmTw2 3.5s ease-in-out infinite alternate}',
    '#v-profil[data-amb=snow] .tm-aura::after{background-image:radial-gradient(3px 3px at 20px 20px,rgba(255,255,255,.85),transparent),radial-gradient(2px 2px at 90px 70px,rgba(255,255,255,.7),transparent),radial-gradient(2.5px 2.5px at 50px 120px,rgba(255,255,255,.8),transparent);background-size:140px 140px;animation:tmFall 9s linear infinite}',
    '#v-profil[data-amb=embers] .tm-aura::after{background-image:radial-gradient(2.5px 2.5px at 25px 110px,var(--tm-a),transparent),radial-gradient(2px 2px at 95px 60px,var(--tm-a),transparent),radial-gradient(3px 3px at 60px 20px,var(--tm-b),transparent);background-size:150px 150px;opacity:.7;animation:tmRiseBg 8s linear infinite}',
    '#v-profil[data-amb=scan] .tm-aura::after{background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.06) 0 1px,transparent 1px 4px);animation:tmScan 6s linear infinite}',

    /* Kartlar: biyografi + bilgi */
    '.tm-info{position:relative;z-index:2;margin:12px 14px 0;padding:14px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);display:grid;gap:10px}',
    '.tm-info[hidden]{display:none}',
    '.tm-row{display:flex;align-items:baseline;justify-content:space-between;gap:12px;font-size:13px;color:#9ca3af}',
    '.tm-row[hidden]{display:none}',
    '.tm-row b{font-weight:600;font-size:14px;color:#e5e7eb;text-align:right}',
    '#v-profil.pf-loading .tm-info{display:none}',
    '#v-profil[data-tm] .bio,#v-profil[data-tm] .tm-info{border-radius:var(--tm-r,14px);border-color:rgba(var(--tm-ar),.32);background:linear-gradient(135deg,rgba(var(--tm-ar),.15),rgba(var(--tm-br),.07)),rgba(12,12,16,.55);box-shadow:0 14px 34px -18px rgba(var(--tm-ar),.8);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}',
    '#v-profil[data-tm] .bio::before,#v-profil[data-tm] .tm-info::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1.5px;pointer-events:none;opacity:.85;background:linear-gradient(120deg,var(--tm-a),var(--tm-b),var(--tm-a));background-size:300% 100%;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);animation:tmBd 6s linear infinite}',
    '#v-profil[data-tm] .tm-row span,#v-profil[data-tm] .bio-top{color:rgba(var(--tm-ar),.95)}',
    '#v-profil[data-tm] .pf-banner{border-color:rgba(var(--tm-ar),.45);box-shadow:0 18px 50px -20px rgba(var(--tm-ar),.9)}',
    '#v-profil[data-tm] .pf-name span{font-family:var(--tm-f,inherit);background:linear-gradient(90deg,var(--tm-a),var(--tm-b),var(--tm-a));background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:tmNm 6s linear infinite;padding-bottom:3px}',
    '.tm-sheen{position:absolute;top:0;bottom:0;left:0;width:38%;z-index:2;pointer-events:none;opacity:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent)}',

    /* Giriş animasyonları (profil her görününce baştan) */
    '#v-profil.tm-run .pf-banner{animation:var(--tm-an,popIn) .75s cubic-bezier(.2,.9,.3,1) backwards}',
    '#v-profil.tm-run .pf-head{animation:var(--tm-an,popIn) .75s cubic-bezier(.2,.9,.3,1) .12s backwards}',
    '#v-profil.tm-run .bio{animation:var(--tm-an,popIn) .75s cubic-bezier(.2,.9,.3,1) .3s backwards}',
    '#v-profil.tm-run .tm-info{animation:var(--tm-an,popIn) .75s cubic-bezier(.2,.9,.3,1) .42s backwards}',
    '#v-profil.tm-run .pf-av{animation:tmAvPop .85s cubic-bezier(.3,1.5,.5,1) .28s backwards}',
    '#v-profil.tm-run .tm-fr{animation:tmFrIn 1s ease .6s backwards}',
    '#v-profil.tm-run .tm-sheen{animation:tmSheen 1.3s ease .5s both}',
    '#v-profil.tm-wait .pf-banner,#v-profil.tm-wait .pf-head,#v-profil.tm-wait .bio,#v-profil.tm-wait .tm-info{opacity:0;animation:none!important}',
    '@keyframes tmRise{from{opacity:0;transform:translateY(34px);filter:blur(8px)}to{opacity:1;transform:none;filter:none}}',
    '@keyframes tmZoom{from{opacity:0;transform:scale(.8);filter:blur(10px)}to{opacity:1;transform:none;filter:none}}',
    '@keyframes tmFlip{from{opacity:0;transform:perspective(700px) rotateX(-75deg);transform-origin:top}to{opacity:1;transform:perspective(700px) rotateX(0);transform-origin:top}}',
    '@keyframes tmSlide{from{opacity:0;transform:translateX(-48px)}to{opacity:1;transform:none}}',
    '@keyframes tmDrop{0%{opacity:0;transform:translateY(-64px)}60%{opacity:1;transform:translateY(10px)}80%{transform:translateY(-4px)}100%{opacity:1;transform:none}}',
    '@keyframes tmGlitch{0%{opacity:0;transform:translateX(-14px) skewX(12deg);filter:hue-rotate(90deg)}20%{opacity:1;transform:translateX(10px) skewX(-8deg)}35%{transform:translateX(-6px);clip-path:inset(20% 0 40% 0)}50%{clip-path:inset(-80px);transform:translateX(5px)}65%{transform:translateX(-3px);filter:hue-rotate(-60deg)}100%{opacity:1;transform:none;filter:none;clip-path:inset(-80px)}}',
    '@keyframes tmUnfold{from{opacity:0;clip-path:inset(0 50% 0 50%)}to{opacity:1;clip-path:inset(-80px)}}',
    '@keyframes tmAvPop{0%{transform:scale(0) rotate(-120deg);opacity:0}70%{transform:scale(1.12) rotate(8deg);opacity:1}100%{transform:none;opacity:1}}',
    '@keyframes tmFrIn{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}',
    '@keyframes tmSheen{from{transform:translateX(-120%) skewX(-20deg);opacity:.9}to{transform:translateX(300%) skewX(-20deg);opacity:0}}',
    '@keyframes tmDrift{from{transform:translate(-3%,-2%) scale(1)}to{transform:translate(3%,3%) scale(1.08)}}',
    '@keyframes tmBd{to{background-position:300% 0}}',
    '@keyframes tmNm{to{background-position:200% 0}}',
    '@keyframes tmTw2{from{opacity:.3}to{opacity:1}}',
    '@keyframes tmFall{to{background-position:0 140px}}',
    '@keyframes tmRiseBg{to{background-position:0 -150px}}',
    '@keyframes tmScan{to{background-position:0 40px}}',

    /* ===== Avatar çerçeveleri ===== */
    '.tm-fr{--d:132px;position:absolute;left:14px;top:0;width:var(--d);height:var(--d);z-index:4;pointer-events:none;perspective:700px}',
    '.tm-fr[hidden]{display:none}',
    '@media (max-width:600px){.tm-fr{--d:104px}}',
    '.tm-fr .r{--t:4px;position:absolute;inset:-9px;border-radius:50%;-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - var(--t) - 1px),#000 calc(100% - var(--t)));mask:radial-gradient(farthest-side,transparent calc(100% - var(--t) - 1px),#000 calc(100% - var(--t)))}',
    '.tm-fr .r.g{filter:blur(9px);opacity:.9}',
    '.tm-fr em,.tm-fr b{font-style:normal;font-weight:400}',
    '.tm-fr .o{position:absolute;inset:0;animation:tmSpin 14s linear infinite}',
    '.tm-fr .o.rev{animation:tmSpinR 18s linear infinite}',
    '.tm-fr .o.fix{animation:none}',
    '.tm-fr .o em{position:absolute;left:50%;top:50%;font-size:calc(var(--d)*.15);line-height:1;transform:translate(-50%,-50%) rotate(calc(var(--i)*360deg/var(--n))) translateY(calc(var(--d)/-2 - 12px))}',
    '.tm-fr .o.fix em{animation:tmTw 2.2s ease-in-out infinite;animation-delay:calc(var(--i)*.35s);color:#dff7ff;text-shadow:0 0 8px #7fd6ff}',
    '@keyframes tmSpin{to{transform:rotate(360deg)}}',
    '@keyframes tmSpinR{to{transform:rotate(-360deg)}}',
    '@keyframes tmTw{0%,100%{opacity:.25;scale:.6}50%{opacity:1;scale:1.25}}',
    '@keyframes tmPulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.07)}}',
    '@keyframes tmBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}',

    /* Altın Yörünge */
    '.tm-fr[data-f=orbit]::before{content:"";position:absolute;inset:-22px;border-radius:50%;background:radial-gradient(circle,rgba(255,190,80,.38),transparent 65%);animation:tmPulse 2.6s ease-in-out infinite}',
    '.tm-fr[data-f=orbit] .r{--t:5px;inset:-12px;background:conic-gradient(#fff1c2,#f0a93b,#8a4b08,#f0a93b,#fff1c2);filter:drop-shadow(0 0 6px rgba(255,170,60,.75))}',
    '.tm-fr[data-f=orbit] .r1{animation:tmO1 7s linear infinite}',
    '.tm-fr[data-f=orbit] .r2{animation:tmO2 9s linear infinite}',
    '.tm-fr[data-f=orbit] .r3{animation:tmO3 11s linear infinite}',
    '@keyframes tmO1{from{transform:rotateX(72deg) rotateZ(0)}to{transform:rotateX(72deg) rotateZ(360deg)}}',
    '@keyframes tmO2{from{transform:rotateY(72deg) rotateZ(0)}to{transform:rotateY(72deg) rotateZ(-360deg)}}',
    '@keyframes tmO3{from{transform:rotate3d(1,1,0,60deg) rotateZ(0)}to{transform:rotate3d(1,1,0,60deg) rotateZ(360deg)}}',
    /* Neon */
    '.tm-fr[data-f=neon] .r{background:conic-gradient(#00f0ff,#7a5cff,#ff2bd6,#00f0ff);animation:tmSpin 3s linear infinite}',
    /* Ateş */
    '.tm-fr[data-f=ates] .r{--t:5px;background:conic-gradient(#ff3d00,#ffb300,#fff176,#ff6d00,#ff3d00);animation:tmSpin 2s linear infinite}',
    '.tm-fr[data-f=ates] .r.g{animation:tmSpin 2s linear infinite,tmPulse .7s ease-in-out infinite}',
    /* Sonbahar çelengi */
    '.tm-fr[data-f=yaprak] .r{--t:3px;background:linear-gradient(135deg,#ffb15a,#c2410c);filter:drop-shadow(0 0 6px rgba(255,140,40,.6))}',
    /* Melek halkası */
    '.tm-fr .h{position:absolute;left:50%;top:-22px;width:64%;height:24%;margin-left:-32%;border-radius:50%;border:4px solid #ffe28a;box-shadow:0 0 14px #ffd54f,inset 0 0 8px #ffd54f;animation:tmBob 2.4s ease-in-out infinite}',
    /* Gökkuşağı */
    '.tm-fr[data-f=gokkusagi] .r{background:conic-gradient(#ff3b3b,#ffb300,#4ade80,#38bdf8,#a78bfa,#ff3b3b);animation:tmSpin 4s linear infinite}',
    /* Buz */
    '.tm-fr[data-f=buz] .r{background:linear-gradient(135deg,#e8fbff,#7fd6ff,#e8fbff);filter:drop-shadow(0 0 7px rgba(127,214,255,.8))}',
    /* Kalp */
    '.tm-fr[data-f=kalp] .r{background:linear-gradient(135deg,#ff7eb3,#ff4d8d);animation:tmPulse 1.2s ease-in-out infinite;filter:drop-shadow(0 0 7px rgba(255,77,141,.8))}',
    '.tm-fr[data-f=kalp] .o{animation-duration:9s}',
    /* LTF Mühür */
    '.tm-fr[data-f=ltf] .r{--t:6px;inset:-10px;background:conic-gradient(#f5f5f5 0 25%,#3a3a3a 0 50%,#f5f5f5 0 75%,#3a3a3a 0);animation:tmSpin 9s linear infinite;filter:drop-shadow(0 0 5px rgba(255,255,255,.35))}',
    '.tm-fr[data-f=ltf] .r.s{--t:2px;inset:-18px;background:#c9ccd1;animation:none;filter:drop-shadow(0 0 4px rgba(255,255,255,.5))}',
    /* Glitch */
    '.tm-fr[data-f=glitch] .r{--t:3px;inset:-9px}',
    '.tm-fr[data-f=glitch] .c1{background:#00f0ff;animation:tmGl1 1.6s steps(1) infinite}',
    '.tm-fr[data-f=glitch] .c2{background:#ff2bd6;animation:tmGl2 1.6s steps(1) infinite}',
    '.tm-fr[data-f=glitch] .c3{background:#fff}',
    '@keyframes tmGl1{0%,100%{transform:translate(0)}20%{transform:translate(-4px,1px)}45%{transform:translate(3px,-2px)}70%{transform:translate(-2px,2px)}85%{transform:translate(4px,0)}}',
    '@keyframes tmGl2{0%,100%{transform:translate(0)}25%{transform:translate(4px,-1px)}50%{transform:translate(-3px,2px)}75%{transform:translate(2px,-2px)}90%{transform:translate(-4px,0)}}',
    /* Taç */
    '.tm-fr[data-f=tac] .r{--t:5px;inset:-8px;background:conic-gradient(#b8741a 0,#ffe9a8 8%,#b8741a 16%,#d99a2b 60%,#b8741a);animation:tmSpin 3.5s linear infinite;filter:drop-shadow(0 0 6px rgba(255,190,80,.6))}',
    '.tm-fr .k{position:absolute;left:50%;top:calc(var(--d)*-.3);font-size:calc(var(--d)*.34);line-height:1;transform:translateX(-50%) rotate(-8deg);animation:tmBob 2.2s ease-in-out infinite;filter:drop-shadow(0 3px 6px rgba(0,0,0,.5))}',
    /* Galaksi */
    '.tm-fr[data-f=galaksi] .r{background:conic-gradient(#7b2ff7,#2f6bff,#c13cff,#7b2ff7);animation:tmSpin 5s linear infinite}',
    '.tm-fr[data-f=galaksi] .o em{color:#e9ddff;text-shadow:0 0 8px #a78bfa}',

    /* ===== Seçici ===== */
    '.tm-open{display:inline-block;margin:8px 6px 0 0;height:32px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;font:inherit;font-size:13px;cursor:pointer}',
    '.tm-open:hover{background:rgba(255,255,255,.16)}.tm-open[hidden]{display:none}',
    '.tm-sh{position:fixed;inset:0;z-index:75;display:flex;align-items:flex-end;justify-content:center}.tm-sh[hidden]{display:none}',
    '.tm-bd{position:absolute;inset:0}',
    '.tm-card{position:relative;width:min(600px,100%);max-height:50vh;display:flex;flex-direction:column;background:rgba(16,16,19,.97);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.1);border-bottom:none;border-radius:20px 20px 0 0;padding:14px 14px calc(14px + env(safe-area-inset-bottom));box-shadow:0 -12px 40px rgba(0,0,0,.5);animation:tmUp .32s cubic-bezier(.2,.9,.3,1) both}',
    '@keyframes tmUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}',
    '.tm-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;font-size:15px}',
    '.tm-hd span{font-size:12px;color:#9ca3af}.tm-hd span.err{color:#ffb3b3}',
    '.tm-tabs{display:flex;gap:6px;margin-bottom:10px}',
    '.tm-tabs button{flex:1;height:34px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:transparent;color:#9ca3af;font:inherit;font-size:13px;cursor:pointer}',
    '.tm-tabs button.on{background:#fff;color:#111;border-color:#fff;font-weight:600}',
    '.tm-grid{flex:1;overflow-y:auto;overscroll-behavior:contain;display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:8px;padding:2px 2px 10px}',
    '.tm-it{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:88px;padding:8px 4px;border-radius:14px;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#e5e7eb;font:inherit;font-size:11.5px;cursor:pointer;line-height:1.2;text-align:center}',
    '.tm-it i{font-style:normal;font-size:26px;line-height:1;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.06)}',
    '.tm-it:hover{background:rgba(255,255,255,.1)}.tm-it.on{border-color:#fff;background:rgba(255,255,255,.14);color:#fff}',
    '.tm-ft{display:flex;justify-content:flex-end;gap:8px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08)}',
    '.tm-b{height:38px;padding:0 20px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:transparent;color:#fff;font:inherit;font-size:14px;cursor:pointer}',
    '.tm-b.pri{background:#fff;color:#111;border-color:#fff;font-weight:600}.tm-b:disabled{opacity:.5;cursor:default}',

    '@media (prefers-reduced-motion:reduce){#v-profil *,#v-profil .tm-aura::before,#v-profil .tm-aura::after,.tm-fr,.tm-fr *,.tm-bd,.tm-card{animation:none!important}}'
  ].join('\n');
  document.head.appendChild(css);

  /* ---------- Katmanlar ---------- */
  var aura = document.createElement('div'); aura.className = 'tm-aura'; aura.setAttribute('aria-hidden', 'true');
  pv.insertBefore(aura, pv.firstChild);

  var sheen = document.createElement('div'); sheen.className = 'tm-sheen'; ban.appendChild(sheen);

  var fr = document.createElement('div'); fr.className = 'tm-fr'; fr.hidden = true; fr.setAttribute('aria-hidden', 'true');
  head.appendChild(fr);

  var card = document.createElement('div'); card.className = 'tm-info'; card.hidden = true;
  card.innerHTML = '<div class="tm-row" id="tmSinceRow" hidden><span>Şu tarihten beri üye</span><b id="tmSince"></b></div>' +
    '<div class="tm-row" id="tmRoleRow" hidden><span>Rol</span><b id="tmRole"></b></div>';
  bio.parentNode.insertBefore(card, bio.nextSibling);
  var sinceRow = $('#tmSinceRow', card), sinceEl = $('#tmSince', card), roleRow = $('#tmRoleRow', card), roleEl = $('#tmRole', card);

  pv.classList.add('tm-run');

  /* ---------- Uygula ---------- */
  var VARS = ['--tm-a', '--tm-b', '--tm-ar', '--tm-br', '--tm-bg', '--tm-an', '--tm-f', '--tm-r'];
  function play() {
    if (reduce) return;
    pv.classList.remove('tm-run'); void pv.offsetWidth; pv.classList.add('tm-run');
  }
  function applyTheme(id) {
    var t = id ? TBY[id] : null;
    if (!t) {
      pv.removeAttribute('data-tm'); pv.removeAttribute('data-amb');
      VARS.forEach(function (v) { pv.style.removeProperty(v); });
      return;
    }
    var ar = rgb(t.a), br = rgb(t.b);
    pv.style.setProperty('--tm-a', t.a); pv.style.setProperty('--tm-b', t.b);
    pv.style.setProperty('--tm-ar', ar); pv.style.setProperty('--tm-br', br);
    pv.style.setProperty('--tm-bg', 'radial-gradient(60% 55% at 15% 0%,rgba(' + ar + ',.42),transparent 70%),radial-gradient(55% 50% at 95% 8%,rgba(' + br + ',.34),transparent 70%)');
    pv.style.setProperty('--tm-an', 'tm' + t.an);
    pv.style.setProperty('--tm-r', (t.r || 14) + 'px');
    if (t.f) pv.style.setProperty('--tm-f', t.f); else pv.style.removeProperty('--tm-f');
    pv.setAttribute('data-tm', t.id);
    if (t.amb) pv.setAttribute('data-amb', t.amb); else pv.removeAttribute('data-amb');
  }
  function applyFrame(id) {
    var f = id ? FBY[id] : null;
    if (!f) { fr.hidden = true; fr.innerHTML = ''; fr.removeAttribute('data-f'); return; }
    fr.innerHTML = f.h; fr.setAttribute('data-f', f.id); fr.hidden = false;
  }

  /* ---------- Veri: profiles.theme / profiles.frame (+ created_at varsa) ---------- */
  var memo = {}, curId = null, wt = 0;
  async function load(id) {
    if (Object.prototype.hasOwnProperty.call(memo, id)) return memo[id];
    var out = { theme: null, frame: null, since: null };
    try {
      var r = await supabase.from('profiles').select('theme,frame').eq('id', id).maybeSingle();
      if (!r.error && r.data) {
        out.theme = (r.data.theme && TBY[r.data.theme]) ? r.data.theme : null;
        out.frame = (r.data.frame && FBY[r.data.frame]) ? r.data.frame : null;
      }
    } catch (_) {}
    try {
      var s = await supabase.from('profiles').select('created_at').eq('id', id).maybeSingle();
      if (!s.error && s.data && s.data.created_at) out.since = s.data.created_at;
    } catch (_) {}
    memo[id] = out; return out;
  }
  function refreshInfo(d) {
    var dt = d && d.since ? new Date(d.since) : null;
    if (dt && !isNaN(dt)) { sinceEl.textContent = dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }); sinceRow.hidden = false; }
    else sinceRow.hidden = true;
    var pr = $('#pfRole');
    if (pr && !pr.hidden && pr.textContent.trim()) { roleEl.textContent = pr.textContent; roleEl.style.color = pr.style.color || ''; roleRow.hidden = false; }
    else roleRow.hidden = true;
    card.hidden = sinceRow.hidden && roleRow.hidden;
  }
  function show(d) {
    clearTimeout(wt);
    applyTheme(d.theme); applyFrame(d.frame); refreshInfo(d);
    pv.classList.remove('tm-wait'); play();
  }
  function onProfile() {
    var P = window.__lefProfile; if (!P) return;
    btn.hidden = !P.mine;
    var id = P.id, fresh = curId !== id; curId = id;
    if (!fresh && memo[id]) { refreshInfo(memo[id]); return; }   // aynı profil yeniden çizildi: animasyonu baştan başlatma
    pv.classList.add('tm-wait');                                  // tasarım gelene kadar içerik gizli, sonra tek seferde animasyonla açılır
    clearTimeout(wt); wt = setTimeout(function () { pv.classList.remove('tm-wait'); }, 2500);
    load(id).then(function (d) { if (curId === id) show(d); });
  }

  /* ---------- Seçici (sadece kendi profilinde) ---------- */
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'tm-open'; btn.hidden = true; btn.textContent = 'Tasarım';
  info.appendChild(btn);

  var sh = document.createElement('div');
  sh.className = 'tm-sh ux-noswipe'; sh.hidden = true;
  sh.innerHTML = '<div class="tm-bd"></div><div class="tm-card" role="dialog" aria-modal="true" aria-label="Profil tasarımı">' +
    '<div class="tm-hd"><b>Profil tasarımı</b><span id="tmMsg"></span></div>' +
    '<div class="tm-tabs"><button type="button" data-t="theme" class="on">Tasarım</button><button type="button" data-t="frame">Çerçeve</button></div>' +
    '<div class="tm-grid" id="tmGrid"></div>' +
    '<div class="tm-ft"><button type="button" class="tm-b" id="tmCancel">İptal</button><button type="button" class="tm-b pri" id="tmSave">Kaydet</button></div></div>';
  document.body.appendChild(sh);
  var grid = $('#tmGrid', sh), msg = $('#tmMsg', sh), saveB = $('#tmSave', sh);
  var tab = 'theme', pickT = null, pickF = null, saved = { theme: null, frame: null };

  function say(t, err) { msg.textContent = t || ''; msg.className = err ? 'err' : ''; }
  function build() {
    grid.textContent = '';
    var list = [{ id: '', n: 'Yok', t: '\u2013' }].concat(tab === 'theme' ? THEMES : FRAMES);
    var cur = (tab === 'theme' ? pickT : pickF) || '';
    list.forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tm-it' + (c.id === cur ? ' on' : ''); b.dataset.id = c.id;
      var i = document.createElement('i'); i.textContent = c.t;
      if (tab === 'theme' && c.id) i.style.background = 'linear-gradient(135deg,' + c.a + ',' + c.b + ')';
      else if (tab !== 'theme' && c.id) i.style.boxShadow = 'inset 0 0 0 3px rgba(255,255,255,.55)';
      var s = document.createElement('span'); s.textContent = c.n;
      b.appendChild(i); b.appendChild(s); grid.appendChild(b);
    });
  }
  $('.tm-tabs', sh).addEventListener('click', function (e) {
    var b = e.target.closest('button[data-t]'); if (!b) return;
    tab = b.dataset.t;
    sh.querySelectorAll('.tm-tabs button').forEach(function (x) { x.classList.toggle('on', x === b); });
    build();
  });
  grid.addEventListener('click', function (e) {
    var b = e.target.closest('.tm-it'); if (!b) return;
    var id = b.dataset.id || null; say('');
    if (tab === 'theme') { pickT = id; applyTheme(id); play(); }       // canlı önizleme: animasyon da oynar
    else { pickF = id; applyFrame(id); play(); }
    build();
  });
  async function open() {
    var P = window.__lefProfile; if (!P || !P.mine) return;
    var d = await load(P.id);
    saved = { theme: d.theme, frame: d.frame }; pickT = d.theme; pickF = d.frame;
    tab = 'theme'; sh.querySelectorAll('.tm-tabs button').forEach(function (x) { x.classList.toggle('on', x.dataset.t === 'theme'); });
    build(); say(''); window.scrollTo(0, 0); sh.hidden = false;
  }
  function close(revert) { sh.hidden = true; if (revert) { applyTheme(saved.theme); applyFrame(saved.frame); } }
  btn.addEventListener('click', open);
  $('.tm-bd', sh).addEventListener('click', function () { close(true); });
  $('#tmCancel', sh).addEventListener('click', function () { close(true); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sh.hidden) close(true); });
  saveB.addEventListener('click', async function () {
    saveB.disabled = true; say('Kaydediliyor...');
    var r = await supabase.from('profiles').update({ theme: pickT, frame: pickF }).eq('id', uid);
    saveB.disabled = false;
    if (r.error) {
      say(/theme|frame|column|permission/i.test(r.error.message) ? 'Kaydedilemedi: tema-kurulum.sql henüz çalıştırılmamış.' : 'Kaydedilemedi: ' + r.error.message, true);
      return;
    }
    var m = memo[uid] || { since: null }; m.theme = pickT; m.frame = pickF; memo[uid] = m;
    saved = { theme: pickT, frame: pickF }; close(false);
  });

  window.addEventListener('lef-profile', onProfile);
  onProfile();   // tema.js, profil çizildikten sonra yüklendiyse
})();
