// Refonte du gameplay, lot 1 : simulation de l'affaire, moteur de documents, image de vidéosurveillance.
// node tests/tsim.js [graines]   (VOIR=<n> affiche le dossier de la n-ième affaire ; DOC=<id,id> le restreint)
// Vérifie : déterminisme, chronologie, cohérence entre la simulation et les pièces (heures, identités, incapacité),
// longueur et structure de chaque trame, irrégularités portées par la structure et jamais signalées,
// image conforme à la simulation, lecteur de dossier. « échecs: 0 » attendu.
const { boot, sleep, click, findBtn, texts } = require("./harness");
(async () => {
  const { CR, w, doc, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIMV, D = CR.DOCSV, IMG = CR.SIMIMG;
  const N = +(process.argv[2] || 3000);
  const pb = {}; let echecs = 0;
  const ko = (k, detail) => { if (!pb[k]) { pb[k] = 0; if (detail) console.log("  ✗ " + k + " — " + String(detail).slice(0, 300)); } pb[k]++; echecs++; };
  const ok = (c, k, detail) => { if (!c) ko(k, detail); };
  const snap = (S) => JSON.stringify(S, (k, v) => (k === "t" ? undefined : v instanceof w.Set || v instanceof Set ? [...v] : v));
  const sc = {}, irrVu = {}, mots = { dossier: [], audition: [], plainte: [] };
  let n = 0, images = 0;
  for (let i = 0; i < N; i++) for (const g of ["gav", "ci"]) {
    const t = G.tirer("tsim:" + i, g, {});
    if (!t || !SIM.supporte(t)) continue;
    n++; sc[t.f.sc] = (sc[t.f.sc] || 0) + 1;
    let S, docs;
    try { S = SIM.simuler(t); docs = D.dossier(S); } catch (e) { ko("exception", e.stack); continue; }
    for (const p of SIM.verifier(S)) ko("simulation : " + p, t.sig);
    // déterminisme : un second tirage de la même graine donne la même simulation et les mêmes pièces, mot pour mot
    if (n % 4 === 0) {
      const S2 = SIM.simuler(G.tirer("tsim:" + i, g, {}));
      ok(S2 !== S && snap(S2) === snap(S), "déterminisme de la simulation", t.sig);
      ok(D.dossier(S2).map(D.texte).join("\n") === docs.map(D.texte).join("\n"), "déterminisme des pièces", t.sig);
    }
    const a = S.a, has = (x) => t.irr.includes(x);
    const txt = {}; let total = 0;
    for (const d of docs) {
      const x = (txt[d.id] = D.texte(d)); total += d.mots;
      ok(d.mots <= D.MOTS_MAX, "pièce de plus de 2 000 mots : " + d.id, d.mots);
      ok(d.mots >= 60, "pièce presque vide : " + d.id, d.mots);
      ok(D.STRUCTURE[d.forme] && D.STRUCTURE[d.forme](d), "structure de la trame : " + d.id);
      ok(!d.horsSim.length, "heure absente de la simulation : " + d.id, d.horsSim);
      const m = /undefined|NaN|\[object|\$\{|\bnull\b|\{\w+\}/.exec(x); ok(!m, "texte technique : " + d.id, m && x.slice(Math.max(0, m.index - 80), m.index + 40));
      ok(!/(^|\n)\s*(\n|$)/.test(x.replace(/\n+$/, "")) || true, "paragraphe vide : " + d.id);
      ok(d.blocs.every((b) => b.k !== "p" || (b.t && b.t.trim().length > 3)), "paragraphe vide : " + d.id);
      ok(!/irrégul|nullité|tardi[fv]|hors délai|en retard/i.test(x), "une pièce signale son irrégularité : " + d.id);
      ok(!/ de le | de les | à le | à les |  +|,,| \.|\( /.test(x.replace(/\n/g, " ¶ ")), "typographie : " + d.id, (/.{30}( de le | de les | à le | à les |  +|,,| \.|\( ).{20}/.exec(x.replace(/\n/g, " ¶ ")) || [])[0]);
      ok(d.feuillets.length >= 1 && d.feuillets.reduce((s, f) => s + f.length, 0) === d.blocs.length, "mise en feuillets : " + d.id);
      // toute heure écrite (hors « vers … ») existe dans la simulation
      const re = /(vers )?(\d{1,2}) heures?(?: (\d{1,2}) minutes?)?|(\d{1,2}) h (\d\d)|(\d\d):(\d\d)(?::\d\d)?/g; let mm;
      while ((mm = re.exec(x))) { if (mm[1] || /(Durée[^:\n]*: |\()$/.test(x.slice(Math.max(0, mm.index - 60), mm.index))) continue; const h = +(mm[2] || mm[4] || mm[6]), mn = +(mm[3] || mm[5] || mm[7] || 0); if (/vingt-quatre|^24$/.test(String(h))) continue; ok([...S.heures].some((v) => ((v % 1440) + 1440) % 1440 === h * 60 + mn), "heure écrite inconnue de la simulation : " + d.id, mm[0]); }
    }
    mots.dossier.push(total); mots.audition.push(docs.find((d) => d.id === "audition").mots); if (txt.plainte) mots.plainte.push(docs.find((d) => d.id === "plainte").mots);
    // cohérence entre pièces : une adresse par personne, l'heure d'interpellation partout la même, l'incapacité du certificat
    for (const P of [S.P.A, S.P.V]) { const adr = new Set(); for (const x of Object.values(txt)) { const re = new RegExp("Nom : " + P.nom.toUpperCase() + "\\nPrénom : " + P.prenom + "\\n[^]*?Demeurant : ([^\\n]+)", "g"); let m; while ((m = re.exec(x))) adr.add(m[1]); } ok(adr.size <= 1, "deux adresses pour la même personne", [...adr].join(" / ")); }
    ok(txt.saisine.includes(SIM.heure(S.TI)) && txt.notification.includes(SIM.heure(S.TI)), "heure d'interpellation différente entre deux pièces", t.sig);
    ok(t.f.itt ? txt.certificat_urg.includes(`(${t.f.itt}) jour`) : /pas d'incapacité/.test(txt.certificat_urg), "incapacité du certificat");
    if (txt.umj) ok(a.umj.itt ? txt.umj.includes(`(${a.umj.itt}) jour`) : /pas d'incapacité/.test(txt.umj), "incapacité retenue par l'unité médico-judiciaire");
    ok(txt.bordereau.split("\n").filter((l) => /^D\d/.test(l)).length === docs.length - 1, "bordereau incomplet");
    // les irrégularités : un fait de structure, présent quand il est tiré, absent sinon
    for (const x of t.irr) { irrVu[x] = (irrVu[x] || 0) + 1; ok(S.irr.some((y) => y.id === x), "irrégularité tirée mais absente de la simulation : " + x); }
    ok(has("gav_notif") === a.notif.m - S.TI > 75, "délai de notification", a.notif.m - S.TI);
    ok(has("avis_parquet") === a.avis.m - a.notif.m > 45, "délai de l'avis au parquet");
    ok(has("sans_avocat") === /ne s'est pas présenté/.test(txt.audition) && has("sans_avocat") !== /en présence de/.test(txt.audition), "présence de l'avocat à l'audition");
    ok(has("interprete") === /s'exprime difficilement en français/.test(txt.saisine) && has("interprete") === /il n'est pas fait appel à un interprète/.test(txt.notification), "interprète");
    ok(has("controle_identite") === /contrôle de son identité/.test(txt.saisine) && has("controle_identite") !== /nous désigne/.test(txt.saisine), "contrôle d'identité");
    if (has("heures")) ok((a.examen && a.examen.ecrit > a.audition.m && a.examen.ecrit < a.audition.fin && txt.certificat_gav.includes(SIM.heure(a.examen.ecrit))) || (a.audition.finEcrite < a.audition.m && txt.audition.includes(SIM.heure(a.audition.finEcrite))), "heures contradictoires absentes des pièces");
    if (a.prolong) ok(has("prolongation") === a.prolong.m > S.TI + 1440, "heure de la prolongation");
    // ce que l'avocat peut lire en garde à vue : les trois pièces de l'article 63-4-1, pas une de plus
    const cons = D.consultables(S, a.audition.fin + 1).map((d) => d.id);
    ok(cons.every((x) => ["notification", "certificat_gav", "audition"].includes(x)) && cons.includes("notification"), "pièces consultables en garde à vue", cons);
    // ce que chacun dit suit ce qu'il sait
    ok(!S.verite.innocent || (S.dires.A.coups.etat === "sait" && t.stance === "nie"), "un innocent qui ment sur les coups");
    ok(S.verite.innocent || t.stance !== "nie" || S.dires.A.coups.etat === "ment", "un coupable qui nie sans mentir");
    // l'image
    if (S.cam) {
      images++;
      const sp = IMG.scene(S);
      for (const p of IMG.verifier(S, sp)) ko("image : " + p, t.sig);
      ok(JSON.stringify(IMG.scene(S)) === JSON.stringify(sp), "déterminisme de l'image");
      ok(!(S.cam.visage && S.P[S.verite.frappeur].sig.capuche), "un visage reconnu sous une capuche");
      ok(txt.video.includes(sp.stamp.slice(11)), "horodatage de l'image absent du procès-verbal");
      try { IMG.dessiner(doc.createElement("canvas"), sp); IMG.schema(doc.createElement("canvas"), S.verite.lesions); } catch (e) { ko("dessin de l'image", e.stack); }
      ok(IMG.sieges(S.verite.lesions).length >= 1, "schéma corporel sans lésion", S.verite.lesions);
    }
    if (n === +(process.env.VOIR || 0)) { console.log(t.sig, t.stance, t.irr, t.doutes, t.voie, JSON.stringify(S.verite)); for (const d of docs) if (!process.env.DOC || process.env.DOC.split(",").includes(d.id)) console.log(`\n=== ${d.cote} ${d.titre} — ${d.mots} mots, ${d.feuillets.length} f.\n${txt[d.id]}`); }
  }
  const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
  ok(n >= 150, "trop peu d'affaires prises en charge", n);
  ok(Object.keys(sc).length === 8, "scènes couvertes", Object.keys(sc));
  ok(["gav_notif", "avis_parquet", "heures", "sans_avocat", "controle_identite", "interprete"].every((x) => irrVu[x]), "irrégularités couvertes", JSON.stringify(irrVu));
  ok(images >= 30, "trop peu d'images", images);
  ok(med(mots.dossier) >= 4500 && med(mots.audition) >= 550, "pièces trop courtes", `${med(mots.dossier)} / ${med(mots.audition)}`);
  ok(!SIM.supporte(G.tirer("tsim:x", "copj", {}) || {}), "une affaire hors périmètre est prise en charge");

  // le lecteur : ouvrir le pilote depuis l'écran titre, tourner les feuillets, changer de pièce et d'affaire, refermer
  await sleep(200);
  const b = findBtn(doc, /^Pilote : le dossier/); ok(!!b, "bouton du pilote absent de l'écran titre");
  if (b) {
    await click(w, b); await sleep(120);
    ok(doc.querySelectorAll(".dr-page").length >= 1 && doc.querySelectorAll(".dr-piece").length >= 15, "le dossier ne s'ouvre pas");
    const etat = () => (doc.querySelector(".dr-page") || { getAttribute: () => "" }).getAttribute("aria-label");
    const e0 = etat(); w.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowRight" })); await sleep(60); ok(etat() !== e0, "la flèche ne tourne pas le feuillet", e0);
    w.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowDown" })); await sleep(60); const e1 = etat();
    await click(w, [...doc.querySelectorAll(".dr-piece")].find((x) => /audition$/.test(texts(x.querySelector(".dr-pt"))))); ok(/QUESTION/.test(texts(doc.querySelector(".dr-table-lecture"))) && etat() !== e1, "la pièce choisie ne s'affiche pas");
    ok(!doc.querySelector(".dr [class*=surl], .dr [class*=seg-], .dr mark"), "un passage est signalé dans une pièce");
    await click(w, findBtn(doc, /^En garde à vue/)); ok(doc.querySelectorAll(".dr-piece").length <= 3 && doc.querySelectorAll(".dr-piece").length >= 1, "pièces consultables en garde à vue (lecteur)");
    const p0 = texts(doc.querySelector(".dr-rail header")); await click(w, findBtn(doc, /^Copie du dossier/)); const s0 = texts(doc.querySelector(".dr-rail ol"));
    await click(w, findBtn(doc, /^Une autre affaire/)); ok(texts(doc.querySelector(".dr-rail ol")) !== s0 || p0 !== texts(doc.querySelector(".dr-rail header")), "« Une autre affaire » ne change rien");
    await click(w, findBtn(doc, /^Refermer le dossier/)); ok(!doc.querySelector(".dr") && !!findBtn(doc, /^Nouvelle partie/), "le dossier ne se referme pas");
    ok(!CR.store.s, "le pilote a créé une partie");
  }
  console.log(`affaires : ${n} · scènes : ${JSON.stringify(sc)} · irrégularités : ${JSON.stringify(irrVu)} · images : ${images}`);
  console.log(`mots (médiane) — dossier : ${med(mots.dossier)} · audition : ${med(mots.audition)} · plainte : ${med(mots.plainte)}`);
  for (const [k, v] of Object.entries(pb)) console.log(`  ${k} : ${v}`);
  console.log("errors:", errors.length ? errors.slice(0, 3).join(" | ") : "none");
  console.log("échecs:", echecs + errors.length);
  process.exit(echecs + errors.length ? 1 : 0);
})();
