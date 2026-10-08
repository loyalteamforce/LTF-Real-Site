// ============================================================
// Milky Way — GPU ile simüle edilen spiral galaksi (saf JS, React gerekmez)
// Hyperiux Vault "milky-way" bileşeninin three.js karşılığı.
// Kullanım:  mountMilkyWay(container, { rotationSpeed: 0.35 })  →  true / false
// Temizlik:  container.__milkyDispose()
// (WebGL2 + float render target yoksa false döner; çağıran yedeğe geçer.)
// ============================================================
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';
const { degToRad } = THREE.MathUtils;

const CFG = {
  texSize: 400, maxRadius: 3.5, holeRadius: 1.2, holeEdgeBand: 1.5, arms: 1,
  spiralTightness: 10.75, armWidth: 0.38, diskHeight: 0.5, coreRadius: 0.22, coreHeight: 0.28,
  seed: 91, colorParticleRatio: 0.01, baseSize: 8, sparkleSize: 12.0, twinkleSpeed: 4.5,
  colorLevels: { core: 1.15, mid: 1.0, outer: 0.9, sparkle: 1.1 },
};
const SMOKE_CFG = {
  texSize: 50, maxRadius: 3.5, holeRadius: 1.2, holeEdgeBand: 1.5, arms: 2,
  spiralTightness: 10.75, armWidth: 0.9, diskHeight: 0.18, orbSpeedBase: 0.2,
  tangentFlow: 0.3, armRestore: 1.7, radialRestore: 0.8, particleSize: 92.0, opacity: 0.05,
  colorLevels: { core: 1.25, cyan: 1.05, magenta: 1.1, violet: 0.95, outer: 0.75 },
  seed: 7777,
};

