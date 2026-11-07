/* ============================================================
   PROFİL TASARIMI: tema + animasyonlu avatar çerçevesi
   - Herkes kendi profilini "Profili süsle" ile özelleştirir, başkaları profile bakınca görür.
   - Veriler profiles tablosunda: pf_theme, pf_deco (profil-tasarim.sql ile eklenir).
   - app.html'de friends.js'ten önce şu satır olmalı:
        <script type="module" src="profil-tasarim.js"></script>
   - Yeni seçenek eklemek için: aşağıdaki THEMES / DECOS listesine ekle,
     CSS'ini yaz, SQL'deki check listesine de anahtarı ekle.
   ============================================================ */
import { supabase } from './config.js';

const THEMES = {
  kor:    { n: 'Kor',         a: '#ff8a2b', b: '#4a1306' },
  buz:    { n: 'Buz',         a: '#7fd8ff', b: '#0f2a63' },
  sakura: { n: 'Neon Sakura', a: '#ff6fb5', b: '#3d0f55' },
  zumrut: { n: 'Zümrüt',      a: '#3ddc97', b: '#08332b' },
  aurora: { n: 'Aurora',      a: '#8a6bff', b: '#00796b' },
  altin:  { n: 'Gece Altını', a: '#f5c451', b: '#241b05' }
};
const DECOS = {
  orbit:     'Yörünge',
  tac:       'Arma',
  nabiz:     'Nabız',
  kivilcim:  'Kıvılcım',
  gokkusagi: 'Spektrum',
  elmas:     'Elmas'
};

