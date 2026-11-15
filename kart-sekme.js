/* ============================================================
   KART SEKMESİ
   - Alt menüye "Kart" butonu ekler (Profil'in soluna). Basınca kart.html tam ekran açılır:
     kart seç, onayla, sipariş verildi, fiş yazdırma animasyonu ve LTF üye kartı.
   - config.js bu dosyayı kendisi yükler; app.html'ye ekleme gerekmez.
   ============================================================ */
(function () {
  function init() {
    var bar = document.getElementById('dockBar');
    if (!bar || document.getElementById('ltfKartBtn')) return;

    var btn = document.createElement('button');
    btn.id = 'ltfKartBtn'; btn.className = 'dock-btn'; btn.type = 'button';
    btn.dataset.label = 'Kart'; btn.title = 'Kart'; btn.setAttribute('aria-label', 'Kart');
    btn.innerHTML = '<svg viewBox="0 0 18 18"><rect x="2" y="4" width="14" height="10" rx="2"/><path d="M2 8h14M5 11.5h3"/></svg>';
    var prof = bar.querySelector('.dock-btn[data-view="profil"]');
    if (prof) bar.insertBefore(btn, prof); else bar.appendChild(btn);

    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:90;display:none;background:#f4f1ee';
    var fr = document.createElement('iframe');
    fr.title = 'LTF Kart'; fr.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;background:#f4f1ee';
    var x = document.createElement('button');
    x.type = 'button'; x.setAttribute('aria-label', 'Kapat'); x.textContent = '\u00d7';
    x.style.cssText = 'position:absolute;z-index:2;right:14px;top:max(12px,env(safe-area-inset-top));width:40px;height:40px;border:0;border-radius:50%;background:rgba(0,0,0,.85);color:#fff;font-size:24px;line-height:1;cursor:pointer';
    ov.append(fr, x); document.body.appendChild(ov);

    function open() { if (!fr.getAttribute('src')) fr.src = 'kart.html'; ov.style.display = 'block'; document.body.style.overflow = 'hidden'; }
    function close() { ov.style.display = 'none'; document.body.style.overflow = ''; }
    btn.addEventListener('click', open);
    x.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.style.display === 'block') close(); });

    if (window.__dockInd) window.__dockInd(true);   // yeni buton eklendi, gösterge konumu yenilensin
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
