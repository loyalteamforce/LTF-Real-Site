/* ============================================================
   KART (Ana Sayfa): puan kartının altındaki Gönder / Geçmiş butonlarının yanına "Kart" butonu ekler.
   Basınca kart.html tam ekran açılır: kart seç (Platin / Gümüş / Altın), özelleştir (Ad / Yazı tipi / Yol / Tür),
   onayla, sipariş verildi, makbuz. "Kullan" denince ana sayfadaki kartın ön yüzü seçilen kartla
   değişir (dokununca yine puanlar görünür). Kartta KARE fotoğraf hesabın profil fotoğrafıdır.
   - Platin ücretsiz; Gümüş ve Altın kart PUANLA satın alınır (kart-magaza-kurulum.sql, magaza_al fonksiyonu).
     Satın alma sunucuda yapılır; kart.html bu dosyaya mesaj gönderir (state / buy), puan tarayıcıda değiştirilemez.
   - Seçim bu cihazda saklanır (localStorage: ltf_kart_<kullanıcı>).
   - config.js bu dosyayı kendisi yükler; app.html'ye ekleme gerekmez.
   ============================================================ */
import { supabase } from './config.js';

(function () {
  var home = document.getElementById('v-ana-sayfa');
  if (!home) return;   // bu sayfada Ana Sayfa yok (login, açılış vb.)

  var uid = '', K = null, avatar = '';

  var css = document.createElement('style');
  css.textContent = '.pc-acts{grid-template-columns:repeat(3,1fr)!important}' +
    '.pc-back.ltf-k{background:none!important}.pc-back.ltf-k::before,.pc-back.ltf-k::after{display:none}' +
    '.ltf-kc{position:absolute;inset:0;border-radius:inherit;overflow:hidden}' +
    '.ltf-kc .idc{width:100%;height:100%;aspect-ratio:auto;border-radius:0;box-shadow:none;border:0}';
  document.head.appendChild(css);

  // Kart yüzü (kart.html ile ortak)
  var sc = document.createElement('script'); sc.src = 'kart-yuz.js';
  sc.onload = function () { K = window.LTFKart; if (K) { css.textContent += K.css; applyCard(); } };
  document.head.appendChild(sc);

  // Hesabın profil fotoğrafı (karttaki kare)
  function loadAvatar() {
    if (!uid) return Promise.resolve();
    return supabase.from('profiles').select('avatar_url').eq('id', uid).maybeSingle().then(function (r) {
      var u = r && r.data && r.data.avatar_url;
      avatar = typeof u === 'string' ? u : '';
    }).catch(function () {});
  }
  supabase.auth.getSession().then(function (r) {
    uid = r.data && r.data.session ? r.data.session.user.id : '';
    return loadAvatar();
  }).then(function () { applyCard(); }).catch(function () {});
  window.addEventListener('lef-pf-saved', function () { loadAvatar().then(applyCard); });
  window.addEventListener('lef-profile', function () { loadAvatar().then(applyCard); });

  /* ---------- seçilen kartı ana sayfadaki karta uygula ---------- */
  function readSel() {
    try { var j = JSON.parse(localStorage.getItem('ltf_kart_' + uid) || 'null'); return j && K && K.T[j.k] ? j : null; } catch (e) { return null; }
  }
  function applyCard() {
    if (!K || !uid) return;
    var back = home.querySelector('.pc-back'); if (!back) return;
    var j = readSel(), cur = back.querySelector('.ltf-kc');
    if (!j) { if (cur) cur.remove(); back.classList.remove('ltf-k'); return; }
    var sig = [j.k, j.n, j.y, j.t, j.f, j.ts, avatar].join('|');
    if (cur && cur.dataset.s === sig) return;
    if (cur) cur.remove();
    var d = document.createElement('div'); d.className = 'ltf-kc'; d.dataset.s = sig;
    d.innerHTML = K.card(j.k, { n: j.n, y: j.y, t: j.t, f: j.f, p: avatar });
    back.classList.add('ltf-k'); back.appendChild(d);
  }
  function showCardSide() {   // puan yüzü açıksa kartı öne çevir
    var f = home.querySelector('.pc-flip');
    if (f && f.classList.contains('flipped')) { f.classList.remove('flipped'); f.setAttribute('aria-pressed', 'false'); }
  }

  /* ---------- Puanla kart satın alma (kart.html bu fonksiyonları mesajla çağırır) ---------- */
  var DEF = { s: 250, g: 500 };   // kart-magaza-kurulum.sql ile aynı fiyatlar (tablo kurulmamışsa yedek)
  var ERR = { insufficient: 'Yeterli puanın yok.', not_found: 'Kart ürünü sunucuda yok. kart-magaza-kurulum.sql Supabase\'te çalıştırıldı mı?', auth: 'Oturum bulunamadı.' };
  function errText(e) { var m = (e && e.message) || ''; for (var k in ERR) if (m.indexOf(k) !== -1) return ERR[k]; return 'Satın alma başarısız. Tekrar dene.'; }
  async function readBal() {
    var w = window.__lefWallet;
    if (w && w.balance !== null && w.balance !== undefined) return Number(w.balance);
    try {
      var r = await supabase.from('wallets').select('balance').eq('user_id', uid).maybeSingle();
      if (r && r.data) return Number(r.data.balance);
    } catch (e) {}
    return null;
  }
  async function kartState() {
    var out = { ok: true, bal: null, price: {}, owned: {} };
    try {
      var r = await supabase.from('magaza_urunler').select('id,fiyat').eq('tur', 'kart').eq('aktif', true);
      if (!r.error && r.data) r.data.forEach(function (x) { if (String(x.id).indexOf('kart-') === 0) out.price[String(x.id).slice(5)] = Number(x.fiyat); });
      if (uid) {
        var o = await supabase.from('magaza_sahip').select('urun_id').eq('user_id', uid);
        (o.data || []).forEach(function (x) { if (String(x.urun_id).indexOf('kart-') === 0) out.owned[String(x.urun_id).slice(5)] = 1; });
      }
    } catch (e) {}
    Object.keys(DEF).forEach(function (k) { if (out.price[k] === undefined) out.price[k] = DEF[k]; });
    out.bal = await readBal();
    return out;
  }
  async function kartBuy(k) {
    if (!uid) return { ok: false, err: ERR.auth };
    if (k !== 's' && k !== 'g') return { ok: false, err: ERR.not_found };
    try {
      var r = await supabase.rpc('magaza_al', { p_urun: 'kart-' + k });
      if (r.error) throw r.error;
      var nb = Number(r.data);
      window.dispatchEvent(new CustomEvent('lef-wallet', { detail: { balance: nb } }));
      return { ok: true, bal: nb };
    } catch (x) {
      if (x && x.message && x.message.indexOf('owned') !== -1) return { ok: true, bal: await readBal() };   // zaten alınmış: tekrar ödeme yok
      return { ok: false, err: errText(x) };
    }
  }

  /* ---------- kart.html tam ekran ---------- */
  var ov = null, fr = null;
  function build() {
    ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:90;display:none;background:#fff';
    fr = document.createElement('iframe');
    fr.title = 'LTF Kart'; fr.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;background:#fff';
    var x = document.createElement('button');
    x.type = 'button'; x.setAttribute('aria-label', 'Kapat'); x.textContent = '\u00d7';
    x.style.cssText = 'position:absolute;z-index:2;right:14px;top:max(12px,env(safe-area-inset-top));width:40px;height:40px;border:0;border-radius:50%;background:rgba(0,0,0,.85);color:#fff;font-size:24px;line-height:1;cursor:pointer';
    x.addEventListener('click', close);
    ov.append(fr, x); document.body.appendChild(ov);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.style.display === 'block') close(); });
  }
  function ownerName() { var n = home.querySelector('.pc-name'); return n ? n.textContent.trim() : ''; }
  function open() {
    if (!ov) build();
    ov.style.display = 'block'; document.body.style.overflow = 'hidden';
    var go = function () {
      if (ov.style.display !== 'block') return;
      fr.src = 'kart.html?u=' + encodeURIComponent(uid || 'x') + '&n=' + encodeURIComponent(ownerName()) + '&a=' + encodeURIComponent(avatar);
    };
    loadAvatar().then(go, go);
  }
  function close() {
    if (!ov) return;
    ov.style.display = 'none'; document.body.style.overflow = '';
    fr.src = 'about:blank';   // bir dahaki açılışta akış baştan başlasın
  }
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || e.data.ltf !== 'kart') return;
    if (e.data.a === 'state' || e.data.a === 'buy') {   // puan / satın alma isteği: sadece kart çerçevesinden kabul edilir
      if (!fr || e.source !== fr.contentWindow) return;
      var id = e.data.id, src = e.source;
      (e.data.a === 'state' ? kartState() : kartBuy(String(e.data.k || ''))).then(function (res) {
        res.ltf = 'kart-r'; res.id = id;
        try { src.postMessage(res, location.origin); } catch (x) {}
      });
      return;
    }
    if (e.data.a === 'use') { applyCard(); showCardSide(); }
    close();
  });

  function mount() {
    applyCard();
    var acts = home.querySelector('.pc-acts');
    if (!acts || acts.querySelector('[data-kart]')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'pc-act'; b.setAttribute('data-kart', '1');   // data-a kullanma: puan kartı onu cüzdan paneli sanar
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></svg>Kart';
    b.addEventListener('click', open);
    acts.appendChild(b);
  }
  new MutationObserver(mount).observe(home, { childList: true, subtree: true });
  mount();
})();
