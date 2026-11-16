/* ============================================================
   BANNER ÇERÇEVESİ: profile 3 hazır çerçeve ekler (Kelebek, Mürekkep, Kurdele).
   - Banner'ın kenarına süslü çerçeve, avatarın etrafına halka (avatar banner çizgisinin üzerinden geçer)
     ve isim levhası gelir. Açık renkli (Mürekkep, Kurdele) çerçevelerde banner arkasındaki bulanık ışıma kapatılır.
   - Seçim profiles.pf_frame sütununa kaydedilir (herkes görür). Sütun yoksa/yazılamazsa bu cihazda saklanır.
   - Sadece kendi profilinde "Banner çerçevesi" düğmesi çıkar.
   - config.js bu dosyayı kendisi yükler; app.html'ye ekleme gerekmez.
   ============================================================ */
import { supabase } from './config.js';

const BUT = '<svg viewBox="0 0 40 32" aria-hidden="true"><g fill="currentColor"><path d="M20 16C16 3 3 2 4 12c1 7 11 8 16 4Z"/><path d="M20 16c-4 3-9 9-5 13 3 2 5-6 5-13Z"/><path d="M20 16C24 3 37 2 36 12c-1 7-11 8-16 4Z"/><path d="M20 16c4 3 9 9 5 13-3 2-5-6-5-13Z"/><rect x="19.2" y="8" width="1.6" height="16" rx=".8"/></g><path d="M19 8c-1-4-3-5-5-5M21 8c1-4 3-5 5-5" stroke="currentColor" fill="none" stroke-width="1"/></svg>';
const CURL = '<svg viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 57C3 28 28 3 57 3"/><path d="M11 57C11 36 18 22 30 14"/><path d="M3 24c-3-7 6-12 11-6s-3 10-7 6"/><circle cx="14" cy="14" r="2" fill="currentColor"/></svg>';
const BOW = '<svg viewBox="0 0 64 44" aria-hidden="true"><g fill="currentColor"><path d="M32 22C22 4 3 3 5 17c2 13 19 9 27 5Z"/><path d="M32 22C42 4 61 3 59 17c-2 13-19 9-27 5Z"/><rect x="27" y="16" width="10" height="12" rx="4"/><path d="M29 28 20 43l8-4 4 5 2-16Z"/><path d="M35 28 44 43l-8-4-4 5-2-16Z"/></g></svg>';
const MOON = '<svg viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="12" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 4a11 11 0 1 0 0 22 8 8 0 1 1 0-22Z" fill="currentColor"/></svg>';
const STAR = '<svg viewBox="0 0 20 28" aria-hidden="true"><path d="M10 0 12.5 11 20 14 12.5 17 10 28 7.5 17 0 14 7.5 11Z" fill="currentColor"/></svg>';

const ST = {
  kelebek:  { n: 'Kelebek',   light: false, top: BUT,  topW: 38, corner: CURL, cW: 56, corners: ['tl', 'tr', 'bl', 'br'], ring: [{ svg: BUT, w: 24, a: -135 }, { svg: BUT, w: 20, a: 55 }] },
  murekkep: { n: 'Mürekkep',  light: true,  top: MOON, topW: 26, corner: CURL, cW: 50, corners: ['tl', 'tr', 'bl', 'br'], ring: [{ svg: MOON, w: 18, a: -50 }] },
  kurdele:  { n: 'Kurdele',   light: true,  top: BOW,  topW: 54, corner: BOW,  cW: 38, corners: ['tl', 'tr'], ring: [{ svg: BOW, w: 34, a: 90 }, { svg: STAR, w: 12, a: 135 }] }
};
const KEYS = Object.keys(ST);
const pick = k => (typeof k === 'string' && Object.prototype.hasOwnProperty.call(ST, k)) ? k : '';

