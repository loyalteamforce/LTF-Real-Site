/* ============================================================
   LİDERLİK TABLOSU: Genel / Haftalık / Sınıflar
   - Veri sunucu fonksiyonlarından gelir (liderlik-kurulum.sql):
     leaderboard_overall, leaderboard_weekly, leaderboard_classes, leaderboard_me
   - Ana Sayfa'da kartın sağındaki #pcSide alanına küçük bir özet kartı koyar,
     Keşfet > "Sıralama" kutusunu da bu tabloya yönlendirir.
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

let uid = null;
try { const s = await supabase.auth.getSession(); uid = s.data.session && s.data.session.user.id; } catch (_) {}
if (uid) init();

function init() {
  /* ---------- stil ---------- */
  const css = document.createElement('style');
  css.textContent = `
.pc-side{ align-self:stretch; display:flex; }
.lb-mini{ flex:1; min-width:0; display:flex; flex-direction:column; gap:8px; padding:12px; text-align:left; border-radius:18px; color:#f2f2f2; font:inherit; cursor:pointer;
  background:linear-gradient(135deg,rgba(255,255,255,.07),rgba(255,255,255,.025)); border:1px solid rgba(255,255,255,.12); box-shadow:inset 0 1px 0 rgba(255,255,255,.08); }
.lb-mini:focus-visible,.lb-tab:focus-visible,.lb-retry:focus-visible{ outline:2px solid rgba(255,255,255,.7); outline-offset:2px; }
.lb-mh{ display:flex; align-items:center; justify-content:space-between; font-size:10px; letter-spacing:.24em; color:#9ca3af; }
.lb-mh svg{ width:14px; height:14px; }
.lb-ml{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:7px; }
.lb-ml li{ display:flex; align-items:center; gap:8px; min-width:0; font-size:12px; }
.lb-ml .lb-nm{ flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.lb-ml b{ font-weight:600; font-variant-numeric:tabular-nums; color:#e5e7eb; }
.lb-dot{ flex:none; display:grid; place-items:center; width:18px; height:18px; border-radius:50%; font-size:10px; font-weight:700; color:#111; background:#9ca3af; font-variant-numeric:tabular-nums; }
.lb-dot.r1{ background:#d4af37; } .lb-dot.r2{ background:#c0c4cc; } .lb-dot.r3{ background:#b0763c; }
.lb-mf{ margin-top:auto; padding-top:8px; border-top:1px solid rgba(255,255,255,.08); font-size:11px; color:#9ca3af; }
.lb-mf b{ color:#fff; font-weight:600; }
.lb-skl{ height:12px; border-radius:6px; background:rgba(255,255,255,.07); }

.lb-sheet .st-card{ width:min(100%,480px); max-height:88dvh; overflow-y:auto; overscroll-behavior:contain; }
.lb-tabs{ display:grid; grid-template-columns:repeat(3,1fr); gap:4px; padding:4px; margin:4px 0 12px; border-radius:14px; background:rgba(255,255,255,.06); }
.lb-tab{ height:36px; border:0; border-radius:10px; background:transparent; color:#9ca3af; font:inherit; font-size:13px; cursor:pointer; transition:background .2s,color .2s; }
.lb-tab[aria-selected="true"]{ background:rgba(255,255,255,.14); color:#fff; font-weight:600; }
.lb-note{ margin:0 2px 14px; font-size:12px; line-height:1.5; color:#9ca3af; min-height:18px; }

.lb-podium{ display:grid; grid-template-columns:1fr 1.12fr 1fr; gap:8px; align-items:end; margin:6px 0 14px; }
.lb-pod{ display:flex; flex-direction:column; align-items:center; text-align:center; min-width:0; padding:12px 6px 10px; border-radius:16px; background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.02)); border:1px solid rgba(255,255,255,.1); }
.lb-pod.p1{ padding-top:16px; padding-bottom:14px; border-color:rgba(212,175,55,.45); background:linear-gradient(180deg,rgba(212,175,55,.14),rgba(255,255,255,.02)); }
.lb-pod.empty{ visibility:hidden; }
.lb-pod .lb-av{ width:46px; height:46px; box-shadow:0 0 0 2px var(--c,#9ca3af); }
.lb-pod.p1 .lb-av{ width:58px; height:58px; }
.lb-pod.p1{ --c:#d4af37; } .lb-pod.p2{ --c:#c0c4cc; } .lb-pod.p3{ --c:#b0763c; }
.lb-pos{ margin-top:-8px; z-index:1; min-width:20px; height:20px; padding:0 6px; border-radius:10px; font-size:11px; font-weight:700; line-height:20px; color:#111; background:var(--c); font-variant-numeric:tabular-nums; }
.lb-pod .lb-nm{ margin-top:6px; max-width:100%; font-size:13px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.lb-pod .lb-pts{ margin-top:2px; font-size:12px; color:#cfd3da; font-variant-numeric:tabular-nums; }
.lb-pod.me{ box-shadow:0 0 0 1px rgba(255,255,255,.5); }

.lb-av{ flex:none; width:36px; height:36px; border-radius:50%; object-fit:cover; background:#2a2b31; }
.lb-ph{ display:grid; place-items:center; font-size:15px; font-weight:600; color:#d1d5db; }
.lb-list{ display:flex; flex-direction:column; gap:4px; }
.lb-row{ display:flex; align-items:center; gap:12px; padding:9px 12px; border-radius:14px; background:rgba(255,255,255,.03); }
.lb-row.me{ background:rgba(255,255,255,.1); box-shadow:inset 0 0 0 1px rgba(255,255,255,.22); }
.lb-rk{ flex:none; width:26px; text-align:center; font-size:13px; color:#9ca3af; font-variant-numeric:tabular-nums; }
.lb-who{ flex:1; min-width:0; display:flex; align-items:center; gap:8px; }
.lb-who .lb-nm{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:14px; }
.lb-cl{ flex:none; padding:1px 7px; border-radius:999px; font-size:10px; color:#9ca3af; border:1px solid rgba(255,255,255,.16); }
.lb-v{ flex:none; font-size:14px; font-weight:600; font-variant-numeric:tabular-nums; }
.lb-v small{ font-weight:400; font-size:11px; color:#9ca3af; margin-left:2px; }

.lb-cls{ display:flex; align-items:center; gap:12px; padding:12px; border-radius:16px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); margin-bottom:8px; }
.lb-cls.me{ border-color:rgba(255,255,255,.35); background:rgba(255,255,255,.08); }
.lb-cb{ flex:none; display:grid; place-items:center; width:42px; height:42px; border-radius:12px; font-size:18px; font-weight:700; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.14); }
.lb-cm{ flex:1; min-width:0; }
.lb-ct{ display:flex; justify-content:space-between; align-items:baseline; gap:8px; font-size:14px; }
.lb-ct b{ font-variant-numeric:tabular-nums; }
.lb-bar{ height:6px; margin:7px 0 6px; border-radius:3px; background:rgba(255,255,255,.08); overflow:hidden; }
.lb-bar i{ display:block; height:100%; border-radius:3px; background:linear-gradient(90deg,#8f949c,#f2f2f2); transition:width .6s cubic-bezier(.2,.8,.2,1); }
.lb-cs{ font-size:12px; color:#9ca3af; }

.lb-me{ position:sticky; bottom:0; margin-top:12px; padding:11px 14px; border-radius:14px; font-size:13px; color:#cfd3da; background:rgba(22,22,25,.96); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,.14); }
.lb-me b{ color:#fff; font-weight:600; }
.lb-me[hidden]{ display:none; }
.lb-empty{ padding:28px 8px; text-align:center; color:#9ca3af; font-size:14px; line-height:1.6; }
.lb-retry{ margin-top:10px; height:36px; padding:0 18px; border-radius:999px; border:1px solid rgba(255,255,255,.22); background:transparent; color:#fff; font:inherit; font-size:13px; cursor:pointer; }
.lb-sk{ height:54px; margin-bottom:6px; border-radius:14px; background:linear-gradient(90deg,rgba(255,255,255,.04),rgba(255,255,255,.09),rgba(255,255,255,.04)); background-size:200% 100%; animation:lbSh 1.3s linear infinite; }
@keyframes lbSh{ from{ background-position:200% 0 } to{ background-position:-200% 0 } }
@media (prefers-reduced-motion:reduce){ .lb-sk{ animation:none } .lb-bar i,.lb-tab{ transition:none } }
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

  /* ---------- haftalık sıfırlanma (Pazartesi 00:00, Europe/Istanbul = UTC+3) ---------- */
  function untilReset() {
    const ist = new Date(Date.now() + 3 * 3600e3), dow = ist.getUTCDay();
    const add = (8 - dow) % 7 || 7;
    const reset = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + add) - 3 * 3600e3;
    const m = Math.max(0, Math.round((reset - Date.now()) / 60000)), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    return d > 0 ? `${d} gün ${h} saat` : h > 0 ? `${h} saat ${mm} dk` : `${mm} dk`;
  }

  /* ---------- panel ---------- */
  const sheet = document.createElement('div');
  sheet.className = 'st lb-sheet'; sheet.setAttribute('aria-hidden', 'true');
  sheet.innerHTML = `<div class="st-card" role="dialog" aria-modal="true" aria-labelledby="lbT">
    <div class="st-top"><b id="lbT">Liderlik Tablosu</b><button type="button" id="lbX" aria-label="Kapat">&times;</button></div>
    <div class="lb-tabs" role="tablist" aria-label="Tablo türü">
      <button type="button" class="lb-tab" role="tab" data-t="overall" aria-selected="true">Genel</button>
      <button type="button" class="lb-tab" role="tab" data-t="weekly" aria-selected="false">Haftalık</button>
      <button type="button" class="lb-tab" role="tab" data-t="classes" aria-selected="false">Sınıflar</button>
    </div>
    <p class="lb-note" id="lbN"></p>
    <div id="lbB" role="tabpanel" aria-live="polite"></div>
    <div class="lb-me" id="lbM" hidden></div>
  </div>`;
  document.body.appendChild(sheet);
  const B = () => $('#lbB', sheet);
  let tab = 'overall', tok = 0, lastFocus = null;

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
    weekly: () => `Pazartesi 00:00'da sıfırlanır, kalan süre: <b>${A(untilReset())}</b>. Yalnızca kazanılan puanlar sayılır, gönderilen puanlar sayılmaz.`,
    classes: () => 'Sınıfın puanı, üyelerinin cüzdan toplamıdır. Ortalama kişi başına düşen puanı gösterir.'
  };

  const skeleton = () => '<div class="lb-sk"></div>'.repeat(6);
  const empty = (msg, retry) => `<div class="lb-empty">${msg}${retry ? '<br><button type="button" class="lb-retry">Tekrar dene</button>' : ''}</div>`;

  function podium(rows) {
    const slot = (r, pos) => r
      ? `<div class="lb-pod p${pos}${r.user_id === uid ? ' me' : ''}">${avatar(r)}<span class="lb-pos">${fmt(r.rank)}</span>${nameHtml(r)}<span class="lb-pts">${fmt(r.points)} pt</span></div>`
      : `<div class="lb-pod p${pos} empty"></div>`;
    return `<div class="lb-podium">${slot(rows[1], 2)}${slot(rows[0], 1)}${slot(rows[2], 3)}</div>`;
  }
  function list(rows) {
    return `<div class="lb-list">${rows.map(r => `<div class="lb-row${r.user_id === uid ? ' me' : ''}"><span class="lb-rk">${fmt(r.rank)}</span>${avatar(r)}<span class="lb-who">${nameHtml(r)}${r.class ? `<span class="lb-cl">${A(r.class)}</span>` : ''}</span><span class="lb-v">${fmt(r.points)}<small>pt</small></span></div>`).join('')}</div>`;
  }
  function classes(rows) {
    const max = Math.max(1, ...rows.map(r => Number(r.total)));
    return rows.map(r => `<div class="lb-cls${r.class === myClass ? ' me' : ''}"><span class="lb-cb">${A(r.class)}</span><div class="lb-cm"><div class="lb-ct"><span>${fmt(r.rank)}. sıra</span><b>${fmt(r.total)} pt</b></div><div class="lb-bar"><i style="width:${Math.round(Number(r.total) / max * 100)}%"></i></div><div class="lb-cs">${fmt(r.members)} üye · kişi başı ort. ${fmt(r.average)} pt</div></div></div>`).join('');
  }
  function meBar(t, me) {
    const el = $('#lbM', sheet);
    if (t === 'classes') { el.hidden = true; return; }
    const r = t === 'overall' ? me.overall_rank : me.weekly_rank, p = t === 'overall' ? me.overall_points : me.weekly_points;
    el.hidden = false;
    el.innerHTML = r ? `Senin sıran <b>#${fmt(r)}</b> · <b>${fmt(p)}</b> pt` : (t === 'weekly' ? 'Bu hafta henüz puan kazanmadın.' : 'Henüz sıralamada değilsin.');
  }

  async function show(t, force) {
    tab = t; const my = ++tok;
    sheet.querySelectorAll('.lb-tab').forEach(b => b.setAttribute('aria-selected', b.dataset.t === t ? 'true' : 'false'));
    $('#lbN', sheet).innerHTML = NOTES[t]();
    $('#lbM', sheet).hidden = true;
    B().innerHTML = skeleton();
    try {
      const [rows, me] = await Promise.all([load(t, force), t === 'classes' ? Promise.resolve({}) : myRow(force)]);
      if (my !== tok) return;
      if (t === 'classes') B().innerHTML = rows.length ? classes(rows) : empty('Henüz sınıf bilgisi yok.');
      else if (!rows.length) B().innerHTML = empty(t === 'weekly' ? 'Bu hafta henüz puan kazanan yok.<br>İlk sen ol!' : 'Henüz kimse puan toplamadı.<br>İlk sen ol!');
      else B().innerHTML = podium(rows.slice(0, 3)) + (rows.length > 3 ? list(rows.slice(3)) : '');
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

  /* ---------- Ana Sayfa özet kartı (#pcSide) ---------- */
  const mini = { top: null, me: null, err: false };
  function miniHTML() {
    const top = mini.top;
    const body = top === null
      ? (mini.err ? '<li style="color:#9ca3af">Yüklenemedi</li>' : '<li><span class="lb-skl" style="width:100%"></span></li>'.repeat(3))
      : top.length
        ? top.slice(0, 3).map((r, i) => `<li><span class="lb-dot r${i + 1}">${i + 1}</span><span class="lb-nm"${/^#[0-9a-f]{3,8}$/i.test(r.name_color || '') && r.name_color.toLowerCase() !== '#ffffff' ? ` style="color:${r.name_color}"` : ''}>${A(nameOf(r))}</span><b>${fmt(r.points)}</b></li>`).join('')
        : '<li style="color:#9ca3af">Henüz kimse yok</li>';
    const rk = mini.me && mini.me.overall_rank;
    const foot = mini.me ? (rk ? `Senin sıran <b>#${fmt(rk)}</b>` : 'Sıralamaya gir') : '&nbsp;';
    return `<span class="lb-mh">LİDERLİK<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></span><ol class="lb-ml">${body}</ol><span class="lb-mf">${foot}</span>`;
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
