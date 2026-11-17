// La consultation (js/consultation.js) : le rendez-vous au cabinet et les entretiens hors garde à vue.
// Une question est écrite en entier, a sa réponse, ne se pose qu'une fois ; rien n'est jamais « déjà dit ».
// node tests/tconsult.js [affaires par genre]   « échecs: 0 » attendu.   VOIR=1 : affiche deux consultations.
const { boot, sleep, texts, findBtn, click } = require("./harness");
(async () => {
  let echecs = 0; const vus = {};
  const ok = (c, k, d) => { if (c) return; echecs++; if (!vus[k]) { vus[k] = 0; console.log("  ✗ " + k + (d ? " — " + String(d).slice(0, 320) : "")); } vus[k]++; };
  const N = +(process.argv[2] || 60);
  // ---------------------------------------------------------------- 1. le moteur, sur toutes les consultations générées
  {
    const { CR, errors } = boot(); await sleep(100);
    const C = CR.CONSULT;
    const s = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 7 }));
    const fmtDe = (cs) => { const v = CR.caseVars(s, cs); return (x) => CR.fmt(x || "", v); };
    let nCasier = 0, nEcartees = 0, nCons = 0, nQ = 0, nSuites = 0, nFaits = 0, montre = 0; const parTheme = {};
    for (const g of ["copj", "al", "op", "pc", "info", "gav", "ci"]) for (let i = 0; i < N; i++) {
      s.day = 20 + i; s.min = 600;
      let cs; try { cs = CR.GEN.open(s, g, { min: s.min, night: false }); } catch (e) { continue; }
      const def = CR.caseDef(cs), api = CR.api(s, cs);
      for (const [ck, call0] of Object.entries(def.calls || {})) {
        const call = typeof call0 === "function" ? call0(api) : call0;
        if (!call || !call.topics || !call.topics.some((tp) => !CR.PAROLE.estGeste(tp))) continue;
        const fmt = fmtDe(cs);
        const K = C.ouvrir(s, cs, call, { api, fmt }), K2 = C.ouvrir(s, cs, call, { api, fmt });
        nCons++;
        const voir = process.env.VOIR && montre < 2 && ck === "intake" && call.kind === "meet" && g !== "pc" && K.ordre.some((id) => K.Q[id].parent);
        if (voir) { montre++; console.log(`\n===== ${g} · ${CR.caseTitle(s, cs)} · ${call.label}`); }
        // toute entrée interrogative de l'entretien est une question du moteur, rangée dans un thème nommé
        for (const id of K.ordre) ok(C.THEMES[K.Q[id].theme], "une question sans thème", id);
        nEcartees += call.topics.filter((tp) => C.estQuestion(tp) && !K.Q[tp.id]).length;
        ok(K.themes.length >= 1 && K.themes.every((th) => th.label), "consultation sans thème", g + "/" + ck);
        // une suite ne se propose pas avant sa question
        for (const id of K.ordre) { const q = K.Q[id]; if (q.parent) ok(!C.questions(K, q.theme, null).includes(q), "une question de suite est proposée avant sa question", id); }
        // celui qui cache son casier le cache à la question sur ses antécédents, et ne dit pas le contraire ailleurs
        { const tt = (s.generated.find((x) => x.id === cs.id) || {}).t, mk = tt && tt.vie && tt.vie.ment && tt.vie.ment.k, ant = K.ordre.map((id) => K.Q[id]).find((q) => q.theme === "antecedents");
          if (mk === "pas_casier" && ant && K.ordre.some((id) => K.Q[id].a.some((x) => x && x.f === "G_vie_ment"))) { nCasier++; ok(ant.a.some((x) => x && x.f === "G_vie_ment") && !ant.a.some((x) => x && x.f === "G_casier"), "le mensonge sur le casier n'est pas à sa question", g + "/" + ck); } }
        const faitsAttendus = new Set(); for (const id of K.ordre) for (const x of K.Q[id].a) if (x && x.f) faitsAttendus.add(x.f);
        // la découverte : au cabinet, ni l'enquête, ni les preuves, ni les précisions du catalogue avant que le client ait parlé
        const recit0 = K.ordre.map((id) => K.Q[id]).find((q) => q.theme === "faits" && !q.parent);
        for (const id of K.ordre) { const q = K.Q[id]; if (recit0 && q !== recit0 && !q.parent) ok(!/_x\d+$/.test(id) && !["preuves", "prejudice"].includes(q.theme), "une précision se propose avant le récit des faits", g + "/" + ck + " " + id); }
        if (call.scene === "conference" && K.ordre.some((id) => K.Q[id].theme === "enquete") && !/garde à vue|commissariat|polic|audition|gendarm|interpell/i.test((call.opening || []).map((x) => fmt(typeof x === "string" ? x : x.t)).join(" "))) ok(!C.themesVisibles(K, null).some((th) => th.id === "enquete"), "l'enquête se propose avant que le client en ait parlé", g + "/" + ck);
        ok(C.themesVisibles(K, null).length >= 2 || K.ordre.length < 2, "moins de deux thèmes à l'ouverture", g + "/" + ck);
        const faitsLivres = new Set(), dites = new Set();
        // tout poser, thème par thème, jusqu'à épuisement
        for (let tour = 0; tour < 40; tour++) {
          const q = K.themes.map((th) => C.questions(K, th.id, null).find((x) => !C.posee(K, x.id))).find(Boolean);
          if (!q) break;
          const r = C.poser(K, q.id), r2 = C.poser(K2, q.id);
          nQ++; if (q.parent) nSuites++; parTheme[q.theme] = (parTheme[q.theme] || 0) + 1;
          ok(JSON.stringify(r) === JSON.stringify(r2), "réponse non déterministe", q.id);
          ok(/[?.]\s*$/.test(q.q) && !/undefined|\$\{|\{[a-zA-Z]+\}|\bnull\b|NaN/.test(q.q), "question mal formée", q.q);
          ok(r.lignes.length >= 1 && r.lignes.every((l) => l.t && !/undefined|\$\{|\bnull\b|NaN|\[object/.test(l.t)), "réponse vide ou technique", q.q + " → " + JSON.stringify(r.lignes));
          const tout = r.lignes.map((l) => l.t).join(" ");
          ok(!C.RENVOI.test(tout), "le client renvoie à une réponse précédente", q.q + " → " + tout);
          ok(!/^\(Un temps\.\) Je ne sais pas quoi vous répondre\.$/.test(tout), "une question sans réponse propre", q.q);
          for (const l of r.lignes) { if (l.t.length > 14) ok(!dites.has(l.t), "une phrase redite dans le même entretien", l.t); dites.add(l.t); if (l.f) faitsLivres.add(l.f); }
          ok(C.poser(K, q.id) === null, "une question se pose deux fois", q.id);
          ok(r.min >= 1 && r.min <= 8, "durée d'une question", r.min);
          // la réponse répond à la question : ce que chaque question de suite va chercher
          const k = q.parent ? q.id.split(":").pop() : null;
          if (k === "quand") ok(/heure|\d h |minuit|midi|matin|soir|journée|minutes|après|venus|convocation|déjà là/i.test(tout), "« à quelle heure » : la réponse ne parle pas du moment", tout);
          if (k === "ou") ok(/chez moi|station|attrapé|arrêté/i.test(tout) || /rue|avenue|boulevard|place|quai|chez|quartier|coin|station|magasin|bar|métro|parking|domicile|appartement|square|impasse|allée|passage|gare|centre|là-bas|côté|route|pont|cité|immeuble|hall|marché|parc|bus|rame|ligne|arrêt|quai|tram|train/i.test(tout), "« où » : la réponse ne parle pas du lieu", tout);
          if (k === "justif") ok(/attestation|factures|fiches de paie/.test(tout), "« justifier du travail » : la réponse n'en dit rien", tout);
          if (voir) console.log(`  [${C.THEMES[q.theme]}]${q.parent ? " ↳" : ""} ${q.q}\n      ${tout}${r.client ? "\n      (question du client : " + r.client + " → " + C.repondreClient(K, r.client, true).t + ")" : ""}`);
          if (r.client) ok(!!C.repondreClient(K2, r.client, true).t, "une question du client sans réponse de l'avocat", r.client);
        }
        ok(K.ordre.every((id) => C.posee(K, id)), "des questions restent inaccessibles", K.ordre.filter((id) => !C.posee(K, id)).join(","));
        for (const f of faitsAttendus) { nFaits++; ok(faitsLivres.has(f), "un fait de l'entretien n'est jamais livré", g + "/" + ck + " " + f); }
        // le corrigé : rien posé, tout ce qui portait un fait manque ; tout posé, rien ne manque
        ok(C.corriger(s, cs, K).length === 0, "le corrigé reproche une question posée");
        const K3 = C.ouvrir(s, cs, call, { api, fmt });
        const manque = C.corriger(s, cs, K3);
        ok(manque.every((x) => x.question && x.sujet), "corrigé sans question", JSON.stringify(manque[0]));
        if (faitsAttendus.size) ok(manque.length >= 1, "le corrigé ne dit pas ce qu'il fallait demander", g + "/" + ck);
      }
    }
    ok(nCons >= 100, "trop peu de consultations générées", nCons);
    ok(nSuites >= nCons / 4, "trop peu de questions de suite", nSuites);
    console.log(`moteur — ${nCons} consultations · ${nQ} questions (${(nQ / nCons).toFixed(1)} par entretien, dont ${nSuites} de suite) · ${nFaits} faits livrés · ${nCasier} casiers cachés · ${nEcartees} questions écartées (elles supposaient ce que le client nie) · thèmes ${JSON.stringify(parTheme)}`);
    if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  }
  // ---------------------------------------------------------------- 2. dans l'interface : le rendez-vous au cabinet
  {
    const { w, doc, CR, errors } = boot();
    await sleep(100);
    await click(w, findBtn(doc, "Nouvelle partie")); await sleep(80); { const lib = [...doc.querySelectorAll('input[name="nc-aide"]')].find((r) => /Libre/.test(r.closest("label").textContent)); if (lib) await click(w, lib); } /* 1.4.0 : « Assisté » est coché à la première carrière ; ce test joue en libre */ await click(w, findBtn(doc, /^Carrière/)); await sleep(200);
    const s = CR.store.s; s.settings.coach = false; s.settings.saisie = "assiste"; CR.PAROLE.ACCEL = 60; CR.store.bump(); await sleep(60);
    const attendre = async () => { for (let k = 0; k < 500 && !doc.querySelector(".closing") && (doc.querySelector(".oral .oral-caret") || !findBtn(doc, /^Terminer l'entretien/)); k++) await sleep(20); await sleep(40); };
    const libres = () => [...doc.querySelectorAll(".consult-q")].filter((x) => !x.disabled);
    for (const kind of ["copj", "pc", "al"]) {
      const cs = CR.GEN.open(s, kind, {});
      CR.store.bump(); await sleep(60);
      CR.UI._setScene({ type: "call", caseId: cs.id, call: "intake" }); await sleep(250);
      ok(!!doc.querySelector(".call-consult"), `${kind} : le rendez-vous n'est pas une consultation`, texts(doc.querySelector(".call-scene") || doc.body).slice(0, 200));
      if (!doc.querySelector(".call-consult")) continue;
      ok(!doc.querySelector(".call-consult .compo-go") && ![...doc.querySelectorAll(".call-consult .compo-h")].some((x) => /Angle|Forme/.test(texts(x))), `${kind} : le compositeur sujet, angle, forme subsiste`);
      await attendre();
      const themes = () => [...doc.querySelectorAll(".consult .compo-sujets .compo-b")];
      ok(themes().length >= 3, `${kind} : moins de trois thèmes`, themes().map(texts).join(" | "));
      let posees = 0;
      for (let tour = 0; tour < 30; tour++) {
        let q = libres()[0];
        if (!q) { const th = themes().find((x) => !x.classList.contains("fait") && !x.classList.contains("on")); if (!th) break; await click(w, th); await sleep(30); q = libres()[0]; if (!q) break; }
        const texte = texts(q.querySelector("span"));
        await click(w, q); posees++; await attendre();
        ok(!libres().some((x) => texts(x.querySelector("span")) === texte), `${kind} : une question posée se repropose`, texte);
        for (const x of [...doc.querySelectorAll(".oral .who-client .oral-t")].filter((x) => !x.disabled)) await click(w, x);
        const b = findBtn(doc, /^Lui répondre/); if (b) { await click(w, b); await attendre(); }
        if (doc.querySelector(".closing")) break;
      }
      ok(posees >= 5, `${kind} : moins de cinq questions posées`, posees);
      ok(cs.notes.length > 0 && cs.notes.some((n) => n.fact), `${kind} : aucune phrase notée ne porte un fait`);
      // 1.2.0 : chaque phrase notée garde son contexte (qui, où, à quelle heure) ; les réponses gardent la question posée
      { const N = cs.notes.filter((n) => n.src === "call" && !n.own);
        ok(N.length > 0 && N.every((n) => n.cx && n.cx.qui && n.cx.ou && n.min != null), `${kind} : une note sans contexte`, JSON.stringify(N.find((n) => !(n.cx && n.cx.qui && n.cx.ou))));
        ok(N.filter((n) => n.cx && n.cx.q && n.cx.qqui === "Vous").length >= N.length * 0.6, `${kind} : les réponses notées ne gardent pas la question`, N.filter((n) => n.cx && n.cx.q).length + " / " + N.length); }
      ok(!cs.notes.some((n) => CR.CONSULT.RENVOI.test(n.text)), `${kind} : « déjà dit » dans les notes`, cs.notes.map((n) => n.text).find((x) => CR.CONSULT.RENVOI.test(x)));
      const fil = doc.querySelector(".ent-fil"); // le fil des questions, au niveau assisté (onglet des notes) : absent de cet écran, sans erreur
      const t = findBtn(doc, /^Terminer l'entretien/); if (t) { await click(w, t); await sleep(80); }
      const fin = findBtn(doc, /^Terminer$/, doc.querySelector(".closing"));
      ok(!!fin, `${kind} : pas de fin d'entretien`, texts(doc.querySelector(".call-main") || doc.body).slice(-300)); if (fin) await click(w, fin);
      await sleep(80);
      ok(cs.status === "prospect" || cs.status === "active", `${kind} : le premier entretien n'est pas enregistré`, cs.status);
      ok((cs.vars.asked || []).length >= 3, `${kind} : les questions posées ne sont pas gardées`, JSON.stringify(cs.vars.asked));
      console.log(`interface — ${kind} · ${CR.caseTitle(s, cs)} · ${posees} questions · notes ${cs.notes.length} · reste à demander ${((cs.vars.corrige || {})["Rendez-vous au cabinet"] || []).length}`);
    }
    if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 3).join(" | ")); }
  }
  for (const [k, n] of Object.entries(vus)) if (n > 1) console.log(`    (${n} fois : ${k})`);
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
