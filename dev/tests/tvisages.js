// 1.3.0 « Les visages et les noms » — la banque de visages 2 et l'atelier.
// 1. Chaque option de chaque menu de l'atelier se voit dans le portrait rendu (pixels différents du visage de départ).
// 2. Ce que la taille permet se voit aussi en scène : petite silhouette des décors (coupe, couleur, peau, barbe, lunettes et
//    leur couleur, tenue de ville) et avocat vu de dos dans les plans (mêmes pièces, robe ou ville).
// 3. Une banque bien plus grande : sur 10 000 inconnus, au moins quatre fois plus de visages distincts qu'avec la banque
//    d'avant (forme, yeux, sourcils, nez, bouche) ; moins de 1 % de paires identiques dans une même affaire.
// 4. Les dix expressions tiennent sur les pièces nouvelles ; les menus offrent au moins le double de pièces d'avant.
// 5. L'atelier : composé à la création, il donne son visage à la carrière ; il se rouvre depuis le menu de la partie.
// Le rendu d'avant au pixel près (anciennes sauvegardes) est vérifié par tanciens.js.
const { boot, sleep, findBtn, click, texts } = require("./harness");
const outil = require("./visages-outil");
(async () => {
  let echecs = 0; const vus = new Map();
  const ok = (c, k, d) => { if (c) return; echecs++; const n = (vus.get(k) || 0) + 1; vus.set(k, n); if (n <= 4) console.log("  ✗ " + k + (d !== undefined ? " — " + String(typeof d === "string" ? d : JSON.stringify(d)).slice(0, 300) : "")); };
  const { w, CR, doc, errors } = boot(); await sleep(250);
  const PX = CR.px, V = outil.brancher(w), B = PX.BANQUE;

  // ---------- 1. chaque option se voit dans le portrait
  // le visage de départ porte ce dont certaines pièces ont besoin pour se voir (une monture pour sa couleur, des boucles
  // pour leur métal, la tenue de ville pour sa couleur, des oreilles dégagées)
  const base0 = PX.lookFrom2("atelier-test", { g: "f", age: 36 });
  let p0 = Object.assign({}, base0.p, { cut: "crew", hat: "none", glasses: "rect", ear: "hoops", earM: "or", beard: "none", traits: [], lipstick: "", lipf: 0, lines: 0, mood: "neutral", gap: 7, eyes: "open", brow: "normal", nose: "straight", lash: 0, wear: "shirtc", hc: "brown" });
  for (const c of ["necklace", "pearls", "choker", "pendant", "scarf"]) delete p0[c];
  const look0 = PX.lookDePieces({ g: "f", age: 36, outfit: "shirt" }, p0);
  const rendu = (L) => ["neutral", "smile"].map((e) => V.rendre(CR, L, e)).join("/");
  const ref = rendu(look0);
  let options = 0;
  for (const k of Object.keys(B)) for (const [v] of B[k]) {
    const cur = PX.pieceDe(p0, k);
    if (k !== "traits" && String(cur) === String(v)) continue;
    const L = PX.lookDePieces(look0, PX.poserPiece(p0, k, k === "traits" ? [v] : v));
    options++;
    ok(rendu(L) !== ref, "une option ne change pas le portrait", `${k} = ${v}`);
  }
  ok(options > 300, "trop peu d'options essayées", options);
  // l'âge choisi se voit (rides, cheveux qui grisonnent sur les tempes)
  ok(rendu(Object.assign({}, look0, { age: 70 })) !== ref, "vieillir ne change rien au portrait");

  // ---------- 2. en scène : la petite silhouette des décors et l'avocat de dos
  const trace = () => { const log = []; const rec = new Proxy({}, { get: (t, k) => (k === "log" ? log : (...a) => { log.push(k + ":" + a.map((x) => (typeof x === "object" ? JSON.stringify(x) : x)).join(",")); }), set: (t, k, v) => { log.push(k + "=" + v); return true; } }); return rec; };
  const silhouette = (L) => { const d = trace(); CR.dec.fig(d, 40, 80, { look: L }); return d.log.join("|"); };
  const dos = (L) => { const m = trace(); CR.planKit.back(m, 84, 105, { look: L, D: 12 }); return m.log.join("|"); };
  const VISIBLES = { cut: ["bald", "long", "afro", "bun", "hijab", "braids", "ponytail", "bob"], hc: ["black", "rose", "platine", "cuivre"], peau: [0, 7, 13, 18], glasses: ["none", "sun"], gcol: ["#d8282e", "#1f8a94"], beard: ["full", "goatee"], shirt: ["#7a2f2f", "#e8e4da"] };
  for (const [k, vs] of Object.entries(VISIBLES)) for (const v of vs) {
    if (String(PX.pieceDe(p0, k)) === String(v)) continue;
    const L = PX.lookDePieces(look0, PX.poserPiece(p0, k, v));
    ok(silhouette(L) !== silhouette(look0), "un choix ne se voit pas sur la silhouette de scène", `${k} = ${v}`);
    // vue de dos, les lunettes ne se voient que par leurs branches : présence et couleur, pas la forme ni le verre
    if (!(k === "glasses" && v !== "none")) ok(dos(L) !== dos(look0), "un choix ne se voit pas sur l'avocat vu de dos", `${k} = ${v}`);
  }
  ok(dos(Object.assign({}, look0, { outfit: "robe" })) !== dos(look0), "la robe et la tenue de ville se confondent de dos");
  // la tenue selon le lieu : robe à l'audience, ville au cabinet et en garde à vue ; un visage d'avant garde sa robe
  { const s = { player: { look: look0, nom: "Durand" } }; ok(CR.youLook(s).outfit === "robe" && CR.youLook(s, "ville").outfit === "shirt", "la tenue ne suit pas le lieu");
    const s1 = { player: { look: PX.lookFrom("joueur7", { outfit: "robe", age: 28 }), nom: "Durand" } }; ok(CR.youLook(s1, "ville").outfit === "robe", "un visage d'avant la 1.3.0 change de tenue"); }

  // ---------- 3. une banque plus grande
  const sig = (S) => [S.face, S.eyes, S.brow, S.nose, S.mw, S.lips].join();
  const anciens = new Set(), nouveaux = new Set();
  for (let i = 0; i < 10000; i++) { const age = 18 + (i * 7) % 62, g = i % 2 ? "m" : "f"; anciens.add(sig(PX.faceSpec(PX.lookFrom("mesure" + i, { age, g })))); nouveaux.add(sig(PX.faceSpec(PX.lookFrom("mesure" + i, { age, g, b: 2 })))); }
  ok(nouveaux.size >= 4 * anciens.size, "pas quatre fois plus de visages distincts", { avant: anciens.size, apres: nouveaux.size });
  console.log(`  visages distincts sur 10 000 inconnus (forme, yeux, sourcils, nez, bouche) : ${anciens.size} → ${nouveaux.size} (× ${(nouveaux.size / anciens.size).toFixed(1)})`);
  // les menus : au moins le double de pièces dans chaque menu qui existait
  const AVANT = { face: 5, cut: 23, hc: 9, eyes: 4, eye: 6, nose: 5, brow: 5, beard: 4, glasses: 7, gcol: 6, ear: 4, traits: 20, peau: 6 };
  for (const [k, n] of Object.entries(AVANT)) ok(B[k].filter(([v]) => v !== "none").length >= 2 * n, "menu pas doublé", `${k} : ${B[k].length} pour ${n} avant`);
  // dans une même affaire (version 5) : des visages qu'on distingue
  { const s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 41 }); s.pending = [];
    let paires = 0, egales = 0;
    const full = (L) => JSON.stringify(PX.faceSpec(L), ["face", "eyes", "eye", "brow", "nose", "mw", "lips", "cut", "hc", "skinC", "beard", "glasses", "traits", "weight", "build"]);
    for (let i = 0; i < 160; i++) { const genre = ["gav", "copj", "info", "pc", "al", "ci"][i % 6]; let p; try { p = CR.GEN2.params(s, genre, {}); } catch (e) { continue; }
      const ps = ["A", "V", "P", "T", "T2", "C2", "R"].map((k) => p.t[k]).filter((x) => x && x.prenom);
      for (const P of ps) ok(P.look && P.look.b === 2, "une personne d'une affaire nouvelle n'a pas la banque 2", P.prenom + " " + P.nom);
      const Ls = ps.map((P) => full(PX.clientLook(P)));
      for (let a = 0; a < Ls.length; a++) for (let b = a + 1; b < Ls.length; b++) { paires++; if (Ls[a] === Ls[b]) egales++; } }
    ok(paires > 300 && egales / paires < 0.01, "trop de paires de visages identiques dans une affaire", { paires, egales }); }

  // ---------- 4. les dix expressions sur les pièces nouvelles
  const EX = ["neutral", "talk", "talk2", "smile", "worried", "angry", "cry", "soulage", "defi", "honte"];
  for (let i = 0; i < 120; i++) {
    const L = PX.lookFrom("expr" + i, { age: 18 + (i * 11) % 60, b: 2 });
    let n0 = null;
    try { n0 = V.rendre(CR, L, "neutral"); } catch (e) { ok(false, "un visage de la banque 2 ne se dessine pas", e.message); continue; }
    for (const e of EX.slice(1)) { let x = null; try { x = V.rendre(CR, L, e); } catch (er) { ok(false, "une expression plante", e + " : " + er.message); continue; } ok(x && x !== n0, "une expression ne change pas le visage", `${e} (visage ${i}, coupe ${L.p.cut})`); }
  }

  // ---------- 5. l'atelier : création de carrière, puis retouche depuis le menu
  { await click(w, findBtn(doc, /^Nouvelle partie$/));
    ok(!!findBtn(doc, /Composer le visage/), "pas de bouton « Composer le visage » à la création");
    await click(w, findBtn(doc, /Composer le visage/)); await sleep(80);
    const at = doc.querySelector(".atelier");
    ok(!!at, "l'atelier ne s'ouvre pas");
    const onglets = [...doc.querySelectorAll(".atelier [role=tab]")].map((b) => texts(b));
    ok(onglets.length === PX.ATELIER.length, "les onglets de l'atelier", onglets);
    // choisir une coupe, puis des lunettes
    await click(w, [...doc.querySelectorAll(".atelier [role=tab]")].find((b) => /Cheveux/.test(texts(b)))); await sleep(40);
    const crete = [...doc.querySelectorAll(".atelier .at-opt")].find((b) => texts(b) === "crête");
    ok(!!crete, "la coupe « crête » n'est pas proposée"); if (crete) await click(w, crete);
    await click(w, [...doc.querySelectorAll(".atelier [role=tab]")].find((b) => /Lunettes/.test(texts(b)))); await sleep(40);
    const avi = [...doc.querySelectorAll(".atelier .at-opt")].find((b) => texts(b) === "aviateur"); if (avi) await click(w, avi);
    ok(!!doc.querySelector('.atelier .at-opt.on[aria-pressed="true"]'), "l'option choisie n'est pas marquée");
    await click(w, findBtn(doc, /Garder ce visage/)); await sleep(60);
    ok(!doc.querySelector(".atelier"), "l'atelier ne se ferme pas");
    const btn = findBtn(doc, /Carrière — à votre compte/); ok(!!btn, "pas de bouton de carrière"); if (btn) await click(w, btn); await sleep(150);
    const s = CR.store.s;
    ok(s && s.player.look && s.player.look.b === 2 && s.player.look.p.cut === "mohawk" && s.player.look.p.glasses === "aviator" && s.player.look.outfit === "robe", "la carrière n'a pas le visage composé", s && s.player.look && s.player.look.p);
    // retouche depuis le menu : la partie ne bouge pas, le visage change
    if (s) { const avant = JSON.stringify(Object.assign({}, s, { player: null, toasts: [] }));
      const hud = doc.querySelector(".hud-menu"); ok(!!hud, "pas de menu en jeu"); if (hud) await click(w, hud); await sleep(80);
      const ret = findBtn(doc, /Retoucher votre visage/); ok(!!ret, "pas de « Retoucher votre visage » dans le menu"); if (ret) await click(w, ret); await sleep(80);
      ok(!!doc.querySelector(".atelier"), "l'atelier ne se rouvre pas depuis le menu");
      await click(w, [...doc.querySelectorAll(".atelier [role=tab]")].find((b) => /Barbe/.test(texts(b)))); await sleep(30);
      const bouc = [...doc.querySelectorAll(".atelier .at-opt")].find((b) => texts(b) === "bouc"); if (bouc) await click(w, bouc);
      await click(w, findBtn(doc, /Garder ce visage/)); await sleep(60);
      ok(s.player.look.p.beard === "goatee" && s.player.look.p.cut === "mohawk", "la retouche n'est pas gardée", s.player.look.p);
      ok(JSON.stringify(Object.assign({}, s, { player: null, toasts: [] })) === avant, "la retouche du visage a touché la partie"); }
  }

  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ").slice(0, 600)); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
