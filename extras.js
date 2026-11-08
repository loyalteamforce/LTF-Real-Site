/* ============================================================
   EKSTRALAR: Ana Sayfa, Keşfet (eğlence merkezi), Kütüphane
   - Puan, seri, görevler, sıralama, günlük çark, sınav, 3 mini oyun.
   - Puanlar önce cihazda saklanır; eglence-kurulum.sql çalıştırılırsa
     Supabase'e de yazılır ve Sıralama herkes için çalışır.
   - app.html'de chat.js'ten sonra: <script type="module" src="extras.js"></script>
   ============================================================ */
import { supabase, escapeHtml as E } from './config.js';

const $ = (s, r = document) => r.querySelector(s);
const day = (o = 0) => new Date(Date.now() - o * 864e5).toISOString().slice(0, 10);
const rnd = n => Math.floor(Math.random() * n);
const shuf = a => a.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);

let uid = null;
try { const s = await supabase.auth.getSession(); uid = s.data.session && s.data.session.user.id; } catch (_) {}
if (!uid) throw new Error('oturum yok');

const KEY = 'lefx1:' + uid, DAILY_CAP = 40;
let S = {}; try { S = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) {}
S = Object.assign({ pts: 0, streak: 0, last: '', spun: '', best: 0, d: {}, cap: {}, lib: [] }, S);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {} };
let synced = null, tm = 0;
const W = { on: false };   // sunucu cüzdanı (puan-kurulum.sql) çalışıyorsa true
const sync = () => { if (W.on) return; clearTimeout(tm); tm = setTimeout(async () => {
  try { const { error } = await supabase.from('lef_points').upsert({ user_id: uid, points: S.pts, streak: S.streak, updated_at: new Date().toISOString() }); synced = !error; } catch (_) { synced = false; }
}, 1500); };

/* ---------- sunucu cüzdanı ---------- */
function setPts(n) { S.pts = n; save(); paint(); window.dispatchEvent(new CustomEvent('lef-wallet', { detail: { balance: n } })); }
const walletReady = (async () => {
  try { const { data, error } = await supabase.rpc('wallet_get'); if (!error) { W.on = true; setPts(Number(data)); } } catch (_) {}
})();
async function earn(n, why) {
  await walletReady;
  try {
    const { data, error } = await supabase.rpc('wallet_earn', { p_amount: n, p_reason: why });
    if (!error) { W.on = true; setPts(Number(data)); return; }
    if (/limit/.test(error.message || '')) { toast('Bugünkü puan kazanma sınırına ulaştın'); return; }
  } catch (_) {}
  S.pts += n; save(); sync(); paint();   // sunucu cüzdanı kurulmamışsa eski cihaz yöntemi
}

/* ---------- puan / görev ---------- */
const TASKS = { checkin: 'Günlük giriş', spin: 'Çarkı çevir', quiz: 'Sınava gir', game: 'Bir oyun oyna', lib: 'Kütüphaneye bir şey ekle' };
function toast(t) {
  let el = $('#xToast'); if (!el) { el = document.createElement('div'); el.id = 'xToast'; document.body.appendChild(el); }
  el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 2200);
}
function give(n, why, game) {
  if (game) {
    if (S.cap.t !== day()) S.cap = { t: day(), n: 0 };
    n = Math.min(n, DAILY_CAP - S.cap.n);
    if (n <= 0) { toast('Bugünkü oyun puanı sınırına ulaştın'); return; }
    S.cap.n += n;
  }
  toast('+' + n + ' puan · ' + why); earn(n, why);
  window.dispatchEvent(new CustomEvent('lef-x', { detail: { n, why, game: !!game } }));
}
function mark(k) {
  if (S.d.t !== day()) S.d = { t: day(), k: {} };
  if (S.d.k[k]) return; S.d.k[k] = 1;
  give(5, TASKS[k]);
  if (Object.keys(S.d.k).length === Object.keys(TASKS).length) give(20, 'Tüm görevler tamam!');
  save();
}
if (S.last !== day()) {
  S.streak = S.last === day(1) ? S.streak + 1 : 1; S.last = day();
  give(10 + Math.min(S.streak, 7) * 2, 'Günlük giriş'); mark('checkin');
}

