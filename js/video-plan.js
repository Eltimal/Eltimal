/* La Permanence — la preuve filmée dans les affaires (1.5.0, D-101).
   CR.VPLAN.planifier(t), au tirage d'une affaire de la version 6 du générateur : les vidéos que l'affaire porte (la
   vidéoprotection de la rue, la caméra-piéton des policiers), ce qu'elles montrent et leurs failles. Une graine propre :
   le reste du tirage ne change pas. Quand l'image montre les faits, la preuve « video » entre dans l'affaire (elle pèse
   au jugement, et une nullité peut l'écarter).
   GEN2.pieces, enveloppé : la pièce jouable (procès-verbal d'exploitation ou de transcription) prend la cote suivante,
   ou remplace le procès-verbal vidéo seulement écrit quand l'affaire en avait un. Les affaires des versions 4 et 5 ne
   passent pas ici.
   Les failles, et ce que le jeu en fait (code de la sécurité intérieure et code de procédure pénale) :
   - images effacées : hors enquête, la vidéoprotection n'est conservée qu'un mois au plus (L252-5) ; une réquisition
     tardive trouve un enregistrement détruit. Un fait à relever, pas une nullité ;
   - réquisition sans autorisation du procureur en enquête préliminaire (art. 77-1-1 CPP) : l'irrégularité
     « requisition » déjà connue du jeu ; si l'affaire la porte, la nullité écarte aussi la vidéo ;
   - caméra-piéton déclenchée tard (L241-1 : l'enregistrement n'est pas permanent) : le début manque ; un fait à plaider ;
   - personne non informée qu'elle est filmée (L241-1 : « sauf si les circonstances l'interdisent ») : un fait à plaider
     sur la loyauté de la preuve. Le jeu n'en fait pas une nullité automatique : la jurisprudence n'a pas été lue. */
