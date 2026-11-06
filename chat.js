/* ============================================================
   ARKADAŞLARLA SOHBET
   Kurulum:
     1) mesajlasma-kurulum.sql dosyasını Supabase > SQL Editor'da çalıştır.
     2) app.html'de friends.js'ten SONRA şu satır olmalı:
        <script type="module" src="chat.js"></script>
   Ne yapar:
     - Arkadaşının profiline girince, profilin altında sohbet kutusu açılır
       (üstte arkadaşının fotoğrafı ve adı görünür).
     - Arkadaş değilsen kutu yerine kısa bir bilgi satırı çıkar.
     - Kendi profilinde "Sohbetler" listesi çıkar; birine dokununca profili ve sohbeti açılır.
   Rengi değiştirmek için: aşağıdaki CSS'te --ch değerini düzenle.
   ============================================================ */
import { supabase, FUNCTIONS_URL } from './config.js';

(async function main() {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var BASE = FUNCTIONS_URL.replace('/functions/v1', '');
  function safeUrl(u) {
    return (typeof u === 'string' && u.indexOf(BASE + '/storage/v1/object/public/') === 0) ? u : null;
  }

  var uid = null;
  try { var s = await supabase.auth.getSession(); uid = s.data.session && s.data.session.user.id; } catch (_) {}
  if (!uid) return;

  var anchor = $('#pfMsg');
  if (!anchor) return;

  /* ---------- CSS ---------- */
  var css = document.createElement('style');
  css.textContent =
    '.ch-card{--ch:#2563eb;--ch-hi:#3b82f6;margin:14px 14px 0;border-radius:16px;background:#1b1b1f;border:1px solid rgba(255,255,255,.1);overflow:hidden}' +
    '.ch-card[hidden]{display:none}' +
    '.ch-top{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.07)}' +
    '.ch-top img,.ch-top i,.ch-in img,.ch-in i{width:36px;height:36px;border-radius:50%;object-fit:cover;background:#2a2a30;flex:none}' +
    '.ch-top b{display:block;font-size:14.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.ch-top small{display:block;font-size:12px;color:#9ca3af}' +
    '.ch-snd{margin-left:auto;display:grid;place-items:center;width:36px;height:36px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#fff;cursor:pointer;flex:none}' +
    '.ch-snd:hover{background:rgba(255,255,255,.16)}.ch-snd:focus-visible{outline:2px solid var(--ch-hi);outline-offset:2px}.ch-snd[aria-pressed=false]{color:#8b8f98}' +
    '.ch-log{height:min(48vh,340px);overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:6px;scrollbar-width:thin}' +
    '.ch-day{align-self:center;margin:6px 0 2px;font-size:11.5px;color:#8b8f98}' +
    '.ch-b{max-width:78%;padding:8px 12px;border-radius:16px;font-size:14.5px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}' +
    '.ch-b.me{align-self:flex-end;background:var(--ch);color:#fff;border-bottom-right-radius:5px}' +
    '.ch-b.th{align-self:flex-start;background:#2a2a30;color:#f1f1f3;border-bottom-left-radius:5px}' +
    '.ch-b time{display:block;margin-top:2px;font-size:10.5px;opacity:.65;text-align:right}' +
    '.ch-empty{margin:auto;padding:12px;font-size:13px;color:#9ca3af;text-align:center}' +
    '.ch-form{display:flex;align-items:flex-end;gap:8px;padding:10px;border-top:1px solid rgba(255,255,255,.07)}' +
    '.ch-form textarea{flex:1;min-height:40px;max-height:110px;padding:10px 14px;resize:none;border-radius:20px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font:inherit;font-size:16px;line-height:1.3;outline:0}' +
    '.ch-form textarea:focus{border-color:var(--ch-hi)}' +
    '.ch-send{display:grid;place-items:center;width:40px;height:40px;border:0;border-radius:50%;background:var(--ch);color:#fff;cursor:pointer;flex:none}' +
    '.ch-send:hover{background:var(--ch-hi)}.ch-send:disabled{background:#33333a;color:#777;cursor:default}' +
    '.ch-err{padding:0 14px 10px;font-size:12.5px;color:#ffb3b3;min-height:0}.ch-err:empty{display:none}' +
    '.ch-note{padding:14px;font-size:13px;color:#9ca3af;text-align:center}' +
    '.ch-hd{padding:12px 14px 4px;font-size:15px;font-weight:600}' +
    '.ch-row{display:flex;align-items:center;gap:12px;width:100%;padding:10px 14px;border:0;border-top:1px solid rgba(255,255,255,.06);background:transparent;color:#fff;font:inherit;text-align:left;cursor:pointer}' +
    '.ch-row:hover{background:rgba(255,255,255,.05)}' +
    '.ch-row img,.ch-row i{width:40px;height:40px;border-radius:50%;object-fit:cover;background:#2a2a30;flex:none}' +
    '.ch-row span{min-width:0;flex:1}.ch-row b{display:block;font-size:14px;font-weight:600}' +
    '.ch-row em{display:block;font-style:normal;font-size:13px;color:#9ca3af;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.ch-row time{font-size:11.5px;color:#8b8f98;flex:none}' +
    '.ch-ban{position:fixed;top:max(10px,env(safe-area-inset-top));left:50%;z-index:90;width:min(calc(100% - 20px),400px);translate:-50% -150%;opacity:0;display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:18px;background:rgba(28,28,32,.97);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.14);box-shadow:0 12px 32px -8px rgba(0,0,0,.7);color:#fff;cursor:pointer;touch-action:none;pointer-events:none;transition:translate .5s cubic-bezier(.3,1.35,.5,1),opacity .25s ease}' +
    '.ch-ban.on{translate:-50% 0;opacity:1;pointer-events:auto}.ch-ban.drag{transition:none}' +
    '.ch-ban img,.ch-ban i{width:40px;height:40px;border-radius:50%;object-fit:cover;background:#2a2a30;flex:none}' +
    '.ch-ban span{min-width:0;flex:1}.ch-ban b{display:block;font-size:13.5px;font-weight:700}' +
    '.ch-ban em{display:block;font-style:normal;font-size:13px;color:#b4b8c0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.ch-list{max-height:min(62vh,480px);overflow-y:auto;scrollbar-width:thin;margin:0 -18px}' +
    '.ch-row.un b{color:#fff}.ch-row.un em{color:#e5e7eb;font-weight:600}' +
    '.ch-row .ch-un{width:10px;height:10px;border-radius:50%;background:#3b82f6;flex:none}' +
    '.ch-row{transition:background .15s,scale .22s cubic-bezier(.3,1.5,.5,1)}' +
    '@media (prefers-reduced-motion:no-preference){.ch-b{animation:ch-in .18s ease-out}@keyframes ch-in{from{opacity:0;transform:translateY(6px)}}}';
  document.head.appendChild(css);

  var card = document.createElement('section');
  card.className = 'ch-card'; card.hidden = true;
  card.setAttribute('aria-label', 'Sohbet');
  anchor.insertAdjacentElement('afterend', card);

  /* ---------- durum ---------- */
  var cur = null, peer = null, msgs = [], people = {}, token = 0, pollT = null;
  var log = null, input = null, sendBtn = null, errEl = null;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function avatar(p) {
    var u = safeUrl(p && p.avatar_url), a = el(u ? 'img' : 'i');
    if (u) { a.src = u; a.alt = ''; }
    return a;
  }
  function nameOf(p) { return (p && (p.display_name || p.username)) || 'Üye'; }
  function hhmm(t) { return new Date(t).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); }
  function dayLabel(t) {
    var d = new Date(t), n = new Date();
    if (d.toDateString() === n.toDateString()) return 'Bugün';
    var y = new Date(n); y.setDate(n.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'Dün';
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  }

  async function getProfile(id) {
    if (people[id]) return people[id];
    var r = await supabase.from('profiles').select('id,username,display_name,avatar_url').eq('id', id).maybeSingle();
    if (r.data) people[id] = r.data;
    return r.data || null;
  }
  async function isFriend(id) {
    var f = 'and(requester_id.eq.' + uid + ',addressee_id.eq.' + id + '),and(requester_id.eq.' + id + ',addressee_id.eq.' + uid + ')';
    var r = await supabase.from('friendships').select('id').eq('status', 'accepted').or(f).limit(1);
    return !r.error && !!(r.data && r.data.length);
  }


  /* ---------- ASMR sesleri (dosya yok, tarayıcıda üretilir) ---------- */
  var AC = null, noiseBuf = null, lastTap = 0;
  function sndOn() { try { return localStorage.getItem('lefChatSnd') !== '0'; } catch (_) { return true; } }
  function setSnd(v) { try { localStorage.setItem('lefChatSnd', v ? '1' : '0'); } catch (_) {} }
  function actx() {
    if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AC = new C(); }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  function noise(c) {
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.4), c.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }
  // Harfe basınca: yumuşak, kısa, hafif tok bir "tık"
  function sndKey(soft) {
    if (!sndOn()) return;
    var now = Date.now(); if (now - lastTap < 25) return; lastTap = now;
    var c = actx(); if (!c) return;
    var t = c.currentTime, k = soft ? .6 : 1;
    var src = c.createBufferSource(); src.buffer = noise(c); src.playbackRate.value = .8 + Math.random() * .4;
    var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = (soft ? 900 : 1300) + Math.random() * 500; bp.Q.value = .8;
    var g = c.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.13 * k, t + .004); g.gain.exponentialRampToValueAtTime(.001, t + .07);
    src.connect(bp); bp.connect(g); g.connect(c.destination); src.start(t); src.stop(t + .1);
    var o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(190 + Math.random() * 40, t); o.frequency.exponentialRampToValueAtTime(95, t + .07);
    var og = c.createGain();
    og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(.09 * k, t + .004); og.gain.exponentialRampToValueAtTime(.001, t + .09);
    o.connect(og); og.connect(c.destination); o.start(t); o.stop(t + .1);
  }
  // Gönderince / sesi açınca: yumuşak iki notalı çan + hafif hava esintisi
  function sndChime(force) {
    if (!force && !sndOn()) return;
    var c = actx(); if (!c) return;
    var t = c.currentTime;
    [[523.25, 0], [783.99, .11]].forEach(function (n) {
      var o = c.createOscillator(); o.type = 'sine'; o.frequency.value = n[0];
      var o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = n[0] * 2;
      var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
      var g = c.createGain(), g2 = c.createGain(), s0 = t + n[1];
      g.gain.setValueAtTime(0, s0); g.gain.linearRampToValueAtTime(.09, s0 + .03); g.gain.exponentialRampToValueAtTime(.001, s0 + 1.1);
      g2.gain.value = .12;
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(c.destination);
      o.start(s0); o2.start(s0); o.stop(s0 + 1.2); o2.stop(s0 + 1.2);
    });
    var src = c.createBufferSource(); src.buffer = noise(c);
    var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .7;
    bp.frequency.setValueAtTime(600, t); bp.frequency.exponentialRampToValueAtTime(2400, t + .3);
    var wg = c.createGain();
    wg.gain.setValueAtTime(0, t); wg.gain.linearRampToValueAtTime(.05, t + .08); wg.gain.exponentialRampToValueAtTime(.001, t + .35);
    src.connect(bp); bp.connect(wg); wg.connect(c.destination); src.start(t); src.stop(t + .4);
  }

  // Mesaj gelince: yumuşak, yukarı çıkan üç notalı "pop"
  function sndIncoming() {
    if (!sndOn()) return;
    var c = actx(); if (!c) return;
    var t = c.currentTime;
    [[659.25, 0], [880, .09], [1318.5, .19]].forEach(function (n) {
      var o = c.createOscillator(); o.type = 'sine'; o.frequency.value = n[0];
      var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3000;
      var g = c.createGain(), s0 = t + n[1];
      g.gain.setValueAtTime(0, s0); g.gain.linearRampToValueAtTime(.11, s0 + .012); g.gain.exponentialRampToValueAtTime(.001, s0 + .55);
      o.connect(g); g.connect(lp); lp.connect(c.destination); o.start(s0); o.stop(s0 + .6);
    });
  }
  // Tarayıcılar ilk dokunuşa kadar sesi engeller: ilk dokunuşta ses motorunu uyandır
  function unlock() {
    actx();
    if (AC && AC.state === 'running') ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.removeEventListener(ev, unlock, true); });
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, unlock, true); });

  // Sitedeki bütün yazı kutularında harfe basınca ASMR tıkı (sohbet kutusunun kendi sesi var)
  var TEXTY = 'input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range]):not([type=button]):not([type=submit]),textarea,[contenteditable="true"]';
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (!t || t === input || !t.matches || !t.matches(TEXTY)) return;
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length === 1 || e.key === 'Enter') sndKey(false);
    else if (e.key === 'Backspace' || e.key === 'Delete') sndKey(true);
  }, true);

  // Ayarlar penceresindeki "Sesler" düğmesi
  var stSnd = $('#stSnd');
  if (stSnd) {
    var syncSt = function () { stSnd.setAttribute('aria-checked', sndOn() ? 'true' : 'false'); };
    syncSt();
    stSnd.addEventListener('click', function () { var on = !sndOn(); setSnd(on); syncSt(); if (on) sndChime(true); });
  }

  /* ---------- okunmamış takibi (bu cihazda tutulur) ---------- */
  var SEEN_KEY = 'lefChatSeen:' + uid, INIT_KEY = 'lefChatInit:' + uid;
  var seen = {}, INIT = Date.now();
  try {
    seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') || {};
    var iv = +localStorage.getItem(INIT_KEY);
    if (iv) INIT = iv; else localStorage.setItem(INIT_KEY, String(INIT));   // ilk açılışta eski mesajlar "okunmamış" sayılmasın
  } catch (_) {}
  var convs = [];
  function isUnread(cv) { return cv.last.sender_id !== uid && Date.parse(cv.last.created_at) > (seen[cv.id] || INIT); }
  function recount() {
    window.__lefUnread = convs.filter(isUnread).length;
    window.dispatchEvent(new Event('lef-unread'));      // friends.js "Sohbet" düğmesindeki rozeti günceller
  }
  function markSeen(id, ms) {
    if (!(ms > (seen[id] || INIT))) return;
    seen[id] = ms;
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (_) {}
    recount(); if (sheet.classList.contains('on')) paintSheet();
  }
  function viewingChat() { return !!peer && !document.hidden && location.hash === '#profil'; }
  function seeIfViewing() {
    if (!viewingChat() || !msgs.length) return;
    var l = msgs[msgs.length - 1];
    if (l.sender_id === peer) markSeen(peer, Date.parse(l.created_at));
  }

  /* ---------- sohbet görünümü ---------- */
  function paintLog(stick) {
    if (!log) return;
    var atEnd = stick || log.scrollHeight - log.scrollTop - log.clientHeight < 60;
    log.replaceChildren();
    if (!msgs.length) {
      log.appendChild(el('div', 'ch-empty', 'Henüz mesaj yok. İlk mesajı sen yaz.'));
      return;
    }
    var lastDay = '';
    msgs.forEach(function (m) {
      var dl = dayLabel(m.created_at);
      if (dl !== lastDay) { log.appendChild(el('div', 'ch-day', dl)); lastDay = dl; }
      var b = el('div', 'ch-b ' + (m.sender_id === uid ? 'me' : 'th'), m.body);
      b.appendChild(el('time', '', hhmm(m.created_at)));
      log.appendChild(b);
    });
    if (atEnd) log.scrollTop = log.scrollHeight;
  }

  async function loadMsgs(stick) {
    if (!peer) return;
    var me = token;
    var f = 'and(sender_id.eq.' + uid + ',receiver_id.eq.' + peer + '),and(sender_id.eq.' + peer + ',receiver_id.eq.' + uid + ')';
    var r = await supabase.from('messages').select('id,sender_id,receiver_id,body,created_at')
      .or(f).order('created_at', { ascending: false }).limit(80);
    if (me !== token || r.error) return;
    var next = (r.data || []).reverse();
    var changed = next.length !== msgs.length || (next.length && next[next.length - 1].id !== msgs[msgs.length - 1].id);
    msgs = next;
    if (changed || stick) paintLog(stick);
    seeIfViewing();
  }

  function addMsg(m) {
    for (var i = 0; i < msgs.length; i++) if (msgs[i].id === m.id) return;
    msgs.push(m); paintLog(true); seeIfViewing();
  }

  async function send() {
    var body = input.value.trim();
    if (!body || !peer) return;
    sendBtn.disabled = true; errEl.textContent = '';
    var r = await supabase.from('messages')
      .insert({ sender_id: uid, receiver_id: peer, body: body.slice(0, 1000) })
      .select('id,sender_id,receiver_id,body,created_at').single();
    if (r.error) {
      errEl.textContent = 'Gönderilemedi. Arkadaş olduğunuzdan emin ol ve tekrar dene.';
      sendBtn.disabled = !input.value.trim(); return;
    }
    input.value = ''; fit(); addMsg(r.data); sndChime(false);
    input.focus();
  }
  function fit() {
    input.style.height = '40px';
    input.style.height = Math.min(input.scrollHeight, 110) + 'px';
    sendBtn.disabled = !input.value.trim();
  }

  async function showChat(id, me) {
    var p = await getProfile(id);
    if (me !== token) return;
    peer = id; msgs = [];
    card.replaceChildren();

    var top = el('div', 'ch-top');
    var tx = el('div');
    tx.append(el('b', '', nameOf(p)), el('small', '', 'Arkadaşın · özel sohbet'));
    var sb = el('button', 'ch-snd'); sb.type = 'button';
    var ICON_ON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
    var ICON_OFF = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/></svg>';
    function paintSnd() {
      var on = sndOn();
      sb.innerHTML = on ? ICON_ON : ICON_OFF;
      sb.setAttribute('aria-pressed', on ? 'true' : 'false');
      sb.setAttribute('aria-label', on ? 'Sohbet seslerini kapat' : 'Sohbet seslerini aç');
      sb.title = on ? 'Sesleri kapat' : 'Sesleri aç';
    }
    sb.addEventListener('click', function () {
      var on = !sndOn(); setSnd(on); paintSnd();
      if (on) sndChime(true);                       // açınca yumuşak bir ses çalar
    });
    paintSnd();
    top.append(avatar(p), tx, sb);

    log = el('div', 'ch-log');
    log.setAttribute('role', 'log'); log.setAttribute('aria-live', 'polite'); log.setAttribute('aria-label', nameOf(p) + ' ile mesajlar');

    var form = el('form', 'ch-form');
    input = el('textarea'); input.rows = 1; input.maxLength = 1000; input.placeholder = nameOf(p) + ' kişisine yaz...';
    input.setAttribute('aria-label', 'Mesaj yaz');
    sendBtn = el('button', 'ch-send'); sendBtn.type = 'submit'; sendBtn.disabled = true; sendBtn.setAttribute('aria-label', 'Gönder');
    sendBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>';
    form.append(input, sendBtn);
    errEl = el('div', 'ch-err'); errEl.setAttribute('role', 'status');

    form.addEventListener('submit', function (e) { e.preventDefault(); send(); });
    input.addEventListener('input', fit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); return; }
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length === 1 || e.key === 'Enter') sndKey(false);
      else if (e.key === 'Backspace' || e.key === 'Delete') sndKey(true);
    });

    card.append(top, log, errEl, form);
    card.hidden = false;
    paintLog(true);
    await loadMsgs(true);
    seeIfViewing();
    clearInterval(pollT);   // realtime kapalı olsa bile mesajlar gelsin
    pollT = setInterval(function () { if (!document.hidden && peer) loadMsgs(false); }, 6000);
  }

  /* ---------- sohbetler paneli ("Sohbet" düğmesine basınca açılır) ---------- */
  var sheet = el('div', 'st'); sheet.id = 'chBox'; sheet.setAttribute('aria-hidden', 'true');
  sheet.innerHTML =
    '<div class="st-card" role="dialog" aria-modal="true" aria-label="Sohbetler">' +
      '<div class="st-top"><b>Sohbetler</b><button type="button" id="chX" aria-label="Kapat">&times;</button></div>' +
      '<div class="ch-list" id="chList"></div>' +
    '</div>';
  document.body.appendChild(sheet);
  var listEl = $('#chList', sheet);

  async function loadConvs() {
    var r = await supabase.from('messages').select('id,sender_id,receiver_id,body,created_at')
      .or('sender_id.eq.' + uid + ',receiver_id.eq.' + uid).order('created_at', { ascending: false }).limit(200);
    if (r.error || !r.data) return convs;
    var s = {}, out = [];
    r.data.forEach(function (m) {
      var o = m.sender_id === uid ? m.receiver_id : m.sender_id;
      if (!s[o]) { s[o] = 1; out.push({ id: o, last: m }); }
    });
    out = out.slice(0, 30);
    await Promise.all(out.map(function (x) { return getProfile(x.id); }));
    convs = out; recount();
    return convs;
  }
  function paintSheet() {
    listEl.replaceChildren();
    if (!convs.length) {
      listEl.appendChild(el('div', 'ch-empty', 'Henüz sohbet yok. Bir arkadaşının profiline girip mesaj yazabilirsin.'));
      return;
    }
    convs.forEach(function (cv) {
      var p = people[cv.id], un = isUnread(cv);
      var b = el('button', 'ch-row' + (un ? ' un' : '')); b.type = 'button';
      var mid = el('span');
      mid.append(el('b', '', nameOf(p)), el('em', '', (cv.last.sender_id === uid ? 'Sen: ' : '') + cv.last.body));
      b.append(avatar(p), mid, el('time', '', dayLabel(cv.last.created_at) === 'Bugün' ? hhmm(cv.last.created_at) : dayLabel(cv.last.created_at)));
      if (un) b.appendChild(el('i', 'ch-un'));
      b.addEventListener('click', function () {
        closeSheet();
        window.dispatchEvent(new CustomEvent('lef-open-profile', { detail: { id: cv.id } }));
      });
      listEl.appendChild(b);
    });
  }
  function openSheet() {
    sheet.classList.add('on'); sheet.setAttribute('aria-hidden', 'false');
    paintSheet();
    loadConvs().then(paintSheet);
  }
  function closeSheet() { sheet.classList.remove('on'); sheet.setAttribute('aria-hidden', 'true'); }
  $('#chX', sheet).addEventListener('click', closeSheet);
  sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet.classList.contains('on')) closeSheet(); });
  window.addEventListener('lef-open-inbox', openSheet);

  /* ---------- üstten "Mesaj geldi" bildirimi ---------- */
  var banner = null, banT = null;
  function hideBanner() { clearTimeout(banT); if (banner) { banner.classList.remove('on'); banner.style.transform = ''; } }
  async function showBanner(m) {
    var p = await getProfile(m.sender_id);
    if (!banner) {
      banner = el('div', 'ch-ban');
      banner.setAttribute('role', 'status'); banner.setAttribute('aria-live', 'polite');
      document.body.appendChild(banner);
      var y0 = 0, dy = 0, moved = false;
      banner.addEventListener('pointerdown', function (e) { y0 = e.clientY; dy = 0; moved = false; clearTimeout(banT); banner.classList.add('drag'); });
      banner.addEventListener('pointermove', function (e) {
        if (!banner.classList.contains('drag') || !(e.buttons || e.pointerType === 'touch')) return;
        dy = Math.min(0, e.clientY - y0); if (dy < -4) moved = true;
        banner.style.transform = 'translateY(' + dy + 'px)';
      });
      var up = function () {
        if (!banner.classList.contains('drag')) return;
        banner.classList.remove('drag');
        if (dy < -28) hideBanner();                                   // yukarı kaydırınca kapanır
        else { banner.style.transform = ''; banT = setTimeout(hideBanner, 2500); }
      };
      banner.addEventListener('pointerup', up); banner.addEventListener('pointercancel', up);
      banner.addEventListener('click', function () {
        if (moved) return;
        var id = banner.dataset.from; hideBanner();
        if (id) window.dispatchEvent(new CustomEvent('lef-open-profile', { detail: { id: id } }));
      });
    }
    banner.dataset.from = m.sender_id;
    banner.replaceChildren();
    var mid = el('span');
    mid.append(el('b', '', 'Mesaj geldi'), el('em', '', nameOf(p) + ': ' + m.body));
    banner.append(avatar(p), mid);
    banner.style.transform = '';
    void banner.offsetWidth;
    banner.classList.add('on');
    clearTimeout(banT); banT = setTimeout(hideBanner, 4500);
  }

  /* ---------- gelen mesajı karşıla (ses + bildirim) ---------- */
  var known = {}, seeded = false;
  function onIncoming(m) {
    if (!m || known[m.id]) return;
    known[m.id] = 1;
    if (peer && m.sender_id === peer) addMsg(m);
    sndIncoming();
    if (viewingChat() && m.sender_id === peer) { markSeen(peer, Date.parse(m.created_at)); return; }   // zaten sohbete bakıyor: bildirim gerekmez
    showBanner(m);
    loadConvs().then(function () { if (sheet.classList.contains('on')) paintSheet(); });
  }
  async function pollIncoming() {
    if (document.hidden) return;
    var r = await supabase.from('messages').select('id,sender_id,receiver_id,body,created_at')
      .eq('receiver_id', uid).order('created_at', { ascending: false }).limit(10);
    if (r.error || !r.data) return;
    if (!seeded) { r.data.forEach(function (m) { known[m.id] = 1; }); seeded = true; return; }
    var fresh = r.data.filter(function (m) { return !known[m.id]; }).reverse();   // eskiden yeniye
    if (!fresh.length) return;
    fresh.slice(0, -1).forEach(function (m) { known[m.id] = 1; if (peer && m.sender_id === peer) addMsg(m); });
    onIncoming(fresh[fresh.length - 1]);                      // birden çoksa sadece sonuncusu için ses/bildirim
  }

  /* ---------- profil değişince ---------- */
  async function refresh() {
    var me = ++token;
    clearInterval(pollT); peer = null; log = input = sendBtn = errEl = null;
    cur = window.__lefProfile || null;
    if (!cur) { card.hidden = true; return; }
    try {
      if (cur.mine) { card.hidden = true; return; }
      if (await isFriend(cur.id)) { if (me === token) await showChat(cur.id, me); return; }
      if (me !== token) return;
      card.replaceChildren(el('div', 'ch-note', 'Bu kişiyle sohbet etmek için önce arkadaş olmalısınız.'));
      card.hidden = false;
    } catch (_) { card.hidden = true; }
  }

  window.addEventListener('lef-profile', refresh);
  window.addEventListener('lef-rels', function () {          // arkadaşlık durumu değişti (kabul/çıkar)
    if (window.__lefProfile && !window.__lefProfile.mine) refresh();
  });

  /* ---------- anlık mesajlar ---------- */
  supabase.channel('dm-' + uid)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'receiver_id=eq.' + uid }, function (p) {
      if (p.new) onIncoming(p.new);
    }).subscribe();

  // Realtime kapalı/kopuk olsa bile mesaj gelsin: 10 sn'de bir kontrol
  pollIncoming(); loadConvs();
  setInterval(pollIncoming, 10000);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    if (peer) loadMsgs(false);
    pollIncoming();
  });
  window.addEventListener('hashchange', seeIfViewing);

  if (window.__lefProfile) refresh();
})();