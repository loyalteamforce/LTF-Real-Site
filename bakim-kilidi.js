// ============================================================
// BAKIM MODU ANAHTARI
//   BAKIM = true  -> site bakımda: herkes bakim.html'e yönlenir
//   BAKIM = false -> site normal açılır
// Siteyi tekrar açmak için SADECE aşağıdaki true'yu false yap ve bu dosyayı yükle.
// ============================================================
(function () {
  var BAKIM = true;
  if (!BAKIM) return;
  if (location.pathname.indexOf('bakim') !== -1) return;   // bakım sayfasında dönme
  document.documentElement.style.visibility = 'hidden';     // yönlenirken sayfa görünmesin
  location.replace('bakim.html');
})();