/* ============================================================
   YOUTUBE ÇALMA YARDIMCISI (config.js yükler; hata verse bile site çalışır)
   - Müzik sekmesindeki oynatıcıyı www.youtube.com adresine alır ve durumunu dinler.
   - YouTube hata verirse ekranda nedenini yazar (kod ile birlikte).
   - Profil şarkısındaki gizli oynatıcı 3 sn içinde başlamazsa görünür yapar:
     telefonlar sesi bir dokunuş olmadan başlatmaz, oynat düğmesine dokunman yeter.
   ============================================================ */
(function () {
  var NC = /^https:\/\/www\.youtube-nocookie\.com\/embed\//;
  var EMB = /^https:\/\/www\.youtube(-nocookie)?\.com\/embed\//;
  var ORIGINS = ['https://www.youtube.com', 'https://www.youtube-nocookie.com'];
  var ERR = {
    2: 'Geçersiz video bağlantısı.',
    5: 'YouTube oynatıcısı hata verdi, tekrar dene.',
    100: 'Video bulunamadı ya da gizli.',
    101: 'Bu şarkının sahibi dışarıda çalmaya izin vermiyor.',
    150: 'Bu şarkının sahibi dışarıda çalmaya izin vermiyor.',
    153: 'YouTube oynatıcı ayarı hatası (153): site adresi YouTube’a iletilemiyor.'
  };
  var toast, tt, st = new WeakMap();

  function say(t) {
    if (!document.body) return;
    if (!toast) {
      toast = document.createElement('div'); toast.setAttribute('role', 'status');
      toast.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(92px + env(safe-area-inset-bottom));z-index:200;padding:12px 14px;border-radius:12px;background:#1b1b1f;color:#fff;border:1px solid rgba(255,255,255,.25);font:14px/1.4 system-ui,sans-serif;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.5)';
      document.body.appendChild(toast);
    }
    toast.textContent = t; toast.style.display = 'block';
    clearTimeout(tt); tt = setTimeout(function () { toast.style.display = 'none'; }, 9000);
  }
  function hidBox(f) { return f.closest ? f.closest('.ps-hid') : null; }
  function reveal(h, on) {
    h.style.cssText = on ? 'opacity:1;pointer-events:auto;z-index:150;left:50%;bottom:92px;margin-left:-110px;box-shadow:0 0 0 2px #fff,0 10px 40px #000' : '';
  }

  function watch(f) {
    if (st.has(f)) return;
    st.set(f, -2);
    f.addEventListener('load', function () {       // YouTube'a "beni dinle" de: durum ve hata mesajları gelsin
      try { f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*'); } catch (_) {}
    });
    var h = hidBox(f); if (h) reveal(h, false);
    setTimeout(function () {
      if (!f.isConnected || st.get(f) === 1) return;
      var hb = hidBox(f);
      if (hb) { reveal(hb, true); say('Şarkı kendiliğinden başlamadı. Ortadaki oynat düğmesine dokun.'); }
      else say('Şarkı başlamadıysa videonun üstündeki oynat düğmesine dokun.');
    }, 3000);
  }

  function fix(f) {
    if (!f || f.tagName !== 'IFRAME' || st.has(f)) return;
    var s = f.getAttribute('src') || '';
    if (!EMB.test(s)) return;
    var api = /^widget\d*$/.test(f.id) || /[?&]widgetid=/.test(s);     // YouTube API'nin kendi oynatıcısına dokunma
    if (!api && NC.test(s)) {
      try {
        var u = new URL(s); u.hostname = 'www.youtube.com';
        u.searchParams.set('enablejsapi', '1'); u.searchParams.set('origin', location.origin);
        f.referrerPolicy = 'strict-origin-when-cross-origin'; f.src = u.toString();
      } catch (_) {}
    }
    watch(f);
  }

  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      if (m.type === 'attributes') { fix(m.target); return; }
      m.addedNodes.forEach(function (n) {
        if (n.nodeType !== 1) return;
        if (n.tagName === 'IFRAME') fix(n);
        else if (n.querySelectorAll) n.querySelectorAll('iframe').forEach(fix);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });

  window.addEventListener('message', function (e) {
    if (ORIGINS.indexOf(e.origin) < 0) return;
    var d; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (_) { return; }
    if (!d) return;
    var f = null, a = document.getElementsByTagName('iframe');
    for (var i = 0; i < a.length; i++) if (a[i].contentWindow === e.source) { f = a[i]; break; }
    if (!f) return;
    var s;
    if (d.event === 'onStateChange') s = d.info;
    else if (d.event === 'infoDelivery' && d.info && d.info.playerState !== undefined) s = d.info.playerState;
    if (s !== undefined) {
      st.set(f, s);
      if (s === 1) { var h = hidBox(f); if (h) reveal(h, false); if (toast) toast.style.display = 'none'; }
    }
    if (d.event === 'onError') say(ERR[d.info] || ('Şarkı çalınamadı (YouTube hata kodu ' + d.info + ').'));
  });
})();
