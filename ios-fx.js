/* ============================================================
   iOS GERİ BİLDİRİM ANİMASYONLARI (ios-fx.js)
   Görseldeki 9 desenin hepsi, sadece animasyon olarak:
     1. Dynamic Island   iosFx.island({text, sub, icon, duration})
     2. Live Activity    var a = iosFx.liveActivity({title, subtitle, icon}); a.update({progress:0..1}); a.end('Bitti')
     3. HUD              iosFx.hud({icon, text, duration})
     4. Action sheet     iosFx.actionSheet({title, actions:[{label, destructive, onClick}]})
     5. Swipe actions    iosFx.swipeActions(satir, [{label, color, remove, onClick}])
                         ya da HTML'de: <div data-ios-swipe="sil">  (sil, arsiv, sabitle)
     6. Haptic feedback  iosFx.haptic(eleman, 'light'|'medium'|'heavy'|'success'|'error')
                         (anahtar/checkbox'larda otomatik)
     7. Jiggle mode      iosFx.jiggle.start(kutu, {selector, onRemove}) / iosFx.jiggle.stop()
                         ya da HTML'de: <div data-ios-jiggle> -> çocuklara uzun basınca titrer
     8. Symbol effect    iosFx.symbol(svg, 'bounce'|'pulse'|'scale'|'wiggle'|'variable', {loop:true})
                         (.dock-btn ikonları ve [data-ios-symbol="wiggle"] otomatik)
     9. Shake to undo    iosFx.shakeToUndo(function(){ ... })  telefonu sallayınca "Geri Al" uyarısı
                         iosFx.undoAlert(fn) uyarıyı elle gösterir
   İkon adları: check heart bell wifi trash share info bolt minus speaker
   Not: Kullanıcı "hareketi azalt" ayarını açtıysa animasyonlar kısılır.
   ============================================================ */