const CSS = `
#v-profil{ position:relative; --av:132px; }
@media (max-width:600px){ #v-profil{ --av:104px; } }

/* --- arka plan ışığı (tema) --- */
.pd-aura{ position:absolute; left:0; right:0; top:-60px; height:480px; z-index:-1; pointer-events:none; opacity:0; transition:opacity .8s ease;
  background:radial-gradient(60% 70% at 22% 18%,color-mix(in srgb,var(--pf-a) 36%,transparent),transparent 70%),
             radial-gradient(52% 62% at 88% 8%,color-mix(in srgb,var(--pf-b) 70%,transparent),transparent 70%); }
#v-profil[data-th] .pd-aura{ opacity:1; animation:pdDrift 9s ease-in-out infinite alternate; }
@keyframes pdDrift{ to{ transform:translate3d(0,14px,0) scale(1.06); } }

/* --- banner yokken tema degradesi --- */
#v-profil[data-th] .pf-banner:not(.has){ border-style:solid; border-color:color-mix(in srgb,var(--pf-a) 40%,transparent);
  background:linear-gradient(125deg,var(--pf-b),color-mix(in srgb,var(--pf-a) 55%,var(--pf-b)) 55%,var(--pf-b)); background-size:220% 220%; animation:pdShift 10s ease-in-out infinite alternate; }
@keyframes pdShift{ to{ background-position:100% 100%; } }

/* --- isim ve biyografi --- */
#v-profil[data-th] .pf-name span{ background:linear-gradient(100deg,#fff 0%,#fff 30%,var(--pf-a) 50%,#fff 70%,#fff 100%); background-size:240% 100%;
  -webkit-background-clip:text; background-clip:text; color:transparent; animation:pdShine 5s ease-in-out infinite; }
@keyframes pdShine{ 0%,15%{ background-position:100% 0; } 55%,100%{ background-position:-40% 0; } }
#v-profil[data-th] .bio{ border-color:color-mix(in srgb,var(--pf-a) 38%,transparent);
  background:linear-gradient(160deg,color-mix(in srgb,var(--pf-a) 10%,transparent),rgba(255,255,255,.03));
  box-shadow:0 14px 40px -22px var(--pf-a); }

/* --- avatar çerçevesi --- */
.pd-deco{ position:absolute; left:14px; top:0; width:var(--av); height:var(--av); pointer-events:none; z-index:3; --dc:var(--pf-a,#9db8ff); --rw:4px; }
.pd-deco i{ position:absolute; display:block; border-radius:50%; }
.pd-deco[data-d=""]{ display:none; }
.pd-ring{ -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - var(--rw)),#000 calc(100% - var(--rw) + 1px)); mask:radial-gradient(farthest-side,transparent calc(100% - var(--rw)),#000 calc(100% - var(--rw) + 1px)); }
@keyframes pdSpin{ to{ transform:rotate(360deg); } }
@keyframes pdSpinR{ to{ transform:rotate(-360deg); } }
@keyframes pdSpin45{ from{ transform:rotate(45deg); } to{ transform:rotate(-315deg); } }

/* Yörünge: iki zıt yönde dönen kuyruklu yay */
.pd-deco[data-d=orbit] i:nth-child(1){ inset:-9%; background:conic-gradient(from 0deg,transparent 0 55%,var(--dc) 88%,#fff 100%); animation:pdSpin 3s linear infinite; }
.pd-deco[data-d=orbit] i:nth-child(2){ inset:-16%; --rw:3px; background:conic-gradient(from 180deg,transparent 0 62%,color-mix(in srgb,var(--dc) 70%,#fff) 100%); opacity:.8; animation:pdSpinR 5.5s linear infinite; }

/* Arma: LTF kalkanının siyah beyaz karoları yavaşça döner */
.pd-deco[data-d=tac] i:nth-child(1){ inset:-9%; background:conic-gradient(#0a0a0a 0 25%,#f2f2f2 0 50%,#0a0a0a 0 75%,#f2f2f2 0 100%); animation:pdSpin 9s linear infinite; filter:drop-shadow(0 0 6px rgba(255,255,255,.35)); }
.pd-deco[data-d=tac] i:nth-child(2){ inset:-15%; border:1px solid rgba(235,235,235,.55); animation:pdBreath 3.2s ease-in-out infinite; }

/* Nabız: içten dışa yayılan dalga */
.pd-deco[data-d=nabiz] i:nth-child(1){ inset:-6%; border:3px solid var(--dc); box-shadow:0 0 18px var(--dc),inset 0 0 12px color-mix(in srgb,var(--dc) 60%,transparent); animation:pdBreath 2.4s ease-in-out infinite; }
.pd-deco[data-d=nabiz] i:nth-child(2){ inset:-6%; border:2px solid var(--dc); animation:pdWave 2.4s ease-out infinite; }
@keyframes pdBreath{ 0%,100%{ transform:scale(1); opacity:.65; } 50%{ transform:scale(1.07); opacity:1; } }
@keyframes pdWave{ from{ transform:scale(1); opacity:.9; } to{ transform:scale(1.42); opacity:0; } }

/* Kıvılcım: ince halka ve çevresinde dönen iki parlak nokta */
.pd-deco[data-d=kivilcim] i:nth-child(1){ inset:-7%; border:2px solid color-mix(in srgb,var(--dc) 75%,transparent); box-shadow:0 0 14px color-mix(in srgb,var(--dc) 50%,transparent); }
.pd-deco[data-d=kivilcim] i:nth-child(2){ inset:-7%; animation:pdSpin 4s linear infinite; }
.pd-deco[data-d=kivilcim] i:nth-child(3){ inset:-7%; animation:pdSpinR 6.5s linear infinite; }
.pd-deco[data-d=kivilcim] i:nth-child(2)::before,.pd-deco[data-d=kivilcim] i:nth-child(3)::before{ content:""; position:absolute; left:50%; top:-5px; width:10px; height:10px; margin-left:-5px; border-radius:50%;
  background:#fff; box-shadow:0 0 10px 3px var(--dc),0 0 22px 6px var(--dc); }
.pd-deco[data-d=kivilcim] i:nth-child(3)::before{ width:6px; height:6px; margin-left:-3px; top:-3px; }

/* Spektrum: renk çarkı */
.pd-deco[data-d=gokkusagi] i:nth-child(1){ inset:-9%; background:conic-gradient(#ff4d6d,#ffb347,#f6ff6b,#4dff9a,#4dc9ff,#8a6bff,#ff4dd8,#ff4d6d); animation:pdSpin 4.5s linear infinite; }
.pd-deco[data-d=gokkusagi] i:nth-child(2){ inset:-9%; background:conic-gradient(#ff4d6d,#ffb347,#f6ff6b,#4dff9a,#4dc9ff,#8a6bff,#ff4dd8,#ff4d6d); filter:blur(10px); opacity:.55; animation:pdSpin 4.5s linear infinite; }
.pd-deco[data-d=gokkusagi] i:nth-child(2){ -webkit-mask:none; mask:none; }

/* Elmas: karşılıklı dönen iki kare, sekiz köşeli yıldız */
.pd-deco[data-d=elmas] i{ border-radius:14%; border:2px solid var(--dc); box-shadow:0 0 14px color-mix(in srgb,var(--dc) 55%,transparent); }
.pd-deco[data-d=elmas] i:nth-child(1){ inset:-3%; animation:pdSpin 12s linear infinite; }
.pd-deco[data-d=elmas] i:nth-child(2){ inset:-3%; border-color:color-mix(in srgb,var(--dc) 55%,#fff); animation:pdSpin45 12s linear infinite; }

/* --- profile bakınca açılış: sadece masaüstünde banner açılır; avatar ve çerçeve hiç oynamaz --- */
@media (min-width:601px){ #v-profil.pd-go .pf-banner{ animation:pdReveal .8s cubic-bezier(.2,.85,.25,1) both; } }
@keyframes pdReveal{ from{ opacity:0; clip-path:inset(0 50% 0 50% round 20px); } to{ opacity:1; clip-path:inset(0 0 0 0 round 20px); } }
/* --- mobilde sallanma/kayma yok: sadece çerçeve halkası döner --- */
@media (max-width:600px){
  #v-profil[data-th] .pd-aura,#v-profil[data-th] .pf-banner:not(.has),#v-profil[data-th] .pf-name span{ animation:none; }
  .pd-deco[data-d=nabiz] i,.pd-deco[data-d=tac] i:nth-child(2){ animation:none; opacity:.9; }
}

/* --- süsle butonu ve panel --- */
.pd-open{ display:inline-flex; align-items:center; gap:7px; margin:12px 14px 0; }
.pd-open[hidden]{ display:none; }
.pd-sheet .st-card{ width:min(100%,460px); max-height:84dvh; overflow-y:auto; overscroll-behavior:contain; }
.pd-sec{ margin:14px 0 6px; font-size:13px; font-weight:600; color:#9ca3af; }
.pd-cols{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.pd-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
.pd-t{ position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; min-height:74px; padding:8px 4px; border-radius:12px; border:1.5px solid rgba(255,255,255,.12);
  background:rgba(255,255,255,.05); color:#e5e7eb; font:inherit; font-size:12px; cursor:pointer; }
.pd-t[aria-pressed="true"]{ border-color:#fff; background:rgba(255,255,255,.13); }
.pd-t:focus-visible{ outline:2px solid #fff; outline-offset:2px; }
.pd-sw{ width:100%; height:26px; border-radius:8px; }
.pd-mini{ position:relative; width:34px; height:34px; margin:6px 0 4px; border-radius:50%; background:#2b2b31; --av:34px; }
.pd-mini .pd-deco{ left:0; top:0; --rw:2px; }
.pd-gl{ font-size:22px; line-height:1; }
.pd-foot{ display:flex; justify-content:flex-end; gap:8px; margin-top:16px; }
.pd-err{ min-height:18px; margin-top:10px; font-size:13px; color:#ffb3b3; }
@media (prefers-reduced-motion:reduce){
  .pd-aura,.pd-deco i,.pd-deco i::before,.pf-banner,.pf-name span{ animation:none !important; }
}
`;