/* ---------------- Shaderlar ---------------- */
const SIM_FRAG = /* glsl */`
precision highp float;
uniform sampler2D uPosition;
uniform sampler2D uData;
uniform float uDelta;
uniform float uTime;
varying vec2 vUv;
void main(){
 vec4 pos = texture2D(uPosition, vUv);
 vec4 data = texture2D(uData, vUv);
 vec3 p = pos.xyz;
 float phase = pos.w;
 float seed = data.y;
 float orbSpeed = data.z;
 float r = length(p.xy) + 0.0001;
 float vTan = orbSpeed * (r / (r + 0.28));
 float omega = vTan / r;
 float dAngle = omega * uDelta * .2;
 float cosA = cos(dAngle);
 float sinA = sin(dAngle);
 float nx = p.x * cosA - p.y * sinA;
 float ny = p.x * sinA + p.y * cosA;
 p.x = nx;
 p.y = ny;
 p.z += sin(uTime * 0.2 + seed * 6.28318) * 0.0001;
 phase = mod(phase + uDelta * (0.018 + seed * 0.008), 1.0);
 gl_FragColor = vec4(p, phase);
}
`;
const PARTICLE_VERT = /* glsl */`
precision highp float;
uniform sampler2D uPosition;
uniform float uPixelRatio;
uniform float uParticleSize;
attribute vec2 aRef;
attribute float aRadiusFrac;
attribute float aSeed;
attribute float aColor;
varying float vRadiusFrac;
varying float vPhase;
varying float vSeed;
varying float vColor;
void main(){
 vec4 posData = texture2D(uPosition, aRef);
 vec3 pos = posData.xyz;
 vPhase = posData.w;
 vRadiusFrac = aRadiusFrac;
 vSeed = aSeed;
 vColor = aColor;
 vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
 float depth = -mvPos.z;
 float isSpecial = step(${(1.0 - CFG.colorParticleRatio).toFixed(3)}, aColor);
 float sizeFactor = pow(1.0 - aRadiusFrac, 1.3);
 float normalSz = mix(0.5, ${CFG.baseSize.toFixed(1)}, sizeFactor) * (0.7 + aSeed * 0.5);
 float specialSz = mix(${CFG.sparkleSize.toFixed(1)} * 0.6, ${CFG.sparkleSize.toFixed(1)}, aSeed);
 float sz = mix(normalSz, specialSz, isSpecial);
 sz *= uParticleSize;
 sz *= (420.0 / max(depth, 0.1)) * uPixelRatio;
 float maxSize = mix(
  (${CFG.baseSize.toFixed(1)} * (2.0 + aSeed * 1.0)),
  (${CFG.sparkleSize.toFixed(1)} * (2.0 + aSeed * 1.0)),
  isSpecial
 ) * uParticleSize;
 gl_PointSize = clamp(sz, 0.4, maxSize);
 gl_Position = projectionMatrix * mvPos;
}
`;
const PARTICLE_FRAG = /* glsl */`
precision highp float;
varying float vRadiusFrac;
varying float vPhase;
varying float vSeed;
varying float vColor;
uniform vec3 uCoreColor;
uniform vec3 uAccentColor;
uniform vec3 uOuterColor;
void main(){
 vec2 uv = gl_PointCoord - 0.5;
 float r = length(uv) * 2.0;
 if(r > 1.0) discard;
 float cp = exp(-r * r * 14.0);
 float halo = exp(-r * r * 3.0) * 0.30;
 float disc = clamp(cp + halo, 0.0, 1.0);
 float dispersion = pow(1.0 - vRadiusFrac, 1.05);
 float coreBulge = smoothstep(0.22, 0.0, vRadiusFrac) * 0.55;
 float intensity = clamp(dispersion + coreBulge, 0.0, 1.0);
 float tRate = 2.5 + vSeed * ${CFG.twinkleSpeed.toFixed(1)};
 float twinkle = 0.78 + 0.22 * sin(vPhase * 6.28318 * tRate + vSeed * 17.3);
 intensity *= twinkle;
 float isSpecial = step(${(1.0 - CFG.colorParticleRatio).toFixed(3)}, vColor);
 vec3 nCore = uCoreColor * ${CFG.colorLevels.core.toFixed(2)};
 vec3 nMid = mix(uCoreColor, uAccentColor, 0.7) * ${CFG.colorLevels.mid.toFixed(2)};
 vec3 nOuter = uOuterColor * ${CFG.colorLevels.outer.toFixed(2)};
 vec3 normalCol = mix(nCore, nMid, smoothstep(0.00, 0.42, vRadiusFrac));
 normalCol = mix(normalCol, nOuter, smoothstep(0.42, 1.00, vRadiusFrac));
 float ss = fract((vColor - ${(1.0 - CFG.colorParticleRatio).toFixed(3)}) / ${CFG.colorParticleRatio.toFixed(3)} * 5.0) * 5.0;
 vec3 s0 = uAccentColor * ${CFG.colorLevels.sparkle.toFixed(2)};
 vec3 s1 = mix(uAccentColor, uCoreColor, 0.35) * ${CFG.colorLevels.sparkle.toFixed(2)};
 vec3 s2 = mix(uOuterColor, uCoreColor, 0.2) * ${CFG.colorLevels.sparkle.toFixed(2)};
 vec3 s3 = uOuterColor * ${CFG.colorLevels.sparkle.toFixed(2)};
 vec3 s4 = mix(uAccentColor, uOuterColor, 0.5) * ${CFG.colorLevels.sparkle.toFixed(2)};
 vec3 specialCol;
 if(ss < 1.0) specialCol = mix(s0, s1, ss);
 else if(ss < 2.0) specialCol = mix(s1, s2, ss - 1.0);
 else if(ss < 3.0) specialCol = mix(s2, s3, ss - 2.0);
 else if(ss < 4.0) specialCol = mix(s3, s4, ss - 3.0);
 else specialCol = mix(s4, s0, ss - 4.0);
 intensity = mix(intensity, clamp(intensity * 2.5, 0.0, 1.0), isSpecial);
 vec3 col = mix(normalCol, specialCol, isSpecial);
 float alpha = disc * intensity * 0.90;
 gl_FragColor = vec4(col * alpha, alpha);
}
`;
// Duman (nebula) simülasyonu. Orijinaldeki gürültü terimi pratikte sabit/ihmal edilebilir olduğundan çıkarıldı.
const SMOKE_SIM_FRAG = /* glsl */`
precision highp float;
uniform sampler2D uPosition;
uniform sampler2D uData;
uniform float uDelta;
uniform float uTime;
varying vec2 vUv;
void main(){
 vec4 pos = texture2D(uPosition, vUv);
 vec4 data = texture2D(uData, vUv);
 vec3 p = pos.xyz;
 float phase = pos.w;
 float radiusFrac = data.x;
 float seed = data.y;
 float orbSpeed = data.z;
 float armIdxNorm = data.w;
 float r = length(p.xy) + 0.0001;
 float vTan = orbSpeed * (r / (r + 0.35));
 float omega = vTan / r;
 float dAngle = omega * uDelta;
 float cosA = cos(dAngle);
 float sinA = sin(dAngle);
 float nx = p.x * cosA - p.y * sinA;
 float ny = p.x * sinA + p.y * cosA;
 p.x = nx;
 p.y = ny;
 float armBase = armIdxNorm * 6.28318;
 float targetTheta = armBase + r * ${SMOKE_CFG.spiralTightness.toFixed(2)};
 vec2 tangent = normalize(vec2(
  cos(targetTheta) - ${SMOKE_CFG.spiralTightness.toFixed(2)} * r * sin(targetTheta),
  sin(targetTheta) + ${SMOKE_CFG.spiralTightness.toFixed(2)} * r * cos(targetTheta)
 ));
 p.xy += tangent * ${SMOKE_CFG.tangentFlow.toFixed(2)} * (0.85 + radiusFrac * 0.45) * uDelta;
 float currentTheta = atan(p.y, p.x);
 float angleDelta = atan(sin(targetTheta - currentTheta), cos(targetTheta - currentTheta));
 vec2 radialDir = normalize(p.xy);
 vec2 armNormal = vec2(-tangent.y, tangent.x);
 p.xy += armNormal * angleDelta * r * ${SMOKE_CFG.armRestore.toFixed(2)} * uDelta;
 p.xy += radialDir * ((radiusFrac * ${SMOKE_CFG.maxRadius.toFixed(2)}) - r) * ${SMOKE_CFG.radialRestore.toFixed(2)} * uDelta;
 p.z *= 0.975;
 p.z += sin(uTime * 0.12 + seed * 6.28318) * 0.00012;
 phase = mod(phase + uDelta * (0.012 + seed * 0.006), 1.0);
 gl_FragColor = vec4(p, phase);
}
`;
const SMOKE_VERT = /* glsl */`
precision highp float;
uniform sampler2D uPosition;
uniform float uPixelRatio;
uniform float uParticleSize;
attribute vec2 aRef;
attribute float aRadiusFrac;
attribute float aSeed;
varying float vRadiusFrac;
varying float vPhase;
varying float vSeed;
void main(){
 vec4 posData = texture2D(uPosition, aRef);
 vec3 pos = posData.xyz;
 vPhase = posData.w;
 vRadiusFrac = aRadiusFrac;
 vSeed = aSeed;
 vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
 float depth = -mvPos.z;
 float sizeFactor = mix(0.6, 1.0, 1.0 - aRadiusFrac);
 float sz = ${SMOKE_CFG.particleSize.toFixed(1)} * uParticleSize * sizeFactor * (0.7 + aSeed * 0.6);
 sz *= (420.0 / max(depth, 0.1)) * uPixelRatio;
 gl_PointSize = clamp(sz, 2.0, ${SMOKE_CFG.particleSize.toFixed(1)} * uParticleSize * 3.0);
 gl_Position = projectionMatrix * mvPos;
}
`;
const SMOKE_FRAG = /* glsl */`
precision highp float;
varying float vRadiusFrac;
varying float vPhase;
varying float vSeed;
uniform vec3 uCoreColor;
uniform vec3 uAccentColor;
uniform vec3 uOuterColor;
void main(){
 vec2 uv = gl_PointCoord - 0.5;
 uv.x *= 2.1;
 uv.y *= 0.72;
 float r = length(uv) * 2.0;
 if(r > 1.0) discard;
 float core = exp(-dot(uv, uv) * 3.4);
 float halo = exp(-dot(uv, uv) * 0.75) * 0.9;
 float shape = clamp(core + halo, 0.0, 1.0);
 float streak = 0.72 + 0.28 * smoothstep(0.42, 0.0, abs(uv.y));
 float radialFade = pow(1.0 - vRadiusFrac, 0.72);
 float coreBright = smoothstep(0.32, 0.0, vRadiusFrac) * 0.22;
 float intensity = clamp(radialFade + coreBright, 0.0, 1.0);
 float flow = 0.88 + 0.12 * sin(vPhase * 6.28318 * 1.0 + vSeed * 8.0);
 intensity *= flow * streak;
 vec3 cCore = uCoreColor * ${SMOKE_CFG.colorLevels.core.toFixed(2)};
 vec3 cCyan = uAccentColor * ${SMOKE_CFG.colorLevels.cyan.toFixed(2)};
 vec3 cMagenta = mix(uAccentColor, uOuterColor, 0.35) * ${SMOKE_CFG.colorLevels.magenta.toFixed(2)};
 vec3 cViolet = mix(uCoreColor, uAccentColor, 0.45) * ${SMOKE_CFG.colorLevels.violet.toFixed(2)};
 vec3 cOuter = uOuterColor * ${SMOKE_CFG.colorLevels.outer.toFixed(2)};
 float colorNoise = fract(vSeed * 13.371 + vRadiusFrac * 2.71);
 vec3 col = mix(cCore, cCyan, smoothstep(0.00, 0.28, vRadiusFrac));
 col = mix(col, cMagenta, smoothstep(0.18, 0.52, vRadiusFrac + (colorNoise - 0.5) * 0.18));
 col = mix(col, cViolet, smoothstep(0.42, 0.78, vRadiusFrac + (colorNoise - 0.5) * 0.22));
 col = mix(col, cOuter, smoothstep(0.72, 1.00, vRadiusFrac));
 float cyanMix = smoothstep(0.15, 0.85, sin(vSeed * 19.0 + vRadiusFrac * 11.0) * 0.5 + 0.5);
 float magentaMix = smoothstep(0.2, 0.9, cos(vSeed * 23.0 - vRadiusFrac * 8.0) * 0.5 + 0.5);
 col = mix(col, cCyan, cyanMix * 0.18);
 col = mix(col, cMagenta, magentaMix * 0.22);
 float alpha = shape * intensity * ${SMOKE_CFG.opacity.toFixed(3)};
 gl_FragColor = vec4(col * alpha, alpha);
}
`;

