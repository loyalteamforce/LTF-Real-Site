/* ============================================================
   PUAN KARTI: Ana Sayfa'da kart + Gönder / Geçmiş
   - Puan sunucudaki cüzdanda durur (puan-kurulum.sql). Tarayıcı sadece okur,
     değiştirme işi sunucu fonksiyonlarındadır (wallet_send, wallet_earn).
   - Transfer ekranı: Hızlı gönder (son kişiler), tuş takımı, kaydırarak gönder,
     başarı ekranı, günlere ayrılmış hareket listesi.
   - Başkasının profilinde "Puan gönder" butonu çıkar.
   - app.html'de extras.js'ten SONRA: <script type="module" src="puan-karti.js"></script>
   ============================================================ */
import { supabase, escapeHtml as E } from './config.js';

const $ = (s, r = document) => r.querySelector(s);
const fmt = n => Number(n || 0).toLocaleString('tr-TR');
const ERR = {
  insufficient: 'Yeterli puanın yok.', self: 'Kendine puan gönderemezsin.', not_found: 'Kullanıcı ya da ürün bulunamadı.',
  invalid: 'Geçersiz miktar.', owned: 'Bunu zaten açtın.', limit: 'Günlük sınıra ulaştın.', auth: 'Oturum bulunamadı.'
};
const errText = e => { const m = (e && e.message) || ''; for (const k in ERR) if (m.indexOf(k) !== -1) return ERR[k]; return 'İşlem başarısız. puan-kurulum.sql çalıştırıldı mı?'; };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Büyük alt menü stili (dock-buyuk.css)
try { const dl = document.createElement('link'); dl.rel = 'stylesheet'; dl.href = 'dock-buyuk.css'; document.head.appendChild(dl); } catch (_) {}

let uid = null;
try { const s = await supabase.auth.getSession(); uid = s.data.session && s.data.session.user.id; } catch (_) {}
if (uid) init();

