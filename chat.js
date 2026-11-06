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
  }

  function addMsg(m) {
    for (var i = 0; i < msgs.length; i++) if (msgs[i].id === m.id) return;
    msgs.push(m); paintLog(true);
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
    input.value = ''; fit(); addMsg(r.data);
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
    top.append(avatar(p), tx);

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
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); }
    });

    card.append(top, log, errEl, form);
    card.hidden = false;
    paintLog(true);
    await loadMsgs(true);
    clearInterval(pollT);   // realtime kapalı olsa bile mesajlar gelsin
    pollT = setInterval(function () { if (!document.hidden && peer) loadMsgs(false); }, 6000);
  }

  /* ---------- gelen kutusu (kendi profilinde) ---------- */
  async function showInbox(me) {
    var r = await supabase.from('messages').select('id,sender_id,receiver_id,body,created_at')
      .or('sender_id.eq.' + uid + ',receiver_id.eq.' + uid).order('created_at', { ascending: false }).limit(200);
    if (me !== token) return;
    card.replaceChildren();
    if (r.error || !r.data || !r.data.length) { card.hidden = true; return; }
    var seen = {}, convs = [];
    r.data.forEach(function (m) {
      var o = m.sender_id === uid ? m.receiver_id : m.sender_id;
      if (!seen[o]) { seen[o] = 1; convs.push({ id: o, last: m }); }
    });
    await Promise.all(convs.map(function (c) { return getProfile(c.id); }));
    if (me !== token) return;
    card.appendChild(el('div', 'ch-hd', 'Sohbetler'));
    convs.slice(0, 20).forEach(function (c) {
      var p = people[c.id];
      var b = el('button', 'ch-row'); b.type = 'button';
      var mid = el('span');
      mid.append(el('b', '', nameOf(p)), el('em', '', (c.last.sender_id === uid ? 'Sen: ' : '') + c.last.body));
      b.append(avatar(p), mid, el('time', '', dayLabel(c.last.created_at) === 'Bugün' ? hhmm(c.last.created_at) : dayLabel(c.last.created_at)));
      b.addEventListener('click', function () {
        window.dispatchEvent(new CustomEvent('lef-open-profile', { detail: { id: c.id } }));
      });
      card.appendChild(b);
    });
    card.hidden = false;
  }

  /* ---------- profil değişince ---------- */
  async function refresh() {
    var me = ++token;
    clearInterval(pollT); peer = null; log = input = sendBtn = errEl = null;
    cur = window.__lefProfile || null;
    if (!cur) { card.hidden = true; return; }
    try {
      if (cur.mine) { await showInbox(me); return; }
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
      var m = p.new; if (!m) return;
      if (peer && m.sender_id === peer) addMsg(m);
      else if (cur && cur.mine) refresh();
    }).subscribe();

  document.addEventListener('visibilitychange', function () { if (!document.hidden && peer) loadMsgs(false); });

  if (window.__lefProfile) refresh();
})();