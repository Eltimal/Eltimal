// Dossier à fouiller (feuille de route, n° 2), sur des affaires générées : pièces complètes, irrégularités non signalées,
// relevé par le joueur, incohérence entre deux pièces, indices, anciennes sauvegardes. (Les affaires écrites et leur enquête
// de la défense ont été retirées du jeu : le mécanisme de l'enquête reste, sans contenu, dans dossier.js.)
const { boot, sleep, texts, findBtn, click } = require("./harness");
const P = require("./play");
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log("ÉCHEC", m); } };
const REVELE = /irrégularit|aucune autorisation|aucune ordonnance|nullit|ne mentionne aucune|tardive/i;

(async () => {
  const env = boot();
  const { w, CR, doc, errors } = env;
  await sleep(150);
  const segs = (r) => [].concat(...(r.paras || []), r.sigs || []).filter((x) => x && typeof x === "object");
  const allText = (r) => [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x.t)).join(" ");


  // 2. Relevé par le joueur : drapeau secret, note « Irrégularité » dans le bloc-notes, retrait lié
  let s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 7 }); CR.store.s = s;
  s.settings.coach = false;
  // une garde à vue générée dont les droits sont notifiés tardivement
  const notifTardive = (st) => { for (let i = 0; i < 200; i++) { let c; try { c = CR.GEN.open(st, ["ci", "gav"][i % 2], {}); } catch (e) { continue; } const p = st.generated.find((x) => x.id === c.id); if (p && p.anomaly === "gav_notif" && CR.caseDef(c).docs.pv_notification) return c; } return null; };
  let cs = notifTardive(s);
  ok(!!cs, "une garde à vue générée à notification tardive");
  if (!cs) { console.log("échecs:", fails); process.exit(1); }
  cs.status = "active";
  const dn = CR.fileDoc(s, cs, { key: "pv_notification", title: "Notification des droits (D3)" });
  const rn = CR.renderDoc(s, cs, dn);
  const notif = segs(rn).find((g) => g.flag === "gav_notif");
  const banal = rn.paras.flat().find((g) => (typeof g === "string" && g.trim().length > 20) || (g && typeof g === "object" && !g.flag && !g.paire && g.t && g.t.trim().length > 20));
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

  // 5. Interface : annoter un passage, relever l'irrégularité en le rapprochant, ancienne sauvegarde, indice
  s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 7 }); CR.store.s = s;
  s.settings.coach = false; s.settings.indices = true;
  cs = notifTardive(s); cs.status = "active";
  const nomClient = CR.client(cs).nom;
  for (const k of ["pv_interpellation", "pv_notification"]) if (CR.caseDef(cs).docs[k]) CR.fileDoc(s, cs, { key: k, title: (CR.caseDef(cs).docTitles || {})[k] || k });
  CR.store.bump(); await sleep(60);
  await P.openCase(w, doc, nomClient);
  const ouvrirPiece = async (re) => { await click(w, [...doc.querySelectorAll(".tab")].find((t) => /^Pièces/.test(texts(t)))); await click(w, [...doc.querySelectorAll(".doc-row")].find((r) => re.test(texts(r)))); };
  await ouvrirPiece(/Interpellation|interpellation/);
  const iSeg = [...doc.querySelectorAll(".docview .seg")].find((x) => /\d+ h \d+/.test(texts(x)));
  ok(!!iSeg, "un passage daté dans le procès-verbal d'interpellation");
  if (iSeg) { await click(w, iSeg); await click(w, findBtn(doc, "À vérifier")); }
  ok(!!doc.querySelector(".docview mark.an-verifier"), "le passage annoté est marqué");
  await ouvrirPiece(/Notification|notification/);
  const notif5 = segs(CR.renderDoc(s, cs, cs.docs.find((d) => d.key === "pv_notification"))).find((g) => g.flag === "gav_notif");
  const nSeg = [...doc.querySelectorAll(".docview .seg")].find((x) => notif5 && texts(x).replace(/\s+/g, " ").includes(notif5.t.replace(/\s+/g, " ").trim().slice(0, 30)));
  ok(!!nSeg, "le passage de la notification tardive est dans le lecteur");
  if (nSeg) {
    await click(w, nSeg); await click(w, findBtn(doc, "Relever une irrégularité"));
    const sel = doc.querySelector(".pop-avec select");
    ok(!!sel && sel.options.length === 2, "l'irrégularité propose de rapprocher le passage annoté de l'autre pièce");
    if (sel) { P.saisir(w, sel, sel.options[1].value); await sleep(30); }
    P.saisir(w, doc.querySelector(".pop-article"), "63-1"); await sleep(20);
    await click(w, [...doc.querySelectorAll(".pop-regimes .nchip")][1]);
    await click(w, [...doc.querySelectorAll(".pop-griefs .nchip")].find((b) => /défense/.test(texts(b))) || [...doc.querySelectorAll(".pop-griefs .nchip")][0]);
    await click(w, findBtn(doc, /^Relever$/));
    ok(cs.issues.some((i) => i.flag === "gav_notif" && i.type === "incoherence" && i.article === "63-1"), "irrégularité relevée par l'interface, reliée au passage annoté", JSON.stringify(cs.issues));
    await sleep(60);
    ok(!!doc.querySelector(".docview .seg-flagged"), "le passage relevé est souligné");
  }
  // une ancienne sauvegarde : irrégularité sans type, pas de surlignage
  const old = JSON.parse(CR.serialize(s));
  const oc = old.cases[cs.id];
  oc.issues = [{ id: "i_old", day: old.day, text: "Droits notifiés tardivement.", flag: "gav_notif" }];
  delete oc.surl; delete oc.enq; delete oc.lu;
  CR.store.s = s = CR.deserialize(JSON.stringify(old)); s.settings.indices = true;
  CR.store.bump(); await sleep(60);
  await P.openCase(w, doc, nomClient);
  await click(w, [...doc.querySelectorAll(".tab")].find((t) => /^Irrégularités/.test(texts(t))));
  ok(/notifiés tardivement/.test(texts(doc.querySelector(".cf-irreg"))), "ancienne sauvegarde : l'irrégularité s'affiche");
  // indice : après un temps de lecture
  const pc = s.cases[cs.id];
  const dP = pc.docs.find((d) => d.key === "pv_notification");
  pc.lu = { [dP.id]: CR.INDICE_T2 + 5 };
  pc.issues = [];
  await ouvrirPiece(/Notification|notification/);
  ok(/Indice/.test(texts(doc.querySelector(".indice") || doc.body)), "mode assisté : indice affiché après un temps de lecture");
  s.settings.indices = false; CR.store.bump(); await sleep(40);
  ok(!doc.querySelector(".indice"), "sans le mode assisté, aucun indice");

  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  console.log("échecs:", fails);
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
