/* ============================================================
   BANNER ÇERÇEVESİ DÜZELTMESİ (profil-cerceve.js için ek modül)
   - İlk çerçeve (Kelebek) dahil TÜM çerçevelerde banner arkasındaki bulanık ışıma (arka plan) kapatılır.
   - Çizgiler uyumlu: dış çizgi 2.5px, iç çizgi 1px, aradaki boşluk hepsinde aynı. Banner, avatar halkası ve
     süsler aynı yapıda; noktalı ve dalgalı çizgi yok.
   - Tam efekt: kenar boyunca dönen parlama, nefes alan ışıma, süslerde parıltı, yıldız pırıltıları.
     "Hareketi azalt" açıksa animasyonlar kapanır.
   - config.js bu dosyayı kendisi yükler. Kaldırmak için config.js içindeki cerceve-duzelt.js satırını sil.
   ============================================================ */

const CSS = `
@property --fa{ syntax:'<angle>'; inherits:false; initial-value:0deg; }
#v-profil[data-fr]{ --fs:rgba(255,255,255,.95); }

/* 1) Arka plan: hiçbir çerçevede banner arkasında ışıma kalmaz */
#v-profil[data-fr] .pf-glow{ display:none !important; }

/* 2) Uyumlu çizgiler */
#v-profil[data-fr] .fr-box{ border:2.5px solid var(--fc) !important; filter:none !important; animation:frBreath 4.5s ease-in-out infinite alternate; }
#v-profil[data-fr] .fr-box::after{ inset:5px !important; border:1px solid var(--fc) !important; border-radius:23px !important; opacity:.85 !important; }
#v-profil[data-fr] .fr-ring::before{ border:2.5px solid var(--fc) !important; filter:none !important; animation:frBreath 4.5s ease-in-out infinite alternate; }
#v-profil[data-fr] .fr-ring::after{ inset:-10.5px !important; border:1px solid var(--fc) !important; opacity:.85 !important; }
#v-profil[data-fr] .pf-name::after{ border:1px solid var(--fc) !important; opacity:.7 !important; }
@media (max-width:600px){
  #v-profil[data-fr] .fr-box::after{ border-radius:19px !important; }
}

/* 3) Tam efekt: kenarda dönen parlama (banner ve avatar halkası) */
#v-profil[data-fr] .fr-box::before{
  content:""; position:absolute; inset:-2.5px; border-radius:inherit; padding:2.5px; pointer-events:none;
  background:conic-gradient(from var(--fa), transparent 0%, transparent 78%, var(--fs) 92%, transparent 100%);
  -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite:xor;
  mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite:exclude;
  animation:frSpin 4.6s linear infinite;
}
.fr-sw{
  position:absolute; inset:-7px; border-radius:50%; padding:2.5px; pointer-events:none;
  background:conic-gradient(from var(--fa), transparent 0%, transparent 78%, var(--fs) 92%, transparent 100%);
  -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite:xor;
  mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite:exclude;
  animation:frSpin 4.6s linear infinite;
}
/* süslerde parıltı */
.fr-t,.fr-c,.fr-o{ animation:frGlow 3.4s ease-in-out infinite alternate; }
.fr-c.tr,.fr-o:nth-child(2n){ animation-delay:-.9s; }
.fr-c.bl{ animation-delay:-1.7s; } .fr-c.br{ animation-delay:-2.5s; }
/* yıldız pırıltıları */
.fr-sp{ position:absolute; width:13px; height:13px; color:#fff; z-index:4; pointer-events:none; opacity:0; transform:translate(-50%,-50%) scale(0);
  filter:drop-shadow(0 0 4px var(--fc)); animation:frTw 3.4s ease-in-out infinite; animation-delay:var(--d,0s); }
.fr-sp svg{ display:block; width:100%; height:100%; }

@keyframes frSpin{ to{ --fa:360deg; } }
@keyframes frBreath{ from{ box-shadow:0 0 12px var(--fg); } to{ box-shadow:0 0 30px var(--fg), 0 0 6px var(--fg); } }
@keyframes frGlow{ from{ filter:drop-shadow(0 0 3px var(--fg)); } to{ filter:drop-shadow(0 0 11px var(--fc)); } }
@keyframes frTw{ 0%,100%{ opacity:0; transform:translate(-50%,-50%) scale(0) rotate(0deg); } 50%{ opacity:1; transform:translate(-50%,-50%) scale(1) rotate(45deg); } }

@media (prefers-reduced-motion:reduce){
  #v-profil[data-fr] .fr-box,#v-profil[data-fr] .fr-ring::before,.fr-t,.fr-c,.fr-o{ animation:none !important; }
  #v-profil[data-fr] .fr-box::before,.fr-sw,.fr-sp{ display:none !important; }
}
`;

const STAR = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0 12.2 7.8 20 10 12.2 12.2 10 20 7.8 12.2 0 10 7.8 7.8Z" fill="currentColor"/></svg>';
const BOX_SP = [[16, 0], [58, 0], [100, 30], [100, 76], [78, 100], [34, 100], [0, 64]];
const RING_A = [20, 140, 255];

const st = document.createElement('style');
st.id = 'frFix';
st.textContent = CSS;
document.head.appendChild(st);

function decorate(pv, ov, ring) {
  if (!pv.dataset.fr) return;
  if (ov.querySelector('.fr-box') && !ov.querySelector('.fr-sp')) {
    ov.insertAdjacentHTML('beforeend', BOX_SP.map((p, i) =>
      '<span class="fr-sp" style="left:' + p[0] + '%;top:' + p[1] + '%;--d:' + (-(i * 0.97)).toFixed(2) + 's">' + STAR + '</span>').join(''));
  }
  if (ring.children.length && !ring.querySelector('.fr-sw')) {
    let h = '<i class="fr-sw"></i>';
    RING_A.forEach((a, i) => {
      const r = a * Math.PI / 180;
      h += '<span class="fr-sp" style="left:calc(50% + ' + Math.cos(r).toFixed(3) + ' * (50% + 8px));top:calc(50% + ' + Math.sin(r).toFixed(3) + ' * (50% + 8px));--d:' + (-(i * 1.1 + .4)).toFixed(2) + 's">' + STAR + '</span>';
    });
    ring.insertAdjacentHTML('beforeend', h);
  }
}

function boot() {
  const pv = document.getElementById('v-profil');
  const ov = pv && pv.querySelector('.fr-ov');
  const ring = pv && pv.querySelector('.fr-ring');
  if (!pv || !ov || !ring) return false;
  const run = () => decorate(pv, ov, ring);
  const mo = new MutationObserver(run);
  mo.observe(ov, { childList: true });
  mo.observe(ring, { childList: true });
  mo.observe(pv, { attributes: true, attributeFilter: ['data-fr'] });
  run();
  return true;
}

(function wait() {
  if (boot()) return;
  let n = 0;
  const t = setInterval(() => { if (boot() || ++n > 60) clearInterval(t); }, 300);
})();
