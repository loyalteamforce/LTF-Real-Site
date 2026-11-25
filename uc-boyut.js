/* ============================================================
   3D: sitenin hareketli üç boyutlu dokunuşları
   1) Hikâyeler: kapaklar kalınlığı, sayfa kenarı ve sırtı olan 3D kitaplar; imlece göre eğilir, ışık kayar.
      Kitaba dokununca kapak açılarak okuyucuya geçilir.
   2) Öne çıkanlar: kitaplar dönen bir 3D halkada; parmakla çevrilir, bırakınca kendi kendine döner.
   3) Ana Sayfa'daki puan kartı imlece / parmağa göre eğilir, üstünde ışık parlaması gezer.
   4) Ana Sayfa'nın üstünde derinlikli, süzülen altın tozu (imlece göre paralaks).
   5) Mağaza: rozetler kendi ekseninde döner, ürünler dokununca 3D eğilir, önizleme yavaşça sallanır.
   6) Liderlik: podyum blokları 3D, kişiler hafifçe süzülür, birincinin fotoğrafı arada bir döner.
   - "Hareketi azalt" açıksa dönme, eğilme ve toz kapanır. Ekranda olmayan animasyonlar durur.
   - config.js bu dosyayı kendisi yükler.
   ============================================================ */
const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const fine = !!(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches);

