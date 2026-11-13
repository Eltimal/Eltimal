// Refonte, lot 1 ter : la détention de stupéfiants (domicile, voiture). node tests/tdetention.js   « échecs: 0 » attendu.
// Colocataire, propriétaire du véhicule et passagers : dits une seule fois dans les constatations, notés comme faits du
// dossier quand ils ouvrent la discussion sur l'imputation ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const tout = (PZ, t) => Object.keys(PZ.docs).map((k) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" "); }).join("\n");
  let n = 0, coloc = 0, tiers = 0, pass = 0;
  for (let i = 0; i < 12000 && n < 30; i++) {
    const genre = ["ci", "gav", "copj"][i % 3];
    let t; try { t = G.tirer("tdt" + i, genre, { day: 12 + (i % 9), inf: "stups_detention" }); } catch (e) { continue; }
    if (!t || !SIM.supporte(t) || !t.f || !["domicile", "voiture"].includes(t.f.sc) || !t.flagrance) continue;
    const tCopie = JSON.stringify(t);
    const PZ = G.pieces(t, G.recit(t));
    const tag = `${genre} ${t.f.sc} ${t.sig.slice(0, 30)}`;
    const T = tout(PZ, t);
    ok(!/undefined|NaN|\$\{/.test(T), `${tag} : texte incomplet`);
    n++;
    const c = /partagé avec un colocataire/.test(T), v = /Le véhicule, .*?, appartient à /.test(T), p = /passagers? (est|sont) à bord/.test(T);
    if (c) coloc++; if (v) tiers++; if (p) pass++;
    ok(t.f.sc !== "domicile" || /occupe seule? l'appartement|partagé avec un colocataire/.test(T), `${tag} : l'occupation du domicile n'est pas dite`);
    ok(t.f.sc !== "voiture" || /Le véhicule, /.test(T), `${tag} : le véhicule n'est pas décrit`);
    ok(c === !!PZ.facts.G_coloc && v === !!PZ.facts.G_vehicule_tiers && p === !!PZ.facts.G_passagers, `${tag} : circonstances dites et notées différemment`);
    ok((T.match(/partagé avec un colocataire|Le véhicule, /g) || []).length <= 2, `${tag} : la circonstance est répétée`);
    ok(tout(((t2) => G.pieces(t2, G.recit(t2)))(JSON.parse(tCopie)), t) === T, `${tag} : pièces non déterministes`);
  }
  ok(n >= 15, "trop peu de détentions tirées", n);
  ok(coloc > 0 && (tiers > 0 || pass > 0), "aucune circonstance d'imputation tirée", `${coloc}/${tiers}/${pass}`);
  console.log(`détentions : ${n} · colocataires ${coloc} · véhicules de tiers ${tiers} · passagers ${pass}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
