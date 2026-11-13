// Refonte, lot 1 ter (première famille) : le vol en magasin au niveau de l'arrachage. node tests/tmagasin.js   « échecs: 0 » attendu.
// Sur des affaires tirées : l'agent de sécurité et l'état de la marchandise sont au dossier ; mêmes heures, mêmes articles,
// même total d'une pièce à l'autre ; l'erreur de bonne foi de l'agent sur le nombre est un fait du dossier ; les images
// existent si et seulement si le dossier en a ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" "); };
  let n = 0, erreurs = 0, multi = 0, video = 0;
  for (let i = 0; i < 6000 && n < 40; i++) {
    const genre = ["ci", "gav", "copj"][i % 3];
    let t; try { t = G.tirer("tmag" + i, genre, { day: 12 + (i % 9), inf: "vol" }); } catch (e) { continue; }
    if (!t || !SIM.supporte(t) || !t.f || t.f.sc !== "magasin" || !t.flagrance) continue;
    const PZ = G.pieces(t, G.recit(t));
    const tag = `${genre} ${t.sig.slice(0, 40)}`;
    ok(PZ.docs.pv_agent && PZ.docs.etat_marchandise, `${tag} : pièces du magasin absentes`, Object.keys(PZ.docs).join(","));
    if (!PZ.docs.pv_agent || !PZ.docs.etat_marchandise) continue;
    n++;
    const A = txt(PZ, "pv_agent", t), E = txt(PZ, "etat_marchandise", t);
    ok(!/undefined|NaN|\$\{/.test(A + E), `${tag} : texte incomplet`);
    const tot = /Total : ([\d ]+),(\d\d) €/.exec(E);
    ok(tot && Math.abs(+tot[1].replace(/\s/g, "") + tot[2] / 100 - t.f.valeur) < 0.06, `${tag} : le total de l'état ne fait pas la valeur du vol`, (tot && tot[0]) + " / " + t.f.valeur);
    const hA = /rattrapée? juste après, à (\d+[\s  ]h[\s  ]\d+)/.exec(A), hE = /à (\d+[\s  ]h[\s  ]\d+), après le passage des caisses/.exec(E);
    ok(hA && hE && hA[1] === hE[1], `${tag} : l'heure de la rétention diffère d'une pièce à l'autre`, (hA && hA[1]) + " / " + (hE && hE[1]));
    const qE = /^.*?: ((?:\d+)) × /m.exec(E.replace(/.*caisses : /, "")), dit = /Réponse : (\S+?)[,.]/.exec(A.split("Combien d'articles")[1] || "");
    const nE = qE ? +qE[1] : null;
    if (nE > 1) multi++;
    const NUM = { Un: 1, Deux: 2, Trois: 3, Quatre: 4, Cinq: 5, Six: 6, Sept: 7 };
    const nA = dit ? (NUM[dit[1]] || (/Un seul/.test(A) ? 1 : null)) : /Un seul/.test(A) ? 1 : null;
    ok(nA != null && nE != null, `${tag} : nombre d'articles illisible`, A.slice(-300));
    if (nA !== nE) { erreurs++; ok(PZ.facts.G_agent_compte && nA === nE + 1, `${tag} : l'erreur de l'agent n'est pas un fait du dossier ou dépasse un article`, `${nA} / ${nE}`); }
    else ok(!PZ.facts.G_agent_compte, `${tag} : erreur signalée sans écart`);
    const aVideo = /extrait la séquence/.test(A); if (aVideo) video++;
    ok(aVideo === !!(t.preuves || []).includes("video") || aVideo === /video/.test(JSON.stringify(t.preuves || t.p || "")), `${tag} : la réponse sur les images ne suit pas le dossier`);
    ok(PZ.facts.G_etat_vente && PZ.facts.G_agent_vu, `${tag} : faits du magasin absents`);
    // déterminisme
    const PZ2 = G.pieces(JSON.parse(JSON.stringify(t)), G.recit(JSON.parse(JSON.stringify(t))));
    ok(txt(PZ2, "pv_agent", t) === A, `${tag} : pièce non déterministe`);
  }
  ok(n >= 20, "trop peu de vols en magasin tirés", n);
  ok(erreurs > 0 && erreurs < multi, "l'erreur de bonne foi n'apparaît jamais, ou toujours", `${erreurs}/${multi}`);
  console.log(`vols en magasin : ${n} · plusieurs articles ${multi} · erreurs de décompte ${erreurs} · images extraites ${video}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