const css = document.createElement('style');
css.textContent = `
/* ---------- 3D kitap kapakları ---------- */
.mg-cover.bk{ animation:none!important; overflow:visible; transform-style:preserve-3d; border-radius:4px 10px 10px 4px;
  transform:perspective(900px) rotateY(var(--ry,-14deg)) rotateX(var(--rx,4deg)); transition:transform .5s cubic-bezier(.2,.8,.2,1), box-shadow .5s;
  box-shadow:18px 22px 30px -14px rgba(0,0,0,.85), 4px 6px 10px -4px rgba(0,0,0,.6); }
.mg-cover.bk.live{ transition:transform .08s linear; }
.mg-cover.bk::before{ border-radius:inherit; }
.mg-cover.bk::after{ border-radius:inherit; }
.mg-cover.bk .bk-pg{ position:absolute; top:3px; bottom:3px; right:-11px; width:12px; z-index:0; pointer-events:none;
  transform:rotateY(90deg); transform-origin:left center; border-radius:0 2px 2px 0;
  background:repeating-linear-gradient(90deg,#f4efe4 0 1px,#d9d2c3 1px 2px); box-shadow:inset 0 0 6px rgba(0,0,0,.35); }
.mg-cover.bk .bk-bt{ position:absolute; left:3px; right:-8px; bottom:-11px; height:12px; z-index:0; pointer-events:none;
  transform:rotateX(-90deg); transform-origin:center top; background:repeating-linear-gradient(0deg,#efe9dc 0 1px,#d2cab9 1px 2px); }
.mg-cover.bk .bk-sp{ position:absolute; left:0; top:0; bottom:0; width:9%; z-index:3; pointer-events:none; border-radius:4px 0 0 4px;
  background:linear-gradient(90deg,rgba(0,0,0,.55),rgba(255,255,255,.18) 38%,rgba(0,0,0,.25) 62%,rgba(0,0,0,0)); }
.mg-cover.bk .bk-gl{ position:absolute; inset:0; z-index:3; pointer-events:none; border-radius:inherit; mix-blend-mode:screen;
  background:radial-gradient(circle at var(--gx,30%) var(--gy,20%),rgba(255,255,255,.32),rgba(255,255,255,0) 55%); opacity:.75; transition:opacity .4s; }
.mg-cover.bk:hover,.mg-cover.bk:focus-visible{ --ry:-4deg; --rx:2deg; }
.mg-cover.bk:active{ transform:perspective(900px) rotateY(-2deg) rotateX(1deg) scale(.97); }
/* kapağın açılması */
.bk-open{ position:fixed; z-index:70; pointer-events:none; perspective:1400px; }
.bk-open .bk-c{ position:absolute; inset:0; transform-origin:left center; transform-style:preserve-3d; border-radius:4px 10px 10px 4px; overflow:hidden; backface-visibility:hidden; }
.bk-open .bk-p{ position:absolute; inset:0; border-radius:2px 8px 8px 2px; background:linear-gradient(90deg,#d8d1c2,#f6f2e8 8%,#f6f2e8); box-shadow:inset 0 0 30px rgba(120,100,60,.25); }
.bk-open .bk-p i{ position:absolute; left:14%; right:12%; height:2px; background:rgba(60,50,40,.18); border-radius:1px; }
/* ---------- puan kartı: eğilme + ışık ---------- */
.pc-flip.tl{ transform:perspective(900px) rotateX(var(--tx,0deg)) rotateY(var(--ty,0deg)); transition:transform .5s cubic-bezier(.2,.8,.2,1); transform-style:preserve-3d; }
.pc-flip.tl.live{ transition:transform .06s linear; }
.pc-flip .pc-gl{ position:absolute; inset:0; z-index:5; pointer-events:none; border-radius:8cqw; mix-blend-mode:overlay; opacity:0; transition:opacity .35s;
  background:radial-gradient(circle at var(--gx,50%) var(--gy,50%),rgba(255,255,255,.55),rgba(255,255,255,0) 50%); }
.pc-flip.tl.live .pc-gl{ opacity:1; }
/* ---------- 3D madalyon ---------- */
/* ---------- öne çıkanlar: 3D kitap halkası ---------- */
.mg-belt.cf-belt{ height:262px; perspective:1000px; perspective-origin:50% 40%; cursor:grab; touch-action:pan-y; position:relative; }
.mg-belt.cf-belt:active{ cursor:grabbing; }
.mg-track.cf{ animation:none!important; position:absolute; left:50%; top:14px; width:150px; height:225px; margin-left:-75px; padding:0; display:block; transform-style:preserve-3d; }
.mg-track.cf .mg-cover.cf-it{ position:absolute; left:0; top:0; width:150px; transform:rotateY(var(--a)) translateZ(var(--r))!important; transition:none!important; backface-visibility:hidden; -webkit-backface-visibility:hidden; }
.mg-track.cf .mg-cover.cf-it .bk-pg,.mg-track.cf .mg-cover.cf-it .bk-bt{ display:none; }
/* ---------- mağaza: dönen rozetler, eğilen ürünler ---------- */
.mg2-art{ perspective:600px; transition:transform .45s cubic-bezier(.2,.8,.2,1); transform-style:preserve-3d; }
.mg2-art .tk{ animation:rz3 7s cubic-bezier(.45,0,.55,1) infinite; transform-style:preserve-3d; }
@keyframes rz3{ 0%,62%{ transform:rotateY(0deg) } 82%{ transform:rotateY(360deg) translateZ(8px) } 100%{ transform:rotateY(360deg) } }
.mg2-it:nth-child(2) .tk{ animation-delay:-2.3s } .mg2-it:nth-child(3) .tk{ animation-delay:-4.6s }
.mg2-it:hover .mg2-art,.mg2-it:focus-visible .mg2-art{ transform:rotateY(-14deg) rotateX(8deg) translateZ(10px); }
.mg2-it:active .mg2-art{ transform:rotateY(-6deg) rotateX(4deg) scale(.96); }
.mg2-pv{ perspective:900px; } .mg2-pv > *{ animation:pv3 6s ease-in-out infinite alternate; }
@keyframes pv3{ from{ transform:rotateY(-12deg) rotateX(6deg) } to{ transform:rotateY(12deg) rotateX(-4deg) } }
/* ---------- liderlik: 3D podyum blokları ---------- */
.lb-podium.p3d{ perspective:700px; }
.lb-podium.p3d .lb-pil{ position:relative; border-radius:2px; overflow:visible; box-shadow:inset 0 -18px 24px -12px rgba(0,0,0,.45); }
.lb-podium.p3d .lb-pil::before{ content:""; position:absolute; left:4px; right:-8px; top:-9px; height:9px; background:linear-gradient(90deg,var(--c),rgba(255,255,255,.55)); opacity:.75; transform:skewX(-42deg); transform-origin:bottom; border-radius:2px 2px 0 0; }
.lb-podium.p3d .lb-pil::after{ content:""; position:absolute; top:-5px; right:-9px; bottom:0; width:9px; background:linear-gradient(180deg,var(--cs),rgba(0,0,0,.5)); transform:skewY(-48deg); transform-origin:left; }
.lb-podium.p3d .lb-av{ animation:bob3 3.2s ease-in-out infinite alternate; }
.lb-podium.p3d .lb-pod.p1 .lb-av{ animation:bob3 3.2s ease-in-out infinite alternate,spin3 9s cubic-bezier(.45,0,.55,1) 1s infinite; }
.lb-podium.p3d .lb-pod.p2 .lb-av{ animation-delay:-1.1s } .lb-podium.p3d .lb-pod.p3 .lb-av{ animation-delay:-2.2s }
@keyframes bob3{ from{ translate:0 0 } to{ translate:0 -6px } }
@keyframes spin3{ 0%,80%{ transform:rotateY(0) } 100%{ transform:rotateY(360deg) } }
/* ---------- ana sayfa: altın tozu ---------- */
#v-ana-sayfa{ position:relative; }
#v-ana-sayfa > .dust3{ position:absolute; left:-16px; right:-16px; top:-10px; width:calc(100% + 32px); height:460px; pointer-events:none; z-index:0; -webkit-mask-image:linear-gradient(180deg,#000 60%,transparent); mask-image:linear-gradient(180deg,#000 60%,transparent); }
#v-ana-sayfa > :not(.dust3){ position:relative; z-index:1; }
@media (prefers-reduced-motion:reduce){ .mg-cover.bk,.pc-flip.tl{ transition:none; } .mg2-art .tk,.mg2-pv > *,.lb-podium.p3d .lb-av{ animation:none!important; } }
`;
document.head.appendChild(css);

