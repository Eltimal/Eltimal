// Refonte du gameplay, lot 1 : simulation de l'affaire et moteur de documents (sim.js, docs.js, trames-flagrance.js).
// Sur toutes les affaires avec garde à vue (garde à vue en cours et comparution immédiate), en flagrance (dont l'arrachage) ou
// au bout d'une enquête préliminaire (plainte, actes d'enquête, interpellation au domicile ou présentation sur convocation) : toutes les pièces se lisent, chacune
// sous 2 000 mots, dans leur trame ; cotes dans l'ordre des actes ; mêmes faits, irrégularités et anomalies que les
// anciennes pièces ; chronologie de la garde à vue cohérente ; tenue, objet et témoin cohérents d'une pièce à l'autre ;
// déterminisme. node tests/tsim.js [n] ; « échecs: 0 » attendu.
const { boot, sleep } = require("./harness");
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; if (fails < 40 || process.env.VOIR) console.log("ÉCHEC", m); } };
(async () => {
  const env = boot(); const { CR } = env; await sleep(100);
  const G = CR.GEN2, SIM = CR.SIM, DOCS = CR.DOCS;
  const N0 = +(process.argv[2] || 60);
  const segsDe = (r) => [].concat(...(r.paras || []), r.sigs || []).filter((x) => x && typeof x === "object");
  const marques = (r) => { const m = new Set(); for (const g of segsDe(r)) { if (g.f) m.add("f:" + g.f); if (g.flag) m.add("flag:" + g.flag); if (g.paire) m.add("paire:" + g.paire); } return m; };
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const rendre = (PZ, k, t) => PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} });
  let vus = { ci: 0, gav: 0 }, mots = [], pieces = 0, nArr = 0, nNum = 0, nPap = 0, nSchema = 0, nPil = 0, nPre = 0, nDom = 0; const familles = {};
  for (let i = 0; i < 6000 && (vus.ci < N0 || vus.gav < N0 / 2); i++) for (const genre of ["ci", "gav"]) {
    if (vus[genre] >= (genre === "ci" ? N0 : N0 / 2)) continue;
    const t = G.tirer("tsim" + i, genre, { day: i % 2 ? 30 : 12, inf: i % 3 === 0 ? "vol" : i % 3 === 1 ? "violences" : undefined });
    if (!t || !SIM.supporte(t)) continue;
    vus[genre]++; familles[t.inf] = (familles[t.inf] || 0) + 1;
    // les anciennes pièces (simulation coupée), puis les nouvelles
    const sup = SIM.supporte; SIM.supporte = () => false;
    const t0 = JSON.parse(JSON.stringify(t)); const old = G.pieces(t0, G.recit(t0)); SIM.supporte = sup;
    const N = G.recit(t), PZ = G.pieces(t, N);
    const tag = `${genre} ${t.sig.slice(0, 60)}`;
    ok(JSON.stringify(Object.keys(old.anomalies).sort()) === JSON.stringify(Object.keys(PZ.anomalies).sort()), `${tag} : anomalies différentes`);
    for (const id of Object.keys(PZ.anomalies)) ok(PZ.docs[PZ.anomalies[id].piece], `${tag} : pièce de l'anomalie ${id} absente`);
    ok(JSON.stringify(Object.keys(old.facts).filter((k) => !PZ.facts[k])) === "[]", `${tag} : faits du bloc-notes perdus`);
    let total = 0; const fOld = new Set(), fNew = new Set();
    for (const k of Object.keys(PZ.docs)) {
      let r; try { r = rendre(PZ, k, t); } catch (e) { ok(false, `${tag}/${k} : ${e.message}`); continue; }
      pieces++;
      const txt = JSON.stringify(r);
      ok(!/undefined|NaN|\$\{|\[object/.test(txt), `${tag}/${k} : texte incomplet`);
      for (const m of marques(r)) if (m.startsWith("f:")) fNew.add(m);
      const w = DOCS.mots(r); total += w;
      ok(w <= 2000, `${tag}/${k} : ${w} mots`);
      if (old.docs[k]) {
        let ro; try { ro = rendre(old, k, t0); } catch (e) { ro = null; }
        if (ro) { const a = marques(ro), b = marques(r); for (const m of a) { if (m.startsWith("f:")) fOld.add(m); else ok(b.has(m), `${tag}/${k} : ${m} perdu`); } }
      }
      if (["pv_interpellation", "pv_notification", "pv_victime", "pv_audition", "pv_temoin", "pv_fin_gav", "pv_synthese"].includes(k)) ok(r.bandeau && r.bandeau.grille && r.pstyle && r.pstyle.length === r.paras.length, `${tag}/${k} : pas de trame de procès-verbal`);
      // support du dossier : numérique (signature électronique unique) ou papier (signature par feuillet)
      if (r.bandeau) { const num = SIM.numerique(t, CR.MONDE.lieuxDe(t).TJ); ok(r.numerique === num && (r.sigs || []).every((g) => (num ? g.t !== "signé" : true)), `${tag}/${k} : support du dossier`); if (num) nNum++; else nPap++; }
      // lecteur en feuillets (ui-dossier.js) : même nombre de feuillets, rien de perdu ; schéma des lésions au certificat
      if (CR.UI.lecteurDe) { const L = CR.UI.lecteurDe(r, { cote: r.cote }); ok(L.feuillets.length === (r.feuillets || 1) && L.blocs.length > 0, `${tag}/${k} : lecteur ${L.feuillets.length} feuillets pour ${r.feuillets}`); }
      if (k === "certificat" && r.schema) { const tx = DOCS.texte(r).toLowerCase(); ok(r.schema.length > 0 && r.schema.every((l) => tx.includes(l.toLowerCase())), `${tag} : schéma corporel sans les lésions du certificat`); nSchema++; }
      // déterminisme
      ok(JSON.stringify(rendre(PZ, k, t)) === txt, `${tag}/${k} : non déterministe`);
    }
    for (const m of fOld) ok(fNew.has(m), `${tag} : fait ${m} perdu du dossier`);
    mots.push(total);
    // cotes : uniques, consécutives
    // cotes : D1… sans trou ; une sous-cote (D4/1) suit sa cote ; le bordereau n'en a pas
    const cs = [...new Set(Object.values(PZ.cotes).filter(Boolean).map((c) => +String(c).replace(/^D(\d+).*/, "$1")))].sort((a, b) => a - b);
    ok(cs.every((c, i) => c === i + 1), `${tag} : cotes ${cs.join(",")}`);
    ok(Object.keys(PZ.cotes).every((k) => !PZ.cotes[k] || PZ.titres[k].endsWith(`(${PZ.cotes[k]})`)), `${tag} : titre sans sa cote`);
    if (SIM.violencesOK && SIM.violencesOK(t)) nPil++;
    // chronologie
    const SS = SIM.simuler(t, { N, C: PZ.C, VID: null, SF: CR.MONDE.lieuxDe(t).F, TJ: CR.MONDE.lieuxDe(t).TJ, opjN: "Brigadier-chef X Y", has: (x) => t.preuves.includes(x), irr: (x) => t.irr.includes(x), dou: (x) => t.doutes.includes(x), A: t.A, V: t.V, T: t.T, q: t.q });
    const E = SS.E, C = PZ.C;
    if (SS.prelim) {
      // enquête préliminaire : plainte aux heures du service, après les faits ; actes d'enquête entre la plainte et la garde à vue
      nPre++; if (SS.venue === "domicile") nDom++;
      const hP = ((E.plainte % 1440) + 1440) % 1440;
      ok(E.plainte >= SS.T0 + 45 && E.plainte <= E.debut - 600 && hP >= 9 * 60 && hP <= 21 * 60, `${tag} : plainte à ${E.plainte} (faits ${SS.T0}, garde à vue ${E.debut})`);
      for (let i = 0; i < 4; i++) ok(E.enquete(i) > E.plainte && E.enquete(i) < E.debut, `${tag} : acte d'enquête ${i} hors de l'enquête`);
      ok(E.debut >= E.interp && E.interp - SS.base === C.interp, `${tag} : la mesure commence avant l'interpellation`);
      ok(SS.venue === "convocation" || ((E.interp % 1440) >= 6 * 60), `${tag} : interpellation au domicile avant 6 heures`);
      for (const k of Object.keys(PZ.docs)) { const r = rendre(PZ, k, t); if (r.bandeau) ok(r.bandeau.cadre === "ENQUÊTE PRÉLIMINAIRE", `${tag}/${k} : cadre ${r.bandeau.cadre}`); }
      ok(/plainte/i.test(PZ.titres.pv_victime || "plainte"), `${tag} : la victime n'est pas reçue en plainte`);
      if (PZ.docs.pv_saisie) ok(/assentiment/.test(DOCS.texte(rendre(PZ, "pv_saisie", t))), `${tag} : perquisition sans assentiment`);
      // l'ordre des cotes suit les jours : la plainte d'abord
      if (PZ.cotes.pv_victime) ok(+PZ.cotes.pv_victime.slice(1) < +PZ.cotes.pv_notification.slice(1), `${tag} : la plainte après la garde à vue`);
    } else {
      ok(E.interp >= SS.T0 + 5 && E.interp <= SS.T0 + 45, `${tag} : interpellation ${E.interp - SS.T0} min après les faits`);
      ok(E.surPlace > E.requis && E.surPlace < E.interp, `${tag} : arrivée de la patrouille`);
      ok(C.debut >= E.interp, `${tag} : la mesure commence avant l'interpellation`);
    }
    ok(!SS.famille.demande || SS.famille.h - E.notif <= 180, `${tag} : avis à la famille après trois heures`);
    if (genre === "ci") {
      ok(E.aud > E.avisAv && E.fin > E.audFin && E.synthese > E.fin, `${tag} : ordre audition, fin, synthèse`);
      ok(!!PZ.docs.pv_prolongation === (E.fin > E.debut + 1440 || t.irr.includes("prolongation")), `${tag} : prolongation`);
      for (const k of ["pv_audition", "pv_fin_gav", "pv_synthese", "bordereau"]) ok(PZ.docs[k], `${tag} : ${k} absent`);
    } else for (const k of ["pv_audition", "pv_fin_gav", "pv_synthese"]) ok(!PZ.docs[k], `${tag} : ${k} dans une garde à vue en cours`);
    if (!SS.arrachage) {
      // les heures des constatations suivent la chronologie ; la saisie n'est pas découverte deux fois
      const interpG = DOCS.texte(rendre(PZ, "pv_interpellation", t));
      ok(!interpG.includes("undefined"), `${tag} : interpellation`);
      if (PZ.docs.pv_saisie && SS.stups && SS.constatDecouvre) ok(!(DOCS.texte(rendre(PZ, "pv_saisie", t)).includes(t.f && N.saisie ? "Découvrons " + N.saisie : "§")), `${tag} : saisie découverte deux fois`);
      if (PZ.docs.pv_saisie) { const h = ((E.perq % 1440) + 1440) % 1440; ok(t.irr.includes("perq_nuit") === (h < 6 * 60), `${tag} : perquisition à ${h} min`); }
      continue;
    }
    nArr++;
    // cohérence entre pièces
    const interp = DOCS.texte(rendre(PZ, "pv_interpellation", t));
    if (SS.objet.retrouve) ok(PZ.docs.pv_scelle && /découv/.test(interp), `${tag} : objet retrouvé sans scellé`);
    else ok(!PZ.docs.pv_scelle && /n'est découvert/.test(interp), `${tag} : objet non retrouvé mal rapporté`);
    if (t.T && !t.preuves.includes("temoin") && !t.irr.includes("controle_identite")) ok(/sans laisser son identité/.test(interp), `${tag} : témoin parti non mentionné`);
    if (SS.tenueA && !t.irr.includes("interprete") && !interp.includes(CR.video.vetu(SS.tenueA, t.A.g))) { ok(false, `${tag} : tenue absente de l'interpellation`); if (process.env.VOIR) console.log(interp); }
    const vict = DOCS.texte(rendre(PZ, "pv_victime", t));
    ok(!/ITT/.test(vict.split("\n").slice(0, 25).join(" ")) || t.quoi === "itt", `${tag} : la victime cite l'ITT avant l'examen`);
    if (SS.fuite !== "pied") ok(!/parti en courant|en courant vers/.test(DOCS.texte(rendre(PZ, PZ.docs.pv_temoin ? "pv_temoin" : "pv_victime", t))), `${tag} : fuite à pied racontée pour une fuite ${SS.fuite}`);
  }
  // le lecteur en feuillets, en partie : onglet Pièces d'un dossier de violences, « Lire en feuillets », tourner, refermer
  {
    const { w, doc } = env, { click, findBtn, texts } = require("./harness"), P = require("./play");
    const s2 = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 5 }); s2.settings.coach = false; CR.store.s = s2;
    let tv = null; for (let i = 0; i < 4000 && !tv; i++) { const x = G.tirer("tlec" + i, "ci", { day: s2.day, inf: "violences" }); if (x && SIM.violencesOK && SIM.violencesOK(x) && x.preuves.includes("video")) tv = x; }
    ok(!!tv, "aucune affaire de violences pour le lecteur");
    if (tv) {
      const p = { gen: 2, id: "g_ci_99", kind: "ci", day: s2.day, niveau: CR.contenu(s2), t: tv, inf: tv.inf }; G.prepare(p); s2.generated = s2.generated || []; s2.generated.push(p);
      const def = G.def(p); def.id = p.id; CR.CASES[p.id] = def; const cs = CR.openCase(s2, p.id); cs.status = "active";
      for (const k of Object.keys(def.docs)) CR.fileDoc(s2, cs, { key: k, title: (def.docTitles || {})[k] || k });
      CR.store.bump(); await sleep(120);
      await P.openCase(w, doc, tv.A.nom); await sleep(60);
      await click(w, findBtn(doc, /^Pièces/)); await sleep(60);
      const lire = findBtn(doc, /Lire en feuillets/); ok(!!lire, "bouton « Lire en feuillets » absent");
      if (lire) {
        const min0 = s2.min, jour0 = s2.day;
        await click(w, lire); await sleep(120);
        ok(doc.querySelectorAll(".dr-page").length >= 1 && doc.querySelectorAll(".dr-piece").length >= 12, "le lecteur ne s'ouvre pas sur le dossier");
        ok(/D1/.test(texts(doc.querySelector(".dr-rail"))), "le rail des cotes ne montre pas D1");
        const etat = () => (doc.querySelector(".dr-page") || { getAttribute: () => "" }).getAttribute("aria-label");
        const e0 = etat(); w.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowRight" })); await sleep(60); ok(etat() !== e0, "la flèche ne tourne pas le feuillet");
        const e1 = etat(); w.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowDown" })); await sleep(60); ok(etat() !== e1, "la flèche ne change pas de pièce");
        ok(!doc.querySelector(".dr [class*=seg-], .dr mark"), "un passage est signalé dans le lecteur");
        await click(w, findBtn(doc, /^Refermer le dossier/)); await sleep(60);
        ok(!doc.querySelector(".dr"), "le lecteur ne se referme pas");
        ok(s2.day > jour0 || s2.min > min0, "le temps de lecture n'est pas compté");
      }
    }
  }
  mots.sort((a, b) => a - b);
  console.log(`affaires : ${vus.ci} comparutions immédiates, ${vus.gav} gardes à vue (dont ${nArr} arrachages) ; ${pieces} pièces ; dossier médian ${mots[mots.length >> 1]} mots (min ${mots[0]}, max ${mots[mots.length - 1]})`);
  console.log(`violences au dossier détaillé du pilote : ${nPil} ; enquêtes préliminaires : ${nPre} (dont ${nDom} interpellations au domicile)`);
  ok(nPre > 0 && nDom > 0 && nDom < nPre, "enquêtes préliminaires : interpellation au domicile et présentation sur convocation attendues");
  console.log(`procès-verbaux : ${nNum} en procédure numérique, ${nPap} sur papier ; ${nSchema} certificats avec schéma corporel`);
  ok(nNum > 0 && nPap > 0, "un seul support de dossier rencontré");
  console.log("délits :", Object.entries(familles).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", "));
  ok(mots[mots.length >> 1] > 2000, "dossier trop court");
  ok(!env.errors.length, "erreurs jsdom : " + env.errors.join(" | "));
  console.log("échecs:", fails);
  process.exit(fails ? 1 : 0);
})();
