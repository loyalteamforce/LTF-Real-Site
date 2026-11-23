/* ============================================================
   MAĞAZA: puanla rozet, banner çerçevesi ve profil teması al
   - Alt menüye "Mağaza" butonu ve kendi sayfasını ekler (ux.js bu dosyayı otomatik yükler).
   - Raflar: her ürün rafta durur, dokununca detay + "Satın al" açılır. Satın alma sunucuda yapılır
     (magaza_al fonksiyonu); puan tarayıcıda değiştirilemez.
   - Alınan ürün "Tak" ile profile uygulanır: çerçeve -> profiles.fx_cerceve, tema -> profiles.pf_tema,
     rozet -> profiles.rozet. Sahip olmadan takmayı sunucu engeller (magaza-v2-kurulum.sql).
   - Çerçeve ve tema önizlemeleri kodla çizilir (cerceve.js -> window.__crDraw, profil-tema.js -> window.__lefTema).
   - Ürün eklemek/fiyat değiştirmek: Supabase > magaza_urunler tablosu (id: cerceve-xxx / tema-xxx / rozet-xxx).
   ============================================================ */
import { supabase } from './config.js';

(function () {
  var VIEW = 'magaza';
  var app = document.getElementById('app'), bar = document.getElementById('dockBar');
  if (!app || !bar || document.getElementById('v-magaza')) return;

  // sunucu tablosu okunamazsa gösterilecek yedek liste (magaza-v2-kurulum.sql ile aynı)
  var FALLBACK = [
    ['rozet-gri-tik', 'Gri Tik', 1000], ['rozet-yildiz', 'Yıldız', 600], ['rozet-alev', 'Alev', 800], ['rozet-tac', 'Taç', 1500], ['rozet-altin-tik', 'Altın Tik', 2500],
    ['cerceve-beyaz', 'Beyaz Diken', 300], ['cerceve-kirmizi', 'Kızıl Melek', 450], ['cerceve-mavi', 'Mavi Zincir', 450], ['cerceve-kelebek', 'Gece Kelebeği', 600],
    ['cerceve-murekkep', 'Mürekkep', 600], ['cerceve-kurdele', 'Kurdele', 750], ['cerceve-dantel', 'Kızıl Dantel', 900], ['cerceve-katana', 'Kara Kılıç', 900], ['cerceve-sakura', 'Sakura Püskülü', 1000],
    ['tema-gece', 'Gece Yarısı', 800], ['tema-murekkep', 'Mürekkep Gölgesi', 800], ['tema-zumrut', 'Zümrüt Orman', 800], ['tema-sakura', 'Sakura Bahçesi', 1000], ['tema-higanbana', 'Kızıl Zambak', 1200]
  ].map(function (r) { return { id: r[0], tur: r[0].split('-')[0], ad: r[1], fiyat: r[2], aciklama: '' }; });
  var COL = { cerceve: 'fx_cerceve', tema: 'pf_tema', rozet: 'rozet' };
  var SHELF = [['rozet', 'Rozetler'], ['cerceve', 'Banner çerçeveleri'], ['tema', 'Profil temaları']];
  // SIRA ÖNEMLİ: "owned_required" mesajı "owned" kelimesini de içerir; önce daha uzun anahtar denenmeli.
  var ERR = { owned_required: 'Bunu takmak için önce satın almalısın.', insufficient: 'Yeterli puanın yok.', owned: 'Bunu zaten aldın.', not_found: 'Ürün bulunamadı.', auth: 'Oturum bulunamadı.', check: 'Sunucu bu ürünü henüz tanımıyor: magaza-v2-kurulum.sql çalıştırılmalı.' };
  var errText = function (e) { var m = (e && e.message) || ''; for (var k in ERR) if (m.indexOf(k) !== -1) return ERR[k]; return 'İşlem başarısız. İnternetini kontrol edip tekrar dene.'; };
  var fmt = function (n) { return Number(n || 0).toLocaleString('tr-TR'); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---------- Rozet simgeleri (adın yanında görünür) ---------- */
  var ROZET = {
    'gri-tik': { n: 'Gri Tik', svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#8e9097"/><path d="m7 12.5 3.4 3.4L17.2 9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
    'altin-tik': { n: 'Altın Tik', svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="rzG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a3"/><stop offset=".55" stop-color="#f0b52e"/><stop offset="1" stop-color="#b8790f"/></linearGradient></defs><path d="M12 1.5 14.6 3.6 17.9 3.2 19 6.4 22 8 21.2 11.3 22.6 14.3 20 16.4 19.5 19.7 16.2 20.1 14 22.6 11 21.3 8 22.5 6 19.9 2.7 19.2 2.5 15.8 0.6 13 2.4 10.2 2 6.8 5.1 5.5 6.9 2.7 10.2 3.2Z" fill="url(#rzG)"/><path d="m7.4 12.4 3.2 3.2 6-6.4" fill="none" stroke="#5a3a00" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
    'tac': { n: 'Taç', svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18 2 7l5.5 4L12 4l4.5 7L22 7l-1 11Z" fill="#f2c14e" stroke="#9c6b05" stroke-width="1.2" stroke-linejoin="round"/><rect x="3" y="18" width="18" height="3" rx="1" fill="#d9a12b"/><circle cx="12" cy="13.5" r="1.6" fill="#e0435f"/><circle cx="7" cy="14.5" r="1.1" fill="#6fb6ff"/><circle cx="17" cy="14.5" r="1.1" fill="#6fb6ff"/></svg>' },
    'yildiz': { n: 'Yıldız', svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 16.9 5.9 20.4l1.5-6.8L2.2 9l6.9-.7Z" fill="#ffd84a" stroke="#c98d00" stroke-width="1.1" stroke-linejoin="round"/><path d="m12 5.5 1.7 3.8" stroke="#fff6c2" stroke-width="1.3" stroke-linecap="round"/></svg>' },
    'alev': { n: 'Alev', svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22c-4.4 0-7.5-3-7.5-7 0-3.4 2.3-5.6 3.6-7.6.4 1.8 1.4 3 2.6 3.6C10.3 7.3 12 4.3 14.6 2c-.2 3.2 1.4 5 2.9 6.9 1.3 1.6 2 3.4 2 5.6 0 4.2-3.1 7.5-7.5 7.5Z" fill="#ff7a1a"/><path d="M12 21c-2.3 0-3.9-1.6-3.9-3.7 0-2 1.4-3.2 2.4-4.6.3 1 1 1.8 1.8 2.1.1-1.8 1-3.4 2.3-4.5.1 1.9.9 3 1.7 4 .6.8.9 1.7.9 2.9 0 2.2-1.6 3.8-5.2 3.8Z" fill="#ffd24a"/></svg>' }
  };

  /* ---------- CSS (raf görünümü) ---------- */
  var css = document.createElement('style');
  css.textContent = [
    '.mg2-bal{display:inline-flex;align-items:center;gap:6px;margin:8px 0 2px;padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);font-size:13px}',
    '.mg2-msg{min-height:18px;margin:6px 2px;font-size:13px;color:#ffb3b3}.mg2-msg.ok{color:#9ca3af}',
    '.mg2-h{margin:22px 4px 8px;font-size:13px;font-weight:600;letter-spacing:.04em;color:#9ca3af}',
    '.mg2-row{position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:0 6px}',
    '.mg2-row.wide{grid-template-columns:repeat(2,minmax(0,1fr))}',
    '.mg2-shelf{height:14px;margin:-4px 0 22px;border-radius:3px;background:linear-gradient(to bottom,#3a3a40,#1e1e22);box-shadow:0 14px 28px -12px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.18)}',
    '.mg2-it{display:flex;flex-direction:column;align-items:center;gap:6px;padding:0;border:none;background:transparent;color:#fff;font:inherit;cursor:pointer;min-width:0}',
    '.mg2-it:focus-visible{outline:2px solid #fff;outline-offset:4px;border-radius:12px}',
    '.mg2-art{position:relative;display:grid;place-items:center;width:100%;max-width:140px;aspect-ratio:1;margin-bottom:-2px}',
    '.wide .mg2-art{max-width:none;aspect-ratio:16/10}',
    '.mg2-art canvas{display:block;max-width:100%;filter:drop-shadow(0 8px 10px rgba(0,0,0,.55))}',
    '.mg2-art .tk{width:58%;filter:drop-shadow(0 8px 10px rgba(0,0,0,.55))}.mg2-art .tk svg{display:block;width:100%}',
    '.mg2-art .sw{border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.12)}',
    '.mg2-nm{max-width:100%;font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.mg2-pr{font-size:12px;color:#9ca3af;font-variant-numeric:tabular-nums}.mg2-pr.own{color:#7ee2a8}.mg2-pr.on{color:#ffd86b}',
    '.mg2-sh{position:fixed;inset:0;z-index:80;display:none;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.6)}',
    '.mg2-sh.on{display:flex}',
    '.mg2-card{width:min(100%,480px);max-height:92dvh;overflow-y:auto;padding:18px 18px calc(18px + env(safe-area-inset-bottom));border-radius:26px 26px 0 0;background:#0e0e10;border:1px solid rgba(255,255,255,.1);animation:mg2In .32s cubic-bezier(.2,.9,.3,1) both}',
    '@media (min-width:700px){.mg2-sh{align-items:center}.mg2-card{border-radius:26px}}',
    '@keyframes mg2In{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}',
    '.mg2-x{float:right;width:36px;height:36px;border:none;border-radius:50%;background:rgba(255,255,255,.09);color:#fff;font-size:18px;cursor:pointer}',
    '.mg2-pv{display:grid;place-items:center;gap:10px;margin:6px 0 10px;padding:10px;border-radius:18px;background:radial-gradient(circle at 50% 30%,#26262c,#101012);clear:both;overflow:hidden}',
    '.mg2-pv canvas{display:block;max-width:100%}',
    '.mg2-pv .tk{width:96px}.mg2-pv .tk svg{display:block;width:100%}',
    '.mg2-t{font-size:22px;font-weight:700;letter-spacing:-.01em}.mg2-d{margin-top:4px;font-size:14px;line-height:1.5;color:#9ca3af}',
    '.mg2-p{margin:12px 0 4px;font-size:20px;font-weight:600;font-variant-numeric:tabular-nums}',
    '.mg2-after{margin-bottom:12px;font-size:13px;color:#9ca3af}.mg2-after.bad{color:#ff9a9a}',
    '.mg2-b{display:block;width:100%;height:50px;border:none;border-radius:14px;background:#fff;color:#111;font:inherit;font-size:16px;font-weight:600;cursor:pointer}',
    '.mg2-b.sec{margin-top:8px;background:rgba(255,255,255,.09);color:#fff}',
    '.mg2-b:disabled{opacity:.45;cursor:not-allowed}',
    '.mg-tick{display:inline-block;width:.9em;height:.9em;margin-left:.3em;vertical-align:-.1em}.mg-tick svg{display:block;width:100%;height:100%}',
    '@media (prefers-reduced-motion:reduce){.mg2-card{animation:none}}'
  ].join('\n');
  document.head.appendChild(css);

  /* ---------- Sayfa ---------- */
  var sec = document.createElement('section');
  sec.className = 'view'; sec.id = 'v-magaza'; sec.setAttribute('aria-label', 'Mağaza');
  sec.innerHTML = '<h2>Mağaza</h2><span class="mg2-bal"><b id="mg2Bal">-</b> puan</span><p class="mg2-msg" id="mg2Msg" role="status"></p><div id="mg2List"></div>';
  app.appendChild(sec);
  var sheet = document.createElement('div');
  sheet.className = 'mg2-sh'; sheet.setAttribute('aria-hidden', 'true');
  sheet.innerHTML = '<div class="mg2-card" role="dialog" aria-modal="true" id="mg2Card"></div>';
  document.body.appendChild(sheet);

  /* ---------- Alt menü butonu (Profil'in soluna) ---------- */
  var btn = document.createElement('button');
  btn.className = 'dock-btn'; btn.type = 'button';
  btn.dataset.view = VIEW; btn.dataset.label = 'Mağaza'; btn.title = 'Mağaza'; btn.setAttribute('aria-label', 'Mağaza');
  btn.innerHTML = '<svg viewBox="0 0 18 18"><path d="M3.5 6h11l-.9 9h-9.2L3.5 6Z"/><path d="M6.5 6a2.5 2.5 0 0 1 5 0"/></svg>';
  bar.insertBefore(btn, bar.querySelector('.dock-btn[data-view="profil"]'));
  btn.addEventListener('click', function () { if (location.hash.slice(1) === VIEW) sync(); else location.hash = VIEW; });

  var $ = function (id) { return document.getElementById(id); };
  var balEl = $('mg2Bal'), msgEl = $('mg2Msg'), listEl = $('mg2List'), card = $('mg2Card');
  var items = FALLBACK.slice(), owned = {}, equipped = { cerceve: null, tema: null, rozet: null }, uid = null, bal = null, loading = false, setup = true;

  function setMsg(t, ok) { msgEl.textContent = t || ''; msgEl.classList.toggle('ok', !!ok); }
  function setBal(n) { bal = Number(n); balEl.textContent = fmt(bal); }
  window.addEventListener('lef-wallet', function (e) { if (e.detail) setBal(e.detail.balance); if (sheet.classList.contains('on')) fillSheet(curItem); });
  // ürün kimliği -> { tur, k }: 'cerceve-sakura' -> { tur: 'cerceve', k: 'sakura' }
  var parse = function (it) { var i = it.id.indexOf('-'), t = it.id.slice(0, i); return COL[t] ? { tur: t, k: it.id.slice(i + 1) } : { tur: t, k: null }; };

  /* ---------- Görseller ---------- */
  function artEl(it, big) {
    var p = parse(it), box = document.createElement('div');
    if (p.tur === 'rozet') { box.className = 'tk'; box.innerHTML = (ROZET[p.k] || ROZET['gri-tik']).svg; return box; }
    var c = document.createElement('canvas');
    if (p.tur === 'cerceve' && window.__crDraw) window.__crDraw.preview(c, p.k, big ? 420 : 160, big ? 250 : 120);
    else if (p.tur === 'tema' && window.__lefTema) { c.className = 'sw'; window.__lefTema.swatch(c, p.k, big ? 200 : 120, big ? 300 : 150); }
    return c;
  }
  function priceTxt(it) {
    var p = parse(it);
    if (owned[it.id]) return p.k && equipped[p.tur] === p.k ? '<span class="mg2-pr on">Takılı</span>' : '<span class="mg2-pr own">Sende</span>';
    return '<span class="mg2-pr">' + fmt(it.fiyat) + ' puan</span>';
  }
  function shelf(label, list, wide) {
    if (!list.length) return;
    var h = document.createElement('p'); h.className = 'mg2-h'; h.textContent = label; listEl.appendChild(h);
    var per = wide ? 2 : 3;
    for (var i = 0; i < list.length; i += per) {
      var r = document.createElement('div'); r.className = 'mg2-row' + (wide ? ' wide' : '');
      list.slice(i, i + per).forEach(function (it) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'mg2-it'; b.setAttribute('aria-label', it.ad + ', ' + it.fiyat + ' puan');
        var a = document.createElement('span'); a.className = 'mg2-art'; a.appendChild(artEl(it)); b.appendChild(a);
        b.insertAdjacentHTML('beforeend', '<span class="mg2-nm">' + esc(it.ad) + '</span>' + priceTxt(it));
        b.addEventListener('click', function () { openSheet(it); });
        r.appendChild(b);
      });
      listEl.appendChild(r);
      var s = document.createElement('div'); s.className = 'mg2-shelf'; s.setAttribute('aria-hidden', 'true'); listEl.appendChild(s);
    }
  }
  function render() {
    listEl.replaceChildren();
    SHELF.forEach(function (sh) { shelf(sh[1], items.filter(function (i) { return i.tur === sh[0]; }), sh[0] === 'cerceve'); });
  }

  /* ---------- Yükleme ---------- */
  async function load() {
    if (loading) return; loading = true;
    try {
      var s = await supabase.auth.getSession(); uid = s.data.session ? s.data.session.user.id : null;
      var r = await supabase.from('magaza_urunler').select('id,tur,ad,fiyat,aciklama,sira').eq('aktif', true).order('sira');
      if (!r.error && r.data && r.data.length) { items = r.data.filter(function (i) { return SHELF.some(function (s) { return s[0] === i.tur; }); }); setup = true; }
      else if (!uid) { setup = false; setMsg('Mağazayı kullanmak için giriş yapmalısın.'); }
      else { setup = false; setMsg('Mağaza şu an yüklenemedi. Biraz sonra tekrar dene.'); }
      if (uid && setup) {
        var o = await supabase.from('magaza_sahip').select('urun_id').eq('user_id', uid);
        owned = {}; (o.data || []).forEach(function (x) { owned[x.urun_id] = 1; });
        var p = await supabase.from('profiles').select('fx_cerceve,pf_tema,rozet').eq('id', uid).maybeSingle();
        if (p.data) equipped = { cerceve: p.data.fx_cerceve || null, tema: p.data.pf_tema || null, rozet: p.data.rozet || null };
      }
      if (window.__lefWallet) { if (window.__lefWallet.balance !== null && window.__lefWallet.balance !== undefined) setBal(window.__lefWallet.balance); window.__lefWallet.refresh && window.__lefWallet.refresh(); }
    } catch (e) { setMsg('Mağaza yüklenemedi. İnternetini kontrol et.'); }
    loading = false; render();
  }

  /* ---------- Detay paneli ---------- */
  var curItem = null;
  function openSheet(it) { curItem = it; sheet.classList.add('on'); sheet.setAttribute('aria-hidden', 'false'); fillSheet(it); }
  function closeSheet() { sheet.classList.remove('on'); sheet.setAttribute('aria-hidden', 'true'); curItem = null; }
  sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet.classList.contains('on')) closeSheet(); });

  function fillSheet(it) {
    if (!it) return;
    var p = parse(it), has = !!owned[it.id], left = (bal === null ? 0 : bal) - it.fiyat, can = bal !== null && left >= 0, act;
    if (has && p.k) act = equipped[p.tur] === p.k
      ? '<button type="button" class="mg2-b" data-a="off">Çıkar</button>'
      : '<button type="button" class="mg2-b" data-a="on">Tak</button>';
    else if (has) act = '<button type="button" class="mg2-b" disabled>Sende</button>';
    else act = '<button type="button" class="mg2-b" data-a="buy"' + (can && setup && uid ? '' : ' disabled') + '>Satın al · ' + fmt(it.fiyat) + ' puan</button>';
    card.innerHTML =
      '<button type="button" class="mg2-x" data-a="x" aria-label="Kapat">×</button>' +
      '<div class="mg2-pv" id="mg2Pv"></div>' +
      '<div class="mg2-t">' + esc(it.ad) + '</div><p class="mg2-d">' + esc(it.aciklama || '') + '</p>' +
      (has ? '' : '<div class="mg2-p">' + fmt(it.fiyat) + ' puan</div><div class="mg2-after' + (can ? '' : ' bad') + '">' + (bal === null ? '' : can ? 'Alınca kalan: ' + fmt(left) + ' puan' : 'Yeterli puanın yok (' + fmt(bal) + ' puan)') + '</div>') +
      '<p class="mg2-msg" id="mg2Err" role="status"></p>' + act +
      (has && p.k ? '<button type="button" class="mg2-b sec" data-a="pf">Profilimde gör</button>' : '');
    $('mg2Pv').appendChild(artEl(it, true));
  }
  card.addEventListener('click', async function (e) {
    var b = e.target.closest('[data-a]'); if (!b || !curItem) return;
    var a = b.dataset.a, it = curItem, p = parse(it);
    if (a === 'x') { closeSheet(); return; }
    if (a === 'pf') { closeSheet(); location.hash = 'profil'; return; }
    b.disabled = true;
    try {
      if (!uid) throw { message: 'auth' };
      if (a === 'buy') {
        var err = $('mg2Err'); err.textContent = 'Satın alınıyor…'; err.classList.add('ok');
        var r = await supabase.rpc('magaza_al', { p_urun: it.id });
        if (r.error) throw r.error;
        owned[it.id] = 1; setBal(r.data);
        window.dispatchEvent(new CustomEvent('lef-wallet', { detail: { balance: Number(r.data) } }));
        setMsg(it.ad + ' satın alındı. Takmak için "Tak"a bas.', true); render(); fillSheet(it);
      } else if (a === 'on' || a === 'off') {
        var v = a === 'on' ? p.k : null, upd = {}; upd[COL[p.tur]] = v;
        var u = await supabase.from('profiles').update(upd).eq('id', uid);
        if (u.error) throw u.error;
        equipped[p.tur] = v; notifySaved(p.tur, v); render(); fillSheet(it);
        setMsg(a === 'on' ? it.ad + ' takıldı.' : it.ad + ' çıkarıldı.', true);
      }
    } catch (x) { var e2 = $('mg2Err'); if (e2) { e2.classList.remove('ok'); e2.textContent = errText(x); } b.disabled = false; }
  });
  // profilde açık olan modüllerin önbelleğini güncelle: sayfayı yenilemeden yeni seçim görünür
  function notifySaved(tur, v) {
    if (tur === 'cerceve' && window.__lefCerceve) window.__lefCerceve.saved(uid, v);
    if (tur === 'tema' && window.__lefTema) window.__lefTema.saved(uid, v);
    if (tur === 'rozet') { rozetCache[uid] = v; paintRozet(); }
  }

  /* ---------- Rozet: profil adının yanında ---------- */
  var rozetCache = {}, preview = undefined;
  async function rozetOf(id) {
    if (Object.prototype.hasOwnProperty.call(rozetCache, id)) return rozetCache[id];
    try { var r = await supabase.from('profiles').select('rozet').eq('id', id).maybeSingle(); rozetCache[id] = !r.error && r.data ? r.data.rozet || null : null; }
    catch (e) { rozetCache[id] = null; }
    return rozetCache[id];
  }
  async function paintRozet() {
    var P = window.__lefProfile, n = document.getElementById('pfNick'); if (!P || !n) return;
    var k = preview !== undefined && P.mine ? preview : await rozetOf(P.id);
    if (window.__lefProfile !== P) return;
    n.parentNode.querySelectorAll('.mg-tick').forEach(function (x) { x.remove(); });
    if (k && ROZET[k]) { var s = document.createElement('span'); s.className = 'mg-tick'; s.title = ROZET[k].n; s.innerHTML = ROZET[k].svg; n.after(s); }
  }
  window.addEventListener('lef-profile', paintRozet); paintRozet();
  window.__lefRozet = {
    ROZET: ROZET,
    preview: function (k) { preview = k || null; paintRozet(); },
    restore: function () { preview = undefined; paintRozet(); },
    saved: function (id, k) { rozetCache[id] = k || null; preview = undefined; paintRozet(); }
  };

  /* ---------- Sekme geçişi ---------- */
  function sync() {
    var on = location.hash.slice(1) === VIEW;
    if (on) {
      document.querySelectorAll('.view').forEach(function (v) { v.classList.toggle('on', v === sec); });
      document.querySelectorAll('.dock-btn').forEach(function (b) { if (b === btn) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
      window.scrollTo(0, 0); setMsg(''); load();
    } else { sec.classList.remove('on'); btn.removeAttribute('aria-current'); closeSheet(); }
    if (window.__dockShow) window.__dockShow();
    if (window.__dockInd) window.__dockInd(false);
  }
  window.addEventListener('hashchange', sync);
  if (window.__dockInd) window.__dockInd(true);
  render(); sync();
})();
