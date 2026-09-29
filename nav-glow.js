// ============================================================
// NAV GLOW — mobil alt menüdeki aktif ikonun altında kayan ışık.
// Yalnızca görsel: sekme değiştirme mantığına dokunmaz, app.html
// içindeki mevcut tıklama dinleyicileri .nav-btn.active sınıfını
// zaten değiştiriyor; bu script sadece ışığı o düğmenin altına taşır.
// nav-pill.css'ten SONRA yüklenmeli.
// ============================================================
(function () {
  function init() {
    var nav = document.querySelector(".sidebar-nav");
    if (!nav) return;

    var glow = nav.querySelector(".nav-glow");
    if (!glow) {
      glow = document.createElement("div");
      glow.className = "nav-glow";
      nav.insertBefore(glow, nav.firstChild);
    }

    function isMobile() {
      return window.matchMedia("(max-width: 760px)").matches;
    }

    function place(immediate) {
      if (!isMobile()) { glow.classList.remove("ready"); return; }
      var active = nav.querySelector(".nav-btn.active");
      if (!active || active.offsetParent === null) { glow.classList.remove("ready"); return; }
      var navRect = nav.getBoundingClientRect();
      var btnRect = active.getBoundingClientRect();
      var centerX = btnRect.left - navRect.left + btnRect.width / 2;
      if (immediate) glow.style.transition = "none";
      glow.style.left = centerX + "px";
      glow.classList.add("ready");
      if (immediate) {
        // reflow sonrası geçişi geri aç
        void glow.offsetWidth;
        glow.style.transition = "";
      }
    }

    // Menüdeki her tıklamadan sonra aktif sınıf uygulanmış olsun diye
    // bir sonraki event turunda konumlandır.
    nav.addEventListener("click", function () { setTimeout(function () { place(false); }, 0); });

    window.addEventListener("resize", function () { place(true); });
    window.addEventListener("orientationchange", function () { setTimeout(function () { place(true); }, 150); });

    // Sekmeler başka bir script tarafından da değiştirilebilir (ör. showView).
    var mo = new MutationObserver(function () { place(false); });
    nav.querySelectorAll(".nav-btn").forEach(function (b) {
      mo.observe(b, { attributes: true, attributeFilter: ["class"] });
    });

    // İlk yerleşim: yazı tipleri/ikonlar oturduktan sonra.
    requestAnimationFrame(function () { place(true); });
    window.addEventListener("load", function () { place(true); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();