/* ============================================================
   PROFİL ÇERÇEVELERİ: banner + avatar çerçevesi (3 tasarım, görselden)
   - "Profil efekti" panelinin üstüne iki sekme ekler: Normal efektler / Çerçeve tasarımları
   - Seçim profiles.fx_cerceve sütununa kaydedilir: beyaz | kirmizi | mavi
   - Repo kökünde bu 6 görsel olmalı:
       cr-beyaz-banner.png   cr-beyaz-avatar.png
       cr-kirmizi-banner.png cr-kirmizi-avatar.png
       cr-mavi-banner.png    cr-mavi-avatar.png
   - ux.js içinden otomatik yüklenir.
   ============================================================ */
import { supabase } from './config.js';

// hole: avatar çerçevesinin iç boşluğunun yarıçapı (görselde, piksel)
const PAL = {
  beyaz:   { n: 'Beyaz Diken', hole: 102, glow: 'rgba(255,255,255,.45)' },
  kirmizi: { n: 'Kızıl Melek', hole: 108, glow: 'rgba(255,50,85,.7)' },
  mavi:    { n: 'Mavi Zincir', hole: 104, glow: 'rgba(80,150,255,.6)' }
};
const src = (k, t) => 'cr-' + k + '-' + t + '.png';

if (typeof document !== 'undefined') (async function main() {
  if (document.readyState === 'loading') await new Promise(r => document.addEventListener('DOMContentLoaded', r));
  const $ = (s, r) => (r || document).querySelector(s);
  const wrap = $('.pf-bwrap'), head = $('.pf-head'), av = $('#pfAv'), bn = $('#pfBan');
  if (!wrap || !head || !av || !bn) return;

  const css = document.createElement('style');
  css.textContent =
    '.cr-ban{position:absolute;z-index:2;pointer-events:none;display:none;animation:crGlow 3.6s ease-in-out infinite alternate}' +
    '.cr-av{position:absolute;z-index:4;pointer-events:none;animation:crGlow 3.6s ease-in-out infinite alternate}' +
    '.cr-av img{position:absolute;left:50%;top:50%;max-width:none;transform:translate(-50%,-50%)}' +
    '@keyframes crGlow{from{filter:drop-shadow(0 0 2px var(--cg))}to{filter:drop-shadow(0 0 8px var(--cg))}}' +
    '@media (prefers-reduced-motion:reduce){.cr-ban,.cr-av{animation:none}}' +
    '.cr-tabs{display:flex;gap:6px;margin:0 0 10px}.cr-tabs button{flex:1;height:34px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:transparent;color:#cfd3da;font:inherit;font-size:13px;cursor:pointer}' +
    '.cr-tabs button.on{background:#fff;color:#111;border-color:#fff;font-weight:600}' +
    '.cr-dot{position:relative;display:block;width:34px;height:34px;border-radius:50%;background:#2b2b31}.cr-dot img{position:absolute;left:50%;top:50%;max-width:none;transform:translate(-50%,-50%)}';
  document.head.appendChild(css);

  const banEl = document.createElement('div'); banEl.className = 'cr-ban'; banEl.setAttribute('aria-hidden', 'true'); wrap.appendChild(banEl);
  const avEl = document.createElement('div'); avEl.className = 'cr-av'; avEl.setAttribute('aria-hidden', 'true'); head.appendChild(avEl);

  let cur = null;
  function render() {
    const w = bn.clientWidth, h = bn.clientHeight;
    if (!cur || !w || !h) { banEl.style.display = 'none'; avEl.innerHTML = ''; return; }
    const P = PAL[cur], sc = Math.min(.8, Math.max(.45, w / 1000)), m = 40 * sc, v = 100 * sc, hz = 150 * sc;
    banEl.style.setProperty('--cg', P.glow); avEl.style.setProperty('--cg', P.glow);
    banEl.style.cssText = 'display:block;left:' + (-m) + 'px;top:' + (-m) + 'px;width:' + (w + 2 * m) + 'px;height:' + (h + 2 * m) + 'px;box-sizing:border-box;border-style:solid;border-width:' + v + 'px ' + hz + 'px;border-image:url(' + src(cur, 'banner') + ') 100 150 / ' + v + 'px ' + hz + 'px stretch;';
    banEl.style.setProperty('--cg', P.glow);
    const d = av.offsetWidth, S = 380 * (d / 2) / P.hole;
    avEl.style.left = av.offsetLeft + 'px'; avEl.style.top = av.offsetTop + 'px'; avEl.style.width = d + 'px'; avEl.style.height = av.offsetHeight + 'px';
    avEl.innerHTML = '<img alt="" src="' + src(cur, 'avatar') + '" style="width:' + S + 'px;height:' + S + 'px">';
  }
  const apply = k => { cur = PAL[k] ? k : null; render(); };
  if (window.ResizeObserver) { const ro = new ResizeObserver(render); ro.observe(bn); ro.observe(head); } else window.addEventListener('resize', render);

  const memo = {}; let curId = null;
  async function load(id) {
    if (Object.prototype.hasOwnProperty.call(memo, id)) return memo[id];
    try {
      const r = await supabase.from('profiles').select('fx_cerceve').eq('id', id).maybeSingle();
      if (r.error) return null;
      memo[id] = (r.data && PAL[r.data.fx_cerceve]) ? r.data.fx_cerceve : null; return memo[id];
    } catch (_) { return null; }
  }
  async function onProfile() {
    const P = window.__lefProfile; if (!P) return;
    curId = P.id; const v = await load(P.id);
    if (curId === P.id) apply(v);
  }
  window.addEventListener('lef-profile', onProfile); onProfile();

  /* ---------- "Profil efekti" paneline sekmeler ---------- */
  function whenSheet(cb) {
    const s = $('.fx-sh'); if (s) return cb(s);
    const mo = new MutationObserver(() => { const s2 = $('.fx-sh'); if (s2) { mo.disconnect(); cb(s2); } });
    mo.observe(document.body, { childList: true });
  }
  whenSheet(sh => {
    const hd = $('.fx-hd', sh), grid = $('#fxGrid', sh), ft = $('.fx-ft', sh), msg = $('#fxMsg', sh);
    const tabs = document.createElement('div'); tabs.className = 'cr-tabs';
    tabs.innerHTML = '<button type="button" class="on">Normal efektler</button><button type="button">Çerçeve tasarımları</button>';
    hd.after(tabs);
    const cg = document.createElement('div'); cg.className = 'fx-grid cr-grid'; cg.style.display = 'none'; grid.after(cg);
    const cf = document.createElement('div'); cf.className = 'fx-ft'; cf.style.display = 'none';
    cf.innerHTML = '<button type="button" class="fx-b">İptal</button><button type="button" class="fx-b pri">Kaydet</button>';
    ft.after(cf);
    const cancelB = cf.firstChild, saveB = cf.lastChild;
    let pick = null, saved = null;

    [''].concat(Object.keys(PAL)).forEach(k => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'fx-it'; b.dataset.id = k;
      const i = document.createElement('i'); i.style.cssText = 'width:44px;height:44px';
      if (k) i.innerHTML = '<span class="cr-dot"><img alt="" src="' + src(k, 'avatar') + '" style="width:' + (380 * 17 / PAL[k].hole) + 'px;height:' + (380 * 17 / PAL[k].hole) + 'px"></span>'; else i.textContent = '\u2013';
      const s = document.createElement('span'); s.textContent = k ? PAL[k].n : 'Yok';
      b.appendChild(i); b.appendChild(s); cg.appendChild(b);
    });
    const mark = () => cg.querySelectorAll('.fx-it').forEach(b => b.classList.toggle('on', (b.dataset.id || '') === (pick || '')));
    const say = (t, err) => { msg.textContent = t || ''; msg.className = err ? 'err' : ''; };
    function tab(n) {
      tabs.children[0].classList.toggle('on', !n); tabs.children[1].classList.toggle('on', !!n);
      grid.style.display = n ? 'none' : ''; ft.style.display = n ? 'none' : '';
      cg.style.display = n ? '' : 'none'; cf.style.display = n ? '' : 'none';
      say('');
    }
    tabs.children[0].addEventListener('click', () => { tab(0); apply(saved); });
    tabs.children[1].addEventListener('click', () => { tab(1); pick = saved; mark(); apply(pick); });
    cg.addEventListener('click', e => { const b = e.target.closest('.fx-it'); if (!b) return; pick = b.dataset.id || null; mark(); say(''); apply(pick); });
    cancelB.addEventListener('click', () => { sh.hidden = true; });

    saveB.addEventListener('click', async () => {
      saveB.disabled = true; say('Kaydediliyor...');
      try {
        const ss = await supabase.auth.getSession(), id = ss.data.session && ss.data.session.user.id;
        const r = await supabase.from('profiles').update({ fx_cerceve: pick }).eq('id', id);
        if (r.error) throw r.error;
        memo[id] = pick; saved = pick; say(''); sh.hidden = true;
      } catch (err) { say('Kaydedilemedi: ' + ((err && err.message) || 'hata'), true); }
      saveB.disabled = false;
    });

    // Panel açılınca ilk sekme; kapanınca kaydedilmemiş önizleme geri alınır
    new MutationObserver(async () => {
      const P = window.__lefProfile;
      if (!sh.hidden) { tab(0); if (P) { saved = await load(P.id); pick = saved; mark(); } }
      else if (P) apply(await load(P.id));
    }).observe(sh, { attributes: true, attributeFilter: ['hidden'] });
  });
})();