const CSS = `
.fr-ov{ display:none; position:absolute; inset:-9px; z-index:2; pointer-events:none; }
.fr-ring{ display:none; position:absolute; left:14px; top:0; width:var(--av,132px); height:var(--av,132px); z-index:3; pointer-events:none; }
#v-profil[data-fr] .fr-ov,#v-profil[data-fr] .fr-ring{ display:block; }
#v-profil[data-fr="kelebek"]{ --fc:#f4f4f4; --fg:rgba(255,255,255,.45); }
#v-profil[data-fr="murekkep"]{ --fc:#e4dfd4; --fg:rgba(228,223,212,.3); }
#v-profil[data-fr="kurdele"]{ --fc:#d4d4da; --fg:rgba(255,255,255,.3); }
#v-profil[data-fr] .pf-bwrap{ margin-top:20px; }
.fr-box{ position:absolute; inset:0; display:block; border-radius:28px; border:2px solid var(--fc); box-shadow:0 0 22px var(--fg); }
.fr-box::after{ content:""; position:absolute; inset:4px; border-radius:23px; border:1px solid var(--fc); opacity:.8; }
#v-profil[data-fr="kurdele"] .fr-box{ border-width:3px; }
#v-profil[data-fr="kurdele"] .fr-box::after{ border:2px dotted #fff; opacity:.9; }
#v-profil[data-fr="murekkep"] .fr-box{ filter:url(#frInk); border-width:2.5px; }
#v-profil[data-fr="murekkep"] .pf-glow,#v-profil[data-fr="kurdele"] .pf-glow{ display:none !important; }
.fr-t{ position:absolute; left:50%; top:0; transform:translate(-50%,-52%); color:var(--fc); filter:drop-shadow(0 0 6px var(--fg)); }
.fr-c{ position:absolute; color:var(--fc); filter:drop-shadow(0 0 5px var(--fg)); }
.fr-c svg,.fr-t svg,.fr-o svg{ display:block; width:100%; height:auto; }
.fr-c.tl{ left:-8px; top:-8px; } .fr-c.tr{ right:-8px; top:-8px; transform:scaleX(-1); }
.fr-c.bl{ left:-8px; bottom:-8px; transform:scaleY(-1); } .fr-c.br{ right:-8px; bottom:-8px; transform:scale(-1,-1); }
.fr-ring::before{ content:""; position:absolute; inset:-7px; border-radius:50%; border:2px solid var(--fc); box-shadow:0 0 14px var(--fg); }
.fr-ring::after{ content:""; position:absolute; inset:-13px; border-radius:50%; border:1px solid var(--fc); opacity:.8; }
#v-profil[data-fr="kurdele"] .fr-ring::after{ border:2px dotted #fff; opacity:.9; }
#v-profil[data-fr="murekkep"] .fr-ring::before{ filter:url(#frInk); }
.fr-o{ position:absolute; transform:translate(-50%,-50%); color:var(--fc); filter:drop-shadow(0 0 4px var(--fg)); }
#v-profil[data-fr] .pf-name{ width:fit-content; max-width:100%; padding:5px 18px; border:2px solid var(--fc); border-radius:999px; background:rgba(0,0,0,.45); box-shadow:0 0 12px var(--fg); position:relative; }
#v-profil[data-fr] .pf-name::after{ content:""; position:absolute; inset:3px; border-radius:999px; border:1px solid var(--fc); opacity:.6; pointer-events:none; }
#v-profil[data-fr="kurdele"] .pf-name::after{ border:2px dotted #fff; opacity:.8; }
@media (max-width:600px){
  #v-profil[data-fr] .pf-bwrap{ margin:20px 8px 0; }
  .fr-ov{ inset:-6px; } .fr-box{ border-radius:24px; } .fr-box::after{ border-radius:20px; }
  .fr-c.tl{ left:-4px; top:-4px; } .fr-c.tr{ right:-4px; top:-4px; } .fr-c.bl{ left:-4px; bottom:-4px; } .fr-c.br{ right:-4px; bottom:-4px; }
  .fr-c{ width:40px !important; height:40px !important; }
}
.fr-open{ display:inline-flex; align-items:center; margin:12px 0 0 6px; }
.fr-open[hidden]{ display:none; }
.fr-sheet .st-card{ width:min(100%,460px); max-height:84dvh; overflow-y:auto; }
.fr-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-top:8px; }
.fr-tile{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; min-height:92px; padding:10px; border-radius:14px; border:1.5px solid rgba(255,255,255,.14);
  background:rgba(255,255,255,.05); color:#e5e7eb; font:inherit; font-size:13px; cursor:pointer; }
.fr-tile[aria-pressed="true"]{ border-color:#fff; background:rgba(255,255,255,.13); }
.fr-tile .pv{ width:44px; color:#fff; }
.fr-tile .pv svg{ display:block; width:100%; height:auto; }
.fr-tile .none{ width:44px; height:30px; border-radius:8px; background:repeating-linear-gradient(45deg,#2b2b31 0 6px,#35353c 6px 12px); }
.fr-err{ min-height:18px; margin-top:10px; font-size:13px; color:#ffb3b3; }
.fr-foot{ display:flex; justify-content:flex-end; gap:8px; margin-top:14px; }
@media (prefers-reduced-motion:reduce){ .fr-box,.fr-ring::before{ filter:none !important; } }
`;

