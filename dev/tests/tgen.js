// Moteur génératif, phase 1 (feuille de route, n° 5 à 7) : 1 000 affaires tirées sur cinq graines.
// Vérifie : qualification cohérente avec les faits, peine et juridiction correctes, délais valides, aucune affaire en double ;
// toutes les pièces se lisent, chaque irrégularité est portée par un passage sans être annoncée ; les audiences se construisent ;
// le jugement applique la peine encourue du catalogue ; la sauvegarde se recharge ; les anciennes affaires générées restent lisibles.
// Phase 2 (crimes et information judiciaire) : 1 000 affaires criminelles sur cinq graines ; qualification, peine, juridiction
// (cour criminelle départementale, cour d'assises, mineurs), délais de détention et d'instruction, contextes tirés, doublons ;
// un échantillon joué jusqu'au bout (présent aux audiences, ou absent), pièces, audiences et décisions contrôlées.
// N° 12 : concours (maximum par nature), récidive (conditions, vices visibles au casier, défense qui la soulève ou se tait),
// réitération, personnes morales (amende quintuplée), délégation, CJIP, prescription, plainte fiscale, cour criminelle départementale.
// Usage : node tests/tgen.js [nombre par graine, défaut 200] [affaires criminelles par graine, défaut 200]
const { boot, sleep } = require("./harness");
let fails = 0;
const shown = new Map();
const ok = (c, m, k) => { if (c) return; fails++; const key = k || m; const n = (shown.get(key) || 0) + 1; shown.set(key, n); if (n <= 3) console.log("ÉCHEC", m); };
const REVELE = /irrégularit|aucune autorisation|aucune ordonnance|nullit|ne mentionne aucune|tardive/i;

