// ============================================================
// KAYIT SONRASI İNTRO — siyah ekran, kırmızı Japonca "Loyal Elite Force"
// Netflix tarzı: kırmızı ışık şeritleri, derin "ta-dum" vuruşu, yükselen ses.
// Ses dosyası gerekmez; tarayıcıda (WebAudio) üretilir.
// Kullanım: await window.playRegisterIntro();
// ============================================================
(function(){
  const css = `
  @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@700;800&family=Cinzel+Decorative:wght@700;900&display=swap');
  #regIntro{position:fixed;inset:0;z-index:99999;background:#000;overflow:hidden;display:flex;flex-direction:column;
    align-items:center;justify-content:center;text-align:center;opacity:1;transition:opacity .9s ease;cursor:pointer}
  #regIntro.out{opacity:0;pointer-events:none}
  #regIntro .ri-streaks{position:absolute;inset:0;display:flex;justify-content:center;align-items:stretch;gap:2.2vw;opacity:0;
    animation:riStreaks 3.4s cubic-bezier(.2,.7,.2,1) .25s forwards}
  #regIntro .ri-streaks i{width:2.2vw;max-width:26px;background:linear-gradient(180deg,transparent,#e50914 30%,#8a0007 70%,transparent);
    transform:scaleY(0);filter:blur(1.5px);animation:riBar 2.6s cubic-bezier(.2,.8,.2,1) forwards}
  @keyframes riStreaks{0%{opacity:0}15%{opacity:.9}70%{opacity:.5}100%{opacity:0}}
  @keyframes riBar{0%{transform:scaleY(0)}35%{transform:scaleY(1)}100%{transform:scaleY(1.15)}}
  #regIntro .ri-flash{position:absolute;inset:0;background:radial-gradient(circle,rgba(229,9,20,.55),transparent 62%);opacity:0;
    animation:riFlash 1.2s ease 1.3s forwards}
  @keyframes riFlash{0%{opacity:0;transform:scale(.6)}25%{opacity:1}100%{opacity:0;transform:scale(1.7)}}
  #regIntro .ri-jp{position:relative;font-family:'Shippori Mincho','Yu Mincho','MS Mincho',serif;font-weight:800;
    font-size:clamp(34px,9.5vw,92px);letter-spacing:.12em;color:#e50914;opacity:0;
    text-shadow:0 0 18px rgba(229,9,20,.9),0 0 60px rgba(229,9,20,.55),0 3px 0 #5c0005;
    animation:riJp 1.6s cubic-bezier(.16,.9,.2,1) 1.25s forwards}
  @keyframes riJp{0%{opacity:0;transform:scale(1.9);filter:blur(16px);letter-spacing:.5em}
    60%{opacity:1;filter:blur(0)}100%{opacity:1;transform:scale(1);filter:blur(0);letter-spacing:.12em}}
  #regIntro .ri-en{position:relative;margin-top:2.2vh;font-family:'Cinzel Decorative',serif;font-weight:900;
    font-size:clamp(14px,3.6vw,30px);letter-spacing:.55em;color:#ff2a35;opacity:0;padding-left:.55em;
    text-shadow:0 0 14px rgba(229,9,20,.8);animation:riEn 1.4s ease 2.3s forwards}
  @keyframes riEn{0%{opacity:0;letter-spacing:1em}100%{opacity:1;letter-spacing:.55em}}
  #regIntro .ri-sub{position:relative;margin-top:3vh;font-family:'Shippori Mincho',serif;font-size:clamp(12px,2.8vw,20px);
    letter-spacing:.9em;color:#a30a12;opacity:0;padding-left:.9em;animation:riSub 1.2s ease 3.2s forwards}
  @keyframes riSub{to{opacity:.95}}
  #regIntro .ri-line{position:absolute;left:50%;top:50%;height:2px;width:0;background:linear-gradient(90deg,transparent,#e50914,transparent);
    box-shadow:0 0 20px #e50914;transform:translate(-50%,-50%);opacity:0;animation:riLine 1.1s ease .15s forwards}
  @keyframes riLine{0%{width:0;opacity:1}70%{width:90vw;opacity:1}100%{width:90vw;opacity:0}}
  #regIntro .ri-skip{position:absolute;bottom:3vh;right:4vw;font:600 11px/1 sans-serif;letter-spacing:.25em;color:#5a1115;text-transform:uppercase}
  @media (prefers-reduced-motion:reduce){#regIntro .ri-streaks,#regIntro .ri-flash,#regIntro .ri-line{display:none}}
  `;

  let ctx = null;
  function unlockAudio(){
    try{
      if(!ctx){ const AC = window.AudioContext || window.webkitAudioContext; if(AC) ctx = new AC(); }
      if(ctx && ctx.state === 'suspended') ctx.resume();
    }catch(e){}
  }
  // Kayıt butonuna basıldığı an (kullanıcı hareketi) sesi aç; tarayıcılar buna izin verir.
  document.addEventListener('click', e => { if(e.target.closest('#registerBtn')) unlockAudio(); }, true);
  document.addEventListener('submit', e => { if(e.target.id === 'registerForm') unlockAudio(); }, true);

  function sound(){
    if(!ctx) return;
    const t0 = ctx.currentTime, master = ctx.createGain();
    master.gain.value = .9; master.connect(ctx.destination);

    // "ta-dum": iki derin vuruş
    const hit = (t, f0, f1, vol, dur) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(f0, t0 + t); o.frequency.exponentialRampToValueAtTime(f1, t0 + t + dur);
      g.gain.setValueAtTime(0, t0 + t); g.gain.linearRampToValueAtTime(vol, t0 + t + .02);
      g.gain.exponentialRampToValueAtTime(.001, t0 + t + dur);
      o.connect(g).connect(master); o.start(t0 + t); o.stop(t0 + t + dur + .05);
    };
    hit(1.25, 110, 38, 1.0, 2.6);
    hit(1.62, 82, 30, 1.0, 3.0);

    // Yükselen rüzgâr/swoosh (filtreli gürültü)
    const len = ctx.sampleRate * 2.2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for(let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const n = ctx.createBufferSource(); n.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 3;
    bp.frequency.setValueAtTime(180, t0 + .1); bp.frequency.exponentialRampToValueAtTime(5200, t0 + 1.3);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0, t0 + .1); ng.gain.linearRampToValueAtTime(.55, t0 + 1.2); ng.gain.exponentialRampToValueAtTime(.001, t0 + 1.9);
    n.connect(bp).connect(ng).connect(master); n.start(t0 + .1);

    // Parıltılı akor (tüm vuruşun üstünde kısa bir yankı)
    [196, 293.7, 392, 587.3].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0 + 1.62); g.gain.linearRampToValueAtTime(.09 - i * .012, t0 + 1.75);
      g.gain.exponentialRampToValueAtTime(.001, t0 + 4.2);
      o.connect(g).connect(master); o.start(t0 + 1.62); o.stop(t0 + 4.3);
    });
  }

  window.playRegisterIntro = function(){
    return new Promise(resolve => {
      const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
      const el = document.createElement('div'); el.id = 'regIntro';
      const bars = Array.from({length: 11}, (_, i) => `<i style="animation-delay:${(Math.abs(5 - i) * .06).toFixed(2)}s"></i>`).join('');
      el.innerHTML = `<div class="ri-streaks">${bars}</div><div class="ri-line"></div><div class="ri-flash"></div>
        <div class="ri-jp">ロイヤル・エリート・フォース</div>
        <div class="ri-en">LOYAL ELITE FORCE</div>
        <div class="ri-sub">忠誠 ・ 規律 ・ 力</div>
        <div class="ri-skip">Geç ›</div>`;
      document.body.appendChild(el);

      let done = false;
      const finish = () => {
        if(done) return; done = true;
        el.classList.add('out');
        setTimeout(() => { el.remove(); st.remove(); resolve(); }, 900);
      };
      unlockAudio(); sound();
      el.addEventListener('click', finish);
      document.addEventListener('keydown', e => { if(e.key === 'Escape') finish(); }, { once: true });
      setTimeout(finish, 5600);
    });
  };
})();