/* ---------- stil ---------- */
const css = document.createElement('style');
css.textContent = `
.x-bar{display:flex;gap:10px;flex-wrap:wrap;margin:10px 0}.x-chip{padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);font-size:13px}
.x-card{margin-top:12px;padding:14px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}
.x-card h3{font-size:14px;color:#9ca3af;font-weight:600;margin-bottom:8px}.x-card p{line-height:1.6;color:#e5e7eb;font-size:15px}
.x-hero small{color:#9ca3af;font-size:13px}.x-hero h2{font-size:26px;margin-top:2px}
.x-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
.x-tile-hub{display:flex;flex-direction:column;gap:6px;padding:16px 14px;text-align:left;border-radius:16px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#fff;font:inherit;cursor:pointer}
.x-tile-hub b{font-size:26px;font-weight:400}.x-tile-hub span{font-weight:600;font-size:15px}.x-tile-hub small{color:#9ca3af;font-size:12px}
.x-btn{height:38px;padding:0 18px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:transparent;color:#fff;font:inherit;font-size:14px;cursor:pointer}
.x-btn.pri{background:#fff;color:#111;border-color:#fff;font-weight:600}.x-btn:disabled{opacity:.45}
.x-task{display:flex;align-items:center;gap:10px;padding:7px 0;font-size:14px}.x-task i{width:20px;height:20px;border-radius:50%;border:2px solid rgba(255,255,255,.3);display:grid;place-items:center;font-style:normal;font-size:12px}
.x-task.ok{color:#9ca3af;text-decoration:line-through}.x-task.ok i{background:#fff;color:#111;border-color:#fff}
.x-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:14px}.x-row img,.x-row u{width:32px;height:32px;border-radius:50%;object-fit:cover;background:#26262b;flex:none}
.x-row em{width:22px;font-style:normal;color:#9ca3af;text-align:center}.x-row b{flex:1;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.x-row.me{color:#ffd86b}
.x-opt{display:block;width:100%;margin-top:8px;padding:12px;text-align:left;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#fff;font:inherit;cursor:pointer}
.x-opt.good{background:rgba(60,200,120,.3);border-color:#3cc878}.x-opt.bad{background:rgba(255,80,80,.28);border-color:#ff5050}
.x-g4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}.x-t{aspect-ratio:1;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;font-size:26px;cursor:pointer}.x-t.on{background:rgba(255,255,255,.16)}.x-t.ok{background:rgba(60,200,120,.3)}
.x-g3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px auto;max-width:300px}.x-t3{aspect-ratio:1;border-radius:14px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:#fff;font-size:34px;font-weight:700;cursor:pointer}
.x-rx{display:grid;place-items:center;height:200px;margin-top:12px;border-radius:18px;background:#3a1620;font-size:18px;font-weight:600;cursor:pointer;user-select:none}.x-rx.go{background:#1f8f55}.x-rx.wait{background:#7a5a10}
.x-wheel{display:grid;place-items:center;height:130px;font-size:56px;margin:6px 0}
.x-in{width:100%;height:42px;padding:0 14px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;font:inherit;font-size:16px;outline:0}
.x-back{margin-bottom:6px}
#xToast{position:fixed;left:50%;top:calc(14px + env(safe-area-inset-top));z-index:90;transform:translate(-50%,-90px);padding:10px 18px;border-radius:999px;background:rgba(20,20,20,.95);border:1px solid rgba(255,255,255,.2);font-size:14px;transition:transform .35s cubic-bezier(.3,1.4,.5,1);pointer-events:none}#xToast.on{transform:translate(-50%,0)}
`;
document.head.appendChild(css);