function init(){
  const pv = document.getElementById('v-profil');
  const bw = pv && pv.querySelector('.pf-bwrap');
  const head = pv && pv.querySelector('.pf-head');
  if(!pv || !bw || !head) return;

  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  document.body.insertAdjacentHTML('beforeend',
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="frInk" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="5"/></filter></svg>');

  const ov = document.createElement('div'); ov.className = 'fr-ov'; ov.setAttribute('aria-hidden', 'true'); bw.appendChild(ov);
  const ring = document.createElement('div'); ring.className = 'fr-ring'; ring.setAttribute('aria-hidden', 'true'); head.appendChild(ring);

  let shown = '';
  function paint(k){
    k = pick(k);
    if(k === shown) return;
    shown = k;
    ov.textContent = ''; ring.textContent = '';
    if(!k){ delete pv.dataset.fr; return; }
    pv.dataset.fr = k;
    const s = ST[k];
    ov.insertAdjacentHTML('beforeend', '<i class="fr-box"></i><span class="fr-t" style="width:' + s.topW + 'px">' + s.top + '</span>');
    s.corners.forEach(c => ov.insertAdjacentHTML('beforeend', '<span class="fr-c ' + c + '" style="width:' + s.cW + 'px;height:' + s.cW + 'px">' + s.corner + '</span>'));
    s.ring.forEach(o => {
      const r = o.a * Math.PI / 180;
      ring.insertAdjacentHTML('beforeend', '<span class="fr-o" style="width:' + o.w + 'px;left:calc(50% + ' + Math.cos(r).toFixed(3) + ' * (50% + 11px));top:calc(50% + ' + Math.sin(r).toFixed(3) + ' * (50% + 11px))">' + o.svg + '</span>');
    });
  }

  let uid = null, lastId = null, tok = 0, saved = '', draft = '', mine = false;
  supabase.auth.getSession().then(r => { uid = r.data && r.data.session ? r.data.session.user.id : null; }).catch(() => {});
  const lsKey = id => 'lef_frame_' + id;
  const lsGet = id => { try { return pick(localStorage.getItem(lsKey(id))); } catch(_){ return ''; } };
  const lsSet = (id, k) => { try { if(k) localStorage.setItem(lsKey(id), k); else localStorage.removeItem(lsKey(id)); } catch(_){} };

  async function loadFor(id, isMine){
    const my = ++tok;
    let k = '';
    try {
      const { data, error } = await supabase.from('profiles').select('pf_frame').eq('id', id).maybeSingle();
      if(!error && data) k = pick(data.pf_frame);
    } catch(_){}
    if(!k && isMine) k = lsGet(id);
    if(my !== tok) return;
    saved = k; paint(k);
  }
  function onProfile(){
    const p = window.__lefProfile; if(!p || !p.id) return;
    mine = !!p.mine; open.hidden = !mine;
    if(p.id !== lastId){ lastId = p.id; saved = ''; paint(''); loadFor(p.id, mine); }
  }

  // ---------- seçim paneli ----------
  const open = document.createElement('button');
  open.type = 'button'; open.className = 'bio-btn fr-open'; open.hidden = true; open.textContent = 'Banner çerçevesi';
  const back = document.getElementById('pfBack'); (back || head).after(open);

  const sheet = document.createElement('div');
  sheet.className = 'st fr-sheet'; sheet.setAttribute('aria-hidden', 'true');
  sheet.innerHTML =
    '<div class="st-card" role="dialog" aria-modal="true" aria-label="Banner çerçevesi">' +
    '<div class="st-top"><b>Banner çerçevesi</b><button type="button" id="frX" aria-label="Kapat">&times;</button></div>' +
    '<div class="fr-grid" id="frG"></div><div class="fr-err" id="frErr" role="status"></div>' +
    '<div class="fr-foot"><button type="button" class="bio-btn" id="frCancel">Vazgeç</button><button type="button" class="bio-btn pri" id="frSave">Kaydet</button></div></div>';
  document.body.appendChild(sheet);
  const $ = id => sheet.querySelector('#' + id);

  const tile = (k, inner, label) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'fr-tile'; b.dataset.k = k; b.setAttribute('aria-pressed', 'false');
    b.insertAdjacentHTML('beforeend', inner); const s = document.createElement('span'); s.textContent = label; b.appendChild(s); return b;
  };
  $('frG').appendChild(tile('', '<div class="none"></div>', 'Yok'));
  KEYS.forEach(k => $('frG').appendChild(tile(k, '<div class="pv">' + ST[k].top + '</div>', ST[k].n)));
  const sync = () => sheet.querySelectorAll('.fr-tile').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === draft)));
  const openSheet = () => { draft = saved; $('frErr').textContent = ''; sync(); sheet.classList.add('on'); sheet.setAttribute('aria-hidden', 'false'); };
  const closeSheet = revert => { sheet.classList.remove('on'); sheet.setAttribute('aria-hidden', 'true'); if(revert) paint(saved); };
  open.addEventListener('click', openSheet);
  $('frX').addEventListener('click', () => closeSheet(true));
  $('frCancel').addEventListener('click', () => closeSheet(true));
  sheet.addEventListener('click', e => { if(e.target === sheet){ closeSheet(true); return; } const b = e.target.closest('.fr-tile'); if(!b) return; draft = b.dataset.k; sync(); paint(draft); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && sheet.classList.contains('on')) closeSheet(true); });

  $('frSave').addEventListener('click', async () => {
    if(!uid || !mine) return;
    const btn = $('frSave'); btn.disabled = true; $('frErr').textContent = '';
    let dbOk = true;
    try {
      const { error } = await supabase.from('profiles').update({ pf_frame: draft || null }).eq('id', uid);
      if(error) throw error;
    } catch(_){ dbOk = false; }
    lsSet(uid, draft); saved = draft; paint(draft);
    btn.disabled = false;
    if(dbOk) closeSheet(false);
    else $('frErr').textContent = 'Sunucuya kaydedilemedi, çerçeve sadece bu cihazda görünür.';
  });

  window.addEventListener('lef-profile', onProfile);
  onProfile();
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
