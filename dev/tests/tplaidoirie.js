// Refonte, lot 4b : la plaidoirie par le catalogue universel des moyens et l'audience sans signal.
// node tests/tplaidoirie.js   « échecs: 0 » attendu.
const { boot, sleep, texts, findBtn, click } = require("./harness");
const P = require("./play"); const U = require("./util");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d ? " — " + String(d).slice(0, 300) : "")); } };
  // 1. le catalogue : le même pour toutes les affaires, chaque moyen convertible, pertinence cachée
  {
    const { CR } = boot();
    const PL = CR.PLAID;
    const ids = PL.CATALOGUE.flatMap(([, , l]) => l.map((u) => u.id));
    ok(new Set(ids).size === ids.length && ids.length >= 25, "catalogue : identifiants uniques et assez de moyens", ids.length);
    ok(JSON.stringify(PL.catalogue("defense")) === JSON.stringify(PL.CATALOGUE), "le catalogue de la défense dépend de l'affaire");
    const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere" });
    const cs = CR.GEN.open(s, "ci", {});
    const Pargs = { role: "defense", args: [{ id: "doute", label: "L'identification de l'auteur est incertaine", say: "Le doute.", cards: ["G_doute_ident"] }, { id: "emploi", label: "Son emploi", say: "Il travaille.", cards: [] }] };
    const st = { played: new Set() };
    const a1 = PL.convertir(s, cs, Pargs, "u_ident", st), a2 = PL.convertir(s, cs, Pargs, "u_emploi", st), a3 = PL.convertir(s, cs, Pargs, "u_ld", st);
    ok(a1 && a1.sansPiece, "un moyen permis mais non appuyé doit être sans pièce", JSON.stringify(a1));
    ok(a2 && a2.id === "emploi", "un moyen permis et appuyé rend l'argument réel");
    ok(a3 && a3.horsSujet && a3.ok === false, "un moyen que le dossier ne permet pas est hors sujet");
    st.played.add("G_doute_ident");
    ok(PL.convertir(s, cs, Pargs, "u_ident", st).id === "doute", "une pièce jouée appuie le moyen");
  }
  // 2. une comparution immédiate jouée en mode libre : pas de signal, catalogue affiché, verdict raisonné
  {
    const env = await U.career("none", 11);
    const { w, doc, CR, s, errors } = env;
    s.pending = s.pending.filter((e) => e.type !== "lead");
    let d = s.day + 1; while (!CR.isBusinessDay(d)) d++;
    CR.signDuty(s, d, "ci"); while (s.day < d) CR.endDay(s);
    while (!s.ring && s.min < 16 * 60) CR.spend(s, 10, "admin");
    CR.store.bump(); await sleep(40);
    await click(w, findBtn(doc, "Répondre")); await P.waitFor(() => doc.querySelector(".call-scene"));
    for (const re of [/Que savez-vous/, /J'y vais|Je prends le dossier/]) { await sleep(80); const sk = [...doc.querySelectorAll("button.link")].find((b) => texts(b).includes("Afficher toute")); if (sk) await click(w, sk); const b = [...doc.querySelectorAll(".q-btn")].find((x) => re.test(texts(x))); if (b) await click(w, b); }
    await P.waitFor(() => findBtn(doc, /^Terminer$/, doc.querySelector(".closing"))); await click(w, findBtn(doc, /^Terminer$/, doc.querySelector(".closing"))); await sleep(60);
    const cs = s.cases[s.order.find((id) => id.startsWith("g_"))];
    const T = CR.client(cs).nom;
    for (const re of [/Lire le dossier/, /proche/, /employeur/]) { await P.openCase(w, doc, T); if (!P.taskBtn(doc, re)) continue; await P.runTask(w, doc, re); }
    U.noteDocs(CR, s, cs);
    const h = cs.hearings.find((x) => !x.attended);
    while (s.day < h.day) CR.endDay(s);
    s.settings.saisie = "assiste"; // mode libre : catalogue, pas de signal
    CR.TRAV.moyen(s, cs, { col: "peine", titre: "Garanties de représentation solides" });
    CR.store.bump(); await sleep(30);
    await U.goCourt(env);
    const { runAudience } = require("./court");
    let vuCat = false, signaux = 0;
    const SIG = /hoche la tête|prend une note|fronce|soupire|lève les yeux|griffonne|sourit/i;
    const vus = new Set();
    let vuPlan = false;
    const obs = setInterval(() => { if (doc.querySelector(".args-cat")) vuCat = true; if (/Garanties de représentation solides/.test(texts(doc.querySelector(".plan-barre") || doc.createElement("i")))) vuPlan = true; for (const l of doc.querySelectorAll(".tline")) vus.add(texts(l)); }, 15);
    const log = await runAudience(w, doc, CR, { prefer: [/jugé aujourd'hui/], limine: [/./], angle: /peine/i, args: [/garanties/, /insertion professionnelle/, /aménagement/], card: /Attestation|Domicile/ });
    clearInterval(obs);
    const phrases = ["bon", "mauvais"].flatMap((k) => Object.values(CR.ACT.SIGNAUX[k]).flat()).flatMap((p) => [p, p.replace("La présidente", "Le président"), p.replace("Le président", "La présidente")]);
    signaux = [...vus].filter((l) => phrases.some((p) => l.includes(p))).length; if (signaux) console.log("   signal :", [...vus].filter((l) => phrases.some((p) => l.includes(p))));
    ok(vus.size > 20, "le texte de l'audience n'a pas été lu", vus.size);
    const tout = [...vus].join("\n"); if (process.env.VOIR) console.log(tout);
    ok(/le tribunal va vous interroger/.test(tout), "l'interrogatoire du président n'est pas entier");
    ok([...vus].filter((l) => /^PROCUREUR|^PARQUET|^MINISTÈRE/i.test(l) || /ministère public|Monsieur le président, le tribunal est saisi/.test(l)).length >= 1 && /La personnalité :/.test(tout) && /Les faits matériels sont établis par/.test(tout), "le réquisitoire n'est pas construit sur le dossier", tout.slice(-800));
    ok(vuCat, "le catalogue des moyens ne s'affiche pas");
    ok(vuPlan, "le plan de défense n'est pas à la barre");
    const deb = (cs.vars.debriefJugement || []).filter((x) => x.kind === "calc").map((x) => x.text);
    ok(deb.length >= 3 && deb.every((x) => !/seuil|\(\d+\)|\b\d{2}\b(?! (heures|jours|mois|euros))/.test(x.replace(/D\d+(\/\d+)?/g, ""))), "le débrief affiche des chiffres de calcul", JSON.stringify(deb));
    ok(signaux === 0, "un signal de réaction apparaît pendant l'audience", signaux);
    ok(cs.vars.jugementDay != null && !!cs.vars.raisonnement, "l'audience ne va pas jusqu'au jugement raisonné");
    console.log(`audience — ${CR.caseTitle(s, cs)} · ${cs.vars.raisonnement && cs.vars.raisonnement.coupable ? "condamnation" : "relaxe"} · ${cs.vars.decision && cs.vars.decision.peine}`);
    if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
