/* ============================================================
   UX: Instagram tarzı dokunma ve kaydırma hissi
   - Butonlara basınca küçülür, bırakınca yaylanarak geri gelir.
     Çok hızlı basılsa bile animasyon en az MIN_PRESS ms görünür.
   - Ekranda sağa/sola kaydırınca sekmeler (Ana Sayfa, Manga, ...) arasında geçilir.
     Parmakla birlikte hareket eder, yeterince çekilirse sekme değişir.
   - Sekme değişirken yeni sayfa geldiği yönden kayarak girer.
   - app.html'de, </body>'den hemen önce şu satır olmalı:
        <script src="ux.js"></script>
   Ayarlar: aşağıdaki sabitler.
   ============================================================ */
(function () {
  var MIN_PRESS = 140;      // ms: basılı görüntü en az bu kadar kalsın
  var SCALE = .93;          // basılınca küçülme oranı
  var SWIPE_MIN = 70;       // px: sekme değişmesi için gereken çekme
  var VIBRATE = 8;          // ms: Android'de hafif titreşim (0 = kapalı)

  /* ---------- CSS ---------- */
  var css = document.createElement('style');
  css.textContent =
    'button,[role=button],[role=switch],.dock-btn,a.mg-card,.mg-card{-webkit-tap-highlight-color:transparent;touch-action:manipulation}' +
    /* "scale" ayrı bir özellik: mevcut transform'ları bozmaz */
    'button,[role=button],[role=switch],.mg-card{transition:scale .22s cubic-bezier(.3,1.5,.5,1),filter .22s ease}' +
    '.ux-press{scale:' + SCALE + ';filter:brightness(.88);transition:scale .09s ease-out,filter .09s ease-out!important}' +
    '.dock-btn.ux-press{scale:.86}' +
    '.view.on.ux-r{animation:uxR .34s cubic-bezier(.2,.85,.25,1) both}' +
    '.view.on.ux-l{animation:uxL .34s cubic-bezier(.2,.85,.25,1) both}' +
    '@keyframes uxR{from{opacity:.2;transform:translateX(38px)}to{opacity:1;transform:none}}' +
    '@keyframes uxL{from{opacity:.2;transform:translateX(-38px)}to{opacity:1;transform:none}}' +
    '.view.ux-drag{will-change:transform,opacity}' +
    '.view.ux-snap{transition:transform .28s cubic-bezier(.3,1.4,.5,1),opacity .28s ease}' +
    '@media (prefers-reduced-motion:reduce){.view.on.ux-r,.view.on.ux-l{animation:none}.ux-press{scale:.97}}';
  document.head.appendChild(css);

  /* ---------- Basma animasyonu ---------- */
  var PRESSABLE = 'button,[role=button],[role=switch],.mg-card';
  var active = new Map();    // eleman -> basıldığı an

  function release(el) {
    var t0 = active.get(el); if (t0 == null) return;
    active.delete(el);
    var wait = Math.max(0, MIN_PRESS - (Date.now() - t0));
    setTimeout(function () { el.classList.remove('ux-press'); }, wait);
  }
  document.addEventListener('pointerdown', function (e) {
    var el = e.target.closest && e.target.closest(PRESSABLE);
    if (!el || el.disabled) return;
    el.classList.add('ux-press'); active.set(el, Date.now());
    if (VIBRATE && e.pointerType === 'touch' && navigator.vibrate) { try { navigator.vibrate(VIBRATE); } catch (_) {} }
  }, true);
  ['pointerup', 'pointercancel', 'pointerleave', 'dragstart'].forEach(function (ev) {
    document.addEventListener(ev, function () { active.forEach(function (_, el) { release(el); }); }, true);
  });
  // Kaydırma başlayınca basılı görüntüyü bırak (parmak liste üzerinde kayıyorsa)
  document.addEventListener('scroll', function () { active.forEach(function (_, el) { release(el); }); }, { passive: true, capture: true });

  /* ---------- Sekmeler arası geçiş ---------- */
  function order() {
    return Array.prototype.map.call(document.querySelectorAll('.dock-btn[data-view]'), function (b) { return b.dataset.view; });
  }
  function curName() {
    var b = document.querySelector('.dock-btn[aria-current="page"]');
    return b ? b.dataset.view : null;
  }
  function curView() { return document.querySelector('.view.on'); }

  // Sekme değişince yeni sayfa geldiği yönden kayarak girsin
  window.addEventListener('hashchange', function (e) {
    var o = order();
    var from = (e.oldURL || '').split('#')[1] || o[0];
    var to = location.hash.slice(1) || o[0];
    var a = o.indexOf(from), b = o.indexOf(to);
    if (a < 0 || b < 0 || a === b) return;
    var v = curView(); if (!v) return;
    v.classList.remove('ux-r', 'ux-l');
    void v.offsetWidth;
    v.classList.add(b > a ? 'ux-r' : 'ux-l');
    v.addEventListener('animationend', function h() { v.classList.remove('ux-r', 'ux-l'); v.removeEventListener('animationend', h); });
  });

  function blocked(target) {
    if (!target || !target.closest) return true;
    if (document.querySelector('.st.on, .mg-rd.on')) return true;                 // açık panel / okuyucu
    if (target.closest('input,textarea,select,video,[contenteditable],.agc,.ag,.dock,.ch-log,.fr-list,.bio-fonts,.ux-noswipe')) return true;
    for (var n = target; n && n !== document.body; n = n.parentElement) {          // yatay kayan listeler (türler vb.)
      if (n.scrollWidth > n.clientWidth + 4) {
        var ox = getComputedStyle(n).overflowX;
        if (ox === 'auto' || ox === 'scroll') return true;
      }
    }
    return false;
  }

  var sx = 0, sy = 0, dx = 0, mode = '', view = null, ok = false;
  document.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { ok = false; return; }
    var t = e.touches[0];
    ok = !blocked(e.target); sx = t.clientX; sy = t.clientY; dx = 0; mode = ''; view = curView();
    if (view) view.classList.remove('ux-snap');
  }, { passive: true });

  document.addEventListener('touchmove', function (e) {
    if (!ok || !view) return;
    var t = e.touches[0], mx = t.clientX - sx, my = t.clientY - sy;
    if (!mode) {
      if (Math.abs(mx) < 10 && Math.abs(my) < 10) return;
      mode = (Math.abs(mx) > Math.abs(my) * 1.4) ? 'x' : 'y';
      if (mode === 'x') view.classList.add('ux-drag');
    }
    if (mode !== 'x') return;
    dx = mx;
    var o = order(), i = o.indexOf(curName());
    var edge = (dx > 0 && i <= 0) || (dx < 0 && i >= o.length - 1);
    var k = edge ? .18 : .55;                         // kenarda lastik gibi zor çekilir
    view.style.transform = 'translateX(' + (dx * k) + 'px)';
    view.style.opacity = String(1 - Math.min(Math.abs(dx) / 600, .35));
  }, { passive: true });

  function end() {
    if (!ok || !view) return;
    var v = view, moved = dx; view = null; ok = false;
    if (mode !== 'x') return;
    var o = order(), i = o.indexOf(curName());
    var go = (moved <= -SWIPE_MIN && i < o.length - 1) ? o[i + 1] : (moved >= SWIPE_MIN && i > 0) ? o[i - 1] : null;
    if (go) {
      v.classList.remove('ux-drag'); v.style.transform = ''; v.style.opacity = '';
      if (VIBRATE && navigator.vibrate) { try { navigator.vibrate(10); } catch (_) {} }
      location.hash = go;                              // hashchange -> yeni sayfa kayarak girer
    } else {
      v.classList.add('ux-snap');                      // yaylanarak yerine döner
      v.style.transform = ''; v.style.opacity = '';
      setTimeout(function () { v.classList.remove('ux-snap', 'ux-drag'); }, 320);
    }
  }
  document.addEventListener('touchend', end, { passive: true });
  document.addEventListener('touchcancel', end, { passive: true });
})();