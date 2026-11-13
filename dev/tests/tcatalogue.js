// Refonte, lot 1 ter : sur le catalogue, les pièces qui viennent encore de l'ancien générateur. node tests/tcatalogue.js
// Critère de fin du lot : plus aucune. En attendant, garde-fou : le nombre d'affaires qui en gardent une ne remonte pas
// au-dessus du plafond (PLAFOND, abaissé à chaque famille reprise) ; les pièces restantes sont listées.
const { boot } = require("./harness");
const PLAFOND = 0.03; // part des affaires (mesure du 13 novembre 2026 : 2 % ; autopsie des homicides routiers, certificat des urgences du pilote, pièces isolées)
const PERMISES = ["rapport_autopsie", "certificat_urgences", "pv_synthese", "pv_video", "comptes", "certificat", "pv_prolongation", "pv_telephonie"];
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const orig = SIM.pieces, origV = SIM.piecesViolences; let reste = null;
  SIM.pieces = function (t, k) { const PS = orig.apply(this, arguments); reste = (k.reste || []).map((x) => x.key).filter((key) => !PS.docs[key]); return PS; };
  if (origV) SIM.piecesViolences = function (t, k) { const PS = origV.apply(this, arguments); if (PS) reste = (k.reste || []).map((x) => x.key).filter((key) => !PS.docs[key] || PS.ordre.some((o) => o.key === key && o.ancien)); return PS; };
  const cles = {}, parInf = {}; let n = 0, avec = 0;
  for (let i = 0; i < 600; i++) {
    const genre = ["ci", "gav", "copj", "op", "pc"][i % 5];
    let t; try { t = G.tirer("cat" + i, genre, { day: 12 + (i % 9) }); } catch (e) { continue; }
    if (!t || !SIM.supporte(t)) continue;
    reste = null; try { G.pieces(t, G.recit(t)); } catch (e) { continue; }
    n++;
    if (reste && reste.length && process.env.DETAIL) console.log("  · " + genre + " " + t.inf + " " + JSON.stringify(t.f).slice(0, 140) + " irr=" + (t.irr || []).join(",") + " → " + reste.join(","));
    if (reste && reste.length) { avec++; for (const k of reste) cles[k] = (cles[k] || 0) + 1; parInf[t.inf] = (parInf[t.inf] || 0) + 1; }
  }
  const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ");
  ok(n >= 400, "trop peu d'affaires tirées", n);
  ok(avec / n <= PLAFOND, `trop d'affaires gardent une pièce ancienne (${avec}/${n})`);
  const nouvelles = Object.keys(cles).filter((k) => !PERMISES.includes(k));
  ok(!nouvelles.length, "une pièce que le moteur composait revient à l'ancien générateur", nouvelles.join(", "));
  console.log(`catalogue : ${n} affaires · ${avec} gardent une pièce ancienne (${Math.round((avec / n) * 100)} %) · ${top(cles)}`);
  console.log(`par infraction : ${top(parInf)}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
