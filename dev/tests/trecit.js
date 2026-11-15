// Refonte du gameplay, lot 3 : le récit des faits par le client (js/recit.js) et ce que l'entretien en livre (js/parole.js).
// Sur des affaires de tous les genres : un vrai récit (cadre, geste, suite) et non une phrase ; la version (G_version) une
// fois et une seule ; le mensonge sur les faits dans le récit (G_vie_ment), jamais de rétractation pendant la garde à vue ;
// lieux bien introduits ; police présente d'emblée dans un contrôle (pas d'« arrivée », pas de « pas résisté » en rébellion) ;
// un policier victime jamais invoqué comme garant ; déterminisme. Puis l'entretien de garde à vue : après le récit, l'heure,
// le lieu et le déroulé apportent des précisions au lieu de « je vous l'ai déjà dit » ; la relance fait avancer.
// node tests/trecit.js [n] ; « échecs: 0 » attendu.
const { boot, sleep } = require("./harness");
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; if (fails < 40) console.log("ÉCHEC", m); } };
(async () => {
  const env = boot(); const { CR } = env; await sleep(100);
  const G = CR.GEN2, R = CR.RECIT, P = CR.PAROLE;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const n0 = +(process.argv[2] || 300);
  const txt = (L) => L.map((x) => (typeof x === "string" ? x : x.t)).join(" ");
  let vus = 0, ments = 0, retr = 0, ctrl = 0, prec = 0;
  for (let i = 0; vus < n0 && i < n0 * 8; i++) {
    const genre = ["gav", "ci", "copj", "op", "al"][i % 5];
    let t; try { t = G.tirer("trc" + i, genre, { day: 30 }); } catch (e) { continue; }
    if (!t || t.client !== "A") continue;
    vus++;
    const N = G.recit(t);
    for (const scene of ["gav", "depot"]) {
      const L = R.complet(t, N, { scene }), T = txt(L), tag = `${genre} ${t.inf}/${t.f && t.f.sc} ${t.stance} (${scene})`;
      ok(L.length >= 3 && T.split(/\s+/).length >= 18, `${tag} : récit trop court : ${T}`);
      ok(L.filter((x) => x && x.f === "G_version").length === 1, `${tag} : version absente ou répétée`);
      ok(!/undefined|NaN|\$\{|\[object| à à | à par | à au | à dans | à chez | du matin du matin/.test(T), `${tag} : texte fautif : ${T}`);
      ok(/^C'était |\? J'étais chez moi/.test(T), `${tag} : le récit ne commence pas par le moment : ${T.slice(0, 80)}`);
      const v = t.vie || {};
      if (v.ment && R.MENT_FAITS.includes(v.ment.k)) { ok(L.some((x) => x && x.f === "G_vie_ment"), `${tag} : mensonge absent du récit`); if (scene === "gav") ments++; }
      if (v.retracte && !(v.ment && R.MENT_FAITS.includes(v.ment.k))) { ok((scene === "gav") === !L.some((x) => x && x.recit === "retracte"), `${tag} : rétractation ${scene === "gav" ? "pendant la garde à vue" : "absente après"}`); if (scene === "depot") retr++; }
      ok(JSON.stringify(R.complet(t, N, { scene })) === JSON.stringify(L), `${tag} : non déterministe`);
      const E = R.episodes(t, N, { scene });
      if (["rebellion", "violences_pdap", "alcool", "outrage"].includes(t.inf) && t.flagrance) { ok(!/sont arrivés|est arrivée/.test(txt(E.police)) && !/pas résisté/.test(t.inf === "rebellion" || t.inf === "violences_pdap" ? txt(E.police) : ""), `${tag} : la police « arrive » dans un contrôle : ${txt(E.police)}`); ctrl++; }
      if (t.V && (t.V.agent || /pdap|rebellion|outrage/.test(t.inf))) ok(!/pourra le dire/.test(txt(E.confirme)), `${tag} : le policier victime invoqué comme garant`);
    }
    // l'entretien de garde à vue : récit, puis précisions
    if (genre === "gav" && CR.SIM.supporte(t)) {
      const M = P.client(s, null, { parole: { t, N }, entretien: { topics: [{ id: "g_faits", q: "Racontez-moi.", a: [{ t: N.version[t.stance], f: "G_version" }] }] }, mode: "gav" });
      const dire = (angle, forme) => P.repondre(M, { sujet: "faits", angle, forme }).lignes.map((l) => l.t).join(" ");
      const r1 = dire("recit", "ouverte");
      ok(r1.split(/\s+/).length >= 12, `${t.inf} : récit d'entretien trop court : ${r1}`);
      for (const a of ["quand", "ou", "comment"]) { const x = dire(a, "ouverte"); ok(!/déjà dit|tout dit/.test(x), `${t.inf} : « ${a} » après le récit ne précise rien : ${x}`); }
      ok(!/déjà dit|tout dit/.test(dire("recit", "relance")), `${t.inf} : la relance n'apporte rien`);
      prec++;
    }
  }
  // le récit tiré de la simulation : l'arrachage (fuite, objet retrouvé, délai d'interpellation) et les violences détaillées
  let nArr = 0, nViol = 0, nPre = 0;
  for (let i = 0; i < 6000 && (nArr < 15 || nViol < 15 || nPre < 15); i++) {
    const genre = i % 2 ? "ci" : "gav";
    let t; try { t = G.tirer("trs" + i, genre, { day: 30, inf: i % 3 === 0 ? "vol" : i % 3 === 1 ? "violences" : undefined }); } catch (e) { continue; }
    if (!t || !CR.SIM.supporte(t) || (t.vie && (t.vie.ment || t.vie.retracte))) continue;
    const N = G.recit(t), PZ = G.pieces(t, N), Sx = R.simDe(t, N), E = R.episodes(t, N, { scene: "gav" }), T = txt([].concat(...Object.values(E)));
    const tag = `${genre} ${t.inf}/${t.f.sc} ${t.stance}`;
    ok(!/undefined|NaN|\$\{|\[object/.test(T), `${tag} : texte fautif : ${T}`);
    ok(E.geste.filter((x) => x && x.f === "G_version").length === 1, `${tag} : version absente ou répétée`);
    if (Sx.SV && nViol < 15) {
      nViol++;
      const D = Sx.SV.dires.A;
      ok(txt(E.geste).includes(D.coups.texte) && txt(E.pourquoi).includes(D.mobile.texte), `${tag} : le récit ne reprend pas ce que la simulation fait dire au client`);
      ok(!/\d+ mètres/.test(T), `${tag} : le client compte les mètres`);
    } else if (Sx.S && Sx.S.arrachage && nArr < 15) {
      nArr++;
      const S = Sx.S, fu = { trottinette: /trottinette/, scooter: /scooter/, pied: /en courant/ }[S.fuite];
      if (t.stance !== "nie") ok(fu.test(txt(E.geste)), `${tag} : fuite « ${S.fuite} » absente du récit : ${txt(E.geste)}`);
      ok(S.objet.retrouve ? /poche|sur moi/.test(txt(E.police)) : /rien trouvé/.test(txt(E.police)), `${tag} : objet ${S.objet.retrouve ? "retrouvé" : "non retrouvé"} mal raconté : ${txt(E.police)}`);
      if (S.tenueA) ok(txt(E.comment).includes(CR.video.vetu(S.tenueA, t.A.g)), `${tag} : tenue absente du déroulé`);
      ok(/après/.test(txt(E.quand)) && !/quelques minutes après. Dix minutes/.test(txt(E.quand)), `${tag} : délai d'interpellation non tiré de la simulation`);
    } else if (Sx.S && Sx.S.prelim && nPre < 15) {
      nPre++;
      ok(Sx.S.venue === "domicile" ? /sonné chez moi/.test(txt(E.police)) : /appelé/.test(txt(E.police)), `${tag} : venue au commissariat mal racontée : ${txt(E.police)}`);
      ok(!/\d{4}/.test(txt(E.police).replace(/\d+ (heures?|h)/g, "")), `${tag} : le client dit l'année : ${txt(E.police)}`);
    }
  }
  console.log(`simulation : ${nArr} arrachages, ${nViol} violences détaillées, ${nPre} gardes à vue après enquête`);
  ok(nArr >= 10 && nViol >= 10 && nPre >= 10, "récits tirés de la simulation non rencontrés");
  console.log(`affaires : ${vus} ; mensonges sur les faits : ${ments} ; rétractations après la garde à vue : ${retr} ; contrôles : ${ctrl} ; entretiens de garde à vue joués : ${prec}`);
  ok(ments > 0 && retr > 0 && ctrl > 0 && prec > 20, "cas attendus non rencontrés");
  ok(!env.errors.length, "erreurs jsdom : " + env.errors.join(" | "));
  console.log("échecs:", fails);
  process.exit(fails ? 1 : 0);
})();