/* ---------------- Yardımcılar ---------------- */
function mulberry32(seed){
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const mkTex = (arr, S) => {
  const t = new THREE.DataTexture(arr, S, S, THREE.RGBAFormat, THREE.FloatType);
  t.needsUpdate = true; t.minFilter = t.magFilter = THREE.NearestFilter;
  return t;
};

function buildTextures(cfg){
  const S = cfg.texSize, total = S * S;
  const posArr = new Float32Array(total * 4), dataArr = new Float32Array(total * 4);
  const rand = mulberry32(cfg.seed);
  for(let i = 0; i < total; i++){
    const r0 = rand();
    let r, inBulge = false;
    if(r0 < 0.18){ r = Math.abs(rand() + rand() + rand() - 1.5) * cfg.coreRadius * 1.1; inBulge = true; }
    else { r = -Math.log(1.0 - rand() * 0.9999) * (cfg.maxRadius * 0.35); r = Math.min(r, cfg.maxRadius); }
    let inHoleEdge = false;
    if(r < cfg.holeRadius){ r = cfg.holeRadius + rand() * cfg.holeEdgeBand; inBulge = false; inHoleEdge = true; }
    const radiusFrac = Math.min(r / cfg.maxRadius, 1.0);
    const armIdx = Math.floor(rand() * cfg.arms);
    const armBase = (armIdx / cfg.arms) * Math.PI * 2;
    let g = rand() + rand() + rand(); g = (g / 3 - 0.5) * 2.0;
    const scatter = cfg.armWidth * r * (inBulge ? 3.0 : 1.0);
    const theta = inHoleEdge ? (rand() * Math.PI * 2 + g * (cfg.armWidth * cfg.holeRadius * 3.0))
                             : (armBase + r * cfg.spiralTightness + g * scatter);
    let gz = rand() + rand() + rand(); gz = (gz / 3 - 0.5) * 2.0;
    const z = gz * (inBulge ? cfg.coreHeight : cfg.diskHeight * (0.5 + radiusFrac * 0.5));
    posArr[i*4] = r * Math.cos(theta); posArr[i*4+1] = r * Math.sin(theta); posArr[i*4+2] = z; posArr[i*4+3] = rand();
    dataArr[i*4] = radiusFrac; dataArr[i*4+1] = rand();
    dataArr[i*4+2] = inBulge ? 0.55 + rand() * 0.15 : 0.30 + radiusFrac * 0.22 + rand() * 0.08;
    dataArr[i*4+3] = armIdx / cfg.arms;
  }
  return { posTex: mkTex(posArr, S), dataTex: mkTex(dataArr, S) };
}
function buildGeo(cfg){
  const S = cfg.texSize, count = S * S;
  const refs = new Float32Array(count * 2), rfrac = new Float32Array(count), seeds = new Float32Array(count), colors = new Float32Array(count);
  const rand = mulberry32(cfg.seed + 99);
  for(let i = 0; i < count; i++){
    refs[i*2] = ((i % S) + 0.5) / S; refs[i*2+1] = (Math.floor(i / S) + 0.5) / S;
    const r0 = rand(); let r;
    if(r0 < 0.18) r = Math.abs(rand() + rand() + rand() - 1.5) * cfg.coreRadius * 1.1;
    else { r = -Math.log(1.0 - rand() * 0.9999) * (cfg.maxRadius * 0.35); r = Math.min(r, cfg.maxRadius); }
    if(r < cfg.holeRadius) r = cfg.holeRadius + rand() * 0.06;
    rfrac[i] = Math.min(r / cfg.maxRadius, 1.0); seeds[i] = rand(); colors[i] = rand();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aRef', new THREE.BufferAttribute(refs, 2));
  geo.setAttribute('aRadiusFrac', new THREE.BufferAttribute(rfrac, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 1));
  return geo;
}
function buildSmokeTextures(cfg){
  const S = cfg.texSize, total = S * S;
  const posArr = new Float32Array(total * 4), dataArr = new Float32Array(total * 4);
  const rand = mulberry32(cfg.seed);
  for(let i = 0; i < total; i++){
    let r = -Math.log(1.0 - rand() * 0.9999) * (cfg.maxRadius * 0.34); r = Math.min(r, cfg.maxRadius);
    let inHoleEdge = false;
    if(r < cfg.holeRadius){ r = cfg.holeRadius + rand() * cfg.holeEdgeBand; inHoleEdge = true; }
    const radiusFrac = Math.min(r / cfg.maxRadius, 1.0);
    const armIdx = Math.floor(rand() * cfg.arms);
    const armBase = (armIdx / cfg.arms) * Math.PI * 2;
    let g = rand() + rand() + rand(); g = (g / 3 - 0.5) * 2.0;
    const theta = inHoleEdge ? (rand() * Math.PI * 2 + g * (cfg.armWidth * cfg.holeRadius * 2.0))
                             : (armBase + r * cfg.spiralTightness + g * cfg.armWidth * r);
    let gz = rand() + rand() + rand(); gz = (gz / 3 - 0.5) * 2.0;
    posArr[i*4] = r * Math.cos(theta); posArr[i*4+1] = r * Math.sin(theta);
    posArr[i*4+2] = gz * cfg.diskHeight * (0.6 + radiusFrac * 0.4); posArr[i*4+3] = rand();
    dataArr[i*4] = radiusFrac; dataArr[i*4+1] = rand();
    dataArr[i*4+2] = cfg.orbSpeedBase + radiusFrac * 0.08 + rand() * 0.04; dataArr[i*4+3] = armIdx / cfg.arms;
  }
  return { posTex: mkTex(posArr, S), dataTex: mkTex(dataArr, S) };
}
function buildSmokeGeo(cfg){
  const S = cfg.texSize, count = S * S;
  const refs = new Float32Array(count * 2), rfrac = new Float32Array(count), seeds = new Float32Array(count);
  const rand = mulberry32(cfg.seed + 200);
  for(let i = 0; i < count; i++){
    refs[i*2] = ((i % S) + 0.5) / S; refs[i*2+1] = (Math.floor(i / S) + 0.5) / S;
    let r = -Math.log(1.0 - rand() * 0.9999) * (cfg.maxRadius * 0.34); r = Math.min(r, cfg.maxRadius);
    if(r < cfg.holeRadius) r = cfg.holeRadius + rand() * cfg.holeEdgeBand;
    rfrac[i] = Math.min(r / cfg.maxRadius, 1.0); seeds[i] = rand();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aRef', new THREE.BufferAttribute(refs, 2));
  geo.setAttribute('aRadiusFrac', new THREE.BufferAttribute(rfrac, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  return geo;
}

/* GPGPU: iki render target arasında ping-pong */
function makeGPU(w, h, renderer){
  const geo = new THREE.PlaneGeometry(2, 2);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const scene = new THREE.Scene();
  const rt = () => new THREE.WebGLRenderTarget(w, h, {
    wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
    minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat, type: THREE.FloatType, depthBuffer: false, stencilBuffer: false,
  });
  const vars = {};
  return {
    addVar(name, frag, initTex){
      const simMat = new THREE.ShaderMaterial({
        uniforms: { uPosition: { value: initTex }, uData: { value: null }, uDelta: { value: 0 }, uTime: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }',
        fragmentShader: frag,
      });
      const rtA = rt(), rtB = rt();
      const blitMat = new THREE.MeshBasicMaterial({ map: initTex });
      const blit = new THREE.Mesh(geo, blitMat);
      scene.add(blit); renderer.setRenderTarget(rtA); renderer.render(scene, cam);
      scene.remove(blit); blitMat.dispose(); renderer.setRenderTarget(null);
      vars[name] = { simMat, mesh: new THREE.Mesh(geo, simMat), rtA, rtB };
    },
    compute(name, time, delta, dataTex){
      const v = vars[name];
      v.simMat.uniforms.uTime.value = time; v.simMat.uniforms.uDelta.value = delta; v.simMat.uniforms.uData.value = dataTex;
      const tmp = v.rtA; v.rtA = v.rtB; v.rtB = tmp;
      v.simMat.uniforms.uPosition.value = v.rtB.texture;
      scene.add(v.mesh); renderer.setRenderTarget(v.rtA); renderer.render(scene, cam);
      scene.remove(v.mesh); renderer.setRenderTarget(null);
      return v.rtA.texture;
    },
    dispose(){ Object.values(vars).forEach(v => { v.rtA.dispose(); v.rtB.dispose(); v.simMat.dispose(); }); geo.dispose(); },
  };
}

/* ---------------- Ana fonksiyon ---------------- */
export function mountMilkyWay(container, opts = {}){
  if(!container) return false;
  const o = Object.assign({
    particleSize: 0.6, coreColor: '#f5f5ff', accentColor: '#ffe6ad', outerColor: '#e05c12',
    rotationSpeed: 0.35, mouseInfluence: true, texSize: 0,
  }, opts);
  const coarse = matchMedia('(pointer:coarse)').matches;
  const reduceMotion = matchMedia('(prefers-reduced-motion:reduce)').matches;

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' }); }
  catch(e){ return false; }
  const gl = renderer.getContext();
  if(!(typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) || !gl.getExtension('EXT_color_buffer_float')){
    renderer.dispose(); return false;      // float render target yok → çağıran yedeğe geçer
  }
  const dpr = Math.max(1, Math.min(coarse ? 1.5 : 2, window.devicePixelRatio || 1));
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none';
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 200);
  camera.position.set(-1, -1.8, 4);
  camera.lookAt(0, 0, 0);

  // Arka plan yıldızları (orijinaldeki gibi 4000 nokta)
  const starPos = new Float32Array(4000 * 3);
  { const rnd = mulberry32(12345);
    for(let i = 0; i < 4000; i++){
      const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1), r = 40 + rnd() * 20;
      starPos.set([r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph)], i * 3);
    } }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: o.coreColor, size: 0.055, sizeAttenuation: true, transparent: true, opacity: 0.7, depthWrite: false });
  const bgStars = new THREE.Points(starGeo, starMat); bgStars.frustumCulled = false;
  scene.add(bgStars);

  // Galaksi hiyerarşisi (orijinaldeki Center → mouse grubu → 1.65x katman)
  const root = new THREE.Group(); root.rotation.x = degToRad(-10); scene.add(root);
  const BASE = [degToRad(110), degToRad(-10), 0];
  const pivot = new THREE.Group(); pivot.rotation.set(BASE[0], BASE[1], BASE[2]); root.add(pivot);
  const layer = new THREE.Group(); layer.scale.setScalar(1.65); layer.rotation.set(degToRad(40), 0, degToRad(-5)); pivot.add(layer);

  const colorU = () => ({
    uCoreColor: { value: new THREE.Color(o.coreColor) },
    uAccentColor: { value: new THREE.Color(o.accentColor) },
    uOuterColor: { value: new THREE.Color(o.outerColor) },
  });
  const cfg = Object.assign({}, CFG, { texSize: o.texSize || (coarse ? 300 : 400) });
  const gal = buildTextures(cfg), galGeo = buildGeo(cfg);
  const galMat = new THREE.ShaderMaterial({
    uniforms: Object.assign({ uPosition: { value: gal.posTex }, uPixelRatio: { value: dpr }, uParticleSize: { value: o.particleSize } }, colorU()),
    vertexShader: PARTICLE_VERT, fragmentShader: PARTICLE_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const galPts = new THREE.Points(galGeo, galMat); galPts.frustumCulled = false; layer.add(galPts);
  const galGPU = makeGPU(cfg.texSize, cfg.texSize, renderer);
  galGPU.addVar('pos', SIM_FRAG, gal.posTex);

  // Nebula dumanı: ilk karelerden sonra eklenir (açılışta takılma olmasın)
  let smoke = null;
  const smokeTimer = setTimeout(() => {
    const sc = SMOKE_CFG, st = buildSmokeTextures(sc), sg = buildSmokeGeo(sc);
    const sm = new THREE.ShaderMaterial({
      uniforms: Object.assign({ uPosition: { value: st.posTex }, uPixelRatio: { value: dpr }, uParticleSize: { value: o.particleSize } }, colorU()),
      vertexShader: SMOKE_VERT, fragmentShader: SMOKE_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(sg, sm); pts.frustumCulled = false; layer.add(pts);
    const gpu = makeGPU(sc.texSize, sc.texSize, renderer); gpu.addVar('smokePos', SMOKE_SIM_FRAG, st.posTex);
    smoke = { st, sg, sm, pts, gpu };
  }, 600);

  // Boyut + nokta ölçeği (küçük ekranda noktalar orantılı küçülsün)
  function resize(){
    const w = container.clientWidth, h = container.clientHeight;
    if(!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const vs = Math.max(0.45, Math.min(1.3, h / 800));
    galMat.uniforms.uParticleSize.value = o.particleSize * vs;
    if(smoke) smoke.sm.uniforms.uParticleSize.value = o.particleSize * vs;
    viewScale = vs;
  }
  let viewScale = 1;
  const ro = new ResizeObserver(resize); ro.observe(container);

  // Hafif fare eğimi (masaüstü)
  const mouse = { x: 0, y: 0 }, smooth = { x: 0, y: 0 };
  const onMove = e => { mouse.x = (e.clientX / (innerWidth || 1)) * 2 - 1; mouse.y = (e.clientY / (innerHeight || 1)) * 2 - 1; };
  if(o.mouseInfluence && !coarse && !reduceMotion) addEventListener('pointermove', onMove);

  let autoRot = BASE[2], visible = true, raf = 0, last = performance.now(), elapsed = 0, disposed = false;
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; }); io.observe(container);

  function frame(now){
    if(disposed) return;
    raf = requestAnimationFrame(frame);
    if(!visible || document.hidden){ last = now; return; }
    const dt = Math.min((now - last) / 1000, 0.05); last = now; elapsed += dt;

    if(!reduceMotion){
      const simDt = dt * Math.max(o.rotationSpeed, 0);
      galMat.uniforms.uPosition.value = galGPU.compute('pos', elapsed, simDt, gal.dataTex);
      if(smoke){
        smoke.sm.uniforms.uPosition.value = smoke.gpu.compute('smokePos', elapsed, simDt, smoke.st.dataTex);
      }
      const t = 1 - Math.exp(-1 * dt);
      smooth.x += (mouse.x - smooth.x) * t; smooth.y += (mouse.y - smooth.y) * t;
      autoRot += dt * o.rotationSpeed * 0.18;
      const k = o.mouseInfluence ? 1 : 0;
      pivot.rotation.x = BASE[0] - smooth.y * 0.1 * k;
      pivot.rotation.y = BASE[1] - smooth.x * 0.12 * k;
      pivot.rotation.z = autoRot + smooth.x * smooth.y * 0.03 * k;
    }
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
  }
  resize();
  raf = requestAnimationFrame(frame);

  container.__milkyDispose = () => {
    disposed = true; cancelAnimationFrame(raf); clearTimeout(smokeTimer);
    ro.disconnect(); io.disconnect(); removeEventListener('pointermove', onMove);
    galGPU.dispose(); gal.posTex.dispose(); gal.dataTex.dispose(); galGeo.dispose(); galMat.dispose();
    if(smoke){ smoke.gpu.dispose(); smoke.st.posTex.dispose(); smoke.st.dataTex.dispose(); smoke.sg.dispose(); smoke.sm.dispose(); }
    starGeo.dispose(); starMat.dispose();
    renderer.dispose(); canvas.remove();
  };
  return true;
}