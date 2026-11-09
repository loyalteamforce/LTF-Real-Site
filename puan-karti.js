/* ============================================================
   PUAN KARTI: Ana Sayfa'da kart + Gönder / Geçmiş
   - Puan sunucudaki cüzdanda durur (puan-kurulum.sql). Tarayıcı sadece okur,
     değiştirme işi sunucu fonksiyonlarındadır (wallet_send, wallet_earn).
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

let uid = null;
try { const s = await supabase.auth.getSession(); uid = s.data.session && s.data.session.user.id; } catch (_) {}
if (uid) init();

function init() {
  const lk = document.createElement('link'); lk.rel = 'stylesheet';
  lk.href = 'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cormorant+Garamond:wght@600;700&display=swap';
  document.head.appendChild(lk);

  const css = document.createElement('style');
  css.textContent = `
.pc-wrap{ margin-top:14px; display:grid; grid-template-columns:minmax(0,1.12fr) minmax(0,1fr); gap:12px; align-items:start; }
.pc-left,.pc-side{ min-width:0; }
.pc-flip{ display:block; position:relative; width:100%; aspect-ratio:1.56; perspective:900px; cursor:pointer; container-type:inline-size; outline:none; user-select:none; -webkit-user-select:none; touch-action:manipulation; }
.pc-flip:focus-visible .pc-face{ outline:2px solid rgba(255,255,255,.7); outline-offset:2px; }
.pc-inner{ position:relative; width:100%; height:100%; transform-style:preserve-3d; -webkit-transform-style:preserve-3d; transition:transform .6s cubic-bezier(.45,0,.55,1); }
.pc-flip.flipped .pc-inner{ transform:rotateY(180deg); }
.pc-face{ box-sizing:border-box; position:absolute; inset:0; border-radius:8cqw; overflow:hidden; color:#f2f2f2; backface-visibility:hidden; -webkit-backface-visibility:hidden;
  border:1px solid rgba(255,255,255,.16); box-shadow:0 18px 40px -18px rgba(0,0,0,.9),inset 0 1px 0 rgba(255,255,255,.12); }
.pc-front{ transform:rotateY(180deg); padding:5.5% 7%; display:flex; flex-direction:column; justify-content:space-between;
  background:linear-gradient(118deg,transparent 28%,rgba(255,255,255,.055) 50%,transparent 72%),
             repeating-linear-gradient(115deg,rgba(255,255,255,.035) 0 2px,transparent 2px 7px),
             linear-gradient(135deg,#1a1a1a 0%,#000 48%,#0d0d0d 100%); }
.pc-back{ display:grid; place-items:center;
  background:radial-gradient(circle at 50% 32%,rgba(255,255,255,.13),transparent 62%),linear-gradient(135deg,#242424 0%,#0b0b0b 55%,#1b1b1b 100%); }
.pc-back::before{ content:""; position:absolute; inset:0; background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); opacity:.2; mix-blend-mode:screen; pointer-events:none; }
.pc-back::after{ content:""; position:absolute; inset:0; background:linear-gradient(118deg,transparent 28%,rgba(255,255,255,.08) 50%,transparent 72%); pointer-events:none; }
.pc-bcrest{ position:relative; z-index:1; width:44cqw; height:auto; opacity:.9; filter:drop-shadow(0 4px 14px rgba(0,0,0,.65)); pointer-events:none; }
.pc-top{ display:flex; align-items:flex-start; justify-content:space-between; }
.pc-brand{ font-family:'Cinzel Decorative',Cinzel,serif; font-weight:700; font-size:6cqw; letter-spacing:.16em;
  background:linear-gradient(90deg,#bdbdbd,#f0f0f0 60%,#9a9a9a); -webkit-background-clip:text; background-clip:text; color:transparent; }
.pc-crest{ width:11cqw; height:auto; opacity:.92; filter:drop-shadow(0 2px 6px rgba(0,0,0,.4)); }
.pc-mid{ display:flex; align-items:baseline; gap:2.5cqw; margin-top:auto; }
.pc-num{ font-family:'Cormorant Garamond',Georgia,serif; font-weight:700; font-size:13cqw; line-height:1; letter-spacing:.01em;
  background:linear-gradient(180deg,#fff 20%,#c4c4c4); -webkit-background-clip:text; background-clip:text; color:transparent; filter:drop-shadow(0 2px 3px rgba(0,0,20,.45)); font-variant-numeric:oldstyle-nums; }
.pc-pt{ font-size:5cqw; color:#b0b0b0; letter-spacing:.04em; }
.pc-lbl{ margin-top:3%; font-size:max(6.5px,2.9cqw); letter-spacing:.26em; color:#8a8a8a; }
.pc-name{ margin-top:2px; font-family:'Cinzel Decorative',Cinzel,serif; font-size:5.6cqw; letter-spacing:.04em; color:#e6e6e6; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.pc-back,.pc-front{ transition:visibility 0s linear .3s; }
.pc-front{ visibility:hidden; }
.pc-flip.flipped .pc-front{ visibility:visible; }
.pc-flip.flipped .pc-back{ visibility:hidden; }
.pc-flip{ -webkit-tap-highlight-color:transparent; }
@media (prefers-reduced-motion:reduce){ .pc-inner{ transition-duration:.01s; } .pc-back,.pc-front{ transition-delay:0s; } }
.pc-acts{ display:grid; grid-template-columns:repeat(2,1fr); gap:8px; margin-top:10px; }
.pc-act{ display:flex; align-items:center; justify-content:center; gap:6px; height:40px; border-radius:12px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); color:#fff; font:inherit; font-size:13px; cursor:pointer; }
.pc-act svg{ width:16px; height:16px; flex:none; }
.pc-send{ margin:12px 14px 0; display:inline-flex; align-items:center; }
.pc-send[hidden]{ display:none; }

.pc-sheet .st-card{ width:min(100%,460px); max-height:86dvh; overflow-y:auto; overscroll-behavior:contain; }
.pc-bal{ margin:4px 0 14px; color:#9ca3af; font-size:14px; } .pc-bal b{ color:#fff; font-size:16px; }
.pc-l{ display:block; margin:14px 0 6px; font-size:13px; color:#9ca3af; }
.pc-in{ width:100%; height:44px; padding:0 14px; border-radius:12px; border:1px solid rgba(255,255,255,.18); background:rgba(0,0,0,.35); color:#fff; font:inherit; font-size:16px; outline:none; }
.pc-in:focus{ border-color:rgba(160,195,255,.7); }
.pc-chips{ display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
.pc-cb{ height:32px; padding:0 14px; border-radius:999px; border:1px solid rgba(255,255,255,.16); background:rgba(255,255,255,.07); color:#e5e7eb; font:inherit; font-size:13px; cursor:pointer; }
.pc-res{ margin-top:8px; max-height:210px; overflow-y:auto; }
.pc-u{ display:flex; align-items:center; gap:10px; width:100%; padding:8px 10px; border:none; border-radius:12px; background:transparent; color:#fff; font:inherit; font-size:14px; text-align:left; cursor:pointer; }
.pc-u:hover,.pc-u:focus-visible{ background:rgba(255,255,255,.08); }
.pc-u img,.pc-u u{ width:34px; height:34px; border-radius:50%; object-fit:cover; background:#33343b; flex:none; }
.pc-pick{ display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:12px; background:rgba(255,255,255,.07); }
.pc-pick b{ flex:1; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.pc-err{ min-height:20px; margin:10px 0 0; font-size:13px; color:#ffb3b3; }
.pc-ok{ text-align:center; padding:18px 0 6px; } .pc-ok svg{ width:46px; height:46px; color:#7ee2a8; } .pc-ok p{ margin-top:10px; line-height:1.5; }
.pc-go{ width:100%; height:46px; margin:10px 0 0 !important; }
.pc-go:disabled{ opacity:.45; cursor:not-allowed; }
.pc-sec{ margin:16px 0 6px; font-size:13px; font-weight:600; color:#9ca3af; }
.pc-row{ display:flex; align-items:center; gap:12px; padding:9px 0; border-bottom:1px solid rgba(255,255,255,.07); }
.pc-row > span{ flex:1; font-size:14px; min-width:0; } .pc-row small{ display:block; margin-top:2px; color:#9ca3af; font-size:12px; }
.pc-sw{ flex:none; width:40px; height:28px; border-radius:8px; }
.pc-rg{ flex:none; width:28px; height:28px; border-radius:50%; background:conic-gradient(#9cc4ff,#1a3560,#9cc4ff); -webkit-mask:radial-gradient(farthest-side,transparent 62%,#000 64%); mask:radial-gradient(farthest-side,transparent 62%,#000 64%); }
.pc-buy{ flex:none; min-width:84px; height:34px; padding:0 12px; border-radius:999px; border:1px solid rgba(255,255,255,.22); background:transparent; color:#fff; font:inherit; font-size:13px; cursor:pointer; }
.pc-buy:disabled{ opacity:.5; cursor:default; }
.pc-plus{ color:#7ee2a8; font-weight:600; } .pc-minus{ color:#ff9a9a; font-weight:600; }
.pc-dim{ color:#9ca3af; font-size:14px; padding:12px 0; }
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
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m7.5 12.5 3 3 6-7"/></svg>'
  };
  function build() {
    const w = document.createElement('div'); w.className = 'pc-wrap';
    w.innerHTML = `<div class="pc-left">
      <div class="pc-flip" role="button" tabindex="0" aria-pressed="false" aria-label="Puan kartı. Çevirmek için dokun">
        <div class="pc-inner">
          <div class="pc-face pc-back" aria-hidden="true"><img class="pc-bcrest" src="crest.png" alt=""></div>
          <div class="pc-face pc-front" role="group" aria-label="Puan kartı ön yüzü">
            <div class="pc-top"><span class="pc-brand">POINTS</span><img class="pc-crest" src="crest.png" alt=""></div>
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
    const flip = w.querySelector('.pc-flip');
    let busy = false;   // animasyon sürerken gelen dokunuşları yok say: bir dokunuş = bir çevirme
    const toggle = () => {
      if (busy) return;
      busy = true; setTimeout(() => { busy = false; }, reduced ? 30 : 620);
      const on = flip.classList.toggle('flipped'); flip.setAttribute('aria-pressed', on ? 'true' : 'false');
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
  sheet.innerHTML = '<div class="st-card" role="dialog" aria-modal="true" aria-label="Puan kartı"><div class="st-top"><b id="pcT"></b><button type="button" id="pcX" aria-label="Kapat">&times;</button></div><div id="pcB"></div></div>';
  document.body.appendChild(sheet);
  const B = () => $('#pcB', sheet), T = t => { $('#pcT', sheet).textContent = t; };
  const close = () => { sheet.classList.remove('on'); sheet.setAttribute('aria-hidden', 'true'); };
  $('#pcX', sheet).addEventListener('click', close);
  sheet.addEventListener('click', e => { if (e.target === sheet) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheet.classList.contains('on')) close(); });

  function openSheet(v, arg) {
    sheet.classList.add('on'); sheet.setAttribute('aria-hidden', 'false');
    if (ok === false) { T('Puan kartı'); B().innerHTML = '<p class="pc-dim">Puan kartı için sunucu kurulumu gerekiyor: Supabase SQL Editor\'de <b>puan-kurulum.sql</b> dosyasını çalıştır.</p>'; return; }
    if (v === 'send') viewSend(arg); else viewHist();
  }
  window.__lefWalletOpen = openSheet;

  const avBase = supabase.supabaseUrl + '/storage/v1/object/public/';
  const avatar = u => u && u.avatar_url && u.avatar_url.indexOf(avBase) === 0 ? `<img src="${E(u.avatar_url)}" alt="">` : '<u></u>';

  /* ---------- GÖNDER ---------- */
  function viewSend(pre) {
    T('Puan gönder');
    let to = pre || null, amt = 0, confirming = false, tm = 0, tok = 0;
    B().innerHTML = `<div class="pc-bal">Kullanılabilir <b>${fmt(bal)}</b> pt</div>
      <div id="pcTo"></div>
      <label class="pc-l" for="pcAmt">Miktar</label>
      <input class="pc-in" id="pcAmt" inputmode="numeric" autocomplete="off" placeholder="0" maxlength="9">
      <div class="pc-chips">${[10, 50, 100, 500].map(n => `<button type="button" class="pc-cb" data-n="${n}">${n}</button>`).join('')}<button type="button" class="pc-cb" data-n="max">Hepsi</button></div>
      <label class="pc-l" for="pcNote">Not (isteğe bağlı)</label>
      <input class="pc-in" id="pcNote" maxlength="60" autocomplete="off" placeholder="Kısa bir mesaj">
      <p class="pc-err" id="pcE" role="status"></p>
      <button type="button" class="bio-btn pri pc-go" id="pcGo" disabled>Gönder</button>`;
    const go = $('#pcGo', sheet), err = $('#pcE', sheet), inp = $('#pcAmt', sheet);

    const check = () => {
      confirming = false; err.textContent = '';
      amt = parseInt(inp.value.replace(/\D/g, ''), 10) || 0;
      go.disabled = !(to && amt >= 1 && amt <= bal);
      go.textContent = 'Gönder';
      if (amt > bal) err.textContent = 'Yeterli puanın yok.';
    };
    function drawTo() {
      const box = $('#pcTo', sheet);
      if (to) {
        box.innerHTML = `<div class="pc-pick">${avatar(to)}<b>${E(to.name)}</b>${pre ? '' : '<button type="button" class="pc-cb" id="pcChg">Değiştir</button>'}</div>`;
        const c = $('#pcChg', sheet); if (c) c.onclick = () => { to = null; drawTo(); check(); };
      } else {
        box.innerHTML = '<label class="pc-l" for="pcQ">Kime?</label><input class="pc-in" id="pcQ" autocomplete="off" placeholder="Kullanıcı adı ara"><div class="pc-res" id="pcR"></div>';
        $('#pcQ', sheet).addEventListener('input', e => { clearTimeout(tm); const q = e.target.value; tm = setTimeout(() => search(q), 280); });
      }
    }
    async function search(raw) {
      const r = $('#pcR', sheet); const q = raw.trim().replace(/[^\p{L}\p{N}_. -]/gu, '');
      if (q.length < 2) { r.innerHTML = ''; return; }
      const my = ++tok;
      const { data, error } = await supabase.from('profiles').select('id,username,display_name,avatar_url').or(`username.ilike.%${q}%,display_name.ilike.%${q}%`).neq('id', uid).limit(8);
      if (my !== tok || !r.isConnected) return;
      if (error || !data.length) { r.innerHTML = '<p class="pc-dim">Kimse bulunamadı.</p>'; return; }
      r.innerHTML = data.map((u, i) => `<button type="button" class="pc-u" data-i="${i}">${avatar(u)}<span>${E(u.display_name || u.username)}</span></button>`).join('');
      r.onclick = e => { const b = e.target.closest('.pc-u'); if (!b) return; const u = data[b.dataset.i]; to = { id: u.id, name: u.display_name || u.username, avatar_url: u.avatar_url }; drawTo(); check(); };
    }
    drawTo();
    inp.addEventListener('input', check);
    B().querySelectorAll('[data-n]').forEach(b => b.addEventListener('click', () => { inp.value = b.dataset.n === 'max' ? String(bal) : b.dataset.n; check(); }));
    go.addEventListener('click', async () => {
      if (!confirming) { confirming = true; go.textContent = `Onayla: ${fmt(amt)} pt → ${to.name}`; return; }
      go.disabled = true; err.textContent = '';
      try {
        const { data, error } = await supabase.rpc('wallet_send', { p_to: to.id, p_amount: amt, p_note: $('#pcNote', sheet).value.trim() });
        if (error) throw error;
        setBal(data);
        B().innerHTML = `<div class="pc-ok">${SVG.check}<p><b>${fmt(amt)} pt</b> ${E(to.name)} kişisine gönderildi.<br>Kalan: ${fmt(data)} pt</p></div><button type="button" class="bio-btn pc-go" id="pcDone">Tamam</button>`;
        $('#pcDone', sheet).onclick = close;
      } catch (e) { err.textContent = errText(e); go.disabled = false; confirming = false; go.textContent = 'Gönder'; }
    });
  }

  /* ---------- GEÇMİŞ ---------- */
  async function viewHist() {
    T('Geçmiş');
    B().innerHTML = '<p class="pc-dim">Yükleniyor…</p>';
    const { data, error } = await supabase.from('wallet_tx').select('kind,amount,other_id,note,created_at').order('created_at', { ascending: false }).limit(40);
    if (error) { B().innerHTML = '<p class="pc-dim">Geçmiş yüklenemedi.</p>'; return; }
    if (!data.length) { B().innerHTML = '<p class="pc-dim">Henüz hareket yok.</p>'; return; }
    const ids = [...new Set(data.map(r => r.other_id).filter(Boolean))], nm = {};
    if (ids.length) { const { data: pr } = await supabase.from('profiles').select('id,username,display_name').in('id', ids); (pr || []).forEach(p => nm[p.id] = p.display_name || p.username); }
    const label = r => r.kind === 'earn' ? (r.note || 'Kazanılan puan') : r.kind === 'spend' ? 'Harcama: ' + (r.note || '') : (r.kind === 'send' ? 'Gönderildi: ' : 'Alındı: ') + (nm[r.other_id] || 'Üye');
    B().innerHTML = `<div class="pc-bal">Bakiye <b>${fmt(bal)}</b> pt</div>` + data.map(r => {
      const plus = r.kind === 'earn' || r.kind === 'receive';
      const sub = (r.kind === 'send' || r.kind === 'receive') && r.note ? E(r.note) + ' · ' : '';
      return `<div class="pc-row"><span>${E(label(r))}<small>${sub}${new Date(r.created_at).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small></span><b class="${plus ? 'pc-plus' : 'pc-minus'}">${plus ? '+' : '−'}${fmt(r.amount)}</b></div>`;
    }).join('');
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
