/* Affaire 11 — Le faux président.
   Partie civile. Une PME lyonnaise vire 140 000 € en Lituanie sur un faux courriel de son PDG.
   Compétence de la justice française (art. 113-2-1 CP), compétence territoriale (art. 382 CPP), plainte rapide au bon parquet
   pour que les fonds soient gelés ; une main courante n'est pas une plainte. */
(function () {
  const CR = window.CR;
  const R = CR.R;
  const PEN = CR.PEN;
  const GARNIER = { prenom: "Olivier", nom: "Garnier", g: "m", age: 48, metier: "directeur financier de Rhône Usinage SAS", tel: "04 78 26 51 90", trust: 55, look: { skin: 0, hair: "receding", hc: "gray", glasses: 1, outfit: "suit" } };
  const DEF = "a11_president";
  const MONTANT = 140000;

  CR.defineCase({
    id: DEF, camp: "pc", domaine: "pc", domaineLib: "dpg",
    title: "Rhône Usinage — le faux président",
    arrive: { day: 79, min: 9 * 60 + 5 },
    client: GARNIER, caller: "Olivier Garnier, Rhône Usinage", leadPatience: 1, urgence: true,
    voicemail: "Maître, Olivier Garnier, directeur financier de Rhône Usinage, à Villeurbanne. Nous avons viré 140 000 euros à un escroc lundi. Notre assureur nous a donné votre nom. C'est urgent, rappelez-moi.",
    profile: { wealth: 4, sens: 0.4, urgency: 1, temper: "presse" },
    honoraires: { forfait: 4000, heures: 20, types: ["forfait", "temps"], resultat: "récupération des fonds" },
    mission: "Assistance de la société Rhône Usinage SAS, victime d'une escroquerie au faux président : plainte, demandes de mesures conservatoires, suivi de l'enquête et constitution de partie civile.",
    actors: { parquet: "pq_delahaye" },
    proc: { stade: "enquete", nature: "delit", faits: -2, infractions: ["CP_313-2"] },
    init(api, cs) { cs.vars.virementDay = cs.vars.base - 2; },
    vars: (s, cs) => ({ virementDow: CR.fmtDate(cs.vars.virementDay, "dow") }),
    facts: {
      K11_virement: { label: "140 000 € virés lundi vers un compte en Lituanie", key: true },
      K11_iban: { label: "L'IBAN lituanien du compte bénéficiaire", key: true, why: "Sans lui, le parquet ne peut rien demander aux autorités lituaniennes." },
      K11_mail: { label: "Le faux courriel du PDG, depuis « rhone-usinage.co »", key: true },
      K11_siege: { label: "Le siège de la société est à Villeurbanne", key: true, why: "Une personne morale dont le siège est en France : l'escroquerie par courriel est réputée commise en France (art. 113-2-1), et le lieu de l'infraction fixe la compétence (art. 382)." },
      K11_main_courante: { label: "Ils ont déposé une « main courante »", key: true, why: "Une main courante n'est pas une plainte : elle ne déclenche aucune enquête." },
      K11_avocat: { label: "Un faux « avocat d'affaires » a appelé pour confirmer" },
      K11_banque: { label: "La banque a lancé un rappel des fonds" },
    },
    calls: {
      intake: {
        opening: ["Maître, merci de rappeler. Lundi, j'ai reçu un courriel de notre président, Philippe Morand. Une acquisition confidentielle, un virement urgent. J'ai viré."],
        topics: [
          { id: "p_quoi", q: "Combien, quand et vers quel compte ?", a: [{ t: "{virementDow}, à 16 heures : 140 000 euros, vers un compte en Lituanie.", f: "K11_virement" }, { t: "J'ai l'IBAN sous les yeux : LT32 7300 0101 9876 5432, une banque de Vilnius.", f: "K11_iban" }], cost: 3, tag: "good" },
          { id: "p_mail", q: "D'où venait le courriel ?", a: [{ t: "De p.morand@rhone-usinage.co. Notre domaine, c'est rhone-usinage.fr. Je n'ai pas vu la différence.", f: "K11_mail" }, { t: "Un homme a appelé ensuite, « Maître Lefèvre, avocat d'affaires », pour confirmer.", f: "K11_avocat" }], cost: 3 },
          { id: "p_siege", q: "Où est le siège de la société ?", a: [{ t: "À Villeurbanne, rue Léon-Blum. Nous avons 85 salariés. J'ai fait le virement depuis le siège.", f: "K11_siege" }], cost: 2, tag: "good" },
          { id: "p_police", q: "Qu'avez-vous déjà fait ?", a: [{ t: "Hier, au commissariat de Villeurbanne, ils ont pris une main courante.", f: "K11_main_courante" }, { t: "Et la banque a lancé un rappel des fonds, sans réponse pour l'instant.", f: "K11_banque" }], cost: 2, tag: "good" },
          { id: "p_morand", q: "Le vrai président était-il joignable ?", a: ["Il était à Shanghai, sur un salon. C'est ce que disait le courriel, d'ailleurs. Ils savaient tout."], cost: 1 },
          { id: "p_faute", q: "Vous n'avez donc rien vérifié ?", a: ["Un silence. « Je sais. Mon président me le dit assez. »"], cost: 1, tag: "bad", fx: { trust: -6 } },
        ],
        start: ["p_quoi", "p_mail", "p_siege", "p_police", "p_morand", "p_faute"],
        patience: 70, close: "On fait quoi, maintenant ?",
      },
    },
    advice: [
      { id: "p_conserver", t: "Ne supprimez rien : gardez le courriel avec ses en-têtes complets, l'ordre de virement et les relevés." },
      { id: "p_banque", t: "Relancez la banque aujourd'hui : rappel des fonds, et signalement à la banque bénéficiaire." },
      { id: "p_attendre", t: "La main courante suffit, attendons que la police vous rappelle." },
      { id: "p_rembourse", t: "Vous serez remboursés, ces fonds se retrouvent toujours." },
    ],
    docs: {
      courriel: () => ({ title: "Le courriel et ses en-têtes", kind: "sms", entete: ["De : Philippe Morand <p.morand@rhone-usinage.co>", "À : Olivier Garnier"], paras: [
        ["« Olivier, je suis à Shanghai. Opération d'acquisition strictement confidentielle : virement de 140 000 € aujourd'hui avant 17 h, IBAN ci-dessous. Maître Lefèvre vous appellera. N'en parlez à personne. Philippe »"],
        [{ t: "En-têtes : domaine rhone-usinage.co enregistré trois jours plus tôt ; envoi depuis un serveur situé hors de l'Union européenne.", f: "K11_domaine" }],
      ] }),
      ordre: (x) => ({ title: "Ordre de virement et relevé", kind: "courrier", entete: ["Banque Rhodanienne · agence de Villeurbanne"], paras: [[{ t: `Ordre de virement SEPA du ${CR.fmtDate(x.cs.vars.virementDay, "long")}, 16 h 02 : 140 000,00 € au profit de « MRD Holding UAB », IBAN LT32 7300 0101 9876 5432.`, f: "K11_ordre_doc" }]] }),
      kbis: () => ({ title: "Extrait Kbis", kind: "courrier", entete: ["Greffe du tribunal de commerce de Lyon"], paras: [[{ t: "Rhône Usinage SAS, siège social : rue Léon-Blum, 69100 Villeurbanne. Président : M. Philippe Morand.", f: "K11_kbis" }]] }),
      main_courante: () => ({ title: "Récépissé de main courante", kind: "pv", entete: ["Commissariat de Villeurbanne"], paras: [[{ t: "Déclaration de M. Olivier Garnier enregistrée en main courante. La présente déclaration ne constitue pas une plainte.", f: "K11_main_courante" }]] }),
    },
    docTitles: { courriel: "Courriel et en-têtes", ordre: "Ordre de virement", kbis: "Extrait Kbis", main_courante: "Récépissé de main courante" },
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
    tasks(api, T) {
      const { s, cs } = api;
      if (!cs.flags.pieces) T({ id: "pieces", label: "Rassembler les pièces de la société", sub: "Courriel avec en-têtes complets, ordre de virement, Kbis.", kind: "admin", time: 25, urgent: true, run: () => {
        CR.spend(s, 25, "admin"); cs.flags.pieces = s.day;
        for (const k of ["courriel", "ordre", "kbis", "main_courante"]) if (!CR.hasDoc(cs, k)) api.doc(k, api.def.docTitles[k]);
        CR.toast(s, "Quatre pièces reçues par courriel sécurisé.", "info"); return null; } });
      if (!cs.vars.banqueRelancee) T({ id: "banque", label: "Appeler la banque : rappel et signalement", sub: "Banque Rhodanienne, service fraude.", kind: "call", time: 15, urgent: true, run: () => { CR.spend(s, 15, "call"); cs.vars.banqueRelancee = s.day; api.tl("Banque relancée : rappel des fonds et signalement à la banque bénéficiaire."); CR.toast(s, "La banque confirme le rappel et signale la fraude à la banque lituanienne.", "info"); return null; } });
      const ok = cs.vars.plainteEffective != null;
      if (!ok && !cs.vars.plainteEnCours && !CR.drafted(cs, "plainte_parquet")) T({ id: "plainte", label: "Rédiger la plainte", sub: "Au bon destinataire, avec ce qu'il faut pour agir sur le compte.", kind: "draft", time: 70, urgent: true, run: () => ({ scene: "draft", tpl: "plainte_parquet" }) });
    },
    on: {
      filed_plainte_parquet(api, { res }) {
        const { s, cs } = api;
        const dest = res.filled.dest;
        cs.vars.plainte = { day: s.day, dest, points: res.picks.points || [], qualif: res.filled.qualif };
        CR.PROC.event(api, `Plainte adressée ${dest === "lyon" ? "au procureur de Lyon" : dest === "paris" ? "au procureur de Paris" : "au doyen des juges d'instruction de Lyon"}.`);
        if (dest === "doyen") {
          cs.vars.plainteEnCours = true;
          api.schedule(R.int(s, 8, 12), "_doyenIrrecevable");
          return;
        }
        if (dest === "paris") {
          cs.vars.plainteEnCours = true;
          api.schedule(R.int(s, 12, 18), "_dessaisi");
          return;
        }
        api.run("_effective");
      },
      _doyenIrrecevable(api) {
        const { s, cs } = api;
        cs.vars.plainteEnCours = false;
        cs.drafted.plainte_parquet = [];
        CR.erreur(s, cs, { id: "pcpc_directe", texte: "Plainte avec constitution de partie civile adressée directement au doyen, sans plainte préalable au procureur.", sanction: "Irrecevable (art. 85).", regul: "Porter plainte devant le procureur de la République." });
        api.mail({ from: "Cabinet du doyen des juges d'instruction de Lyon", subject: "Plainte avec constitution de partie civile — irrecevabilité", kind: "greffe", body: [["En matière délictuelle, la plainte avec constitution de partie civile n'est recevable qu'après une plainte préalable au procureur de la République restée sans suite pendant trois mois (art. 85)."]] });
      },
      _dessaisi(api) {
        const { s, cs } = api;
        CR.erreur(s, cs, { id: "parquet_paris", texte: "Plainte adressée au parquet de Paris, sans lien avec les faits.", sanction: "Le parquet de Paris se dessaisit au profit de Lyon : deux semaines perdues.", regul: "Saisir le parquet du lieu de l'infraction (art. 382 et 43)." });
        api.mail({ from: "Parquet de Paris", subject: "Transmission de votre plainte", kind: "greffe", body: [["Les faits ayant été commis au préjudice d'une société dont le siège est à Villeurbanne, où les fonds ont été remis, votre plainte est transmise au parquet de Lyon, territorialement compétent."]] });
        api.run("_effective");
      },
      _effective(api) {
        const { s, cs } = api;
        cs.vars.plainteEnCours = false;
        cs.vars.plainteEffective = s.day;
        const pts = cs.vars.plainte.points;
        const delai = s.day - cs.vars.virementDay;
        let gel = 0;
        if (pts.includes("iban") && cs.vars.banqueRelancee != null && cs.vars.banqueRelancee <= cs.vars.base + 1) gel = delai <= 3 ? 61400 : delai <= 6 ? 18000 : 0;
        cs.vars.gel = gel;
        CR.PROC.stade(api, "enquete", "Enquête ouverte par le parquet de Lyon ; demande d'entraide aux autorités lituaniennes.");
        api.mail({ from: "Parquet de Lyon", subject: "Votre plainte — Rhône Usinage", kind: "greffe", body: [["Nous accusons réception de votre plainte. Une enquête est confiée à la direction interdépartementale de la police judiciaire de Lyon."], [pts.includes("iban") ? "Une demande d'entraide urgente a été adressée aux autorités lituaniennes pour le gel du compte bénéficiaire." : "Faute de précision sur le compte bénéficiaire, aucune mesure conservatoire n'a pu être sollicitée à ce stade."], [cs.vars.plainte.qualif === "bo" ? "Compte tenu de la bande organisée et de la dimension internationale, le parquet envisage de saisir la juridiction interrégionale spécialisée de Lyon (art. 706-75)." : ""]] });
        api.schedule(R.int(s, 18, 25), "_gel");
      },
      _gel(api) {
        const { s, cs } = api;
        const g = cs.vars.gel || 0;
        api.mail({ from: "Parquet de Lyon", subject: "Résultat de la demande d'entraide", kind: "greffe", important: true, body: [[g ? `Les autorités lituaniennes ont gelé le compte bénéficiaire : ${CR.money(g)} y demeuraient. Le reste avait été transféré vers des comptes à Hong Kong dans les quarante-huit heures.` : "Les autorités lituaniennes indiquent que le compte bénéficiaire a été vidé dans les quarante-huit heures suivant le virement, vers des comptes à Hong Kong."]] });
        api.schedule(R.int(s, 40, 60), "_issue");
      },
      _issue(api) {
        const { s, cs } = api;
        const g = cs.vars.gel || 0;
        if (g) {
          api.mail({ from: "Juridiction interrégionale spécialisée de Lyon", subject: "Restitution des fonds gelés", kind: "greffe", important: true, body: [[`Une information a été ouverte contre X. Le juge d'instruction ordonne la restitution à Rhône Usinage SAS, partie civile, des ${CR.money(g)} rapatriés de Lituanie.`], ["Les investigations se poursuivent sur les auteurs."]] });
          CR.closeCase(s, cs, { type: "indemnise", detail: `${CR.money(g)} récupérés sur ${CR.money(MONTANT)}`, indemnisation: g });
        } else {
          api.mail({ from: "Parquet de Lyon", subject: "Point sur l'enquête", kind: "greffe", body: [["L'enquête se poursuit contre X. Les fonds n'ont pas pu être appréhendés."]] });
          CR.closeCase(s, cs, { type: "done", detail: "fonds non récupérés, enquête contre X" });
        }
      },
    },
    debrief(api, o) {
      const { cs } = api;
      const items = [{ kind: "rule", text: "L'escroquerie réalisée par un réseau de communication électronique au préjudice d'une personne morale dont le siège est en France est réputée commise en France (art. 113-2-1) ; le tribunal compétent est notamment celui du lieu de l'infraction (art. 382)." }];
      if (cs.vars.plainteEffective != null) items.push({ kind: "info", text: `Plainte effective ${cs.vars.plainteEffective - cs.vars.virementDay} jours après le virement. Dans ces escroqueries, les fonds quittent le premier compte en quarante-huit heures.` });
      if (cs.advice.includes("p_attendre")) items.push({ kind: "bad", text: "Vous avez laissé croire que la main courante suffisait : elle n'est qu'une déclaration, pas une plainte." });
      if (cs.vars.plainte && !cs.vars.plainte.points.includes("iban")) items.push({ kind: "bad", text: "La plainte ne désignait pas le compte bénéficiaire : le parquet ne pouvait rien demander à la Lituanie." });
      if (cs.advice.includes("p_rembourse")) items.push({ kind: "bad", text: "Vous avez promis un remboursement : on ne promet jamais un résultat." });
      return items;
    },
    epilogue(api, o) {
      if (o.type === "indemnise") return `Rhône Usinage a récupéré ${CR.money(api.cs.vars.gel)}. Le directeur financier a mis en place une double validation des virements. Les auteurs n'ont jamais été identifiés.`;
      return "Les 140 000 euros ont disparu à Hong Kong. L'assureur a couvert une partie de la perte ; la double validation des virements est devenue la règle.";
    },
    fiche(api, o) {
      return {
        phrase: "Escroquerie au faux président, plainte contre X, avocat de la société victime.",
        notions: [
          { titre: "La compétence de la loi pénale française", regle: "Un crime ou un délit réalisé par un réseau de communication électronique au préjudice d'une personne résidant en France ou d'une personne morale dont le siège est en France est réputé commis en France.", art: "art. 113-2-1 CP", prog: "dpg" },
          { titre: "La compétence territoriale", regle: "Le tribunal du lieu de l'infraction, de la résidence du prévenu ou de son arrestation ; pour les affaires de grande complexité commises en bande organisée, une juridiction interrégionale spécialisée.", art: "art. 382 et 706-75 CPP", prog: "pp_jugement" },
          { titre: "L'escroquerie en bande organisée", regle: "Dix ans et un million d'euros d'amende.", art: "art. 313-2 CP", prog: "dps" },
        ],
        piege: "Une main courante n'est pas une plainte ; une plainte au mauvais parquet coûte les jours pendant lesquels les fonds partent.",
        devenir: api.def.epilogue(api, o),
      };
    },
    corrige() {
      return [
        { probleme: "La justice française est-elle compétente ?", regle: "Oui : l'escroquerie commise au moyen d'un réseau de communication électronique au préjudice d'une personne morale dont le siège est en France est réputée commise en France (art. 113-2-1 CP).", application: "Rhône Usinage a son siège à Villeurbanne ; peu importe que les auteurs et le compte soient à l'étranger." },
        { probleme: "Quel tribunal ?", regle: "Celui du lieu de l'infraction, de la résidence ou de l'arrestation du prévenu (art. 382 CPP) ; JIRS possible pour la bande organisée complexe (art. 706-75).", application: "La tromperie et la remise ont eu lieu à Villeurbanne : parquet de Lyon. Le parquet de Paris n'a aucun titre." },
        { probleme: "Que faire d'abord ?", regle: "Porter plainte vite, au procureur compétent, en désignant le compte bénéficiaire ; la plainte avec constitution de partie civile, en matière délictuelle, suppose une plainte préalable (art. 85). Les mesures sur le compte étranger passent par l'entraide pénale internationale.", application: "Plainte au parquet de Lyon dans les jours qui suivent, avec l'IBAN, les en-têtes et l'ordre de virement ; relance de la banque le jour même." },
      ];
    },
  });
})();