function init() {
  const lk = document.createElement('link'); lk.rel = 'stylesheet';
  lk.href = 'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cormorant+Garamond:wght@600;700&display=swap';
  document.head.appendChild(lk);

  const css = document.createElement('style');
  css.textContent = `
.pc-wrap{ margin-top:14px; display:grid; grid-template-columns:minmax(0,1fr); gap:14px; align-items:start; }
@media (min-width:700px){ .pc-wrap{ grid-template-columns:minmax(0,1.65fr) minmax(0,1fr); } }
@media (min-width:900px){ .pc-wrap{ grid-template-columns:minmax(0,560px) minmax(0,1fr); gap:18px; } }
.pc-left,.pc-side{ min-width:0; }
.pc-flip{ display:block; position:relative; width:100%; aspect-ratio:1.56; cursor:pointer; container-type:inline-size; outline:none; user-select:none; -webkit-user-select:none; touch-action:manipulation; }
.pc-flip:focus-visible .pc-face{ outline:2px solid rgba(255,255,255,.7); outline-offset:2px; }
/* Tek düzlemli çevirme: iki yüz de aynı eleman gibi döner (preserve-3d / backface-visibility yok), yarıda yüz değişir. Safari'de logo yandan düz görünme hatası bu yüzden olmaz. */
.pc-inner{ position:absolute; inset:0; will-change:transform; transform-origin:50% 50%; }
.pc-face{ box-sizing:border-box; position:absolute; inset:0; border-radius:8cqw; overflow:hidden; color:#f2f2f2;
  border:1px solid rgba(255,255,255,.16); box-shadow:0 18px 40px -18px rgba(0,0,0,.9),inset 0 1px 0 rgba(255,255,255,.12); }
.pc-front{ display:none; padding:5.5% 7%; flex-direction:column; justify-content:space-between;
  background:linear-gradient(118deg,transparent 28%,rgba(255,255,255,.055) 50%,transparent 72%),
             repeating-linear-gradient(115deg,rgba(255,255,255,.035) 0 2px,transparent 2px 7px),
             linear-gradient(135deg,#1a1a1a 0%,#000 48%,#0d0d0d 100%); }
/* Logo ayrı bir <img> değil, arka yüzün kendi arka planı: kartla aynı düzlemde, 3D döner (Safari'de yandan düz görünmez) */
.pc-back{ background-image:url("crest.png"),radial-gradient(circle at 50% 32%,rgba(255,255,255,.13),transparent 62%),linear-gradient(135deg,#242424 0%,#0b0b0b 55%,#1b1b1b 100%);
  background-repeat:no-repeat; background-position:center,0 0,0 0; background-size:54cqw auto,100% 100%,100% 100%; }
.pc-back::before{ content:""; position:absolute; inset:0; background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); opacity:.09; pointer-events:none; }
.pc-back::after{ content:""; position:absolute; inset:0; background:linear-gradient(118deg,transparent 28%,rgba(255,255,255,.08) 50%,transparent 72%); pointer-events:none; }
.pc-top{ display:flex; align-items:flex-start; justify-content:space-between; }
.pc-brand{ font-family:'Cinzel Decorative',Cinzel,serif; font-weight:700; font-size:6cqw; letter-spacing:.16em;
  background:linear-gradient(90deg,#bdbdbd,#f0f0f0 60%,#9a9a9a); -webkit-background-clip:text; background-clip:text; color:transparent; }
.pc-mid{ display:flex; align-items:baseline; gap:2.5cqw; margin-top:auto; }
.pc-num{ font-family:'Cormorant Garamond',Georgia,serif; font-weight:700; font-size:13cqw; line-height:1; letter-spacing:.01em;
  background:linear-gradient(180deg,#fff 20%,#c4c4c4); -webkit-background-clip:text; background-clip:text; color:transparent; filter:drop-shadow(0 2px 3px rgba(0,0,20,.45)); font-variant-numeric:oldstyle-nums; }
.pc-pt{ font-size:5cqw; color:#b0b0b0; letter-spacing:.04em; }
.pc-lbl{ margin-top:3%; font-size:max(6.5px,2.9cqw); letter-spacing:.26em; color:#8a8a8a; }
.pc-name{ margin-top:2px; font-family:'Cinzel Decorative',Cinzel,serif; font-size:5.6cqw; letter-spacing:.04em; color:#e6e6e6; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.pc-flip.flipped .pc-front{ display:flex; }
.pc-flip.flipped .pc-back{ display:none; }
.pc-flip{ -webkit-tap-highlight-color:transparent; }
.pc-acts{ display:grid; grid-template-columns:repeat(2,1fr); gap:8px; margin-top:10px; }
.pc-act{ display:flex; align-items:center; justify-content:center; gap:6px; height:40px; border-radius:12px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); color:#fff; font:inherit; font-size:13px; cursor:pointer; }
.pc-act svg{ width:16px; height:16px; flex:none; }
.pc-send{ margin:12px 14px 0; display:inline-flex; align-items:center; }
.pc-send[hidden]{ display:none; }

/* ===== Transfer paneli (koyu, para uygulaması görünümü) ===== */
.pc-sheet .st-card.pc-card{ width:min(100%,440px); height:min(780px,94dvh); max-height:94dvh; padding:0; display:flex; flex-direction:column; overflow:hidden;
  background:#0a0a0b; border:1px solid rgba(255,255,255,.1); border-radius:30px 30px 0 0; }
@media (min-width:900px){ .pc-sheet .st-card.pc-card{ border-radius:30px; } }
.pc-scr{ flex:1; min-height:0; display:flex; flex-direction:column; padding:14px 18px calc(16px + env(safe-area-inset-bottom)); overflow-y:auto; overscroll-behavior:contain; }
.pc-anim{ animation:pcIn .3s cubic-bezier(.2,.9,.3,1) both; }
@keyframes pcIn{ from{ opacity:0; transform:translateX(18px); } to{ opacity:1; transform:none; } }
.pc-hd{ display:flex; align-items:center; justify-content:space-between; gap:10px; min-height:44px; flex:none; }
.pc-h1{ font-size:26px; font-weight:700; letter-spacing:-.01em; }
.pc-h2{ font-size:16px; font-weight:600; }
.pc-balline{ margin-top:2px; font-size:13px; color:#9ca3af; } .pc-balline b{ color:#fff; font-weight:600; }
.pc-ic{ flex:none; width:38px; height:38px; display:grid; place-items:center; border:none; border-radius:50%; background:rgba(255,255,255,.09); color:#fff; cursor:pointer; }
.pc-ic svg{ width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
.pc-ic.ghost{ visibility:hidden; }
.pc-tabs{ display:flex; gap:4px; padding:4px; margin:12px 0 6px; border-radius:999px; background:rgba(255,255,255,.07); flex:none; }
.pc-tabs button{ flex:1; height:40px; display:flex; align-items:center; justify-content:center; gap:7px; border:none; border-radius:999px; background:transparent; color:#9ca3af; font:inherit; font-size:14px; cursor:pointer; transition:background .2s,color .2s; }
.pc-tabs button svg{ width:15px; height:15px; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
.pc-tabs button.on{ background:#fff; color:#111; font-weight:600; }
.pc-scroll{ flex:1; min-height:0; }
.pc-sec{ display:flex; align-items:center; justify-content:space-between; margin:16px 0 8px; font-size:13px; font-weight:600; color:#9ca3af; }
.pc-more{ border:none; background:transparent; color:#9ca3af; font:inherit; font-size:13px; cursor:pointer; }
.pc-grp{ margin:16px 0 4px; font-size:12px; letter-spacing:.04em; color:#6b7280; }
.pc-quick{ display:flex; gap:14px; overflow-x:auto; padding:2px 0 8px; scrollbar-width:none; }
.pc-quick::-webkit-scrollbar{ display:none; }
.pc-q{ flex:none; width:64px; display:flex; flex-direction:column; align-items:center; gap:6px; border:none; background:transparent; color:#e5e7eb; font:inherit; cursor:pointer; }
.pc-q small{ max-width:64px; font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.pc-q .pc-ava{ width:58px; height:58px; font-size:21px; transition:transform .2s cubic-bezier(.3,1.4,.5,1); }
.pc-q:active .pc-ava{ transform:scale(.92); }
.pc-ava{ flex:none; width:42px; height:42px; border-radius:50%; overflow:hidden; display:grid; place-items:center; background:#2a2a30; color:#d1d5db; font-weight:600; font-size:16px; }
.pc-ava img{ width:100%; height:100%; object-fit:cover; display:block; }
.pc-ava svg{ width:19px; height:19px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.pc-ava.nw{ background:transparent; border:1.5px dashed rgba(255,255,255,.35); font-size:26px; font-weight:300; color:#fff; }
.pc-tx{ display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,.06); }
.pc-tx > span:nth-child(2){ flex:1; min-width:0; font-size:15px; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.pc-tx small{ display:block; margin-top:2px; font-size:12px; font-weight:400; color:#9ca3af; overflow:hidden; text-overflow:ellipsis; }
.pc-tx b{ flex:none; font-size:15px; font-weight:600; }
.pc-plus{ color:#7ee2a8; font-weight:600; } .pc-minus{ color:#fff; font-weight:600; }
.pc-dim{ color:#9ca3af; font-size:14px; padding:12px 0; }
.pc-in{ width:100%; height:44px; padding:0 14px; border-radius:12px; border:1px solid rgba(255,255,255,.18); background:rgba(0,0,0,.35); color:#fff; font:inherit; font-size:16px; outline:none; }
.pc-in:focus{ border-color:rgba(160,195,255,.7); }
.pc-res{ margin-top:10px; flex:1; overflow-y:auto; }
.pc-u{ display:flex; align-items:center; gap:12px; width:100%; padding:9px 8px; border:none; border-radius:14px; background:transparent; color:#fff; font:inherit; font-size:15px; text-align:left; cursor:pointer; }
.pc-u:hover,.pc-u:focus-visible{ background:rgba(255,255,255,.08); }
.pc-err{ min-height:20px; margin:4px 0 8px; font-size:13px; color:#ffb3b3; text-align:center; }

/* Miktar ekranı */
.pc-to{ display:flex; align-items:center; gap:10px; align-self:center; margin-top:6px; padding:6px 16px 6px 6px; border-radius:999px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.08); font-size:12px; color:#9ca3af; }
.pc-to .pc-ava{ width:30px; height:30px; font-size:13px; }
.pc-to b{ display:block; max-width:200px; margin-top:1px; font-size:14px; font-weight:600; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.pc-amtwrap{ display:flex; align-items:baseline; justify-content:center; gap:8px; margin-top:clamp(10px,3dvh,26px); }
.pc-amt{ font-size:clamp(52px,9dvh,72px); font-weight:500; letter-spacing:-.02em; line-height:1.05; font-variant-numeric:tabular-nums; transition:font-size .15s; }
.pc-amt.zero{ color:#4b5563; } .pc-amt.sm2{ font-size:clamp(38px,6.5dvh,50px); }
.pc-ptu{ font-size:20px; color:#9ca3af; }
.pc-after{ margin:2px 0 10px; text-align:center; font-size:13px; color:#9ca3af; } .pc-after.bad{ color:#ff9a9a; }
.pc-note{ height:40px; font-size:14px; text-align:center; background:rgba(255,255,255,.05); }
.pc-chips2{ display:flex; gap:8px; overflow-x:auto; margin:10px -18px 0; padding:0 18px 2px; scrollbar-width:none; }
.pc-chips2::-webkit-scrollbar{ display:none; }
.pc-cb{ flex:none; height:34px; padding:0 15px; border-radius:999px; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.06); color:#d1d5db; font:inherit; font-size:13px; cursor:pointer; transition:background .2s,color .2s; }
.pc-cb.on{ background:#e5e1d8; color:#111; border-color:transparent; font-weight:600; }
.pc-pad{ display:grid; grid-template-columns:repeat(3,1fr); gap:2px; margin:auto 0 6px; padding-top:10px; }
.pc-k{ height:clamp(44px,7.2dvh,58px); display:grid; place-items:center; border:none; border-radius:16px; background:transparent; color:#fff; font:inherit; font-size:26px; cursor:pointer; transition:background .12s,transform .12s; }
.pc-k:active{ background:rgba(255,255,255,.1); transform:scale(.94); }
.pc-k.sm{ font-size:13px; color:#9ca3af; }
.pc-k svg{ width:24px; height:24px; fill:none; stroke:currentColor; stroke-width:1.7; stroke-linecap:round; stroke-linejoin:round; }
.pc-sl{ position:relative; flex:none; height:60px; border-radius:999px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.08); overflow:hidden; touch-action:none; user-select:none; -webkit-user-select:none; transition:opacity .2s; }
.pc-sl.off{ opacity:.5; }
.pc-fill{ position:absolute; left:0; top:0; bottom:0; width:0; border-radius:999px; background:linear-gradient(90deg,rgba(255,255,255,.04),rgba(255,255,255,.22)); transition:width .3s cubic-bezier(.2,.9,.3,1); }
.pc-slt{ position:absolute; inset:0; display:grid; place-items:center; padding-left:44px; font-size:14px; color:#9ca3af; pointer-events:none; opacity:calc(1 - var(--p,0) * 1.4); }
.pc-knob{ position:absolute; left:4px; top:4px; width:50px; height:50px; display:grid; place-items:center; border:none; border-radius:50%; background:#fff; color:#111; cursor:grab; touch-action:none; transition:transform .3s cubic-bezier(.2,.9,.3,1); }
.pc-knob svg{ width:22px; height:22px; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
.pc-knob:focus-visible{ outline:2px solid #9cc4ff; outline-offset:2px; }
.pc-sl.drag .pc-knob,.pc-sl.drag .pc-fill{ transition:none; cursor:grabbing; }
.pc-dots{ display:flex; gap:5px; } .pc-dots i{ width:9px; height:9px; border-radius:50%; background:#111; animation:pcDot .9s ease-in-out infinite; } .pc-dots i:nth-child(2){ animation-delay:.18s; }
@keyframes pcDot{ 0%,100%{ opacity:.25; transform:scale(.8); } 50%{ opacity:1; transform:scale(1.1); } }

/* Başarı ekranı */
.pc-okw{ display:flex; flex-direction:column; align-items:center; margin-top:clamp(8px,4dvh,36px); }
.pc-okc{ width:84px; height:84px; display:grid; place-items:center; border-radius:50%; background:linear-gradient(145deg,#e5e1d8,#9b978d); color:#111; animation:pcPop .5s cubic-bezier(.3,1.5,.5,1) both; }
.pc-okc svg{ width:38px; height:38px; fill:none; stroke:currentColor; stroke-width:2.4; stroke-linecap:round; stroke-linejoin:round; }
@keyframes pcPop{ from{ transform:scale(.3); opacity:0; } to{ transform:none; opacity:1; } }
.pc-okamt{ margin-top:18px; font-size:44px; font-weight:600; letter-spacing:-.02em; } .pc-okamt small{ margin-left:8px; font-size:20px; font-weight:400; color:#9ca3af; }
.pc-oksub{ margin-top:4px; font-size:14px; color:#9ca3af; }
.pc-det{ margin:26px 0 0; padding:4px 16px; border-radius:18px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); }
.pc-det div{ display:flex; justify-content:space-between; gap:16px; padding:13px 0; font-size:14px; border-bottom:1px solid rgba(255,255,255,.06); }
.pc-det div:last-child{ border-bottom:none; } .pc-det span{ color:#9ca3af; } .pc-det b{ font-weight:500; text-align:right; overflow:hidden; text-overflow:ellipsis; }
.pc-done{ flex:none; margin-top:auto; height:54px; border:none; border-radius:999px; background:#fff; color:#111; font:inherit; font-size:16px; font-weight:600; cursor:pointer; }
.pc-okw + .pc-det + .pc-done{ margin-top:auto; }
@media (prefers-reduced-motion:reduce){ .pc-anim,.pc-okc{ animation:none; } .pc-knob,.pc-fill{ transition:none; } }
`;
  document.head.appendChild(css);

  /* ---------- durum ---------- */
  let bal = null, ok = null, shown = 0, raf = 0, owner = '';

  function setBal(n) { bal = Number(n); ok = true; countTo(bal); }
  function countTo(to) {
    const el = $('.pc-num'); if (!el) return;
    cancelAnimationFrame(raf);
    if (reduced || shown === to) { shown = to; el.textContent = fmt(to); return; }
    const from = shown, t0 = performance.now(), dur = 800;
    (function step(t) {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      shown = Math.round(from + (to - from) * e); el.textContent = fmt(shown);
      if (k < 1) raf = requestAnimationFrame(step);
    })(t0);
  }
  async function refresh() {
    try {
      const { data, error } = await supabase.rpc('wallet_get');
      if (error) throw error;
      setBal(data);
    } catch (_) {
      if (ok === null) { ok = false; const x = window.__lefx; bal = x ? x.pts : 0; countTo(bal); }
    }
  }
  window.addEventListener('lef-wallet', e => setBal(e.detail.balance));
  window.__lefWallet = { get balance() { return bal; }, refresh };

  /* ---------- kart ---------- */
  const SVG = {
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
    bw: '<svg viewBox="0 0 24 24"><path d="M20 5H9l-6 7 6 7h11a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z"/><path d="m12.5 9.5 5 5m0-5-5 5"/></svg>',
    tick: '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
  };
  function build() {
    const w = document.createElement('div'); w.className = 'pc-wrap';
    w.innerHTML = `<div class="pc-left">
      <div class="pc-flip" role="button" tabindex="0" aria-pressed="false" aria-label="Puan kartı. Çevirmek için dokun">
        <div class="pc-inner">
          <div class="pc-face pc-back" aria-hidden="true"></div>
          <div class="pc-face pc-front" role="group" aria-label="Puan kartı ön yüzü">
            <div class="pc-top"><span class="pc-brand">POINTS</span></div>
            <div class="pc-mid"><span class="pc-num">0</span><span class="pc-pt">pt</span></div>
            <div><div class="pc-lbl">KART SAHİBİ</div><div class="pc-name"></div></div>
          </div>
        </div>
      </div>
      <div class="pc-acts">
        <button type="button" class="pc-act" data-a="send">${SVG.send}Gönder</button>
        <button type="button" class="pc-act" data-a="hist">${SVG.clock}Geçmiş</button>
      </div>
    </div>
    <div class="pc-side" id="pcSide"></div>`;
    const flip = w.querySelector('.pc-flip'), inner = w.querySelector('.pc-inner');
    let busy = false;   // animasyon sürerken gelen dokunuşları yok say: bir dokunuş = bir çevirme
    const toggle = () => {
      if (busy) return;
      busy = true;
      const on = !flip.classList.contains('flipped');
      const swap = () => { flip.classList.toggle('flipped', on); flip.setAttribute('aria-pressed', on ? 'true' : 'false'); };
      if (reduced || !inner.animate) { swap(); busy = false; return; }
      const P = 'perspective(900px) ';
      // 1. yarı: 0 -> 90 derece (kart kenara döner), 2. yarı: yüz değişir, -90 -> 0
      const a1 = inner.animate([{ transform: P + 'rotateY(0deg) scale(1)' }, { transform: P + 'rotateY(90deg) scale(1.05)' }], { duration: 250, easing: 'cubic-bezier(.5,0,1,1)', fill: 'forwards' });
      a1.onfinish = () => {
        swap();
        const a2 = inner.animate([{ transform: P + 'rotateY(-90deg) scale(1.05)' }, { transform: P + 'rotateY(0deg) scale(1)' }], { duration: 300, easing: 'cubic-bezier(0,0,.25,1)' });
        a1.cancel();
        a2.onfinish = a2.oncancel = () => { busy = false; };
      };
    };
    flip.addEventListener('click', toggle);
    flip.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    w.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) openSheet(b.dataset.a); });
    return w;
  }
  const home = $('#v-ana-sayfa');
  function paintOwner() { const n = $('.pc-name'); if (n) n.textContent = owner.toLocaleUpperCase('tr'); }
  // Kart bir kez kurulur. Ana Sayfa yeniden çizilip kart DOM'dan çıkarılsa bile aynı kart geri takılır;
  // böylece çevrilmiş hali sıfırlanmaz ve animasyon baştan oynamaz.
  let wrapEl = null;
  function mount() {
    if (!home || home.querySelector('.pc-wrap')) return;
    const w = wrapEl || (wrapEl = build()), hero = home.querySelector('.x-hero');
    if (hero) hero.after(w); else home.prepend(w);
    const el = $('.pc-num'); if (el) el.textContent = fmt(shown);
    paintOwner(); if (bal !== null) countTo(bal);
  }
  if (home) { new MutationObserver(mount).observe(home, { childList: true }); mount(); }

  (async () => {
    try { const { data } = await supabase.from('profiles').select('display_name,username').eq('id', uid).maybeSingle(); if (data) owner = data.display_name || data.username || ''; } catch (_) {}
    paintOwner();
  })();

  refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('hashchange', () => { if (location.hash === '#ana-sayfa' || location.hash === '') refresh(); });

  /* ---------- panel ---------- */
  const sheet = document.createElement('div'); sheet.className = 'st pc-sheet'; sheet.setAttribute('aria-hidden', 'true');
  sheet.innerHTML = '<div class="st-card pc-card" role="dialog" aria-modal="true" aria-label="Puan transferi"><div id="pcB" class="pc-scr"></div></div>';
  document.body.appendChild(sheet);
  const B = () => $('#pcB', sheet);
  let off = null;   // açık ekranın temizlik fonksiyonu (klavye dinleyicisi vb.)
  const close = () => { if (off) { off(); off = null; } sheet.classList.remove('on'); sheet.setAttribute('aria-hidden', 'true'); };
  sheet.addEventListener('click', e => { if (e.target === sheet) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheet.classList.contains('on')) close(); });
  function show(html, wire) {
    if (off) { off(); off = null; }
    const b = B(); b.innerHTML = html;
    b.classList.remove('pc-anim'); void b.offsetWidth; b.classList.add('pc-anim'); b.scrollTop = 0;
    b.querySelectorAll('[data-x]').forEach(x => x.addEventListener('click', close));
    if (wire) wire(b);
  }

  function openSheet(v, arg) {
    sheet.classList.add('on'); sheet.setAttribute('aria-hidden', 'false');
    if (ok === false) {
      show(`<div class="pc-hd"><h3 class="pc-h1">Puan kartı</h3><button type="button" class="pc-ic" data-x aria-label="Kapat">${SVG.x}</button></div><p class="pc-dim">Puan kartı için sunucu kurulumu gerekiyor: Supabase SQL Editor'de <b>puan-kurulum.sql</b> dosyasını çalıştır.</p>`);
      return;
    }
    if (v === 'send' && arg) viewAmount(arg, close); else viewHub(v === 'hist' ? 'hist' : 'send');
  }
  window.__lefWalletOpen = openSheet;

  const avBase = supabase.supabaseUrl + '/storage/v1/object/public/';
  const norm = u => ({ id: u.id, name: u.display_name || u.username || 'Üye', avatar_url: u.avatar_url });
  const avatar = u => {
    const ini = E(String((u && u.name) || '?').trim().charAt(0).toLocaleUpperCase('tr'));
    return '<span class="pc-ava">' + (u && u.avatar_url && u.avatar_url.indexOf(avBase) === 0 ? `<img src="${E(u.avatar_url)}" alt="">` : ini) + '</span>';
  };

  /* ---------- ANA EKRAN: Hızlı gönder + hareketler ---------- */
  const dayDiff = t => { const d = new Date(t), n = new Date(), k = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime(); return Math.round((k(n) - k(d)) / 864e5); };
  const grpName = t => { const x = dayDiff(t); return x <= 0 ? 'Bugün' : x === 1 ? 'Dün' : 'Daha önce'; };
  const KIND = { send: 'Gönderildi', receive: 'Alındı', earn: 'Kazanıldı', spend: 'Harcandı' };

  async function viewHub(tab) {
    tab = tab || 'send';
    show(`<div class="pc-hd"><div><h3 class="pc-h1">Transferler</h3><p class="pc-balline">Bakiye <b>${fmt(bal)}</b> pt</p></div><button type="button" class="pc-ic" data-x aria-label="Kapat">${SVG.x}</button></div>
      <div class="pc-tabs" role="tablist"><button type="button" role="tab" data-t="send">${SVG.send}Gönder</button><button type="button" role="tab" data-t="hist">${SVG.clock}Geçmiş</button></div>
      <div class="pc-scroll" id="pcS"></div>`);
    const S = $('#pcS', sheet);
    let rows = [], prof = {}, loaded = false, failed = false;

    const rowH = r => {
      const o = prof[r.other_id], plus = r.kind === 'earn' || r.kind === 'receive', pair = r.kind === 'send' || r.kind === 'receive';
      const name = r.kind === 'earn' ? (r.note || 'Kazanılan puan') : r.kind === 'spend' ? 'Harcama' : (o ? o.name : 'Üye');
      const t = new Date(r.created_at);
      const when = grpName(r.created_at) === 'Daha önce' ? t.toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : t.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      const note = (pair || r.kind === 'spend') && r.note ? r.note : '';
      const ava = pair && o ? avatar(o) : `<span class="pc-ava">${r.kind === 'spend' ? SVG.bag : SVG.star}</span>`;
      return `<div class="pc-tx">${ava}<span>${E(name)}<small>${E([KIND[r.kind] || '', note, when].filter(Boolean).join(' · '))}</small></span><b class="${plus ? 'pc-plus' : 'pc-minus'}">${plus ? '+' : '−'}${fmt(r.amount)}</b></div>`;
    };
    const paint = () => {
      B().querySelectorAll('.pc-tabs [data-t]').forEach(x => { const on = x.dataset.t === tab; x.classList.toggle('on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
      if (!loaded) { S.innerHTML = '<p class="pc-dim">Yükleniyor…</p>'; return; }
      if (tab === 'send') {
        const rec = [], seen = {};
        rows.forEach(r => { if ((r.kind === 'send' || r.kind === 'receive') && r.other_id && !seen[r.other_id] && prof[r.other_id] && rec.length < 8) { seen[r.other_id] = 1; rec.push(prof[r.other_id]); } });
        S.innerHTML = `<div class="pc-sec">Hızlı gönder</div>
          <div class="pc-quick"><button type="button" class="pc-q" data-new><span class="pc-ava nw">+</span><small>Yeni</small></button>${rec.map((u, i) => `<button type="button" class="pc-q" data-i="${i}">${avatar(u)}<small>${E(u.name)}</small></button>`).join('')}</div>
          <div class="pc-sec"><span>Son hareketler</span>${rows.length > 5 ? '<button type="button" class="pc-more" data-more>Tümü</button>' : ''}</div>
          ${rows.length ? rows.slice(0, 5).map(rowH).join('') : '<p class="pc-dim">Henüz hareket yok.</p>'}`;
        S.querySelector('[data-new]').onclick = viewSearch;
        S.querySelectorAll('[data-i]').forEach(b => { b.onclick = () => viewAmount(rec[b.dataset.i], () => viewHub('send')); });
        const mo = S.querySelector('[data-more]'); if (mo) mo.onclick = () => { tab = 'hist'; paint(); };
      } else {
        if (failed) { S.innerHTML = '<p class="pc-dim">Geçmiş yüklenemedi.</p>'; return; }
        if (!rows.length) { S.innerHTML = '<p class="pc-dim">Henüz hareket yok.</p>'; return; }
        let last = '';
        S.innerHTML = rows.map(r => { const g = grpName(r.created_at), h = g !== last ? `<div class="pc-grp">${g}</div>` : ''; last = g; return h + rowH(r); }).join('');
      }
    };
    B().querySelectorAll('.pc-tabs [data-t]').forEach(x => x.addEventListener('click', () => { tab = x.dataset.t; paint(); S.scrollTop = 0; }));
    paint();

    try {
      const { data, error } = await supabase.from('wallet_tx').select('kind,amount,other_id,note,created_at').order('created_at', { ascending: false }).limit(40);
      if (error) throw error;
      rows = data || [];
      const ids = [...new Set(rows.map(r => r.other_id).filter(Boolean))];
      if (ids.length) { const { data: pr } = await supabase.from('profiles').select('id,username,display_name,avatar_url').in('id', ids); (pr || []).forEach(p => { prof[p.id] = norm(p); }); }
    } catch (_) { failed = true; }
    loaded = true;
    if (S.isConnected) paint();
  }

  /* ---------- YENİ KİŞİ ARA ---------- */
  function viewSearch() {
    let tm = 0, tok = 0;
    show(`<div class="pc-hd"><button type="button" class="pc-ic" data-back aria-label="Geri">${SVG.back}</button><h3 class="pc-h2">Kime?</h3><span class="pc-ic ghost"></span></div>
      <input class="pc-in" id="pcQ" autocomplete="off" placeholder="Kullanıcı adı ara" style="margin-top:12px"><div class="pc-res" id="pcR"></div>`, b => {
      b.querySelector('[data-back]').onclick = () => viewHub('send');
      const inp = $('#pcQ', sheet); inp.focus();
      inp.addEventListener('input', e => { clearTimeout(tm); const q = e.target.value; tm = setTimeout(() => search(q), 280); });
    });
    async function search(raw) {
      const r = $('#pcR', sheet); if (!r) return;
      const q = raw.trim().replace(/[^\p{L}\p{N}_. -]/gu, '');
      if (q.length < 2) { r.innerHTML = ''; return; }
      const my = ++tok;
      const { data, error } = await supabase.from('profiles').select('id,username,display_name,avatar_url').or(`username.ilike.%${q}%,display_name.ilike.%${q}%`).neq('id', uid).limit(8);
      if (my !== tok || !r.isConnected) return;
      if (error || !data.length) { r.innerHTML = '<p class="pc-dim">Kimse bulunamadı.</p>'; return; }
      const list = data.map(norm);
      r.innerHTML = list.map((u, i) => `<button type="button" class="pc-u" data-i="${i}">${avatar(u)}<span>${E(u.name)}</span></button>`).join('');
      r.onclick = e => { const bt = e.target.closest('.pc-u'); if (bt) viewAmount(list[bt.dataset.i], viewSearch); };
    }
  }

  /* ---------- MİKTAR: tuş takımı + kaydırarak gönder ---------- */
  function viewAmount(to, back) {
    let s = '', note = '', sending = false, valid = false;
    const CHIPS = ['Kahve', 'Yemek', 'Borç', 'Hediye', 'Teşekkür'];
    show(`<div class="pc-hd"><button type="button" class="pc-ic" data-back aria-label="Geri">${SVG.back}</button><h3 class="pc-h2">Puan gönder</h3><span class="pc-ic ghost"></span></div>
      <div class="pc-to">${avatar(to)}<span>Kime<b>${E(to.name)}</b></span></div>
      <div class="pc-amtwrap"><span class="pc-amt zero" id="pcA">0</span><span class="pc-ptu">pt</span></div>
      <p class="pc-after" id="pcAf"></p>
      <input class="pc-in pc-note" id="pcNote" maxlength="60" autocomplete="off" placeholder="Not ekle (isteğe bağlı)">
      <div class="pc-chips2" id="pcCh">${CHIPS.map(c => `<button type="button" class="pc-cb">${c}</button>`).join('')}</div>
      <div class="pc-pad" id="pcPad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" class="pc-k" data-k="${n}">${n}</button>`).join('')}<button type="button" class="pc-k sm" data-k="max">Hepsi</button><button type="button" class="pc-k" data-k="0">0</button><button type="button" class="pc-k" data-k="del" aria-label="Sil">${SVG.bw}</button></div>
      <p class="pc-err" id="pcE" role="status"></p>
      <div class="pc-sl off" id="pcSl"><div class="pc-fill" id="pcF"></div><span class="pc-slt" id="pcSlT">Miktar gir</span><button type="button" class="pc-knob" id="pcKn" aria-label="Göndermek için kaydır">${SVG.arrow}</button></div>`, b => {
      b.querySelector('[data-back]').onclick = back;
      const A = $('#pcA', sheet), af = $('#pcAf', sheet), err = $('#pcE', sheet), sl = $('#pcSl', sheet), kn = $('#pcKn', sheet), fl = $('#pcF', sheet), slt = $('#pcSlT', sheet), nt = $('#pcNote', sheet);
      const amount = () => parseInt(s || '0', 10) || 0;

      const update = () => {
        const amt = amount(), left = bal - amt;
        A.textContent = fmt(amt); A.classList.toggle('zero', !amt); A.classList.toggle('sm2', s.length > 6);
        af.textContent = !amt ? `Bakiye ${fmt(bal)} pt` : left >= 0 ? `Gönderdikten sonra bakiye ${fmt(left)} pt` : 'Yeterli puanın yok';
        af.classList.toggle('bad', amt > 0 && left < 0);
        valid = amt >= 1 && amt <= bal;
        sl.classList.toggle('off', !valid);
        if (!sending) slt.textContent = valid ? `Göndermek için kaydır · ${fmt(amt)} pt` : amt > bal ? 'Yeterli puanın yok' : 'Miktar gir';
        err.textContent = '';
      };
      const press = k => {
        if (sending) return;
        if (k === 'del') s = s.slice(0, -1);
        else if (k === 'max') s = bal > 0 ? String(Math.floor(bal)) : '';
        else if (s.length < 9) s = (s + k).replace(/^0+/, '');
        update();
      };
      $('#pcPad', sheet).addEventListener('click', e => { const k = e.target.closest('[data-k]'); if (k) press(k.dataset.k); });
      const kd = e => {
        if (e.target.closest && e.target.closest('input')) return;
        if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del');
      };
      document.addEventListener('keydown', kd); off = () => document.removeEventListener('keydown', kd);

      const chips = [...$('#pcCh', sheet).children];
      const markChips = () => chips.forEach(c => c.classList.toggle('on', c.textContent === note));
      chips.forEach(c => c.addEventListener('click', () => { note = note === c.textContent ? '' : c.textContent; nt.value = note; markChips(); }));
      nt.addEventListener('input', () => { note = nt.value; markChips(); });

      // kaydırarak gönder
      let drag = false, x0 = 0, dx = 0, max = 0;
      const setX = v => { dx = v; kn.style.transform = `translateX(${v}px)`; fl.style.width = (v + kn.offsetWidth + 4) + 'px'; sl.style.setProperty('--p', max ? v / max : 0); };
      const calcMax = () => { max = sl.clientWidth - kn.offsetWidth - 8; };
      async function go() {
        sending = true; slt.textContent = 'Gönderiliyor…'; kn.innerHTML = '<span class="pc-dots"><i></i><i></i></span>'; err.textContent = '';
        const amt = amount();
        try {
          const { data, error } = await supabase.rpc('wallet_send', { p_to: to.id, p_amount: amt, p_note: note.trim() });
          if (error) throw error;
          setBal(data);
          viewDone(to, amt, note.trim(), data);
        } catch (e) {
          sending = false; kn.innerHTML = SVG.arrow; setX(0); update(); err.textContent = errText(e);
        }
      }
      kn.addEventListener('pointerdown', e => {
        if (!valid || sending) return;
        calcMax(); drag = true; x0 = e.clientX - dx; kn.setPointerCapture(e.pointerId); sl.classList.add('drag'); e.preventDefault();
      });
      kn.addEventListener('pointermove', e => { if (drag) setX(Math.max(0, Math.min(max, e.clientX - x0))); });
      kn.addEventListener('pointerup', () => {
        if (!drag) return; drag = false; sl.classList.remove('drag');
        if (dx >= max * 0.9) { setX(max); go(); } else setX(0);
      });
      kn.addEventListener('pointercancel', () => { drag = false; sl.classList.remove('drag'); setX(0); });
      kn.addEventListener('keydown', e => {   // klavyeyle: Enter / Boşluk
        if ((e.key === 'Enter' || e.key === ' ') && valid && !sending) { e.preventDefault(); calcMax(); setX(max); go(); }
      });
      update();
    });
  }

  /* ---------- BAŞARI ---------- */
  function viewDone(to, amt, note, left) {
    const ref = 'LEF-' + String(Date.now()).slice(-6);
    show(`<div class="pc-hd"><span class="pc-ic ghost"></span><span></span><button type="button" class="pc-ic" data-x aria-label="Kapat">${SVG.x}</button></div>
      <div class="pc-okw"><div class="pc-okc">${SVG.tick}</div><div class="pc-okamt">${fmt(amt)}<small>pt</small></div><p class="pc-oksub">${E(to.name)} kişisine gönderildi</p></div>
      <div class="pc-det"><div><span>Kime</span><b>${E(to.name)}</b></div>${note ? `<div><span>Not</span><b>${E(note)}</b></div>` : ''}<div><span>Ulaşma</span><b>Anında</b></div><div><span>Kalan bakiye</span><b>${fmt(left)} pt</b></div><div><span>Referans</span><b>${ref}</b></div></div>
      <button type="button" class="pc-done" data-x>Tamam</button>`);
  }

  /* ---------- başkasının profilinde "Puan gönder" ---------- */
  const sb = document.createElement('button'); sb.type = 'button'; sb.className = 'bio-btn pc-send'; sb.hidden = true; sb.textContent = 'Puan gönder';
  const back = $('#pfBack'); if (back) back.after(sb);
  const syncBtn = () => { const p = window.__lefProfile; sb.hidden = !p || p.mine; };
  window.addEventListener('lef-profile', syncBtn); syncBtn();
  sb.addEventListener('click', () => {
    const p = window.__lefProfile; if (!p || p.mine) return;
    const n = $('#pfNick');
    openSheet('send', { id: p.id, name: (n && n.textContent.trim()) || 'Üye' });
  });

  /* ---------- Liderlik tablosu (liderlik.js): ana sayfa özet kartı + panel ---------- */
  import('./liderlik.js').catch(() => {});
}
