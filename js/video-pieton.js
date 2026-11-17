/* La Permanence — la caméra individuelle des policiers, dite caméra-piéton (1.5.0 « La preuve filmée », D-101).
   La caméra est portée sur la poitrine du fonctionnaire : elle marche avec lui, se secoue dans une lutte, part vers le
   sol quand il plaque quelqu'un. Elle enregistre l'image et le son (art. R241-2 du code de la sécurité intérieure) :
   les paroles sont des sous-titres, avec leurs passages inaudibles, et le procès-verbal de transcription les reprend.
   Ce que dit la loi et que le jeu suit (code de la sécurité intérieure, lu le 17 novembre 2026, à jour au 15 octobre) :
   - l'enregistrement n'est pas permanent : il se déclenche quand un incident se produit ou va se produire (L241-1) ;
     un déclenchement tardif laisse hors de l'image le début de l'incident (o.tardif) ;
   - le déclenchement fait l'objet d'une information des personnes filmées, sauf si les circonstances l'interdisent
     (L241-1) ; o.information === false : la phrase manque à l'enregistrement ;
   - hors procédure, l'enregistrement est effacé au bout d'un mois (L241-1, R241-4) : c'est le procès-verbal qui le dit.
   Deux scènes : le contrôle sur la voie publique (calme, outrage, rébellion) et le contrôle routier (dépistage). */
