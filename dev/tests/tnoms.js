// 1.3.0 « Les visages et les noms » — la source unique des noms (js/noms.js).
// Sur 3 000 personnes tirées : au moins dix fois plus d'identités possibles qu'avant (70 noms × 86 prénoms), moins de 2 %
// de doublons. Sur 1 000 affaires de la version 5 : aucun prénom hors de la génération de la personne (ni du sexe), liens de
// famille cohérents (même nom, ou nom de naissance pour l'épouse), jamais deux personnes du même nom complet, ni le nom
// d'un personnage récurrent ou du joueur donné à un inconnu, jamais un prénom égal au nom. Aucune liste de noms de
// personnes ne reste hors de la source commune. Les affaires de la version 4 gardent leurs noms (tanciens.js).
// Usage : node tests/tnoms.js [affaires, défaut 1000]
const fs = require("fs"), path = require("path");
const { boot, sleep } = require("./harness");
(async () => {
  let echecs = 0; const vus = new Map();
  const ok = (c, k, d) => { if (c) return; echecs++; const n = (vus.get(k) || 0) + 1; vus.set(k, n); if (n <= 4) console.log("  ✗ " + k + (d !== undefined ? " — " + String(typeof d === "string" ? d : JSON.stringify(d)).slice(0, 300) : "")); };
  const { CR, errors } = boot(); await sleep(150);
  const N = CR.NOMS, M = CR.MONDE, G = CR.GEN2;
  const NB = +(process.argv[2] || 1000);

  // ---------- identités possibles et doublons (tirage réel des personnes, version 5)
  const I = N.identitesPossibles(), avant = 70 * (50 + 36);
  ok(I.meme >= 10 * avant, "pas dix fois plus d'identités possibles", { avant, apres: I.meme });
  console.log(`  identités possibles : ${avant} → ${I.meme} dans un même ensemble (× ${(I.meme / avant).toFixed(1)}), ${I.mixte} avec les assemblages mixtes ; ${I.noms} noms de famille, ${I.prenoms} prénoms`);
  { const r = CR.seeded("tnoms"), vu = new Set(); let dbl = 0;
    M.vCour = 5; M.ctx = null;
    try { for (let i = 0; i < 3000; i++) { const P = M.personne(r, { minAge: 18, maxAge: 85, pf: 0.45 }); const k = P.prenom + " " + P.nom; if (vu.has(k)) dbl++; vu.add(k); } } finally { M.vCour = null; }
    ok(dbl / 3000 < 0.02, "trop de doublons sur 3 000 personnes", dbl);
    console.log(`  doublons sur 3 000 personnes : ${dbl} (${(dbl / 30).toFixed(2)} %)`); }

  // ---------- 1 000 affaires de la version 5
  const s = CR.newGame({ prenom: "Camille", nom: "Martin", mode: "carriere", seed: 23 }); s.pending = [];
  const res = new Set(N.reserves());
  let affaires = 0, personnes = 0, familles = 0, mixtes = 0, pens = 0;
  const GENRES = ["gav", "copj", "info", "pc", "al", "ci", "op", "info"];
  for (let i = 0; i < NB; i++) {
    let p; try { p = G.params(s, GENRES[i % GENRES.length], {}); } catch (e) { continue; }
    const t = p.t; affaires++;
    ok(t.ver === CR.GEN2.VERSION, "une affaire nouvelle n'est pas de la version courante", t.ver);
    const ps = ["A", "V", "P", "T", "T2", "C2", "R", "D"].map((k) => [k, t[k]]).filter(([, x]) => x && x.prenom);
    const complets = new Map();
    for (const [k, P] of ps) {
      personnes++;
      const nom = `${P.prenom} ${P.nom}`;
      ok(P.prenom !== P.nom && !P.nom.split(/[- ]/).includes(P.prenom), "prénom égal au nom", nom);
      ok(!complets.has(nom), "deux personnes du même nom complet dans une affaire", `${nom} (${complets.get(nom)} et ${k})`); complets.set(nom, k);
      ok(!res.has(nom) && !(res.has("nom:" + P.nom) && !P.rel), "un inconnu porte le nom d'un personnage récurrent", nom);
      ok(P.nom !== "Martin" && P.nomNaiss !== "Martin", "un inconnu porte le nom du joueur", nom);
      // génération et sexe du prénom
      const d = N.decennie(2026 - P.age), dd = N.decenniesDe(P.prenom), gg = N.genreDe(P.prenom);
      ok(dd, "prénom hors de la source commune", nom);
      if (dd) ok(d >= dd[0] - 1 && d <= dd[1] + 1, "prénom à plus d'une génération de l'âge", `${nom}, ${P.age} ans (prénom donné dans les années ${1900 + dd[0] * 10}-${1909 + dd[1] * 10})`);
      ok(!gg || gg === "e" || gg === P.g, "prénom d'un autre sexe que la personne", `${nom} (${P.g})`);
      if (P.pens && P.ens && P.pens !== P.ens) mixtes++; if (P.pens) pens++;
    }
    // la famille porte le même nom
    for (const [k, P] of ps) if (P.rel && P.rel !== "conjoint") { familles++; const ref = k === "P" ? t.V : t.A; ok(ref && (P.nom === ref.nom || P.nom === ref.nomNaiss || P.nom === t.A.nom), "un parent, un enfant, un frère ou une sœur ne porte pas le nom de la famille", `${P.prenom} ${P.nom} (${P.rel}) / ${ref && ref.nom}`); }
    const fam = t.vie && t.vie.fam, C = t[t.client] || t.A;
    if (fam && C && /^(père|mère|frère|sœur)$/.test(fam.rel)) { familles++; ok(fam.nom === C.nom, "le proche du client ne porte pas son nom", `${fam.prenom} ${fam.nom} (${fam.rel}) / ${C.nom}`); }
    if (fam) { const d = N.decennie(2026 - fam.age), dd = N.decenniesDe(fam.prenom); if (dd) ok(d >= dd[0] - 1 && d <= dd[1] + 1, "le prénom du proche n'est pas de sa génération", `${fam.prenom}, ${fam.age} ans`); }
  }
  ok(affaires >= NB * 0.95, "trop d'affaires non tirées", affaires);
  ok(familles > 50, "trop peu de liens de famille vérifiés", familles);
  const partMixte = mixtes / Math.max(1, pens);
  ok(partMixte > 0.08 && partMixte < 0.25, "la part d'assemblages mixtes s'écarte d'un sur six", partMixte.toFixed(3));
  console.log(`  ${affaires} affaires, ${personnes} personnes, ${familles} liens de famille vérifiés ; assemblages mixtes : ${(partMixte * 100).toFixed(1)} %`);

  // ---------- plus aucune liste de noms de personnes hors de la source commune
  const JS = path.resolve(__dirname, "..", "..", "js");
  for (const f of fs.readdirSync(JS).filter((x) => x.endsWith(".js") && x !== "noms.js")) {
    const src = fs.readFileSync(path.join(JS, f), "utf8");
    for (const m of src.matchAll(/\[((?:\s*"[^"\n]{2,40}"\s*,){3,}\s*"[^"\n]{2,40}"\s*)\]/g)) {
      const items = [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
      const pers = items.filter((x) => { const w = x.replace(/^(Me|Mme|M\.) /, "").split(" "); return w.length >= 1 && N.genreDe(w[0]) && (w.length === 1 || /^[A-ZÉ]/.test(w[1] || "")); });
      ok(pers.length < 3, "liste de noms de personnes hors de la source commune", `${f} : ${items.slice(0, 4).join(", ")}…`);
    }
  }

  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ").slice(0, 600)); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
