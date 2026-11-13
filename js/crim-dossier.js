// La Permanence — refonte du gameplay, lot 7 : le dossier criminel vers son volume réel (CR.CRIMD)
// Le générateur criminel (gen-pieces-crim.js) rend un dossier d'une quinzaine de pièces brèves. Ce module y ajoute, composées
// par le moteur de documents, les pièces que tout dossier criminel contient et qui manquaient : le transport sur les lieux
// avec les constatations de l'identité judiciaire et la liste des scellés (tirée des preuves du dossier), l'inventaire des
// scellés et leur envoi aux laboratoires, l'enquête de voisinage (plusieurs voisins, des heures qui ne concordent pas
// toujours, de bonne foi), l'assistance à l'autopsie (la fourchette de l'heure du décès), la commission rogatoire du juge
// d'instruction et le procès-verbal de synthèse de son exécution. Mêmes faits, mêmes dates que le reste du dossier.
// Règles de contenu (dev/ref/refonte-gameplay.md, « Ce qui ne change pas ») : pour les affaires dont la victime est mineure
// (récit procédural), pas d'enquête de voisinage et aucune description des faits ; le registre reste celui du procès-verbal.
(function () {
  "use strict";
  const CR = window.CR;
  const GEN2 = CR.GEN2;
  if (!GEN2 || !GEN2.piecesCrim || GEN2.piecesCrim.complete) return;
  const K = (CR.CRIMD = {});
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const NUM = ["UN", "DEUX", "TROIS", "QUATRE", "CINQ", "SIX", "SEPT", "HUIT", "NEUF", "DIX"];

  // les scellés que les preuves du dossier supposent, dans l'ordre où l'identité judiciaire les constitue
  K.scelles = function (t, N) {
    const L = [];
    const has = (k) => (t.preuves || []).includes(k);
    if (has("adn")) L.push({ k: "adn", t: "écouvillons de prélèvements biologiques effectués sur les lieux (trois)", labo: "laboratoire de police scientifique (analyse génétique)" });
    if (has("balistique")) L.push({ k: "balistique", t: "étuis percutés et projectile retrouvés sur les lieux", labo: "laboratoire de police scientifique (balistique)" });
    if (has("saisie")) L.push({ k: "saisie", t: String(N.saisie || "objets découverts sur les lieux").replace(/^\w/, (c) => c.toLowerCase()), labo: null });
    if (has("toxico")) L.push({ k: "toxico", t: "prélèvements sanguins et urinaires", labo: "laboratoire de toxicologie" });
    if (has("video")) L.push({ k: "video", t: "disque contenant l'extraction des images de vidéoprotection", labo: null });
    if (has("telephonie")) L.push({ k: "telephonie", t: "téléphone portable découvert sur les lieux", labo: "service d'exploitation des supports numériques" });
    return L;
  };

  K.ajouter = function (t, N, PZ) {
    const DOCS = CR.DOCS; if (!DOCS || !DOCS.pv) return PZ;
    const I = CR.CAT.INF[t.inf] || {};
    const r = CR.seeded(t.sig + ":crimd");
    const A = t.A, V = t.V;
    const n = (x) => (x ? `${x.prenom} ${x.nom}` : "");
    const nf = (x) => `${x && x.g === "f" ? "Mme" : "M."} ${n(x)}`;
    const proc = !!N.procedural;
    const jf = t.d.faits, h0 = ((t.d.h % 1440) + 1440) % 1440;
    const svc = (GEN2.serviceCrim ? GEN2.serviceCrim(t) : "Direction régionale de la police judiciaire");
    const service = "PRÉFECTURE DE POLICE · " + svc.toUpperCase();
    const opj = { nom: pk(r, ["Commandant Hélène Garnier", "Capitaine Marc Viallet", "Lieutenant Sonia Rahmani", "Capitaine Pierre Lestrade"]), qualite: "officier de police judiciaire" };
    opj.signe = opj.nom;
    const st = DOCS.style ? DOCS.style(CR.seeded(t.sig + ":crimd:st")) : undefined;
    const hm = DOCS.hm;
    let cote = Object.values(PZ.cotes || {}).reduce((a, c) => Math.max(a, +String(c).replace(/\D/g, "") || 0), 0);
    const cotes = PZ.cotes, titres = PZ.titres, docs = PZ.docs, facts = PZ.facts;
    const add = (key, court, liste, fn) => { if (docs[key]) return; cote++; cotes[key] = "D" + cote; titres[key] = `${court} (D${cote})`; docs[key] = fn; for (const l of liste) if (PZ.listes[l] && !PZ.listes[l].includes(key)) PZ.listes[l].push(key); };
    const fact = (id, o) => { if (!facts[id]) facts[id] = o; };
    const lieu = N.lieu || "sur les lieux";
    const ENQ = ["enquete", "dossier", "copie", "tout"], INS = ["instruction", "copie", "tout"];

    // 1. transport sur les lieux, constatations et scellés
    const mT = h0 + int(r, 35, 95), mTfin = mT + int(r, 120, 260);
    const scel = K.scelles(t, N);
    const traces = int(r, 0, 4);
    add("pv_transport", "Transport et constatations", ENQ, () => DOCS.pv({ cote: cotes.pv_transport, proc: t.proc, service, unite: "Identité judiciaire", cadre: t.flagrance ? "FLAGRANT DÉLIT" : "ENQUÊTE", titre: "Procès-verbal de transport, de constatations et de saisies", numPV: "00" + int(CR.seeded(t.sig + ":tr"), 101, 899),
      jour: DOCS.jourDe(jf, mTfin), heure: mTfin, redacteur: opj, visa: t.flagrance ? "Vu les articles 54, 56 et 60 du code de procédure pénale," : "Vu les articles 75 et suivants du code de procédure pénale,", lieu: "Nous transportant sur les lieux", objet: `OBJET : ${t.q.label} — transport et constatations`,
      blocs: [
        DOCS.p(`À ${hm(mT)}, nous transportons ${lieu}, en compagnie des fonctionnaires de l'identité judiciaire. Un périmètre de sécurité est en place à notre arrivée.`),
        proc ? DOCS.p("Constatations conformes au rapport de l'identité judiciaire, annexé ; planche photographique non reproduite.") : DOCS.p(`Constatations : ${[].concat(N.constat || []).slice(0, 2).join(" ").replace(/\s+/g, " ") || "état des lieux relevé et photographié"}`),
        DOCS.p({ t: traces ? `Recherche de traces papillaires : ${traces === 1 ? "une trace exploitable relevée" : traces + " traces exploitables relevées"}, transmises au fichier automatisé des empreintes digitales.` : "Recherche de traces papillaires : aucune trace exploitable.", f: traces ? undefined : "G_aucune_trace" }),
        ...(scel.length ? [DOCS.p("Procédons aux saisies suivantes, placées sous scellés :")].concat(scel.map((x, i) => DOCS.ligne(`Scellé n° ${NUM[i] || i + 1}`, x.t))) : [DOCS.p("Aucun objet n'est saisi sur les lieux.")]),
        DOCS.p(`Fin des opérations à ${hm(mTfin)}.`),
      ], cloture: DOCS.mention(`Dont procès-verbal, fait et clos sur les lieux le ${DOCS.date(DOCS.jourDe(jf, mTfin))} à ${hm(mTfin)}.`), signataires: [`${opj.signe}, officier de police judiciaire`, "Le technicien de l'identité judiciaire"], st }));
    if (!traces) fact("G_aucune_trace", { label: "Aucune trace papillaire exploitable sur les lieux", key: false });

    // 2. inventaire des scellés et transmissions aux laboratoires
    if (scel.length) {
      const jInv = DOCS.jourDe(jf, mTfin) + int(r, 1, 3);
      add("inventaire_scelles", "Inventaire des scellés", ENQ, () => DOCS.forme({ title: "Inventaire des scellés et réquisitions aux laboratoires", kind: "releve", cote: cotes.inventaire_scelles, entete: [service, `Procédure n° ${t.proc} — cote ${cotes.inventaire_scelles}`],
        blocs: [DOCS.p(`Inventaire établi le ${DOCS.date(jInv)}.`)].concat(scel.map((x, i) => DOCS.ligne(`Scellé n° ${NUM[i] || i + 1} — ${x.t}`, x.labo ? `adressé au ${x.labo} le ${DOCS.date(jInv)}` : "conservé au service"))),
        sigs: [`${opj.signe}, officier de police judiciaire`] }));
    }

    // 3. enquête de voisinage (jamais pour une victime mineure)
    if (!proc) {
      const nb = int(r, 3, 5);
      const BRUITS = I.deces || /meurtre|assassinat|violences/.test(t.inf) ? ["des cris", "une violente dispute", "un bruit sourd, comme une chute", "une détonation", "quelqu'un qui courait dans l'escalier", "une porte claquer"] : ["des éclats de voix", "un véhicule qui démarrait vite", "des pas pressés", "un bruit de verre brisé"];
      const NOMS = [["Mme", "Josiane Leclerc", 74], ["M.", "Ahmed Bouzid", 41], ["Mme", "Camille Perrin", 29], ["M.", "Gérard Masson", 66], ["Mme", "Fatoumata Sy", 35], ["M.", "Lucas Hoarau", 23]];
      const vs = [];
      for (let i = 0; i < nb; i++) { const [c, nm, age] = NOMS[(i + int(r, 0, 5)) % NOMS.length]; if (vs.some((x) => x.nm === nm)) continue; vs.push({ c, nm, age, h: h0 + int(r, -35, 35), quoi: pk(r, BRUITS), etage: pk(r, ["au premier étage", "au troisième", "sur le même palier", "dans l'immeuble d'en face", "au rez-de-chaussée"]), rien: r() < 0.25 }); }
      const dits = vs.filter((x) => !x.rien).map((x) => x.h);
      const ecart = dits.length > 1 ? Math.max(...dits) - Math.min(...dits) : 0;
      const mV = mTfin + int(r, 60, 300);
      add("pv_voisinage", "Enquête de voisinage", ENQ, () => DOCS.pv({ cote: cotes.pv_voisinage, proc: t.proc, service, unite: svc, cadre: t.flagrance ? "FLAGRANT DÉLIT" : "ENQUÊTE", titre: "Procès-verbal d'enquête de voisinage", numPV: "00" + int(CR.seeded(t.sig + ":vois"), 101, 899),
        jour: DOCS.jourDe(jf, mV), heure: mV, redacteur: opj, lieu: "Nous transportant sur les lieux", objet: `OBJET : ${t.q.label} — enquête de voisinage`,
        blocs: [DOCS.p(`Procédons à une enquête de voisinage ${lieu}. Les personnes suivantes, entendues sommairement, déclarent :`)].concat(vs.map((x) => DOCS.p({ t: x.rien ? `${x.c} ${x.nm}, ${x.age} ans, demeurant ${x.etage} : n'a rien vu ni entendu.` : `${x.c} ${x.nm}, ${x.age} ans, demeurant ${x.etage} : a entendu ${x.quoi} « vers ${hm(x.h)} ».`, f: undefined }))).concat([DOCS.p("Les personnes qui ont vu ou entendu un élément utile sont invitées à se présenter au service pour y être entendues.")]),
        cloture: DOCS.mention(`Dont procès-verbal, fait et clos ${DOCS.date(DOCS.jourDe(jf, mV))} à ${hm(mV)}.`), signataires: [`${opj.signe}, officier de police judiciaire`], st }));
      if (ecart > 25) fact("G_heures_voisins", { label: `Les voisins situent les faits à des heures qui s'écartent de ${ecart} minutes`, key: true, why: "L'heure des faits n'est pas établie à la minute : rapprochée de la téléphonie ou des images, cette marge peut ouvrir un alibi ou fermer une version." });
    }

    // 4. assistance à l'autopsie : la fourchette de l'heure du décès
    if (I.deces && V) {
      const avant = int(r, 60, 180), apres = int(r, 30, 150);
      const jA = jf + int(r, 1, 2), mA = 9 * 60 + int(r, 0, 120);
      add("pv_autopsie", "Assistance à l'autopsie", ENQ, () => DOCS.pv({ cote: cotes.pv_autopsie, proc: t.proc, service, unite: svc, cadre: t.flagrance ? "FLAGRANT DÉLIT" : "ENQUÊTE", titre: "Procès-verbal d'assistance à l'autopsie", numPV: "00" + int(CR.seeded(t.sig + ":auto"), 101, 899),
        jour: jA, heure: mA, redacteur: opj, lieu: "Nous trouvant à l'institut médico-légal", objet: `OBJET : ${t.q.label} — assistance à l'autopsie`,
        blocs: [
          DOCS.p(`Assistons à l'autopsie du corps de ${proc ? "la victime" : nf(V)}, pratiquée par le médecin légiste requis.`),
          DOCS.p("Le médecin légiste indique, sous réserve de son rapport définitif, que les constatations sont compatibles avec le mécanisme décrit dans la procédure."),
          DOCS.p({ t: `Au vu de la température du corps, des lividités et de la rigidité, le décès est situé entre ${hm(h0 - avant)} et ${hm(h0 + apres)}.`, f: avant + apres > 240 ? "G_fourchette" : undefined }),
          DOCS.p("Des prélèvements sont effectués et placés sous scellés pour analyses toxicologiques et anatomopathologiques."),
        ], cloture: DOCS.mention(`Dont procès-verbal, fait et clos à l'institut médico-légal, le ${DOCS.date(jA)}.`), signataires: [`${opj.signe}, officier de police judiciaire`], st }));
      if (avant + apres > 240) fact("G_fourchette", { label: `La fourchette de l'heure du décès couvre ${Math.round((avant + apres) / 60)} heures`, key: true, why: "Une fourchette large ne situe pas les faits à l'heure de l'accusation : à confronter aux heures que donnent les autres pièces." });
    }

    // 5. la commission rogatoire et la synthèse de son exécution
    if (t.d.ri != null) {
      const jCR = t.d.ri + int(r, 1, 4), jRet = jCR + int(r, 18, 40);
      const actes = [].concat(N.actes || []).map((x) => (typeof x === "string" ? x : x.t)).filter(Boolean).slice(0, 4);
      const liste = actes.length ? actes : ["Procéder à toutes auditions utiles", "Exploiter les données téléphoniques des lignes en cause", "Rechercher et exploiter les images de vidéoprotection"];
      add("commission_rogatoire", "Commission rogatoire", INS, () => DOCS.forme({ title: "Commission rogatoire", kind: "greffe", cote: cotes.commission_rogatoire, entete: [`Tribunal judiciaire — cabinet du juge d'instruction`, `Information n° ${t.ninfo} — cote ${cotes.commission_rogatoire}`],
        blocs: [
          DOCS.p(`Nous, juge d'instruction, vu les articles 81, 151 et 152 du code de procédure pénale, donnons commission rogatoire au chef de la ${svc} de procéder aux actes suivants :`),
          ...liste.map((x, i) => DOCS.ligne(String(i + 1), x.replace(/\.$/, ""))),
          DOCS.p(`Délai d'exécution : deux mois. Fait le ${DOCS.date(jCR)}.`),
        ], sigs: ["Le juge d'instruction"] }));
      add("pv_retour_cr", "Synthèse d'exécution", INS, () => DOCS.pv({ cote: cotes.pv_retour_cr, proc: t.proc, service, unite: svc, cadre: "COMMISSION ROGATOIRE", titre: "Procès-verbal de synthèse — exécution de la commission rogatoire", numPV: "00" + int(CR.seeded(t.sig + ":cr"), 101, 899),
        jour: jRet, heure: 17 * 60 + int(CR.seeded(t.sig + ":crh"), 0, 50), redacteur: opj, visa: "Vu la commission rogatoire et les articles 151 et suivants du code de procédure pénale,", lieu: "Nous trouvant au service", objet: `OBJET : ${t.q.label} — retour de commission rogatoire`,
        blocs: [DOCS.p(`Exécutant la commission rogatoire du ${DOCS.date(jCR)}, avons accompli les actes suivants :`)].concat(liste.map((x, i) => DOCS.ligne(String(i + 1), `${x.replace(/\.$/, "")} : ${pk(CR.seeded(t.sig + ":cr" + i), ["procès-verbaux joints", "exécuté, résultats joints", "exécuté en partie ; la suite est en cours", "sans résultat exploitable"])}`))).concat([DOCS.p("Retournons la commission rogatoire au magistrat mandant, avec les procès-verbaux d'exécution.")]),
        cloture: DOCS.mention(`Dont procès-verbal, fait et clos le ${DOCS.date(jRet)}.`), signataires: [`${opj.signe}, officier de police judiciaire`], st }));
    }
    return PZ;
  };

  const ancien = GEN2.piecesCrim;
  GEN2.piecesCrim = function (t, N) { const PZ = ancien.apply(this, arguments); try { return K.off ? PZ : K.ajouter(t, N, PZ); } catch (e) { console.error(e); return PZ; } };
  GEN2.piecesCrim.complete = true;
})();
