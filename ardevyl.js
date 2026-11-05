/* ============================================================
   ARDEVYL — LTF'nin kalkan maskotu (tsundere tip)
   Kurulum: app.html'in </body> etiketinden hemen önce şunu ekle:
       <script src="ardevyl.js"></script>
   Dosya tek başına çalışır, sitenin mevcut kodunu değiştirmez.

   AYARLAR
   SERVER_PERSONA = false -> kişilik bilgisi her mesajla birlikte gönderilir.
   ai-chat fonksiyonundaki sistem promptunu ardevyl-system-prompt.txt ile
   güncelledikten sonra bunu true yap.
   ============================================================ */
(function () {
  'use strict';
  if (window.__ardevyl) return;
  window.__ardevyl = 1;

  var SERVER_PERSONA = false;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- yardımcılar ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {}
    return null;
  }
  var lastPick = {};
  function pick(key, arr) {
    var i, t = 0;
    do { i = rnd(arr.length); t++; } while (arr.length > 1 && i === lastPick[key] && t < 8);
    lastPick[key] = i;
    return arr[i];
  }
  function fmt(s, v) {
    v = v || {};
    return s.replace(/\{(\w+)\}/g, function (_, k) { return v[k] != null ? v[k] : ''; });
  }

  /* ---------- SÖZLER ----------
     Her satır: [duygu, metin]
     Duygular: n normal, b kızarmış, a kızgın, h mutlu, s sırıtan, z uykulu, o şaşkın  */
  var P = {
    greet: [
      ['b', "Hm? Geldin mi. Beklemiyordum, sadece ekranın bu köşesine bakıyordum. Evet, tesadüf."],
      ['s', "Ben Ardevyl, birliğin kalkanı! ...Evet, bu siteyi korumak benim işim. Teşekkür etmene gerek yok, etme!"],
      ['n', "Oo, giriş yapmışsın. İyi, yoksa kapıda bekletecektim. Şaka! ...Sanırım."],
      ['a', "Hmph. Yine mi buradasın? Peki. İhtiyacın olursa sohbet düğmesi hemen şurada. Ama sadece ihtiyacın olursa!"]
    ],
    night: [
      ['z', "Saat kaç oldu farkında mısın? Uyumayacak mısın? ...Endişelenmiyorum, sadece göz altlarına yazık."],
      ['b', "Bu saatte site mi geziliyor? Neyse, ben nöbetteyim zaten. Yalnız kalmazsın. Yanlış anlama!"]
    ],
    back: [
      ['b', "Oo, geri geldin. Hiç beklemedim! ...Ne kadar süre gittiğini de saymadım."],
      ['a', "Nereye kayboldun? Merak ettiğimden değil, sadece sayfa çok sessiz kaldı!"],
      ['h', "Geldin! ...Yani, fark ettim sadece. Evet."]
    ],
    reco: [
      ['h', "Aaa, manga yeri ha! Güzel seçim... y-yani fena değil. Benim önerim '{m}'. Okumazsan kırılmam. Biraz."],
      ['s', "Manga mı? Tamam, tamam. Madem buradasın, '{m}' dene. Beğenmezsen yine de dene!"],
      ['b', "Sonunda buraya geldin. Beni mi bekliyordun? Hayır, ben seni... neyse. '{m}' bence iyi."],
      ['n', "Manga sekmesi! En sevdiğim yer... değil! Sadece en az sıkıcı olanı. '{m}' bakmak ister misin?"],
      ['o', "Bu kadar mangayı bir arada görünce heyecanlandım. Heyecanlanmadım! '{m}' hoşuna gidebilir."]
    ],
    recoMore: [
      ['a', "Hmph, beğenmedin mi? Peki... '{m}' nasıl? Bu sefer reddetme!"],
      ['s', "Zor beğenenmişsin. O zaman '{m}' de, işte bu kesin tutar."],
      ['b', "İstediğin buysa... '{m}'. Ben seçtim diye okuma, kendi isteğinle oku!"],
      ['n', "Bir tane daha: '{m}'. Seçmek zor iş, biliyorum, ben de zorlandım. Hayır zorlanmadım."]
    ],
    mangaAmb: [
      ['a', "Hâlâ seçemedin mi? Kapaklara bakıp duruyorsun. Hmph, ben seçeyim mi?"],
      ['b', "Şu kayan şeritte kapaklar dönüp duruyor, bakarken başım döndü. S-sen de dönüyorsun!"],
      ['s', "Aşk olanlara daha çok bakıyor gibisin... Hayır, takip etmiyorum, sadece görüyorum!"],
      ['n', "Arama çubuğunu kullan istersen. Ben bulamam, bulmak benim işim değil. Bulabilirim ama."],
      ['z', "Bu kadar mangayı kim okuyacak ki... Ah, sen okuyacaksın. Güzel."]
    ],
    mangaScroll: [
      ['o', "Bu kadar kaydırdın, parmağın yorulmadı mı? Ben olsam seçerdim artık."],
      ['a', "Kaydırıyorsun, kaydırıyorsun... Bir tanesini aç artık!"]
    ],
    search: [
      ['n', "Ne arıyorsun? Söylemezsen bulamam. Zaten ben aramıyorum."],
      ['s', "Arama yapıyorsun... Yani kendi başına bulabiliyorsun. Gurur duydum. Duymadım."]
    ],
    searchNo: [
      ['a', "Hiçbir şey çıkmadı. Yazım hatası yapmışsındır, bana öyle bakma!"],
      ['b', "Yok öyle bir şey! ...Belki eklenir. Ben eklemiyorum ama."],
      ['o', "Boş çıktı?! Bu sefer benim suçum değil, yemin ederim!"]
    ],
    searchOk: [
      ['h', "{n} sonuç. Fena değil! Bir tanesini aç artık."],
      ['n', "{n} tane buldum. Hayır, sen buldun. Ben sadece bakıyordum."]
    ],
    emptyHome: [
      ['o', "Burası... boş mu? Ciddi misin? Ana sayfa bu mu yani?"],
      ['a', "Yine boş. Hâlâ bir şey koyulmamış. Ben de burada boşluğa bakıyorum."],
      ['a', "Ana sayfa hâlâ boş! Süsleyemem, ben kalkanım, dekoratör değil!"],
      ['z', "Bu boşluğa bakmaktan sıkıldım. Manga'ya gitsene."]
    ],
    emptyExplore: [
      ['o', "Keşfet diyorlar, keşfedecek bir şey yok! Boş yer mi ciddi misin?!"],
      ['a', "Burası site mi yoksa beyaz kâğıt mı? Bir şey eklensin artık!"],
      ['b', "Ben de keşfetmeyi bekliyordum... sadece merak ettim, tamam mı!"],
      ['z', "Boşluk, boşluk, bir de boşluk. Ne zenginmiş burası."]
    ],
    emptyLib: [
      ['o', "Kütüphane boş! Kitapların yerine ben mi durayım? Hayır!"],
      ['a', "Hiçbir şey kaydetmemişsin. Beğendiğin bir şey de mi yok? ...Ya da bana mı bakıyorsun?"],
      ['b', "Raflar boş. Bir manga kaydet de ben de biraz sevineyim. Y-yani raflar sevinsin."],
      ['s', "Kütüphane boş ama sen doluyorsun, öyle mi? ...Ne saçmaladım ben."]
    ],
    emptyAmb: [
      ['a', "Hâlâ buradasın ve hâlâ boş. Artık başka sekmeye geçelim mi?"],
      ['o', "Boş yer mi?! Ciddi misin?! Hâlâ?!"],
      ['z', "Burada hiçbir şey olmuyor... Ben de uyuyayım o zaman."]
    ],
    amb: [
      ['b', "Hâlâ buradasın ha... iyi. Yani, kötü değil."],
      ['s', "Sana bir sır vereyim: kalkanım parlak olunca iyi hissediyorum. Parlatmanı istemiyorum ama!"],
      ['n', "Su içtin mi? ...Sormak zorunda değildim, mizah anlayışım bozuk."],
      ['a', "Dik otur. Dik! Boynun ağrıyacak diye değil, görüntü kötü diye."],
      ['n', "Ekran parlaklığını biraz kıs. Gözlerin için... Ben iyiyim, yanlış anlama."],
      ['b', "Çok sessizsin. Konuşmak istersen alttaki kalkan düğmesine bas. Sadece istersen!"],
      ['s', "Şu an sen bana bakıyorsun, ben sana bakıyorum. Garip. Bakma!"],
      ['n', "Kalkan olmak kolay iş değil. Hep birilerinin önünde durmak... neyse, boş ver."],
      ['h', "Bugün güzel bir gün, sanırım. Neden böyle söyledim? Bilmiyorum!"],
      ['a', "Bir şey söylemeyeceğim. ...Aslında söyleyeceğim ama söylemeyeceğim."],
      ['b', "Beni görmezden gelme! ...Gelebilirsin tabii. Ama gelme."],
      ['z', "Esniyorum, sıkıldığımdan değil. Kalkanlar da esner. Böyle bir kural var."],
      ['s', "Senin için nöbet tutuyorum, farkında mısın? Cevap verme, bilmek istemiyorum."],
      ['o', "Aa! Bir şey olacak sandım, hiçbir şey olmadı. Hiç korkmadım."]
    ],
    reading: [
      ['b', "Birlikte mi okuyacağız? Y-yanlış anlama, sadece sen sıkılmayasın diye! Omzunun üstünden bakacağım."],
      ['s', "'{t}' mi? Ooh, ben de merak ediyordum. Hiç de değil! Neyse, başla."],
      ['n', "Okuma modu açıldı. Sessiz olacağım. ...Biraz yorum yaparım."],
      ['h', "Aaa, hikâye zamanı! Bu kadar sevinmem normal değil. Dikkat etme!"]
    ],
    p12: [
      ['n', "Başlangıç fena değil... Hâlâ yargılıyorum ama."],
      ['s', "Hmm, ilk sayfalar ilginç. İlginç dedim, harika demedim!"]
    ],
    p30: [
      ['o', "Sürükleyici olmaya başladı! Hayır, kapatma! Devam et!"],
      ['b', "Karakterler ilginç... Özellikle şu bir tanesi. Hangisi, söylemem."]
    ],
    p50: [
      ['h', "Yarıya geldik! Ben hiç sıkılmadım. Sen sıkıldıysan söyle... söylemesen de olur."],
      ['s', "Tam ortadayız. Şimdi bir şey olması lazım. Beklemiyorum, sadece lazım!"]
    ],
    p70: [
      ['b', "Bu kısımlara bayılıyorum. ...Yani çok da kötü değil."],
      ['o', "Kalbim hızlandı! Kalkanın kalbi olmaz tabii. Olmaz!"]
    ],
    p90: [
      ['o', "Neredeyse bitti... Sonunu bana anlatma! Anlat! Hayır anlatma!"],
      ['b', "Bitmesin istiyorum. İstemiyorum! Ama yine de istiyorum."]
    ],
    p100: [
      ['b', "Bittiii! ...A-ağlamadım. Gözüme kalkan tozu kaçtı. Evet."],
      ['h', "Çok güzeldi! Hemen başkasına geçelim mi? Sen istersen. Ben istemem."]
    ],
    chapter: [
      ['s', "Bölüm {n}: '{t}'... Başlık fena. Fena değil demek istedim."],
      ['h', "Yeni bölüm! Bir tane daha okuyalım, şimdi bırakma!"],
      ['n', "{n}. bölüme geldik. Ben saymıyorum, sadece ekranda yazıyor."],
      ['o', "'{t}' mi? Bu başlıkla bir şey olacak, hissediyorum!"]
    ],
    fast: [
      ['a', "Okumuyorsun bile! Hızlı geçme!"],
      ['o', "Dur dur dur! Ben daha cümleyi bitirmemiştim!"],
      ['a', "Atlama! Hikâyeyi kaçırırsan bana sorma!"]
    ],
    readIdle: [
      ['z', "Uyudun mu? Hey! ...Neyse, bekliyorum. Beklemeyi severim, sadece alışkanlık."],
      ['a', "Telefona mı baktın? Hmph, ben bu mangadan daha ilgi çekici olmalıyım... hayır hayır, devam et."]
    ],
    cast: [
      ['b', "Karakter listesi! Hangisini en çok sevdin? ...Benimki hangisi, sorma."],
      ['s', "İsimlere baktın. Ben hepsini ezberledim. Ezberlemedim, tesadüf."]
    ],
    closeEarly: [
      ['o', "Daha yeni başlamıştık! Neyse, sonra devam ederiz. S-sonra beraber."],
      ['a', "Bırakıyor musun? Hmph. Hikâye yarım kaldı ama sen bilirsin."]
    ],
    closeMid: [
      ['n', "Yarım bıraktın. Sonra devam edersin, değil mi? Soruyorum sadece."],
      ['b', "Dönmeyi unutma. Hatırlatmam gerekirse hatırlatırım. Ama hatırlatmam!"]
    ],
    closeEnd: [
      ['h', "Bitirdin mi gerçekten? ...Güzel hikâyeydi. Bir sonrakini birlikte seçelim mi? Sadece istersen."],
      ['b', "Sonuna kadar okudun. Aferin! ...Demek istemedim ama dedim."]
    ],
    noAvatar: [
      ['o', "Profil fotoğrafın boş! Hayalet mi olacaksın? Boş yer mi ciddi misin?"],
      ['a', "Bir fotoğraf koy artık! Kimse sen olduğunu anlamıyor!"]
    ],
    noBanner: [
      ['a', "Banner da boş... resmen ıssız ada. Bir şey koy!"],
      ['s', "Banner'a video bile koyabilirsin. Önermiyorum ama koyabilirsin."]
    ],
    noBio: [
      ['b', "Biyografi de boş. Kendinden bahsetmeyi mi unuttun? ...Ben olsam çok yazardım. Sadece fikir!"],
      ['n', "Birkaç cümle yaz yeter. Okurum. Hayır, okumam. Okurum."]
    ],
    profileOk: [
      ['h', "Güzel profil... yani idare eder. Beğenmedim demiyorum."],
      ['s', "Hmm, düzenlenmiş. Emek var. Yani... fena değil."]
    ],
    settings: [
      ['o', "Ayarlar mı... Benimle ilgili bir şeyi kapatmayacaksın, değil mi?"],
      ['b', "Ayarlarla oynuyorsun. Yazı boyutunu büyüt, gözlerin için. Dedim ya, umurumda değil!"]
    ],
    signOut: [
      ['o', "Çıkış yapıyorsun?! Hmph. Git bakalım. ...Ama geri gel, ha?"]
    ],
    offline: [
      ['o', "İnternet gitti! Benim suçum değil, kalkan olmak internet sağlamaz!"]
    ],
    online: [
      ['h', "İnternet geri geldi! Rahatladım. Hayır korkmadım."]
    ],
    spam: [
      ['o', "Sekmeleri böyle tıklayıp durma! Başım döndü!"],
      ['a', "Dur biraz! Bir yere karar ver!"]
    ],
    idle: [
      ['z', "Hâlâ orada mısın? ...Sorduğum için değil, ekran donmuş sandım."],
      ['z', "Sessizlik... Ben de dinleniyorum. Dinlenmiyorum, nöbetteyim!"]
    ],
    chatHello: [
      ['n', "Hmph, konuşmak mı istiyorsun? Peki... ama sadece sorman gerekeni sor!"],
      ['b', "Geldin demek. Buyur, dinliyorum. Merak ettiğimden değil, görevim bu!"]
    ],
    chatErr: [
      ['a', "Sunucuya ulaşamıyorum! Benim suçum değil, tamam mı?"],
      ['o', "Cevap gelmedi... Biraz sonra tekrar dene. Ben bekliyorum. Beklemek zorunda değilim ama."]
    ],
    recoTab: [
      "Bunlar benim zevkim. Beğenmesen de umurumda değil! ...Bir tanesi hoşuna giderse sevinirim.",
      "Seçtim, buyur. Teşekkür etmene gerek yok. Etsen de olur."
    ]
  };

  /* ---------- EK SÖZLER: günün saati, laf sokmalar ---------- */
  P.morning = [
    ['z', "Günaydın... Çok erken değil mi? Neyse, kalkan da kahve içer. İçmez ama."],
    ['h', "Sabah sabah site mi? Güzel. Moralin yüksek olsun, benimki zaten hep yüksek! ...Değil."]
  ];
  P.evening = [
    ['s', "Akşam oldu, manga zamanı! Hayır, önermiyorum. Ama önerebilirim."],
    ['n', "İyi akşamlar. Gün nasıl geçti? Sormak istememiştim, ağzımdan kaçtı."]
  ];
  P.roast = [
    ['s', "Ne kadar terbiyesizsin, Taha gibi! ...Neyse, sana demedim, aklıma o geldi."],
    ['a', "Quartex'in 'beş dakikaya oradayım'ı, benim için artık bir ölçü birimi."],
    ['s', "Narancia'nın ortaya çıkış saati hâlâ bilinmiyor. Bilim insanları araştırıyor."],
    ['n', "Kemal yine kendinden emin konuşuyordur. Yanılıyordur ama çok emin."],
    ['z', "Rai şu an muhtemelen 'bir dakika' diyerek yarım saat geçirmiştir."],
    ['b', "Thoya'nın bahaneleri kalkanımdan sağlam. Ben kalkanım, ben bilirim."],
    ['a', "Taha'nın terbiyesi mi? Yok öyle bir şey, kayıp ilanı verdim."],
    ['s', "Bugün kime laf sokayım? Taha, Quartex, Narancia, Kemal, Rai, Thoya... Hepsi sıraya girsin."]
  ];
  var CASTN = { taha: 'Taha', quartex: 'Quartex', narancia: 'Narancia', kemal: 'Kemal', rai: 'Rai', thoya: 'Thoya' };
  var ROAST = {
    taha: ["Ne kadar terbiyesizsin, Taha gibi! Taha'nın terbiyesi kalkanımdan bile delik deşik.", "Taha sahneye çıkmadan alkış bekler. Alkışı da kendi başlatır.", "Taha bir gün sessiz kalsa nöbeti bırakırım. Merak etme, bırakmayacağım.", "Taha'ya laf yetiştirmek, kalkanla yağmuru durdurmaya benzer: mümkün ama komik."],
    quartex: ["Quartex'in planı hep 'sonra bakarız'. Sonra da hiç bakılmaz.", "Quartex kendini gizemli sanıyor. Gizemi, geç kalmasından ibaret.", "Quartex ismi kulağa çok havalı geliyor. Sahibi hariç, şaka şaka!", "Quartex'e 'gel' demek, kediyi çağırmak gibi. Gelirse tesadüf."],
    narancia: ["Narancia'nın ortaya çıkış zamanı, kargo teslimatı kadar belirsiz.", "Narancia kalabalıkta en yüksek sesle susan insandır. Bunu yetenek sanıyor.", "Narancia'ya göre 'hemen geliyorum' ile 'yarın görüşürüz' aynı cümle.", "Narancia bir şey yapmaya karar verdiğinde ben de emekli olmuş olurum."],
    kemal: ["Kemal'in kendinden emin hali ile doğru bilgi oranı ters orantılı.", "Kemal haritayı ters tutup 'yol bu tarafmış' diyen tiptir.", "Kemal bir şeyi bilmiyorsa bile bilen birinden daha yüksek sesle anlatır.", "Kemal'e 'dur' demek, rüzgâra 'esme' demek gibi."],
    rai: ["Rai o kadar sakin ki dünya yansa 'bir dakika' der.", "Rai'nin 'geliyorum' demesi, ben kalkanımı cilalayana kadar gelmiyor demek.", "Rai bir kararı üç günde verir, ertesi gün vazgeçer.", "Rai uykuyu o kadar ciddiye alıyor ki bence resmî görevi var."],
    thoya: ["Thoya'nın bahaneleri kalkanımın savunmasından sağlam.", "Thoya mesaj atar, cevabı beklemez, sonra neden cevap vermedin diye kızar.", "Thoya'nın 'şimdi bakarım'ı, bir mevsim sürüyor.", "Thoya ortadan kaybolmayı sanata çevirdi. Müzeye koymak lazım."]
  };
  var TAIL = [" Şaka şaka, hepsini severim. ...Yani öyle zannediyorum.", " Bunu ona söyleme, kalkanım çizilir.", " Hmph, ben sadece gerçeği söyledim!", ""];
  var JOKES = [
    "Kalkan neden asla kavga etmez? Çünkü hep karşı tarafı savunur... Tamam, güldün, fark ettim.",
    "Manga okurken neden uyuyakalıyorsun? Çünkü en iyi sahne hep sonraki bölümde. Hmph, klasik.",
    "Bir tsundere'ye 'seviyorum' demişler. 'Aptal!' demiş, sonra üç gün küsmüş. Yani aynı ben, hayır, ben değilim!",
    "Taha neden saat takmaz? Çünkü hep bir şey için geç kalır, saat de utanır.",
    "Wi-Fi ile Quartex'in ortak yönü? İkisi de lazım olduğunda yok."
  ];
  var FAL = [
    "Bugün bir manga seni bekliyor. Okumazsan kırılırım. Fal bu, ben değil!",
    "Yakında eski bir arkadaşından mesaj gelecek. Cevap vermesen de olur... Yok, ver.",
    "Falın diyor ki: bu akşam aşk mangası, yarın savaş. Bence de.",
    "Kalbin ağır, omzun yüklü. Biraz ara ver, ben nöbetteyim.",
    "Falda Taha çıktı. Kötü haber: yine gürültü var."
  ];

  /* ---------- YÜZ (SVG) ---------- */
  var DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<linearGradient id="agG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f8ff"/>' +
    '<stop offset=".55" stop-color="#a9c6ff"/><stop offset="1" stop-color="#5f86e6"/></linearGradient></defs></svg>';

  var FACE = '<svg viewBox="0 -6 100 118" class="ag-svg" aria-hidden="true">' +
    '<path d="M50 -3 l2.2 4.6 5 .6-3.7 3.4 1 5L50 9.6 45.5 13l1-5-3.7-3.4 5-.6z" fill="#fff" opacity=".9"/>' +
    '<path d="M50 14 L90 24 V58 C90 86 70 101 50 109 C30 101 10 86 10 58 V24 Z" fill="url(#agG)" stroke="rgba(255,255,255,.8)" stroke-width="2.4" stroke-linejoin="round"/>' +
    '<path d="M50 14 L90 24 V58 C90 86 70 101 50 109 Z" fill="rgba(20,40,110,.16)"/>' +
    '<path d="M17 28 L50 19 V34 Z" fill="rgba(255,255,255,.4)"/>' +
    '<ellipse class="ck" cx="26" cy="70" rx="8" ry="5" fill="#ff7a9c"/><ellipse class="ck" cx="74" cy="70" rx="8" ry="5" fill="#ff7a9c"/>' +
    /* n */ '<g class="mo mo-n"><g class="eye"><ellipse cx="34" cy="56" rx="5.5" ry="7.5" fill="#14213d"/><circle cx="36" cy="53" r="2" fill="#fff"/></g><g class="eye"><ellipse cx="66" cy="56" rx="5.5" ry="7.5" fill="#14213d"/><circle cx="68" cy="53" r="2" fill="#fff"/></g><path d="M43 78 q7 5 14 0" stroke="#14213d" stroke-width="3" fill="none" stroke-linecap="round"/></g>' +
    /* b */ '<g class="mo mo-b"><g class="eye"><ellipse cx="37" cy="57" rx="5.5" ry="7.5" fill="#14213d"/><circle cx="39" cy="54" r="2" fill="#fff"/></g><g class="eye"><ellipse cx="69" cy="57" rx="5.5" ry="7.5" fill="#14213d"/><circle cx="71" cy="54" r="2" fill="#fff"/></g><path d="M40 79 q4 -4 8 0 t8 0" stroke="#14213d" stroke-width="3" fill="none" stroke-linecap="round"/></g>' +
    /* a */ '<g class="mo mo-a"><path d="M24 44 L44 52 M76 44 L56 52" stroke="#14213d" stroke-width="3.6" stroke-linecap="round"/><ellipse cx="34" cy="59" rx="5" ry="5.5" fill="#14213d"/><ellipse cx="66" cy="59" rx="5" ry="5.5" fill="#14213d"/><path d="M42 82 q8 -7 16 0" stroke="#14213d" stroke-width="3" fill="none" stroke-linecap="round"/></g>' +
    /* h */ '<g class="mo mo-h"><path d="M26 59 q8 -10 16 0 M58 59 q8 -10 16 0" stroke="#14213d" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M41 74 q9 14 18 0z" fill="#14213d"/></g>' +
    /* s */ '<g class="mo mo-s"><path d="M27 58 h14 a7 7 0 0 1 -14 0z M59 58 h14 a7 7 0 0 1 -14 0z" fill="#14213d"/><path d="M26 57 h16 M58 57 h16" stroke="#14213d" stroke-width="3" stroke-linecap="round"/><path d="M42 78 q10 7 17 -3" stroke="#14213d" stroke-width="3" fill="none" stroke-linecap="round"/></g>' +
    /* z */ '<g class="mo mo-z"><path d="M27 60 h14 M59 60 h14" stroke="#14213d" stroke-width="3.4" stroke-linecap="round"/><path d="M45 79 h10" stroke="#14213d" stroke-width="3" stroke-linecap="round"/></g>' +
    /* o */ '<g class="mo mo-o"><circle cx="34" cy="56" r="7.5" fill="#fff" stroke="#14213d" stroke-width="2.4"/><circle cx="34" cy="56" r="3.2" fill="#14213d"/><circle cx="66" cy="56" r="7.5" fill="#fff" stroke="#14213d" stroke-width="2.4"/><circle cx="66" cy="56" r="3.2" fill="#14213d"/><ellipse cx="50" cy="80" rx="4" ry="5" fill="#14213d"/></g>' +
    '</svg>';

  /* ---------- CSS ---------- */
  var CSS = '' +
    '.ag-svg{width:100%;height:100%;display:block;overflow:visible;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45))}' +
    '.ag-svg .mo{display:none}' +
    '[data-mood="n"] .mo-n,[data-mood="b"] .mo-b,[data-mood="a"] .mo-a,[data-mood="h"] .mo-h,[data-mood="s"] .mo-s,[data-mood="z"] .mo-z,[data-mood="o"] .mo-o{display:inline}' +
    '.ag-svg .ck{opacity:0;transition:opacity .25s}' +
    '[data-mood="b"] .ck,[data-mood="h"] .ck,[data-mood="a"] .ck{opacity:.75}' +
    '.ag-svg .eye{transform-box:fill-box;transform-origin:center;animation:agBlink 4.4s infinite}' +
    '@keyframes agBlink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}' +

    '.ag{position:fixed;z-index:65;display:flex;align-items:flex-end;pointer-events:none;opacity:0;' +
      'transition:transform .6s cubic-bezier(.3,1.35,.5,1),opacity .3s ease}' +
    '.ag.on{opacity:1;pointer-events:auto}' +
    '.ag[data-pos="r"]{right:0;top:var(--ay,45%);flex-direction:row;transform:translateX(115%)}' +
    '.ag[data-pos="l"]{left:0;top:var(--ay,45%);flex-direction:row-reverse;transform:translateX(-115%)}' +
    '.ag[data-pos="b"]{left:var(--ax,20px);bottom:calc(84px + env(safe-area-inset-bottom));flex-direction:column;align-items:flex-start;transform:translateY(135%)}' +
    '.ag[data-pos="rd"]{right:10px;bottom:calc(14px + env(safe-area-inset-bottom));flex-direction:row;transform:translateY(140%)}' +
    '.ag.on{transform:none}' +
    '@media (min-width:900px){.ag[data-pos="l"]{left:88px}.ag[data-pos="b"]{bottom:20px}}' +

    '.ag-body{flex:none;width:72px;height:82px;padding:0;border:0;background:transparent;cursor:pointer;animation:agBob 3.4s ease-in-out infinite;-webkit-tap-highlight-color:transparent}' +
    '.ag[data-pos="r"] .ag-body{margin-right:-22px;rotate:-10deg}' +
    '.ag[data-pos="l"] .ag-body{margin-left:-22px;rotate:10deg}' +
    '.ag[data-pos="rd"] .ag-body{width:58px;height:66px}' +
    '.ag-body:focus-visible{outline:2px solid #fff;outline-offset:3px;border-radius:12px}' +
    '@keyframes agBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}' +

    '.ag-glass,.ag-bub,.agc{position:relative;color:#fff;' +
      'background:linear-gradient(135deg,rgba(255,255,255,.2),rgba(255,255,255,.06) 55%,rgba(140,185,255,.12));' +
      '-webkit-backdrop-filter:blur(18px) saturate(185%) brightness(1.08);backdrop-filter:blur(18px) saturate(185%) brightness(1.08);' +
      'border:1px solid rgba(255,255,255,.3);' +
      'box-shadow:inset 0 1px 1px rgba(255,255,255,.55),inset 0 -1px 1px rgba(255,255,255,.12),inset 0 0 18px rgba(255,255,255,.07),0 12px 32px -10px rgba(0,0,0,.7)}' +
    '.ag-bub::before,.agc::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;' +
      'background:radial-gradient(120% 70% at 10% 0%,rgba(255,255,255,.32),transparent 48%)}' +

    '.ag-bub{display:none;max-width:min(250px,calc(100vw - 110px));padding:10px 14px;border-radius:18px;font:500 13.5px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;margin:0 6px 24px}' +
    '.ag.talk .ag-bub{display:block;animation:agPop .35s cubic-bezier(.3,1.4,.5,1) both}' +
    '.ag[data-pos="b"] .ag-bub{margin:0 0 4px}' +
    '@keyframes agPop{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}}' +
    '.ag-bub::after{content:"";position:absolute;width:11px;height:11px;background:rgba(190,215,255,.2);border:1px solid rgba(255,255,255,.3);transform:rotate(45deg)}' +
    '.ag[data-pos="r"] .ag-bub::after,.ag[data-pos="rd"] .ag-bub::after{right:-6px;bottom:18px;border-left:0;border-bottom:0}' +
    '.ag[data-pos="l"] .ag-bub::after{left:-6px;bottom:18px;border-right:0;border-top:0}' +
    '.ag[data-pos="b"] .ag-bub::after{left:34px;bottom:-6px;border-left:0;border-top:0}' +
    '.ag-tx{position:relative}' +
    '.ag-gh{visibility:hidden;white-space:pre-wrap}' +
    '.ag-ty{position:absolute;left:0;top:0;right:0;white-space:pre-wrap}' +
    '.ag-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;visibility:hidden}' +
    '.ag-acts.on{visibility:visible}' +
    '.ag-acts:empty{display:none}' +
    '.ag-acts button{padding:5px 11px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.14);color:#fff;font:600 12px system-ui,sans-serif;cursor:pointer;transition:background .15s,transform .15s}' +
    '.ag-acts button:hover{background:rgba(255,255,255,.28)}.ag-acts button:active{transform:scale(.94)}' +
    '.ag-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}' +

    /* dock düğmesi */
    '.ag-dockbtn svg .ag-dot{fill:currentColor;stroke:none}' +
    '.ag-dockbtn[hidden]{display:none}.ag-dockbtn[aria-expanded="true"]{color:#fff}' +

    /* sohbet paneli */
    '.agc{position:fixed;z-index:66;left:50%;bottom:calc(84px + env(safe-area-inset-bottom));width:min(640px,calc(100vw - 16px));height:min(740px,calc(100dvh - 120px));display:flex;flex-direction:column;border-radius:26px;overflow:hidden;' +
      'font:400 15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;opacity:0;pointer-events:none;transform:translate(-50%,16px) scale(.96);' +
      'transition:opacity .25s ease,transform .45s cubic-bezier(.23,1,.32,1)}' +
    '.agc.on{opacity:1;pointer-events:auto;transform:translate(-50%,0) scale(1)}' +
    '@media (min-width:900px){.agc{left:96px;bottom:24px;width:min(720px,calc(100vw - 120px));height:min(860px,calc(100dvh - 48px));transform:translate(0,16px) scale(.96)}.agc.on{transform:none}}' +
    '.agc>*{position:relative}' +
    '.agc-h{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.16)}' +
    '.agc-id{display:flex;align-items:center;gap:6px}' +
    '.agc-av{width:28px;height:32px;flex:none}' +
    '.agc-tabs{display:flex;gap:2px}' +
    '.agc-tabs button,.agc-mode,.agc-x{border:0;background:transparent;color:#fff;font:inherit;font-size:13px;cursor:pointer;border-radius:8px;padding:4px 9px;transition:background .15s,opacity .15s}' +
    '.agc-tabs button{opacity:.55}.agc-tabs button:hover{opacity:.85}' +
    '.agc-tabs button[aria-pressed="true"]{opacity:1;background:rgba(255,255,255,.18)}' +
    '.agc-act{display:flex;align-items:center;gap:4px}' +
    '.agc-mode{font-size:12px;border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:3px 10px}' +
    '.agc-mode:hover,.agc-x:hover{background:rgba(255,255,255,.18)}' +
    '.agc-x{font-size:18px;line-height:1;padding:3px 8px}' +
    '.agc-msgs,.agc-reco{flex:1;min-height:0;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:9px;scrollbar-width:thin}' +
    '.agc-reco{display:none}' +
    '.agc.reco-on .agc-msgs,.agc.reco-on .agc-comp{display:none}' +
    '.agc.reco-on .agc-reco{display:flex}' +
    '.agc-b{max-width:92%;padding:10px 14px;border-radius:18px;font-size:15px;line-height:1.55;white-space:pre-wrap;word-wrap:break-word;animation:agUp .4s cubic-bezier(.23,1,.32,1) both}' +
    '.agc-b.u{align-self:flex-end;background:rgba(47,123,255,.5);border:1px solid rgba(190,220,255,.5)}' +
    '.agc-b.a{align-self:flex-start;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2)}' +
    '.agc-b.w{opacity:.7;font-style:italic}' +
    '.agc-sys{align-self:center;font-size:12px;opacity:.65;text-align:center}' +
    '@keyframes agUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
    '.agc-comp{padding:8px 10px 10px}' +
    '.agc-fld{display:flex;align-items:center;gap:8px;padding:6px 6px 6px 14px;border-radius:999px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.22);transition:border-color .15s}' +
    '.agc-fld:focus-within{border-color:rgba(255,255,255,.5)}' +
    '.agc-fld input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#fff;font:inherit;font-size:16px}' +
    '.agc-fld input::placeholder{color:rgba(255,255,255,.5)}' +
    '.agc-send{flex:none;width:40px;height:40px;display:grid;place-items:center;border:0;border-radius:50%;background:#fff;color:#111;cursor:pointer;transition:transform .2s,background .2s,color .2s}' +
    '.agc-send:disabled{background:rgba(255,255,255,.2);color:rgba(255,255,255,.55);cursor:not-allowed}' +
    '.agc-send:enabled:active{transform:scale(.94)}' +
    '.agc-info{min-height:16px;padding:4px 6px 0;font-size:11.5px;opacity:.7}.agc-info.err{color:#ffb3b3;opacity:1}' +
    '.agc-note{font-size:12.5px;opacity:.85}' +
    '.agc-card{display:flex;align-items:center;gap:10px;padding:8px;border-radius:14px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18)}' +
    '.agc-cv{flex:none;width:38px;height:54px;border-radius:6px;background:linear-gradient(160deg,var(--c1,#456),var(--c2,#123));border:1px solid rgba(255,255,255,.25)}' +
    '.agc-ct{flex:1;min-width:0}.agc-ct b{display:block;font-size:14px}.agc-ct small{opacity:.7;font-size:12px}' +
    '.agc-go{flex:none;padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.16);color:#fff;font:600 12px system-ui,sans-serif;cursor:pointer}' +
    '.agc-go:hover{background:rgba(255,255,255,.3)}' +
    '.agc-more{align-self:center;padding:7px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.12);color:#fff;font:inherit;font-size:13px;cursor:pointer}' +
    '.agc-more:hover{background:rgba(255,255,255,.24)}' +

    '.agc-chips{display:flex;gap:6px;overflow-x:auto;padding:2px 2px 8px;scrollbar-width:none}.agc-chips::-webkit-scrollbar{display:none}' +
    '.agc-chips button{flex:none;padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.12);color:#fff;font:inherit;font-size:13px;cursor:pointer;white-space:nowrap}.agc-chips button:hover{background:rgba(255,255,255,.26)}' +
    '.agc-cv{position:relative;overflow:hidden}.agc-cv svg{position:absolute;inset:0;width:100%;height:100%}.agc-b .agc-go{display:block;margin-top:8px}' +
    '@media (prefers-reduced-motion:reduce){.ag,.agc{transition:none}.ag-body,.ag-svg .eye{animation:none}.ag.talk .ag-bub,.agc-b{animation:none}}';

  var st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);
  document.body.insertAdjacentHTML('beforeend', DEFS);

  /* ---------- DOM: maskot ---------- */
  var root = document.createElement('div');
  root.className = 'ag';
  root.hidden = true;
  root.dataset.pos = 'r';
  root.dataset.mood = 'n';
  root.innerHTML =
    '<div class="ag-bub" aria-hidden="true"><div class="ag-tx"><span class="ag-gh"></span><span class="ag-ty"></span></div><div class="ag-acts"></div></div>' +
    '<span class="ag-sr" role="status"></span>' +
    '<button type="button" class="ag-body" aria-label="Ardevyl">' + FACE + '</button>';
  document.body.appendChild(root);
  var el = {
    bub: $('.ag-bub', root), gh: $('.ag-gh', root), ty: $('.ag-ty', root),
    acts: $('.ag-acts', root), sr: $('.ag-sr', root), body: $('.ag-body', root)
  };

  /* ---------- DOM: sohbet paneli ---------- */
  var chat = document.createElement('div');
  chat.className = 'agc';
  chat.setAttribute('role', 'dialog');
  chat.setAttribute('aria-label', 'Ardevyl ile sohbet');
  chat.setAttribute('inert', '');
  chat.dataset.mood = 'n';
  chat.innerHTML =
    '<div class="agc-h">' +
      '<div class="agc-id"><span class="agc-av">' + FACE + '</span>' +
      '<div class="agc-tabs"><button type="button" data-tab="chat" aria-pressed="true">Sohbet</button><button type="button" data-tab="reco" aria-pressed="false">Öneriler</button></div></div>' +
      '<div class="agc-act"><button type="button" class="agc-mode agc-new" aria-label="Yeni sohbet" title="Yeni sohbet">+ Yeni</button><button type="button" class="agc-mode" aria-label="Ardevyl ne kadar sık çıksın">Sık</button><button type="button" class="agc-x" aria-label="Kapat">&times;</button></div>' +
    '</div>' +
    '<div class="agc-msgs" id="agMsgs"></div>' +
    '<div class="agc-reco" id="agReco"></div>' +
    '<div class="agc-comp"><div class="agc-chips" id="agChips"></div><form class="agc-fld" id="agForm">' +
      '<input id="agIn" type="text" maxlength="500" autocomplete="off" placeholder="Ardevyl\'e bir şey yaz..." aria-label="Ardevyl\'e mesaj">' +
      '<button type="submit" class="agc-send" id="agSend" disabled aria-label="Gönder"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>' +
    '</form><div class="agc-info" id="agInfo"></div></div>';
  document.body.appendChild(chat);
  var msgs = $('#agMsgs'), recoBox = $('#agReco'), inp = $('#agIn'), sendBtn = $('#agSend'), info = $('#agInfo');
  var modeBtn = $('.agc-mode:not(.agc-new)', chat);

  /* ---------- DOM: alt menüye düğme ---------- */
  var dockBar = $('#dockBar');
  var dockBtn = document.createElement('button');
  dockBtn.type = 'button';
  dockBtn.className = 'dock-btn ag-dockbtn';
  dockBtn.title = 'Ardevyl';
  dockBtn.setAttribute('aria-label', 'Ardevyl ile sohbet et');
  dockBtn.setAttribute('aria-expanded', 'false');
  dockBtn.innerHTML = '<svg viewBox="0 0 18 18"><path d="M9 2 14.5 3.8v4.6c0 3.3-2.4 5.6-5.5 7.2-3.1-1.6-5.5-3.9-5.5-7.2V3.8z"/><circle class="ag-dot" cx="6.9" cy="8" r=".9"/><circle class="ag-dot" cx="11.1" cy="8" r=".9"/><path d="M7.6 10.8q1.4 1 2.8 0"/></svg>';
  if (dockBar) {
    dockBar.appendChild(dockBtn);
    if (window.__dockInd) window.__dockInd(true);
  }

  /* ---------- durum ---------- */
  var chatOpen = false, readerOpen = false, speaking = false, curPrio = 0;
  var hideT = null, tyT = null, resetT = null, hideDone = null;
  var lastSay = 0, quietUntil = 0, pokes = 0, pokeT = null, lastPos = '';
  var visits = {}, viewStamps = [];
  var rdState = { fired: {}, chap: -1, last: 0, lastScroll: 0, lastTop: 0, lastT: 0, fastN: 0, fastAt: 0, idleAt: 0, prog: 0 };
  var activityAt = Date.now(), idleSaid = false;

  function mode() { return store('ardevyl_mode') || 'on'; }
  /* enabled() = MASKOT açık mı. Sohbet (yapay zekâ) bundan bağımsız, her zaman açık. */
  function enabled() {
    var m = store('lef_mascot');
    if (m === null) m = store('lef_ardevyl');          // eski ayarı olanlar için
    return m !== '0';
  }
  function applyEnabled() {
    var on = enabled();
    dockBtn.hidden = false;                             // sohbet düğmesi hep görünür
    if (!on) { retreat(); root.hidden = true; }
    else {
      if (readerOpen) { root.hidden = false; root.classList.add('on'); }
      scheduleAmbient();
    }
    if (window.__dockInd) window.__dockInd(false);
  }
  window.addEventListener('ardevyl-toggle', function () { applyEnabled(); if (enabled()) setTimeout(function () { sayPool('greet', { force: true, prio: 3 }); }, 500); });
  window.addEventListener('storage', function (e) { if (e.key === 'lef_mascot' || e.key === 'lef_ardevyl') applyEnabled(); });
  function modeLabel() { return { on: 'Sık', low: 'Az', off: 'Sus' }[mode()] || 'Sık'; }
  modeBtn.textContent = modeLabel();

  function curView() {
    var v = $('.view.on');
    return v ? v.id.replace(/^v-/, '') : 'ana-sayfa';
  }
  function mangaTitles() {
    return $$('#mgGrid .mg-cover').map(function (c) {
      var b = c.querySelector('b');
      return { title: b ? b.textContent : '', genre: (c.querySelector('small') || {}).textContent || '', node: c };
    });
  }
  function randomManga() {
    var l = mangaTitles();
    return l.length ? l[rnd(l.length)] : null;
  }
  function openManga(title) {
    var f = mangaTitles().filter(function (x) { return x.title === title; })[0];
    if (!f) return;
    closeChat();
    setTimeout(function () { f.node.click(); }, 180);
  }

  /* ---------- konuşma motoru ---------- */
  function setMood(m) { root.dataset.mood = m; chat.dataset.mood = m; }

  function choosePos() {
    if (readerOpen) return 'rd';
    var all = ['r', 'l', 'b'], p;
    do { p = all[rnd(all.length)]; } while (p === lastPos && all.length > 1 && Math.random() < .85);
    lastPos = p;
    return p;
  }

  function placeRoot(pos) {
    root.dataset.pos = pos;
    var vw = window.innerWidth, vh = window.innerHeight;
    if (pos === 'r' || pos === 'l') {
      var y = 110 + rnd(Math.max(40, vh - 330));
      root.style.setProperty('--ay', y + 'px');
    } else if (pos === 'b') {
      var minX = window.matchMedia('(min-width:900px)').matches ? 120 : 12;
      var x = minX + rnd(Math.max(10, vw - 270 - minX));
      root.style.setProperty('--ax', x + 'px');
    }
  }

  function onTyped(o, text) {
    el.acts.classList.add('on');
    var dwell = Math.max(3400, text.length * 58) + (o.actions && o.actions.length ? 3500 : 0);
    clearTimeout(hideT);
    hideT = setTimeout(retreat, dwell);
  }

  function typeOut(text, o) {
    clearTimeout(tyT);
    el.ty.textContent = '';
    if (reduce) { el.ty.textContent = text; onTyped(o, text); return; }
    var i = 0;
    (function step() {
      i++;
      el.ty.textContent = text.slice(0, i);
      if (i >= text.length) { onTyped(o, text); return; }
      var ch = text.charAt(i - 1);
      tyT = setTimeout(step, /[.!?…]/.test(ch) ? 150 : /[,;]/.test(ch) ? 80 : 22);
    })();
  }

  function retreat() {
    clearTimeout(hideT); clearTimeout(tyT);
    speaking = false; curPrio = 0;
    if (readerOpen) {                 // okurken küçük köşede kalır, sadece balon kapanır
      root.classList.remove('talk');
      setMood('n');
      return;
    }
    root.classList.remove('on', 'talk');
    clearTimeout(hideDone);
    hideDone = setTimeout(function () { if (!speaking) { root.hidden = true; setMood('n'); } }, 700);
  }

  function say(line, o) {
    o = o || {};
    var prio = o.prio || 1;
    if (!line || !enabled()) return false;
    if (!o.force) {
      if (mode() === 'off') return false;
      if (chatOpen) return false;
      if (prio < 2 && (Date.now() < quietUntil)) return false;
      if (speaking && prio <= 1) return false;
      if (speaking && prio < curPrio) return false;
      if (prio < 2 && Date.now() - lastSay < 9000) return false;
    }
    var mood = typeof line === 'string' ? 'n' : line[0];
    var text = fmt(typeof line === 'string' ? line : line[1], o.vars);
    lastSay = Date.now();
    speaking = true; curPrio = prio;

    clearTimeout(hideDone); clearTimeout(hideT); clearTimeout(tyT);
    var pos = readerOpen ? 'rd' : (root.classList.contains('on') ? root.dataset.pos : choosePos());
    var wasOn = root.classList.contains('on');
    if (!wasOn) placeRoot(pos);
    root.dataset.pos = pos;
    setMood(mood);
    el.gh.textContent = text;
    el.ty.textContent = '';
    el.sr.textContent = text;
    el.acts.classList.remove('on');
    el.acts.innerHTML = '';
    (o.actions || []).forEach(function (a) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = a.t;
      b.addEventListener('click', function (e) { e.stopPropagation(); a.f(); });
      el.acts.appendChild(b);
    });
    root.hidden = false;
    void root.offsetWidth;
    root.classList.add('on', 'talk');
    setTimeout(function () { if (speaking) typeOut(text, o); }, wasOn ? 60 : 380);
    return true;
  }
  function sayPool(key, o) {
    o = o || {};
    return say(pick(key, P[key]), o);
  }

  /* bubble hover: konuşurken fare üstündeyse kapanma */
  root.addEventListener('mouseenter', function () { clearTimeout(hideT); });
  root.addEventListener('mouseleave', function () {
    if (speaking) { clearTimeout(hideT); hideT = setTimeout(retreat, 2200); }
  });
  el.bub.addEventListener('click', function () { retreat(); });

  /* maskota basınca sohbet açılır */
  el.body.addEventListener('click', function () { openChat(); });

  /* ---------- manga önerisi ---------- */
  function recommend(more) {
    var m = randomManga();
    if (!m) return;
    say(pick(more ? 'recoMore' : 'reco', more ? P.recoMore : P.reco), {
      prio: 2, vars: { m: m.title },
      actions: [
        { t: 'Hemen aç', f: function () { openManga(m.title); } },
        { t: 'Başka öner', f: function () { recommend(true); } }
      ]
    });
  }

  /* ---------- sohbet paneli ---------- */
  var history = [], busy = false, cfgP = null;
  function getCfg() {
    if (!cfgP) {
      cfgP = import('./config.js').then(function (m) {
        return { sb: m.supabase, FN: m.FUNCTIONS_URL, KEY: m.SUPABASE_ANON_KEY };
      });
    }
    return cfgP;
  }
  function addMsg(cls, text) {
    var d = document.createElement('div');
    d.className = 'agc-b ' + cls;
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }
  function sysMsg(text) {
    var d = document.createElement('div');
    d.className = 'agc-sys'; d.textContent = text;
    msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
  }
  function setInfo(t, err) { info.textContent = t || ''; info.classList.toggle('err', !!err); }
  function syncSend() { sendBtn.disabled = busy || !inp.value.trim(); }

  function openChat() {
    if (chatOpen) return;
    chatOpen = true;
    retreat();
    chat.removeAttribute('inert');
    chat.classList.add('on');
    dockBtn.setAttribute('aria-expanded', 'true');
    if (window.__dockInd) window.__dockInd(false);
    if (!msgs.children.length) {
      var h = pick('chatHello', P.chatHello);
      setMood(h[0]);
      addMsg('a', h[1]);
    }
    setTimeout(function () { inp.focus(); }, 250);
  }
  function closeChat() {
    if (!chatOpen) return;
    chatOpen = false;
    chat.classList.remove('on');
    chat.setAttribute('inert', '');
    dockBtn.setAttribute('aria-expanded', 'false');
    if (window.__dockInd) window.__dockInd(false);
  }
  dockBtn.addEventListener('click', function (e) { e.stopPropagation(); chatOpen ? closeChat() : openChat(); });
  $('.agc-x', chat).addEventListener('click', closeChat);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && chatOpen) closeChat(); });
  document.addEventListener('pointerdown', function (e) {
    if (chatOpen && !chat.contains(e.target) && !dockBtn.contains(e.target) && !root.contains(e.target)) closeChat();
  });

  modeBtn.addEventListener('click', function () {
    var next = { on: 'low', low: 'off', off: 'on' }[mode()];
    store('ardevyl_mode', next);
    modeBtn.textContent = modeLabel();
    var t = { on: "Tamam, eskisi gibi sık çıkacağım. Beni özleyeceğini biliyordum! ...Yani öyle varsayıyorum.",
              low: "Az çıkacağım. Hmph, sıkıldıysan söylemen yeterdi.",
              off: "Sessizim. Ama sohbet düğmesi hep burada. ...Aklında olsun." }[next];
    sysMsg(t);
    if (next === 'on') scheduleAmbient();
  });

  /* yeni sohbet: konuşmayı temizler, baştan başlar */
  $('.agc-new', chat).addEventListener('click', function () {
    if (busy) { setInfo('Cevap yazılırken yeni sohbet açılamaz.', true); return; }
    history = []; msgs.innerHTML = ''; setInfo('');
    $$('.agc-tabs button', chat)[0].click();           // Sohbet sekmesine dön
    var h = pick('chatHello', P.chatHello);
    setMood(h[0]); addMsg('a', h[1]);
    setTimeout(function () { inp.focus(); }, 50);
  });

  $$('.agc-tabs button', chat).forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.agc-tabs button', chat).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var reco = b.dataset.tab === 'reco';
      chat.classList.toggle('reco-on', reco);
      if (reco) renderReco();
      else setTimeout(function () { inp.focus(); }, 50);
    });
  });

  function renderReco() {
    recoBox.innerHTML = '';
    var note = document.createElement('div');
    note.className = 'agc-note'; note.textContent = pick('recoTab', P.recoTab);
    recoBox.appendChild(note);
    var all = mangaTitles(), chosen = [];
    while (all.length && chosen.length < 5) chosen.push(all.splice(rnd(all.length), 1)[0]);
    if (!chosen.length) {
      var e = document.createElement('div'); e.className = 'agc-note';
      e.textContent = "Henüz öneri yok. Manga sekmesi yüklenmedi mi?";
      recoBox.appendChild(e);
    }
    chosen.forEach(function (m) {
      var c = document.createElement('div'); c.className = 'agc-card';
      var cv = document.createElement('div'); cv.className = 'agc-cv';
      cv.style.setProperty('--c1', m.node.style.getPropertyValue('--c1'));
      cv.style.setProperty('--c2', m.node.style.getPropertyValue('--c2'));
      var art = m.node.querySelector('.mg-art');
      if (art) cv.insertAdjacentHTML('afterbegin', art.outerHTML.replace(/(id="|url\(#)g(\d+)/g, '$1gc$2'));
      var t = document.createElement('div'); t.className = 'agc-ct';
      var b = document.createElement('b'); b.textContent = m.title;
      var s = document.createElement('small'); s.textContent = m.genre;
      t.appendChild(b); t.appendChild(s);
      var g = document.createElement('button'); g.type = 'button'; g.className = 'agc-go'; g.textContent = 'Oku';
      g.addEventListener('click', function () { openManga(m.title); });
      c.appendChild(cv); c.appendChild(t); c.appendChild(g);
      recoBox.appendChild(c);
    });
    var more = document.createElement('button'); more.type = 'button'; more.className = 'agc-more'; more.textContent = 'Başka öner';
    more.addEventListener('click', renderReco);
    recoBox.appendChild(more);
  }

  /* ---------- sohbet: hızlı düğmeler + yerel komutlar (sunucuya gitmez) ---------- */
  var chipBox = $('#agChips');
  ['Manga öner', 'Şaka yap', 'Fal bak', 'Yazı tura', 'Kim terbiyesiz?', "Taha'ya laf sok", "Quartex'e laf sok", "Narancia'ya laf sok", "Kemal'e laf sok", "Rai'ye laf sok", "Thoya'ya laf sok"].forEach(function (t) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = t;
    b.addEventListener('click', function () { send(t); });
    chipBox.appendChild(b);
  });
  function nameIn(t) {
    for (var k in CASTN) if (new RegExp('(^|[^a-zçğıöşü])' + k).test(t)) return k;
    return null;
  }
  function roastOf(k) { return pick('rs' + k, ROAST[k]) + pick('tail', TAIL); }
  function randName() { var ks = Object.keys(CASTN); return ks[rnd(ks.length)]; }
  function local(text) {
    var t = text.toLocaleLowerCase('tr'), n = nameIn(t), y, m;
    if (/yaz[ıi] ?tura/.test(t)) { y = rnd(2); return { m: 's', t: (y ? 'Yazı' : 'Tura') + ' geldi. ' + (y ? 'Şansın varmış. Yanlış anlama, istatistik.' : 'Hmph, sanki umurumdaydı.') }; }
    if (/\bzar\b/.test(t)) return { m: 'h', t: 'Zar: ' + (1 + rnd(6)) + '. Beğenmediysen tekrar at, ben saymam.' };
    if (/\bfal\b/.test(t)) return { m: 'b', t: pick('fal', FAL) };
    if (/şaka|fıkra/.test(t)) return { m: 's', t: pick('jk', JOKES) };
    if (/kim.*(terbiyesiz|saygısız|arsız)|(terbiyesiz|saygısız).*kim/.test(t)) { y = randName(); return { m: 'a', t: 'Ne kadar terbiyesiz diye soruyorsun... Bence ' + CASTN[y] + '. ' + roastOf(y) }; }
    if (n && /laf|sal|sok|dalga|ez\b|yak|rezil|anlat|hakkında|ne diyor/.test(t)) return { m: 's', t: roastOf(n) };
    if (/laf (sok|sal)|roast/.test(t)) { y = randName(); return { m: 's', t: roastOf(y) }; }
    if (/manga.*(öner|öneri|ver|bul)|(öner|öneri).*manga/.test(t)) {
      m = randomManga();
      if (m) return { m: 'h', t: "'" + m.title + "' dene. Seçtim diye değil, gerçekten iyi göründüğü için!", btn: { t: 'Hemen aç', f: function () { openManga(m.title); } } };
    }
    return null;
  }

  inp.addEventListener('input', syncSend);
  $('#agForm').addEventListener('submit', function (e) { e.preventDefault(); send(inp.value); });

  async function send(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    busy = true; setInfo('');
    inp.value = ''; syncSend();
    addMsg('u', text);
    var lc = local(text);
    if (lc) {
      var lb = addMsg('a w', 'Yazıyor...');
      setTimeout(function () {
        lb.className = 'agc-b a'; lb.textContent = lc.t; setMood(lc.m || 's');
        if (lc.btn) { var gb = document.createElement('button'); gb.type = 'button'; gb.className = 'agc-go'; gb.textContent = lc.btn.t; gb.addEventListener('click', lc.btn.f); lb.appendChild(gb); }
        history.push({ role: 'user', content: text }, { role: 'assistant', content: lc.t });
        msgs.scrollTop = msgs.scrollHeight; busy = false; syncSend();
      }, 400 + rnd(500));
      return;
    }
    var bub = addMsg('a w', 'Yazıyor...');
    setMood('n');
    try {
      var cfg = await getCfg();
      if (!cfg.FN) throw new Error('Sunucuya ulaşılamıyor.');
      var token = null;
      try { var s = await cfg.sb.auth.getSession(); token = s.data.session && s.data.session.access_token; } catch (_) {}
      var view = curView();
      var msg = text;
      if (!SERVER_PERSONA) {
        msg = '[Sen "Ardevyl"sin: LTF sitesinin kalkan şeklindeki tsundere maskotusun. Türkçe konuş, en çok 5 cümle; "Hmph", "y-yanlış anlama" gibi kalıplar kullan ama yardımcı ol. Esprili, alaycı ve doğrudan ol, çekingen olma. Topluluktaki arkadaşlar Taha, Quartex, Narancia, Kemal, Rai ve Thoya hakkında dostça, abartılı şakalar ve hafif laf sokmalar yapabilirsin (huy abartısı, geç kalma, gevezelik gibi komik konular; küfür, dış görünüş, aile, din, ırk ya da cinsellik üzerinden hakaret yok). Kullanıcı kaba ya da yaramaz davranırsa "Ne kadar terbiyesizsin, Taha gibi!" tarzı tepki ver. Kullanıcı "' + view + '" sekmesinde.] ' + text;
      }
      var r;
      try {
        r = await fetch(cfg.FN + '/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: cfg.KEY, Authorization: 'Bearer ' + (token || cfg.KEY) },
          body: JSON.stringify({ message: msg, history: history.slice(-6), persona: 'aegis', view: view })
        });
      } catch (_) { throw new Error('net'); }
      if (!r.ok) { var j = {}; try { j = await r.json(); } catch (_) {} throw new Error(j.error || 'srv'); }
      var rem = r.headers.get('X-Remaining');
      var rd = r.body.getReader(), dec = new TextDecoder(), out = '';
      while (true) {
        var chunk = await rd.read();
        if (chunk.done) break;
        out += dec.decode(chunk.value, { stream: true });
        bub.className = 'agc-b a'; bub.textContent = out;
        msgs.scrollTop = msgs.scrollHeight;
      }
      if (!out.trim()) throw new Error('empty');
      history.push({ role: 'user', content: text }, { role: 'assistant', content: out.trim() });
      setMood(pick('chatMood', ['n', 's', 'b', 'h', 'a']));
      if (rem !== null) setInfo('Bugün kalan hakkın: ' + rem);
    } catch (err) {
      bub.remove();
      var f = pick('chatErr', P.chatErr);
      setMood(f[0]);
      addMsg('a', f[1]);
      setInfo(err && err.message && err.message.length < 80 && !/^(net|srv|empty)$/.test(err.message) ? err.message : 'Bağlantı hatası.', true);
    }
    busy = false; syncSend();
  }

  /* ---------- olaylar ---------- */
  function onView(v, initial) {
    visits[v] = (visits[v] || 0) + 1;
    var now = Date.now();
    viewStamps.push(now);
    viewStamps = viewStamps.filter(function (t) { return now - t < 10000; });
    if (viewStamps.length >= 6) { sayPool('spam', { prio: 2 }); viewStamps = []; return; }
    var n = visits[v];
    if (v === 'manga') {
      var m = randomManga();
      if (m) {
        say(pick('reco', P.reco), {
          prio: 2, vars: { m: m.title },
          actions: [
            { t: 'Hemen aç', f: function () { openManga(m.title); } },
            { t: 'Başka öner', f: function () { recommend(true); } }
          ]
        });
      }
    } else if (v === 'ana-sayfa') {
      if (initial && n === 1) return;
      say(P.emptyHome[Math.min(n - 1, P.emptyHome.length - 1)], { prio: 2 });
    } else if (v === 'kesfet') {
      say(n <= P.emptyExplore.length ? P.emptyExplore[n - 1] : pick('emptyExplore', P.emptyExplore), { prio: 2 });
    } else if (v === 'kutuphane') {
      say(n <= P.emptyLib.length ? P.emptyLib[n - 1] : pick('emptyLib', P.emptyLib), { prio: 2 });
    } else if (v === 'profil') {
      setTimeout(profileCheck, 1600);
    }
  }
  function profileCheck() {
    if (curView() !== 'profil') return;
    var back = $('#pfBack');
    if (back && !back.hidden) return;                 // başkasının profiline bakıyor
    var nick = $('#pfNick');
    if (!nick || !nick.textContent.trim()) return;    // veriler henüz gelmedi
    var noAv = $('#pfImg') && $('#pfImg').hidden;
    var noBan = $('#pfBanImg') && $('#pfBanImg').hidden && $('#pfVid') && $('#pfVid').hidden;
    var noBio = $('#bioView') && !$('#bioView').textContent.trim();
    var opts = [];
    if (noAv) opts.push('noAvatar');
    if (noBan) opts.push('noBanner');
    if (noBio) opts.push('noBio');
    if (opts.length) sayPool(opts[rnd(opts.length)], { prio: 2 });
    else sayPool('profileOk', { prio: 2 });
  }

  window.addEventListener('hashchange', function () { setTimeout(function () { onView(curView()); }, 0); });

  /* arama */
  var qT = null, qLast = '';
  var q = $('#mgQ');
  if (q) {
    q.addEventListener('input', function () {
      clearTimeout(qT);
      qT = setTimeout(function () {
        var v = q.value.trim();
        if (!v || v === qLast) return;
        qLast = v;
        var shown = $$('#mgGrid .mg-cover').filter(function (c) { return c.style.display !== 'none'; }).length;
        if (!shown) sayPool('searchNo', { prio: 2 });
        else if (shown < 6) say(pick('searchOk', P.searchOk), { prio: 2, vars: { n: shown } });
        else if (Math.random() < .4) sayPool('search', { prio: 2 });
      }, 1100);
    });
  }

  /* manga listesinde çok kaydırma */
  var mgScroll = 0, mgLastY = window.scrollY || 0;
  window.addEventListener('scroll', function () {
    activityAt = Date.now(); idleSaid = false;
    if (curView() !== 'manga' || readerOpen) { mgLastY = window.scrollY || 0; return; }
    var y = window.scrollY || 0;
    mgScroll += Math.abs(y - mgLastY); mgLastY = y;
    if (mgScroll > 5200) { mgScroll = 0; sayPool('mangaScroll', { prio: 1 }); }
  }, { passive: true });

  /* ayarlar & çıkış */
  var stBox = $('#st');
  if (stBox) {
    new MutationObserver(function () {
      if (stBox.classList.contains('on')) sayPool('settings', { prio: 2 });
    }).observe(stBox, { attributes: true, attributeFilter: ['class'] });
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('#stOut')) say(pick('signOut', P.signOut), { prio: 3, force: true });
  }, true);

  /* internet */
  window.addEventListener('offline', function () { sayPool('offline', { prio: 3 }); });
  window.addEventListener('online', function () { sayPool('online', { prio: 3 }); });

  /* sekmeye geri dönüş */
  var hiddenAt = 0;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (hiddenAt && Date.now() - hiddenAt > 45000) sayPool('back', { prio: 2 });
    hiddenAt = 0;
  });

  /* ---------- manga okuyucu: birlikte okuma ---------- */
  var rd = $('#mgRd'), rdB = $('#mgRdB');
  function readerTitle() { var s = $('#mgRdT span'); return s ? s.textContent : ''; }

  function readerOpened() {
    readerOpen = true;
    closeChat();
    rdState = { fired: {}, chap: -1, last: 0, lastScroll: Date.now(), lastTop: 0, lastT: Date.now(), fastN: 0, fastAt: 0, idleAt: Date.now(), prog: 0 };
    retreat();
    if (!enabled()) { root.hidden = true; return; }      // maskot kapalıysa okurken çıkmasın
    root.dataset.pos = 'rd';
    root.hidden = false;
    setTimeout(function () {
      if (!readerOpen) return;
      root.classList.add('on');
      sayPool('reading', { prio: 3, vars: { t: readerTitle() } });
      rdState.last = Date.now();
    }, 500);
  }
  function readerClosed() {
    var prog = rdState.prog;
    readerOpen = false;
    root.classList.remove('talk', 'on');
    speaking = false; curPrio = 0;
    clearTimeout(tyT); clearTimeout(hideT);
    root.hidden = true;
    setTimeout(function () {
      var key = prog < .3 ? 'closeEarly' : prog > .95 ? 'closeEnd' : 'closeMid';
      say(pick(key, P[key]), { prio: 2 });
    }, 700);
  }
  if (rd) {
    var wasOn = rd.classList.contains('on');
    new MutationObserver(function () {
      var now = rd.classList.contains('on');
      if (now && !wasOn) readerOpened();
      else if (!now && wasOn) readerClosed();
      wasOn = now;
    }).observe(rd, { attributes: true, attributeFilter: ['class'] });
  }

  var raf = false;
  function readerScroll() {
    raf = false;
    if (!readerOpen || !rdB) return;
    var now = Date.now();
    var max = rdB.scrollHeight - rdB.clientHeight;
    var top = rdB.scrollTop;
    var prog = max > 0 ? top / max : 0;
    rdState.prog = Math.max(rdState.prog, prog);

    /* hızlı kaydırma */
    var dt = now - rdState.lastT, dy = Math.abs(top - rdState.lastTop);
    if (dt > 0 && dy / dt > 2.2) {
      rdState.fastN++;
      if (rdState.fastN >= 4 && now - rdState.fastAt > 40000) {
        rdState.fastAt = now; rdState.fastN = 0;
        sayPool('fast', { prio: 3 });
      }
    } else if (dt > 120) { rdState.fastN = 0; }
    rdState.lastTop = top; rdState.lastT = now; rdState.lastScroll = now;

    if (now - rdState.last < 7000) return;

    /* bölüm başlıkları */
    var hs = $$('h3.mg-tx-h', rdB), ct = rdB.getBoundingClientRect().top + 70, ci = -1;
    for (var i = 0; i < hs.length; i++) { if (hs[i].getBoundingClientRect().top <= ct) ci = i; }
    if (ci >= 0 && ci !== rdState.chap) {
      var firstTime = rdState.chap === -1 && ci === 0;
      rdState.chap = ci;
      if (!firstTime) {
        var title = (hs[ci].textContent || '').replace(/^Bölüm\s*\d+:\s*/, '');
        rdState.last = now;
        say(pick('chapter', P.chapter), { prio: 2, vars: { n: ci + 1, t: title } });
        return;
      }
    }
    /* ilerleme yorumları */
    var marks = [[.12, 'p12'], [.3, 'p30'], [.5, 'p50'], [.7, 'p70'], [.9, 'p90'], [.985, 'p100']];
    for (var k = marks.length - 1; k >= 0; k--) {
      if (prog >= marks[k][0]) {
        if (!rdState.fired[marks[k][1]]) {
          for (var j = 0; j <= k; j++) rdState.fired[marks[j][1]] = 1;   // atlananları da işaretle
          rdState.last = now;
          sayPool(marks[k][1], { prio: 2 });
        }
        break;
      }
    }
  }
  if (rdB) {
    rdB.addEventListener('scroll', function () {
      if (!raf) { raf = true; requestAnimationFrame(readerScroll); }
    }, { passive: true });
    rdB.addEventListener('toggle', function (e) {
      if (e.target && e.target.open && readerOpen && Date.now() - rdState.last > 4000) {
        rdState.last = Date.now();
        sayPool('cast', { prio: 2 });
      }
    }, true);
  }
  setInterval(function () {
    if (!readerOpen) return;
    var now = Date.now();
    if (now - rdState.lastScroll > 55000 && now - rdState.idleAt > 90000) {
      rdState.idleAt = now;
      sayPool('readIdle', { prio: 2 });
    }
  }, 5000);

  /* ---------- rastgele çıkışlar ---------- */
  var ambT = null;
  function ambient() {
    if (document.hidden || chatOpen || readerOpen) return;
    if (stBox && stBox.classList.contains('on')) return;
    var v = curView(), r = Math.random();
    if (Math.random() < .14) { sayPool('roast', { prio: 1 }); return; }
    if (v === 'manga') {
      if (r < .35) recommend(true);
      else sayPool('mangaAmb', { prio: 1 });
    } else if (v === 'ana-sayfa' || v === 'kesfet' || v === 'kutuphane') {
      if (r < .55) sayPool('emptyAmb', { prio: 1 });
      else sayPool('amb', { prio: 1 });
    } else {
      sayPool('amb', { prio: 1 });
    }
  }
  function scheduleAmbient() {
    clearTimeout(ambT);
    var m = mode();
    var d = m === 'off' ? 30000 : m === 'low' ? 150000 + rnd(150000) : 38000 + rnd(42000);
    ambT = setTimeout(function () { if (mode() !== 'off') ambient(); scheduleAmbient(); }, d);
  }

  /* hareketsizlik */
  ['pointermove', 'keydown', 'touchstart', 'pointerdown'].forEach(function (ev) {
    window.addEventListener(ev, function () { activityAt = Date.now(); idleSaid = false; }, { passive: true });
  });
  setInterval(function () {
    if (idleSaid || document.hidden || chatOpen || readerOpen) return;
    if (Date.now() - activityAt > 75000) {
      idleSaid = true;
      sayPool('idle', { prio: 1 });
    }
  }, 6000);

  /* ---------- açılış ---------- */
  var h = new Date().getHours();
  setTimeout(function () {
    if (readerOpen) return;
    var night = h >= 0 && h < 5;
    sayPool(night ? 'night' : h < 11 ? 'morning' : h >= 18 ? 'evening' : 'greet', { prio: 2 });
  }, 2400);
  setTimeout(function () { onView(curView(), true); }, 13000);
  scheduleAmbient();
  applyEnabled();

  /* dışarıdan kullanım: Ardevyl.say(['b','Merhaba!']) */
  window.Ardevyl = {
    say: function (line, o) { return say(line, o || { prio: 2 }); },
    open: openChat,
    close: closeChat,
    newChat: function () { var b = $('.agc-new', chat); if (b) b.click(); },
    recommend: function () { recommend(); }
  };
})();