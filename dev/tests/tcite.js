// Saisie des articles (n° 11), textes enregistrés par dossier (n° 8), bloc-notes (n° 10)
// Lecture tolérante, notation graduée, contrôle de la base de textes, et parcours dans l'interface (jsdom).
const { boot, sleep, texts, findBtn, click } = require("./harness");
let fails = 0;
const check = (label, ok, info) => { if (!ok) fails++; console.log((ok ? "ok   " : "FAIL ") + label + (info != null ? " — " + info : "")); };

(async () => {
  const { w, CR, doc, errors } = boot();
  await sleep(150);
  const R = (code, num) => ({ code, num });

  // ---------------------------------------------------------------- A. Lecture tolérante
  const P = (x, d) => { const r = CR.parseCite(x, d || "CPP"); return r.num ? CR.refKey(r) : r.illisible ? "illisible" : "vide"; };
  const cases = [
    ["63-1", "CPP_63-1"], ["art. 63-1 CPP", "CPP_63-1"], ["Article 63‑1 du code de procédure pénale", "CPP_63-1"], ["ART63-1", "CPP_63-1"],
    ["63 - 1 c. pr. pén.", "CPP_63-1"], ["art 63-1, al. 2", "CPP_63-1"], ["R. 625-1 code pénal", "CP_R625-1"], ["r625-1 cp", "CP_R625-1"],
    ["L 234-2 c. route", "CR_L234-2"], ["434-15 bis", "CPP_434-15 bis"], ["article 3 loi du 5 juillet 1985", "L85_3"], ["122-5 C. pén.", "CP_122-5"],
    ["  ", "vide"], ["121-5 et 221-1", "illisible"],
  ];
  for (const [x, want] of cases) check(`lecture « ${x.trim() || "(vide)"} »`, P(x) === want, P(x));
  check("ce qui est compris, sans le titre", CR.citeLabel(R("CPP", "63-1")) === "article 63-1 du code de procédure pénale", CR.citeLabel(R("CPP", "63-1")));
  check("préfixe affiché R.", CR.citeLabel(R("CP", "R625-1")) === "article R. 625-1 du code pénal");

  // ---------------------------------------------------------------- B. Erreurs graduées
  const G = (code, num, ex) => CR.gradeCite(R(code, num), ex).g;
  check("juste", G("CPP", "385", [R("CPP", "385")]) === "ok");
  check("bon article, mauvais code", G("CP", "385", [R("CPP", "385")]) === "code");
  check("voisin : 386 pour 385", G("CPP", "386", [R("CPP", "385")]) === "voisin");
  check("voisin : 63-4-1 pour 63-4", G("CPP", "63-4-1", [R("CPP", "63-4")]) === "voisin");
  check("voisin : 222-12 pour 222-11", G("CP", "222-12", [R("CP", "222-11")]) === "voisin");
  check("pas voisin : 222-37 pour 222-11", G("CP", "222-37", [R("CP", "222-11")]) === "faux");
  check("pas voisin : 476 pour 475-1", G("CPP", "476", [R("CPP", "475-1")]) === "faux");
  check("plusieurs bonnes réponses", G("CP", "221-1", [R("CP", "121-5"), R("CP", "221-1")]) === "ok");
  check("rien de saisi", CR.gradeCite(null, [R("CPP", "385")]).g === "absent");
  check("article inconnu repéré (faute de frappe)", !CR.articleConnu(R("CPP", "9999")) && CR.articleConnu(R("CPP", "63-1")));

  // ---------------------------------------------------------------- C. Base de textes : chaque réponse attendue existe, sans renumérotation
  let roundtrip = 0;
  for (const id of Object.keys(CR.TEXTES)) { const r = CR.refOfId(id); if (!r) continue; const t = CR.TEXTES[id].cite.replace(/\s*\(.*\)$/, ""); if (CR.refKey(CR.parseCite(t, "CPP")) === id) roundtrip++; else check("relecture de « " + t + " »", false, CR.refKey(CR.parseCite(t, "CPP"))); }
  check("chaque citation de la base se relit en son identifiant", true, roundtrip + " articles");
  const s0 = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 1 });
  CR.store.s = s0;
  const expected = new Set(), unmasked = new Set();
  let masked = 0;
  for (const id of Object.keys(CR.CASES)) {
    let cs; try { cs = CR.openCase(s0, id); } catch (e) { continue; }
    cs.proc.audience = cs.proc.audience || { day: s0.day + 30, juridiction: "tc", convocDay: s0.day };
    const keys = new Set([...Object.keys(CR.SHARED_TPL), ...Object.keys(CR.CASES[id].tpls || {})]);
    for (const k of keys) {
      let t; try { t = CR.getTpl(s0, cs, k); } catch (e) { continue; }
      if (!t) continue;
      const specs = CR.tplCites(t);
      for (const sp of Object.values(specs)) { masked++; sp.expect.forEach((r) => expected.add(CR.refKey(r))); }
      const all = [].concat(...(t.checks || []).map((c) => c.options.map((o) => o.t)), ...Object.values(t.slots || {}).filter((x) => x.type === "choice").map((x) => x.options.map((o) => o.t)));
      for (const txt of all) for (const r of CR.scanCitations(txt)) if (!CR.TEXTES[CR.refKey(r)]) unmasked.add(CR.refKey(r));
    }
  }
  for (const irr of Object.values(CR.IRREG)) (irr.textes || []).forEach((k) => expected.add(k));
  const bad = CR.citeBaseCheck([...expected]);
  check(`réponses attendues présentes dans la base (${expected.size}, ${masked} citations à saisir dans les actes)`, bad.length === 0, bad.map((b) => b.k + " " + b.why).join(" ; "));
  console.log("info : citations d'actes laissées en clair faute de texte dans la base :", [...unmasked].sort().join(", ") || "aucune");

  // ---------------------------------------------------------------- D. Acte : un article faux fait tomber le point, un voisin le garde
  const s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 7 });
  CR.store.s = s; s.settings.coach = false; s.settings.textSpeed = 60; s.settings.saisie = "assiste";
  const cs = CR.openCase(s, "a11_president");
  cs.status = "active"; cs.engaged = s.day;
  const tpl = CR.getTpl(s, cs, "plainte_parquet");
  const specs = CR.tplCites(tpl);
  check("citations repérées dans la plainte", !!specs["ck:points:competence"] && !!specs["ck:points:lieu"], Object.keys(specs).join(", "));
  check("texte masqué", /art\. … du code pénal/.test(CR.citeMasked(specs["ck:points:competence"])), CR.citeMasked(specs["ck:points:competence"]));
  const ev = CR.evalDraft(s, cs, tpl, { dest: "lyon", qualif: "bo" }, { points: ["competence", "lieu"] }, {
    "ck:points:competence": { ref: R("CP", "113-2"), g: "faux" }, "ck:points:lieu": { ref: R("CPP", "383"), g: "voisin", attendu: R("CPP", "382") },
  });
  check("faux : le point ne compte plus", !ev.picks.points.includes("competence") && ev.ecrits.points.includes("competence"));
  check("voisin : le point tient, l'erreur est notée", ev.picks.points.includes("lieu") && ev.defects.includes("cite:points:lieu:voisin"), ev.defects.join(","));
  check("choix sans citation tapée : article absent", ev.defects.some((d) => d.startsWith("cite:qualif:absent")), ev.defects.join(","));
  check("mode liste : rien ne change", CR.evalDraft(s, cs, tpl, { dest: "lyon", qualif: "bo" }, { points: ["competence"] }, null).picks.points.includes("competence"));

  // ---------------------------------------------------------------- E. Dans l'interface : saisie assistée dans un acte
  CR.pinTexts(s, cs, ["CP_113-2-1", "CPP_382", "CP_313-1", "CP_313-2"]);
  const setVal = (el, v) => { const d = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, "value"); d.set.call(el, v); el.dispatchEvent(new w.Event("input", { bubbles: true })); };
  CR.store.bump(); await sleep(60);
  CR.UI._setScene({ type: "draft", caseId: cs.id, tpl: "plainte_parquet" }); CR.store.bump(); await sleep(80);
  await click(w, doc.querySelector("#ck-points-competence"));
  let inp = doc.querySelector(".cite-num");
  check("la saisie s'ouvre quand on coche un point cité", !!inp);
  setVal(inp, "art 113-2-1 c. pén."); await sleep(40);
  check("le jeu dit ce qu'il a compris", /Compris : article 113-2-1 du code pénal/.test(texts(doc.querySelector(".cite-compris"))), texts(doc.querySelector(".cite-compris")));
  await click(w, findBtn(doc, /^Citer$/)); await sleep(30);
  await click(w, doc.querySelector("#ck-points-lieu"));
  inp = doc.querySelector(".cite-num"); setVal(inp, "9999"); await sleep(30); await click(w, findBtn(doc, /^Citer$/));
  check("article inexistant : faute de frappe, sans essai perdu", /faute de frappe/.test(texts(doc.querySelector(".cite-msg") || doc.body)));
  inp = doc.querySelector(".cite-num"); setVal(inp, "383"); await sleep(30); await click(w, findBtn(doc, /^Citer$/));
  check("assisté : un indice après une erreur", /Indice/.test(texts(doc.querySelector(".cite-msg") || doc.body)), texts(doc.querySelector(".cite-msg") || doc.body).slice(0, 120));
  inp = doc.querySelector(".cite-num"); setVal(inp, "384"); await sleep(30); await click(w, findBtn(doc, /^Citer$/));
  check("assisté : la réponse au second échec", /Réponse donnée/.test(texts(doc.querySelector(".cite-recap") || doc.body)));
  for (const b of [...doc.querySelectorAll(".slot")].filter((x) => /\[Destinataire\]/.test(texts(x)))) await click(w, b);
  const lyon = [...doc.querySelectorAll(".slot-panel .choice")].find((b) => /Lyon/.test(texts(b)) && /procureur/.test(texts(b)));
  if (lyon) await click(w, lyon);
  const qual = [...doc.querySelectorAll(".slot")].find((x) => /\[Qualification\]/.test(texts(x))); if (qual) await click(w, qual);
  const bo = [...doc.querySelectorAll(".slot-panel .choice")].find((b) => /bande organisée/.test(texts(b)));
  check("choix affiché sans son article", bo && /art\. …/.test(texts(bo)) && !/313-2/.test(texts(bo)), bo && texts(bo));
  if (bo) await click(w, bo);
  inp = doc.querySelector(".cite-num"); if (inp) { setVal(inp, "313-2"); await sleep(30); await click(w, findBtn(doc, /^Citer$/)); }
  await click(w, findBtn(doc, /^(Terminer la rédaction|Envoyer)$/)); const vb = findBtn(doc, "Valider avec des blancs"); if (vb) await click(w, vb);
  await sleep(60);
  const d = CR.drafted(cs, "plainte_parquet");
  check("acte déposé avec ses citations", d && d.picks.points.includes("competence") && d.picks.points.includes("lieu"), d && JSON.stringify(d.picks));
  check("réponse donnée notée (pénalité légère)", d && d.defects.includes("cite:points:lieu:aide"), d && d.defects.join(","));
  check("l'article raté rejoint la révision", (s.revision || []).some((r) => r.attendu === "CPP_382"), JSON.stringify(s.revision));
  const fdoc = cs.docs.find((x) => x.key === "_drafted"); const rd = CR.renderDoc(s, cs, fdoc);
  check("l'acte écrit montre l'article tapé", JSON.stringify(rd.paras).includes("art. 113-2-1 du code pénal"));

  // ---------------------------------------------------------------- F. Textes par dossier
  const other = CR.openCase(s, "a06_messages"); other.status = "active";
  check("un texte lu ailleurs n'est pas dans ce dossier", !CR.inHand(s, other, "CP_113-2-1") && CR.inHand(s, cs, "CP_113-2-1"));
  CR.pinText(s, other, "CPP_475-1");
  check("enregistré dans un dossier : il y est", CR.inHand(s, other, "CPP_475-1") && CR.pinnedTexts(s, other).includes("CPP_475-1"));
  CR.unpinText(s, other, "CPP_475-1");
  check("retiré : il n'y est plus", !CR.inHand(s, other, "CPP_475-1"));
  const legacy = JSON.parse(CR.serialize(s)); delete legacy.cases.a06_messages.textesParDossier; legacy.researched.push("CP_222-17");
  const sl = CR.deserialize(legacy);
  check("ancienne sauvegarde : tous les textes lus restent disponibles", CR.inHand(sl, sl.cases.a06_messages, "CP_222-17") && !sl.cases.a06_messages.textesParDossier);
  check("ancienne sauvegarde lisible : révision vide créée", Array.isArray(sl.revision));

  // ---------------------------------------------------------------- G. Bloc-notes dans le dossier
  CR.UI._setScene(null); CR.store.bump(); await sleep(40);
  await click(w, [...doc.querySelectorAll(".rail-btn")].find((x) => texts(x).startsWith("Dossiers")));
  await click(w, [...doc.querySelectorAll(".case-card")].find((x) => /Rhône Usinage/.test(texts(x))));
  await click(w, [...doc.querySelectorAll(".tab")].find((x) => /^Bloc-notes/.test(texts(x))));
  await click(w, findBtn(doc, /Écrire une note/));
  const ta = doc.querySelector(".nform textarea");
  const tset = Object.getOwnPropertyDescriptor(w.HTMLTextAreaElement.prototype, "value").set; tset.call(ta, "Vérifier l'heure du virement auprès de la banque"); ta.dispatchEvent(new w.Event("input", { bubbles: true }));
  const sels = doc.querySelectorAll(".nform select");
  const sset = Object.getOwnPropertyDescriptor(w.HTMLSelectElement.prototype, "value").set; sset.call(sels[0], "verifier"); sels[0].dispatchEvent(new w.Event("change", { bubbles: true }));
  const dt = doc.querySelector('.nform input[type="date"]'); const iset = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, "value").set; iset.call(dt, CR.fmtDate(s.day - 3, "iso")); dt.dispatchEvent(new w.Event("input", { bubbles: true }));
  await sleep(30);
  await click(w, findBtn(doc, /^Ajouter$/));
  const own = cs.notes.find((n) => n.own);
  check("note écrite, classée, datée", own && own.cat === "verifier" && own.quand === s.day - 3, own && JSON.stringify(own));
  await click(w, [...doc.querySelectorAll(".nchip")].find((x) => /^À vérifier/.test(texts(x))));
  check("filtre par catégorie", doc.querySelectorAll(".carnet-line").length === 1, doc.querySelectorAll(".carnet-line").length);
  await click(w, findBtn(doc, /Frise des faits/));
  check("frise des faits", doc.querySelectorAll(".frise-item").length >= 1);
  await click(w, [...doc.querySelectorAll(".tab")].find((x) => /^Textes/.test(texts(x))));
  check("onglet Textes du dossier", doc.querySelectorAll(".tx").length === CR.pinnedTexts(s, cs).length, doc.querySelectorAll(".tx").length);

  // ---------------------------------------------------------------- H. À l'audience : plaidoirie et carte de texte, en saisie
  CR.pinText(s, cs, "CPP_475-1");
  const host = doc.createElement("div"); doc.body.appendChild(host);
  let fin = null;
  const steps = [
    { plaidoirie: { args: [{ id: "art475", label: "Les frais d'avocat (art. 475-1)", say: "Je demande une somme au titre de l'article 475-1.", cards: ["CPP_475-1"] }] } },
    { card: { prompt: "Le parquet conteste : sur quel texte ?", accept: ["CPP_475-1"], window: 60000 } },
  ];
  const root = w.ReactDOM.createRoot(host);
  root.render(w.React.createElement(CR.UI.AudienceScene, { s, cs, steps, title: "Essai", onEnd: (r) => { fin = r; } }));
  await sleep(120);
  check("dossier à côté de l'audience", !!host.querySelector(".court-dossier .dside"));
  const arg = [...host.querySelectorAll(".arg")].find((b) => /frais/.test(texts(b)));
  check("argument affiché sans son article", arg && /art\. …/.test(texts(arg)), arg && texts(arg));
  await click(w, arg);
  inp = host.querySelector(".cite-num"); setVal(inp, "475-1 cpp"); await sleep(30); await click(w, findBtn(host, /^Citer$/));
  await click(w, findBtn(host, /^Plaider$/)); await sleep(200);
  // mode libre (A4 ter) : la main s'ouvre par le geste « Produire une pièce ou citer un texte »
  if (!host.querySelector(".hcard") && host.querySelector(".gestes-audience .produire")) { await click(w, host.querySelector(".gestes-audience .produire")); await sleep(30); }
  const t475 = CR.lib("CPP_475-1").titre;
  const hc = [...host.querySelectorAll(".hcard")].find((b) => texts(b).includes(t475) && !/475/.test(texts(b)));
  check("carte de texte sans numéro", !!hc, [...host.querySelectorAll(".hcard")].map((b) => texts(b)).join(" | ").slice(0, 200));
  if (hc) { await click(w, hc); inp = host.querySelector(".cite-num"); setVal(inp, "475-1"); await sleep(30); await click(w, findBtn(host, /^Citer$/)); }
  await sleep(400);
  if (!host.querySelector(".court-done")) console.log("audience :", texts(host).slice(-400));
  const out = host.querySelector(".court-done") ? findBtn(host, "Sortir de la salle") : null; if (out) await click(w, out);
  await sleep(50);
  check("plaidoirie : l'argument tient avec le bon article", fin && fin.plaidoirie && fin.plaidoirie.args.includes("art475"), fin && JSON.stringify(fin.plaidoirie));
  check("carte de texte jouée", fin && [...fin.played].includes("CPP_475-1"), fin && JSON.stringify([...fin.played]));
  root.unmount();

  console.log("échecs:", fails);
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
