/* ============================================================
   MÜZİK SEKMESİ
   - Alt menüye "Müzik" butonu ve kendi sayfasını ekler (ux.js bu dosyayı otomatik yükler).
   - Üyeler YouTube linki yapıştırarak şarkı ekler, herkes listeyi görür ve oradan dinler.
   - Veriler Supabase'teki `sarkilar` tablosunda durur. Kurulum: muzik-kurulum.sql
   ============================================================ */
import { supabase } from './config.js';

(function () {
  var VIEW = 'muzik', ID_RE = /^[A-Za-z0-9_-]{11}$/;
  var app = document.getElementById('app'), bar = document.getElementById('dockBar');
  if (!app || !bar || document.getElementById('v-muzik')) return;

  /* ---------- CSS ---------- */
  var css = document.createElement('style');
  css.textContent = [
    '.mz-add{display:flex;flex-direction:column;gap:8px;margin:16px 0 6px}',
    '.mz-field{height:46px;padding:0 16px;border-radius:999px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.07);color:#fff;font:inherit;font-size:16px;outline:none;min-width:0}',
    '.mz-field:focus{border-color:rgba(255,255,255,.35)}',
    '.mz-field::placeholder{color:#6b7280}',
    '.mz-btn{height:46px;padding:0 24px;border:none;border-radius:999px;background:#fff;color:#111;font:inherit;font-size:14px;font-weight:600;cursor:pointer}',
    '.mz-btn:disabled{opacity:.5;cursor:not-allowed}',
    '.mz-msg{min-height:18px;margin:2px 4px 8px;font-size:13px;color:#ffb3b3}',
    '.mz-msg.ok{color:#9ca3af}',
    '.mz-now{margin:8px 0 18px;border-radius:16px;overflow:hidden;background:#1b1b1f;border:1px solid rgba(255,255,255,.08)}',
    '.mz-frame{display:block;width:100%;aspect-ratio:16/9;border:0;background:#000}',
    '.mz-hint{padding:26px 14px;text-align:center;color:#9ca3af;font-size:14px}',
    '.mz-now-t{display:flex;align-items:center;gap:10px;padding:10px 14px;font-size:14px}',
    '.mz-now-t[hidden]{display:none}',
    '.mz-now-t span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.mz-list{display:grid;gap:10px;margin-top:10px}',
    '.mz-it{display:flex;align-items:center;gap:12px;padding:8px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}',
    '.mz-it.on{border-color:rgba(255,255,255,.4);background:rgba(255,255,255,.09)}',
    '.mz-th{position:relative;flex:none;width:96px;aspect-ratio:16/9;padding:0;border:none;border-radius:10px;overflow:hidden;background:#26262b;cursor:pointer}',
    '.mz-th img{display:block;width:100%;height:100%;object-fit:cover}',
    '.mz-th i{position:absolute;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.35)}',
    '.mz-th svg{width:22px;height:22px;fill:#fff}',
    '.mz-meta{flex:1;min-width:0;cursor:pointer}',
    '.mz-meta b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:14px;font-weight:600;line-height:1.3}',
    '.mz-meta small{display:block;margin-top:3px;font-size:12px;color:#9ca3af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.mz-x{flex:none;width:34px;height:34px;border:none;border-radius:50%;background:transparent;color:#9ca3af;font-size:20px;line-height:1;cursor:pointer}',
    '.mz-x:hover{background:rgba(255,80,80,.15);color:#ff9a9a}',
    '@media (min-width:700px){.mz-add{flex-direction:row}.mz-add .mz-field{flex:1}.mz-add .mz-link{flex:2}}'
  ].join('\n');
  document.head.appendChild(css);

  /* ---------- Sayfa ---------- */
  var sec = document.createElement('section');
  sec.className = 'view'; sec.id = 'v-muzik'; sec.setAttribute('aria-label', 'Müzik');
  sec.innerHTML =
    '<h2>Müzik</h2>' +
    '<div class="mz-add">' +
      '<input id="mzLink" class="mz-field mz-link" type="text" inputmode="url" placeholder="YouTube şarkı linkini yapıştır" autocomplete="off" aria-label="YouTube linki">' +
      '<input id="mzName" class="mz-field" type="text" maxlength="120" placeholder="Şarkı adı (boşsa otomatik)" autocomplete="off" aria-label="Şarkı adı">' +
      '<button type="button" id="mzAdd" class="mz-btn">Ekle</button>' +
    '</div>' +
    '<p class="mz-msg" id="mzMsg" role="status"></p>' +
    '<div class="mz-now ux-noswipe">' +
      '<div id="mzStage" class="mz-hint">Bir şarkıya dokun, burada çalsın.</div>' +
      '<div class="mz-now-t" id="mzNowT" hidden><span id="mzNowName"></span><button type="button" class="bio-btn" id="mzStop">Durdur</button></div>' +
    '</div>' +
    '<label class="mg-search"><svg viewBox="0 0 18 18"><circle cx="8" cy="8" r="5.25"/><line x1="11.9" y1="11.9" x2="15.5" y2="15.5"/></svg>' +
      '<input id="mzQ" type="search" placeholder="Şarkı ara" autocomplete="off"></label>' +
    '<p class="mg-h" style="margin-top:16px">Şarkılar <span id="mzN"></span></p>' +
    '<div class="mz-list" id="mzList"></div>' +
    '<p class="mg-empty" id="mzEmpty"></p>';
  app.appendChild(sec);

  /* ---------- Alt menü butonu (Profil'in soluna) ---------- */
  var btn = document.createElement('button');
  btn.className = 'dock-btn'; btn.type = 'button';
  btn.dataset.view = VIEW; btn.dataset.label = 'Müzik'; btn.title = 'Müzik'; btn.setAttribute('aria-label', 'Müzik');
  btn.innerHTML = '<svg viewBox="0 0 18 18"><path d="M7 13V4l7-1.5V11"/><circle cx="5" cy="13" r="2"/><circle cx="12" cy="11" r="2"/></svg>';
  var prof = bar.querySelector('.dock-btn[data-view="profil"]');
  bar.insertBefore(btn, prof);
  btn.addEventListener('click', function () {
    if (location.hash.slice(1) === VIEW) sync(); else location.hash = VIEW;
  });

  var $ = function (id) { return document.getElementById(id); };
  var link = $('mzLink'), nameIn = $('mzName'), addBtn = $('mzAdd'), msgEl = $('mzMsg'), stage = $('mzStage'),
      nowT = $('mzNowT'), nowName = $('mzNowName'), q = $('mzQ'), nEl = $('mzN'), list = $('mzList'), empty = $('mzEmpty');
  var songs = [], uid = null, cur = null, loading = false, loaded = false;

  function setMsg(t, ok) { msgEl.textContent = t || ''; msgEl.classList.toggle('ok', !!ok); }

  /* ---------- YouTube linkinden video kimliği ---------- */
  function ytId(raw) {
    raw = String(raw || '').trim();
    if (ID_RE.test(raw)) return raw;
    var u;
    try { u = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw); } catch (e) { return null; }
    var h = u.hostname.replace(/^www\./, '').replace(/^m\./, ''), id = null, m;
    if (h === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    else if (h === 'youtube.com' || h === 'music.youtube.com' || h === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v');
      else if ((m = u.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?]+)/))) id = m[1];
    }
    return id && ID_RE.test(id) ? id : null;
  }
  async function fetchTitle(id) {
    try {
      var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, 5000);
      var r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id), { signal: ctl.signal });
      clearTimeout(t);
      if (!r.ok) return null;
      var j = await r.json();
      return j && j.title ? String(j.title).slice(0, 120) : null;
    } catch (e) { return null; }
  }

  /* ---------- Liste ---------- */
  function who(s) {
    var p = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
    return (p && (p.display_name || p.username)) || 'bir üye';
  }
  function row(s) {
    var it = document.createElement('div');
    it.className = 'mz-it' + (cur === s.video_id ? ' on' : '');
    var th = document.createElement('button');
    th.type = 'button'; th.className = 'mz-th'; th.setAttribute('aria-label', s.baslik + ' çal');
    var im = document.createElement('img');
    im.loading = 'lazy'; im.alt = ''; im.src = 'https://i.ytimg.com/vi/' + s.video_id + '/mqdefault.jpg';
    var pl = document.createElement('i');
    pl.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
    th.append(im, pl);
    th.addEventListener('click', function () { play(s); });
    var meta = document.createElement('div'); meta.className = 'mz-meta';
    var b = document.createElement('b'); b.textContent = s.baslik;
    var sm = document.createElement('small'); sm.textContent = 'Ekleyen: ' + who(s);
    meta.append(b, sm);
    meta.addEventListener('click', function () { play(s); });
    it.append(th, meta);
    if (uid && s.user_id === uid) {
      var x = document.createElement('button');
      x.type = 'button'; x.className = 'mz-x'; x.textContent = '\u00d7'; x.setAttribute('aria-label', 'Şarkıyı kaldır');
      x.addEventListener('click', function () { remove(s); });
      it.appendChild(x);
    }
    return it;
  }
  function render() {
    var v = q.value.trim().toLocaleLowerCase('tr'), c = 0;
    list.replaceChildren();
    songs.forEach(function (s) {
      if (!ID_RE.test(s.video_id)) return;
      if (v && String(s.baslik).toLocaleLowerCase('tr').indexOf(v) === -1) return;
      c++; list.appendChild(row(s));
    });
    nEl.textContent = '(' + c + ')';
    empty.style.display = c ? 'none' : 'block';
    empty.textContent = !loaded ? 'Yükleniyor...' : songs.length ? 'Sonuç yok. Başka bir isim dene.' : 'Henüz şarkı yok. İlk şarkıyı sen ekle.';
  }
  q.addEventListener('input', render);

  async function load() {
    if (loading) return;
    loading = true;
    try {
      var cols = 'id,video_id,baslik,created_at,user_id';
      var r = await supabase.from('sarkilar').select(cols + ',profiles(display_name,username)').order('created_at', { ascending: false }).limit(300);
      if (r.error) r = await supabase.from('sarkilar').select(cols).order('created_at', { ascending: false }).limit(300);
      if (r.error) { setMsg("Müzik listesi yüklenemedi. muzik-kurulum.sql Supabase'te çalıştırıldı mı?"); }
      else { songs = r.data || []; loaded = true; }
    } catch (e) { setMsg('Müzik listesi yüklenemedi. İnternetini kontrol et.'); }
    loading = false;
    render();
  }

  /* ---------- Çalma ---------- */
  function play(s) {
    cur = s.video_id;
    stage.className = ''; stage.replaceChildren();
    var f = document.createElement('iframe');
    f.className = 'mz-frame'; f.title = s.baslik;
    f.src = 'https://www.youtube-nocookie.com/embed/' + s.video_id + '?autoplay=1&rel=0&playsinline=1';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    f.setAttribute('allowfullscreen', '');
    stage.appendChild(f);
    nowT.hidden = false; nowName.textContent = s.baslik;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function stop() {
    cur = null; stage.replaceChildren();
    stage.className = 'mz-hint'; stage.textContent = 'Bir şarkıya dokun, burada çalsın.';
    nowT.hidden = true; nowName.textContent = '';
    render();
  }
  $('mzStop').addEventListener('click', stop);

  /* ---------- Ekle / kaldır ---------- */
  async function add() {
    setMsg('');
    var id = ytId(link.value);
    if (!id) { setMsg('Geçerli bir YouTube linki yapıştır.'); return; }
    if (songs.some(function (s) { return s.video_id === id; })) { setMsg('Bu şarkı zaten listede.'); return; }
    addBtn.disabled = true; setMsg('Ekleniyor...', true);
    var title = nameIn.value.trim().slice(0, 120) || await fetchTitle(id);
    if (!title) { addBtn.disabled = false; setMsg('Şarkı adı otomatik alınamadı. Adını yandaki kutuya yaz, sonra tekrar Ekle.'); nameIn.focus(); return; }
    try {
      var r = await supabase.from('sarkilar').insert({ video_id: id, baslik: title });
      if (r.error) setMsg(r.error.code === '23505' ? 'Bu şarkı zaten listede.' : 'Eklenemedi: ' + r.error.message);
      else { link.value = ''; nameIn.value = ''; setMsg('Şarkı eklendi.', true); await load(); }
    } catch (e) { setMsg('Eklenemedi. İnternetini kontrol et.'); }
    addBtn.disabled = false;
  }
  addBtn.addEventListener('click', add);
  link.addEventListener('keydown', function (e) { if (e.key === 'Enter') add(); });
  nameIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') add(); });

  async function remove(s) {
    if (!confirm('Bu şarkıyı listeden kaldırayım mı?')) return;
    try {
      var r = await supabase.from('sarkilar').delete().eq('id', s.id);
      if (r.error) { setMsg('Kaldırılamadı: ' + r.error.message); return; }
      songs = songs.filter(function (x) { return x.id !== s.id; }); setMsg(''); render();
    } catch (e) { setMsg('Kaldırılamadı. İnternetini kontrol et.'); }
  }

  /* ---------- Sekme geçişi (app.html'deki sekme kodu bu sayfayı bilmediği için burada yönetilir) ---------- */
  function sync() {
    var on = location.hash.slice(1) === VIEW;
    if (on) {
      document.querySelectorAll('.view').forEach(function (v) { v.classList.toggle('on', v === sec); });
      document.querySelectorAll('.dock-btn').forEach(function (b) {
        if (b === btn) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
      });
      window.scrollTo(0, 0);
      load();
    } else {
      sec.classList.remove('on'); btn.removeAttribute('aria-current');
    }
    if (window.__dockShow) window.__dockShow();
    if (window.__dockInd) window.__dockInd(false);
  }
  window.addEventListener('hashchange', sync);

  supabase.auth.getSession().then(function (r) {
    uid = r.data && r.data.session ? r.data.session.user.id : null; render();
  }).catch(function () {});

  if (window.__dockInd) window.__dockInd(true);   // yeni buton eklendi, gösterge konumu yenilensin
  render();
  sync();
})();