/* ---------- ortak parçalar ---------- */
const bar = () => `<div class="x-bar"><span class="x-chip">⭐ <b class="xp">${S.pts}</b> puan</span><span class="x-chip">🔥 ${S.streak} günlük seri</span></div>`;
const tasksHTML = () => { const k = S.d.t === day() ? S.d.k : {};
  return Object.keys(TASKS).map(t => `<div class="x-task ${k[t] ? 'ok' : ''}"><i>${k[t] ? '✓' : ''}</i>${TASKS[t]} <small style="margin-left:auto;color:#9ca3af">+5</small></div>`).join(''); };
const QUOTES = ['Gerçek güç, sessizce çalışanın elindedir.', 'Bugün dünden bir adım ileride ol, yeter.', 'Sınıfın puanı, her üyenin küçük çabasından doğar.', 'Kazanmak için önce vazgeçmemeyi öğren.', 'Bir plan yoksa, kaybetmeyi planlıyorsundur.', 'Sadakat, birlikte yürümektir.', 'Zayıf görünen rakibi hafife alma, güçlü görüneni abartma.'];

/* ---------- ANA SAYFA ---------- */
let NAME = '';
function home() {
  const el = $('#v-ana-sayfa'); if (!el) return;
  const h = new Date().getHours(), g = h < 6 ? 'İyi geceler' : h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar';
  el.innerHTML = `<div class="x-hero"><small>${g}</small><h2>${E(NAME) || 'Loyal Elite Force'}</h2></div>${bar()}
  <div class="x-card"><h3>Günün sözü</h3><p>${QUOTES[(new Date().getDate() + new Date().getMonth()) % QUOTES.length]}</p></div>
  <div class="x-card" id="xtasks"><h3>Günlük görevler</h3>${tasksHTML()}</div>
  <div class="x-card"><h3>Hızlı erişim</h3><div class="x-bar"><button class="x-btn pri" data-go="kesfet">🎮 Eğlence merkezi</button><button class="x-btn" data-go="manga">📖 Manga</button><button class="x-btn" data-go="kutuphane">🔖 Kütüphane</button></div></div>`;
}
document.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) location.hash = b.dataset.go; });
window.addEventListener('lef-profile', () => { if (window.__lefProfile && window.__lefProfile.mine) { const n = $('#pfNick'); if (n && n.textContent) { NAME = n.textContent; home(); } } });

/* ---------- KEŞFET: merkez ---------- */
const HUB = [
  ['rank', '🏆', 'Sıralama', 'En çok puanlılar'], ['wheel', '🎡', 'Günlük çark', 'Günde bir kez çevir'],
  ['quiz', '🧠', 'Sınav', '5 soru, doğru başına +4'], ['mem', '🃏', 'Hafıza', 'Eşleri bul'],
  ['xo', '❌', 'XO', 'Yapay zekaya karşı'], ['rx', '⚡', 'Refleks', 'Ne kadar hızlısın?']
];
const ex = $('#v-kesfet');
function hub() {
  ex.innerHTML = `<h2>Keşfet</h2>${bar()}<div class="x-grid">${HUB.map(h => `<button class="x-tile-hub" data-f="${h[0]}"><b>${h[1]}</b><span>${h[2]}</span><small>${h[3]}</small></button>`).join('')}</div>`;
}
const FEAT = { rank, wheel, quiz, mem, xo, rx };
ex && ex.addEventListener('click', e => {
  const b = e.target.closest('[data-f]'); if (b) { openF(b.dataset.f); return; }
  if (e.target.closest('.x-back')) hub();
});
function openF(k) {
  const t = HUB.find(h => h[0] === k);
  ex.innerHTML = `<button class="x-btn x-back">&larr; Geri</button><h2>${t[1]} ${t[2]}</h2>${bar()}<div id="xp"></div>`;
  FEAT[k]($('#xp'));
}
function paint() { document.querySelectorAll('.xp').forEach(n => n.textContent = S.pts); const t = $('#xtasks'); if (t) t.innerHTML = '<h3>Günlük görevler</h3>' + tasksHTML(); }

