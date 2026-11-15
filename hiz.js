/* ============================================================
   HIZ: profil banner'ı ve profil fotoğrafı daha öncelikli yüklenir, Supabase bağlantısı önceden kurulur.
   config.js bu dosyayı kendisi yükler; hata verse bile site çalışır.
   ============================================================ */
(function () {
  var vid = document.getElementById('pfVid');
  if (!vid) return;   // bu sayfada profil yok

  try {
    var l = document.createElement('link');
    l.rel = 'preconnect'; l.href = 'https://mbyyuovlipbpioxtkjcp.supabase.co'; l.crossOrigin = '';
    document.head.appendChild(l);
  } catch (_) {}

  function tune(e) { if (!e) return; try { e.decoding = 'async'; e.setAttribute('fetchpriority', 'high'); } catch (_) {} }
  tune(document.getElementById('pfBanImg'));
  tune(document.getElementById('pfImg'));

  // Banner videosu: telefonlar sadece ilk bilgiyi alıp beklemesin, hemen indirmeye başlasın
  function vtune() {
    if (!vid.getAttribute('src')) return;
    try { if (vid.preload !== 'auto') vid.preload = 'auto'; vid.setAttribute('fetchpriority', 'high'); } catch (_) {}
  }
  new MutationObserver(vtune).observe(vid, { attributes: true, attributeFilter: ['src'] });
  vtune();
})();
