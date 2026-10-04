// ============================================================
// GİRİŞ / KAYIT İNTROSU — sinematik, Netflix tarzı (~11 sn)
// Akış:
//   0.0s  siyah ekran, alçak gümbürtü yükselir, kor parçacıkları süzülür
//   1.0s  ortadan ince kırmızı çizgi uzar
//   1.8s  arma ışıkla belirir
//   3.2s  "ta-dum" çift vuruş + mercek parlaması + kırmızı ışık şeritleri
//   3.4s  Japonca isim harf harf netleşir
//   5.2s  LOYAL ELITE FORCE, ardından alt yazı
//   7.0s  yazının üstünden ışık süpürür, arma nabız atar
//   9.4s  son whoosh ve ekran kararır
// Ses dosyası gerekmez; WebAudio ile üretilir.
// Kullanım: await window.playRegisterIntro();
// Ekrana dokun / Esc = geç.
// ============================================================
(function(){
  const JP = 'ロイヤル・エリート・フォース';
  const TOTAL = 10800; // ms — intro toplam süresi

  const css = `
  @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@700;800&family=Cinzel+Decorative:wght@700;900&display=swap');
  #regIntro{position:fixed;inset:0;z-index:99999;background:#000;overflow:hidden;display:flex;flex-direction:column;
    align-items:center;justify-content:center;text-align:center;opacity:1;transition:opacity 1.1s ease;cursor:pointer}
  #regIntro.out{opacity:0;pointer-events:none}
  #regIntro canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}

  /* karartı kenarları (vignette) */
  #regIntro .ri-vig{position:absolute;inset:0;pointer-events:none;
    background:radial-gradient(ellipse at center,transparent 35%,rgba(0,0,0,.85) 100%)}

  /* arka plan kırmızı nefes alan ışık */
  #regIntro .ri-glow{position:absolute;left:50%;top:50%;width:90vmax;height:90vmax;transform:translate(-50%,-50%) scale(.4);
    background:radial-gradient(circle,rgba(229,9,20,.32),rgba(120,0,6,.12) 40%,transparent 65%);opacity:0;
    animation:riGlow 8.5s ease-in-out .9s forwards}
  @keyframes riGlow{0%{opacity:0;transform:translate(-50%,-50%) scale(.4)}35%{opacity:.9}
    70%{opacity:.7;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.15)}}

  /* ortadan uzayan ince çizgi */
  #regIntro .ri-line{position:absolute;left:50%;top:50%;height:2px;width:0;background:linear-gradient(90deg,transparent,#e50914,#ff4b55,#e50914,transparent);
    box-shadow:0 0 22px 2px #e50914;transform:translate(-50%,-50%);opacity:0;animation:riLine 1.6s cubic-bezier(.2,.8,.2,1) 1s forwards}
  @keyframes riLine{0%{width:0;opacity:1}60%{width:70vw;opacity:1}100%{width:70vw;opacity:0}}

  /* vuruş anında anamorfik mercek parlaması */
  #regIntro .ri-flare{position:absolute;left:50%;top:50%;height:3px;width:120vw;transform:translate(-50%,-50%) scaleX(0);opacity:0;
    background:linear-gradient(90deg,transparent,rgba(255,60,70,.9) 30%,#fff 50%,rgba(255,60,70,.9) 70%,transparent);
    box-shadow:0 0 40px 8px rgba(229,9,20,.8);animation:riFlare 1.8s cubic-bezier(.16,.9,.2,1) 3.2s forwards}
  @keyframes riFlare{0%{opacity:0;transform:translate(-50%,-50%) scaleX(0)}12%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scaleX(1)}}

  /* kırmızı ışık şeritleri */
  #regIntro .ri-streaks{position:absolute;inset:0;display:flex;justify-content:center;align-items:stretch;gap:1.6vw;opacity:0;
    animation:riStreaks 4s cubic-bezier(.2,.7,.2,1) 3.1s forwards}
  #regIntro .ri-streaks i{width:1.8vw;max-width:22px;background:linear-gradient(180deg,transparent,#e50914 30%,#8a0007 70%,transparent);
    transform:scaleY(0);filter:blur(1.5px);animation:riBar 2.8s cubic-bezier(.2,.8,.2,1) 3.1s forwards}
  @keyframes riStreaks{0%{opacity:0}12%{opacity:.85}60%{opacity:.4}100%{opacity:0}}
  @keyframes riBar{0%{transform:scaleY(0)}35%{transform:scaleY(1)}100%{transform:scaleY(1.2)}}

  /* şok dalgası halkası */
  #regIntro .ri-ring{position:absolute;left:50%;top:50%;width:20vmin;height:20vmin;border-radius:50%;
    border:2px solid rgba(255,60,70,.9);box-shadow:0 0 30px rgba(229,9,20,.7),inset 0 0 30px rgba(229,9,20,.4);
    transform:translate(-50%,-50%) scale(.2);opacity:0;animation:riRing 2.2s cubic-bezier(.1,.7,.2,1) 3.2s forwards}
  #regIntro .ri-ring.r2{animation-delay:3.6s;border-color:rgba(255,120,128,.6)}
  @keyframes riRing{0%{opacity:1;transform:translate(-50%,-50%) scale(.2)}100%{opacity:0;transform:translate(-50%,-50%) scale(7)}}

  /* ana içerik */
  #regIntro .ri-stack{position:relative;display:flex;flex-direction:column;align-items:center;z-index:2}

  #regIntro .ri-crest{width:clamp(80px,16vw,150px);margin-bottom:3.5vh;opacity:0;
    filter:drop-shadow(0 0 22px rgba(229,9,20,.9)) sepia(1) saturate(6) hue-rotate(-30px) brightness(.95);
    transform:scale(.6);animation:riCrestIn 2s cubic-bezier(.16,.9,.2,1) 1.8s forwards,riPulse 1.6s ease-in-out 7s 2}
  @keyframes riCrestIn{0%{opacity:0;transform:scale(.6);filter:blur(14px) drop-shadow(0 0 0 rgba(229,9,20,0)) sepia(1) saturate(6) hue-rotate(-30px) brightness(.4)}
    100%{opacity:1;transform:scale(1);filter:blur(0) drop-shadow(0 0 22px rgba(229,9,20,.9)) sepia(1) saturate(6) hue-rotate(-30px) brightness(.95)}}
  @keyframes riPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}

  #regIntro .ri-jp{position:relative;display:flex;justify-content:center;flex-wrap:nowrap;
    font-family:'Shippori Mincho','Yu Mincho','MS Mincho',serif;font-weight:800;font-size:clamp(16px,5.2vw,84px);
    color:#e50914;white-space:nowrap;max-width:96vw}
  #regIntro .ri-jp span{display:inline-block;opacity:0;transform:scale(1.8) translateY(-8px);filter:blur(14px);
    text-shadow:0 0 18px rgba(229,9,20,.9),0 0 60px rgba(229,9,20,.55),0 3px 0 #5c0005;
    animation:riLetter 1.1s cubic-bezier(.16,.9,.2,1) forwards;margin:0 .01em}
  @keyframes riLetter{0%{opacity:0;transform:scale(1.8) translateY(-8px);filter:blur(14px)}
    60%{opacity:1;filter:blur(0)}100%{opacity:1;transform:scale(1) translateY(0);filter:blur(0)}}

  /* yazının üstünden geçen ışık süpürmesi */
  #regIntro .ri-sweep{position:absolute;inset:-10% 0;pointer-events:none;mix-blend-mode:screen;
    background:linear-gradient(100deg,transparent 40%,rgba(255,255,255,.75) 50%,transparent 60%);
    background-size:250% 100%;background-position:150% 0;opacity:0;animation:riSweep 1.5s ease-in-out 7.1s forwards}
  @keyframes riSweep{0%{opacity:1;background-position:150% 0}100%{opacity:1;background-position:-50% 0}}

  #regIntro .ri-en{margin-top:2.6vh;font-family:'Cinzel Decorative',serif;font-weight:900;font-size:clamp(11px,3.2vw,30px);
    letter-spacing:.4em;color:#ff2a35;opacity:0;padding-left:.4em;max-width:96vw;text-shadow:0 0 14px rgba(229,9,20,.8);
    animation:riEn 1.8s cubic-bezier(.2,.8,.2,1) 5.2s forwards}
  @keyframes riEn{0%{opacity:0;letter-spacing:.9em;filter:blur(6px)}100%{opacity:1;letter-spacing:.4em;filter:blur(0)}}

  #regIntro .ri-rule{margin-top:2.6vh;height:1px;width:0;background:linear-gradient(90deg,transparent,#a30a12,transparent);
    animation:riRule 1.6s ease 6.1s forwards}
  @keyframes riRule{to{width:min(60vw,420px)}}

  #regIntro .ri-sub{margin-top:2.4vh;font-family:'Shippori Mincho',serif;font-size:clamp(12px,2.6vw,20px);
    letter-spacing:.6em;color:#b30b14;opacity:0;padding-left:.6em;max-width:96vw;animation:riSub 1.6s ease 6.4s forwards}
  @keyframes riSub{0%{opacity:0;letter-spacing:1em}100%{opacity:.95;letter-spacing:.6em}}

  /* son: kırmızı beyaz parlama ve kararma */
  #regIntro .ri-end{position:absolute;inset:0;background:radial-gradient(circle,rgba(255,70,80,.55),transparent 60%);opacity:0;
    animation:riEnd 1.6s ease 9.2s forwards}
  @keyframes riEnd{0%{opacity:0;transform:scale(.7)}40%{opacity:1}100%{opacity:0;transform:scale(1.8)}}

  #regIntro .ri-skip{position:absolute;bottom:3vh;right:4vw;font:600 11px/1 sans-serif;letter-spacing:.25em;color:#6a1419;
    text-transform:uppercase;z-index:3;opacity:0;animation:riSkip .8s ease 1.5s forwards}
  @keyframes riSkip{to{opacity:1}}

  @media (prefers-reduced-motion:reduce){
    #regIntro .ri-streaks,#regIntro .ri-flare,#regIntro .ri-ring,#regIntro .ri-sweep,#regIntro canvas{display:none}
  }
  `;

  // ---------------- SES ----------------
  let ctx = null, master = null;
  function unlockAudio(){
    try{
      if(!ctx){ const AC = window.AudioContext || window.webkitAudioContext; if(AC) ctx = new AC(); }
      if(ctx && ctx.state === 'suspended') ctx.resume();
    }catch(e){}
  }
  // Butona basıldığı an (kullanıcı hareketi) sesi aç; tarayıcılar buna izin verir.
  document.addEventListener('click', e => { if(e.target.closest('#registerBtn, #loginBtn')) unlockAudio(); }, true);
  document.addEventListener('submit', e => { if(e.target.id === 'registerForm' || e.target.id === 'loginForm') unlockAudio(); }, true);

  function noiseBuffer(sec){
    const len = Math.floor(ctx.sampleRate * sec), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for(let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function sound(){
    if(!ctx) return;
    const t0 = ctx.currentTime;
    master = ctx.createGain(); master.gain.value = .9; master.connect(ctx.destination);

    // 1) Alçak gümbürtü: 0–3.2s boyunca yükselir
    const rum = ctx.createOscillator(), rg = ctx.createGain(), rf = ctx.createBiquadFilter();
    rum.type = 'sawtooth'; rum.frequency.setValueAtTime(34, t0); rum.frequency.exponentialRampToValueAtTime(70, t0 + 3.2);
    rf.type = 'lowpass'; rf.frequency.setValueAtTime(90, t0); rf.frequency.exponentialRampToValueAtTime(380, t0 + 3.2);
    rg.gain.setValueAtTime(0, t0); rg.gain.linearRampToValueAtTime(.35, t0 + 3.1); rg.gain.exponentialRampToValueAtTime(.001, t0 + 3.5);
    rum.connect(rf).connect(rg).connect(master); rum.start(t0); rum.stop(t0 + 3.6);

    // 2) Yükselen gerilim süpürmesi (filtreli gürültü): 0.8–3.2s
    const n1 = ctx.createBufferSource(); n1.buffer = noiseBuffer(2.6);
    const b1 = ctx.createBiquadFilter(); b1.type = 'bandpass'; b1.Q.value = 4;
    b1.frequency.setValueAtTime(200, t0 + .8); b1.frequency.exponentialRampToValueAtTime(6000, t0 + 3.2);
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0, t0 + .8); g1.gain.linearRampToValueAtTime(.5, t0 + 3.1); g1.gain.exponentialRampToValueAtTime(.001, t0 + 3.4);
    n1.connect(b1).connect(g1).connect(master); n1.start(t0 + .8);

    // 3) "ta-dum": iki derin vuruş
    const hit = (t, f0, f1, vol, dur) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(f0, t0 + t); o.frequency.exponentialRampToValueAtTime(f1, t0 + t + dur);
      g.gain.setValueAtTime(0, t0 + t); g.gain.linearRampToValueAtTime(vol, t0 + t + .02);
      g.gain.exponentialRampToValueAtTime(.001, t0 + t + dur);
      o.connect(g).connect(master); o.start(t0 + t); o.stop(t0 + t + dur + .05);
    };
    hit(3.2, 120, 36, 1.0, 3.0);
    hit(3.62, 88, 28, 1.0, 3.4);

    // vuruşun "çatlak" sesi (kısa gürültü patlaması)
    const cr = ctx.createBufferSource(); cr.buffer = noiseBuffer(.4);
    const cf = ctx.createBiquadFilter(); cf.type = 'lowpass'; cf.frequency.value = 1800;
    const cg = ctx.createGain(); cg.gain.setValueAtTime(.5, t0 + 3.2); cg.gain.exponentialRampToValueAtTime(.001, t0 + 3.5);
    cr.connect(cf).connect(cg).connect(master); cr.start(t0 + 3.2);

    // 4) Harfler belirirken parıltılı akor (3.6s'den sonra yavaşça söner)
    [196, 293.7, 392, 587.3, 784].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0 + 3.6); g.gain.linearRampToValueAtTime(.085 - i * .01, t0 + 4.0);
      g.gain.exponentialRampToValueAtTime(.001, t0 + 8.8);
      o.connect(g).connect(master); o.start(t0 + 3.6); o.stop(t0 + 9);
    });

    // 5) Harf harf belirme "tık"ları (hafif parıltı)
    for(let i = 0; i < JP.length; i++){
      const t = 3.5 + i * .095;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 1400 + (i % 4) * 220;
      g.gain.setValueAtTime(0, t0 + t); g.gain.linearRampToValueAtTime(.025, t0 + t + .01);
      g.gain.exponentialRampToValueAtTime(.001, t0 + t + .35);
      o.connect(g).connect(master); o.start(t0 + t); o.stop(t0 + t + .4);
    }

    // 6) Işık süpürmesi sırasında kısa shimmer (7.1s)
    const n2 = ctx.createBufferSource(); n2.buffer = noiseBuffer(1.6);
    const b2 = ctx.createBiquadFilter(); b2.type = 'highpass'; b2.frequency.value = 5000;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0, t0 + 7.1); g2.gain.linearRampToValueAtTime(.12, t0 + 7.8); g2.gain.exponentialRampToValueAtTime(.001, t0 + 8.7);
    n2.connect(b2).connect(g2).connect(master); n2.start(t0 + 7.1);

    // 7) Final: yükselen whoosh + son derin vuruş (9.2s)
    const n3 = ctx.createBufferSource(); n3.buffer = noiseBuffer(1.6);
    const b3 = ctx.createBiquadFilter(); b3.type = 'bandpass'; b3.Q.value = 2.5;
    b3.frequency.setValueAtTime(300, t0 + 8.4); b3.frequency.exponentialRampToValueAtTime(7000, t0 + 9.4);
    const g3 = ctx.createGain();
    g3.gain.setValueAtTime(0, t0 + 8.4); g3.gain.linearRampToValueAtTime(.5, t0 + 9.2); g3.gain.exponentialRampToValueAtTime(.001, t0 + 10);
    n3.connect(b3).connect(g3).connect(master); n3.start(t0 + 8.4);
    hit(9.2, 100, 34, .8, 2);
  }

  function stopSound(){
    try{
      if(master && ctx){
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + .4);
      }
    }catch(e){}
  }

  // ---------------- KOR PARÇACIKLARI ----------------
  function embers(canvas, isActive){
    const c = canvas.getContext('2d');
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize(); window.addEventListener('resize', resize);
    const N = w < 640 ? 45 : 90;
    const ps = Array.from({length: N}, () => ({
      x: Math.random() * w, y: h + Math.random() * h * .4,
      r: .6 + Math.random() * 1.8, vy: .25 + Math.random() * .9, vx: (Math.random() - .5) * .3,
      a: .2 + Math.random() * .6, ph: Math.random() * 6.28
    }));
    const start = performance.now();
    (function frame(now){
      if(!isActive()){ window.removeEventListener('resize', resize); return; }
      const t = (now - start) / 1000;
      c.clearRect(0, 0, w, h);
      // yoğunluk: ilk 1sn yavaş, 3.2s vuruşta en yoğun, sonra azalır
      const boost = t < 3.2 ? .35 + t / 3.2 * .65 : Math.max(.3, 1 - (t - 3.2) / 6);
      for(const p of ps){
        p.y -= p.vy * (1 + (t > 3.2 && t < 4.4 ? 2.2 : 0));
        p.x += p.vx + Math.sin(t * 1.4 + p.ph) * .25;
        if(p.y < -10){ p.y = h + 10; p.x = Math.random() * w; }
        const al = p.a * boost * (.6 + .4 * Math.sin(t * 3 + p.ph));
        c.beginPath();
        c.fillStyle = `rgba(255,${50 + Math.floor(p.r * 30)},40,${al.toFixed(3)})`;
        c.shadowColor = 'rgba(229,9,20,.9)'; c.shadowBlur = 8;
        c.arc(p.x, p.y, p.r, 0, 6.2832); c.fill();
      }
      requestAnimationFrame(frame);
    })(start);
  }

  // ---------------- ANA FONKSİYON ----------------
  window.playRegisterIntro = function(){
    return new Promise(resolve => {
      const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
      const el = document.createElement('div'); el.id = 'regIntro';

      const bars = Array.from({length: 13}, (_, i) => `<i style="animation-delay:${(3.1 + Math.abs(6 - i) * .07).toFixed(2)}s"></i>`).join('');
      const letters = Array.from(JP).map((ch, i) => `<span style="animation-delay:${(3.5 + i * .095).toFixed(2)}s">${ch}</span>`).join('');

      el.innerHTML =
        `<div class="ri-glow"></div>
         <canvas></canvas>
         <div class="ri-streaks">${bars}</div>
         <div class="ri-ring"></div><div class="ri-ring r2"></div>
         <div class="ri-line"></div><div class="ri-flare"></div>
         <div class="ri-stack">
           <img class="ri-crest" src="crest.png" alt="">
           <div class="ri-jp">${letters}<div class="ri-sweep"></div></div>
           <div class="ri-en">LOYAL ELITE FORCE</div>
           <div class="ri-rule"></div>
           <div class="ri-sub">忠誠 ・ 規律 ・ 力</div>
         </div>
         <div class="ri-vig"></div><div class="ri-end"></div>
         <div class="ri-skip">Geç ›</div>`;
      document.body.appendChild(el);

      let done = false;
      const finish = (skipped) => {
        if(done) return; done = true;
        if(skipped) stopSound();
        try{ sessionStorage.setItem('ltfReveal','1'); }catch(e){}
        resolve();
      };

      unlockAudio(); sound();
      embers(el.querySelector('canvas'), () => !done);
      el.addEventListener('click', () => finish(true));
      document.addEventListener('keydown', e => { if(e.key === 'Escape') finish(true); }, { once: true });
      setTimeout(() => finish(false), TOTAL);
    });
  };

  // ---- SİTE AÇILIŞI: ortadan çizgi, üst/alt perde yukarı-aşağı kayar ----
  let go = false;
  try{ go = sessionStorage.getItem('ltfReveal') === '1'; sessionStorage.removeItem('ltfReveal'); }catch(e){}
  if(go){
    const r = document.createElement('div');
    r.id = 'ltfReveal';
    r.innerHTML = `<style>
      #ltfReveal{position:fixed;inset:0;z-index:99999;pointer-events:none;overflow:hidden}
      #ltfReveal .h{position:absolute;left:0;right:0;height:50.2%;background:#000;transition:transform 1.2s cubic-bezier(.77,0,.18,1) .9s}
      #ltfReveal .t{top:0}#ltfReveal .b{bottom:0}
      #ltfReveal .l{position:absolute;left:50%;top:50%;height:2px;width:0;transform:translate(-50%,-50%);
        background:linear-gradient(90deg,transparent,#e50914,#ff2a35,#e50914,transparent);box-shadow:0 0 26px 4px #e50914;
        transition:width .8s cubic-bezier(.2,.8,.2,1) .1s,opacity .5s ease 1s}
      #ltfReveal.go .l{width:100vw;opacity:0}
      #ltfReveal.go .t{transform:translateY(-101%)}#ltfReveal.go .b{transform:translateY(101%)}
    </style><div class="h t"></div><div class="h b"></div><div class="l"></div>`;
    document.documentElement.appendChild(r);
    const run = () => requestAnimationFrame(() => requestAnimationFrame(() => r.classList.add('go')));
    (document.readyState === 'loading') ? addEventListener('DOMContentLoaded', run) : run();
    setTimeout(() => r.remove(), 2800);
  }
})();