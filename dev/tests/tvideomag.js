// Refonte, lot 1 bis : la vidéosurveillance du vol en magasin, jouée par le moteur (js/video.js, faits « magasin »).
// node tests/tvideomag.js   « échecs: 0 » attendu. L'extrait est au dossier quand le magasin a des images ; il montre autant
// de prises que d'articles pris (l'agent peut se tromper, l'image non) ou seulement les caisses et la sortie ; l'heure du
// portique à l'image est celle de la rétention ; faits du dossier ; rendu déterministe et non vide.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 400) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const rend = (PZ, k, t) => PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} });
  const txt = (r) => [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" ");
  const vus = { rayon: 0, sortie: 0, ecart: 0, caisse: 0 };
  let rendu = 0;
  for (let i = 0; i < 9000 && (vus.rayon < 8 || vus.sortie < 3 || vus.ecart < 2); i++) {
    const genre = ["ci", "gav", "copj"][i % 3];
    let t; try { t = G.tirer("tvm" + i, genre, { day: 12 + (i % 9), inf: "vol" }); } catch (e) { continue; }
    if (!t || !SIM.supporte(t) || !t.f || t.f.sc !== "magasin" || !t.flagrance) continue;
    const PZ = G.pieces(t, G.recit(t));
    if (!PZ.docs.pv_agent) continue;
    const A = txt(rend(PZ, "pv_agent", t));
    const video = /extrait la séquence/.test(A);
    const tag = `${genre} ${t.sig.slice(0, 36)}`;
    ok(video === !!PZ.docs.pv_video, `${tag} : images annoncées par l'agent sans exploitation, ou l'inverse`);
    if (!video || !PZ.docs.pv_video) continue;
    const D = rend(PZ, "pv_video", t), T = txt(D);
    ok(D.video && D.video.faits === "magasin", `${tag} : l'exploitation ne porte pas l'extrait du magasin`, JSON.stringify(D.video));
    if (!D.video) continue;
    const X = CR.video.extrait(D.video);
    const prises = X.moments.filter((m) => /^prise/.test(m.cle)).length;
    const etat = txt(rend(PZ, "etat_marchandise", t)), qE = +((/: (\d+) × /.exec(etat) || [])[1] || 0);
    const sortie = /ne couvre que les caisses/.test(A);
    if (sortie) {
      vus.sortie++;
      ok(prises === 0 && /n'est pas filmé/.test(T) && PZ.facts.G_video_rayon && !D.video.vueRayon, `${tag} : la caméra de sortie montre le rayon, ou le dossier ne le dit pas`, `${prises} prises`);
    } else {
      vus.rayon++;
      ok(prises === qE && PZ.facts.G_video_prise, `${tag} : ${prises} prises à l'image pour ${qE} articles à l'état du magasin`);
      if (PZ.facts.G_agent_compte) { vus.ecart++; ok(PZ.facts.G_video_compte && /nous n'en distinguons pas davantage/.test(T), `${tag} : l'image ne dément pas l'agent`); }
    }
    if (D.video.caisse) vus.caisse++;
    // l'heure du portique à l'image : la minute de la rétention, ou celle d'avant
    const hP = (X.moments.find((m) => m.cle === "portique") || {}).h || "";
    const mP = /(\d\d):(\d\d):\d\d$/.exec(hP), hA = /rattrapée? juste après, à (\d+)[\s  ]h[\s  ](\d+)/.exec(A);
    if (mP && hA) { const a = +mP[1] * 60 + +mP[2], b = +hA[1] * 60 + +hA[2]; ok(b - a >= 0 && b - a <= 2, `${tag} : portique à ${hP} à l'image, rétention à ${hA[1]} h ${hA[2]}`); }
    else ok(false, `${tag} : heures illisibles`, hP + " / " + (hA && hA[0]));
    ok(!/undefined|NaN|\$\{/.test(T), `${tag} : exploitation incomplète`, T.slice(0, 300));
    // rendu : une image non vide, identique d'un rendu à l'autre
    if (rendu < 3) {
      rendu++;
      const i0 = X.render(X.duree / 2), i1 = CR.video.extrait(D.video).render(X.duree / 2);
      let diff = 0, min = 255, max = 0; for (let k = 0; k < i0.length; k += 4) { if (i0[k] !== i1[k]) diff++; min = Math.min(min, i0[k]); max = Math.max(max, i0[k]); }
      ok(diff === 0 && max - min > 80, `${tag} : rendu non déterministe ou vide`, `${diff} écarts, contraste ${max - min}`);
    }
  }
  ok(vus.rayon >= 5 && vus.sortie >= 2 && vus.ecart >= 1, "trop peu d'extraits", JSON.stringify(vus));
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("vidéos du magasin :", JSON.stringify(vus));
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
