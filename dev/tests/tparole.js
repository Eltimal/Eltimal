// Refonte du gameplay, lot 3 : la parole en garde à vue (client modélisé, question composée, conseil sujet par sujet,
// audition intégrale, procès-verbal relu tiré de ce qui a été dit), puis une garde à vue jouée dans l'interface.
// node tests/tparole.js [graines] [graine de carrière]   « échecs: 0 » attendu.
const { boot, sleep, texts, findBtn, click } = require("./harness");
const P = require("./play"); const U = require("./util");
(async () => {
  let echecs = 0; const vus = {};
  const ko = (k, d) => { echecs++; if (!vus[k]) { vus[k] = 0; console.log("  ✗ " + k + (d ? " — " + String(d).slice(0, 260) : "")); } vus[k]++; };
  const ok = (c, k, d) => { if (!c) ko(k, d); };
  // ---------------------------------------------------------------- 1. le moteur
  {
    const { CR, errors } = boot();
    const G2 = CR.GEN2, PA = CR.PAROLE;
    const N = +(process.argv[2] || 400);
    let n = 0; const suit = {}, voies = {}, lg = [], faitsCles = { oui: 0, non: 0 }, hums = {};
    for (let i = 0; i < N; i++) for (const genre of ["gav", "ci"]) {
      const t = G2.tirer("tparole:" + i, genre, {}); if (!t || !CR.SIM.supporte(t)) continue;
      const def = G2.def({ gen: 2, id: "p" + i + genre, kind: genre, seed: "tparole:" + i, day: 0, t });
      if (typeof def.gav !== "function") continue;
      const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere" });
      const cs = { vars: {}, flags: {}, notes: [], docs: [], actors: {} };
      const g = def.gav({ s, cs, profil: () => null, run: () => null });
      ok(g.parole && g.parole.t && CR.GEN2.signature(g.parole.t) === CR.GEN2.signature(t), "le tirage n'est pas transmis à la scène");
      ok(PA.actif(s, g), "la refonte n'est pas active pour une affaire prise en charge");
      ok(!PA.actif(Object.assign({}, s, { settings: Object.assign({}, s.settings, { saisie: "liste" }) }), g), "le mode liste ne garde pas l'ancien entretien");
      n++;
      const M = PA.client(s, cs, g), M2 = PA.client(s, cs, g);
      hums[M.hum] = (hums[M.hum] || 0) + 1;
      // les combinaisons : celles qui portent sur ce qui compte livrent les faits, les autres non
      const faits = new Set();
      let minutes = 0, nq = 0;
      const combos = [];
      for (const S0 of M.sujets) for (const [an] of PA.ANGLES) for (const fo of ["ouverte", "fermee"]) combos.push({ sujet: S0.id, angle: an, forme: fo });
      for (const q of combos) {
        const txt = PA.texteQuestion(M, q); ok(txt && !/undefined|\$\{|null|NaN/.test(txt), "question mal formée", JSON.stringify(q) + " " + txt);
        const r = PA.repondre(M, q), r2 = PA.repondre(M2, q);
        ok(JSON.stringify(r) === JSON.stringify(r2), "réponse non déterministe", JSON.stringify(q));
        ok(r.lignes.length >= 1 && r.lignes.every((l) => l.t && !/undefined|\$\{|\bnull\b|NaN|\[object/.test(l.t)), "réponse vide ou technique", JSON.stringify(q) + " " + JSON.stringify(r.lignes));
        ok(r.min >= 1 && r.min <= 8, "durée d'une question", r.min);
        const S0 = PA.sujet(M, q.sujet), cle = S0.topic && S0.key.includes(q.angle);
        for (const l of r.lignes) if (l.f) { faits.add(l.f); if (!cle && !/^G_vie/.test(l.f)) ko("un fait livré par une question hors sujet", JSON.stringify(q) + " " + l.f); }
        if (minutes < PA.LIMITE) { minutes += r.min; nq++; }
      }
      lg.push(nq);
      ok(faits.has("G_version"), "la version du client n'est jamais livrée");
      if (t.irr.includes("gav_notif")) ok(faits.has("G_notif"), "l'heure de notification n'est jamais livrée");
      // une question ouverte et précise sur l'heure livre le fait ; une question ouverte sur un autre angle, jamais
      const M3 = PA.client(s, cs, g);
      if (t.irr.includes("gav_notif")) { faitsCles.oui += PA.repondre(M3, { sujet: "droits", angle: "quand", forme: "ouverte" }).lignes.some((l) => l.f === "G_notif") ? 1 : 0; faitsCles.non += PA.repondre(PA.client(s, cs, g), { sujet: "droits", angle: "pourquoi", forme: "ouverte" }).lignes.some((l) => l.f) ? 1 : 0; }
      // la confrontation : sans extrait, impossible ; avec la pièce qui contredit le mensonge, le client cède ou maintient
      ok(!PA.possible(M3, { sujet: "faits", angle: "recit", forme: "confrontation" }), "confrontation sans passage");
      ok(!PA.possible(PA.client(s, cs, g), { sujet: "faits", angle: "recit", forme: "relance" }), "relance avant d'avoir abordé le sujet");
      if (M3.ment) { const doc = CR.GEN2.VIE.DOC[M3.ment.preuve]; const r = PA.repondre(M3, { sujet: "faits", angle: "recit", forme: "confrontation", extrait: { key: "gav:" + doc, t: "…", cote: "D3" } }); ok(r.lignes.some((l) => l.f === (M3.ment.issue === "aveu" ? "G_vie_aveu" : "G_vie_maintient")), "confrontation à la pièce qui contredit le mensonge", JSON.stringify(r.lignes)); }
      // le conseil et l'audition
      for (const conseil of ["taire", "parler"]) {
        const Mc = PA.client(s, cs, g);
        for (const [k] of PA.SUJETS_AUDITION) PA.conseiller(Mc, k, conseil);
        const aud = PA.derouler(Mc, 0.3, false), aud2 = PA.derouler(PA.client(s, cs, g).constructor === Object ? Object.assign(PA.client(s, cs, g), { conseil: Mc.conseil }) : Mc, 0.3, false);
        ok(JSON.stringify(aud) === JSON.stringify(aud2), "audition non déterministe");
        ok(aud.lignes.length >= 18, "audition trop courte", aud.lignes.length);
        ok(aud.lignes[0].sujet === "identite" && !aud.lignes[0].silence, "l'identité n'est pas déclinée");
        ok(aud.lignes.every((l) => l.q && (l.a || l.relance) && !/undefined|\$\{|\bnull\b|NaN/.test(l.q + l.a)), "audition mal formée", JSON.stringify(aud.lignes.find((l) => !l.a)));
        const k = conseil + ":" + Mc.hum; suit[k] = suit[k] || [0, 0]; suit[k][0]++; if (aud.suivi.faits === conseil) suit[k][1]++;
        voies[aud.conseilGav] = (voies[aud.conseilGav] || 0) + 1;
        ok(["silence", "partiel", "expliquer"].includes(aud.conseilGav), "résumé du conseil", aud.conseilGav);
        if (aud.suivi.faits === "taire" && aud.suivi.details === "taire" && aud.suivi.preuves === "taire" && !aud.lignes.some((l) => l.cede)) ok(aud.conseilGav === "silence", "silence complet mal résumé");
        const rel = PA.relecture(Mc, aud);
        ok(rel.segs.length >= 8 && rel.segs.every((x) => x.t), "relecture mal formée");
        const err = rel.segs.filter((x) => x.erreur);
        ok(err.length <= 1 && (!err.length || t.erreurPV), "erreur de retranscription inventée");
        if (t.erreurPV && aud.lignes.some((l) => l.sujet === "faits" && !l.silence && l.a)) ok(err.length === 1 && err[0].correct, "erreur de retranscription du tirage absente");
        // la relecture reprend ce qui a été dit, mot pour mot (hors l'erreur)
        for (const l of aud.lignes.filter((x) => x.sujet !== "identite" && x.a)) ok(rel.segs.some((x) => x.t.includes(l.a) || x.erreur), "déclaration absente du procès-verbal relu", l.a);
      }
    }
    const taux = (k) => (suit[k] ? suit[k][1] / suit[k][0] : null);
    const tt = Object.keys(suit).filter((k) => k.startsWith("taire")).map((k) => [k, taux(k)]);
    ok(n >= 60, "trop peu d'affaires", n);
    ok(tt.every(([, v]) => v > 0.35 && v < 1), "le conseil de se taire est suivi toujours ou presque jamais", JSON.stringify(tt));
    ok(tt.some(([, v]) => v < 0.97), "le conseil est toujours suivi", JSON.stringify(tt));
    ok(Object.keys(voies).length === 3, "résumés du conseil", JSON.stringify(voies));
    const med = lg.slice().sort((a, b) => a - b)[lg.length >> 1];
    ok(med >= 7 && med <= 16, "nombre de questions en trente minutes", med);
    ok(faitsCles.non === 0 && faitsCles.oui > 0, "l'angle de la question ne décide pas du fait", JSON.stringify(faitsCles));
    console.log(`moteur — affaires : ${n} · humeurs : ${JSON.stringify(hums)} · questions en 30 min (médiane) : ${med} · silence suivi : ${tt.map(([k, v]) => k.split(":")[1] + " " + Math.round(v * 100) + " %").join(", ")} · résumés : ${JSON.stringify(voies)}`);
    if (errors.length) ko("erreurs au chargement", errors[0]);
  }
  // ---------------------------------------------------------------- 2. une garde à vue jouée dans l'interface
  {
    const env = await U.career("none", +(process.argv[3] || 7));
    const { w, doc, CR, s, errors } = env;
    CR.PAROLE.ACCEL = 60;
    s.pending = s.pending.filter((e) => e.type !== "lead");
    let d = s.day + 1; while (!CR.isBusinessDay(d)) d++;
    // une permanence, jusqu'à tomber sur une affaire que la refonte prend en charge
    let cs = null;
    for (let essai = 0; essai < 12 && !cs; essai++) {
      CR.signDuty(s, d, "gav_jour"); while (s.day < d) CR.endDay(s);
      while (!s.ring && s.min < 19 * 60) CR.spend(s, 10, "admin");
      CR.store.bump(); await sleep(40);
      if (!s.ring) { d = s.day + 1; while (!CR.isBusinessDay(d)) d++; continue; }
      await click(w, findBtn(doc, "Répondre")); await P.waitFor(() => doc.querySelector(".call-scene"));
      for (const re of [/Que savez-vous/, /J'y vais|Je prends le dossier/]) { await sleep(80); const sk = [...doc.querySelectorAll("button.link")].find((b) => texts(b).includes("Afficher toute")); if (sk) await click(w, sk); const b = [...doc.querySelectorAll(".q-btn")].find((x) => re.test(texts(x))); if (b) await click(w, b); }
      await P.waitFor(() => findBtn(doc, /^Terminer$/, doc.querySelector(".closing"))); await click(w, findBtn(doc, /^Terminer$/, doc.querySelector(".closing"))); await sleep(60);
      const c = s.order.map((id) => s.cases[id]).filter((x) => x.id.startsWith("g_") && x.status !== "closed").pop();
      const p = c && s.generated.find((x) => x.id === c.id);
      if (p && p.t && CR.SIM.supporte(p.t) && ["gav", "ci"].includes(p.t.genre)) cs = c;
      else { d = s.day + 1; while (!CR.isBusinessDay(d)) d++; }
    }
    ok(!!cs, "aucune garde à vue prise en charge par la refonte");
    if (cs) {
      s.settings.saisie = "assiste"; // le jeu sans guidage, à partir de la garde à vue
      await P.openCase(w, doc, CR.client(cs).nom);
      await P.runTask(w, doc, /garde à vue/, "taxi");
      await P.waitFor(() => doc.querySelector(".gav-scene"));
      const card = () => doc.querySelector(".gav-card");
      const step = async (re) => { const b = findBtn(doc, re); if (!b) throw new Error("GAV : " + re + " | " + texts(card()).slice(0, 300)); await click(w, b); await sleep(60); };
      await step(/consulter les pièces/); await step(/Rendre les pièces/);
      ok(!!doc.querySelector(".ent-parole .compo") && !doc.querySelector(".gav-card .q-btn"), "l'entretien n'est pas celui de la refonte");
      ok(!texts(doc.querySelector(".gav-steps")).includes("Conseil"), "l'étape de conseil à trois boutons subsiste");
      // attendre que la voix se taise : plus de curseur, et le bouton redevenu « Poser la question » (le client a fini)
      const attendre = async () => { await sleep(60); for (let k = 0; k < 400 && (doc.querySelector(".oral .oral-caret") || [...doc.querySelectorAll(".compo-go button")].some((x) => /parle…|parlez…|Un instant…/.test(texts(x)))); k++) await sleep(20); await sleep(40); };
      let vuParle = false;
      const composer = async (sujet, angle, forme) => {
        const b = (re, root) => [...(root || doc).querySelectorAll(".compo .compo-b")].find((x) => re.test(texts(x)) && !x.disabled);
        await click(w, b(new RegExp("^" + sujet)));
        if (forme) await click(w, b(new RegExp(forme)));
        if (angle) await click(w, b(new RegExp(angle)));
        let go = null; for (let k = 0; k < 100 && !(go = findBtn(doc, /^Poser la question/)); k++) await sleep(20); if (!go) return false; await click(w, go); await sleep(30);
        vuParle = vuParle || [...doc.querySelectorAll(".compo-go button")].some((x) => x.disabled && /parle…|parlez…|Un instant…/.test(texts(x)));
        await attendre(); return true;
      };
      const t0 = texts(doc.querySelector(".chrono"));
      ok(await composer("Les faits", "Ce qui s'est passé"), "poser une question");
      // noter la réplique du client pendant qu'elle est dite
      const avant = cs.notes.length;
      for (const x of [...doc.querySelectorAll(".oral .who-client .oral-t")].filter((x) => !x.disabled)) await click(w, x);
      ok(cs.notes.length > avant, "une réplique ne se note pas");
      ok(CR.hasFact(cs, "G_version"), "la version notée ne donne pas le fait");
      await composer("Vos droits", "Quand");
      // le dernier échange reste lisible : votre question (à droite) et la réponse ; le bouton dit qui parle
      ok(/notifié vos droits/.test(texts(doc.querySelector(".oral .who-you:not(.oral-efface)") || doc.body.firstChild)), "la question posée ne reste pas affichée", texts(doc.querySelector(".oral")).slice(0, 200));
      ok(!!doc.querySelector(".oral .who-client:not(.oral-efface)"), "la réponse du dernier échange ne reste pas affichée");
      ok(vuParle, "le bouton ne dit pas que le client parle");
      ok(!!doc.querySelector(".compo-sujets .compo-b.dit"), "les sujets abordés ne sont pas marqués");
      ok(texts(doc.querySelector(".chrono")) !== t0, "l'horloge de l'entretien n'avance pas");
      // une réplique s'efface
      for (let k = 0; k < 60 && !doc.querySelector(".oral-efface"); k++) await sleep(30);
      ok(!!doc.querySelector(".oral-efface") || doc.querySelectorAll(".oral-l").length < 6, "l'oral ne s'efface pas");
      // le conseil, sujet par sujet
      await click(w, [...doc.querySelectorAll(".ent-onglet")].find((x) => /Conseil/.test(texts(x))));
      for (const l of [...doc.querySelectorAll(".cons-l")].slice(2, 4)) await click(w, [...l.querySelectorAll(".compo-b")].find((x) => /Se taire/.test(texts(x))));
      // une note à soi
      await click(w, [...doc.querySelectorAll(".ent-onglet")].find((x) => /notes/.test(texts(x))));
      ok(doc.querySelectorAll(".ent-fil li").length >= 2 && !!doc.querySelector(".ent-fil .fil-r"), "le fil de l'entretien est absent au niveau assisté", texts(doc.querySelector(".ent-notes") || doc.body).slice(0, 200));
      { const sl = { settings: {}, comp: { entretien: { niveau: 1 } } }, ancien = CR.libre; CR.libre = () => true;
        ok(!CR.PAROLE.filVisible(sl) && CR.PAROLE.filVisible({ settings: {}, comp: {} }), "le fil de l'entretien ne dépend pas du niveau"); CR.libre = ancien; }
      const inp = doc.querySelector(".ent-note-in input"); if (inp) { await P.saisir(w, inp, "Vérifier l'heure de notification"); await click(w, findBtn(doc, /^Noter$/)); }
      ok(cs.notes.some((n) => n.own && /notification/.test(n.text)), "la note tapée n'est pas gardée");
      await step(/Terminer l'entretien|Sortir de l'entretien/);
      ok(cs.vars.conseilParole && cs.vars.conseilParole.faits === "taire", "le conseil n'est pas gardé");
      // l'audition se déroule seule
      for (let k = 0; k < 600 && !findBtn(doc, /^Fin de l'audition/); k++) await sleep(25);
      ok(!!findBtn(doc, /^Fin de l'audition/), "l'audition ne se termine pas");
      ok(cs.vars.auditionGav && cs.vars.auditionGav.length >= 18, "audition intégrale absente", cs.vars.auditionGav && cs.vars.auditionGav.length);
      ok(["silence", "partiel", "expliquer"].includes(cs.vars.conseilGav), "résumé du conseil absent pour le parquet");
      await step(/^Fin de l'audition/);
      await composer("Le logement", "Où"); await sleep(50);
      await step(/Ne plus poser de questions/);
      for (const l of [...doc.querySelectorAll(".gav-card label")]) await click(w, l.querySelector("input"));
      await step(/Rédiger et joindre|Pas d'observations/);
      const pv = texts(doc.querySelector(".paper-pv"));
      ok(cs.vars.auditionGav.filter((x) => x.sujet !== "identite" && x.a).every((x) => pv.includes(x.a.slice(0, 30)) || /je savais ce que je faisais/.test(pv)), "le procès-verbal relu n'est pas ce qui a été dit");
      await step(/Signer et continuer|fidèle/);
      ok(!!findBtn(doc, /^Quitter/), "pas d'issue de la garde à vue", texts(card()).slice(0, 200));
      ok(cs.vars.corrige && Array.isArray(cs.vars.corrige["Garde à vue"]), "le corrigé de l'entretien n'est pas gardé");
      ok((cs.vars.corrige["Garde à vue"] || []).every((x) => x.sujet && x.fait), "corrigé mal formé", JSON.stringify(cs.vars.corrige));
      ok(!!cs.vars.voie, "le parquet n'a pas orienté l'affaire");
      // la pièce du dossier reprend l'audition jouée (A3)
      if (CR.caseDef(cs).docs.pv_audition) {
        const pvd = CR.renderDoc(s, cs, { key: "pv_audition" });
        const tx = pvd.paras.map((p) => p.map((g) => (typeof g === "string" ? g : g.t)).join(" ")).join("\n");
        const rep = cs.vars.auditionGav.filter((x) => x.sujet !== "identite" && x.a && !x.erreur);
        ok(rep.every((x) => tx.includes(x.a)), "le procès-verbal du dossier n'est pas l'audition jouée", rep.find((x) => !tx.includes(x.a)));
        ok(pvd.pstyle && pvd.pstyle.length === pvd.paras.length, "styles de paragraphe désalignés");
        const err = cs.vars.auditionGav.find((x) => x.erreur);
        if (err) ok(cs.flags.pvRectifie ? tx.includes(err.a) && !tx.includes(err.fausse) : tx.includes(err.fausse), "l'erreur de retranscription ne suit pas la relecture");
        if ((cs.vars.questionsAvocat || []).length) ok(/Question de l'avocat|L'avocat pose la question/.test(tx), "les questions de l'avocat manquent au procès-verbal");
      }
      console.log(`interface — ${CR.caseTitle(s, cs)} · conseil : ${JSON.stringify(cs.vars.conseilParole)} · résumé : ${cs.vars.conseilGav} · voie : ${cs.vars.voie} · notes : ${cs.notes.length}`);
    }
    if (errors.length) ko("erreurs de l'interface", errors.slice(0, 2).join(" | "));
  }
  for (const [k, v] of Object.entries(vus)) console.log(`  ${k} : ${v}`);
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