/* ---------- Sıralama ---------- */
async function rank(p) {
  p.innerHTML = '<div class="x-card"><p>Yükleniyor...</p></div>';
  try {
    let { data, error } = await supabase.from('wallets').select('user_id,balance').order('balance', { ascending: false }).limit(20);
    if (!error) data = data.map(r => ({ user_id: r.user_id, points: r.balance }));
    else ({ data, error } = await supabase.from('lef_points').select('user_id,points,streak').order('points', { ascending: false }).limit(20));
    if (error) throw error;
    const ids = data.map(r => r.user_id);
    const { data: pr } = await supabase.from('profiles').select('id,display_name,username,avatar_url').in('id', ids);
    const m = {}; (pr || []).forEach(x => m[x.id] = x);
    const base = supabase.supabaseUrl + '/storage/v1/object/public/';
    p.innerHTML = '<div class="x-card">' + (data.length ? data.map((r, i) => { const u = m[r.user_id] || {}, a = u.avatar_url && u.avatar_url.indexOf(base) === 0 ? u.avatar_url : '';
      return `<div class="x-row ${r.user_id === uid ? 'me' : ''}"><em>${['🥇', '🥈', '🥉'][i] || i + 1}</em>${a ? `<img src="${E(a)}" alt="">` : '<u></u>'}<b>${E(u.display_name || u.username || 'Üye')}</b><span>${r.points} ⭐</span></div>`; }).join('') : '<p>Henüz kimse puan toplamadı. İlk sen ol!</p>') + '</div>';
  } catch (_) {
    p.innerHTML = '<div class="x-card"><p>Sıralama için sunucu tablosu henüz kurulmamış (<b>eglence-kurulum.sql</b>). O zamana kadar puanın bu cihazda: <b>' + S.pts + '</b> ⭐</p></div>';
  }
}

/* ---------- Günlük çark ---------- */
function wheel(p) {
  const done = S.spun === day();
  p.innerHTML = `<div class="x-card" style="text-align:center"><div class="x-wheel" id="xw">🎡</div><p id="xwt">${done ? 'Bugünkü hakkını kullandın, yarın gel.' : 'Çevir ve puan kazan!'}</p><br><button class="x-btn pri" id="xs" ${done ? 'disabled' : ''}>Çevir</button></div>`;
  $('#xs').onclick = () => {
    if (S.spun === day()) return; S.spun = day(); save(); $('#xs').disabled = true;
    const prizes = [5, 5, 10, 10, 15, 20, 25, 50], pr = prizes[rnd(prizes.length)], ic = ['🎡', '💫', '🌟', '✨'];
    let i = 0; const iv = setInterval(() => { $('#xw').textContent = ic[i++ % 4]; }, 120);
    setTimeout(() => { clearInterval(iv); $('#xw').textContent = pr >= 25 ? '🎉' : '⭐'; $('#xwt').textContent = pr + ' puan kazandın!'; give(pr, 'Çark'); mark('spin'); }, 1400);
  };
}

