/* ============================================================
   KISAYOLLAR: Müzik ve Ardevyl alt menüden çıkarılır, Ana Sayfa'da kartın altına iki buton olarak gelir.
   - Müzik: Müzik sayfasını açar (adres #muzik).
   - Ardevyl: sohbet panelini açar (maskota dokunmak da aynı işi yapar).
   - config.js bu dosyayı kendisi yükler; app.html'ye ekleme gerekmez.
   - Alt menü boyutları dock-buyuk.css içindedir.
   ============================================================ */
(function () {
  var bar = document.getElementById('dockBar'), home = document.getElementById('v-ana-sayfa');
  if (!bar || !home) return;   // bu sayfada alt menü yok (login, açılış vb.)

  /* ---------- Alt menüden çıkar ----------
     ardevyl.js ve muzik.js düğmelerini sonradan ekler; yeni eklenenler de yakalanır.
     "dock-btn" sınıfı alınınca gösterge ve kaydırarak sekme değiştirme bu düğmeleri saymaz. */
  function tidy() {
    var moved = false;
    bar.querySelectorAll('.ag-dockbtn.dock-btn, .dock-btn[data-view="muzik"]').forEach(function (b) {
      b.classList.remove('dock-btn'); b.classList.add('dock-out'); moved = true;
    });
    if (moved && window.__dockInd) window.__dockInd(true);
  }
  tidy();
  new MutationObserver(tidy).observe(bar, { childList: true });

  /* ---------- Ana Sayfa kısayolları ---------- */
  var css = document.createElement('style');
  css.textContent =
    '.dock-out{display:none!important}' +
    '.ks-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px;max-width:560px}' +
    '.ks-b{display:flex;align-items:center;justify-content:center;gap:9px;height:52px;border-radius:16px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;font:inherit;font-size:14px;font-weight:600;cursor:pointer}' +
    '.ks-b:hover{background:rgba(255,255,255,.12)}' +
    '.ks-b svg{width:22px;height:22px;flex:none;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}' +
    '.ks-b .ks-dot{fill:currentColor;stroke:none}';
  document.head.appendChild(css);

  var MUZ = '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M7 13V4l7-1.5V11"/><circle cx="5" cy="13" r="2"/><circle cx="12" cy="11" r="2"/></svg>';
  var ARD = '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M9 2 14.5 3.8v4.6c0 3.3-2.4 5.6-5.5 7.2-3.1-1.6-5.5-3.9-5.5-7.2V3.8z"/><circle class="ks-dot" cx="6.9" cy="8" r=".9"/><circle class="ks-dot" cx="11.1" cy="8" r=".9"/><path d="M7.6 10.8q1.4 1 2.8 0"/></svg>';

  var row = document.createElement('div');
  row.className = 'ks-row';
  row.innerHTML =
    '<button type="button" class="ks-b" data-k="muzik">' + MUZ + '<span>Müzik</span></button>' +
    '<button type="button" class="ks-b" data-k="ardevyl">' + ARD + '<span>Ardevyl</span></button>';
  row.addEventListener('click', function (e) {
    var b = e.target.closest('[data-k]'); if (!b) return;
    if (b.dataset.k === 'muzik') location.hash = 'muzik';
    else if (window.Ardevyl && window.Ardevyl.open) window.Ardevyl.open();
  });

  function mount() {
    var anchor = home.querySelector('.pc-wrap') || home.querySelector('h2');
    if (!anchor || row.previousElementSibling === anchor) return;
    anchor.after(row);
  }
  mount();
  new MutationObserver(mount).observe(home, { childList: true });
})();
