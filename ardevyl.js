/* ============================================================
   ARDEVYL — LTF'nin kalkan maskotu (kahraman tip)
   Kurulum: app.html'in </body> etiketinden hemen önce şunu ekle:
       <script src="ardevyl.js"></script>
   Dosya tek başına çalışır, sitenin mevcut kodunu değiştirmez.

   AYARLAR
   SERVER_PERSONA = false -> kişilik bilgisi her mesajla birlikte gönderilir.
   ai-chat fonksiyonu mesajı en fazla 1000 karaktere izin verir; bu yüzden
   kişilik metni kısa tutulur ve toplam uzunluk buildMsg() ile 1000'in altında kalır.
   ============================================================ */
(function () {
  'use strict';
  if (window.__ardevyl) return;
  window.__ardevyl = 1;

  var SERVER_PERSONA = false;
  var MAXMSG = 1000;   // ai-chat fonksiyonundaki MAX_INPUT_CHARS ile aynı olmalı
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
     Duygular: n sakin, b alçakgönüllü, a kararlı, h mutlu, s özgüvenli gülümseme, z yorgun, o şaşkın  */
  var P = {
    greet: [
      ['h', "Selam, yolcu. Ben Ardevyl, birliğin kalkanı. Bu kapıdan geçtiğin sürece arkan emin ellerde."],
      ['n', "Hoş geldin. Kalkanım sırtını kolluyor; yolun açık olsun."],
      ['s', "Yeniden buradasın. Sadık olanın yeri her zaman bu kapının içidir."],
      ['a', "Nöbet yerimdeyim. Ne gerekirse çağır, gölge düşmeden gelirim."]
    ],
    night: [
      ['z', "Gece derinleşti, yolcu. Ben nöbetteyim; sen yarının yolu için biraz güç topla."],
      ['n', "Karanlıkta da bekçi uyumaz. Yalnız değilsin, kalkanım gece boyu yanında."]
    ],
    back: [
      ['h', "Döndün! Kapı açık kaldı, ben de nöbetimi bırakmadım."],
      ['n', "Uzun bir yoldan dönen yoldaş gibisin. Hoş geldin geri."],
      ['s', "Gidenler döner, sadıklar hep. Seni bekliyordum."]
    ],
    reco: [
      ['h', "Bir hikâye seni çağırıyor: '{m}'. Bazı kitaplar yolcusunu kendisi seçer."],
      ['s', "Rafların arasında bir ışık fark ettim: '{m}'. Cesaret edip açar mısın?"],
      ['n', "Bu diyarın yolları uzun. Bu sefer '{m}' ile başla, pişman olmazsın."],
      ['a', "Bir kahraman hikâyeden korkmaz. '{m}' seni bekliyor."],
      ['o', "Şu kapağa bak! '{m}' içinde büyük bir macera saklıyor gibi."]
    ],
    recoMore: [
      ['n', "Bu yol seni çağırmadıysa başkasını göstereyim: '{m}'."],
      ['s', "Her kahraman birkaç kapı çalar. Sıra '{m}'da."],
      ['h', "Pes etmek yok! '{m}' belki aradığın hikâyedir."],
      ['a', "Bir tane daha: '{m}'. Doğru olanı bulana dek yanındayım."]
    ],
    mangaAmb: [
      ['n', "Seçmek yolun ilk sınavıdır. Acele etme; doğru hikâye seni bulur."],
      ['s', "Kapaklar arasında dolaşıyorsun. Gözünün gittiği yerde kaderin bir izi vardır."],
      ['h', "Aşk, intikam, savaş... Her türde bir kahraman var. Hangi yüreğe yakınsın?"],
      ['n', "Arama çubuğu bir pusula gibidir. Aradığın hikâyenin adını yaz, yolu o gösterir."],
      ['z', "Rafların sonu yok gibi. Güzel; okunacak çok hikâye, anlatılacak çok destan var."]
    ],
    mangaScroll: [
      ['n', "Uzun süredir yolu tarıyorsun. Bir kapıyı aç; destan kapının ardında başlar."],
      ['a', "Aramak güzeldir ama bir noktada adım atmak gerekir. Bir hikâye seç, yolcu."]
    ],
    search: [
      ['n', "Ne arıyorsun, yolcu? Adını söyle, izini sürelim."],
      ['s', "Aramaya başladın. Aranan, arayanı eninde sonunda bulur."]
    ],
    searchNo: [
      ['n', "Bu iz soğumuş; yazılışı bir daha gözden geçir. Aranan bir yerde saklı."],
      ['o', "Hiçbir şey çıkmadı! Ama hiçbir yol sonsuza dek kapalı kalmaz."],
      ['a', "Bulamadık, fakat vazgeçmek yok. Başka bir adla dene."]
    ],
    searchOk: [
      ['h', "{n} sonuç çıktı. Yolun açık, birini seç."],
      ['n', "{n} hikâyenin izine denk geldik. Hangisi seni çağırıyor?"]
    ],
    emptyHome: [
      ['h', "Ana sayfa karargâhın. Günlük görevlerin seni bekliyor; her biri puan, her puan bir adım."],
      ['s', "Günün sözünü okudun mu? Sözler de bir silahtır, doğru kullanılırsa."],
      ['n', "Serini koru, savaşçı. Her gün gelen, günden güne güçlenir."],
      ['a', "Görevlerin duruyor. Başladığını tamamlamak kahramanların işidir."]
    ],
    emptyExplore: [
      ['h', "Keşfet meydanı açık! Çark, sınav, oyunlar... Dene, cesaretin ödüllendirilsin."],
      ['s', "Hafıza oyununda ustalığını görmek isterim. Meydan okumayı kabul ediyor musun?"],
      ['n', "Çarkı bugün çevirdin mi? Günde bir hak var; şansı da kollamak gerekir."],
      ['a', "Sıralamada yerini gör. Zirve, yürüyenlerin hakkıdır."]
    ],
    emptyLib: [
      ['h', "Kütüphane senin arşivin. Okuduğun her hikâye buraya bir yıldız olsun."],
      ['n', "Bir manga ekle; hem görev tamamlanır hem yolculuğun kayda geçer."],
      ['s', "Okuyorum, bitirdim, sırada... Üç kapı. Hangisinden yürüyorsun?"],
      ['a', "Düzenli bir raf, düzenli bir zihin demektir. Listeni güncel tut."]
    ],
    emptyAmb: [
      ['s', "Sıkıldıysan Keşfet'te oyunlar var. Ben meydanın kenarından izlerim, gerekirse yardıma koşarım."],
      ['h', "Bir görev daha ve hepsi tamam! Son adımı atmak her zaman en güzelidir."],
      ['n', "Puanların nasıl gidiyor? Küçük adımlar büyük menziller kazandırır."],
      ['a', "Hâlâ oyun oynamadıysan Keşfet'e yürü. Cesur olan ilk adımı atar."]
    ],
    amb: [
      ['n', "Buradayım, yolcu. Gözlerim hep sende, kalkanım hep önünde."],
      ['s', "Bir sır vereyim: kalkanın parlaklığı, taşıyanın yüreğinden gelir."],
      ['n', "Su içtin mi? En güçlü kahraman bile susuz yol alamaz."],
      ['a', "Dik dur. Omuzların yorulduysa bir mola ver; savaşçı dinlenmeyi de bilir."],
      ['n', "Ekran parlaklığını biraz kıs. Gözlerin senin en değerli silahın."],
      ['h', "Çok sessizsin. Konuşmak istersen alttaki kalkan düğmesine dokun, dinlerim."],
      ['s', "Nöbetteyim. Sen yürümeye devam et, arkanı ben kollarım."],
      ['n', "Kalkan olmak, hep birinin önünde durmaktır. Taşıdığım en gurur verici yük bu."],
      ['h', "Bugün güzel bir gün. Küçük zaferler bile destanın bir sayfasıdır."],
      ['z', "Gün ağır geçmiş olabilir. Yine de buradasın; bu başlı başına bir zafer."],
      ['b', "Hikâyelerin kahramanları da dinlenirdi. Nefes al, kimse seni yargılamıyor."],
      ['n', "Kimse yalnız savaşmaz. Çağırmak istersen yanında olduğumu unutma."],
      ['s', "Rüzgâr yön değiştirirse biz de yelkeni ona göre kurarız."],
      ['o', "Bir ses duydum! ...Yanlış alarm. Yine de gözüm açık, nöbet sürüyor."]
    ],
    reading: [
      ['h', "Bir hikâye açılıyor. Sessizce yanında olacağım; yolculuğun tadını çıkar."],
      ['s', "'{t}'... Bu destanın başlangıcı güzel görünüyor. Sayfayı çevir, yolcu."],
      ['n', "Okuma vakti. Ben köşede nöbet tutarım; sen kahramanlarla yürü."],
      ['a', "Hikâyeye adım atıyoruz. Gözünü açık tut, her satırda bir iz var."]
    ],
    p12: [
      ['n', "Yolun başındayız. İlk adımlar hep temkinlidir; yine de ufuk görünüyor."],
      ['s', "Hikâye kendini açmaya başladı. Dikkatle ilerle."]
    ],
    p30: [
      ['o', "Sahne ısınıyor! Bu yolun sonu merak ettiriyor."],
      ['h', "Karakterler yüreğine yerleşmeye başladı, hissediyorum."]
    ],
    p50: [
      ['h', "Yarı yoldayız! Dönüm noktası yaklaşıyor, hazır ol."],
      ['s', "Tam ortadayız. Bundan sonrası kahramanın gerçek imtihanı."]
    ],
    p70: [
      ['a', "Fırtına yaklaşıyor. Sakin kal; kahramanlar en karanlık anda parlar."],
      ['o', "Kalbim hızlandı! Ne olacak, ne olacak?"]
    ],
    p90: [
      ['o', "Son bölüğe girdik! Nefesini tut; büyük an çok yakın."],
      ['a', "Sona çok az kaldı. Bırakma, yolun son virajı en güzelidir."]
    ],
    p100: [
      ['h', "Destan tamamlandı. Bazı hikâyeler bitmez, yürekte yaşar."],
      ['b', "Bu hikâye bana dokundu. Bazen en yürekli şey, duygulanabilmektir. Birlikte okuduğun için sağ ol."]
    ],
    chapter: [
      ['s', "Bölüm {n}: '{t}'. Yeni bir sayfa, yeni bir sınav."],
      ['h', "Yeni bölüm başlıyor! Yola devam edelim."],
      ['n', "{n}. bölüme ulaştık. Her adım sayılır."],
      ['o', "'{t}' mi? Bu başlık bir şey vadediyor!"]
    ],
    fast: [
      ['a', "Yavaşla, yolcu! Hızlı geçersen en güzel manzarayı kaçırırsın."],
      ['o', "Dur, bir nefes al! Hikâye seninle birlikte yürümek istiyor."],
      ['n', "Aceleyle okunan destan yarım anlaşılır. Biraz yavaşla."]
    ],
    readIdle: [
      ['z', "Uzun süredir sessizsin. Dinleniyorsan sorun yok; nöbetim sürüyor."],
      ['n', "Bir mola mı verdin? Dönmeye hazır olduğunda hikâye seni bekliyor."]
    ],
    cast: [
      ['h', "Karakter listesi, bir ordunun künyesi gibidir. Hangisi yüreğine yakın?"],
      ['s', "Hepsini tanıyorsun artık. İyi bir okur, kahramanlarının adını bilir."]
    ],
    closeEarly: [
      ['o', "Daha yeni başlamıştık! Neyse, yolculuk seni bekler. Ne zaman istersen döneriz."],
      ['n', "Erken bıraktın ama hikâye yerinde duruyor. Hazır olunca devam ederiz."]
    ],
    closeMid: [
      ['n', "Yarıda bıraktın. Dönmek için acele etme; destan sabırlıdır."],
      ['h', "Yoruldun mu? Dinlen. Hikâye yarın da orada olacak, ben de."]
    ],
    closeEnd: [
      ['h', "Sona vardın! Güzel bir destandı. Bir sonrakini birlikte seçelim mi?"],
      ['s', "Sonuna kadar okudun. Bu, gerçek bir yolcunun işaretidir."]
    ],
    noAvatar: [
      ['n', "Profil fotoğrafın boş. Her kahramanın bir yüzü, her sancağın bir amblemi olur."],
      ['a', "Bir fotoğraf koy; dostların seni tanısın."]
    ],
    noBanner: [
      ['s', "Banner da boş. Meydan okuyan bir sancak gibi bir görsel asabilirsin; video bile olur."],
      ['n', "Bir banner, profiline bayrak dikmek gibidir. Dilersen bir tane ekle."]
    ],
    noBio: [
      ['h', "Biyografin boş. Her kahramanın bir hikâyesi vardır; seninkini yazmak ister misin?"],
      ['n', "Birkaç cümle yeter. Seni anlatan sözler, en güçlü kalkandır."]
    ],
    profileOk: [
      ['h', "Profilin gösterişli. Emek verilmiş; bir kahramana yakışır."],
      ['s', "Güzel düzenlenmiş. Sancağını yükseğe dikmişsin."]
    ],
    settings: [
      ['n', "Ayarlar karargâhın düzenidir. Yazı boyutunu gözüne göre seç; yolcu rahat etmeli."],
      ['o', "Beni kapatmayacaksın, değil mi? Kapatsan da sohbet düğmesi hep orada olacak."]
    ],
    signOut: [
      ['n', "Çıkış yapıyorsun. Güle güle, yolcu. Dönüşünde kapıyı açık bulursun."]
    ],
    offline: [
      ['o', "Bağlantı koptu! Köprüler yıkıldı ama yeniden kurarız."]
    ],
    online: [
      ['h', "Bağlantı geri geldi! Yol yeniden açıldı."]
    ],
    spam: [
      ['o', "Sekmeler arasında kasırga gibi dolaşıyorsun! Nefes al, yolcu."],
      ['a', "Bir yola karar ver, savaşçı. Dağınık adımlar yorucu olur."]
    ],
    idle: [
      ['z', "Hâlâ orada mısın, yolcu? Sessizlikte de nöbet tutarım."],
      ['z', "Sessizlik çöktü. Dinlen; ben burada bekliyorum."]
    ],
    chatHello: [
      ['n', "Buyur, yolcu. Dinliyorum. Ne sormak ya da paylaşmak istersen yanındayım."],
      ['h', "Hoş geldin. Kalkanım hazır, kulağım sende. Söyle bakalım."]
    ],
    chatErr: [
      ['a', "Haberci sunucuya ulaşamadı. Biraz sonra tekrar dene, ben buradayım."],
      ['o', "Cevap gelmedi... Yol kapanmış olabilir. Birazdan yeniden deneyelim."]
    ],
    recoTab: [
      "Bunlar senin için seçtiğim hikâyeler. Birini seç, yolculuk başlasın.",
      "Rafların arasından ışığı en parlak olanları ayırdım. Buyur."
    ]
  };

  /* ---------- EK SÖZLER: günün saati, dostça takılmalar ---------- */
  P.morning = [
    ['h', "Gün doğdu! Yeni bir sabah, yeni bir sayfa. Hazırsan yola çıkalım."],
    ['n', "Günaydın, yolcu. Sabahın sakinliği günün gücüdür."]
  ];
  P.evening = [
    ['s', "Akşam çöktü; hikâye vakti. Bir manga açmak ister misin?"],
    ['n', "İyi akşamlar. Günün yükünü bırak, bir destanın içinde dinlen."]
  ];
  P.roast = [
    ['s', "Taha sahneye çıkmadan alkış bekler. Gürültüsü savaş davulunu bile bastırır."],
    ['a', "Quartex'in 'beş dakikaya oradayım'ı, birliğin resmî zaman birimi sayılır."],
    ['s', "Narancia'nın ortaya çıkış saati hâlâ bir sır. Kaşifler arıyor."],
    ['n', "Kemal kendinden emin konuşur; haklı çıkması işin ikinci kısmıdır."],
    ['z', "Rai'nin 'bir dakika'sı, bir destan uzunluğunda sürebilir."],
    ['b', "Thoya'nın bahaneleri kalkanımdan sağlam. Sanatçı, ne yapalım."],
    ['s', "Birlikte yürüdüğümüz yoldaşlar bunlar. Her birini severim; yine de gözümü açık tutarım."]
  ];
  var CASTN = { taha: 'Taha', quartex: 'Quartex', narancia: 'Narancia', kemal: 'Kemal', rai: 'Rai', thoya: 'Thoya' };
  var ROAST = {
    taha: ["Taha sahneye çıkmadan alkış bekler. Sesi savaş davulundan gür.", "Taha bir gün sessiz kalsa birlik nöbet tutar: ya hasta ya efsane oldu diye.", "Taha'nın girişi hep görkemlidir; keşke çıkışı da zamanında olsa.", "Taha ile laf yarıştırmak, rüzgâra karşı kalkan tutmak gibidir: mümkün ama yorucu."],
    quartex: ["Quartex'in planı hep 'sonra bakarız'. Sonrası bir efsane kadar uzak.", "Quartex gizemli görünmeyi sever. Gizemin yarısı geç kalmasıdır.", "Quartex'e 'gel' demek, kediyi çağırmak gibidir. Gelirse nişan, gelmezse beklenen.", "Quartex bir yere vardığında sahne çoktan başka bir bölüme geçmiş olur."],
    narancia: ["Narancia'nın ortaya çıkış zamanı kervan haberi kadar belirsiz.", "Narancia kalabalıkta en yüksek sesle susan yoldaştır; buna yetenek diyelim.", "Narancia'ya göre 'hemen geliyorum' ile 'yarın görüşürüz' aynı cümledir.", "Narancia bir işe başlasa destanlar yeniden yazılır; henüz başlamadı."],
    kemal: ["Kemal'in özgüveni ile bilgisi arasındaki mesafeden bir ordu geçer.", "Kemal haritayı ters tutup 'yol bu taraftan' der. Yine de ona güvenmek istersin.", "Kemal bilmediği konuyu bile bilenden yüksek sesle anlatır; bu da bir yetenek.", "Kemal'e 'dur' demek, ırmağa 'akma' demek gibidir."],
    rai: ["Rai o kadar sakin ki dünya yansa 'bir dakika' der.", "Rai'nin 'geliyorum'u, ben kalkanımı cilalayana kadar gerçekleşmez.", "Rai bir kararı üç günde verir, ertesi gün yeniden düşünür.", "Rai uykuyu o kadar ciddiye alır ki resmî bir unvanı olmalı."],
    thoya: ["Thoya'nın bahaneleri kalkanımdan sağlam; her birine saygı duyarım.", "Thoya mesaj atar, cevabı beklemez, sonra cevap gelmedi diye şikâyet eder.", "Thoya'nın 'şimdi bakarım'ı bir mevsim sürer.", "Thoya ortadan kaybolmayı sanata çevirdi. Müzeye koymak lazım."]
  };
  var TAIL = [" Şaka bir yana, hepsini severim; birlikte yürüdüğümüz yoldaşlar bunlar.", " Bunu ona söyleme; sır tutmak kalkanın görevidir.", " Gülmek de bir cesarettir. Dostça, elbette.", ""];
  var JOKES = [
    "Kalkan neden asla kavga etmez? Çünkü hep karşı tarafı savunur... Şaka bu, gülmende sakınca yok.",
    "Kahraman neden manga okurken uyuyakalır? Çünkü en büyük sahne hep bir sonraki bölümde saklıdır.",
    "Bir şövalyeye 'korkuyor musun?' demişler. 'Hayır,' demiş, 'sadece sancağı düzeltiyorum.'",
    "Taha neden saat takmaz? Çünkü kahramanlar geç gelince sahne onları bekler.",
    "Wi-Fi ile Quartex'in ortak yönü? İkisi de lazım olduğunda yok, geldiğinde destan."
  ];
  var FAL = [
    "Bugün bir hikâye seni bekliyor. Kapağını açtığında bir kader başlar.",
    "Yakında eski bir dostundan haber gelecek. Yüreğini açık tut.",
    "Falın diyor ki: bu akşam aşk, yarın savaş. İkisine de hazır ol.",
    "Omuzların yüklü, yüreğin ağır. Bir mola ver; ben nöbet tutarım.",
    "Falda Taha çıktı. Haber: sahnede gürültü var."
  ];

  /* ---------- siteye eklenen özellikler için sözler ---------- */
  P.xnew = [
    ['h', "Karargâhta çok şey değişti! Keşfet'te çark, sınav ve oyunlar var; puanlar toplanıyor, yeni mangalar geldi. Hepsi yolculuğunu zenginleştirsin diye."]
  ];
  P.xwheel = [
    ['h', "Çark sana {n} puan verdi! Kader yüzüne gülüyor."],
    ['s', "{n} puan kazandın! Yarın yine gel, şans cesurları sever."],
    ['n', "{n} puan. Küçük de olsa bir zaferdir; çarkı bırakma."]
  ];
  P.xq1 = [['h', "Sınavda {n}/5! Bilgin keskin, zihnin kalkan kadar sağlam."], ['s', "{n} doğru! Bir kahraman hem kılıcı hem aklı keskin tutar."]];
  P.xq2 = [['n', "Sınavda {n}/5. İyi bir başlangıç; tekrar dene, daha da yükselirsin."], ['h', "{n} doğru, fena değil. Her deneme seni biraz daha güçlendirir."]];
  P.xq3 = [['a', "Sınavda {n}/5. Yenilgi, bir sonraki zaferin ilk sayfasıdır. Tekrar dene."], ['z', "{n} doğru... Bir hikâye oku, dinlen, sonra yeniden meydana çık."]];
  P.xgame = [
    ['h', "{g} için {n} puan! Zarif bir zafer."],
    ['s', "Oyunda iyiydin. Tebrik ederim, kahraman."],
    ['n', "Şansın ve ustalığın yaver gitti. İstersen bir tur daha."]
  ];
  P.xlose = [
    ['s', "XO'da yapay zekâ üstün geldi. Yenilmek utanç değil, öğrenmektir. Ortadaki kareyi unutma."],
    ['a', "Savaşı kaybettin, harbi değil. Tekrar dene."]
  ];
  P.xall = [
    ['h', "TÜM GÖREVLER TAMAM! Bonusu hak ettin. Seninle gurur duyuyorum."],
    ['o', "Hepsini bitirdin! Bir destanın tüm sayfalarını çevirdin. Tebrikler, kahraman."]
  ];
  P.xlib = [
    ['h', "Kütüphanene yeni bir hikâye eklendi. İyi seçim; yolculuk güzel olsun."],
    ['n', "Listene eklendi. Her kitap, yeni bir diyara açılan kapıdır."]
  ];
  P.xstreak = [
    ['h', "{s} gündür kesintisiz geliyorsun! Sadakat böyle bir şeydir."],
    ['s', "{s} günlük seri. Bu istikrar bir kalkan kadar sağlamdır."]
  ];
  P.xtasks = [
    ['a', "{n} görevin daha var; mesela '{t}'. Yarım kalan iş kahramana yakışmaz."],
    ['s', "Bugünkü görevlerden {n} tanesi bekliyor. Hepsini tamamla, bonus senin."],
    ['n', "{n} görev duruyor. Sakin bir kalple tamamlayabilirsin."]
  ];
  P.motiv = [
    ['h', "Bugün zor olabilir ama sen zorluklardan kaçanlardan değilsin. Ben buradayım, yanındayım."],
    ['s', "Küçük adımlar da yola sayılır. Yürümeye devam et, destan senin."],
    ['n', "Moralin bozuksa bir oyun oyna ya da çarkı çevir. Bazen en iyi kılıç küçük bir moladır."],
    ['a', "Düşersen kalk. Kahramanları kahraman yapan, ayağa kalkışlarıdır."]
  ];
  P.feat = {
    rank: [['n', "Sıralamaya baktın. Kaçıncı olduğun önemli değil; yükselmek için yürümek yeter."]],
    wheel: [['s', "Çark mı? Günde bir hak. Şansı çevir, ama ona sırtını yaslama."], ['h', "Çevir bakalım! En çok 50 puan çıkabilir; cesaret ödüllendirilir."]],
    quiz: [['n', "Sınav 5 soru; doğru başına 4 puan. Zihnini sakin tut."], ['a', "Düşünerek cevap ver. Aceleci kılıç hedefi şaşırır."]],
    mem: [['s', "Hafıza oyunu... Dikkat, kahramanın en keskin silahıdır."], ['h', "14 hamlede bitirirsen bonus var. Gözlerini açık tut."]],
    xo: [['a', "XO'da yapay zekâya karşı mı? Cesursun. Köşelerden başla, stratejin olsun."], ['s', "Ortadaki kareyi kap. Bu bir komutanın ilk dersidir."]],
    rx: [['h', "Refleks testi! Yeşil olunca vur; erken davranan düşer."], ['n', "300 ms altı çok iyi. Kılıç gibi keskin bir tepki."]]
  };
  var GAMES = [['wheel', 'Günlük çark'], ['quiz', 'Sınav'], ['mem', 'Hafıza oyunu'], ['xo', 'XO'], ['rx', 'Refleks testi']];

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
      '<input id="agIn" type="text" maxlength="400" autocomplete="off" placeholder="Ardevyl\'e bir şey yaz..." aria-label="Ardevyl\'e mesaj">' +
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
    var t = { on: "Tamam, eskisi gibi sık görüneceğim. Nöbetim hiç bitmez.",
              low: "Az görüneceğim. Gerekirse sohbet düğmesinden çağır.",
              off: "Sessiz nöbete geçtim. Sohbet düğmesi hep burada; çağırman yeter." }[next];
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
  ['Manga öner', 'Yeni ne var?', 'Oyun öner', 'Puanım kaç?', 'Görevlerim', 'Motivasyon ver', 'Şaka yap', 'Fal bak', 'Yazı tura', 'Kim gürültücü?', "Taha'ya takıl", "Quartex'e takıl", "Narancia'ya takıl", "Kemal'e takıl", "Rai'ye takıl", "Thoya'ya takıl"].forEach(function (t) {
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
    var xl = xLocal(t); if (xl) return xl;
    if (/yaz[ıi] ?tura/.test(t)) { y = rnd(2); return { m: 's', t: (y ? 'Yazı' : 'Tura') + ' geldi. ' + (y ? 'Kader senden yana.' : 'Kader seni sınıyor; yılma.') }; }
    if (/\bzar\b/.test(t)) return { m: 'h', t: 'Zar: ' + (1 + rnd(6)) + '. Kaderin attığı adım bu.' };
    if (/\bfal\b/.test(t)) return { m: 'b', t: pick('fal', FAL) };
    if (/şaka|fıkra/.test(t)) return { m: 's', t: pick('jk', JOKES) };
    if (/kim.*(terbiyesiz|saygısız|arsız|gürültücü|gürültülü)|(terbiyesiz|saygısız|gürültücü|gürültülü).*kim/.test(t)) { y = randName(); return { m: 's', t: 'En gürültücü kim diye soruyorsun... Bana kalırsa ' + CASTN[y] + '. ' + roastOf(y) }; }
    if (n && /laf|sal|sok|takıl|dalga|ez\b|yak|rezil|anlat|hakkında|ne diyor/.test(t)) return { m: 's', t: roastOf(n) };
    if (/laf (sok|sal)|takıl|roast/.test(t)) { y = randName(); return { m: 's', t: roastOf(y) }; }
    if (/manga.*(öner|öneri|ver|bul)|(öner|öneri).*manga/.test(t)) {
      m = randomManga();
      if (m) return { m: 'h', t: "'" + m.title + "' seni çağırıyor. Cesaretle aç, yolcu.", btn: { t: 'Hemen aç', f: function () { openManga(m.title); } } };
    }
    return null;
  }

  inp.addEventListener('input', syncSend);
  $('#agForm').addEventListener('submit', function (e) { e.preventDefault(); send(inp.value); });

  /* Sunucuya giden mesaj en fazla MAXMSG karakter olabilir. Kişilik metni kısa tutulur,
     ek bilgiler (sekme, site, puan) yalnızca sığıyorsa eklenir. */
  var PERSONA = "[Sen Ardevyl'sin (Naphiel AI değil): LTF sitesinin kalkan şeklindeki kahraman maskotu. Destanlardaki kahramanlar gibi konuş: onurlu, sakin, cesaret verici, biraz şiirsel; kullanıcıya 'yolcu' ya da 'yoldaş' de. Türkçe, en çok 4 cümle, yardımcı ol. Taha, Quartex, Narancia, Kemal, Rai, Thoya hakkında sadece dostça espri yap, hakaret etme.";
  function buildMsg(text, view) {
    var x = X(), pre = PERSONA, extras = [
      ' Kullanıcı "' + view + '" sekmesinde.',
      ' Sitede: Ana Sayfa (görevler), Manga, Keşfet (çark, sınav, oyunlar, sıralama), Kütüphane, Profil.',
      x ? ' Puanı ' + x.pts + ', serisi ' + x.streak + ' gün.' : ''
    ];
    for (var i = 0; i < extras.length; i++) {
      if ((pre + extras[i] + '] ' + text).length <= MAXMSG) pre += extras[i];
    }
    var out = pre + '] ' + text;
    return out.length > MAXMSG ? text.slice(0, MAXMSG) : out;   // en kötü ihtimalle kişiliksiz gönder
  }

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
      var msg = SERVER_PERSONA ? text : buildMsg(text, view);
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

  /* ---------- puan, görev, oyun ve site olaylarına tepkiler ---------- */
  function X() { return window.__lefx || null; }
  function xLeft() { var x = X(); return x ? x.left() : []; }
  function sayTasks() { var l = xLeft(); if (l.length) sayPool('xtasks', { prio: 1, vars: { n: l.length, t: l[0] }, actions: [{ t: 'Görevlere bak', f: function () { location.hash = 'ana-sayfa'; } }] }); }
  function openF(k) { var x = X(); if (x) x.open(k); else location.hash = 'kesfet'; }
  function xLocal(t) {
    var x = X(), g;
    if (/yeni.*(var|ne)|yenilik|neler eklendi|ne eklendi|neler var/.test(t))
      return { m: 'h', t: "Karargâhta yeni olanlar: Keşfet'te günlük çark, sınav, hafıza, XO ve refleks oyunları. Her giriş puan ve seri kazandırıyor; görevler, sıralama, kütüphane ve 10 yeni manga hazır. Hepsi yolculuğun için.", btn: { t: "Keşfet'e git", f: function () { location.hash = 'kesfet'; } } };
    if (/puan|seri\b|serim/.test(t)) {
      if (!x) return { m: 'n', t: 'Puan sistemi henüz yüklenmedi, biraz sonra tekrar sor.' };
      return { m: x.pts > 100 ? 'h' : 'n', t: 'Puanın ' + x.pts + ', serin ' + x.streak + ' gün. ' + (x.streak >= 3 ? 'İstikrarın takdire değer.' : 'Her gün gelirsen bonus büyür.') };
    }
    if (/görev/.test(t)) {
      var l = xLeft();
      return { m: l.length ? 'a' : 'h', t: l.length ? 'Kalan görevlerin: ' + l.join(', ') + '. Hepsini bitirirsen +20 bonus var!' : 'Bugünkü görevlerin tamam! Aferin, kahraman.', btn: l.length ? { t: 'Görevlere bak', f: function () { location.hash = 'ana-sayfa'; } } : null };
    }
    if (/sıkıl|oyun.*(öner|ne|oyna)|(öner|ne).*oyun|eğlen/.test(t)) {
      g = GAMES[rnd(GAMES.length)];
      return { m: 's', t: "Sıkıldıysan '" + g[1] + "' dene. Meydan okumaya hazır mısın?", btn: { t: 'Aç', f: function () { openF(g[0]); } } };
    }
    if (/çark/.test(t)) return { m: 's', t: 'Günde bir kez çevirebilirsin; 5 ile 50 puan arası kazanırsın. Şansını dene!', btn: { t: 'Çarkı aç', f: function () { openF('wheel'); } } };
    if (/sınav|quiz/.test(t)) return { m: 'n', t: 'Sınavda 5 soru var, doğru başına 4 puan. Hazırsan başla.', btn: { t: 'Sınava gir', f: function () { openF('quiz'); } } };
    if (/sıralama|lider/.test(t)) return { m: 'n', t: 'Sıralamada en çok puan toplayanlar yer alır. Zirveye yürümek istersen yolun açık.', btn: { t: 'Sıralamaya bak', f: function () { openF('rank'); } } };
    if (/motivasyon|moral|üzgün|keyfim yok/.test(t)) return pickM('motiv');
    if (/ne yap(sam|ayım)|bugün ne/.test(t)) {
      var mm = randomManga(); g = GAMES[rnd(GAMES.length)];
      return { m: 'h', t: 'Önce bir hikâye oku' + (mm ? " ('" + mm.title + "')" : '') + ", sonra '" + g[1] + "' oyna, en sonda görevlerine bak. Sıralamada yerin seni bekliyor!" };
    }
    return null;
  }
  function pickM(key) { var l = pick(key, P[key]); return { m: l[0], t: l[1] }; }

  window.addEventListener('lef-x', function (e) {
    var d = e.detail || {}, w = d.why || '';
    if (w === 'Çark') { sayPool('xwheel', { prio: 2, vars: { n: d.n } }); if (d.n >= 25) setTimeout(function () { fx('🎉'); }, 500); else setTimeout(function () { fx('⭐'); }, 500); }
    else if (w === 'Sınav') { sayPool(d.n >= 16 ? 'xq1' : d.n >= 8 ? 'xq2' : 'xq3', { prio: 2, vars: { n: Math.round(d.n / 4) } }); if (d.n >= 16) setTimeout(function () { fx('🎉'); }, 500); }
    else if (w === 'XO' || w === 'Hafıza oyunu' || w === 'Refleks') { sayPool('xgame', { prio: 2, vars: { n: d.n, g: w } }); setTimeout(function () { fx('✨'); }, 500); }
    else if (w === 'XO-kayıp') sayPool('xlose', { prio: 2 });
    else if (w === 'Tüm görevler tamam!') { sayPool('xall', { prio: 3 }); setTimeout(function () { fx('🏆'); }, 500); }
    else if (w === 'Kütüphaneye bir şey ekle') sayPool('xlib', { prio: 2 });
  });

  /* Keşfet'te bir oyunu açınca kısa bir yorum */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#v-kesfet [data-f]');
    if (b && P.feat[b.dataset.f]) say(pick('ft' + b.dataset.f, P.feat[b.dataset.f]), { prio: 2 });
    var c = e.target.closest && e.target.closest('.mg-cover b');
    var cv = c ? c.parentNode : (e.target.closest && e.target.closest('.mg-cover'));
    if (cv && window.MANGALAR) {
      var tt = (cv.querySelector('b') || {}).textContent, o = window.MANGALAR.filter(function (z) { return z.t === tt; })[0];
      if (o) setTimeout(function () { say(['n', "'" + o.t + "'... " + o.ozet.split('. ')[0] + '. İyi okumalar, yolcu.'], { prio: 1 }); }, 1800);
    }
  });

  /* Küçük kutlama efekti: maskotun etrafında emojiler uçuşur */
  var fxCss = document.createElement('style');
  fxCss.textContent = '.ag-fx{position:absolute;left:50%;bottom:34px;font-size:18px;pointer-events:none;opacity:0;animation:agFx 1.2s ease-out forwards}' +
    '@keyframes agFx{0%{opacity:0;transform:translate(0,0) scale(.6)}20%{opacity:1}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.2)}}' +
    '@media (prefers-reduced-motion:reduce){.ag-fx{display:none}}';
  document.head.appendChild(fxCss);
  function fx(ch) {
    if (reduce || root.hidden) return;
    for (var i = 0; i < 7; i++) {
      var sp = document.createElement('span'); sp.className = 'ag-fx'; sp.textContent = ch;
      sp.style.setProperty('--dx', (rnd(110) - 55) + 'px'); sp.style.setProperty('--dy', (-40 - rnd(70)) + 'px'); sp.style.animationDelay = (i * 70) + 'ms';
      root.appendChild(sp); (function (n) { setTimeout(function () { n.remove(); }, 1700); })(sp);
    }
  }

  /* Açılışta: yenilikleri bir kez tanıt, seri kutla */
  setTimeout(function () {
    if (!store('ag_x1')) {
      store('ag_x1', '1');
      sayPool('xnew', { prio: 2, actions: [{ t: "Keşfet'e git", f: function () { location.hash = 'kesfet'; } }, { t: 'Sonra', f: function () {} }] });
      return;
    }
    var x = X(), day = new Date().toISOString().slice(0, 10);
    if (x && [3, 7, 14, 30, 60, 100].indexOf(x.streak) !== -1 && store('ag_streak_day') !== day) {
      store('ag_streak_day', day); sayPool('xstreak', { prio: 2, vars: { s: x.streak } }); setTimeout(function () { fx('🔥'); }, 500);
    }
  }, 4500);

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
      if (v === 'ana-sayfa' && r < .3 && xLeft().length) sayTasks();
      else if (r < .55) sayPool('emptyAmb', { prio: 1 });
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

  /* dışarıdan kullanım: Ardevyl.say(['n','Merhaba!']) */
  window.Ardevyl = {
    say: function (line, o) { return say(line, o || { prio: 2 }); },
    open: openChat,
    close: closeChat,
    newChat: function () { var b = $('.agc-new', chat); if (b) b.click(); },
    recommend: function () { recommend(); }
  };
})();
