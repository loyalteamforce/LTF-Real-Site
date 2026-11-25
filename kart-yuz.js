/* ============================================================
   KART YÜZÜ: LTF üye kartı. Platin / Gümüş / Altın.
   - Sade ve resmî görünüm: arka plansız LTF kalkanı (siyah zemin yok), ince iç çerçeve, parlama/çizgi dokusu yok.
   - Sol üstte LTF kalkanı + "LOYAL ELITE FORCE", ortada No / Ad / Yol / Tür, tek satırlık üyelik yazısı, barkod,
     sağda KARE profil fotoğrafı (hesabın kendi fotoğrafı; ince gri çerçeveli, kimlik fotoğrafı gibi), rozet.
   - Ad: ARTIK KESİLMEZ. Önce tek satırda küçülür, sığmazsa en yakın boşluktan 2 satıra bölünür,
     yine uzunsa yazı daha da küçülür. Yazı fotoğraf çerçevesinin ve kart çizgilerinin ÜSTÜNDEN geçebilir (taşma kesilmez).
   - Varsayılan ad yazı tipi: Cormorant Garamond (dar ve zarif; Cinzel çok genişti). Diğer yazı tipleri seçilebilir.
   - kart.html (sipariş akışı) ve ana sayfadaki kart bu dosyayı kullanır.
   - card(k, {n:ad, y:yol, t:tür, p:fotoğraf adresi, f:yazı tipi anahtarı})
   ============================================================ */