(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  const CR = (root.CR = root.CR || {});
  const V = CR.video;
  if (!V || !V.outils || !V.DECORS.rue) return;
  const { rng, pick, lerp, clamp, h2, P, tenue, PEAU, CHEV } = V.outils;
  const PT = (CR.VPIETON = {});

  // ---------------------------------------------------------------- gestes nouveaux
  Object.assign(V.GESTES, {
    // souffler dans l'éthylotest : la main porte l'appareil à la bouche
    souffle(u, t) { return P({ sR: 0.85, eR: 2.35, aR: 0.35, head: 0.05, lean: 0.04 }); },
    // présenter un papier : la main tendue, à mi-hauteur
    tend(u, t, b) { return P({ lean: 0.05, head: 0.2, sR: 0.9, eR: 0.55, aR: 0.15 }); },
    // se dégager : le buste se tord, les bras repoussent
    degage(u, t) { const s = Math.sin(t * 9); return P({ lean: -0.1 + 0.15 * s, head: -0.1, hL: 0.2 * s, kL: 0.35, hR: -0.2 * s, kR: 0.35, sL: 1.0 + 0.4 * s, eL: 0.6, aL: 0.5, sR: 1.0 - 0.4 * s, eR: 0.6, aR: 0.5 }); },
    // tenir quelqu'un : les deux mains sur l'avant-bras de l'autre
    tient(u, t, b) { return P({ lean: 0.18, head: 0.15, hL: 0.3, kL: 0.4, sL: 0.8, eL: 0.6, aL: 0.15, ikR: b.cible }); },
    // mains dans le dos, face au mur
    dos(u) { return P({ lean: 0.08, head: 0.15, sL: -0.35, eL: 1.2, aL: 0.1, sR: -0.35, eR: 1.2, aR: 0.1 }); },
  });

  const POLICE = { haut: "blouson", hautC: "marine", bas: "pantalon", basC: "anthracite", chauss: "noires", tete: "casquette", teteC: "marine", sac: null, sacC: "noir" };
  function acteur(r, id, role, o) {
    const g = o.g || (r() < 0.5 ? "f" : "m");
    const A = { id, role, g, t0: o.t0 || 0, pos: o.pos.slice(), cap: o.cap != null ? o.cap : 0, beats: [], tenue: o.tenue || (role === "policier" ? Object.assign({}, POLICE) : tenue(r, o.tenueO || {})) };
    A.peau = pick(r, PEAU); A.chev = pick(r, CHEV); A.sc = (1.62 + r() * 0.24) / 1.75; if (g === "f") A.sc = Math.min(A.sc, 0.95);
    return A;
  }

  // ---------------------------------------------------------------- la caméra portée
  // trajet : [{ t, pos: [x, z], vise: [x, z] }] ; secousses : [{ t0, t1, k }] ; sol : [{ t0, t1 }] (caméra vers le sol)
  // La caméra est à 1,35 m, légèrement plongeante ; la marche la fait osciller ; une lutte la secoue.
  function porteur(trajet, secousses, sol) {
    return function camAt(t) {
      let a = trajet[0], b = trajet[trajet.length - 1];
      for (let k = 0; k < trajet.length - 1; k++) if (t >= trajet[k].t && t <= trajet[k + 1].t) { a = trajet[k]; b = trajet[k + 1]; break; }
      const u = b.t > a.t ? clamp((t - a.t) / (b.t - a.t), 0, 1) : 0;
      const x = lerp(a.pos[0], b.pos[0], u), z = lerp(a.pos[1], b.pos[1], u);
      const vx = lerp(a.vise[0], b.vise[0], u), vz = lerp(a.vise[1], b.vise[1], u);
      const marche = Math.hypot(b.pos[0] - a.pos[0], b.pos[1] - a.pos[1]) > 0.05 && u > 0 && u < 1;
      let yaw = Math.atan2(vx - x, vz - z), pitch = 0.1, y = 1.35;
      if (marche) { y += 0.025 * Math.sin(t * 11); yaw += 0.025 * Math.sin(t * 5.5); pitch += 0.02 * Math.sin(t * 11 + 1); }
      for (const s of secousses) if (t >= s.t0 && t < s.t1) { const n = (k) => h2(Math.floor(t * 18), k) - 0.5; yaw += s.k * n(3); pitch += s.k * 0.8 * n(5); y += s.k * 0.15 * n(7); }
      for (const s of sol) if (t >= s.t0 && t < s.t1) { const w = Math.sin(Math.PI * clamp((t - s.t0) / (s.t1 - s.t0), 0, 1)); pitch += 1.0 * w; y -= 0.6 * w; }
      // un léger roulis n'existe pas dans la caméra du moteur : le désordre passe par le lacet et le tangage
      return { pos: [x, y, z], yaw, pitch, fov: 100 };
    };
  }

  // ---------------------------------------------------------------- les paroles
  // une parole : { t0, t1, qui ("agent" | "agent2" | "A"), texte, inaudible (une partie couverte : « […] ») }
  const dire = (L, t, qui, texte, d, o) => { L.push(Object.assign({ t0: t, t1: t + (d || Math.max(1.6, texte.length / 14)), qui, texte }, o || {})); };
  // le passage d'une réplique couvert par le bruit
  const couvrir = (r, s) => { const m = s.split(" "); if (m.length < 5) return s; const i = 1 + Math.floor(r() * (m.length - 3)); m.splice(i, 2, "[inaudible]"); return m.join(" "); };

  // ---------------------------------------------------------------- 1. le contrôle sur la voie publique
  // o : issue ("calme" | "outrage" | "rebellion"), propos (ce que dit l'individu : insultes de l'affaire), information
  //     (false : l'agent ne dit pas que la caméra enregistre), tardif (secondes manquées au début), personne { g },
  //     agent2 { g } (le collègue, visible), motif (raison du contrôle, dite par l'agent)
  V.FAITS.pieton_rue = {
    nom: "Contrôle filmé par la caméra-piéton", decor: "rue",
    monter(r, o) {
      const issue = o.issue || "calme";
      const zA = 7.4, xA = 3.4;
      const A = acteur(r, "A", "personne", { g: (o.personne || {}).g || "m", pos: [xA, zA], cap: Math.PI * 1.05, tenueO: { capuche: 0.4 } });
      const F2 = acteur(r, "F2", "policier", { g: (o.agent2 || {}).g || (r() < 0.3 ? "f" : "m"), pos: [-2.4, 6.4], cap: 0 });
      const tArr = 3.2, L = [], moments = [], secousses = [], sol = [];
      const info = o.information !== false;
      const motif = o.motif || "un contrôle d'identité";
      // l'agent porteur s'approche, s'arrête à un mètre ; le collègue se place sur le côté
      const trajet = [{ t: 0, pos: [-2.2, 5.6], vise: [xA, zA] }, { t: tArr, pos: [xA - 1.3, zA - 0.5], vise: [xA, zA] }];
      F2.beats = [{ a: "marche", d: tArr + 0.3, to: [xA - 0.7, zA + 0.9] }, { a: "attend", d: 3, face: -0.3 }];
      A.beats = [{ a: "attend", d: tArr - 0.4, face: Math.PI * 1.05, poches: true }];
      dire(L, 0.6, "agent", "Bonsoir. Police nationale.", 1.6);
      let t = tArr;
      if (info) { dire(L, 1.8, "agent", "Je vous informe que vous êtes filmé par ma caméra.", 2.4); }
      dire(L, t + 0.3, "agent", `On procède à ${motif}. Vous avez une pièce d'identité, s'il vous plaît ?`, 3.2);
      moments.push({ t: t + 0.4, cle: "abord", txt: `Le fonctionnaire porteur de la caméra s'adresse à «A», à un mètre environ ; «F2» se place sur le côté.` });
      t += 3.6;
      const propos = (o.propos && o.propos.length ? o.propos : ["Pourquoi moi ? J'ai rien fait.", "Vous contrôlez toujours les mêmes."]).slice(0, 3);
      if (issue === "calme") {
        A.beats.push({ a: "tend", d: 2.4, face: Math.PI * 1.05 }, { a: "attend", d: 8 });
        dire(L, t, "A", "Oui, tenez.", 1.4);
        dire(L, t + 2.6, "agent", "Merci. C'est bon pour moi, vous pouvez y aller.", 2.4);
        moments.push({ t: t + 0.4, cle: "piece", txt: "«A» tend un document au fonctionnaire. L'échange reste calme." });
        t += 6;
      } else {
        A.beats.push({ a: "menace", d: 3.2, face: Math.PI * 1.05 });
        for (let k = 0; k < propos.length; k++) dire(L, t + k * 1.3, "A", k === 1 && r() < 0.5 ? couvrir(r, propos[k]) : propos[k], 1.3, { inaudible: false });
        L.forEach((p) => { if (p.texte.includes("[inaudible]")) p.inaudible = true; });
        moments.push({ t: t + 0.5, cle: "propos", txt: "«A» élève la voix, le bras tendu vers le fonctionnaire ; les paroles sont retranscrites ci-dessous." });
        t += Math.max(3.4, propos.length * 1.3 + 0.4);
        dire(L, t, "agent", "Calmez-vous, monsieur. Restez poli.".replace("monsieur", A.g === "f" ? "madame" : "monsieur"), 2.2);
        t += 2.4;
        if (issue === "outrage") {
          dire(L, t, "agent", "Vous venez de proférer un outrage. Vous êtes interpellé.".replace("interpellé", A.g === "f" ? "interpellée" : "interpellé"), 2.6);
          A.beats.push({ a: "attend", d: 2.4 }, { a: "dos", d: 10, face: -Math.PI / 2 });
          F2.beats.push({ a: "marche", d: 1.2, to: [xA - 0.2, zA + 0.5] }, { a: "tient", d: 9, face: 0, cible: [xA, 1.0, zA] });
          moments.push({ t: t + 2.8, cle: "menottage", txt: "«A» est placé face au mur, les mains dans le dos ; «F2» lui tient les avant-bras." });
          t += 6;
        } else {
          // la rébellion : on lui saisit le bras, il se dégage, les deux agents l'amènent au sol
          dire(L, t, "agent", "Vous êtes interpellé. Donnez-moi votre bras.".replace("interpellé", A.g === "f" ? "interpellée" : "interpellé"), 2.2);
          F2.beats.push({ a: "marche", d: 1.0, to: [xA - 0.3, zA + 0.45] }, { a: "tient", d: 1.6, face: 0, cible: [xA, 1.1, zA] });
          A.beats.push({ a: "attend", d: 1.0 }, { a: "degage", d: 2.6 }, { a: "pousse", d: 0.6 });
          dire(L, t + 1.4, "A", couvrir(r, "Lâchez-moi ! Vous me faites mal, lâchez-moi !"), 1.8, { inaudible: true });
          dire(L, t + 3.0, "agent2", "Arrêtez de résister !", 1.4);
          const tL = t + 1.4;
          secousses.push({ t0: tL, t1: tL + 3.8, k: 0.5 });
          sol.push({ t0: tL + 2.6, t1: tL + 4.6 });
          A.beats.push({ a: "tombe", d: 0.8, sens: -1, fondu: 0.1 }, { a: "au_sol", d: 8, sens: -1 });
          F2.beats.push({ a: "penche", d: 8, face: 0 });
          moments.push({ t: tL + 0.6, cle: "lutte", txt: "«A» tente de se dégager de la prise de «F2» ; l'image est secouée." });
          moments.push({ t: tL + 3.6, cle: "sol", txt: "L'image part vers le sol ; on entend des cris. «A» est ensuite visible au sol, maintenu." });
          trajet.push({ t: tL, pos: [xA - 1.1, zA - 0.4], vise: [xA, zA] }, { t: tL + 3, pos: [xA - 0.6, zA - 0.2], vise: [xA, zA + 0.2] });
          t = tL + 5;
          dire(L, t, "agent", "C'est fini. Restez au sol.", 1.8);
          t += 3;
        }
      }
      trajet.push({ t: t + 6, pos: trajet[trajet.length - 1].pos, vise: trajet[trajet.length - 1].vise });
      let duree = Math.ceil(t + 3);
      const scn = { acteurs: [A, F2], objet: null, objetAt: () => null, moments, duree, tG: tArr, paroles: L, issue, information: info,
        camAt: porteur(trajet, secousses, sol), style: "pieton", fps: 15, sansSauts: true, distorsion: 0.4 };
      if (o.tardif) tronquer(scn, o.tardif);
      return scn;
    },
  };

  // ---------------------------------------------------------------- 2. le contrôle routier : dépistage
  // o : depistage ("alcool" | "stupefiants"), resultat ("positif" | "negatif"), refus (la personne refuse de souffler),
  //     information, tardif, personne { g }
  V.FAITS.pieton_routier = {
    nom: "Contrôle routier filmé par la caméra-piéton", decor: "rue",
    monter(r, o) {
      const dep = o.depistage || "alcool", res = o.resultat || "positif";
      const xC = 5.2, zC = 9.1; // le conducteur, sorti de son véhicule, au bord du trottoir
      const A = acteur(r, "A", "personne", { g: (o.personne || {}).g || "m", pos: [xC, zC], cap: Math.PI });
      const F2 = acteur(r, "F2", "policier", { g: r() < 0.3 ? "f" : "m", pos: [8.6, 9.0], cap: Math.PI });
      const L = [], moments = [], info = o.information !== false;
      const trajet = [{ t: 0, pos: [0.8, 7.6], vise: [xC, zC] }, { t: 3.0, pos: [xC - 1.4, zC - 0.6], vise: [xC, zC] }];
      dire(L, 0.5, "agent", "Bonsoir, contrôle routier. Police nationale.", 2.2);
      if (info) dire(L, 2.8, "agent", "Je vous informe que l'échange est filmé.", 2.0);
      dire(L, 5.0, "agent", "Permis de conduire et carte grise, s'il vous plaît.", 2.4);
      A.beats = [{ a: "attend", d: 5.4, face: Math.PI }, { a: "tend", d: 2.0 }];
      F2.beats = [{ a: "attend", d: 30, face: Math.PI * 0.95 }];
      moments.push({ t: 3.4, cle: "abord", txt: "Le fonctionnaire porteur de la caméra s'approche de «A», debout près d'un véhicule arrêté le long du trottoir." });
      let t = 8;
      if (dep === "alcool") {
        dire(L, t, "agent", "Vous allez souffler dans l'éthylotest, d'un seul trait, jusqu'à ce que je vous dise d'arrêter.", 3.6);
        t += 3.8;
        if (o.refus) {
          A.beats.push({ a: "menace", d: 3, face: Math.PI });
          dire(L, t, "A", "Non, je souffle pas. J'ai rien bu, c'est n'importe quoi.", 2.8);
          dire(L, t + 3, "agent", "Vous refusez le dépistage ? Je vous rappelle que le refus est un délit.", 3.2);
          moments.push({ t: t + 0.4, cle: "refus", txt: "«A» refuse de souffler dans l'appareil que lui présente le fonctionnaire." });
          t += 6.6;
        } else {
          A.beats.push({ a: "souffle", d: 4, face: Math.PI }, { a: "attend", d: 2 });
          moments.push({ t: t + 0.8, cle: "souffle", txt: "«A» souffle dans l'appareil que lui tend le fonctionnaire." });
          t += 4.4;
          dire(L, t, "agent", res === "positif" ? "Le dépistage est positif. On va procéder à une vérification à l'éthylomètre, au service." : "Le dépistage est négatif. Bonne soirée.", 3.4);
          t += 3.8;
        }
      } else {
        dire(L, t, "agent", "On va faire un dépistage salivaire. Vous allez passer cet écouvillon sur votre langue.", 3.4);
        A.beats.push({ a: "souffle", d: 3.2, face: Math.PI }, { a: "attend", d: 4 });
        moments.push({ t: t + 1.2, cle: "salive", txt: "«A» passe l'écouvillon que lui tend le fonctionnaire." });
        t += 7.6;
        dire(L, t, "agent", res === "positif" ? "Le test est positif au cannabis. Un prélèvement salivaire va être fait pour analyse." : "Le test est négatif. Vous pouvez repartir.", 3.4);
        t += 3.8;
      }
      trajet.push({ t: t + 4, pos: trajet[1].pos, vise: trajet[1].vise });
      const scn = { acteurs: [A, F2], objet: null, objetAt: () => null, moments, duree: Math.ceil(t + 3), tG: 3, paroles: L, information: info,
        camAt: porteur(trajet, [], []), style: "pieton", fps: 15, sansSauts: true, distorsion: 0.4 };
      if (o.tardif) tronquer(scn, o.tardif);
      return scn;
    },
  };

  // Déclenchement tardif : l'enregistrement commence « tard » secondes après le début de la scène. Tout est décalé ;
  // ce qui précède (dont, souvent, l'information de la personne) n'est pas enregistré.
  function tronquer(scn, tard) {
    for (const A of scn.acteurs) A.t0 = (A.t0 || 0) - tard;
    const cam0 = scn.camAt;
    scn.camAt = (t) => cam0(t + tard);
    scn.moments = scn.moments.filter((m) => m.t >= tard).map((m) => Object.assign({}, m, { t: m.t - tard }));
    scn.paroles = scn.paroles.filter((p) => p.t1 > tard).map((p) => Object.assign({}, p, { t0: Math.max(0, p.t0 - tard), t1: p.t1 - tard, coupe: p.t0 < tard }));
    scn.duree = Math.max(6, scn.duree - Math.floor(tard));
    scn.tardif = tard;
    scn.information = scn.paroles.some((p) => /vous êtes filmé|est filmé/.test(p.texte) && !p.coupe);
  }

  // ---------------------------------------------------------------- pour le procès-verbal de transcription
  PT.QUI = { agent: "Le fonctionnaire porteur de la caméra", agent2: "Le second fonctionnaire", A: "La personne contrôlée" };
  // les paroles, dans l'ordre, avec l'heure de l'horodatage
  PT.transcription = (S) => S.paroles.map((p) => ({ h: S.horodatage(p.t0), qui: PT.QUI[p.qui] || p.qui, texte: p.texte, inaudible: !!p.inaudible, coupe: !!p.coupe }));
  PT.FAITS = ["pieton_rue", "pieton_routier"];
})();