(function () {
  if (window.iosFx) return;
  var REDUCE = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var SPRING = 'cubic-bezier(.34,1.45,.5,1)';
  var VIB = { light: 8, select: 6, medium: 16, heavy: 28, success: [10, 40, 14], error: [28, 36, 28, 36, 28] };

  /* ---------- İkonlar (emoji yok, çizim) ---------- */
  var S = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  var ICONS = {
    check: '<path class="ix-draw" d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    heart: '<path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.6 4.5 6.8 4.5c2 0 3.8 1.2 5.2 3 1.4-1.8 3.2-3 5.2-3 3.2 0 5.2 3.1 4 6.6-1.7 4.8-9.2 9.4-9.2 9.4Z" fill="currentColor"/>',
    bell: '<path d="M12 3a6 6 0 0 0-6 6v3.5L4.2 16a1 1 0 0 0 .9 1.5h13.8a1 1 0 0 0 .9-1.5L18 12.5V9a6 6 0 0 0-6-6Zm-2 16h4a2 2 0 0 1-4 0Z" fill="currentColor"/>',
    wifi: '<path d="M2.5 9.2a14 14 0 0 1 19 0" ' + S + '/><path d="M5.7 12.6a9.4 9.4 0 0 1 12.6 0" ' + S + '/><path d="M8.8 16a5 5 0 0 1 6.4 0" ' + S + '/><circle cx="12" cy="19.3" r="1.5" fill="currentColor"/>',
    trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l.9 12.5h9.2L17.5 7M10 11v5M14 11v5" ' + S + '/>',
    share: '<path d="M12 15V3.5M7.5 8L12 3.5 16.5 8M6.5 11H5.5a1 1 0 0 0-1 1v7.5a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V12a1 1 0 0 0-1-1h-1" ' + S + '/>',
    info: '<circle cx="12" cy="12" r="9" ' + S + '/><path d="M12 11v5.2" ' + S + '/><circle cx="12" cy="7.8" r="1.2" fill="currentColor"/>',
    bolt: '<path d="M13 2L5 13.5h6L10.5 22 19 10h-6.2L13 2Z" fill="currentColor"/>',
    minus: '<path d="M6.5 12h11" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>',
    speaker: '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" fill="currentColor"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" ' + S + '/>'
  };
  function svg(name) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || ICONS.info) + '</svg>'; }

  /* ---------- Yardımcılar ---------- */
  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function icon(name) { var s = h('span', 'ix-ic'); s.innerHTML = svg(name); return s; }
  function vib(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) {} }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }

  /* ---------- CSS ---------- */
  var css = document.createElement('style');
  css.textContent = `
.ix-island,.ix-live,.ix-hud,.ix-sheet,.ix-alert,.ix-done{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.ix-ic{display:inline-flex;width:1em;height:1em;flex:none}
.ix-ic svg{width:100%;height:100%;display:block}
.ix-col{display:flex;flex-direction:column;min-width:0;text-align:left}
.ix-col b{font-size:15px;font-weight:600;line-height:1.25}
.ix-col small{font-size:12.5px;opacity:.65;line-height:1.25}
.ix-draw{stroke-dasharray:24;stroke-dashoffset:24}
.ix-hud.on .ix-draw,.ix-live .ix-draw{animation:ixDraw .45s .12s ease-out forwards}
@keyframes ixDraw{to{stroke-dashoffset:0}}

/* 1. Dynamic Island */
.ix-island{position:fixed;top:calc(env(safe-area-inset-top,0px) + 10px);left:50%;width:118px;height:34px;border-radius:20px;background:#000;color:#fff;z-index:99990;overflow:hidden;display:flex;align-items:center;justify-content:center;transform:translateX(-50%) scale(.5);opacity:0;box-shadow:0 10px 34px rgba(0,0,0,.4);transition:width .55s ${SPRING},height .55s ${SPRING},border-radius .55s ${SPRING},transform .45s ${SPRING},opacity .2s ease}
.ix-island.on{opacity:1;transform:translateX(-50%) scale(1)}
.ix-island.open{width:min(92vw,340px);height:66px;border-radius:33px}
.ix-island.open.ix-slim{height:52px;border-radius:26px}
.ix-in{display:flex;align-items:center;gap:12px;padding:0 20px;opacity:0;transform:scale(.7);transition:opacity .25s .1s ease,transform .45s .08s ${SPRING};white-space:nowrap}
.ix-island.open .ix-in{opacity:1;transform:none}
.ix-in .ix-ic{font-size:26px;color:#30d158}

/* 2. Live Activity */
.ix-live{position:fixed;top:calc(env(safe-area-inset-top,0px) + 60px);left:50%;width:min(92vw,360px);box-sizing:border-box;padding:14px 16px 16px;border-radius:26px;background:#000;color:#fff;z-index:99980;box-shadow:0 14px 40px rgba(0,0,0,.45);transform:translate(-50%,-30px) scale(.82);opacity:0;transform-origin:50% 0;transition:transform .6s ${SPRING},opacity .25s ease}
.ix-live.on{transform:translate(-50%,0) scale(1);opacity:1}
.ix-live-r{display:flex;align-items:center;gap:12px}
.ix-live .ix-ic{font-size:30px;color:#30d158}
.ix-live .ix-col{flex:1}
.ix-pct{font-variant-numeric:tabular-nums;font-size:15px;font-weight:600;opacity:.9}
.ix-bar{margin-top:12px;height:7px;border-radius:4px;background:rgba(255,255,255,.18);overflow:hidden}
.ix-bar i{display:block;height:100%;width:0;border-radius:4px;background:#30d158;transition:width .7s cubic-bezier(.3,.9,.3,1)}

/* 3. HUD */
.ix-hud{position:fixed;left:50%;top:50%;width:150px;height:150px;box-sizing:border-box;border-radius:28px;background:rgba(40,40,44,.72);-webkit-backdrop-filter:blur(24px) saturate(1.6);backdrop-filter:blur(24px) saturate(1.6);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:12px;text-align:center;transform:translate(-50%,-50%) scale(1.2);opacity:0;pointer-events:none;z-index:99995;transition:opacity .2s ease,transform .38s ${SPRING}}
.ix-hud .ix-ic{font-size:56px}
.ix-hud span:last-child{font-size:15px;font-weight:600;line-height:1.2}
.ix-hud.on{opacity:1;transform:translate(-50%,-50%) scale(1)}
.ix-hud.on.out{opacity:0;transform:translate(-50%,-50%) scale(.92);transition:opacity .3s ease,transform .3s ease}

/* 4. Action sheet + 9. uyarı kutusu */
.ix-back{position:fixed;inset:0;background:rgba(0,0,0,.42);opacity:0;transition:opacity .3s ease;z-index:99970}
.ix-back.on{opacity:1}
.ix-sheet{position:fixed;left:0;right:0;bottom:0;max-width:520px;margin:0 auto;box-sizing:border-box;padding:8px 8px calc(env(safe-area-inset-bottom,0px) + 8px);z-index:99971;transform:translateY(108%);transition:transform .5s cubic-bezier(.2,.9,.25,1)}
.ix-sheet.on{transform:none}
.ix-grp{background:rgba(44,44,48,.94);-webkit-backdrop-filter:blur(30px);backdrop-filter:blur(30px);border-radius:14px;overflow:hidden}
.ix-sh-hd{display:flex;flex-direction:column;gap:2px;padding:14px 16px;text-align:center;color:rgba(235,235,245,.6);font-size:13px}
.ix-sh-hd b{font-weight:600}
.ix-sh-b{display:block;width:100%;padding:17px 12px;margin:0;border:0;border-top:1px solid rgba(255,255,255,.1);border-radius:0;background:none;color:#0a84ff;font:inherit;font-size:19px;cursor:pointer}
.ix-sh-hd+.ix-sh-b{border-top:1px solid rgba(255,255,255,.1)}
.ix-grp>.ix-sh-b:first-child{border-top:0}
.ix-del{color:#ff453a}
.ix-cancel{margin-top:8px;border-top:0;border-radius:14px;background:rgb(44,44,48);font-weight:600}
.ix-alert{position:fixed;left:50%;top:50%;width:270px;border-radius:14px;overflow:hidden;background:rgba(44,44,48,.94);-webkit-backdrop-filter:blur(30px);backdrop-filter:blur(30px);color:#fff;text-align:center;z-index:99975;transform:translate(-50%,-50%) scale(1.15);opacity:0;transition:opacity .2s ease,transform .4s ${SPRING}}
.ix-alert.on{opacity:1;transform:translate(-50%,-50%) scale(1);animation:ixWob .65s .12s ease-in-out}
@keyframes ixWob{0%{rotate:0deg}15%{rotate:-4deg}35%{rotate:3.5deg}55%{rotate:-2.5deg}75%{rotate:1.5deg}100%{rotate:0deg}}
.ix-al-t{padding:18px 16px 4px;font-size:17px;font-weight:600}
.ix-al-m{padding:0 16px 18px;font-size:13px;opacity:.85;line-height:1.35}
.ix-al-r{display:flex;border-top:1px solid rgba(255,255,255,.12)}
.ix-al-r .ix-sh-b{border-top:0;font-size:17px;padding:13px 8px}
.ix-al-r .ix-sh-b+.ix-sh-b{border-left:1px solid rgba(255,255,255,.12);font-weight:600}

/* 5. Swipe actions */
.ix-sw{position:relative;overflow:hidden}
.ix-sw-bar{position:absolute;top:0;right:0;bottom:0;width:0;display:flex;overflow:hidden}
.ix-sw-b{flex:1 1 0;min-width:0;display:flex;align-items:center;justify-content:center;border:0;border-radius:0;margin:0;padding:0;color:#fff;font:inherit;font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden}
.ix-sw-row{position:relative;touch-action:pan-y;will-change:transform;-webkit-user-select:none;user-select:none}

/* 6. Haptic halkası */
.ix-ring{position:fixed;z-index:99960;border-radius:50%;border:2px solid rgba(255,255,255,.75);box-sizing:border-box;pointer-events:none}

/* 7. Jiggle mode */
@keyframes ixJ1{0%{rotate:-1.5deg}50%{rotate:1.5deg}100%{rotate:-1.5deg}}
@keyframes ixJ2{0%{rotate:1.3deg}50%{rotate:-1.3deg}100%{rotate:1.3deg}}
@keyframes ixPop{from{scale:0}to{scale:1}}
@keyframes ixIn{from{opacity:0;transform:translateY(-14px) scale(.9)}to{opacity:1;transform:none}}
.ix-jitem{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}
.ix-j1{animation:ixJ1 .27s ease-in-out infinite}
.ix-j2{animation:ixJ2 .24s ease-in-out infinite}
.ix-jb{position:absolute;top:-8px;left:-8px;z-index:3;width:26px;height:26px;padding:0;margin:0;border:0;border-radius:50%;background:#8e8e93;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;animation:ixPop .35s ${SPRING} both}
.ix-jb svg{width:16px;height:16px}
.ix-done{position:fixed;top:calc(env(safe-area-inset-top,0px) + 12px);right:14px;z-index:99985;border:0;border-radius:999px;padding:9px 18px;background:rgba(255,255,255,.92);color:#000;font-size:15px;font-weight:600;box-shadow:0 6px 20px rgba(0,0,0,.3);animation:ixIn .4s ${SPRING} both}
[data-ios-jiggle],[data-ios-jiggle] *{-webkit-touch-callout:none}

@media (prefers-reduced-motion:reduce){
  .ix-j1,.ix-j2{animation:none}
  .ix-island,.ix-island *,.ix-live,.ix-hud,.ix-sheet,.ix-alert,.ix-back{transition-duration:.01s!important}
  .ix-alert.on{animation:none}
  .ix-draw{animation:none!important;stroke-dashoffset:0}
}`;
  document.head.appendChild(css);

  /* ============ 1. DYNAMIC ISLAND ============ */
  var islandCur = null;
  function island(o) {
    o = o || {};
    if (islandCur) islandCur.kill();
    var n = h('div', 'ix-island' + (o.sub ? '' : ' ix-slim'));
    n.setAttribute('role', 'status');
    var inn = h('div', 'ix-in');
    inn.appendChild(icon(o.icon || 'bolt'));
    var col = h('div', 'ix-col');
    col.appendChild(h('b', '', o.text || ''));
    if (o.sub) col.appendChild(h('small', '', o.sub));
    inn.appendChild(col); n.appendChild(inn); document.body.appendChild(n);
    var ts = [];
    function later(fn, ms) { ts.push(setTimeout(fn, ms)); }
    var cur = { kill: function () { ts.forEach(clearTimeout); n.remove(); if (islandCur === cur) islandCur = null; } };
    islandCur = cur;
    void n.offsetWidth; n.classList.add('on');
    var d = o.duration || 2600;
    later(function () { n.classList.add('open'); }, 90);
    later(function () { n.classList.remove('open'); }, 90 + d);
    later(function () { n.classList.remove('on'); }, 90 + d + 380);
    later(cur.kill, 90 + d + 850);
    return cur;
  }

  /* ============ 2. LIVE ACTIVITY ============ */
  var liveCur = null;
  function liveActivity(o) {
    o = o || {};
    if (liveCur) liveCur.end(null, true);
    var n = h('div', 'ix-live'); n.setAttribute('role', 'status');
    var r = h('div', 'ix-live-r');
    var ic = icon(o.icon || 'bolt');
    var col = h('div', 'ix-col');
    var tt = h('b', '', o.title || ''), sb = h('small', '', o.subtitle || '');
    col.appendChild(tt); col.appendChild(sb);
    var pct = h('span', 'ix-pct', '0%');
    r.appendChild(ic); r.appendChild(col); r.appendChild(pct);
    var bar = h('div', 'ix-bar'), fill = h('i'); bar.appendChild(fill);
    n.appendChild(r); n.appendChild(bar); document.body.appendChild(n);
    var ended = false;
    function set(v) { v = clamp(v); fill.style.width = (v * 100) + '%'; pct.textContent = Math.round(v * 100) + '%'; }
    var api = {
      update: function (u) {
        if (ended || !u) return;
        if (u.title != null) tt.textContent = u.title;
        if (u.subtitle != null) sb.textContent = u.subtitle;
        if (u.progress != null) set(u.progress);
      },
      end: function (text, instant) {
        if (ended) return; ended = true;
        if (liveCur === api) liveCur = null;
        if (instant) { n.remove(); return; }
        sb.textContent = (text != null) ? text : 'Tamamlandı';
        set(1);
        r.replaceChild(icon('check'), ic);
        setTimeout(function () { n.classList.remove('on'); }, 1500);
        setTimeout(function () { n.remove(); }, 2200);
      }
    };
    liveCur = api;
    void n.offsetWidth; n.classList.add('on');
    setTimeout(function () { set(o.progress || 0); }, 60);
    return api;
  }

  /* ============ 3. HUD ============ */
  var hudCur = null;
  function hud(o) {
    o = o || {};
    if (hudCur) { clearTimeout(hudCur.t); hudCur.n.remove(); }
    var n = h('div', 'ix-hud'); n.setAttribute('role', 'status');
    n.appendChild(icon(o.icon || 'check'));
    n.appendChild(h('span', '', o.text || ''));
    document.body.appendChild(n);
    void n.offsetWidth; n.classList.add('on');
    if (o.haptic !== false) vib(VIB.light);
    var cur = { n: n };
    cur.t = setTimeout(function () {
      n.classList.add('out');
      setTimeout(function () { n.remove(); if (hudCur === cur) hudCur = null; }, 320);
    }, o.duration || 1400);
    hudCur = cur;
    return n;
  }

  /* ============ 4. ACTION SHEET ============ */
  function actionSheet(o) {
    o = o || {};
    var acts = o.actions || [], closed = false;
    var back = h('div', 'ix-back');
    var sh = h('div', 'ix-sheet'); sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true');
    var grp = h('div', 'ix-grp');
    if (o.title || o.message) {
      var hd = h('div', 'ix-sh-hd');
      if (o.title) hd.appendChild(h('b', '', o.title));
      if (o.message) hd.appendChild(h('span', '', o.message));
      grp.appendChild(hd);
    }
    acts.forEach(function (a) {
      var b = h('button', 'ix-sh-b' + (a.destructive ? ' ix-del' : ''), a.label); b.type = 'button';
      b.addEventListener('click', function () { close(); setTimeout(function () { if (a.onClick) a.onClick(); }, 60); });
      grp.appendChild(b);
    });
    var cancel = h('button', 'ix-sh-b ix-cancel', o.cancelLabel || 'İptal'); cancel.type = 'button';
    cancel.addEventListener('click', close);
    sh.appendChild(grp); sh.appendChild(cancel);
    document.body.appendChild(back); document.body.appendChild(sh);
    function key(e) { if (e.key === 'Escape') close(); }
    function close() {
      if (closed) return; closed = true;
      back.classList.remove('on'); sh.classList.remove('on');
      document.removeEventListener('keydown', key);
      setTimeout(function () { back.remove(); sh.remove(); }, 520);
      if (o.onClose) o.onClose();
    }
    back.addEventListener('click', close);
    document.addEventListener('keydown', key);
    void sh.offsetWidth; back.classList.add('on'); sh.classList.add('on');
    return close;
  }

  /* ============ 6. HAPTIC FEEDBACK ============ */
  function ring(el, type) {
    var r = el.getBoundingClientRect(); if (!r.width) return;
    var s = Math.min(120, Math.max(r.width, r.height));
    var n = h('i', 'ix-ring');
    n.style.cssText = 'left:' + (r.left + r.width / 2) + 'px;top:' + (r.top + r.height / 2) + 'px;width:' + s + 'px;height:' + s + 'px';
    if (type === 'success') n.style.borderColor = '#30d158';
    document.body.appendChild(n);
    var a = n.animate([
      { transform: 'translate(-50%,-50%) scale(.6)', opacity: .55 },
      { transform: 'translate(-50%,-50%) scale(1.9)', opacity: 0 }
    ], { duration: 520, easing: 'cubic-bezier(.2,.8,.3,1)' });
    a.onfinish = function () { n.remove(); };
  }
  function haptic(el, type, vibrate) {
    type = type || 'light';
    if (vibrate !== false) vib(VIB[type] || VIB.light);
    if (!el || REDUCE || !el.animate) return;
    if (type === 'error') {
      el.animate([{ translate: '0 0' }, { translate: '-7px 0' }, { translate: '6px 0' }, { translate: '-5px 0' }, { translate: '3px 0' }, { translate: '0 0' }], { duration: 420, easing: 'ease-out' });
      return;
    }
    var k = { light: .96, select: .98, medium: .93, heavy: .88, success: .94 }[type] || .96;
    el.animate([{ scale: 1 }, { scale: k, offset: .35 }, { scale: 1 }], { duration: type === 'success' ? 420 : 260, easing: SPRING });
    ring(el, type);
  }

  /* ============ 8. SYMBOL EFFECT ============ */
  function symbol(el, effect, o) {
    o = o || {}; effect = effect || 'bounce';
    var anims = [], it = o.loop ? Infinity : 1;
    var api = { cancel: function () { anims.forEach(function (a) { a.cancel(); }); } };
    if (!el || !el.animate || REDUCE) return api;
    function A(t, k, opt) { opt.iterations = it; var a = t.animate(k, opt); anims.push(a); return a; }
    if (effect === 'pulse') {
      A(el, [{ opacity: 1 }, { opacity: .3 }, { opacity: 1 }], { duration: 900, easing: 'ease-in-out' });
    } else if (effect === 'scale') {
      A(el, [{ scale: 1 }, { scale: 1.28 }, { scale: 1 }], { duration: 520, easing: SPRING });
    } else if (effect === 'wiggle') {
      A(el, [{ rotate: '0deg' }, { rotate: '-14deg' }, { rotate: '12deg' }, { rotate: '-8deg' }, { rotate: '5deg' }, { rotate: '0deg' }], { duration: 700, easing: 'ease-in-out' });
    } else if (effect === 'variable') {
      var parts = el.querySelectorAll('path,circle,rect,line');
      [].forEach.call(parts, function (p, i) {
        A(p, [{ opacity: .25 }, { opacity: 1 }, { opacity: .25 }], { duration: 750, delay: i * 150, fill: 'backwards', easing: 'ease-in-out' });
      });
    } else {
      A(el, [{ translate: '0 0' }, { translate: '0 -10px', offset: .3 }, { translate: '0 0', offset: .55 }, { translate: '0 -4px', offset: .75 }, { translate: '0 0' }], { duration: 650, easing: 'ease-out' });
    }
    return api;
  }

  /* ============ 5. SWIPE ACTIONS ============ */
  var swRegistry = [];
  function collapse(wrap) {
    var hh = wrap.offsetHeight;
    wrap.style.height = hh + 'px';
    wrap.style.transition = 'height .32s ease,opacity .32s ease';
    void wrap.offsetHeight;
    wrap.style.height = '0'; wrap.style.opacity = '0';
    setTimeout(function () { wrap.remove(); }, 340);
  }
  function swipeActions(row, actions, opts) {
    opts = opts || {};
    if (!row || !row.parentNode) return null;
    if (row.__ixSw) return row.__ixSw;
    actions = actions || [];
    var BW = opts.width || 84, W = Math.max(1, actions.length) * BW;
    var wrap = h('div', 'ix-sw ux-noswipe'), bar = h('div', 'ix-sw-bar');
    var x = 0, sx = 0, sy = 0, base = 0, lock = '', id = null, moved = 0, armed = false;

    function set(v, anim) {
      x = v;
      row.style.transition = anim ? 'transform .45s ' + SPRING : 'none';
      row.style.transform = 'translateX(' + v + 'px)';
      bar.style.transition = anim ? 'width .45s ' + SPRING : 'none';
      bar.style.width = Math.max(0, -v) + 'px';
    }
    function close() { set(0, true); }
    function fire(a) {
      haptic(null, 'medium');
      if (a.onClick) a.onClick(row);
      if (a.remove) { var i = swRegistry.indexOf(api); if (i > -1) swRegistry.splice(i, 1); collapse(wrap); } else close();
    }

    row.parentNode.insertBefore(wrap, row);
    wrap.appendChild(bar); wrap.appendChild(row);
    row.classList.add('ix-sw-row');
    actions.forEach(function (a) {
      var b = h('button', 'ix-sw-b', a.label); b.type = 'button';
      b.style.background = a.color || '#ff3b30';
      b.addEventListener('click', function (e) { e.stopPropagation(); fire(a); });
      bar.appendChild(b);
    });

    function down(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      id = e.pointerId; sx = e.clientX; sy = e.clientY; base = x; lock = ''; moved = 0; armed = false;
    }
    function move(e) {
      if (e.pointerId !== id) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!lock) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        lock = (Math.abs(dx) > Math.abs(dy) * 1.3) ? 'x' : 'y';
        if (lock === 'x') { try { row.setPointerCapture(id); } catch (_) {} }
      }
      if (lock !== 'x') return;
      moved = Math.abs(dx);
      var v = base + dx;
      if (v > 0) v = v * .2;
      if (v < -W) v = -W + (v + W) * .4;
      set(v, false);
      var full = v < -(W + 40);
      if (full && !armed) { armed = true; haptic(null, 'select'); }
      if (!full && armed) armed = false;
    }
    function up(e) {
      if (e.pointerId !== id) return;
      id = null;
      if (lock !== 'x') return;
      if (x < -(W + 40) && actions.length) fire(actions[actions.length - 1]);
      else if (x < -W * .45) set(-W, true);
      else close();
    }
    function clickGuard(e) {
      if (moved > 8) { e.preventDefault(); e.stopPropagation(); moved = 0; }
      else if (x < -5) { e.preventDefault(); e.stopPropagation(); close(); }
    }
    row.addEventListener('pointerdown', down);
    row.addEventListener('pointermove', move);
    row.addEventListener('pointerup', up);
    row.addEventListener('pointercancel', up);
    row.addEventListener('click', clickGuard, true);

    var api = {
      wrap: wrap,
      open: function () { set(-W, true); },
      close: close,
      isOpen: function () { return x < -5; },
      destroy: function () {
        row.removeEventListener('pointerdown', down); row.removeEventListener('pointermove', move);
        row.removeEventListener('pointerup', up); row.removeEventListener('pointercancel', up);
        row.removeEventListener('click', clickGuard, true);
        row.style.transform = ''; row.style.transition = ''; row.classList.remove('ix-sw-row');
        wrap.parentNode.insertBefore(row, wrap); wrap.remove();
        var i = swRegistry.indexOf(api); if (i > -1) swRegistry.splice(i, 1);
        row.__ixSw = null;
      }
    };
    row.__ixSw = api; swRegistry.push(api);
    return api;
  }
  // başka yere dokununca açık satırlar kapanır
  document.addEventListener('pointerdown', function (e) {
    swRegistry.forEach(function (a) { if (a.isOpen() && !a.wrap.contains(e.target)) a.close(); });
  }, true);

  // HTML'den kullanım: <div data-ios-swipe="sil,arsiv">
  var PRESET = {
    sil: ['Sil', '#ff3b30', 1], delete: ['Sil', '#ff3b30', 1],
    arsiv: ['Arşiv', '#0a84ff', 0], archive: ['Arşiv', '#0a84ff', 0],
    sabitle: ['Sabitle', '#ff9f0a', 0], pin: ['Sabitle', '#ff9f0a', 0]
  };
  function autoSwipe(row) {
    if (row.__ixSw) return;
    var keys = (row.getAttribute('data-ios-swipe') || 'sil').split(',').map(function (s) { return s.trim(); });
    var acts = keys.filter(function (k) { return PRESET[k]; }).map(function (k) {
      var p = PRESET[k];
      return { label: p[0], color: p[1], remove: !!p[2], onClick: function () {
        row.dispatchEvent(new CustomEvent('ios-swipe', { bubbles: true, detail: { action: k, row: row } }));
      } };
    });
    if (acts.length) swipeActions(row, acts);
  }
  var scanQ = false;
  function scan() {
    scanQ = false;
    [].forEach.call(document.querySelectorAll('[data-ios-swipe]'), autoSwipe);
  }
  function queueScan() { if (!scanQ) { scanQ = true; requestAnimationFrame(scan); } }
  new MutationObserver(queueScan).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', queueScan); else queueScan();

  /* ============ 7. JIGGLE MODE ============ */
  var jig = null;
  function jiggleStart(container, o) {
    o = o || {};
    if (!container) return;
    if (jig) jiggleStop();
    var list = [].slice.call(o.selector ? container.querySelectorAll(o.selector) : container.children);
    var cur = { c: container, o: o, items: [], done: null, key: null, block: null };
    jig = cur;
    list.forEach(function (it, i) {
      it.classList.add('ix-jitem', i % 2 ? 'ix-j1' : 'ix-j2');
      it.style.animationDelay = (-(i % 5) * 0.05) + 's';
      var forced = false;
      if (getComputedStyle(it).position === 'static') { it.style.position = 'relative'; forced = true; }
      var b = h('button', 'ix-jb'); b.type = 'button'; b.setAttribute('aria-label', 'Kaldır'); b.innerHTML = svg('minus');
      b.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); removeItem(it); });
      it.appendChild(b);
      cur.items.push({ it: it, b: b, forced: forced });
    });
    cur.block = function (e) { if (e.target.closest && e.target.closest('.ix-jb')) return; e.preventDefault(); e.stopPropagation(); };
    container.addEventListener('click', cur.block, true);
    cur.done = h('button', 'ix-done', o.doneLabel || 'Bitti'); cur.done.type = 'button';
    cur.done.addEventListener('click', jiggleStop);
    document.body.appendChild(cur.done);
    cur.key = function (e) { if (e.key === 'Escape') jiggleStop(); };
    document.addEventListener('keydown', cur.key);
  }
  function removeItem(it) {
    var cur = jig; if (!cur) return;
    function finish() {
      var ok = cur.o.onRemove ? cur.o.onRemove(it) !== false : true;
      if (ok) ok = it.dispatchEvent(new CustomEvent('ios-remove', { bubbles: true, cancelable: true, detail: { item: it } }));
      if (ok) {
        cur.items = cur.items.filter(function (x) { return x.it !== it; });
        it.remove();
      }
    }
    if (it.animate && !REDUCE) {
      var a = it.animate([{ scale: 1, opacity: 1 }, { scale: .2, opacity: 0 }], { duration: 240, easing: 'ease-in' });
      a.onfinish = finish;
    } else finish();
  }
  function jiggleStop() {
    var cur = jig; if (!cur) return;
    jig = null;
    cur.items.forEach(function (x) {
      x.it.classList.remove('ix-jitem', 'ix-j1', 'ix-j2');
      x.it.style.animationDelay = '';
      if (x.forced) x.it.style.position = '';
      x.b.remove();
    });
    cur.c.removeEventListener('click', cur.block, true);
    document.removeEventListener('keydown', cur.key);
    cur.done.remove();
    if (cur.o.onDone) cur.o.onDone();
  }
  // HTML'den kullanım: <div data-ios-jiggle> (isteğe bağlı data-ios-jiggle-item=".kart") -> uzun bas
  document.addEventListener('pointerdown', function (e) {
    if (jig || !e.target.closest) return;
    var c = e.target.closest('[data-ios-jiggle]'); if (!c) return;
    var sel = c.getAttribute('data-ios-jiggle-item') || null, item = null;
    if (sel) item = e.target.closest(sel);
    else { item = e.target; while (item && item.parentElement !== c) item = item.parentElement; }
    if (!item || !c.contains(item)) return;
    var sx = e.clientX, sy = e.clientY;
    var t = setTimeout(function () {
      cleanup();
      jiggleStart(c, { selector: sel });
      haptic(item, 'medium');
    }, 550);
    function mv(ev) { if (Math.abs(ev.clientX - sx) > 8 || Math.abs(ev.clientY - sy) > 8) cleanup(); }
    function cleanup() {
      clearTimeout(t);
      document.removeEventListener('pointermove', mv, true);
      document.removeEventListener('pointerup', cleanup, true);
      document.removeEventListener('pointercancel', cleanup, true);
    }
    document.addEventListener('pointermove', mv, true);
    document.addEventListener('pointerup', cleanup, true);
    document.addEventListener('pointercancel', cleanup, true);
  }, true);

  /* ============ 9. SHAKE TO UNDO ============ */
  function undoAlert(onUndo, o) {
    o = o || {};
    var closed = false;
    var back = h('div', 'ix-back');
    var al = h('div', 'ix-alert'); al.setAttribute('role', 'alertdialog'); al.setAttribute('aria-modal', 'true');
    al.appendChild(h('div', 'ix-al-t', o.title || 'Geri Al'));
    al.appendChild(h('div', 'ix-al-m', o.message || 'Son işlem geri alınsın mı?'));
    var row = h('div', 'ix-al-r');
    var no = h('button', 'ix-sh-b', o.cancelLabel || 'İptal'); no.type = 'button';
    var yes = h('button', 'ix-sh-b', o.okLabel || 'Geri Al'); yes.type = 'button';
    row.appendChild(no); row.appendChild(yes); al.appendChild(row);
    document.body.appendChild(back); document.body.appendChild(al);
    function key(e) { if (e.key === 'Escape') close(); }
    function close() {
      if (closed) return; closed = true;
      back.classList.remove('on'); al.classList.remove('on');
      document.removeEventListener('keydown', key);
      setTimeout(function () { back.remove(); al.remove(); }, 450);
    }
    no.addEventListener('click', close);
    yes.addEventListener('click', function () { close(); haptic(null, 'success'); if (onUndo) onUndo(); });
    back.addEventListener('click', close);
    document.addEventListener('keydown', key);
    void al.offsetWidth; back.classList.add('on'); al.classList.add('on');
    vib(VIB.medium);
    return close;
  }

  var shakeFn = null, shakeOn = false, permAsked = false;
  var lx = 0, ly = 0, lz = 0, hits = [], lastFire = 0;
  function motion(e) {
    var a = e.accelerationIncludingGravity;
    if (!a || a.x == null) return;
    var d = Math.abs(a.x - lx) + Math.abs(a.y - ly) + Math.abs(a.z - lz);
    lx = a.x; ly = a.y; lz = a.z;
    if (d < 30) return;
    var now = Date.now();
    hits = hits.filter(function (t) { return now - t < 900; });
    if (hits.length && now - hits[hits.length - 1] < 120) return;
    hits.push(now);
    if (hits.length >= 3 && now - lastFire > 2500) {
      hits = []; lastFire = now;
      if (shakeFn) undoAlert(shakeFn);
    }
  }
  function askPerm() {
    if (permAsked) return; permAsked = true;
    try {
      if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) DeviceMotionEvent.requestPermission().catch(function () {});
    } catch (_) {}
  }
  function shakeToUndo(fn) {
    shakeFn = fn;
    if (!shakeOn) {
      shakeOn = true;
      window.addEventListener('devicemotion', motion);
      document.addEventListener('pointerdown', askPerm, { once: true, capture: true });
    }
    return function () { if (shakeFn === fn) shakeFn = null; };
  }

  /* ============ Otomatik bağlantılar ============ */
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    // 6. anahtar / checkbox: görsel halka (titreşimi ux.js zaten veriyor)
    var sw = t.closest('[role=switch],input[type=checkbox]');
    if (sw) haptic(sw, 'light', false);
    // 8. alt menü ikonları zıplar
    var d = t.closest('.dock-btn');
    if (d) { var s = d.querySelector('svg'); if (s) symbol(s, 'bounce'); return; }
    var ds = t.closest('[data-ios-symbol]');
    if (ds) symbol(ds.querySelector('svg') || ds, ds.getAttribute('data-ios-symbol'));
  }, true);

  window.iosFx = {
    island: island, liveActivity: liveActivity, hud: hud, actionSheet: actionSheet,
    swipeActions: swipeActions, haptic: haptic,
    jiggle: { start: jiggleStart, stop: jiggleStop },
    symbol: symbol, shakeToUndo: shakeToUndo, undoAlert: undoAlert,
    icon: svg, icons: Object.keys(ICONS)
  };
})();