(function () {
  var T = { p: ['Platin', '#f9f9fb', '#d1d3d8'], s: ['Gümüş', '#eceef0', '#aeb2b9'], g: ['Altın', '#f8e9bb', '#c7a455'] };
  var KEYS = ['p', 's', 'g'];
  // [görünen ad, font-family, el yazısı mı (büyük harfe çevrilmez), ortalama harf genişliği (em)]
  var FONTS = {
    cormorant: ['Cormorant Garamond', "'Cormorant Garamond',Georgia,serif", 0, 0.56],
    cinzel: ['Cinzel', "'Cinzel',Georgia,serif", 0, 0.8],
    playfair: ['Playfair Display', "'Playfair Display',Georgia,serif", 0, 0.74],
    bebas: ['Bebas Neue', "'Bebas Neue',Impact,sans-serif", 0, 0.46],
    anton: ['Anton', "Anton,Impact,sans-serif", 0, 0.5],
    oswald: ['Oswald', "Oswald,'Arial Narrow',sans-serif", 0, 0.55],
    mono: ['Space Mono', "'Space Mono',Consolas,monospace", 0, 0.62],
    dancing: ['Dancing Script', "'Dancing Script','Segoe Script',cursive", 1, 0.5],
    pacifico: ['Pacifico', "Pacifico,'Brush Script MT',cursive", 1, 0.56],
    caveat: ['Caveat', "Caveat,'Segoe Script',cursive", 1, 0.42],
    lobster: ['Lobster', "Lobster,'Brush Script MT',cursive", 1, 0.52],
    sistem: ['Varsayılan', "system-ui,-apple-system,'Segoe UI',sans-serif", 0, 0.62]
  };
  var FONT_URL = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&family=Cinzel:wght@700&family=Playfair+Display:wght@700&family=Bebas+Neue&family=Anton&family=Oswald:wght@600&family=Space+Mono:wght@700&family=Dancing+Script:wght@700&family=Pacifico&family=Caveat:wght@700&family=Lobster&family=Inter:wght@500;600;700&display=swap';
  // Kartın yazı tipleri her sayfada yüklensin (eskiden sadece kart.html'de yükleniyordu, Ana Sayfa'daki kart Georgia/Times'a düşüyordu)
  if (!document.querySelector('link[data-ltfk-font]')) { var fl = document.createElement('link'); fl.rel = 'stylesheet'; fl.href = FONT_URL; fl.setAttribute('data-ltfk-font', ''); document.head.appendChild(fl); }
  var SIL = '<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="4.2"/><path d="M3.5 22c.8-4.6 4.2-7 8.5-7s7.7 2.4 8.5 7z"/></svg>';
  var PH_OK = /^(data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+|https:\/\/mbyyuovlipbpioxtkjcp\.supabase\.co\/storage\/v1\/object\/public\/[^\s"'<>]+)$/;
  var AVAIL = 45;   // adın kullanabileceği genişlik (cqw): "Ad" etiketinden fotoğrafın soluna kadar

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function num(n) { var h = 7; n = String(n); for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 9973; return String(h).padStart(4, '0'); }
  function bars(seed) { var x = seed, h = ''; for (var i = 0; i < 46; i++) { x = (x * 1103515245 + 12345) & 0x7fffffff; h += '<s style="flex:' + (1 + x % 4) + '"></s><s style="flex:' + (1 + (x >> 3) % 3) + ';background:none"></s>'; } return h; }

  var CSS = [
    '.idc{container-type:inline-size;position:relative;width:100%;aspect-ratio:1.57/1;border-radius:14px;background:linear-gradient(135deg,var(--c1,#f1f1f1),var(--c2,#d6d6d6));border:1px solid rgba(0,0,0,.14);box-shadow:0 10px 24px -14px rgba(0,0,0,.35);color:#161616;overflow:visible;flex:none}',
    '.idc *{position:absolute}',
    /* resmî görünüm: ince iç çerçeve (çizgi dokusu ve parlama kaldırıldı) */
    '.idc::before{content:"";position:absolute;inset:1.6cqw;border-radius:1.2cqw;border:.25cqw solid rgba(0,0,0,.14);pointer-events:none}',
    /* kalkan logosu: arka plan YOK, sadece şeffaf logo */
    '.idc .lg{left:4cqw;top:4cqw;width:15cqw;height:15cqw;display:grid;place-items:center;background:none}',
    '.idc .lg img{position:static;width:100%;height:100%;object-fit:contain;background:none}',
    '.idc .ht{left:21.5cqw;top:6cqw;font:700 3.2cqw/1.3 Cinzel,"Cormorant Garamond",Georgia,serif;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap}',
    '.idc .ht small{position:static;display:block;font:600 2.1cqw/1.5 Inter,system-ui,sans-serif;letter-spacing:.22em;color:rgba(0,0,0,.6)}',
    '.idc .f{left:4cqw;display:flex;align-items:baseline;gap:2cqw;white-space:nowrap}',
    '.idc .f i{position:static;font:600 2.15cqw Inter,system-ui,sans-serif;font-style:normal;text-transform:uppercase;letter-spacing:.16em;color:rgba(0,0,0,.55);width:13cqw;flex:none}',
    '.idc .f b{position:static;font:600 3.6cqw/1.1 Inter,system-ui,sans-serif;letter-spacing:.01em}',
    '.idc .f.n b{font:700 3.4cqw "Space Mono",ui-monospace,Consolas,monospace;letter-spacing:.12em}',
    '.idc .f.n{top:18.6cqw}.idc .f.nm{top:25.2cqw;z-index:3}.idc .f.nm.two{top:24.2cqw;align-items:flex-start}.idc .f.y{top:35.4cqw}.idc .f.t{top:41cqw}',
    '.idc .f.nm.two i{margin-top:1.3cqw}',
    /* ad: kesilmez, taşarsa çizgilerin üstünden geçer */
    '.idc .f.nm b{display:block;max-width:none;overflow:visible;text-overflow:clip;font-weight:700;line-height:1.08;white-space:nowrap;text-shadow:0 0 .8cqw rgba(255,255,255,.55)}',
    /* üyelik yazısı kısa ve tek satır: karta sığar, barkodun üstüne binmez */
    '.idc .cert{left:4cqw;top:47.5cqw;width:56cqw;font:500 2.2cqw/1.3 Inter,system-ui,sans-serif;letter-spacing:.04em;color:rgba(0,0,0,.65);white-space:nowrap}',
    /* fotoğraf: sade, ince gri çerçeve, kimlik fotoğrafı gibi */
    '.idc .ph{right:4cqw;top:20cqw;width:28cqw;height:28cqw;border:.3cqw solid #6b6b72;border-radius:.6cqw;background:#ececef;overflow:hidden;z-index:1}',
    '.idc .ph img{position:static;width:100%;height:100%;object-fit:cover;filter:grayscale(.3) contrast(1.02)}',
    '.idc .ph svg{width:100%;height:100%;fill:#b9b9c0}',
    '.idc .bdg{right:27cqw;top:14.5cqw;width:11cqw;height:11cqw;border-radius:50%;background:#fff;border:.3cqw solid #55555b;display:grid;place-items:center;text-align:center;font:700 3.2cqw/1 Cinzel,Georgia,serif;z-index:2}',
    '.idc .bdg small{position:static;display:block;font:700 1.45cqw Inter,system-ui,sans-serif;letter-spacing:.06em;margin-top:.5cqw}',
    '.idc .bc{left:4cqw;bottom:3.5cqw;width:50cqw;height:5.5cqw;display:flex}',
    '.idc .bc s{position:static;display:block;background:#111}'
  ].join('\n');

  /* Adı sığdır: tek satır -> olmazsa 2 satır -> olmazsa daha küçük yazı. Hiçbir zaman "…" ile kesilmez. */
  function fit(text, w) {
    var cw = w, MAXF = 6.2, MINF = 2.4, one = Math.min(MAXF, AVAIL / (Math.max(1, text.length) * cw));
    if (one >= 4.2 || text.indexOf(' ') === -1 && text.length < 14) return { html: esc(text), fs: Math.max(MINF, one), two: false };
    // en yakın boşluktan ikiye böl
    var mid = text.length / 2, best = -1, i;
    for (i = 0; i < text.length; i++) if (text.charAt(i) === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
    var a, b;
    if (best > 0) { a = text.slice(0, best); b = text.slice(best + 1); }
    else { var h = Math.ceil(text.length / 2); a = text.slice(0, h); b = text.slice(h); }
    var longest = Math.max(a.length, b.length), fs2 = Math.min(4.6, AVAIL / (longest * cw));
    if (fs2 <= one) return { html: esc(text), fs: Math.max(MINF, one), two: false };
    return { html: esc(a) + '<br>' + esc(b), fs: Math.max(MINF, fs2), two: true };
  }

  function card(k, o) {
    o = o || {};
    var t = T[k] || T.p, raw = String(o.n || '').trim() || 'LTF ÜYESİ', n = raw.toLocaleUpperCase('tr'), id = num(n);
    var yol = String(o.y || '').trim() || t[0], tur = String(o.t || '').trim() || 'Kalkan';
    var fk = (!o.f || o.f === 'cinzel') ? 'cormorant' : o.f;   // eski varsayılan Cinzel de yeni yazı tipine geçer
    var fo = FONTS[fk] || FONTS.cormorant, shown = fo[2] ? raw : n;
    var ft = fit(shown, fo[3] || .6);
    var ph = PH_OK.test(o.p || '') ? '<img src="' + o.p + '" alt="" referrerpolicy="no-referrer">' : SIL;
    return '<div class="idc" style="--c1:' + t[1] + ';--c2:' + t[2] + '">' +
      '<div class="lg"><img src="crest.webp" alt="LTF" onerror="this.onerror=null;this.src=\'lef-logo.webp\'"></div>' +
      '<div class="ht">Loyal Elite Force<small>LTF Resmî Üye Kartı</small></div>' +
      '<div class="f n"><i>No</i><b>' + id + '</b></div>' +
      '<div class="f nm' + (ft.two ? ' two' : '') + '"><i>Ad</i><b style="font-family:' + fo[1] + ';font-size:' + ft.fs.toFixed(2) + 'cqw">' + ft.html + '</b></div>' +
      '<div class="f y"><i>Yol</i><b>' + esc(yol) + '</b></div>' +
      '<div class="f t"><i>Tür</i><b>' + esc(tur) + '</b></div>' +
      '<div class="cert">Loyal Elite Force üyesidir.</div>' +
      '<div class="bc">' + bars(+id + 7) + '</div>' +
      '<div class="bdg"><span>5★<small>' + esc(yol.toLocaleUpperCase('tr').slice(0, 8)) + '</small></span></div>' +
      '<div class="ph">' + ph + '</div></div>';
  }

  window.LTFKart = { T: T, KEYS: KEYS, FONTS: FONTS, FONT_URL: FONT_URL, css: CSS, card: card, num: num, bars: bars, esc: esc };
})();