/* ============ 1) 3D KİTAPLAR ============ */
function bookify(root) {
  root.querySelectorAll('.mg-cover:not(.bk)').forEach(c => {
    c.classList.add('bk');
    ['bk-pg', 'bk-bt', 'bk-sp', 'bk-gl'].forEach(k => { const s = document.createElement('span'); s.className = k; s.setAttribute('aria-hidden', 'true'); c.appendChild(s); });
  });
}
function tiltBooks() {
  if (reduce) return;
  let cur = null;
  const move = e => {
    const c = e.target.closest && e.target.closest('.mg-cover.bk'); if (!c) return;
    if (cur && cur !== c) leave();
    cur = c; c.classList.add('live');
    const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    c.style.setProperty('--ry', (-6 + (px - .5) * 26).toFixed(2) + 'deg');
    c.style.setProperty('--rx', ((.5 - py) * 16).toFixed(2) + 'deg');
    c.style.setProperty('--gx', (px * 100).toFixed(1) + '%'); c.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
  };
  const leave = () => { if (!cur) return; ['--ry', '--rx', '--gx', '--gy'].forEach(k => cur.style.removeProperty(k)); cur.classList.remove('live'); cur = null; };
  document.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) move(e); else if (cur) leave(); }, { passive: true });
  document.addEventListener('pointerout', e => { if (cur && !cur.contains(e.relatedTarget)) leave(); }, { passive: true });
}
// Kitaba dokununca: kitap ekranın ortasına gelir, kapağı açılır, okuyucu belirir
function openAnim() {
  document.addEventListener('click', e => {
    const c = e.target.closest && e.target.closest('.mg-cover.bk'); if (!c || reduce || !document.body.animate) return;
    const r = c.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
    const w = Math.min(vw * .62, 300), h = w * r.height / r.width, tx = (vw - w) / 2, ty = (vh - h) / 2;
    const box = document.createElement('div'); box.className = 'bk-open';
    box.style.cssText = `left:${tx}px;top:${ty}px;width:${w}px;height:${h}px`;
    const pg = document.createElement('div'); pg.className = 'bk-p';
    for (let i = 0; i < 9; i++) { const l = document.createElement('i'); l.style.top = (18 + i * 7.5) + '%'; if (i % 4 === 3) l.style.right = '40%'; pg.appendChild(l); }
    const cv = c.cloneNode(true); cv.className = 'mg-cover bk-c'; cv.removeAttribute('style');
    cv.style.cssText = `background:linear-gradient(160deg,${getComputedStyle(c).getPropertyValue('--c1')},${getComputedStyle(c).getPropertyValue('--c2')});width:100%;height:100%;padding:12px`;
    box.append(pg, cv);
    const bd = document.createElement('div'); bd.style.cssText = 'position:fixed;inset:0;z-index:69;background:#0b0b0b;pointer-events:none';
    document.body.append(bd, box);
    bd.animate([{ opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: 1, offset: .78 }, { opacity: 0 }], { duration: 1000, easing: 'ease-out', fill: 'forwards' }).finished.then(() => bd.remove(), () => bd.remove());
    const from = `translate(${r.left - tx}px,${r.top - ty}px) scale(${r.width / w})`;
    const fly = box.animate([{ transform: from, opacity: 1 }, { transform: 'none', opacity: 1, offset: .45 }, { transform: 'scale(1.06)', opacity: 1, offset: .8 }, { transform: 'scale(1.14)', opacity: 0 }], { duration: 1000, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'forwards' });
    cv.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(0deg)', offset: .4 }, { transform: 'rotateY(-165deg)', offset: .85 }, { transform: 'rotateY(-165deg)' }], { duration: 1000, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' });
    fly.finished.then(() => box.remove(), () => box.remove());
  }, true);
}

