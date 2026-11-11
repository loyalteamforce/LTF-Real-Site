/* ============================================================
   KOYU / AÇIK TEMA + MÜREKKEP YAYILMA GEÇİŞİ (tema-modu.js)
   - Ayarlar panelinin en üstüne "Tema: Koyu / Açık" seçeneği eklenir.
   - Tema değişince yeni tema, dokunulan yerden mürekkep lekesi gibi
     (dağınık, parçalı kenarlı, çıkıntılı) tüm ekrana yayılır. Her seferinde farklı bir leke.
   - Seçim bu cihazda saklanır (lef_theme). Varsayılan: koyu.
   - Yayılma efekti View Transitions desteği ister (Safari 18+, Chrome/Edge).
     Destek yoksa ya da "hareketi azalt" açıksa tema anında değişir.
   - Yükleyen: splash.js (app.html'in <head> kısmında). Stil: tema-modu.css
   Ayarlar: aşağıdaki DUR (ms, yayılma süresi) ve LEKE (mürekkep şeklinin sertliği).
   Konsoldan: lefTema.set('light') / lefTema.set('dark')
   ============================================================ */
(function () {
  if (window.lefTema) return;
  var KEY = 'lef_theme', root = document.documentElement;
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var DUR = 1300;      // ms: yayılma süresi
  var LEKE = 1;        // 0.6 daha yuvarlak, 1.4 daha dağınık ve çıkıntılı

  function get() { try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; } catch (e) { return 'dark'; } }
  function put(m) { try { localStorage.setItem(KEY, m); } catch (e) {} }

  /* ---------- Temayı uygula ---------- */
  var meta = null;
  function paint(m) {
    root.setAttribute('data-theme', m);
    if (!meta) {
      meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    }
    meta.setAttribute('content', m === 'light' ? '#ededed' : '#121212');   // telefonun üst çubuğu da uyum sağlar
    sync();
  }
  function sync() {
    var seg = document.getElementById('stTheme'); if (!seg) return;
    var cur = get();
    [].forEach.call(seg.querySelectorAll('button[data-v]'), function (b) {
      var on = b.getAttribute('data-v') === cur;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  /* ---------- Mürekkep lekesi: poligon karelerini üret ----------
     Her açıda (N nokta) leke farklı hızla büyür: bazı açılar "çıkıntı" gibi öne fırlar,
     bazılar geride kalır. Son karede her nokta ekranın en uzak köşesini aşar, yani ekran tamamen kaplı olur. */
  function inkFrames(cx, cy, W, H) {
    var N = 120, K = 32, TAU = Math.PI * 2, i, j, k;
    var far = Math.max(Math.hypot(cx, cy), Math.hypot(W - cx, cy), Math.hypot(cx, H - cy), Math.hypot(W - cx, H - cy)) * 1.06;
    var p1 = Math.random() * TAU, p2 = Math.random() * TAU, p3 = Math.random() * TAU, p4 = Math.random() * TAU;
    var tn = 6 + Math.floor(Math.random() * 4), tend = [];
    for (k = 0; k < tn; k++) tend.push({ a: Math.random() * TAU, w: .06 + Math.random() * .1, d: (.5 + Math.random() * .6) * LEKE });
    var g = [];
    for (i = 0; i < N; i++) {
      var th = i / N * TAU;
      var v = 1.35 + LEKE * (.32 * Math.sin(2 * th + p1) + .24 * Math.sin(3 * th + p2) + .16 * Math.sin(5 * th + p3) + .1 * Math.sin(11 * th + p4) + (Math.random() - .5) * .14);
      for (k = 0; k < tend.length; k++) {
        var dd = Math.abs(th - tend[k].a); dd = Math.min(dd, TAU - dd);
        v -= tend[k].d * Math.exp(-(dd * dd) / (2 * tend[k].w * tend[k].w));
      }
      g.push(Math.max(.34, Math.min(2.6, v)));
    }
    var frames = [];
    for (var f = 0; f <= K; f++) {
      var e = 1 - Math.pow(1 - f / K, 2.3), pts = [];
      for (j = 0; j < N; j++) {
        var a = j / N * TAU, r = far * (.55 * e + .45 * Math.pow(e, g[j]));
        pts.push((cx + r * Math.cos(a)).toFixed(1) + 'px ' + (cy + r * Math.sin(a)).toFixed(1) + 'px');
      }
      frames.push({ clipPath: 'polygon(' + pts.join(',') + ')' });
    }
    return frames;
  }

  /* ---------- Tema değiştir ---------- */
  var vt = null;
  function switchTo(m, x, y) {
    if (m !== 'light') m = 'dark';
    if (m === get()) return;
    put(m);
    if (vt) { try { vt.skipTransition(); } catch (e) {} }
    if (reduce || !document.startViewTransition) { paint(m); return; }
    root.classList.add('lt-ink');
    var W = window.innerWidth, H = window.innerHeight;
    var t = document.startViewTransition(function () { paint(m); });
    vt = t;
    function done() { root.classList.remove('lt-ink'); if (vt === t) vt = null; }
    t.ready.then(function () {
      root.animate(inkFrames(x, y, W, H), { duration: DUR, easing: 'linear', pseudoElement: '::view-transition-new(root)' });
    }).catch(function () {});
    t.finished.then(done, done);
  }

  /* ---------- Ayarlar paneline "Tema" satırı ---------- */
  function ui() {
    var st = document.getElementById('st');
    if (!st || document.getElementById('stTheme')) return;
    var top = st.querySelector('.st-top'); if (!top) return;
    var row = document.createElement('div');
    row.className = 'st-row';
    row.innerHTML = '<span>Tema<br><small style="color:#9ca3af;font-size:12px">Koyu ya da açık görünüm</small></span>' +
      '<div class="st-seg" id="stTheme" role="group" aria-label="Tema"><button type="button" data-v="dark">Koyu</button><button type="button" data-v="light">Açık</button></div>';
    top.parentNode.insertBefore(row, top.nextSibling);
    row.querySelector('#stTheme').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-v]'); if (!b) return;
      var r = b.getBoundingClientRect();
      var x = e.clientX || (r.left + r.width / 2), y = e.clientY || (r.top + r.height / 2);   // klavyeyle basıldıysa düğmenin ortasından
      switchTo(b.getAttribute('data-v'), x, y);
    });
    sync();
  }

  paint(get());
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ui); else ui();

  window.lefTema = {
    get: get,
    set: function (m, x, y) { switchTo(m, x == null ? window.innerWidth / 2 : x, y == null ? window.innerHeight / 2 : y); }
  };
})();
