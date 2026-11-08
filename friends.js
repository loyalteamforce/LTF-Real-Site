/* ============================================================
   ARKADAŞLIK SİSTEMİ
   Kurulum:
     1) arkadaslik-kurulum.sql dosyasını Supabase > SQL Editor'da çalıştır.
     2) app.html içinde <script type="module" src="friends.js"></script> satırı var (ardevyl.js'ten önce).
   Ne yapar:
     - Başkasının profilinde: Arkadaş ekle / İstek gönderildi / Kabul et / Arkadaşsınız
     - Kendi profilinde: "Arkadaşlar" düğmesi (bekleyen istek sayısı rozetiyle)
     - Panelde: Arkadaşlar, İstekler (gelen/giden), Ekle (üye arama) sekmeleri
   ============================================================ */
import { supabase, FUNCTIONS_URL } from './config.js';

(async function main() {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var BASE = FUNCTIONS_URL.replace('/functions/v1', '');
  function safeUrl(u) {
    return (typeof u === 'string' && u.indexOf(BASE + '/storage/v1/object/public/') === 0) ? u : null;
  }

  var uid = null;
  try {
    var s = await supabase.auth.getSession();
    uid = s.data.session && s.data.session.user.id;
  } catch (_) {}
  if (!uid) return;

  var head = $('.pf-head');
  if (!head) return;

  /* ---------- CSS ---------- */
  var css = document.createElement('style');
  css.textContent =
    '.fr-acts{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:10px 0 4px}' +
    '.fr-btn{position:relative;height:36px;padding:0 16px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:transparent;color:#fff;font:inherit;font-size:13px;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s}' +
    '.fr-btn:hover{background:rgba(255,255,255,.1)}' +
    '.fr-btn.pri{background:#fff;color:#111;border-color:#fff;font-weight:600}.fr-btn.pri:hover{background:#e6e6e6}' +
    '.fr-btn.dng:hover{background:rgba(255,77,109,.16);border-color:rgba(255,77,109,.6);color:#ff9aae}' +
    '.fr-btn:disabled{opacity:.55;cursor:default;background:transparent}' +
    '.fr-dot{display:inline-grid;place-items:center;min-width:18px;height:18px;margin-left:8px;padding:0 5px;border-radius:999px;background:#ff4d6d;color:#fff;font-size:11px;font-weight:700}' +
    '.fr-msg{font-size:12.5px;color:#9ca3af}.fr-msg.err{color:#ffb3b3}' +
    '#frBox .st-card{background:#0e0e11;border-color:rgba(255,255,255,.09);box-shadow:0 -10px 40px -10px rgba(0,0,0,.8)}' +
    '.fr-tabs{display:flex;gap:4px;padding:3px;border-radius:999px;background:rgba(255,255,255,.07);margin:6px 0 10px}' +
    '.fr-tabs button{flex:1;padding:8px 6px;border:0;border-radius:999px;background:transparent;color:#9ca3af;font:inherit;font-size:13px;cursor:pointer;white-space:nowrap;transition:background .2s,color .2s}' +
    '.fr-tabs button.on{background:#fff;color:#111;font-weight:600}' +
    '.fr-tabs .fr-dot{margin-left:5px;height:16px;min-width:16px;font-size:10px}' +
    '.fr-list{max-height:min(60vh,480px);overflow-y:auto;scrollbar-width:thin;margin:0 -6px;padding:0 6px}' +
    '.fr-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 8px;margin:0 -8px;border-radius:14px;transition:background .15s}' +
    '.fr-row:hover{background:rgba(255,255,255,.05)}' +
    '.fr-who{display:flex;align-items:center;gap:12px;min-width:0;flex:1;padding:0;border:0;background:transparent;color:#fff;font:inherit;font-size:14px;text-align:left;cursor:pointer}' +
    '.fr-av{position:relative;flex:none;width:42px;height:42px}' +
    '.fr-av img,.fr-av i{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#26262b;display:grid;place-items:center;font-style:normal;font-size:16px;font-weight:700;color:#cfd3da}' +
    '.fr-av .fr-un{position:absolute;right:-1px;top:-1px;width:12px;height:12px;border-radius:50%;background:#3b82f6;border:2px solid #0e0e11}' +
    '.fr-tx{display:block;min-width:0}' +
    '.fr-tx b{display:block;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.fr-tx small{display:block;margin-top:1px;font-size:12px;color:#8b8f98;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.fr-bx{display:flex;gap:6px;flex:none}.fr-bx .fr-btn{height:32px;padding:0 12px;font-size:12.5px}' +
    '.fr-h{margin:14px 0 4px;font-size:11.5px;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em}' +
    '.fr-sk{display:flex;align-items:center;gap:12px;padding:10px 0}.fr-sk i{width:42px;height:42px;border-radius:50%;flex:none}.fr-sk b{flex:1;height:14px;border-radius:8px}' +
    '.fr-empty{padding:26px 8px;font-size:13px;color:#9ca3af;text-align:center;line-height:1.5}' +
    '.fr-empty .fr-btn{margin-top:12px}' +
    '.fr-srch{display:block;width:100%;height:42px;margin-bottom:8px;padding:0 14px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;font:inherit;font-size:16px;outline:0}' +
    '.fr-srch[hidden]{display:none}' +
    '.fr-srch:focus{border-color:rgba(255,255,255,.4)}';
  document.head.appendChild(css);

  /* ---------- durum ---------- */
  var rels = [], people = {}, ready = true, loaded = false, tab = 'friends', sheetOpen = false;
  var cur = window.__lefProfile || null;

  function relOf(id) {
    for (var i = 0; i < rels.length; i++) {
      if (rels[i].requester_id === id || rels[i].addressee_id === id) return rels[i];
    }
    return null;
  }
  function otherId(r) { return r.requester_id === uid ? r.addressee_id : r.requester_id; }
  function incoming() { return rels.filter(function (r) { return r.status === 'pending' && r.addressee_id === uid; }); }
  function outgoing() { return rels.filter(function (r) { return r.status === 'pending' && r.requester_id === uid; }); }
  function friends() { return rels.filter(function (r) { return r.status === 'accepted'; }); }

  async function loadRels() {
    try { return await loadRels0(); } finally { loaded = true; if (typeof paintSheet === 'function') paintSheet(); }
  }
  async function loadRels0() {
    var res = await supabase.from('friendships')
      .select('id,requester_id,addressee_id,status,created_at')
      .order('created_at', { ascending: false }).limit(500);
    if (res.error) {
      if (ready) console.warn('[friends] friendships okunamadı. arkadaslik-kurulum.sql çalıştırıldı mı?', res.error.message);
      ready = false; return false;
    }
    ready = true;
    rels = res.data || [];
    var need = [];
    rels.forEach(function (r) { var o = otherId(r); if (!people[o] && need.indexOf(o) < 0) need.push(o); });
    if (need.length) {
      var pr = await supabase.from('profiles').select('id,username,display_name,avatar_url,role').in('id', need);
      (pr.data || []).forEach(function (p) { people[p.id] = p; });
    }
    return true;
  }

  /* ---------- küçük yardımcılar ---------- */
  function btn(label, cls, fn) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'fr-btn' + (cls ? ' ' + cls : ''); b.textContent = label;
    if (fn) b.addEventListener('click', fn); else b.disabled = true;
    return b;
  }
  var ERR = {
    not_authenticated: 'Giriş yapmalısın.', invalid_target: 'Geçersiz kullanıcı.',
    user_not_found: 'Kullanıcı bulunamadı.', too_many_requests: 'Çok fazla bekleyen isteğin var.',
    not_found: 'İstek artık yok.'
  };
  function errText(e) {
    var m = (e && e.message) || '';
    for (var k in ERR) if (m.indexOf(k) > -1) return ERR[k];
    return 'İşlem başarısız, tekrar dene.';
  }
  var msgT = null;
  function flash(t, err) {
    [acts.msg, sheetMsg].forEach(function (el) {
      if (!el) return; el.textContent = t || ''; el.classList.toggle('err', !!err);
    });
    clearTimeout(msgT);
    if (t) msgT = setTimeout(function () { flash(''); }, 4000);
  }
  var busy = false;
  async function act(fn, args, okText) {
    if (busy) return null; busy = true;
    var res = await supabase.rpc(fn, args);
    busy = false;
    if (res.error) { flash(errText(res.error), true); return null; }
    await loadRels(); paintAll();
    var okMap = { sent: 'İstek gönderildi.', accepted: 'Artık arkadaşsınız!', already_sent: 'İstek zaten gönderilmiş.', already_friends: 'Zaten arkadaşsınız.', declined: 'İstek reddedildi.', removed: 'Kaldırıldı.' };
    flash(okText || okMap[res.data] || '');
    return res.data;
  }

  /* bir kişiyle ilişkiye göre düğmeler (profilde ve aramada ortak) */
  function relButtons(id) {
    var r = relOf(id);
    if (!r) return [btn('Arkadaş ekle', 'pri', function () { act('send_friend_request', { target: id }); })];
    if (r.status === 'accepted') return [
      btn('✓ Arkadaşsınız', '', null),
      btn('Çıkar', '', function () { if (confirm('Arkadaşlıktan çıkarılsın mı?')) act('remove_friendship', { other: id }); })
    ];
    if (r.requester_id === uid) return [
      btn('İstek gönderildi', '', null),
      btn('İptal', '', function () { act('remove_friendship', { other: id }); })
    ];
    return [
      btn('Kabul et', 'pri', function () { act('respond_friend_request', { req: r.id, accept: true }); }),
      btn('Reddet', '', function () { act('respond_friend_request', { req: r.id, accept: false }); })
    ];
  }

  function openProfile(id) {
    closeSheet();
    window.dispatchEvent(new CustomEvent('lef-open-profile', { detail: { id: id } }));
  }

  function ago(t) {
    var d = Math.floor((Date.now() - Date.parse(t)) / 86400000);
    return d <= 0 ? 'Bugün' : d === 1 ? 'Dün' : d + ' gün önce';
  }
  function nameOf(p) { return (p && (p.display_name || p.username)) || 'Üye'; }
  function avatarOf(id, p) {
    var w = document.createElement('span'); w.className = 'fr-av';
    var au = safeUrl(p && p.avatar_url), a;
    if (au) { a = document.createElement('img'); a.src = au; a.alt = ''; a.loading = 'lazy'; }
    else { a = document.createElement('i'); a.textContent = nameOf(p).trim().charAt(0).toUpperCase(); }
    w.appendChild(a);
    var um = window.__lefUnreadMap;
    if (um && um[id]) { var u = document.createElement('span'); u.className = 'fr-un'; u.title = 'Yeni mesaj'; w.appendChild(u); }
    return w;
  }

  function row(id, p, btns, sub) {
    var d = document.createElement('div'); d.className = 'fr-row';
    var who = document.createElement('button'); who.type = 'button'; who.className = 'fr-who';
    var tx = document.createElement('span'); tx.className = 'fr-tx';
    var nm = document.createElement('b'); nm.textContent = nameOf(p);
    tx.appendChild(nm);
    if (sub) { var sm = document.createElement('small'); sm.textContent = sub; tx.appendChild(sm); }
    who.append(avatarOf(id, p), tx);
    who.addEventListener('click', function () { openProfile(id); });
    var bx = document.createElement('span'); bx.className = 'fr-bx';
    btns.forEach(function (b) { bx.appendChild(b); });
    d.append(who, bx);
    return d;
  }
  function handle(p) { return p && p.username ? '@' + p.username : ''; }

  /* ---------- profil sayfasındaki düğmeler ---------- */
  var acts = document.createElement('div');
  acts.className = 'fr-acts';
  acts.msg = document.createElement('span'); acts.msg.className = 'fr-msg'; acts.msg.setAttribute('role', 'status');
  head.insertAdjacentElement('afterend', acts);

  function dot(n) {
    var s = document.createElement('span'); s.className = 'fr-dot'; s.textContent = n > 99 ? '99+' : String(n); return s;
  }
  function paintActs() {
    acts.replaceChildren();
    acts.hidden = !ready || !cur;
    if (acts.hidden) return;
    if (cur.mine) {
      var b = btn('Arkadaşlar', 'pri', openSheet);
      var n = incoming().length;
      if (n) b.appendChild(dot(n));
      acts.appendChild(b);
      var sc = btn('Sohbet', '', function () { window.dispatchEvent(new Event('lef-open-inbox')); });   // chat.js sohbet panelini açar
      var un = window.__lefUnread | 0;
      if (un) sc.appendChild(dot(un));
      acts.appendChild(sc);
    } else {
      relButtons(cur.id).forEach(function (x) { acts.appendChild(x); });
    }
    acts.appendChild(acts.msg);
  }

  /* ---------- panel (sheet) ---------- */
  var box = document.createElement('div');
  box.className = 'st'; box.id = 'frBox'; box.setAttribute('aria-hidden', 'true');
  box.innerHTML =
    '<div class="st-card" role="dialog" aria-modal="true" aria-label="Arkadaşlar">' +
      '<div class="st-top"><b>Arkadaşlar</b><button type="button" id="frX" aria-label="Kapat">&times;</button></div>' +
      '<div class="fr-tabs">' +
        '<button type="button" data-t="friends">Arkadaşlar</button>' +
        '<button type="button" data-t="reqs">İstekler</button>' +
        '<button type="button" data-t="add">Ekle</button>' +
      '</div>' +
      '<input type="search" class="fr-srch" id="frQ" placeholder="Arkadaşlarında ara" maxlength="30" autocomplete="off" hidden>' +
      '<div class="fr-list" id="frList"></div>' +
      '<div class="fr-msg" id="frMsg" role="status" style="margin-top:8px;min-height:16px"></div>' +
    '</div>';
  document.body.appendChild(box);
  var list = $('#frList', box), sheetMsg = $('#frMsg', box), frQ = $('#frQ', box);
  frQ.addEventListener('input', function () { paintSheet(); });

  function openSheet() {
    sheetOpen = true; tab = incoming().length ? 'reqs' : 'friends'; frQ.value = '';
    box.classList.add('on'); box.setAttribute('aria-hidden', 'false');
    loadRels().then(paintAll); paintAll();
  }
  function closeSheet() {
    sheetOpen = false; box.classList.remove('on'); box.setAttribute('aria-hidden', 'true');
  }
  $('#frX', box).addEventListener('click', closeSheet);
  box.addEventListener('click', function (e) { if (e.target === box) closeSheet(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheetOpen) closeSheet(); });
  box.querySelectorAll('.fr-tabs button').forEach(function (b) {
    b.addEventListener('click', function () { tab = b.dataset.t; paintSheet(); });
  });

  function empty(t, cta) {
    var d = document.createElement('div'); d.className = 'fr-empty'; d.textContent = t;
    if (cta) { d.appendChild(document.createElement('br')); d.appendChild(btn(cta.label, 'pri', cta.fn)); }
    return d;
  }
  function heading(t) { var d = document.createElement('div'); d.className = 'fr-h'; d.textContent = t; return d; }
  var LABELS = { friends: 'Arkadaşlar', reqs: 'İstekler', add: 'Ekle' };

  function paintSheet() {
    if (!sheetOpen) return;
    var nIn = incoming().length, nFr = friends().length;
    box.querySelectorAll('.fr-tabs button').forEach(function (b) {
      var t = b.dataset.t;
      b.classList.toggle('on', t === tab);
      b.textContent = LABELS[t] + (t === 'friends' && loaded && ready && nFr ? ' (' + nFr + ')' : '');
      if (t === 'reqs' && nIn) b.appendChild(dot(nIn));
    });
    frQ.hidden = !(tab === 'friends' && loaded && ready && nFr >= 6);
    if (tab === 'add') { paintAdd(); return; }
    list.replaceChildren();
    if (!loaded) {
      for (var k = 0; k < 4; k++) { var sk = document.createElement('div'); sk.className = 'fr-sk'; sk.innerHTML = '<i class="sk"></i><b class="sk"></b>'; list.appendChild(sk); }
      return;
    }
    if (!ready) { list.appendChild(empty('Arkadaşlık sistemi hazır değil.')); return; }
    if (tab === 'friends') {
      var fl = friends().map(function (r) { var id = otherId(r); return { id: id, p: people[id] }; });
      fl.sort(function (x, y) { return nameOf(x.p).localeCompare(nameOf(y.p), 'tr'); });
      var q = frQ.hidden ? '' : frQ.value.trim().toLocaleLowerCase('tr');
      if (q) fl = fl.filter(function (x) { return (nameOf(x.p) + ' ' + ((x.p && x.p.username) || '')).toLocaleLowerCase('tr').indexOf(q) > -1; });
      if (!fl.length) {
        list.appendChild(q ? empty('Eşleşen arkadaş yok.') :
          empty('Henüz arkadaşın yok.', { label: 'Arkadaş ekle', fn: function () { tab = 'add'; paintSheet(); } }));
        return;
      }
      var um = window.__lefUnreadMap || {};
      fl.sort(function (x, y) { return (um[y.id] ? 1 : 0) - (um[x.id] ? 1 : 0); });   // yeni mesajı olanlar üstte (kendi içinde A-Z)
      fl.forEach(function (x) {
        list.appendChild(row(x.id, x.p, [
          btn('Mesaj', 'pri', function () { openProfile(x.id); }),
          btn('Çıkar', 'dng', function () { if (confirm('Arkadaşlıktan çıkarılsın mı?')) act('remove_friendship', { other: x.id }); })
        ], handle(x.p)));
      });
    } else {
      var inc = incoming(), out = outgoing();
      if (!inc.length && !out.length) { list.appendChild(empty('Bekleyen istek yok.')); return; }
      if (inc.length) {
        list.appendChild(heading('Gelen istekler (' + inc.length + ')'));
        inc.forEach(function (r) {
          var id = otherId(r);
          list.appendChild(row(id, people[id], [
            btn('Kabul et', 'pri', function () { act('respond_friend_request', { req: r.id, accept: true }); }),
            btn('Reddet', 'dng', function () { act('respond_friend_request', { req: r.id, accept: false }); })
          ], handle(people[id]) + ' · ' + ago(r.created_at)));
        });
      }
      if (out.length) {
        list.appendChild(heading('Gönderdiklerin (' + out.length + ')'));
        out.forEach(function (r) {
          var id = otherId(r);
          list.appendChild(row(id, people[id], [
            btn('İptal', 'dng', function () { act('remove_friendship', { other: id }); })
          ], handle(people[id]) + ' · ' + ago(r.created_at)));
        });
      }
    }
  }

  /* "Ekle" sekmesi: üye ara */
  var qT = null, lastQ = '';
  function paintAdd() {
    list.replaceChildren();
    var inp = document.createElement('input');
    inp.type = 'search'; inp.className = 'fr-srch'; inp.placeholder = 'Kullanıcı adı ara'; inp.maxLength = 30; inp.autocomplete = 'off';
    inp.value = lastQ;
    var out = document.createElement('div');
    list.append(inp, out);
    function run() {
      var q = inp.value.trim().replace(/[^\p{L}\p{N}_.]/gu, '');
      lastQ = inp.value;
      out.replaceChildren();
      if (q.length < 2) { out.appendChild(empty('En az 2 harf yaz.')); return; }
      clearTimeout(qT);
      qT = setTimeout(async function () {
        var f = 'username.ilike.%' + q + '%,display_name.ilike.%' + q + '%';
        var res = await supabase.from('profiles').select('id,username,display_name,avatar_url,role').or(f).limit(10);
        out.replaceChildren();
        var data = (res.data || []).filter(function (u) { return u.id !== uid; });
        if (res.error) { out.appendChild(empty('Arama başarısız.')); return; }
        if (!data.length) { out.appendChild(empty('Kimse bulunamadı.')); return; }
        data.forEach(function (u) { people[u.id] = people[u.id] || u; out.appendChild(row(u.id, u, relButtons(u.id), handle(u))); });
      }, 300);
    }
    inp.addEventListener('input', run);
    if (inp.value) run(); else out.appendChild(empty('Arkadaş eklemek için kullanıcı adı veya ismi yaz.'));
    setTimeout(function () { inp.focus(); }, 50);
  }

  /* arama sonuçlarındaki düğmeler değişince yeniden çiz (yazı kutusunu bozmadan) */
  function repaintSearchRows() {
    var inp = $('.fr-srch', list);
    if (inp && inp.value.trim().length >= 2) inp.dispatchEvent(new Event('input'));
  }

  function paintAll() {
    window.dispatchEvent(new Event('lef-rels'));   // chat.js arkadaşlık değişimini buradan duyar
    paintActs();
    if (sheetOpen) { if (tab === 'add') repaintSearchRows(); else paintSheet(); }
    paintBadgeOnly();
  }
  function paintBadgeOnly() {
    if (sheetOpen && tab !== 'add') return;
    var t = box.querySelector('.fr-tabs button[data-t="reqs"]');
    if (!t) return;
    var old = t.querySelector('.fr-dot'); if (old) old.remove();
    var n = incoming().length; if (n) t.appendChild(dot(n));
  }

  /* ---------- olaylar ---------- */
  window.addEventListener('lef-profile', function () {
    cur = window.__lefProfile || null;
    paintActs();
  });
  window.addEventListener('lef-unread', function () { if (!sheetOpen) paintActs(); else if (tab === 'friends') paintSheet(); });   // chat.js okunmamış sayısını bildirir
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) loadRels().then(paintAll);
  });
  setInterval(function () { if (!document.hidden) loadRels().then(paintAll); }, 60000);

  await loadRels();
  if (!sheetOpen) paintActs();
  paintSheet();
})();