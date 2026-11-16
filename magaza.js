/* ============================================================
   MAĞAZA: puanla banner çerçevesi ve gri tik al
   - Alt menüye "Mağaza" butonu ve kendi sayfasını ekler (ux.js bu dosyayı otomatik yükler).
   - Raflar: her ürün rafta durur, dokununca detay + "Satın al" açılır. Satın alma sunucuda yapılır
     (magaza_al fonksiyonu, magaza-kurulum.sql); puan tarayıcıda değiştirilemez.
   - Alınan çerçeve "Tak" ile profile uygulanır (profiles.fx_cerceve), gri tik profil adının yanında görünür.
   - Çerçeve görselleri: cr-<anahtar>-banner.png / cr-<anahtar>-avatar.png (cerceve.js ile aynı).
   ============================================================ */
import { supabase } from './config.js';

(function () {
  var VIEW = 'magaza', TICK_ID = 'rozet-gri-tik';
  var app = document.getElementById('app'), bar = document.getElementById('dockBar');
  if (!app || !bar || document.getElementById('v-magaza')) return;

  // sunucu tablosu kurulmamışsa gösterilecek yedek liste (fiyatlar magaza-kurulum.sql ile aynı)
  var FALLBACK = [
    { id: TICK_ID, tur: 'rozet', ad: 'Gri Tik', fiyat: 1000, aciklama: 'Profil adının yanında gri doğrulama işareti.' },
    { id: 'cerceve-beyaz', tur: 'cerceve', ad: 'Beyaz Diken', fiyat: 300, aciklama: 'Beyaz ince çizgili banner ve avatar çerçevesi.' },
    { id: 'cerceve-kirmizi', tur: 'cerceve', ad: 'Kızıl Melek', fiyat: 450, aciklama: 'Kızıl mağara ışıltılı çerçeve.' },
    { id: 'cerceve-mavi', tur: 'cerceve', ad: 'Mavi Zincir', fiyat: 450, aciklama: 'Mavi zincir efektli çerçeve.' },
    { id: 'cerceve-kelebek', tur: 'cerceve', ad: 'Gece Kelebeği', fiyat: 600, aciklama: 'Beyaz çizgili kelebek çerçevesi.' },
    { id: 'cerceve-murekkep', tur: 'cerceve', ad: 'Mürekkep', fiyat: 600, aciklama: 'Siyah mürekkep çizgili çerçeve.' },
    { id: 'cerceve-kurdele', tur: 'cerceve', ad: 'Kurdele', fiyat: 750, aciklama: 'Parlak kurdele şeritli çerçeve.' }
  ];
  var ERR = { insufficient: 'Yeterli puanın yok.', owned: 'Bunu zaten aldın.', not_found: 'Ürün bulunamadı.', auth: 'Oturum bulunamadı.', owned_required: 'Bu çerçeveyi önce almalısın.' };
  var errText = function (e) { var m = (e && e.message) || ''; for (var k in ERR) if (m.indexOf(k) !== -1) return ERR[k]; return 'İşlem başarısız. magaza-kurulum.sql Supabase\'te çalıştırıldı mı?'; };
  var fmt = function (n) { return Number(n || 0).toLocaleString('tr-TR'); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#8e9097"/><path d="m7 12.5 3.4 3.4L17.2 9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- CSS (raf görünümü) ---------- */
  var css = document.createElement('style');
  css.textContent = [
    '.mg2-bal{display:inline-flex;align-items:center;gap:6px;margin:8px 0 2px;padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);font-size:13px}',
    '.mg2-msg{min-height:18px;margin:6px 2px;font-size:13px;color:#ffb3b3}.mg2-msg.ok{color:#9ca3af}',
    '.mg2-h{margin:22px 4px 8px;font-size:13px;font-weight:600;letter-spacing:.04em;color:#9ca3af}',
    '.mg2-row{position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:0 6px}',
    '.mg2-shelf{height:14px;margin:-4px 0 0;border-radius:3px;background:linear-gradient(to bottom,#3a3a40,#1e1e22);box-shadow:0 14px 28px -12px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.18)}',
    '.mg2-it{display:flex;flex-direction:column;align-items:center;gap:6px;padding:0;border:none;background:transparent;color:#fff;font:inherit;cursor:pointer;min-width:0}',
    '.mg2-art{position:relative;display:grid;place-items:center;width:100%;max-width:130px;aspect-ratio:1;margin-bottom:-2px}',
    '.mg2-art img{width:118%;height:118%;max-width:none;object-fit:contain;filter:drop-shadow(0 8px 10px rgba(0,0,0,.55))}',
    '.mg2-art .tk{width:62%;filter:drop-shadow(0 8px 10px rgba(0,0,0,.55))}.mg2-art .tk svg{display:block;width:100%}',
    '.mg2-ring{position:absolute;inset:8%;border-radius:50%;background:radial-gradient(circle at 35% 30%,#2b2b31,#141417)}',
    '.mg2-nm{max-width:100%;font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.mg2-pr{font-size:12px;color:#9ca3af;font-variant-numeric:tabular-nums}.mg2-pr.own{color:#7ee2a8}.mg2-pr.on{color:#ffd86b}',
    '.mg2-sh{position:fixed;inset:0;z-index:80;display:none;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.6)}',
    '.mg2-sh.on{display:flex}',
    '.mg2-card{width:min(100%,460px);max-height:92dvh;overflow-y:auto;padding:18px 18px calc(18px + env(safe-area-inset-bottom));border-radius:26px 26px 0 0;background:#0e0e10;border:1px solid rgba(255,255,255,.1);animation:mg2In .32s cubic-bezier(.2,.9,.3,1) both}',
    '@media (min-width:700px){.mg2-sh{align-items:center}.mg2-card{border-radius:26px}}',
    '@keyframes mg2In{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}',
    '.mg2-x{float:right;width:36px;height:36px;border:none;border-radius:50%;background:rgba(255,255,255,.09);color:#fff;font-size:18px;cursor:pointer}',
    '.mg2-pv{display:grid;place-items:center;gap:10px;margin:6px 0 10px;padding:14px;border-radius:18px;background:radial-gradient(circle at 50% 30%,#26262c,#101012);clear:both}',
    '.mg2-pv img.bn{width:100%;max-height:150px;object-fit:contain}',
    '.mg2-pv img.av{width:150px;height:150px;object-fit:contain}',
    '.mg2-pv .tk{width:96px}.mg2-pv .tk svg{display:block;width:100%}',
    '.mg2-t{font-size:22px;font-weight:700;letter-spacing:-.01em}.mg2-d{margin-top:4px;font-size:14px;line-height:1.5;color:#9ca3af}',
    '.mg2-p{margin:12px 0 4px;font-size:20px;font-weight:600;font-variant-numeric:tabular-nums}',
    '.mg2-after{margin-bottom:12px;font-size:13px;color:#9ca3af}.mg2-after.bad{color:#ff9a9a}',
    '.mg2-b{display:block;width:100%;height:50px;border:none;border-radius:14px;background:#fff;color:#111;font:inherit;font-size:16px;font-weight:600;cursor:pointer}',
    '.mg2-b.sec{margin-top:8px;background:rgba(255,255,255,.09);color:#fff}',
    '.mg2-b:disabled{opacity:.45;cursor:not-allowed}',
    '@media (prefers-reduced-motion:reduce){.mg2-card{animation:none}}'
  ].join('\n');
  document.head.appendChild(css);

  /* ---------- Sayfa ---------- */
  var sec = document.createElement('section');
  sec.className = 'view'; sec.id = 'v-magaza'; sec.setAttribute('aria-label', 'Mağaza');
  sec.innerHTML =
    '<h2>Mağaza</h2>' +
    '<span class="mg2-bal"><b id="mg2Bal">-</b> puan</span>' +
    '<p class="mg2-msg" id="mg2Msg" role="status"></p>' +
    '<div id="mg2List"></div>';
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
  var prof = bar.querySelector('.dock-btn[data-view="profil"]');
  bar.insertBefore(btn, prof);
  btn.addEventListener('click', function () { if (location.hash.slice(1) === VIEW) sync(); else location.hash = VIEW; });

  var $ = function (id) { return document.getElementById(id); };
  var balEl = $('mg2Bal'), msgEl = $('mg2Msg'), listEl = $('mg2List'), card = $('mg2Card');
  var items = FALLBACK.slice(), owned = {}, equipped = null, uid = null, bal = null, loading = false, setup = true;

  function setMsg(t, ok) { msgEl.textContent = t || ''; msgEl.classList.toggle('ok', !!ok); }
  function setBal(n) { bal = Number(n); balEl.textContent = fmt(bal); }
  window.addEventListener('lef-wallet', function (e) { if (e.detail) setBal(e.detail.balance); if (sheet.classList.contains('on')) fillSheet(curItem); });
  var key = function (it) { return it.id.indexOf('cerceve-') === 0 ? it.id.slice(8) : null; };

  /* ---------- Raflar ---------- */
  function art(it) {
    var k = key(it);
    if (!k) return '<div class="tk">' + TICK + '</div>';
    return '<span class="mg2-ring"></span><img src="cr-' + k + '-avatar.png" alt="" loading="lazy" onerror="this.style.display=\'none\'">';
  }
  function priceTxt(it) {
    var k = key(it);
    if (owned[it.id]) return k && equipped === k ? '<span class="mg2-pr on">Takılı</span>' : '<span class="mg2-pr own">Sende</span>';
    return '<span class="mg2-pr">' + fmt(it.fiyat) + ' puan</span>';
  }
  function row(list) {
    var r = document.createElement('div'); r.className = 'mg2-row';
    list.forEach(function (it) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'mg2-it'; b.setAttribute('aria-label', it.ad + ', ' + it.fiyat + ' puan');
      b.innerHTML = '<span class="mg2-art">' + art(it) + '</span><span class="mg2-nm">' + esc(it.ad) + '</span>' + priceTxt(it);
      b.addEventListener('click', function () { openSheet(it); });
      r.appendChild(b);
    });
    return r;
  }
  function shelf(label, list) {
    if (!list.length) return;
    var h = document.createElement('p'); h.className = 'mg2-h'; h.textContent = label; listEl.appendChild(h);
    for (var i = 0; i < list.length; i += 3) {
      listEl.appendChild(row(list.slice(i, i + 3)));
      var s = document.createElement('div'); s.className = 'mg2-shelf'; s.setAttribute('aria-hidden', 'true');
      s.style.marginBottom = '22px'; listEl.appendChild(s);
    }
  }
  function render() {
    listEl.replaceChildren();
    shelf('Rozetler', items.filter(function (i) { return i.tur === 'rozet'; }));
    shelf('Banner çerçeveleri', items.filter(function (i) { return i.tur === 'cerceve'; }));
  }

  /* ---------- Yükleme ---------- */
  async function load() {
    if (loading) return; loading = true;
    try {
      var s = await supabase.auth.getSession(); uid = s.data.session ? s.data.session.user.id : null;
      var r = await supabase.from('magaza_urunler').select('id,tur,ad,fiyat,aciklama,sira').eq('aktif', true).order('sira');
      if (!r.error && r.data && r.data.length) { items = r.data; setup = true; }
      else { setup = false; setMsg('Mağaza sunucusu henüz kurulmamış: Supabase SQL Editor\'de magaza-kurulum.sql dosyasını çalıştır.'); }
      if (uid && setup) {
        var o = await supabase.from('magaza_sahip').select('urun_id').eq('user_id', uid);
        owned = {}; (o.data || []).forEach(function (x) { owned[x.urun_id] = 1; });
        var p = await supabase.from('profiles').select('fx_cerceve').eq('id', uid).maybeSingle();
        equipped = p.data ? p.data.fx_cerceve : null;
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
    var k = key(it), has = !!owned[it.id], left = (bal === null ? 0 : bal) - it.fiyat, can = bal !== null && left >= 0;
    var pv = k
      ? '<img class="bn" src="cr-' + k + '-banner.png" alt="" onerror="this.style.display=\'none\'"><img class="av" src="cr-' + k + '-avatar.png" alt="" onerror="this.style.display=\'none\'">'
      : '<div class="tk">' + TICK + '</div>';
    var act;
    if (has && k) act = equipped === k
      ? '<button type="button" class="mg2-b" data-a="off">Çıkar</button>'
      : '<button type="button" class="mg2-b" data-a="on">Tak</button>';
    else if (has) act = '<button type="button" class="mg2-b" disabled>Profilinde görünüyor</button>';
    else act = '<button type="button" class="mg2-b" data-a="buy"' + (can && setup ? '' : ' disabled') + '>Satın al · ' + fmt(it.fiyat) + ' puan</button>';
    card.innerHTML =
      '<button type="button" class="mg2-x" data-a="x" aria-label="Kapat">×</button>' +
      '<div class="mg2-pv">' + pv + '</div>' +
      '<div class="mg2-t">' + esc(it.ad) + '</div><p class="mg2-d">' + esc(it.aciklama || '') + '</p>' +
      (has ? '' : '<div class="mg2-p">' + fmt(it.fiyat) + ' puan</div><div class="mg2-after' + (can ? '' : ' bad') + '">' + (bal === null ? '' : can ? 'Alınca kalan: ' + fmt(left) + ' puan' : 'Yeterli puanın yok (' + fmt(bal) + ' puan)') + '</div>') +
      '<p class="mg2-msg" id="mg2Err" role="status"></p>' + act;
  }
  card.addEventListener('click', async function (e) {
    var b = e.target.closest('[data-a]'); if (!b || !curItem) return;
    var a = b.dataset.a, it = curItem, err = $('mg2Err');
    if (a === 'x') { closeSheet(); return; }
    b.disabled = true;
    try {
      if (a === 'buy') {
        err.textContent = 'Satın alınıyor…'; err.classList.add('ok');
        var r = await supabase.rpc('magaza_al', { p_urun: it.id });
        if (r.error) throw r.error;
        owned[it.id] = 1; setBal(r.data);
        window.dispatchEvent(new CustomEvent('lef-wallet', { detail: { balance: Number(r.data) } }));
        if (it.id === TICK_ID) tickCache[uid] = true;
        setMsg(it.ad + ' satın alındı.', true); render(); fillSheet(it); paintTick();
      } else if (a === 'on' || a === 'off') {
        var k = key(it), v = a === 'on' ? k : null;
        var u = await supabase.from('profiles').update({ fx_cerceve: v }).eq('id', uid);
        if (u.error) throw u.error;
        equipped = v; render(); fillSheet(it);
        setMsg(a === 'on' ? 'Çerçeve takıldı. Profilini yenileyince görünür.' : 'Çerçeve çıkarıldı.', true);
        setTimeout(function () { location.reload(); }, 900);   // cerceve.js önbelleği yenilensin
      }
    } catch (x) { var e2 = $('mg2Err'); if (e2) { e2.classList.remove('ok'); e2.textContent = errText(x); } b.disabled = false; }
  });

  /* ---------- Gri tik: profil adının yanında ---------- */
  var tickCache = {};
  async function hasTick(id) {
    if (Object.prototype.hasOwnProperty.call(tickCache, id)) return tickCache[id];
    try {
      var r = await supabase.from('magaza_sahip').select('urun_id').eq('user_id', id).eq('urun_id', TICK_ID).maybeSingle();
      tickCache[id] = !r.error && !!r.data;
    } catch (e) { tickCache[id] = false; }
    return tickCache[id];
  }
  var tickCss = document.createElement('style');
  tickCss.textContent = '.mg-tick{display:inline-block;width:.85em;height:.85em;margin-left:.3em;vertical-align:-.08em}.mg-tick svg{display:block;width:100%;height:100%}';
  document.head.appendChild(tickCss);
  async function paintTick() {
    var P = window.__lefProfile, n = document.getElementById('pfNick'); if (!P || !n) return;
    var old = n.parentNode.querySelectorAll('.mg-tick'); old.forEach(function (x) { x.remove(); });
    if (await hasTick(P.id)) {
      if (window.__lefProfile !== P) return;
      var s = document.createElement('span'); s.className = 'mg-tick'; s.title = 'Gri tik'; s.innerHTML = TICK; n.after(s);
    }
  }
  window.addEventListener('lef-profile', paintTick); paintTick();

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
