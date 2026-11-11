// Enseignes et inscriptions : chaque enseigne tient dans son cadre (une ligne, deux lignes, abrégé), rien n'est tronqué,
// toutes les lettres existent dans la police pixel (accents, cédille, apostrophe), les enseignes passent devant les
// arbres et les réverbères ; noms des lieux des faits générés (bars, commerces) et plaques de rue.
const { boot, sleep } = require("./harness");
(async () => {
  const { CR, errors } = boot();
  await sleep(150);
  const D = CR.dec, PX = CR.px;
  let fails = 0;
  const fail = (m) => { fails++; if (fails <= 25) console.log("  ÉCHEC", m); };
  // 1. police : accents, cédille, apostrophe
  const m1 = PX.measure("MAISON D'ARRÊT"), m2 = PX.measure("FRANÇAISE"), m3 = PX.measure("TRIBUNAL");
  if (m1.up !== 2 || m1.w !== 53) fail("mesure MAISON D'ARRÊT " + JSON.stringify(m1));
  if (m2.down !== 2) fail("cédille de FRANÇAISE " + JSON.stringify(m2));
  if (m3.up || m3.down || m3.w !== 31) fail("mesure TRIBUNAL " + JSON.stringify(m3));
  for (const ch of "ÉÈÊËÀÂÇÔÎÏÛÙÜ'") { const c = PX.cells(ch)[0]; if (!c || !PX.hasGlyph(c.base) || (ch !== "'" && !c.marks.length)) fail("glyphe " + ch); }
  const dots = []; PX.text({ p: (x, y) => dots.push([x, y]) }, "É", 0, 10, "#fff");
  if (!dots.some((d) => d[1] < 10)) fail("l'accent de É n'est pas dessiné");
  // 2. toutes les scènes, plusieurs largeurs, heures, et des noms de lieux longs
  const BARS = ["Le Balto", "Le Ramey", "Chez Paulette", "Le Saint-Pierre", "L'Été en pente douce", "Le Royal Barbès", "Le Marcadet", "La Mascotte", "Le Clignancourt", "Le Soleil de Montmartre", "L'Olympic", "Le Diplomate", "Le Zinc", "Le Comptoir des Abbesses"];
  const SHOPS = ["Optique Clignancourt", "Le Fournil de Marcadet", "Phone House Barbès", "la pharmacie Ordener", "Bijouterie Lemoine", "Supermarché Franprix", "Agence bancaire Barbès-Rochechouart"];
  const RUES = ["rue Ramey", "rue de la Goutte-d'Or", "boulevard Barbès", "rue Philippe-de-Girard", "avenue de Saint-Ouen", "rue des Poissonniers"];
  const noms = [];
  BARS.forEach((b, i) => noms.push(`devant le bar « ${b} », ${RUES[i % RUES.length]}`, b));
  SHOPS.forEach((b, i) => noms.push(`${b}, ${RUES[(i + 2) % RUES.length]}`));
  RUES.forEach((r) => noms.push(`${r}, à hauteur du numéro 42`, `Carrefour de la Chapelle, ${r}`));
  const all = [];
  D.signLog = all;
  // les arbres et réverbères doivent être dessinés avant les enseignes
  const tree = D.tree, lamp = D.lamp, flush = D.flushSigns;
  let flushed = false;
  D.tree = function () { if (flushed) fail("arbre dessiné après les enseignes"); return tree.apply(this, arguments); };
  D.lamp = function () { if (flushed) fail("réverbère dessiné après les enseignes"); return lamp.apply(this, arguments); };
  D.flushSigns = function (S) { flushed = true; return flush(S); };
  const names = Object.keys(D.SC);
  let scenes = 0;
  for (const name of names) for (const W of [195, 240, 360, 480, 700]) for (const min of [600, 1110, 1380]) {
    const list = name === "faits" || name === "scene_crime" ? noms : [""];
    for (const nom of list) {
      flushed = false;
      try { D.layout(name, W, { min, nom, rain: min === 1110, season: "automne" }); scenes++; } catch (e) { fail(`${name} L=${W} : ${e}`); }
    }
  }
  D.tree = tree; D.lamp = lamp; D.flushSigns = flush; D.signLog = null;
  // 3. chaque enseigne : jamais tronquée, texte dans la plaque, plaque dans son cadre, glyphes connus
  const seen = new Map();
  for (const r of all) {
    if (r.level === "tronque") fail(`${r.scene} L=${r.W} « ${r.txt} » tronquée en ${JSON.stringify(r.lines)}`);
    if (r.text.w > r.plate.w - 2 || r.text.h > r.plate.h) fail(`${r.scene} « ${r.txt} » déborde de sa plaque ${JSON.stringify(r)}`);
    if (r.plate.w > r.frame.w || r.plate.h > r.frame.h || r.plate.x < r.frame.x || r.plate.y < r.frame.y) fail(`${r.scene} « ${r.txt} » sort de son cadre`);
    if (r.W >= (D.ROOM_MIN[r.scene] || 0) && (r.plate.x < 0 || r.plate.x + r.plate.w > r.W)) fail(`${r.scene} L=${r.W} « ${r.txt} » sort de l'image`);
    for (const ln of r.lines) for (const c of PX.cells(ln)) if (!PX.hasGlyph(c.base)) fail(`${r.scene} « ${ln} » : caractère sans glyphe « ${c.base} »`);
    if (/[ÉÈÊÀÇÔÎÛ]/i.test(r.txt) && !r.lines.some((l) => /[ÉÈÊÀÇÔÎÛ]/.test(l.toUpperCase())) && r.level !== "auto" && r.level !== "abrege") fail(`${r.scene} « ${r.txt} » a perdu ses accents`);
    const k = r.scene + " · " + r.txt;
    if (!seen.has(k)) seen.set(k, new Set());
    seen.get(k).add(r.lines.join(" / ") + (r.level === "ligne" || r.level === "lignes" ? "" : ` (${r.level})`));
  }
  // 4. inscriptions sans accent oubliées dans le code des décors
  const fs = require("fs"), path = require("path");
  for (const f of ["decor-ext.js", "decor-salles.js", "decor-int.js", "decor-core.js", "ui-moments.js", "pixel.js"]) {
    const src = fs.readFileSync(path.join(__dirname, "..", "..", "js", f), "utf8");
    for (const w of ["ARRET", "MINISTERE", "REPUBLIQUE", "FRANCAISE", "DETENTION", "MEDICO", "UNITE ", "GARDE A VUE", "REGLEMENT", "MEROGIS", "PENITENTIAIRE"]) if (new RegExp('"[^"]*\\b' + w + '[^"]*"').test(src)) fail(`${f} : inscription sans accent « ${w} »`);
  }
  console.log("scènes composées:", scenes, "enseignes dessinées:", all.length, "enseignes distinctes:", seen.size);
  if (process.env.EXEMPLES) for (const [k, v] of seen) console.log("  " + k + " → " + [...v].slice(0, 4).join(" | "));
  console.log("échecs:", fails);
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})();