const pick = (map, k) => (typeof k === 'string' && Object.prototype.hasOwnProperty.call(map, k)) ? k : '';
const rnd = (a, b) => a + Math.random() * (b - a);

function init(){
  const pv = document.getElementById('v-profil');
  const ban = document.getElementById('pfBan');
  const head = pv && pv.querySelector('.pf-head');
  if(!pv || !ban || !head) return;

  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);

  const aura = document.createElement('div'); aura.className = 'pd-aura'; aura.setAttribute('aria-hidden', 'true'); pv.prepend(aura);
  const deco = document.createElement('div'); deco.className = 'pd-deco'; deco.setAttribute('aria-hidden', 'true'); deco.dataset.d = ''; head.prepend(deco);

  const open = document.createElement('button');
  open.type = 'button'; open.className = 'bio-btn pd-open'; open.hidden = true; open.textContent = '✦ Profili süsle';
  const back = document.getElementById('pfBack');
  (back || head).after(open);

  const DECO_KIDS = { orbit: 2, tac: 2, nabiz: 2, kivilcim: 3, gokkusagi: 2, elmas: 2 };
  const RING = { orbit: [0, 1], tac: [0], gokkusagi: [0] };   // maskeyle halka yapılan katmanlar
  const buildDeco = (el, k) => {
    el.replaceChildren(); el.dataset.d = k;
    if(!k) return;
    for(let n = 0; n < DECO_KIDS[k]; n++){
      const i = document.createElement('i');
      if((RING[k] || []).indexOf(n) !== -1) i.className = 'pd-ring';
      el.appendChild(i);
    }
  };

  const setVars = (el, th) => {
    const t = THEMES[th];
    if(t){ el.style.setProperty('--pf-a', t.a); el.style.setProperty('--pf-b', t.b); }
    else { el.style.removeProperty('--pf-a'); el.style.removeProperty('--pf-b'); }
  };

  let shown = { theme: '', deco: '' };
  function show(pf){
    const th = pick(THEMES, pf.theme), dc = pick(DECOS, pf.deco);
    setVars(pv, th);
    if(th) pv.dataset.th = th; else delete pv.dataset.th;
    if(shown.deco !== dc || !deco.firstChild) buildDeco(deco, dc);
    shown = { theme: th, deco: dc };
  }

  // Profil her değiştiğinde açılış sahnesini yeniden oynat
  let lastId = null;
  function onProfile(){
    const p = window.__lefProfile; if(!p) return;
    const pf = p.pf || {};
    open.hidden = !p.mine;
    show(pf);
    if(p.id !== lastId){
      lastId = p.id;
      pv.classList.remove('pd-go'); void pv.offsetWidth; pv.classList.add('pd-go');
    }
  }
  window.addEventListener('lef-profile', onProfile);
  onProfile();

  // ---------- Düzenleme paneli ----------
  const sheet = document.createElement('div');
  sheet.className = 'st pd-sheet'; sheet.setAttribute('aria-hidden', 'true');
  sheet.innerHTML =
    '<div class="st-card" role="dialog" aria-modal="true" aria-label="Profili süsle">' +
    '<div class="st-top"><b>Profili süsle</b><button type="button" id="pdX" aria-label="Kapat">&times;</button></div>' +
    '<div class="pd-cols"><div><div class="pd-sec">Tema</div><div class="pd-grid" id="pdTh"></div></div>' +
    '<div><div class="pd-sec">Avatar çerçevesi</div><div class="pd-grid" id="pdDc"></div></div></div>' +
    '<div class="pd-err" id="pdErr" role="status"></div>' +
    '<div class="pd-foot"><button type="button" class="bio-btn" id="pdCancel">Vazgeç</button><button type="button" class="bio-btn pri" id="pdSave">Kaydet</button></div>' +
    '</div>';
  document.body.appendChild(sheet);
  const $ = id => sheet.querySelector('#' + id);

  let draft = { theme: '', deco: '' };
  let saved = { theme: '', deco: '' };

  const tile = (grp, key, inner, label) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pd-t'; b.dataset.g = grp; b.dataset.k = key; b.setAttribute('aria-pressed', 'false');
    b.insertAdjacentHTML('beforeend', inner);
    const s = document.createElement('span'); s.textContent = label; b.appendChild(s);
    return b;
  };
  const noneSw = '<div class="pd-sw" style="background:repeating-linear-gradient(45deg,#2b2b31 0 6px,#35353c 6px 12px)"></div>';
  $('pdTh').appendChild(tile('theme', '', noneSw, 'Yok'));
  Object.keys(THEMES).forEach(k => $('pdTh').appendChild(tile('theme', k, '<div class="pd-sw" style="background:linear-gradient(120deg,' + THEMES[k].b + ',' + THEMES[k].a + ')"></div>', THEMES[k].n)));
  $('pdDc').appendChild(tile('deco', '', '<div class="pd-mini"></div>', 'Yok'));
  Object.keys(DECOS).forEach(k => {
    const t = tile('deco', k, '<div class="pd-mini"><div class="pd-deco"></div></div>', DECOS[k]);
    buildDeco(t.querySelector('.pd-deco'), k);
    $('pdDc').appendChild(t);
  });

  const sync = () => {
    sheet.querySelectorAll('.pd-t').forEach(b => b.setAttribute('aria-pressed', String(draft[b.dataset.g] === b.dataset.k)));
    setVars(sheet, draft.theme);
  };
  const openSheet = () => {
    const p = window.__lefProfile; if(!p || !p.mine) return;
    saved = { theme: pick(THEMES, (p.pf || {}).theme), deco: pick(DECOS, (p.pf || {}).deco) };
    draft = Object.assign({}, saved);
    $('pdErr').textContent = ''; sync();
    sheet.classList.add('on'); sheet.setAttribute('aria-hidden', 'false');
  };
  const closeSheet = revert => {
    sheet.classList.remove('on'); sheet.setAttribute('aria-hidden', 'true');
    if(revert) show(saved);
  };
  open.addEventListener('click', openSheet);
  $('pdX').addEventListener('click', () => closeSheet(true));
  $('pdCancel').addEventListener('click', () => closeSheet(true));
  sheet.addEventListener('click', e => { if(e.target === sheet) closeSheet(true); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && sheet.classList.contains('on')) closeSheet(true); });

  sheet.addEventListener('click', e => {
    const b = e.target.closest('.pd-t'); if(!b) return;
    draft[b.dataset.g] = b.dataset.k;
    sync(); show(draft);          // canlı önizleme: arkadaki profilde hemen görünür
  });

  $('pdSave').addEventListener('click', async () => {
    const btn = $('pdSave'); btn.disabled = true; $('pdErr').textContent = '';
    const row = { pf_theme: draft.theme || null, pf_deco: draft.deco || null };
    try {
      const p = window.__lefProfile;
      const { data: { session } } = await supabase.auth.getSession();
      if(!session || !p || !p.mine) throw new Error('Oturum bulunamadı.');
      const { error } = await supabase.from('profiles').update(row).eq('id', session.user.id);
      if(error) throw error;
      saved = Object.assign({}, draft);
      p.pf = Object.assign({}, saved);
      window.dispatchEvent(new CustomEvent('lef-pf-saved', { detail: row }));
      closeSheet(false);
    } catch(err){
      $('pdErr').textContent = 'Kaydedilemedi. profil-tasarim.sql çalıştırıldı mı?';
    }
    btn.disabled = false;
  });
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();