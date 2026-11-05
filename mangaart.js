// ---- Manga görselleri v2: kapaklar ve okuyucu sayfaları kodla çizilir (SVG) ----
    // Her karakterin sabit bir görünüşü var (saç, göz, aksesuar); her manga kendi 5-8 karakteriyle çizilir.
    function mk(s){ return function(){ s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
    function hs(t){ var h = 7; for(var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 1000003; return h; }
    function pk(r, a){ return a[(r() * a.length) | 0]; }
    function f1(n){ return Math.round(n * 10) / 10; }
    var uid = 0, INK = '#0d0d0d';
    var SKIN = ['#f5d0b5', '#e8b896', '#d9a37f', '#fbe0cf'];
    // h: saç modeli, hc: saç rengi, e: göz rengi, s: ten, a: aksesuar, cl: kıyafet, t: tonu (d koyu, m orta, l açık)
    var LOOK = {
      'Taha':     { h: 1, hc: '#161616', e: '#c81e1e', s: 0, a: 'scar',     cl: '#2a2f4a', t: 'd' },
      'Kemal':    { h: 0, hc: '#3b2314', e: '#2f6fd0', s: 1, a: 'none',     cl: '#4a2a2a', t: 'd' },
      'Quartex':  { h: 6, hc: '#e8e4da', e: '#7c3aed', s: 0, a: 'earring',  cl: '#1f2937', t: 'l' },
      'Narancia': { h: 5, hc: '#d9791a', e: '#2d8f4e', s: 2, a: 'headband', cl: '#7c2d12', t: 'm' },
      'Nihish':   { h: 2, hc: '#1e1b4b', e: '#0ea5e9', s: 3, a: 'none',     cl: '#312e81', t: 'd' },
      'Thousand': { h: 1, hc: '#eab308', e: '#b45309', s: 1, a: 'scar',     cl: '#44403c', t: 'm' },
      'Rai':      { h: 0, hc: '#0f172a', e: '#facc15', s: 0, a: 'glasses',  cl: '#134e4a', t: 'd' },
      'Mehmet':   { h: 6, hc: '#4a2c17', e: '#78350f', s: 2, a: 'none',     cl: '#3f3f46', t: 'd' },
      'Berru':    { h: 3, hc: '#be185d', e: '#ec4899', s: 3, a: 'ribbon',   cl: '#831843', t: 'm' },
      'Yusuf':    { h: 5, hc: '#1c1917', e: '#16a34a', s: 1, a: 'glasses',  cl: '#14532d', t: 'd' },
      'Yiğit':    { h: 1, hc: '#b91c1c', e: '#f97316', s: 0, a: 'headband', cl: '#7f1d1d', t: 'm' },
      'Tamer':    { h: 6, hc: '#6b7280', e: '#0891b2', s: 2, a: 'scar',     cl: '#374151', t: 'm' },
      'Rawen':    { h: 2, hc: '#0c0a09', e: '#a21caf', s: 0, a: 'none',     cl: '#3b0764', t: 'd' },
      'Ekeo':     { h: 0, hc: '#f5f5f4', e: '#38bdf8', s: 3, a: 'earring',  cl: '#1e3a8a', t: 'l' },
      'Vanilya':  { h: 4, hc: '#fde68a', e: '#f472b6', s: 3, a: 'ribbon',   cl: '#9d174d', t: 'l' },
      'Samet':    { h: 5, hc: '#292524', e: '#dc2626', s: 1, a: 'none',     cl: '#292524', t: 'd' },
      'Ekin':     { h: 4, hc: '#7f1d1d', e: '#22c55e', s: 2, a: 'glasses',  cl: '#065f46', t: 'm' }
    };
    function castFor(title){            // okuyucudaki karakter listesiyle birebir aynı seçim
      var seed = 0; for(var q = 0; q < title.length; q++) seed = (seed * 31 + title.charCodeAt(q)) % 9973;
      function rnd(){ seed = (seed * 48271 + 11) % 2147483647; return seed; }
      var cast = CAST.slice();
      for(var x0 = cast.length - 1; x0 > 0; x0--){ var j0 = rnd() % (x0 + 1), t0 = cast[x0]; cast[x0] = cast[j0]; cast[j0] = t0; }
      return cast.slice(0, 5 + rnd() % 4).map(function(n){ return LOOK[n] || LOOK.Taha; });
    }

    // ---------- karakter ----------
    var HF = [
      'M-21 3Q-25 -31 0 -30Q25 -31 21 3Q19 -9 9 -14Q3 -3 -9 -12Q-17 -9 -21 3Z',
      'M-21 2L-27 -16L-15 -13L-15 -31L-5 -18L1 -38L8 -19L17 -33L17 -14L28 -17L21 2Q12 -13 0 -11Q-12 -13 -21 2Z',
      'M-22 10Q-27 -31 0 -30Q27 -31 22 10Q21 -7 11 -14Q1 -4 -9 -14Q-18 -8 -22 10Z',
      'M-22 2Q-25 -31 0 -30Q25 -31 22 2L22 -7Q11 -11 0 -9Q-11 -11 -22 -7Z',
      'M-21 3Q-24 -31 0 -30Q24 -31 21 3Q18 -10 6 -15Q-4 -6 -12 -13Q-18 -8 -21 3Z',
      'M-21 3Q-27 -12 -19 -22Q-16 -34 -6 -28Q0 -38 8 -29Q20 -33 19 -20Q27 -10 21 3Q15 -8 8 -11L3 -3L-3 -12L-10 -4L-13 -12Q-18 -9 -21 3Z',
      'M-20 0Q-23 -28 0 -29Q23 -28 20 0Q16 -15 0 -17Q-16 -15 -20 0Z'
    ];
    function chara(c, x, y, sc, o){
      o = o || {};
      var mono = !!o.mono, sil = !!o.sil, dir = o.dir || 0, ex = o.ex || 'n', k = o.k || 'ask', fl = o.flip ? -1 : 1;
      var sk = sil ? '#0a0a0a' : mono ? '#fdfdfd' : SKIN[c.s];
      var hc = sil ? '#0a0a0a' : mono ? { d: '#171717', m: '#858585', l: '#fbfbfb' }[c.t] : c.hc;
      var ec = mono ? '#262626' : c.e;
      var cl = sil ? '#0a0a0a' : (o.cl || (mono ? (k === 'intikam' ? '#161616' : k === 'savas' ? '#4a4a4a' : '#2b2b2b') : c.cl));
      var ac = mono ? '#2a2a2a' : (k === 'ask' ? '#ec4899' : k === 'intikam' ? '#b91c1c' : '#d97706');
      var sh = mono ? '#bdbdbd' : '#000', shO = mono ? 1 : .13;
      var g = '<g transform="translate(' + f1(x) + ',' + f1(y) + ') scale(' + (+(sc * fl).toFixed(3)) + ',' + (+sc.toFixed(3)) + ')" stroke="' + INK + '" stroke-width="' + (o.sw || 1.5) + '" stroke-linejoin="round" stroke-linecap="round">';
      // arka saç
      if(c.h === 2) g += '<path d="M-25 -6Q-33 40 -28 84L28 84Q33 40 25 -6Z" fill="' + hc + '"/>';
      if(c.h === 3) g += '<path d="M-25 -6Q-30 22 -23 34L23 34Q30 22 25 -6Z" fill="' + hc + '"/>';
      if(c.h === 4) g += '<path d="M12 -22Q46 -28 41 16Q38 42 26 54Q33 24 18 -4Z" fill="' + hc + '"/>';
      // gövde
      g += '<path d="M-40 112Q-38 40 -10 31L10 31Q38 40 40 112Z" fill="' + cl + '"/>';
      if(!sil){
        if(k === 'ask') g += '<path d="M-10 31L0 47L10 31Z" fill="#fff"/><path d="M-6 44L0 41L6 44L3 51L-3 51Z" fill="' + ac + '"/>';
        else if(k === 'intikam') g += '<path d="M-13 29L-17 46L0 54L17 46L13 29L0 38Z" fill="' + (mono ? '#3a3a3a' : '#0b0b10') + '"/><path d="M-4 40L0 58L4 40Z" fill="#f3f3f3"/>';
        else g += '<path d="M-30 40L30 104" stroke="' + (mono ? '#e5e5e5' : '#b45309') + '" stroke-width="6"/><circle cx="-24" cy="62" r="4" fill="' + (mono ? '#fff' : '#fbbf24') + '"/><path d="M-36 40L-18 34L-12 42" fill="' + (mono ? '#777' : '#57534e') + '"/>';
      }
      g += '<path d="M-6 17L-6 32Q0 37 6 32L6 17Z" fill="' + sk + '"/><path d="M-6 25Q0 31 6 25L6 32Q0 37 -6 32Z" fill="' + sh + '" opacity="' + shO + '" stroke="none"/>';
      // yan saç (uzun/bob)
      if(c.h === 2) g += '<path d="M-22 10Q-29 40 -22 64L-13 59Q-17 34 -15 10Z" fill="' + hc + '"/><path d="M22 10Q29 40 22 64L13 59Q17 34 15 10Z" fill="' + hc + '"/>';
      if(c.h === 3) g += '<path d="M-22 2Q-28 20 -22 32L-14 30L-15 2Z" fill="' + hc + '"/><path d="M22 2Q28 20 22 32L14 30L15 2Z" fill="' + hc + '"/>';
      // kulak + kafa
      g += '<ellipse cx="-19" cy="3" rx="3" ry="5" fill="' + sk + '"/><ellipse cx="19" cy="3" rx="3" ry="5" fill="' + sk + '"/>';
      g += '<path d="M-18 -4Q-19 14 -9 21Q0 26 9 21Q19 14 18 -4Q18 -22 0 -22Q-18 -22 -18 -4Z" fill="' + sk + '"/>';
      if(!sil){
        // yüz
        var e1 = -8 + dir * 2.5, e2 = 8 + dir * 2.5, d = dir * .8;
        function eye(cx){
          var L = cx < 0, t = '';
          if(ex === 'h'){
            return '<path d="M' + (cx - 6) + ' 5Q' + cx + ' -2 ' + (cx + 6) + ' 5" fill="none" stroke-width="2.2"/>';
          }
          var ry = ex === 'o' ? 6.4 : 5.8, ir = ex === 'o' ? 2.6 : 3.9;
          t += '<ellipse cx="' + cx + '" cy="3" rx="5.2" ry="' + ry + '" fill="#fff" stroke-width="1"/>';
          t += '<ellipse cx="' + f1(cx + d) + '" cy="3.4" rx="' + ir + '" ry="' + (ex === 'o' ? 4 : 5) + '" fill="' + ec + '" stroke="none"/>';
          t += '<ellipse cx="' + f1(cx + d) + '" cy="3.8" rx="' + (ex === 'o' ? 1.3 : 2) + '" ry="' + (ex === 'o' ? 2 : 3) + '" fill="#050505" stroke="none"/>';
          t += '<circle cx="' + f1(cx + d - 1.3) + '" cy="1.6" r="1.4" fill="#fff" stroke="none"/><circle cx="' + f1(cx + d + 1.3) + '" cy="5.4" r=".7" fill="#fff" stroke="none"/>';
          if(ex === 'a' || ex === 's'){
            t += L ? '<path d="M' + (cx - 7) + ' -4L' + (cx + 7) + ' -4L' + (cx + 7) + ' 3.2L' + (cx - 7) + ' -1.6Z" fill="' + sk + '" stroke="none"/><path d="M' + (cx - 6) + ' -1.2L' + (cx + 5.5) + ' 2.8" stroke-width="2.2" fill="none"/>'
                    : '<path d="M' + (cx - 7) + ' -4L' + (cx + 7) + ' -4L' + (cx + 7) + ' -1.6L' + (cx - 7) + ' 3.2Z" fill="' + sk + '" stroke="none"/><path d="M' + (cx - 5.5) + ' 2.8L' + (cx + 6) + ' -1.2" stroke-width="2.2" fill="none"/>';
          } else {
            t += '<path d="M' + (cx - 6) + ' 1Q' + cx + ' -4.5 ' + (cx + 6) + ' 1" stroke-width="2.2" fill="none"/>';
            t += '<path d="M' + (cx + (L ? -6 : 6)) + ' 1l' + (L ? -2.4 : 2.4) + ' -1.4" stroke-width="1.4" fill="none"/>';
          }
          return t;
        }
        function brow(cx){
          var L = cx < 0, p;
          if(ex === 'a') p = L ? 'M' + (cx - 6) + ' -9L' + (cx + 6) + ' -4' : 'M' + (cx - 6) + ' -4L' + (cx + 6) + ' -9';
          else if(ex === 'c') p = L ? 'M' + (cx - 6) + ' -4L' + (cx + 6) + ' -8' : 'M' + (cx - 6) + ' -8L' + (cx + 6) + ' -4';
          else if(ex === 'o') p = 'M' + (cx - 5) + ' -10Q' + cx + ' -13 ' + (cx + 5) + ' -10';
          else if(ex === 's' && L) p = 'M' + (cx - 6) + ' -9Q' + cx + ' -12 ' + (cx + 6) + ' -8';
          else if(ex === 'h') p = 'M' + (cx - 6) + ' -7Q' + cx + ' -10 ' + (cx + 6) + ' -7';
          else p = 'M' + (cx - 6) + ' -6.5Q' + cx + ' -8.5 ' + (cx + 6) + ' -6.5';
          return '<path d="' + p + '" fill="none" stroke-width="1.8"/>';
        }
        g += eye(e1) + eye(e2) + brow(e1) + brow(e2);
        g += '<path d="M' + (1 + dir * 2) + ' 9l-1.2 2.6l2.2 .2" fill="none" stroke-width=".9"/>';
        var mo;
        if(ex === 'h') mo = '<path d="M-6 12.5Q0 22 6 12.5Z" fill="#7f1d1d" stroke-width="1.2"/><ellipse cx="0" cy="17.4" rx="2.6" ry="1.5" fill="#fb7185" stroke="none"/>';
        else if(ex === 'a') mo = '<path d="M-6 13.5L6 13.5L5 18.5L-5 18.5Z" fill="#fff" stroke-width="1.2"/><path d="M-2 13.5V18.5M2 13.5V18.5" stroke-width=".8"/>';
        else if(ex === 'c') mo = '<path d="M-4 17.5Q-2 12.5 0 15.5Q2 12.5 4 17.5" fill="none" stroke-width="1.3"/>';
        else if(ex === 'o') mo = '<ellipse cx="0" cy="15.5" rx="2.4" ry="3.3" fill="#4c0519" stroke-width="1.1"/>';
        else if(ex === 's') mo = '<path d="M-4 15Q2 18 6 12.5" fill="none" stroke-width="1.4"/>';
        else mo = '<path d="M-3.5 14.5Q0 16 3.5 14.5" fill="none" stroke-width="1.3"/>';
        g += mo;
        if(ex === 'c') g += '<path d="M' + (e1 - 2) + ' 9Q' + (e1 - 5) + ' 16 ' + (e1 - 2) + ' 19Q' + e1 + ' 16 ' + (e1 - 2) + ' 9Z" fill="' + (mono ? '#fff' : '#93c5fd') + '" stroke-width=".8"/><path d="M' + (e2 + 2) + ' 9Q' + (e2 + 5) + ' 16 ' + (e2 + 2) + ' 19Q' + e2 + ' 16 ' + (e2 + 2) + ' 9Z" fill="' + (mono ? '#fff' : '#93c5fd') + '" stroke-width=".8"/>';
        if(ex === 'o') g += '<path d="M17 -4Q22 4 17 8Q12 4 17 -4Z" fill="' + (mono ? '#fff' : '#93c5fd') + '" stroke-width=".9"/>';
        if(k === 'ask' || ex === 'h'){
          if(mono) g += '<path d="M-15 9l3 -2M-13 11.5l3 -2M-11 14l3 -2M9 7l3 2M11 9.5l3 2M13 12l3 2" fill="none" stroke-width=".7"/>';
          else g += '<ellipse cx="' + (-12 + dir * 2) + '" cy="11" rx="4.2" ry="2.5" fill="#fb7185" opacity=".7" stroke="none"/><ellipse cx="' + (12 + dir * 2) + '" cy="11" rx="4.2" ry="2.5" fill="#fb7185" opacity=".7" stroke="none"/>';
        }
        // saç gölgesi alnın üstünde
        g += '<path d="M-18 -6Q0 -1 18 -6L18 0Q0 5 -18 0Z" fill="' + sh + '" opacity="' + (mono ? .7 : .1) + '" stroke="none"/>';
      } else {
        g += '<path d="M-13 3L-4 5.4M4 5.4L13 3" stroke="#fff" stroke-width="2.6" fill="none"/>';
      }
      // ön saç
      g += '<path d="' + HF[c.h] + '" fill="' + hc + '"/>';
      if(!sil) g += '<path d="M-12 -23Q-3 -28 8 -25" fill="none" stroke="#fff" stroke-width="2" opacity="' + (mono ? 0 : .38) + '"/>';
      if(!sil && c.t === 'l' && mono) g += '<path d="M-14 -20Q-8 -16 -10 -8M0 -24Q3 -17 0 -11M12 -20Q9 -15 11 -9" fill="none" stroke-width=".8"/>';
      // aksesuar
      if(!sil){
        if(c.a === 'glasses') g += '<rect x="-14.5" y="-3" width="13" height="11.5" rx="4" fill="#fff" fill-opacity=".14" stroke-width="1.3"/><rect x="1.5" y="-3" width="13" height="11.5" rx="4" fill="#fff" fill-opacity=".14" stroke-width="1.3"/><path d="M-1.5 2H1.5" stroke-width="1.2"/>';
        if(c.a === 'scar') g += '<path d="M9 -3L15 13M8 3l4 -1.5M10.5 8l4 -1.5" fill="none" stroke="' + (mono ? INK : '#9b1c1c') + '" stroke-width="1.3"/>';
        if(c.a === 'headband') g += '<path d="M-21 -10Q0 -17 21 -10L21 -4.5Q0 -11 -21 -4.5Z" fill="' + ac + '"/><path d="M20 -8L30 -4L24 -1L31 6" fill="none" stroke="' + ac + '" stroke-width="3"/>';
        if(c.a === 'earring') g += '<circle cx="-19.5" cy="10" r="2" fill="' + (mono ? '#fff' : '#fbbf24') + '" stroke-width="1"/>';
        if(c.a === 'ribbon') g += '<path d="M14 -24L26 -31L25 -17Z M14 -24L4 -32L5 -18Z" fill="' + ac + '"/><circle cx="14" cy="-24" r="3" fill="' + ac + '"/>';
        if(k === 'savas' && c.a !== 'headband') g += '<path d="M-20 -8Q0 -14 20 -8L20 -3.5Q0 -9 -20 -3.5Z" fill="' + (mono ? '#333' : '#dc2626') + '"/>';
      }
      return g + '</g>';
    }
    var EXP = { ask: ['n', 'h', 'n', 'c', 'o', 'h'], intikam: ['a', 's', 'n', 'a', 'c', 'o'], savas: ['a', 's', 'h', 'a', 'n', 'o'] };
    var BUB = {
      ask: ['Seni bekledim...', 'Neden susuyorsun?', 'Yanlış anlama!', 'Bu kalp...', 'Gitme.', 'Hâlâ hatırlıyor musun?', 'Sadece sen.', 'Yağmur dinsin...', 'Ben de seni.', 'Söz ver.'],
      intikam: ['Unutmadım.', 'Hesap günü.', 'Sen miydin?!', 'Bitti.', 'Geç kaldın.', 'Bedelini ödeyeceksin.', 'Her şeyi biliyorum.', 'Yüzüme bak!', 'Bu daha başlangıç.', 'Kimse kaçamaz.'],
      savas: ['İlerleyin!', 'Geri yok!', 'Siperlere!', 'Sancak düşmez!', 'Şafak yakın.', 'Ateş!', 'Birliğim, bana!', 'Mevzi tutulacak!', 'Son nefese dek.', 'Hazır olun!']
    };
    var SFX = { ask: ['TIK TIK', 'DOKUN', '...!', 'PIT PIT'], intikam: ['ŞAK!', 'KRAK!', 'BUM!', 'VIZ!'], savas: ['BOOM!', 'GÜM!', 'ŞİNG!', 'TAT TAT'] };
    var CAP = {
      ask: ['Aynı yağmur, aynı sokak...', 'Ve o an geldi.', 'Üç yıl sonra...', 'Sessizlik.'],
      intikam: ['Hesap günü yaklaşıyordu.', 'O gece her şey değişti.', 'Geri sayım başlamıştı.', 'Unutmak mümkün değildi.'],
      savas: ['Şafağa üç saat vardı.', 'Cephe hattı, 04:00.', 'Sancak hâlâ dimdik.', 'Hiçbir plan ilk temasa dayanmaz.']
    };

    // ---------- arka planlar ----------
    function mkP(k, mono, c1, c2){
      var moon = { ask: '#fff7e0', intikam: '#dc2626', savas: '#fde68a' }[k];
      if(mono) return { a: '#f6f6f6', b: '#c4c4c4', na: '#3b3b3b', nb: '#0f0f0f', acc: '#fff', hi: '#fff', moon: '#f2f2f2', sil: '#0d0d0d', lit: '#fff', fire: '#fff', mono: true };
      return { a: c1, b: c2, na: c1, nb: c2, acc: { ask: '#ffb3c7', intikam: '#ef4444', savas: '#fbbf24' }[k], hi: '#fff', moon: moon, sil: '#08050f', lit: '#fde68a', fire: '#f97316', mono: false };
    }
    function stars(r, n, w, h, c){ var s = ''; for(var i = 0; i < n; i++) s += '<circle cx="' + f1(r() * w) + '" cy="' + f1(r() * h) + '" r="' + f1(.5 + r() * 1.2) + '" fill="' + c + '" opacity=".8"/>'; return s; }
    function petals(r, n, w, h, c, o){ var s = ''; for(var i = 0; i < n; i++){ var x = f1(r() * w), y = f1(r() * h); s += '<ellipse cx="' + x + '" cy="' + y + '" rx="' + f1(w * .016 + 1.5) + '" ry="' + f1(w * .008 + .8) + '" fill="' + c + '" opacity="' + (o || .85) + '" transform="rotate(' + ((r() * 180) | 0) + ' ' + x + ' ' + y + ')"/>'; } return s; }
    function rain(r, n, w, h, c, o){ var d = ''; for(var i = 0; i < n; i++){ var x = r() * w, y = r() * h; d += 'M' + f1(x) + ' ' + f1(y) + 'l-3 9'; } return '<path d="' + d + '" stroke="' + c + '" stroke-width=".8" opacity="' + (o || .5) + '" fill="none"/>'; }
    function branch(r, x, y, len, ang, d){ var x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len, s = 'M' + f1(x) + ' ' + f1(y) + 'L' + f1(x2) + ' ' + f1(y2); if(d > 0) s += branch(r, x2, y2, len * .72, ang - .45 - r() * .3, d - 1) + branch(r, x2, y2, len * .72, ang + .45 + r() * .3, d - 1); return s; }
    function skyline(r, w, h, base, c, win){
      var s = '', x = -4;
      while(x < w){
        var bw = 8 + r() * 16, bh = h * .1 + r() * h * .28;
        s += '<rect x="' + f1(x) + '" y="' + f1(base - bh) + '" width="' + f1(bw) + '" height="' + f1(bh + h) + '" fill="' + c + '"/>';
        if(win) for(var wy = base - bh + 4; wy < base - 4; wy += 7) for(var wx = x + 2; wx < x + bw - 3; wx += 5) if(r() < .3) s += '<rect x="' + f1(wx) + '" y="' + f1(wy) + '" width="2" height="3" fill="' + win + '"/>';
        x += bw + r() * 3;
      }
      return s;
    }
    function soldier(x, y, sc, c){ return '<g transform="translate(' + f1(x) + ',' + f1(y) + ') scale(' + sc + ')" fill="' + c + '" stroke="' + c + '"><circle cy="-14" r="4"/><path d="M-5 -9L5 -9L6 6L-6 6Z"/><path d="M-3 6V17M3 6V17" stroke-width="3.2"/><path d="M5 -6L15 -17" stroke-width="1.8"/></g>'; }
    function flag(x, y, s, c){ return '<path d="M' + f1(x) + ' ' + f1(y) + 'V' + f1(y - s * 2.4) + '" stroke="' + c + '" stroke-width="1.8"/><path d="M' + f1(x) + ' ' + f1(y - s * 2.4) + 'L' + f1(x + s * 1.3) + ' ' + f1(y - s * 2.1) + 'L' + f1(x + s * .8) + ' ' + f1(y - s * 1.7) + 'L' + f1(x + s * 1.3) + ' ' + f1(y - s * 1.3) + 'L' + f1(x) + ' ' + f1(y - s * 1.4) + 'Z" fill="' + c + '"/>'; }
    function crow(x, y, s, c){ return '<path d="M' + f1(x) + ' ' + f1(y) + 'q' + 3 * s + ' ' + -4 * s + ' ' + 6 * s + ' 0q' + 3 * s + ' ' + -4 * s + ' ' + 6 * s + ' 0" stroke="' + c + '" stroke-width="1.6" fill="none"/>'; }
    function BG(k, v, w, h, r, P){
      var id = 'q' + (uid++), S = P.sil, hz = h * .76, mn = Math.min(w, h), i, s = '';
      var night = { ask: [1, 1, 0, 0, 1], intikam: [1, 1, 1, 1, 1], savas: [0, 0, 1, 0, 1] }[k][v];
      s += '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + (night ? P.na : P.a) + '"/><stop offset="1" stop-color="' + (night ? P.nb : P.b) + '"/></linearGradient></defs><rect width="' + w + '" height="' + h + '" fill="url(#' + id + ')"/>';
      var mx = w * (.3 + r() * .4);
      if(k === 'ask'){
        if(v === 0){
          s += stars(r, 18, w, h * .6, P.hi) + '<circle cx="' + f1(mx) + '" cy="' + f1(h * .28) + '" r="' + f1(mn * .3) + '" fill="' + P.hi + '" opacity=".12"/><circle cx="' + f1(mx) + '" cy="' + f1(h * .28) + '" r="' + f1(mn * .2) + '" fill="' + P.moon + '" opacity=".95"/>';
          s += '<path d="' + branch(r, w, 0, h * .3, 2.35, 4) + '" stroke="' + S + '" stroke-width="' + f1(w * .012 + 1) + '" fill="none" stroke-linecap="round"/>' + petals(r, 16, w, h, P.acc);
          s += '<path d="M0 ' + f1(hz) + 'Q' + f1(w * .3) + ' ' + f1(hz - h * .06) + ' ' + f1(w * .6) + ' ' + f1(hz) + 'T' + w + ' ' + f1(hz - h * .02) + 'V' + h + 'H0Z" fill="' + S + '"/>';
        } else if(v === 1){
          s += skyline(r, w, h, hz, S, P.lit);
          for(i = 0; i < 9; i++) s += '<circle cx="' + f1(r() * w) + '" cy="' + f1(h * .4 + r() * h * .3) + '" r="' + f1(3 + r() * 8) + '" fill="' + P.lit + '" opacity=".28"/>';
          s += '<rect y="' + f1(hz) + '" width="' + w + '" height="' + f1(h - hz) + '" fill="' + S + '"/>' + rain(r, Math.round(w / 3.5), w, h, P.hi, .5);
          for(i = 0; i < 4; i++) s += '<rect x="' + f1(r() * w) + '" y="' + f1(hz + 2) + '" width="' + f1(2 + r() * 3) + '" height="' + f1(h * .16) + '" fill="' + P.lit + '" opacity=".25"/>';
        } else if(v === 2){
          s += '<circle cx="' + f1(w * .66) + '" cy="' + f1(hz - h * .05) + '" r="' + f1(mn * .26) + '" fill="' + P.moon + '" opacity=".95"/>';
          for(i = 0; i < 3; i++) s += '<ellipse cx="' + f1(r() * w) + '" cy="' + f1(h * (.15 + i * .14)) + '" rx="' + f1(w * .16) + '" ry="' + f1(h * .025) + '" fill="' + P.hi + '" opacity=".35"/>';
          s += crow(w * .2, h * .22, w / 90, S) + crow(w * .3, h * .3, w / 120, S);
          s += '<rect y="' + f1(hz + h * .06) + '" width="' + w + '" height="' + h + '" fill="' + S + '"/>';
          var fd = ''; for(i = 0; i < 14; i++) fd += 'M' + f1(i * w / 12) + ' ' + f1(h * .62) + 'V' + f1(hz + h * .06);
          s += '<path d="' + fd + 'M0 ' + f1(h * .62) + 'H' + w + 'M0 ' + f1(h * .69) + 'H' + w + '" stroke="' + S + '" stroke-width="1.5" fill="none"/>';
        } else if(v === 3){
          s += '<circle cx="' + f1(w * .78) + '" cy="' + f1(h * .2) + '" r="' + f1(mn * .4) + '" fill="' + P.hi + '" opacity=".25"/><circle cx="' + f1(w * .78) + '" cy="' + f1(h * .2) + '" r="' + f1(mn * .17) + '" fill="' + P.moon + '"/>';
          s += '<path d="M0 ' + f1(hz - h * .06) + 'Q' + f1(w * .4) + ' ' + f1(hz - h * .2) + ' ' + w + ' ' + f1(hz - h * .04) + 'V' + h + 'H0Z" fill="' + S + '" opacity=".55"/><path d="M0 ' + f1(hz) + 'Q' + f1(w * .6) + ' ' + f1(hz - h * .1) + ' ' + w + ' ' + f1(hz + h * .02) + 'V' + h + 'H0Z" fill="' + S + '"/>';
          for(i = 0; i < w / 5; i++){ var fx = r() * w, fy = hz + r() * (h - hz); s += '<path d="M' + f1(fx) + ' ' + f1(fy) + 'v5" stroke="' + P.hi + '" stroke-width=".7" opacity=".5"/><circle cx="' + f1(fx) + '" cy="' + f1(fy) + '" r="' + f1(1.2 + r() * 1.3) + '" fill="' + (r() < .5 ? P.acc : P.hi) + '"/>'; }
        } else {
          var lx = w * .72;
          s += '<polygon points="' + f1(lx) + ',' + f1(h * .25) + ' ' + f1(lx - w * .3) + ',' + f1(hz) + ' ' + f1(lx + w * .3) + ',' + f1(hz) + '" fill="' + P.hi + '" opacity=".2"/><rect x="' + f1(lx - 1.5) + '" y="' + f1(h * .24) + '" width="3" height="' + f1(hz - h * .24) + '" fill="' + S + '"/><circle cx="' + f1(lx) + '" cy="' + f1(h * .24) + '" r="4" fill="' + P.lit + '"/>';
          for(i = 0; i < w / 3; i++) s += '<circle cx="' + f1(r() * w) + '" cy="' + f1(r() * h) + '" r="' + f1(.6 + r() * 1.2) + '" fill="' + P.hi + '" opacity=".85"/>';
          s += '<path d="' + branch(r, w * .1, hz, h * .22, -1.6, 4) + '" stroke="' + S + '" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M0 ' + f1(hz) + 'Q' + f1(w * .5) + ' ' + f1(hz - h * .04) + ' ' + w + ' ' + f1(hz) + 'V' + h + 'H0Z" fill="' + S + '"/>';
        }
      } else if(k === 'intikam'){
        if(v === 0){
          s += '<circle cx="' + f1(w * .5) + '" cy="' + f1(h * .34) + '" r="' + f1(mn * .38) + '" fill="' + P.moon + '" opacity=".25"/><circle cx="' + f1(w * .5) + '" cy="' + f1(h * .34) + '" r="' + f1(mn * .27) + '" fill="' + P.moon + '"/>';
          s += '<path d="' + branch(r, w * .1, hz, h * .28, -1.9, 4) + branch(r, w * .9, hz, h * .26, -1.25, 4) + '" stroke="' + S + '" stroke-width="' + f1(w * .014 + 1) + '" fill="none" stroke-linecap="round"/>';
          for(i = 0; i < 5; i++) s += crow(r() * w, h * (.1 + r() * .3), w / 100, S);
          s += '<path d="M0 ' + f1(hz) + 'Q' + f1(w * .5) + ' ' + f1(hz - h * .05) + ' ' + w + ' ' + f1(hz) + 'V' + h + 'H0Z" fill="' + S + '"/>';
          for(i = 0; i < 4; i++){ var gx = w * (.2 + i * .2), gy = hz + h * .06; s += '<path d="M' + f1(gx) + ' ' + f1(gy) + 'v' + f1(-h * .1) + 'M' + f1(gx - 4) + ' ' + f1(gy - h * .075) + 'h8" stroke="' + P.hi + '" stroke-width="1.6" opacity=".6"/>'; }
        } else if(v === 1){
          var rg = 'q' + (uid++);
          s += '<defs><radialGradient id="' + rg + '" cx=".5" cy="1" r=".85"><stop offset="0" stop-color="' + P.fire + '" stop-opacity=".95"/><stop offset="1" stop-color="' + P.fire + '" stop-opacity="0"/></radialGradient></defs><rect width="' + w + '" height="' + h + '" fill="url(#' + rg + ')"/>';
          s += skyline(r, w, h, hz + h * .08, S, P.lit);
          for(i = 0; i < 4; i++) s += '<ellipse cx="' + f1(r() * w) + '" cy="' + f1(h * (.15 + r() * .35)) + '" rx="' + f1(w * .14) + '" ry="' + f1(h * .05) + '" fill="' + S + '" opacity=".5"/>';
          for(i = 0; i < 24; i++) s += '<circle cx="' + f1(r() * w) + '" cy="' + f1(r() * h * .8) + '" r="' + f1(.6 + r()) + '" fill="' + P.fire + '"/>';
        } else if(v === 2){
          var cx = w / 2, cy = h * .45;
          s += '<polygon points="0,0 ' + f1(cx - w * .12) + ',' + f1(cy - h * .1) + ' ' + f1(cx - w * .12) + ',' + f1(cy + h * .12) + ' 0,' + h + '" fill="' + S + '" opacity=".92"/><polygon points="' + w + ',0 ' + f1(cx + w * .12) + ',' + f1(cy - h * .1) + ' ' + f1(cx + w * .12) + ',' + f1(cy + h * .12) + ' ' + w + ',' + h + '" fill="' + S + '" opacity=".92"/>';
          s += '<polygon points="0,' + h + ' ' + f1(cx - w * .12) + ',' + f1(cy + h * .12) + ' ' + f1(cx + w * .12) + ',' + f1(cy + h * .12) + ' ' + w + ',' + h + '" fill="' + S + '" opacity=".75"/>';
          for(i = 0; i < 4; i++) s += '<rect x="' + f1(w * (.04 + i * .035)) + '" y="' + f1(h * (.2 + i * .03)) + '" width="2.5" height="' + f1(h * (.3 - i * .04)) + '" fill="' + P.acc + '" opacity=".9"/><rect x="' + f1(w * (.94 - i * .035)) + '" y="' + f1(h * (.2 + i * .03)) + '" width="2.5" height="' + f1(h * (.3 - i * .04)) + '" fill="' + P.acc + '" opacity=".9"/>';
          s += rain(r, Math.round(w / 3), w, h, P.hi, .55) + '<ellipse cx="' + f1(cx) + '" cy="' + f1(h * .9) + '" rx="' + f1(w * .35) + '" ry="' + f1(h * .035) + '" fill="' + P.acc + '" opacity=".35"/>';
        } else if(v === 3){
          for(i = 0; i < 4; i++) s += '<ellipse cx="' + f1(r() * w) + '" cy="' + f1(h * (.1 + r() * .3)) + '" rx="' + f1(w * .22) + '" ry="' + f1(h * .06) + '" fill="' + S + '" opacity=".55"/>';
          var bx = w * (.3 + r() * .4);
          s += '<polyline points="' + f1(bx) + ',0 ' + f1(bx - 8) + ',' + f1(h * .2) + ' ' + f1(bx + 4) + ',' + f1(h * .24) + ' ' + f1(bx - 10) + ',' + f1(h * .5) + '" stroke="' + P.hi + '" stroke-width="2.2" fill="none"/>';
          var cw = w * .6, c0 = w * .2;
          s += '<rect x="' + f1(c0) + '" y="' + f1(hz - h * .2) + '" width="' + f1(cw) + '" height="' + f1(h * .3) + '" fill="' + S + '"/>';
          for(i = 0; i < 6; i++) s += '<rect x="' + f1(c0 + i * cw / 6 + 1) + '" y="' + f1(hz - h * .24) + '" width="' + f1(cw / 12) + '" height="' + f1(h * .05) + '" fill="' + S + '"/>';
          s += '<polygon points="' + f1(c0 - 4) + ',' + f1(hz - h * .1) + ' ' + f1(c0 + cw * .1) + ',' + f1(hz - h * .46) + ' ' + f1(c0 + cw * .16) + ',' + f1(hz - h * .38) + ' ' + f1(c0 + cw * .24) + ',' + f1(hz - h * .5) + ' ' + f1(c0 + cw * .3) + ',' + f1(hz - h * .1) + '" fill="' + S + '"/><rect x="' + f1(c0 + cw * .72) + '" y="' + f1(hz - h * .42) + '" width="' + f1(cw * .2) + '" height="' + f1(h * .34) + '" fill="' + S + '"/><polygon points="' + f1(c0 + cw * .7) + ',' + f1(hz - h * .42) + ' ' + f1(c0 + cw * .82) + ',' + f1(hz - h * .54) + ' ' + f1(c0 + cw * .94) + ',' + f1(hz - h * .42) + '" fill="' + S + '"/>';
          s += '<path d="M0 ' + f1(hz) + 'Q' + f1(w * .5) + ' ' + f1(hz - h * .06) + ' ' + w + ' ' + f1(hz) + 'V' + h + 'H0Z" fill="' + S + '"/>' + rain(r, Math.round(w / 5), w, h, P.hi, .35);
        } else {
          var ox = w * (.35 + r() * .3), oy = h * (.3 + r() * .2), pts = [], n = 10, wd = '';
          for(i = 0; i < n; i++){ var a = i / n * Math.PI * 2 + r() * .3, rr = (Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? w / Math.abs(Math.cos(a)) : h / Math.abs(Math.sin(a))); pts.push([ox + Math.cos(a) * rr, oy + Math.sin(a) * rr]); }
          for(i = 0; i < n; i++){ var p1 = pts[i], p2 = pts[(i + 1) % n]; s += '<polygon points="' + f1(ox) + ',' + f1(oy) + ' ' + f1(p1[0]) + ',' + f1(p1[1]) + ' ' + f1(p2[0]) + ',' + f1(p2[1]) + '" fill="' + (i % 3 === 0 ? P.hi : i % 3 === 1 ? S : P.acc) + '" opacity="' + (i % 3 === 0 ? .12 : i % 3 === 1 ? .35 : .18) + '"/>'; wd += 'M' + f1(ox) + ' ' + f1(oy) + 'L' + f1(p1[0]) + ' ' + f1(p1[1]); }
          s += '<path d="' + wd + '" stroke="' + P.hi + '" stroke-width="1" opacity=".7" fill="none"/><circle cx="' + f1(ox) + '" cy="' + f1(oy) + '" r="' + f1(mn * .05) + '" fill="' + P.hi + '" opacity=".6"/>';
        }
      } else {
        if(v === 0){
          s += '<circle cx="' + f1(w * .5) + '" cy="' + f1(hz) + '" r="' + f1(mn * .3) + '" fill="' + P.moon + '"/>';
          for(i = 0; i < 12; i++){ var a2 = Math.PI + i * Math.PI / 11; s += '<path d="M' + f1(w * .5 + Math.cos(a2) * mn * .34) + ' ' + f1(hz + Math.sin(a2) * mn * .34) + 'L' + f1(w * .5 + Math.cos(a2) * w) + ' ' + f1(hz + Math.sin(a2) * w) + '" stroke="' + P.moon + '" stroke-width="1.2" opacity=".4"/>'; }
          for(i = 0; i < 3; i++) s += '<ellipse cx="' + f1(r() * w) + '" cy="' + f1(hz - h * (.05 + r() * .1)) + '" rx="' + f1(w * .12) + '" ry="' + f1(h * .03) + '" fill="' + S + '" opacity=".4"/>';
          s += '<path d="M0 ' + f1(hz) + 'Q' + f1(w * .4) + ' ' + f1(hz - h * .03) + ' ' + w + ' ' + f1(hz) + 'V' + h + 'H0Z" fill="' + S + '"/>' + flag(w * .16, hz + 4, w * .1, S) + flag(w * .82, hz + 6, w * .12, S);
          for(i = 0; i < 6; i++) s += soldier(w * (.28 + i * .09), hz + h * (.06 + (i % 2) * .05), w / 260, S);
        } else if(v === 1){
          for(i = 0; i < 5; i++) s += '<ellipse cx="' + f1(r() * w) + '" cy="' + f1(h * (.1 + r() * .6)) + '" rx="' + f1(w * .18) + '" ry="' + f1(h * .04) + '" fill="' + P.hi + '" opacity=".4"/>';
          for(i = 0; i < 3; i++){ var px = w * (.2 + r() * .6), py = h * (.2 + r() * .4), q = w / 100; s += '<path d="M' + f1(px - 60 * q) + ' ' + f1(py + 4 * q) + 'L' + f1(px) + ' ' + f1(py) + '" stroke="' + P.hi + '" stroke-width="1.4" opacity=".6"/><g transform="translate(' + f1(px) + ',' + f1(py) + ') scale(' + f1(q) + ')" fill="' + S + '"><path d="M-14 0L8 -2L18 0L8 2Z"/><path d="M-3 0L-12 -10L-7 -10L5 0Z"/><path d="M-3 0L-12 10L-7 10L5 0Z"/></g>'; }
          for(i = 0; i < 4; i++) s += '<circle cx="' + f1(r() * w) + '" cy="' + f1(h * (.5 + r() * .3)) + '" r="' + f1(w * (.03 + r() * .05)) + '" fill="' + P.fire + '" opacity=".85"/><circle cx="' + f1(r() * w) + '" cy="' + f1(h * (.5 + r() * .3)) + '" r="' + f1(w * .04) + '" fill="' + S + '" opacity=".4"/>';
        } else if(v === 2){
          s += '<circle cx="' + f1(w * .2) + '" cy="' + f1(h * .18) + '" r="' + f1(mn * .1) + '" fill="' + P.moon + '" opacity=".9"/>';
          var wt = h * .4;
          s += '<rect y="' + f1(wt) + '" width="' + w + '" height="' + f1(h - wt) + '" fill="' + S + '"/>';
          for(i = 0; i < w / 14; i++) s += '<rect x="' + f1(i * 14 + 2) + '" y="' + f1(wt - h * .045) + '" width="9" height="' + f1(h * .05) + '" fill="' + S + '"/>';
          var bk = ''; for(i = 1; i < 7; i++) bk += 'M0 ' + f1(wt + i * (h - wt) / 7) + 'H' + w; for(i = 0; i < w / 18; i++) bk += 'M' + f1(i * 18 + (i % 2) * 9) + ' ' + f1(wt + (i % 3) * 8) + 'v10';
          s += '<path d="' + bk + '" stroke="' + P.hi + '" stroke-width=".6" opacity=".35" fill="none"/>';
          for(i = 0; i < 5; i++){ var ax = r() * w * .8, ay = h * (.05 + r() * .25); s += '<path d="M' + f1(ax) + ' ' + f1(ay + 14) + 'L' + f1(ax + 18) + ' ' + f1(ay) + 'M' + f1(ax + 18) + ' ' + f1(ay) + 'l-5 1M' + f1(ax + 18) + ' ' + f1(ay) + 'l-1 5" stroke="' + P.hi + '" stroke-width="1" opacity=".8"/>'; }
          for(i = 0; i < 2; i++) s += '<circle cx="' + f1(w * (.25 + i * .5)) + '" cy="' + f1(wt + 10) + '" r="' + f1(mn * .06) + '" fill="' + P.fire + '" opacity=".9"/><circle cx="' + f1(w * (.25 + i * .5)) + '" cy="' + f1(wt + 10) + '" r="' + f1(mn * .13) + '" fill="' + P.fire + '" opacity=".25"/>';
        } else if(v === 3){
          s += '<circle cx="' + f1(w * .3) + '" cy="' + f1(h * .22) + '" r="' + f1(mn * .16) + '" fill="' + P.moon + '"/>';
          s += '<path d="M0 ' + f1(hz - h * .04) + 'Q' + f1(w * .3) + ' ' + f1(hz - h * .16) + ' ' + f1(w * .6) + ' ' + f1(hz - h * .03) + 'T' + w + ' ' + f1(hz - h * .06) + 'V' + h + 'H0Z" fill="' + S + '" opacity=".55"/><path d="M0 ' + f1(hz + h * .04) + 'Q' + f1(w * .5) + ' ' + f1(hz - h * .06) + ' ' + w + ' ' + f1(hz + h * .03) + 'V' + h + 'H0Z" fill="' + S + '"/>';
          for(i = 0; i < 2; i++){ var tx = w * (.22 + i * .4), ty = hz - h * (.03 - i * .02), t = w / 160; s += '<g transform="translate(' + f1(tx) + ',' + f1(ty) + ') scale(' + f1(t) + ')" fill="' + S + '"><rect x="-18" y="-6" width="36" height="9" rx="2"/><rect x="-9" y="-13" width="17" height="8" rx="2"/><path d="M8 -9L32 -11" stroke="' + S + '" stroke-width="2.6"/></g><ellipse cx="' + f1(tx - 20) + '" cy="' + f1(ty + 2) + '" rx="' + f1(w * .08) + '" ry="' + f1(h * .02) + '" fill="' + P.hi + '" opacity=".35"/>'; }
        } else {
          for(i = 0; i < 4; i++) s += '<ellipse cx="' + f1(r() * w) + '" cy="' + f1(h * (.08 + r() * .3)) + '" rx="' + f1(w * .24) + '" ry="' + f1(h * .06) + '" fill="' + S + '" opacity=".55"/>';
          var lb = w * (.25 + r() * .5);
          s += '<polyline points="' + f1(lb) + ',0 ' + f1(lb - 7) + ',' + f1(h * .18) + ' ' + f1(lb + 4) + ',' + f1(h * .22) + ' ' + f1(lb - 9) + ',' + f1(h * .45) + '" stroke="' + P.hi + '" stroke-width="2" fill="none"/>';
          s += '<path d="M0 ' + f1(hz) + 'Q' + f1(w * .12) + ' ' + f1(hz - 8) + ' ' + f1(w * .25) + ' ' + f1(hz) + 'T' + f1(w * .5) + ' ' + f1(hz) + 'T' + f1(w * .75) + ' ' + f1(hz) + 'T' + w + ' ' + f1(hz) + 'V' + h + 'H0Z" fill="' + S + '"/>';
          var sh = w / 120;
          s += '<g transform="translate(' + f1(w * .52) + ',' + f1(hz - 2) + ') scale(' + f1(sh) + ')" fill="' + S + '"><path d="M-34 0L-26 -9L30 -9L40 -1L34 4L-30 4Z"/><rect x="-6" y="-24" width="4" height="15"/><rect x="8" y="-20" width="3" height="11"/><path d="M-6 -24L-2 -24L-2 -34Z"/></g><path d="M' + f1(w * .5) + ' ' + f1(hz - 28 * sh) + 'q' + f1(10 * sh) + ' ' + f1(-14 * sh) + ' ' + f1(24 * sh) + ' ' + f1(-12 * sh) + '" stroke="' + P.hi + '" stroke-width="3" opacity=".3" fill="none"/>';
          s += rain(r, Math.round(w / 3), w, h, P.hi, .45);
        }
      }
      return s;
    }
    function OBJ(k, v, w, h, r){
      var u = Math.min(w, h) / 100, s = '<g transform="translate(' + f1(w / 2) + ',' + f1(h / 2) + ') scale(' + f1(u * 1.05) + ')" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">';
      if(k === 'ask'){
        if(v === 0) s += '<g transform="rotate(-8)"><rect x="-36" y="-24" width="72" height="48" fill="#fff"/><path d="M-36 -24L0 5L36 -24M-36 24L-8 0M36 24L8 0" fill="none"/><circle cx="0" cy="3" r="9" fill="#111"/><path d="M0 9L-5 3Q-5 -1 0 1Q5 -1 5 3Z" fill="#fff" stroke="none"/></g>';
        else if(v === 1) s += '<ellipse cx="0" cy="8" rx="26" ry="24" fill="none" stroke-width="7"/><ellipse cx="0" cy="8" rx="26" ry="24" fill="none" stroke="#fff" stroke-width="2.4"/><polygon points="0,-30 -11,-20 -5,-13 5,-13 11,-20" fill="#fff"/><path d="M-11 -20H11M0 -30L-5 -13M0 -30L5 -13" fill="none" stroke-width="1.2"/><path d="M-26 -34L-20 -26M26 -34L20 -26M0 -46V-38" stroke-width="1.8"/>';
        else s += '<path d="M-58 14Q-34 -30 -10 10T32 0T60 -14" fill="none" stroke="#111" stroke-width="3.4"/><path d="M-2 4L-18 -12L-14 10ZM-2 4L14 -10L14 14Z" fill="#fff"/><circle cx="-1" cy="4" r="4.5" fill="#111"/>';
      } else if(k === 'intikam'){
        if(v === 0) s += '<g transform="rotate(32)"><path d="M0 -50L8 -12L-8 -12Z" fill="#fff"/><path d="M0 -50V-12" fill="none" stroke-width="1"/><rect x="-16" y="-12" width="32" height="6" fill="#111"/><rect x="-3.4" y="-6" width="6.8" height="26" fill="#444"/><circle cx="0" cy="24" r="4.5" fill="#111"/></g><path d="M30 38Q36 26 38 22Q42 30 30 38Z" fill="#111" stroke="none"/>';
        else if(v === 1) s += '<rect x="-6" y="-42" width="12" height="9" fill="#555"/><rect x="-9" y="-33" width="18" height="12" fill="#fff"/><path d="M-9 -21Q-34 -4 -30 20Q-28 38 0 38Q28 38 30 20Q34 -4 9 -21Z" fill="#fff"/><path d="M-30 8Q0 -2 30 8Q32 38 0 38Q-28 38 -30 8Z" fill="#222" stroke="none"/><path d="M-17 14Q-14 2 -8 6" fill="none" stroke="#fff" stroke-width="1.6"/>';
        else s += '<circle cx="0" cy="0" r="38" fill="#fff"/><polygon points="-6,-8 8,-14 12,2 -2,10" fill="#bbb" stroke-width="1.4"/><polygon points="14,12 26,6 24,22" fill="#999" stroke-width="1.4"/><path d="M0 0L-26 -30M0 0L32 -18M0 0L-10 36M0 0L34 22M0 0L-36 8" fill="none" stroke-width="1.6"/>';
      } else {
        if(v === 0) s += '<path d="M-44 44L26 -26" stroke="#fff" stroke-width="9"/><path d="M-44 44L26 -26" stroke="#111" stroke-width="2" fill="none"/><path d="M20 -32L38 -14M14 -12L34 -32" stroke="#111" stroke-width="5"/><path d="M-6 -38V34" stroke="#111" stroke-width="3"/><path d="M-6 -38L34 -30L26 -18L34 -6L-6 -12Z" fill="#fff"/>';
        else if(v === 1) s += '<path d="M-36 14Q-38 -36 0 -38Q38 -36 36 14Z" fill="#9a9a9a"/><path d="M-30 -4H30V6H-30Z" fill="#111"/><path d="M-3 4V30M-14 4V24M8 4V24" stroke-width="1.6" fill="none"/><path d="M0 -38Q10 -58 26 -50Q14 -48 8 -36Z" fill="#fff"/>';
        else s += '<g transform="rotate(-6)"><rect x="-48" y="-34" width="96" height="68" fill="#efefef"/><path d="M-38 24Q-20 -14 0 6T38 -22" fill="none" stroke-dasharray="5 4" stroke-width="2"/><path d="M30 -30L44 -16M44 -30L30 -16" stroke="#111" stroke-width="4"/><circle cx="-38" cy="24" r="4.5" fill="#111"/></g>';
      }
      return s + '</g>';
    }
    function EMO(r, w, h, ex, k, pat){
      var s = '<rect width="' + w + '" height="' + h + '" fill="' + (ex === 'a' || k === 'intikam' ? '#c9c9c9' : '#ececec') + '"/>', i, d = '', cx = w / 2, cy = h / 2, mn = Math.min(w, h);
      if(ex === 'a' || ex === 'o' || ex === 's'){
        for(i = 0; i < 46; i++){ var a = r() * 6.283, r0 = mn * (.3 + r() * .15), r1 = Math.max(w, h); d += 'M' + f1(cx + Math.cos(a) * r0) + ' ' + f1(cy + Math.sin(a) * r0) + 'L' + f1(cx + Math.cos(a) * r1) + ' ' + f1(cy + Math.sin(a) * r1); }
        s += '<path d="' + d + '" stroke="' + INK + '" stroke-width="' + (ex === 'o' ? .7 : 1) + '" fill="none"/>';
      } else if(ex === 'c'){
        for(i = 0; i < 30; i++) d += 'M' + f1(r() * w) + ' 0V' + f1(h * (.4 + r() * .6));
        s += '<path d="' + d + '" stroke="' + INK + '" stroke-width=".5" opacity=".55" fill="none"/>';
      } else {
        for(i = 0; i < 9; i++){ var x = r() * w, y = r() * h, q = 2 + r() * 3; s += '<path d="M' + f1(x) + ' ' + f1(y - q * 2) + 'Q' + f1(x) + ' ' + f1(y) + ' ' + f1(x + q * 2) + ' ' + f1(y) + 'Q' + f1(x) + ' ' + f1(y) + ' ' + f1(x) + ' ' + f1(y + q * 2) + 'Q' + f1(x) + ' ' + f1(y) + ' ' + f1(x - q * 2) + ' ' + f1(y) + 'Q' + f1(x) + ' ' + f1(y) + ' ' + f1(x) + ' ' + f1(y - q * 2) + 'Z" fill="#fff" stroke="' + INK + '" stroke-width=".6"/>'; }
        s += petals(r, 10, w, h, '#fff', 1);
      }
      return s + '<rect width="' + w + '" height="' + h + '" fill="url(#' + pat + ')" opacity=".25"/>';
    }

    // ---------- kapak ----------
    function artSvg(m){
      var k = m[4], H = hs(m[0]), r = mk(H + 5), cast = castFor(m[0]), P = mkP(k, false, m[2], m[3]), w = 200, h = 300, v = H % 5, comp = (H >> 3) % 4, ex = EXP[k];
      var A = cast[0], B = cast[1], C = cast[2], s = BG(k, v, w, h, r, P);
      var gid = 'q' + (uid++);
      s += '<defs><radialGradient id="' + gid + '" cx=".5" cy=".62" r=".6"><stop offset="0" stop-color="' + P.acc + '" stop-opacity=".55"/><stop offset="1" stop-color="' + P.acc + '" stop-opacity="0"/></radialGradient></defs><rect y="60" width="200" height="240" fill="url(#' + gid + ')"/>';
      var sl = ''; for(var i = 0; i < 26; i++){ var a = r() * 6.283, r0 = 70 + r() * 30; sl += 'M' + f1(100 + Math.cos(a) * r0) + ' ' + f1(185 + Math.sin(a) * r0) + 'L' + f1(100 + Math.cos(a) * 260) + ' ' + f1(185 + Math.sin(a) * 260); }
      s += '<path d="' + sl + '" stroke="#fff" stroke-width=".8" opacity="' + (k === 'ask' ? .1 : .2) + '" fill="none"/>';
      var o1 = { k: k, ex: ex[H % 6] }, o2 = { k: k, ex: ex[(H + 3) % 6] };
      if(comp === 0) s += chara(B, 138, 190, 1.2, { k: k, ex: o2.ex, dir: -1, flip: true }) + chara(A, 70, 172, 1.5, { k: k, ex: o1.ex, dir: 1 });
      else if(comp === 1) s += chara(B, 150, 128, 1.9, { k: k, ex: 'n', dir: -1, flip: true, cl: undefined }).replace('<g ', '<g opacity=".35" ') + chara(A, 98, 186, 2.15, { k: k, ex: o1.ex, dir: 0 });
      else if(comp === 2) s += chara(C, 100, 138, 1.05, { k: k, ex: 'n', dir: 0 }) + chara(A, 56, 192, 1.45, { k: k, ex: o1.ex, dir: 1 }) + chara(B, 146, 192, 1.45, { k: k, ex: o2.ex, dir: -1, flip: true });
      else s += chara(A, 62, 178, 1.6, { k: k, ex: o1.ex, dir: -1, flip: true }) + chara(B, 140, 166, 1.6, { k: k, ex: o2.ex, dir: 1 });
      if(k === 'ask') s += petals(r, 10, w, h, P.acc, .8);
      else if(k === 'intikam') s += '<path d="M' + f1(20 + r() * 40) + ' 20L' + f1(150 + r() * 40) + ' 250" stroke="#fff" stroke-width="3" opacity=".75"/><path d="M' + f1(20 + r() * 40) + ' 20L' + f1(150 + r() * 40) + ' 250" stroke="#fff" stroke-width=".8" opacity=".9"/>';
      else s += '<path d="M0 0L200 0L200 300" fill="none"/>' + stars(r, 10, w, h * .5, '#fde68a');
      var vg = 'q' + (uid++);
      s += '<defs><radialGradient id="' + vg + '" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient></defs><rect width="200" height="300" fill="url(#' + vg + ')"/>';
      return '<svg class="mg-art" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + s + '</svg>';
    }

    // ---------- okuyucu sayfaları ----------
    function R(x, y, w, h){ return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
    var LAY = [
      [R(6, 6, 188, 100), R(6, 112, 92, 90), R(102, 112, 92, 90), R(6, 208, 188, 86)],
      [R(6, 6, 92, 130), R(102, 6, 92, 130), R(6, 142, 188, 70), R(6, 218, 188, 76)],
      [R(6, 6, 188, 70), R(6, 82, 120, 120), R(130, 82, 64, 120), R(6, 208, 188, 86)],
      [R(6, 6, 188, 60), R(6, 72, 60, 140), R(70, 72, 124, 140), R(6, 218, 92, 76), R(102, 218, 92, 76)],
      [R(6, 6, 120, 100), R(130, 6, 64, 100), R(6, 112, 188, 110), R(6, 228, 188, 66)],
      [[[6, 6], [194, 6], [194, 96], [6, 140]], [[6, 146], [194, 102], [194, 204], [6, 204]], R(6, 210, 92, 84), R(102, 210, 92, 84)]
    ];
    var TY = { ask: ['duo', 'close', 'estab', 'obj', 'eyes', 'duo', 'close'], intikam: ['close', 'sil', 'estab', 'action', 'eyes', 'obj', 'duo'], savas: ['action', 'estab', 'duo', 'close', 'sil', 'obj', 'trio'] };
    function bubble(t, w, h, left, r){
      if(w < 56 || h < 46) return '';
      var words = t.split(' '), ln = [t];
      if(t.length > 15 && words.length > 1){ var mid = 0, acc = 0; for(var i = 0; i < words.length; i++){ acc += words[i].length + 1; if(acc >= t.length / 2){ mid = i + 1; break; } } ln = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]; }
      var mx = 0; ln.forEach(function(l){ mx = Math.max(mx, l.length); });
      var bw = Math.min(w - 16, mx * 3.5 + 10), bh = ln.length * 7.6 + 6, x = left ? 6 : w - 6 - bw, y = 5 + (r() < .3 ? 0 : 0);
      var cx = x + bw / 2, cy = y + bh / 2, tx = cx + (left ? 8 : -8);
      var out = '<path d="M' + f1(tx - 4) + ' ' + f1(cy + bh / 2 - 1) + 'L' + f1(tx + (left ? 4 : -4)) + ' ' + f1(cy + bh / 2 + 8) + 'L' + f1(tx + 4) + ' ' + f1(cy + bh / 2 - 1) + 'Z" fill="#fff" stroke="' + INK + '" stroke-width="1.1"/>';
      out += '<ellipse cx="' + f1(cx) + '" cy="' + f1(cy) + '" rx="' + f1(bw / 2 + 3) + '" ry="' + f1(bh / 2 + 1.5) + '" fill="#fff" stroke="' + INK + '" stroke-width="1.1"/><path d="M' + f1(tx - 3.4) + ' ' + f1(cy + bh / 2 - .4) + 'H' + f1(tx + 3.4) + '" stroke="#fff" stroke-width="2"/>';
      ln.forEach(function(l, i){ out += '<text x="' + f1(cx) + '" y="' + f1(y + 8 + i * 7.6) + '" text-anchor="middle" font-size="6" font-weight="700" font-family="system-ui,sans-serif" fill="' + INK + '" stroke="none">' + l + '</text>'; });
      return out;
    }
    function sfx(t, w, h, r){
      var sz = Math.min(w / (t.length * .52), h * .34, 30), ang = -14 + ((r() * 24) | 0);
      return '<text x="' + f1(w * (.3 + r() * .4)) + '" y="' + f1(h * .88) + '" font-size="' + f1(sz) + '" font-weight="900" font-style="italic" font-family="Impact,\'Arial Black\',system-ui,sans-serif" fill="#fff" stroke="' + INK + '" stroke-width="' + f1(sz * .12) + '" paint-order="stroke" text-anchor="middle" transform="rotate(' + ang + ' ' + f1(w / 2) + ' ' + f1(h / 2) + ')">' + t + '</text>';
    }
    function panelArt(type, w, h, r, X){
      var k = X.k, P = X.P, ch = X.ch, s = '', A = pk(r, ch), B = pk(r, ch), tr = 0;
      while(B === A && ch.length > 1 && tr++ < 9) B = pk(r, ch);
      var exA = pk(r, EXP[k]), exB = pk(r, EXP[k]), mn = Math.min(w, h), v = X.v;
      if(type === 'estab'){
        s += BG(k, v, w, h, r, P);
        s += '<g stroke="' + INK + '" stroke-width="1.2">' + chara(A, w * .3, h * .86, mn / 150, { mono: true, k: k, ex: 'n', sil: true, sw: 2.2 }) + chara(B, w * .62, h * .9, mn / 135, { mono: true, k: k, ex: 'n', sil: true, flip: true, sw: 2.2 }) + '</g>';
      } else if(type === 'close'){
        s += EMO(r, w, h, exA, k, X.pat) + chara(A, w * (.4 + r() * .2), h * .55, Math.min(h / 62, w / 34), { mono: true, k: k, ex: exA, dir: ((r() * 3) | 0) - 1, sw: 1.3 });
      } else if(type === 'eyes'){
        var sc = h / 16;
        s += '<rect width="' + w + '" height="' + h + '" fill="#e6e6e6"/>' + chara(A, w / 2, h / 2 - 3 * sc, sc, { mono: true, k: k, ex: exA === 'h' ? 'n' : exA, dir: ((r() * 3) | 0) - 1, sw: .55 });
      } else if(type === 'duo'){
        s += BG(k, v, w, h, r, P) + '<rect width="' + w + '" height="' + h + '" fill="url(#' + X.pat + ')" opacity=".2"/>';
        var q = Math.min(h / 98, w / 62);
        s += chara(A, w * .3, h * .62, q, { mono: true, k: k, ex: exA, dir: 1, sw: 1.4 }) + chara(B, w * .72, h * .66, q * .95, { mono: true, k: k, ex: exB, dir: -1, flip: true, sw: 1.4 });
      } else if(type === 'trio'){
        var C = pk(r, ch), q3 = Math.min(h / 112, w / 80);
        s += BG(k, v, w, h, r, P) + chara(C, w * .5, h * .5, q3 * .8, { mono: true, k: k, ex: 'n', sw: 1.4 }) + chara(A, w * .24, h * .7, q3, { mono: true, k: k, ex: exA, dir: 1, sw: 1.4 }) + chara(B, w * .78, h * .72, q3, { mono: true, k: k, ex: exB, dir: -1, flip: true, sw: 1.4 });
      } else if(type === 'action'){
        var d = '', cx = w / 2, cy = h / 2;
        s += '<rect width="' + w + '" height="' + h + '" fill="#e9e9e9"/>';
        for(var i = 0; i < 50; i++){ var a = r() * 6.283, r0 = mn * (.25 + r() * .2); d += 'M' + f1(cx + Math.cos(a) * r0) + ' ' + f1(cy + Math.sin(a) * r0) + 'L' + f1(cx + Math.cos(a) * w) + ' ' + f1(cy + Math.sin(a) * w); }
        s += '<path d="' + d + '" stroke="' + INK + '" stroke-width=".9" fill="none"/><g transform="rotate(' + ((r() * 14 - 7) | 0) + ' ' + f1(cx) + ' ' + f1(cy) + ')">' + chara(A, cx, h * .6, Math.min(h / 66, w / 38), { mono: true, k: k, ex: 'a', dir: ((r() * 3) | 0) - 1, sw: 1.3 }) + '</g>';
        s += '<path d="M0 ' + f1(h * .85) + 'L' + w + ' ' + f1(h * .15) + '" stroke="#fff" stroke-width="3" opacity=".95"/><path d="M0 ' + f1(h * .85) + 'L' + w + ' ' + f1(h * .15) + '" stroke="' + INK + '" stroke-width=".8"/>' + sfx(pk(r, SFX[k]), w, h, r);
      } else if(type === 'sil'){
        s += BG(k, (v + 1) % 5, w, h, r, P) + chara(A, w * (.35 + r() * .3), h * .7, Math.min(h / 70, w / 36), { mono: true, k: k, sil: true, sw: 1 });
      } else {
        s += EMO(r, w, h, 'a', k, X.pat) + OBJ(k, (r() * 3) | 0, w, h, r);
      }
      return s;
    }
    function page(m, ci){
      var k = m[4], H = hs(m[0]), r = mk(H + ci * 977 + 13), ch = castFor(m[0]), P = mkP(k, true), pat = 'pt' + (uid++);
      var s = '<svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + m[0] + ' sayfa ' + (ci + 1) + '"><defs><pattern id="' + pat + '" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".6" fill="#000"/></pattern></defs><rect width="200" height="300" fill="#f4f4f2"/>';
      var L = LAY[(H + ci * 5) % LAY.length], prev = '', usedB = 0, bubs = BUB[k], cap = CAP[k];
      L.forEach(function(pts, i){
        var xs = pts.map(function(p){ return p[0]; }), ys = pts.map(function(p){ return p[1]; });
        var bx = Math.min.apply(null, xs), by = Math.min.apply(null, ys), bw = Math.max.apply(null, xs) - bx, bh = Math.max.apply(null, ys) - by;
        var type = (i === 0 && ci % 2 === 0) ? 'estab' : pk(r, TY[k]), tries = 0;
        while(type === prev && tries++ < 8) type = pk(r, TY[k]);
        prev = type;
        var cid = 'cl' + (uid++), poly = pts.map(function(p){ return p[0] + ',' + p[1]; }).join(' ');
        s += '<clipPath id="' + cid + '"><polygon points="' + poly + '"/></clipPath><g clip-path="url(#' + cid + ')"><g transform="translate(' + bx + ',' + by + ')">';
        s += panelArt(type, bw, bh, r, { k: k, P: P, ch: ch, v: (H + ci + i * 2) % 5, pat: pat });
        if(type === 'estab' && bw > 90) s += '<rect x="4" y="4" width="' + f1(cap[(ci + i) % 4].length * 3 + 8) + '" height="11" fill="#fffbe6" stroke="' + INK + '" stroke-width="1"/><text x="8" y="11.6" font-size="5.4" font-family="system-ui,sans-serif" fill="' + INK + '" stroke="none">' + cap[(ci + i) % 4] + '</text>';
        else if(type !== 'obj' && type !== 'eyes' && type !== 'sil' && r() < .78) s += bubble(bubs[(ci * 3 + i + (H % 7)) % bubs.length], bw, bh, (i + ci) % 2 === 0, r);
        s += '</g></g><polygon points="' + poly + '" fill="none" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>';
      });
      return s + '</svg>';
    }