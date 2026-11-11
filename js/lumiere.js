/* La Permanence — moteur de lumière (CR.lum).
   Le décor est peint en basse résolution (480 × 150) dans des tampons de matière : couleur, part de lumière propre
   (enseignes, fenêtres), part de lumière reçue. Chaque image, le moteur éclaire la scène source par source,
   ajoute les reflets de la chaussée mouillée, puis le halo des lumières. Aucune image externe. */
(function () {
  const CR = (window.CR = window.CR || {});
  const PL = (CR.lum = {});
  const hc = new Map();
  function rgb(h) { let v = hc.get(h); if (!v) { const n = parseInt(h.slice(1), 16); v = [n >> 16, (n >> 8) & 255, n & 255]; hc.set(h, v); } return v; }
  const h01 = (i) => { const r = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return r - Math.floor(r); };
  const h2 = (x, y) => h01(x * 37.761 + y * 66.265 + 1.37);
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const hexOf = (c) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  Object.assign(PL, { rgb, h01, h2, mix, hexOf, rng });

  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  PL.bayer = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

  // ------------------------------------------------------------ polices
  const F3 = { A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111", F: "111100110100100", G: "011100101101011", H: "101101111101101", I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111", M: "101111111101101", N: "111101101101101", O: "111101101101111", P: "110101110100100", Q: "111101101111001", R: "110101110101101", S: "011100010001110", T: "111010010010010", U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101", Y: "101101010010010", Z: "111001010100111", "0": "111101101101111", "1": "010110010010111", "2": "110001010100111", "3": "110001010001110", "4": "101101111001001", "5": "111100110001110", "6": "011100111101111", "7": "111001010010010", "8": "111101111101111", "9": "111101111001110", "-": "000000111000000", ".": "000000000000010", " ": "000000000000000", "'": "010010000000000" };
  const F5 = { A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"], B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"], C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"], E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"], H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"], I: ["111", "010", "010", "010", "010", "010", "111"], L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"], M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"], N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"], O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"], P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"], R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"], S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"], T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"], Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"], " ": ["00", "00", "00", "00", "00", "00", "00"] };

  // ------------------------------------------------------------ tampon de matière
  function Buf(W, H) {
    this.W = W; this.H = H; const n = W * H;
    this.c = new Uint8ClampedArray(n * 3); this.e = new Uint8Array(n); this.l = new Uint8Array(n); this.z = new Uint8Array(n);
    this.E = 0; this.L = 255; this.Z = 80; this.ox = 0; this.G = 0;
  }
  const B = Buf.prototype;
  B.mat = function (Z, L, E) { this.Z = Z; this.L = L == null ? 255 : L; this.E = E || 0; return this; };
  B.copy = function (o) { this.c.set(o.c); this.e.set(o.e); this.l.set(o.l); this.z.set(o.z); };
  B.px = function (x, y, col, a) {
    x = (x | 0) + this.ox; y |= 0;
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return;
    const i = y * this.W + x, j = i * 3, c = typeof col === "string" ? rgb(col) : col;
    if (this.G && this.z[i] && this.z[i] <= this.G) return;
    if (a == null || a >= 1) { this.c[j] = c[0]; this.c[j + 1] = c[1]; this.c[j + 2] = c[2]; this.e[i] = this.E; this.l[i] = this.L; this.z[i] = this.Z; }
    else {
      const b = 1 - a;
      this.c[j] = this.c[j] * b + c[0] * a; this.c[j + 1] = this.c[j + 1] * b + c[1] * a; this.c[j + 2] = this.c[j + 2] * b + c[2] * a;
      this.e[i] = this.e[i] * b + this.E * a; this.l[i] = this.l[i] * b + this.L * a;
    }
  };
  B.r = function (x, y, w, h, col, a) { x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h); const c = typeof col === "string" ? rgb(col) : col; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c, a); };
  B.hl = function (x, y, w, col, a) { this.r(x, y, w, 1, col, a); };
  B.vl = function (x, y, h, col, a) { this.r(x, y, 1, h, col, a); };
  B.line = function (x0, y0, x1, y1, col, a) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
    for (let k = 0; k < 2000; k++) { this.px(x0, y0, col, a); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  };
  B.ell = function (cx, cy, rx, ry, col, a) { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const u = (x - cx) / rx, v = (y - cy) / ry; if (u * u + v * v <= 1) this.px(x, y, col, a); } };
  B.dith = function (x, y, w, h, col, dens, a) { const c = typeof col === "string" ? rgb(col) : col; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (PL.bayer(x + i, y + j) < dens) this.px(x + i, y + j, c, a); };
  B.noise = function (x, y, w, h, col, dens, seed, a) { const c = typeof col === "string" ? rgb(col) : col; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (h2(x + i + (seed || 0) * 13, y + j) < dens) this.px(x + i, y + j, c, a); };
  B.txt = function (s, x, y, col, a) { let cx = x; for (const ch of String(s).toUpperCase()) { const g = F3[ch] || F3[" "]; for (let k = 0; k < 15; k++) if (g[k] === "1") this.px(cx + (k % 3), y + ((k / 3) | 0), col, a); cx += 4; } return cx - x - 1; };
  B.big = function (s, x, y, col, a) { let cx = x; for (const ch of String(s).toUpperCase()) { const g = F5[ch] || F5[" "]; const w = g[0].length; for (let j = 0; j < 7; j++) for (let i = 0; i < w; i++) if (g[j][i] === "1") this.px(cx + i, y + j, col, a); cx += w + 1; } return cx - x - 1; };
  PL.bigW = (s) => { let w = 0; for (const ch of s.toUpperCase()) w += (F5[ch] || F5[" "])[0].length + 1; return w - 1; };
  PL.Buf = Buf;

  // Halo pour un dessin déjà fait (la carte) : les pixels clairs de `low` bavent en lumière sur `ctx`.
  const HC = {};
  PL.halo = function (low, ctx, w, h, force, seuil) {
    const W = low.width, H = low.height, key = W + "x" + H;
    let c = HC[key];
    if (!c) { const bw = W >> 1, bh = H >> 1, cv = document.createElement("canvas"); cv.width = bw; cv.height = bh; const x = cv.getContext("2d"); c = HC[key] = { bw, bh, cv, x, img: x.createImageData(bw, bh), a: new Float32Array(bw * bh * 3), b: new Float32Array(bw * bh * 3) }; }
    let src; try { src = low.getContext("2d").getImageData(0, 0, W, H).data; } catch (e) { return; }
    const { bw, bh, a, b } = c, th = seuil || 150; a.fill(0);
    for (let y = 0; y < bh * 2; y++) for (let x = 0; x < bw * 2; x++) { const i = (y * W + x) * 4, r = src[i], g = src[i + 1], bl = src[i + 2], mx = Math.max(r, g, bl); if (mx <= th) continue; const k = (mx - th) / mx * 0.25 * force, q = ((y >> 1) * bw + (x >> 1)) * 3; a[q] += r * k; a[q + 1] += g * k; a[q + 2] += bl * k; }
    const rad = 3;
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < bh; y++) for (let ch = 0; ch < 3; ch++) { let s = 0; for (let x = -rad; x <= rad; x++) s += a[(y * bw + Math.max(0, Math.min(bw - 1, x))) * 3 + ch]; for (let x = 0; x < bw; x++) { b[(y * bw + x) * 3 + ch] = s / (2 * rad + 1); s += a[(y * bw + Math.min(bw - 1, x + rad + 1)) * 3 + ch] - a[(y * bw + Math.max(0, x - rad)) * 3 + ch]; } }
      for (let x = 0; x < bw; x++) for (let ch = 0; ch < 3; ch++) { let s = 0; for (let y = -rad; y <= rad; y++) s += b[(Math.max(0, Math.min(bh - 1, y)) * bw + x) * 3 + ch]; for (let y = 0; y < bh; y++) { a[(y * bw + x) * 3 + ch] = s / (2 * rad + 1); s += b[(Math.min(bh - 1, y + rad + 1) * bw + x) * 3 + ch] - b[(Math.max(0, y - rad) * bw + x) * 3 + ch]; } }
    }
    const d = c.img.data; for (let i = 0, j = 0; i < bw * bh; i++, j += 3) { d[i * 4] = a[j]; d[i * 4 + 1] = a[j + 1]; d[i * 4 + 2] = a[j + 2]; d[i * 4 + 3] = 255; }
    c.x.putImageData(c.img, 0, 0);
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.globalCompositeOperation = "lighter"; ctx.drawImage(c.cv, 0, 0, w, h); ctx.restore();
  };

  // ------------------------------------------------------------ moteur
  PL.Renderer = function (W, H) {
    const n = W * H;
    const R = { W, H, stat: new Buf(W, H), work: new Buf(W, H), out: new Float32Array(n * 3), lm: new Float32Array(n * 3), hz: new Float32Array(n * 3), wet: new Float32Array(n) };
    const low = document.createElement("canvas"); low.width = W; low.height = H;
    const lctx = low.getContext("2d"), img = lctx.createImageData(W, H);
    const bw = W >> 1, bh = H >> 1, blo = document.createElement("canvas"); blo.width = bw; blo.height = bh;
    const bctx = blo.getContext("2d"), bimg = bctx.createImageData(bw, bh);
    const bl = new Float32Array(bw * bh * 3), bt = new Float32Array(bw * bh * 3);
    const vig = new Float32Array(n);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const u = (x - W / 2) / (W / 2), v = (y - H * 0.55) / (H * 0.75); vig[y * W + x] = 1 - 0.3 * Math.pow(Math.min(1, u * u * 0.8 + v * v * 0.6), 1.6); }

    function addLight(dst, hzb, Lt, k) {
      const r = Lt.r, x0 = Math.max(0, Math.floor(Lt.x - r)), x1 = Math.min(W - 1, Math.ceil(Lt.x + r)), y0 = Math.max(0, Math.floor(Lt.y - r)), y1 = Math.min(H - 1, Math.ceil(Lt.y + r));
      const I = Lt.i * (k == null ? 1 : k), c = Lt.c, hz = (Lt.haze || 0) * (k == null ? 1 : k), hr = Lt.hr || r * 0.55;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const dx = x - Lt.x, dy = y - Lt.y; let d = Math.sqrt(dx * dx + dy * dy);
        let f = 1 - d / r; if (f <= 0) continue; f = f * f;
        if (Lt.down && dy < 0) f *= Math.max(0, 1 + dy / (Lt.up || 7));
        if (Lt.dir) { const dd = dx * Lt.dir; if (dd < 0) f *= Math.max(0, 1 + dd / 5); else f *= 1 + Math.min(1, dd / r) * 0.6; }
        const j = (y * W + x) * 3, v = f * I;
        dst[j] += c[0] * v; dst[j + 1] += c[1] * v; dst[j + 2] += c[2] * v;
        if (hz) { let g = 1 - d / hr; if (g > 0) { g = g * g * hz * 255; hzb[j] += c[0] * g; hzb[j + 1] += c[1] * g; hzb[j + 2] += c[2] * g; } }
      }
    }
    R.bake = function (lights) { R.lm.fill(0); R.hz.fill(0); for (const Lt of lights) addLight(R.lm, R.hz, Lt); };

    const dl = new Float32Array(n * 3), dh = new Float32Array(n * 3);
    R.frame = function (o) {
      // o : amb, dyn (lumières mobiles), wet (0..1), t, YR (haut de la chaussée), YB (pied des façades), mist [r,g,b,k]
      const Wk = R.work, out = R.out, amb = o.amb, lm = R.lm;
      let useDyn = false;
      if (o.dyn && o.dyn.length) { dl.fill(0); dh.fill(0); for (const Lt of o.dyn) addLight(dl, dh, Lt); useDyn = true; }
      for (let i = 0, j = 0; i < n; i++, j += 3) {
        const L = Wk.l[i] / 255, E = Wk.e[i] / 255;
        let lr = amb[0] + lm[j], lg = amb[1] + lm[j + 1], lb = amb[2] + lm[j + 2];
        if (useDyn) { lr += dl[j]; lg += dl[j + 1]; lb += dl[j + 2]; }
        out[j] = Wk.c[j] * (lr * L + E); out[j + 1] = Wk.c[j + 1] * (lg * L + E); out[j + 2] = Wk.c[j + 2] * (lb * L + E);
      }
      // reflets : chaussée (z = 30) et trottoir (z = 60) ; traînées verticales, frémissement léger
      const wet = o.wet, t = o.t || 0;
      for (let y = o.YB; y < H; y++) {
        const road = y >= o.YR, base = road ? o.YR : o.YB, k = road ? 3.0 : 2.0;
        const sy = Math.round(base - 1 - (y - base) * k - (road ? 5 : 0));
        if (sy < 2) continue;
        const wob = Math.round(Math.sin(y * 1.1 + t * 1.6) * 0.9);
        const fade = road ? 1 - (y - base) / (H - base) * 0.3 : 0.55;
        const rows = [sy, Math.max(0, sy - 1), Math.max(0, sy - 2), Math.max(0, sy - 4), Math.max(0, sy - 6)];
        for (let x = 0; x < W; x++) {
          const i = y * W + x, z = Wk.z[i];
          if (z !== (road ? 30 : 60)) continue;
          const kk = (0.08 + R.wet[i] * 0.92) * wet * fade;
          if (kk <= 0.01) continue;
          const sx = Math.max(1, Math.min(W - 2, x + wob)), j = i * 3;
          let r = 0, g = 0, b = 0;
          for (let q = 0; q < 5; q++) { const s = (rows[q] * W + sx) * 3, wq = q < 3 ? 0.26 : 0.11; r += (out[s] * 0.6 + out[s - 3] * 0.2 + out[s + 3] * 0.2) * wq; g += (out[s + 1] * 0.6 + out[s - 2] * 0.2 + out[s + 4] * 0.2) * wq; b += (out[s + 2] * 0.6 + out[s - 1] * 0.2 + out[s + 5] * 0.2) * wq; }
          out[j] += Math.max(0, r - 22) * kk * 1.15; out[j + 1] += Math.max(0, g - 22) * kk * 1.15; out[j + 2] += Math.max(0, b - 22) * kk * 1.15;
        }
      }
      // sortie + passe lumineuse pour le halo
      const d = img.data, m = o.mist;
      bl.fill(0);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x, j = i * 3, v = vig[i];
        let r = out[j] * v, g = out[j + 1] * v, b = out[j + 2] * v;
        if (m) { r += (m[0] - r) * m[3]; g += (m[1] - g) * m[3]; b += (m[2] - b) * m[3]; }
        const q = ((y >> 1) * bw + (x >> 1)) * 3;
        if (y >> 1 < bh && x >> 1 < bw) {
          const mx = Math.max(r, g, b), ex = mx > 170 ? (mx - 170) / mx * 0.25 * o.glow : 0;
          bl[q] += r * ex + R.hz[j] * 0.25 * o.glow + (useDyn ? dh[j] * 0.25 : 0); bl[q + 1] += g * ex + R.hz[j + 1] * 0.25 * o.glow + (useDyn ? dh[j + 1] * 0.25 : 0); bl[q + 2] += b * ex + R.hz[j + 2] * 0.25 * o.glow + (useDyn ? dh[j + 2] * 0.25 : 0);
        }
        if (r > 200) r = 200 + (r - 200) * 55 / (r - 200 + 55); if (g > 200) g = 200 + (g - 200) * 55 / (g - 200 + 55); if (b > 200) b = 200 + (b - 200) * 55 / (b - 200 + 55);
        const k4 = i * 4; d[k4] = r; d[k4 + 1] = g; d[k4 + 2] = b; d[k4 + 3] = 255;
      }
      lctx.putImageData(img, 0, 0);
      // flou du halo (deux passes de boîte séparables)
      const rad = 4;
      for (let pass = 0; pass < 2; pass++) {
        for (let y = 0; y < bh; y++) for (let c = 0; c < 3; c++) { let s = 0; for (let x = -rad; x <= rad; x++) s += bl[(y * bw + Math.max(0, Math.min(bw - 1, x))) * 3 + c]; for (let x = 0; x < bw; x++) { bt[(y * bw + x) * 3 + c] = s / (2 * rad + 1); s += bl[(y * bw + Math.min(bw - 1, x + rad + 1)) * 3 + c] - bl[(y * bw + Math.max(0, x - rad)) * 3 + c]; } }
        for (let x = 0; x < bw; x++) for (let c = 0; c < 3; c++) { let s = 0; for (let y = -rad; y <= rad; y++) s += bt[(Math.max(0, Math.min(bh - 1, y)) * bw + x) * 3 + c]; for (let y = 0; y < bh; y++) { bl[(y * bw + x) * 3 + c] = s / (2 * rad + 1); s += bt[(Math.min(bh - 1, y + rad + 1) * bw + x) * 3 + c] - bt[(Math.max(0, y - rad) * bw + x) * 3 + c]; } }
      }
      const bd = bimg.data;
      for (let i = 0, j = 0; i < bw * bh; i++, j += 3) { bd[i * 4] = bl[j]; bd[i * 4 + 1] = bl[j + 1]; bd[i * 4 + 2] = bl[j + 2]; bd[i * 4 + 3] = 255; }
      bctx.putImageData(bimg, 0, 0);
    };
    R.present = function (ctx, w, h) {
      ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = false;
      ctx.drawImage(low, 0, 0, w, h);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"; ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(blo, 0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    };
    return R;
  };
})();
