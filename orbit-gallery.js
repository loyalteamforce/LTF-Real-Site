// ============================================================
// 3D Orbit Gallery — saf JS (React / Tailwind / TypeScript gerekmez)
// 21st.dev "3d-orbit-gallery" bileşeninin three.js karşılığı.
//
// Kullanım:
//   import { mountOrbitGallery } from './orbit-gallery.js';
//   mountOrbitGallery(document.getElementById('orbitGallery'), {
//     images: ['crest.png', 'hero.jpg', 'trailer-cover.jpg']
//   });
// Başarısız olursa (WebGL yok vb.) false döner.
// ============================================================
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';

export function mountOrbitGallery(container, opts = {}){
  if(!container) return false;
  const o = Object.assign({
    images: [],
    starCount: 1200,        // beyaz yıldız sayısı
    sphereRadius: 9,
    positionRandomness: 4,
    imageCount: 24,
    imageSize: 2.0,
    autoSpeed: 0.0035,      // yavaş otomatik dönüş
    cameraZ: 19,            // kamera uzaklığı
    maxAspect: 1.15,        // geniş görseller komşusuna taşmasın
    interactive: true,      // false: sadece önizleme (dokunmayı yakalamaz)
    touchAction: 'pan-y',   // 'none' = sayfa kaydırmayı da yakala
    isRotated: null,        // () => true ise ekran CSS ile 90° çevrilmiş demektir
  }, opts);

  const reduceMotion = matchMedia('(prefers-reduced-motion:reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch(e){ return false; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.style.cssText = 'display:block;width:100%;height:100%;border-radius:inherit;' +
    (o.interactive ? 'touch-action:' + o.touchAction + ';cursor:grab' : 'pointer-events:none');
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  camera.position.set(0, 3.5, o.cameraZ);
  camera.lookAt(0, 0, 0);

  const group = new THREE.Group();
  scene.add(group);

  // ---------- Gerçek yıldızlar: uzak, yumuşak parlayan, hafifçe göz kırpan beyaz noktalar ----------
  const starGeo = new THREE.BufferGeometry();
  {
    const n = o.starCount;
    const pos = new Float32Array(n * 3), size = new Float32Array(n), phase = new Float32Array(n), tint = new Float32Array(n * 3);
    for(let i = 0; i < n; i++){
      // Küre yüzeyinde düzgün dağılım, çok uzakta (galeriyle dönmez, derinlik hissi verir)
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = 45 + Math.random() * 60;
      const q = Math.sqrt(1 - u * u);
      pos.set([r * q * Math.cos(a), r * u, r * q * Math.sin(a)], i * 3);
      size[i] = 1.2 + Math.pow(Math.random(), 6) * 5.5;        // çoğu ince, birkaçı parlak
      phase[i] = Math.random();
      const k = Math.random();                                  // neredeyse saf beyaz, çok hafif ton farkı
      tint.set(k < 0.8 ? [1, 1, 1] : k < 0.9 ? [0.86, 0.93, 1] : [1, 0.96, 0.88], i * 3);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(size, 1));
    starGeo.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
    starGeo.setAttribute('tint', new THREE.BufferAttribute(tint, 3));
  }
  const starMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScale: { value: renderer.getPixelRatio() } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float size; attribute float phase; attribute vec3 tint;
      uniform float uTime; uniform float uScale;
      varying float vA; varying vec3 vT;
      void main(){
        vA = 0.62 + 0.38 * sin(uTime * (0.5 + phase * 1.6) + phase * 60.0);
        vT = tint;
        gl_PointSize = size * uScale;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying float vA; varying vec3 vT;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float core = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vT, pow(core, 2.4) * vA);
      }`
  });
  const stars = new THREE.Points(starGeo, starMat);
  stars.visible = o.starCount > 0;
  scene.add(stars);

  // ---------- Yörüngedeki görseller ----------
  const loader = new THREE.TextureLoader();
  const textures = [];
  const disposables = [starGeo, starMat];
  const urls = o.images.length ? o.images : [];

  function buildRing(){
    if(!textures.length) return;
    for(let i = 0; i < o.imageCount; i++){
      const tex = textures[i % textures.length];
      const img = tex.image;
      const ar = img && img.width ? img.width / img.height : 1;
      // Görseli kareye sığdır (en/boy oranı korunur)
      const w = ar >= 1 ? o.imageSize * Math.min(ar, o.maxAspect) : o.imageSize * ar;
      const h = w / ar;
      const g = new THREE.PlaneGeometry(w, h);
      const m = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, alphaTest: 0.05 });
      const mesh = new THREE.Mesh(g, m);
      const a = (i / o.imageCount) * Math.PI * 2;
      mesh.position.set(o.sphereRadius * Math.cos(a), 0, o.sphereRadius * Math.sin(a));
      mesh.lookAt(mesh.position.clone().multiplyScalar(2)); // dışa baksın
      group.add(mesh);
      disposables.push(g, m);
    }
    dirty = true;
  }

  let pending = urls.length;
  urls.forEach(u => loader.load(u, tex => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    textures.push(tex); disposables.push(tex);
    if(--pending === 0) buildRing();
  }, undefined, () => { if(--pending === 0) buildRing(); }));

  // ---------- Boyutlandırma ----------
  function resize(){
    const w = container.clientWidth, h = container.clientHeight;
    if(!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Dar (dikey) ekranlarda kamerayı uzaklaştır ki küre kırpılmasın
    camera.position.z = w / h < 1.2 ? o.cameraZ + (1.2 - w / h) * 14 : o.cameraZ;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  // ---------- Sürükleyerek döndürme (yatay) + eylemsizlik ----------
  let dragging = false, lastX = 0, lastY = 0, vel = 0, dirty = true;
  if(o.interactive){
    canvas.addEventListener('pointerdown', e => {
      dragging = true; lastX = e.clientX; lastY = e.clientY; vel = 0;
      canvas.style.cursor = 'grabbing';
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      if(!dragging) return;
      const rot = o.isRotated && o.isRotated();
      const dx = rot ? e.clientY - lastY : e.clientX - lastX;   // 90° çevrikse yatay = ekranda dikey
      lastX = e.clientX; lastY = e.clientY;
      group.rotation.y += dx * 0.006;
      vel = dx * 0.006;
      dirty = true;
    });
    const end = () => { dragging = false; canvas.style.cursor = 'grab'; };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
  }

  // ---------- Döngü: görünür değilse hiç çizmez ----------
  let visible = true, running = false, last = 0, raf = 0;
  const io = new IntersectionObserver(es => {
    visible = es[0].isIntersecting;
    kick();
  });
  io.observe(container);
  document.addEventListener('visibilitychange', kick);

  function kick(){
    if(!running && visible && !document.hidden){
      running = true; last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }
  function frame(now){
    if(!visible || document.hidden){ running = false; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if(!dragging){
      if(Math.abs(vel) > 0.00005){ group.rotation.y += vel; vel *= 0.94; dirty = true; }
      else if(!reduceMotion){ group.rotation.y += o.autoSpeed * 60 * dt * 0.5; dirty = true; }
    }
    if(!reduceMotion){ starMat.uniforms.uTime.value = now / 1000; dirty = true; }   // yıldızlar göz kırpsın
    stars.rotation.y = group.rotation.y * 0.2;                                      // hafif derinlik (paralaks)
    if(dirty){ renderer.render(scene, camera); dirty = false; }
    raf = requestAnimationFrame(frame);
  }
  resize();
  kick();

  // Dışarıdan temizlemek istersen
  container.__orbitDispose = () => {
    cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
    document.removeEventListener('visibilitychange', kick);
    disposables.forEach(d => d.dispose && d.dispose());
    renderer.dispose(); canvas.remove();
  };
  return true;
}