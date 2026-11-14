/* ============================================================
   EN SEVİLDİĞİM ŞARKI (profil şarkısı): MP3 yüklemek yerine YouTube'dan aranır.
   - Profilin sahibi "Şarkı ekle" der, şarkı/sanatçı adını yazar, çıkan sonuçlardan birine dokunur.
     (İstersen YouTube linkini yapıştırarak da ekleyebilir.)
   - Şarkı kartı profil sayfasında (biyografinin altında) görünür. Başkaları kapak resmine
     dokununca YouTube oynatıcısı açılır (otomatik çalmaz). Profil ekranından çıkılınca durur.
   - Veriler: profile_songs tablosu (title, video_id). Eski MP3'ler çalmaya devam eder.
   - Kurulum: sarki-youtube-kurulum.sql Supabase SQL Editor'de BİR KEZ çalıştırılır.
   - ARAMA: config.js'e `export const YOUTUBE_API_KEY = '...';` eklenirse resmi YouTube Data API
     kullanılır (en güvenilir yol). Anahtar yoksa herkese açık Piped sunucularına düşer.
   - config.js bu dosyayı kendisi yükler; app.html'ye ekleme gerekmez.
   ============================================================ */
import { supabase } from './config.js';
import * as CFG from './config.js';

const BUCKET = 'profile-songs';                       // eski MP3 şarkılar için
const YT_KEY = (CFG && CFG.YOUTUBE_API_KEY) || '';
const PIPED = ['https://pipedapi.kavin.rocks', 'https://pipedapi.adminforge.de', 'https://api.piped.private.coffee'];
const ID_RE = /^[A-Za-z0-9_-]{11}$/;
const thumb = id => 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg';

const CSS = `
.ps-card{ margin:14px; padding:14px; border-radius:16px; color:#e5e7eb;
  border:1px solid color-mix(in srgb,var(--pf-a,#9db8ff) 35%,rgba(255,255,255,.12));
  background:linear-gradient(160deg,color-mix(in srgb,var(--pf-a,#9db8ff) 8%,transparent),rgba(255,255,255,.03)); }
.ps-card[hidden],.ps-card [hidden]{ display:none !important; }
.ps-head{ margin-bottom:10px; font-size:12px; font-weight:600; color:#9ca3af; }
.ps-video{ position:relative; width:100%; aspect-ratio:16/9; border-radius:12px; overflow:hidden; background:#000; }
.ps-cover{ position:absolute; inset:0; width:100%; height:100%; padding:0; border:0; cursor:pointer; background:#000; }
.ps-cover img{ width:100%; height:100%; object-fit:cover; display:block; opacity:.92; }
.ps-cover .ps-ico{ position:absolute; left:50%; top:50%; width:56px; height:56px; margin:-28px 0 0 -28px; border-radius:50%;
  display:grid; place-items:center; background:var(--pf-a,#9db8ff); color:#0b0b0f; box-shadow:0 6px 22px rgba(0,0,0,.5); }
.ps-cover:focus-visible{ outline:2px solid #fff; outline-offset:-2px; }
.ps-video iframe{ position:absolute; inset:0; width:100%; height:100%; border:0; }
.ps-title{ margin-top:10px; font-size:15px; font-weight:600; overflow-wrap:anywhere; }
.ps-aud{ width:100%; margin-top:2px; }
.ps-empty{ font-size:13px; color:#9ca3af; }
.ps-own,.ps-q{ display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:12px; }
.ps-in{ flex:1 1 160px; min-width:0; padding:9px 11px; border-radius:10px; border:1.5px solid rgba(255,255,255,.14);
  background:rgba(255,255,255,.06); color:#fff; font:inherit; font-size:14px; }
.ps-res{ display:flex; flex-direction:column; gap:6px; margin-top:10px; max-height:340px; overflow:auto; }
.ps-it{ display:flex; align-items:center; gap:10px; width:100%; padding:6px; border-radius:12px; text-align:left; cursor:pointer; font:inherit;
  color:#e5e7eb; border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.04); }
.ps-it:hover,.ps-it:focus-visible{ background:rgba(255,255,255,.1); }
.ps-it img{ flex:none; width:96px; aspect-ratio:16/9; object-fit:cover; border-radius:8px; background:#000; }
.ps-it b{ display:block; font-size:13px; font-weight:600; line-height:1.3; }
.ps-it span{ display:block; margin-top:2px; font-size:12px; color:#9ca3af; }
.ps-msg{ min-height:18px; margin-top:10px; font-size:13px; color:#9ca3af; }
.ps-msg.err{ color:#ffb3b3; }
`;

