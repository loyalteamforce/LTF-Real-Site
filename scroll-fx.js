/* ============================================================
   LEF — Scroll animasyonları (kütüphanesiz)
   - Kaydırdıkça beliren kartlar / satırlar (kademeli)
   - Sekme değişince animasyon yeniden oynar
   - Sonradan yüklenen (Supabase) içerikleri otomatik yakalar
   - Hero parallax, üstte ilerleme çubuğu, header gölgesi
   - Puan sayıları 0'dan sayarak artar
   - prefers-reduced-motion açıksa hiçbir şey yapmaz
   ============================================================ */
(function(){
  'use strict';
  if(matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  if(!('IntersectionObserver' in window) || !Element.prototype.animate) return;

  /* ---------- Ayarlar ---------- */
  var REVEAL_SEL = '.hero,.sec,.pts .box,.g2 .box,.cd,.rk,.row,.ring,.song,.q button';
  var STAGGER = 70;      // ms: aynı anda görünen öğeler arası gecikme
  var MAX_DELAY = 420;   // ms: en fazla gecikme
  var DURATION = 650;    // ms
  var EASE = 'cubic-bezier(.22,1,.36,1)';

  /* ---------- CSS ---------- */
  var css = document.createElement('style');
  css.textContent =
    '.fx-hide{opacity:0}' +
    '#fxBar{position:fixed;top:0;left:0;height:2px;width:100%;z-index:50;pointer-events:none;' +
      'transform-origin:0 50%;transform:scaleX(0);' +
      'background:linear-gradient(90deg,#8f0d2c,#d1123f,#5b8cff);box-shadow:0 0 8px rgba(209,18,63,.6)}' +
    '.top{transition:box-shadow .3s}' +
    '.top.fx-scrolled{box-shadow:0 6px 24px rgba(0,0,0,.45)}';
  document.head.appendChild(css);

  /* ---------- İlerleme çubuğu + header gölgesi + parallax ---------- */
  var bar = document.createElement('div');
  bar.id = 'fxBar';
  document.body.appendChild(bar);

  var ticking = false;
  function onScroll(){
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(function(){
      ticking = false;
      var y = window.scrollY || 0;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';

      var top = document.querySelector('.top');
      if(top) top.classList.toggle('fx-scrolled', y > 8);

      var hero = document.querySelector('.page.on .hero');
      if(hero && y < 600){
        var h1 = hero.querySelector('h1'), p = hero.querySelector('p');
        var o = Math.max(0, 1 - y / 260);
        if(h1){ h1.style.translate = '0 ' + (y * 0.22) + 'px'; h1.style.opacity = o; }
        if(p){ p.style.translate = '0 ' + (y * 0.22) + 'px'; p.style.opacity = o; }
        hero.style.backgroundPositionY = (50 + Math.min(y, 300) * 0.06) + '%';
      }
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });

  /* ---------- Reveal ---------- */
  var queue = [];
  var flushTimer = null;

  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){
        io.unobserve(en.target);
        queue.push(en.target);
      }
    });
    if(queue.length && !flushTimer){
      // Aynı karede görünen öğeleri toplayıp kademeli oynat
      flushTimer = requestAnimationFrame(flush);
    }
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

  function flush(){
    flushTimer = null;
    var items = queue.splice(0);
    items.forEach(function(el, i){
      var delay = Math.min(i * STAGGER, MAX_DELAY);
      var isRow = el.classList.contains('row') || el.classList.contains('rk');
      var from = isRow
        ? { opacity: 0, translate: '-18px 0' }
        : { opacity: 0, translate: '0 28px' };
      var to = { opacity: 1, translate: '0 0' };
      var a = el.animate([from, to], {
        duration: DURATION, delay: delay, easing: EASE, fill: 'backwards'
      });
      el.classList.remove('fx-hide');   // fill:backwards başlangıç halini tutar
      a.onfinish = a.oncancel = function(){ el.dataset.fx = 'done'; };
    });
  }

  function register(el){
    if(el.dataset.fx) return;           // zaten kayıtlı / tamamlanmış
    el.dataset.fx = 'wait';
    el.classList.add('fx-hide');
    io.observe(el);
  }

  function scan(root){
    if(root.nodeType !== 1) return;
    if(root.matches && root.matches(REVEAL_SEL)) register(root);
    root.querySelectorAll && root.querySelectorAll(REVEAL_SEL).forEach(register);
  }

  /* Sekme değişince o sayfadaki animasyonları sıfırla ve yeniden oynat */
  function replay(page){
    page.querySelectorAll('[data-fx]').forEach(function(el){
      io.unobserve(el);
      delete el.dataset.fx;
      el.classList.remove('fx-hide');
    });
    // Parallax kalıntılarını temizle
    page.querySelectorAll('.hero h1,.hero p').forEach(function(e){
      e.style.translate = ''; e.style.opacity = '';
    });
    scan(page);
    onScroll();
  }

  /* ---------- Sayı sayma (puan kutuları) ---------- */
  var counting = false;
  function parseNum(t){
    var s = (t || '').replace(/[^\d\-]/g, '');
    return s === '' || s === '-' ? null : parseInt(s, 10);
  }
  function countUp(el){
    var target = parseNum(el.textContent);
    if(target === null || target === 0 || Math.abs(target) < 2) return;
    var fmt = function(n){ return n.toLocaleString('tr-TR'); };
    var start = performance.now(), dur = 1100;
    counting = true;
    (function step(now){
      var t = Math.min(1, (now - start) / dur);
      var e = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(Math.round(target * e));
      if(t < 1) requestAnimationFrame(step);
      else { el.textContent = fmt(target); counting = false; }
    })(start);
  }

  /* ---------- Dinamik içerik takibi ---------- */
  var mo = new MutationObserver(function(muts){
    muts.forEach(function(m){
      if(m.type === 'attributes' && m.attributeName === 'class'){
        var t = m.target;
        if(t.classList.contains('page') && t.classList.contains('on') &&
           !(m.oldValue || '').split(/\s+/).includes('on')){
          replay(t);
        }
        return;
      }
      if(m.type === 'childList'){
        m.addedNodes.forEach(scan);
        // Puan alanı doldu mu?
        var tgt = m.target;
        if(!counting && tgt.nodeType === 1 && /^(hPts|hClsPts)$/.test(tgt.id || '') &&
           !tgt.dataset.counted){
          var n = parseNum(tgt.textContent);
          if(n !== null){ tgt.dataset.counted = '1'; countUp(tgt); }
        }
      }
    });
  });

  function init(){
    var app = document.getElementById('app') || document.body;
    scan(app);
    mo.observe(app, {
      childList: true, subtree: true,
      attributes: true, attributeFilter: ['class'], attributeOldValue: true
    });
    onScroll();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();