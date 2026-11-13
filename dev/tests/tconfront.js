// Refonte, lot 7 : la confrontation jouée devant le juge d'instruction. node tests/tconfront.js   « échecs: 0 » attendu.
// Le témoin répond d'après ce que disent ses auditions (même heure que la seconde audition) ; il ne concède que ce qui est
// fragile, et seulement si on le lui demande bien (une question ouverte de récit ne suffit pas) ; un témoin sûr de lui,
// à qui l'on demande s'il est certain, raffermit l'accusation ; une question répétée est refusée par le juge. Dans
// l'interface : le compositeur dans le cabinet du juge, le procès-verbal tiré des questions jouées, le renfort du moyen.
const { boot, sleep, texts, findBtn, click } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { w, doc, CR, errors } = boot(); await sleep(50);
  const G = CR.GEN2, K = CR.CONF, P = CR.PAROLE;
  ok(K && CR.UI.ConfrontParole && CR.UI.Composer, "module de confrontation absent");
  const ANG = P.ANGLES.map((a) => a[0]), FOR = ["ouverte", "fermee", "relance"];
  // 1. le modèle du témoin, sur des dossiers tirés
  let n = 0; const vus = { corrige: 0, nuit: 0, reco: 0, loin: 0, certain: 0 };
  for (let i = 0; i < 300 && n < 50; i++) {
    let t; try { t = G.tirer("tcf" + i, "info", { day: 30 }); } catch (e) { continue; } if (!t) continue;
    const N = G.recit(t), W = CR.CRIMD.temoin(t, N); if (!W) continue;
    n++;
    const tag = `${t.inf} ${t.sig.slice(0, 24)}`;
    const neuf = () => K.modele({ day: 40 }, { vars: {} }, t, N, W);
    // même heure que la seconde audition
    const PZ = G.piecesCrim(t, N);
    if (PZ.docs.pv_reaudition) {
      const r = PZ.docs.pv_reaudition({ s: { day: 40 }, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {}, docs: [] }, def: {}, c: t.A, api: {} });
      const txt = JSON.stringify(r);
      const M = neuf(); const rep = K.repondre(M, { sujet: "w_heure", angle: "quand", forme: "ouverte" }).lignes.map((l) => l.t).join(" ");
      const h = (/Vers (\d+\s*h\s*\d+)/.exec(rep) || [])[1];
      ok(h && txt.includes(h), `${tag} : l'heure de la confrontation n'est pas celle de la seconde audition`, rep + " / " + txt.slice(0, 200));
    }
    // toutes les questions : textes complets, concessions conformes au témoin
    const M = neuf(); const faits = new Set(); let textesOk = true;
    for (const S0 of M.sujets) for (const a of ANG) for (const f of FOR) {
      const q = { sujet: S0.id, angle: a, forme: f };
      if (f === "relance") M.dit[S0.id] = M.dit[S0.id] || ["x"];
      const tx = P.texteQuestion(M, q); if (!tx || /undefined|NaN|\$\{/.test(tx)) textesOk = false;
      const r = K.repondre(M, q); for (const l of r.lignes) { if (/undefined|NaN|\$\{/.test(l.t)) textesOk = false; if (l.f) faits.add(l.f); }
      M.poses.push(q);
    }
    ok(textesOk, `${tag} : question ou réponse incomplète`);
    ok(faits.has("G_conf_heure") === W.corrige, `${tag} : concession sur l'heure (${W.corrige ? "corrigée" : "constante"})`, [...faits].join(","));
    ok(faits.has("G_conf_nuit") === W.nuit, `${tag} : concession sur l'éclairage`, W.lum);
    ok(faits.has("G_conf_reco") === (W.hesite || W.silhouette), `${tag} : concession sur la reconnaissance`, W.reconnait);
    ok(faits.has("G_conf_loin") === W.loin, `${tag} : concession sur la distance`, W.dist);
    ok(faits.has("G_conf_certain") === !(W.hesite || W.silhouette), `${tag} : le témoin sûr ne raffermit pas l'accusation`, W.reconnait);
    if (W.corrige) vus.corrige++; if (W.nuit) vus.nuit++; if (W.hesite || W.silhouette) vus.reco++; if (W.loin) vus.loin++; if (!(W.hesite || W.silhouette)) vus.certain++;
    // une question ouverte de récit, sujet par sujet, ne fait rien concéder
    const M2 = neuf(); const f2 = [];
    for (const S0 of M2.sujets) { const r = K.repondre(M2, { sujet: S0.id, angle: "recit", forme: "ouverte" }); M2.poses.push({ sujet: S0.id, angle: "recit", forme: "ouverte" }); f2.push(...r.lignes.map((l) => l.f).filter(Boolean)); }
    ok(!f2.length, `${tag} : une question ouverte de récit fait concéder`, f2.join(","));
    // la même question deux fois : le juge s'y oppose
    const M3 = neuf(); const q3 = { sujet: "w_vu", angle: "recit", forme: "ouverte" }; K.repondre(M3, q3); M3.poses.push(q3);
    ok(!!K.repondre(M3, q3).refus, `${tag} : une question répétée n'est pas refusée`);
    // opposer au témoin le passage où il corrige l'heure
    if (W.corrige) { const M4 = neuf(); const r = K.repondre(M4, { sujet: "w_heure", angle: "recit", forme: "confrontation", extrait: { marks: [{ ty: "f", id: "G_temoin_varie" }] } }); ok(r.lignes.some((l) => l.f === "G_conf_heure"), `${tag} : opposer la seconde audition ne fait pas concéder l'heure`); }
  }
  ok(n >= 30, "trop peu de dossiers avec témoin", n);
  ok(vus.corrige && vus.nuit && vus.reco && vus.loin && vus.certain, "un cas de témoin n'est jamais tiré", JSON.stringify(vus));

  // 2. dans l'interface : la scène, le procès-verbal, le renfort du moyen
  const s = CR.newGame({ prenom: "A", nom: "Bernard", mode: "carriere", seed: 7 }); s.settings.saisie = "libre"; s.settings.coach = false; s.settings.textSpeed = 12; CR.store.s = s;
  ok(CR.libre(s), "le mode libre n'est pas actif");
  let cs = null, t = null, W = null;
  for (let i = 0; i < 80 && !cs; i++) {
    let c; try { c = CR.GEN.open(s, "info", {}); } catch (e) { continue; }
    const p = CR.GEN.paramsOf(s, c.id); if (!p || !p.t || p.t.camp !== "defense") continue;
    const N = G.recit(p.t), w0 = CR.CRIMD.temoin(p.t, N);
    if (w0 && (w0.hesite || w0.silhouette) && (w0.nuit || w0.loin || w0.corrige)) { cs = c; t = p.t; W = w0; }
  }
  ok(cs, "pas d'information avec un témoin fragile");
  if (cs) {
    cs.status = "active";
    CR.runHook(s, cs, "_convocConfront", { jour: s.day + 3 });
    const h = cs.hearings.find((x) => x.script === "confront");
    ok(h, "la confrontation n'est pas convoquée");
    if (h) {
      s.day = h.day; s.min = h.min;
      const host = doc.createElement("div"); doc.body.appendChild(host);
      let fini = false;
      const root = w.ReactDOM.createRoot(host); root.render(w.React.createElement(CR.UI.HearingScene, { s, cs, hid: h.id, onDone: () => { fini = true; }, setScene: () => {} }));
      const attendre = async (f, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const x = f(); if (x) return x; await sleep(40); } return null; };
      // passer les répliques jusqu'au compositeur
      const compo = await attendre(() => { const sk = [...host.querySelectorAll("button")].find((b) => /^(Suite|Passer|Continuer)/.test(texts(b)) && !b.disabled && !b.closest(".conf-parole")); if (sk) sk.click(); return host.querySelector(".conf-parole .compo"); }, 30000);
      ok(compo, "le compositeur n'apparaît pas dans la confrontation", texts(host).slice(0, 300));
      const poser = async (sujet, forme, angle) => {
        const b = (re) => [...host.querySelectorAll(".conf-parole .compo-b")].find((x) => re.test(texts(x)) && !x.disabled);
        await click(w, b(new RegExp("^" + sujet))); await click(w, b(new RegExp(forme))); await click(w, b(new RegExp(angle))); await sleep(40);
        const go = findBtn(host, /^Poser la question/); if (go) await click(w, go); await sleep(60);
      };
      if (compo) {
        await poser("La reconnaissance", "Fermée", "Ce qui s'est passé");
        if (W.nuit) await poser("L'éclairage", "Fermée", "Comment");
        else if (W.loin) await poser("La distance", "Fermée", "Où");
        else await poser("L'heure", "Fermée", "Pourquoi");
        const T = texts(host);
        ok(/certaine? que c'est/.test(T) && /(Certaine?… non|silhouette)/.test(T), "la question et la réponse ne s'affichent pas", T.slice(-400));
        ok((cs.vars.confront.concessions || []).length >= 2, "les concessions ne sont pas gardées", JSON.stringify(cs.vars.confront));
        ok(cs.notes.some((x) => /^G_conf_/.test(x.fact || "")), "la concession n'entre pas dans les notes");
        await click(w, findBtn(host, /Je n'ai plus de questions/));
        const sortir = await attendre(() => { const sk = [...host.querySelectorAll("button")].find((b) => /^(Suite|Passer|Continuer)/.test(texts(b)) && !b.disabled); if (sk) sk.click(); return findBtn(host, /Sortir de la salle/); }, 20000);
        ok(sortir, "la confrontation ne se termine pas", texts(host).slice(-300));
        if (sortir) await click(w, sortir); await sleep(80);
        ok(fini, "la scène ne rend pas la main");
        const pv = (cs.docs || []).find((d) => d.key === "pv_confront" || d === "pv_confront" || d.id === "pv_confront");
        ok(pv || CR.hasDoc(cs, "pv_confront"), "le procès-verbal de confrontation n'est pas versé", JSON.stringify((cs.docs || []).slice(-3)));
        const def = CR.caseDef(cs);
        const rendu = def.docs && def.docs.pv_confront ? def.docs.pv_confront({ s, cs, def, api: CR.api(s, cs) }) : null;
        const tx = rendu ? [].concat(...rendu.paras).map((x) => (typeof x === "string" ? x : x.t)).join(" ") : "";
        ok(/Questions posées par Me/.test(tx) && /certaine? que c'est/.test(tx), "le procès-verbal ne reprend pas les questions jouées", tx.slice(0, 400));
        ok(rendu && [].concat(...rendu.paras).some((x) => x && x.f && /^G_conf_/.test(x.f)), "la concession n'est pas marquée au procès-verbal");
        const ident = (t.enjeux || []).some((en) => en.id === "identification");
        ok(!ident || (cs.vars.renfort && cs.vars.renfort.identification), "deux concessions ne renforcent pas le moyen d'identification");
      }
      root.unmount();
    }
  }
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log(`témoins : ${n} · heures corrigées ${vus.corrige} · nuit ${vus.nuit} · reconnaissances fragiles ${vus.reco} · loin ${vus.loin} · sûrs ${vus.certain}`);
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
