// Refonte : l'irresponsabilité pénale jugée par la chambre de l'instruction. node tests/tirresp.js   « échecs: 0 » attendu.
// Demande d'une partie (art. 706-120, al. 1) : ordonnance de transmission de pièces, la détention continue (706-121) ;
// audience publique, experts entendus, la défense en dernier (706-122) ; non-lieu (706-123), renvoi (706-124) ou arrêt
// d'irresponsabilité (706-125 : charges, irresponsabilité, intérêts civils, mesures de sûreté 706-136, soins 706-135) ;
// fin de la détention (706-126) ; appel d'une ordonnance d'irresponsabilité jugé selon les mêmes règles (706-128).
const { boot, sleep, texts } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 500) : "")); } };
  const { w, doc, CR, errors } = boot(); await sleep(50);
  let scene = null;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 31 }); CR.store.s = s; s.settings.saisie = "liste";
  CR.endGame = () => {};
  const tx = (D) => [].concat(...D.paras).map((x) => (typeof x === "string" ? x : x.t)).join("\n");
  const vus = { defense: 0, pc: 0, renvoi: 0, appel: 0, sansDemande: 0, altere: 0 };
  let ex = null;
  for (let i = 0; i < 3000 && (vus.defense < 4 || vus.pc < 3 || vus.renvoi < 1 || vus.appel < 1 || vus.altere < 1); i++) {
    let cs; try { cs = CR.GEN.open(s, "info", {}); } catch (e) { continue; }
    const t = CR.GEN.paramsOf(s, cs.id).t, def = CR.caseDef(cs), api = CR.api(s, cs);
    if (!def.docs || !def.docs.arret_irresp || !CR.hookExists(cs, "_reglement")) continue;
    cs.status = "active"; cs.vars.statut = "mex"; cs.vars.avis175Day = s.day - 40; cs.proc.pcConstituee = true;
    const tache = () => CR.caseTasks(s, cs).find((x) => x.id === "demande706120");
    if (t.f.psy !== "aboli") {
      if (vus.altere < 1 && t.f.psy === "altere") { vus.altere++; ok(!tache(), `${cs.id} : demande de l'article 706-120 proposée sans abolition du discernement`); }
      continue;
    }
    const camp = t.camp === "pc" ? "pc" : "defense";
    // une ordonnance d'irresponsabilité sans demande, puis l'appel (706-128)
    if (vus.appel < 1 && camp === "pc") {
      try { CR.runHook(s, cs, "_reglement", {}); } catch (e) { ok(false, `${cs.id} : ${e.message}`); continue; }
      if (cs.vars.reglement.type !== "irresp") continue;
      vus.sansDemande++;
      cs.vars.appelOuvert = { type: "irresp", jusque: s.day + 10, label: "l'ordonnance d'irresponsabilité", labelCourt: "irresponsabilité" };
      cs.drafted.appel_ordo = [{ day: s.day, min: s.min, defects: [], picks: {}, filled: {}, depose: false }];
      CR.runHook(s, cs, "filed_appel_ordo", { depot: true });
      ok(cs.hearings.some((h) => h.script === "chins_irresp"), `${cs.id} : l'appel de l'ordonnance d'irresponsabilité ne suit pas l'article 706-128`, cs.hearings.map((h) => h.script).join(","));
      vus.appel++;
      continue;
    }
    if ((camp === "pc" ? vus.pc : vus.defense) >= 4 && vus.renvoi >= 1) continue;
    const T0 = tache();
    ok(T0, `${cs.id} : pas de tâche pour demander la saisine de la chambre (art. 706-120)`, CR.caseTasks(s, cs).map((x) => x.id).join(","));
    if (!T0) continue;
    T0.run();
    try { CR.runHook(s, cs, "_reglement", {}); } catch (e) { ok(false, `${cs.id} : ${e.message}`); continue; }
    const R0 = cs.vars.reglement;
    ok(R0 && R0.type === "transmission" && CR.hasDoc(cs, "ordo_transmission"), `${cs.id} : pas d'ordonnance de transmission de pièces`, JSON.stringify(R0));
    const O = tx(def.docs.ordo_transmission({ s, cs, def, api }));
    ok(/706-120, al\. 1/.test(O) && /raisons plausibles d'appliquer le premier alinéa de l'article 122-1/.test(O) && (!cs.vars.dpAuReglement || /706-121/.test(O)), `${cs.id} : ordonnance de transmission incomplète`, O);
    const h = cs.hearings.find((x) => x.script === "chins_irresp");
    ok(h, `${cs.id} : pas d'audience de la chambre de l'instruction`);
    if (!h) continue;
    const A0 = def.audiences.chins_irresp(api);
    if (!scene) scene = { cs, h };
    const steps = JSON.stringify(A0.steps.map((x) => x.t || x.who || Object.keys(x)[0]));
    ok(/audience publique/.test(JSON.stringify(A0)) && /expert/i.test(steps) && /défense, qui aura la parole en dernier/.test(steps), `${cs.id} : audience non conforme à l'article 706-122`, steps.slice(0, 600));
    // le renvoi : une expertise qui ne conclut plus à l'abolition (706-124)
    if (vus.renvoi < 1 && camp === "defense") {
      t.f.psy = "altere";
      CR.runHook(s, cs, "irrespDecider", { played: new Set() });
      ok(cs.vars.irresp.issue === "renvoi", `${cs.id} : discernement altéré, pas de renvoi`, cs.vars.irresp.issue);
      CR.runHook(s, cs, "apresIrresp", {});
      ok(cs.hearings.some((x) => x.script === "proces") && /art\. 706-124/.test(tx(def.docs.arret_irresp({ s, cs, def, api }))), `${cs.id} : renvoi sans procès fixé`);
      t.f.psy = "aboli"; vus.renvoi++;
      continue;
    }
    const played = new Set(camp === "pc" ? ["arg:civil", "arg:mesures", "arg:charges"] : ["arg:aboli"]);
    CR.runHook(s, cs, "irrespDecider", { played });
    const I0 = cs.vars.irresp;
    const T = tx(def.docs.arret_irresp({ s, cs, def, api }));
    ok(/statuant en audience publique \(art\. 706-122\)/.test(T) && /experts psychiatres ont été entendus/.test(T) && /défense ayant eu la parole en dernier/.test(T), `${cs.id} : arrêt sans ses débats`, T.slice(0, 700));
    if (I0.issue === "irresp") {
      ok(/1° déclare qu'il existe des charges suffisantes/.test(T) && /2° .+ pénalement irresponsable/.test(T) && /706-126/.test(T), `${cs.id} : dispositif de l'article 706-125`, T.slice(-900));
      if (I0.mesures.length) ok(/mesures de sûreté suivantes/.test(T) && /706-136/.test(T) && new RegExp(I0.duree).test(T), `${cs.id} : mesures de sûreté sans durée`);
      if (I0.soins) ok(/706-135/.test(T) && /hospitalisation complète/.test(T), `${cs.id} : soins sans l'article 706-135`);
      if (camp === "pc") ok(I0.civil > 0 && /dommages et intérêts/.test(T) && /706-125, 3°/.test(T), `${cs.id} : la partie civile qui le demande n'obtient pas de décision sur les intérêts civils`, JSON.stringify(I0));
      if (!ex) ex = T;
    } else ok(I0.issue === "nonlieu" && /706-123/.test(T), `${cs.id} : issue inattendue ${I0.issue}`);
    CR.runHook(s, cs, "apresIrresp", {});
    ok(cs.proc.detention.statut === "libre", `${cs.id} : personne détenue après l'arrêt (art. 706-126)`, cs.proc.detention.statut);
    // la partie civile indemnisée : le recouvrement s'ouvre (lot 8) ; sinon le dossier est clos
    if (camp === "pc" && I0.civil) ok(cs.vars.recouv && cs.vars.recouv.montant === I0.civil, `${cs.id} : l'indemnité allouée n'ouvre pas le recouvrement`, JSON.stringify(cs.vars.recouv || cs.outcome));
    else ok(cs.status === "closed", `${cs.id} : dossier ouvert après l'arrêt`, cs.status);
    vus[camp]++;
  }
  // devant la cour d'assises (art. 349-1, 361-1, 706-129 à 706-132) : la défense invoque l'abolition, ou non
  const assises = { invoque: 0, sans: 0, pc: 0 };
  for (let i = 0; i < 4000 && (assises.invoque < 3 || assises.sans < 2 || assises.pc < 2); i++) {
    let cs; try { cs = CR.GEN.open(s, "info", {}); } catch (e) { continue; }
    const t = CR.GEN.paramsOf(s, cs.id).t, def = CR.caseDef(cs);
    if (t.f.psy !== "aboli" || t.q.nature !== "crime" || !CR.hookExists(cs, "decider")) continue;
    const pc = t.camp === "pc", cas = pc ? "pc" : assises.invoque <= assises.sans ? "invoque" : "sans";
    if (assises[cas] >= 3) continue;
    cs.status = "active"; cs.vars.jurProces = t.jur; cs.vars.reglement = { qual: "q", type: "oma", jur: t.jur };
    const played = new Set(cas === "invoque" ? ["arg:aboli"] : []);
    let d; try { d = CR.runHook(s, cs, "decider", { st: { played, dernierMot: "regrets" } }); } catch (e) { ok(false, `${cs.id} : ${e.message}`); continue; }
    if (!d) continue;
    if (cas === "sans") { if (d.coupable) { assises.sans++; ok(!d.irresp, `${cs.id} : irresponsabilité déclarée sans que la défense l'invoque`); } continue; }
    if (!d.irresp) continue; // charges non établies : acquittement
    assises[cas]++;
    ok(!d.coupable && !d.peine && /706-129/.test(d.dispositif), `${cs.id} : arrêt d'irresponsabilité sans son dispositif`, d.dispositif);
    const J = CR.SHARED_DOCS._jugement({ s, cs }), TX = J.paras.map((x) => x.join("")).join("\n");
    ok(/Question n° 2 : l'accusée? bénéficie-t-(il|elle) pour ces faits de la cause d'irresponsabilité/.test(TX) && /706-132/.test(TX), `${cs.id} : arrêt écrit sans les deux questions ou l'appel du procureur général`, TX.slice(0, 900));
    CR.runHook(s, cs, "apresProces", { decision: d });
    ok(cs.proc.detention.statut !== "dp", `${cs.id} : détenu après l'arrêt d'irresponsabilité (art. 706-130)`);
    if (pc) ok(d.irresp.civil > 0, `${cs.id} : la cour ne statue pas sur les intérêts civils (art. 706-131)`);
  }
  ok(assises.invoque >= 1 && assises.sans >= 1 && assises.pc >= 1, "trop peu de procès d'assises sur l'irresponsabilité", JSON.stringify(assises));
  console.log("cour d'assises :", JSON.stringify(assises));
  // la scène se rend
  if (scene) {
    const { cs, h } = scene; s.day = h.day; s.min = h.min;
    const host = doc.createElement("div"); doc.body.appendChild(host);
    const root = w.ReactDOM.createRoot(host); root.render(w.React.createElement(CR.UI.HearingScene, { s, cs, hid: h.id, onDone: () => {}, setScene: () => {} }));
    let vu = false; for (let k = 0; k < 300 && !vu; k++) { await sleep(40); vu = /audience publique/.test(texts(host)) && /122-1/.test(texts(host)); }
    ok(vu, "l'audience de la chambre de l'instruction ne se rend pas", texts(host).slice(0, 300));
    root.unmount();
  }
  ok(vus.defense >= 2 && vus.pc >= 1 && vus.renvoi >= 1 && vus.appel >= 1, "trop peu d'affaires", JSON.stringify(vus));
  if (process.env.VOIR && ex) console.log(ex);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("irresponsabilité :", JSON.stringify(vus));
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
