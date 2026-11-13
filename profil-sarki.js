/* ============================================================
   EN SEVİLEN ŞARKI (profil şarkısı): her üye profiline kendi MP3'ünü ekler.
   - Şarkı kartı profil sayfasında (biyografinin altında) görünür.
   - Başkaları profile bakınca şarkıyı çalabilir (otomatik çalmaz).
   - Sadece profilin sahibi MP3 ekleyebilir, değiştirebilir, kaldırabilir.
   - Veriler: profile_songs tablosu + profile-songs depolama kovası
     (sarki-kurulum.sql ile bir kez kurulur).
   - config.js bu dosyayı kendisi yükler; app.html'ye ekleme gerekmez.
   ============================================================ */
import { supabase } from './config.js';

const BUCKET = 'profile-songs';
const MAX_BYTES = 6 * 1024 * 1024;   // sarki-kurulum.sql'deki sınırla aynı olmalı

const CSS = `
.ps-card{ margin:14px; padding:14px; border-radius:16px; color:#e5e7eb;
  border:1px solid color-mix(in srgb,var(--pf-a,#9db8ff) 35%,rgba(255,255,255,.12));
  background:linear-gradient(160deg,color-mix(in srgb,var(--pf-a,#9db8ff) 8%,transparent),rgba(255,255,255,.03)); }
.ps-card[hidden],.ps-card [hidden]{ display:none !important; }
.ps-head{ margin-bottom:10px; font-size:12px; font-weight:600; color:#9ca3af; }
.ps-row{ display:flex; align-items:center; gap:12px; }
.ps-play{ flex:none; width:46px; height:46px; border-radius:50%; border:0; display:grid; place-items:center; cursor:pointer;
  background:var(--pf-a,#9db8ff); color:#0b0b0f; }
.ps-play:focus-visible{ outline:2px solid #fff; outline-offset:2px; }
.ps-mid{ flex:1; min-width:0; }
.ps-title{ font-size:15px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ps-seek{ width:100%; margin:6px 0 0; accent-color:var(--pf-a,#9db8ff); }
.ps-time{ display:flex; justify-content:space-between; font-size:11px; color:#9ca3af; font-variant-numeric:tabular-nums; }
.ps-empty{ font-size:13px; color:#9ca3af; }
.ps-own,.ps-form{ display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:12px; }
.ps-name{ flex:1 1 160px; min-width:0; padding:9px 11px; border-radius:10px; border:1.5px solid rgba(255,255,255,.14);
  background:rgba(255,255,255,.06); color:#fff; font:inherit; font-size:14px; }
.ps-msg{ min-height:18px; margin-top:10px; font-size:13px; color:#9ca3af; }
.ps-msg.err{ color:#ffb3b3; }
`;

const ICON_PLAY  = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';

const fmt = s => {
  if(!isFinite(s) || s < 0) return '0:00';
  s = Math.floor(s);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};

