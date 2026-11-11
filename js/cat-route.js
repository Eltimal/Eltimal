/* La Permanence — catalogue : circulation routière, droit pénal des affaires, infractions numériques.
   Homicide et blessures routiers : loi n° 2025-622 du 9 juillet 2025 (homicide routier, art. 221-18 ; blessures routières, art. 221-19 et 221-20).
   Peines et articles rédigés hors ligne, à revérifier sur Légifrance. */
(function () {
  const CR = window.CR;
  const CAT = CR.CAT;
  const { pk, int, ch } = CAT;
  const eur = (n) => CR.money(n);
  const VEH = ["Peugeot 208", "Renault Clio", "Volkswagen Golf", "Citroën C3", "BMW Série 1", "Mercedes Classe A", "Toyota Yaris", "Dacia Sandero", "Audi A3", "Fiat 500"];
  const tx = (t) => String(t.toFixed(2)).replace(".", ",");

  // =================================================================== ALCOOL AU VOLANT
  CAT.def("alcool", {
    fam: "route", nom: "Conduite sous l'empire d'un état alcoolique", gravite: 0.3, op: true, victime: null,
    textes: ["CR_L234-1", "CR_L234-2", "CR_R234-1", "CR_L234-8"],
    elements: { legal: "Art. L. 234-1 C. route (délit : 0,40 mg/l d'air expiré, 0,80 g/l de sang, ou ivresse manifeste) ; R. 234-1 (contravention : 0,25 mg/l) ; L. 234-8 (refus).", materiel: "La conduite d'un véhicule avec un taux d'alcool égal ou supérieur au seuil, établi par éthylomètre ou analyse de sang.", moral: "Délit matériel : la conscience d'avoir bu suffit." },
    mesures: { gav: 0.45, al: 0.45, convocation: 0.1 }, flagrance: 1,
    voies: { classement: 0.02, alternative: 0.14, copj: 0.2, ci: 0.02, crpc: 0.27, op: 0.35 },
    preuves: { constat: 1, ethylo: 1, aveux: 0.65, temoin: 0.05 },
    camera: 0, irr: ["ethylo", "heures"],
    tirer(r) {
      const refus = ch(r, 0.08);
      const taux = refus ? 0 : CAT.poids(r, { c: 0.12, b: 0.2, d: 0.68 }) === "c" ? int(r, 26, 39) / 100 : ch(r, 0.25) ? int(r, 40, 43) / 100 : int(r, 44, 120) / 100;
      return { sc: pk(r, ["controle", "controle", "infraction", "accident"]), taux, refus, ivresse: !refus && taux >= 0.6 && ch(r, 0.35), agg: [], vehicule: pk(r, VEH) };
    },
    qual(f) {
      if (f.refus) return CAT.delit(24, 4500, "art. L. 234-8 C. route", "refus de se soumettre aux vérifications tendant à établir l'état alcoolique", { textes: ["CR_L234-8"] });
      if (f.taux >= 0.4 || f.ivresse) return CAT.delit(24, 4500, "art. L. 234-1 C. route", f.ivresse && f.taux < 0.4 ? "conduite d'un véhicule en état d'ivresse manifeste" : `conduite d'un véhicule sous l'empire d'un état alcoolique caractérisé par une concentration d'alcool de ${tx(f.taux)} mg par litre d'air expiré`, { textes: ["CR_L234-1"] });
      return CAT.contrav(4, "art. R. 234-1 C. route", `conduite d'un véhicule sous l'empire d'un état alcoolique caractérisé par une concentration d'alcool de ${tx(f.taux)} mg par litre d'air expiré`, { textes: ["CR_R234-1"] });
    },
    // Marge d'erreur de l'éthylomètre (8 % au-delà de 0,40 mg/l) : une mesure de 0,40 à 0,43 peut retomber sous le seuil du délit
    requalif(r, f) { return !f.refus && !f.ivresse && f.taux >= 0.4 && f.taux < 0.435 ? { f2: Object.assign({}, f, { taux: Math.floor(f.taux * 0.92 * 100) / 100 }), quoi: "marge" } : null; },
    comp: (q, c) => [c && c.recidive ? "annulation du permis de conduire avec interdiction d'en solliciter un nouveau pendant un an" : "suspension du permis de conduire pour quatre mois", "stage de sensibilisation à la sécurité routière"],
    compContrav: ["suspension du permis de conduire pour deux mois"],
    recit(X, f) {
      const { A, r } = X;
      const motif = { controle: "un contrôle routier préventif sur réquisitions du procureur de la République", infraction: pk(r, ["le franchissement d'un feu rouge", "une circulation sans feux", "une conduite en zigzag", "un excès de vitesse"]), accident: "un accrochage matériel avec un véhicule en stationnement" }[f.sc];
      return {
        titre: f.sc === "accident" ? "l'accrochage après la soirée" : "le contrôle d'alcoolémie", lieu: `boulevard ${pk(r, ["Barbès", "Ornano", "de la Chapelle", "Ney", "de Clichy"])}`, taux: f.taux,
        resume: `Contrôlé${X.e(A)} au volant d'une ${f.vehicule} après ${motif}${f.refus ? " ; refus de souffler" : ` ; ${tx(f.taux)} mg/l d'air expiré`}.`,
        constat: [`À ${X.h(X.hf)}, interceptons le véhicule ${f.vehicule} conduit par ${X.n(A)}, après ${motif}.`, f.ivresse ? "L'intéressé présente une haleine sentant fortement l'alcool, les yeux injectés de sang, une élocution pâteuse, une démarche titubante." : "Haleine sentant l'alcool ; pas d'autre signe apparent.", f.refus ? "Invité à se soumettre au dépistage, puis à la vérification par éthylomètre, l'intéressé refuse à deux reprises : « Je souffle pas, c'est mon droit. »" : "Dépistage positif ; conduite au commissariat pour vérification par éthylomètre."],
        version: { nie: "J'avais pas bu. C'est le bain de bouche, ou leur appareil qui déconne.", minimise: "Deux bières à un anniversaire. Je me sentais bien.", reconnait: "J'ai bu, je n'aurais pas dû prendre le volant." + { salarie: " J'ai besoin de mon permis pour travailler.", independant: " J'ai besoin de mon permis pour travailler.", chomage: " Sans permis, je ne retrouverai pas de travail.", rsa: " Sans permis, je ne retrouverai pas de travail.", etudiant: " J'ai besoin de mon permis pour mon stage.", retraite: " Sans voiture, je suis coincé" + X.e(A) + " chez moi." }[X.situ(A)] || "" },
        audition: [
          { q: "Combien de verres aviez-vous bus ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je reconnais avoir bu." } },
          { q: "Vous avez besoin de votre permis pour travailler ?", a: { silence: "…", expliquer: X.permis(A).audition, partiel: X.permis(A).oui ? "Oui." : "Non." } },
        ],
        prevention: f.refus ? `alors qu'il existait des raisons plausibles de présumer qu'il conduisait sous l'empire d'un état alcoolique, refusé de se soumettre aux vérifications destinées à établir l'état alcoolique, au volant d'une ${f.vehicule}` : `conduit une ${f.vehicule} ${f.taux >= 0.4 || !f.ivresse ? `sous l'empire d'un état alcoolique caractérisé par une concentration d'alcool de ${tx(f.taux)} mg par litre d'air expiré` : "en état d'ivresse manifeste"}`,
        prejudice: [],
        qA: [{ q: "Avez-vous demandé une seconde mesure ?", a: ["Une seconde mesure ? Personne ne m'a parlé de ça."] }],
      };
    },
  });

  // =================================================================== STUPÉFIANTS AU VOLANT
  CAT.def("stups_volant", {
    fam: "route", nom: "Conduite après usage de stupéfiants", gravite: 0.3, op: true, victime: null,
    textes: ["CR_L235-1"],
    elements: { legal: "Art. L. 235-1 C. route.", materiel: "La conduite alors qu'une analyse sanguine ou salivaire établit l'usage de stupéfiants ; le dépistage seul ne suffit pas.", moral: "Délit matériel." },
    mesures: { gav: 0.4, al: 0.5, convocation: 0.1 }, flagrance: 1,
    voies: { classement: 0.02, alternative: 0.13, copj: 0.25, ci: 0.02, crpc: 0.25, op: 0.33 },
    preuves: { constat: 1, labo: 1, aveux: 0.6 },
    camera: 0, irr: ["heures"],
    tirer(r) { return { sc: pk(r, ["controle", "infraction", "accident"]), produit: pk(r, ["cannabis", "cannabis", "cocaïne"]), alcool: ch(r, 0.2), agg: [], vehicule: pk(r, VEH) }; },
    qual: (f) => (f.alcool ? CAT.delit(36, 9000, "art. L. 235-1 C. route", "conduite d'un véhicule après usage de stupéfiants et sous l'empire d'un état alcoolique") : CAT.delit(24, 4500, "art. L. 235-1 C. route", "conduite d'un véhicule après usage de substances classées comme stupéfiants")),
    comp: () => ["suspension du permis de conduire pour six mois", "stage de sensibilisation aux dangers de l'usage de produits stupéfiants"],
    recit(X, f) {
      const { A, r } = X;
      return {
        titre: "le dépistage salivaire", lieu: `rue ${pk(r, ["Marcadet", "Ordener", "Championnet", "Damrémont"])}`,
        resume: `Dépisté${X.e(A)} positif ${f.produit === "cannabis" ? "au cannabis" : "à la cocaïne"} ${f.sc === "accident" ? "après un accrochage" : f.sc === "infraction" ? "après un feu rouge grillé" : "lors d'un contrôle"}, au volant d'une ${f.vehicule}${f.alcool ? ", avec de l'alcool" : ""}.`,
        constat: [f.sc === "accident" ? `Intervenons pour un accrochage matériel entre deux véhicules ; ${X.n(A)} conduisait la ${f.vehicule}. Personne n'est blessé. Dépistage systématique après accident : test salivaire positif (${f.produit === "cannabis" ? "THC" : "cocaïne"}).` : f.sc === "infraction" ? `Constatons que la ${f.vehicule} conduite par ${X.n(A)} franchit le feu rouge au carrefour. Interception ; test salivaire de dépistage positif (${f.produit === "cannabis" ? "THC" : "cocaïne"}).` : `Contrôle du véhicule ${f.vehicule} conduit par ${X.n(A)}. Test salivaire de dépistage positif (${f.produit === "cannabis" ? "THC" : "cocaïne"}).`, "Prélèvement salivaire de confirmation réalisé sur place, adressé au laboratoire ; immobilisation du véhicule ; rétention du permis."],
        version: { nie: "J'ai pas fumé depuis une semaine. Ça reste dans le corps.", minimise: `Un joint la veille au soir. J'étais pas défoncé${X.e(A)}.`, reconnait: "J'avais fumé avant de partir. C'était con." },
        audition: [{ q: "Quand avez-vous consommé pour la dernière fois ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Il y a plusieurs jours." } }],
        prevention: `conduit une ${f.vehicule} alors qu'il résultait d'une analyse salivaire qu'il avait fait usage de ${f.produit === "cannabis" ? "cannabis" : "cocaïne"}, substance classée comme stupéfiant${f.alcool ? ", en se trouvant également sous l'empire d'un état alcoolique" : ""}`,
        prejudice: [],
      };
    },
  });

  // =================================================================== DÉFAUT DE PERMIS
  CAT.def("defaut_permis", {
    fam: "route", nom: "Conduite sans permis", gravite: 0.25, op: true, victime: null,
    textes: ["CR_L221-2", "CR_L224-16"],
    elements: { legal: "Art. L. 221-2 C. route (jamais titulaire) ; L. 224-16 (malgré suspension, annulation ou invalidation).", materiel: "La conduite sans permis valable pour la catégorie du véhicule.", moral: "Pour L. 224-16, la connaissance de la décision : la notification est la question clé." },
    mesures: { gav: 0.35, al: 0.55, convocation: 0.1 }, flagrance: 1,
    voies: { classement: 0.02, alternative: 0.1, copj: 0.3, ci: 0.05, crpc: 0.23, op: 0.3 },
    preuves: { constat: 1, fichier: 1, aveux: 0.7 },
    camera: 0, irr: ["controle_identite", "notif_permis"],
    tirer(r) { return { sc: pk(r, ["jamais", "jamais", "suspendu", "invalide"]), agg: [], vehicule: pk(r, VEH) }; },
    qual: (f) => (f.sc === "jamais" ? CAT.delit(12, 15000, "art. L. 221-2 C. route", "conduite d'un véhicule sans être titulaire du permis de conduire correspondant", { textes: ["CR_L221-2"] }) : CAT.delit(24, 4500, "art. L. 224-16 C. route", `conduite d'un véhicule malgré ${f.sc === "suspendu" ? "la notification d'une décision de suspension du permis de conduire" : "l'invalidation du permis de conduire pour solde de points nul"}`, { textes: ["CR_L224-16"] })),
    comp: (q) => ["confiscation du véhicule", q.art.includes("221-2") ? "interdiction de solliciter un permis de conduire pendant un an" : "annulation du permis de conduire"],
    recit(X, f) {
      const { A, r } = X;
      return {
        titre: f.sc === "jamais" ? "le conducteur sans permis" : "la conduite malgré la suspension", lieu: `avenue de ${pk(r, ["Saint-Ouen", "Clichy", "la Porte de Clignancourt"])}`,
        resume: `Contrôlé${X.e(A)} au volant d'une ${f.vehicule} ; ${f.sc === "jamais" ? "jamais titulaire du permis" : f.sc === "suspendu" ? "permis suspendu par arrêté préfectoral" : "permis invalidé (solde de points nul)"}.`,
        constat: [`Contrôle du véhicule ${f.vehicule}. Le conducteur, ${X.n(A)}, ne présente pas de permis.`, `Consultation du fichier national des permis de conduire : ${f.sc === "jamais" ? "aucun permis délivré à cette identité" : f.sc === "suspendu" ? "suspension administrative de six mois, arrêté du préfet de police, notifié par lettre recommandée" : "invalidation pour solde de points nul, décision 48 SI notifiée par lettre recommandée"}.`],
        version: { nie: "J'ai un permis, je l'ai laissé chez moi.", minimise: f.sc === "jamais" ? "J'ai le code, je passe la conduite le mois prochain. Je dépannais un ami." : "Je savais pas qu'il était suspendu. J'ai jamais reçu la lettre.", reconnait: X.travaille(A) ? "Je savais. Je devais aller travailler, il n'y a pas de bus à cette heure." : "Je savais. C'était pour quelques rues, je pensais pas être contrôlé" + X.e(A) + "." },
        audition: [{ q: f.sc === "jamais" ? "Avez-vous déjà passé le permis ?" : "Avez-vous reçu la notification de la décision ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je ne sais pas." } }],
        prevention: f.sc === "jamais" ? `conduit une ${f.vehicule} sans être titulaire du permis de conduire correspondant à la catégorie du véhicule` : `conduit une ${f.vehicule} malgré ${f.sc === "suspendu" ? "la notification d'une décision prononçant la suspension de son permis de conduire" : "l'invalidation de son permis de conduire pour solde de points nul"}`,
        prejudice: [],
      };
    },
  });

  // =================================================================== REFUS D'OBTEMPÉRER
  CAT.def("refus_obtemperer", {
    fam: "route", nom: "Refus d'obtempérer", gravite: 0.45, op: true, victime: null,
    textes: ["CR_L233-1"],
    elements: { legal: "Art. L. 233-1 et L. 233-1-1 C. route.", materiel: "L'omission d'obtempérer à une sommation de s'arrêter émanant d'un agent muni d'insignes apparents ; l'exposition d'autrui à un risque de mort aggrave.", moral: "La conscience de la sommation." },
    mesures: { gav: 1, al: 0, convocation: 0 }, flagrance: 1,
    voies: { classement: 0.02, alternative: 0.04, copj: 0.35, ci: 0.37, crpc: 0.22 },
    preuves: { constat: 1, video: 0.3, aveux: 0.5, temoin: 0.15 },
    camera: 0.2, irr: ["heures"],
    tirer(r) { const sc = pk(r, ["fuite", "fuite", "barrage", "deux_roues"]); return { sc, danger: ch(r, sc === "barrage" ? 0.15 : 0.4), agg: [], vehicule: pk(r, VEH.concat(["scooter Yamaha TMax", "moto Kawasaki Z900"])) }; },
    qual: (f) => (f.danger ? CAT.delit(60, 75000, "art. L. 233-1-1 C. route", "refus d'obtempérer aggravé par la mise en danger d'autrui") : CAT.delit(24, 15000, "art. L. 233-1 C. route", "refus d'obtempérer à une sommation de s'arrêter")),
    comp: () => ["suspension du permis de conduire pour un an", "confiscation du véhicule"],
    recit(X, f) {
      const { A, r } = X;
      return {
        titre: "le refus d'obtempérer", lieu: `boulevard ${pk(r, ["Ney", "Barbès", "de la Chapelle"])}`,
        resume: f.sc === "barrage" ? `À un barrage de contrôle routier, ${X.n(A)} redémarre au moment où le gardien de la paix s'approche de la vitre${f.danger ? ", en le frôlant" : ""}.` : f.sc === "deux_roues" ? `Sur son deux-roues, ${X.n(A)} ignore les injonctions d'une patrouille et la sème dans les petites rues ; identifié${X.e(A)} par la plaque et la vidéoprotection.` : `${X.n(A)} ne s'arrête pas à la sommation et prend la fuite au volant d'un${f.vehicule.startsWith("scooter") || f.vehicule.startsWith("moto") ? "" : "e"} ${f.vehicule}${f.danger ? ", à contresens, frôlant des piétons" : ""}.`,
        constat: f.sc === "barrage" ? [`Dispositif de contrôle routier, chasubles et panneau « Police - Stop » en place. Le conducteur du véhicule ${f.vehicule} baisse sa vitre, puis redémarre brusquement${f.danger ? " ; le gardien de la paix doit s'écarter pour ne pas être percuté" : ""}.`, "La plaque est relevée ; le titulaire de la carte grise est convoqué et se présente le lendemain."] : f.sc === "deux_roues" ? [`Injonction de s'arrêter faite au conducteur d'un deux-roues ${f.vehicule}, gyrophare actionné. Le conducteur accélère et s'engage dans les rues piétonnes.`, "Poursuite interrompue pour ne pas mettre en danger les passants. Exploitation de la vidéoprotection et de la plaque : le conducteur est identifié et interpellé à son domicile deux jours plus tard."] : [`Faisons signe au conducteur du véhicule ${f.vehicule} de s'arrêter, gyrophare et deux-tons actionnés, bras levé, en tenue.`, `Le conducteur accélère et prend la fuite${f.danger ? ", franchit deux feux rouges, emprunte la voie de bus à contresens, oblige un piéton à se jeter sur le trottoir" : ""}.`, `Le véhicule est retrouvé ${pk(r, ["immobilisé contre un plot", "stationné dans une rue voisine, moteur chaud", "abandonné, le conducteur interpellé à pied"])} ; interpellation de ${X.n(A)}.`],
        version: { nie: "J'ai pas vu les policiers. J'avais la musique fort.", minimise: "J'ai paniqué, je n'avais pas mes papiers. J'ai roulé doucement.", reconnait: "J'ai fui, oui. J'avais peur de perdre mon permis." },
        audition: [{ q: "Pourquoi ne vous êtes-vous pas arrêté ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "J'ai paniqué." } }],
        prevention: `omis d'obtempérer à une sommation de s'arrêter émanant d'un fonctionnaire de police muni des insignes extérieurs et apparents de sa qualité${f.danger ? ", dans des circonstances exposant directement autrui à un risque de mort ou de blessures" : ""}`,
        prejudice: [],
      };
    },
  });

  // =================================================================== DÉLIT DE FUITE
  CAT.def("delit_fuite", {
    fam: "route", nom: "Délit de fuite", gravite: 0.4, victime: "personne",
    textes: ["CP_434-10"],
    elements: { legal: "Art. 434-10 CP.", materiel: "Ne pas s'arrêter après avoir causé ou occasionné un accident, pour échapper à sa responsabilité.", moral: "La conscience d'avoir causé un accident." },
    mesures: { gav: 0.6, al: 0.35, convocation: 0.05 }, flagrance: 0.3,
    voies: { classement: 0.05, alternative: 0.08, copj: 0.45, ci: 0.12, crpc: 0.3 },
    preuves: { temoin: 0.8, video: 0.45, expertise: 0.4, aveux: 0.5, plainte: 1 },
    camera: 0.35, irr: [],
    tirer(r) { return { sc: pk(r, ["materiel", "materiel", "pieton", "stationnement", "cycliste"]), agg: [], vehicule: pk(r, VEH), plaque: `${pk(r, ["FG", "GH", "EK", "HB", "GD"])}-${int(r, 100, 999)}-${pk(r, ["KL", "TP", "ZA", "RB", "MN"])}` }; },
    qual: () => CAT.delit(36, 75000, "art. 434-10 CP", "délit de fuite après un accident"),
    comp: () => ["suspension du permis de conduire pour un an"],
    recit(X, f) {
      const { A, V, r } = X;
      return {
        titre: "le délit de fuite", lieu: `${X.rue}, ${X.lieu}`,
        resume: f.sc === "stationnement" ? `En manœuvrant pour se garer, le conducteur d'une ${f.vehicule} immatriculée ${f.plaque} aurait enfoncé l'aile d'une voiture en stationnement appartenant à ${X.nf(V)}, puis serait reparti sans laisser de mot ; ${X.n(A)} en est ${A.g === "f" ? "la titulaire" : "le titulaire"}.` : f.sc === "cycliste" ? `Le conducteur d'une ${f.vehicule} immatriculée ${f.plaque} aurait fait chuter ${X.nf(V)}, à vélo, en tournant à droite, et serait reparti ; ${X.n(A)} en est ${A.g === "f" ? "la titulaire" : "le titulaire"}.` : `Après ${f.sc === "pieton" ? `avoir heurté ${X.nf(V)}, ${V.g === "f" ? "piétonne" : "piéton"}, sans ${V.g === "f" ? "la" : "le"} blesser gravement` : `avoir percuté le véhicule de ${X.nf(V)}`}, le conducteur d'une ${f.vehicule} immatriculée ${f.plaque} serait reparti ; ${X.n(A)} en est ${A.g === "f" ? "la titulaire" : "le titulaire"}.`,
        constat: [`Plainte de ${X.nf(V)}. Un témoin a relevé l'immatriculation ${f.plaque}. Le fichier des immatriculations désigne ${X.n(A)} ; véhicule retrouvé avec une trace de choc à l'avant droit.`],
        plainte: [f.sc === "stationnement" ? `Ma voiture était garée devant chez moi. Le matin, l'aile arrière était enfoncée, sans un mot sur le pare-brise. Une voisine a tout vu depuis son balcon.` : f.sc === "cycliste" ? `Je roulais sur la piste cyclable. La voiture a tourné à droite sans me voir, je suis tombé${X.e(V)}. ${X.g(A).w("Le conducteur", "La conductrice")} a ralenti, puis ${X.il(A)} est reparti${X.e(A)}.` : f.sc === "pieton" ? `La voiture m'a accroché${X.e(V)} sur le passage piéton. ${X.g(A).w("Le conducteur", "La conductrice")} a ralenti, m'a regardé${X.e(V)}, et ${X.il(A)} est reparti${X.e(A)}.` : `J'ai entendu un grand bruit. Mon pare-chocs était arraché. ${X.g(A).w("Le conducteur", "La conductrice")} a fait marche arrière et ${X.il(A)} est parti${X.e(A)}.`],
        temoin: [f.sc === "stationnement" ? `De mon balcon, j'ai vu la voiture reculer dans l'autre, deux fois. ${X.g(X.A).w("Le conducteur", "La conductrice")} est descendu${X.e(X.A)}, a regardé, et ${X.il(X.A)} est reparti${X.e(X.A)}. J'ai noté la plaque : ${f.plaque}.` : `J'ai noté la plaque : ${f.plaque}. ${X.g(X.A).w("Le conducteur", "La conductrice")} a regardé dans le rétroviseur et ${X.il(X.A)} a accéléré.`],
        version: { nie: "Je n'ai rien senti. Je ne savais pas qu'il y avait eu un choc.", minimise: `J'ai cru que c'était rien. ${X.enfants(A) && A.age < 50 ? "Je devais récupérer mon fils à l'école." : X.travaille(A) ? "J'étais en retard au travail." : `J'étais pressé${X.e(A)}, j'avais un rendez-vous.`}`, reconnait: "J'ai eu peur. Je suis reparti. Je rembourserai les dégâts." },
        audition: [{ q: "Votre véhicule porte une trace de choc à l'avant droit. Comment l'expliquez-vous ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je ne sais pas d'où elle vient." } }],
        prevention: `étant conduct${A.g === "f" ? "rice" : "eur"} du véhicule ${f.vehicule} immatriculé ${f.plaque}, sachant qu'${X.il(A)} venait de causer un accident, ne s'être pas arrêté et avoir ainsi tenté d'échapper à la responsabilité pénale ou civile qu'il pouvait avoir encourue`,
        prejudice: [{ id: "materiel", label: f.sc === "pieton" || f.sc === "cycliste" ? "Frais médicaux, vêtements et vélo" : "Réparation du véhicule (facture du garage)", demande: f.sc === "pieton" || f.sc === "cycliste" ? 420 : int(r, 8, 30) * 100, base: null, piece: "facture" }, { id: "moral", label: "Préjudice moral", demande: 600, base: 300 }],
      };
    },
  });

  // =================================================================== BLESSURES ROUTIÈRES (loi du 9 juillet 2025)
  const RCIRC = { r_alcool: 0.4, r_stups: 0.3, r_vitesse: 0.15, r_permis: 0.12, r_fuite: 0.12, r_telephone: 0.15 };
  CAT.def("blessures_routieres", {
    fam: "route", nom: "Blessures routières", gravite: 0.55, victime: "personne",
    textes: ["CP_221-19", "CP_221-20"],
    elements: { legal: "Blessures routières (loi n° 2025-622 du 9 juillet 2025) : conducteur d'un véhicule terrestre à moteur, au moins une circonstance prévue par la loi.", materiel: "Une faute de conduite, un lien de causalité certain avec les blessures, une ITT, et une circonstance (alcool, stupéfiants, vitesse, défaut de permis, fuite, téléphone…).", moral: "Infraction non intentionnelle : maladresse, imprudence ou manquement." },
    mesures: { gav: 0.7, al: 0.3, convocation: 0 }, flagrance: 0.6,
    voies: { classement: 0.02, alternative: 0.02, copj: 0.55, ci: 0.15, crpc: 0.26 },
    preuves: { constat: 1, certificat: 1, temoin: 0.6, expertise: 0.6, video: 0.35, labo: 0.5, aveux: 0.4 },
    camera: 0.35, irr: ["ethylo", "heures"],
    tirer(r) {
      const circ = CAT.tirerAgg(r, RCIRC, 2);
      if (!circ.length) circ.push("r_alcool");
      return { sc: pk(r, ["pieton", "cycliste", "scooter", "voiture"]), agg: circ, itt: CAT.poids(r, { a: 0.65, b: 0.35 }) === "a" ? int(r, 3, 90) : int(r, 95, 240), vehicule: pk(r, VEH) };
    },
    qual(f) {
      const n = f.agg.length;
      if (f.itt > 90) { const [p, a] = n >= 2 ? [84, 100000] : [60, 75000]; return CAT.delit(p, a, "art. 221-19 CP", `blessures routières ayant entraîné une incapacité totale de travail de plus de trois mois, ${f.agg.map(CAT.aggLabel).join(", ")}`, { textes: ["CP_221-19"] }); }
      const [p, a] = n >= 2 ? [60, 75000] : [36, 45000];
      return CAT.delit(p, a, "art. 221-20 CP", `blessures routières ayant entraîné une incapacité totale de travail n'excédant pas trois mois, ${f.agg.map(CAT.aggLabel).join(", ")}`, { textes: ["CP_221-20"] });
    },
    requalif(r, f) { return f.agg.length >= 2 && ch(r, 0.4) ? { f2: Object.assign({}, f, { agg: f.agg.slice(0, 1) }), quoi: f.agg[1] } : null; },
    comp: () => ["annulation du permis de conduire avec interdiction d'en solliciter un nouveau pendant deux ans", "stage de sensibilisation à la sécurité routière"],
    recit(X, f) {
      const { A, V, r } = X;
      const vic = { pieton: "piéton, sur le passage protégé", cycliste: "cycliste, sur la piste cyclable", scooter: "conducteur d'un scooter", voiture: "passagère du véhicule percuté" }[f.sc];
      const les = f.itt > 90 ? pk(r, ["une fracture ouverte du tibia et du péroné droits, opérée", "une fracture du bassin et une fracture du fémur", "un traumatisme crânien avec hémorragie méningée"]) : pk(r, ["une fracture du poignet gauche", "une fracture de la clavicule", "des contusions multiples et une entorse grave du genou"]);
      return {
        titre: `l'accident ${f.sc === "pieton" ? "du piéton" : f.sc === "cycliste" ? "du cycliste" : "de la rue " + X.rue.replace(/^rue /, "")}`, lieu: `au carrefour de la ${X.rue} et du boulevard ${pk(r, ["Barbès", "Ornano", "Ney"])}`,
        lesions: [les], itt: f.itt,
        resume: `${X.n(A)}, au volant d'une ${f.vehicule}, a percuté ${X.nf(V)}, ${vic} : ${les}, ${f.itt} jours d'ITT. Circonstances : ${f.agg.map(CAT.aggLabel).join(", ")}.`,
        constat: [`Intervention pour un accident corporel. ${X.nf(V)}, ${vic}, est pris${X.e(V)} en charge par les sapeurs-pompiers vers l'hôpital Bichat.`, `Le véhicule ${f.vehicule} présente un enfoncement du capot et un pare-brise étoilé côté passager.`, f.agg.includes("r_alcool") ? "Dépistage d'alcoolémie positif ; vérification par éthylomètre : 0,62 mg/l d'air expiré." : f.agg.includes("r_stups") ? "Dépistage salivaire positif au THC ; prélèvement de confirmation." : "Dépistages d'alcoolémie et de stupéfiants négatifs.", f.agg.includes("r_fuite") ? `${X.g(X.A).w("Le conducteur", "La conductrice")} ne s'est pas arrêté${X.e(X.A)} ; ${X.il(X.A)} est identifié${X.e(X.A)} par la plaque et interpellé à son domicile deux heures plus tard.` : "Le conducteur est resté sur place."],
        plainte: [`${f.sc === "pieton" ? "Je traversais au vert, sur le passage piéton" : f.sc === "voiture" ? "J'étais assis" + X.e(V) + " à la place du passager" : "Je roulais normalement, à droite"}. La voiture est arrivée très vite. Je ne me souviens de rien après le choc.`, `J'ai ${les}. ${X.travaille(V) ? (f.itt > 90 ? "Je ne pourrai pas reprendre mon travail avant des mois." : "Je suis en arrêt.") : f.itt > 90 ? "Je ne remarcherai pas normalement avant des mois." : "Je suis en rééducation."}`],
        temoin: [`La voiture roulait vite, ${f.agg.includes("r_telephone") ? `${X.g(X.A).w("le conducteur", "la conductrice")} avait son téléphone à la main, je l'ai vu` : "elle n'a pas freiné"}. Le choc a été très violent.`],
        version: { nie: `${X.Il(V)} a traversé n'importe comment, au rouge. Je ne pouvais pas l'éviter.`, minimise: `J'ai bu un verre. Mais c'est ${X.lui(V)} qui a surgi.`, reconnait: `C'est ma faute. Je pense à ${X.lui(V)} tous les jours.` },
        audition: [{ q: "À quelle vitesse rouliez-vous ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Normalement." } }],
        prevention: `en conduisant le véhicule ${f.vehicule}, involontairement causé à ${X.nf(V)} une incapacité totale de travail de ${f.itt} jours, par maladresse, imprudence, inattention ou manquement à une obligation de prudence, ${f.agg.map(CAT.aggPrev).join(", ")}`,
        prejudice: [{ id: "dft", label: "Déficit fonctionnel temporaire et souffrances endurées", demande: f.itt * 45, base: f.itt * 35 }].concat(X.travaille(V) ? [{ id: "salaire", label: "Pertes de gains professionnels", demande: f.itt * 60, base: f.itt * 55, piece: "attestation_salaire" }] : []).concat([{ id: "expertise", label: "Provision dans l'attente d'une expertise médicale", demande: 3000, base: 2000 }]),
      };
    },
  });

  // =================================================================== HOMICIDE ROUTIER (art. 221-18, loi du 9 juillet 2025)
  CAT.def("homicide_routier", {
    fam: "route", nom: "Homicide routier", gravite: 0.8, victime: "personne", deces: true, pasCRPC: true,
    textes: ["CP_221-18", "CP_221-6"],
    elements: { legal: "Art. 221-18 CP (homicide routier) ; à défaut de circonstance, homicide involontaire (art. 221-6).", materiel: "La mort d'autrui causée par le conducteur, un lien de causalité certain, une faute, et au moins une circonstance pour l'homicide routier.", moral: "Infraction non intentionnelle." },
    mesures: { gav: 0.9, al: 0.1, convocation: 0 }, flagrance: 0.7,
    voies: { classement: 0, alternative: 0, copj: 0.82, ci: 0.18, crpc: 0 },
    preuves: { constat: 1, autopsie: 1, temoin: 0.6, expertise: 0.8, video: 0.35, labo: 0.6, aveux: 0.4 },
    camera: 0.35, irr: ["ethylo", "heures"],
    tirer(r) { const circ = ch(r, 0.88) ? CAT.tirerAgg(r, RCIRC, 2) : []; if (!circ.length && ch(r, 0.7)) circ.push("r_alcool"); return { sc: pk(r, ["pieton", "cycliste", "scooter"]), agg: circ, vehicule: pk(r, VEH) }; },
    qual(f) {
      if (!f.agg.length) return CAT.delit(36, 45000, "art. 221-6 CP", "homicide involontaire", { textes: ["CP_221-6"] });
      return CAT.delit(f.agg.length >= 2 ? 120 : 84, f.agg.length >= 2 ? 150000 : 100000, "art. 221-18 CP", `homicide routier, ${f.agg.map(CAT.aggLabel).join(", ")}`, { textes: ["CP_221-18"] });
    },
    requalif(r, f) { return f.agg.length === 1 && f.agg[0] === "r_stups" && ch(r, 0.5) ? { f2: Object.assign({}, f, { agg: [] }), quoi: "r_stups" } : null; },
    comp: () => ["annulation du permis de conduire avec interdiction d'en solliciter un nouveau pendant cinq ans", "confiscation du véhicule"],
    recit(X, f) {
      const { A, V, r } = X;
      const vic = { pieton: V.g === "f" ? "piétonne" : "piéton", cycliste: "cycliste", scooter: V.g === "f" ? "conductrice de scooter" : "conducteur de scooter" }[f.sc];
      const PP = X.P || { dit: V.g === "f" ? "ma femme" : "mon mari" };
      return {
        titre: `la mort ${f.sc === "pieton" ? "du piéton" : f.sc === "cycliste" ? "du cycliste" : "du conducteur de scooter"}`, lieu: `boulevard ${pk(r, ["Ney", "Ornano", "Barbès", "de la Chapelle"])}, à hauteur du numéro ${int(r, 2, 120)}`,
        resume: `${X.n(A)}, au volant d'une ${f.vehicule}, a percuté ${X.nf(V)}, ${V.age} ans, ${vic}, décédé${X.e(V)} ${pk(r, ["sur place", "à l'hôpital dans la nuit"])}. ${f.agg.length ? "Circonstances : " + f.agg.map(CAT.aggLabel).join(", ") + "." : "Aucune circonstance relevée."}`,
        constat: [`Intervention pour un accident mortel. ${X.nf(V)}, ${vic}, gît sur la chaussée, inconscient${X.e(V)} ; arrêt cardio-respiratoire à l'arrivée des secours ; décès constaté à ${X.h(X.hf + 50)}.`, `Traces de freinage de 18 mètres ; point de choc sur le capot et le montant de pare-brise du véhicule ${f.vehicule}.`, f.agg.includes("r_alcool") ? "Vérification par éthylomètre du conducteur : 0,71 mg/l d'air expiré." : f.agg.includes("r_stups") ? "Dépistage salivaire positif au THC ; prise de sang ordonnée." : "Dépistages négatifs."],
        plainte: [`${V.prenom} était ${PP.dit}. ${X.Il(V)} rentrait ${X.travaille(V) ? "du travail" : "à la maison"}, comme tous les soirs.`, `On m'a appelé${X.P ? X.e(X.P) : ""} à minuit. À l'hôpital, on ne m'a pas laissé${X.P ? X.e(X.P) : ""} ${V.g === "f" ? "la" : "le"} voir tout de suite.`],
        temoin: [`${f.sc === "pieton" ? `${V.g === "f" ? "La piétonne" : "Le piéton"} traversait au vert` : `${V.g === "f" ? "Elle" : "Il"} roulait normalement, à droite`}. La voiture n'a pas ralenti ; on a entendu le choc depuis la terrasse.`],
        version: { nie: `${X.Il(V)} a traversé au rouge, d'un coup. Je n'ai rien pu faire.`, minimise: `Je roulais un peu vite, d'accord. Mais ${X.il(V)} était au milieu de la route, sans lumière.`, reconnait: "J'ai tué quelqu'un. Je ne sais pas comment vivre avec ça." },
        audition: [{ q: "Pourquoi n'avez-vous pas freiné plus tôt ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je ne l'ai pas vu." } }],
        prevention: `en conduisant le véhicule ${f.vehicule}, involontairement causé la mort de ${X.nf(V)}, par maladresse, imprudence, inattention ou manquement à une obligation de prudence${f.agg.length ? ", " + f.agg.map(CAT.aggPrev).join(", ") : ""}`,
        prejudice: [{ id: "affection", label: "Préjudice d'affection du proche", demande: 30000, base: 25000 }, { id: "obseques", label: "Frais d'obsèques (facture des pompes funèbres)", demande: 4800, base: 4800, piece: "facture" }],
      };
    },
  });

  // =================================================================== ABUS DE BIENS SOCIAUX
  CAT.def("abs", {
    fam: "affaires", nom: "Abus de biens sociaux", gravite: 0.5, victime: "societe", pasCI: true, occulte: true,
    textes: ["CCOM_L241-3"],
    elements: { legal: "Art. L. 241-3, 4° C. com. (gérant de SARL).", materiel: "Un usage des biens ou du crédit de la société contraire à son intérêt, à des fins personnelles.", moral: "La mauvaise foi : le gérant sait que l'usage est contraire à l'intérêt social." },
    mesures: { gav: 0.45, al: 0.5, convocation: 0.05 }, flagrance: 0,
    voies: { classement: 0.08, alternative: 0.04, copj: 0.55, ci: 0, crpc: 0.33 },
    preuves: { releve: 1, expertise: 0.8, temoin: 0.45, ecrits: 0.35, aveux: 0.35 },
    camera: 0, irr: ["perq_assentiment", "requisition", "al_quitter"],
    tirer(r) { return { sc: pk(r, ["restaurant", "btp", "immobilier", "transport"]), montant: int(r, 30, 400) * 1000, actes: int(r, 0, 3), annees: int(r, 1, 4), decouverte: pk(r, ["liquidation", "associe", "expert_comptable"]), agg: [] }; },
    qual: () => CAT.delit(60, 375000, "art. L. 241-3 C. com.", "abus de biens sociaux"),
    comp: () => ["interdiction de gérer une entreprise commerciale pendant cinq ans"],
    recit(X, f) {
      const { A, V, r } = X;
      const soc = { restaurant: "SARL Le Petit Marcadet (restauration)", btp: "SARL Bâti Nord Rénovation", immobilier: "SARL Agence Clignancourt Immobilier", transport: "SARL Express Livraison 18" }[f.sc];
      const acte = ["la réfection complète de sa résidence secondaire à Deauville, facturée à la société", "la location longue durée d'un véhicule Porsche Cayenne utilisé par son fils", "des voyages personnels à Dubaï et à Marrakech réglés avec la carte de la société", "le salaire de son épouse, embauchée sans travail effectif"][f.actes];
      return {
        titre: "les comptes de la société", lieu: `au siège de la ${soc}, ${X.rue}`, montant: f.montant,
        resume: `Gérant${X.e(A)} de la ${soc}, ${X.n(A)} aurait fait payer par la société ${acte}, pour ${eur(f.montant)} sur ${f.annees} an${f.annees > 1 ? "s" : ""}.`,
        constat: [`${f.decouverte === "liquidation" ? "Rapport du mandataire liquidateur au parquet (art. L. 811-12 C. com.)" : f.decouverte === "associe" ? "Plainte d'un associé minoritaire" : "Signalement de l'expert-comptable de la société"} ; ${f.decouverte === "liquidation" ? "la société a été placée en liquidation judiciaire" : "la société connaît de graves difficultés de trésorerie"}.`],
        plainte: [`L'analyse des comptes fait apparaître ${acte}. Total : ${eur(f.montant)}. Ces dépenses n'ont aucun lien avec l'activité.`],
        temoin: [`Je tenais la comptabilité. Il me disait de passer les factures en « frais généraux ». Je lui ai dit que ce n'était pas normal. Il m'a répondu : « C'est ma boîte. »`],
        version: { nie: "Tout était dans l'intérêt de la société. C'était de la représentation commerciale.", minimise: "J'ai mélangé un peu, c'est vrai. Je comptais régulariser par mon compte courant d'associé.", reconnait: "J'ai confondu mes affaires et celles de la société. C'était une faute." },
        audition: [{ q: `Comment justifiez-vous ${acte} ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Il y avait un intérêt pour la société." } }],
        prevention: `étant gérant${X.e(A)} de la ${soc}, fait de mauvaise foi, des biens ou du crédit de la société, un usage qu'il savait contraire à l'intérêt de celle-ci, à des fins personnelles, en l'espèce en lui faisant supporter ${acte}, pour un montant de ${eur(f.montant)}`,
        prejudice: [{ id: "materiel", label: "Sommes détournées au préjudice de la société", demande: f.montant, base: f.montant, piece: "releve" }],
      };
    },
  });

  // =================================================================== BLANCHIMENT
  CAT.def("blanchiment", {
    fam: "affaires", nom: "Blanchiment", gravite: 0.55, victime: "etat", pasCI: false,
    textes: ["CP_324-1"],
    elements: { legal: "Art. 324-1 et 324-2 CP ; présomption d'origine illicite (art. 324-1-1).", materiel: "Justifier mensongèrement l'origine de biens, ou concourir à une opération de placement, de dissimulation ou de conversion du produit d'un crime ou d'un délit.", moral: "La connaissance de l'origine illicite des fonds." },
    mesures: { gav: 0.75, al: 0.25, convocation: 0 }, flagrance: 0.1,
    voies: { classement: 0.05, alternative: 0.02, copj: 0.45, ci: 0.15, crpc: 0.33 },
    preuves: { releve: 1, telephonie: 0.5, saisie: 0.4, expertise: 0.4, aveux: 0.35 },
    camera: 0, irr: ["perq_assentiment", "requisition", "geoloc"],
    tirer(r) { const sc = pk(r, ["mule", "mule", "especes", "commerce"]); return { sc, agg: sc === "commerce" && ch(r, 0.5) ? ["habitude"] : [], montant: sc === "mule" ? int(r, 8, 60) * 1000 : int(r, 40, 400) * 1000 }; },
    qual: (f) => (f.agg.includes("habitude") ? CAT.delit(120, 750000, "art. 324-1 et 324-2 CP", "blanchiment habituel") : CAT.delit(60, 375000, "art. 324-1 CP", "blanchiment")),
    comp: () => ["confiscation des sommes saisies sur les comptes"],
    recit(X, f) {
      const { A, r } = X;
      const m = eur(f.montant);
      const S = { mule: `prêté son compte bancaire, sur lequel ${m} provenant d'escroqueries ont transité avant d'être retirés ou virés vers l'étranger`, especes: `acheté un véhicule Mercedes Classe G et des montres pour ${m} en espèces, sans revenus déclarés correspondants`, commerce: `injecté ${m} en espèces dans la caisse de son épicerie de nuit, en déclarant un chiffre d'affaires sans rapport avec l'activité réelle` }[f.sc];
      return {
        titre: f.sc === "mule" ? "le compte prêté" : f.sc === "commerce" ? "l'épicerie de nuit" : "l'argent liquide", lieu: X.lieu, montant: f.montant,
        resume: `${X.n(A)} aurait ${S}.`,
        constat: [`Signalement de la cellule de renseignement financier Tracfin ; réquisitions bancaires ; ${f.sc === "mule" ? "les virements entrants proviennent de quatorze victimes d'escroqueries au faux conseiller" : "les revenus déclarés sont incompatibles avec les dépenses constatées"}.`],
        version: { nie: "Cet argent est propre. Ce sont des économies, des prêts de la famille.", minimise: f.sc === "mule" ? "Un gars m'a demandé de recevoir des virements, il me donnait 500 euros. Je pensais que c'était légal." : "J'ai pas déclaré tout, comme tout le monde. Mais c'est pas de l'argent sale.", reconnait: "Je savais que l'argent venait de quelque chose de pas clair. J'ai fermé les yeux." },
        audition: [{ q: `D'où proviennent les ${m} ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "De ma famille." } }],
        prevention: `apporté son concours à une opération de placement, de dissimulation ou de conversion du produit d'un délit, en l'espèce en ayant ${S}`,
        prejudice: [],
      };
    },
  });

  // =================================================================== CORRUPTION
  CAT.def("corruption", {
    fam: "affaires", nom: "Corruption", gravite: 0.6, victime: "etat", pasCI: true,
    textes: ["CP_433-1", "CP_445-1"],
    elements: { legal: "Art. 433-1 CP (corruption active d'agent public) ; 445-1 et 445-2 (corruption privée).", materiel: "La proposition ou l'acceptation d'un avantage indu pour accomplir ou s'abstenir d'accomplir un acte de la fonction ; le pacte suffit, même non exécuté.", moral: "La conscience du caractère indu de l'avantage." },
    mesures: { gav: 0.6, al: 0.4, convocation: 0 }, flagrance: 0.05,
    voies: { classement: 0.06, alternative: 0.02, copj: 0.6, ci: 0, crpc: 0.32 },
    preuves: { telephonie: 0.7, releve: 0.8, ecrits: 0.6, temoin: 0.4, aveux: 0.35 },
    camera: 0, irr: ["requisition", "geoloc", "al_quitter"],
    metierAuteur: (f, A) => ({ urbanisme: "promoteur immobilier", controle: "restaurateur", achats: f.passif ? "acheteur dans la grande distribution" : "fournisseur", chantier: f.passif ? "conducteur de travaux" : "gérant d'une entreprise de sous-traitance" })[f.sc] || null,
    tirer(r) { const pub = ch(r, 0.45); return { sc: pub ? pk(r, ["urbanisme", "controle"]) : pk(r, ["achats", "chantier"]), publique: pub, passif: !pub && ch(r, 0.5), montant: int(r, 3, 60) * 1000, agg: [] }; },
    qual: (f) => (f.publique ? CAT.delit(120, 1000000, "art. 433-1 CP", "corruption active d'une personne chargée d'une mission de service public", { textes: ["CP_433-1"] }) : CAT.delit(60, 500000, f.passif ? "art. 445-2 CP" : "art. 445-1 CP", f.passif ? "corruption passive de personne n'exerçant pas une fonction publique" : "corruption active de personne n'exerçant pas une fonction publique", { textes: ["CP_445-1"] })),
    comp: () => ["interdiction d'exercer l'activité professionnelle à l'occasion de laquelle l'infraction a été commise pendant cinq ans"],
    recit(X, f) {
      const { A, V, r } = X;
      const m = eur(f.montant);
      const S = {
        urbanisme: `remis ${m} en espèces à un agent du service de l'urbanisme de la mairie pour obtenir la régularisation d'une extension construite sans permis`,
        controle: `proposé ${m} à un inspecteur de la sécurité alimentaire pour qu'il ne mentionne pas les manquements relevés dans son restaurant`,
        achats: f.passif ? `accepté, comme acheteur d'une enseigne de distribution, ${m} et des voyages d'un fournisseur pour lui attribuer un référencement` : `versé ${m} à l'acheteur d'une enseigne de distribution pour obtenir le référencement de ses produits`,
        chantier: f.passif ? `accepté, comme conducteur de travaux, ${m} d'un sous-traitant pour valider des situations de travaux surfacturées` : `versé ${m} au conducteur de travaux d'un grand groupe pour obtenir des marchés de sous-traitance`,
      }[f.sc];
      return {
        titre: f.publique ? "l'enveloppe à la mairie" : "les commissions occultes", lieu: "Paris", montant: f.montant,
        resume: `${X.n(A)} aurait ${S}.`,
        constat: [`Enquête préliminaire ouverte sur ${f.publique ? "signalement de la hiérarchie de l'agent (art. 40 CPP)" : "plainte de l'employeur, après un audit interne"} ; écoutes et réquisitions bancaires.`],
        ecrits: [`« Pour le dossier, comme convenu, je passe jeudi avec l'enveloppe. »`, `« ${pk(r, ["On dit 10 % sur chaque facture ?", "Tu me fais signe quand c'est validé.", "Pas par virement, en liquide."])} »`],
        version: { nie: "Je n'ai jamais rien donné à personne. Ces messages parlent d'autre chose.", minimise: f.passif ? "Des cadeaux, comme tout le monde dans le métier. Pas une contrepartie." : "Un geste commercial. Ça se fait partout.", reconnait: f.passif ? "J'ai accepté l'argent. Je savais que c'était interdit." : "J'ai payé. Sans ça, je n'avais aucune chance." },
        audition: [{ q: `Que contenait « l'enveloppe » dont parlent vos messages ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Des documents." } }],
        prevention: S,
        prejudice: [],
      };
    },
  });

  // =================================================================== FRAUDE FISCALE
  CAT.def("fraude_fiscale", {
    fam: "affaires", nom: "Fraude fiscale", gravite: 0.5, victime: "etat", pasCI: true,
    textes: ["CGI_1741"],
    elements: { legal: "Art. 1741 CGI ; poursuites sur plainte de l'administration ou dénonciation obligatoire au parquet (art. L. 228 LPF).", materiel: "La soustraction à l'établissement ou au paiement de l'impôt : omission de déclaration, dissimulation de sommes, organisation d'insolvabilité, manœuvres.", moral: "Le caractère volontaire de la soustraction." },
    mesures: { gav: 0.25, al: 0.7, convocation: 0.05 }, flagrance: 0,
    voies: { classement: 0.04, alternative: 0.02, copj: 0.6, ci: 0, crpc: 0.34 },
    preuves: { releve: 1, expertise: 0.7, ecrits: 0.3, aveux: 0.4 },
    camera: 0, irr: ["al_quitter", "requisition"],
    tirer(r) { return { sc: pk(r, ["restaurant", "btp", "independant"]), montant: int(r, 11, 90) * 10000, annees: int(r, 2, 3), agg: [] }; },
    qual: () => CAT.delit(60, 500000, "art. 1741 du code général des impôts", "fraude fiscale"),
    comp: () => ["privation des droits civiques pendant trois ans", "publication de la décision"],
    recit(X, f) {
      const { A } = X;
      const m = eur(f.montant);
      const S = { restaurant: "en minorant ses recettes au moyen d'un logiciel de caisse permettant d'effacer des tickets", btp: "en facturant des chantiers en espèces non déclarés et en déduisant une TVA fictive", independant: "en omettant de déclarer les revenus perçus sur un compte ouvert à Chypre" }[f.sc];
      return {
        titre: "le contrôle fiscal", lieu: X.lieu, montant: f.montant,
        resume: `Après contrôle fiscal, ${X.n(A)} se serait soustrait${X.e(A)} à l'impôt ${S} : ${m} d'impôts éludés sur ${f.annees} ans.`,
        // origine des poursuites (n° 12) : dénonciation obligatoire, plainte après avis de la commission des infractions fiscales,
        // ou aucune démarche de l'administration (signalement Tracfin seul : poursuites irrecevables pour la fraude, art. L. 228 LPF)
        constat: [f.plainte === "aucune" ? `Signalement de la cellule de renseignement financier Tracfin au procureur de la République ; enquête préliminaire, réquisitions bancaires et rapprochement avec les déclarations déposées.` : f.plainte === "ciff" ? `Plainte de la direction générale des finances publiques, déposée après avis conforme de la commission des infractions fiscales.` : `Dénonciation de la direction générale des finances publiques au procureur de la République (art. L. 228 LPF), droits éludés supérieurs à 100 000 euros majorés de 40 %.`],
        plainte: [f.plainte === "aucune" ? `Le rapprochement des relevés et des déclarations fait apparaître des droits éludés de ${m}.` : `La vérification de comptabilité fait apparaître des droits éludés de ${m}.`],
        version: { nie: "Le contrôleur s'est trompé dans ses calculs. Ma comptabilité est juste.", minimise: "Il y a eu des erreurs, mon comptable était mauvais. Je n'ai rien caché volontairement.", reconnait: "J'ai minoré mes recettes. J'avais des dettes. J'ai commencé à payer l'administration." },
        audition: [{ q: `Comment expliquez-vous l'écart de ${m} relevé par l'administration ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Mon comptable s'en occupait." } }],
        prevention: `frauduleusement soustrait à l'établissement et au paiement partiel de l'impôt, ${S}, pour un montant de droits éludés de ${m}`,
        prejudice: [],
      };
    },
  });

  // =================================================================== FAUX ET USAGE DE FAUX
  CAT.def("faux_usage", {
    fam: "affaires", nom: "Faux et usage de faux", gravite: 0.35, victime: "personne",
    textes: ["CP_441-1"],
    elements: { legal: "Art. 441-1 CP ; 441-2 pour un document délivré par une administration.", materiel: "Une altération frauduleuse de la vérité dans un écrit de nature à causer un préjudice, et son usage.", moral: "La conscience de l'altération." },
    mesures: { gav: 0.45, al: 0.5, convocation: 0.05 }, flagrance: 0.3,
    voies: { classement: 0.12, alternative: 0.2, copj: 0.4, ci: 0.06, crpc: 0.22 },
    preuves: { saisie: 0.6, expertise: 0.6, temoin: 0.3, aveux: 0.5, plainte: 1 },
    camera: 0, irr: ["al_quitter"],
    tirer(r) { const sc = pk(r, ["bulletins", "bulletins", "attestation", "permis", "diplome"]); return { sc, admin: sc === "permis", agg: [] }; },
    qual: (f) => (f.admin ? CAT.delit(60, 75000, "art. 441-2 CP", "faux dans un document administratif et usage") : CAT.delit(36, 45000, "art. 441-1 CP", "faux et usage de faux")),
    recit(X, f) {
      const { A, V, r } = X;
      const S = { bulletins: "trois faux bulletins de salaire et un faux avis d'imposition, remis à une agence pour obtenir la location d'un appartement", attestation: "une fausse attestation d'emploi, remise à une banque pour obtenir un crédit", permis: "un faux permis de conduire roumain, présenté lors d'un contrôle routier", diplome: "un faux diplôme d'infirmier, produit pour être embauché dans une clinique" }[f.sc];
      return {
        titre: f.sc === "bulletins" ? "les faux bulletins de salaire" : f.sc === "permis" ? "le faux permis" : f.sc === "diplome" ? "le faux diplôme" : "la fausse attestation", lieu: X.lieu,
        resume: `${X.n(A)} aurait fabriqué ou utilisé ${S}.`,
        constat: [f.sc === "permis" ? "Le document présenté comporte des anomalies d'impression (absence d'hologramme, police de caractères non conforme) ; analyse par le service des fraudes documentaires." : `Signalement de ${f.sc === "bulletins" ? "l'agence immobilière" : f.sc === "diplome" ? "la clinique" : "la banque"} : l'employeur mentionné n'a jamais compté ${X.n(A)} parmi ses salariés.`],
        plainte: [f.sc === "bulletins" ? `Nous avons signé le bail sur la foi de ces bulletins. Les loyers ne sont plus payés depuis quatre mois.` : `Les documents produits sont faux. Nous déposons plainte.`],
        version: { nie: "Je ne savais pas que c'était faux. On me l'a fourni.", minimise: "J'ai arrangé un peu les chiffres. Tout le monde fait ça pour avoir un appartement.", reconnait: "J'ai fait les faux moi-même, sur l'ordinateur. Je regrette." },
        audition: [{ q: "Qui a fabriqué ces documents ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Quelqu'un que je ne connais pas." } }],
        prevention: `commis un faux en fabriquant ${S.split(",")[0]}, et fait usage de ce faux`,
        prejudice: f.sc === "bulletins" ? [{ id: "materiel", label: "Loyers impayés", demande: int(r, 3, 6) * 900, base: null, piece: "releve" }] : [{ id: "moral", label: "Préjudice moral", demande: 800, base: 300 }],
      };
    },
  });

  // =================================================================== ACCIDENT DU TRAVAIL (n° 12 : personne morale, délégation de pouvoirs)
  CAT.def("accident_travail", {
    fam: "affaires", nom: "Blessures involontaires dans le cadre du travail", gravite: 0.45, victime: "personne", pasCI: true, genres: ["copj"],
    textes: ["CP_222-19", "CP_121-3", "CP_121-2"],
    elements: { legal: "Art. 222-19 CP, dans les conditions de l'art. 121-3 ; responsabilité de la personne morale employeur (art. 121-2).", materiel: "Un manquement à une obligation de prudence ou de sécurité imposée par la loi ou le règlement (protection contre les chutes, carter d'une machine, blindage d'une tranchée), en lien certain avec une incapacité de plus de trois mois.", moral: "Aucune intention : une faute d'imprudence ; le dirigeant, auteur indirect, ne répond que d'une violation manifestement délibérée ou d'une faute caractérisée (art. 121-3, al. 4), sauf délégation de pouvoirs valable." },
    mesures: { gav: 0, al: 0.85, convocation: 0.15 }, flagrance: 0,
    voies: { classement: 0.02, alternative: 0.02, copj: 0.8, ci: 0, crpc: 0.16 },
    preuves: { plainte: 1, certificat: 1, temoin: 0.7, expertise: 1, ecrits: 0.5, aveux: 0.3 },
    camera: 0, irr: ["al_quitter"],
    metierAuteur: (f, A) => (A.g === "f" ? "présidente de société" : "président de société"),
    metierVictime: (f, V) => ({ chute: V.g === "f" ? "ouvrière du bâtiment" : "ouvrier du bâtiment", machine: V.g === "f" ? "opératrice sur presse" : "opérateur sur presse", tranchee: V.g === "f" ? "canalisatrice" : "canalisateur" })[f.sc],
    tirer(r) {
      const sc = pk(r, ["chute", "chute", "machine", "tranchee"]);
      return { sc, soc: { chute: pk(r, ["SAS Bâti Nord Rénovation", "SAS Façades Clignancourt"]), machine: pk(r, ["SAS Imprimerie Ordener", "SAS Découpe Industrielle Marcadet"]), tranchee: pk(r, ["SAS Réseaux Paris Nord TP", "SAS Canalisations Ney"]) }[sc], itt: int(r, 95, 240), violation: ch(r, 0.45), agg: [] };
    },
    qual: (f) => (f.violation
      ? CAT.delit(36, 45000, "art. 222-19 CP", "blessures involontaires ayant entraîné une incapacité totale de travail de plus de trois mois, par violation manifestement délibérée d'une obligation particulière de sécurité", { textes: ["CP_222-19", "CP_121-3"] })
      : CAT.delit(24, 30000, "art. 222-19 CP", "blessures involontaires ayant entraîné une incapacité totale de travail de plus de trois mois", { textes: ["CP_222-19", "CP_121-3"] })),
    comp: () => ["affichage de la décision sur les lieux de travail"],
    recit(X, f) {
      const { V, r } = X;
      const S = {
        chute: { titre: "la chute de l'échafaudage", lieu: `sur le chantier de rénovation d'un immeuble, ${X.rue}`, quoi: `est tombé${X.e(V)} d'un échafaudage de six mètres dont le garde-corps n'avait pas été posé`, manq: "en laissant travailler en hauteur sans garde-corps ni protection collective", les: ["fracture du bassin", "tassement de la vertèbre L1", "traumatisme crânien avec perte de connaissance initiale"], mat: "les garde-corps de l'échafaudage côté cour", att: "que les garde-corps arriveraient l'après-midi" },
        machine: { titre: "la presse sans carter", lieu: `dans l'atelier de la société, ${X.rue}`, quoi: "a eu la main droite happée par une presse dont le carter de protection avait été démonté pour accélérer la production", manq: "en laissant fonctionner une presse privée de son carter de protection", les: ["amputation traumatique de deux doigts de la main droite", "fractures ouvertes des métacarpes"], mat: "le carter de la presse n° 3", att: "que le carter serait remonté le soir" },
        tranchee: { titre: "la tranchée effondrée", lieu: `${X.rue}, sur un chantier de raccordement`, quoi: `a été enseveli${X.e(V)} dans une tranchée de deux mètres de profondeur qui n'avait pas été blindée`, manq: "en faisant travailler dans une tranchée de plus de 1,30 mètre non blindée", les: ["fractures costales multiples", "écrasement du membre inférieur gauche"], mat: "les panneaux de blindage de la tranchée", att: "que les panneaux de blindage arriveraient l'après-midi" },
      }[f.sc];
      const salarie = `${X.n(V)}, salarié${X.e(V)} de la ${f.soc}`;
      return {
        titre: S.titre, lieu: S.lieu, montant: 0, lesions: S.les,
        resume: `${salarie}, ${S.quoi} ; incapacité totale de travail de ${f.itt} jours. L'inspection du travail relève ${f.violation ? "une violation délibérée des règles de sécurité, signalée et connue" : "l'absence de la protection prévue par la réglementation"}.`,
        constat: ["Accident du travail déclaré par l'employeur ; enquête de l'inspection du travail, puis enquête préliminaire du parquet."],
        plainte: [`Ce matin-là, on nous a dit de commencer quand même, ${S.att}.`, `Je suis resté${X.e(V)} ${X.nombre(Math.round(f.itt / 30))} mois sans pouvoir travailler. Je ne sais pas si je pourrai reprendre.`],
        temoin: [`Il manquait ${S.mat} depuis deux semaines. Le chef d'équipe les avait réclamés plusieurs fois.`, "On nous disait de faire avec, qu'on avait du retard."],
        ecrits: [`« Il manque toujours ${S.mat}. On fait comment ? »`, "« Faites avec ce que vous avez, on a des pénalités de retard. »"],
        version: { nie: "La sécurité sur le terrain, ce n'est pas moi. Je ne suis pas sur les chantiers tous les jours.", minimise: "Le matériel était commandé. Il y a eu un retard de livraison, c'est tout.", reconnait: "On a voulu tenir les délais. On n'aurait pas dû les faire travailler sans protection." },
        audition: [{ q: `Qui était chargé de la sécurité ${f.sc === "machine" ? "dans l'atelier" : "sur ce chantier"} ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Le responsable sur place." } }],
        prevention: `par manquement à une obligation de prudence ou de sécurité imposée par la loi ou le règlement, en l'espèce ${S.manq}, involontairement causé à ${X.nf(V)}, salarié${X.e(V)} de la ${f.soc}, une incapacité totale de travail de plus de trois mois`,
        prejudice: [{ id: "corporel", label: "Préjudices corporels (déficit fonctionnel, souffrances endurées)", demande: 48000, base: 32000 }, { id: "salaire", label: "Perte de revenus", demande: int(r, 4, 9) * 1000, base: null, piece: "attestation_salaire" }],
        qA: [{ q: "Qui commandait le matériel de sécurité ?", a: ["Les demandes partaient du terrain. Je n'entrais pas dans ce détail."] }],
      };
    },
  });

  // =================================================================== ACCÈS FRAUDULEUX À UN SYSTÈME INFORMATIQUE
  CAT.def("acces_frauduleux", {
    fam: "numerique", nom: "Accès frauduleux à un système informatique", gravite: 0.4, victime: "personne", pasCI: true,
    textes: ["CP_323-1"],
    elements: { legal: "Art. 323-1 CP.", materiel: "L'accès ou le maintien frauduleux dans un système de traitement automatisé de données ; la suppression ou la modification de données aggrave.", moral: "La conscience d'être sans droit." },
    mesures: { gav: 0.4, al: 0.55, convocation: 0.05 }, flagrance: 0,
    voies: { classement: 0.12, alternative: 0.18, copj: 0.45, ci: 0, crpc: 0.25 },
    preuves: { plainte: 1, telephonie: 0.8, expertise: 0.8, aveux: 0.4 },
    camera: 0, irr: ["requisition", "al_quitter", "perq_assentiment"],
    tirer(r) { return { sc: pk(r, ["ex_salarie", "conjoint", "compte"]), modif: ch(r, 0.45), agg: [] }; },
    qual: (f) => (f.modif ? CAT.delit(60, 150000, "art. 323-1 CP", "accès frauduleux à un système de traitement automatisé de données, avec suppression ou modification de données") : CAT.delit(36, 100000, "art. 323-1 CP", "accès frauduleux à un système de traitement automatisé de données")),
    recit(X, f) {
      const { A, V } = X;
      const S = { ex_salarie: `s'être connecté, après son licenciement, au logiciel de gestion de la clientèle de son ancien employeur avec des identifiants conservés${f.modif ? ", et y avoir supprimé un fichier de 4 000 clients" : ""}`, conjoint: `s'être connecté${X.e(A)} à la messagerie et au compte iCloud de ${X.nf(V)}, ${V.g === "f" ? "son ancienne compagne" : "son ancien compagnon"}, dont ${X.il(A)} avait deviné le mot de passe${f.modif ? ", et y avoir supprimé des messages et modifié le mot de passe" : ""}`, compte: `s'être introduit dans le compte Instagram de ${X.nf(V)}${f.modif ? ", et en avoir changé les identifiants, supprimant ses publications" : ""}` }[f.sc];
      return {
        titre: f.sc === "ex_salarie" ? "l'ex-salarié dans le logiciel" : f.sc === "conjoint" ? "la messagerie de l'ex" : "le compte piraté", lieu: "à distance",
        resume: `${X.n(A)} est soupçonné${X.e(A)} de ${S}.`,
        constat: [`Plainte de ${X.nf(V)} ; journaux de connexion fournis par l'hébergeur ; réquisition à l'opérateur pour l'adresse IP : abonnement au nom de ${X.n(A)}.`],
        plainte: [`On m'a alerté${X.e(V)} de connexions inhabituelles, la nuit, depuis ${X.lieu}. ${f.modif ? "Des données ont disparu." : "Rien n'a disparu, mais tout a été lu."}`],
        version: { nie: "Ce n'est pas moi. Quelqu'un a utilisé ma box.", minimise: "Je voulais juste vérifier quelque chose. Je n'ai rien touché.", reconnait: "Je me suis connecté. Je n'aurais pas dû." },
        audition: [{ q: "L'adresse IP de connexion est celle de votre box. Était-ce vous ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Peut-être une fois." } }],
        prevention: S.replace(/^s'être/, "accédé frauduleusement à un système de traitement automatisé de données, en l'espèce en s'étant"),
        prejudice: [{ id: "moral", label: "Préjudice moral", demande: 1500, base: 800 }].concat(f.modif && f.sc === "ex_salarie" ? [{ id: "materiel", label: "Coût de restauration des données (facture du prestataire)", demande: 4200, base: 4200, piece: "facture" }] : []),
      };
    },
  });

  // =================================================================== USURPATION D'IDENTITÉ
  CAT.def("usurpation_identite", {
    fam: "numerique", nom: "Usurpation d'identité", gravite: 0.3, victime: "personne", pasCI: true,
    textes: ["CP_226-4-1"],
    elements: { legal: "Art. 226-4-1 CP.", materiel: "Usurper l'identité d'un tiers, ou utiliser des données permettant de l'identifier.", moral: "Le but de troubler sa tranquillité ou de porter atteinte à son honneur ou à sa considération." },
    mesures: { gav: 0.3, al: 0.65, convocation: 0.05 }, flagrance: 0,
    voies: { classement: 0.15, alternative: 0.25, copj: 0.4, ci: 0, crpc: 0.2 },
    preuves: { plainte: 1, telephonie: 0.7, ecrits: 0.7, aveux: 0.4 },
    camera: 0, irr: ["requisition", "al_quitter"],
    tirer(r) { const cj = ch(r, 0.4); return { sc: cj ? "faux_profil" : pk(r, ["abonnements", "messages"]), agg: cj ? ["ex_conjoint"] : [] }; },
    qual: (f) => (f.agg.length ? CAT.delit(24, 30000, "art. 226-4-1 CP", "usurpation de l'identité d'un tiers, par son ancien conjoint ou concubin") : CAT.delit(12, 15000, "art. 226-4-1 CP", "usurpation de l'identité d'un tiers")),
    recit(X, f) {
      const { A, V } = X;
      const S = { faux_profil: `créé, au nom et avec les photos de ${X.nf(V)}, un profil sur un site de rencontres, annonçant ses « disponibilités » et donnant son numéro de téléphone`, abonnements: `souscrit au nom de ${X.nf(V)} des abonnements téléphoniques et un crédit à la consommation, avec la copie de sa pièce d'identité`, messages: `envoyé, depuis une adresse électronique au nom de ${X.nf(V)}, des messages injurieux à son employeur et à ses collègues` }[f.sc];
      return {
        titre: f.sc === "faux_profil" ? "le faux profil" : f.sc === "abonnements" ? "les abonnements au nom d'un autre" : "les faux courriels", lieu: "sur internet",
        resume: `${X.n(A)} aurait ${S}.`,
        constat: [`Plainte de ${X.nf(V)} ; réquisitions aux plateformes et aux opérateurs.`],
        plainte: [f.sc === "faux_profil" ? `Des inconnus m'appellent la nuit. Ils parlent d'une annonce. Mon ex est ${X.g(X.A).w("le seul", "la seule")} à avoir ces photos.` : f.sc === "abonnements" ? "Je reçois des relances pour des contrats que je n'ai jamais signés." : `Mon patron m'a convoqué${X.e(X.V)} pour des mails que je n'ai jamais écrits.`],
        ecrits: [f.sc === "faux_profil" ? "Annonce : « Disponible ce soir, appelle-moi » — suivie du numéro de la victime." : "« Objet : vous êtes tous des incapables »"],
        version: { nie: "Ce n'est pas moi. N'importe qui a pu le faire.", minimise: "C'était une blague. Je l'ai supprimé au bout de deux jours.", reconnait: "Je l'ai fait par vengeance. Je regrette." },
        audition: [{ q: "Le compte a été créé depuis votre adresse IP. Que répondez-vous ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je ne sais pas." } }],
        prevention: `usurpé l'identité de ${X.nf(V)}, ou fait usage de données permettant de l'identifier, en vue de troubler sa tranquillité ou de porter atteinte à son honneur, en l'espèce en ayant ${S}`,
        prejudice: [{ id: "moral", label: "Préjudice moral", demande: 1500, base: 900 }],
      };
    },
  });
})();