/* ---------- Sınav ---------- */
const POOL = [
  ['Türkiye\'nin başkenti neresidir?', 'Ankara', ['İstanbul', 'İzmir', 'Bursa']], ['Japonya\'nın başkenti?', 'Tokyo', ['Kyoto', 'Osaka', 'Nagoya']],
  ['Japon mangası genellikle hangi yönde okunur?', 'Sağdan sola', ['Soldan sağa', 'Yukarıdan aşağı', 'Fark etmez']], ['"Shonen" türü kimlere yöneliktir?', 'Genç erkeklere', ['Çocuk kızlara', 'Yaşlılara', 'Bebeklere']],
  ['Hangisi bir gezegen değildir?', 'Ay', ['Mars', 'Venüs', 'Jüpiter']], ['Japoncada "senpai" ne demektir?', 'Kıdemli / üst sınıftaki', ['Öğretmen', 'Arkadaşın kardeşi', 'Komşu']],
  ['7 × 8 kaçtır?', '56', ['54', '48', '64']], ['En büyük okyanus hangisidir?', 'Pasifik', ['Atlas', 'Hint', 'Arktik']],
  ['Su deniz seviyesinde kaç derecede kaynar?', '100', ['90', '80', '120']], ['Bir satranç tahtasında kaç kare vardır?', '64', ['36', '49', '81']]
];
function quiz(p) {
  const qs = shuf(POOL).slice(0, 5); let i = 0, ok = 0;
  const show = () => {
    if (i >= qs.length) { p.innerHTML = `<div class="x-card" style="text-align:center"><p>${ok}/5 doğru</p><br><button class="x-btn pri" id="xr">Tekrar</button></div>`; give(ok * 4, 'Sınav', true); mark('quiz'); $('#xr').onclick = () => quiz(p); return; }
    const q = qs[i], o = shuf([[q[1], 1], ...q[2].map(x => [x, 0])]);
    p.innerHTML = `<div class="x-card"><h3>Soru ${i + 1}/5</h3><p>${E(q[0])}</p>${o.map((x, j) => `<button class="x-opt" data-j="${j}">${E(x[0])}</button>`).join('')}</div>`;
    p.onclick = e => { const b = e.target.closest('.x-opt'); if (!b || p.dataset.l) return; p.dataset.l = 1;
      const good = o[b.dataset.j][1]; if (good) ok++; b.classList.add(good ? 'good' : 'bad');
      if (!good) p.querySelectorAll('.x-opt').forEach((n, j) => { if (o[j][1]) n.classList.add('good'); });
      setTimeout(() => { delete p.dataset.l; i++; show(); }, 900); };
  };
  show();
}

/* ---------- Hafıza ---------- */
function mem(p) {
  const em = ['🍙', '⚔️', '🌸', '🔥', '⭐', '🐉', '🎴', '🌙'], c = shuf([...em, ...em]);
  let open = [], found = 0, mv = 0, lock = false;
  p.innerHTML = `<div class="x-bar"><span class="x-chip">Hamle: <b id="xm">0</b></span></div><div class="x-g4">${c.map((_, i) => `<button class="x-t" data-i="${i}">?</button>`).join('')}</div>`;
  p.onclick = e => { const b = e.target.closest('.x-t'); if (!b || lock || b.classList.contains('on') || b.classList.contains('ok')) return;
    b.textContent = c[b.dataset.i]; b.classList.add('on'); open.push(b);
    if (open.length < 2) return; mv++; $('#xm').textContent = mv; lock = true;
    const [a, d] = open; open = [];
    setTimeout(() => { lock = false;
      if (c[a.dataset.i] === c[d.dataset.i]) { a.className = d.className = 'x-t ok'; if (++found === 8) { give(mv <= 14 ? 10 : 6, 'Hafıza oyunu', true); mark('game'); } }
      else { a.textContent = d.textContent = '?'; a.classList.remove('on'); d.classList.remove('on'); } }, 650); };
}

/* ---------- XO ---------- */
function xo(p) {
  const L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]; let b = Array(9).fill(''), end = false;
  const win = (s, m = b) => L.some(l => l.every(i => m[i] === s));
  const find = s => { for (let i = 0; i < 9; i++) if (!b[i]) { b[i] = s; const w = win(s); b[i] = ''; if (w) return i; } return -1; };
  const draw = (msg) => { p.innerHTML = `<div class="x-g3">${b.map((v, i) => `<button class="x-t3" data-i="${i}">${v}</button>`).join('')}</div><p style="text-align:center;min-height:24px">${msg || 'Sen X\'sin, sıra sende.'}</p>${end ? '<div style="text-align:center;margin-top:10px"><button class="x-btn pri" id="xr">Tekrar</button></div>' : ''}`; if (end) $('#xr').onclick = () => xo(p); };
  const fin = (m, pts) => { end = true; draw(m); if (pts) give(pts, 'XO', true); mark('game'); };
  p.onclick = e => { const t = e.target.closest('.x-t3'); if (!t || end || b[t.dataset.i]) return; b[t.dataset.i] = 'X';
    if (win('X')) return fin('Kazandın! 🎉', 5); if (b.every(Boolean)) return fin('Berabere.', 2);
    let m = find('O'); if (m < 0) m = find('X'); if (m < 0) m = !b[4] ? 4 : [0, 2, 6, 8, 1, 3, 5, 7].find(i => !b[i]);
    b[m] = 'O'; if (win('O')) { window.dispatchEvent(new CustomEvent('lef-x', { detail: { why: 'XO-kayıp' } })); return fin('Yapay zeka kazandı.', 0); } if (b.every(Boolean)) return fin('Berabere.', 2); draw(); };
  draw();
}

