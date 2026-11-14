// Affaire d'essai pour les tests de la saisie des articles (tcite) : une partie civile et sa plainte au parquet, dont les
// points citent des articles (113-2-1 CP, 382 CPP). Reprise de l'ancienne affaire écrite n° 11, retirée du jeu : ce n'est
// plus qu'un banc d'essai du mécanisme générique des citations dans les actes. Chargée par les tests, jamais par le jeu.
module.exports = function (CR) {
  if (CR.CASES.test_cite) return;
  const PEN = CR.PEN;
  CR.defineCase({
    id: "test_cite", camp: "pc", domaine: "pc", domaineLib: "dpg", title: "Essai — plainte au parquet",
    client: { prenom: "Olivier", nom: "Garnier", g: "m", age: 48, metier: "directeur financier", trust: 55 },
    actors: { parquet: "pq_delahaye" },
    proc: { stade: "enquete", nature: "delit", faits: -2, infractions: ["CP_313-2"] },
    facts: {
      K11_virement: { label: "140 000 € virés lundi vers un compte en Lituanie", key: true },
      K11_iban: { label: "L'IBAN lituanien du compte bénéficiaire", key: true, why: "Sans lui, le parquet ne peut rien demander aux autorités lituaniennes." },
      K11_mail: { label: "Le faux courriel du PDG, depuis « rhone-usinage.co »", key: true },
      K11_siege: { label: "Le siège de la société est à Villeurbanne", key: true, why: "Une personne morale dont le siège est en France : l'escroquerie par courriel est réputée commise en France (art. 113-2-1), et le lieu de l'infraction fixe la compétence (art. 382)." },
      K11_main_courante: { label: "Ils ont déposé une « main courante »", key: true, why: "Une main courante n'est pas une plainte : elle ne déclenche aucune enquête." },
      K11_avocat: { label: "Un faux « avocat d'affaires » a appelé pour confirmer" },
      K11_banque: { label: "La banque a lancé un rappel des fonds" },
    },
    tpls: {
      plainte_parquet: (api) => ({
        title: "Plainte pour escroquerie au faux président", kind: "courrier", time: 70, dirLabel: "Envoyée par courriel et lettre recommandée",
        slots: {
          dest: CR.choiceSlot("Destinataire", [
            { t: "Monsieur le procureur de la République près le tribunal judiciaire de Lyon", ok: true, v: "lyon" },
            { t: "Madame la procureure de la République près le tribunal judiciaire de Paris", ok: false, v: "paris", defect: "dest:paris" },
            { t: "Monsieur le doyen des juges d'instruction du tribunal judiciaire de Lyon (plainte avec constitution de partie civile)", ok: false, v: "doyen", defect: "dest:doyen" },
          ]),
          qualif: CR.choiceSlot("Qualification", [
            { t: "Escroquerie commise en bande organisée (art. 313-1 et 313-2 du code pénal).", ok: true, v: "bo" },
            { t: "Escroquerie (art. 313-1 du code pénal).", ok: true, v: "simple" },
            { t: "Abus de confiance (art. 314-1 du code pénal).", ok: false, v: "abus", defect: "qualif:abus" },
          ]),
        },
        checks: [{ id: "points", label: "Le contenu", heading: "La plaignante expose :", options: [
          { id: "competence", t: "L'escroquerie, réalisée par un réseau de communication électronique au préjudice d'une personne morale dont le siège est en France, est réputée commise sur le territoire de la République (art. 113-2-1 du code pénal).", ok: null, needs: "CP_113-2-1" },
          { id: "lieu", t: "Le lieu de l'infraction est au siège de la société, à Villeurbanne, où la tromperie a déterminé la remise des fonds : le tribunal judiciaire de Lyon est compétent (art. 382 du code de procédure pénale).", ok: null, needs: ["CPP_382", "K11_siege"] },
          { id: "iban", t: "Les fonds ont été virés sur le compte LT32 7300 0101 9876 5432 : la plaignante demande que soient sollicitées en urgence, auprès des autorités lituaniennes, des mesures conservatoires sur ce compte.", ok: null, needs: "K11_iban" },
          { id: "entetes", t: "Les en-têtes du courriel établissent un domaine enregistré trois jours avant les faits, depuis l'étranger.", ok: null, needs: "K11_domaine" },
          { id: "pieces", t: "Sont joints : le courriel, l'ordre de virement, le relevé et l'extrait Kbis.", ok: null, needs: ["K11_ordre_doc", "K11_kbis"] },
        ] }],
        body: [[{ s: "dest" }], ["La société Rhône Usinage SAS, représentée par son président, porte plainte contre X des chefs suivants : ", { s: "qualif" }]],
      }),
    },
    penal: { no: ["nullite", "requete", "actes", "copie", "constitution", "prep"] },
    flow: { tasks: PEN.tasks },
  });
  CR.defineCase({ id: "test_cite_autre", camp: "defense", domaine: "ci", domaineLib: "pp_jugement", title: "Essai — un autre dossier", client: { prenom: "Inès", nom: "Moreau", g: "f", age: 30, trust: 50 }, actors: {}, proc: { stade: "enquete", nature: "delit", faits: -2, infractions: [] }, penal: {}, flow: { tasks: PEN.tasks } });
};
