// Refonte, lot 7 : l'interrogatoire au fond joué (questions de l'avocat à son client, art. 120). node tests/tinterro.js
// « échecs: 0 » attendu. Chaque enjeu a sa version du client ; elle n'appuie le moyen que si le dossier la confirme, et
// seulement à l'angle qui le fait s'expliquer, en question ouverte ; contredite, le juge le relève et elle pèse contre
// lui ; qui nie n'explique pas un geste ; un client non préparé cherche ses mots (il faut le relancer). Dans l'interface :
// le compositeur, puis le procès-verbal d'interrogatoire qui reprend les questions jouées.
const { boot, sleep, texts, findBtn, click } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { w, doc, CR, errors } = boot(); await sleep(50);
  const G = CR.GEN2, K = CR.CONF, P = CR.PAROLE;
  ok(Object.keys(CR.CAT.ENJEUX).every((id) => K.ENJ[id]), "un enjeu du catalogue n'a pas de version du client", Object.keys(CR.CAT.ENJEUX).filter((id) => !K.ENJ[id]).join(","));
  // 1. le modèle, sur des dossiers tirés
  let n = 0, appuis = 0, contredits = 0, nies = 0;
  for (let i = 0; i < 300 && n < 60; i++) {
    let t; try { t = G.tirer("tin" + i, "info", { day: 30 }); } catch (e) { continue; } if (!t || t.camp !== "defense" || !t.enjeux || !t.enjeux.length) continue;
    n++;
    const N = G.recit(t), tag = `${t.inf} ${t.stance}`;
    const enjeux = t.enjeux.map((id) => Object.assign({}, CR.CAT.enjeu(id, t.A, t.V), { id, fort: (t.f.forts || []).includes(id) }));
    const M = K.modeleClient({ day: 50 }, { vars: {} }, t, N, enjeux, { prep: true, detenu: false });
    for (const S0 of M.sujets) for (const [a] of P.ANGLES) for (const f of ["ouverte", "fermee"]) { const tx = P.texteQuestion(M, { sujet: S0.id, angle: a, forme: f }); ok(tx && !/undefined|\{|\$/.test(tx), `${tag} : question incomplète`, tx); }
    for (const x of M.ens) {
      const { en, E } = x, suj = "e_" + en.id;
      const M1 = K.modeleClient({ day: 50 }, { vars: {} }, t, N, enjeux, { prep: true });
      const r = K.repondreClient(M1, { sujet: suj, angle: E.angle, forme: "ouverte" });
      const txt = r.lignes.map((l) => l.t).join(" ");
      ok(!/undefined|\{e\}|\$\{/.test(txt), `${tag}/${en.id} : réponse incomplète`, txt);
      const fait = r.lignes.some((l) => l.f === "C_" + en.id);
      if (t.stance === "nie" && E.geste) { nies++; ok(!fait && !(r.juge || []).length, `${tag}/${en.id} : qui nie explique le geste`, txt); continue; }
      ok(fait === !!en.fort, `${tag}/${en.id} : l'appui ne suit pas le dossier (${en.fort ? "fort" : "faible"})`, txt);
      ok(!!(r.juge && r.juge.length) === !en.fort && M1.contredit === (en.fort ? 0 : 1), `${tag}/${en.id} : la contradiction n'est pas relevée`, JSON.stringify(r.juge));
      if (fait) appuis++; else contredits++;
      // question fermée : aucun appui ; mauvais angle : aucun appui
      const M2 = K.modeleClient({ day: 50 }, { vars: {} }, t, N, enjeux, { prep: true });
      ok(!K.repondreClient(M2, { sujet: suj, angle: E.angle, forme: "fermee" }).lignes.some((l) => l.f), `${tag}/${en.id} : une question fermée fait s'expliquer`);
      const autre = P.ANGLES.map((y) => y[0]).find((y) => y !== E.angle && y !== "recit");
      ok(!K.repondreClient(M2, { sujet: suj, angle: autre, forme: "ouverte" }).lignes.some((l) => l.f), `${tag}/${en.id} : un mauvais angle fait s'expliquer`);
      // client non préparé : il faut le relancer
      if (en.fort) {
        const M3 = K.modeleClient({ day: 50 }, { vars: {} }, t, N, enjeux, { prep: false });
        const r1 = K.repondreClient(M3, { sujet: suj, angle: E.angle, forme: "ouverte" }); M3.poses.push({ sujet: suj, angle: E.angle, forme: "ouverte" });
        ok(!r1.lignes.some((l) => l.f), `${tag}/${en.id} : le client non préparé s'explique d'emblée`);
        const r2 = K.repondreClient(M3, { sujet: suj, angle: E.angle, forme: "relance" });
        ok(r2.lignes.some((l) => l.f === "C_" + en.id), `${tag}/${en.id} : la relance ne fait pas s'expliquer le client non préparé`, JSON.stringify(r2));
      }
    }
  }
  ok(n >= 40, "trop peu d'informations tirées", n);
  ok(appuis && contredits && nies, "un cas n'est jamais rencontré", JSON.stringify({ appuis, contredits, nies }));

  // 2. dans l'interface
  const s = CR.newGame({ prenom: "A", nom: "Bernard", mode: "carriere", seed: 9 }); s.settings.saisie = "libre"; s.settings.coach = false; s.settings.textSpeed = 12; CR.store.s = s;
  let cs = null, t = null, en0 = null;
  for (let i = 0; i < 80 && !cs; i++) {
    let c; try { c = CR.GEN.open(s, "info", {}); } catch (e) { continue; }
    const p = CR.GEN.paramsOf(s, c.id); if (!p || !p.t || p.t.camp !== "defense" || p.t.stance === "nie") continue;
    const f = (p.t.enjeux || []).find((id) => (p.t.f.forts || []).includes(id) && K.ENJ[id]);
    if (f) { cs = c; t = p.t; en0 = f; }
  }
  ok(cs, "pas d'information avec un enjeu fort");
  if (cs) {
    cs.status = "active"; cs.flags.prepInterro = s.day;
    CR.runHook(s, cs, "_convocInterro", { i: 0, jour: s.day + 2 });
    const h = cs.hearings.find((x) => x.script === "interro");
    ok(h, "l'interrogatoire n'est pas convoqué");
    if (h) {
      s.day = h.day; s.min = h.min;
      const host = doc.createElement("div"); doc.body.appendChild(host);
      let fini = false;
      const root = w.ReactDOM.createRoot(host); root.render(w.React.createElement(CR.UI.HearingScene, { s, cs, hid: h.id, onDone: () => { fini = true; }, setScene: () => {} }));
      const attendre = async (f, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const x = f(); if (x) return x; await sleep(40); } return null; };
      const compo = await attendre(() => host.querySelector(".conf-parole .compo"));
      ok(compo, "le compositeur n'apparaît pas à l'interrogatoire", texts(host).slice(-300));
      if (compo) {
        const E = K.ENJ[en0], lab = E.label.replace(/\{e\}/g, t.A.g === "f" ? "e" : "");
        const ang = P.ANGLES.find((a) => a[0] === E.angle)[1];
        const b = (re) => [...host.querySelectorAll(".conf-parole .compo-b")].find((x) => re.test(texts(x)) && !x.disabled);
        const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        await click(w, b(new RegExp("^" + esc(lab)))); await click(w, b(/Ouverte/)); await click(w, b(new RegExp(esc(ang)))); await sleep(40);
        await click(w, findBtn(host, /^Poser la question/)); await sleep(80);
        ok(cs.notes.some((x) => x.fact === "C_" + en0), "l'explication du client n'entre pas dans les notes", texts(host).slice(-300));
        await click(w, findBtn(host, /Je n'ai plus de questions/));
        const sortir = await attendre(() => findBtn(host, /Sortir de la salle/));
        if (sortir) await click(w, sortir); await sleep(80);
        ok(fini, "la scène ne rend pas la main");
        const def = CR.caseDef(cs);
        const rendu = def.docs.pv_interro({ s, cs, def, api: CR.api(s, cs) });
        const tx = [].concat(...rendu.paras).map((x) => (typeof x === "string" ? x : x.t)).join(" ");
        ok(CR.hasDoc(cs, "pv_interro") && /art\. 120/.test(tx) && tx.includes(K.ENJ[en0].fort.slice(0, 30).replace(/\{e\}/g, t.A.g === "f" ? "e" : "")), "le procès-verbal ne reprend pas les questions jouées", tx.slice(-400));
      }
      root.unmount();
    }
  }
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log(`informations : ${n} · appuis ${appuis} · contredits ${contredits} · gestes niés ${nies}`);
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