(async () => {
  const env = boot();
  const { CR, errors } = env;
  await sleep(150);
  const PAR = +(process.argv[2] || 200);
  const SEEDS = [11, 23, 37, 41, 59];
  const GENRES = ["gav", "ci", "al", "op", "copj", "pc", "copj", "gav", "pc", "al"];
  const segs = (r) => [].concat(...(r.paras || []).map((p) => p || []), r.sigs || []).filter((x) => x && typeof x === "object");
  const allText = (r) => [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" ");
  const st = { inf: {}, fam: {}, genre: {}, irr: {}, doutes: 0, requalif: 0, voie: {}, jur: {}, rec: 0, pieces: 0, mots: new Set() };
  const sigs = new Set();
  const exemples = [];
  let n = 0;
  for (const seed of SEEDS) {
    const s = CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed });
    s.settings.saisie = "liste";
    for (let i = 0; i < PAR; i++) {
      const kind = GENRES[i % GENRES.length];
      s.day = 20 + Math.floor(i / 2);
      s.min = 10 * 60 + (i % 7) * 40;
      let cs, p;
      try { cs = CR.GEN.open(s, kind, { night: kind === "gav" && i % 3 === 0, min: s.min }); p = s.generated.find((x) => x.id === cs.id); }
      catch (e) { ok(false, `graine ${seed} n° ${i} (${kind}) : ${e.stack.split("\n").slice(0, 3).join(" | ")}`, "tirage"); continue; }
      n++;
      const t = p.t;
      const def = CR.caseDef(cs);
      const I = CR.CAT.INF[t.inf];
      // 1. cohérence du tirage (qualification, peine, juridiction, voies, délais)
      const pb = CR.GEN2.verifier(t);
      ok(!pb.length, `${cs.id} (${t.inf}, ${kind}) : ${pb.join(" ; ")}`, "verif:" + pb[0]);
      // 2. aucune affaire en double
      ok(!sigs.has(t.sig), `${cs.id} : affaire en double (${t.sig.slice(0, 80)})`, "double");
      sigs.add(t.sig);
      // 3. le récit et la définition reprennent la qualification du catalogue
      const q = CR.CAT.avecRecidive ? (t.rec ? CR.CAT.avecRecidive(CR.CAT.qualifier(t.inf, t.f), CR.GEN2.recidiveRetenue(t)) : CR.CAT.qualifier(t.inf, t.f)) : null;
      ok(q && q.prison === t.q.prison && q.amende === t.q.amende && q.court === t.q.court, `${cs.id} : peine stockée ≠ peine du catalogue`, "peine");
      ok(t.genre !== "pc" || def.camp === "pc", `${cs.id} : camp de la partie civile`, "camp");
      ok(def.proc.nature === (["copj", "pc"].includes(kind) ? t.q.nature : def.proc.nature), `${cs.id} : nature de la procédure`, "nature");
      // 4. les pièces : complètes, irrégularités portées et jamais annoncées
      const flags = new Set();
      for (const k of Object.keys(def.docs)) {
        let r;
        try { r = CR.renderDoc(s, cs, { key: k, vars: {} }); } catch (e) { ok(false, `${cs.id}/${k} : ${e.message}`, "render"); continue; }
        st.pieces++;
        const js = JSON.stringify(r);
        ok(!/undefined|NaN|\[object Object\]|\{[a-zA-Z_]+\}/.test(js), `${cs.id}/${k} (${t.inf}) : texte incomplet ${(js.match(/.{60}(undefined|NaN|\[object Object\]|\{[a-zA-Z_]+\}).{30}/) || [""])[0]}`, "incomplet:" + k);
        for (const g of segs(r)) if (g.flag) flags.add(g.flag);
        if (segs(r).some((g) => g.flag || g.paire)) ok(!REVELE.test(allText(r)), `${cs.id}/${k} : la pièce annonce elle-même l'irrégularité`, "revele");
        for (const g of segs(r)) if (g.f) ok(def.facts[g.f] || /^(G_|P_|O_|C_|V_|K_)/.test(g.f), `${cs.id}/${k} : fait inconnu ${g.f}`, "fait");
        allText(r).split(/\s+/).forEach((w) => st.mots.add(w.toLowerCase()));
      }
      for (const fl of Object.keys(def.anomalies || {})) {
        ok(flags.has(fl), `${cs.id} : anomalie ${fl} absente des pièces`, "anomalie:" + fl);
        ok(CR.IRREG[def.anomalies[fl].irreg], `${cs.id} : régime inconnu ${def.anomalies[fl].irreg}`, "regime");
        ok(CR.INDICES[def.anomalies[fl].irreg], `${cs.id} : pas d'indice pour ${def.anomalies[fl].irreg}`, "indice");
      }
      if (kind !== "pc") for (const id of t.irr) ok(def.anomalies[id] || (id === "al_quitter" && kind === "al"), `${cs.id} : irrégularité ${id} sans pièce`, "irr-piece:" + id);
      // 5. textes par affaire : chaque texte cité existe dans la base, se relit et se cite
      for (const k of t.q.textes) ok(CR.TEXTES[k] && CR.lib(k) && CR.refOfId(k), `${cs.id} : texte ${k} absent de la base`, "texte:" + k);
      ok(CR.citeBaseCheck(t.q.textes).length === 0, `${cs.id} : base des textes`, "citebase");
      // 6. procédure : audience fixée au bon tribunal, devant le bon juge, dans les délais
      const api = CR.api(s, cs);
      if (kind === "copj" || (kind === "pc" && t.d.voiePc === "convoque")) {
        cs.status = "active"; cs.engaged = s.day;
        CR.runHook(s, cs, "engaged", {});
        if (t.cjip) CR.runHook(s, cs, "_cjipNon", {});
        const a = cs.proc.audience;
        ok(a && a.day === t.d.audience && a.juridiction === t.jur && cs.actors.president === t.pres, `${cs.id} : audience mal fixée`, "audience");
        if (a && kind === "copj") { const ob = cs.obligs.find((o) => o.id.startsWith("art385_")); ok(a.day - a.convocDay >= 20 ? ob && ob.due === a.day - 3 : !ob, `${cs.id} : délai de l'art. 385`, "385"); }
        const pr = CR.PROC.prescription(cs);
        ok(pr && pr.expire > t.d.audience, `${cs.id} : prescription acquise avant l'audience`, "presc");
        ok(CR.PROC.JURIDICTIONS[t.jur] && (t.jur === "tp") === (t.q.nature === "contravention"), `${cs.id} : juridiction`, "jur");
        // l'audience se construit et le jugement respecte la peine encourue
        try {
          const sc = def.audiences[a.mode === "convocation" ? (kind === "pc" ? "pc" : "tc") : "tc"](api);
          ok(sc.steps && sc.steps.length > 8, `${cs.id} : audience vide`, "steps");
        } catch (e) { ok(false, `${cs.id} : audience : ${e.message}`, "aud"); }
        try {
          const played = new Set(["arg:emploi"]);
          const dec = def.on.decider(api, { st: { played, angle: "peine", dernierMot: "regrets" } });
          ok(dec && dec.questions && dec.questions.length >= 1 && dec.dispositif, `${cs.id} : jugement vide`, "jug");
          if (dec.peine && dec.qualif && dec.qualif.encourue) {
            const pn = dec.peine;
            ok(!dec.qualif.encourue.prison ? pn.ferme + pn.sursis === 0 : pn.ferme + pn.sursis <= dec.qualif.encourue.prison, `${cs.id} : peine prononcée au-delà du maximum (${pn.texte} / ${dec.qualif.encourue.prison} mois)`, "max");
            ok(!pn.amende || pn.amende <= dec.qualif.encourue.amende, `${cs.id} : amende au-delà du maximum`, "maxa");
          }
        } catch (e) { ok(false, `${cs.id} : jugement : ${e.stack.split("\n").slice(0, 2).join(" | ")}`, "jugement"); }
      }
      if (kind === "op") {
        cs.status = "active"; CR.runHook(s, cs, "engaged", {});
        const ob = cs.obligs.find((o) => o.id === "op495");
        ok(ob && ob.due === CR.rollForward(t.d.notif + 45) && ob.due >= s.day, `${cs.id} : délai d'opposition`, "op495");
        try { const dec = def.on.decider(api, { st: { played: new Set(), angle: "peine" } }); ok(dec && (!dec.peine || dec.peine.ferme + dec.peine.sursis <= t.q.prison), `${cs.id} : jugement sur opposition`, "jugop"); } catch (e) { ok(false, `${cs.id} : jugement op : ${e.message}`, "jugop2"); }
      }
      if (kind === "pc" && t.d.voiePc === "classe") {
        const pr = CR.PROC.prescription(cs);
        ok(pr && pr.start === t.d.acte && pr.expire >= s.day + 50, `${cs.id} : prescription de la citation directe`, "presc2");
        ok(def.penal.citation && def.penal.citation.juridiction === t.jur, `${cs.id} : citation directe vers le mauvais tribunal`, "citjur");
      }
      if (kind === "gav" || kind === "ci") {
        try { const G = def.gav(api); ok(G.pieces.length >= 1 && G.pieces.every((k) => def.docs[k]), `${cs.id} : pièces de la garde à vue`, "gavp"); } catch (e) { ok(false, `${cs.id} : gav : ${e.message}`, "gav"); }
        if (kind === "ci") { try { const sc = def.audiences.ci(api); /* les rituels déjà vus se résument (anti-répétition, lot 4) */ ok(sc.steps.length > 6, `${cs.id} : audience CI`, "ci"); } catch (e) { ok(false, `${cs.id} : audience CI : ${e.message}`, "ci2"); } }
      }
      if (kind === "al") { try { const G = def.gav(api); ok(G.mode === "audition" && G.droits.length >= 2, `${cs.id} : audition libre`, "al"); if (t.irr.includes("al_quitter")) ok(G.droits.some((d) => d.flag === "al_quitter") && !G.droits.some((d) => /quitter/.test(typeof d === "string" ? d : d.t)), `${cs.id} : droit de quitter`, "alq"); } catch (e) { ok(false, `${cs.id} : al : ${e.message}`, "al2"); } }
      // statistiques
      st.inf[t.inf] = (st.inf[t.inf] || 0) + 1; st.fam[I.fam] = (st.fam[I.fam] || 0) + 1; st.genre[kind] = (st.genre[kind] || 0) + 1;
      for (const id of t.irr) st.irr[id] = (st.irr[id] || 0) + 1;
      if (t.doutes.length) st.doutes++; if (t.q2) st.requalif++; if (t.rec) st.rec++;
      st.voie[t.voie] = (st.voie[t.voie] || 0) + 1; st.jur[t.jur] = (st.jur[t.jur] || 0) + 1;
      if (seed === 11 && [3, 8, 14, 25, 31].includes(i)) exemples.push({ id: cs.id, kind, t, titre: def.title });
    }
    // 7. sauvegarde : rechargement et reconstruction des affaires
    const json = CR.serialize(s);
    const ids = s.generated.map((g) => g.id);
    for (const id of ids) delete CR.CASES[id];
    const s2 = CR.deserialize(json);
    ok(ids.every((id) => CR.CASES[id]), `graine ${seed} : affaires non reconstruites`, "restore");
    const g0 = s2.generated[5];
    ok(CR.caseDef(s2.cases[g0.id]).title === CR.caseTitle(s, s.cases[g0.id]) && JSON.stringify(CR.renderDoc(s2, s2.cases[g0.id], { key: "casier", vars: {} })) === JSON.stringify(CR.renderDoc(s, s.cases[g0.id], { key: "casier", vars: {} })), `graine ${seed} : reconstruction différente`, "restore2");
    console.log(`graine ${seed} : ${PAR} affaires, sauvegarde ${Math.round(json.length / 1024)} Ko (${Math.round(JSON.stringify(s.generated).length / s.generated.length)} octets par affaire)`);
  }
  // 8. déterminisme : même graine, même affaire
  const a1 = CR.GEN2.tirer("g_copj_7:42", "copj", { day: 30 }), a2 = CR.GEN2.tirer("g_copj_7:42", "copj", { day: 30 });
  ok(a1.sig === a2.sig && JSON.stringify(a1) === JSON.stringify(a2), "le tirage n'est pas déterministe", "det");
  // 9. anciennes sauvegardes : une affaire générée par l'ancien générateur se reconstruit toujours
  {
    const s = CR.store.s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 });
    const olds = ["gav", "ci", "op"].map((k) => CR.GEN.params(s, k, { ancien: true, min: 600 }));
    ok(olds.every((p) => !p.gen && p.inf && ["vol_magasin", "recel", "alcool", "rebellion", "violences"].includes(p.inf)), "ancien format non produit", "old");
    const json = JSON.stringify({ ...JSON.parse(CR.serialize(s)) });
    for (const p of olds) delete CR.CASES[p.id];
    const s2 = CR.deserialize(json);
    ok(olds.every((p) => CR.CASES[p.id] && !CR.CASES[p.id].gen2), "ancienne affaire générée non reconstruite", "old2");
  }
  // 10. niveau de contenu : un seul niveau actif, le réglage par défaut est « réaliste »
  ok(CR.contenu({ settings: {} }) === "realiste" && CR.contenu({ settings: { contenu: "adouci" } }) === "realiste", "niveau de contenu", "niveau");

  // =================================================================== 12. N° 12 : plusieurs infractions, récidive, pénal des affaires
  {
    const CAT = CR.CAT, G = CR.GEN2, B = CR.GEN2.B;
    const n12 = { conc: 0, sc: {}, recVal: 0, vice: {}, reit: 0, concours: 0, pm: 0, pmJug: 0, cjip: 0, presc: 0, fisc: 0, deleg: 0, contest: 0, silence: 0, b1: 0 };
    // a. les règles du catalogue, sur des cas construits à la main
    const vol = CAT.delit(60, 75000, "art. 311-4 CP", "vol aggravé"), reb = CAT.delit(24, 30000, "art. 433-6 et 433-7 CP", "rébellion"), vio = CAT.contrav(4, "art. R. 624-1 CP", "violences");
    const c1 = CAT.concours([vol, reb, vio]);
    ok(c1.prison === 60 && c1.amende === 75000 + 750 && c1.somme === 84 && c1.textes.includes("CP_132-7"), "concours : une seule peine par nature au maximum le plus élevé (132-3), amendes contraventionnelles cumulées (132-7)", "n12:c1");
    const c2 = CAT.concours([CAT.crime("perpetuite", 0, "art. 221-3 CP", "assassinat"), vol]);
    ok(c2.prison === CAT.PERPETUITE && c2.perpetuite, "concours : la perpétuité absorbe les autres peines privatives de liberté (132-5)", "n12:c2");
    const F = 4000;
    const ant = (o) => Object.assign({ inf: "vol", art: "art. 311-3 CP", nature: "delit", prison: 36, jug: F - 400, def: F - 388, fin: F - 388, peine: { ferme: 0, sursis: 4, amende: 0 } }, o);
    const qVol = Object.assign(CAT.delit(36, 45000, "art. 311-3 CP", "vol"), { recidivable: true, aggs: [] });
    const E = (a, inf, q) => CAT.etatLegal(a, { inf, q, faits: F });
    const cas = [
      ["même délit dans les cinq ans : récidive (132-10)", E(ant(), "vol", qVol), "recidive", "132-10"],
      ["délits assimilés (132-16) : récidive", E(ant({ inf: "escroquerie", art: "art. 313-1 CP", prison: 60 }), "vol", qVol), "recidive", "132-10"],
      ["première condamnation pas définitive : concours, pas récidive", E(ant({ def: F + 5 }), "vol", qVol), "concours", null, "non_definitive"],
      ["délai de cinq ans dépassé : réitération", E(ant({ fin: F - 6 * 365 }), "vol", qVol), "reiteration", null, "delai"],
      ["délits ni identiques ni assimilés : réitération", E(ant({ inf: "stups_usage", art: "art. L. 3421-1 CSP", prison: 12 }), "vol", qVol), "reiteration", null, "non_assimilee"],
      ["premier terme puni de dix ans, délit de plus d'un an dans les cinq ans : récidive (132-9)", E(ant({ inf: "stups_trafic", art: "art. 222-37 CP", prison: 120, fin: F - 4 * 365 }), "vol", qVol), "recidive", "132-9"],
      ["premier terme puni de dix ans, délai de cinq ans dépassé : pas de récidive", E(ant({ inf: "stups_trafic", art: "art. 222-37 CP", prison: 120, fin: F - 6 * 365 }), "vol", qVol), "reiteration"],
      ["délit puni de dix ans après un délit puni de dix ans, dans les dix ans : récidive (132-9, al. 1)", E(ant({ inf: "stups_trafic", art: "art. 222-37 CP", prison: 120, fin: F - 8 * 365 }), "stups_trafic", Object.assign(CAT.delit(120, 7500000, "art. 222-37 CP", "trafic"), { recidivable: true })), "recidive", "132-9"],
      ["crime après un crime, vingt ans plus tard : récidive criminelle perpétuelle (132-8)", E(ant({ inf: "vol_arme", art: "art. 311-8 CP", nature: "crime", prison: 240, fin: F - 20 * 365 }), "meurtre", Object.assign(CAT.crime(360, 0, "art. 221-1 CP", "meurtre"), { recidivable: true })), "recidive", "132-8"],
      ["même contravention de 5e classe dans l'année : récidive (132-11)", E(ant({ inf: "violences", art: "art. R. 625-1 CP", nature: "contravention", classe: 5, prison: 0, fin: F - 200 }), "violences", CAT.contrav(5, "art. R. 625-1 CP", "violences")), "recidive", "132-11"],
      ["même contravention de 5e classe après plus d'un an : pas de récidive", E(ant({ inf: "violences", art: "art. R. 625-1 CP", nature: "contravention", classe: 5, prison: 0, fin: F - 400 }), "violences", CAT.contrav(5, "art. R. 625-1 CP", "violences")), null],
      ["conduite sous alcool puis blessures routières : délits assimilés (132-16-2)", E(ant({ inf: "alcool", art: "art. L. 234-1 C. route", prison: 24 }), "blessures_routieres", Object.assign(CAT.delit(60, 75000, "art. 221-19 CP", "blessures routières"), { recidivable: true })), "recidive", "132-10"],
      ["blessures routières puis conduite sous alcool : pas d'assimilation dans ce sens", E(ant({ inf: "blessures_routieres", art: "art. 221-19 CP", prison: 60 }), "alcool", Object.assign(CAT.delit(24, 4500, "art. L. 234-1 C. route", "alcool"), { recidivable: true })), "reiteration"],
      ["vol avec violences puis violences : délits assimilés (132-16-4)", E(ant({ violence: true, art: "art. 311-4 CP", prison: 60 }), "violences", Object.assign(CAT.delit(36, 45000, "art. 222-13 CP", "violences"), { recidivable: true })), "recidive", "132-10"],
    ];
    for (const [lab, r, etat, art, motif] of cas) ok(r.etat === etat && (!art || r.art === art) && (!motif || r.motif === motif), `récidive, règle : ${lab} (obtenu ${r.etat} ${r.art || ""} ${r.motif || ""})`, "n12:regle:" + lab);
    const dv = CAT.avecRecidive(qVol, { type: "delictuelle", art: "132-10" });
    ok(dv.prison === 72 && dv.amende === 90000 && dv.recidive, "récidive délictuelle : maximum doublé (prison et amende)", "n12:double");
    ok(CAT.avecRecidive(CAT.contrav(5, "art. R. 625-1 CP", "violences"), { type: "contraventionnelle", art: "132-11" }).amende === 3000, "récidive contraventionnelle : amende portée à 3 000 euros", "n12:c5");
    const cr = (p) => CAT.avecRecidive(Object.assign(CAT.crime(p, 0, "art. x CP", "crime"), { recidivable: true }), { type: "criminelle", art: "132-8" });
    ok(cr(180).prison === 360 && cr(240).prison === CAT.PERPETUITE && cr(360).prison === CAT.PERPETUITE, "récidive criminelle : 15 ans → 30 ans, 20 et 30 ans → perpétuité (132-8)", "n12:crime");
    ok(CAT.sursisRevocable(ant(), F) && !CAT.sursisRevocable(ant({ def: F - 6 * 365 }), F) && !CAT.sursisRevocable(ant({ peine: { ferme: 4, sursis: 0 } }), F), "sursis antérieur révocable seulement dans le délai d'épreuve (132-35)", "n12:sursis");
    // amende quintuplée pour les personnes morales, pour chaque fiche du catalogue
    let pmOk = 0;
    for (const id of CAT.ORDRE) {
      const I = CAT.INF[id];
      if (I.info) continue;
      const q = CAT.qualifier(id, I.tirer(CR.seeded("pm:" + id)));
      if (!q) continue;
      const pm = CAT.pourPersonneMorale(q);
      ok(pm.amende === q.amende * 5 && pm.prison === 0 && pm.court.includes("131-38"), `personne morale : amende non quintuplée pour ${id}`, "n12:pm:" + id);
      pmOk++;
    }
    ok(CAT.pourPersonneMorale(CAT.crime(360, 0, "art. 221-1 CP", "meurtre")).amende === 1000000, "personne morale : un million d'euros pour un crime sans amende (131-38)", "n12:pm:crime");
    ok(CAT.delegationValide({ existe: true, competence: true, autorite: true, moyens: true }) && !CAT.delegationValide({ existe: true, competence: true, autorite: true, moyens: false }), "délégation : valable seulement avec compétence, autorité et moyens", "n12:deleg");
    const P0 = CAT.prescriptionOcculte({ faits: F - 8 * 365, comptes: F - 7 * 365, dissimule: false, decouverte: F - 100, poursuite: F - 90 });
    const P1 = CAT.prescriptionOcculte({ faits: F - 8 * 365, comptes: F - 7 * 365, dissimule: true, decouverte: F - 100, poursuite: F - 90 });
    const P2 = CAT.prescriptionOcculte({ faits: F - 13 * 365, comptes: F - 12 * 365, dissimule: true, decouverte: F - 100, poursuite: F - 90 });
    ok(P0.acquise && !P1.acquise && P2.acquise, "prescription : comptes approuvés sans dissimulation, report à la découverte, butoir de douze ans (9-1 CPP)", "n12:presc");

    // b. tirages : maxima en concours, récidive appliquée seulement si ses conditions sont réunies, récidive erronée visible au casier
    const D = (d) => CR.fmtDate(d, "long");
    for (let i = 0; i < 2400; i++) {
      const kind = ["gav", "ci", "copj", "copj"][i % 4];
      let t; try { t = G.tirer("n12_" + i + ":5", kind, { day: 400 }); } catch (e) { ok(false, `n° 12, tirage ${i} : ${e.message}`, "n12:tirage"); continue; }
      const pb = G.verifier(t);
      ok(!pb.length, `n° 12, tirage ${i} (${t.inf}, ${kind}) : ${pb.join(" ; ")}`, "n12:verif:" + pb[0]);
      if (t.conc) {
        n12.conc++; n12.sc[t.scenario] = (n12.sc[t.scenario] || 0) + 1;
        const qs = [t.q].concat(t.conc.map((c) => c.q)), cd = qs.filter((q) => q.nature !== "contravention");
        ok(t.enc.prison === Math.max(...cd.map((q) => q.prison)) && t.enc.amende === Math.max(...cd.map((q) => q.amende)) + qs.filter((q) => q.nature === "contravention").reduce((a, q) => a + q.amende, 0), `concours ${t.scenario} : maximum différent du plafond par nature`, "n12:enc");
        if (cd.length > 1) ok(t.enc.prison < cd.reduce((a, q) => a + q.prison, 0), `concours ${t.scenario} : maxima additionnés`, "n12:somme");
      }
      if (t.recid) {
        const EL = CAT.etatLegal(t.ant, { inf: t.inf, q: CAT.qualifier(t.inf, t.f), faits: t.d.faits });
        ok(!t.rec || EL.etat === "recidive" || t.recid.vice, `récidive appliquée sans ses conditions (${t.inf})`, "n12:recsans");
        if (EL.etat === "recidive") n12.recVal++;
        if (EL.etat === "reiteration" && !t.recid.vice) n12.reit++;
        if (EL.etat === "concours") n12.concours++;
        if (t.recid.vice) {
          n12.vice[t.recid.vice] = (n12.vice[t.recid.vice] || 0) + 1;
          // le vice se lit dans le bulletin n° 1 et dans la procédure
          const N = G.recit(t, "realiste");
          const PZ = G.pieces(t, N);
          const b1 = JSON.stringify(PZ.docs.casier({}));
          const proc = Object.keys(PZ.docs).filter((k) => k !== "casier").map((k) => JSON.stringify(PZ.docs[k]({ s: { player: { prenom: "A", nom: "B" } } }))).join(" ");
          const an = t.ant;
          ok(/G_ant/.test(b1) && PZ.facts.G_ant, "récidive erronée : le passage du casier n'est pas à noter", "n12:b1fact");
          ok(proc.includes(D(t.d.faits)) || proc.includes(CR.fmtDate(t.d.faits, "num")), `récidive erronée : la date des faits n'apparaît pas dans la procédure (${t.inf})`, "n12:faitsdate");
          if (t.recid.vice === "non_definitive") ok(b1.includes(D(an.def)) && an.def > t.d.faits, "récidive erronée (définitivité) invisible au casier", "n12:b1def");
          if (t.recid.vice === "delai") ok(b1.includes(D(an.fin)) && /levée d'écrou|Amende payée/.test(b1) && CR.addYears(an.fin, 5) < t.d.faits, "récidive erronée (délai) invisible au casier", "n12:b1delai");
          if (t.recid.vice === "non_assimilee") ok(b1.includes(an.label) && b1.includes(an.art) && !CAT.assimiles(an, { inf: t.inf, art: CAT.qualifier(t.inf, t.f).art, violence: CAT.avecViolences(t.inf, CAT.qualifier(t.inf, t.f)) }), "récidive erronée (assimilation) invisible au casier", "n12:b1assim");
          n12.b1++;
        }
      }
    }
    ok(n12.conc >= 40 && Object.keys(n12.sc).length >= 4, `concours trop rares (${n12.conc}, ${Object.keys(n12.sc).length} scénarios)`, "n12:raresconc");
    ok(Object.keys(n12.vice).length === 3, `récidives erronées : les trois vices ne sont pas tous tirés (${JSON.stringify(n12.vice)})`, "n12:vices");

    // c. à l'audience : la défense soulève le vice (la récidive tombe, les réquisitions baissent) ; ou ne dit rien (le jugement la retient)
    const s = CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 77 });
    s.settings.saisie = "liste";
    let essais = 0;
    const want = { vice: 6, valide: 4, pm: 4, cjip: 2, presc: 2, fisc: 2, deleg: 2, concAud: 4 };
    const got = { vice: 0, valide: 0, pm: 0, cjip: 0, presc: 0, fisc: 0, deleg: 0, concAud: 0 };
    const rouvrir = (cs) => { for (const k of ["recEcartee", "recContestee", "recSilence", "cumulDecide", "cumulPlaide", "requis", "confusion", "revocation", "prescriptionAcquise", "fiscIrrecevable", "argsJoues"]) delete cs.vars[k]; cs.proc.decisions = []; };
    while (essais < 900 && Object.keys(want).some((k) => got[k] < want[k])) {
      essais++;
      s.day = 30 + (essais % 200);
      const inf = essais % 3 === 0 ? ["accident_travail", "fraude_fiscale", "corruption", "abs"][essais % 4] : essais % 3 === 1 ? ["vol", "stups_trafic", "escroquerie", "rebellion", "alcool"][essais % 5] : undefined;
      let cs;
      try { cs = CR.GEN.open(s, "copj", { inf }); } catch (e) { continue; }
      const p = s.generated.find((x) => x.id === cs.id);
      const t = p.t;
      const def = CR.caseDef(cs);
      const api = CR.api(s, cs);
      cs.status = "active"; cs.engaged = s.day;
      try { CR.runHook(s, cs, "engaged", {}); if (t.cjip) CR.runHook(s, cs, "_cjipNon", {}); } catch (e) { ok(false, `${cs.id} : engagement : ${e.message}`, "n12:eng"); continue; }
      const x = B.ctx(p);
      // comme à l'audience : les réquisitions sont prises après la discussion de la récidive, puis le tribunal délibère
      const juger = (played, angle) => { cs.vars.requis = CR.ACT.requis(api, B.requisDyn(x, api)); return def.on.decider(api, { st: { played: new Set(played || []), angle: angle || "peine", dernierMot: "regrets" } }); };
      try {
        // l'audience se construit, avec ses étapes du n° 12
        const sc = def.audiences.tc(api);
        ok(sc.steps.length > 8, `${cs.id} : audience vide`, "n12:aud");
        // la récidive se discute pour une personne physique ; une société cliente est jugée sans elle (B.qPrincipale)
        if (t.rec && t.recid && !x.pmClient && (got.vice < want.vice || got.valide < want.valide)) {
          const steps = JSON.stringify(sc.steps.map((st) => Object.keys(st)));
          ok(/choose/.test(steps), `${cs.id} : pas d'étape pour discuter la récidive`, "n12:steprec");
          const q0 = CAT.qualifier(t.inf, t.f);
          const reqAvec = B.requisDyn(x, api);
          if (t.recid.vice) {
            // la défense ne dit rien : le jugement retient la récidive, maximum doublé
            def.on._contesterRecidive(api, { motif: null });
            const d0 = juger([]);
            if (d0.coupable && d0.qualif && !t.conc && !t.q2) ok(d0.qualif.encourue.prison === t.q.prison && d0.questions.some((q) => /retient l'état de récidive/.test(q.r)), `${cs.id} : sans observation, le jugement aurait dû retenir la récidive`, "n12:silence");
            n12.silence++;
            rouvrir(cs);
            // un mauvais motif ne suffit pas
            const autre = Object.keys(G.VICES).find((k) => k !== t.recid.vice);
            def.on._contesterRecidive(api, { motif: autre });
            ok(!cs.vars.recEcartee, `${cs.id} : récidive écartée pour un mauvais motif`, "n12:mauvais");
            rouvrir(cs);
            // le bon motif : la récidive tombe, les réquisitions baissent, le maximum n'est plus doublé
            const lignes = def.on._contesterRecidive(api, { motif: t.recid.vice });
            ok(cs.vars.recEcartee && lignes.some((l) => /ne retient pas la récidive/.test(l.t)), `${cs.id} : la récidive ne tombe pas`, "n12:tombe");
            const reqSans = B.requisDyn(x, api);
            ok((reqSans.ferme || 0) + (reqSans.sursis || 0) <= (reqAvec.ferme || 0) + (reqAvec.sursis || 0) && (reqSans.ferme || 0) < (reqAvec.ferme || 0) + 1, `${cs.id} : les réquisitions ne baissent pas sans la récidive`, "n12:requis");
            const d1 = juger([]);
            if (d1.coupable && d1.qualif && !t.conc && !t.q2) ok(d1.qualif.encourue.prison === q0.prison && d1.questions.some((q) => /ne retient pas l'état de récidive/.test(q.r)), `${cs.id} : récidive écartée mais maximum toujours doublé`, "n12:pasdouble");
            if (d1.peine && d1.qualif) ok(d1.peine.ferme + d1.peine.sursis <= d1.qualif.encourue.prison, `${cs.id} : peine au-delà du maximum non doublé`, "n12:max");
            got.vice++; n12.contest++;
          } else if (t.recid.valide) {
            def.on._contesterRecidive(api, { motif: "delai" });
            ok(!cs.vars.recEcartee, `${cs.id} : récidive constituée écartée à tort`, "n12:valide");
            const d2 = juger([]);
            if (d2.coupable && d2.qualif && !t.conc && !t.q2) ok(d2.qualif.encourue.prison === t.q.prison, `${cs.id} : récidive constituée non appliquée au jugement`, "n12:valjug");
            got.valide++;
          }
          rouvrir(cs);
        }
        if (t.conc && got.concAud < want.concAud) {
          const d3 = juger(["arg:cumul"]);
          if (d3.coupable && d3.qualif) { ok(d3.qualif.encourue.prison === t.enc.prison && (!d3.peine || d3.peine.ferme + d3.peine.sursis <= t.enc.prison), `${cs.id} : maximum en concours au jugement`, "n12:concjug"); ok(d3.questions.some((q) => /132-3|plafond|une seule peine/.test(q.motif || "")), `${cs.id} : le jugement n'explique pas le concours`, "n12:concmotif"); }
          got.concAud++; rouvrir(cs);
        }
        if (t.PM && got.pm < want.pm && x.pmClient) {
          const d4 = juger([]);
          if (d4.coupable && d4.qualif) { ok(d4.qualif.encourue.prison === 0 && d4.qualif.encourue.amende >= CAT.qualifier(t.inf, t.f).amende * 5, `${cs.id} : société sans amende quintuplée`, "n12:pmjug"); ok(!d4.peine || (d4.peine.ferme + d4.peine.sursis === 0 && d4.peine.amende <= d4.qualif.encourue.amende), `${cs.id} : société condamnée à de la prison`, "n12:pmprison"); n12.pmJug++; }
          got.pm++; rouvrir(cs);
        }
        if (t.cjip && got.cjip < want.cjip) { ok(def.docs.proposition_cjip && t.cjip.amende <= CAT.cjipPlafond(t.PM.ca), `${cs.id} : CJIP sans proposition ou au-delà du plafond`, "n12:cjip"); got.cjip++; }
        if (t.presc && got.presc < want.presc) {
          const l = def.on._exceptionN12(api, { quoi: "presc" });
          const acq = CAT.prescriptionOcculte(t.presc, 6).acquise;
          ok(!!cs.vars.prescriptionAcquise === acq, `${cs.id} : prescription mal tranchée`, "n12:presc2");
          const d5 = juger([]);
          ok(acq ? !d5.coupable && /prescription/.test(d5.dispositif) : true, `${cs.id} : prescription acquise mais condamnation`, "n12:presc3");
          got.presc++; rouvrir(cs);
        }
        if (t.inf === "fraude_fiscale" && t.f.plainte && got.fisc < want.fisc) {
          def.on._exceptionN12(api, { quoi: "fisc" });
          ok(!!cs.vars.fiscIrrecevable === (t.f.plainte === "aucune"), `${cs.id} : plainte préalable mal tranchée`, "n12:fisc");
          got.fisc++; n12.fisc++; rouvrir(cs);
        }
        if (t.deleg && got.deleg < want.deleg) {
          const d6 = juger(["arg:delegation"], "relaxe");
          if (t.client === "A" && CAT.delegationValide(t.deleg)) ok(!d6.coupable, `${cs.id} : délégation valable plaidée, dirigeant condamné`, "n12:deleg2");
          got.deleg++; n12.deleg++; rouvrir(cs);
        }
        // débrief et fiche : la règle et ses articles
        const deb = def.debrief(api, { type: "condamnation" });
        const fiche = def.fiche(api, { type: "condamnation" });
        const EL12 = t.recid && t.ant && !t.ant.mineur && !x.pmClient ? CAT.etatLegal(t.ant, { inf: t.inf, q: x.q0, faits: t.d.faits }) : null;
        if (EL12 && (EL12.etat || EL12.regle)) ok(deb.some((d) => /art\. 132-/.test(d.text)), `${cs.id} : débrief sans la règle de la récidive`, "n12:debrec");
        if (t.conc) ok(deb.some((d) => /132-3/.test(d.text)) && fiche.notions.some((n) => /132-2/.test(n.art)), `${cs.id} : débrief ou fiche sans le concours`, "n12:debconc");
        if (t.PM) ok(deb.some((d) => /131-38/.test(d.text)) && fiche.notions.some((n) => /121-2/.test(n.art)), `${cs.id} : débrief ou fiche sans la personne morale`, "n12:debpm");
        for (const k of [].concat(...fiche.notions.map((n) => (n.art.match(/art\. [^;]+/g) || [])))) ok(!/undefined/.test(k), `${cs.id} : article illisible dans la fiche`, "n12:ficheart");
        if (t.PM) n12.pm++; if (t.cjip) n12.cjip++; if (t.presc) n12.presc++;
      } catch (e) { ok(false, `${cs.id} (${t.inf}) : ${e.stack.split("\n").slice(0, 3).join(" | ")}`, "n12:exc"); }
    }
    for (const k of Object.keys(want)) ok(got[k] >= Math.min(1, want[k]), `n° 12 : aucun cas « ${k} » joué en ${essais} affaires`, "n12:want:" + k);
    // e. textes : chaque article du n° 12 est dans la base, se relit et se cite
    const T12 = ["CP_121-2", "CP_121-3", "CP_131-38", "CP_131-39", "CP_132-2", "CP_132-3", "CP_132-4", "CP_132-5", "CP_132-7", "CP_132-8", "CP_132-9", "CP_132-10", "CP_132-11", "CP_132-16", "CP_132-16-2", "CP_132-16-4", "CP_132-16-5", "CP_132-16-7", "CP_132-35", "CP_132-36", "CP_321-5", "CP_222-19", "CPP_9-1", "CPP_41-1-2", "CPP_705", "CPP_706-43", "LPF_L228", "CP_222-52"];
    for (const k of T12) ok(CR.TEXTES[k] && CR.lib(k) && CR.refOfId(k) && CR.refKey(CR.parseCite(CR.TEXTES[k].cite.replace(/\s*\(.*\)$/, ""), "CPP")) === k, `texte ${k} absent, illisible ou mal relu`, "n12:texte:" + k);
    ok(CR.citeBaseCheck(T12).length === 0, "n° 12 : base des textes", "n12:citebase");
    // f. la cour criminelle départementale : un seul réglage, que suivent le moteur et le texte de l'art. 380-16
    const save = CR.CCD_RECIDIVE;
    const qc = Object.assign(CAT.crime(240, 0, "art. 311-8 CP", "vol avec arme"), { recidive: true });
    for (const v of [false, true]) {
      CR.CCD_RECIDIVE = v;
      ok(CAT.CCD_HORS_RECIDIVE === !v && CAT.juridictionCrime(qc, 30) === (v ? "ccd" : "assises") && /récidive/.test(CR.TEXTES["CPP_380-16"].texte) && /récidive/.test(CR.ccdRegle()), `cour criminelle départementale : réglage ${v} mal suivi`, "n12:ccd");
    }
    CR.CCD_RECIDIVE = save;
    console.log(`n° 12 : ${n12.conc} affaires à plusieurs infractions (${Object.entries(n12.sc).map(([k, v]) => k + " " + v).join(", ")}) ; récidives constituées ${n12.recVal}, réitérations ${n12.reit}, concours avec une condamnation pas définitive ${n12.concours} ; récidives erronées ${JSON.stringify(n12.vice)} (casier relu ${n12.b1}) ; audiences : récidive soulevée ${n12.contest}, silence ${n12.silence}, sociétés jugées ${n12.pmJug} ; personnes morales ${n12.pm}, CJIP ${n12.cjip}, prescription ${n12.presc}, plainte fiscale ${n12.fisc}, délégation ${n12.deleg} ; ${pmOk} fiches à l'amende quintuplée ; ${essais} affaires ouvertes`);
  }

  // =================================================================== 11. PHASE 2 : les crimes et l'information judiciaire
  const PARC = +(process.argv[3] || 200);
  const CAT = CR.CAT;
  const sc = { inf: {}, ctx: {}, jur: {}, camp: {}, entree: {}, issue: {}, irr: {}, mineur: 0, proc: 0, rec: 0, requalif: 0, joues: 0, huis: 0, jury: 0, reglement: {}, appel: 0, mois: [] };
  const exC = [];
  const FLOW = ["ordo_dp_live", "pv_ipc_live", "pv_interro", "contre_expertise", "reconstitution", "avis175", "ordo_reglement", "arret_chins", "ordo_prolong", "verdict", "ordo_transmission", "arret_irresp"];
  const jurAttendue = (q, age) => {
    if (q.nature !== "crime") return age < 18 ? "tpe" : "tc";
    if (age < 16) return "tpe";
    if (age < 18) return "assises_mineurs";
    if (q.stups) return "assises_spe";
    if (!q.perpetuite && [180, 240].includes(q.prison) && !q.recidive) return "ccd";
    return "assises";
  };
  // assister à une audience à la place du joueur : construire le script, puis appliquer ses effets
  const PLAYED = (t, def) => new Set(["arg:garanties", "arg:144", "arg:cj", "arg:duree", "arg:personnalite", "K_attest", "G_heberg"].concat(t.enjeux.flatMap((e) => ["arg:" + e, "E_" + e])));
  const assister = (s, cs, h, t, def, journal) => {
    const api = CR.api(s, cs);
    let script;
    try { script = def.audiences[h.script](api, h); } catch (e) { ok(false, `${cs.id} : audience ${h.script} : ${e.stack.split("\n").slice(0, 2).join(" | ")}`, "aud:" + h.script); return; }
    ok(script && script.steps && script.steps.length >= 3, `${cs.id} : audience ${h.script} vide`, "audvide:" + h.script);
    const js = JSON.stringify(script.steps, (k, v) => (typeof v === "function" ? undefined : v));
    ok(!/undefined|NaN|\[object Object\]/.test(js), `${cs.id} : audience ${h.script} incomplète ${(js.match(/.{60}(undefined|NaN|\[object Object\]).{20}/) || [""])[0]}`, "audinc:" + h.script);
    h.attended = true;
    const played = PLAYED(t, def);
    const st = { played, angle: "relaxe", dernierMot: "regrets" };
    if (h.script === "proces") {
      const jur = cs.vars.enAppel ? cs.vars.jurAppel : cs.vars.jurProces;
      const jury = ["assises", "assises_mineurs", "assises_appel"].includes(jur) && !(jur === "assises_appel" && CAT.INF[t.inf].fam === "crim_stups");
      ok(!!script.jury === jury, `${cs.id} : jury ${script.jury} devant ${jur}`, "jury");
      ok(!jury || script.juryN === (jur === "assises_appel" ? 9 : 6), `${cs.id} : nombre de jurés`, "juryN");
      if (jury) sc.jury++;
      const huis = /huis clos/i.test(js);
      const sexAdulte = CAT.INF[t.inf].fam === "crim_sexuel" && t.V && t.V.age >= 18 && !journal.proc;
      if (huis) sc.huis++;
      ok(!huis || sexAdulte, `${cs.id} : huis clos hors d'un crime sexuel sur majeur`, "huis");
      ok(!t.mineur || /publicité restreinte/.test(js), `${cs.id} : mineur jugé sans publicité restreinte`, "restreinte");
      const dec = CR.runHook(s, cs, "decider", { st });
      ok(dec && dec.questions && dec.dispositif, `${cs.id} : décision vide`, "decvide");
      if (dec && dec.coupable && dec.peine) {
        const R0 = cs.vars.reglement;
        const qq = dec.qualif && dec.qualif.favorable ? t.q2 : R0.qual === "q2" ? t.q2 : t.q;
        const max = t.mineur ? CAT.encourueMineur(qq) : qq.perpetuite ? 360 : qq.prison;
        ok(dec.peine.ferme + (dec.peine.sursis || 0) <= Math.max(max, dec.peine.perpetuite ? 360 : 0), `${cs.id} : peine ${dec.peine.texte} au-delà de ${max} mois (${qq.label})`, "max");
        ok(!dec.peine.perpetuite || (qq.perpetuite && !t.mineur), `${cs.id} : perpétuité non encourue`, "perp");
        ok(qq.nature !== "crime" || dec.peine.ferme < 120 || /réclusion/.test(dec.peine.texte), `${cs.id} : crime sans réclusion (${dec.peine.texte})`, "reclusion");
        ok(!/undefined|NaN/.test(dec.dispositif + dec.peine.texte), `${cs.id} : dispositif incomplet`, "dispo");
        journal.peine = dec.peine.texte;
      }
      CR.runHook(s, cs, h.done, { decision: dec, played: [...played] });
      return;
    }
    const dk = { ipc: "ipcDecider", ipc_convoc: "ipcDecider", jld: "jldDecider", prolong: "prolongDecider", chins: "chinsDecider", chins_irresp: "irrespDecider" }[h.script];
    if (dk) CR.runHook(s, cs, dk, { played });
    if (h.done) CR.runHook(s, cs, h.done, { played: [...played] });
  };
  const jouer = (s, cs, p, present) => {
    const t = p.t;
    const def = CR.caseDef(cs);
    const journal = { proc: false };
    try { journal.proc = !!CR.GEN2.recit(t, p.niveau).procedural; } catch (e) {}
    cs.status = "active"; cs.engaged = s.day; cs.lastUpdate = s.day;
    CR.unschedule(s, (ev) => ev.caseId === cs.id && ["_leadExpire", "_permanenceExpire"].includes(ev.key));
    CR.runHook(s, cs, "engaged", {});
    if (t.camp === "pc") CR.runHook(s, cs, "_constituee", {});
    else if (["detenu", "libre"].includes(t.entree)) CR.runHook(s, cs, "_designe", {});
    const dpm = CAT.dpMax(t.q, t.ageFaits, t.bo);
    let dpDebut = cs.proc.detention.statut === "dp" ? cs.proc.detention.since : null;
    const fin = s.day + 1400;
    let obsDeposees = false;
    while (cs.status !== "closed" && s.day < fin) {
      // les audiences du jour
      if (present) for (let k = 0; k < 6; k++) { const h = cs.hearings.find((x) => x.day === s.day && !x.attended && !x.missed && !x.canceled); if (!h || cs.status === "closed") break; s.min = h.min; assister(s, cs, h, t, def, journal); }
      // le joueur dépose ses observations dans le mois de l'avis
      if (present && cs.vars.avis175Day != null && !obsDeposees && s.day >= cs.vars.avis175Day + 5) {
        obsDeposees = true;
        const v = t.camp === "pc" ? "crime" : t.f.psy === "aboli" ? "irresp" : t.q2 ? "requalif" : "nonlieu";
        CR.runHook(s, cs, "filed_observations_175", { res: { filled: { qualif: v }, picks: { points: t.enjeux.slice() }, defects: [] } });
      }
      // détention provisoire : jamais au-delà du plafond avant l'ordonnance de règlement
      const det = cs.proc.detention;
      if (det.statut === "dp" && dpDebut == null) dpDebut = det.since;
      if (det.statut !== "dp" && !cs.vars.reglement) dpDebut = null;
      if (dpDebut != null && !cs.vars.reglement) ok(s.day - dpDebut <= dpm.max, `${cs.id} : détention provisoire de ${s.day - dpDebut} jours (plafond ${dpm.max})`, "dpmax");
      s.pending = s.pending.filter((e) => e.type !== "lead" && !(e.type === "case" && e.caseId !== cs.id && s.cases[e.caseId] && s.cases[e.caseId].status !== "closed" && false));
      s.min = 23 * 60;
      CR.endDay(s);
      if (s.gameOver || s.burnout) { s.gameOver = false; s.burnout = false; }
    }
    ok(cs.status === "closed", `${cs.id} (${t.inf}/${t.f.ctx}, ${t.entree}, ${present ? "présent" : "absent"}) : dossier non terminé après ${s.day - p.day} jours (stade ${cs.proc.stade})`, "nonclos");
    const R0 = cs.vars.reglement;
    if (R0) {
      sc.reglement[R0.type] = (sc.reglement[R0.type] || 0) + 1;
      ok(cs.vars.avis175Day != null && R0.day - cs.vars.avis175Day >= ((t.detenu || t.dpRequise) ? 30 : 90), `${cs.id} : règlement ${R0.day - cs.vars.avis175Day} jours après l'avis`, "175");
      const qq = R0.qual === "q2" && t.q2 ? t.q2 : t.q;
      ok(R0.type === "nonlieu" || R0.type === "irresp" || R0.type === "transmission" || R0.jur === jurAttendue(Object.assign({ stups: CAT.INF[t.inf].fam === "crim_stups" }, qq), t.ageFaits), `${cs.id} : renvoi devant ${R0.jur} pour ${qq.label}`, "renvoi");
      ok((R0.type === "oma") === (qq.nature === "crime") || ["nonlieu", "irresp", "transmission"].includes(R0.type), `${cs.id} : ordonnance ${R0.type} pour un ${qq.nature}`, "omaortc");
      const a = cs.hearings.find((h) => h.script === "proces");
      if (a && cs.vars.dpAuReglement) ok(a.day - R0.day <= 365, `${cs.id} : accusé détenu jugé ${a.day - R0.day} jours après l'ordonnance`, "181");
      if (a) ok(cs.proc.audience && CR.PROC.JURIDICTIONS[cs.vars.jurProces], `${cs.id} : juridiction de jugement inconnue ${cs.vars.jurProces}`, "jurproc");
    }
    if (cs.vars.enAppel) sc.appel++;
    sc.issue[(cs.outcome || {}).type] = (sc.issue[(cs.outcome || {}).type] || 0) + 1;
    sc.mois.push(Math.round((s.day - p.day) / 30));
    sc.joues++;
    return journal;
  };
  const sigC = new Set();
  let nc = 0;
  // l'échantillon joué ne teste que le dossier : ni réclamation au bâtonnier, ni fin de partie
  const plainteVraie = CR.plainteBatonnier, finVraie = CR.endGame;
  const plaintes = {};
  CR.plainteBatonnier = (s, cs, kind) => { plaintes[kind] = (plaintes[kind] || 0) + 1; return null; };
  CR.endGame = () => {};
  for (const seed of SEEDS) {
    const s = CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: seed + 1000 });
    s.settings.saisie = "liste";
    const ouverts = [];
    for (let i = 0; i < PARC; i++) {
      s.day = 20 + i * 2; s.min = 9 * 60 + 5 + (i % 5) * 50;
      let cs, p;
      try { cs = CR.GEN.open(s, "info", { min: s.min }); p = s.generated.find((x) => x.id === cs.id); }
      catch (e) { ok(false, `crime graine ${seed} n° ${i} : ${e.stack.split("\n").slice(0, 3).join(" | ")}`, "ctirage"); continue; }
      nc++;
      const t = p.t;
      const def = CR.caseDef(cs);
      const I = CAT.INF[t.inf];
      ok(I.info, `${cs.id} : infraction hors du catalogue criminel`, "cinfo");
      // 1. cohérence (qualification, peine, prescription, juridiction, délais de détention et d'instruction)
      const pb = CR.GEN2.verifier(t);
      ok(!pb.length, `${cs.id} (${t.inf}/${t.f.ctx}) : ${pb.join(" ; ")}`, "cverif:" + pb[0]);
      ok(!sigC.has(t.sig) && !sigs.has(t.sig), `${cs.id} : affaire en double`, "cdouble");
      sigC.add(t.sig);
      const q = t.rec ? CAT.avecRecidive(CAT.qualifier(t.inf, t.f)) : CAT.qualifier(t.inf, t.f);
      ok(q.prison === t.q.prison && q.court === t.q.court && !!q.perpetuite === !!t.q.perpetuite, `${cs.id} : peine stockée ≠ catalogue`, "cpeine");
      ok(t.jur === jurAttendue(Object.assign({ stups: I.fam === "crim_stups" }, q), t.ageFaits), `${cs.id} : juridiction ${t.jur} (${q.label}, ${t.ageFaits} ans)`, "cjur");
      if (q.nature === "crime") ok(CAT.dpMax(q, t.ageFaits, t.bo).max <= (t.ageFaits < 16 ? 365 : t.ageFaits < 18 ? 730 : 1460), `${cs.id} : plafond de détention`, "cdpm");
      for (const k of t.q.textes) ok(CR.TEXTES[k] && CR.lib(k) && CR.refOfId(k), `${cs.id} : texte ${k} absent`, "ctexte:" + k);
      for (const e of t.enjeux) for (const k of CAT.ENJEUX[e].textes || []) ok(CR.TEXTES[k], `${cs.id} : texte d'enjeu ${k} absent`, "ctexte:" + k);
      // 2. pièces : complètes, irrégularités portées sans être annoncées, mineurs victimes jamais nommés
      const N = CR.GEN2.recit(t, p.niveau);
      const flags = new Set();
      const nomV = t.V ? `${t.V.prenom} ${t.V.nom}` : null;
      for (const k of Object.keys(def.docs)) {
        if (FLOW.includes(k)) continue;
        let r;
        try { r = CR.renderDoc(s, cs, { key: k, vars: {} }); } catch (e) { ok(false, `${cs.id}/${k} : ${e.message}`, "crender:" + k); continue; }
        const js = JSON.stringify(r);
        ok(!/undefined|NaN|\[object Object\]|\{[a-zA-Z_]+\}/.test(js), `${cs.id}/${k} (${t.inf}/${t.f.ctx}) : texte incomplet ${(js.match(/.{60}(undefined|NaN|\[object Object\]|\{[a-zA-Z_]+\}).{30}/) || [""])[0]}`, "cincomplet:" + k);
        for (const g of segs(r)) if (g.flag) flags.add(g.flag);
        if (segs(r).some((g) => g.flag)) ok(!REVELE.test(allText(r)), `${cs.id}/${k} : la pièce annonce l'irrégularité`, "crevele");
        for (const g of segs(r)) if (g.f) ok(def.facts[g.f] || /^(G_|P_|K_)/.test(g.f), `${cs.id}/${k} : fait inconnu ${g.f}`, "cfait");
        if (N.procedural && nomV) ok(!js.includes(nomV), `${cs.id}/${k} : mineur victime nommé (${nomV})`, "cmineurnom");
      }
      if (N.procedural && nomV) ok(!JSON.stringify(def.calls.intake || {}).includes(nomV) && !def.title.includes(t.V.prenom), `${cs.id} : mineur victime nommé dans l'appel`, "cmineurnom2");
      for (const fl of Object.keys(def.anomalies || {})) ok(flags.has(fl), `${cs.id} : anomalie ${fl} absente des pièces`, "canomalie:" + fl);
      for (const id of t.irr) ok(def.anomalies[id], `${cs.id} : irrégularité ${id} sans pièce`, "cirr:" + id);
      // 3. audiences : chaque script se construit
      const api = CR.api(s, cs);
      for (const k of Object.keys(def.audiences)) { try { const a = def.audiences[k](api, {}); ok(a.steps.length >= 3, `${cs.id} : audience ${k} vide`, "caud"); } catch (e) { ok(false, `${cs.id} : audience ${k} : ${e.stack.split("\n").slice(0, 2).join(" | ")}`, "caud:" + k); } }
      // statistiques
      sc.inf[t.inf] = (sc.inf[t.inf] || 0) + 1; sc.ctx[t.inf] = sc.ctx[t.inf] || new Set(); sc.ctx[t.inf].add(t.f.ctx);
      sc.jur[t.jur] = (sc.jur[t.jur] || 0) + 1; sc.camp[t.camp] = (sc.camp[t.camp] || 0) + 1; sc.entree[t.entree] = (sc.entree[t.entree] || 0) + 1;
      for (const id of t.irr) sc.irr[id] = (sc.irr[id] || 0) + 1;
      if (t.mineur) sc.mineur++; if (N.procedural) sc.proc++; if (t.rec) sc.rec++; if (t.q2) sc.requalif++;
      if (seed === 11 && exC.length < 40) exC.push({ id: cs.id, t, titre: def.title, N });
      ouverts.push({ cs, p });
      if (cs.status !== "closed") CR.closeCase(s, cs, { type: "lost-lead" });
    }
    // 4. un échantillon joué jusqu'au bout, dans une partie à part : présent à tout, ou absent de tout
    const JOUES = Math.max(4, Math.round(PARC / 10));
    for (let j = 0; j < JOUES; j++) {
      const sj = CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: seed * 7 + j });
      sj.settings.saisie = "liste";
      sj.pending = sj.pending.filter((e) => e.type !== "lead");
      sj.day = 30 + j; sj.min = 9 * 60 + 5;
      sj.genInfo = { next: 1e9, n: 0 };
      let cs, p;
      try { cs = CR.GEN.open(sj, "info", { min: sj.min }); p = sj.generated.find((x) => x.id === cs.id); }
      catch (e) { ok(false, `jeu graine ${seed} : ${e.message}`, "jtirage"); continue; }
      const present = j % 4 !== 3;
      try {
        const jr = jouer(sj, cs, p, present);
        if (seed === 11 && j < 6) console.log(`  joué ${cs.id} ${p.t.inf}/${p.t.f.ctx} (${p.t.entree}, ${p.t.camp}, ${present ? "présent" : "absent"}) : ${(cs.vars.reglement || {}).type || "-"} → ${(cs.outcome || {}).type}${jr.peine ? " — " + jr.peine : ""} ; ${Math.round((sj.day - p.day) / 30)} mois`);
      } catch (e) { ok(false, `${cs.id} (${p.t.inf}/${p.t.f.ctx}) : partie jouée : ${e.stack.split("\n").slice(0, 4).join(" | ")}`, "jeu"); }
    }
    // 5. sauvegarde des affaires criminelles : rechargement et reconstruction identiques
    CR.store.s = s;
    const json = CR.serialize(s);
    const ids = s.generated.map((g) => g.id);
    const t0 = CR.caseDef(s.cases[ids[3]]).title, r0 = JSON.stringify(CR.renderDoc(s, s.cases[ids[3]], { key: "pv_gav", vars: {} }));
    for (const id of ids) delete CR.CASES[id];
    const s2 = CR.deserialize(json);
    ok(ids.every((id) => CR.CASES[id]) && CR.caseDef(s2.cases[ids[3]]).title === t0 && JSON.stringify(CR.renderDoc(s2, s2.cases[ids[3]], { key: "pv_gav", vars: {} })) === r0, `crimes graine ${seed} : reconstruction différente`, "crestore");
    console.log(`crimes, graine ${seed} : ${PARC} affaires, ${JOUES} jouées, sauvegarde ${Math.round(json.length / 1024)} Ko`);
  }
  CR.plainteBatonnier = plainteVraie; CR.endGame = finVraie;
  if (Object.keys(plaintes).length) console.log("réclamations (neutralisées) pendant les parties jouées :", JSON.stringify(plaintes));
  // 6. au moins huit contextes effectivement tirés pour chaque crime ; déterminisme ; rythme des affaires criminelles
  for (const id of CAT.ORDRE.filter((x) => CAT.INF[x].info)) ok(sc.ctx[id] && sc.ctx[id].size >= 8, `${id} : ${sc.ctx[id] ? sc.ctx[id].size : 0} contextes tirés sur ${Object.keys(CAT.INF[id].ctxs).length}`, "ctx:" + id);
  { const b1 = CR.GEN2.tirer("g_info_3:42", "info", { day: 40 }), b2 = CR.GEN2.tirer("g_info_3:42", "info", { day: 40 }); ok(b1.sig === b2.sig && JSON.stringify(b1) === JSON.stringify(b2), "tirage criminel non déterministe", "cdet"); }
  {
    const s = CR.store.s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 5 });
    let k = 0; for (let d = 1; d <= 365; d++) if (CR.GEN2.infoDue(s, d)) k++;
    ok(k >= 5 && k <= 15, `affaires criminelles sur une année : ${k}`, "rythme");
    console.log(`affaires criminelles arrivées sur une année de carrière : ${k}`);
  }
  const topC = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ");
  console.log(`\naffaires criminelles : ${nc} ; crimes : ${topC(sc.inf)}`);
  console.log("contextes tirés :", Object.entries(sc.ctx).map(([k, v]) => `${k} ${v.size}/${Object.keys(CAT.INF[k].ctxs).length}`).join(", "));
  console.log("juridictions :", topC(sc.jur), "| camps :", topC(sc.camp), "| entrées :", topC(sc.entree));
  console.log(`mineurs auteurs : ${sc.mineur} | mineurs victimes (procédural) : ${sc.proc} | récidive : ${sc.rec} | requalification possible : ${sc.requalif} | irrégularités : ${topC(sc.irr)}`);
  console.log(`jouées : ${sc.joues} ; règlements : ${topC(sc.reglement)} ; issues : ${topC(sc.issue)} ; appels : ${sc.appel} ; jurys : ${sc.jury} ; huis clos : ${sc.huis} ; durée moyenne ${Math.round(sc.mois.reduce((a, b) => a + b, 0) / Math.max(1, sc.mois.length))} mois`);
  if (process.env.EXEMPLES) for (const e of exC) console.log("\nCRIME", e.id, "|", e.titre, "|", e.t.inf, e.t.f.ctx, "|", e.t.q.label, "|", e.t.q.court, "|", CAT.encourueTexte(e.t.q), "|", e.t.jur, e.t.camp, e.t.entree, "| âge", e.t.ageFaits, "| enjeux", e.t.enjeux.join(","), "| irr", e.t.irr.join(","), "| requalif", e.t.q2 ? e.t.q2.label : "-", "\n   ", e.N.resume);
  const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ");
  console.log(`\naffaires : ${n} ; infractions distinctes : ${Object.keys(st.inf).length}/${CR.CAT.ORDRE.filter((x) => !CR.CAT.INF[x].info).length} ; pièces rendues : ${st.pieces} ; vocabulaire : ${st.mots.size} mots`);
  console.log("familles :", top(st.fam));
  console.log("genres :", top(st.genre));
  console.log("voies :", top(st.voie), "| juridictions :", top(st.jur));
  console.log(`irrégularités : ${top(st.irr)} | affaires avec un doute : ${st.doutes} | requalification possible : ${st.requalif} | récidive : ${st.rec}`);
  console.log("infractions :", top(st.inf));
  if (process.env.EXEMPLES) for (const e of exemples) console.log("\nEXEMPLE", e.id, e.kind, "|", e.titre, "|", e.t.q.label, "|", e.t.q.court, "|", CR.CAT.encourueTexte(e.t.q), "|", e.t.voie, e.t.jur, "| irr", e.t.irr.join(","), "| doutes", e.t.doutes.join(","), "| requalif", e.t.q2 ? e.t.q2.label : "-");
  console.log("\néchecs:", fails);
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
