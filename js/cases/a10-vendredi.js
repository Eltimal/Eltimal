/* Affaire 10 — Le jugement de vendredi.
   Défense. Nadia, condamnée vendredi par jugement contradictoire, arrive le jeudi suivant.
   Délai d'appel de dix jours (art. 498 et 801), étendue de l'appel (art. 509), appel incident du parquet (art. 500),
   interdiction d'aggraver sur le seul appel du prévenu (art. 515), désistement (art. 500-1).
   Piège : croire l'ancien avocat qui parlait d'« un mois ». */
(function () {
  const CR = window.CR;
  const R = CR.R;
  const PEN = CR.PEN;
  const AUD = CR.AUD;
  const NADIA = { prenom: "Nadia", nom: "Saïdi", g: "f", age: 41, metier: "comptable", tel: "06 12 57 93 40", trust: 50, look: { skin: 2, hair: "long", hc: "dkbrown", glasses: 1 }, naissance: "le 19 septembre 1985 à Bondy", adresse: "rue de Charonne, Paris 11e" };
  const DEF = "a10_vendredi";
  const PREMIERE = { ferme: 12, sursis: 12, civil: 38000 };
  CR.OUTCOMES.reformation = "Jugement réformé en appel";

  CR.defineCase({
    id: DEF, camp: "defense", domaine: "appel", domaineLib: "pp_recours",
    title: "Saïdi — le jugement de vendredi",
    arrive: { day: 73, min: 8 * 60 + 40, how: "rdv", mail: { from: "Nadia Saïdi", subject: "Condamnée vendredi — je veux faire appel", kind: "email", body: [["Maître, j'ai été condamnée vendredi dernier par le tribunal correctionnel à deux ans de prison dont un ferme. Mon avocat ne répond plus. Je veux faire appel. Il m'a dit que j'avais un mois. Pouvez-vous me recevoir ce matin ?"]] } },
    leadTask: PEN.rdvTask("Recevoir Mme Saïdi au cabinet"),
    client: NADIA, leadPatience: 2, urgence: true,
    profile: { wealth: 3, sens: 0.5, urgency: 0.9, temper: "presse" },
    honoraires: { forfait: 2500, heures: 14, types: ["forfait", "temps"], resultat: "infirmation" },
    mission: "Défense de Mme Nadia Saïdi : déclaration d'appel du jugement du tribunal correctionnel de Paris et défense devant la chambre des appels correctionnels de la cour d'appel de Paris, jusqu'à l'arrêt.",
    actors: { parquet: "pq_riboulet", president: "pr_cour", adverse: "av_villeneuve" },
    proc: { stade: "jugement", nature: "delit", faits: -260, infractions: ["CP_314-1"], pcConstituee: true },
    init(api, cs) {
      cs.vars.jugementDay = cs.vars.base - 6;
      cs.vars.appelLieu = "palais";
      cs.proc.decisions.push({ day: cs.vars.jugementDay, type: "jugement", coupable: true });
      cs.proc.events.push({ day: cs.vars.jugementDay, text: "Jugement contradictoire du tribunal correctionnel : deux ans dont un an ferme, 38 000 € de dommages-intérêts." });
    },
    vars: (s, cs) => ({ jugementDate: CR.fmtDate(cs.vars.jugementDay, "dow") }),
    facts: {
      N_vendredi: { label: "Le jugement a été rendu vendredi, à l'audience", key: true, why: "Un jugement contradictoire : le délai d'appel de dix jours court du prononcé (art. 498)." },
      N_peine: { label: "Deux ans dont un an ferme, 38 000 € à l'employeur", key: true },
      N_mois: { label: "Son ancien avocat lui a parlé d'« un mois »", key: true, why: "Un mois, c'est le délai d'appel en matière civile. En matière correctionnelle, c'est dix jours." },
      N_12000: { label: "Elle reconnaît 12 000 € d'avances jamais remboursées", key: true },
      N_ordres_dits: { label: "Les autres virements, c'est le gérant qui les ordonnait", key: true, why: "Des paiements faits sur instruction du titulaire des fonds ne sont pas détournés." },
      N_requis: { label: "Le procureur avait requis dix-huit mois avec sursis" },
      N_enfants: { label: "Deux enfants, qu'elle élève seule" },
      N_pernot: { label: "Son ancien avocat, Me Pernot" },
    },
    calls: {
      intake: {
        scene: "conference", kind: "meet", label: "Rendez-vous au cabinet",
        opening: ["Nadia Saïdi pose sur votre bureau une chemise cartonnée. « Je n'ai pas dormi depuis vendredi. »"],
        topics: [
          { id: "n_quand", q: "Quand et comment le jugement a-t-il été rendu ?", a: [{ t: "{jugementDate}. J'étais là, avec mon avocat. Le président a lu la décision le soir même, après la suspension.", f: "N_vendredi" }], cost: 3, tag: "good" },
          { id: "n_quoi", q: "Qu'a décidé le tribunal ?", a: [{ t: "Deux ans de prison, dont un an ferme. Et 38 000 euros à payer à l'Atelier Verneuil, mon ancien employeur.", f: "N_peine" }, { t: "Le procureur n'avait demandé que dix-huit mois avec sursis.", f: "N_requis" }], cost: 3 },
          { id: "n_avocat", q: "Qu'en dit votre avocat ?", a: [{ t: "Me Pernot. Il m'a dit qu'on avait un mois pour faire appel, et depuis il ne répond plus.", f: "N_mois" }, { t: "Je veux changer d'avocat.", f: "N_pernot" }], cost: 2 },
          { id: "n_faits", q: "Que vous reproche-t-on, exactement ?", a: ["J'étais comptable à l'Atelier Verneuil, une menuiserie. Ils disent que j'ai détourné 38 000 euros.", { t: "J'ai pris des avances sur salaire, 12 000 euros en tout, que je n'ai pas remboursées. C'est vrai.", f: "N_12000" }, { t: "Le reste, ce sont des virements à Socodis, un fournisseur. C'est M. Verneuil qui me les demandait, par mail.", f: "N_ordres_dits" }], cost: 5, unlock: ["n_mails"] },
          { id: "n_mails", q: "Avez-vous gardé ces courriels ?", a: ["Je les ai transférés sur ma boîte personnelle avant d'être licenciée. Mon premier avocat ne les a jamais produits."], cost: 2, tag: "good", fx: { flags: { mailsDits: true } } },
          { id: "n_vie", q: "Quelle est votre situation aujourd'hui ?", a: [{ t: "Licenciée. J'élève seule mes deux enfants, huit et douze ans.", f: "N_enfants" }, "J'ai un entretien dans un cabinet d'expertise comptable."], cost: 2 },
        ],
        start: ["n_quand", "n_quoi", "n_avocat", "n_faits", "n_vie"],
        patience: 90,
        close: "Alors, on a le temps ?",
      },
    },
    advice: [
      { id: "n_vite", t: "Le délai est de dix jours, pas d'un mois : nous faisons appel tout de suite." },
      { id: "n_rien", t: "Ne recontactez pas votre ancien employeur." },
      { id: "n_mois", t: "Nous avons un mois, prenons le temps de bien préparer l'appel." },
      { id: "n_promesse", t: "En appel, vous n'irez pas en prison, c'est garanti." },
    ],
    docs: {
      jugement: (x) => ({ title: "Copie du jugement", kind: "greffe", entete: ["Tribunal correctionnel de Paris · 11e chambre", "Jugement contradictoire"], paras: [
        [{ t: `Jugement prononcé publiquement le ${CR.fmtDate(x.cs.vars.jugementDay, "long")}, en présence de la prévenue et de son conseil.`, f: "N_prononce" }],
        ["Déclare Mme Nadia Saïdi coupable d'abus de confiance au préjudice de la SARL Atelier Verneuil, pour un montant de 38 000 euros (art. 314-1 du code pénal)."],
        [{ t: "La condamne à deux ans d'emprisonnement dont un an avec sursis ; dit n'y avoir lieu à aménagement en l'état.", f: "N_peine" }],
        ["Reçoit la SARL Atelier Verneuil en sa constitution de partie civile ; condamne Mme Saïdi à lui payer 38 000 euros de dommages-intérêts et 1 500 euros au titre de l'article 475-1."],
      ] }),
      mails: () => ({ title: "Courriels de M. Verneuil", kind: "sms", entete: ["Boîte personnelle de Mme Saïdi · courriels transférés"], paras: [
        [{ t: "« Nadia, fais le virement Socodis de 9 000 comme d'habitude, je régulariserai les factures. — J.-M. Verneuil »", f: "N_ordres" }],
        [{ t: "« Socodis : 8 500 aujourd'hui. Ne passe pas par le compte fournisseurs. — JMV »", f: "N_ordres" }],
        ["« Encore 8 500 pour Socodis. Merci. »"],
      ] }),
      avances: () => ({ title: "Relevé des avances sur salaire", kind: "courrier", entete: ["Atelier Verneuil · grand livre, extrait produit par la partie civile"], paras: [[{ t: "Avances sur salaire versées à Mme Saïdi, non régularisées : 12 000 euros.", f: "N_12000_doc" }]] }),
      plan: () => ({ title: "Proposition de remboursement", kind: "courrier", entete: ["Mme Nadia Saïdi"], paras: [[{ t: "Je m'engage à rembourser les avances de 12 000 euros à raison de 300 euros par mois, premier versement effectué ce mois-ci (virement CARPA joint).", f: "N_remboursement" }]] }),
    },
    docTitles: { jugement: "Copie du jugement", mails: "Courriels de M. Verneuil", avances: "Relevé des avances", plan: "Engagement de remboursement" },
    penal: { no: ["nullite", "prep"], copie: [] },
    flow: { tasks: PEN.tasks },
    tasks(api, T) {
      const { s, cs } = api;
      if (!CR.hasDoc(cs, "jugement")) T({ id: "copie_jugement", label: "Retirer la copie du jugement au greffe", sub: "Tribunal correctionnel, 11e chambre.", kind: "admin", time: 20, where: "palais", run: () => { CR.spend(s, 20, "admin"); api.doc("jugement", "Copie du jugement"); CR.toast(s, "Copie du jugement remise par le greffe.", "info"); return null; } });
      if (!cs.flags.predecesseur && cs.engaged != null) T({ id: "pernot", label: "Informer Me Pernot que vous lui succédez", sub: "Le confrère prédécesseur, avant d'intervenir.", kind: "call", time: 10, run: () => { CR.spend(s, 10, "call"); cs.flags.predecesseur = s.day; CR.bon(s, cs, { id: "predecesseur", texte: "Vous avez informé votre prédécesseur avant d'intervenir, comme la confraternité l'exige." }); CR.rep(s, "confreres", 1); api.tl("Me Pernot informé de votre intervention."); return null; } });
      if (cs.flags.mailsDits && !CR.hasDoc(cs, "mails")) T({ id: "mails", label: "Récupérer les courriels de M. Verneuil", sub: "Nadia les a transférés sur sa boîte personnelle.", kind: "admin", time: 20, run: () => { CR.spend(s, 20, "admin"); api.doc("mails", "Courriels de M. Verneuil"); api.doc("avances", "Relevé des avances"); return null; } });
      if (cs.proc.appel && cs.proc.appel.recevable && !cs.flags.plan && CR.hasFact(cs, "N_12000")) T({ id: "plan", label: "Mettre en place un plan de remboursement", sub: "300 € par mois sur les avances reconnues, par la CARPA.", kind: "meet", time: 30, run: () => { CR.spend(s, 30, "meet"); cs.flags.plan = s.day; api.doc("plan", "Engagement de remboursement"); return null; } });
      if (cs.vars.appelIncident && !cs.vars.desiste && cs.proc.appel && s.day <= CR.addMonths(cs.proc.appel.day, 1)) T({ id: "desister", label: "Se désister de l'appel", sub: "Le jugement deviendrait définitif. Pesez l'appel incident du parquet.", kind: "draft", time: 15, run: () => { api.run("desister"); return null; } });
      if (cs.proc.audience && cs.proc.audience.day >= s.day && !cs.flags.prepClient) T({ id: "prep", label: "Préparer Nadia à l'audience de la cour", sub: "Ce qu'elle reconnaît, ce qu'elle conteste, ses remboursements.", kind: "meet", time: 60, run: () => { CR.spend(s, 60, "meet"); cs.flags.prepClient = s.day; CR.updatedClient(s, cs, 1.5); return null; } });
    },
    on: {
      engaged(api) {
        const { s, cs } = api;
        const due = CR.rollForward(cs.vars.jugementDay + 10);
        api.oblig({ id: "appel498", label: "Appel du jugement (art. 498)", due, silent: true, onMiss: "_delaiExpire" });
      },
      _delaiExpire(api) {
        const { s, cs } = api;
        if (cs.proc.appel) return;
        cs.vars.delaiExpire = true;
        api.mail({ from: "Nadia Saïdi", subject: "Alors, l'appel ?", kind: "email", body: [["Maître, où en est mon appel ? Je n'ai aucune nouvelle."]] });
      },
      apresAppel(api, { ctrl, etendue }) {
        const { s, cs } = api;
        api.satisfy("appel498");
        if (!ctrl.ok) {
          CR.erreur(s, cs, { id: "appel_tardif", texte: ctrl.motif, sanction: "Appel irrecevable : le jugement est définitif.", regul: ctrl.regul });
          api.trust(-40);
          api.schedule(R.int(s, 40, 60), "_irrecevable");
          return;
        }
        CR.bon(s, cs, { id: "appel_delai", texte: `Appel formé dans le délai de dix jours (expiration le ${CR.fmtDate(CR.rollForward(cs.vars.jugementDay + 10), "long")}).` });
        CR.PROC.stade(api, "appel", "Appel devant la chambre des appels correctionnels.");
        api.at(CR.rollForward(s.day + R.int(s, 3, 5)), "_appelIncident", { etendue });
        let day = CR.rollForward(s.day + R.int(s, 70, 90));
        while (CR.dow(day) !== 4 || !CR.isBusinessDay(day)) day++;
        CR.PROC.fixAudience(api, { day, min: 13 * 60 + 30, juridiction: "chapp", mode: "appel", convocDay: s.day, president: "pr_cour", script: "cour", done: "apresCour", onMiss: "_absent", title: "Cour d'appel — chambre des appels correctionnels", duree: 80 });
        cs.actors.parquet = "pq_ag";
      },
      _appelIncident(api, { etendue }) {
        const { s, cs } = api;
        const p = etendue === "civil" ? 0 : (CR.profil("pq_riboulet").appel || 0.4) * (etendue === "total" ? 1 : 0.9);
        if (R.chance(s, p)) {
          cs.vars.appelIncident = s.day;
          CR.PROC.event(api, "Appel incident du ministère public (art. 500).");
          api.mail({ from: "Greffe correctionnel", subject: "Appel incident du ministère public", kind: "greffe", important: true, body: [["Le procureur de la République a interjeté appel incident du jugement, dans le délai supplémentaire de cinq jours (art. 500)."], ["La cour pourra désormais statuer dans un sens défavorable à la prévenue (art. 515)."]] });
        }
      },
      desister(api) {
        const { s, cs } = api;
        CR.spend(s, 15, "admin");
        cs.vars.desiste = s.day;
        CR.PROC.event(api, "Désistement de l'appel ; l'appel incident du parquet devient caduc.");
        api.mail({ from: "Greffe de la chambre des appels correctionnels", subject: "Désistement constaté", kind: "greffe", body: [["Il est donné acte à Mme Saïdi de son désistement d'appel. Intervenu dans le mois de l'appel, il rend caduc l'appel incident du ministère public (art. 500-1). Le jugement du tribunal correctionnel est définitif."]] });
        CR.closeCase(s, cs, { type: "done", detail: "désistement : jugement de première instance définitif" });
      },
      _irrecevable(api) {
        const { s, cs } = api;
        api.mail({ from: "Greffe de la chambre des appels correctionnels", subject: "Arrêt d'irrecevabilité", kind: "greffe", important: true, body: [["La cour déclare l'appel de Mme Saïdi irrecevable comme tardif (art. 498 et 801). Le jugement est définitif."]] });
        CR.closeCase(s, cs, { type: "irrecevable", detail: "appel tardif" });
      },
      _absent(api) {
        const { s, cs } = api;
        CR.erreur(s, cs, { id: "absent", texte: "Vous n'étiez pas devant la cour.", sanction: "La cour a confirmé le jugement.", regul: "Un pourvoi en cassation, sur le droit seulement." });
        CR.closeCase(s, cs, { type: "condamnation", detail: "jugement confirmé, sans avocat" });
      },
      decider(api, { st }) {
        const { s, cs } = api;
        const pl = st.played;
        const et = (cs.proc.appel && cs.proc.appel.etendue) || "total";
        const incident = !!cs.vars.appelIncident;
        const ordres = (CR.hasDoc(cs, "mails") && pl.has("arg:ordres")) || pl.has("N_ordres");
        const montant = ordres ? 12000 : 38000;
        const penalSaisi = et !== "civil";
        const civilSaisi = et !== "penal";
        let dec;
        if (penalSaisi) {
          dec = PEN.juger(api, {
            st, juridiction: "chapp", titre: "Arrêt de la chambre des appels correctionnels", prevenuNom: "Nadia Saïdi",
            spec: { seuil: 0.35, pieces: Object.assign({ aveu: { label: "Les avances reconnues par Mme Saïdi", sens: "charge", force: 0.5 } }, ordres ? {} : { virements: { label: "Les virements à Socodis", sens: "charge", force: 0.2 } }) },
            qualif: () => ({ id: "314-1", label: `abus de confiance, pour un montant de ${CR.money(montant)}`, court: "art. 314-1 CP", encourue: { prison: 60, amende: 375000 }, requis: cs.vars.requis, motif: ordres ? "Les virements à Socodis ont été faits sur les instructions écrites du gérant : ils ne sont pas détournés. Seules les avances non restituées le sont." : "Les détournements sont établis pour l'ensemble des sommes retenues par le tribunal." }),
            personnalite: ["N_enfants", "N_remboursement"].filter((f) => CR.hasFact(cs, f) || pl.has(f)).length + (pl.has("arg:remboursement") ? 1 : 0) + (st.dernierMot === "regrets" ? 1 : 0),
          });
          const pn = dec.peine;
          if (pn && !incident) {
            const tot = (pn.ferme || 0) + (pn.sursis || 0);
            if ((pn.ferme || 0) > PREMIERE.ferme || tot > PREMIERE.ferme + PREMIERE.sursis) {
              pn.ferme = Math.min(pn.ferme, PREMIERE.ferme);
              pn.sursis = Math.min(pn.sursis, PREMIERE.ferme + PREMIERE.sursis - pn.ferme);
              pn.regles = pn.regles.filter((r) => !/mandat de dépôt/.test(r));
              pn.mandatDepot = false;
              if (!pn.amenagement && pn.ferme > 0 && pn.ferme <= 12) pn.amenagement = "DDSE";
              pn.regles.push("Sur le seul appel de la prévenue, la cour ne peut aggraver son sort (art. 515) ; la partie ferme, d'un an au plus, est aménagée (art. 132-25).");
              pn.texte = CR.PROC.peineTexte(pn);
              const q = dec.questions.find((x) => x.q === "Sur la peine");
              if (q) { q.r = pn.texte + "."; q.motif = pn.regles.join(" "); }
              cs.vars.peine = pn;
            }
          }
        } else {
          dec = { titre: "Arrêt de la chambre des appels correctionnels", entete: `Cour d'appel de Paris, chambre des appels correctionnels — audience du ${CR.fmtDate(s.day, "long")}. Arrêt contradictoire.`, questions: [{ q: "Sur l'étendue de l'appel", r: "L'appel est limité aux dispositions civiles : la culpabilité et la peine sont définitives (art. 509).", motif: "La cour n'est saisie que dans la limite de l'acte d'appel." }], dispositif: "", coupable: true, qualif: null, peine: { ferme: PREMIERE.ferme, sursis: PREMIERE.sursis, texte: "Deux ans d'emprisonnement dont un an avec sursis (définitif)" }, civil: null };
          cs.vars.peine = dec.peine;
        }
        const civil = civilSaisi ? montant : PREMIERE.civil;
        dec.questions.push({ q: "Sur l'action civile", r: civilSaisi ? (montant < PREMIERE.civil ? `La cour infirme sur ce point et condamne Mme Saïdi à payer ${CR.money(montant)} à la SARL Atelier Verneuil.` : `La cour confirme la condamnation à payer ${CR.money(PREMIERE.civil)}.`) : "Les dispositions civiles, non frappées d'appel, sont définitives.", motif: civilSaisi && montant < PREMIERE.civil ? "Les sommes versées sur l'ordre écrit du gérant ne constituent pas un préjudice imputable à la prévenue." : "" });
        dec.dispositif = `${dec.coupable ? "Déclare Mme Saïdi coupable" : "Relaxe Mme Saïdi"} ; ${dec.peine ? dec.peine.texte.replace(/^./, (c) => c.toLowerCase()) : ""} ; dommages-intérêts : ${CR.money(civil)}.`;
        cs.vars.arret = { ferme: dec.peine ? dec.peine.ferme : null, amenagement: dec.peine && dec.peine.amenagement, civil };
        return dec;
      },
      apresCour(api, res) {
        const { s, cs } = api;
        const a = cs.vars.arret || {};
        const mieux = (a.ferme != null && (a.ferme < PREMIERE.ferme || a.amenagement)) || a.civil < PREMIERE.civil;
        const pire = a.ferme != null && a.ferme > PREMIERE.ferme;
        const pn = cs.vars.peine;
        if (pn && pn.mandatDepot && pn.ferme > 0) CR.condamneDetenu(s, cs, pn.ferme, "fleury", s.day);
        CR.closeCase(s, cs, mieux && !pire ? { type: "reformation", detail: pn ? pn.texte : "" } : { type: "condamnation", detail: pire ? "peine aggravée en appel" : "jugement confirmé" });
      },
    },
    audiences: {
      cour(api) {
        const { cs } = api;
        const incident = !!cs.vars.appelIncident;
        const et = (cs.proc.appel && cs.proc.appel.etendue) || "total";
        return {
          title: "Chambre des appels correctionnels", sub: "Cour d'appel de Paris · Île de la Cité", decor: { scene: "assises" },
          steps: [
            { who: "huissier", t: "La cour !" },
            { who: "president", t: `Affaire Saïdi. Appel de la prévenue${incident ? ", appel incident du ministère public" : ""}. ${et === "total" ? "L'appel porte sur l'ensemble des dispositions." : et === "penal" ? "L'appel est limité aux dispositions pénales." : "L'appel est limité aux dispositions civiles."}` },
            { who: "president", t: "Madame Saïdi, avancez. Vous avez le droit de vous taire, de faire des déclarations ou de répondre aux questions. Le conseiller va faire son rapport." },
            { who: "sys", t: "(La conseillère rapporteure résume le jugement en quatre minutes, sans lever les yeux.)" },
            { who: "president", t: "Madame, vous contestez les 38 000 euros ?" },
            { if: () => !!cs.flags.prepClient, then: [{ who: "client", t: "Je reconnais les 12 000 euros d'avances. Je rembourse. Les virements à Socodis, M. Verneuil me les demandait par écrit.", signal: "bon" }], else: [{ who: "client", t: "Je n'ai rien volé ! C'est lui qui…", fx: { cred: -2 } }] },
            { who: "president", t: "La parole est à la partie civile." },
            { who: "adverse", t: "La SARL Atelier Verneuil demande la confirmation intégrale. Mme Saïdi avait la signature sur les comptes ; elle en a abusé." },
            AUD.requisitions(incident ? { ferme: 18, sursis: 6 } : CR.hasDoc(cs, "mails") ? { ferme: 6, sursis: 12 } : { ferme: 12, sursis: 12 }, { avant: [incident ? "Le ministère public a fait appel incident : la peine doit refléter un abus de confiance commis pendant deux ans, au préjudice d'une petite entreprise." : "Sur le seul appel de la prévenue, je demande la confirmation."] }),
            { who: "president", t: "Maître, vous avez la parole. Votre cliente parlera en dernier." },
            { plaidoirie: { role: "defense", max: 4, args: [
              { id: "ordres", label: "Les virements à Socodis ont été ordonnés par écrit par le gérant", say: "« Fais le virement Socodis comme d'habitude, je régulariserai » : on ne détourne pas ce qu'on verse sur l'ordre écrit du titulaire des fonds.", cards: ["N_ordres", "CP_314-1"] },
              { id: "remboursement", label: "Elle a commencé à rembourser les avances", say: "Elle reconnaît les avances et rembourse déjà, 300 euros par mois, par la CARPA.", cards: ["N_remboursement"] },
              { id: "515", label: "La cour ne peut aggraver sur le seul appel de la prévenue (art. 515)", say: "Sur le seul appel de ma cliente, la cour ne saurait aggraver son sort.", cards: ["CPP_515"], pertinent: () => !incident },
              { id: "amenagement", label: "Une peine aménageable : deux enfants, un emploi en vue", say: "Mère seule de deux enfants, un emploi en vue : si une peine ferme demeure, elle doit être aménagée.", cards: ["N_enfants", "CP_132-25", "CP_132-19"] },
              { id: "requis", label: "Le tribunal est allé au-delà des réquisitions", say: "Le procureur avait requis dix-huit mois avec sursis ; le tribunal a prononcé un an ferme sans s'expliquer.", cards: ["N_requis"] },
              { id: "innocente", label: "Elle n'a rien fait", say: "Ma cliente n'a rien fait.", pertinent: () => false },
            ] } },
            { dernierMot: { prepare: [{ id: "regrets", label: "Reconnaître les avances, s'engager", t: "Je reconnais ce que j'ai pris. Je rembourserai jusqu'au dernier euro." }, { id: "rien", label: "Rien de plus", t: "Je n'ai rien à ajouter." }], spontane: { id: "spontane", t: "Je… je n'ai pas volé ces virements." } } },
            { delibere: { texte: "La cour se retire. Arrêt rendu sur le siège, après une heure de délibéré." } },
          ],
        };
      },
    },
    debrief(api, o) {
      const { cs } = api;
      const due = CR.rollForward(cs.vars.jugementDay + 10);
      const items = [{ kind: "rule", text: `Appel d'un jugement contradictoire : dix jours à compter du prononcé (art. 498) ; le délai qui expire un samedi, un dimanche ou un jour férié est prorogé au premier jour ouvrable (art. 801). Ici : ${CR.fmtDate(due, "long")}.` }];
      if (cs.advice.includes("n_mois")) items.push({ kind: "bad", text: "Vous avez repris l'erreur du premier avocat : un mois, c'est le délai de l'appel civil." });
      if (!cs.flags.predecesseur) items.push({ kind: "info", text: "Vous n'avez pas informé votre prédécesseur avant d'intervenir : la confraternité l'exige." });
      if (cs.vars.appelIncident) items.push({ kind: "info", text: "Le parquet a fait appel incident dans les cinq jours (art. 500) : la protection de l'article 515 tombait. Un désistement dans le mois de l'appel aurait rendu cet appel incident caduc (art. 500-1)." });
      else if (cs.proc.appel && cs.proc.appel.recevable) items.push({ kind: "good", text: "Sans appel du parquet, la cour ne pouvait pas aggraver le sort de Nadia (art. 515)." });
      if (cs.proc.appel && cs.proc.appel.etendue === "civil") items.push({ kind: "info", text: "Un appel limité aux dispositions civiles laisse la peine définitive (art. 509)." });
      return items.concat(cs.vars.debriefJugement || []);
    },
    epilogue(api, o) {
      if (o.type === "irrecevable") return "L'appel a été déclaré irrecevable. Nadia a été convoquée par le juge de l'application des peines. Elle n'a jamais retrouvé Me Pernot.";
      const p = api.cs.vars.peine;
      if (p && p.mandatDepot) return `${p.texte}. Nadia a été incarcérée à Fleury-Mérogis. Sa sœur a pris les enfants.`;
      return `${p ? p.texte : "Arrêt rendu"}. Nadia a commencé dans un cabinet d'expertise comptable, à Montreuil. Elle rembourse 300 euros chaque mois.`;
    },
    fiche(api, o) {
      return {
        phrase: "Abus de confiance, appel d'un jugement correctionnel contradictoire, avocate de Nadia Saïdi devant la cour d'appel.",
        notions: [
          { titre: "Le délai d'appel correctionnel", regle: "Dix jours à compter du prononcé du jugement contradictoire ; appel incident des autres parties dans les cinq jours suivants ; prorogation au premier jour ouvrable.", art: "art. 498, 500 et 801 CPP", prog: "pp_recours" },
          { titre: "L'effet dévolutif et la reformatio in pejus", regle: "La cour n'est saisie que dans la limite de l'acte d'appel ; sur le seul appel du prévenu, elle ne peut aggraver son sort.", art: "art. 509 et 515 CPP", prog: "pp_recours" },
          { titre: "L'abus de confiance", regle: "Détourner des fonds remis à charge de les rendre ou d'en faire un usage déterminé : cinq ans et 375 000 €.", art: "art. 314-1 CP", prog: "dps" },
        ],
        piege: "Croire le délai d'« un mois » : en matière correctionnelle, l'appel se forme dans les dix jours.",
        devenir: api.def.epilogue(api, o),
      };
    },
    corrige() {
      return [
        { probleme: "Quel délai ?", regle: "Dix jours à compter du prononcé du jugement contradictoire (art. 498), prorogés au premier jour ouvrable (art. 801). Hors délai : irrecevable, sauf force majeure.", application: "Jugement du vendredi, rendez-vous le jeudi suivant : il reste trois jours ouvrables. L'appel se déclare au greffe du tribunal, sans attendre." },
        { probleme: "Quel appel ?", regle: "Total, ou limité aux dispositions pénales ou civiles (art. 509). Les autres parties ont cinq jours de plus pour un appel incident (art. 500) ; sur le seul appel du prévenu, la cour ne peut aggraver son sort (art. 515).", application: "Nadia conteste la peine et le montant : appel total. Le risque d'appel incident du parquet se pèse ; un désistement dans le mois de l'appel le rend caduc (art. 500-1)." },
        { probleme: "Que plaider ?", regle: "L'abus de confiance suppose un détournement (art. 314-1) : des paiements faits sur l'ordre du titulaire des fonds n'en sont pas.", application: "Produire les courriels du gérant ; reconnaître les avances et rembourser ; demander l'aménagement." },
      ];
    },
  });
})();
