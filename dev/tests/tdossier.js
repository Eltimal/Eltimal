// Dossier à fouiller (feuille de route, n° 2) : pièces complètes, irrégularités non signalées, relevé par le joueur,
// incohérence entre deux pièces, enquête de la défense (délais d'effacement), indices, anciennes sauvegardes.
const { boot, sleep, texts, findBtn, click } = require("./harness");
const P = require("./play");
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log("ÉCHEC", m); } };
// Faits portés par les anciennes pièces : aucun ne doit disparaître (le droit des affaires ne change pas)
const ANCIENS = { a02_sac: ["A2_casier_b1", "A2_debut", "A2_esr", "A2_notif_1515", "A2_sac_main", "A2_victime_doute"], a03_crpc: ["A3_audience_tc", "A3_casier_b1", "A3_ethylo_pv", "A3_mesures", "A3_pas_ivresse"], a04_voisin: ["A4_audition_date", "A4_itt2_doc", "A4_lunettes_facture", "A4_pichon_ecarte", "A4_recours", "A4_temoin_pv"], a05_placement: ["A5_age", "A5_amf_doc", "A5_aveu", "A5_flux", "A5_garanti", "A5_isoler", "A5_mex", "A5_recepisse", "A5_virements_doc"], a06_messages: ["K_certif", "K_femme", "K_nombre", "K_plainte_peur", "K_regretter"], a07_perquisition: ["K7_aucune_vente", "K7_decouverte", "K7_pas_ordonnance", "K7_pesee", "K7_pv_heure", "K7_version"], a08_cycliste: ["F8_camera", "F8_casque", "F8_causal", "F8_facture", "F8_faits_pv", "F8_offre", "F8_offre_partage", "F8_prelevement", "F8_temoin_pv", "F8_thc", "F8_tox", "F8_version", "F8_video_feu", "F8_vitesse", "F8_vitesse_dite"], a09_malik: ["K9_deux_coups", "K9_faits", "K9_hugo_version", "K9_itt", "K9_lame", "K9_melee", "K9_perso", "K9_peur", "K9_plaies", "K9_rendu", "K9_trois", "K9_video_coups", "K9_video_sol", "K9_vital"], a09_hugo: ["K9_deux_coups", "K9_faits", "K9_hugo_version", "K9_itt", "K9_lame", "K9_melee", "K9_perso", "K9_peur", "K9_plaies", "K9_rendu", "K9_trois", "K9_video_coups", "K9_video_sol", "K9_vital"], a10_vendredi: ["N_12000_doc", "N_ordres", "N_peine", "N_prononce", "N_remboursement"], a11_president: ["K11_domaine", "K11_kbis", "K11_main_courante", "K11_ordre_doc"], a12_bijouterie: ["J_adn", "J_borne", "J_faits", "J_reco", "J_replique", "J_version"], tuto_lucas: ["F1_audience", "F1_aveu", "F1_fracture_doc", "F1_t_alcool", "F1_umj10", "F1_umj_date", "F1_urg6", "F1_v_chute", "F1_v_coup", "F1_v_pousse", "F1_v_recul", "F1_v_secours"], tuto_thomas: ["F2_audience", "F2_casier_b1", "F2_fracture_doc", "F2_lucas_nie", "F2_pv_aveu", "F2_pv_frapper", "F2_t_alcool", "F2_umj10", "F2_umj_date", "F2_urg6", "F2_v_chute", "F2_v_coup", "F2_v_pousse", "F2_v_recul", "F2_v_secours"] };
const REVELE = /irrégularit|aucune autorisation|aucune ordonnance|nullit|ne mentionne aucune|tardive/i;