(function () {
  const CR = window.CR, GEN2 = CR.GEN2, CAT = CR.CAT, DOCS = CR.DOCS;
  if (!GEN2 || !GEN2.pieces || !CR.video || !CR.VRUE || !CR.VPIETON) return;
  const VP = (CR.VPLAN = {});
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const ctxDe = (t) => (t.f && (t.f.sc || t.f.ctx)) || "";
  const agg = (t, k) => !!(t.f && (t.f.agg || []).includes(k));

  // ---------------------------------------------------------------- quelle vidéo pour quelle affaire
  const COUPS = { violences: ["rue", "file", "bar", "embuscade", "voisinage", "sport", "circulation", "happy_slapping"], violences_conj: ["rue"] };
  const MENACES = { menaces: ["rue", "voisin", "intimidation", "dette"], extorsion: ["racket"] };
  const DEGRAD = { degradations: { voiture: "voiture", vitrine: "vitrine", tag: "tag", porte: "vitrine", scooter: "voiture" }, vol: { vehicule: "voiture" } };
  const DEAL = { stups_trafic: ["point_deal", "guetteur", "livraison"] };
  const ROUTE = { alcool: "alcool", stups_volant: "stupefiants", defaut_permis: "aucun", refus_obtemperer: "aucun" };
  const AUTORITE = { outrage: "outrage", rebellion: "rebellion", violences_pdap: "rebellion" };
  const CONTROLE = { stups_usage: ["rue", "voiture"], stups_detention: ["rue", "voiture"] };

  VP.choisir = function (t) {
    const r = CR.seeded(t.sig + ":videos"), inf = t.inf, sc = ctxDe(t), out = [];
    const fl = !!t.flagrance, dou = (k) => (t.doutes || []).includes(k);
    const itt = t.f && t.f.itt;
    // 1. la rue : ce qui se passe sur la voie publique
    let rue = null;
    if (COUPS[inf] && COUPS[inf].includes(sc)) rue = { faits: "coups", decor: sc === "bar" ? "rue_bar" : sc === "voisinage" ? "rue_place" : "rue",
      o: { premier: dou("legitime_defense") ? "V" : "A", chute: itt > 0 && r() < 0.75, deux: agg(t, "reunion") || /reunion/.test(sc), filme: sc === "happy_slapping", police: fl, coups: int(r, 1, 3) } };
    else if (MENACES[inf] && MENACES[inf].includes(sc)) rue = { faits: "menaces", decor: "rue", o: { police: fl } };
    else if (DEGRAD[inf] && DEGRAD[inf][sc]) rue = { faits: "degradation", decor: "rue", o: { cible: DEGRAD[inf][sc], police: fl } };
    else if (inf === "vol" && sc === "tire") rue = { faits: "tire", decor: "rue", o: { police: fl } };
    else if (DEAL[inf] && DEAL[inf].includes(sc)) rue = { faits: "deal", decor: "rue_place", o: { guetteur: sc === "guetteur", police: fl, n: int(r, 1, 3) } };
    if (rue && !(inf === "vol" && ["arrachage", "magasin"].includes(sc))) {
      // effacées : en préliminaire, une réquisition plus d'un mois après les faits ne trouve plus rien (L252-5)
      const delai = !fl && t.d && t.d.plainte != null && t.d.faits != null ? t.d.plainte - t.d.faits + int(r, 1, 12) : 0;
      out.push(Object.assign(rue, { src: "rue", efface: delai > 30, delai, preuve: delai <= 30, requisitionIrr: (t.irr || []).includes("requisition") && !fl }));
    }
    // 2. la caméra-piéton : les interventions de police en flagrance
    let pt = null;
    if (fl && ROUTE[inf]) pt = { faits: "pieton_routier", o: { depistage: ROUTE[inf], resultat: "positif", refus: !!(t.f && t.f.refus), permis: inf === "defaut_permis" ? false : undefined } };
    else if (fl && AUTORITE[inf]) pt = { faits: "pieton_rue", o: { issue: AUTORITE[inf], motif: /verbalisation/.test(sc) ? "une verbalisation" : /interpellation/.test(sc) ? "une interpellation" : "un contrôle d'identité" }, preuve: true };
    else if (fl && CONTROLE[inf] && CONTROLE[inf].includes(sc)) pt = sc === "voiture" ? { faits: "pieton_routier", o: { depistage: "aucun" } } : { faits: "pieton_rue", o: { issue: "calme", motif: "un contrôle d'identité" } };
    if (pt) {
      pt.src = "pieton";
      if (r() < 0.18) pt.o.tardif = int(r, 4, 9);
      else if (r() < 0.14) pt.o.information = false;
      pt.preuve = !!pt.preuve;
      out.push(pt);
    }
    return out;
  };
  // au tirage (version 6) : la liste des vidéos, et la preuve « video » quand l'image montre les faits
  VP.planifier = function (t) {
    t.videos = VP.choisir(t);
    if (t.videos.some((v) => v.preuve) && !t.preuves.includes("video")) t.preuves.push("video");
    return t;
  };

  // ---------------------------------------------------------------- les réglages de l'extrait
  const p2 = (x) => String(x).padStart(2, "0");
  const modeDe = (r, h) => { const hh = (((h || 0) % 1440) + 1440) % 1440; return hh >= 7 * 60 + 30 && hh < 18 * 60 ? "jour" : hh >= 18 * 60 && hh < 21 * 60 ? "soir" : r() < 0.6 ? "ir" : "soir"; };
  // les visages : la personne mise en cause et la victime ont le visage de leur portrait du dossier. Doute sur
  // l'identification : l'auteur filmé est un sosie (même peau, mêmes cheveux, même coupe, autres traits) : c'est au
  // joueur de comparer l'image agrandie au portrait de son client.
  VP.looks = function (t, sansDoute) {
    const PX = CR.px, res = {};
    if (!PX || !PX.clientLook) return res;
    try {
      if (t.A && t.A.prenom) {
        const L = PX.clientLook(t.A);
        if (!sansDoute && (t.doutes || []).includes("doute_ident") && PX.lookFrom2 && PX.lookDePieces && L.p) {
          const S = PX.lookFrom2("sosie:" + t.sig, { g: L.g, age: L.age });
          res.A = PX.lookDePieces({ g: L.g, age: L.age, outfit: "shirt" }, Object.assign({}, S.p, { peau: L.p.peau, hc: L.p.hc, cut: L.p.cut }));
        } else res.A = L;
      }
      if (t.V && t.V.prenom && !t.V.agent) res.V = PX.clientLook(t.V);
    } catch (e) { /* sans portrait : visages modelés */ }
    return res;
  };
  VP.spec = function (t, v) {
    const r = CR.seeded(t.sig + ":videos:" + v.src);
    const A = t.A || {}, Vv = t.V || {};
    const tenueA = CR.SIM && CR.SIM.tenueAuteur ? CR.SIM.tenueAuteur(t) : null;
    const h = t.d && t.d.h != null ? t.d.h : 22 * 60;
    const jour = t.d && t.d.faits != null ? t.day + t.d.faits : t.day;
    const y = CR.ymd(jour), date = `${p2(y.d)}-${p2(y.m)}-${y.y}`;
    const spec = Object.assign({ faits: v.faits, graine: t.sig + ":" + v.src, mode: modeDe(r, h), date }, v.decor ? { decor: v.decor } : {}, v.o);
    spec.looks = VP.looks(t, v.src !== "rue"); // la caméra-piéton filme la personne contrôlée elle-même
    if (v.src === "rue") {
      spec.cam = "CAM " + p2(int(r, 2, 48));
      spec.auteur = { g: A.g || "m" }; if (tenueA) spec.auteur.tenue = tenueA;
      spec.victime = { g: Vv.g || "m", agee: (Vv.age || 0) >= 70 };
    } else {
      spec.cam = `CI ${pk(r, ["75", "92", "93", "94"])}-${int(r, 1000, 9999)}`;
      spec.personne = { g: A.g || "m" }; if (tenueA) spec.personne.tenue = tenueA;
      if (v.faits === "pieton_rue" && v.o.issue === "outrage") spec.propos = VP.propos(t, r);
    }
    // l'horloge de l'enregistreur : le geste à l'heure des faits (à quelques secondes près)
    const X0 = CR.video.extrait(Object.assign({}, spec, { heure: "00:00:00" }));
    const s0 = ((h * 60 + int(r, 5, 50) - Math.round(X0.scn.tG || 0)) % 86400 + 86400) % 86400;
    spec.heure = `${p2(Math.floor(s0 / 3600))}:${p2(Math.floor(s0 / 60) % 60)}:${p2(s0 % 60)}`;
    return spec;
  };
  // ce que dit la personne dans un outrage : les propos de l'affaire quand elle les porte, sinon des propos du registre
  VP.propos = function (t, r) {
    const f = t.f || {};
    const dits = [].concat(f.propos || f.injures || []).filter((x) => typeof x === "string" && x.length < 80);
    if (dits.length) return dits.slice(0, 2).map((x) => (/[.!?]$/.test(x) ? x : x + " !"));
    return [pk(r, ["Vous n'êtes que des bouffons !", "Dégage, t'es personne !", "Espèce de guignol, va !"]), pk(r, ["Je vous emmerde, vous et votre uniforme !", "Vous allez voir ce que je vais vous faire !", "Vous êtes des minables !"])];
  };

  // ---------------------------------------------------------------- les pièces
  const hsx = (h) => { const [hh, mm, ss] = h.split(" ")[1].split(":"); return `${+hh} h ${mm} min ${ss} s`; };
  const art = (s) => (/^(doudoune|veste)/.test(s) ? "une " : "un ") + s;
  function pieceRue(t, v, spec, cote, X) {
    const A = t.A || {}, dou = (k) => (t.doutes || []).includes(k), LZ = CR.MONDE.lieuxDe(t), SF = LZ.F;
    const fl = !!t.flagrance, P = (x) => DOCS.p(x);
    const titre = "Procès-verbal d'exploitation des images de vidéoprotection de la voie publique";
    const entete = [`${SF.paris ? "Préfecture de police" : "Police nationale"} · ${SF.comm}`, `Procédure n° ${t.proc} — cote ${cote}`];
    if (v.efface) return DOCS.forme({ title: titre, kind: "video", cote, entete, sigs: ["L'officier de police judiciaire"], blocs: [
      P(`Requérons le centre de supervision urbaine de nous remettre les enregistrements de la caméra de vidéoprotection de la voie publique couvrant le lieu des faits, ${SF.nom}, à la date des faits.`),
      P({ t: `Il nous est répondu que les enregistrements de cette date n'existent plus : ils ne sont conservés qu'un mois au plus, et notre réquisition intervient ${v.delai} jours après les faits (art. L252-5 du code de la sécurité intérieure).`, f: "G_vid_efface" }),
      P("Aucune image n'est donc versée à la procédure."),
    ] });
    const lis = X.lisible(), vus = new Set();
    const vue = { ir: "de nuit, l'image est en infrarouge, en noir et blanc", soir: "de nuit, l'image est en couleur, sous l'éclairage public", jour: "l'image est en couleur" }[X.mode];
    const blocs = [
      P(`Procédons à l'exploitation des enregistrements de la caméra de vidéoprotection de la voie publique ${spec.cam}, ${SF.nom}, remis par le centre de supervision urbaine en exécution de ${fl ? "notre réquisition" : "notre réquisition, prise avec l'autorisation du procureur de la République"} (art. ${fl ? "60-1" : "77-1-1"} du code de procédure pénale), sur support numérique placé sous scellé.`),
      P(`La caméra, de haute définition, fixée sur un mât du terre-plein central, filme en plongée le trottoir et la façade ; ${vue}, à ${X.fps} images par seconde. Elle n'enregistre pas le son.`),
      ...X.moments.map((m) => P(v.o.premier === "V" && m.cle === "premier" ? { t: `${hsx(m.h)} — ${CR.VRUE.rediger(X, m.txt, vus)}`, f: "G_vid_premier" } : m.cle === "chute" ? { t: `${hsx(m.h)} — ${CR.VRUE.rediger(X, m.txt, vus)}`, f: "G_vid_chute" } : `${hsx(m.h)} — ${CR.VRUE.rediger(X, m.txt, vus)}`)),
      lis.A ? P(`L'individu désigné ci-dessus comme l'auteur porte ${art(lis.A.image)}.`) : null,
      !lis.A || lis.A.visage !== "traits du visage discernables"
        ? P({ t: "La distance et la définition des images ne permettent pas de distinguer les traits du visage ; la silhouette et les vêtements sont visibles.", f: dou("doute_ident") ? "G_doute_ident" : "G_vid_visage" })
        : dou("doute_ident")
          ? P({ t: `Sur l'image agrandie, les traits du visage de l'individu se distinguent. Ils présentent une ressemblance avec ceux de ${A.prenom} ${A.nom}, sans qu'il soit possible de l'affirmer.`, f: "G_doute_ident" })
          : P({ t: `Sur l'image agrandie, les traits du visage de l'individu se distinguent. Le visage, la silhouette et les vêtements correspondent à ceux de ${A.prenom} ${A.nom}${fl ? " lors de son interpellation" : ""}.`, f: "G_video" }),
      X.sauts.length ? P(`L'enregistrement présente ${X.sauts.length === 1 ? "une interruption" : X.sauts.length + " interruptions"} : ${X.sauts.map(([a0, b0]) => `de ${hsx(X.horodatage(a0))} à ${hsx(X.horodatage(b0))}`).join(", ")}.`) : null,
      P("Une planche de captures est jointe ; les images utiles sont gravées sur un disque placé sous scellé."),
    ].filter(Boolean);
    return Object.assign(DOCS.forme({ title: titre, kind: "video", cote, entete, blocs, sigs: ["L'officier de police judiciaire"] }), { video: spec });
  }
  function piecePieton(t, v, spec, cote, X) {
    const LZ = CR.MONDE.lieuxDe(t), SF = LZ.F, P = (x) => DOCS.p(x);
    const tr = CR.VPIETON.transcription(X);
    const debut = X.horodatage(X.frames[0] || 0);
    const blocs = [
      P(`Procédons à la transcription de l'enregistrement de la caméra individuelle ${spec.cam}, portée par un fonctionnaire de l'équipage intervenant, extrait du support informatique sécurisé du service (art. L241-1 et R241-1 et suivants du code de la sécurité intérieure).`),
      P(X.scn.tardif ? { t: `L'enregistrement débute à ${hsx(debut)}, alors que l'échange avec la personne est déjà engagé : ce qui précède n'est pas enregistré.`, f: "G_pieton_tardif" } : `L'enregistrement débute à ${hsx(debut)}, à l'approche de la personne.`),
      P("La caméra, portée à la poitrine, enregistre l'image et le son ; l'image suit les mouvements du fonctionnaire."),
      P("Transcription des paroles (les passages couverts par le bruit sont signalés « [inaudible] ») :"),
      ...tr.map((p, k) => P(!X.scn.information && k === 0 && !X.scn.tardif ? { t: `${hsx(p.h)} — ${p.qui} : « ${p.texte} »`, f: "G_pieton_info" } : `${hsx(p.h)} — ${p.qui} : « ${p.texte} »`)),
      P("Images :"),
      ...X.moments.map((m) => P(`${hsx(m.h)} — ${CR.VRUE.rediger(X, m.txt, new Set())}`)),
      !X.scn.information && X.scn.tardif ? P({ t: "La partie enregistrée ne comporte aucune mention, faite à la personne, de l'enregistrement en cours.", f: "G_pieton_info" }) : null,
      P(`Un extrait est gravé sur un disque placé sous scellé. Hors procédure, l'enregistrement aurait été effacé au bout d'un mois (art. L241-1).`),
    ].filter(Boolean);
    return Object.assign(DOCS.forme({ title: "Procès-verbal de transcription de l'enregistrement d'une caméra individuelle", kind: "video", cote, entete: [`${SF.paris ? "Préfecture de police" : "Police nationale"} · ${SF.comm}`, `Procédure n° ${t.proc} — cote ${cote}`], blocs, sigs: ["L'officier de police judiciaire"] }), { video: spec });
  }

  // les faits à relever que portent ces pièces : seulement ceux dont la pièce contient le passage (sinon le joueur ne
  // pourrait pas les relever)
  function faits(PZ, t, v, X) {
    const f = (id, o) => { if (!PZ.facts[id]) PZ.facts[id] = o; };
    if (v.src === "rue") {
      if (v.efface) f("G_vid_efface", { label: "Les images de vidéoprotection ont été effacées avant la réquisition", key: true, why: "Faute d'avoir été requises à temps, les images qui auraient pu confirmer ou démentir les déclarations n'existent plus : le doute qui en reste profite au prévenu." });
      if (v.o.premier === "V") f("G_vid_premier", { label: "Les images montrent l'autre porter le premier coup", key: true, why: "La riposte immédiate à une attaque peut relever de la légitime défense (art. 122-5 du code pénal) ; l'image le montre mieux qu'une déclaration." });
      if (v.efface || !X) return;
      if (v.o.chute && X.moments.some((m) => m.cle === "chute")) f("G_vid_chute", { label: "La victime chute après les coups", key: false });
      const lis = X.lisible(), flou = !lis.A || lis.A.visage !== "traits du visage discernables" || (t.doutes || []).includes("doute_ident");
      if (flou && !(t.doutes || []).includes("doute_ident")) f("G_vid_visage", { label: "Les traits du visage de l'auteur ne sont pas discernables sur les images", key: true, why: "L'identification repose sur la silhouette et les vêtements : un rapprochement, pas une reconnaissance." });
      if (!flou) f("G_video", { label: "La vidéo correspond à la silhouette et aux vêtements du mis en cause", key: false });
    } else if (X) {
      if (X.scn.tardif) f("G_pieton_tardif", { label: "La caméra-piéton a été déclenchée après le début de l'échange", key: true, why: "Le début de l'incident n'est pas enregistré : ce qui l'a provoqué ne se voit pas, et la version des policiers sur ce moment n'est confirmée par rien." });
      if (!X.scn.information) f("G_pieton_info", { label: "Aucune information de la personne sur l'enregistrement", key: true, why: "L'article L241-1 du code de la sécurité intérieure exige que la personne filmée soit informée du déclenchement, sauf si les circonstances l'interdisent : un argument sur la loyauté de la preuve." });
    }
  }

  // ---------------------------------------------------------------- l'enveloppe de GEN2.pieces
  const pieces0 = GEN2.pieces;
  GEN2.pieces = function (t, N) {
    const PZ = pieces0.apply(this, arguments);
    if ((t.ver || 0) < 6 || !t.videos || !t.videos.length) return PZ;
    try { VP.ajouter(PZ, t); } catch (e) { console.error("vidéo non ajoutée", e); }
    return PZ;
  };
  VP.ajouter = function (PZ, t) {
    let n = 0;
    for (const c of Object.values(PZ.cotes || {})) { const m = /^D(\d+)/.exec(String(c || "")); if (m) n = Math.max(n, +m[1]); }
    for (const v of t.videos) {
      let key = v.src === "rue" ? "pv_videoprotection" : "pv_camera_pieton", cote;
      // la vidéo seulement écrite que l'affaire avait déjà : la pièce jouable la remplace, à la même cote
      if (v.src === "rue" && PZ.docs.pv_video) { key = "pv_video"; cote = PZ.cotes.pv_video; }
      if (!cote) { n++; cote = "D" + n; }
      const spec = v.efface ? null : VP.spec(t, v);
      const X = spec ? CR.video.extrait(spec) : null;
      const fn = v.src === "rue" ? () => pieceRue(t, v, spec, cote, X) : () => piecePieton(t, v, spec, cote, X);
      PZ.docs[key] = () => CAT.typoDeep(fn());
      PZ.cotes[key] = cote;
      PZ.titres[key] = `${v.src === "rue" ? (v.efface ? "Vidéoprotection : images effacées" : "Exploitation vidéo") : "Caméra-piéton"} (${cote})`;
      for (const l of ["dossier", "copie"]) {
        const L = PZ.listes[l]; if (!L || L.includes(key)) continue;
        const i = L.indexOf("casier"); if (i >= 0) L.splice(i, 0, key); else L.push(key);
      }
      faits(PZ, t, v, X);
      // la réquisition sans autorisation : la nullité écarte aussi les images
      if (v.src === "rue" && v.requisitionIrr && PZ.anomalies.requisition && !PZ.anomalies.requisition.annule.includes("video")) PZ.anomalies.requisition.annule.push("video");
    }
    return PZ;
  };
})();
