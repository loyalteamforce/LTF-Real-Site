// ============================================================
// WAVES BACKGROUND — 21st.dev "Waves" shader'ının saf JS karşılığı.
// React/bağımlılık yok. Tüm ekranı kaplayan sabit bir WebGL canvas
// ekler; içeriğin arkasında kalır. WebGL yoksa false döner ve
// sitenin eski arka planı olduğu gibi kalır.
// ============================================================
const VERT = `attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec3 u_colors[8];
uniform vec4 u_scene;
uniform vec4 u_shape;
uniform vec4 u_surface;
uniform vec4 u_finish;
uniform vec4 u_transform;
uniform vec4 u_space;
uniform vec4 u_cursor;

#define u_resolution u_scene.xy
#define u_time u_scene.z
#define u_colorCount u_scene.w
#define u_scale u_shape.x
#define u_intensity u_shape.y
#define u_paramA u_shape.z
#define u_warp u_shape.w
#define u_detail u_surface.x
#define u_contrast u_surface.y
#define u_brightness u_surface.z
#define u_saturation u_surface.w
#define u_hue u_finish.x
#define u_vignette u_finish.y
#define u_blur u_finish.z
#define u_grain u_finish.w
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define u_seed u_transform.x
#else
#define u_seed mod(u_transform.x, 31.0)
#endif
#define u_rotate u_transform.y
#define u_drift u_transform.z
#define u_oklab u_transform.w
#define u_offset u_space.xy

float hash21(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float grainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.2);
    a *= 0.5;
  }
  return v;
}

vec3 srgbToLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}
vec3 linearToSrgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
vec3 linToOklab(vec3 c) {
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  l = pow(max(l, 0.0), 1.0 / 3.0);
  m = pow(max(m, 0.0), 1.0 / 3.0);
  s = pow(max(s, 0.0), 1.0 / 3.0);
  return vec3(
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);
}
vec3 oklabToLin(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}
vec3 mixColour(vec3 a, vec3 b, float t) {
  if (u_oklab > 0.5) {
    vec3 la = linToOklab(srgbToLinear(a));
    vec3 lb = linToOklab(srgbToLinear(b));
    return clamp(linearToSrgb(oklabToLin(mix(la, lb, t))), 0.0, 1.0);
  }
  return mix(a, b, t);
}

vec3 palette(float x) {
  float n = max(u_colorCount - 1.0, 1.0);
  float f = clamp(x, 0.0, 1.0) * n;
  vec3 col = u_colors[0];
  for (int i = 0; i < 7; i++) {
    if (float(i) < n)
      col = mixColour(col, u_colors[i + 1],
        smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));
  }
  return col;
}

vec3 hueRotate(vec3 col, float a) {
  const mat3 toYIQ = mat3(0.299, 0.596, 0.211,
                          0.587, -0.274, -0.523,
                          0.114, -0.322, 0.312);
  const mat3 toRGB = mat3(1.0, 1.0, 1.0,
                          0.956, -0.272, -1.106,
                          0.621, -0.647, 1.703);
  vec3 yiq = toYIQ * col;
  float ca = cos(a), sa = sin(a);
  yiq = vec3(yiq.x, yiq.y * ca - yiq.z * sa, yiq.y * sa + yiq.z * ca);
  return toRGB * yiq;
}

vec3 shade(vec2 uv, vec2 p, float t) {
  float y = uv.y
    + sin(uv.x * (3.0 + u_intensity * 9.0) + t * 0.8) * 0.08
    + (fbm(p * 2.0 + t * 0.1) - 0.5) * u_intensity * 0.6;
  return palette(y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 screenUv = uv;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);

  uv = p * min(u_resolution.x, u_resolution.y) / u_resolution.xy + 0.5;
  p *= u_scale;
  if (abs(u_rotate) > 0.0001) {
    float cr = cos(u_rotate), sr = sin(u_rotate);
    p = mat2(cr, -sr, sr, cr) * p;
  }
  p += u_offset;
  if (u_drift > 0.0001)
    p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));
  if (u_warp > 0.0) {
    p += u_warp * (vec2(
      fbm(p * u_detail + u_seed),
      fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);
  }
  vec3 col = shade(uv, p, u_time);
  if (abs(u_contrast - 1.0) > 0.0001)
    col = (col - 0.5) * u_contrast + 0.5;
  if (abs(u_saturation - 1.0) > 0.0001) {
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, u_saturation);
  }
  if (abs(u_hue) > 0.0001) col = hueRotate(col, u_hue);
  if (abs(u_brightness) > 0.0001) col += u_brightness;
  if (u_vignette > 0.0001) {
    float vd = length(screenUv - 0.5) * 1.41421356;
    col *= 1.0 - u_vignette * smoothstep(0.35, 1.0, vd);
  }
  if (u_grain > 0.0001)
    col += (grainHash(gl_FragCoord.xy + vec2(u_seed * 17.0, u_seed * 31.0)) - 0.5) * u_grain;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

const U = {
  colors: [[0.0118,0.1098,0.1490],[0.1059,0.4235,0.6588],[0.3529,0.8235,0.9569],[0.9176,0.9765,1],[0.9176,0.9765,1],[0.9176,0.9765,1],[0.9176,0.9765,1],[0.9176,0.9765,1]],
  colorCount: 4, scale: 1.08, intensity: 0.62, paramA: 0.5, warp: 0.24,
  detail: 2.912, contrast: 1.158, brightness: 0, saturation: 1,
  hue: 0, vignette: 0, blur: 0, grain: 0.042,
  seed: 1, rotate: 4.0841, offsetX: 0, offsetY: 0, drift: 0, oklab: 0, timeScale: 0.86
};

/**
 * @param {object} [opts]
 * @param {number} [opts.scrim=0.55]  koyu örtü (0–1). Yazılar açık renk olduğu için okunurluk sağlar.
 * @param {number} [opts.maxPixels]   render edilen en fazla piksel (performans)
 */
export function mountWavesBackground(opts = {}){
  const scrimAlpha = opts.scrim ?? 0.55;
  const mobile = window.innerWidth < 760;
  const maxPixels = opts.maxPixels ?? (mobile ? 500000 : 1600000);

  const canvas = document.createElement('canvas');
  canvas.id = 'wavesBg';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-2;display:block;pointer-events:none;';
  const gl = canvas.getContext('webgl', { antialias: false });
  if(!gl) return false;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if(!vs || !fs) return false;
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
  gl.useProgram(program);

  const scrim = document.createElement('div');
  scrim.id = 'wavesScrim';
  scrim.setAttribute('aria-hidden', 'true');
  scrim.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;background:rgba(2,14,22,' + scrimAlpha + ');';
  document.body.prepend(scrim);
  document.body.prepend(canvas);
  document.documentElement.classList.add('waves-on');

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const L = n => gl.getUniformLocation(program, n);
  const uni = { colors:L('u_colors'), scene:L('u_scene'), shape:L('u_shape'), surface:L('u_surface'),
                finish:L('u_finish'), transform:L('u_transform'), space:L('u_space'), cursor:L('u_cursor') };
  gl.uniform3fv(uni.colors, new Float32Array(U.colors.flat()));
  gl.uniform4f(uni.shape, U.scale, U.intensity, U.paramA, U.warp);
  gl.uniform4f(uni.surface, U.detail, U.contrast, U.brightness, U.saturation);
  gl.uniform4f(uni.finish, U.hue, U.vignette, U.blur, U.grain);
  gl.uniform4f(uni.transform, U.seed, U.rotate, U.drift, U.oklab);
  gl.uniform4f(uni.space, U.offsetX, U.offsetY, 0, 0);
  gl.uniform4f(uni.cursor, 0, 0, 0, 0);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = performance.now();
  let raf = 0, visible = document.visibilityState === 'visible';

  function resize(){
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rw = Math.max(1, Math.round(window.innerWidth * dpr));
    const rh = Math.max(1, Math.round(window.innerHeight * dpr));
    const k = Math.min(1, Math.sqrt(maxPixels / (rw * rh)));
    const w = Math.max(1, Math.round(rw * k)), h = Math.max(1, Math.round(rh * k));
    if(canvas.width !== w || canvas.height !== h){
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  function render(now){
    raf = 0;
    if(!visible) return;
    resize();
    gl.uniform4f(uni.scene, canvas.width, canvas.height, ((now - start) / 1000) * U.timeScale, U.colorCount);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if(!reduced) raf = requestAnimationFrame(render);
  }
  const kick = () => { if(!raf) raf = requestAnimationFrame(render); };

  window.addEventListener('resize', kick);
  document.addEventListener('visibilitychange', () => {
    visible = document.visibilityState === 'visible';
    if(visible) kick(); else if(raf){ cancelAnimationFrame(raf); raf = 0; }
  });
  kick();
  return true;
}