/* ============ 3) PUAN KARTI EĞİLMESİ ============ */
function tiltCard(flip) {
  if (reduce || flip.classList.contains('tl')) return;
  flip.classList.add('tl');
  const gl = document.createElement('div'); gl.className = 'pc-gl'; gl.setAttribute('aria-hidden', 'true'); flip.appendChild(gl);
  const set = (px, py) => {
    flip.style.setProperty('--ty', ((px - .5) * 18).toFixed(2) + 'deg'); flip.style.setProperty('--tx', ((.5 - py) * 14).toFixed(2) + 'deg');
    flip.style.setProperty('--gx', (px * 100).toFixed(1) + '%'); flip.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
  };
  const reset = () => { flip.classList.remove('live'); ['--tx', '--ty'].forEach(k => flip.style.removeProperty(k)); };
  flip.addEventListener('pointermove', e => { const r = flip.getBoundingClientRect(); flip.classList.add('live'); set((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); }, { passive: true });
  flip.addEventListener('pointerleave', reset); flip.addEventListener('pointercancel', reset); flip.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') reset(); });
}

/* ============ 2) ÖNE ÇIKANLAR: DÖNEN 3D KİTAP HALKASI ============ */
function coverFlow(track) {
  if (track.dataset.cf) return;
  const items = [...track.querySelectorAll('.mg-cover')].filter(c => c.getAttribute('aria-hidden') !== 'true');
  if (items.length < 5) return;
  track.dataset.cf = '1';
  track.querySelectorAll('.mg-cover[aria-hidden="true"]').forEach(c => c.remove());
  const belt = track.parentElement; belt.classList.add('cf-belt'); track.classList.add('cf');
  const n = items.length, R = Math.round(75 / Math.tan(Math.PI / n)) + 24;
  items.forEach((c, i) => { c.style.setProperty('--a', (i * 360 / n) + 'deg'); c.classList.add('cf-it'); });
  track.style.setProperty('--r', R + 'px');
  let ang = 0, vel = 0, drag = false, lastX = 0, moved = 0, raf = 0, visible = true;
  const AUTO = reduce ? 0 : -.09;
  const draw = () => { track.style.transform = 'translateZ(' + (-R) + 'px) rotateY(' + ang.toFixed(2) + 'deg)'; };
  const loop = () => {
    raf = 0; if (!visible || document.hidden) return;
    if (!drag) { vel += (AUTO - vel) * .03; ang += vel; }
    draw(); if (AUTO || Math.abs(vel) > .01 || drag) raf = requestAnimationFrame(loop);
  };
  const start = () => { if (!raf) raf = requestAnimationFrame(loop); };
  belt.addEventListener('pointerdown', e => { drag = true; moved = 0; lastX = e.clientX; start(); });
  window.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx); ang += dx * .3; vel = dx * .3; draw(); }, { passive: true });
  window.addEventListener('pointerup', () => { if (drag) { drag = false; start(); } });
  // sürükleme sonrası gelen tıklama kitabı açmasın (window yakalaması, belgedeki kitap-açma dinleyicisinden önce çalışır)
  window.addEventListener('click', e => { if (moved > 8 && belt.contains(e.target)) { moved = 0; e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  if (window.IntersectionObserver) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); }).observe(belt);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
  draw(); start();
}

