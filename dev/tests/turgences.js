// Refonte, lot 1 ter : le certificat médical initial des urgences (litige sur l'incapacité) composé par le moteur.
// node tests/turgences.js   « échecs: 0 » attendu. Examen après les faits et avant l'examen de l'unité médico-judiciaire ;
// arrêt de travail (pas d'incapacité au sens pénal) ; mêmes lésions que l'UMJ ; textes complets ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 4 }); CR.store.s = s;
  const rendu = (PZ, k, t) => PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} });
  const txt = (r) => [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" | ");
  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const quand = (x) => { const m = /le (?:\w+ )?(\d{1,2})(?:er)? (janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre) (\d{4}) à (\d+)\s*h\s*(\d+)/.exec(x); return m ? Date.UTC(+m[3], MOIS.indexOf(m[2]), +m[1]) / 6e4 + +m[4] * 60 + +m[5] : null; };
  let n = 0;
  for (let i = 0; i < 40000 && n < 30; i++) {
    const genre = ["ci", "gav", "copj", "op"][i % 4], inf = ["violences", "vol"][i % 2];
    let t; try { t = G.tirer("tur" + i, genre, { day: 12 + (i % 9), inf }); } catch (e) { continue; }
    if (!t || !SIM.supporte(t) || t.quoi !== "itt" || (SIM.violencesOK && SIM.violencesOK(t))) continue; // le pilote des violences a son propre certificat
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    if (!PZ.docs.certificat_urgences) continue;
    n++;
    const tag = `${genre} ${t.inf} ${t.sig.slice(0, 30)}`;
    const U = txt(rendu(PZ, "certificat_urgences", t));
    ok(!/undefined|NaN|\$\{/.test(U), `${tag} : texte incomplet`, U.slice(0, 300));
    ok(U === txt(rendu(G.pieces(t, G.recit(t)), "certificat_urgences", t)), `${tag} : pièce non déterministe`);
    ok(/Arrêt de travail : \d+ jours/.test(U) && !/incapacité totale/.test(U), `${tag} : le certificat des urgences fixe une incapacité au sens pénal`, U.slice(-200));
    if (PZ.docs.certificat) {
      const M = txt(rendu(PZ, "certificat", t));
      const qU = quand(U), qM = quand(M.replace(/^[^|]*?examiné /, "examiné "));
      ok(qU != null && qM != null && qU < qM, `${tag} : urgences après l'UMJ`, `${qU} / ${qM}`);
      const lesU = (/Constatations : ([^|]+)\./.exec(U) || [])[1] || "";
      ok(lesU.split(" ; ").every((l) => /contusions superficielles/.test(l) || M.toLowerCase().includes(l.toLowerCase().slice(0, 25))), `${tag} : lésions différentes de l'UMJ`, lesU);
    }
  }
  ok(n >= 10, "trop peu de certificats des urgences", n);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log(`certificats des urgences : ${n}`);
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