function init(){
  const pv = document.getElementById('v-profil');
  const head = pv && pv.querySelector('.pf-head');
  if(!pv || !head) return;   // bu sayfada profil yok (login, açılış vb.)

  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);

  const card = document.createElement('section');
  card.className = 'ps-card'; card.hidden = true; card.setAttribute('aria-label', 'En sevilen şarkı');
  card.innerHTML =
    '<div class="ps-head">♪ En sevdiğim şarkı</div>' +
    '<div class="ps-row ps-player" hidden>' +
      '<button type="button" class="ps-play" aria-label="Çal"></button>' +
      '<div class="ps-mid"><div class="ps-title"></div>' +
        '<input class="ps-seek" type="range" min="0" max="1000" value="0" aria-label="Şarkı konumu">' +
        '<div class="ps-time"><span class="ps-cur">0:00</span><span class="ps-dur">0:00</span></div></div>' +
    '</div>' +
    '<div class="ps-empty" hidden>En sevdiğin şarkıyı henüz eklemedin. Bir MP3 yükleyip profiline koy, herkes görsün.</div>' +
    '<div class="ps-own" hidden>' +
      '<button type="button" class="bio-btn" data-a="pick">Şarkı ekle</button>' +
      '<button type="button" class="bio-btn" data-a="del" hidden>Kaldır</button>' +
    '</div>' +
    '<div class="ps-form" hidden>' +
      '<input class="ps-name" type="text" maxlength="60" placeholder="Şarkı adı" aria-label="Şarkı adı">' +
      '<button type="button" class="bio-btn pri" data-a="up">Yükle</button>' +
      '<button type="button" class="bio-btn" data-a="cancel">Vazgeç</button>' +
    '</div>' +
    '<input type="file" class="ps-file" accept=".mp3,audio/mpeg" hidden>' +
    '<div class="ps-msg" role="status"></div>';

  const q = s => card.querySelector(s);
  const el = {
    player: q('.ps-player'), play: q('.ps-play'), title: q('.ps-title'), seek: q('.ps-seek'),
    cur: q('.ps-cur'), dur: q('.ps-dur'), empty: q('.ps-empty'), own: q('.ps-own'),
    pick: q('[data-a=pick]'), del: q('[data-a=del]'), form: q('.ps-form'), name: q('.ps-name'),
    up: q('[data-a=up]'), cancel: q('[data-a=cancel]'), file: q('.ps-file'), msg: q('.ps-msg')
  };

  // Kartı profil sayfasına yerleştir (sayfa yeniden çizilirse olaylarda tekrar takılır)
  function attach(){
    if(card.isConnected) return;
    const bio = pv.querySelector('.bio');
    if(bio && !head.contains(bio)) bio.after(card); else head.after(card);
  }

  let token = 0, lastId = null, song = null, mine = false, setupOk = true, pending = null, busy = false;

  const msg = (t, err) => { el.msg.textContent = t || ''; el.msg.classList.toggle('err', !!err); };

  // ---------- Çalar ----------
  const audio = new Audio();
  audio.preload = 'none';
  const setPlaying = on => {
    el.play.innerHTML = on ? ICON_PAUSE : ICON_PLAY;
    el.play.setAttribute('aria-label', on ? 'Duraklat' : 'Çal');
  };
  function stop(){
    audio.pause();
    audio.removeAttribute('src'); audio.load();
    setPlaying(false);
    el.seek.value = 0; el.cur.textContent = '0:00'; el.dur.textContent = '0:00';
  }
  el.play.addEventListener('click', () => {
    if(!song) return;
    if(!audio.paused){ audio.pause(); return; }
    if(audio.getAttribute('src') !== song.url) audio.src = song.url;
    audio.play().catch(() => msg('Şarkı çalınamadı.', true));
  });
  audio.addEventListener('play', () => { setPlaying(true); msg(''); });
  audio.addEventListener('pause', () => setPlaying(false));
  audio.addEventListener('loadedmetadata', () => { el.dur.textContent = fmt(audio.duration); });
  audio.addEventListener('timeupdate', () => {
    if(pv.getClientRects().length === 0){ audio.pause(); return; }   // profil ekranından çıkılınca sus
    if(audio.duration) el.seek.value = Math.round(audio.currentTime / audio.duration * 1000);
    el.cur.textContent = fmt(audio.currentTime);
  });
  audio.addEventListener('ended', () => { audio.currentTime = 0; el.seek.value = 0; el.cur.textContent = '0:00'; setPlaying(false); });
  audio.addEventListener('error', () => { if(audio.getAttribute('src')) msg('Şarkı yüklenemedi.', true); setPlaying(false); });
  el.seek.addEventListener('input', () => {
    if(audio.duration) audio.currentTime = el.seek.value / 1000 * audio.duration;
  });
  setPlaying(false);

  // ---------- Görünüm ----------
  function render(){
    card.hidden = !(song || mine);
    el.player.hidden = !song;
    el.empty.hidden = !!song || !mine || !setupOk;
    el.own.hidden = !mine || !setupOk;
    el.pick.textContent = song ? 'Şarkıyı değiştir' : 'Şarkı ekle';
    el.del.hidden = !song;
    el.form.hidden = !pending;
    if(song) el.title.textContent = song.title;
  }
  const setBusy = on => { busy = on; [el.pick, el.del, el.up, el.cancel].forEach(b => { b.disabled = on; }); };

  const urlFor = row => supabase.storage.from(BUCKET).getPublicUrl(row.path).data.publicUrl + '?v=' + encodeURIComponent(row.updated_at);

  async function load(id){
    const my = ++token;
    stop(); song = null; pending = null; setupOk = true; msg('');
    render();
    try {
      const { data, error } = await supabase.from('profile_songs').select('title,path,updated_at').eq('user_id', id).maybeSingle();
      if(my !== token) return;
      if(error) throw error;
      if(data) song = { title: data.title, path: data.path, url: urlFor(data) };
    } catch(_){
      if(my !== token) return;
      setupOk = false; song = null;
      if(mine) msg('Şarkı özelliği henüz kurulmadı: sarki-kurulum.sql dosyasını Supabase SQL Editor\'de bir kez çalıştır.', true);
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

  // ---------- Ekleme / değiştirme / kaldırma ----------
  async function checkFile(f){
    if(!/\.mp3$/i.test(f.name) && f.type !== 'audio/mpeg') throw new Error('Sadece MP3 dosyası yükleyebilirsin.');
    if(f.size <= 0) throw new Error('Dosya boş görünüyor.');
    if(f.size > MAX_BYTES) throw new Error('Dosya çok büyük (en fazla ' + Math.round(MAX_BYTES / 1048576) + ' MB).');
    const b = new Uint8Array(await f.slice(0, 3).arrayBuffer());
    const isId3 = b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33;          // "ID3"
    const isFrame = b[0] === 0xFF && (b[1] & 0xE0) === 0xE0;                // MP3 kare başlığı
    if(!isId3 && !isFrame) throw new Error('Bu dosya geçerli bir MP3 gibi görünmüyor.');
  }
  const defaultTitle = f => f.name.replace(/\.mp3$/i, '').replace(/[_]+/g, ' ').trim().slice(0, 60) || 'Şarkım';

  function explain(e){
    const t = (e && e.message) || '';
    if(/exceed|too large|payload|size/i.test(t)) return 'Dosya çok büyük (en fazla ' + Math.round(MAX_BYTES / 1048576) + ' MB).';
    if(/mime|type/i.test(t)) return 'Sadece MP3 yüklenebilir.';
    if(/row-level|policy|bucket|relation|does not exist|schema cache|not found/i.test(t)) return 'Kurulum eksik görünüyor: sarki-kurulum.sql çalıştırıldı mı?';
    return 'İşlem tamamlanamadı. Biraz sonra tekrar dene.';
  }

  async function userId(){
    const { data: { session } } = await supabase.auth.getSession();
    if(!session) throw new Error('Oturum bulunamadı.');
    return session.user.id;
  }

  card.addEventListener('click', async e => {
    const b = e.target.closest('[data-a]'); if(!b || busy || !mine) return;
    const a = b.dataset.a;

    if(a === 'pick'){ el.file.value = ''; el.file.click(); return; }

    if(a === 'cancel'){ pending = null; el.file.value = ''; msg(''); render(); return; }

    if(a === 'up'){
      if(!pending) return;
      const title = el.name.value.trim().slice(0, 60);
      if(!title){ msg('Şarkıya bir ad yaz.', true); return; }
      const my = token;
      setBusy(true); msg('Yükleniyor…');
      try {
        const uid = await userId();
        const path = uid + '/song.mp3';
        const up = await supabase.storage.from(BUCKET).upload(path, pending, { upsert: true, contentType: 'audio/mpeg', cacheControl: '3600' });
        if(up.error) throw up.error;
        const row = { user_id: uid, title, path, updated_at: new Date().toISOString() };
        const r = await supabase.from('profile_songs').upsert(row);
        if(r.error) throw r.error;
        if(my === token){
          stop(); song = { title, path, url: urlFor(row) };
          pending = null; el.file.value = ''; msg('Şarkın eklendi.');
        }
      } catch(err){ if(my === token) msg(explain(err), true); }
      setBusy(false); render();
      return;
    }

    if(a === 'del'){
      if(!song || !window.confirm('Profil şarkın kaldırılsın mı?')) return;
      const my = token, path = song.path;
      setBusy(true); msg('Kaldırılıyor…');
      try {
        const uid = await userId();
        const r = await supabase.from('profile_songs').delete().eq('user_id', uid);
        if(r.error) throw r.error;
        await supabase.storage.from(BUCKET).remove([path]);   // dosya silinemese bile kayıt gitti, sorun değil
        if(my === token){ stop(); song = null; msg('Şarkı kaldırıldı.'); }
      } catch(err){ if(my === token) msg(explain(err), true); }
      setBusy(false); render();
    }
  });

  el.file.addEventListener('change', async () => {
    const f = el.file.files && el.file.files[0]; if(!f) return;
    msg('');
    try { await checkFile(f); }
    catch(err){ msg(err.message, true); el.file.value = ''; return; }
    pending = f; el.name.value = defaultTitle(f);
    render(); el.name.focus();
  });
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