/* ============ 4) ANA SAYFA: DERİNLİKLİ ALTIN TOZU ============ */
function dust(hero) {
  const home = document.getElementById('v-ana-sayfa');
  if (!home || home.querySelector('.dust3') || reduce) return;
  const c = document.createElement('canvas'); c.className = 'dust3'; c.setAttribute('aria-hidden', 'true'); home.prepend(c);
  const x = c.getContext('2d'); let W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2), mx = 0, my = 0, tx = 0, ty = 0, raf = 0, visible = true;
  const P = Array.from({ length: 70 }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: .2 + Math.random() * .8, s: .4 + Math.random() * 1.2, v: .0006 + Math.random() * .0012, ph: Math.random() * 6.28 }));
  const size = () => { W = c.clientWidth; H = c.clientHeight; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); };
  window.addEventListener('pointermove', e => { tx = (e.clientX / innerWidth - .5) * 2; ty = (e.clientY / innerHeight - .5) * 2; }, { passive: true });
  const frame = t => {
    raf = 0; if (!visible || document.hidden) return;
    mx += (tx - mx) * .04; my += (ty - my) * .04;
    x.clearRect(0, 0, W, H);
    for (const p of P) {
      p.y -= p.v; if (p.y < -1.1) { p.y = 1.1; p.x = Math.random() * 2 - 1; }
      const k = 1 / p.z, px = W / 2 + (p.x + mx * .12 * k) * W * .55 * Math.min(k, 2.2) * .5, py = H / 2 + (p.y + my * .12 * k) * H * .5;
      const tw = .55 + .45 * Math.sin(t / 700 + p.ph), r = p.s * k * .9, a = Math.min(1, .15 + (1 - p.z) * .8) * tw;
      const g = x.createRadialGradient(px, py, 0, px, py, r * 3); g.addColorStop(0, 'rgba(255,226,150,' + a + ')'); g.addColorStop(1, 'rgba(255,226,150,0)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, r * 3, 0, 6.2832); x.fill();
    }
    raf = requestAnimationFrame(frame);
  };
  if (window.ResizeObserver) new ResizeObserver(size).observe(c); size();
  if (window.IntersectionObserver) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }).observe(c);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !raf) raf = requestAnimationFrame(frame); });
  raf = requestAnimationFrame(frame);
}
/* ============ başlat ============ */
function scan() {
  const grid = document.getElementById('mgGrid'), track = document.getElementById('mgTrack');
  if (grid) bookify(grid); if (track) bookify(track);
  const flip = document.querySelector('.pc-flip'); if (flip) tiltCard(flip);
  if (track) coverFlow(track);
  document.querySelectorAll('.lb-podium:not(.p3d)').forEach(p => p.classList.add('p3d'));
  const hero = document.querySelector('#v-ana-sayfa .x-hero'); if (hero) dust(hero);
}
scan(); tiltBooks(); openAnim();
new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
