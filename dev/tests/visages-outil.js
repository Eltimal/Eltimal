// Outil commun aux tests des visages : rend un portrait dans jsdom et rend l'empreinte de ses pixels.
// jsdom n'a pas de canevas : le moteur écrit dans un tableau obtenu par createImageData, que l'on capture ici.
exports.brancher = function (w) {
  let dernier = null;
  const noop = () => {};
  w.HTMLCanvasElement.prototype.getContext = function () {
    return new Proxy({}, { get: (t, k) => {
      if (k === "createImageData") return (W, H) => (dernier = { data: new Uint8ClampedArray(W * H * 4), width: W, height: H });
      if (k === "getImageData") return (x, y, W, H) => ({ data: new Uint8ClampedArray((W || 1) * (H || 1) * 4), width: W, height: H });
      if (k === "measureText") return () => ({ width: 5 });
      if (k === "canvas") return { width: 256, height: 96 };
      return k in t ? t[k] : noop;
    }, set: (t, k, v) => { t[k] = v; return true; } });
  };
  const empreinte = (d) => { let h = 2166136261; for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  // pixels du portrait (64 × 64 × 4) ; chaque appel force un nouveau dessin (expression distincte du cache par un look cloné)
  const pixels = (CR, look, expr) => { dernier = null; CR.px.portrait(Object.assign({}, look, { _t: Math.random() }), expr || "neutral"); return dernier ? dernier.data : null; };
  return { pixels, empreinte, rendre: (CR, look, expr) => { const d = pixels(CR, look, expr); return d ? empreinte(d) : null; } };
};
// les looks de référence d'avant la 1.3.0 : tirés par graine, comme le jeu les tirait
exports.looksAnciens = function (CR) {
  const out = [];
  for (let i = 0; i < 160; i++) out.push(["graine" + i, CR.px.lookFrom("ref" + i, { age: 19 + (i * 7) % 60, g: i % 3 ? "m" : "f" })]);
  for (let i = 0; i < 40; i++) out.push(["robe" + i, CR.px.lookFrom("joueur" + i * 7919, { outfit: "robe", age: 28 })]);
  for (const a of CR.ACTEURS || []) out.push(["acteur:" + a.id, CR.px.acteurLook(a)]);
  return out;
};
exports.EXPRS = ["neutral", "talk", "smile", "angry", "cry"];
