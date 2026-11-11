// Mémoire des magistrats et des confrères : ce qu'ils retiennent après une audience, ce qu'ils en disent à la suivante.
const { sleep, texts, findBtn, click } = require("./harness");
const P = require("./play"); const U = require("./util");
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log("ÉCHEC", m); } };
(async () => {
  const env = await U.career("a02_sac", 7); const { w, doc, CR, s, errors } = env; const MEM = CR.MEM;
  s.pending = s.pending.filter((e) => e.type !== "lead"); CR.GEN2.DIR.off = true;
  const ouvrir = () => { const c = CR.GEN.open(s, "copj", { min: s.min }); c.status = "open"; const h = CR.scheduleHearing(s, c, { script: "tc", title: "Tribunal correctionnel", where: "palais", day: s.day + 1, min: 13 * 60 + 30 }); return [c, h]; };
  const [c1, h1] = ouvrir();
  const pr = c1.actors.president, pq = c1.actors.parquet;
  ok(MEM.presents(c1, h1).juge === pr && MEM.presents(c1, h1).parquet === pq, "au tribunal : le président et le parquet du dossier");
  ok(MEM.presents({ actors: { ji: "ji_x", president: "pr_x", parquet: "pq_x" } }, { title: "Interrogatoire de première comparution" }).juge === "ji_x", "chez le juge d'instruction : le juge d'instruction, sans le parquet");
  ok(MEM.presents({ actors: { jld: "jld_x", president: "pr_x" } }, { title: "Débat sur la prolongation de la détention" }).juge === "jld_x", "devant le juge des libertés");
  ok(MEM.ouverture(s, c1, h1).length === 0, "première rencontre : rien");
  MEM.apresAudience(s, c1, h1, { cred: -6, plaidoirie: { ordre: "inverse", ton: "offensif", hors: 1, bons: 0, replique: "maintien" }, interjects: { miss: 2 }, flags: { jpDepassee: true }, limine: [] });
  ok(s.memo[pr].n === 1 && s.memo[pr].estime <= -6 && s.memo[pr].faits.length >= 4, "le président retient une mauvaise audience : " + s.memo[pr].estime);
  ok(s.memo[pq].estime <= -2, "le parquet aussi : " + s.memo[pq].estime);
  ok(MEM.humeur(s.memo[pr])[0] === "Hostile", "humeur : hostile");
  const [c2, h2] = ouvrir(); c2.actors.president = pr; c2.actors.parquet = pq;
  const o = MEM.ouverture(s, c2, h2);
  ok(o.some((x) => x.who === "president" && /La dernière fois, /.test(x.t)) && o.some((x) => x.fx && x.fx.cred <= -2), "audience suivante : il le rappelle, crédit de départ négatif");
  ok(o.some((x) => x.who === "sys" && /ne vous salue pas/.test(x.t)), "le procureur ne salue pas");
  // dans l'interface : la phrase est dite à l'ouverture
  while (s.day < h2.day) CR.endDay(s); CR.store.bump(); await sleep(30);
  CR.UI._setScene({ type: "court", caseId: c2.id, hid: h2.id }); await sleep(400);
  let dit = false;
  for (let i = 0; i < 700; i++) {
    await sleep(25); const sc = doc.querySelector(".court-scene"); if (!sc) break;
    dit = dit || /La dernière fois, /.test(texts(sc.querySelector(".transcript") || sc));
    const pl = sc.querySelector(".plaidoirie");
    if (pl) { const ch = pl.querySelector(".chip"); if (ch) await click(w, ch); for (const x of [...pl.querySelectorAll(".arg")].slice(0, 2)) if (!x.disabled) await click(w, x); await click(w, findBtn(doc, "Plaider")); continue; }
    const rp = sc.querySelector(".replique"); if (rp) { await click(w, rp.querySelector(".choice")); continue; }
    const lim = sc.querySelector(".limine"); if (lim) { await click(w, [...lim.querySelectorAll("button.btn")].pop()); continue; }
    const hand = sc.querySelector(".hand"); if (hand) { await click(w, findBtn(doc, "Laisser passer", hand)); continue; }
    const del = sc.querySelector(".delibere"); if (del) { await click(w, findBtn(doc, "Continuer", del)); continue; }
    if (sc.querySelector(".court-done")) { await click(w, findBtn(doc, "Sortir de la salle")); break; }
    const cc = sc.querySelector(".court-choices"); if (cc) { const b = cc.querySelector("button.choice") || [...cc.querySelectorAll("button.btn")].pop(); if (b) await click(w, b); }
  }
  ok(dit, "à l'audience, le président le dit");
  ok(s.memo[pr].n === 2, "la deuxième audience est comptée : " + s.memo[pr].n);
  // une bonne audience remonte l'estime ; une absence la fait chuter
  const e0 = s.memo[pr].estime; MEM.apresAudience(s, c2, h2, { cred: 8, plaidoirie: { ordre: "ok", ton: "sobre", bons: 3, hors: 0 }, interjects: { miss: 0 }, flags: {}, limine: ["x"] });
  ok(s.memo[pr].estime === Math.min(10, e0 + 3), "une bonne audience : +3");
  const [c3, h3] = ouvrir(); const j3 = c3.actors.president; const av = (s.memo[j3] || { estime: 0 }).estime;
  CR.EV.courtCheck(s, { caseId: c3.id, data: { hid: h3.id } });
  ok(h3.missed && s.memo[j3].estime === Math.max(-10, av - 3) && /pas venu/.test(s.memo[j3].faits[0].r), "audience manquée : retenue");
  // confrère adverse : un choix à la barre se retient
  MEM.noter(s, "av_castagnet", -1, "vous vous êtes emporté à la barre"); MEM.de(s, "av_castagnet").n = 1; MEM.de(s, "av_castagnet").dernier = s.day;
  ok(CR.acteur("av_castagnet") && MEM.lire(s, "av_castagnet").faits[0].d === -1, "le confrère d'en face retient");
  // l'onglet Réputation
  CR.store.bump(); await sleep(60); await click(w, P.rail(doc, "Cabinet")); await click(w, [...doc.querySelectorAll(".tab")].find((x) => /Réputation/.test(texts(x)))); await sleep(40);
  ok(doc.querySelectorAll(".memo-list li").length >= 3 && /Retient que/.test(texts(doc.querySelector(".memo-list"))), "« Ceux qui vous connaissent » : " + doc.querySelectorAll(".memo-list li").length);
  const s2 = JSON.parse(JSON.stringify(s)); ok(s2.memo[pr].n === s.memo[pr].n, "la mémoire survit à la sauvegarde");
  const t = CR.newGame({ prenom: "A", nom: "B", mode: "tutoriel", seed: 1 }); MEM.noter(t, pr, -3, "x"); ok(!t.memo, "rien n'est retenu pendant le tutoriel");
  console.log("président :", CR.acteur(pr).nom, JSON.stringify(s.memo[pr].faits.map((f) => f.r).slice(0, 3)));
  console.log("échecs:", fails); console.log("errors:", errors.length ? errors.slice(0, 4).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
