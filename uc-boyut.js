/* ============================================================
   3D: sitenin gerçekçi üç boyutlu dokunuşları
   1) Ana Sayfa: başlığın yanında gerçek zamanlı 3D LTF madalyonu (Three.js, metal yüzey ve yansımalar).
      Parmakla / fareyle çevrilir, bırakınca yavaşça döner. Ekranda değilken çizim durur.
   2) Hikâyeler: kapaklar kalınlığı, sayfa kenarı ve sırtı olan 3D kitaplar. İmlece / parmağa göre eğilir,
      ışık yansıması kayar. Kitaba dokununca kapak açılarak okuyucuya geçilir.
   3) Ana Sayfa'daki puan kartı imlece / parmağa göre eğilir, üstünde ışık parlaması gezer.
   - "Hareketi azalt" açıksa eğilme ve dönme kapanır, madalyon sabit durur.
   - config.js bu dosyayı kendisi yükler.
   ============================================================ */
const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const fine = !!(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches);
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

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
.x-hero{ position:relative; }
.md3{ position:absolute; right:0; top:50%; width:84px; height:84px; transform:translateY(-50%); cursor:grab; touch-action:pan-y; }
.md3:active{ cursor:grabbing; }
.md3 canvas{ display:block; width:100%; height:100%; }
.x-hero h2,.x-hero small{ padding-right:96px; }
@media (prefers-reduced-motion:reduce){ .mg-cover.bk,.pc-flip.tl{ transition:none; } }
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

/* ============ 2) 3D MADALYON (Three.js) ============ */
async function medallion(host) {
  if (host.querySelector('.md3')) return;
  const wrap = document.createElement('div'); wrap.className = 'md3'; wrap.setAttribute('role', 'img'); wrap.setAttribute('aria-label', 'Döndürülebilir 3D LTF madalyonu');
  host.appendChild(wrap);
  let THREE;
  try { THREE = await import(THREE_URL); } catch (_) { wrap.remove(); return; }
  const size = 84, dpr = Math.min(devicePixelRatio || 1, 2);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); } catch (_) { wrap.remove(); return; }
  renderer.setPixelRatio(dpr); renderer.setSize(size, size, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  wrap.appendChild(renderer.domElement);

  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(32, 1, .1, 20); cam.position.set(0, 0, 4.4);
  // yansıma ortamı: stüdyo ışıklandırması (koyu oda + parlak paneller)
  const env = new THREE.Scene(), box = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: 0x15151a, side: THREE.BackSide }));
  env.add(box);
  [[0, 4.6, 0, 6, .2, 3, 6], [-4.6, 1, 1, .2, 3, 4, 3], [4.6, -.5, -1, .2, 2.5, 3, 2.2], [0, -1, 4.6, 3, 2, .2, 1.2]].forEach(([x, y, z, sx, sy, sz, I]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), new THREE.MeshBasicMaterial({ color: new THREE.Color(I, I, I) })); m.position.set(x, y, z); env.add(m);
  });
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(env, .04).texture; pm.dispose();
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(2, 3, 4); scene.add(key);

  // yüz dokusu: koyu mine üstünde arma + yazı
  const face = document.createElement('canvas'); face.width = face.height = 512; const f = face.getContext('2d');
  const g = f.createRadialGradient(256, 220, 40, 256, 256, 256); g.addColorStop(0, '#2b2b33'); g.addColorStop(1, '#09090c');
  f.fillStyle = g; f.fillRect(0, 0, 512, 512);
  f.strokeStyle = '#c9a24a'; f.lineWidth = 10; f.beginPath(); f.arc(256, 256, 236, 0, Math.PI * 2); f.stroke();
  f.lineWidth = 3; f.beginPath(); f.arc(256, 256, 214, 0, Math.PI * 2); f.stroke();
  f.fillStyle = '#e6c77a'; f.font = '700 30px Georgia,serif'; f.textAlign = 'center'; f.textBaseline = 'middle';
  const txt = '· LOYAL ELITE FORCE · LTF ', step = (Math.PI * 2) / (txt.length * 1.55);
  for (let i = 0; i < txt.length * 1.55; i++) { const ch = txt[i % txt.length], a = -Math.PI / 2 + i * step; f.save(); f.translate(256 + Math.cos(a) * 192, 256 + Math.sin(a) * 192); f.rotate(a + Math.PI / 2); f.fillText(ch, 0, 0); f.restore(); }
  const tex = new THREE.CanvasTexture(face); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const crest = new Image(); crest.src = 'crest.webp';
  crest.onload = () => { f.drawImage(crest, 256 - 120, 256 - 120, 240, 240); tex.needsUpdate = true; };

  const gold = new THREE.MeshStandardMaterial({ color: 0xd9b04f, metalness: 1, roughness: .28 });
  const faceM = new THREE.MeshStandardMaterial({ map: tex, metalness: .55, roughness: .38 });
  const coin = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .16, 96, 1), [gold, faceM, faceM]);
  body.rotation.x = Math.PI / 2; coin.add(body);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1, .06, 18, 96), gold); coin.add(rim);
  // kenar tırtılları
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(.018, .05, .17), gold);
  const ridges = new THREE.InstancedMesh(ridge.geometry, gold, 120), M = new THREE.Matrix4();
  for (let i = 0; i < 120; i++) { const a = i / 120 * Math.PI * 2; M.makeRotationZ(a); M.setPosition(Math.cos(a) * 1.055, Math.sin(a) * 1.055, 0); ridges.setMatrixAt(i, M); }
  coin.add(ridges); scene.add(coin);
  coin.rotation.x = .18;

  let vel = reduce ? 0 : .012, rot = -.5, drag = false, lastX = 0, visible = true, raf = 0;
  const draw = () => { coin.rotation.y = rot; renderer.render(scene, cam); };
  const loop = () => {
    raf = 0; if (!visible || document.hidden) return;
    if (!drag) { vel += ((reduce ? 0 : .012) - vel) * .02; rot += vel; }
    draw(); raf = requestAnimationFrame(loop);
  };
  const start = () => { if (!raf) raf = requestAnimationFrame(loop); };
  wrap.addEventListener('pointerdown', e => { drag = true; lastX = e.clientX; wrap.setPointerCapture(e.pointerId); start(); });
  wrap.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - lastX; lastX = e.clientX; rot += dx * .02; vel = dx * .02; draw(); });
  const up = () => { drag = false; start(); };
  wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);
  if (window.IntersectionObserver) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); }).observe(wrap);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
  draw(); if (!reduce) start();
}

/* ============ başlat ============ */
function scan() {
  const grid = document.getElementById('mgGrid'), track = document.getElementById('mgTrack');
  if (grid) bookify(grid); if (track) bookify(track);
  const flip = document.querySelector('.pc-flip'); if (flip) tiltCard(flip);
  const hero = document.querySelector('#v-ana-sayfa .x-hero'); if (hero) medallion(hero);
}
scan(); tiltBooks(); openAnim();
new MutationObserver(scan).observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
