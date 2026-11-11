/* La Permanence — moteur d'image sur la carte graphique (CR.gpu), tranche pilote de la refonte.
   Un plan est peint par le code dans un tampon de matière (G.Mat) : couleur, lumière propre, relief (normale),
   brillance, profondeur. La carte graphique éclaire ensuite chaque pixel source par source en tenant compte du
   relief et de la profondeur, ajoute les reflets du sol, le halo des lumières, le grain, puis agrandit l'image
   en gardant des pixels nets. Rien ne tourne sans WebGL 2 : G.ok() le dit, et l'appelant garde l'ancien rendu
   (c'est le cas des tests jsdom). Aucune image externe. */
(function () {
  const CR = (window.CR = window.CR || {});
  const G = (CR.gpu = {});
  const PL = CR.lum;
  const MAXL = 24;

  let okv = null;
  G.ok = function () {
    if (okv !== null) return okv;
    try {
      const c = document.createElement("canvas"), gl = c.getContext("webgl2");
      okv = !!(gl && typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext);
      if (okv) { const e = gl.getExtension("WEBGL_lose_context"); if (e) e.loseContext(); }
    } catch (e) { okv = false; }
    return okv;
  };

  // ------------------------------------------------------------ tampon de matière
  // c : rouge, vert, bleu, lumière propre — a : normale x, normale y, brillance, profondeur (0 = devant, 255 = au fond)
  function Mat(W, H) {
    this.W = W; this.H = H;
    this.c = new Uint8Array(W * H * 4); this.a = new Uint8Array(W * H * 4);
    this.E = 0; this.nx = 128; this.ny = 128; this.S = 0; this.D = 128; this.ox = 0;
  }
  const M = Mat.prototype, B = PL.Buf.prototype;
  M.set = function (o) {
    if (o.E != null) this.E = o.E;
    if (o.n) { this.nx = Math.round(o.n[0] * 127 + 128); this.ny = Math.round(o.n[1] * 127 + 128); }
    if (o.S != null) this.S = o.S;
    if (o.D != null) this.D = o.D;
    return this;
  };
  M.copy = function (o) { this.c.set(o.c); this.a.set(o.a); };
  M.px = function (x, y, col, al) {
    x = (x | 0) + this.ox; y |= 0;
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return;
    const j = (y * this.W + x) * 4, c = typeof col === "string" ? PL.rgb(col) : col, C = this.c, A = this.a;
    if (al == null || al >= 1) { C[j] = c[0]; C[j + 1] = c[1]; C[j + 2] = c[2]; C[j + 3] = this.E; A[j] = this.nx; A[j + 1] = this.ny; A[j + 2] = this.S; A[j + 3] = this.D; }
    else { const b = 1 - al; C[j] = C[j] * b + c[0] * al; C[j + 1] = C[j + 1] * b + c[1] * al; C[j + 2] = C[j + 2] * b + c[2] * al; C[j + 3] = C[j + 3] * b + this.E * al; }
  };
  // les formes de base sont celles des tampons de CR.lum (elles ne passent que par px)
  ["r", "hl", "vl", "line", "ell", "dith", "noise", "txt", "big"].forEach((k) => { M[k] = B[k]; });
  // volume arrondi : la normale suit la courbure, la lumière en dessine le contour
  M.orb = function (cx, cy, rx, ry, col, k) {
    const nx0 = this.nx, ny0 = this.ny; k = k == null ? 0.85 : k;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const u = (x - cx) / rx, v = (y - cy) / ry, d = u * u + v * v;
      if (d > 1) continue;
      this.nx = Math.round(u * k * 127 + 128); this.ny = Math.round(v * k * 127 + 128);
      this.px(x, y, col);
    }
    this.nx = nx0; this.ny = ny0;
  };
  // bande au relief cylindrique (bras, tuyau) entre deux points
  M.tube = function (x0, y0, x1, y1, w, col) {
    const nx0 = this.nx, ny0 = this.ny, dx = x1 - x0, dy = y1 - y0, len = Math.max(1, Math.hypot(dx, dy)), px = -dy / len, py = dx / len;
    for (let s = 0; s <= len; s += 0.5) for (let q = -w / 2; q <= w / 2; q += 0.5) {
      const u = q / (w / 2);
      this.nx = Math.round(px * u * 0.8 * 127 + 128); this.ny = Math.round(py * u * 0.8 * 127 + 128);
      this.px(Math.round(x0 + dx * s / len + px * q), Math.round(y0 + dy * s / len + py * q), col);
    }
    this.nx = nx0; this.ny = ny0;
  };
  // image déjà dessinée (un portrait) : ses pixels opaques, avec un relief tiré de sa silhouette
  const bevels = new WeakMap();
  function bevel(img) {
    let n = bevels.get(img);
    if (n) return n;
    const w = img.width, h = img.height, d = img.data, a = new Float32Array(w * h), b = new Float32Array(w * h), R = 3;
    for (let i = 0; i < w * h; i++) a[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let k = -R; k <= R; k++) { const xx = x + k; s += xx < 0 || xx >= w ? 0 : a[y * w + xx]; } b[y * w + x] = s / (2 * R + 1); }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let k = -R; k <= R; k++) { const yy = y + k; s += yy < 0 ? 0 : b[Math.min(h - 1, yy) * w + x]; } a[y * w + x] = s / (2 * R + 1); }
    }
    n = new Uint8Array(w * h * 2);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, gx = a[y * w + Math.min(w - 1, x + 1)] - a[y * w + Math.max(0, x - 1)], gy = a[Math.min(h - 1, y + 1) * w + x] - a[Math.max(0, y - 1) * w + x];
      n[i * 2] = Math.max(8, Math.min(248, Math.round(128 - gx * 620))); n[i * 2 + 1] = Math.max(8, Math.min(248, Math.round(128 - gy * 620)));
    }
    bevels.set(img, n);
    return n;
  }
  M.blit = function (img, x0, y0) {
    const w = img.width, h = img.height, d = img.data, n = bevel(img), nx0 = this.nx, ny0 = this.ny, col = [0, 0, 0];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] < 40) continue;
      col[0] = d[i]; col[1] = d[i + 1]; col[2] = d[i + 2];
      this.nx = n[(y * w + x) * 2]; this.ny = n[(y * w + x) * 2 + 1];
      this.px(x0 + x, y0 + y, col);
    }
    this.nx = nx0; this.ny = ny0;
  };
  G.Mat = Mat;

  // ------------------------------------------------------------ programmes
  const VS = `#version 300 es
out vec2 uv;
void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); uv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
  const HEAD = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
`;
  // 1. éclairage : chaque source, selon la distance, le relief et la profondeur
  const FS_LIGHT = HEAD + `
uniform sampler2D uCol, uAux; uniform vec2 uRes; uniform vec3 uAmb; uniform int uN; uniform float uEm;
uniform vec4 uLp[${MAXL}], uLc[${MAXL}], uLd[${MAXL}];
void main() {
  ivec2 ip = ivec2(uv * uRes);
  vec4 c = texelFetch(uCol, ip, 0), a = texelFetch(uAux, ip, 0);
  vec2 nxy = (a.xy * 255.0 - 128.0) / 127.0;
  vec3 n = vec3(nxy, sqrt(max(0.0, 1.0 - dot(nxy, nxy))));
  vec3 P = vec3(vec2(ip) + 0.5, a.a * 255.0);
  vec3 sum = uAmb;
  for (int i = 0; i < ${MAXL}; i++) {
    if (i >= uN) break;
    vec3 L = vec3(uLp[i].xy - P.xy, P.z - uLp[i].z);
    float dist = length(L), f = max(0.0, 1.0 - dist / uLp[i].w); f *= f;
    float nd = clamp((dot(n, L / max(dist, 0.001)) + uLc[i].a) / (1.0 + uLc[i].a), 0.0, 1.0);
    if (uLd[i].z > 0.0) { float cd = dot(normalize(-L.xy + vec2(0.0001)), uLd[i].xy); f *= smoothstep(uLd[i].z - uLd[i].w, uLd[i].z + uLd[i].w, cd); }
    sum += uLc[i].rgb * (f * nd);
  }
  o = vec4(c.rgb * sum + c.rgb * c.a * uEm, a.b);
}`;
  // 2. reflets du sol : ce qui est au-dessus de la ligne de sol se reflète dans les pixels brillants
  const FS_REFL = HEAD + `
uniform sampler2D uLit; uniform vec2 uRes; uniform float uFloor, uK, uT, uWet;
void main() {
  vec4 s = texture(uLit, uv); vec3 col = s.rgb;
  float y = uv.y * uRes.y;
  if (s.a > 0.01 && y > uFloor) {
    float sy = uFloor - (y - uFloor) * uK - 1.0;
    if (sy > 1.0) {
      float wob = sin(y * 1.3 + uT * 1.2) * 0.6 / uRes.x, px = 1.0 / uRes.x, py = 1.0 / uRes.y;
      vec2 q = vec2(uv.x + wob, sy / uRes.y);
      vec3 r = texture(uLit, q).rgb * 0.34 + texture(uLit, q + vec2(px, -py * 2.0)).rgb * 0.18 + texture(uLit, q - vec2(px, py * 2.0)).rgb * 0.18 + texture(uLit, q - vec2(0.0, py * 5.0)).rgb * 0.15 + texture(uLit, q + vec2(0.0, py * 4.0)).rgb * 0.15;
      float fade = 1.0 - (y - uFloor) / (uRes.y - uFloor) * 0.55;
      col += max(r - 0.06, 0.0) * s.a * uWet * fade;
    }
  }
  o = vec4(col, 1.0);
}`;
  // 3. ce qui déborde du blanc, plus la brume autour des sources, à demi-définition
  const FS_BRIGHT = HEAD + `
uniform sampler2D uImg; uniform vec2 uRes; uniform int uN; uniform vec4 uLp[${MAXL}], uLc[${MAXL}], uLh[${MAXL}];
void main() {
  vec3 c = texture(uImg, uv).rgb;
  float m = max(c.r, max(c.g, c.b));
  vec3 b = c * max(0.0, m - 0.82) / max(m, 0.001) * 1.4;
  vec2 P = uv * uRes;
  for (int i = 0; i < ${MAXL}; i++) {
    if (i >= uN) break;
    if (uLh[i].x <= 0.0) continue;
    float g = max(0.0, 1.0 - length(uLp[i].xy - P) / uLh[i].y);
    b += uLc[i].rgb * (g * g * uLh[i].x);
  }
  o = vec4(b, 1.0);
}`;
  const FS_BLUR = HEAD + `
uniform sampler2D uImg; uniform vec2 uDir;
void main() {
  vec3 c = texture(uImg, uv).rgb * 0.227027;
  c += (texture(uImg, uv + uDir * 1.384615).rgb + texture(uImg, uv - uDir * 1.384615).rgb) * 0.316216;
  c += (texture(uImg, uv + uDir * 3.230769).rgb + texture(uImg, uv - uDir * 3.230769).rgb) * 0.070270;
  o = vec4(c, 1.0);
}`;
  // 4. sortie : agrandissement à pixels nets, halo, courbe, teinte, vignette, grain, fondu
  const FS_OUT = HEAD + `
uniform sampler2D uImg, uBloom; uniform vec2 uRes, uOut; uniform float uT, uGrain, uVig, uFade, uBloomK; uniform vec3 uTint;
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main() {
  vec2 p = vec2(uv.x, 1.0 - uv.y), tp = p * uRes, f = fract(tp), sc = uOut / uRes;
  vec2 q = clamp(f * sc, 0.0, 0.5) + clamp((f - 1.0) * sc + 0.5, 0.0, 0.5);
  vec3 col = texture(uImg, (floor(tp) + q) / uRes).rgb + texture(uBloom, p).rgb * uBloomK;
  vec3 hi = 0.72 + 0.28 * (1.0 - exp(-(col - 0.72) / 0.28));
  col = mix(col, hi, step(0.72, col));
  float lum = dot(col, vec3(0.3, 0.59, 0.11));
  col = mix(col, col * uTint, 1.0 - lum);
  vec2 v = p - vec2(0.5, 0.52);
  col *= 1.0 - uVig * pow(min(1.0, dot(v, v) * 2.1), 1.5);
  col += (h21(floor(tp) + floor(uT * 14.0) * 7.13) - 0.5) * uGrain;
  o = vec4(col * (1.0 - uFade), 1.0);
}`;

  // ------------------------------------------------------------ moteur
  G.Renderer = function (canvas) {
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "low-power", preserveDrawingBuffer: false });
    if (!gl || !(gl instanceof WebGL2RenderingContext)) return null;
    const hdr = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");
    if (hdr) gl.getExtension("OES_texture_float_linear");
    function prog(fs) {
      const p = gl.createProgram();
      for (const [type, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]]) { const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error("gpu : " + gl.getShaderInfoLog(sh)); gl.attachShader(p, sh); }
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("gpu : " + gl.getProgramInfoLog(p));
      const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const nm = gl.getActiveUniform(p, i).name.replace(/\[0\]$/, ""); u[nm] = gl.getUniformLocation(p, nm); }
      return { p, u };
    }
    const P = { light: prog(FS_LIGHT), refl: prog(FS_REFL), bright: prog(FS_BRIGHT), blur: prog(FS_BLUR), out: prog(FS_OUT) };
    const vao = gl.createVertexArray();
    function tex(w, h, float, linear, data) {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      if (float) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null); else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data || null);
      const f = linear ? gl.LINEAR : gl.NEAREST;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }
    function target(w, h) { const t = tex(w, h, hdr, true), f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return { t, f, w, h }; }
    let W = 0, H = 0, tCol, tAux, lit, lit2, b1, b2;
    function size(w, h) {
      if (w === W && h === H) return;
      [tCol, tAux].forEach((t) => t && gl.deleteTexture(t));
      [lit, lit2, b1, b2].forEach((x) => { if (x) { gl.deleteTexture(x.t); gl.deleteFramebuffer(x.f); } });
      W = w; H = h; tCol = tex(W, H, false, false); tAux = tex(W, H, false, false);
      lit = target(W, H); lit2 = target(W, H); b1 = target(W >> 1, H >> 1); b2 = target(W >> 1, H >> 1);
    }
    const lp = new Float32Array(MAXL * 4), lc = new Float32Array(MAXL * 4), ld = new Float32Array(MAXL * 4), lh = new Float32Array(MAXL * 4);
    function pass(pr, tgt, binds) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, tgt ? tgt.f : null);
      gl.viewport(0, 0, tgt ? tgt.w : canvas.width, tgt ? tgt.h : canvas.height);
      gl.useProgram(pr.p);
      binds.forEach(([name, t], i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(pr.u[name], i); });
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    const R = { gl, hdr };
    // o : amb [r,g,b], lights [{ x, y, d, r, c [r,g,b], i, wrap, dir [dx,dy], cone, soft, haze, hr }], floorY, reflK, wet,
    //     t, bloom, grain, vig, fade, tint [r,g,b], em
    R.draw = function (mat, o) {
      size(mat.W, mat.H);
      gl.bindVertexArray(vao); gl.disable(gl.BLEND); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.bindTexture(gl.TEXTURE_2D, tCol); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, mat.c);
      gl.bindTexture(gl.TEXTURE_2D, tAux); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, mat.a);
      const Ls = (o.lights || []).filter((l) => l.i > 0.002).slice(0, MAXL), n = Ls.length;
      Ls.forEach((l, i) => {
        const k = i * 4;
        lp[k] = l.x; lp[k + 1] = l.y; lp[k + 2] = l.d == null ? 0 : l.d; lp[k + 3] = l.r;
        lc[k] = l.c[0] * l.i; lc[k + 1] = l.c[1] * l.i; lc[k + 2] = l.c[2] * l.i; lc[k + 3] = l.wrap == null ? 0.3 : l.wrap;
        const dl = l.dir ? Math.hypot(l.dir[0], l.dir[1]) || 1 : 1;
        ld[k] = l.dir ? l.dir[0] / dl : 0; ld[k + 1] = l.dir ? l.dir[1] / dl : 0; ld[k + 2] = l.dir ? (l.cone == null ? 0.7 : l.cone) : 0; ld[k + 3] = l.soft == null ? 0.12 : l.soft;
        lh[k] = l.haze || 0; lh[k + 1] = l.hr || l.r * 0.4;
      });
      let u = P.light.u;
      gl.useProgram(P.light.p);
      gl.uniform2f(u.uRes, W, H); gl.uniform3fv(u.uAmb, o.amb || [0.2, 0.2, 0.2]); gl.uniform1i(u.uN, n); gl.uniform1f(u.uEm, o.em == null ? 1.7 : o.em);
      gl.uniform4fv(u.uLp, lp); gl.uniform4fv(u.uLc, lc); gl.uniform4fv(u.uLd, ld);
      pass(P.light, lit, [["uCol", tCol], ["uAux", tAux]]);
      u = P.refl.u; gl.useProgram(P.refl.p);
      gl.uniform2f(u.uRes, W, H); gl.uniform1f(u.uFloor, o.floorY == null ? H : o.floorY); gl.uniform1f(u.uK, o.reflK || 1.6); gl.uniform1f(u.uT, o.t || 0); gl.uniform1f(u.uWet, o.wet == null ? 1 : o.wet);
      pass(P.refl, lit2, [["uLit", lit.t]]);
      u = P.bright.u; gl.useProgram(P.bright.p);
      gl.uniform2f(u.uRes, W, H); gl.uniform1i(u.uN, n); gl.uniform4fv(u.uLp, lp); gl.uniform4fv(u.uLc, lc); gl.uniform4fv(u.uLh, lh);
      pass(P.bright, b1, [["uImg", lit2.t]]);
      u = P.blur.u; gl.useProgram(P.blur.p);
      for (const st of [1, 2.2]) {
        gl.uniform2f(u.uDir, st / b1.w, 0); pass(P.blur, b2, [["uImg", b1.t]]);
        gl.uniform2f(u.uDir, 0, st / b1.h); pass(P.blur, b1, [["uImg", b2.t]]);
      }
      u = P.out.u; gl.useProgram(P.out.p);
      gl.uniform2f(u.uRes, W, H); gl.uniform2f(u.uOut, canvas.width, canvas.height); gl.uniform1f(u.uT, o.t || 0);
      gl.uniform1f(u.uGrain, o.grain == null ? 0.03 : o.grain); gl.uniform1f(u.uVig, o.vig == null ? 0.4 : o.vig); gl.uniform1f(u.uFade, o.fade || 0); gl.uniform1f(u.uBloomK, o.bloom == null ? 1 : o.bloom);
      gl.uniform3fv(u.uTint, o.tint || [1, 1, 1]);
      pass(P.out, null, [["uImg", lit2.t], ["uBloom", b1.t]]);
    };
    R.dispose = function () { const e = gl.getExtension("WEBGL_lose_context"); if (e) e.loseContext(); };
    return R;
  };
})();
