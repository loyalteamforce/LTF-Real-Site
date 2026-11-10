/* ============================================================
   LİDERLİK TABLOSU: Genel / Haftalık / Sınıflar
   - Veri sunucu fonksiyonlarından gelir (liderlik-kurulum.sql):
     leaderboard_overall, leaderboard_weekly, leaderboard_classes, leaderboard_me
   - Tasarım: ütte podyum (ilk 3), altında sayfalı sıralama listesi ve puan çubukları,
     sınıflarda renkli çubuklu tablo. Sıralama listesi 10'ar kişilik sayfalara bölünür.
   - Ana Sayfa'da kartın sağındaki #pcSide alanına önizleme kartı koyar; ona ya da
     Keşfet > "Sıralama" kutusuna basunca tam tablo açılır.
   - puan-karti.js tarafından yüklenir (dynamic import), ayrı script satırı gerekmez.
   ============================================================ */
import { supabase } from './config.js';

const $ = (s, r = document) => r.querySelector(s);
const fmt = n => Number(n || 0).toLocaleString('tr-TR');
const A = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const AVBASE = supabase.supabaseUrl + '/storage/v1/object/public/';
const nameOf = u => u.display_name || u.username || 'Üye';
const initial = u => nameOf(u).trim().charAt(0).toLocaleUpperCase('tr') || '?';
const avatar = (u, cls) => u.avatar_url && u.avatar_url.indexOf(AVBASE) === 0
  ? `<img class="lb-av ${cls || ''}" src="${A(u.avatar_url)}" alt="" loading="lazy">`
  : `<span class="lb-av lb-ph ${cls || ''}" aria-hidden="true">${A(initial(u))}</span>`;
const nameHtml = u => {
  const c = /^#[0-9a-f]{3,8}$/i.test(u.name_color || '') ? u.name_color : '';
  return `<span class="lb-nm"${c && c.toLowerCase() !== '#ffffff' ? ` style="color:${c}"` : ''}>${A(nameOf(u))}</span>`;
};
const PALETTE = ['#4E79A7', '#F28E2B', '#59A14F', '#B07AA1', '#76B7B2', '#E15759', '#EDC948', '#FF9DA7', '#9C755F', '#BAB0AC'];
const classColor = c => PALETTE[(String(c || '?').toUpperCase().charCodeAt(0) || 0) % PALETTE.length];
const PAGE = 10;
const SVG_CHEV = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

let uid = null;
try { const s = await supabase.auth.getSession(); uid = s.data.session && s.data.session.user.id; } catch (_) {}
if (uid) init();

