/* La Permanence — trames du dossier de flagrance (lot 1 de la refonte du gameplay).
   Chaque pièce est composée par CR.DOCS à partir de la simulation (CR.SIM), dans sa trame d'usage
   (dev/ref/trames-pieces.md) : interpellation, placement en garde à vue et notification des droits, déclaration des
   droits, billet d'avis au parquet, avis à la famille et à l'avocat, réquisition et certificat du médecin, audition de la
   victime et du témoin, réquisition et certificat de l'UMJ, scellé et restitution, réquisition et exploitation des
   images, audition du gardé à vue, prolongation, fin de garde à vue, synthèse et bordereau.
   Les faits du bloc-notes (f) et les irrégularités (flag, paire) des anciennes pièces sont repris sur les passages qui
   les portent ; rien ne les signale. SIM.pieces(t, k, S) → { docs, titres, ordre, cotes }. */
(function () {
  const CR = window.CR;
  const DOCS = CR.DOCS, SIM = CR.SIM;
  const { p, decl, q, ligne, titre, mention } = DOCS;
  const rep = DOCS.r;
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const ch = (r, x) => r() < x;
  const hm = DOCS.hm, hs = DOCS.heures;
  const defi = (o) => o.replace(/^un /, "le ").replace(/^une /, "la ");
  const Maj = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const guill = (x) => String(x).replace(/«\s?/g, "“").replace(/\s?»/g, "”");

  const butinDe = (N) => { const m = /Ils ont pris (.+?)\. Préjudice/.exec((N.plainte || []).join(" ")); return m ? m[1] : null; };
  SIM.pieces = function (t, k, S) {
    const { A, V, T, N, C } = k;
    const E = S.E, jf = S.jf, SF = k.SF, TJ = k.TJ, q0 = k.q;
    const has = k.has, irr = k.irr, dou = k.dou;
    const n = (x) => (x ? `${x.prenom} ${x.nom}` : "");
    const civ = (x) => (x && x.g === "f" ? "Mme" : "M.");
    const nf = (x) => `${civ(x)} ${n(x)}`;
    const e = (x) => (x && x.g === "f" ? "e" : "");
    const il = (x) => (x && x.g === "f" ? "elle" : "il"), Il = (x) => Maj(il(x));
    const lui = (x) => (x && x.g === "f" ? "elle" : "lui");
    const le = (x) => (x && x.g === "f" ? "la" : "le");
    const gp = (nom) => (/^(Léa|Sarah|Aurélie|Nadia|Inès)\b/.test(nom) ? "Gardienne de la paix" : "Gardien de la paix");
    const commLong = SF.paris ? SF.commCourt.replace("commissariat", "commissariat central") : SF.commCourt;
    const service = SF.paris ? "PRÉFECTURE DE POLICE · DSPAP" : "POLICE NATIONALE · DDSP";
    const unite = SF.comm;
    // « Brigadier-chef Stéphane Morel » → nom et grade séparés, comme dans l'ouverture d'un procès-verbal
    const mG = /^(Brigadier-chef|Brigadier|Major|Lieutenant|Capitaine|Commandant|Adjudant-chef|Adjudant)\s+(.+)$/.exec(k.opjN || "");
    const OPJ = { nom: mG ? mG[2] : k.opjN, grade: mG ? mG[1] : null, qualite: `${mG ? mG[1].toLowerCase() + " de police, " : ""}officier de police judiciaire en fonction au ${SF.comm.replace(/^Commissariat/, "commissariat")}` };
    OPJ.signe = `${OPJ.grade ? OPJ.grade + " " : ""}${OPJ.nom}`;
    const apj = (i) => ({ nom: t.gpx[i], qualite: `${gp(t.gpx[i]).toLowerCase()}, agent de police judiciaire`, signe: `${gp(t.gpx[i])} ${t.gpx[i]}` });
    const apjTxt = (i) => `${gp(t.gpx[i]).startsWith("Gardienne") ? "la gardienne" : "le gardien"} de la paix ${t.gpx[i]}`;
    // « un sweat à capuche gris, capuche relevée, jean gris, baskets blanches »
    const parle = (tn) => { const H = CR.video.VESTIAIRE.HAUTS[tn.haut]; return (H.g === "f" ? "une " : "un ") + CR.video.decrire(tn); };
    const av = (CR.ACTEURS.find((a) => a.role === "adverse") || { nom: "Me Lucas Pernot" }).nom;
    const stO = S.auteurs.opj.style, stA = S.auteurs.apj.style;
    const bav = (st) => st.bavard;
    const ob = S.objet || { nom: "", type: "", retrouve: false }, objet = ob.nom, lobjet = defi(objet);
    const j = (m) => DOCS.jourDe(jf, m);
    const at = (m) => `le ${DOCS.date(j(m))} à ${hm(m)}`;
    const lieu = S.lieu.texte;
    const ville = SF.paris ? "Paris" : SF.ville;
    const parquet = TJ.parquet;
    const docs = {}, titres = {}, ordre = [];
    // chaque pièce : sa minute (pour les cotes), son titre court, sa fonction de composition
    // pièces propres à la garde à vue : absentes d'une audition libre
    const GAVK = ["pv_notification", "declaration_droits", "avis_parquet", "avis_famille", "avis_avocat", "requisition_medecin", "certificat_gav", "pv_prolongation", "pv_fin_gav"];
    const add = (key, m, court, fn) => { if (!S.gav && GAVK.includes(key)) return; ordre.push({ key, m, court }); docs[key] = (x) => { const avant = DOCS.numerique, cadre0 = DOCS.cadre; DOCS.numerique = S.numerique; DOCS.cadre = S.prelim ? "ENQUÊTE PRÉLIMINAIRE" : null; try { return fn(x); } finally { DOCS.numerique = avant; DOCS.cadre = cadre0; } }; };
    // visas : flagrance (art. 53 et s.) ou enquête préliminaire (art. 75 et s.)
    const vis = (fl, pr) => (S.prelim ? pr : fl);
    const PL = S.prelim; // enquête préliminaire, garde à vue des jours après la plainte
    const AL = !S.gav; // audition libre (art. 61-1)
    // l'issue de la mesure : défèrement, convocation remise, citation, ordonnance pénale
    const trib = t.jur === "tp" ? "tribunal de police" : "tribunal correctionnel";
    const issueTxt = () => {
      const lib = `${n(A)} est laissé${e(A)} libre`;
      if (S.issue === "defere") return `Sur instruction du procureur de la République, ${n(A)} est conduit${e(A)} sous escorte au dépôt du ${TJ.tj} pour y être déféré${e(A)}.`;
      if (S.issue === "op") return `Sur instruction du procureur de la République, ${lib} ; la procédure est transmise au parquet, qui envisage de requérir une ordonnance pénale (art. 495).`;
      if (S.issue === "cppv") return `Sur instruction du procureur de la République, ${n(A)} est conduit${e(A)} devant lui pour se voir notifier une convocation par procès-verbal à comparaître devant le tribunal correctionnel (art. 394).`;
      if (S.issue === "citation") return `Sur instruction du procureur de la République, ${lib} ; ${il(A)} sera cité${e(A)} à comparaître devant le ${trib} de ${TJ.ville}.`;
      return `Sur instruction du procureur de la République, lui remettons une convocation à comparaître devant le ${trib} de ${TJ.ville}${t.d.audience != null ? `, le ${DOCS.date(t.d.audience)} à ${t.jur === "tp" ? "9 h 30" : "13 h 30"}` : ""} (art. 390-1), dont copie est jointe à la procédure, puis ${lib}.`;
    };
    const issueCourt = () => ({ defere: "l'intéressé" + e(A) + " étant déféré" + e(A), op: "en vue d'une ordonnance pénale", cppv: "l'intéressé" + e(A) + " étant conduit" + e(A) + " devant le procureur pour une convocation par procès-verbal", citation: "l'intéressé" + e(A) + " étant laissé" + e(A) + " libre dans l'attente d'une citation", copj: "l'intéressé" + e(A) + " ayant reçu une convocation par officier de police judiciaire" }[S.issue] || "");
    // ce que la victime ne peut pas encore dire : l'ITT fixée par l'UMJ après son audition
    const avantUMJ = !!(E.umj && E.umj.examen > E.victime);
    const sansITT = (x) => (avantUMJ ? String(x).replace(/\s*[^.«»!?]*\b(ITT|incapacité totale)\b[^.!?]*[.!?]?/g, "").replace(/Oui, à l'unité médico-judiciaire\.?/, "Pas encore, je dois y aller.").replace(/, puis l'UMJ\./, ".").trim() : x);
    const cotes = {};
    const cote = (key) => cotes[key] || "D?";
    const identite = (x, extra) => Object.assign({ nom: x.nom, prenom: x.prenom, g: x.g, naissance: x.naissance, adresse: x.adresse, tel: x.tel, metier: x.metier }, extra || {});
    const tenueA = S.tenueA && CR.video ? CR.video.vetu(S.tenueA, A.g) : null;
    const moi = (x) => String(x || "").replace(/^son /, "mon ").replace(/^sa /, "ma ").replace(/^ses /, "mes ");

    // ================================================================ D : interpellation
    if (S.arrachage) add("pv_interpellation", E.interp, "Interpellation", () => {
      const rr = CR.seeded(t.sig + ":d:interp");
      const sv = S.savoirs.V, sT = S.savoirs.T;
      const signal = sv.tenue ? `individu de sexe ${A.g === "f" ? "féminin" : "masculin"}, ${sv.age}, ${sv.taille}, vêtu${e(A)} d'${sv.tenue.texte.replace(/^une? /, (m0) => (m0 === "une " ? "une " : "un "))}` : `individu de sexe ${A.g === "f" ? "féminin" : "masculin"}, jeune, vêtements sombres`;
      const blocs = [
        p(`Étant en patrouille portée à bord du véhicule sérigraphié ${S.indicatif}, revêtus de nos uniformes et porteurs de nos insignes, en compagnie de ${apjTxt(1)}, ${SF.paris ? `dans le ${SF.arr} arrondissement` : `à ${SF.nom}`},`),
        irr("controle_identite") ? null : p(`À ${hm(E.requis)}, sommes requis par ${SF.paris ? "la salle de commandement de la direction de la sécurité de proximité" : "le centre d'information et de commandement"} pour un vol avec violence commis ${lieu}${S.lieu.station && S.fuite === "pied" ? `, à proximité de la station de métro ${S.lieu.station.nom}` : ""}.`),
        irr("controle_identite") ? null : p(`À ${hm(E.surPlace)}, arrivés sur les lieux, prenons contact avec ${nf(V)}, ${V.age} ans, qui nous déclare avoir été victime de l'arrachage de ${objet} quelques minutes plus tôt alors qu'${il(V)} marchait en téléphonant.${S.dit.violence ? ` ${Il(V)} indique avoir été entraîné${e(V)} au sol.` : ""} ${S.itt ? `${Il(V)} présente ${S.blessures[0]}.` : `${Il(V)} ne présente pas de blessure apparente et refuse l'intervention des sapeurs-pompiers.`}`),
        irr("controle_identite") ? null : (T && sT && sT.identifie ? p(`${nf(T)}, ${T.age} ans, présent${e(T)} ${sT.ou} au moment des faits, se présente spontanément à nous comme témoin et nous indique avoir vu l'auteur s'enfuir ${S.fuite === "pied" ? "en courant" : S.fuite === "scooter" ? "à scooter" : "en trottinette"} ${S.direction}.`) : T ? p(`Une personne présente au moment des faits nous indique avoir vu l'auteur s'enfuir ${S.direction}, puis quitte les lieux sans laisser son identité.`) : null),
        irr("controle_identite") ? null : p(`Signalement communiqué par la victime : ${signal}. Diffusons le signalement sur les ondes et procédons à des recherches dans le secteur${bav(stA) ? ", à pied et en véhicule, en direction indiquée par la victime" : ""}.`),
        irr("controle_identite")
          ? [p(`À ${hm(E.interp - 3)}, ${lieu.replace(/, à hauteur.*$/, "")}, dans le cadre d'une patrouille de sécurisation,`), p({ t: "Agissant dans le cadre d'une patrouille de sécurisation, remarquons un individu qui, à notre vue, détourne le regard et presse le pas. Procédons au contrôle de son identité.", flag: "controle_identite" }), p(`Sommes informés à cet instant par les ondes d'un vol avec violence commis quelques minutes plus tôt ${lieu}.`)]
          : p(`À ${hm(E.interp - 1)}, ${S.fuite === "pied" && S.lieu.station ? `dans la salle des billets de la station ${S.lieu.station.nom}` : pk(rr, ["à l'angle de la rue voisine", "devant un bureau de tabac, à deux cents mètres des lieux", "au feu tricolore situé plus bas"])}, apercevons un individu correspondant en tout point au signalement communiqué, ${pk(rr, [`qui marche d'un pas rapide en regardant derrière ${lui(A)}`, "qui se tient à l'écart, essoufflé", "qui, à notre vue, change de direction"])}. Procédons à son interpellation, sans difficulté.`),
        irr("fouille")
          ? p({ t: `Sans attendre l'officier de police judiciaire, le gardien de la paix ${t.gpx[1].split(" ")[1]} procède à la fouille des poches et du sac de l'intéressé${ob.retrouve ? ` ; y découvrons ${objet}` : ""}.`, flag: "fouille" })
          : ob.retrouve ? p(`Palpation de sécurité, puis, en présence de l'officier de police judiciaire avisé et arrivé sur place, fouille : découverte de ${objet} dans la poche ${pk(rr, ["droite du blouson", "kangourou du sweat", "gauche du pantalon"])}.`) : p("Palpation de sécurité : aucun objet dangereux. Aucun téléphone ni bijou correspondant à l'objet dérobé n'est découvert sur l'intéressé."),
        ...(N.conc || []).filter((c) => c.inf !== "arme_b").map((c) => p({ t: c.constat, f: c.fait })),
        p({ t: `Interpellation à ${hm(E.interp)}.`, paire: irr("heures") ? "heures" : undefined, f: "G_interp" }),
        irr("interprete")
          ? [p({ t: `La personne s'exprime avec difficulté en français ; ${il(A)} est ${A.etranger}. Ses réponses se font par gestes et par mots isolés.`, f: "G_langue", paire: "interprete" }), tenueA ? p(`${n(A)} est vêtu${e(A)} ${tenueA}.`) : null]
          : p(`La personne décline son identité : ${n(A)}, ${A.age} ans, ${A.metier}${tenueA ? `, vêtu${e(A)} ${tenueA}` : dou("doute_ident") ? `, vêtu${e(A)} d'${pk(rr, ["un blouson noir et d'un jean", "un manteau beige", "un sweat blanc à capuche"])}` : ""}.`),
        irr("controle_identite") ? null : p(sv.reconnait === "oui" ? `La victime, conduite sur place, déclare reconnaître l'individu « à sa tenue et à sa silhouette ».` : sv.reconnait === "pense" ? "La victime, conduite sur place, déclare « penser » reconnaître l'individu, sans en être certaine." : `La victime, conduite sur place, déclare ne pas pouvoir être certain${e(V)} qu'il s'agit de l'auteur, ne l'ayant vu${e(A)} que ${sv.vu}.`),
        S.video || has("video") ? p(`La sortie de la station${S.lieu.station ? " " + S.lieu.station.nom : ""} est équipée d'une caméra de vidéoprotection de la RATP.`) : null,
        t.camera ? p({ t: "Une caméra privée est fixée sur la façade du commerce voisin.", f: "G_camera" }) : !(S.video || has("video")) ? p("Aucune caméra n'est relevée à proximité.") : null,
        p(`Conduite au ${commLong} ; présentation à l'officier de police judiciaire de quart, ${OPJ.signe.replace(/^B/, "b").replace(/^L/, "l").replace(/^C/, "c").replace(/^M/, "m")}, à ${hm(E.presentation)}.`),
        bav(stA) ? p("Au cours du transport, l'intéressé garde le silence. Aucune déclaration spontanée n'est recueillie.") : null,
      ];
      const clos = E.presentation + int(rr, 15, 40);
      return DOCS.pv({ cote: cote("pv_interpellation"), proc: t.proc, service, unite, cadre: "FLAGRANT DÉLIT", titre: "Procès-verbal d'interpellation", titreLong: "Procès-verbal d'interpellation", numPV: "00" + int(rr, 101, 899),
        jour: j(clos), heure: clos, redacteur: apj(0), visa: "Vu les articles 53, 73 et 21 du code de procédure pénale,", lieu: "Agissant en flagrant délit", objet: "OBJET : vol avec violence — interpellation",
        blocs, cloture: mention(`Dont procès-verbal, fait et clos au ${commLong} ${at(clos)}.`), signataires: [`${apj(0).signe}, agent de police judiciaire`, `${apj(1).signe}, agent de police judiciaire`], st: stA });
    });

    // ================================================================ D : placement en garde à vue et notification des droits
    add("pv_notification", E.presentation + 1, "Notification des droits", () => {
      const rr = CR.seeded(t.sig + ":d:notif");
      const notifTexte = irr("interprete")
        ? { t: `À ${hm(E.debut + 15)}, notifions à ${n(A)} ses droits, en langue française ; ${il(A)} déclare comprendre et signe.`, f: "G_notif_fr", flag: "interprete" }
        : { t: `À ${hm(E.notif)}, notifions à ${n(A)} ses droits : être examiné par un médecin, faire prévenir un proche et son employeur, être assisté par un avocat, être assisté par un interprète, faire des déclarations, répondre aux questions ou se taire.`, f: "G_notif_pv", flag: irr("gav_notif") ? "gav_notif" : undefined };
      const fam = S.famille, med = S.medecin;
      const avant = [p(!PL ? `Constatons la présentation devant nous, à ${hm(E.presentation)}, de la personne interpellée ${lieu.replace(/, à hauteur.*$/, "")} par ${apjTxt(0)} et ${apjTxt(1)}, dont l'identité suit :`
        : S.venue === "domicile" ? `Constatons la présentation devant nous, à ${hm(E.presentation)}, de la personne interpellée à son domicile, ${A.adresse}, par ${apjTxt(0)} et ${apjTxt(1)}, dont l'identité suit :`
        : `Constatons la présence au service, à ${hm(E.presentation)}, sur convocation, de la personne mise en cause dans l'enquête préliminaire ouverte sur plainte${V ? " de " + nf(V) : ""}, dont l'identité suit :`)];
      const blocs = [
        p({ t: `Placement en garde à vue de ${n(A)}, né${e(A)} ${A.naissance}, ${A.metier}, décidé par l'officier de police judiciaire, avec effet à ${hm(C.debut)}${irr("heures") ? ", heure de sa présentation à l'officier de police judiciaire" : PL && S.venue === "convocation" ? ", heure de son arrivée au service" : ", heure de l'interpellation"}.`, f: "G_debut", flag: irr("heures") ? "heures" : undefined }),
        p(`Motifs : il existe des raisons plausibles de soupçonner qu'${il(A)} a commis ou tenté de commettre ${q0.label.startsWith("vol") ? "un vol" : `des faits de ${q0.label}`}, délit puni d'une peine d'emprisonnement, le ${DOCS.date(jf)} vers ${hm(S.T0)}, ${lieu}. La mesure constitue l'unique moyen de permettre l'exécution des investigations impliquant sa présence (1°), de garantir sa présentation devant le procureur de la République (2°)${V || T ? " et d'empêcher toute pression sur la victime et les témoins (4°)" : " et d'empêcher la modification des preuves et indices matériels (3°)"} (art. 62-2).`),
        p({ t: `Avis au procureur de la République à ${hm(E.avisPq)}.`, flag: irr("avis_parquet") ? "avis_parquet" : undefined }),
        p(`L'avis, adressé par courriel à la permanence du ${parquet.replace(/^Parquet/, "parquet")}, comporte la qualification notifiée et les motifs du placement.`),
        p([notifTexte]),
        p(`Lui faisons connaître, en outre, la qualification, la date et le lieu présumés de l'infraction qu'${il(A)} est soupçonné${e(A)} d'avoir commise, la durée de la mesure et la prolongation dont elle peut faire l'objet, le droit de consulter les pièces mentionnées à l'article 63-4-1 et de présenter des observations au magistrat qui se prononcera sur une éventuelle prolongation.`),
        p({ t: "Interprète : sans objet, la personne déclarant comprendre le français.", flag: irr("interprete") ? "interprete" : undefined }),
        p("Lui remettons le document énonçant ses droits (art. 803-6), qu'elle est autorisée à conserver pendant toute la durée de la mesure."),
        titre("RÉPONSES DE LA PERSONNE"),
        ligne("Faire prévenir un proche", fam.demande ? `oui, ${fam.qui}` : "non"),
        A.emploi ? ligne("Faire prévenir son employeur", ch(rr, 0.3) ? "oui" : "non") : null,
        ligne("Être examiné par un médecin", med.demande ? "oui" : "non, pour le moment"),
        p({ t: `La personne demande l'assistance d'un avocat commis d'office. Avis à la permanence des avocats à ${hm(E.avisAv)}.`, paire: irr("sans_avocat") ? "sans_avocat" : undefined }),
        ligne("Être assistée d'un interprète", "non"),
        ligne("Droit de se taire", "dont acte"),
        bav(stO) ? p("La personne déclare avoir compris l'ensemble de ses droits et ne pas avoir de question.") : null,
      ];
      return DOCS.pv({ cote: cote("pv_notification"), proc: t.proc, service, unite, cadre: "FLAGRANT DÉLIT", titre: "Procès-verbal de placement en garde à vue et de notification des droits", qualite: "Personne gardée à vue", numPV: "00" + int(rr, 101, 899),
        jour: C.jg, heure: Math.max(C.debut, E.interp) + 10, redacteur: OPJ, visa: `Vu les articles 62-2, 63, 63-1 à 63-4-3${PL ? ", 77" : ""} et 803-6 du code de procédure pénale ; vu ${PL ? (S.venue === "domicile" ? "l'enquête préliminaire et le procès-verbal d'interpellation" : "l'enquête préliminaire en cours") : "le procès-verbal d'interpellation"},`, lieu: `Nous trouvant au ${commLong}`,
        avantIdentite: avant, identite: identite(A, { famille: A.enfants ? `${A.enfants} enfant${A.enfants > 1 ? "s" : ""}` : "sans enfant" }), blocs,
        cloture: mention(`Dont procès-verbal, que la personne signe avec nous après lecture faite par ${lui(A)}-même.`),
        signataires: [{ qui: `${OPJ.signe}, officier de police judiciaire`, t: "signé" }, { qui: "La personne gardée à vue", t: "signé" }, { qui: "L'interprète (le cas échéant)", t: "", flag: irr("interprete") ? "interprete" : undefined }], st: stO });
    });

    // ================================================================ D : déclaration des droits (formulaire remis)
    add("declaration_droits", (irr("interprete") ? E.debut + 15 : E.notif) + 1, "Déclaration des droits", () => DOCS.forme({
      title: "Déclaration des droits remise à une personne placée en garde à vue — droit commun (art. 63-1 et 803-6)", cote: cote("declaration_droits"), entete: [unite, `Procédure n° ${t.proc} — cote ${cote("declaration_droits")}`],
      blocs: [
        p("Les informations ci-dessous doivent vous être données dans une langue que vous comprenez. Vous pouvez conserver ce document pendant toute la durée de la garde à vue."),
        ligne("Faits et motifs", "vous êtes soupçonné(e) d'avoir commis ou tenté de commettre une infraction punie d'emprisonnement ; la qualification, la date et le lieu présumés vous sont notifiés"),
        ligne("Durée", "vingt-quatre heures au plus, prolongeable une fois de vingt-quatre heures sur autorisation écrite et motivée du procureur de la République"),
        ligne("Faire prévenir", "un proche, votre employeur, les autorités consulaires de votre pays ; l'avis est donné dans les trois heures, sauf circonstance insurmontable"),
        ligne("Médecin", "vous pouvez demander à être examiné(e) par un médecin"),
        ligne("Avocat", "vous pouvez être assisté(e) par un avocat, choisi ou commis d'office, dès le début de la mesure ; entretien confidentiel de trente minutes ; présence aux auditions et confrontations"),
        ligne("Interprète", "si vous ne parlez pas ou ne comprenez pas le français"),
        ligne("Silence", "après avoir décliné votre identité, vous pouvez faire des déclarations, répondre aux questions ou vous taire"),
        ligne("Pièces", "vous pouvez consulter le procès-verbal de notification de vos droits, le certificat médical et les procès-verbaux de vos auditions"),
        ligne("Observations", "vous pouvez présenter des observations au magistrat qui statue sur la prolongation de la mesure"),
        mention(`Document remis ${at(irr("interprete") ? E.debut + 15 : E.notif)}. Reçu par la personne gardée à vue.`),
      ], sigs: ["La personne gardée à vue", `${OPJ.signe}, officier de police judiciaire`] }));

    // ================================================================ D : billet de garde à vue (avis au parquet)
    add("avis_parquet", E.avisPq, "Avis au parquet", () => DOCS.forme({
      title: "Billet de garde à vue — avis au procureur de la République", cote: cote("avis_parquet"), entete: [unite, `À : ${parquet} — permanence`, `Procédure n° ${t.proc} — cote ${cote("avis_parquet")}`],
      blocs: [
        ligne("Personne placée en garde à vue", `${A.nom.toUpperCase()} ${A.prenom}, né${e(A)} ${A.naissance}`),
        ligne("Début de la mesure", `${DOCS.date(C.jg)}, ${hm(C.debut)}`),
        ligne("Qualification notifiée", q0.label),
        ligne("Motifs (art. 62-2)", V || T ? "1°, 2° et 4°" : "1°, 2° et 3°"),
        ligne("Officier de police judiciaire", OPJ.signe),
        p({ t: `Avis au procureur de la République à ${hm(E.avisPq)}.`, flag: irr("avis_parquet") ? "avis_parquet" : undefined }),
        mention("Transmis par courriel à l'adresse de la permanence du parquet."),
      ], sigs: [`${OPJ.signe}, officier de police judiciaire`] }));

    // ================================================================ D : avis à la famille
    if (S.famille.demande) add("avis_famille", S.famille.h, "Avis à la famille", () => DOCS.pv({
      cote: cote("avis_famille"), proc: t.proc, service, unite, titre: "Procès-verbal d'avis à famille", jour: j(S.famille.h), heure: S.famille.h, redacteur: OPJ, visa: "Vu l'article 63-2 du code de procédure pénale,", lieu: `Nous trouvant au ${commLong}`,
      blocs: [
        p(`Conformément à la demande de ${n(A)}, placé${e(A)} en garde à vue, contactons par téléphone ${S.famille.qui}, au numéro communiqué par l'intéressé${e(A)}.`),
        S.famille.carence ? p("La ligne bascule sur une messagerie. Laissons un message indiquant que la personne est placée en garde à vue au service, sans autre précision. Nouvel appel quinze minutes plus tard, sans réponse.") : p("Notre correspondant est avisé de la mesure de garde à vue, sans autre précision sur les faits."),
      ], cloture: mention("Dont procès-verbal."), st: stO }));

    // ================================================================ D : avis à l'avocat
    add("avis_avocat", E.avisAv, "Avis à l'avocat", () => {
      const rr = CR.seeded(t.sig + ":d:avav");
      const rappel = E.avisAv + int(rr, 8, 35);
      return DOCS.pv({ cote: cote("avis_avocat"), proc: t.proc, service, unite, titre: "Procès-verbal d'avis à avocat", jour: j(E.avisAv), heure: E.avisAv, redacteur: OPJ, visa: "Vu les articles 63-3-1 et 63-4 du code de procédure pénale,", lieu: `Nous trouvant au ${commLong}`,
        blocs: [
          p(`${n(A)} ayant demandé l'assistance d'un avocat commis d'office, avisons par téléphone la permanence pénale du barreau${SF.paris ? " de Paris" : ""} à ${hm(E.avisAv)}.`),
          t.genre === "gav" ? p("La permanence nous indique qu'un avocat va être désigné et prendra contact avec le service.")
            : irr("sans_avocat") ? p(`À ${hm(rappel)}, la permanence nous indique que ${av} est désigné${/^Me (Léa|Sarah|Claire|Inès|Nadia)/.test(av) ? "e" : ""}. Aucune heure d'arrivée ne nous est communiquée.`)
            : p(`À ${hm(rappel)}, ${av}, désigné par la permanence, nous rappelle et annonce son arrivée au service.`),
        ], cloture: mention("Dont procès-verbal."), st: stO });
    });

    // ================================================================ D : médecin (réquisition et certificat de compatibilité)
    if (S.medecin.demande) {
      add("requisition_medecin", S.medecin.req, "Réquisition à médecin", () => DOCS.forme({
        title: "Réquisition à personne qualifiée — examen médical en garde à vue", cote: cote("requisition_medecin"), entete: [unite, `Procédure n° ${t.proc} — cote ${cote("requisition_medecin")}`],
        blocs: [p(`Nous, ${OPJ.nom}, ${OPJ.qualite}, vu les articles 60 et 63-3 du code de procédure pénale, requérons le médecin de permanence ${SF.paris ? "de l'unité médico-judiciaire" : "de SOS Médecins"} à l'effet d'examiner ${n(A)}, placé${e(A)} en garde à vue, de se prononcer sur l'aptitude au maintien de la mesure et de procéder à toutes constatations utiles.`), mention(`Fait ${at(S.medecin.req)}.`)],
        sigs: [`${OPJ.signe}, officier de police judiciaire`] }));
      add("certificat_gav", S.medecin.examen, "Certificat de garde à vue", () => {
        const rr = CR.seeded(t.sig + ":d:cgav");
        return DOCS.forme({ title: "Certificat médical — examen d'une personne gardée à vue", kind: "courrier", cote: cote("certificat_gav"), entete: [SF.paris ? TJ.umj : "Médecin requis", `Réquisition de l'officier de police judiciaire — procédure n° ${t.proc}`],
          blocs: [
            p(`Je soussigné${pk(rr, ["", "e"])}, Dr ${pk(rr, ["Hugo Lemaire", "Amina Saïdi", "Paul Ferrand", "Claire Bouvier"])}, certifie avoir examiné ${at(S.medecin.examen)}, dans les locaux du ${commLong}, ${n(A)}, ${A.age} ans.`),
            p(`Antécédents déclarés : ${pk(rr, ["aucun", "asthme dans l'enfance, sans traitement", "consommation occasionnelle de cannabis"])}. Traitement en cours : ${pk(rr, ["aucun", "aucun déclaré"])}.`),
            p(`Examen : personne consciente, orientée, calme. ${pk(rr, ["Aucune lésion traumatique récente.", "Égratignure superficielle de la paume gauche, que l'intéressé attribue à une chute antérieure aux faits.", "Aucune trace de coup."])}`),
            p("Conclusion : état de santé compatible avec la garde à vue dans les locaux du service."),
          ], sigs: ["Le médecin requis"] });
      });
    }

    // ================================================================ D : audition de la victime (plainte)
    if (S.arrachage) add("pv_victime", E.victime, "Audition de la victime", () => {
      const rr = CR.seeded(t.sig + ":d:vict");
      const sv = S.savoirs.V;
      // la plainte du catalogue, sans ce que la victime ne peut pas encore savoir (l'ITT est fixée le lendemain)
      const pl = (N.plainte || []).map((x) => guill(x).replace(/\s*Le médecin a fixé l'ITT à \d+ jours?\.?/, "").trim()).filter(Boolean);
      const dmn = pk(rr, ["Je rentrais chez moi", "J'allais prendre le métro", "Je sortais de mon travail", "J'allais retrouver une amie"]);
      const blocs = [
        p("Entendons la personne dénommée ci-dessus, qui nous déclare :"),
        decl({ t: `« ${pl[0] || `Je marchais en téléphonant. Quelqu'un m'a arraché ${objet}.`} »`, f: "G_plainte" }),
        decl(`« ${dmn}. J'étais ${lieu}, vers ${hm(S.T0)}. ${ob.type === "telephone" ? "Je parlais au téléphone, l'appareil à l'oreille droite." : ob.type === "chaine" ? "Je téléphonais ; je portais ma chaîne au cou, par-dessus mon pull." : "Je téléphonais ; j'avais le bras le long du corps."} Je n'ai rien vu venir. J'ai senti quelqu'un derrière moi, puis ${ob.type === "chaine" ? "une traction violente sur mon cou" : ob.type === "poignet" ? "on m'a saisi le poignet" : "on m'a arraché le téléphone de la main"}. »`),
        S.dit.violence ? decl(`« ${Il(A)} a tiré fort, j'ai perdu l'équilibre et je suis tombé${e(V)} sur le trottoir. ${S.itt ? `J'ai mal ${pk(rr, ["au genou et au cou", "à l'épaule", "au coude et à la main"])}.` : ""} »`) : decl(`« Il ne m'a pas touché${e(V)}, il a juste pris et il est parti. J'ai eu très peur. »`),
        decl(`« Je l'ai vu${e(A)} ${sv.vu}. ${sv.tenue ? `${Il(A)} portait ${sv.tenue.texte}.` : `${Il(A)} était habillé${e(A)} en sombre.`} ${Il(A)} avait ${sv.age}, ${sv.taille}. ${Il(A)} est parti${e(A)} ${S.fuite === "pied" ? "en courant" : S.fuite === "scooter" ? "sur un scooter qui l'attendait" : "sur une trottinette"} ${S.direction}. »`),
        decl(`« ${T ? `${T.g === "f" ? "Une passante" : "Un passant"} m'a aidé${e(V)} et m'a prêté son téléphone pour appeler la police.` : "J'ai appelé la police avec le téléphone d'un passant."} La patrouille est arrivée très vite. »`),
        ...pl.slice(1).map((x) => decl(`« ${x} »`)),
        titre("QUESTIONS ET RÉPONSES"),
        q("Pouvez-vous décrire le visage de l'individu ?"), rep(sv.reconnait === "non" ? "Non, je ne l'ai pas vu de face." : "Pas vraiment. Je l'ai surtout vu de côté, avec sa tenue."),
        q("Aviez-vous déjà vu cette personne ?"), rep("Jamais."),
        dou("doute_ident")
          ? [q(`Seriez-vous en mesure de ${le(A)} reconnaître ?`), rep({ t: `${Il(A)} portait ${pk(rr, ["un survêtement rouge", "une doudoune verte", "un bob noir et des lunettes"])}. Je ne l'avais jamais vu${e(A)}. Je ne suis pas sûr${e(V)} de pouvoir le reconnaître.`, f: "G_doute_ident" })]
          : [q("La patrouille vous a présenté une personne interpellée. L'avez-vous reconnue ?"), rep(sv.reconnait === "oui" ? `Oui, c'est ${lui(A)}, j'en suis sûr${e(V)}` + " : la même tenue, la même silhouette." : `Je pense que c'est ${lui(A)}, à ses vêtements. Je ne peux pas le jurer.`)],
        q(`Quelle est la valeur de ${lobjet} ?`), rep(`Environ ${CR.money(ob.valeur)}. ${ob.type === "telephone" ? "Je l'ai acheté il y a un an, j'ai la facture." : "C'est un cadeau de ma famille, je peux retrouver la facture."}`),
        ob.retrouve ? [q("L'objet vous a-t-il été restitué ?"), rep("On m'a dit qu'il avait été retrouvé sur lui. Je souhaite le récupérer.")] : [q("L'objet vous a-t-il été restitué ?"), rep("Non. Jamais.")],
        S.itt ? [q("Avez-vous été blessé(e) ?"), rep(`Oui. Je vais aller voir un médecin.${t.quoi === "itt" ? "" : ""}`)] : [q("Avez-vous été blessé(e) ?"), rep("Non, juste choqué" + e(V) + ".")],
        t.quoi === "itt" ? decl({ t: `« Aux urgences, le médecin m'a donné ${t.f.itt} jours d'arrêt. »`, f: "G_itt_urg" }) : null,
        q("Déposez-vous plainte ?"), rep("Oui, je dépose plainte contre l'auteur."),
        p("Informons la victime de ses droits (art. 10-2) : obtenir réparation de son préjudice, se constituer partie civile, être assistée d'un avocat, être aidée par un service d'aide aux victimes, saisir le cas échéant la commission d'indemnisation des victimes d'infractions."),
        S.itt ? p(`Lui remettons une réquisition à l'effet d'être examiné${e(V)} par l'unité médico-judiciaire.`) : null,
      ];
      return DOCS.pv({ cote: cote("pv_victime"), proc: t.proc, service, unite, titre: "Procès-verbal d'audition de la victime", qualite: "Victime", numPV: "00" + int(rr, 101, 899), jour: j(E.victime), heure: E.victime, redacteur: OPJ,
        lieu: `Nous trouvant au ${commLong}`, identite: identite(V), blocs, cloture: DOCS.clotureAudition(ville, j(E.victimeFin), E.victimeFin, il(V) === "elle" ? "elle" : "lui"), signataires: ["La personne entendue", `${OPJ.signe}, officier de police judiciaire`], st: stO });
    });

    // ================================================================ D : audition du témoin
    if (S.arrachage && has("temoin") && T) add("pv_temoin", E.temoin, "Audition du témoin", () => {
      const rr = CR.seeded(t.sig + ":d:tem");
      const sT = S.savoirs.T;
            const blocs = [
        p("Entendons la personne dénommée ci-dessus, qui nous déclare :"),
        decl(`« J'étais ${sT.ou}, vers ${hm(S.T0)}. ${pk(rr, ["J'attendais quelqu'un.", "J'attendais mon bus.", "Je fumais une cigarette."])} J'ai vu ${V.g === "f" ? "une femme" : "un homme"} qui marchait en téléphonant, et ${A.g === "f" ? "une jeune femme" : "un jeune"} qui arrivait derrière ${lui(V)}, vite. »`),
        decl(`« ${Il(A)} a ${ob.type === "chaine" ? "arraché la chaîne qu'" + il(V) + " portait au cou" : ob.type === "poignet" ? "attrapé " + le(V) + " par le poignet et arraché ce qu'" + il(V) + " portait" : "arraché le téléphone qu'" + il(V) + " tenait à l'oreille"}${S.violence ? `, ${il(V)} a été entraîné${e(V)} et ${il(V)} est tombé${e(V)}` : ""}. ${Il(A)} était seul${e(A)}. ${Il(A)} est parti${e(A)} ${S.fuite === "pied" ? "en courant" : S.fuite === "scooter" ? "sur un scooter" : "sur une trottinette"} ${S.direction}. »`),
        S.tenueA && !sT.contra ? decl(`« ${Il(A)} portait ${parle(S.tenueA)}. »`) : null,
        sT.contra ? decl({ t: `« ${pk(rr, ["Je ne suis pas sûr que ce soit lui ; il y avait beaucoup de monde.", "Celui qui a pris le téléphone était plus grand, je crois.", "Je l'ai vu de dos seulement."])} »`, f: "G_temoin_contra" }) : null,
        sT.sansViolence ? decl({ t: `« ${Il(A)} a pris ${ob.type === "telephone" ? "le téléphone" : "le bijou"} et ${il(A)} est parti${e(A)}${S.fuite === "pied" ? " en courant" : ""}. ${Il(A)} ne l'a pas touché${e(V)}. »`, f: "G_sans_violence" }) : null,
        titre("QUESTIONS ET RÉPONSES"),
        q("À quelle distance vous trouviez-vous ?"), rep(pk(rr, ["Une dizaine de mètres.", "Quinze mètres, peut-être vingt.", "Assez près, cinq ou six mètres."])),
        q("L'éclairage était-il suffisant ?"), rep(S.T0 > 18 * 60 || S.T0 < 7 * 60 ? "Il y a des réverbères, mais il faisait nuit." : "Oui, il faisait jour."),
        q("Pourriez-vous reconnaître l'individu ?"), rep(sT.contra ? "Honnêtement, je ne crois pas." : pk(rr, ["Sa tenue, oui. Son visage, je ne sais pas.", "Peut-être, je l'ai vu de profil."])),
        q("Connaissez-vous la victime ou l'auteur ?"), rep("Non, ni l'un ni l'autre."),
      ];
      return DOCS.pv({ cote: cote("pv_temoin"), proc: t.proc, service, unite, titre: "Procès-verbal d'audition de témoin", qualite: "Témoin", numPV: "00" + int(rr, 101, 899), jour: j(E.temoin), heure: E.temoin, redacteur: OPJ, lieu: `Nous trouvant au ${commLong}`,
        identite: { nom: T.nom, prenom: T.prenom, g: T.g, adresse: T.adresse, metier: T.metier }, blocs, cloture: DOCS.clotureAudition(ville, j(E.temoinFin), E.temoinFin, T.g === "f" ? "elle" : "lui"), signataires: ["La personne entendue", `${OPJ.signe}, officier de police judiciaire`], st: stO });
    });

    // ================================================================ D : scellé et restitution
    if (S.arrachage && ob.retrouve) {
      add("pv_scelle", E.scelle, "Saisie et scellé", () => DOCS.pv({ cote: cote("pv_scelle"), proc: t.proc, service, unite, titre: "Procès-verbal de saisie et de placement sous scellé", jour: j(E.scelle), heure: E.scelle, redacteur: OPJ, visa: vis("Vu les articles 54, 56 et 57 du code de procédure pénale,", "Vu les articles 76, 56 et 57 du code de procédure pénale,"), lieu: `Nous trouvant au ${commLong}`,
        blocs: [
          p(`En présence de ${n(A)}, saisissons ${objet} découvert lors de la fouille consécutive à son interpellation.`),
          p(`Le plaçons sous scellé n° UN, fermé, comprenant : ${objet}, ${ob.type === "telephone" ? "écran intact, coque de protection noire, appareil allumé, verrouillé par un code" : "en bon état apparent"}.`),
          p(`L'intéressé${e(A)} déclare : « ${t.stance === "reconnait" ? "C'est celui que j'ai pris." : t.stance === "minimise" ? "Je l'ai ramassé." : "Ce n'est pas à moi, je l'ai trouvé."} »`),
        ], cloture: mention("Dont procès-verbal, que la personne signe avec nous."), signataires: ["La personne gardée à vue", `${OPJ.signe}, officier de police judiciaire`], st: stO }));
      add("pv_restitution", E.restitution, "Restitution", () => DOCS.forme({ title: "Procès-verbal de restitution", cote: cote("pv_restitution"), entete: [unite, `Procédure n° ${t.proc} — cote ${cote("pv_restitution")}`],
        blocs: [p(`Sur instruction du procureur de la République, restituons à ${nf(V)}, qui en justifie la propriété par la présentation de la facture, ${objet} placé sous scellé n° UN. ${Il(V)} reconnaît son bien.`), mention(`Fait ${at(E.restitution)}.`)], sigs: ["La victime", `${OPJ.signe}, officier de police judiciaire`] }));
    }

    // ================================================================ D : UMJ (réquisition et certificat)
    if (S.arrachage && E.umj && t.f.itt != null) {
      const ittU = t.quoi === "itt" ? t.f2.itt : t.f.itt;
      add("requisition_umj", E.umj.req, "Réquisition à l'UMJ", () => DOCS.forme({ title: "Réquisition à personne qualifiée — examen de la victime", cote: cote("requisition_umj"), entete: [unite, `Procédure n° ${t.proc} — cote ${cote("requisition_umj")}`],
        blocs: [p(`Nous, ${OPJ.nom}, ${OPJ.qualite}, vu l'article ${PL ? "77-1" : "60"} du code de procédure pénale, requérons le médecin de l'${TJ.umj} à l'effet d'examiner ${nf(V)}, de décrire les lésions éventuelles, de dire si elles sont compatibles avec les faits déclarés et de fixer la durée de l'incapacité totale de travail.`), mention(`Fait ${at(E.umj.req)}.`)], sigs: [`${OPJ.signe}, officier de police judiciaire`] }));
      add("certificat", E.umj.examen, "Certificat de l'UMJ", () => {
        const rr = CR.seeded(t.sig + ":d:umj");
        const les = S.blessures.length ? S.blessures : ["pas de lésion traumatique récente objectivée"];
        return DOCS.forme({ title: "Certificat médical — unité médico-judiciaire", kind: "courrier", cote: cote("certificat"), schema: S.blessures.length ? S.blessures : null, entete: [`${TJ.umj} · AP-HP`, `Réquisition de l'officier de police judiciaire — procédure n° ${t.proc}`],
          blocs: [
            p(`Je soussigné${pk(rr, ["", "e"])}, Dr ${pk(rr, ["Élise Vannier", "Marc Dubreuil", "Nora Belhadj"])}, médecin légiste, certifie avoir examiné ${at(E.umj.examen)}, sur réquisition de ${OPJ.signe.toLowerCase().replace(OPJ.nom.toLowerCase(), OPJ.nom)} du ${DOCS.date(j(E.umj.req))}, une personne qui me dit s'appeler ${n(V)}, ${V.age} ans.`),
            titre("COMMÉMORATIFS"), p(`La personne déclare avoir été victime, le ${DOCS.date(jf)} vers ${hm(S.T0)}, de l'arrachage de ${objet} par un individu qui l'aurait ${S.dit.violence ? "entraîné" + e(V) + " au sol" : "surpris" + (V.g === "f" ? "e" : "") + " par derrière"}.`),
            titre("DOLÉANCES"), p(`« ${pk(rr, ["J'ai mal au genou quand je marche.", "J'ai du mal à dormir, je revois la scène.", "Mon épaule me fait mal quand je lève le bras."])} » ; appréhension à sortir seul${e(V)}.`),
            titre("EXAMEN CLINIQUE"), ...les.map((l) => p(Maj(l) + ".")), p("Pas d'autre lésion. Retentissement psychologique modéré, à réévaluer."),
            titre("CONCLUSION"),
            p({ t: `Conclusion : l'incapacité totale de travail, au sens pénal, est fixée à ${ittU}${ittU <= 8 ? ` (${["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit"][ittU]})` : ""} jour${ittU > 1 ? "s" : ""}, sous réserve de complications.`, f: t.quoi === "itt" ? "G_itt_umj" : "G_itt" }),
            mention("Certificat remis à la seule autorité requérante."),
          ], sigs: ["Le médecin légiste"] });
      });
    }

    // ================================================================ D : images (réquisition et exploitation)
    if (S.video && k.VID) {
      const X = k.VID.S, lis = X.lisible();
      add("requisition_video", E.reqVideo, "Réquisition RATP", () => DOCS.forme({ title: "Réquisition — images de vidéoprotection", cote: cote("requisition_video"), entete: [unite, `À : RATP, service de sûreté`, `Procédure n° ${t.proc} — cote ${cote("requisition_video")}`],
        blocs: [p(`Nous, ${OPJ.nom}, ${OPJ.qualite}, vu l'article 60-1 du code de procédure pénale, requérons le service de sûreté de la RATP de nous remettre, sur support numérique, les enregistrements de la caméra de la sortie de la station${S.lieu.station ? " " + S.lieu.station.nom : ""}, le ${DOCS.date(jf)}, de ${hm(S.T0 - 10)} à ${hm(S.T0 + 15)}.`), p("Le défaut de réponse sans motif légitime est puni d'une amende de 3 750 euros."), mention(`Fait ${at(E.reqVideo)}.`)], sigs: [`${OPJ.signe}, officier de police judiciaire`] }));
      add("pv_video", E.video, "Exploitation vidéo", () => {
        const hsx = (h) => { const [hh, mm, ss] = h.split(" ")[1].split(":"); return `${+hh} h ${mm} min ${ss} s`; };
        const vue = { ir: "de nuit, l'image est en infrarouge, en noir et blanc", soir: "de nuit, l'image est en couleur, sous l'éclairage public", jour: "l'image est en couleur" }[X.mode];
        return DOCS.pv({ cote: cote("pv_video"), proc: t.proc, service, unite, titre: "Procès-verbal d'exploitation des images de vidéoprotection", jour: j(E.video), heure: E.video, redacteur: OPJ, lieu: `Nous trouvant au ${commLong}`, video: k.VID.spec,
          blocs: [
            p(`Procédons à l'exploitation de l'enregistrement remis par le service de sûreté de la RATP en exécution de notre réquisition, sur clé USB placée sous scellé n° ${ob.retrouve ? "DEUX" : "UN"}, horodatage du ${DOCS.num(jf)}.`),
            p(`La caméra, fixée en hauteur, filme en plongée le trottoir et la sortie de la station ; ${vue}, à ${X.fps} images par seconde. L'horloge de l'enregistreur est réputée à l'heure légale.`),
            ...X.moments.map((m) => p(`${hsx(m.h)} — ${m.txt}`)),
            p(`L'individu porte ${lis.A.image.replace(/^(\S+)/, (w) => (/^(doudoune|veste)/.test(lis.A.image) ? "une " : "un ") + w)}.`),
            dou("doute_ident") ? p({ t: "La qualité des images ne permet pas de distinguer les traits du visage de l'auteur ; sa silhouette et ses vêtements sont visibles.", f: "G_doute_ident" }) : p({ t: `La silhouette, les vêtements et la démarche correspondent à ceux de ${n(A)} lors de son interpellation.`, f: "G_video" }),
            t.quoi === "violence" ? p({ t: "Aucun geste de violence n'est visible : l'objet est saisi d'un geste rapide, la victime n'est pas touchée.", f: "G_sans_violence" }) : null,
            X.sauts.length ? p(`L'enregistrement présente ${X.sauts.length === 1 ? "une interruption" : X.sauts.length + " interruptions"} : ${X.sauts.map(([a0, b0]) => `de ${hsx(X.horodatage(a0))} à ${hsx(X.horodatage(b0))}`).join(", ")}.`) : null,
            p("Une planche de captures est jointe ; les images utiles sont gravées sur un disque placé sous scellé."),
          ], cloture: mention("Dont procès-verbal."), st: stO });
      });
    }

    // ================================================================ D : audition de la personne gardée à vue (dossier de jugement)
    if (t.genre !== "gav") {
      if (S.arrachage) add("pv_audition", E.aud, "Audition en garde à vue", () => {
        const rr = CR.seeded(t.sig + ":d:aud");
        const N1 = (N.audition || [])[0];
        const nie = t.stance === "nie", min = t.stance === "minimise";
        const repFaits = N1 ? N1.a.expliquer : nie ? "Je n'ai rien volé." : "Oui.";
        const premier = ob.retrouve || !nie ? repFaits : "Je n'ai rien pris. Je ne sais pas de quoi vous parlez.";
        const blocs = [
          irr("sans_avocat") ? p({ t: `${av}, avocat commis d'office, avisé à ${hm(C.avisAv)}, ne s'étant pas présenté, procédons à l'audition.`, flag: "sans_avocat" }) : p(`En présence de ${av}, avocat, qui s'est entretenu avec la personne pendant trente minutes, de ${hm(E.aud - 35)} à ${hm(E.aud - 5)}.`),
          p(`Rappelons à la personne qu'elle a le droit, après avoir décliné son identité, de faire des déclarations, de répondre aux questions qui lui sont posées ou de se taire.`),
          titre("SUR LA PERSONNALITÉ"),
          q("Quelle est votre situation familiale ?"), rep(A.enfants ? `Je vis avec ${moi(A.proche) || "ma famille"}, j'ai ${A.enfants} enfant${A.enfants > 1 ? "s" : ""}.` : A.proche ? `Je vis avec ${moi(A.proche)}.` : "Je vis seul" + e(A) + "."),
          q("Où demeurez-vous ?"), rep(A.heberg ? `${A.adresse}. Depuis ${pk(rr, ["deux ans", "cinq ans", "toujours"])}.` : "Je n'ai pas d'adresse fixe en ce moment, je dors chez des amis."),
          q("Quelles sont vos ressources ?"), rep(A.emploi ? `Je suis ${A.metier}, je gagne environ ${CR.money(A.revenu || 1500)} par mois.` : "Je n'ai pas de travail en ce moment."),
          q("Avez-vous déjà été condamné(e) ?"), rep(A.casier ? (t.rec ? "Oui, pour un vol, il y a un an et demi." : "Une fois, il y a longtemps.") : "Jamais."),
          titre("SUR LES FAITS"),
          q(`Où vous trouviez-vous le ${DOCS.date(jf)} vers ${hm(S.T0)} ?`), rep(nie ? `Je me promenais ${lieu.replace(/, à hauteur.*$/, "")}, je rentrais chez moi.` : `J'étais ${lieu.replace(/, à hauteur.*$/, "")}.`),
          q("Comment étiez-vous habillé(e) ?"), rep(S.tenueA ? `Comme maintenant : ${parle(S.tenueA).replace(", capuche relevée", "")}.` : "Comme maintenant."),
          q(`Selon la victime, un individu correspondant à votre signalement lui a arraché ${objet} ${ob.type === "chaine" ? "qu'" + il(V) + " portait au cou" : ob.type === "poignet" ? "qu'" + il(V) + " portait au poignet" : "qu'" + il(V) + " tenait à l'oreille"}. Reconnaissez-vous avoir pris cet objet ?`),
          rep({ t: premier, f: !nie ? "G_aveu" : undefined }),
          ob.retrouve ? [q(`${Maj(lobjet)} a été ${/^la /.test(lobjet) ? "découverte" : "découvert"} dans votre poche lors de votre interpellation. Comment l'expliquez-vous ?`), rep(nie ? "Je l'ai trouvé par terre, je voulais le rapporter." : min ? "Je l'ai ramassé, je ne sais pas pourquoi j'ai fait ça." : "Je l'avais pris, c'est vrai.")] : [q("L'objet n'a pas été retrouvé sur vous. Où se trouve-t-il ?"), rep(nie ? "Je ne l'ai jamais eu." : "Je l'ai jeté en courant, j'ai paniqué.")],
          S.dit.violence ? [q(`La victime déclare avoir été entraîné${e(V)} au sol. Qu'en dites-vous ?`), rep(nie ? "Ce n'est pas moi." : `Je n'ai pas voulu ${le(V)} faire tomber. J'ai tiré, c'est tout.`)] : null,
          S.video && !S.videoApresAudition ? [q("Les images de la caméra de la station montrent un individu vêtu comme vous. Qu'avez-vous à dire ?"), rep(nie ? "Beaucoup de gens s'habillent comme ça." : "C'est moi, oui.")] : null,
          (N.qA || []).length && !nie ? [q(N.qA[0].q), rep(N.qA[0].a[0])] : null,
          q("Avez-vous quelque chose à ajouter ?"), rep(nie ? "Je n'ai rien fait." : pk(rr, ["Je m'excuse auprès de la victime.", "Je veux rembourser.", "Je regrette."])),
          irr("sans_avocat") ? null : p(`${av} ${ch(rr, 0.5) ? "n'a pas de question à poser" : "demande que soit précisé le temps écoulé entre les faits et l'interpellation ; la personne répond qu'elle ne sait pas"}. ${ch(rr, 0.4) ? "Il présente des observations écrites, jointes au présent procès-verbal." : ""}`.trim()),
        ];
        return DOCS.pv({ cote: cote("pv_audition"), proc: t.proc, service, unite, titre: "Procès-verbal d'audition de la personne gardée à vue", qualite: "Personne gardée à vue", numPV: "00" + int(rr, 101, 899), jour: j(E.aud), heure: E.aud, redacteur: OPJ, lieu: `Nous trouvant au ${commLong}`,
          identite: identite(A), blocs, cloture: DOCS.clotureAudition(ville, j(E.audFin), E.audFin, il(A) === "elle" ? "elle" : "lui"), signataires: ["La personne entendue", irr("sans_avocat") ? null : `${av}, avocat`, `${OPJ.signe}, officier de police judiciaire`].filter(Boolean), st: stO });
      });
      // prolongation
      if (E.prolong || irr("prolongation")) {
        const rP = CR.seeded(t.sig + ":d:prol"), h24 = E.debut + 1440;
        const auth = irr("prolongation") ? h24 + int(rP, 25, 70) : h24 - int(rP, 40, 120);
        add("pv_prolongation", auth - 30, "Prolongation de la garde à vue", () => DOCS.pv({ cote: cote("pv_prolongation"), proc: t.proc, service, unite, titre: "Procès-verbal de prolongation de la garde à vue", jour: j(auth), heure: auth + 5, redacteur: OPJ, visa: "Vu les articles 63 et 63-1 du code de procédure pénale,", lieu: `Nous trouvant au ${commLong}`,
          blocs: [
            p(`Présentation de ${n(A)} au procureur de la République par visioconférence, à ${hm(auth - 30)}.`),
            p({ t: `Le ${DOCS.date(j(auth))}, à ${hm(auth)}, le procureur de la République autorise par écrit la prolongation de la garde à vue pour une durée de vingt-quatre heures, à compter de ${hm(h24)}.`, flag: irr("prolongation") ? "prolongation" : undefined }),
            p("Motif : poursuite des investigations et présentation au magistrat (art. 62-2 et 63)."),
            p("Notifions à la personne la prolongation de la mesure et lui rappelons qu'elle peut s'entretenir de nouveau avec un avocat et demander un examen médical."),
          ], cloture: mention("Dont procès-verbal, que la personne signe avec nous."), signataires: ["La personne gardée à vue", `${OPJ.signe}, officier de police judiciaire`], st: stO }));
      }
      // fin de garde à vue (déroulement, art. 64)
      add("pv_fin_gav", E.fin, "Fin de garde à vue", () => DOCS.pv({ cote: cote("pv_fin_gav"), proc: t.proc, service, unite, titre: "Procès-verbal de fin de garde à vue et de déroulement de la mesure", qualite: "Personne gardée à vue", jour: j(E.fin), heure: E.fin, redacteur: OPJ, visa: "Vu les articles 63-8 et 64 du code de procédure pénale,", lieu: `Nous trouvant au ${commLong}`,
        blocs: [
          titre("DÉROULEMENT DE LA MESURE"),
          ligne("Motifs", V || T ? "art. 62-2, 1°, 2° et 4°" : "art. 62-2, 1°, 2° et 3°"),
          ligne("Début de la mesure", `${DOCS.date(C.jg)} à ${hm(C.debut)}`),
          ligne("Notification des droits", hm(irr("interprete") ? E.debut + 15 : E.notif)),
          ligne("Avis au procureur", hm(E.avisPq)),
          S.famille.demande ? ligne("Avis à la famille", `${hm(S.famille.h)}${S.famille.carence ? " (messagerie)" : ""}`) : ligne("Avis à la famille", "non demandé"),
          ligne("Avis à l'avocat", hm(E.avisAv)),
          S.medecin.demande ? ligne("Examen médical", hm(S.medecin.examen)) : ligne("Examen médical", "non demandé"),
          ligne("Audition", `de ${hm(E.aud)} à ${hm(E.audFin)}`),
          ligne("Repos", `entre les actes, en cellule de garde à vue`),
          ligne("Repas proposés", E.repas.length ? E.repas.map((m) => hm(m)).join(", ") : "aucun pendant la mesure"),
          E.prolong || irr("prolongation") ? ligne("Prolongation", "autorisée par le procureur de la République (voir procès-verbal)") : null,
          ligne("Fouille intégrale", "non"),
          p(`À ${hm(E.fin)}, mettons fin à la mesure de garde à vue. ${issueTxt()}`),
          p("La personne émarge les mentions qui précèdent."),
        ], cloture: mention("Dont procès-verbal."), signataires: ["La personne gardée à vue", `${OPJ.signe}, officier de police judiciaire`], st: stO }));
      // synthèse et bordereau, composés quand les cotes sont connues
      add("pv_synthese", E.synthese, "Synthèse", () => {
        const liste = ordre.filter((o) => !["pv_synthese", "bordereau"].includes(o.key));
        return DOCS.pv({ cote: cote("pv_synthese"), proc: t.proc, service, unite, titre: "Procès-verbal de synthèse", jour: j(E.synthese), heure: E.synthese, redacteur: OPJ, lieu: `Nous trouvant au ${commLong}`,
          blocs: [
            titre("PRÉAMBULE"), p(PL ? `Le ${DOCS.date(j(E.plainte))}, ${V ? nf(V) + " dépose plainte" : "une plainte est déposée"} au ${commLong} pour des faits de ${q0.label}, commis le ${DOCS.date(jf)}. Une enquête préliminaire est ouverte. ${n(A)} est ${AL ? `entendu${e(A)} librement sur convocation le ${DOCS.date(j(E.aud))}` : `${S.venue === "domicile" ? `interpellé${e(A)} à son domicile le ${DOCS.date(C.jg)} à ${hm(E.interp)}` : `entendu${e(A)} sur convocation le ${DOCS.date(C.jg)}`} et placé${e(A)} en garde à vue à compter de ${hm(C.debut)}`}.` : S.arrachage ? `Le ${DOCS.date(jf)}, à ${hm(E.requis)}, une patrouille est requise pour un vol avec violence commis ${lieu}. ${n(A)} est interpellé${e(A)} à ${hm(E.interp)} et placé${e(A)} en garde à vue.` : `Le ${DOCS.date(jf)}, ${n(A)} est interpellé${e(A)} à ${hm(E.interp)}${lieu ? ", " + lieu.replace(/, à hauteur.*$/, "") : ""}, et ${AL ? `conduit${e(A)} au service, où ${il(A)} est entendu${e(A)} librement à ${hm(E.aud)}` : `placé${e(A)} en garde à vue à compter de ${hm(C.debut)}`}.`),
            titre("EXPOSÉ DES FAITS"), S.arrachage ? p(`${nf(V)} déclare s'être fait arracher ${objet} alors qu'${il(V)} marchait en téléphonant${S.dit.violence ? ", puis être tombé" + e(V) + " sur le trottoir" : ""}. ${ob.retrouve ? `L'objet est découvert sur ${n(A)} lors de la fouille.` : "L'objet n'est pas retrouvé."} ${n(A)} ${t.stance === "nie" ? "conteste les faits" : t.stance === "minimise" ? "reconnaît avoir eu l'objet en sa possession, sans reconnaître le vol" : "reconnaît les faits"}.`) : p(`${N.resume || ""} ${(S.constat || [])[0] || ""} ${n(A)} ${t.stance === "nie" ? "conteste les faits" : t.stance === "minimise" ? "minimise sa participation" : "reconnaît les faits"}.`.replace(/ de des /g, " des ").replace(/ de de /g, " de ").replace(/ de les /g, " des ").trim()),
            titre("ENQUÊTE"), ...liste.map((o) => p(`${o.court} (pièce n° ${cotes[o.key]}).`)),
            titre("CLÔTURE"),
            p(`De l'enquête effectuée, il ressort qu'il existe des raisons plausibles de présumer que l'infraction suivante a été commise et peut être retenue : ${q0.label}, faits prévus et réprimés par ${q0.court}.`),
            p(`En conséquence, nous faisons parvenir au procureur de la République la présente procédure, telle que le détail en figure au bordereau d'envoi${ob.retrouve ? ", le scellé ayant fait l'objet d'une restitution sur instruction" : ""}${S.issue && S.issue !== "defere" ? ", " + issueCourt() : ""}.`),
          ], cloture: mention("Dont procès-verbal."), st: stO });
      });
      add("bordereau", E.synthese + 10, "Bordereau d'envoi", () => DOCS.forme({ title: "Bordereau d'envoi de la procédure", kind: "greffe", cote: cote("bordereau"), entete: [unite, `À : ${parquet}`, `Procédure n° ${t.proc}`],
        blocs: [...ordre.filter((o) => o.key !== "bordereau").map((o) => ligne(cotes[o.key], o.court)), mention(`Procédure transmise ${at(E.synthese + 10)}${S.numerique ? " par voie dématérialisée, procédure pénale numérique (art. 801-1)" : ", en original et copie"}, ${AL ? "à l'issue de l'audition libre" : "à l'issue de la garde à vue"}, ${issueCourt()}.`)], sigs: [`${OPJ.signe}, officier de police judiciaire`] }));
    }

    // ================================================================ autres délits de flagrance : trames génériques
    if (!S.arrachage) {
      const contr = ["stups_usage", "stups_detention", "stups_trafic", "recel", "defaut_permis", "outrage", "rebellion", "violences_pdap"].includes(t.inf);
      const saisieTxt = N.saisie || "";
      // accord avec l'objet saisi : « deux manettes … découvertes », « une trottinette … découverte »
      const acc = ((x) => (/^(une|la) |^(des|les|deux|trois|quatre|cinq|six|plusieurs|\d+) (manettes|bouteilles|barquettes|paires|montres|chaînes|bagues|cartes|caisses|tablettes|consoles|trottinettes)\b/.test(x) ? "e" : "") + (/^(des|les|deux|trois|quatre|cinq|six|plusieurs|\d+)\s/.test(x) ? "s" : ""))(saisieTxt);
      // interpellation
      if (PL && S.gav) add("pv_interpellation", E.interp, S.venue === "domicile" ? "Interpellation" : "Présentation sur convocation", () => {
        const rr = CR.seeded(t.sig + ":g:interp");
        const dom = S.venue === "domicile";
        const clos = E.presentation + int(rr, 10, 30);
        const blocs = dom ? [
          p(`Sur instructions ${OPJ.grade ? "du " + OPJ.grade.toLowerCase() + " " + OPJ.nom : "de " + OPJ.nom}, officier de police judiciaire, dans le cadre de l'enquête préliminaire ouverte sur plainte${V ? " de " + nf(V) : ""}, en compagnie de ${apjTxt(1)},`),
          p(`Nous transportons au domicile de ${n(A)}, ${A.adresse}, où nous nous présentons à ${hm(E.interp - int(rr, 2, 6))}.`),
          p(pk(rr, [`${Maj(il(A))} nous ouvre la porte après plusieurs coups de sonnette.`, `${Maj(il(A))} vient ouvrir, en tenue de nuit.`, `${A.proche ? Maj(A.proche) + " nous ouvre et va " + le(A) + " chercher." : Maj(il(A)) + " nous ouvre."}`])),
          p(`Lui faisons connaître qu'${il(A)} est mis${e(A)} en cause dans une procédure pour des faits de ${q0.label} et qu'${il(A)} va être conduit${e(A)} devant l'officier de police judiciaire, qui décidera de son placement en garde à vue.`),
          p(`Interpellation à ${hm(E.interp)}.`),
          irr("interprete") ? p({ t: `La personne s'exprime avec difficulté en français ; ${il(A)} est ${A.etranger}. Ses réponses se font par gestes et par mots isolés.`, f: "G_langue", paire: "interprete" })
            : p(`La personne décline son identité : ${n(A)}, ${A.age} ans, ${A.metier}. ${Maj(il(A))} ${pk(rr, ["ne fait aucune difficulté", "demande à s'habiller, ce qui lui est accordé", "demande ce qu'on lui reproche, puis nous suit sans difficulté"])}.`),
          p("Palpation de sécurité : rien à signaler."),
          p(`Conduite au ${commLong} ; présentation à l'officier de police judiciaire, ${OPJ.signe.charAt(0).toLowerCase() + OPJ.signe.slice(1)}, à ${hm(E.presentation)}.`),
        ] : [
          p(`Convoqué${e(A)} par téléphone le ${DOCS.date(j(S.convocation))}, dans le cadre de l'enquête préliminaire ouverte sur plainte${V ? " de " + nf(V) : ""}, ${n(A)} se présente à l'accueil du service à ${hm(E.interp)}.`),
          irr("interprete") ? p({ t: `La personne s'exprime avec difficulté en français ; ${il(A)} est ${A.etranger}. Ses réponses se font par gestes et par mots isolés.`, f: "G_langue", paire: "interprete" })
            : p(`${Maj(il(A))} décline son identité : ${n(A)}, ${A.age} ans, ${A.metier}${bav(stO) ? pk(rr, [`, et déclare être venu${e(A)} seul${e(A)}`, `, et demande combien de temps cela va durer`, ""]) : ""}.`),
          p(`Lui faisons connaître qu'${il(A)} est mis${e(A)} en cause pour des faits de ${q0.label}, commis le ${DOCS.date(jf)}, et qu'au vu des éléments de l'enquête, une mesure de garde à vue est envisagée.`),
          p(`Décidons de son placement en garde à vue, à compter de ${hm(irr("heures") ? C.debut : E.interp)}, et procédons sur-le-champ à la notification de ses droits (procès-verbal distinct).`),
        ];
        return DOCS.pv({ cote: cote("pv_interpellation"), proc: t.proc, service, unite, titre: dom ? "Procès-verbal d'interpellation" : "Procès-verbal de présentation", numPV: "00" + int(rr, 101, 899),
          jour: j(clos), heure: dom ? clos : E.interp + int(rr, 3, 8), redacteur: dom ? apj(0) : OPJ, lieu: dom ? "Agissant en enquête préliminaire, en mission hors du service" : `Nous trouvant au ${commLong}`, objet: `OBJET : ${q0.label} — ${dom ? "interpellation au domicile" : "présentation sur convocation"}`,
          blocs, cloture: mention(`Dont procès-verbal, fait et clos au ${commLong} ${at(dom ? clos : E.interp + int(rr, 3, 8))}.`), signataires: dom ? [`${apj(0).signe}, agent de police judiciaire`, `${apj(1).signe}, agent de police judiciaire`] : [`${OPJ.signe}, officier de police judiciaire`, "La personne mise en cause"], st: dom ? stA : stO });
      });
      else if (!PL) add("pv_interpellation", E.interp, "Interpellation", () => {
        const rr = CR.seeded(t.sig + ":g:interp");
        const clos = E.presentation + int(rr, 15, 40);
        const blocs = [
          p(`Étant en patrouille portée à bord du véhicule sérigraphié ${S.indicatif}, revêtus de nos uniformes et porteurs de nos insignes, en compagnie de ${apjTxt(1)}, ${SF.paris ? `dans le ${SF.arr} arrondissement` : `à ${SF.nom}`},`),
          irr("controle_identite") ? p({ t: "Agissant dans le cadre d'une patrouille de sécurisation, remarquons un individu qui, à notre vue, détourne le regard et presse le pas. Procédons au contrôle de son identité.", flag: "controle_identite" })
            : contr && (!CR.CAT.INF[t.inf].controle || CR.CAT.INF[t.inf].controle(t.f)) ? p(`Agissant sur réquisitions écrites du procureur de la République en date du ${DOCS.date(jf - 1)}, prises en application de l'article 78-2, aux fins de recherche et de poursuite d'infractions à la législation sur les stupéfiants, le port d'armes et le vol, dans le périmètre du quartier.`) : null,
          ...(S.constat || []).map((x) => p(x)),
          ...(N.conc || []).filter((c) => c.inf !== "arme_b").map((c) => p({ t: c.constat, f: c.fait })),
          irr("fouille") ? p({ t: `Sans attendre l'officier de police judiciaire, le gardien de la paix ${t.gpx[1].split(" ")[1]} procède à la fouille des poches et du sac de l'intéressé${saisieTxt ? ` ; y découvrons ${saisieTxt}` : ""}.`, flag: "fouille" })
            : S.constatDecouvre ? p("Les objets découverts sont conservés en l'état et remis à l'officier de police judiciaire pour placement sous scellé.")
            : saisieTxt && has("saisie") && !S.perq ? p(`Palpation de sécurité, puis, en présence de l'officier de police judiciaire, fouille : découverte de ${saisieTxt}.`) : p("Palpation de sécurité : rien à signaler."),
          p({ t: `Interpellation à ${hm(E.interp)}.`, paire: irr("heures") ? "heures" : undefined, f: "G_interp" }),
          irr("interprete") ? p({ t: `La personne s'exprime avec difficulté en français ; ${il(A)} est ${A.etranger}. Ses réponses se font par gestes et par mots isolés.`, f: "G_langue", paire: "interprete" })
            : p(`La personne décline son identité : ${n(A)}, ${A.age} ans, ${A.metier}${dou("doute_ident") ? `, vêtu${e(A)} d'${pk(rr, ["un blouson noir et d'un jean", "un manteau beige", "un sweat blanc à capuche"])}` : ""}.`),
          t.camera ? p({ t: { violences: "Les faits se sont déroulés devant un établissement dont la façade est équipée d'une caméra.", rebellion: "Le contrôle a lieu devant un bureau de tabac dont la vitrine est équipée d'une caméra." }[t.inf] || "Une caméra privée est fixée sur la façade du commerce voisin.", f: "G_camera" })
            : has("video") ? p("Le secteur est couvert par une caméra de vidéoprotection.") : p("Aucune caméra n'est relevée à proximité."),
          bav(stA) ? p(`L'intéressé${e(A)} ne fait aucune difficulté pendant le transport et garde le silence.`) : null,
          p(`Conduite au ${commLong} ; présentation à l'officier de police judiciaire de quart, ${OPJ.signe.charAt(0).toLowerCase() + OPJ.signe.slice(1)}, à ${hm(E.presentation)}.`),
        ];
        return DOCS.pv({ cote: cote("pv_interpellation"), proc: t.proc, service, unite, cadre: "FLAGRANT DÉLIT", titre: "Procès-verbal d'interpellation", numPV: "00" + int(rr, 101, 899),
          jour: j(clos), heure: clos, redacteur: apj(0), visa: "Vu les articles 53, 73 et 21 du code de procédure pénale,", lieu: "Agissant en flagrant délit", objet: `OBJET : ${q0.label} — interpellation`,
          blocs, cloture: mention(`Dont procès-verbal, fait et clos au ${commLong} ${at(clos)}.`), signataires: [`${apj(0).signe}, agent de police judiciaire`, `${apj(1).signe}, agent de police judiciaire`], st: stA });
      });
      // victime
      if (S.victime) add("pv_victime", E.victime, PL ? "Plainte" : V.agent ? "Audition du fonctionnaire" : "Audition de la victime", () => {
        const rr = CR.seeded(t.sig + ":g:vict");
        const pl = (N.plainte || []).map((x) => sansITT(guill(x))).filter(Boolean).map((x) => (S.transport ? x.replace("dans la poche du manteau", `dans la poche ${S.transport.pocheV} de mon manteau`) : x));
        const conj = /^violences_conj/.test(t.inf);
        const blocs = [
          p(PL ? `Se présente au service la personne dénommée ci-dessus, qui déclare vouloir déposer plainte contre ${n(A)} et nous déclare :` : "Entendons la personne dénommée ci-dessus, qui nous déclare :"),
          ...pl.map((x, i) => decl({ t: `« ${x} »`, f: i === 0 ? "G_plainte" : undefined })),
          dou("doute_ident") ? decl({ t: `« Il portait ${pk(rr, ["un survêtement rouge", "une doudoune verte", "un bob noir et des lunettes"])}. Je ne l'avais jamais vu. Je ne suis pas sûr${e(V)} de pouvoir le reconnaître. »`, f: "G_doute_ident" }) : null,
          t.quoi === "vulnerable" ? decl({ t: "« Je vis seule, je fais mes courses et je gère mes comptes moi-même, mon fils passe le dimanche. »", f: "G_autonome" }) : null,
          t.quoi === "itt" ? decl({ t: `« Aux urgences, le médecin m'a donné ${t.f.itt} jours d'arrêt. »`, f: "G_itt_urg" }) : null,
          titre("QUESTIONS ET RÉPONSES"),
          ...(N.qV || []).map((x) => [q(x.q), rep(sansITT(x.a[0]) || "Pas encore.")]),
          S.blessures.length ? [q("Avez-vous été blessé(e) ?"), rep(`Oui, ${S.blessures[0]}.`.replace("Oui, une", "Oui, j'ai une").replace("Oui, un ", "Oui, j'ai un ").replace("Oui, des", "Oui, j'ai des"))] : null,
          T ? [q("D'autres personnes ont-elles assisté aux faits ?"), rep(conj || /domicile/.test(lieu) ? "Les voisins ont dû entendre." : "Oui, il y avait du monde autour.")] : null,
          PL ? null : V.agent ? [q("Déposez-vous plainte ?"), rep("Oui, je dépose plainte et me constitue partie civile.")] : [q("Déposez-vous plainte ?"), S.conjugal && S.conjugal.refus ? rep({ t: "Non. Je ne veux pas qu'il ait des problèmes. Je veux juste qu'il se calme.", f: "G_refus_plainte" }) : rep(conj ? "Oui. Je ne veux plus que ça recommence." : "Oui, je dépose plainte.")],
          V.agent ? null : p("Informons la victime de ses droits (art. 10-2) : obtenir réparation de son préjudice, se constituer partie civile, être assistée d'un avocat, être aidée par un service d'aide aux victimes, saisir le cas échéant la commission d'indemnisation des victimes d'infractions."),
          conj ? p("Lui faisons connaître la possibilité de solliciter une ordonnance de protection auprès du juge aux affaires familiales. Renseignons avec elle la grille d'évaluation du danger, jointe à la procédure.".replace("avec elle", "avec " + lui(V))) : null,
          S.blessures.length && E.umj ? p(`Lui remettons une réquisition à l'effet d'être examiné${e(V)} par l'unité médico-judiciaire.`) : null,
        ];
        return DOCS.pv({ cote: cote("pv_victime"), proc: t.proc, service, unite, titre: PL ? "Procès-verbal de plainte" : V.agent ? "Procès-verbal d'audition de fonctionnaire victime" : "Procès-verbal d'audition de la victime", qualite: PL ? (V.g === "f" ? "Plaignante" : "Plaignant") : "Victime", numPV: "00" + int(rr, 101, 899), jour: j(E.victime), heure: E.victime, redacteur: OPJ,
          lieu: `Nous trouvant au ${commLong}`, identite: identite(V), blocs, cloture: DOCS.clotureAudition(ville, j(E.victimeFin), E.victimeFin, V.g === "f" ? "elle" : "lui"), signataires: ["La personne entendue", `${OPJ.signe}, officier de police judiciaire`], st: stO });
      });
      // témoin
      if (has("temoin") && T) add("pv_temoin", E.temoin, "Audition du témoin", () => {
        const rr = CR.seeded(t.sig + ":g:tem");
        const lt = (N.temoin || []).filter((x) => t.quoi !== "reunion" || !/deux|Ils étaient/.test(x));
        const blocs = [
          p("Entendons la personne dénommée ci-dessus, qui nous déclare :"),
          ...lt.map((x) => decl(`« ${guill(x)} »`)),
          dou("temoin_contra") ? decl({ t: `« ${pk(rr, t.inf === "vol" ? ["Je ne suis pas sûr que ce soit lui ; il y avait beaucoup de monde.", "Celui qui a pris le téléphone était plus grand, je crois.", "Je l'ai vu de dos seulement."] : t.inf === "outrage" ? ["Je n'ai pas entendu d'insulte. Il parlait fort, c'est tout.", "C'est un des policiers qui l'a insulté en premier."] : ["Je ne peux pas dire qui a commencé. Les deux criaient.", "Ce n'est pas lui qui a frappé en premier, c'est l'autre.", "Je n'ai pas vu de coup, honnêtement. J'ai vu une bousculade."])} »`, f: "G_temoin_contra" }) : null,
          dou("legitime_defense") ? decl({ t: "« L'autre homme a sorti une bouteille et s'est jeté sur lui le premier. Lui s'est défendu, il a mis un coup pour se dégager. »", f: "G_ld" }) : null,
          dou("doute_ident") && !V ? decl({ t: "« Je ne pourrais pas le reconnaître, il faisait nuit et il avait une capuche. »", f: "G_doute_ident" }) : null,
          t.quoi === "reunion" ? decl({ t: "« Il était seul. Personne ne l'aidait. Les autres regardaient. »", f: "G_seul" }) : null,
          t.quoi === "violence" ? decl({ t: "« Il a pris le téléphone et il est parti en courant. Il ne l'a pas touchée. »", f: "G_sans_violence" }) : null,
          t.quoi === "mort" ? decl({ t: `« Il a crié : “Je vais te casser les jambes.” Je n'ai pas entendu parler de tuer. »`, f: "G_mots" }) : null,
          t.inf === "blessures_routieres" && t.quoi ? decl({ t: `« ${t.quoi === "r_telephone" ? "Je crois qu'il avait son téléphone, mais je ne suis pas sûr." : t.quoi === "r_vitesse" ? "Il roulait vite, mais je ne saurais pas dire combien." : "Je ne sais pas s'il avait bu."} »`, f: "G_circ_doute" }) : null,
          titre("QUESTIONS ET RÉPONSES"),
          q("Où vous trouviez-vous exactement ?"), rep(pk(rr, ["À une dizaine de mètres.", "Juste à côté.", "De l'autre côté de la rue.", "Chez moi, juste à côté."])),
          q("Connaissez-vous les personnes en cause ?"), rep(pk(rr, ["Non, aucune.", "De vue seulement.", "Non."])),
          q("Avez-vous quelque chose à ajouter ?"), rep(pk(rr, ["Non.", "Non, c'est tout ce que j'ai vu.", "Je suis prêt à revenir si besoin."])),
        ];
        return DOCS.pv({ cote: cote("pv_temoin"), proc: t.proc, service, unite, titre: "Procès-verbal d'audition de témoin", qualite: "Témoin", numPV: "00" + int(rr, 101, 899), jour: j(E.temoin), heure: E.temoin, redacteur: OPJ, lieu: `Nous trouvant au ${commLong}`,
          identite: { nom: T.nom, prenom: T.prenom, g: T.g, adresse: T.adresse, metier: T.metier }, blocs, cloture: DOCS.clotureAudition(ville, j(E.temoinFin), E.temoinFin, T.g === "f" ? "elle" : "lui"), signataires: ["La personne entendue", `${OPJ.signe}, officier de police judiciaire`], st: stO });
      });
      // lot 1 ter : le vol en magasin — l'agent de sécurité, puis l'état de la marchandise dressé par le magasin
      if (S.magasin) {
        const M = S.magasin, G = M.agent, ag = { g: G.g };
        const euros = (x) => `${x.toFixed(2).replace(".", ",")} €`;
        const nb = (x) => ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept"][x] || String(x);
        const art = M.qte > 1 ? `${nb(M.qte)} ${M.lib}` : t.f.objet;
        const artDit = M.qteDit > 1 ? `${nb(M.qteDit)} ${M.lib}` : t.f.objet;
        add("pv_agent", E.agent, "Audition de l'agent de sécurité", () => {
          const rr = CR.seeded(t.sig + ":g:agent");
          const blocs = [
            decl(`« Je suis agent de sécurité pour la société ${G.societe}, affecté${e(ag)} au magasin ${M.enseigne} depuis ${pk(rr, ["deux ans", "huit mois", "un an et demi", "quatre ans"])}. ${M.ecrans ? "J'étais au poste de contrôle, devant les écrans." : "Je faisais ma ronde en salle."} »`),
            decl({ t: `« Vers ${hm(E.repere)}, j'ai remarqué ${A.g === "f" ? "une femme" : "un homme"} ${M.rayon}. ${M.ecrans ? "Sur l'écran, je l'ai vu" : "Je l'ai vu, à quelques mètres,"} prendre ${artDit} et ${M.qteDit > 1 ? "les" : "le"} glisser dans ${M.sac}. Je ne l'ai plus quitté${e(A)} des yeux. »`, f: "G_agent_vu" }),
            decl(`« ${Maj(il(A))} est passé${e(A)} en caisse${M.caisse ? " et a payé un article sans rapport, sans présenter le reste" : " sans rien présenter"}. ${M.portique ? "Le portique a sonné." : "Le portique n'a pas sonné : les antivols avaient été retirés."} Je l'ai rattrapé${e(A)} juste après, à ${hm(E.portique + 1)}, et je lui ai demandé de me suivre au bureau de la sécurité.${(t.f.agg || []).includes("violence0") ? ` ${Maj(il(A))} m'a bousculé${e(ag)} pour forcer le passage, j'ai heurté le portique ; je n'ai pas été blessé${e(ag)}. Avec un collègue, nous l'avons retenu${e(A)}.` : ""} »`),
            decl(`« Je ne l'ai pas fouillé${e(A)} : ${il(A)} a sorti ${lui(A) === "elle" ? "elle-même" : "lui-même"} la marchandise${/poche/.test(M.sac) ? " de sa poche" : " de son sac"}. J'ai appelé la police à ${hm(E.appelMag)}. ${Maj(il(A))} est resté${e(A)} au bureau avec moi jusqu'à votre arrivée${(t.f.agg || []).includes("violence0") ? "" : pk(rr, [", calmement", ", en s'excusant", ", en répétant qu'" + il(A) + " allait payer", ""])}. »`),
            titre("QUESTIONS ET RÉPONSES"),
            q("Combien d'articles avez-vous vu prendre ?"), rep({ t: M.qteDit > 1 ? `${Maj(nb(M.qteDit))}, j'en suis sûr${e(ag)}.` : "Un seul.", f: M.qteDit !== M.qte ? "G_agent_compte" : undefined }),
            q("Les images ont-elles été conservées ?"), rep(M.video ? "Oui. J'ai extrait la séquence sur une clé USB, je vous la remets." : "Les caméras ne couvrent pas ce rayon. Il n'y a que l'entrée."),
            q("Avez-vous quelque chose à ajouter ?"), rep(pk(rr, ["Non.", "Non, c'est tout.", "Le magasin va déposer plainte, le directeur est prévenu."])),
          ];
          return DOCS.pv({ cote: cote("pv_agent"), proc: t.proc, service, unite, titre: "Procès-verbal d'audition de témoin", qualite: "Témoin (agent de sécurité)", numPV: "00" + int(rr, 101, 899), jour: j(E.agent), heure: E.agent, redacteur: OPJ, lieu: `Nous trouvant au ${commLong}`,
            objet: `OBJET : ${q0.label} — audition de l'agent de sécurité`, identite: { nom: G.nom, prenom: G.prenom, g: G.g, metier: `agent de sécurité (${G.societe})` }, blocs, cloture: DOCS.clotureAudition(ville, j(E.agentFin), E.agentFin, G.g === "f" ? "elle" : "lui"), signataires: ["La personne entendue", `${OPJ.signe}, officier de police judiciaire`], st: stO });
        });
        add("etat_marchandise", E.etat, "État de la marchandise", () => DOCS.forme({ title: "État de la marchandise", kind: "courrier", cote: cote("etat_marchandise"), entete: [`${M.enseigne} · ${lieu.replace(/^dans le magasin [^,]+, /, "")}`, `Procédure n° ${t.proc} — cote ${cote("etat_marchandise")}`],
          blocs: [
            p(`Articles retrouvés en possession de ${n(A)} le ${DOCS.date(jf)} à ${hm(E.portique + 1)}, après le passage des caisses :`),
            ligne(`${Maj(art)}`, `${M.qte} × ${euros(M.pu)} TTC`),
            ligne("Total", euros(M.total)),
            p({ t: M.vente ? "La marchandise a été récupérée intacte et remise en rayon : elle est en état de vente." : "Emballages ouverts et antivols arrachés : la marchandise n'est plus en état de vente.", f: "G_etat_vente" }),
            mention(`Établi par la direction du magasin, le ${DOCS.date(j(E.etat))}.`),
          ], sigs: ["Le directeur du magasin"] }));
      }
      // lot 1 ter : violences conjugales — l'état des lieux et la consultation des interventions passées
      if (S.conjugal) {
        const M = S.conjugal;
        add("pv_recherches", M.jRech, "Recherches", () => DOCS.pv({ cote: cote("pv_recherches"), proc: t.proc, service, unite, titre: "Procès-verbal de constatations et de recherches", numPV: "00" + int(CR.seeded(t.sig + ":g:conj"), 101, 899), jour: j(M.jRech), heure: M.jRech, redacteur: OPJ, lieu: `Nous trouvant au ${commLong}`, objet: `OBJET : ${q0.label} — constatations et recherches`,
          blocs: [
            p({ t: `Lors de l'intervention, à notre arrivée au domicile, constatons ${M.desordre}.`, f: M.desordre.startsWith("aucun") ? "G_sans_desordre" : undefined }),
            p({ t: M.mc ? `Consultation des fichiers du service : ${M.mc === 1 ? "une intervention antérieure" : M.mc + " interventions antérieures"} au domicile du couple, dont ${M.mc === 1 ? "une main courante déposée" : "une main courante déposée"} par ${nf(V)} il y a ${pk(CR.seeded(t.sig + ":g:mc"), ["onze mois", "un an", "quatorze mois"])}.` : `Consultation des fichiers du service : aucune intervention ni main courante antérieure enregistrée au nom de ${nf(V)} ou de ${n(A)}.`, f: M.mc ? "G_mains_courantes" : "G_mc_absente" }),
          ], cloture: mention(`Dont procès-verbal, fait et clos ${at(M.jRech)}.`), signataires: [`${OPJ.signe}, officier de police judiciaire`], st: stO }));
      }
      // lot 1 ter : la rébellion — la déclaration du second fonctionnaire
      if (S.rebellion) {
        const R = S.rebellion;
        add("pv_collegue", E.debut + 50, "Déclaration du second fonctionnaire", () => {
          const rr = CR.seeded(t.sig + ":g:reb");
          const blocs = [
            decl(`« J'étais avec ${apjTxt(0)}. ${Maj(il(A))} refusait de nous suivre. »`),
            R.ordre ? decl({ t: `« Mon collègue lui a fait une clé de bras pour le conduire au véhicule ; c'est à ce moment qu'${il(A)} a résisté. »`, f: "G_ordre" }) : decl(`« Nous lui avons demandé plusieurs fois de nous suivre ; ${il(A)} a refusé, puis ${il(A)} a résisté au menottage. »`),
            R.passif ? decl({ t: `« ${Maj(il(A))} s'est laissé${e(A)} tomber, ${il(A)} s'est raidi${e(A)} ; ${il(A)} ne frappait pas, ${il(A)} faisait le poids mort. Il a fallu ${le(A)} porter. »`, f: "G_passif" })
              : decl(`« ${Maj(il(A))} se débattait, ${il(A)} donnait des coups dans tous les sens. ${pk(rr, ["Ça a duré", "Il a fallu"])} ${R.duree} secondes environ pour ${le(A)} menotter. »`),
            R.passant ? decl({ t: "« Des passants étaient là ; l'un d'eux filmait. »", f: "G_video_passant" }) : null,
          ];
          return DOCS.pv({ cote: cote("pv_collegue"), proc: t.proc, service, unite, titre: "Procès-verbal d'audition", qualite: "Fonctionnaire de police, témoin", numPV: "00" + int(rr, 101, 899), jour: j(E.debut + 50), heure: E.debut + 50, redacteur: OPJ, lieu: `Nous trouvant au ${commLong}`,
            objet: `OBJET : ${q0.label} — audition du second fonctionnaire`, identite: { nom: t.gpx[1].split(" ").slice(-1)[0], prenom: t.gpx[1].split(" ")[0], g: gp(t.gpx[1]).startsWith("Gardienne") ? "f" : "m", metier: gp(t.gpx[1]).toLowerCase() }, blocs,
            cloture: DOCS.clotureAudition(ville, j(E.debut + 70), E.debut + 70, gp(t.gpx[1]).startsWith("Gardienne") ? "elle" : "lui"), signataires: ["La personne entendue", `${OPJ.signe}, officier de police judiciaire`], st: stO });
        });
      }
      // lot 1 ter : l'outrage — la déclaration du second fonctionnaire
      if (S.outrage && S.outrage.mots) {
        const O = S.outrage;
        add("pv_collegue", E.debut + 50, "Déclaration du second fonctionnaire", () => {
          const rr = CR.seeded(t.sig + ":g:outr");
          const blocs = [
            decl(`« J'accompagnais ${apjTxt(0)} lors du contrôle. ${Maj(il(A))} s'est mis${e(A)} à crier ${O.cantonade ? "en regardant la rue" : "en nous regardant"}. »`),
            decl({ t: `« ${Maj(il(A))} a dit : “${O.mots2}” ${pk(rr, ["Il l'a répété deux fois.", "Plusieurs passants se sont arrêtés.", "Ça a duré une minute à peu près."])} »`, f: O.ecart ? "G_mots_ecart" : undefined }),
            O.cantonade ? decl({ t: `« Je ne saurais pas dire s'${il(A)} s'adressait à nous ou à tout le monde. »`, f: "G_cantonade" }) : decl("« C'est à nous qu'il s'adressait, il nous fixait. »"),
            O.passant ? decl({ t: "« Un passant a filmé la scène avec son téléphone ; il nous a laissé ses coordonnées. »", f: "G_video_passant" }) : null,
          ];
          return DOCS.pv({ cote: cote("pv_collegue"), proc: t.proc, service, unite, titre: "Procès-verbal d'audition", qualite: "Fonctionnaire de police, témoin", numPV: "00" + int(rr, 101, 899), jour: j(E.debut + 50), heure: E.debut + 50, redacteur: OPJ, lieu: `Nous trouvant au ${commLong}`,
            objet: `OBJET : ${q0.label} — audition du second fonctionnaire`, identite: { nom: t.gpx[1].split(" ").slice(-1)[0], prenom: t.gpx[1].split(" ")[0], g: gp(t.gpx[1]).startsWith("Gardienne") ? "f" : "m", metier: gp(t.gpx[1]).toLowerCase() }, blocs,
            cloture: DOCS.clotureAudition(ville, j(E.debut + 70), E.debut + 70, gp(t.gpx[1]).startsWith("Gardienne") ? "elle" : "lui"), signataires: ["La personne entendue", `${OPJ.signe}, officier de police judiciaire`], st: stO });
        });
      }
      // lot 1 ter : le point de deal — le procès-verbal de surveillance
      if (S.deal) {
        const M = S.deal;
        add("pv_surveillance", E.interp + 35, "Surveillance", () => {
          const rr = CR.seeded(t.sig + ":g:deal");
          const blocs = [
            p(`À ${hm(E.debutSurv)}, en tenue civile, mettons en place un dispositif de surveillance du point de vente connu des services, ${lieu.replace(/^au pied de l'immeuble du /, "au pied du ").replace(/, point de vente connu des services$/, "")}, à partir ${M.poste}, à environ ${M.distance} mètres.`),
            M.gene ? p({ t: `L'observation se fait ${M.gene}.`, f: "G_vue_genee" }) : p("Le champ de vision est dégagé."),
            ...(M.guet ? [p({ t: `À ${hm(S.T0)}, à l'approche d'un véhicule de police sérigraphié, observons ${n(A)}, posté${e(A)} à l'entrée du hall, crier « ${M.cri} » ; plusieurs personnes quittent aussitôt les lieux.`, f: "G_guet_cri" })]
              : M.tr.map((h, i) => p({ t: `À ${hm(h)}, ${pk(CR.seeded(t.sig + ":tr" + i), ["un homme d'une trentaine d'années", "une femme en survêtement", "un jeune homme à vélo", "un homme en costume"])} s'approche de ${n(A)} ; échange rapide : un billet contre un petit objet sorti de ${M.cache ? "derrière le muret" : "sa poche"}.`, f: i === 0 ? "G_transactions" : undefined }))),
            !M.guet && M.acheteur ? p(`L'un des acheteurs est contrôlé à distance par un équipage : il est trouvé porteur d'une barrette de résine de cannabis et déclare l'avoir achetée « au pied de l'immeuble ».`) : null,
            p(`Interpellation de ${n(A)} à ${hm(E.interp)}.`),
            M.guet ? p({ t: `Palpation : rien de prohibé sur l'intéressé${e(A)}, porteur de deux téléphones${t.f.especes ? ` et de ${t.f.especes} euros en coupures de dix et vingt euros` : ""}. Les produits sont découverts dans le hall, derrière la porte du local à poubelles.`, f: "G_guet_rien" })
              : M.cache ? p({ t: `Palpation : sur l'intéressé${e(A)}, ${t.f.especes ? `${t.f.especes} euros en petites coupures` : "rien"} ; les produits sont découverts ${M.cacheOu}, à l'endroit d'où nous l'avons vu${e(A)} sortir les objets remis.`, f: "G_cache" })
              : p(`Palpation, puis fouille par l'officier de police judiciaire : découverte sur l'intéressé${e(A)} de ${N.saisie || "produits stupéfiants"}.`),
          ];
          return DOCS.pv({ cote: cote("pv_surveillance"), proc: t.proc, service, unite, cadre: "FLAGRANT DÉLIT", titre: "Procès-verbal de surveillance et d'interpellation", numPV: "00" + int(rr, 101, 899),
            jour: j(E.interp + 35), heure: E.interp + 35, redacteur: apj(0), visa: "Vu les articles 53 et 73 du code de procédure pénale,", lieu: "Agissant en flagrant délit", objet: `OBJET : ${q0.label} — surveillance`,
            blocs, cloture: mention(`Dont procès-verbal, fait et clos au ${commLong} ${at(E.interp + 35)}.`), signataires: [`${apj(0).signe}, agent de police judiciaire`, `${apj(1).signe}, agent de police judiciaire`], st: stA });
        });
      }
      // lot 1 ter : le vol de deux-roues — constatations sur l'engin et sur les lieux
      if (S.deuxRoues) {
        const M = S.deuxRoues;
        add("pv_constatations", E.surPlace + 20, "Constatations", () => {
          const rr = CR.seeded(t.sig + ":g:2r");
          const blocs = [
            p(M.appel === "riverain" ? `À ${hm(E.requis)}, requis par l'opérateur du centre d'information et de commandement : un riverain signale, depuis la fenêtre de son appartement au ${M.etage} étage, ${A.g === "f" ? "une personne" : "un individu"} « penché${e(A)} sur un deux-roues, avec des bruits métalliques », ${lieu}.`
              : `À ${hm(E.requis)}, requis par l'opérateur du centre d'information et de commandement : le propriétaire de ${lobjet}, ${nf(V)}, signale que le traceur de son engin indique un mouvement, ${lieu}.`),
            p({ t: `Sur place à ${hm(E.surPlace)}, ${M.eclairage}, constatons la présence de ${n(A)}, ${M.outilMain ? "un tournevis plat à la main" : "accroupi" + e(A) + " près de l'engin ; un tournevis plat est au sol, à un mètre"}.`, f: M.outilMain ? undefined : "G_outil_sol" }),
            p({ t: M.deplace ? `${Maj(objet)} n'est plus à sa place de stationnement : il est à ${M.metres} mètres, béquille relevée, le long du trottoir.` : `${Maj(objet)} est à sa place de stationnement, béquille latérale dépliée.`, f: M.deplace ? "G_deplace" : "G_non_deplace" }),
            p(`État de l'engin : ${M.degats}. Photographies jointes (planche de quatre clichés).`),
            M.appel === "riverain" ? p({ t: `Le riverain, ${pk(rr, ["qui ne souhaite pas être entendu ce soir", "qui ne descend pas", "joint par téléphone"])}, précise ne pas avoir vu le visage ; il décrit « ${pk(rr, ["une silhouette en sombre", "quelqu'un avec une capuche", "une personne de taille moyenne"])} ».`, f: "G_riverain_visage" }) : p(`${nf(V)}, arrivé${e(V)} sur les lieux à ${hm(E.surPlace + int(rr, 8, 20))}, reconnaît son engin et présente la carte grise.`),
          ];
          return DOCS.pv({ cote: cote("pv_constatations"), proc: t.proc, service, unite, cadre: "FLAGRANT DÉLIT", titre: "Procès-verbal de constatations", numPV: "00" + int(rr, 101, 899),
            jour: j(E.surPlace + 20), heure: E.surPlace + 20, redacteur: apj(0), visa: "Vu les articles 53 et 54 du code de procédure pénale,", lieu: "Agissant en flagrant délit", objet: `OBJET : ${q0.label} — constatations`,
            blocs, cloture: mention(`Dont procès-verbal, fait et clos ${at(E.surPlace + 20)}.`), signataires: [`${apj(0).signe}, agent de police judiciaire`, `${apj(1).signe}, agent de police judiciaire`], st: stA });
        });
      }
      // lot 1 ter : le vol à la tire — la réquisition de la victime et l'interpellation dans le groupe
      if (S.tire) {
        const M = S.tire;
        const nb = (x) => ["zéro", "un", "deux", "trois", "quatre", "cinq"][x];
        add("pv_requisition", E.interp + 25, "Réquisition et interpellation", () => {
          const rr = CR.seeded(t.sig + ":g:tire");
          const blocs = [
            p(`À ${hm(E.requis)}, en patrouille portée ${lieu}, sommes requis par ${nf(V)}, touriste, qui s'exprime en ${M.langue} et en quelques mots de français ; ${il(V)} nous montre son sac, ouvert, et désigne un groupe de ${nb(M.nV)} personnes qui s'éloigne vers le boulevard, à ${M.distance}.`),
            p({ t: `${nf(V)} nous fait comprendre qu'on lui a demandé de signer une pétition quelques minutes plus tôt, vers ${hm(E.abord)}, et qu'${il(V)} s'est aperçu${e(V)} de la disparition de ${lobjet} en reprenant sa marche, vers ${hm(E.decouvre)}. ${Maj(il(V))} n'a pas vu qui l'a pris.`, f: "G_tire_pas_vu" }),
            p({ t: `Rattrapons le groupe à ${hm(E.interp)} : ${nb(M.nP)} individus. ${M.nP < M.nV ? "Les autres ne sont pas en vue." : ""} ${n(A)}, qui selon ${nf(V)} ${M.role}, est interpellé${e(A)} ; les autres prennent la fuite.`.replace("  ", " "), f: M.ecart ? "G_tire_nombre" : undefined }),
            M.sol ? p({ t: `${Maj(objet)} est découvert${/^une /.test(objet) ? "e" : ""} au sol, à un mètre de ${n(A)}, au moment de l'interpellation. Aucun de nous n'a vu qui l'y a laissé${/^une /.test(objet) ? "e" : ""}.`, f: "G_objet_sol" })
              : p(`Palpation de sécurité : découverte de ${objet} dans la poche de ${n(A)}.`),
            p(`${nf(V)} reconnaît ${lobjet} comme sien. ${Maj(il(V))} indique devoir reprendre l'avion dans ${pk(rr, ["deux jours", "trois jours", "la semaine"])}.`),
            p(`Conduite au ${commLong} ; présentation à l'officier de police judiciaire, ${OPJ.signe.charAt(0).toLowerCase() + OPJ.signe.slice(1)}.`),
          ];
          return DOCS.pv({ cote: cote("pv_requisition"), proc: t.proc, service, unite, cadre: "FLAGRANT DÉLIT", titre: "Procès-verbal de réquisition et d'interpellation", numPV: "00" + int(rr, 101, 899),
            jour: j(E.interp + 25), heure: E.interp + 25, redacteur: apj(0), visa: "Vu les articles 53 et 73 du code de procédure pénale,", lieu: "Agissant en flagrant délit", objet: `OBJET : ${q0.label} — réquisition et interpellation`,
            blocs, cloture: mention(`Dont procès-verbal, fait et clos au ${commLong} ${at(E.interp + 25)}.`), signataires: [`${apj(0).signe}, agent de police judiciaire`, `${apj(1).signe}, agent de police judiciaire`], st: stA });
        });
      }
      // lot 1 ter : le vol dans le métro — le procès-verbal de surveillance de la brigade des réseaux franciliens
      if (S.transport) {
        const M = S.transport;
        add("pv_surveillance", E.interpT + 30, "Surveillance et interpellation", () => {
          const rr = CR.seeded(t.sig + ":g:brf");
          const blocs = [
            p(`En surveillance en tenue civile sur la ligne ${M.ligne} du métropolitain, dans le cadre de la lutte contre les vols à la tire, en compagnie de ${apjTxt(1)}.`),
            p(`À ${hm(E.filature)}, sur le quai de la station ${M.filStation}, remarquons ${A.g === "f" ? "une femme" : "un individu"} qui ne monte dans aucune rame et observe les voyageurs, ${pk(rr, ["en particulier ceux qui consultent leur téléphone", "se rapprochant des portes à chaque arrivée", "sans jamais regarder les panneaux"])}. Décidons de ${le(A)} suivre.`),
            p({ t: `À ${hm(E.geste)}, dans la rame ${M.bondee ? "bondée" : "peu chargée"}, entre les stations ${M.de} et ${M.vers}, à ${S.savoirs.brf.distance} de nous, ${il(A)} se place derrière ${nf(V)} au moment de la fermeture des portes et glisse la main dans la poche ${M.poche} de son manteau, dont ${il(A)} retire un objet qu'${il(A)} met aussitôt dans sa veste.`, f: "G_brf_vu" }),
            M.reunion ? p(`Un second individu, resté collé à ${nf(V)} pendant le geste, fait écran entre la victime et la porte ; il descend à la station suivante et se perd dans la foule avant que nous puissions l'interpeller.`) : null,
            M.violence ? p(`${nf(V)}, qui s'est retourné${e(V)}, est repoussé${e(V)} d'une bourrade contre la barre de maintien ; ${il(V)} ne se plaint d'aucune douleur.`) : null,
            p(`À l'arrêt suivant, à ${hm(E.interpT)}, procédons à l'interpellation de l'intéressé${e(A)} sur le quai, en nous faisant connaître par la présentation de nos cartes professionnelles et le port du brassard.`),
            p(`Palpation de sécurité, puis découverte, dans la poche de sa veste, de ${t.f.objet}. ${nf(V)}, que nous avons fait descendre de la rame, le reconnaît comme sien.`),
            M.bondee ? p({ t: "La rame étant bondée, la scène s'est déroulée au milieu des voyageurs ; aucun d'eux ne s'est fait connaître.", f: "G_rame_bondee" }) : null,
            p(`Conduite au ${commLong} ; présentation à l'officier de police judiciaire, ${OPJ.signe.charAt(0).toLowerCase() + OPJ.signe.slice(1)}.`),
          ];
          return DOCS.pv({ cote: cote("pv_surveillance"), proc: t.proc, service: SF.paris ? "PRÉFECTURE DE POLICE · BRIGADE DES RÉSEAUX FRANCILIENS" : service, unite, cadre: "FLAGRANT DÉLIT", titre: "Procès-verbal de surveillance et d'interpellation", numPV: "00" + int(rr, 101, 899),
            jour: j(E.interpT + 30), heure: E.interpT + 30, redacteur: apj(0), visa: "Vu les articles 53 et 73 du code de procédure pénale,", lieu: "Agissant en flagrant délit", objet: `OBJET : ${q0.label} — surveillance et interpellation`,
            blocs, cloture: mention(`Dont procès-verbal, fait et clos au ${commLong} ${at(E.interpT + 30)}.`), signataires: [`${apj(0).signe}, agent de police judiciaire`, `${apj(1).signe}, agent de police judiciaire`], st: stA });
        });
      }
      // médecin légiste de la victime
      if (E.umj && t.f.itt != null && V) {
        const ittU = t.quoi === "itt" ? t.f2.itt : t.f.itt;
        add("requisition_umj", E.umj.req, "Réquisition à l'UMJ", () => DOCS.forme({ title: "Réquisition à personne qualifiée — examen de la victime", cote: cote("requisition_umj"), entete: [unite, `Procédure n° ${t.proc} — cote ${cote("requisition_umj")}`],
          blocs: [p(`Nous, ${OPJ.nom}, ${OPJ.qualite}, vu l'article ${PL ? "77-1" : "60"} du code de procédure pénale, requérons le médecin de l'${TJ.umj} à l'effet d'examiner ${nf(V)}, de décrire les lésions éventuelles, de dire si elles sont compatibles avec les faits déclarés et de fixer la durée de l'incapacité totale de travail.`), mention(`Fait ${at(E.umj.req)}.`)], sigs: [`${OPJ.signe}, officier de police judiciaire`] }));
        add("certificat", E.umj.examen, "Certificat de l'UMJ", () => {
          const rr = CR.seeded(t.sig + ":g:umj");
          const les = S.blessures.length ? S.blessures : ["pas de lésion traumatique récente objectivée"];
          return DOCS.forme({ title: "Certificat médical — unité médico-judiciaire", kind: "courrier", cote: cote("certificat"), schema: S.blessures.length ? S.blessures : null, entete: [`${TJ.umj} · AP-HP`, `Réquisition de l'officier de police judiciaire — procédure n° ${t.proc}`],
            blocs: [
              p(`Je soussigné${pk(rr, ["", "e"])}, Dr ${pk(rr, ["Élise Vannier", "Marc Dubreuil", "Nora Belhadj"])}, médecin légiste, certifie avoir examiné ${at(E.umj.examen)}, sur réquisition du ${DOCS.date(j(E.umj.req))}, une personne qui me dit s'appeler ${n(V)}, ${V.age} ans.`),
              titre("COMMÉMORATIFS"), p(`La personne déclare avoir été victime de violences le ${DOCS.date(jf)}${/^violences_conj/.test(t.inf) ? ", de la part de son conjoint ou ancien conjoint" : ""}.`),
              titre("DOLÉANCES"), p(`« ${pk(rr, ["J'ai mal quand je bouge.", "J'ai du mal à dormir depuis.", "J'ai des maux de tête."])} »`),
              titre("EXAMEN CLINIQUE"), ...les.map((l) => p(Maj(l) + ".")),
              titre("CONCLUSION"),
              p({ t: `Conclusion : l'incapacité totale de travail, au sens pénal, est fixée à ${ittU}${ittU <= 8 ? ` (${["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit"][ittU]})` : ""} jour${ittU > 1 ? "s" : ""}, sous réserve de complications.`, f: t.quoi === "itt" ? "G_itt_umj" : "G_itt" }),
              mention("Certificat remis à la seule autorité requérante."),
            ], sigs: ["Le médecin légiste"] });
        });
      }
      // objet volé retrouvé : scellé, puis restitution
      if (S.objetRetrouve) {
        add("pv_scelle", E.scelle, "Saisie et scellé", () => DOCS.pv({ cote: cote("pv_scelle"), proc: t.proc, service, unite, titre: "Procès-verbal de saisie et de placement sous scellé", jour: j(E.scelle), heure: E.scelle, redacteur: OPJ, visa: vis("Vu les articles 54, 56 et 57 du code de procédure pénale,", "Vu les articles 76, 56 et 57 du code de procédure pénale,"), lieu: `Nous trouvant au ${commLong}`,
          blocs: [p(`En présence de ${n(A)}, saisissons ${saisieTxt}, découvert${acc} lors ${PL && S.perq ? "de la perquisition de son domicile" : "de son interpellation"}.`), p(`${acc.endsWith("s") ? "Les" : acc ? "La" : "Le"} plaçons sous scellé n° UN, fermé, après inventaire.`), p(`L'intéressé${e(A)} déclare : « ${t.stance === "reconnait" ? "Oui, c'est ce que j'ai pris." : t.stance === "minimise" ? "Je voulais payer." : "Ce n'est pas à moi."} »`)],
          cloture: mention("Dont procès-verbal, que la personne signe avec nous."), signataires: ["La personne gardée à vue", `${OPJ.signe}, officier de police judiciaire`], st: stO }));
        add("pv_restitution", E.restitution, "Restitution", () => DOCS.forme({ title: "Procès-verbal de restitution", cote: cote("pv_restitution"), entete: [unite, `Procédure n° ${t.proc} — cote ${cote("pv_restitution")}`],
          blocs: [p(`Sur instruction du procureur de la République, restituons à ${nf(V)}, qui en justifie la propriété, ${saisieTxt} placé${acc} sous scellé n° UN.`), mention(`Fait ${at(E.restitution)}.`)], sigs: ["La victime", `${OPJ.signe}, officier de police judiciaire`] }));
      }
      // lot 1 ter, pièces techniques : l'exploitation des images, horodatée sur l'enregistreur (dont l'horloge peut dériver,
      // de quelques minutes : décalage constaté et écrit, comme en vrai) ; la scène et l'identification du catalogue
      if (has("video") && !S.arrachage && !k.VID) {
        const rv = CR.seeded(t.sig + ":g:vid");
        const derive = ch(rv, 0.45) ? (ch(rv, 0.5) ? 1 : -1) * int(rv, 1, 6) : 0;
        const sec = int(rv, 3, 57);
        const hms = (m) => { const x = ((m + derive) % 1440 + 1440) % 1440; return `${Math.floor(x / 60)} h ${String(x % 60).padStart(2, "0")} min ${String(sec).padStart(2, "0")} s`; };
        const mExpl = PL && E.enquete ? E.enquete(1) : E.debut + 240;
        const source = N.video ? N.video.source : `des images ${t.inf === "vol" && t.f.sc === "magasin" ? "du système de vidéosurveillance du magasin, remises par l'agent de sécurité" : t.inf === "violences" && t.f.sc === "transport" ? "des caméras de la RATP" : (SF.paris ? "de la caméra de vidéoprotection de la Ville de Paris la plus proche" : `de la caméra de vidéoprotection de la ville de ${SF.ville} la plus proche`)}`;
        add("pv_video", mExpl, "Exploitation vidéo", () => DOCS.forme({ title: N.video ? N.video.titre || "Procès-verbal d'exploitation des images" : "Procès-verbal d'exploitation des images de vidéoprotection", kind: "video", cote: cote("pv_video"),
          entete: [unite, `Procédure n° ${t.proc} — cote ${cote("pv_video")}`],
          blocs: [
            p(`Le ${DOCS.date(j(mExpl))}, à ${hm(mExpl)}, nous, ${OPJ.nom}, ${OPJ.qualite}, procédons à l'exploitation ${source.replace(/^des images /, "des images ")}, horodatage du ${DOCS.date(jf)}.`),
            p({ t: derive ? `Par comparaison avec l'horloge parlante, l'horloge de l'enregistreur ${derive > 0 ? "avance" : "retarde"} de ${Math.abs(derive)} minute${Math.abs(derive) > 1 ? "s" : ""} : les heures ci-dessous sont celles de l'enregistreur.` : "L'horloge de l'enregistreur est à l'heure.", f: Math.abs(derive) >= 3 ? "G_horodatage" : undefined }),
            p(`${hms(S.T0)} — ${N.video ? N.video.scene : N.resume}`),
            N.video ? p({ t: N.video.ident, f: "G_video" })
              : dou("doute_ident") ? p({ t: "La qualité des images ne permet pas de distinguer les traits du visage de l'auteur ; sa silhouette et ses vêtements sont visibles.", f: "G_doute_ident" }) : p({ t: `La silhouette, les vêtements et la démarche correspondent à ceux de ${n(A)} lors de son interpellation.`, f: "G_video" }),
            t.quoi === "violence" ? p({ t: "Aucun geste de violence n'est visible : l'objet est saisi d'un geste rapide, la victime n'est pas touchée.", f: "G_sans_violence" }) : null,
            p("Une planche de captures est jointe ; la séquence utile est gravée sur un disque placé sous scellé."),
          ], sigs: [`${OPJ.signe}, officier de police judiciaire`] }));
      }
      // lot 1 ter, pièces techniques : l'exploitation des réquisitions téléphoniques, accordée à la chronologie simulée
      // (activations datées autour des faits et jusqu'à l'interpellation) ; un relais couvre une zone, pas une adresse ;
      // la ligne est parfois une carte prépayée enregistrée au nom d'un tiers
      if (has("telephonie")) {
        const rt = CR.seeded(t.sig + ":g:tel");
        const j0 = jf - int(rt, 20, 40);
        const tiers = ch(rt, 0.22);
        const titulaire = tiers ? pk(rt, ["une certaine « Fatima B. », née en 1961, sans autre précision", "une société de téléphonie en liquidation", "un « Kevin Martin » dont l'adresse déclarée n'existe pas"]) : n(A);
        const mReq = PL && E.enquete ? E.enquete(2) : E.debut + 300;
        const zone = pk(rt, ["d'environ 400 mètres", "d'environ 800 mètres", "de plus d'un kilomètre"]);
        const alibi = dou("alibi_tel"), ville0 = pk(rt, ["Sarcelles", "Bobigny", "Créteil", "Argenteuil"]);
        const nContacts = t.inf === "appels_malveillants" && t.f.nb ? t.f.nb : int(rt, 12, 140), finGeo = j0 + int(rt, 21, 34);
        const nuitN = t.inf === "appels_malveillants" && t.f.nb ? Math.round(t.f.nb * (t.f.nuit ? 0.7 + rt() * 0.15 : 0.1 + rt() * 0.15)) : null;
        const lignes = [[S.T0 - int(rt, 40, 90), "appel sortant", `${int(rt, 1, 4)} min ${int(rt, 10, 59)} s`], [S.T0 + (alibi ? int(rt, 5, 25) : -int(rt, 1, 4)), "SMS reçu", "—"], [Math.max(S.T0 + 6, (E.interp || S.T0 + 30) - int(rt, 4, 20)), "appel entrant", `${int(rt, 0, 2)} min ${int(rt, 5, 59)} s`]];
        add("pv_telephonie", mReq + 60, "Téléphonie", () => DOCS.forme({ title: "Procès-verbal d'exploitation des réquisitions téléphoniques", kind: "releve", cote: cote("pv_telephonie"),
          entete: [unite, `Procédure n° ${t.proc} — cote ${cote("pv_telephonie")}`],
          blocs: [
            irr("requisition") ? p({ t: `Adressons à l'opérateur une réquisition aux fins d'obtenir la liste des appels entrants et sortants et les cellules déclenchées par la ligne ${A.tel}, du ${DOCS.date(j0)} au ${DOCS.date(jf + 2)}.`, flag: "requisition" })
              : p(`Vu l'autorisation du procureur de la République en date du ${DOCS.date(j(mReq))} (art. ${PL ? "77-1-1" : "60-1"}), adressons à l'opérateur une réquisition portant sur la ligne ${A.tel}, du ${DOCS.date(j0)} au ${DOCS.date(jf + 2)}.`),
            irr("geoloc") ? p({ t: `Poursuivons la géolocalisation en temps réel du véhicule utilisé par ${n(A)}, autorisée par le procureur de la République le ${DOCS.date(j0)}, jusqu'au ${DOCS.date(finGeo)}, date de son interpellation.`, flag: "geoloc" }) : null,
            p({ t: `Réponse de l'opérateur : la ligne est ${tiers ? `une carte prépayée enregistrée au nom de ${titulaire}` : `attribuée à ${n(A)}`} ; ${nuitN != null ? "de nombreux" : nContacts} contacts avec ${V ? "la ligne de " + nf(V) : "des numéros identifiés"} sur la période.`, f: tiers ? "G_ligne_tiers" : undefined }),
            nuitN != null ? p({ t: `Appels émis par la ligne vers celle de ${V ? nf(V) : "la plaignante"} sur la période : ${nContacts}, dont ${nuitN} entre 22 heures et 6 heures ; tous en numéro masqué.`, f: "G_appels_compte" }) : null,
            p(`Activations relevées le ${DOCS.date(jf)} :`),
            ...lignes.slice().sort((a, b) => a[0] - b[0]).map(([m, typ, du]) => ligne(`${hm(m)} — ${typ}`, `durée ${du}, relais ${alibi ? ville0 : "couvrant le secteur des faits"}`)),
            alibi ? p({ t: `Le jour des faits, entre ${hm(S.T0 - 120)} et ${hm(S.T0 + 150)}, la ligne déclenche exclusivement des relais situés à ${ville0}.`, f: "G_alibi" })
              : p({ t: `Le jour des faits, à ${hm(S.T0)}, la ligne déclenche le relais couvrant ${lieu || "les lieux"} ; ce relais dessert une zone ${zone} de rayon.`, f: "G_bornage" }),
          ], sigs: [`${OPJ.signe}, officier de police judiciaire`] }));
      }
      // lot 1 ter, pièces techniques : les captures de messages. Elles sont faites sur le téléphone présenté par la victime,
      // datées dans l'ordre jusqu'aux faits ; l'expéditeur est le numéro connu de l'intéressé, ou un autre numéro ; la
      // conversation est parfois partielle (la victime a supprimé ses propres réponses).
      if (has("ecrits") && N.ecrits && N.ecrits.length) {
        const rc = CR.seeded(t.sig + ":g:cap");
        const autreNum = ch(rc, 0.25), partielle = ch(rc, 0.3);
        const num = autreNum ? `07 ${int(rc, 10, 99)} ${int(rc, 10, 99)} ${int(rc, 10, 99)} ${int(rc, 10, 99)}` : A.tel;
        const datee = !(N.ecritsPiece && N.ecritsPiece.dater === false);
        const ecarts = N.ecrits.map(() => int(rc, 1, 4)), heures = N.ecrits.map(() => int(rc, 7 * 60, 23 * 60 + 50));
        const jours = []; let jd = jf; for (let i = N.ecrits.length - 1; i >= 0; i--) { jd -= i === N.ecrits.length - 1 ? 0 : ecarts[i]; jours[i] = jd; }
        const mCap = PL && E.plainte != null ? E.plainte + 25 : (E.victime != null ? E.victime + 15 : E.debut + 120);
        add("captures", mCap, N.ecritsPiece ? N.ecritsPiece.court : "Captures des messages", () => DOCS.forme({ title: N.ecritsPiece ? N.ecritsPiece.titre : "Procès-verbal de constatations — messages", kind: "releve", cote: cote("captures"),
          entete: [unite, `Procédure n° ${t.proc} — cote ${cote("captures")}`],
          blocs: [
            p(N.ecritsPiece ? N.ecritsPiece.intro : `Le ${DOCS.date(j(mCap))}, constatons, sur le téléphone présenté par ${V ? nf(V) : "le plaignant"}, les messages suivants, dont nous réalisons des captures d'écran :`),
            p({ t: `Expéditeur : le numéro ${num}${autreNum ? `, enregistré dans le répertoire sous un simple prénom ; ce numéro n'est pas celui que ${n(A)} a déclaré (${A.tel})` : `, ligne déclarée par ${n(A)}`}.`, f: autreNum ? "G_numero_autre" : undefined }),
            ...N.ecrits.map((m, i) => p({ t: datee ? `${DOCS.date(jours[i])}, ${hm(heures[i])} — ${m}` : m, f: i === 0 ? "G_ecrits" : undefined })),
            partielle ? p({ t: `${V ? Maj(il(V)) : "Le plaignant"} précise avoir supprimé ses propres réponses ; seuls les messages reçus apparaissent.`, f: "G_captures_partielles" }) : null,
          ], sigs: [`${OPJ.signe}, officier de police judiciaire`] }));
      }
      // lot 1 ter, pièces techniques : la réponse à réquisition bancaire, mouvement par mouvement, dont la somme fait le
      // total annoncé ; l'un d'eux porte parfois un libellé que la défense peut justifier (prêt familial)
      if (has("releve")) {
        const rb = CR.seeded(t.sig + ":g:bq");
        const banque = pk(rb, ["Banque Postale", "BNP Paribas", "Société Générale", "Crédit Agricole Île-de-France"]);
        const total = N.montant || int(rb, 30, 200) * 100;
        const nm = int(rb, 4, 7), stups = /^stups/.test(t.inf);
        const parts = Array.from({ length: nm }, () => 0.5 + rb()); const somme = parts.reduce((a, x) => a + x, 0);
        const mts = parts.map((x) => Math.round((total * x) / somme / 10) * 10); mts[nm - 1] += total - mts.reduce((a, x) => a + x, 0);
        const jours = mts.map((_, i) => jf - int(rb, 3, 12) * (nm - i)).sort((a, b) => a - b);
        const pret = ch(rb, 0.25) ? int(rb, 0, nm - 1) : -1;
        const proche = A.proche || "sa mère";
        const lib = (i) => (i === pret ? `virement reçu de ${proche.replace(/^sa |^son /, "")} ${A.nom}, libellé « prêt »` : stups ? pk(rb, ["dépôt d'espèces au guichet automatique", "dépôt d'espèces en agence", "versement d'espèces"]) : V ? `virement reçu de ${nf(V)}` : pk(rb, ["virement reçu d'un compte en ligne", "dépôt d'espèces", "virement instantané reçu"]));
        const mRel = PL && E.enquete ? E.enquete(3) : E.debut + 360;
        const libs = mts.map((_, i) => lib(i));
        // escroquerie : les virements partent pendant l'appel, le jour des faits, à quelques minutes d'intervalle ; les fonds
        // sont retirés en espèces dans l'heure qui suit (dates et heures sur le relevé)
        const escro = /^escroquerie/.test(t.inf) && V;
        const h0 = Math.min(((S.T0 % 1440) + 1440) % 1440, 20 * 60);
        const hVir = escro ? (() => { let h = h0; return mts.map((_, i) => (i ? (h += 3 + Math.floor(rb() * 6)) : h)); })() : null;
        const retraits = escro ? (() => { const k = int(rb, 2, 4); let h = hVir[hVir.length - 1] + int(rb, 15, 35); return Array.from({ length: k }, (_, i) => ({ h: i ? (h += int(rb, 8, 20)) : h, m: Math.min(1000, Math.round(total / k / 10) * 10), dab: pk(rb, ["Barbès", "Château-Rouge", "Clignancourt", "Saint-Ouen", "Pigalle"]) })); })() : null;
        add("releve", mRel, "Relevés bancaires", () => DOCS.forme({ title: "Réponse à réquisition bancaire — relevés de compte", kind: "releve", cote: cote("releve"),
          entete: [`${banque} · service des réquisitions judiciaires`, `Procédure n° ${t.proc} — cote ${cote("releve")}`],
          blocs: [
            irr("requisition") && !has("telephonie") ? p({ t: `Réquisition adressée le ${DOCS.date(j(mRel))} par l'officier de police judiciaire ${OPJ.nom}.`, flag: "requisition" }) : p(`Réquisition du ${DOCS.date(j(mRel))}, sur autorisation du procureur de la République.`),
            p(`Titulaire : ${n(A)}. Compte courant n° ${int(rb, 10000, 99999)} ${int(rb, 100000, 999999)}.`),
            ...mts.map((m, i) => ligne(`${DOCS.date(escro ? jf : jours[i])}${escro ? ", " + hm(hVir[i]) : ""} — ${libs[i]}`, `+ ${CR.money ? CR.money(m) : m + " €"}`)),
            ...(retraits || []).map((x) => ligne(`${DOCS.date(jf)}, ${hm(x.h)} — retrait d'espèces, distributeur ${x.dab}`, `− ${CR.money ? CR.money(x.m) : x.m + " €"}`)),
            escro ? p({ t: "Les retraits ont été effectués avec la carte attachée au compte ; la banque ne dispose pas des images des distributeurs.", f: "G_retraits" }) : null,
            p({ t: `Mouvements sans rapport avec les revenus déclarés : ${CR.money ? CR.money(total) : total + " €"} au total sur la période.`, f: "G_releve" }),
            pret >= 0 ? p({ t: `L'un de ces mouvements (${DOCS.date(jours[pret])}) est un virement libellé « prêt », émis par un proche du titulaire.`, f: "G_pret" }) : null,
          ], sigs: [] }));
      }
      // lot 1 ter, pièces techniques : le rapport d'analyse génétique. Le prélèvement donne un profil complet, ou un profil
      // partiel, ou un mélange de plusieurs ADN : la concordance n'a pas la même force. La présence de l'ADN ne date rien.
      if (has("adn")) {
        const ra = CR.seeded(t.sig + ":g:adn");
        const support = pk(ra, ["écouvillon de frottis effectué sur la poignée intérieure de la porte", "mégot de cigarette prélevé sur les lieux", "trace de sang sur le chambranle", "gant abandonné sur les lieux"]);
        const qual = ch(ra, 0.7) ? "complet" : ch(ra, 0.5) ? "partiel" : "melange";
        const loci = qual === "complet" ? 24 : int(ra, 9, 15);
        const scel = int(ra, 1, 6);
        const mAdn = PL && E.enquete ? E.enquete(4) : (E.fin != null ? E.fin - 60 : E.debut + 600);
        add("rapport_adn", mAdn, "Rapport ADN", () => DOCS.forme({ title: "Rapport d'analyse génétique", kind: "courrier", cote: cote("rapport_adn"),
          entete: ["Laboratoire de police scientifique de Paris", `Procédure n° ${t.proc} — cote ${cote("rapport_adn")}`],
          blocs: [
            p(`Scellé n° ${scel} : ${support}.`),
            p({ t: qual === "complet" ? `Profil génétique ${A.g === "f" ? "féminin" : "masculin"} complet (${loci} marqueurs), comparé au fichier national automatisé des empreintes génétiques : concordance avec le profil enregistré de ${n(A)}.`
              : qual === "partiel" ? `Profil génétique partiel (${loci} marqueurs exploitables sur 24), comparé au fichier national automatisé des empreintes génétiques : il est compatible avec le profil enregistré de ${n(A)}.`
              : `Mélange d'au moins deux ADN, comparé au fichier national automatisé des empreintes génétiques : le profil de ${n(A)} ne peut être exclu de ce mélange.`, f: "G_adn" }),
            qual === "partiel" ? p({ t: "La probabilité de concordance fortuite d'un profil partiel n'est pas négligeable.", f: "G_adn_partiel" }) : qual === "melange" ? p({ t: "Le contributeur majoritaire du mélange n'est pas identifié.", f: "G_adn_melange" }) : null,
            p("La présence d'un ADN sur un objet ne renseigne pas, à elle seule, sur la date ni sur les circonstances du dépôt."),
          ], sigs: ["L'expert en génétique"] }));
      }
      // lot 1 ter, pièces techniques : le relevé du fichier national des permis, la chaîne datée (décision, envoi du
      // recommandé, présentation, avis de réception signé ou pli non réclamé) avant les faits
      if (has("fichier") && t.f) {
        const rp = CR.seeded(t.sig + ":g:fnpc");
        const jDec = jf - (t.f.sc === "suspendu" ? int(rp, 30, 70) : int(rp, 60, 120)), jEnv = jDec + int(rp, 1, 3), jPres = jEnv + int(rp, 2, 4);
        const nonRec = dou("notif_permis");
        add("fichier_permis", E.presentation + 25, "Fichier des permis", () => DOCS.forme({ title: "Relevé du fichier national des permis de conduire", kind: "releve", cote: cote("fichier_permis"),
          entete: ["Ministère de l'Intérieur · Fichier national des permis de conduire", `Consultation du ${DOCS.date(jf)} — cote ${cote("fichier_permis")}`],
          blocs: [
            p(`Identité : ${A.nom} ${A.prenom}, né${e(A)} ${A.naissance}.`),
            t.f.sc === "jamais" ? p({ t: "Aucun permis de conduire délivré à cette identité.", f: "G_fichier" })
              : p({ t: t.f.sc === "suspendu" ? `Suspension administrative de six mois, arrêté du préfet de police du ${DOCS.date(jDec)}.` : `Invalidation pour solde de points nul (décision 48 SI du ${DOCS.date(jDec)}).`, f: "G_fichier" }),
            t.f.sc !== "jamais" ? p(`Envoi par lettre recommandée avec avis de réception le ${DOCS.date(jEnv)} ; première présentation le ${DOCS.date(jPres)}.`) : null,
            t.f.sc !== "jamais" ? p({ t: nonRec ? `Pli avisé et non réclamé, retourné à l'expéditeur le ${DOCS.date(jPres + 15)}.` : `Avis de réception signé le ${DOCS.date(jPres)}.`, f: nonRec ? "G_notif_permis" : "G_notif_ar" }) : null,
          ], sigs: [] }));
      }
      // lot 1 ter, pièces techniques : l'expertise. Sur la route, la vitesse se déduit des traces de freinage et de l'état
      // de la chaussée (v = √(2·μ·g·d), μ ≈ 0,7 sur sol sec, 0,5 sur sol mouillé) ; ailleurs, le constat technique de la
      // famille, daté sur la chronologie
      if (has("expertise") && CR.CAT.INF[t.inf]) {
        const rx = CR.seeded(t.sig + ":g:exp");
        const fam = CR.CAT.INF[t.inf].fam, caDe = (TJ.ca || "cour d'appel de Paris").replace(/^Cour/, "cour");
        const mouille = ch(rx, 0.3), dist = int(rx, 14, 42), mu = mouille ? 0.5 : 0.7;
        const v = Math.sqrt(2 * mu * 9.81 * dist) * 3.6, vMin = Math.round(v - 5), vMax = Math.round(v + 5);
        const route = fam === "route" && t.inf !== "accident_travail";
        const X = route ? { titre: "Rapport d'accidentologie", ent: "Expert en accidentologie près la cour d'appel", txt: `Traces de freinage relevées sur ${dist} mètres, chaussée ${mouille ? "mouillée" : "sèche"} (coefficient d'adhérence retenu : ${String(mu).replace(".", ",")}). Vitesse du véhicule au début du freinage estimée entre ${vMin} et ${vMax} km/h, pour une vitesse autorisée de 50 km/h.`, f: t.quoi === "r_vitesse" ? "G_circ_doute" : "G_expertise" }
          : t.inf === "accident_travail" ? { titre: "Rapport de l'inspection du travail", ent: "Direction régionale de l'économie, de l'emploi, du travail et des solidarités · Inspection du travail", txt: t.f.violation ? "Le manquement aux règles de protection a été signalé à l'employeur à deux reprises, par écrit, dans les semaines précédant l'accident, sans suite : violation manifeste d'une obligation de sécurité." : "Le dispositif de protection était en place ; la cause de l'accident reste indéterminée.", f: "G_expertise" }
          : fam === "affaires" ? { titre: "Rapport d'expertise comptable", ent: `Expert-comptable près la ${caDe}`, txt: `Les dépenses examinées, ${CR.money ? CR.money(N.montant || 0) : N.montant}, ne trouvent aucune contrepartie dans l'activité de la société.`, f: "G_expertise" }
          : fam === "numerique" || t.inf === "cyberharcelement" ? { titre: "Rapport d'expertise informatique", ent: "Expert en informatique près la cour d'appel", txt: "L'analyse du téléphone et de l'ordinateur saisis retrouve les identifiants du compte en cause et l'historique des connexions.", f: "G_expertise" }
          : t.inf === "incendie" ? { titre: "Rapport du laboratoire central", ent: "Laboratoire central de la préfecture de police", txt: t.f.volontaire ? "Présence d'hydrocarbures légers dans les prélèvements : origine volontaire de l'incendie." : "Départ de feu sur le balcon supérieur ; mégots dans un pot de fleurs au contact de stores en toile.", f: "G_expertise" }
          : { titre: "Rapport d'expertise", ent: `Expert près la ${caDe}`, txt: "Les constatations techniques confirment les déclarations de la victime sur l'étendue du dommage.", f: "G_expertise" };
        const mExp = PL && E.enquete ? E.enquete(4) : (E.fin != null ? E.fin - 120 : E.debut + 420);
        add("expertise", mExp, X.titre, () => DOCS.forme({ title: X.titre, kind: "courrier", cote: cote("expertise"), entete: [X.ent, `Procédure n° ${t.proc} — cote ${cote("expertise")}`],
          blocs: [p(`Mission confiée par ${t.flagrance ? "l'officier de police judiciaire" : "le procureur de la République"} le ${DOCS.date(Math.max(jf, j(mExp) - 1))}.`), p({ t: X.txt, f: X.f }), route && mouille ? p("La pluie était tombée dans l'heure précédente ; l'adhérence retenue en tient compte.") : null],
          sigs: ["L'expert"] }));
      }
      // lot 1 ter, pièces techniques : le rapport du laboratoire sur les produits saisis, accordé à la pesée du service
      // (poids brut, emballages compris, à la pesée ; poids net au laboratoire) ; taux tirés dans les fourchettes d'usage
      if (S.stups && has("labo") && CR.CAT.INF[t.inf] && CR.CAT.INF[t.inf].fam !== "route" && t.f.quantite) {
        const rl = CR.seeded(t.sig + ":g:labo");
        const brutDe = () => { const rp = CR.seeded(t.sig + ":g:pes"); return Math.round(t.f.quantite * (1.03 + rp() * 0.05) * 10) / 10; };
        const net = t.f.quantite, prod = t.f.produit;
        const taux = prod === "cannabis" ? (/herbe/.test(N.saisie || "") ? int(rl, 8, 22) : int(rl, 15, 34)) : prod === "cocaine" ? int(rl, 32, 84) : prod === "crack" ? int(rl, 60, 90) : prod === "mdma" ? int(rl, 70, 160) : prod === "ketamine" ? int(rl, 55, 95) : null;
        const nature = prod === "cannabis" ? (/herbe/.test(N.saisie || "") ? "herbe de cannabis" : "résine de cannabis") : prod === "cocaine" ? "chlorhydrate de cocaïne" : prod === "crack" ? "cocaïne base (crack)" : prod === "mdma" ? "comprimés contenant de la MDMA" : prod === "ketamine" ? "kétamine" : "produit stupéfiant";
        const tauxTxt = taux == null ? "" : prod === "cannabis" ? `, taux de THC de ${taux} %` : prod === "mdma" ? `, ${taux} mg de MDMA par comprimé en moyenne` : `, pureté de ${taux} %`;
        const jl = Math.floor((E.fin != null ? E.fin : E.debut + 600) / 1440);
        add("rapport_labo", E.fin != null ? E.fin - 90 : E.debut + 500, "Rapport du laboratoire", () => DOCS.forme({ title: "Rapport d'analyse des produits saisis", kind: "courrier", cote: cote("rapport_labo"),
          entete: ["Laboratoire de toxicologie de la préfecture de police", `Procédure n° ${t.proc} — cote ${cote("rapport_labo")}`],
          blocs: [
            p(`Scellé reçu le ${DOCS.date(j(Math.max(E.debut, (E.pesee || E.debut) + 60)))} : ${N.saisie || "produits saisis"}.${E.pesee != null ? ` Poids brut déclaré par le service à la pesée : ${String(brutDe()).replace(".", ",")} g, emballages compris.` : ""}`),
            p(`Pesée nette, hors emballages : ${String(net).replace(".", ",")} g.`),
            p({ t: `Analyse : ${nature}${tauxTxt}.`, f: "G_labo" }),
            t.quoi === "usage" ? p({ t: "Dépistage urinaire de la personne : positif. Elle déclare une consommation quotidienne depuis plusieurs années.", f: "G_conso" }) : null,
            mention(`Rapport établi le ${DOCS.date(jl)}.`),
          ], sigs: ["L'ingénieur du laboratoire"] }));
      }
      // stupéfiants : pesée et test
      if (E.pesee != null) add("pv_pesee", E.pesee, "Pesée et test", () => {
        const rr = CR.seeded(t.sig + ":g:pes");
        const produit = { cannabis: "au cannabis", cocaine: "à la cocaïne", crack: "à la cocaïne base (crack)", mdma: "à la MDMA", ketamine: "à la kétamine" }[t.f.produit] || "à un produit stupéfiant";
        const [drogue, ...argent] = saisieTxt.split(/ et (?=[\d\s]+ ?€)/);
        return DOCS.pv({ cote: cote("pv_pesee"), proc: t.proc, service, unite, titre: "Procès-verbal de pesée et de test", jour: j(E.pesee), heure: E.pesee, redacteur: OPJ, visa: vis("Vu les articles 54 et 60 du code de procédure pénale,", "Vu les articles 77-1 et 76 du code de procédure pénale,"), lieu: `Nous trouvant au ${commLong}`,
          blocs: [
            p(`En présence de ${n(A)}, procédons à la pesée des produits saisis : ${drogue}.`),
            p(`Pesée sur balance de précision du service : poids brut ${String(t.f.quantite != null ? Math.round(t.f.quantite * (1.03 + rr() * 0.05) * 10) / 10 : "—").replace(".", ",")} g, emballages compris.`),
            p({ t: `Test de détection rapide : réaction positive ${produit}.`, f: S.constatDecouvre ? "G_saisie" : undefined }),
            argent.length ? p(`Comptage des espèces saisies : ${argent.join(" et ").replace(/ en espèces$/, "")}, en coupures diverses, placées sous scellé distinct.`) : null,
            p("Plaçons le tout sous scellé fermé, pour analyse par le laboratoire de toxicologie."),
          ], cloture: mention("Dont procès-verbal, que la personne signe avec nous."), signataires: ["La personne gardée à vue", `${OPJ.signe}, officier de police judiciaire`], st: stO });
      });
      // perquisition au domicile, pendant la mesure
      if (S.perq) add("pv_saisie", E.perq, "Perquisition et saisie", () => {
        const rr = CR.seeded(t.sig + ":g:perq");
        const deja = S.constatDecouvre && S.stups;
        return DOCS.pv({ cote: cote("pv_saisie"), proc: t.proc, service, unite, titre: "Procès-verbal de perquisition et de saisie", jour: j(E.perq), heure: E.perq, redacteur: OPJ, visa: vis("Vu les articles 56, 57 et 59 du code de procédure pénale,", "Vu les articles 76, 56, 57 et 59 du code de procédure pénale,"), lieu: `Nous transportant au domicile de ${n(A)}, ${A.adresse}`,
          blocs: [
            p({ t: `Le ${DOCS.date(j(E.perq))}, à ${hm(E.perq)}, nous transportons au domicile de ${n(A)}, ${A.adresse}, ${PL ? "dans le cadre de l'enquête préliminaire" : "en flagrance (art. 56)"}, et procédons à une perquisition en sa présence.`, flag: irr("perq_nuit") ? "perq_nuit" : undefined }),
            PL ? (irr("perq_assentiment") ? p({ t: "L'intéressé, présent, déclare consentir oralement à la perquisition.".replace("L'intéressé,", `L'intéressé${e(A)},`).replace("présent,", `présent${e(A)},`), flag: "perq_assentiment" })
              : p(`L'intéressé${e(A)} donne son assentiment exprès à la perquisition, par une déclaration écrite de sa main annexée au présent procès-verbal (art. 76).`)) : null,
            p(`${Maj(il(A))} est extrait${e(A)} de la cellule de garde à vue et conduit${e(A)} sur les lieux, menotté${e(A)}. ${pk(rr, ["L'appartement comprend une entrée, un séjour, une cuisine et une chambre.", "Studio d'une pièce avec coin cuisine et salle d'eau.", "Appartement de deux pièces au troisième étage."])}`),
            deja ? p(pk(rr, ["Dans la chambre, sur une étagère, découvrons une balance électronique de précision et un rouleau de sachets de conditionnement.", "Rien de nature à intéresser l'enquête n'est découvert dans les pièces visitées.", "Dans un tiroir de la cuisine, découvrons des sachets vides de type zip."]))
              : p({ t: `Découvrons ${saisieTxt || "des objets en lien avec les faits"}, que nous plaçons sous scellé n° ${int(rr, 2, 9)}.`, f: "G_saisie" }),
            ...(N.conc || []).filter((c) => c.inf === "arme_b").map((c) => p({ t: c.constat, f: c.fait })),
            // cambriolage : ce qui est retrouvé, rapproché de ce que la victime a déclaré volé
            t.inf === "cambriolage" && V && butinDe(N) && saisieTxt && butinDe(N) !== saisieTxt ? p({ t: `Rapprochement avec la plainte de ${nf(V)}, qui déclare le vol de ${butinDe(N)} : seul${/^une |^la /.test(saisieTxt) ? "e" : ""} ${saisieTxt.replace(/^un /, "un ").replace(/^une /, "une ")} ${/^des |^deux /.test(saisieTxt) ? "sont retrouvés" : "est retrouvé" + (/^une /.test(saisieTxt) ? "e" : "")}, ${pk(rr, ["son numéro de série correspondant à la facture remise par la victime", "reconnu par la victime sur photographie", "portant la gravure décrite par la victime"])} ; le reste n'est pas retrouvé.`, f: "G_partiel" }) : null,
            t.quoi === "usage" ? p({ t: "Aucune balance, aucun conditionnement, aucune somme d'argent n'est découvert.", f: "G_conso" }) : null,
            p(`Fin des opérations à ${hm(E.perqFin)}. Retour au service, réintégration en cellule.`),
          ], cloture: mention("Dont procès-verbal, que la personne chez qui la perquisition a eu lieu signe avec nous."), signataires: ["La personne chez qui la perquisition a eu lieu", `${OPJ.signe}, officier de police judiciaire`].concat(PL ? [{ qui: "Assentiment écrit de la personne (annexe)", t: irr("perq_assentiment") ? "" : "signé", flag: irr("perq_assentiment") ? "perq_assentiment" : undefined }] : []), st: stO });
      });
      // audition du gardé à vue (dossier de jugement)
      if (t.genre !== "gav") add("pv_audition", E.aud, AL ? "Audition libre" : "Audition en garde à vue", () => {
        const rr = CR.seeded(t.sig + ":g:aud");
        const nie = t.stance === "nie";
        const avAL = AL && ch(rr, 0.45); // en audition libre, l'avocat n'est là que si la personne l'a demandé
        const blocs = AL ? [
          p(PL ? `${n(A)} se présente librement au service, sur convocation ${S.convocation != null ? `du ${DOCS.date(j(S.convocation))}` : "téléphonique"}, à ${hm(E.interp)}.`
            : `${n(A)}, interpellé${e(A)} à ${hm(E.interp)} et conduit${e(A)} au service, n'est pas placé${e(A)} en garde à vue (art. 73, al. 2).`),
          irr("al_quitter") ? p({ t: "Avant toute audition, notifions à la personne la qualification, la date et le lieu présumés de l'infraction, le droit de faire des déclarations, de répondre aux questions ou de se taire, le droit d'être assistée par un avocat et de bénéficier de conseils juridiques gratuits.", flag: "al_quitter" })
            : p("Avant toute audition, notifions à la personne la qualification, la date et le lieu présumés de l'infraction, le droit de quitter à tout moment les locaux où elle est entendue, d'être assistée par un interprète, de faire des déclarations, de répondre aux questions ou de se taire, d'être assistée par un avocat et de bénéficier de conseils juridiques gratuits (art. 61-1)."),
          avAL ? p(`La personne demande l'assistance d'un avocat. ${av}, avisé, est présent ; l'audition commence à ${hm(E.aud)}.`) : p(`La personne déclare ne pas souhaiter l'assistance d'un avocat${ch(rr, 0.5) ? " pour le moment" : ""}.`),
          titre("SUR LA PERSONNALITÉ"),
        ] : [
          irr("sans_avocat") ? p({ t: `${av}, avocat commis d'office, avisé à ${hm(C.avisAv)}, ne s'étant pas présenté, procédons à l'audition.`, flag: "sans_avocat" }) : p(`En présence de ${av}, avocat, qui s'est entretenu avec la personne pendant trente minutes, de ${hm(E.aud - 35)} à ${hm(E.aud - 5)}.`),
          p("Rappelons à la personne qu'elle a le droit, après avoir décliné son identité, de faire des déclarations, de répondre aux questions qui lui sont posées ou de se taire."),
          titre("SUR LA PERSONNALITÉ"),
        ];
        blocs.push(
          q("Quelle est votre situation familiale ?"), rep(A.enfants ? `Je vis avec ${moi(A.proche) || "ma famille"}, j'ai ${A.enfants} enfant${A.enfants > 1 ? "s" : ""}.` : A.proche ? `Je vis avec ${moi(A.proche)}.` : "Je vis seul" + e(A) + "."),
          q("Où demeurez-vous ?"), rep(A.heberg ? `${A.adresse}. Depuis ${pk(rr, ["deux ans", "cinq ans", "toujours"])}.` : "Je n'ai pas d'adresse fixe en ce moment, je dors chez des amis."),
          q("Quelles sont vos ressources ?"), rep(A.emploi ? `Je suis ${A.metier}, je gagne environ ${CR.money(A.revenu || 1500)} par mois.` : "Je n'ai pas de travail en ce moment."),
          q("Avez-vous déjà été condamné(e) ?"), rep(A.casier ? (t.rec ? "Oui, pour des faits du même genre, il y a moins de cinq ans." : "Une fois, il y a longtemps.") : "Jamais."),
          titre("SUR LES FAITS"),
          ...(N.audition || []).map((a, i) => [q(a.q), rep({ t: a.a.expliquer, f: i === 0 && !nie ? "G_aveu" : undefined })]),
          saisieTxt && has("saisie") ? [q(`Que pouvez-vous nous dire de ${saisieTxt.replace(/^(\d)/, "les $1")} découvert${acc || (/^de |^des /.test(saisieTxt) ? "s" : "")} ?`.replace(/de des /, "des ").replace(/de de /, "de ")), rep(nie ? (acc.endsWith("s") ? "Ce n'est pas à moi, tout ça." : "Ce n'est pas à moi.") : S.stups ? (t.quoi === "usage" ? "C'est pour ma consommation." : "C'est à moi.") : acc.endsWith("s") ? "Je les avais sur moi, oui." : "Je l'avais sur moi, oui.")] : null,
          (N.qA || []).length && !nie ? [q(N.qA[0].q), rep(N.qA[0].a[0])] : null,
          q("Avez-vous quelque chose à ajouter ?"), rep(nie ? "Je n'ai rien fait." : pk(rr, ["Je regrette.", "Je ne recommencerai pas.", "Je veux m'excuser."])),
          (AL ? !avAL : irr("sans_avocat")) ? null : p(`${av} ${ch(rr, 0.5) ? "n'a pas de question à poser" : AL ? "demande que soit précisé le moment où la personne a été informée de ses droits ; il est répondu par référence au présent procès-verbal" : "demande que soit précisée l'heure à laquelle la personne a été conduite au service ; il est répondu par référence au procès-verbal d'interpellation"}.`),
          // en audition libre, la suite est donnée à la fin de l'audition (la garde à vue a son procès-verbal de fin)
          AL && S.issue ? p(`À l'issue de l'audition, ${issueTxt().replace(/^Sur/, "sur")}`) : null,
        );
        return DOCS.pv({ cote: cote("pv_audition"), proc: t.proc, service, unite, titre: AL ? "Procès-verbal d'audition libre" : "Procès-verbal d'audition de la personne gardée à vue", qualite: AL ? "Personne entendue librement" : "Personne gardée à vue", numPV: "00" + int(rr, 101, 899), jour: j(E.aud), heure: E.aud, redacteur: OPJ, lieu: `Nous trouvant au ${commLong}`,
          identite: identite(A), blocs, cloture: DOCS.clotureAudition(ville, j(E.audFin), E.audFin, il(A) === "elle" ? "elle" : "lui"), signataires: ["La personne entendue", (AL ? avAL : !irr("sans_avocat")) ? `${av}, avocat` : null, `${OPJ.signe}, officier de police judiciaire`].filter(Boolean), st: stO });
      });
    }

    // ---- cotes : l'ordre chronologique des actes, pièces d'avant comprises (k.reste : celles que le moteur ne compose pas)
    for (const x of k.reste || []) if (!docs[x.key]) ordre.push(x);
    ordre.sort((a, b) => a.m - b.m);
    ordre.forEach((o, i) => { cotes[o.key] = "D" + (i + 1); titres[o.key] = `${o.court} (D${i + 1})`; });
    return { docs, titres, ordre, cotes };
  };
})();
