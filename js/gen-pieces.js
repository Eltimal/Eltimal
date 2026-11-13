/* La Permanence — les pièces des affaires générées (dossier à fouiller, n° 2).
   Procès-verbaux horodatés, certificats, relevés, rapports, avec les mots des personnes ; les irrégularités tirées par le moteur
   sont portées en secret par un passage (flag) ou par deux passages à relier (paire), jamais signalées ; les incohérences
   (ITT, description, téléphonie…) portent des faits que le joueur peut noter et plaider.
   GEN2.pieces(t, N) rend { docs, titres, anomalies, facts, listes } pour la définition de l'affaire. */
(function () {
  const CR = window.CR;
  const CAT = CR.CAT;
  const GEN2 = CR.GEN2;
  const S = "signé";
  const hm = (m) => CR.fmtTime(((Math.round(m) % 1440) + 1440) % 1440);
  const D = (d) => CR.fmtDate(d, "long");
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const eur = (n) => CR.money(n);
  const VERIF = CAT.VERIF;
  // guillemets à l'intérieur d'une citation : « … “sale chienne” … »
  const guill = (x) => String(x).replace(/«\s?/g, "“").replace(/\s?»/g, "”");
  const gp = (nom) => (/^(Léa|Sarah|Aurélie|Nadia|Inès)\b/.test(nom) ? "Gardienne de la paix" : "Gardien de la paix");

  // ------------------------------------------------------------------ Régimes ajoutés (même forme que CR.IRREG, law-fr.js)
  const IRR_NEUFS = {
    gav_avis_parquet_tardif: { label: "Procureur avisé tardivement du placement en garde à vue", regle: "L'officier de police judiciaire informe le procureur de la République dès le début de la garde à vue (art. 63). Un retard que ne justifie aucune circonstance insurmontable porte atteinte aux intérêts de la personne.", textes: ["CPP_63"], sanction: "nullite", grief: "presume", effet: "Annulation de la garde à vue et des auditions", regul: false, prog: "pp_enquete" },
    gav_prolongation_tardive: { label: "Prolongation de la garde à vue autorisée après l'expiration des vingt-quatre heures", regle: "La garde à vue ne peut dépasser vingt-quatre heures que sur autorisation écrite et motivée du procureur, donnée avant l'expiration du premier délai (art. 63, II).", textes: ["CPP_63"], sanction: "nullite", grief: "presume", effet: "Annulation de la mesure au-delà de la vingt-quatrième heure et des auditions qui s'y sont tenues", regul: false, prog: "pp_enquete" },
    controle_identite_irregulier: { label: "Contrôle d'identité sans fondement légal", regle: "Un contrôle d'identité suppose une raison plausible de soupçonner une infraction, ou des réquisitions écrites du procureur, ou l'un des cas de l'article 78-2 ; une attitude ou un regard ne suffisent pas.", textes: ["CPP_78-2"], sanction: "nullite", grief: "presume", effet: "Annulation du contrôle et des actes dont il est le support : palpation, fouille, saisie, interpellation", regul: false, prog: "pp_enquete" },
    fouille_irreguliere: { label: "Fouille réalisée hors du contrôle d'un officier de police judiciaire", regle: "La fouille à corps est assimilée à une perquisition : elle relève de l'officier de police judiciaire (art. 56) ; la simple palpation de sécurité ne permet pas de fouiller les poches.", textes: ["CPP_56"], sanction: "nullite", grief: "presume", effet: "Annulation de la fouille et de la saisie qui en découle", regul: false, prog: "pp_enquete" },
    perquisition_assentiment: { label: "Perquisition en enquête préliminaire sans assentiment écrit", regle: "En enquête préliminaire, la perquisition exige l'assentiment exprès de la personne, écrit de sa main (art. 76), ou l'autorisation du juge des libertés et de la détention.", textes: ["CPP_76"], sanction: "nullite", grief: "presume", effet: "Annulation de la perquisition et des saisies (art. 174)", regul: false, prog: "pp_enquete" },
    geolocalisation_sans_autorisation: { label: "Géolocalisation prolongée au-delà de quinze jours sans le juge", regle: "Le procureur autorise la géolocalisation pour quinze jours au plus ; au-delà, l'autorisation du juge des libertés et de la détention est nécessaire (art. 230-33).", textes: ["CPP_230-33"], sanction: "nullite", grief: "presume", effet: "Annulation des données de géolocalisation recueillies au-delà du quinzième jour", regul: false, prog: "pp_enquete" },
    requisition_sans_autorisation: { label: "Réquisition en enquête préliminaire sans l'autorisation du procureur", regle: "En préliminaire, l'officier de police judiciaire ne requiert la remise d'informations que sur autorisation du procureur (art. 77-1-1) ; régime des données de connexion encadré depuis 2022, effet exact à vérifier.", textes: ["CPP_77-1-1"], sanction: "nullite", grief: "prouver", aVerifier: true, effet: "Annulation des réponses obtenues et des actes qui en découlent", regul: false, prog: "pp_enquete" },
  };
  for (const [k, v] of Object.entries(IRR_NEUFS)) if (!CR.IRREG[k]) CR.IRREG[k] = Object.assign({ id: k, source: VERIF }, v);
  Object.assign(CR.INDICES, {
    gav_avis_parquet_tardif: "À quelle heure la mesure a-t-elle pris effet, et à quelle heure le procureur a-t-il été avisé ? Que dit l'article 63 ?",
    gav_prolongation_tardive: "Comptez vingt-quatre heures depuis le début de la mesure. L'autorisation de prolonger est-elle arrivée avant ?",
    controle_identite_irregulier: "Pourquoi les policiers ont-ils contrôlé cette personne ? Le procès-verbal donne-t-il une raison que la loi admet ?",
    fouille_irreguliere: "Qui a fouillé, et en présence de qui ? Une palpation, ou une fouille des poches ?",
    perquisition_assentiment: "Enquête de flagrance ou préliminaire ? Et comment la personne a-t-elle consenti à la perquisition ?",
    geolocalisation_sans_autorisation: "Combien de jours a duré la géolocalisation, et qui l'a autorisée ?",
    requisition_sans_autorisation: "Qui a envoyé la réquisition à l'opérateur ou à la banque, et sur quelle autorisation ?",
    gav_audition_sans_avocat: "La personne a-t-elle demandé un avocat ? Était-il là quand l'audition a commencé ?",
    pv_heure_incoherente: "Relevez l'heure de l'interpellation, puis l'heure à laquelle la mesure a pris effet. Les deux pièces disent-elles la même chose ?",
  });

  // ------------------------------------------------------------------ Les pièces
  GEN2.pieces = function (t, N) {
    let r = CR.seeded(t.sig + ":pieces");
    const A = t.A, V = t.V, T = t.T, P = t.P;
    const n = (x) => (x ? `${x.prenom} ${x.nom}` : "");
    const civ = (x) => (x && x.g === "f" ? "Mme" : "M.");
    const nf = (x) => `${civ(x)} ${n(x)}`;
    const e = (x) => (x && x.g === "f" ? "e" : "");
    const il = (x) => (x && x.g === "f" ? "elle" : "il");
    const has = (k) => t.preuves.includes(k);
    const irr = (k) => t.irr.includes(k);
    const dou = (k) => t.doutes.includes(k);
    const q = t.q;
    const opjN = (CR.acteur(t.opj) || {}).nom || "l'officier de police judiciaire";
    const docs = {}, titres = {}, facts = {}, anomalies = {};
    let cote = 0;
    const cotes = {};
    const add = (key, titre, fn) => { cote++; cotes[key] = "D" + cote; titres[key] = `${titre} (D${cote})`; docs[key] = fn; };
    // phase 3 : le commissariat du lieu des faits, le tribunal compétent, sa cour d'appel
    const LZ = CR.MONDE.lieuxDe(t), SF = LZ.F, TJ = LZ.TJ, caDe = TJ.ca.replace(/^Cour/, "cour");
    const ent = (key, svc) => [svc || (t.pnf ? "Office central de lutte contre la corruption et les infractions financières et fiscales (OCLCIFF), Nanterre" : `${SF.paris ? "Préfecture de police" : "Police nationale"} · ${SF.comm}`), `Procédure n° ${t.proc} — cote ${cotes[key]}`];
    const fact = (id, o) => { if (!facts[id]) facts[id] = o; };

    // ---------------------------------------------------------------- Chronologie de la mesure
    const C = {};
    const d = t.d;
    if (t.mesure === "gav") {
      if (t.genre === "gav" || t.genre === "ci") { C.jg = t.day + (d.debut < 0 ? -1 : 0); C.debut = ((d.debut % 1440) + 1440) % 1440; }
      else { C.jg = d.mesure != null ? d.mesure : d.acte != null && !t.flagrance ? d.acte : d.faits; C.debut = t.flagrance ? (d.h + int(r, 10, 30)) : pk(r, [6 * 60 + 5, 8 * 60 + 40, 9 * 60 + 30]); }
      C.interp = irr("heures") ? C.debut - int(r, 65, 100) : C.debut;
      C.notif = irr("gav_notif") ? C.debut + int(CR.seeded(t.sig + "n"), 140, 190) : C.debut + int(r, 10, 20);
      C.avisPq = irr("avis_parquet") ? C.debut + int(r, 185, 260) : C.debut + int(r, 15, 35);
      C.avisAv = C.notif + 5;
      C.aud = C.avisAv + (irr("sans_avocat") ? int(r, 40, 80) : int(r, 125, 210));
      C.audFin = C.aud + int(r, 25, 70);
    } else if (t.mesure === "al") {
      C.jg = t.genre === "al" ? d.audition : d.mesure != null ? d.mesure : d.acte != null ? d.acte : d.faits + int(r, 5, 30);
      C.aud = 14 * 60 + int(r, 0, 20); C.audFin = C.aud + int(r, 40, 90);
    }
    if (CR.SIM && CR.SIM.supporte(t)) { CR.SIM.equipage(t); CR.SIM.caler(t, C); CR.SIM.adresses(t, N, CR.MONDE.lieuxDe(t).F); }
    const jf = d.faits;
    const lieu = N.lieu;
    // aucun acte d'enquête après le dernier acte retenu pour la prescription (classement) ou après la convocation
    const dMax = t.genre === "pc" && d.voiePc === "classe" ? d.acte - 1 : d.mesure != null ? d.mesure : Infinity;
    const DM = (x) => Math.max(jf, Math.min(x, dMax));

    // ---------------------------------------------------------------- Faits du bloc-notes
    fact("G_version", { label: "Sa version des faits" });
    if (t.genre !== "pc") {
      fact("G_heberg", { label: A.heberg ? `Un hébergement stable, ${A.rue}` : "Pas d'hébergement stable", key: true, why: "La première garantie de représentation : sans adresse, ni contrôle judiciaire ni aménagement." });
      fact("G_casier", { label: t.ant ? `Une condamnation : ${t.ant.label}, ${D(t.ant.jug)}${t.rec ? " — le parquet retient la récidive" : ""}` : A.casier ? (t.rec ? "Une condamnation récente pour des faits similaires : la récidive" : "Une ancienne condamnation") : "Aucune condamnation", key: true, why: t.rec ? "La récidive légale double le maximum encouru (art. 132-10) ; encore faut-il que ses conditions soient réunies." : "" });
      if (A.emploi) fact("G_emploi", { label: `Un emploi : ${A.metier}`, key: true });
    }
    fact("G_qualif", { label: `La qualification : ${q.label} (${q.court})`, key: true, why: `Peine encourue : ${CAT.encourueTexte(q)}.` });
    if (irr("gav_notif")) fact("G_notif", { label: "Ses droits notifiés plus de deux heures après le début de la mesure", key: true, why: "Un retard que ne justifie aucune circonstance insurmontable entraîne la nullité de la garde à vue (art. 63-1)." });
    if (irr("interprete")) fact("G_langue", { label: `${A.g === "f" ? "Elle" : "Il"} comprend mal le français`, key: true, why: "La personne qui ne comprend pas le français a droit à un interprète à chaque étape (art. 63-1)." });

    // ---------------------------------------------------------------- vidéo jouée par le moteur (js/video.js)
    // Arrachage à pied, fuite vers le métro : la caméra de la sortie de la station filme la scène. La tenue de l'auteur
    // à l'image est celle que décrit l'interpellation, sauf doute sur l'identification : les chaussures diffèrent alors.
    const VID = (() => {
      if (!CR.video || t.inf !== "vol" || !t.f || t.f.sc !== "arrachage" || !has("video") || N.video || !V || !A) return null;
      if ((t.f.agg || []).includes("reunion")) return null; // plusieurs auteurs : le moteur n'en joue qu'un
      if (!(N.constat || []).some((x) => /à pied, qui s'est enfui vers le métro/.test(x))) return null;
      const rv = CR.seeded(t.sig + ":video");
      const objet = /chaîne|collier/.test(t.f.objet) ? "chaine" : /montre|bracelet/.test(t.f.objet) ? "poignet" : "telephone";
      const violence = t.quoi !== "violence" && (t.f.itt > 0 || (t.f.agg || []).includes("violence0"));
      const h = ((d.h % 1440) + 1440) % 1440;
      // lever et coucher du soleil à Paris, heure légale, au milieu de chaque mois
      const SOL = [[520, 1035], [485, 1080], [440, 1130], [435, 1235], [385, 1275], [350, 1315], [365, 1310], [405, 1270], [450, 1210], [490, 1145], [475, 1030], [515, 1015]][CR.ymd(jf).m - 1];
      const mode = h >= SOL[0] + 20 && h < SOL[1] - 20 ? "jour" : h >= SOL[0] - 30 && h < SOL[1] + 30 ? "soir" : rv() < 0.6 ? "ir" : "soir";
      const tenueClient = CR.SIM ? CR.SIM.tenueAuteur(t) : CR.video.tenue(t.sig + ":tenue", { hauts: ["sweat", "sweat", "doudoune", "blouson", "survet"], capuche: 0.7 });
      const tenueImage = Object.assign({}, tenueClient);
      if (dou("doute_ident")) tenueImage.chauss = tenueClient.chauss === "blanches" ? "noires" : "blanches";
      const s0 = (((h - 2) * 60 - 9) % 86400 + 86400) % 86400, p2 = (x) => String(x).padStart(2, "0");
      const spec = {
        faits: "arrache", graine: t.sig, mode, cam: "CAM 04", fuite: "escalier",
        date: CR.fmtDate(jf, "num").replace(/\//g, "-"), heure: `${p2(Math.floor(s0 / 3600))}:${p2(Math.floor(s0 / 60) % 60)}:${p2(s0 % 60)}`,
        objet, violence, victime: { g: V.g, agee: V.age >= 68, telephone: true }, auteur: { g: A.g, tenue: tenueImage },
      };
      return { spec, tenueClient, S: CR.video.extrait(spec) };
    })();

    // ---------------------------------------------------------------- D : interpellation ou plainte
    const contr = ["stups_usage", "stups_detention", "stups_trafic", "recel", "defaut_permis", "outrage", "rebellion", "violences_pdap"].includes(t.inf);
    if (t.flagrance) {
      add("pv_interpellation", "Interpellation", () => ({ title: "Procès-verbal d'interpellation", kind: "pv", entete: ent("pv_interpellation"), paras: [
        [`Le ${D(jf)}, nous, ${t.gpx[0]} et ${t.gpx[1]}, ${gp(t.gpx[0]) === gp(t.gpx[1]) && gp(t.gpx[0]).startsWith("Gardienne") ? "gardiennes" : "gardiens"} de la paix, agents de police judiciaire en patrouille ${SF.paris ? `dans le ${SF.arr} arrondissement` : `à ${SF.nom}`} :`],
        irr("controle_identite") ? [{ t: "Agissant dans le cadre d'une patrouille de sécurisation, remarquons un individu qui, à notre vue, détourne le regard et presse le pas. Procédons au contrôle de son identité.", flag: "controle_identite" }]
          : contr && (!CAT.INF[t.inf].controle || CAT.INF[t.inf].controle(t.f)) ? [`Agissant sur réquisitions écrites du procureur de la République en date du ${D(jf - 1)}, prises en application de l'article 78-2, aux fins de recherche et de poursuite d'infractions à la législation sur les stupéfiants, le port d'armes et le vol, dans le périmètre du quartier.`] : null,
        ...N.constat.map((x) => [x]),
        ...(N.conc || []).filter((c) => c.inf !== "arme_b").map((c) => [{ t: c.constat, f: c.fait }]),
        irr("fouille") ? [{ t: `Sans attendre l'officier de police judiciaire, le gardien de la paix ${t.gpx[1].split(" ")[1]} procède à la fouille des poches et du sac de l'intéressé${N.saisie ? ` ; y découvrons ${N.saisie}` : ""}.`, flag: "fouille" }] : N.saisie && has("saisie") ? [`Palpation de sécurité, puis, en présence de l'officier de police judiciaire, fouille : découverte de ${N.saisie}.`] : ["Palpation de sécurité : rien à signaler."],
        [{ t: `Interpellation à ${hm(t.mesure === "gav" ? C.interp : d.h + 15)}.`, paire: irr("heures") ? "heures" : undefined, f: "G_interp" }],
        irr("interprete") ? [{ t: `La personne s'exprime avec difficulté en français ; ${il(A)} est ${A.etranger}. Ses réponses se font par gestes et par mots isolés.`, f: "G_langue", paire: "interprete" }] : [`La personne décline son identité : ${n(A)}, ${A.age} ans, ${A.metier}${(() => { const x = dou("doute_ident") ? pk(r, ["un blouson noir et d'un jean", "un manteau beige", "un sweat blanc à capuche"]) : null; return VID ? `, vêtu${e(A)} ${CR.video.vetu(VID.tenueClient, A.g)}` : x ? `, vêtu${e(A)} d'${x}` : ""; })()}.`],
        VID && irr("interprete") ? [`${n(A)} est vêtu${e(A)} ${CR.video.vetu(VID.tenueClient, A.g)}.`] : null,
        t.camera ? [{ t: { violences: "Les faits se sont déroulés devant un établissement dont la façade est équipée d'une caméra.", rebellion: "Le contrôle a lieu devant un bureau de tabac dont la vitrine est équipée d'une caméra." }[t.inf] || "Une caméra privée est fixée sur la façade du commerce voisin.", f: "G_camera" }] : ["Aucune caméra n'est relevée à proximité."],
        [`Conduite au ${SF.paris ? SF.commCourt.replace("commissariat", "commissariat central") : SF.commCourt} ; présentation à l'officier de police judiciaire à ${hm((t.mesure === "gav" ? C.interp : d.h + 15) + 8)}.`],
        ["Dont procès-verbal."],
      ].filter(Boolean), sigs: [{ qui: `${gp(t.gpx[0])} ${t.gpx[0]}`, t: S }, { qui: `${gp(t.gpx[1])} ${t.gpx[1]}`, t: S }] }));
    }
    if (V && (has("plainte") || t.genre === "pc")) {
      const pl = N.plainte || [];
      const h0 = t.flagrance && t.mesure === "gav" ? C.debut + 45 : int(r, 9 * 60, 18 * 60);
      const jv = t.flagrance ? jf : d.plainte != null ? d.plainte : jf + int(r, 0, 3);
      add("pv_victime", t.flagrance ? "Audition de la victime" : "Plainte", () => ({ title: t.flagrance ? "Procès-verbal d'audition de la victime" : "Procès-verbal de plainte", kind: "pv", entete: ent("pv_victime"), paras: [
        [`Le ${D(jv)}, à ${hm(h0)}, devant nous, ${t.flagrance ? opjN : "brigadier-chef " + pk(r, ["Laurent Guichard", "Myriam Saïdi", "Olivier Brun"])}, comparaît ${nf(V)}, ${V.age} ans, ${V.metier}, demeurant ${V.adresse}, qui déclare :`],
        ...pl.map((x, i) => [{ t: `« ${guill(x)} »`, f: i === 0 ? "G_plainte" : undefined }]),
        dou("doute_ident") ? [{ t: `« Il portait ${pk(r, ["un survêtement rouge", "une doudoune verte", "un bob noir et des lunettes"])}. Je ne l'avais jamais vu. Je ne suis pas sûr${e(V)} de pouvoir le reconnaître. »`, f: "G_doute_ident" }] : null,
        t.quoi === "vulnerable" ? [{ t: "« Je vis seule, je fais mes courses et je gère mes comptes moi-même, mon fils passe le dimanche. »", f: "G_autonome" }] : null,
        t.quoi === "itt" ? [{ t: `« Aux urgences, le médecin m'a donné ${t.f.itt} jours d'arrêt. »`, f: "G_itt_urg" }] : null,
        ["Lecture faite, persiste et signe."],
      ].filter(Boolean), sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "La personne entendue", t: S }] }));
      fact("G_plainte", { label: `La plainte de ${nf(V)}`, key: t.genre === "pc" });
    }

    // ---------------------------------------------------------------- D : notification des droits (garde à vue)
    if (t.mesure === "gav") {
      const notifTexte = irr("interprete")
        ? { t: `À ${hm(C.debut + 15)}, notifions à ${n(A)} ses droits, en langue française ; ${il(A)} déclare comprendre et signe.`, f: "G_notif_fr", flag: "interprete" }
        : { t: `À ${hm(C.notif)}, notifions à ${n(A)} ses droits : être examiné par un médecin, faire prévenir un proche et son employeur, être assisté par un avocat, être assisté par un interprète, faire des déclarations, répondre aux questions ou se taire.`, f: "G_notif_pv", flag: irr("gav_notif") ? "gav_notif" : undefined };
      add("pv_notification", "Notification des droits", () => ({ title: "Procès-verbal de placement en garde à vue et de notification des droits", kind: "pv", entete: ent("pv_notification"), paras: [
        [`Le ${D(C.jg)}, à ${hm(Math.max(C.debut, C.interp) + 10)}, nous, ${opjN}, officier de police judiciaire en fonction au ${SF.comm.replace(/^Commissariat/, "commissariat")},`],
        [`Vu les articles 62-2, 63 et 63-1 à 63-4-3 du code de procédure pénale ;${t.flagrance ? " vu le procès-verbal d'interpellation ;" : ""}`],
        [{ t: `Placement en garde à vue de ${n(A)}, né${e(A)} ${A.naissance}, ${A.metier}, décidé par l'officier de police judiciaire, avec effet à ${hm(C.debut)}${t.flagrance ? (irr("heures") ? ", heure de sa présentation à l'officier de police judiciaire" : ", heure de l'interpellation") : t.genre === "copj" || t.genre === "pc" ? ", heure de sa présentation au service" : ""}.`, f: "G_debut", flag: irr("heures") ? "heures" : undefined }],
        [`Motifs : raisons plausibles de soupçonner ${A.g === "f" ? "qu'elle a" : "qu'il a"} commis ${q.label.startsWith("vol") ? "un vol" : `des faits de ${q.label}`}${t.flagrance ? "" : `, le ${D(jf)}`} ; la mesure est l'unique moyen de permettre les investigations et de garantir sa présentation devant le procureur de la République (art. 62-2, 1° et 2°).`],
        [{ t: `Avis au procureur de la République à ${hm(C.avisPq)}.`, flag: irr("avis_parquet") ? "avis_parquet" : undefined }],
        [notifTexte],
        [{ t: "Interprète : sans objet, la personne déclarant comprendre le français.", flag: irr("interprete") ? "interprete" : undefined }],
        ["Lui remettons le document énonçant ses droits (art. 803-6)."],
        [{ t: `La personne demande l'assistance d'un avocat commis d'office. Avis à la permanence des avocats à ${hm((irr("gav_notif") ? C.notif : C.debut + 15) + 5)}.`, paire: irr("sans_avocat") ? "sans_avocat" : undefined }],
        ["Dont procès-verbal, que la personne signe avec nous après lecture."],
      ], sigs: [{ qui: opjN + ", officier de police judiciaire", t: S }, { qui: "La personne gardée à vue", t: S }, { qui: "L'interprète (le cas échéant)", t: "", flag: irr("interprete") ? "interprete" : undefined }] }));
    }

    // ---------------------------------------------------------------- D : certificats médicaux
    if (has("certificat") && t.f.itt != null && V) {
      if (t.quoi === "itt") add("certificat_urgences", "Certificat des urgences", () => ({ title: "Certificat médical initial — service des urgences", kind: "courrier", entete: ["Hôpital Lariboisière · Service d'accueil des urgences", "2, rue Ambroise-Paré, 75010 Paris"], paras: [[`Je soussigné, Dr ${pk(r, ["Antoine Mercier", "Salomé Riva", "Karim Haddad"])}, certifie avoir examiné ${nf(V)} le ${D(jf)} à ${hm(d.h + 90)}.`], [`Constatations : ${(N.lesions || []).join(" ; ")}.`], [{ t: `Arrêt de travail : ${t.f.itt} jours.`, f: "G_itt_urg" }]], sigs: [{ qui: "Le médecin urgentiste", t: S }] }));
      const ittU = t.quoi === "itt" ? t.f2.itt : t.f.itt;
      add("certificat", "Certificat de l'UMJ", () => ({ title: "Certificat médical — unité médico-judiciaire", kind: "courrier", entete: [`${TJ.umj} · AP-HP`, `Réquisition de l'officier de police judiciaire — procédure n° ${t.proc}`], paras: [
        [`Examen de ${nf(V)}, ${V.age} ans, le ${D(DM(jf + (t.flagrance ? 1 : int(r, 1, 3))))}.`],
        [`Doléances : douleurs ${pk(r, ["du visage", "thoraciques", "de l'épaule", "cervicales"])}, troubles du sommeil, appréhension à sortir seul${e(V)}.`],
        [`Examen : ${(N.lesions || ["pas de lésion traumatique récente objectivée"]).join(" ; ")}.`],
        [{ t: `Conclusion : l'incapacité totale de travail, au sens pénal, est fixée à ${ittU}${ittU <= 8 ? ` (${["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit"][ittU]})` : ""} jour${ittU > 1 ? "s" : ""}, sous réserve de complications.`, f: t.quoi === "itt" ? "G_itt_umj" : "G_itt" }],
      ], sigs: [{ qui: `Dr ${pk(r, ["Élise Vannier", "Marc Dubreuil", "Nora Belhadj"])}, médecin légiste`, t: S }] }));
      if (t.quoi === "itt") { fact("G_itt_umj", { label: `L'UMJ fixe l'ITT à ${ittU} jours, pas ${t.f.itt}`, key: true, why: "L'arrêt de travail des urgences n'est pas l'ITT pénale ; c'est l'ITT qui fixe la qualification." }); fact("G_itt_urg", { label: `${t.f.itt} jours d'arrêt de travail aux urgences` }); }
      else fact("G_itt", { label: `ITT de ${ittU} jours (UMJ)`, key: true, why: "L'ITT fixe la qualification : huit jours est le seuil." });
    }
    if (has("autopsie") && V) add("rapport_autopsie", "Rapport d'autopsie", () => ({ title: "Rapport d'autopsie médico-légale", kind: "courrier", entete: ["Institut médico-légal de Paris", `Réquisition du procureur de la République — procédure n° ${t.proc}`], paras: [
      [`Autopsie de ${nf(V)}, ${V.age} ans, pratiquée le ${D(jf + 2)}.`],
      ["Examen externe : dermabrasions et ecchymoses de la face latérale droite du corps ; déformation de la jambe droite."],
      ["Examen interne : fractures costales multiples, contusion pulmonaire bilatérale, rupture splénique avec hémopéritoine, fracture du bassin, hématome sous-dural temporal droit."],
      [{ t: "Conclusion : décès consécutif à un polytraumatisme par choc à haute énergie, compatible avec un heurt par un véhicule ; aucun état antérieur susceptible d'avoir contribué au décès.", f: "G_autopsie" }],
    ], sigs: [{ qui: "Le médecin légiste", t: S }] }));

    // ---------------------------------------------------------------- D : témoin
    if (has("temoin") && T) {
      const lt = (N.temoin || []).slice();
      add("pv_temoin", "Audition du témoin", () => ({ title: "Procès-verbal d'audition de témoin", kind: "pv", entete: ent("pv_temoin"), paras: [
        [`Le ${D(DM(jf + (t.flagrance ? 0 : int(r, 2, 15))))}, entendons ${nf(T)}, ${T.age} ans, ${T.metier}, demeurant ${T.adresse}, qui déclare :`],
        ...lt.filter((x) => t.quoi !== "reunion" || !/deux|Ils étaient/.test(x)).map((x) => [`« ${guill(x)} »`]),
        dou("temoin_contra") ? [{ t: `« ${pk(r, t.inf === "vol" ? ["Je ne suis pas sûr que ce soit lui ; il y avait beaucoup de monde.", "Celui qui a pris le téléphone était plus grand, je crois.", "Je l'ai vu de dos seulement."] : t.inf === "outrage" ? ["Je n'ai pas entendu d'insulte. Il parlait fort, c'est tout.", "C'est un des policiers qui l'a insulté en premier."] : ["Je ne peux pas dire qui a commencé. Les deux criaient.", "Ce n'est pas lui qui a frappé en premier, c'est l'autre.", "Je n'ai pas vu de coup, honnêtement. J'ai vu une bousculade."])} »`, f: "G_temoin_contra" }] : null,
        dou("legitime_defense") ? [{ t: "« L'autre homme a sorti une bouteille et s'est jeté sur lui le premier. Lui s'est défendu, il a mis un coup pour se dégager. »", f: "G_ld" }] : null,
        dou("doute_ident") && !V ? [{ t: "« Je ne pourrais pas le reconnaître, il faisait nuit et il avait une capuche. »", f: "G_doute_ident" }] : null,
        t.quoi === "reunion" ? [{ t: "« Il était seul. Personne ne l'aidait. Les autres regardaient. »", f: "G_seul" }] : null,
        t.quoi === "violence" ? [{ t: "« Il a pris le téléphone et il est parti en courant. Il ne l'a pas touchée. »", f: "G_sans_violence" }] : null,
        t.quoi === "mort" ? [{ t: `« Il a crié : “Je vais te casser les jambes.” Je n'ai pas entendu parler de tuer. »`, f: "G_mots" }] : null,
        t.inf === "blessures_routieres" && t.quoi ? [{ t: `« ${t.quoi === "r_telephone" ? "Je crois qu'il avait son téléphone, mais je ne suis pas sûr." : t.quoi === "r_vitesse" ? "Il roulait vite, mais je ne saurais pas dire combien." : "Je ne sais pas s'il avait bu."} »`, f: "G_circ_doute" }] : null,
        ["Lecture faite, persiste et signe."],
      ].filter(Boolean), sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "Le témoin", t: S }] }));
      fact("G_temoin_pv", { label: `Le témoignage de ${nf(T)}`, key: t.genre === "pc" });
    }

    // ---------------------------------------------------------------- D : vidéo (exploitation par les enquêteurs)
    // une fiche peut décrire elle-même ses images (N.video : { titre, source, scene, ident }) : vidéo publiée, caméra d'un établissement
    if (has("video") && N.video) add("pv_video", "Exploitation vidéo", () => ({ title: N.video.titre || "Procès-verbal d'exploitation des images", kind: "video", entete: ent("pv_video"), paras: [
      [`Exploitation ${N.video.source}, horodatage du ${CR.fmtDate(jf, "num")}.`],
      [N.video.scene],
      [{ t: N.video.ident, f: "G_video" }],
    ], sigs: [{ qui: "L'officier de police judiciaire", t: S }] }));
    else if (VID) add("pv_video", "Exploitation vidéo", () => {
      const X = VID.S, lis = X.lisible(), hs = (h) => { const [hh, mm, ss] = h.split(" ")[1].split(":"); return `${+hh} h ${mm} min ${ss} s`; };
      const vue = { ir: "de nuit, l'image est en infrarouge, en noir et blanc", soir: "de nuit, l'image est en couleur, sous l'éclairage public", jour: "l'image est en couleur" }[X.mode];
      return { title: "Procès-verbal d'exploitation des images de vidéoprotection", kind: "video", entete: ent("pv_video"), video: VID.spec, paras: [
        [`Exploitation des images de la caméra de vidéoprotection de la sortie de la station de métro la plus proche, remises par le service de sûreté de la RATP, horodatage du ${CR.fmtDate(jf, "num")}.`],
        [`La caméra, fixée en hauteur, filme en plongée le trottoir et la sortie de la station ; ${vue}, à ${X.fps} images par seconde.`],
        ...X.moments.map((m) => [`${hs(m.h)} — ${m.txt}`]),
        [`L'individu porte ${lis.A.image.replace(/^(\S+)/, (w) => (/^(doudoune|veste)/.test(lis.A.image) ? "une " : "un ") + w)}.`],
        dou("doute_ident") ? [{ t: "La qualité des images ne permet pas de distinguer les traits du visage de l'auteur ; sa silhouette et ses vêtements sont visibles.", f: "G_doute_ident" }] : [{ t: `La silhouette, les vêtements et la démarche correspondent à ceux de ${n(A)} lors de son interpellation.`, f: "G_video" }],
        t.quoi === "violence" ? [{ t: "Aucun geste de violence n'est visible : l'objet est saisi d'un geste rapide, la victime n'est pas touchée.", f: "G_sans_violence" }] : null,
        X.sauts.length ? [`L'enregistrement présente ${X.sauts.length === 1 ? "une interruption" : X.sauts.length + " interruptions"} : ${X.sauts.map(([a0, b0]) => `de ${hs(X.horodatage(a0))} à ${hs(X.horodatage(b0))}`).join(", ")}.`] : null,
        ["Une planche de captures est jointe ; les images utiles sont gravées sur un disque placé sous scellé."],
      ].filter(Boolean), sigs: [{ qui: "L'officier de police judiciaire", t: S }] };
    });
    else if (has("video")) add("pv_video", "Exploitation vidéo", () => ({ title: "Procès-verbal d'exploitation des images de vidéoprotection", kind: "video", entete: ent("pv_video"), paras: [
      [`Exploitation des images ${t.inf === "vol" && t.f.sc === "magasin" ? "du système de vidéosurveillance du magasin" : t.inf === "violences" && t.f.sc === "transport" ? "des caméras de la RATP" : (SF.paris ? "de la caméra de vidéoprotection de la Ville de Paris la plus proche" : `de la caméra de vidéoprotection de la ville de ${SF.ville} la plus proche`)}, horodatage du ${CR.fmtDate(jf, "num")}.`],
      [`${hm(d.h - 2)} — ${N.resume}`],
      dou("doute_ident") ? [{ t: "La qualité des images ne permet pas de distinguer les traits du visage de l'auteur ; sa silhouette et ses vêtements sont visibles.", f: "G_doute_ident" }] : [{ t: `La silhouette, les vêtements et la démarche correspondent à ceux de ${n(A)} lors de son interpellation.`, f: "G_video" }],
      t.quoi === "violence" ? [{ t: "Aucun geste de violence n'est visible : l'objet est saisi d'un geste rapide, la victime n'est pas touchée.", f: "G_sans_violence" }] : null,
    ].filter(Boolean), sigs: [{ qui: "L'officier de police judiciaire", t: S }] }));

    // ---------------------------------------------------------------- D : téléphonie
    if (has("telephonie")) {
      const j0 = jf - int(r, 20, 40);
      add("pv_telephonie", "Téléphonie", () => ({ title: "Procès-verbal d'exploitation des réquisitions téléphoniques", kind: "releve", entete: ent("pv_telephonie"), paras: [
        irr("requisition") ? [{ t: `Adressons à l'opérateur une réquisition aux fins d'obtenir la liste des appels entrants et sortants et les cellules déclenchées par la ligne ${A.tel}, du ${D(j0)} au ${D(DM(jf + 2))}.`, flag: "requisition" }] : [`Vu l'autorisation du procureur de la République en date du ${D(DM(jf + 1))} (art. 77-1-1), adressons à l'opérateur une réquisition portant sur la ligne ${A.tel}.`],
        irr("geoloc") ? [{ t: `Poursuivons la géolocalisation en temps réel du véhicule utilisé par ${n(A)}, autorisée par le procureur de la République le ${D(j0)}, jusqu'au ${D(j0 + int(r, 21, 34))}, date de son interpellation.`, flag: "geoloc" }] : null,
        [`Réponse de l'opérateur : la ligne est attribuée à ${n(A)} ; ${int(r, 12, 140)} contacts avec ${V ? "la ligne de " + nf(V) : "des numéros identifiés"} sur la période.`],
        dou("alibi_tel") ? [{ t: `Le jour des faits, entre ${hm(d.h - 120)} et ${hm(d.h + 150)}, la ligne déclenche exclusivement des relais situés à ${pk(r, ["Sarcelles", "Bobigny", "Créteil", "Argenteuil"])}.`, f: "G_alibi" }] : [{ t: `Le jour des faits, à ${hm(d.h)}, la ligne déclenche le relais couvrant ${lieu || "les lieux"}.`, f: "G_bornage" }],
      ].filter(Boolean), sigs: [{ qui: "L'officier de police judiciaire", t: S }] }));
    }

    // ---------------------------------------------------------------- D : ADN
    if (has("adn")) add("rapport_adn", "Rapport ADN", () => ({ title: "Rapport d'analyse génétique", kind: "courrier", entete: ["Laboratoire de police scientifique de Paris", `Procédure n° ${t.proc}`], paras: [
      [`Scellé n° ${int(r, 1, 6)} : ${pk(r, ["écouvillon de frottis effectué sur la poignée intérieure de la porte", "mégot de cigarette prélevé sur le palier", "trace de sang sur le chambranle", "gant abandonné sur les lieux"])}.`],
      [{ t: `Profil génétique masculin complet, comparé au fichier national automatisé des empreintes génétiques : concordance avec le profil enregistré de ${n(A)}.`, f: "G_adn" }],
      ["La présence d'un ADN sur un objet ne renseigne pas, à elle seule, sur la date ni sur les circonstances du dépôt."],
    ], sigs: [{ qui: "L'expert en génétique", t: S }] }));

    // ---------------------------------------------------------------- D : perquisition et saisie
    if (has("saisie") && !N.saisie) N.saisie = { affaires: "des documents comptables, deux téléphones et un ordinateur portable", numerique: "un ordinateur portable, une clé USB et deux téléphones" }[CAT.INF[t.inf].fam] || "divers objets, dont deux téléphones";
    if (has("saisie") && N.saisie) {
      const perq = !t.flagrance || ["stups_detention", "stups_trafic", "recel", "cambriolage", "blanchiment", "abs"].includes(t.inf);
      const hP = irr("perq_nuit") ? 5 * 60 + int(r, 20, 50) : 6 * 60 + int(r, 5, 60) + (t.flagrance ? 10 * 60 : 0);
      if (perq) add("pv_saisie", "Perquisition et saisie", () => ({ title: "Procès-verbal de perquisition et de saisie", kind: "pv", entete: ent("pv_saisie"), paras: [
        [{ t: `Le ${D(t.mesure === "gav" ? C.jg : DM(jf + int(r, 3, 20)))}, à ${hm(hP)}, nous transportons au domicile de ${n(A)}, ${A.adresse}, ${t.flagrance ? "en flagrance (art. 56)" : "dans le cadre de l'enquête préliminaire"}, et procédons à une perquisition en sa présence.`, flag: irr("perq_nuit") ? "perq_nuit" : undefined }],
        irr("perq_assentiment") ? [{ t: "L'intéressé, présent, déclare consentir oralement à la perquisition.", flag: "perq_assentiment" }] : !t.flagrance ? [`L'intéressé donne son assentiment exprès, par une déclaration écrite de sa main annexée au présent procès-verbal (art. 76).`] : [],
        [{ t: `Découvrons ${N.saisie}, que nous plaçons sous scellé n° ${int(r, 1, 9)}.`, f: "G_saisie" }],
        ...(N.conc || []).filter((c) => c.inf === "arme_b").map((c) => [{ t: c.constat, f: c.fait }]),
        t.quoi === "usage" ? [{ t: "Aucune balance, aucun conditionnement, aucune somme d'argent n'est découvert.", f: "G_conso" }] : null,
        [`Fin des opérations à ${hm(hP + int(r, 40, 110))}.`],
      ].filter(Boolean), sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "La personne chez qui la perquisition a eu lieu", t: S }].concat(!t.flagrance ? [{ qui: "Assentiment écrit de la personne (annexe)", t: irr("perq_assentiment") ? "" : S, flag: irr("perq_assentiment") ? "perq_assentiment" : undefined }] : []) }));
    }

    // ---------------------------------------------------------------- D : laboratoire (stupéfiants, toxicologie)
    if (has("labo")) add("rapport_labo", "Rapport du laboratoire", () => ({ title: t.fam === "route" || CAT.INF[t.inf].fam === "route" ? "Rapport d'analyse toxicologique" : "Rapport d'analyse des produits saisis", kind: "courrier", entete: ["Laboratoire de toxicologie de la préfecture de police", `Procédure n° ${t.proc}`], paras: CAT.INF[t.inf].fam === "route" ? [
      [`Analyse du prélèvement ${t.inf === "homicide_routier" || t.inf === "blessures_routieres" ? "sanguin" : "salivaire de confirmation"} effectué sur ${n(A)} le ${D(jf)}.`],
      t.quoi === "r_stups" ? [{ t: "Le dépistage salivaire de terrain est positif au THC ; le prélèvement sanguin a été adressé au laboratoire, résultat non parvenu à la clôture de la procédure.", f: "G_sans_analyse" }] : [{ t: (t.f.produit === "cocaïne" ? "Présence de cocaïne et de benzoylecgonine." : "Présence de delta-9-tétrahydrocannabinol (THC) : 4,2 ng/ml.") + " Usage récent établi.", f: "G_tox" }],
    ] : [
      [`Scellé : ${N.saisie}. Pesée nette : ${String(t.f.quantite || "").replace(".", ",")} g.`],
      [{ t: `Analyse : ${t.f.produit === "cannabis" ? "résine de cannabis, taux de THC de 28 %" : t.f.produit === "cocaine" ? "chlorhydrate de cocaïne, pureté de 61 %" : "produit stupéfiant identifié"}.`, f: "G_labo" }],
      t.quoi === "usage" ? [{ t: "Dépistage urinaire de la personne : positif. Elle déclare une consommation quotidienne depuis plusieurs années.", f: "G_conso" }] : null,
    ].filter(Boolean), sigs: [{ qui: "L'ingénieur du laboratoire", t: S }] }));

    // ---------------------------------------------------------------- D : expertise
    if (has("expertise")) {
      const fam = CAT.INF[t.inf].fam;
      const X = fam === "route" ? { titre: "Rapport d'accidentologie", ent: "Expert en accidentologie près la cour d'appel", txt: `Vitesse du véhicule au moment du choc estimée entre ${int(r, 55, 70)} et ${int(r, 72, 95)} km/h, pour une vitesse autorisée de 50 km/h.`, f: t.quoi === "r_vitesse" ? "G_circ_doute" : "G_expertise" }
        : t.inf === "accident_travail" ? { titre: "Rapport de l'inspection du travail", ent: "Direction régionale de l'économie, de l'emploi, du travail et des solidarités · Inspection du travail", txt: t.f.violation ? "Le manquement aux règles de protection a été signalé à l'employeur à deux reprises, par écrit, dans les semaines précédant l'accident, sans suite : violation manifestement délibérée d'une obligation particulière de sécurité." : "La protection prévue par la réglementation faisait défaut au moment de l'accident ; aucun signalement antérieur n'a été retrouvé.", f: "G_expertise" }
        : fam === "affaires" ? { titre: "Rapport d'expertise comptable", ent: `Expert-comptable près la ${caDe}`, txt: `Les dépenses examinées, ${eur(N.montant || 0)}, ne trouvent aucune contrepartie dans l'activité de la société.`, f: "G_expertise" }
          : fam === "numerique" || t.inf === "cyberharcelement" ? { titre: "Rapport d'expertise informatique", ent: "Expert en informatique près la cour d'appel", txt: "L'analyse du téléphone et de l'ordinateur saisis retrouve les identifiants du compte en cause et l'historique des connexions.", f: "G_expertise" }
            : t.inf === "incendie" ? { titre: "Rapport du laboratoire central", ent: "Laboratoire central de la préfecture de police", txt: t.f.volontaire ? "Présence d'hydrocarbures légers dans les prélèvements : origine volontaire de l'incendie." : "Départ de feu sur le balcon supérieur ; mégots dans un pot de fleurs au contact de stores en toile.", f: "G_expertise" }
              : { titre: "Rapport d'expertise", ent: `Expert près la ${caDe}`, txt: "Les constatations techniques confirment les déclarations de la victime sur l'étendue du dommage.", f: "G_expertise" };
      add("expertise", X.titre, () => ({ title: X.titre, kind: "courrier", entete: [X.ent, `Procédure n° ${t.proc}`], paras: [[`Mission confiée par ${t.flagrance ? "l'officier de police judiciaire" : "le procureur de la République"} le ${D(DM(jf + int(r, 2, 20)))}.`], [{ t: X.txt, f: X.f }]], sigs: [{ qui: "L'expert", t: S }] }));
    }

    // ---------------------------------------------------------------- D : messages, relevés, fichier des permis
    if (has("ecrits") && N.ecrits && N.ecrits.length) add("captures", N.ecritsPiece ? N.ecritsPiece.court : "Captures des messages", () => ({ title: N.ecritsPiece ? N.ecritsPiece.titre : "Procès-verbal de constatations — messages", kind: "releve", entete: ent("captures"), paras: [[N.ecritsPiece ? N.ecritsPiece.intro : `Constatons, sur le téléphone présenté par ${V ? nf(V) : "le plaignant"}, les messages suivants, dont nous réalisons des captures d'écran :`]].concat(N.ecrits.map((m, i) => [{ t: N.ecritsPiece && !N.ecritsPiece.dater ? m : `${CR.fmtDate(jf - (N.ecrits.length - i) * int(r, 1, 4), "num")}, ${hm(int(r, 0, 1439))} — ${m}`, f: i === 0 ? "G_ecrits" : undefined }])), sigs: [{ qui: "L'officier de police judiciaire", t: S }] }));
    if (has("releve")) add("releve", "Relevés bancaires", () => ({ title: "Réponse à réquisition bancaire — relevés de compte", kind: "releve", entete: [pk(r, ["Banque Postale", "BNP Paribas", "Société Générale", "Crédit Agricole Île-de-France"]) + " · service des réquisitions judiciaires", `Procédure n° ${t.proc}`], paras: [
      irr("requisition") && !has("telephonie") ? [{ t: `Réquisition adressée le ${D(DM(jf + 10))} par l'officier de police judiciaire ${opjN}.`, flag: "requisition" }] : [`Réquisition du ${D(DM(jf + 10))}, sur autorisation du procureur de la République.`],
      [`Titulaire : ${n(A)}.`],
      [{ t: `Mouvements sans rapport avec les revenus déclarés : ${eur(N.montant || int(r, 30, 200) * 100)} au total sur la période.`, f: "G_releve" }],
    ], sigs: [] }));
    if (has("fichier")) add("fichier_permis", "Fichier des permis", () => ({ title: "Relevé du fichier national des permis de conduire", kind: "releve", entete: ["Ministère de l'Intérieur · Fichier national des permis de conduire", `Consultation du ${D(jf)}`], paras: [
      [`Identité : ${A.nom} ${A.prenom}, né${e(A)} ${A.naissance}.`],
      [t.f.sc === "jamais" ? { t: "Aucun permis de conduire délivré à cette identité.", f: "G_fichier" } : { t: t.f.sc === "suspendu" ? `Suspension administrative de six mois, arrêté du préfet de police du ${D(jf - 50)}.` : `Invalidation pour solde de points nul (décision 48 SI du ${D(jf - 80)}).`, f: "G_fichier" }],
      t.f.sc !== "jamais" ? [{ t: dou("notif_permis") ? "Notification par lettre recommandée : pli avisé et non réclamé, retourné à l'expéditeur." : "Notification par lettre recommandée : avis de réception signé.", f: dou("notif_permis") ? "G_notif_permis" : "G_notif_ar" }] : null,
    ].filter(Boolean), sigs: [] }));

    // ---------------------------------------------------------------- D : alcoolémie
    if (has("ethylo") || t.inf === "alcool") {
      const tx = String((t.f.taux || 0).toFixed(2)).replace(".", ",");
      add("pv_alcoolemie", t.f.refus ? "Refus de vérification" : "Vérification de l'alcoolémie", () => ({ title: t.f.refus ? "Procès-verbal de refus de se soumettre aux vérifications" : "Procès-verbal de vérification de l'alcoolémie", kind: "pv", entete: ent("pv_alcoolemie"), paras: t.f.refus ? [
        [`Le ${D(jf)}, à ${hm(d.h + 30)}, invitons ${n(A)} à se soumettre aux épreuves de dépistage, puis à la vérification par éthylomètre.`],
        [{ t: "L'intéressé refuse à deux reprises, en déclarant : « Je souffle pas. »", f: "G_refus" }],
      ] : [
        [`Le ${D(jf)}, à ${hm(d.h + 35)}, nous, ${opjN}, procédons à la vérification de l'état alcoolique de ${n(A)}, après un dépistage positif (art. L. 234-4 du code de la route).`],
        ["Vérification par éthylomètre de marque Dräger, modèle 7110 FP."],
        [{ t: irr("ethylo") ? `Appareil homologué, numéro de série ARCA-0${int(r, 100, 999)}.` : `Appareil homologué, numéro de série ARCA-0${int(r, 100, 999)}, dernière vérification périodique le ${D(jf - int(r, 30, 300))}.`, flag: irr("ethylo") ? "ethylo" : undefined, f: irr("ethylo") ? "G_ethylo" : undefined }],
        [{ t: `Mesure : ${tx} mg par litre d'air expiré.`, f: t.quoi === "marge" ? "G_marge" : "G_taux" }],
        ["Notifions le résultat et le droit à une seconde vérification ; la personne n'en fait pas usage."],
        [`Dont procès-verbal, clos à ${hm(d.h + 50)}, signé après lecture.`],
      ], sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "La personne contrôlée", t: S }] }));
      if (irr("ethylo")) fact("G_ethylo", { label: "Le procès-verbal ne mentionne pas la vérification périodique de l'éthylomètre", key: true, why: "Une mesure n'a de valeur que si l'appareil a été vérifié." });
      if (t.quoi === "marge") fact("G_marge", { label: `Une mesure de ${tx} mg/l, sans marge d'erreur appliquée`, key: true, why: "La marge d'erreur de l'appareil (8 % au-dessus de 0,40 mg/l) peut ramener le taux sous le seuil du délit : la contravention de l'article R. 234-1." });
    }

    // ---------------------------------------------------------------- D : audition du mis en cause (dossiers de jugement)
    if (t.mesure !== "aucune" && t.genre !== "gav" && !(t.genre === "pc" && d.voiePc === "classe")) {
      const av = (CR.ACTEURS.find((a) => a.role === "adverse") || { nom: "Me Lucas Pernot" }).nom;
      const decl = t.genre === "al" ? [["Les questions et les réponses, consignées en présence de l'avocat de la personne, sont annexées au présent procès-verbal."]] : N.audition.map((a) => [{ t: `Question : ${a.q}` }, { t: `Réponse : ${a.a.expliquer}`, f: a === N.audition[0] && t.stance !== "nie" ? "G_aveu" : undefined }]);
      add("pv_audition", t.mesure === "gav" ? "Audition en garde à vue" : "Audition libre", () => ({ title: t.mesure === "gav" ? "Procès-verbal d'audition de la personne gardée à vue" : "Procès-verbal d'audition libre", kind: "pv", entete: ent("pv_audition"), paras: [
        [`Le ${D(C.jg)}, de ${hm(C.aud)} à ${hm(C.audFin)}, entendons ${n(A)}${t.mesure === "al" ? ", qui se présente librement sur convocation" : ""}.`],
        t.mesure === "al" ? (irr("al_quitter")
          ? [{ t: "Avant toute audition, notifions à la personne la qualification, la date et le lieu présumés de l'infraction, le droit de faire des déclarations, de répondre aux questions ou de se taire, le droit d'être assistée par un avocat et de bénéficier de conseils juridiques gratuits.", flag: "al_quitter" }]
          : ["Avant toute audition, notifions à la personne la qualification, la date et le lieu présumés de l'infraction, le droit de quitter à tout moment les locaux, d'être assistée par un interprète, de faire des déclarations, de répondre aux questions ou de se taire, d'être assistée par un avocat et de bénéficier de conseils juridiques gratuits (art. 61-1)."])
          : irr("sans_avocat") ? [{ t: `${av}, avocat commis d'office, avisé à ${hm(C.avisAv)}, ne s'étant pas présenté, procédons à l'audition.`, flag: "sans_avocat" }] : [`En présence de ${av}, avocat, qui s'est entretenu avec la personne pendant trente minutes.`],
        ...decl,
        ["Lecture faite, persiste et signe."],
      ], sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "La personne entendue", t: S }] }));
      if (t.stance !== "nie" && t.genre !== "al") fact("G_aveu", { label: "Ses déclarations aux enquêteurs" });
    }
    // ---------------------------------------------------------------- D : prolongation (comparution immédiate)
    if (t.genre === "ci" && t.mesure === "gav") {
      const h24 = C.debut + 1440;
      const auth = irr("prolongation") ? h24 + int(r, 25, 70) : h24 - int(r, 40, 120);
      if (C.debut + 1440 < 1440 + 10 * 60 + 30 || irr("prolongation")) add("pv_prolongation", "Prolongation de la garde à vue", () => ({ title: "Procès-verbal de prolongation de la garde à vue", kind: "pv", entete: ent("pv_prolongation"), paras: [
        [`Présentation de ${n(A)} au procureur de la République par visioconférence.`],
        [{ t: `Le ${D(C.jg + 1)}, à ${hm(auth)}, le procureur de la République autorise par écrit la prolongation de la garde à vue pour une durée de vingt-quatre heures, à compter de ${hm(h24)}.`, flag: irr("prolongation") ? "prolongation" : undefined }],
        ["Motif : poursuite des investigations et présentation au magistrat (art. 62-2 et 63)."],
      ], sigs: [{ qui: "L'officier de police judiciaire", t: S }] }));
    }

    // ---------------------------------------------------------------- Casier, enquête sociale, convocation, ordonnance, classement
    const an = t.ant;
    const peineAnt = (p) => (!p ? "" : p.mesure ? p.mesure : p.ferme ? `${CR.fmtMois(p.ferme)} d'emprisonnement` : p.sursis ? `${CR.fmtMois(p.sursis)} d'emprisonnement avec sursis` : `amende de ${eur(p.amende)}`);
    const execAnt = (a) => (a.peine.mesure ? "" : a.peine.ferme ? ` Peine exécutée : levée d'écrou le ${D(a.fin)}.` : a.peine.amende ? ` Amende payée le ${D(a.fin)}.` : " Sursis simple, non révoqué à ce jour.");
    // n° 12 : la société poursuivie a son propre bulletin n° 1 (jamais condamnée dans le jeu)
    const casierPM = t.PM ? [[`Personne morale : ${t.PM.nom}, ${t.PM.rcs}. Néant.`]] : [];
    if (an) fact("G_ant", { label: `Le bulletin n° 1 : ${an.label}, ${an.juridiction}, ${D(an.jug)}`, key: true, why: "Pour la récidive, tout se lit dans les dates et les qualifications : quand la condamnation est-elle devenue définitive, quand la peine a-t-elle pris fin, et pour quel délit ?" });
    if (an) docs.casier = () => ({ title: "Bulletin n° 1 du casier judiciaire", kind: "greffe", entete: ["Ministère de la Justice · Casier judiciaire national", "107, rue du Landreau, 44317 Nantes"], paras: [["Relevé délivré à l'autorité judiciaire."], [`Identité : ${A.nom} ${A.prenom}, né${e(A)} ${A.naissance}.`],
      [{ t: `${an.juridiction}, jugement ${an.mineur ? "" : "contradictoire "}du ${D(an.jug)} : ${an.label}${an.mineur ? "" : ` (${an.art})`}, ${peineAnt(an.peine)}.${an.appel ? ` Appel du prévenu le ${D(an.appel)} ; ${an.juridiction && /Nanterre/.test(an.juridiction) ? "cour d'appel de Versailles" : "cour d'appel de Paris"}, arrêt confirmatif du ${D(an.arret)}.` : ""}${an.mineur ? "" : ` Décision devenue définitive le ${D(an.def)}.`}${execAnt(an)}`, f: "G_ant" }],
      ...casierPM, ["Fin du relevé."]] });
    else docs.casier = () => ({ title: "Bulletin n° 1 du casier judiciaire", kind: "greffe", entete: ["Ministère de la Justice · Casier judiciaire national", "107, rue du Landreau, 44317 Nantes"], paras: [["Relevé délivré à l'autorité judiciaire."], [`Identité : ${A.nom} ${A.prenom}, né${e(A)} ${A.naissance}.`], [{ t: A.casier === 0 ? "Néant." : t.rec ? `Tribunal correctionnel de Paris, il y a dix-huit mois : ${CAT.INF[t.inf].nom.toLowerCase()}, quatre mois d'emprisonnement avec sursis.` : (() => { const n = CR.MONDE.ansCasier(A, int(r, 7, 12)), quoi = pk(r, ["vol", "usage de stupéfiants", "conduite sans permis"]); return CR.MONDE.casierMineur(A) ? `Tribunal pour enfants de Paris, il y a ${n > 1 ? "deux ans" : "un an"} : ${quoi === "conduite sans permis" ? "vol" : quoi}, avertissement judiciaire.` : `Tribunal correctionnel de Bobigny, il y a ${n} an${n > 1 ? "s" : ""} : ${quoi}, amende de 300 euros.`; })(), f: "G_casier_b1" }], ...casierPM] });
    titres.casier = "Casier judiciaire";
    if (t.genre === "ci" || t.genre === "gav") {
      docs.esr = () => ({ title: "Enquête sociale rapide", kind: "courrier", entete: ["Association de contrôle judiciaire — permanence du dépôt", "Article 41, alinéa 7, du code de procédure pénale"], paras: [
        [`Entretien avec ${n(A)} au dépôt du tribunal.`],
        [{ t: A.heberg ? `Domicile déclaré : ${A.adresse}, chez ${A.proche}, vérifié par téléphone.` : "Pas de domicile stable : hébergé chez des amis, de façon intermittente.", f: "G_esr" }],
        [A.emploi ? `Activité : ${A.metier}.` : { etudiant: `Situation : ${A.metier}.`, scolaire: `Scolarité : ${A.metier}.`, retraite: `Situation : ${A.metier}.`, rsa: `Situation : ${A.metier}.` }[CR.MONDE.situ(A)] || "Sans activité déclarée."],
        [A.enfants ? `${A.g === "f" ? "Mère" : "Père"} de ${A.enfants} enfant${A.enfants > 1 ? "s" : ""}.` : "Sans enfant à charge."],
        [A.casier ? "Antécédents déclarés, conformes au casier." : "Aucun antécédent déclaré."],
        [`Avis : ${A.heberg ? "pas d'objection à une mesure alternative à la détention si l'hébergement est confirmé par écrit" : "garanties de représentation fragiles en l'absence de domicile"}.`],
      ], sigs: [{ qui: "L'enquêteur social", t: S }] });
      titres.esr = "Enquête sociale rapide";
    }
    if (d.audience != null && (t.genre === "copj" || t.genre === "pc")) {
      const lib = t.voie === "citation_parquet" ? "Citation devant le tribunal de police" : t.voie === "cppv" ? "Convocation par procès-verbal (art. 394)" : "Convocation par officier de police judiciaire (art. 390-1)";
      docs.convocation = () => ({ title: t.genre === "pc" ? "Avis à victime — date d'audience" : lib, kind: "greffe", entete: [t.genre === "pc" ? `${TJ.tj} · Bureau d'aide aux victimes` : TJ.parquet, `Procédure n° ${t.proc}`], paras: t.genre === "pc" ? [
        [`${nf(t.client === "P" ? P : V)}, vous êtes avisé${e(t.client === "P" ? P : V)} que ${n(A)} est poursuivi${e(A)} pour ${q.label} et comparaîtra devant le ${t.jur === "tp" ? "tribunal de police" : "tribunal correctionnel"} de ${TJ.ville} le ${D(d.audience)}, à ${t.jur === "tp" ? "9 h 30" : "13 h 30"}.`],
        [{ t: "Vous pouvez vous constituer partie civile, à l'audience ou par lettre recommandée parvenue au tribunal vingt-quatre heures au moins avant l'audience (art. 420-1), et vous faire assister d'un avocat.", f: "G_avis_victime" }],
      ] : [
        [`${nf(A)}, vous êtes invité${e(A)} à comparaître devant le ${t.jur === "tp" ? "tribunal de police" : "tribunal correctionnel"} de ${TJ.ville}, ${GEN2.chambre(t).replace(/^Tribunal de police( \(.*\))?$/, "audience de police").replace(/ \((Bobigny|Créteil|Nanterre)\)$/, "").replace(/^./, (c) => c.toLowerCase())}, le ${D(d.audience)}, à ${t.jur === "tp" ? "9 h 30" : "13 h 30"}.`],
        [{ t: `Pour avoir, à ${SF.ville}, le ${D(jf)}, ${N.prevention}. Faits prévus et réprimés par ${CAT.courtLong(q.court)}.`, f: "G_prevention" }],
        [`Remise le ${D(d.convoc != null ? d.convoc : d.mesure)}. Vous pouvez vous faire assister d'un avocat.`],
      ], sigs: [{ qui: t.genre === "pc" ? "Le greffier" : "L'officier de police judiciaire, sur instruction du procureur", t: S }] });
      titres.convocation = t.genre === "pc" ? "Avis à victime" : lib;
      fact("G_audience", { label: `L'audience du ${D(d.audience)}`, key: true });
    }
    if (t.genre === "pc" && d.voiePc === "classe") {
      docs.avis_classement = () => ({ title: "Avis de classement sans suite", kind: "greffe", entete: [`${TJ.tj} · Parquet`, "Article 40-2 du code de procédure pénale"], paras: [
        [`${nf(V)}, la procédure ouverte sur votre plainte du ${D(d.faits + 1)} contre ${n(A)} a fait l'objet d'un classement sans suite le ${D(d.classement)}.`],
        ["Motif : infraction insuffisamment caractérisée."],
        [{ t: "Vous pouvez former un recours auprès du procureur général, ou citer directement l'auteur des faits devant le tribunal compétent.", f: "G_recours" }],
      ] });
      titres.avis_classement = "Avis de classement";
      docs.pv_auteur = () => ({ title: `Procès-verbal d'audition de ${nf(A)}`, kind: "pv", entete: ent("pv_victime"), paras: [[{ t: `Le ${D(d.acte)}, entendons ${n(A)}, ${A.metier}.`, f: "G_acte_date" }], [{ t: `« ${N.version[t.stance === "reconnait" ? "minimise" : t.stance]} »`, f: "G_auteur_dit" }], ["Lu, persiste et signe."]] });
      titres.pv_auteur = `Audition de ${nf(A)}`;
      fact("G_acte_date", { label: `L'audition de ${nf(A)}, le ${D(d.acte)}`, key: true, why: "Un acte d'enquête interrompt la prescription (art. 9-2) : le délai repart de là." });
      fact("G_classement", { label: "Le classement sans suite", why: "Il n'éteint pas l'action : la victime peut citer directement." });
    }
    // pièces du préjudice, apportées par le client partie civile
    if (t.genre === "pc") for (const po of N.prejudice || []) {
      if (!po.piece) continue;
      const k = "justif_" + po.id;
      const lab = { facture: "Facture", devis: "Devis de réparation", attestation_salaire: "Attestation de l'employeur (perte de salaire)", facture_soins: "Factures de soins", releve: "Relevé de compte" }[po.piece] || "Justificatif";
      docs[k] = () => ({ title: lab, kind: "courrier", entete: [{ facture: pk(r, ["Optique Clignancourt", "Fnac Paris", "Garage Ordener", "Pompes funèbres Roc-Eclerc"]), devis: pk(r, ["Serrurerie Marcadet", "Carrosserie du Nord", "Vitrerie Barbès"]), attestation_salaire: "Service des ressources humaines", facture_soins: "Cabinet de psychologie", releve: "Banque de la victime" }[po.piece] || "—"], paras: [[{ t: `${po.label} : ${eur(po.demande)}.`, f: "P_" + po.id }]] });
      titres[k] = lab;
      fact("P_" + po.id, { label: `${po.label} : ${eur(po.demande)}`, key: true });
    }
    // Constat des images de la caméra privée (enquête de la défense)
    if (t.camera) {
      docs.enq_video = (x) => ({ title: "Procès-verbal de constat — images de vidéosurveillance", kind: "video", entete: ["Me Laure Dumas, commissaire de justice", "Rue de Clignancourt, 75018 Paris"], paras: [
        [`À la requête de ${n(A)}, représenté${e(A)} par Me ${x.s.player.prenom} ${x.s.player.nom}, j'ai visionné les images de la caméra privée située près des lieux, conservées à la demande de l'avocat.`],
        [`Horodatage : ${CR.fmtDate(jf, "num")}.`],
        t.videoDoute ? [`${hm(d.h - 3).replace(" h ", ":")} — `, { t: { violences: "Plusieurs personnes se poussent sur le trottoir ; l'image ne permet pas de distinguer qui porte le coup au visage.", rebellion: "L'homme tire son bras pour se dégager au moment du menottage ; aucun coup de poing ni de pied n'est visible.", violences_pdap: "L'homme est plaqué contre le véhicule ; on ne voit pas de coup porté à l'agent." }[t.inf] || "La scène est partiellement masquée par un véhicule ; l'auteur du geste n'est pas identifiable.", f: "G_victime_doute" }] : [`${hm(d.h - 3).replace(" h ", ":")} — Les images montrent la scène telle que décrite par les policiers.`],
        ["Copie des images remise à l'avocat requérant."],
      ], sigs: [{ qui: "Me L. Dumas, commissaire de justice", t: S }] });
      titres.enq_video = "Constat : les images de la caméra";
    }

    // ---------------------------------------------------------------- N° 12 : synthèse (enquête préliminaire), pénal des affaires
    if (!t.flagrance && ((N.conc && N.conc.length) || t.PM || t.f.plainte || t.presc)) add("pv_synthese", "Rapport de synthèse", () => ({ title: "Rapport de synthèse de l'enquête", kind: "pv", entete: ent("pv_synthese"), paras: [
      [`L'enquête, ouverte le ${D(DM(jf + int(r, 1, 20)))}, a établi les faits suivants.`],
      ...N.constat.map((x, i) => [t.f.plainte && i === 0 ? { t: x, f: "G_fisc_origine" } : x]),
      ...(N.conc || []).map((c) => [{ t: c.constat, f: c.fait }]),
      t.PM ? [`La ${t.PM.nom} (${t.PM.rcs}), dont ${n(A)} est ${A.g === "f" ? "la représentante légale" : "le représentant légal"}, a tiré profit des faits ou en répond comme employeur : elle est mise en cause comme personne morale (art. 121-2 du code pénal).`] : null,
      [`Personnes mises en cause : ${t.PM && t.dirigeantPoursuivi === false ? `la ${t.PM.nom}` : n(A) + (t.PM ? ` et la ${t.PM.nom}` : "")}.`],
    ].filter(Boolean), sigs: [{ qui: "L'officier de police judiciaire", t: S }] }));
    if (t.f.plainte) fact("G_fisc_origine", { label: "L'origine de la procédure fiscale", key: true, why: "Qui a saisi le parquet ? La fraude fiscale obéit à une règle de saisine particulière." });
    if (t.PM) {
      add("kbis", "Extrait Kbis", () => ({ title: "Extrait d'immatriculation au registre du commerce et des sociétés", kind: "releve", entete: ["Greffe du tribunal de commerce de Paris", `Extrait délivré le ${D(DM(jf + int(r, 5, 30)))}`], paras: [
        [`Dénomination : ${t.PM.nom}. Immatriculation : ${t.PM.rcs}.`],
        [`Siège : ${t.PM.siege}. Effectif : ${t.PM.effectif} salariés. Chiffre d'affaires du dernier exercice : ${eur(t.PM.ca)}.`],
        [{ t: `${t.PM.forme === "SARL" ? "Gérant" : "Président"} : ${n(A)}, depuis ${CR.ymd(jf - int(r, 700, 3000)).y}.`, f: "G_pm" }],
      ], sigs: [{ qui: "Le greffier du tribunal de commerce", t: S }] }));
      fact("G_pm", { label: `${t.PM.nom}, personne morale mise en cause`, key: true, why: "La personne morale répond des infractions commises pour son compte par ses organes ou représentants (art. 121-2)." });
    }
    if (t.deleg && t.deleg.existe) {
      const dq = t.deleg.qui;
      const nq = `${dq.prenom} ${dq.nom}`;
      add("delegation", "Délégation de pouvoirs", () => ({ title: "Délégation de pouvoirs en matière d'hygiène et de sécurité", kind: "courrier", entete: [t.PM ? t.PM.nom : "La société", `Fait à Paris le ${D(t.deleg.date)}`], paras: [
        [{ t: `Le président de la société délègue à ${nq}, ${dq.poste}, qui l'accepte, ses pouvoirs pour veiller au respect des règles d'hygiène et de sécurité sur ${t.f.sc === "machine" ? "l'atelier" : "les chantiers dont il a la charge"}.`, f: "G_deleg" }],
        [t.deleg.moyens ? `Le délégataire dispose d'un budget propre de ${eur(int(r, 15, 60) * 1000)} par an pour l'achat du matériel de sécurité, sans visa préalable.` : { t: "Toute dépense de matériel supérieure à 500 euros reste soumise à la signature préalable du président.", f: "G_deleg_defaut" }],
        [t.deleg.autorite ? "Il dispose du pouvoir d'arrêter un poste de travail et d'infliger les sanctions disciplinaires prévues au règlement intérieur." : { t: "Les équipes intérimaires restent placées sous l'autorité directe de l'agence d'intérim et du président.", f: "G_deleg_defaut" }],
        ["Signatures du délégant et du délégataire."],
      ], sigs: [{ qui: "Le président", t: S }, { qui: nq + ", délégataire", t: S }] }));
      add("pv_delegataire", `Audition de ${nq}`, () => ({ title: `Procès-verbal d'audition de ${nq}`, kind: "pv", entete: ent("pv_delegataire"), paras: [
        [`Le ${D(DM(jf + int(r, 10, 40)))}, entendons ${nq}, ${dq.age} ans, ${dq.poste} à la ${t.PM ? t.PM.nom : "société"}.`],
        [t.deleg.competence ? `« J'ai vingt ans de métier, dont dix comme ${dq.poste}. J'ai suivi la formation à la prévention des risques chaque année. »` : { t: `« J'étais ${dq.poste} depuis trois mois. Avant, j'étais ${pk(r, ["commercial", "magasinier", "assistant administratif"])}. On ne m'a donné aucune formation sécurité. »`, f: "G_deleg_defaut" }],
        [`« ${t.deleg.moyens ? "Le matériel, je le commandais moi-même. Ce jour-là, il était commandé, il n'était pas arrivé." : "Je demandais le matériel ; c'était au président de valider la dépense."} »`],
        ["Lecture faite, persiste et signe."],
      ], sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "La personne entendue", t: S }] }));
      fact("G_deleg", { label: `La délégation de pouvoirs à ${nq}, ${dq.poste}`, key: true, why: "Elle n'exonère le dirigeant que si le délégataire avait la compétence, l'autorité et les moyens nécessaires (Crim. 11 mars 1993)." });
      if (!CAT.delegationValide(t.deleg)) fact("G_deleg_defaut", { label: "Ce qui manquait au délégataire", key: true });
    }
    if (t.presc) add("comptes", "Comptes annuels approuvés", () => ({ title: "Procès-verbal de l'assemblée générale ordinaire", kind: "courrier", entete: [`Société gérée par ${n(A)}`, `Assemblée générale du ${D(t.presc.comptes)}`], paras: [
      [`L'assemblée approuve les comptes de l'exercice clos le ${D(t.presc.comptes - int(r, 120, 160))}, annexes comprises.`],
      [t.presc.dissimule ? { t: `Les dépenses en cause figurent au grand livre sous l'intitulé « prestations de conseil », facturées par une société sans activité réelle, domiciliée à ${pk(r, ["Dubaï", "Chypre", "Londres"])}.`, f: "G_comptes" } : { t: "Les dépenses en cause figurent en charges, sous l'intitulé « voyages, réceptions et véhicule du gérant », détaillées dans l'annexe remise aux associés.", f: "G_comptes" }],
      [`Découverte des faits : ${D(t.presc.decouverte)} ; ouverture de l'enquête : ${D(t.presc.poursuite)}.`],
    ], sigs: [{ qui: "Le gérant", t: S }, { qui: "Le secrétaire de séance", t: S }] }));
    if (t.presc) fact("G_comptes", { label: `Les comptes approuvés le ${D(t.presc.comptes)}`, key: true, why: "La prescription de l'abus de biens sociaux court de la présentation des comptes, sauf dissimulation (Crim. 5 mai 1997 ; art. 9-1 CPP)." });
    if (t.cjip) {
      docs.proposition_cjip = () => ({ title: "Proposition de convention judiciaire d'intérêt public", kind: "greffe", entete: [t.pnf ? "Parquet national financier" : TJ.parquet, "Article 41-1-2 du code de procédure pénale"], paras: [
        [`Le procureur de la République propose à la ${t.PM.nom}, mise en cause pour ${q.label}, de conclure une convention judiciaire d'intérêt public.`],
        [{ t: `Amende d'intérêt public : ${eur(t.cjip.amende)}, payable dans les six mois${t.cjip.programme ? ` ; programme de mise en conformité de ${t.cjip.mois} mois sous le contrôle de l'Agence française anticorruption` : ""}${t.V ? " ; réparation du préjudice de la victime" : ""}.`, f: "G_cjip" }],
        [`Réponse attendue sous ${t.cjip.delaiReponse} jours. La convention, si elle est acceptée, sera soumise à la validation du président du tribunal judiciaire en audience publique ; elle n'emporte ni déclaration de culpabilité ni inscription au casier judiciaire.`],
      ] });
      titres.proposition_cjip = "Proposition de CJIP";
      fact("G_cjip", { label: `La proposition de CJIP : ${eur(t.cjip.amende)}`, key: true, why: `Plafond légal : 30 % du chiffre d'affaires moyen annuel (art. 41-1-2) ; au procès, la société encourrait ${eur(CAT.pourPersonneMorale(CAT.qualifier(t.inf, t.f)).amende)} (art. 131-38).` });
    }

    // ---------------------------------------------------------------- Anomalies : régime, pièce, pièces du calcul annulées
    const pieceDe = { gav_notif: "pv_notification", interprete: "pv_notification", avis_parquet: "pv_notification", heures: "pv_notification", sans_avocat: "pv_audition", prolongation: "pv_prolongation", al_quitter: "pv_audition", controle_identite: "pv_interpellation", fouille: "pv_interpellation", perq_assentiment: "pv_saisie", perq_nuit: "pv_saisie", geoloc: "pv_telephonie", requisition: has("telephonie") ? "pv_telephonie" : "releve", ethylo: "pv_alcoolemie" };
    for (const id of t.irr) {
      const x = GEN2.IRR[id];
      if (!x || !docs[pieceDe[id]]) continue;
      anomalies[id] = { irreg: x.regime, piece: pieceDe[id], annule: x.annule.slice(), force: 0.7 };
    }
    // Les doutes deviennent des faits clés
    if (dou("doute_ident")) fact("G_doute_ident", { label: "L'identification de l'auteur est incertaine", key: true, why: "Le doute profite au prévenu (art. 427 et présomption d'innocence)." });
    if (dou("temoin_contra")) fact("G_temoin_contra", { label: "Le témoin contredit la version de l'accusation", key: true });
    if (dou("legitime_defense")) fact("G_ld", { label: "L'autre a attaqué le premier, avec une bouteille", key: true, why: "Une riposte nécessaire, simultanée et proportionnée est couverte par la légitime défense (art. 122-5)." });
    if (dou("alibi_tel")) fact("G_alibi", { label: "Son téléphone était ailleurs au moment des faits", key: true });
    if (dou("notif_permis")) fact("G_notif_permis", { label: "La lettre de suspension n'a jamais été retirée", key: true, why: "Le délit de l'article L. 224-16 suppose la connaissance de la décision : sans notification effective, le doute existe." });
    if (t.camera) fact("G_camera", { label: "Une caméra privée sur les lieux", why: "Les images sont écrasées au bout de quelques jours : il faut agir vite." });
    if (t.videoDoute) fact("G_victime_doute", { label: "Les images ne montrent pas le geste reproché", key: true });
    if (t.quoi === "reunion") fact("G_seul", { label: "Le témoin dit qu'il était seul", key: true, why: "Sans la réunion, la circonstance aggravante tombe." });
    if (t.quoi === "violence") fact("G_sans_violence", { label: "Aucune violence n'est visible", key: true, why: "Sans violence, le vol n'est pas aggravé à ce titre." });
    if (t.quoi === "mort") fact("G_mots", { label: "Le témoin n'a pas entendu de menace de mort", key: true });
    if (t.quoi === "usage") fact("G_conso", { label: "Une consommation personnelle, sans matériel de revente", key: true, why: "La détention pour sa seule consommation se requalifie en usage (art. L. 3421-1 CSP)." });
    if (t.quoi === "vulnerable") fact("G_autonome", { label: "La victime vit seule et gère ses comptes", key: true, why: "La vulnérabilité doit être apparente ou connue de l'auteur." });
    if (t.quoi === "r_stups") fact("G_sans_analyse", { label: "Aucune analyse sanguine au dossier", key: true, why: "Le dépistage seul n'établit pas l'usage de stupéfiants : la circonstance de l'homicide routier tombe." });
    if (t.inf === "blessures_routieres" && t.quoi) fact("G_circ_doute", { label: `La circonstance « ${CAT.aggLabel(t.quoi)} » n'est pas établie`, key: true });
    if (t.quoi === "leger") fact("G_devis", { label: "Le devis : un dommage léger", key: true, why: "Un dommage léger fait de la dégradation une contravention (art. R. 635-1)." });

    // ---------------------------------------------------------------- Refonte, lot 1 : le dossier tiré de la simulation
    // Pour les affaires que la simulation sait jouer (CR.SIM.supporte), les pièces de procédure sont composées par le
    // moteur de documents dans leur trame réelle (trames-flagrance.js) ; elles gardent les mêmes clés, faits et irrégularités.
    // Les autres pièces (casier, enquête sociale, constat de la défense…) restent celles d'avant, cotées à la suite.
    let ordreSim = null;
    if (CR.SIM && CR.SIM.supporte(t) && CR.SIM.pieces && CR.DOCS) {
      const kS = { N, C, VID, SF, TJ, opjN, has, irr, dou, A, V, T, q };
      const SS = CR.SIM.simuler(t, kS);
      const HORS = ["enq_video", "esr", "casier", "convocation", "avis_classement", "pv_auteur", "proposition_cjip"];
      // les pièces que le moteur ne compose pas encore gardent leur texte et prennent leur place dans la chronologie
      const E = SS.E, fin = E.fin != null ? E.fin : E.debut + 600;
      // enquête préliminaire : les captures sont remises avec la plainte ; images, réquisitions et expertises suivent, avant la garde à vue
      let iEnq = 0;
      const minuteDe = (k) => (SS.prelim && /captures/.test(k) ? E.plainte + 40 : SS.prelim && /video|camera|labo|adn|telephonie|releve|fichier|expertise|autopsie/.test(k) ? E.enquete(1 + iEnq++)
        : /alcool|ethylo|controle|mesure|depistage/.test(k) ? E.presentation + 15 : /urgences/.test(k) ? SS.T0 + 120 : /video|camera/.test(k) ? E.debut + 240
        : /labo|adn|telephonie|captures|releve|fichier|expertise|autopsie/.test(k) ? fin - 90 : E.debut + 180);
      const resteKeys = Object.keys(docs).filter((k) => !HORS.includes(k) && !k.startsWith("justif_"));
      kS.reste = resteKeys.map((k) => ({ key: k, m: minuteDe(k), court: (titres[k] || k).replace(/ \(D\d+\)$/, "") }));
      // violences en comparution immédiate : le dossier détaillé du pilote (trames-violences.js), sinon le moteur générique
      const PS = (CR.SIM.piecesViolences && CR.SIM.piecesViolences(t, kS, docs)) || CR.SIM.pieces(t, kS, SS);
      ordreSim = PS.ordre.map((o) => o.key);
      for (const k of Object.keys(cotes)) delete cotes[k];
      Object.assign(cotes, PS.cotes);
      for (const k of Object.keys(PS.titres)) titres[k] = PS.titres[k];
      for (const k of Object.keys(PS.docs)) docs[k] = PS.docs[k];
      if (!PS.docs.pv_temoin && T && has("temoin")) fact("G_temoin_pv", { label: `Le témoignage de ${nf(T)}`, key: t.genre === "pc" });
      // lot 1 ter : le vol en magasin
      if (SS.magasin) {
        const M = SS.magasin;
        fact("G_agent_vu", { label: `L'agent de sécurité a vu la dissimulation ${M.ecrans ? "aux écrans de contrôle" : "en salle"}`, key: false });
        if (M.qteDit !== M.qte) fact("G_agent_compte", { label: `L'agent dit avoir vu prendre ${M.qteDit} articles ; l'état du magasin en compte ${M.qte}`, key: true, why: "Un témoin qui se trompe sur le nombre se trompe peut-être sur le reste : sa déclaration se discute, pièce contre pièce." });
        fact("G_etat_vente", M.vente ? { label: "La marchandise, récupérée intacte, est remise en vente", key: true, why: "Aucun préjudice matériel : cela pèse sur la peine et sur les intérêts civils." } : { label: "La marchandise n'est plus en état de vente", key: false });
      }
    }

    // ---------------------------------------------------------------- Listes : ce que l'avocat voit, et quand
    const proc = ordreSim ? ordreSim.filter((k) => k !== "casier" && k !== "esr") : Object.keys(docs).filter((k) => !["enq_video", "esr", "casier", "convocation", "avis_classement", "pv_auteur", "proposition_cjip"].includes(k) && !k.startsWith("justif_"));
    const listes = {
      gav: ["pv_notification", "pv_interpellation", "certificat_gav"].filter((k) => docs[k]),
      dossier: proc.concat(["casier"]).concat(docs.esr ? ["esr"] : []),
      copie: proc.concat(["casier"]),
      client: Object.keys(docs).filter((k) => k.startsWith("justif_")).concat(docs.convocation ? ["convocation"] : []).concat(docs.avis_classement ? ["avis_classement"] : []),
    };
    for (const k of Object.keys(docs)) if (!titres[k]) titres[k] = k;
    // Chaque pièce tire ses détails (noms des médecins, heures secondaires…) de sa propre graine : la même pièce,
    // relue dix fois ou rechargée d'une sauvegarde, dit toujours la même chose
    for (const k of Object.keys(docs)) { const fn = docs[k]; docs[k] = (x) => { r = CR.seeded(t.sig + ":" + k); return CAT.typoDeep(fn(x)); }; }
    return { docs, titres, anomalies, facts, listes, cotes, C };
  };
})();