const ICON_PLAY = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';

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
  if(YT_KEY){   // resmi YouTube Data API (anahtarı Google Cloud'da HTTP referrer ile siteye kilitle)
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
    if(j && j.title) return { title: String(j.title), by: j.author_name || '' };
  } catch(_){}
  return null;
}

function init(){
  const pv = document.getElementById('v-profil');
  const head = pv && pv.querySelector('.pf-head');
  if(!pv || !head) return;   // bu sayfada profil yok (login, açılış vb.)

  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);

  const card = document.createElement('section');
  card.className = 'ps-card'; card.hidden = true; card.setAttribute('aria-label', 'En sevdiğim şarkı');
  card.innerHTML =
    '<div class="ps-head">♪ En sevdiğim şarkı</div>' +
    '<div class="ps-player" hidden>' +
      '<div class="ps-video" hidden><button type="button" class="ps-cover" aria-label="Şarkıyı çal"><img alt="" referrerpolicy="no-referrer"><span class="ps-ico">' + ICON_PLAY + '</span></button></div>' +
      '<audio class="ps-aud" controls preload="none" hidden></audio>' +
      '<div class="ps-title"></div>' +
    '</div>' +
    '<div class="ps-empty" hidden>En sevdiğin şarkıyı henüz eklemedin. YouTube\'dan ara, profiline koy, herkes görsün.</div>' +
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
    '<div class="ps-msg" role="status"></div>';

  const q = s => card.querySelector(s);
  const el = {
    player: q('.ps-player'), video: q('.ps-video'), cover: q('.ps-cover'), coverImg: q('.ps-cover img'), aud: q('.ps-aud'),
    title: q('.ps-title'), empty: q('.ps-empty'), own: q('.ps-own'), pick: q('[data-a=pick]'), del: q('[data-a=del]'),
    find: q('.ps-find'), input: q('.ps-in'), go: q('[data-a=go]'), cancel: q('[data-a=cancel]'), res: q('.ps-res'), msg: q('.ps-msg')
  };

  // Kartı profil sayfasına yerleştir (sayfa yeniden çizilirse olaylarda tekrar takılır)
  function attach(){
    if(card.isConnected) return;
    const bio = pv.querySelector('.bio');
    if(bio && !head.contains(bio)) bio.after(card); else head.after(card);
  }

  let token = 0, lastId = null, song = null, mine = false, setupOk = true, migrate = false, finding = false, busy = false, watch = 0;
  const msg = (t, err) => { el.msg.textContent = t || ''; el.msg.classList.toggle('err', !!err); };
  const FIX = 'sarki-youtube-kurulum.sql dosyasını Supabase SQL Editor\'de bir kez çalıştır.';

  // ---------- Oynatıcı ----------
  function stopVideo(){
    clearInterval(watch); watch = 0;
    const f = el.video.querySelector('iframe'); if(f) f.remove();    // iframe kalkinca ses durur
    el.cover.hidden = false;
    el.aud.pause();
  }
  function playVideo(){
    if(!song || !song.id || el.video.querySelector('iframe')) return;
    const f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + song.id + '?autoplay=1&rel=0&playsinline=1';
    f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true; f.title = song.title;
    el.cover.hidden = true; el.video.appendChild(f);
    clearInterval(watch);
    watch = setInterval(() => { if(pv.getClientRects().length === 0) stopVideo(); }, 1200);   // profil ekranından çıkılınca sus
  }
  el.cover.addEventListener('click', playVideo);

  // ---------- Görünüm ----------
  function render(){
    card.hidden = !(song || mine);
    el.player.hidden = !song;
    el.video.hidden = !(song && song.id);
    el.aud.hidden = !(song && !song.id && song.url);
    el.empty.hidden = !!song || !mine || !setupOk || finding;
    el.own.hidden = !mine || !setupOk || finding;
    el.find.hidden = !finding;
    el.pick.textContent = song ? 'Şarkıyı değiştir' : 'Şarkı ekle';
    el.del.hidden = !song;
    if(song){
      el.title.textContent = song.title;
      if(song.id){ if(el.coverImg.dataset.id !== song.id){ el.coverImg.dataset.id = song.id; el.coverImg.src = thumb(song.id); } }
      else if(el.aud.getAttribute('src') !== song.url) el.aud.src = song.url;
    }
  }
  const setBusy = on => { busy = on; [el.pick, el.del, el.go, el.cancel].forEach(b => { b.disabled = on; }); };
  const legacyUrl = row => supabase.storage.from(BUCKET).getPublicUrl(row.path).data.publicUrl + '?v=' + encodeURIComponent(row.updated_at);

  async function load(id){
    const my = ++token;
    stopVideo(); el.aud.pause(); el.aud.removeAttribute('src');
    song = null; finding = false; setupOk = true; migrate = false; msg(''); el.res.textContent = '';
    delete el.coverImg.dataset.id;
    render();
    try {
      let r = await supabase.from('profile_songs').select('title,path,video_id,updated_at').eq('user_id', id).maybeSingle();
      if(r.error){   // video_id sütunu henüz yoksa eski şemayla oku (eski MP3'ler görünsün)
        r = await supabase.from('profile_songs').select('title,path,updated_at').eq('user_id', id).maybeSingle();
        if(r.error) throw r.error;
        migrate = true;
      }
      if(my !== token) return;
      const d = r.data;
      if(d) song = d.video_id && ID_RE.test(d.video_id) ? { title: d.title, id: d.video_id }
                 : d.path ? { title: d.title, id: null, path: d.path, url: legacyUrl(d) } : null;
      if(migrate && mine) msg('Şarkı araması için ' + FIX, true);
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
      b.addEventListener('click', () => save(s.id, s.title));
      el.res.appendChild(b);
    });
  }
  async function search(){
    if(busy) return;
    const text = el.input.value.trim();
    if(!text){ msg('Bir şarkı veya sanatçı adı yaz.', true); return; }
    const direct = ytId(text);
    if(direct){                                   // link yapıştırıldı: aramadan doğrudan ekle
      setBusy(true); msg('Şarkı bilgisi alınıyor…');
      const info = await titleOf(direct);
      setBusy(false);
      await save(direct, info ? info.title : 'YouTube şarkısı');
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
  async function save(id, title){
    if(busy) return;
    const my = token, old = song && !song.id ? song.path : null;
    setBusy(true); msg('Kaydediliyor…');
    try {
      const uid = await userId();
      const row = { user_id: uid, title: String(title).trim().slice(0, 120) || 'YouTube şarkısı', video_id: id, path: null, updated_at: new Date().toISOString() };
      const r = await supabase.from('profile_songs').upsert(row);
      if(r.error) throw r.error;
      if(old) supabase.storage.from(BUCKET).remove([old]).catch(() => {});   // eski MP3 dosyası silinemese de sorun değil
      if(my === token){
        stopVideo(); song = { title: row.title, id }; finding = false; el.res.textContent = ''; el.input.value = '';
        delete el.coverImg.dataset.id; msg('Şarkın eklendi.');
      }
    } catch(err){ if(my === token) msg(explain(err), true); }
    setBusy(false); render();
  }

  card.addEventListener('click', async e => {
    const b = e.target.closest('[data-a]'); if(!b || busy || !mine) return;
    const a = b.dataset.a;
    if(a === 'pick'){ finding = true; msg(''); render(); el.input.focus(); return; }
    if(a === 'cancel'){ finding = false; el.res.textContent = ''; msg(''); render(); return; }
    if(a === 'go'){ search(); return; }
    if(a === 'del'){
      if(!song || !window.confirm('Profil şarkın kaldırılsın mı?')) return;
      const my = token, path = song.id ? null : song.path;
      setBusy(true); msg('Kaldırılıyor…');
      try {
        const uid = await userId();
        const r = await supabase.from('profile_songs').delete().eq('user_id', uid);
        if(r.error) throw r.error;
        if(path) supabase.storage.from(BUCKET).remove([path]).catch(() => {});
        if(my === token){ stopVideo(); el.aud.pause(); song = null; msg('Şarkı kaldırıldı.'); }
      } catch(err){ if(my === token) msg(explain(err), true); }
      setBusy(false); render();
    }
  });
  el.input.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); search(); } });
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