function init() {
  /* ---------- stil ---------- */
  const css = document.createElement('style');
  css.textContent = `
/* --- Ana Sayfa önizleme kartı --- */
.pc-side{ align-self:stretch; display:flex; }
.lb-mini{ flex:1; min-width:0; display:flex; flex-direction:column; gap:10px; padding:12px; text-align:left; border-radius:18px; color:#f2f2f2; font:inherit; cursor:pointer;
  background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.025)); border:1px solid rgba(255,255,255,.12); box-shadow:inset 0 1px 0 rgba(255,255,255,.08); transition:border-color .2s,transform .2s; }
.lb-mini:hover{ border-color:rgba(255,255,255,.26); }
.lb-mini:active{ transform:scale(.985); }
.lb-mini:focus-visible,.lb-tab:focus-visible,.lb-retry:focus-visible,.lb-pb:focus-visible,.lb-go:focus-visible,.lb-x:focus-visible{ outline:2px solid rgba(255,255,255,.7); outline-offset:2px; }
.lb-mh{ display:flex; align-items:center; justify-content:space-between; font-size:10px; font-weight:600; letter-spacing:.22em; color:#9ca3af; }
.lb-mh svg{ width:14px; height:14px; }
.lb-ml{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; }
.lb-ml li{ min-width:0; }
.lb-m1{ display:flex; align-items:center; gap:6px; min-width:0; font-size:12px; }
.lb-m1 .lb-nm{ flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.lb-m2{ display:flex; align-items:center; gap:8px; margin-top:5px; padding-left:24px; }
.lb-m2 .lb-track{ flex:1; height:5px; }
.lb-m2 b{ font-size:11px; font-weight:600; color:#e5e7eb; font-variant-numeric:tabular-nums; }
.lb-dot{ flex:none; display:grid; place-items:center; width:18px; height:18px; border-radius:50%; font-size:10px; font-weight:700; color:#111; background:#9ca3af; font-variant-numeric:tabular-nums; }
.lb-dot.r1{ background:#d4af37; } .lb-dot.r2{ background:#c0c4cc; } .lb-dot.r3{ background:#b0763c; }
.lb-mf{ margin-top:auto; padding-top:9px; border-top:1px solid rgba(255,255,255,.08); font-size:11px; color:#9ca3af; }
.lb-mf b{ color:#fff; font-weight:600; }
.lb-skl{ display:block; height:12px; border-radius:6px; background:rgba(255,255,255,.07); }

/* --- Ortak parçalar --- */
.lb-av{ flex:none; width:34px; height:34px; border-radius:50%; object-fit:cover; background:#2a2b31; }
.lb-ph{ display:grid; place-items:center; font-size:14px; font-weight:600; color:#d1d5db; }
.lb-track{ display:block; height:8px; border-radius:4px; background:rgba(255,255,255,.07); overflow:hidden; }
.lb-fill{ display:block; height:100%; width:var(--w,0%); border-radius:4px; background:var(--bg,linear-gradient(90deg,#6b7280,#f3f4f6)); transform-origin:left center; animation:lbGrow .8s cubic-bezier(.22,1,.36,1) both; animation-delay:var(--d,0ms); }
@keyframes lbGrow{ from{ transform:scaleX(0); } }
@keyframes lbRise{ from{ transform:scaleY(0); } }

/* --- Tam tablo (açılır panel) --- */
.lb-sheet .st-card{ width:min(100%,720px); height:min(92dvh,780px); display:flex; flex-direction:column; padding:0; overflow:hidden; }
@media (min-width:900px){ .lb-sheet .st-card{ padding:0; } }
.lb-hd{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:18px 20px 12px; }
.lb-hd b{ display:block; font-size:19px; font-weight:650; letter-spacing:.01em; }
.lb-sub{ display:block; margin-top:3px; font-size:12.5px; color:#9ca3af; }
.lb-x{ flex:none; width:34px; height:34px; border:0; border-radius:50%; background:rgba(255,255,255,.08); color:#fff; font-size:20px; line-height:1; cursor:pointer; }
.lb-tabs{ display:grid; grid-template-columns:repeat(3,1fr); gap:4px; padding:4px; margin:0 20px 10px; border-radius:14px; background:rgba(255,255,255,.06); }
.lb-tab{ height:36px; border:0; border-radius:10px; background:transparent; color:#9ca3af; font:inherit; font-size:13px; cursor:pointer; transition:background .2s,color .2s; }
.lb-tab[aria-selected="true"]{ background:rgba(255,255,255,.14); color:#fff; font-weight:600; }
.lb-note{ margin:0 22px 10px; font-size:12px; line-height:1.5; color:#8b919b; min-height:18px; }
.lb-note b{ color:#d1d5db; font-weight:600; }
.lb-body{ flex:1; min-height:0; overflow-y:auto; overscroll-behavior:contain; padding:0 20px 14px; }

.lb-podium{ display:grid; grid-template-columns:1fr 1.12fr 1fr; gap:10px; align-items:end; margin:6px 0 18px; }
.lb-pod{ display:flex; flex-direction:column; align-items:center; text-align:center; min-width:0; }
.lb-pod.p1{ --c:#d4af37; --cs:rgba(212,175,55,.34); } .lb-pod.p2{ --c:#c0c4cc; --cs:rgba(192,196,204,.26); } .lb-pod.p3{ --c:#b0763c; --cs:rgba(176,118,60,.3); }
.lb-pod.empty{ visibility:hidden; }
.lb-pod .lb-av{ width:48px; height:48px; box-shadow:0 0 0 2px var(--c),0 8px 18px -8px var(--c); }
.lb-pod.p1 .lb-av{ width:62px; height:62px; }
.lb-pod .lb-nm{ margin-top:9px; max-width:100%; font-size:13px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.lb-pod .lb-pts{ margin:2px 0 9px; font-size:12px; color:#cfd3da; font-variant-numeric:tabular-nums; }
.lb-pil{ width:100%; display:grid; place-items:center; border-radius:12px 12px 3px 3px; border:1px solid var(--cs); border-bottom:0; background:linear-gradient(180deg,var(--cs),rgba(255,255,255,.02)); transform-origin:bottom center; animation:lbRise .7s cubic-bezier(.22,1,.36,1) both; }
.lb-pod.p1 .lb-pil{ height:86px; } .lb-pod.p2 .lb-pil{ height:64px; animation-delay:.08s; } .lb-pod.p3 .lb-pil{ height:46px; animation-delay:.16s; }
.lb-pil b{ font-size:22px; font-weight:700; color:var(--c); font-variant-numeric:tabular-nums; }
.lb-pod.me .lb-nm{ text-decoration:underline; text-underline-offset:3px; }

.lb-list{ border:1px solid rgba(255,255,255,.08); border-radius:16px; overflow:hidden; background:rgba(255,255,255,.02); }
.lb-th,.lb-row{ display:grid; grid-template-columns:34px minmax(0,1.15fr) minmax(70px,1fr) 78px; grid-template-areas:"rk who bar pts"; align-items:center; column-gap:12px; padding:0 14px; }
.lb-th{ height:34px; font-size:10.5px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:#8b919b; border-bottom:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.03); }
.lb-th span:last-child{ text-align:right; }
.lb-row{ min-height:52px; border-bottom:1px solid rgba(255,255,255,.05); transition:background-color .15s,opacity .25s; }
.lb-row:last-child{ border-bottom:0; }
@media (hover:hover){ .lb-list:hover .lb-row:not(:hover){ opacity:.5; } .lb-row:hover{ background:rgba(255,255,255,.05); } }
.lb-row.me{ background:rgba(255,255,255,.1); box-shadow:inset 3px 0 0 #fff; }
.lb-rk{ grid-area:rk; font-size:13px; font-weight:600; color:#8b919b; font-variant-numeric:tabular-nums; }
.lb-row.t1 .lb-rk{ color:#d4af37; } .lb-row.t2 .lb-rk{ color:#c0c4cc; } .lb-row.t3 .lb-rk{ color:#c98a4b; }
.lb-who{ grid-area:who; min-width:0; display:flex; align-items:center; gap:9px; }
.lb-who .lb-nm{ min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:14px; font-weight:500; }
.lb-cl{ flex:none; padding:1px 7px; border-radius:999px; font-size:10px; color:#9ca3af; border:1px solid rgba(255,255,255,.16); }
.lb-barw{ grid-area:bar; min-width:0; }
.lb-row.t1 .lb-fill{ --bg:linear-gradient(90deg,#8a6d1a,#d4af37); } .lb-row.t2 .lb-fill{ --bg:linear-gradient(90deg,#7c8088,#c0c4cc); } .lb-row.t3 .lb-fill{ --bg:linear-gradient(90deg,#7a4f26,#b0763c); }
.lb-v{ grid-area:pts; text-align:right; font-size:14px; font-weight:600; font-variant-numeric:tabular-nums; }
.lb-v small{ font-weight:400; font-size:11px; color:#9ca3af; margin-left:3px; }
.lb-pager{ display:flex; align-items:center; justify-content:center; gap:14px; margin:14px 0 2px; font-size:12.5px; color:#9ca3af; font-variant-numeric:tabular-nums; }
.lb-pb{ display:grid; place-items:center; width:34px; height:34px; border-radius:10px; border:1px solid rgba(255,255,255,.16); background:rgba(255,255,255,.05); color:#fff; cursor:pointer; }
.lb-pb svg{ width:16px; height:16px; }
.lb-pb:disabled{ opacity:.35; cursor:default; }

.lb-ch{ display:grid; grid-template-columns:42px minmax(0,1fr) 84px; column-gap:12px; padding:0 14px 8px; font-size:10.5px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:#8b919b; }
.lb-ch span:last-child{ text-align:right; }
.lb-cls{ display:grid; grid-template-columns:42px minmax(0,1fr) 84px; align-items:center; column-gap:12px; padding:12px 14px; margin-bottom:8px; border-radius:16px; background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.08); }
.lb-cls.me{ border-color:rgba(255,255,255,.4); background:rgba(255,255,255,.09); }
.lb-cb{ background:rgba(255,255,255,.08); display:grid; place-items:center; width:42px; height:42px; border-radius:12px; font-size:18px; font-weight:700; color:#fff; background:color-mix(in srgb,var(--c) 30%,#1b1b1f); border:1px solid color-mix(in srgb,var(--c) 60%,transparent); box-shadow:inset 0 0 0 1px rgba(255,255,255,.04); }
.lb-cm{ min-width:0; }
.lb-ct{ font-size:13.5px; font-weight:600; }
.lb-ct small{ margin-left:6px; font-size:11px; font-weight:400; color:#9ca3af; }
.lb-cls .lb-track{ margin:7px 0 6px; }
.lb-cls .lb-fill{ --bg:var(--c); }
.lb-cs{ display:flex; gap:12px; font-size:12px; color:#9ca3af; font-variant-numeric:tabular-nums; }
.lb-ctot{ text-align:right; font-size:15px; font-weight:650; font-variant-numeric:tabular-nums; }
.lb-ctot small{ display:block; margin-top:2px; font-size:11px; font-weight:400; color:#9ca3af; }

.lb-me{ flex:none; display:flex; align-items:center; justify-content:space-between; gap:10px; margin:0; padding:12px 20px calc(12px + env(safe-area-inset-bottom)); font-size:13px; color:#cfd3da; background:rgba(14,14,16,.96); border-top:1px solid rgba(255,255,255,.1); }
.lb-me b{ color:#fff; font-weight:600; }
.lb-me[hidden]{ display:none; }
.lb-go{ flex:none; height:32px; padding:0 14px; border-radius:999px; border:1px solid rgba(255,255,255,.22); background:transparent; color:#fff; font:inherit; font-size:12.5px; cursor:pointer; }
.lb-empty{ padding:34px 8px; text-align:center; color:#9ca3af; font-size:14px; line-height:1.6; }
.lb-retry{ margin-top:10px; height:36px; padding:0 18px; border-radius:999px; border:1px solid rgba(255,255,255,.22); background:transparent; color:#fff; font:inherit; font-size:13px; cursor:pointer; }
.lb-sk{ height:52px; margin-bottom:6px; border-radius:14px; background:linear-gradient(90deg,rgba(255,255,255,.04),rgba(255,255,255,.09),rgba(255,255,255,.04)); background-size:200% 100%; animation:lbSh 1.3s linear infinite; }
@keyframes lbSh{ from{ background-position:200% 0 } to{ background-position:-200% 0 } }

@media (max-width:560px){
  .lb-hd{ padding:16px 16px 10px; } .lb-tabs{ margin:0 16px 10px; } .lb-note{ margin:0 18px 10px; } .lb-body{ padding:0 16px 12px; } .lb-me{ padding-left:16px; padding-right:16px; }
  .lb-th{ display:none; }
  .lb-row{ grid-template-columns:30px minmax(0,1fr) auto; grid-template-areas:"rk who pts" ". bar bar"; row-gap:7px; padding:10px 12px; }
  .lb-cls,.lb-ch{ grid-template-columns:40px minmax(0,1fr) 74px; }
  .lb-podium{ gap:6px; margin-bottom:14px; }
  .lb-pod .lb-av{ width:40px; height:40px; } .lb-pod.p1 .lb-av{ width:50px; height:50px; }
  .lb-pod.p1 .lb-pil{ height:62px; } .lb-pod.p2 .lb-pil{ height:46px; } .lb-pod.p3 .lb-pil{ height:34px; } .lb-pil b{ font-size:18px; }
}
@media (prefers-reduced-motion:reduce){ .lb-sk{ animation:none } .lb-fill,.lb-pil{ animation:none } .lb-tab,.lb-row,.lb-mini{ transition:none } }
`;
  document.head.appendChild(css);

  /* ---------- veri ---------- */
  const TTL = 30000, cache = {};
  let myClass = null;
  async function rpc(name, args) {
    const { data, error } = await supabase.rpc(name, args || {});
    if (error) throw error;
    return data || [];
  }
  const FN = { overall: ['leaderboard_overall', { p_limit: 50 }], weekly: ['leaderboard_weekly', { p_limit: 50 }], classes: ['leaderboard_classes', {}], me: ['leaderboard_me', {}] };
  async function load(key, force) {
    const c = cache[key];
    if (!force && c && Date.now() - c.t < TTL) return c.d;
    const d = await rpc(FN[key][0], FN[key][1]);
    cache[key] = { t: Date.now(), d };
    return d;
  }
  const myRow = async force => { const d = await load('me', force); return d[0] || {}; };
  (async () => { try { const { data } = await supabase.from('profiles').select('class').eq('id', uid).maybeSingle(); myClass = data && data.class; } catch (_) {} })();

  /* ---------- hafta (Pazartesi 00:00, Europe/Istanbul = UTC+3) ---------- */
  function untilReset() {
    const ist = new Date(Date.now() + 3 * 3600e3), dow = ist.getUTCDay();
    const add = (8 - dow) % 7 || 7;
    const reset = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + add) - 3 * 3600e3;
    const m = Math.max(0, Math.round((reset - Date.now()) / 60000)), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    return d > 0 ? `${d} gün ${h} saat` : h > 0 ? `${h} saat ${mm} dk` : `${mm} dk`;
  }
  function weekRange() {
    const ist = new Date(Date.now() + 3 * 3600e3), back = (ist.getUTCDay() + 6) % 7;
    const mon = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() - back), sun = mon + 6 * 86400e3;
    const f = t => new Date(t).toLocaleDateString('tr-TR', { timeZone: 'UTC', day: 'numeric', month: 'short' });
    return `${f(mon)} – ${f(sun)}`;
  }

  /* ---------- panel ---------- */
  const sheet = document.createElement('div');
  sheet.className = 'st lb-sheet'; sheet.setAttribute('aria-hidden', 'true');
  sheet.innerHTML = `<div class="st-card" role="dialog" aria-modal="true" aria-labelledby="lbT">
    <div class="lb-hd"><div><b id="lbT">Liderlik Tablosu</b><span class="lb-sub" id="lbSub"></span></div><button type="button" class="lb-x" id="lbX" aria-label="Kapat">&times;</button></div>
    <div class="lb-tabs" role="tablist" aria-label="Tablo türü">
      <button type="button" class="lb-tab" role="tab" data-t="overall" aria-selected="true">Genel</button>
      <button type="button" class="lb-tab" role="tab" data-t="weekly" aria-selected="false">Haftalık</button>
      <button type="button" class="lb-tab" role="tab" data-t="classes" aria-selected="false">Sınıflar</button>
    </div>
    <p class="lb-note" id="lbN"></p>
    <div class="lb-body" id="lbB" role="tabpanel" aria-live="polite"></div>
    <div class="lb-me" id="lbM" hidden></div>
  </div>`;
  document.body.appendChild(sheet);
  const B = () => $('#lbB', sheet);
  let tab = 'overall', tok = 0, lastFocus = null, rowsNow = [], page = 0, maxPts = 1;

  const close = () => { sheet.classList.remove('on'); sheet.setAttribute('aria-hidden', 'true'); if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (_) {} } };
  $('#lbX', sheet).addEventListener('click', close);
  sheet.addEventListener('click', e => { if (e.target === sheet) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheet.classList.contains('on')) close(); });
  sheet.querySelector('.lb-tabs').addEventListener('click', e => { const b = e.target.closest('.lb-tab'); if (b) show(b.dataset.t); });
  sheet.querySelector('.lb-tabs').addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const order = ['overall', 'weekly', 'classes'], i = order.indexOf(tab);
    const n = order[(i + (e.key === 'ArrowRight' ? 1 : 2)) % 3]; show(n); $('.lb-tab[data-t="' + n + '"]', sheet).focus();
  });

  const NOTES = {
    overall: () => 'Cüzdan bakiyesine göre sıralanır.',
    weekly: () => `Pazartesi 00:00'da sıfırlanır, kalan süre: <b>${A(untilReset())}</b>. Yalnızca kazanılan puanlar sayılır.`,
    classes: () => 'Sınıfın puanı, üyelerinin cüzdan toplamıdır. Ortalama kişi başına düşen puanı gösterir.'
  };
  const SUB = {
    overall: n => `Tüm zamanlar${n ? ' · ' + fmt(n) + ' üye' : ''}`,
    weekly: n => `${weekRange()}${n ? ' · ' + fmt(n) + ' üye' : ''}`,
    classes: n => `${n ? fmt(n) + ' sınıf' : 'Sınıf sıralaması'}`
  };

  const skeleton = () => '<div class="lb-sk"></div>'.repeat(6);
  const empty = (msg, retry) => `<div class="lb-empty">${msg}${retry ? '<br><button type="button" class="lb-retry">Tekrar dene</button>' : ''}</div>`;

  function podium(rows) {
    const slot = (r, pos) => r
      ? `<div class="lb-pod p${pos}${r.user_id === uid ? ' me' : ''}">${avatar(r)}${nameHtml(r)}<span class="lb-pts">${fmt(r.points)} pt</span><div class="lb-pil"><b>${fmt(r.rank)}</b></div></div>`
      : `<div class="lb-pod p${pos} empty"></div>`;
    return `<div class="lb-podium">${slot(rows[1], 2)}${slot(rows[0], 1)}${slot(rows[2], 3)}</div>`;
  }
  function rowHTML(r, i) {
    const w = Math.max(2, Math.round(Number(r.points) / maxPts * 100));
    return `<div class="lb-row${r.user_id === uid ? ' me' : ''}${r.rank <= 3 ? ' t' + r.rank : ''}"><span class="lb-rk">${fmt(r.rank)}</span><span class="lb-who">${avatar(r)}${nameHtml(r)}${r.class ? `<span class="lb-cl">${A(r.class)}</span>` : ''}</span><span class="lb-barw"><span class="lb-track"><i class="lb-fill" style="--w:${w}%;--d:${i * 35}ms"></i></span></span><span class="lb-v">${fmt(r.points)}<small>pt</small></span></div>`;
  }
  function drawList() {
    const pages = Math.ceil(rowsNow.length / PAGE), start = page * PAGE, slice = rowsNow.slice(start, start + PAGE);
    $('#lbList', sheet).innerHTML = `<div class="lb-th" aria-hidden="true"><span>Sıra</span><span>Üye</span><span></span><span>Puan</span></div>` + slice.map(rowHTML).join('');
    const pg = $('#lbPg', sheet);
    pg.innerHTML = pages > 1
      ? `<button type="button" class="lb-pb" data-d="-1" aria-label="Önceki sayfa"${page === 0 ? ' disabled' : ''}>${SVG_CHEV('m15 6-6 6 6 6')}</button><span>${fmt(start + 1)}–${fmt(start + slice.length)} / ${fmt(rowsNow.length)}</span><button type="button" class="lb-pb" data-d="1" aria-label="Sonraki sayfa"${page >= pages - 1 ? ' disabled' : ''}>${SVG_CHEV('m9 6 6 6-6 6')}</button>`
      : '';
  }
  function classes(rows) {
    const max = Math.max(1, ...rows.map(r => Number(r.total)));
    return '<div class="lb-ch" aria-hidden="true"><span>Sınıf</span><span>Dağılım</span><span>Toplam</span></div>' + rows.map((r, i) => {
      const c = classColor(r.class);
      return `<div class="lb-cls${r.class === myClass ? ' me' : ''}" style="--c:${c}"><span class="lb-cb">${A(r.class)}</span><div class="lb-cm"><div class="lb-ct">${fmt(r.rank)}. sıra${r.class === myClass ? '<small>Senin sınıfın</small>' : ''}</div><span class="lb-track"><i class="lb-fill" style="--w:${Math.max(2, Math.round(Number(r.total) / max * 100))}%;--d:${i * 60}ms"></i></span><div class="lb-cs"><span>${fmt(r.members)} üye</span><span>Ort. ${fmt(r.average)} pt</span></div></div><div class="lb-ctot">${fmt(r.total)}<small>pt</small></div></div>`;
    }).join('');
  }
  function meBar(t, me) {
    const el = $('#lbM', sheet);
    if (t === 'classes') { el.hidden = true; return; }
    const r = t === 'overall' ? me.overall_rank : me.weekly_rank, p = t === 'overall' ? me.overall_points : me.weekly_points;
    const inList = rowsNow.some(x => x.user_id === uid);
    el.hidden = false;
    el.innerHTML = r
      ? `<span>Senin sıran <b>#${fmt(r)}</b> · <b>${fmt(p)}</b> pt</span>${inList ? '<button type="button" class="lb-go">Sırama git</button>' : ''}`
      : `<span>${t === 'weekly' ? 'Bu hafta henüz puan kazanmadın.' : 'Henüz sıralamada değilsin.'}</span>`;
  }
  // liste sayfaları, "Sırama git", tekrar dene
  sheet.addEventListener('click', e => {
    const pb = e.target.closest('.lb-pb');
    if (pb && !pb.disabled) { page = Math.max(0, Math.min(Math.ceil(rowsNow.length / PAGE) - 1, page + Number(pb.dataset.d))); drawList(); return; }
    if (e.target.closest('.lb-go')) {
      const i = rowsNow.findIndex(x => x.user_id === uid); if (i < 0) return;
      page = Math.floor(i / PAGE); drawList();
      const me = $('.lb-row.me', sheet); if (me) me.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  });

  async function show(t, force) {
    tab = t; const my = ++tok; page = 0; rowsNow = [];
    sheet.querySelectorAll('.lb-tab').forEach(b => b.setAttribute('aria-selected', b.dataset.t === t ? 'true' : 'false'));
    $('#lbN', sheet).innerHTML = NOTES[t]();
    $('#lbSub', sheet).textContent = SUB[t](0);
    $('#lbM', sheet).hidden = true;
    B().innerHTML = skeleton(); B().scrollTop = 0;
    try {
      const [rows, me] = await Promise.all([load(t, force), t === 'classes' ? Promise.resolve({}) : myRow(force)]);
      if (my !== tok) return;
      $('#lbSub', sheet).textContent = SUB[t](rows.length);
      if (t === 'classes') B().innerHTML = rows.length ? classes(rows) : empty('Henüz sınıf bilgisi yok.');
      else if (!rows.length) B().innerHTML = empty(t === 'weekly' ? 'Bu hafta henüz puan kazanan yok.<br>İlk sen ol!' : 'Henüz kimse puan toplamadı.<br>İlk sen ol!');
      else {
        rowsNow = rows; maxPts = Math.max(1, ...rows.map(r => Number(r.points)));
        B().innerHTML = podium(rows.slice(0, 3)) + '<div class="lb-list" id="lbList"></div><div class="lb-pager" id="lbPg"></div>';
        drawList();
      }
      meBar(t, me);
    } catch (_) {
      if (my !== tok) return;
      B().innerHTML = empty('Liderlik tablosu şu an yüklenemedi.', true);
      const rb = $('.lb-retry', sheet); if (rb) rb.onclick = () => show(t, true);
    }
  }
  function open(t) {
    lastFocus = document.activeElement;
    sheet.classList.add('on'); sheet.setAttribute('aria-hidden', 'false');
    show(t || 'overall', true);
    $('#lbX', sheet).focus();
  }
  window.__lefLeaderboard = { open };

  /* ---------- Ana Sayfa önizleme kartı (#pcSide) ---------- */
  const mini = { top: null, me: null, err: false };
  function miniHTML() {
    const top = mini.top;
    const body = top === null
      ? (mini.err ? '<li style="color:#9ca3af;font-size:12px">Yüklenemedi</li>' : '<li><span class="lb-skl"></span></li>'.repeat(3))
      : top.length
        ? (() => {
            const max = Math.max(1, Number(top[0].points));
            return top.slice(0, 3).map((r, i) => `<li><div class="lb-m1"><span class="lb-dot r${i + 1}">${i + 1}</span>${nameHtml(r)}</div><div class="lb-m2"><span class="lb-track"><i class="lb-fill" style="--w:${Math.max(4, Math.round(Number(r.points) / max * 100))}%;--d:${i * 90}ms"></i></span><b>${fmt(r.points)}</b></div></li>`).join('');
          })()
        : '<li style="color:#9ca3af;font-size:12px">Henüz kimse yok</li>';
    const rk = mini.me && mini.me.overall_rank;
    const foot = mini.me ? (rk ? `Senin sıran <b>#${fmt(rk)}</b>` : 'Tümünü gör') : '&nbsp;';
    return `<span class="lb-mh">LİDERLİK${SVG_CHEV('m9 6 6 6-6 6')}</span><ol class="lb-ml">${body}</ol><span class="lb-mf">${foot}</span>`;
  }
  function paintMini() {
    const side = $('#pcSide'); if (!side) return;
    let b = side.querySelector('.lb-mini');
    if (!b) {
      b = document.createElement('button'); b.type = 'button'; b.className = 'lb-mini'; b.setAttribute('aria-label', 'Liderlik tablosunu aç');
      b.addEventListener('click', () => open('overall')); side.appendChild(b);
    }
    b.innerHTML = miniHTML();
  }
  async function refreshMini(force) {
    try {
      const [top, me] = await Promise.all([load('overall', force), myRow(force)]);
      mini.top = top; mini.me = me; mini.err = false;
    } catch (_) { if (mini.top === null) mini.err = true; }
    paintMini();
  }
  const home = $('#v-ana-sayfa');
  if (home) new MutationObserver(() => { const s = $('#pcSide'); if (s && !s.querySelector('.lb-mini')) paintMini(); }).observe(home, { childList: true, subtree: true });
  paintMini(); refreshMini();

  let dt = 0;
  window.addEventListener('lef-wallet', () => { clearTimeout(dt); dt = setTimeout(() => { delete cache.overall; delete cache.weekly; delete cache.me; refreshMini(true); }, 1500); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshMini(); });
  setInterval(() => { if (!document.hidden) refreshMini(); }, 120000);

  /* ---------- Keşfet > Sıralama kutusunu bu tabloya yönlendir ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('#v-kesfet [data-f="rank"]');
    if (!b) return;
    e.stopImmediatePropagation(); e.preventDefault();
    open('overall');
  }, true);
}
