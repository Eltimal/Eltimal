// N° 12 : affiche des affaires générées à plusieurs infractions, avec récidive, ou de pénal des affaires.
// Usage : node tools/exemples12.js [concours|recidive|affaires|tout] [graine]
const { boot } = require("../tests/harness");
const quoi = process.argv[2] || "tout";
const graine = +(process.argv[3] || 12);
const { CR, errors } = boot();
setTimeout(() => {
  const CAT = CR.CAT, G = CR.GEN2, B = G.B;
  const D = (d) => CR.fmtDate(d, "long");
  const s = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: graine }));
  s.settings.saisie = "liste";
  const montrer = (cs, p) => {
    const t = p.t, def = CR.caseDef(cs), api = CR.api(s, cs), x = B.ctx(p);
    cs.status = "active"; cs.engaged = s.day;
    CR.runHook(s, cs, "engaged", {});
    if (t.cjip) console.log(`  (CJIP proposée : ${CR.money(t.cjip.amende)} ; on la refuse pour voir le procès)`), CR.runHook(s, cs, "_cjipNon", {});
    console.log(`\n=== ${def.title} (${p.kind}, ${t.inf}${t.scenario ? ", scénario " + t.scenario : ""}) ===`);
    console.log(`Client : ${CR.clientName(cs)}${x.pmClient ? ` pour la ${t.PM.nom}` : ""}`);
    console.log(`Prévention : ${x.prevention(t.q)}. Réprimés par ${B.reprime(x)}.`);
    const qs = [t.q].concat((t.conc || []).map((c) => c.q));
    for (const q of qs) console.log(`  - ${q.label} : ${CAT.encourueTexte(q)} (${q.court})`);
    if (t.conc) console.log(`  ${CAT.concoursTexte(t.enc)}`);
    if (t.conc && t.conc.some((c) => c.memeFait)) console.log(`  Cumul pour un même fait : ${CAT.CUMUL[t.conc.find((c) => c.memeFait).quoi].motif}`);
    if (t.ant) { const EL = CAT.etatLegal(t.ant, { inf: t.inf, q: x.q0, faits: t.d.faits }); console.log(`Casier : ${t.ant.label}, ${t.ant.juridiction}, ${D(t.ant.jug)}, définitif le ${D(t.ant.def)} ; faits le ${D(t.d.faits)}. État légal : ${EL.etat || "aucun"}${t.recid.vice ? ` — le parquet retient la récidive à tort (${G.VICES[t.recid.vice]})` : t.rec ? " — récidive retenue, à bon droit" : ""}.`); }
    if (t.PM) console.log(`Personne morale : ${t.PM.nom}, CA ${CR.money(t.PM.ca)} ; amende encourue ${CR.money(CAT.pourPersonneMorale(x.q0).amende)} (quintuple de ${CR.money(x.q0.amende)}) ; dirigeant poursuivi : ${t.dirigeantPoursuivi !== false ? "oui" : "non"}${t.pnf ? " ; parquet national financier" : ""}`);
    if (t.deleg) console.log(`Délégation de pouvoirs : ${t.deleg.existe ? `${t.deleg.qui.prenom} ${t.deleg.qui.nom}, ${t.deleg.qui.poste} — ${CAT.delegationValide(t.deleg) ? "valable" : "manque " + CAT.DELEG_LABEL[CAT.delegationDefaut(t.deleg)]}` : "aucune"}`);
    if (t.f.plainte) console.log(`Origine des poursuites fiscales : ${t.f.plainte}`);
    if (t.presc) console.log(`Prescription : comptes approuvés le ${D(t.presc.comptes)}, ${t.presc.dissimule ? "dépenses dissimulées" : "dépenses visibles"} — ${CAT.prescriptionOcculte(t.presc, 6).acquise ? "acquise" : "non acquise"}`);
    console.log(`Pièces : ${Object.values(def.docTitles || {}).join(" ; ")}`);
    const casier = CR.renderDoc(s, cs, { key: "casier", vars: {} });
    console.log(`Bulletin n° 1 : ${[].concat(...casier.paras).map((z) => (typeof z === "string" ? z : z.t)).join(" ")}`);
    const args = (x.pmClient ? B.argsPM(x) : B.argsDefense(x)).map((a) => a.label);
    console.log(`Arguments offerts : ${args.join(" | ")}`);
    // à l'audience : la défense soulève le vice de la récidive s'il existe, plaide le cumul et la confusion
    if (t.rec && t.recid && t.recid.vice) for (const l of def.on._contesterRecidive(api, { motif: t.recid.vice })) console.log(`  [${l.who}] ${l.t}`);
    const played = new Set(["arg:cumul", "arg:confusion", "arg:revocation", "arg:delegation"]);
    cs.vars.requis = CR.ACT.requis(api, B.requisDyn(x, api));
    console.log(`Réquisitions : ${CR.ACT.requisTexte(cs.vars.requis)}${t.recid && t.recid.revocable && !x.pmClient && cs.vars.requis.ferme > 0 ? ", et révocation du sursis antérieur" : ""}`);
    const dec = def.on.decider(api, { st: { played, angle: "peine", dernierMot: "regrets" } });
    console.log("Jugement :");
    for (const q of dec.questions) console.log(`  ${q.q} : ${q.r}${q.motif ? " — " + q.motif : ""}`);
    console.log("Débrief :");
    for (const d of def.debrief(api, { type: dec.coupable ? "condamnation" : "relaxe" }).filter((z) => z.kind !== "calc")) console.log(`  (${d.kind}) ${d.text}`);
    console.log("Fiche :", def.fiche(api, { type: "condamnation" }).notions.map((n) => `${n.titre} [${n.art}]`).join(" ; "));
  };
  const cherche = (kind, test, infs, max) => {
    for (let i = 0; i < (max || 400); i++) {
      s.day = 40 + i;
      const cs = CR.GEN.open(s, kind, { inf: infs ? infs[i % infs.length] : undefined });
      const p = s.generated.find((g) => g.id === cs.id);
      if (test(p.t)) return [cs, p];
    }
    return null;
  };
  if (quoi === "concours" || quoi === "tout") { const r = cherche("copj", (t) => t.conc && t.conc.some((c) => c.memeFait), ["vol", "escroquerie"]); if (r) montrer(...r); }
  if (quoi === "recidive" || quoi === "tout") { const r = cherche("copj", (t) => t.recid && t.recid.vice); if (r) montrer(...r); }
  if (quoi === "affaires" || quoi === "tout") { const r = cherche("copj", (t) => t.client === "R", ["accident_travail", "corruption", "fraude_fiscale"]); if (r) montrer(...r); }
  if (errors.length) console.log("errors:", errors.slice(0, 3).join("\n"));
  process.exit(0);
}, 150);
