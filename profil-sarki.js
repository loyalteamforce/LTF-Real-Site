/* ============================================================
   EN SEVİLDİĞİM ŞARKI (profil şarkısı): YouTube'dan aranır, sadece sevdiğin 20 saniyelik bölüm çalır.
   - Kart küçüktür: müzik simgesi + şarkı adı + çal düğmesi. Video görünmez, sadece ses gelir.
   - Profilin sahibi "Şarkı ekle" der, arar (ya da YouTube linki yapıştırır), sonra kaydırıcıyla
     20 saniyelik bölümün başlangıcını seçer, "Dinle" ile dener, "Kaydet" der.
   - Başkaları çal düğmesine basunca yalnızca o 20 saniye çalır (otomatik çalmaz).
   - Veriler: profile_songs tablosu (title, video_id, start_sec). Eski MP3'ler çalmaya devam eder.
   - Kurulum: sarki-youtube-kurulum.sql (video_id) ve sarki-bolum-kurulum.sql (start_sec), bir kez.
   - ARAMA: config.js'teki YOUTUBE_API_KEY kullanılır; yoksa Piped sunucularına düşer.
   - config.js bu dosyayı kendisi yükler; app.html'ye ekleme gerekmez.
   ============================================================ */
import { supabase } from './config.js';
import * as CFG from './config.js';

const BUCKET = 'profile-songs';                       // eski MP3 şarkılar için
const YT_KEY = (CFG && CFG.YOUTUBE_API_KEY) || '';
const PIPED = ['https://pipedapi.kavin.rocks', 'https://pipedapi.adminforge.de', 'https://api.piped.private.coffee'];
const ID_RE = /^[A-Za-z0-9_-]{11}$/;
const CLIP = 20;                                       // bölüm uzunluğu (saniye)
const thumb = id => 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg';
const mmss = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

const CSS = `
.ps-card{ position:relative; margin:14px; padding:10px 12px; border-radius:16px; color:#e5e7eb; overflow:hidden;
  border:1px solid color-mix(in srgb,var(--pf-a,#9db8ff) 35%,rgba(255,255,255,.12));
  background:linear-gradient(160deg,color-mix(in srgb,var(--pf-a,#9db8ff) 8%,transparent),rgba(255,255,255,.03)); }
.ps-card[hidden],.ps-card [hidden]{ display:none !important; }
.ps-row{ display:flex; align-items:center; gap:12px; }
.ps-btn{ flex:none; position:relative; width:42px; height:42px; padding:0; border:0; border-radius:50%; cursor:pointer; display:grid; place-items:center;
  background:var(--pf-a,#9db8ff); color:#0b0b0f; }
.ps-btn:focus-visible{ outline:2px solid #fff; outline-offset:2px; }
.ps-btn svg{ width:20px; height:20px; display:block; }
.ps-btn .i-pause{ display:none; }
.ps-card.playing .ps-btn .i-note{ display:none; }
.ps-card.playing .ps-btn .i-pause{ display:block; }
.ps-mid{ flex:1; min-width:0; }
.ps-title{ font-size:14px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ps-bar{ height:3px; margin-top:7px; border-radius:2px; background:rgba(255,255,255,.12); overflow:hidden; }
.ps-bar i{ display:block; height:100%; width:0; background:var(--pf-a,#9db8ff); }
.ps-hid{ position:absolute; right:0; bottom:0; width:200px; height:113px; opacity:.01; pointer-events:none; overflow:hidden; }
.ps-hid iframe{ width:100%; height:100%; border:0; }
.ps-own,.ps-q,.ps-act{ display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:10px; }
.ps-in{ flex:1 1 160px; min-width:0; padding:9px 11px; border-radius:10px; border:1.5px solid rgba(255,255,255,.14);
  background:rgba(255,255,255,.06); color:#fff; font:inherit; font-size:14px; }
.ps-res{ display:flex; flex-direction:column; gap:6px; margin-top:10px; max-height:300px; overflow:auto; }
.ps-it{ display:flex; align-items:center; gap:10px; width:100%; padding:6px; border-radius:12px; text-align:left; cursor:pointer; font:inherit;
  color:#e5e7eb; border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.04); }
.ps-it:hover,.ps-it:focus-visible{ background:rgba(255,255,255,.1); }
.ps-it img{ flex:none; width:72px; aspect-ratio:16/9; object-fit:cover; border-radius:8px; background:#000; }
.ps-it b{ display:block; font-size:13px; font-weight:600; line-height:1.3; }
.ps-it span{ display:block; margin-top:2px; font-size:12px; color:#9ca3af; }
.ps-cl-t{ font-size:13px; font-weight:600; margin-top:10px; overflow-wrap:anywhere; }
.ps-range{ width:100%; margin:12px 0 2px; accent-color:var(--pf-a,#9db8ff); }
.ps-cl-l{ display:flex; justify-content:space-between; font-size:12px; color:#9ca3af; font-variant-numeric:tabular-nums; }
.ps-msg{ min-height:16px; margin-top:8px; font-size:13px; color:#9ca3af; }
.ps-msg:empty{ min-height:0; margin:0; }
.ps-msg.err{ color:#ffb3b3; }
`;

