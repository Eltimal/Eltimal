// Refonte du gameplay, lot 2 : le dossier de travail (js/travail.js, js/ui-travail.js).
// Moteur : annotation au caractère près (texte, cote, feuillet), fait mis en main en coulisse, drapeau d'irrégularité
// reconnu sur un bout de phrase, irrégularité en quatre éléments (moyen de nullité ouvert, plan de défense, évaluation
// cachée), incohérence par deux passages rapprochés, chronologie et écarts, tableau des versions, liens, onglets,
// retraits en cascade. Interface : phrase cliquée, sélection libre à la souris, sens en couleur, note en marge, relevé,
// onglet « Dossier de travail » (extraits, chronologie, versions, plan, liens, onglets), ancienne sauvegarde.
// node tests/ttravail.js ; « échecs: 0 » attendu.
const { boot, sleep, texts, findBtn, click } = require("./harness");
const P = require("./play");
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log("ÉCHEC", m); } };
(async () => {
  const env = boot(); const { CR, w, doc } = env; await sleep(100);
  const G = CR.GEN2, T = CR.TRAV;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 5 }); s.settings.coach = false; CR.store.s = s;
  // une comparution immédiate dont la notification des droits est tardive, avec une victime
  let t = null;
  for (let i = 0; i < 3000 && !t; i++) { let x; try { x = G.tirer("ttr" + i, "ci", { day: s.day, inf: "vol" }); } catch (e) { continue; } if (x && x.irr.includes("gav_notif") && x.V && CR.SIM.supporte(x) && !CR.SIM.arrachage(x)) t = x; }
  ok(!!t, "aucune affaire avec notification tardive");
  const p = { gen: 2, id: "g_ci_77", kind: "ci", day: s.day, niveau: CR.contenu(s), t, inf: t.inf }; G.prepare(p); s.generated = s.generated || []; s.generated.push(p);
  const def = G.def(p); def.id = p.id; CR.CASES[p.id] = def; const cs = CR.openCase(s, p.id); cs.status = "active";
  for (const k of Object.keys(def.docs)) CR.fileDoc(s, cs, { key: k, title: (def.docTitles || {})[k] || k });
  const dNotif = cs.docs.find((d) => d.key === "pv_notification");
  const lire = (d) => { const r = CR.renderDoc(s, cs, d); return Object.assign({}, r, { paras: CR.UI.segmentize(r.paras), ref: { doc: d.id, key: d.key, titre: d.title } }); };
  const N = lire(dNotif), NA = CR.UI.docAnnot(N);
  const ou = (pred) => { for (let pi = 0; pi < N.paras.length; pi++) for (let si = 0; si < N.paras[pi].length; si++) if (pred(N.paras[pi][si])) return { p: pi, s: si, seg: N.paras[pi][si] }; return null; };

  // ---------------------------------------------------------------- moteur
  const fl = ou((g) => g && typeof g === "object" && g.flag === "gav_notif");
  ok(!!fl, "passage de la notification tardive introuvable");
  // trois mots au milieu du passage : le drapeau suit
  const tx = fl.seg.t, i0 = tx.indexOf("notifions"), i1 = i0 + "notifions à".length;
  const a1 = T.annoter(s, cs, { doc: NA, ref: N.ref, debut: { p: fl.p, s: fl.s, o: i0 }, fin: { p: fl.p, s: fl.s, o: i1 }, coul: "procedure" });
  ok(a1 && a1.t === "notifions à", `annotation au mot près : « ${a1 && a1.t} »`);
  ok(a1 && a1.cote === N.cote && a1.f === T.feuillet(N, fl.p), "cote et feuillet de l'annotation");
  ok(a1 && a1.marks.some((m) => m.ty === "flag" && m.id === "gav_notif"), "le drapeau suit un bout de phrase");
  ok(/^D\d+, f\. \d+$/.test(CR.UI.annotRef(a1)), `référence « ${CR.UI.annotRef(a1)} »`);
  ok(T.annoter(s, cs, { doc: NA, ref: N.ref, debut: { p: fl.p, s: fl.s, o: i0 }, fin: { p: fl.p, s: fl.s, o: i1 }, coul: "charge" }) === a1 && a1.coul === "charge", "même plage : même annotation, nouvelle couleur");
  // sélection à rebours (de la fin vers le début) : remise dans l'ordre
  const a2 = T.annoter(s, cs, { doc: NA, ref: N.ref, debut: { p: fl.p + 1, s: 0, o: 4 }, fin: { p: fl.p, s: fl.s, o: 0 } });
  ok(a2 && a2.debut.p === fl.p && a2.fin.p === fl.p + 1 && a2.coul === "verifier", "sélection à rebours sur deux paragraphes");
  // un fait couvert passe en main, sans rien d'autre
  const ff = ou((g) => g && typeof g === "object" && g.f && !CR.hasFact(cs, g.f));
  console.log(`affaire ${t.sig.slice(0, 50)} ; fait couvert : ${ff ? ff.seg.f : "aucun"}`);
  if (ff) { const fid = ff.seg.f; T.annoter(s, cs, { doc: NA, ref: N.ref, debut: { p: ff.p, s: ff.s, o: 0 }, fin: { p: ff.p, s: ff.s, o: 5 } }); ok(CR.hasFact(cs, fid), `fait ${fid} en main par l'annotation`); }
  // passage sans drapeau : l'irrégularité relevée ne porte rien
  const neutre = ou((g) => typeof g === "string" && g.length > 30);
  const a3 = T.annoter(s, cs, { doc: NA, ref: N.ref, debut: { p: neutre.p, s: neutre.s, o: 0 }, fin: { p: neutre.p, s: neutre.s, o: 20 } });
  const ir3 = T.relever(s, cs, { annot: a3.id, article: "63-1", regime: "presume", grief: "aveux" });
  ok(ir3 && cs.issues.find((i) => i.id === ir3.issue).flag === null, "irrégularité sur un passage sans drapeau : aucun drapeau");
  // le vrai relevé : quatre éléments, moyen ouvert, plan de défense, évaluation cachée
  const ir1 = T.relever(s, cs, { annot: a1.id, article: "art. 63-1", regime: "presume", grief: "presume", note: "trois heures" });
  const iss1 = ir1 && cs.issues.find((i) => i.id === ir1.issue);
  ok(iss1 && iss1.flag === "gav_notif" && iss1.article === "63-1" && CR.hasIssue(cs, "gav_notif"), "irrégularité relevée : drapeau reconnu, article normalisé");
  ok(T.planDe(cs, "procedure").some((m) => m.irreg === ir1.id && m.annots.includes(a1.id)), "le moyen de nullité rejoint la colonne procédure");
  const ev = T.evaluer(cs, ir1);
  ok(ev.passage && ev.texte && ev.regime && ev.grief, "évaluation : les quatre éléments justes");
  const ev3 = T.evaluer(cs, Object.assign({}, ir1, { article: "802", regime: "prouver" }));
  ok(ev3.passage && !ev3.texte && !ev3.regime, "évaluation : texte et régime faux reconnus");
  ok(T.relever(s, cs, { annot: a1.id, article: "63", regime: "prouver" }) === ir1, "un passage, une seule irrégularité");
  // chronologie : écarts entre événements placés par le joueur
  const e1 = T.placer(s, cs, { annot: a1.id, jour: s.day, heure: 9 * 60 + 5 });
  T.placer(s, cs, { jour: s.day, heure: 12 * 60 + 20, libelle: "Notification" });
  T.placer(s, cs, { jour: s.day + 1, heure: 8 * 60, libelle: "Lendemain" });
  const ch = T.chronologie(cs);
  ok(ch.length === 3 && ch[0].id === e1.id && ch[1].ecart === 195 && ch[2].ecart === 1440 - 12 * 60 - 20 + 8 * 60, "chronologie triée, écarts en minutes");
  ok(T.placer(s, cs, { jour: s.day }) === null, "un événement sans heure n'est pas placé");
  ok(T.heureDans("À 9 h 45, notifions") === 585 && T.heureDans("de 9 h à 10 h") === null && T.heureDans("Le 1er décembre 2026 à 19 heures 39 minutes") === 1179, "heure lue dans un passage");
  ok(T.dateDans("le 1er décembre 2026 à") === CR.dayOf(2026, 12, 1) && T.dateDans("rien") === null, "date lue dans un passage");
  // versions, liens, onglets
  const pt = T.point(cs, "L'heure de la notification");
  ok(T.point(cs, "l'heure de la notification") === pt, "même point, même ligne");
  ok(T.version(cs, { point: pt.id, qui: "policiers", annot: a1.id }) && !T.version(cs, { point: "x", qui: "client", annot: a1.id }), "tableau des versions");
  ok(T.relier(s, cs, a1.id, a2.id, "heure") && !T.relier(s, cs, a1.id, a1.id, "heure") && T.lienDe(cs, a2.id).length === 1, "lien entre deux passages");
  ok(T.onglet(cs, dNotif.id) && T.aOnglet(cs, dNotif.id) && !T.onglet(cs, dNotif.id), "onglet posé puis retiré");
  // retrait en cascade
  T.retirer(cs, a2.id);
  ok(!T.lienDe(cs, a1.id).length && !T.annot(cs, a2.id), "retirer une annotation retire ses liens");
  T.retirerIrreg(cs, ir1.id);
  ok(!CR.hasIssue(cs, "gav_notif") && !T.planDe(cs, "procedure").some((m) => m.irreg === ir1.id), "retirer l'irrégularité retire le moyen");
  // incohérence : deux passages dont la paire se rejoint
  const pa = []; for (const d of cs.docs) { const r = lire(d); r.paras.forEach((par, pi) => par.forEach((g, si) => { if (g && typeof g === "object" && g.paire) pa.push({ d, r, pi, si, g }); })); }
  if (pa.length >= 2 && pa[0].g.paire === pa[1].g.paire) {
    const x = pa[0], y = pa[1], ann = (q) => T.annoter(s, cs, { doc: CR.UI.docAnnot(q.r), ref: q.r.ref, debut: { p: q.pi, s: q.si, o: 0 }, fin: { p: q.pi, s: q.si, o: 6 } });
    const ax = ann(x), ay = ann(y), ir = T.relever(s, cs, { annot: ax.id, avec: ay.id, article: "63", regime: "prouver" });
    ok(cs.issues.find((i) => i.id === ir.issue).flag === x.g.paire, "incohérence reconnue par la paire");
  }

  // incohérence entre deux pièces (irrégularité « heures ») : l'heure d'interpellation (paire) seule ne suffit pas ;
  // rapprochée du placement en garde à vue (drapeau), elle ouvre le moyen
  {
    let t2 = null;
    for (let i = 0; i < 3000 && !t2; i++) { let x; try { x = G.tirer("ttr2" + i, "ci", { day: s.day }); } catch (e) { continue; } if (x && x.irr.includes("heures") && CR.SIM.supporte(x) && !(CR.SIM.violencesOK && CR.SIM.violencesOK(x))) t2 = x; }
    ok(!!t2, "aucune affaire avec l'irrégularité « heures »");
    const p2 = { gen: 2, id: "g_ci_78", kind: "ci", day: s.day, niveau: CR.contenu(s), t: t2, inf: t2.inf }; G.prepare(p2); s.generated.push(p2);
    const def2 = G.def(p2); def2.id = p2.id; CR.CASES[p2.id] = def2; const cs2 = CR.openCase(s, p2.id); cs2.status = "active";
    for (const k of Object.keys(def2.docs)) CR.fileDoc(s, cs2, { key: k, title: (def2.docTitles || {})[k] || k });
    const lire2 = (d) => { const r = CR.renderDoc(s, cs2, d); return Object.assign({}, r, { paras: CR.UI.segmentize(r.paras), ref: { doc: d.id, key: d.key, titre: d.title } }); };
    const trouve = (ty) => { for (const d of cs2.docs) { const r = lire2(d); for (let pi = 0; pi < r.paras.length; pi++) for (let si = 0; si < r.paras[pi].length; si++) { const g = r.paras[pi][si]; if (g && typeof g === "object" && g[ty] === "heures") return { r, pi, si }; } } return null; };
    const qa = trouve("paire"), qb = trouve("flag");
    ok(qa && qb, "passages de l'irrégularité « heures » introuvables");
    if (qa && qb) {
      const ann = (q) => T.annoter(s, cs2, { doc: CR.UI.docAnnot(q.r), ref: q.r.ref, debut: { p: q.pi, s: q.si, o: 0 }, fin: { p: q.pi, s: q.si, o: 12 } });
      const ax = ann(qa), ay = ann(qb);
      const seul = T.relever(s, cs2, { annot: ax.id, article: "63", regime: "prouver" });
      ok(cs2.issues.find((i) => i.id === seul.issue).flag === null, "l'heure d'interpellation seule n'ouvre pas le moyen");
      T.retirerIrreg(cs2, seul.id);
      const ir = T.relever(s, cs2, { annot: ax.id, avec: ay.id, article: "63", regime: "prouver" });
      const iss = cs2.issues.find((i) => i.id === ir.issue);
      ok(iss.flag === "heures" && iss.type === "incoherence" && T.lienDe(cs2, ax.id).length === 1, "rapprochée du placement, l'incohérence ouvre le moyen et relie les passages");
    }
  }

  // ---------------------------------------------------------------- interface
  cs.travail = null; cs.issues = []; CR.store.bump(); await sleep(80);
  await P.openCase(w, doc, t.A.nom); await sleep(40);
  const onglet = (re) => [...doc.querySelectorAll(".tab")].find((x) => re.test(texts(x)));
  await click(w, onglet(/^Pièces/));
  await click(w, [...doc.querySelectorAll(".doc-row")].find((r) => texts(r).includes(dNotif.title)));
  const segUI = () => [...doc.querySelectorAll(".docview .seg")].find((x) => x.dataset.p === String(fl.p) && x.dataset.s === String(fl.s));
  // phrase cliquée, sens en couleur
  await click(w, segUI());
  ok(!!doc.querySelector(".pop-travail"), "la fenêtre du passage s'ouvre");
  ok(!/Surligner|Noter dans le carnet/.test(texts(doc.querySelector(".pop-travail"))), "plus de surlignage par phrase ni de carnet dans la fenêtre");
  await click(w, findBtn(doc, "À charge"));
  ok(!!doc.querySelector(".docview mark.an-charge") && T.annots(cs).length === 1, "phrase annotée à charge");
  await click(w, findBtn(doc, "Note en marge"));
  P.saisir(w, doc.querySelector(".pop-form textarea"), "Trois heures après le début ?"); await sleep(20);
  await click(w, findBtn(doc, "Écrire en marge"));
  ok(/Trois heures après/.test(texts(doc.querySelector(".docview .an-marge"))), "note en marge sous le paragraphe");
  doc.body.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); await click(w, doc.querySelector(".docview .paper")); await sleep(30);
  // sélection libre : quelques mots d'une autre phrase
  const autre = [...doc.querySelectorAll(".docview .seg")].find((x) => x !== segUI() && x.dataset.p != null && texts(x).length > 40 && !x.querySelector("mark"));
  const tn = doc.createTreeWalker(autre, w.NodeFilter.SHOW_TEXT).nextNode();
  const rg = doc.createRange(); rg.setStart(tn, 3); rg.setEnd(tn, 17);
  const sel = w.getSelection(); sel.removeAllRanges(); sel.addRange(rg);
  autre.dispatchEvent(new w.MouseEvent("mouseup", { bubbles: true })); await sleep(40);
  ok(!!doc.querySelector(".pop-travail") && texts(doc.querySelector(".pop-quote")).includes(tn.textContent.slice(3, 17).trim()), "la sélection libre ouvre la fenêtre sur les mots choisis");
  await click(w, findBtn(doc, "À décharge"));
  const libre = T.annots(cs).find((z) => z.coul === "decharge");
  ok(libre && libre.t === tn.textContent.slice(3, 17).replace(/\s+/g, " ").trim() && libre.debut.o === 3 && libre.fin.o === 17, `annotation au mot près depuis la souris : « ${libre && libre.t} »`);
  sel.removeAllRanges();
  // rouvrir l'annotation en la cliquant, la placer dans la chronologie
  await sleep(450);
  await click(w, doc.querySelector(".docview mark.an-charge"));
  ok(/Note en marge|Modifier la note/.test(texts(doc.querySelector(".pop-travail") || doc.body)), "cliquer une annotation la rouvre");
  await click(w, findBtn(doc, "Placer dans la chronologie"));
  P.saisir(w, doc.querySelector('.pop-form input[type="date"]'), CR.fmtDate(s.day, "iso")); await sleep(10);
  const hIn = doc.querySelector('.pop-form input[type="time"]');
  if (!hIn.value) P.saisir(w, hIn, "09:40");
  await sleep(10);
  await click(w, findBtn(doc, /^Placer$/));
  ok(T.chronologie(cs).length === 1, "événement placé depuis la fenêtre");
  // relever en quatre éléments par l'interface
  await sleep(450);
  await click(w, segUI());
  await P.releve(w, doc, segUI(), { article: "63-1", regime: 0, grief: 5 });
  ok(CR.hasIssue(cs, "gav_notif") && cs.travail.irregs.length === 1 && cs.travail.irregs[0].article === "63-1", "irrégularité relevée par l'interface");
  // l'onglet « Dossier de travail »
  await click(w, onglet(/^Dossier de travail/));
  const tv = doc.querySelector(".travail");
  ok(!!tv && tv.querySelectorAll(".an-list > li").length === T.annots(cs).length, "extraits listés");
  await click(w, [...tv.querySelectorAll(".chip")].find((b) => /^Plan de défense/.test(texts(b))));
  ok(doc.querySelectorAll(".plan-col").length === 3 && /Texte violé : art\. 63-1/.test(texts(doc.querySelector(".plan-cols"))), "plan de défense en trois colonnes, avec les quatre éléments");
  await click(w, [...doc.querySelectorAll(".travail .chip")].find((b) => /^Chronologie/.test(texts(b))));
  P.saisir(w, doc.querySelector('.chrono-ajout input[type="date"]'), CR.fmtDate(s.day, "iso"));
  P.saisir(w, doc.querySelector('.chrono-ajout input[type="time"]'), "12:15");
  P.saisir(w, doc.querySelector('.chrono-ajout input[type="text"]'), "Avis à l'avocat"); await sleep(20);
  await click(w, findBtn(doc, /^Placer$/));
  ok(doc.querySelectorAll(".chrono-list > li").length === 2 && /\+ /.test(texts(doc.querySelector(".chrono-ecart"))), "chronologie : l'écart entre deux événements s'affiche");
  await click(w, [...doc.querySelectorAll(".travail .chip")].find((b) => /^Versions/.test(texts(b))));
  P.saisir(w, doc.querySelector('.travail input[type="text"]'), "Qui a parlé en premier"); await sleep(20);
  await click(w, findBtn(doc, "Ajouter le point"));
  ok(/Qui a parlé en premier/.test(texts(doc.querySelector(".versions"))), "tableau des versions : un point");
  for (const v of ["Liens", "Onglets", "Extraits"]) await click(w, [...doc.querySelectorAll(".travail .chip")].find((b) => texts(b).startsWith(v)));
  ok(!doc.querySelector(".travail .seg-flagged, .travail [class*=flag]"), "rien ne signale un passage dans le dossier de travail");
  // ancienne sauvegarde : pas de dossier de travail
  const old = JSON.parse(CR.serialize(s)); delete old.cases[cs.id].travail;
  CR.store.s = CR.deserialize(JSON.stringify(old)); CR.store.bump(); await sleep(60);
  await P.openCase(w, doc, t.A.nom);
  await click(w, onglet(/^Dossier de travail/));
  ok(/Aucun passage annoté/.test(texts(doc.querySelector(".travail"))), "ancienne sauvegarde : dossier de travail vide");
  ok(!env.errors.length, "erreurs jsdom : " + env.errors.join(" | "));
  console.log("échecs:", fails);
  process.exit(fails ? 1 : 0);
})();
