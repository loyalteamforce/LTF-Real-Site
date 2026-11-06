/* ============================================================
   AÇILIŞ EKRANI: siyah zemin üzerinde "Loyal Elite Force" arması.
   - En az 2,5 sn görünür, site hazır olunca yavaşça kaybolur.
   - Giriş/kayıt veya index.html'den gelindiyse arma zaten gösterilmiştir;
     tekrar göstermemek için sessionStorage 'lefSplash' işaretine bakılır.
   - app.html'in <head> kısmında, bakim-kilidi.js'ten sonra yüklenir.
   Süreyi değiştirmek için: MIN (milisaniye).
   ============================================================ */
(function () {
  var MIN = 2500, FLAG = 'lefSplash';
  try {
    var t = +sessionStorage.getItem(FLAG);
    if (t && Date.now() - t < 30000) { sessionStorage.removeItem(FLAG); return; }
  } catch (e) {}

  var d = document.createElement('div');
  d.id = 'lefSplash';
  d.setAttribute('role', 'status'); d.setAttribute('aria-label', 'Yükleniyor');
  d.style.cssText = 'position:fixed;inset:0;z-index:100000;background:#000;display:grid;place-items:center;transition:opacity .5s ease';
  d.innerHTML = '<img src="crest.png" alt="Loyal Elite Force" style="width:clamp(110px,24vw,190px);height:auto;opacity:0;transition:opacity .6s ease">';
  document.documentElement.appendChild(d);
  var img = d.firstChild;
  requestAnimationFrame(function () { requestAnimationFrame(function () { img.style.opacity = '1'; }); });

  var t0 = Date.now(), loaded = document.readyState === 'complete';
  if (!loaded) window.addEventListener('load', function () { loaded = true; });

  (function tick() {
    if (loaded && Date.now() - t0 >= MIN) {
      d.style.opacity = '0';
      setTimeout(function () { d.remove(); }, 550);
    } else if (Date.now() - t0 > 15000) {   // takılırsa 15 sn'de yine de aç
      d.remove();
    } else setTimeout(tick, 100);
  })();
})();