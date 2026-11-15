/* ============================================================
   KART (Ana Sayfa): puan kartının altındaki Gönder / Geçmiş butonlarının yanına "Kart" butonu ekler.
   Basınca kart.html tam ekran açılır: kart seç (Platin / Gümüş / Altın), onayla, sipariş verildi,
   makbuz yazdırma animasyonu. Sipariş verdikten sonra "Kullan" denince ana sayfadaki kartın
   ön yüzü seçilen kartla değişir (dokununca yine puanlar görünür).
   - Seçim bu cihazda saklanır (localStorage: ltf_kart_<kullanıcı>).
   - config.js bu dosyayı kendisi yükler; app.html'ye ekleme gerekmez.
   ============================================================ */
import { supabase } from './config.js';

(function () {
  var home = document.getElementById('v-ana-sayfa');
  if (!home) return;   // bu sayfada Ana Sayfa yok (login, açılış vb.)

  var uid = '', K = null;

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

  supabase.auth.getSession().then(function (r) {
    uid = r.data && r.data.session ? r.data.session.user.id : ''; applyCard();
  }).catch(function () {});

  /* ---------- seçilen kartı ana sayfadaki karta uygula ---------- */
  function readSel() {
    try { var j = JSON.parse(localStorage.getItem('ltf_kart_' + uid) || 'null'); return j && K && K.T[j.k] ? j : null; } catch (e) { return null; }
  }
  function applyCard() {
    if (!K || !uid) return;
    var back = home.querySelector('.pc-back'); if (!back) return;
    var j = readSel(), cur = back.querySelector('.ltf-kc');
    if (!j) { if (cur) cur.remove(); back.classList.remove('ltf-k'); return; }
    var sig = j.k + '|' + j.n + '|' + (j.p || '').length + '|' + (j.t || '');
    if (cur && cur.dataset.s === sig) return;
    if (cur) cur.remove();
    var d = document.createElement('div'); d.className = 'ltf-kc'; d.dataset.s = sig;
    d.innerHTML = K.card(j.k, j.n, j.p, false);
    back.classList.add('ltf-k'); back.appendChild(d);
  }
  function showCardSide() {   // puan yüzü açıksa kartı öne çevir
    var f = home.querySelector('.pc-flip');
    if (f && f.classList.contains('flipped')) { f.classList.remove('flipped'); f.setAttribute('aria-pressed', 'false'); }
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
    fr.src = 'kart.html?u=' + encodeURIComponent(uid || 'x') + '&n=' + encodeURIComponent(ownerName());
    ov.style.display = 'block'; document.body.style.overflow = 'hidden';
  }
  function close() {
    if (!ov) return;
    ov.style.display = 'none'; document.body.style.overflow = '';
    fr.src = 'about:blank';   // bir dahaki açılışta akış baştan başlasın
  }
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || e.data.ltf !== 'kart') return;
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