const ICON_NOTE = '<svg class="i-note" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z"/></svg>' +
                  '<svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';

/* ---------- YouTube yardımcıları ---------- */
function ytId(raw){
  raw = String(raw || '').trim();
  if(ID_RE.test(raw)) return raw;
  let u; try { u = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw); } catch(_){ return null; }
  const h = u.hostname.replace(/^www\.|^m\./, ''); let id = null;
  if(h === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
  else if(h === 'youtube.com' || h === 'music.youtube.com' || h === 'youtube-nocookie.com'){
    if(u.pathname === '/watch') id = u.searchParams.get('v');
    else { const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/); if(m) id = m[1]; }
  }
  return id && ID_RE.test(id) ? id : null;
}
const decode = s => { const t = document.createElement('textarea'); t.innerHTML = String(s || ''); return t.value; };
async function getJSON(url, ms){
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms || 5000);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if(!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}
async function searchYT(q){
  if(YT_KEY){   // resmi YouTube Data API (anahtar Google Cloud'da HTTP referrer ile siteye kilitli)
    const j = await getJSON('https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=8&q=' +
      encodeURIComponent(q) + '&key=' + encodeURIComponent(YT_KEY), 6000);
    return (j.items || []).map(i => ({ id: i.id && i.id.videoId, title: decode(i.snippet && i.snippet.title), by: decode(i.snippet && i.snippet.channelTitle) }))
      .filter(x => ID_RE.test(x.id || ''));
  }
  let last = null;   // anahtar yoksa: herkese açık Piped sunucuları (bazen kapalı olabilir)
  for(const base of PIPED){
    try {
      const j = await getJSON(base + '/search?filter=videos&q=' + encodeURIComponent(q), 5000);
      const out = (j.items || []).map(i => ({ id: (String(i.url || '').match(/[?&]v=([\w-]{11})/) || [])[1], title: i.title, by: i.uploaderName }))
        .filter(x => ID_RE.test(x.id || '')).slice(0, 8);
      if(out.length) return out;
    } catch(e){ last = e; }
  }
  if(last) throw last;
  return [];
}
async function titleOf(id){
  try {
    const j = await getJSON('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id), 5000);
    if(j && j.title) return String(j.title);
  } catch(_){}
  return null;
}
async function durationOf(id){   // saniye; bulunamazsa null
  if(!YT_KEY) return null;
  try {
    const j = await getJSON('https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=' + id + '&key=' + encodeURIComponent(YT_KEY), 5000);
    const m = String(j.items && j.items[0] && j.items[0].contentDetails.duration || '').match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    if(!m) return null;
    return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
  } catch(_){ return null; }
}

function init(){
  const pv = document.getElementById('v-profil');
  const head = pv && pv.querySelector('.pf-head');
  if(!pv || !head) return;   // bu sayfada profil yok (login, açılış vb.)

  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);

  const card = document.createElement('section');
  card.className = 'ps-card'; card.hidden = true; card.setAttribute('aria-label', 'En sevdiğim şarkı');
  card.innerHTML =
    '<div class="ps-row ps-player" hidden>' +
      '<button type="button" class="ps-btn" aria-label="Çal">' + ICON_NOTE + '</button>' +
      '<div class="ps-mid"><div class="ps-title"></div><div class="ps-bar"><i></i></div></div>' +
    '</div>' +
    '<div class="ps-hid"></div>' +
    '<div class="ps-own" hidden>' +
      '<button type="button" class="bio-btn" data-a="pick">Şarkı ekle</button>' +
      '<button type="button" class="bio-btn" data-a="del" hidden>Kaldır</button>' +
    '</div>' +
    '<div class="ps-find" hidden>' +
      '<div class="ps-q">' +
        '<input class="ps-in" type="search" maxlength="120" placeholder="Şarkı veya sanatçı ara, ya da YouTube linki yapıştır" aria-label="YouTube\'da şarkı ara" autocomplete="off">' +
        '<button type="button" class="bio-btn pri" data-a="go">Ara</button>' +
        '<button type="button" class="bio-btn" data-a="cancel">Vazgeç</button>' +
      '</div>' +
      '<div class="ps-res" role="list"></div>' +
    '</div>' +
    '<div class="ps-clip" hidden>' +
      '<div class="ps-cl-t"></div>' +
      '<input class="ps-range" type="range" min="0" max="0" step="1" value="0" aria-label="20 saniyelik bölümün başlangıcı">' +
      '<div class="ps-cl-l"><span class="ps-cl-r"></span><span>' + CLIP + ' sn</span></div>' +
      '<div class="ps-act">' +
        '<button type="button" class="bio-btn" data-a="try">Dinle</button>' +
        '<button type="button" class="bio-btn pri" data-a="save">Kaydet</button>' +
        '<button type="button" class="bio-btn" data-a="back">Geri</button>' +
      '</div>' +
    '</div>' +
    '<div class="ps-msg" role="status"></div>';

  const q = s => card.querySelector(s);
  const el = {
    player: q('.ps-player'), btn: q('.ps-btn'), title: q('.ps-title'), bar: q('.ps-bar i'), hid: q('.ps-hid'),
    own: q('.ps-own'), pick: q('[data-a=pick]'), del: q('[data-a=del]'),
    find: q('.ps-find'), input: q('.ps-in'), go: q('[data-a=go]'), cancel: q('[data-a=cancel]'), res: q('.ps-res'),
    clip: q('.ps-clip'), clT: q('.ps-cl-t'), range: q('.ps-range'), clR: q('.ps-cl-r'),
    tryB: q('[data-a=try]'), saveB: q('[data-a=save]'), backB: q('[data-a=back]'), msg: q('.ps-msg')
  };

  // Kartı profil sayfasına yerleştir (sayfa yeniden çizilirse olaylarda tekrar takılır)
  function attach(){
    if(card.isConnected) return;
    const bio = pv.querySelector('.bio');
    if(bio && !head.contains(bio)) bio.after(card); else head.after(card);
  }

  let token = 0, lastId = null, song = null, mine = false, setupOk = true, migrate = false;
  let finding = false, picking = null, busy = false, timer = 0, watch = 0, audio = null;
  const msg = (t, err) => { el.msg.textContent = t || ''; el.msg.classList.toggle('err', !!err); };
  const FIX = 'sarki-youtube-kurulum.sql ve sarki-bolum-kurulum.sql dosyalarını Supabase SQL Editor\'de bir kez çalıştır.';

  // ---------- Çalma: sadece 20 saniyelik bölüm; video görünmez ----------
  function stopPlay(){
    clearTimeout(timer); clearInterval(watch); timer = watch = 0;
    el.hid.textContent = '';                                   // iframe kalkınca ses durur
    if(audio){ audio.pause(); audio = null; }
    el.bar.style.transition = 'none'; el.bar.style.width = '0';
    card.classList.remove('playing'); el.btn.setAttribute('aria-label', 'Çal');
  }
  function playClip(s){
    stopPlay();
    card.classList.add('playing'); el.btn.setAttribute('aria-label', 'Durdur');
    if(s.id){
      const st = Math.max(0, Math.floor(s.start || 0));
      const f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + s.id + '?autoplay=1&controls=0&rel=0&playsinline=1&start=' + st + '&end=' + (st + CLIP);
      f.allow = 'autoplay; encrypted-media'; f.title = s.title || 'Şarkı';
      el.hid.appendChild(f);
    } else if(s.url){
      audio = new Audio(s.url); audio.play().catch(() => { msg('Şarkı çalınamadı.', true); stopPlay(); });
    }
    void el.bar.offsetWidth;
    el.bar.style.transition = 'width ' + CLIP + 's linear'; el.bar.style.width = '100%';
    timer = setTimeout(stopPlay, CLIP * 1000 + 600);
    watch = setInterval(() => { if(pv.getClientRects().length === 0) stopPlay(); }, 1200);   // profil ekranından çıkılınca sus
  }
  el.btn.addEventListener('click', () => { if(card.classList.contains('playing')) stopPlay(); else if(song) playClip(song); });

  // ---------- Görünüm ----------
  function render(){
    const adding = finding || !!picking;
    card.hidden = !(song || mine);
    el.player.hidden = !song;
    el.own.hidden = !mine || !setupOk || adding;
    el.find.hidden = !finding;
    el.clip.hidden = !picking;
    el.pick.textContent = song ? 'Şarkıyı değiştir' : 'Şarkı ekle';
    el.del.hidden = !song;
    if(song) el.title.textContent = song.title;
  }
  const setBusy = on => { busy = on; [el.pick, el.del, el.go, el.cancel, el.saveB, el.backB].forEach(b => { b.disabled = on; }); };
  const legacyUrl = row => supabase.storage.from(BUCKET).getPublicUrl(row.path).data.publicUrl + '?v=' + encodeURIComponent(row.updated_at);

  async function load(id){
    const my = ++token;
    stopPlay();
    song = null; finding = false; picking = null; setupOk = true; migrate = false; msg(''); el.res.textContent = '';
    render();
    try {
      let r = await supabase.from('profile_songs').select('title,path,video_id,start_sec,updated_at').eq('user_id', id).maybeSingle();
      if(r.error){   // yeni sütunlar henüz yoksa eski şemayla oku (şarkılar görünsün)
        r = await supabase.from('profile_songs').select('title,path,updated_at').eq('user_id', id).maybeSingle();
        if(r.error) throw r.error;
        migrate = true;
      }
      if(my !== token) return;
      const d = r.data;
      if(d) song = d.video_id && ID_RE.test(d.video_id) ? { title: d.title, id: d.video_id, start: d.start_sec || 0 }
                 : d.path ? { title: d.title, id: null, path: d.path, url: legacyUrl(d) } : null;
      if(migrate && mine) msg('Şarkı bölümü için ' + FIX, true);
    } catch(_){
      if(my !== token) return;
      setupOk = false; song = null;
      if(mine) msg('Şarkı özelliği henüz kurulmadı: ' + FIX, true);
    }
    render();
  }

  function onProfile(){
    const p = window.__lefProfile; if(!p || !p.id) return;
    attach();
    mine = !!p.mine;
    if(p.id !== lastId){ lastId = p.id; load(p.id); } else render();
  }
  window.addEventListener('lef-profile', onProfile);
  onProfile();

  // ---------- Arama ----------
  async function userId(){
    const { data: { session } } = await supabase.auth.getSession();
    if(!session) throw new Error('Oturum bulunamadı.');
    return session.user.id;
  }
  function explain(e){
    const t = (e && e.message) || '';
    if(/row-level|policy|relation|does not exist|schema cache|column|check constraint|violates/i.test(t)) return 'Kurulum eksik görünüyor: ' + FIX;
    return 'İşlem tamamlanamadı. Biraz sonra tekrar dene.';
  }
  function showResults(list){
    el.res.textContent = '';
    list.forEach(s => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'ps-it'; b.setAttribute('role', 'listitem');
      const im = document.createElement('img'); im.alt = ''; im.loading = 'lazy'; im.referrerPolicy = 'no-referrer'; im.src = thumb(s.id);
      const box = document.createElement('div'), t = document.createElement('b'), c = document.createElement('span');
      t.textContent = s.title; c.textContent = s.by || '';
      box.append(t, c); b.append(im, box);
      b.addEventListener('click', () => choose(s.id, s.title));
      el.res.appendChild(b);
    });
  }
  async function search(){
    if(busy) return;
    const text = el.input.value.trim();
    if(!text){ msg('Bir şarkı veya sanatçı adı yaz.', true); return; }
    const direct = ytId(text);
    if(direct){                                   // link yapıştırıldı: aramadan doğrudan bölüm seçmeye geç
      setBusy(true); msg('Şarkı bilgisi alınıyor…');
      const t = await titleOf(direct);
      setBusy(false);
      await choose(direct, t || 'YouTube şarkısı');
      return;
    }
    setBusy(true); msg('YouTube\'da aranıyor…'); el.res.textContent = '';
    try {
      const list = await searchYT(text);
      if(!list.length) msg('Sonuç bulunamadı. Başka bir yazılışla dene.', true);
      else { msg(''); showResults(list); }
    } catch(_){
      msg('Arama şu an yapılamadı. Biraz sonra tekrar dene ya da YouTube linkini yapıştır.', true);
    }
    setBusy(false);
  }

  // ---------- 20 saniyelik bölüm seçimi ----------
  function updRange(){
    const s = +el.range.value;
    picking.start = s;
    el.clR.textContent = mmss(s) + ' – ' + mmss(s + CLIP);
  }
  async function choose(id, title){
    stopPlay(); msg('Şarkı süresi alınıyor…');
    const dur = await durationOf(id);               // anahtar yoksa bilinmez: 10 dakikaya kadar kaydırılabilir
    const max = Math.max(0, (dur || 600) - CLIP);
    picking = { id, title, start: 0 }; finding = false;
    el.clT.textContent = title;
    el.range.max = String(max); el.range.value = '0';
    el.range.disabled = max === 0;
    updRange(); msg(dur ? '' : 'Şarkı süresi öğrenilemedi; kaydırıcı 10 dakikaya kadar gider.');
    render();
  }
  el.range.addEventListener('input', () => { if(picking){ updRange(); if(card.classList.contains('playing')) stopPlay(); } });

  async function save(){
    if(busy || !picking) return;
    const my = token, p = picking, old = song && !song.id ? song.path : null;
    stopPlay(); setBusy(true); msg('Kaydediliyor…');
    try {
      const uid = await userId();
      const row = { user_id: uid, title: String(p.title).trim().slice(0, 120) || 'YouTube şarkısı', video_id: p.id, start_sec: p.start | 0, path: null, updated_at: new Date().toISOString() };
      const r = await supabase.from('profile_songs').upsert(row);
      if(r.error) throw r.error;
      if(old) supabase.storage.from(BUCKET).remove([old]).catch(() => {});   // eski MP3 dosyası silinemese de sorun değil
      if(my === token){ song = { title: row.title, id: p.id, start: row.start_sec }; picking = null; finding = false; el.res.textContent = ''; el.input.value = ''; msg('Şarkın eklendi.'); }
    } catch(err){ if(my === token) msg(explain(err), true); }
    setBusy(false); render();
  }

  card.addEventListener('click', async e => {
    const b = e.target.closest('[data-a]'); if(!b || busy || !mine) return;
    const a = b.dataset.a;
    if(a === 'pick'){ finding = true; picking = null; msg(''); render(); el.input.focus(); return; }
    if(a === 'cancel'){ finding = false; el.res.textContent = ''; msg(''); render(); return; }
    if(a === 'go'){ search(); return; }
    if(a === 'try'){ if(picking){ if(card.classList.contains('playing')) stopPlay(); else playClip({ id: picking.id, start: picking.start, title: picking.title }); } return; }
    if(a === 'back'){ stopPlay(); picking = null; finding = true; msg(''); render(); return; }
    if(a === 'save'){ save(); return; }
    if(a === 'del'){
      if(!song || !window.confirm('Profil şarkın kaldırılsın mı?')) return;
      const my = token, path = song.id ? null : song.path;
      setBusy(true); msg('Kaldırılıyor…');
      try {
        const uid = await userId();
        const r = await supabase.from('profile_songs').delete().eq('user_id', uid);
        if(r.error) throw r.error;
        if(path) supabase.storage.from(BUCKET).remove([path]).catch(() => {});
        if(my === token){ stopPlay(); song = null; msg('Şarkı kaldırıldı.'); }
      } catch(err){ if(my === token) msg(explain(err), true); }
      setBusy(false); render();
    }
  });
  el.input.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); search(); } });
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