(async () => {
  const env = boot();
  const { w, CR, doc, errors } = env;
  await sleep(150);
  const segs = (r) => [].concat(...(r.paras || []), r.sigs || []).filter((x) => x && typeof x === "object");
  const allText = (r) => [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x.t)).join(" ");

  // 1. Toutes les pièces des affaires se lisent, gardent leurs faits, cachent leurs anomalies
  let nPieces = 0;
  for (const mode of ["carriere", "tutoriel"]) {
    const s = CR.newGame({ prenom: "A", nom: "B", mode, seed: 3 }); CR.store.s = s;
    for (const [id, def] of Object.entries(CR.CASES)) {
      if ((def.mode || "carriere") !== mode || def.generated) continue;
      const cs = CR.openCase(s, id);
      cs.proc.audience = cs.proc.audience || { day: s.day + 30, juridiction: "tc", convocDay: s.day };
      const facts = new Set(); const flags = new Set();
      for (const k of Object.keys(def.docs || {})) {
        let r; try { r = CR.renderDoc(s, cs, { key: k, vars: {} }); } catch (e) { ok(false, `${id}/${k} : ${e.message}`); continue; }
        nPieces++;
        ok(!/undefined|NaN/.test(JSON.stringify(r)), `${id}/${k} : texte incomplet`);
        for (const g of segs(r)) { if (g.f) facts.add(g.f); if (g.flag) flags.add(g.flag); }
        if (k.startsWith("enq_")) continue;
        if (Object.keys(def.anomalies || {}).length && segs(r).some((g) => g.flag)) ok(!REVELE.test(allText(r)), `${id}/${k} : la pièce signale elle-même l'irrégularité`);
      }
      for (const f of ANCIENS[id] || []) ok(facts.has(f), `${id} : le fait ${f} a disparu des pièces`);
      for (const fl of Object.keys(def.anomalies || {})) ok(flags.has(fl), `${id} : l'anomalie ${fl} n'est portée par aucun passage`);
    }
  }
  console.log("pièces rendues", nPieces);

  // 2. Relevé par le joueur : drapeau secret, note « Irrégularité » dans le bloc-notes, retrait lié
  let s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 7 }); CR.store.s = s;
  s.settings.coach = false;
  let cs = CR.openCase(s, "a02_sac"); cs.status = "active";
  const dn = CR.fileDoc(s, cs, { key: "pv_notification", title: "Notification des droits (D3)" });
  const rn = CR.renderDoc(s, cs, dn);
  const notif = segs(rn).find((g) => g.flag === "gav_notif");
  const banal = rn.paras.flat().find((g) => typeof g === "string" && /Avis du placement/.test(g));
  const i1 = CR.releverIrreg(s, cs, { seg: notif, ref: { doc: dn.id, titre: dn.title }, type: "heure", comment: "2 h 20 après" });
  const i2 = CR.releverIrreg(s, cs, { seg: banal, ref: { doc: dn.id, titre: dn.title }, type: "autre" });
  ok(i1 && i1.flag === "gav_notif", "relevé du bon passage : drapeau gav_notif");
  ok(i2 && !i2.flag, "relevé d'un passage banal : pas de drapeau");
  const n1 = cs.notes.find((n) => n.issueId === i1.id);
  ok(n1 && n1.cat === "irreg" && n1.link && n1.link.id === dn.id && /Heure ou délai/.test(n1.text), "la note part au bloc-notes, classée et reliée à la pièce");
  ok(CR.isSurl(cs, notif.t.trim()), "le passage relevé est surligné");
  CR.removeNote(cs, n1.id);
  ok(!cs.issues.some((i) => i.id === i1.id), "effacer la note retire l'irrégularité");
  CR.retirerIrreg(cs, i2.id);
  ok(!cs.notes.some((n) => n.issueId === i2.id), "retirer l'irrégularité efface sa note");
  // Indice du mode assisté : propre à la pièce tant que l'anomalie n'est pas trouvée
  ok(CR.indicesPiece(cs, rn).length === 1, "indice propre à la notification des droits");
  CR.releverIrreg(s, cs, { seg: notif, ref: { doc: dn.id }, type: "heure" });
  ok(CR.indicesPiece(cs, rn).length === 0, "plus d'indice une fois l'irrégularité relevée");

  // 3. Incohérence entre deux pièces (affaire générée, interprète absent)
  let gcs = null;
  for (let i = 0; i < 80 && !gcs; i++) { const c = CR.GEN.open(s, "gav", {}); const p = s.generated.find((x) => x.id === c.id); if (p.anomaly === "interprete") gcs = c; }
  ok(!!gcs, "une garde à vue générée avec interprète absent");
  // pièces des affaires générées : complètes, et chaque anomalie portée par un passage
  let nGen = 0;
  for (let i = 0; i < 45; i++) {
    const c = CR.GEN.open(s, ["gav", "ci", "op"][i % 3], { night: i % 2 === 0, min: s.min });
    c.proc.audience = c.proc.audience || { day: s.day + 30, juridiction: "tc", convocDay: s.day };
    const def = CR.caseDef(c); const flags = new Set();
    for (const k of Object.keys(def.docs)) {
      const r = CR.renderDoc(s, c, { key: k, vars: {} }); nGen++;
      ok(!/undefined|NaN/.test(JSON.stringify(r)), `${c.id}/${k} : texte incomplet`);
      for (const g of segs(r)) if (g.flag) flags.add(g.flag);
    }
    for (const fl of Object.keys(def.anomalies || {})) ok(flags.has(fl), `${c.id} : anomalie ${fl} absente des pièces`);
  }
  console.log("pièces générées rendues", nGen);
  if (gcs) {
    gcs.status = "active";
    const dI = CR.fileDoc(s, gcs, { key: "pv_interpellation", title: "Interpellation (D1)" });
    const dN = CR.fileDoc(s, gcs, { key: "pv_notification", title: "Notification des droits (D3)" });
    const langue = segs(CR.renderDoc(s, gcs, dI)).find((g) => g.paire === "interprete");
    const rN = CR.renderDoc(s, gcs, dN);
    const interp = segs(rN).find((g) => g.flag === "interprete" && /Interprète/.test(g.t));
    const sigI = (rN.sigs || []).find((g) => g.flag === "interprete");
    ok(langue && interp && sigI && sigI.t === "", "la langue (D1), la mention « Interprète » et la signature vide (D3) sont dans les pièces");
    const seul = CR.releverIrreg(s, gcs, { seg: langue, ref: { doc: dI.id }, type: "autre" });
    ok(seul && !seul.flag, "la seule pièce D1 ne suffit pas");
    CR.retirerIrreg(gcs, seul.id);
    const h = CR.surligner(s, gcs, interp, { doc: dN.id, titre: "D3" });
    const inc = CR.releverIrreg(s, gcs, { seg: langue, ref: { doc: dI.id, titre: "D1" }, type: "incoherence", avec: h.id });
    ok(inc && inc.flag === "interprete" && /à comparer avec/.test(gcs.notes.find((n) => n.issueId === inc.id).text), "l'incohérence reliée aux deux pièces donne le moyen");
  }

  // 4. Enquête de la défense : la vidéo et son délai d'effacement, le coût en temps ou en argent
  const runTo = (st, d) => { while (st.day < d) CR.endDay(st); };
  const essai = (mode, retard) => {
    const st = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 11 }); CR.store.s = st;
    const c = CR.openCase(st, "a07_perquisition"); c.status = "active";
    CR.fileDoc(st, c, { key: "rapport_surv", title: "Surveillance (D14)" });
    CR.addNote(st, c, { text: "caméra du syndic", fact: "K7_camera" });
    const lim = c.vars.perqDay + 30;
    runTo(st, lim - retard);
    const cash = st.cash, min = st.min;
    const r = CR.enqueteLancer(st, c, "hall", mode);
    ok(!!r, `démarche lancée (${mode})`);
    if (mode === "constat") ok(st.cash === cash - 420 && c.costs >= 420, "le constat coûte 420 €"); else ok(st.min > min, "la lettre coûte du temps");
    runTo(st, r.due + 1);
    return c;
  };
  let c1 = essai("lettre", 10);
  ok(CR.enqueteEtat(c1, "hall").statut === "obtenu" && CR.hasDoc(c1, "enq_hall"), "lettre envoyée à temps : images obtenues");
  ok(CR.hasFact(c1, "K7_camera") && CR.renderDoc(CR.store.s, c1, c1.docs.find((d) => d.key === "enq_hall")).paras.flat().some((g) => g && g.f === "K7_heure"), "le constat porte un fait connu de l'affaire (K7_heure)");
  c1 = essai("lettre", 2);
  ok(CR.enqueteEtat(c1, "hall").statut === "perdu" && !CR.hasDoc(c1, "enq_hall"), "lettre trop tardive : images effacées");
  c1 = essai("constat", 1);
  ok(CR.enqueteEtat(c1, "hall").statut === "obtenu", "constat la veille de l'effacement : images sauvées");
  // Témoin : piste nécessaire ; contre-expertise : voie du juge fermée après la fin d'information
  const st2 = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 5 }); CR.store.s = st2;
  const c4 = CR.openCase(st2, "a04_voisin"); c4.status = "active";
  ok(!CR.enqueteVisibles(st2, c4).length, "sans piste, aucune démarche affichée");
  CR.addNote(st2, c4, { text: "Mme Roux a vu", fact: "A4_temoin" });
  ok(CR.enqueteVisibles(st2, c4).length === 1, "la piste du témoin apparaît");
  CR.enqueteLancer(st2, c4, "temoin_roux", "enqueteur");
  runTo(st2, st2.day + 7);
  ok(CR.hasDoc(c4, "enq_roux") && CR.hasFact(c4, "A4_temoin_pv") === false, "attestation reçue (le fait se note en la lisant)");
  const c9 = CR.openCase(st2, "a09_malik"); c9.status = "active";
  CR.fileDoc(st2, c9, { key: "expertise", title: "Expertise" });
  c9.vars.finInfo = st2.day;
  const contre = CR.enqueteDefs(st2, c9).find((e) => e.id === "contre");
  ok(!CR.enqueteModeOk(st2, c9, contre.modes[0]).ok && CR.enqueteModeOk(st2, c9, contre.modes[1]).ok, "contre-expertise : juge fermé après l'avis de fin d'information, voie privée ouverte");
  const ch = CR.openCase(st2, "a09_hugo"); ch.status = "active";
  ok(!CR.enqueteDefs(st2, ch).some((e) => e.id === "contre"), "la contre-expertise est une démarche de la défense");

  // 5. Interface : surligner, relever en deux pièces, onglet Enquête, indice, ancienne sauvegarde
  s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 7 }); CR.store.s = s;
  s.settings.coach = false; s.settings.indices = true;
  cs = CR.openCase(s, "a07_perquisition"); cs.status = "active";
  for (const k of ["pv_perquisition", "cr_ji", "rapport_surv"]) CR.fileDoc(s, cs, { key: k, title: CR.CASES.a07_perquisition.docTitles[k] });
  CR.store.bump(); await sleep(60);
  await P.openCase(w, doc, "Kaddour");
  await click(w, [...doc.querySelectorAll(".tab")].find((t) => /^Pièces/.test(texts(t))));
  await click(w, [...doc.querySelectorAll(".doc-row")].find((r) => /Commission rogatoire/.test(texts(r))));
  // dossier de travail (lot 2) : annoter le passage de la commission rogatoire, puis relever la perquisition en le rapprochant
  const crSeg = [...doc.querySelectorAll(".docview .seg")].find((x) => /exécutée dans les formes/.test(texts(x)));
  await click(w, crSeg); await click(w, findBtn(doc, "À vérifier"));
  ok(!!doc.querySelector(".docview mark.an-verifier"), "le passage annoté est marqué");
  await click(w, [...doc.querySelectorAll(".tab")].find((t) => /^Pièces/.test(texts(t))));
  await click(w, [...doc.querySelectorAll(".doc-row")].find((r) => /Perquisition/.test(texts(r))));
  const pSeg = [...doc.querySelectorAll(".docview .seg")].find((x) => /5 h 30/.test(texts(x)));
  await click(w, pSeg); await click(w, findBtn(doc, "Relever une irrégularité"));
  const sel = doc.querySelector(".pop-avec select");
  ok(!!sel && sel.options.length === 2, "l'irrégularité propose de rapprocher le passage annoté de l'autre pièce");
  if (sel) { P.saisir(w, sel, sel.options[1].value); await sleep(30); }
  P.saisir(w, doc.querySelector(".pop-article"), "59"); await sleep(20);
  await click(w, [...doc.querySelectorAll(".pop-regimes .nchip")][1]);
  await click(w, [...doc.querySelectorAll(".pop-griefs .nchip")].find((b) => /domicile/.test(texts(b))));
  await click(w, findBtn(doc, /^Relever$/));
  ok(cs.issues.some((i) => i.flag === "perq_nuit" && i.type === "incoherence" && /formes/.test(i.avec || "") && i.article === "59"), "irrégularité relevée par l'interface, reliée à la commission rogatoire");
  ok(!!doc.querySelector(".docview .seg-flagged"), "le passage relevé est souligné");
  // une ancienne sauvegarde : irrégularité sans type, pas de surlignage ni d'enquête
  const old = JSON.parse(CR.serialize(s));
  const oc = old.cases.a07_perquisition;
  oc.issues = [{ id: "i_old", day: old.day, text: "Perquisition à 5 h 30.", flag: "perq_nuit" }];
  delete oc.surl; delete oc.enq; delete oc.lu;
  CR.store.s = s = CR.deserialize(JSON.stringify(old)); s.settings.indices = true;
  CR.store.bump(); await sleep(60);
  await P.openCase(w, doc, "Kaddour");
  await click(w, [...doc.querySelectorAll(".tab")].find((t) => /^Irrégularités/.test(texts(t))));
  ok(/5 h 30/.test(texts(doc.querySelector(".cf-irreg"))), "ancienne sauvegarde : l'irrégularité s'affiche");
  CR.addNote(s, s.cases.a07_perquisition, { text: "témoin", fact: "K7_camera" });
  await click(w, [...doc.querySelectorAll(".tab")].find((t) => /^Enquête/.test(texts(t))));
  ok(doc.querySelectorAll(".enq-card").length === 2, "onglet Enquête : la sœur et la caméra du hall");
  const btn = [...doc.querySelectorAll(".enq-card .task")].find((b) => /commissaire de justice/.test(texts(b)));
  await click(w, btn);
  ok(/En cours/.test(texts(doc.querySelector(".enq"))) && CR.enqueteEtat(s.cases.a07_perquisition, "hall"), "démarche lancée depuis l'interface");
  // indice : après un temps de lecture
  const pc = s.cases.a07_perquisition;
  const dP = pc.docs.find((d) => d.key === "pv_perquisition");
  pc.lu = { [dP.id]: CR.INDICE_T2 + 5 };
  pc.issues = [];
  await click(w, [...doc.querySelectorAll(".tab")].find((t) => /^Pièces/.test(texts(t))));
  await click(w, [...doc.querySelectorAll(".doc-row")].find((r) => /Perquisition/.test(texts(r))));
  ok(/Indice/.test(texts(doc.querySelector(".indice") || doc.body)) && /heures la loi/.test(texts(doc.querySelector(".indice") || doc.body)), "mode assisté : indice affiché après un temps de lecture");
  s.settings.indices = false; CR.store.bump(); await sleep(40);
  ok(!doc.querySelector(".indice"), "sans le mode assisté, aucun indice");

  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  console.log("échecs:", fails);
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
