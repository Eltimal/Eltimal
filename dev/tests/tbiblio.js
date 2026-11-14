// Code annoté (bibliothèque) : plan des codes, rangement des articles, arrêts annotés, index, recueil, saisie d'un arrêt,
// effet d'un arrêt enregistré sur une nullité, interface. `échecs: 0` attendu. VOIR=1 affiche le rangement de chaque texte.
const { boot, sleep, texts, findBtn, click } = require("./harness");
(async () => {
  const { w, CR, doc, errors } = boot();
  const fails = [];
  const ok = (c, m) => { if (!c) fails.push(m); };
  await sleep(200);

  // 1. Chaque texte de la bibliothèque est rangé dans le plan
  const arts = CR.LIB.filter((e) => !CR.estJP(e.id));
  let hors = 0;
  for (const e of arts) {
    const r = CR.planOf(e.id);
    if (!r || !r.node) { fails.push("non rangé : " + e.id); continue; }
    if (r.code.hors) hors++;
    if (process.env.VOIR) console.log(e.id.padEnd(16), CR.planChemin(e.id, true));
  }
  console.log(`textes rangés : ${arts.length} (dont ${hors} hors codes)`);
  // 2. Quelques rangements connus (plan officiel du texte intégral : la division la plus fine, paragraphe compris)
  const attendu = {
    "CP_222-11": "Paragraphe 2", "CP_222-33": "Paragraphe 4", "CP_222-33-1-1": "Section 4", "CP_222-37": "Section 7", "CP_221-18": "Chapitre Ier ter",
    "CP_132-10": "Paragraphe 1", "CP_132-75": "Section 3", "CP_434-27": "Paragraphe 2", "CP_434-15-2": "Section 2", "CP_433-7": "Section 5", "CP_R625-1": "Section 1",
    "CP_R635-1": "Section 1", "CP_227-4-2": "Section 2 bis", "CP_223-15-2": "Section 6 bis", "CP_315-2": "Chapitre V", "CP_121-2": "Chapitre Ier",
    "CPP_63-1": "Chapitre Ier", "CPP_76": "Chapitre II", "CPP_78-2": "Chapitre III", "CPP_706-88": "Section 3", "CPP_716-4": "Section 1", "CPP_720": "Section 1 bis",
    "CPP_801": "", "CPP_173-1": "Section 10", "CPP_495-8": "Section 8", "CPP_498": "Section 1", "CPP_515": "Section 3", "CPP_380-16": "Sous-titre II",
    "CPP_552": "Titre IV", "CPP_230-33": "Chapitre V", "CPP_85": "Section 2", "CPP_41-1": "Section 3", "CPP_9-2": "Sous-titre Ier", "CPP_298": "Section 2",
    "CR_L234-1": "Chapitre 4", "CR_R234-1": "Chapitre IV", "CR_L233-1": "Chapitre 3", "CJPM_L433-4": "Chapitre III", "CJPM_L11-1": "Chapitre Ier",
    "CCOM_L241-3": "Chapitre Ier", "CGI_1741": "C", "LPF_L228": "Section II", "CP_222-52": "Section 10", "CP_221-19": "Chapitre Ier ter",
  };
  for (const [id, t] of Object.entries(attendu)) { const r = CR.planOf(id); ok(r && r.node && r.node.t === t, `rangement ${id} : ${r && r.node ? r.node.t + " " + r.node.h : "aucun"} (attendu ${t || "Dispositions générales"})`); }
  ok(CR.planOf("CPP_63-1").node.path[1].h === "Des enquêtes et des contrôles d'identité", "CPP 63-1 hors du titre II");
  ok(/Livre II › Titre II › Chapitre II › Section 1/.test(CR.planChemin("CP_222-11", true)), "chemin de CP 222-11 : " + CR.planChemin("CP_222-11", true));
  // 3. Le domaine des textes ajoutés par les fiches suit leur place (plus de procédure en « droit pénal spécial »)
  ok(CR.lib("CPP_76").domaine === "pp_enquete", "domaine de CPP 76 : " + CR.lib("CPP_76").domaine);
  ok(CR.lib("CPP_173-1").domaine === "pp_instruction", "domaine de CPP 173-1");
  ok(!arts.some((e) => e.gen && /^CPP_/.test(e.id) && e.domaine === "dps"), "un texte de procédure reste rangé en droit pénal spécial");

  // 4. Les arrêts
  const ids = Object.keys(CR.JP);
  ok(ids.length >= 19, "trop peu d'arrêts : " + ids.length);
  for (const id of ids) {
    const j = CR.JP[id];
    ok(CR.lib(id) && CR.TEXTES[id] && CR.TEXTES[id].cite === CR.jpCite(id), "arrêt mal inscrit : " + id);
    ok(j.sommaire && j.sommaire.length > 60, "sommaire vide : " + id);
    ok(j.titrage.length >= 3, "titrage court : " + id);
    for (const a of j.articles) ok(CR.lib(a), `article absent sous ${id} : ${a}`);
    if (j.depasse && j.depasse.par) ok(CR.JP[j.depasse.par], "revirement vers un arrêt inconnu : " + id);
    for (const r of (j.appuie || []).concat(j.contre || [])) ok(CR.IRREG[r], `régime inconnu ${r} (${id})`);
    ok(j.verif && j.verif.le && j.verif.src && CR.VERIF_LABEL[j.verif.niveau], "vérification non datée : " + id);
    ok(/^\d{4}-\d{2}-\d{2}$/.test(j.date), "date illisible : " + id);
  }
  const n63 = CR.notesOf("CPP_63");
  ok(n63.length >= 4 && n63.every((x, i) => x.n === i + 1), "notes sous CPP 63 mal numérotées");
  ok(new Set(n63.map((x) => x.theme)).size >= 2, "notes sous CPP 63 sans thèmes");
  const plusRecent = n63.filter((x) => x.theme === "Avis au procureur de la République").map((x) => CR.JP[x.jp].date);
  ok(plusRecent.every((d, i) => !i || d <= plusRecent[i - 1]), "notes d'un thème pas de la plus récente à la plus ancienne");
  // 5. Index
  const idx = CR.indexAnalytique();
  ok(idx.length > 100, "index trop court : " + idx.length);
  ok(idx.some((x) => x.mot === "Garde à vue" && x.refs.some((r) => r.cible.jp === "JP_CRIM_2024_03_06" && r.cible.note)), "index : garde à vue → 6 mars 2024");
  for (const x of idx) for (const r of x.refs) ok(CR.lib(r.cible.art), "index vers un article absent : " + r.cible.art);
  // 6. Saisie d'un arrêt
  const P = (t) => CR.parseJP(t);
  ok(P("Crim. 6 mars 2024").id === "JP_CRIM_2024_03_06", "saisie par la date");
  ok(P("n° 22-80.895").id === "JP_CRIM_2024_03_06", "saisie par le pourvoi");
  ok(P("Cass. crim., 6 mars 2024, n° 22-80.895").id === "JP_CRIM_2024_03_06", "saisie complète");
  ok(P("2280895").id === "JP_CRIM_2024_03_06", "saisie du pourvoi sans ponctuation");
  ok(P("Ass. plén. 15 avril 2011").id === "JP_AP_2011_04_15", "saisie assemblée plénière");
  ok(P("crim 7 sept. 2021").ambigu, "deux arrêts le même jour : ambigu");
  ok(P("7 septembre 2021, 20-87.191").id === "JP_CRIM_2021_09_07_B", "pourvoi l'emporte sur la date");
  ok(P("Cons. const. 30/07/2010").id === "JP_CC_2010_07_30", "date chiffrée");
  ok(P("Crim. 3 mars 1999").inconnu, "arrêt inconnu");
  ok(P("bonjour").illisible, "saisie illisible");
  ok(CR.gradeJP({ id: "JP_CRIM_2016_05_24" }, "JP_CRIM_2024_03_06").g === "voisin", "arrêt voisin (même article)");
  ok(CR.gradeJP({ id: "JP_AP_1995" }, "JP_CRIM_2024_03_06").g === "faux", "arrêt faux");
  ok(CR.keyLabel("JP_CRIM_2024_03_06") === CR.jpCite("JP_CRIM_2024_03_06"), "libellé d'un arrêt dans le classeur");

  // 7. Interface : partie, bibliothèque, plan, article, notes, index, recueil
  await click(w, findBtn(doc, "Nouvelle partie"));
  await click(w, findBtn(doc, /^Carrière — à votre compte/));
  await sleep(150);
  const s = CR.store.s;
  s.settings.bibliMode = "liste"; // ce test vise le mode liste ; les codes reliés ont tests/tlivre.js
  await click(w, [...doc.querySelectorAll(".rail-btn")].find((x) => texts(x).startsWith("Bibliothèque")));
  await sleep(60);
  const lib = doc.querySelector(".library");
  ok(lib && /Plan des codes/.test(texts(lib)) && /Index/.test(texts(lib)) && /Jurisprudence/.test(texts(lib)), "onglets de la bibliothèque");
  const row = (re) => [...doc.querySelectorAll(".library .pl-row")].find((b) => re.test(texts(b)));
  await click(w, row(/Code de procédure pénale/));
  await click(w, row(/Livre Ier : De la conduite/));
  await click(w, row(/Titre II : Des enquêtes/));
  await click(w, row(/Chapitre Ier : Des crimes et des délits flagrants/));
  ok(/art\. 53 à 74-2/.test(texts(row(/Chapitre Ier : Des crimes et des délits flagrants/))), "plage d'articles du chapitre");
  // texte intégral : le mode liste ne montre que les divisions qui portent des fiches du jeu
  ok(![...doc.querySelectorAll(".pl-node.pl-vide")].length, "divisions sans fiche affichées dans le mode liste");
  const a63 = [...doc.querySelectorAll(".pl-art")].find((b) => /^Art\. 63 /.test(texts(b)) || /^63 /.test(texts(b)) || /\b63\b.*Durée/.test(texts(b)));
  ok(a63, "article 63 dans le chapitre");
  if (a63) {
    await click(w, a63);
    await sleep(40);
    ok(/Jurisprudence sous l'article/.test(texts(lib)) && doc.querySelectorAll(".jp-note").length >= 4, "notes sous l'article 63");
    ok(/Livre Ier/.test(texts(doc.querySelector(".ca-chemin"))), "chemin au-dessus de l'article");
    const min0 = s.min;
    const lire = [...doc.querySelectorAll(".jp-note button")].find((b) => /Lire l'arrêt/.test(texts(b)));
    await click(w, lire);
    ok(s.min > min0 && doc.querySelector(".jp-note.known"), "lire un arrêt prend du temps et l'ouvre");
  }
  await click(w, [...doc.querySelectorAll(".library .tab")].find((b) => texts(b) === "Index"));
  ok(doc.querySelectorAll(".ca-entree").length > 100, "index affiché");
  const sous = [...doc.querySelectorAll(".ca-sous button")].find((b) => /note/.test(texts(b)));
  await click(w, sous);
  ok(doc.querySelector(".ca-art"), "l'index ouvre l'article");
  await click(w, [...doc.querySelectorAll(".library .tab")].find((b) => texts(b) === "Jurisprudence"));
  const nAll = doc.querySelectorAll(".jp-note").length;
  await click(w, [...doc.querySelectorAll(".library .chip")].find((b) => texts(b) === "Assemblée plénière"));
  const nAP = doc.querySelectorAll(".jp-note").length;
  ok(nAll >= 19 && nAP >= 2 && nAP < nAll, `filtres du recueil (${nAll} → ${nAP})`);
  await click(w, [...doc.querySelectorAll(".library .tab")].find((b) => /irrégularités/.test(texts(b))));
  const lien = [...doc.querySelectorAll(".fiches .link")][0];
  await click(w, lien);
  ok(doc.querySelector(".ca-art"), "fiche d'irrégularité → article");

  // 8. Revirement : connu une fois l'arrêt récent lu
  ok(!CR.jpDepasseConnu(s, "JP_CRIM_2010_10_19") || s.researched.includes("JP_AP_2011_04_15"), "revirement affiché trop tôt");
  s.researched.push("JP_AP_2011_04_15");
  ok(CR.jpDepasseConnu(s, "JP_CRIM_2010_10_19"), "revirement connu après lecture");
  ok(CR.jpDepasseConnu(s, "JP_CRIM_2013_10_22"), "changement de loi toujours signalé");

  // 9. Arrêt enregistré dans un dossier : la main de l'audience, l'appui d'une nullité
  CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 7 });
  const s2 = CR.store.s;
  s2.settings.coach = false;
  s2.pending = s2.pending.filter((e) => e.type !== "lead");
  // une affaire générée de comparution immédiate (il n'y a plus d'affaire écrite)
  let cs = null; for (let i = 0; i < 20 && !cs; i++) { try { cs = CR.GEN.open(s2, "ci", {}); } catch (e) { cs = null; } }
  if (cs) cs.status = "active";
  if (cs) {
    const s = s2;
    CR.pinText(s, cs, "JP_CRIM_2024_03_06");
    CR.pinText(s, cs, "JP_CRIM_2010_10_19");
    const hand = CR.handOf(s, cs);
    ok(hand.some((c) => c.id === "JP_CRIM_2024_03_06" && c.jp), "arrêt dans la main de l'audience");
    ok(CR.jpAppui(s, cs, "gav_avis_parquet_tardif") && CR.jpAppui(s, cs, "gav_avis_parquet_tardif").id === "JP_CRIM_2024_03_06", "appui d'une nullité");
    ok(!CR.jpAppui(s, cs, "gav_audition_sans_avocat"), "un arrêt dépassé n'appuie rien");
    CR.unpinText(s, cs, "JP_CRIM_2010_10_19");
  } else fails.push("aucune affaire générée ouverte");
  // 10. Le lien du dossier vers le code annoté vise une grande division, jamais un article
  const f = CR.planFocus({ issues: [{ text: "placé en garde à vue à 23 h 40", ref: { titre: "Procès-verbal de notification" } }] });
  ok(CR.planNode(f) && CR.planNode(f).t === "Titre II", "lien vers le titre des enquêtes");
  ok(CR.planNode(CR.planFocus({ issues: [{ text: "réquisition à l'opérateur" }] })).h === "Dispositions communes", "lien vers la géolocalisation et les réquisitions");

  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  console.log("échecs:", fails.length);
  for (const x of fails.slice(0, 40)) console.log(" -", x);
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
