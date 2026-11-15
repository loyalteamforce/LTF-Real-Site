/* ============================================================
   KART (Ana Sayfa): puan kartının altındaki Gönder / Geçmiş butonlarının yanına "Kart" butonu ekler.
   Basınca kart.html tam ekran açılır: kart seç, onayla, sipariş verildi, fiş yazdırma animasyonu
   ve LTF üye kartı. Alt menüye hiçbir şey eklemez.
   - config.js bu dosyayı kendisi yükler; app.html'ye ekleme gerekmez.
   ============================================================ */
(function () {
  var home = document.getElementById('v-ana-sayfa');
  if (!home) return;   // bu sayfada Ana Sayfa yok (login, açılış vb.)

  var css = document.createElement('style');
  css.textContent = '.pc-acts{grid-template-columns:repeat(3,1fr)!important}';
  document.head.appendChild(css);

  var ov = null, fr = null;
  function build() {
    ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:90;display:none;background:#f4f1ee';
    fr = document.createElement('iframe');
    fr.title = 'LTF Kart'; fr.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;background:#f4f1ee';
    var x = document.createElement('button');
    x.type = 'button'; x.setAttribute('aria-label', 'Kapat'); x.textContent = '\u00d7';
    x.style.cssText = 'position:absolute;z-index:2;right:14px;top:max(12px,env(safe-area-inset-top));width:40px;height:40px;border:0;border-radius:50%;background:rgba(0,0,0,.85);color:#fff;font-size:24px;line-height:1;cursor:pointer';
    x.addEventListener('click', close);
    ov.append(fr, x); document.body.appendChild(ov);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.style.display === 'block') close(); });
  }
  function open() {
    if (!ov) build();
    if (!fr.getAttribute('src')) fr.src = 'kart.html';
    ov.style.display = 'block'; document.body.style.overflow = 'hidden';
  }
  function close() { ov.style.display = 'none'; document.body.style.overflow = ''; }

  function mount() {
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
