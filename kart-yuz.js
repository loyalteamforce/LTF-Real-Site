/* ============================================================
   KART YÜZÜ: LTF üye kartı (kart.jpeg'in aynısı; Platin / Gümüş / Altın).
   kart.html (sipariş akışı) ve ana sayfadaki kart bu dosyayı kullanır.
   ============================================================ */
(function () {
  var T = { p: ['Platin', '#f9f9fb', '#d1d3d8'], s: ['Gümüş', '#eceef0', '#aeb2b9'], g: ['Altın', '#f8e9bb', '#c7a455'] };
  var KEYS = ['p', 's', 'g'];
  var SIL = '<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="4.2"/><path d="M3.5 22c.8-4.6 4.2-7 8.5-7s7.7 2.4 8.5 7z"/></svg>';
  var PH_OK = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function num(n) { var h = 7; n = String(n); for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 9973; return String(h).padStart(4, '0'); }
  function bars(seed) { var x = seed, h = ''; for (var i = 0; i < 46; i++) { x = (x * 1103515245 + 12345) & 0x7fffffff; h += '<s style="flex:' + (1 + x % 4) + '"></s><s style="flex:' + (1 + (x >> 3) % 3) + ';background:none"></s>'; } return h; }

  var CSS = [
    '.idc{container-type:inline-size;position:relative;width:100%;aspect-ratio:1.586/1;border-radius:14px;background:linear-gradient(135deg,var(--c1,#f1f1f1),var(--c2,#d6d6d6));border:1px solid rgba(0,0,0,.1);box-shadow:0 14px 34px -12px rgba(0,0,0,.4);color:#161616;overflow:visible;flex:none}',
    '.idc *{position:absolute}',
    '.idc::before{content:"";position:absolute;inset:0;border-radius:inherit;background:repeating-linear-gradient(90deg,rgba(255,255,255,.22) 0 1px,rgba(0,0,0,.025) 1px 3px);pointer-events:none}',
    '.idc::after{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.45) 48%,transparent 62%);pointer-events:none}',
    '.idc .lg{left:4cqw;top:4cqw;width:17cqw;height:17cqw;background:#000;border-radius:2cqw;padding:1.6cqw;display:grid;place-items:center}',
    '.idc .lg img{position:static;width:100%;height:100%;object-fit:contain}',
    '.idc .ht{left:23.5cqw;top:5.2cqw;font:700 3.5cqw/1.3 Georgia,"Times New Roman",serif;text-transform:uppercase;letter-spacing:.2px;white-space:nowrap}',
    '.idc .f{left:4cqw;display:flex;align-items:baseline;gap:2cqw;white-space:nowrap}',
    '.idc .f i{position:static;font:700 3.9cqw Georgia,serif;font-style:normal;width:13cqw}',
    '.idc .f b{position:static;font:700 4cqw system-ui,sans-serif}',
    '.idc .f.n{top:25cqw}.idc .f.nm{top:31.5cqw}.idc .f.nm b{font:800 9.5cqw/1 system-ui,sans-serif;letter-spacing:.3px}.idc .f.y{top:43cqw}.idc .f.t{top:49cqw}',
    '.idc .ph{right:4cqw;top:23cqw;width:31cqw;height:35cqw;border:.6cqw solid #1a1a1a;border-radius:1.2cqw;background:#d9d9dd;overflow:hidden;z-index:1}',
    '.idc .ph[data-ph]{cursor:pointer}',
    '.idc .ph img{position:static;width:100%;height:100%;object-fit:cover}',
    '.idc .ph svg{width:100%;height:100%;fill:#a8a8b0}',
    '.idc .bdg{right:26cqw;top:17.5cqw;width:13.5cqw;height:13.5cqw;border-radius:50%;background:#fff;border:.5cqw solid #151515;display:grid;place-items:center;text-align:center;font:800 4cqw/1 system-ui,sans-serif;z-index:2}',
    '.idc .bdg small{position:static;display:block;font-size:1.7cqw;letter-spacing:.3px;margin-top:.4cqw}',
    '.idc .bc{left:4cqw;bottom:4cqw;width:60cqw;height:8cqw;display:flex}',
    '.idc .bc s{position:static;display:block;background:#111}'
  ].join('\n');

  function card(k, name, photo, edit) {
    var t = T[k] || T.p, raw = String(name || '').trim() || 'LTF ÜYESİ', n = raw.toLocaleUpperCase('tr'), id = num(n);
    var ph = PH_OK.test(photo || '') ? '<img src="' + photo + '" alt="">' : SIL;
    return '<div class="idc" style="--c1:' + t[1] + ';--c2:' + t[2] + '">' +
      '<div class="lg"><img src="crest.png" alt="LTF" onerror="this.onerror=null;this.src=\'lef-logo.png\'"></div>' +
      '<div class="ht">Loyal Team Force<br>LTF Resmî Üye Kartı</div>' +
      '<div class="f n"><i>No.</i><b>' + id + '</b></div>' +
      '<div class="f nm"><i>Ad</i><b>' + esc(n) + '</b></div>' +
      '<div class="f y"><i>Yol</i><b>' + t[0] + '</b></div>' +
      '<div class="f t"><i>Tür</i><b>Kalkan</b></div>' +
      '<div class="bc">' + bars(+id + 7) + '</div>' +
      '<div class="bdg"><span>5★<small>' + t[0].toLocaleUpperCase('tr') + '</small></span></div>' +
      '<div class="ph"' + (edit ? ' data-ph' : '') + '>' + ph + '</div></div>';
  }

  window.LTFKart = { T: T, KEYS: KEYS, css: CSS, card: card, num: num, bars: bars, esc: esc };
})();