/* ---------- Refleks ---------- */
function rx(p) {
  let st = 'idle', t0 = 0, to = 0;
  p.innerHTML = `<div class="x-rx" id="xb">Başlamak için dokun</div><p style="margin-top:10px;color:#9ca3af">En iyi süren: <b id="xbest">${S.best ? S.best + ' ms' : '-'}</b></p>`;
  const b = $('#xb');
  b.onclick = () => {
    if (st === 'idle') { st = 'wait'; b.className = 'x-rx wait'; b.textContent = 'Yeşili bekle...'; to = setTimeout(() => { st = 'go'; b.className = 'x-rx go'; b.textContent = 'ŞİMDİ!'; t0 = performance.now(); }, 1000 + rnd(2500)); }
    else if (st === 'wait') { clearTimeout(to); st = 'idle'; b.className = 'x-rx'; b.textContent = 'Çok erken! Tekrar dokun.'; }
    else if (st === 'go') { const ms = Math.round(performance.now() - t0); st = 'idle'; b.className = 'x-rx'; b.textContent = ms + ' ms · tekrar için dokun';
      if (!S.best || ms < S.best) { S.best = ms; save(); $('#xbest').textContent = ms + ' ms'; }
      give(ms < 300 ? 6 : ms < 450 ? 3 : 1, 'Refleks', true); mark('game'); }
  };
}

/* ---------- KÜTÜPHANE ---------- */
const ST = ['Okuyorum', 'Bitirdim', 'Sırada'];
function lib() {
  const el = $('#v-kutuphane'); if (!el) return;
  el.innerHTML = `<h2>Kütüphane</h2><div class="x-card"><input class="x-in" id="xl" maxlength="60" placeholder="Manga / seri adı"><div class="x-bar"><button class="x-btn pri" id="xla">Ekle</button></div></div>
  <div class="x-card" id="xll">${S.lib.length ? S.lib.map((x, i) => `<div class="x-row"><b>${E(x.n)}</b><button class="x-btn" data-s="${i}">${ST[x.s]}</button><button class="x-btn" data-d="${i}" aria-label="Sil">✕</button></div>`).join('') : '<p>Listen boş. Okuduğun veya okuyacağın serileri ekle.</p>'}</div>`;
  const add = () => { const v = $('#xl').value.trim(); if (!v) return; S.lib.unshift({ n: v, s: 0 }); save(); mark('lib'); lib(); };
  $('#xla').onclick = add; $('#xl').onkeydown = e => { if (e.key === 'Enter') add(); };
  $('#xll').onclick = e => { const s = e.target.closest('[data-s]'), d = e.target.closest('[data-d]');
    if (s) { const x = S.lib[s.dataset.s]; x.s = (x.s + 1) % 3; save(); lib(); } else if (d) { S.lib.splice(d.dataset.d, 1); save(); lib(); } };
}

/* ---------- Ardevyl için küçük API ---------- */
window.__lefx = {
  get pts() { return S.pts; }, get streak() { return S.streak; },
  left() { const k = S.d.t === day() ? S.d.k : {}; return Object.keys(TASKS).filter(t => !k[t]).map(t => TASKS[t]); },
  open(k) { location.hash = 'kesfet'; setTimeout(() => { if (FEAT[k]) openF(k); }, 80); }
};

/* ---------- başlat ---------- */
home(); hub(); lib();