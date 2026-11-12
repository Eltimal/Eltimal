// Planche d'un extrait de vidéosurveillance (js/video.js), rendue dans Node sans navigateur.
// node tools/shotvideo.js [graine] [mode ir|soir|jour] [temps,séparés,par,virgules] [échelle] [grainetenues]
// Réglages de l'extrait en JSON : OPTS='{"objet":"telephone","violence":false}'
// Image : tools/out/video-<graine>-<mode>.png ; affiche aussi ce que l'image permet (lisible()).
const fs = require("fs"), path = require("path"), zlib = require("zlib");
require(path.join(__dirname, "../../js/video.js"));
const V = globalThis.CR.video;

function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

const graine = process.argv[2] || "1", mode = process.argv[3] || "ir";
const S = V.extrait(Object.assign({ graine, mode, grainetenues: process.argv[6] || undefined }, process.env.OPTS ? JSON.parse(process.env.OPTS) : {}));
const temps = process.argv[4] ? process.argv[4].split(",").map(Number) : [S.scn.tG - 2.5, S.scn.tG - 0.6, S.scn.tG + 0.35, S.scn.tG + 0.9, S.scn.tG + 1.6, S.scn.tG + 2.6, S.scn.tG + 6, S.scn.tG + 9];
const sc = +(process.argv[5] || 2), cols = 2, rows = Math.ceil(temps.length / cols), W = V.W * sc, H = V.H * sc, gap = 4;
const OW = cols * W + (cols + 1) * gap, OH = rows * H + (rows + 1) * gap, out = new Uint8ClampedArray(OW * OH * 4).fill(30);
const t0 = Date.now();
temps.forEach((t, k) => {
  const img = S.render(t), ox = gap + (k % cols) * (W + gap), oy = gap + Math.floor(k / cols) * (H + gap);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const s = (Math.floor(y / sc) * V.W + Math.floor(x / sc)) * 4, d = ((oy + y) * OW + ox + x) * 4;
    out[d] = img[s]; out[d + 1] = img[s + 1]; out[d + 2] = img[s + 2]; out[d + 3] = 255;
  }
});
const ms = (Date.now() - t0) / temps.length;
const dir = path.join(__dirname, "out"); fs.mkdirSync(dir, { recursive: true });
const f = path.join(dir, `video-${graine}-${mode}.png`);
fs.writeFileSync(f, png(OW, OH, out));
console.log(f, `${ms.toFixed(1)} ms par image, ${S.fps} images/s, sauts ${JSON.stringify(S.sauts.map((s) => s.map((x) => +x.toFixed(1))))}, fuite ${S.scn.fuite}`);
const L = S.lisible();
for (const id of Object.keys(L)) console.log(id, L[id].role, "|", L[id].reel, "→", L[id].image, "|", L[id].visage, L[id].tetePx + " px");
for (const m of S.moments) console.log(m.h, m.txt);
