/* La Permanence — la première semaine (1.4.0 « Le premier appel »).
   Ce que l'audit de la 1.0 a relevé : un joueur qui clique « Avancer » passait des semaines sans jouer, les contacts se
   fermaient avec une ligne au journal pour seul signal, et l'écran titre promettait un téléphone qui ne sonnait pas.
   - La première nuit : le service des permanences inscrit d'office le nouvel avocat à la garde à vue de nuit, et le
     téléphone sonne (CR.premiereSemaine, appelé à la prestation de serment ; règle du jeu, présentée comme telle).
   - Au troisième jour, si vous ne vous êtes inscrit à aucune permanence, Me Varenne appelle.
   - Les contacts en attente (un client qui attend d'être rappelé) : « Avancer » s'arrête sur eux et le dit ; la veille du
     jour où il prendra un autre avocat, le client laisse un message.
   - Les courriers d'ouverture se réduisent à ce qui sert la première nuit ; la banque écrit avant les premières charges,
     la note sur le cabinet arrive avec le premier dossier. */
(function () {
  const CR = window.CR;
  const P = (CR.PREMIERE = {});

  // ------------------------------------------------------------------ contacts en attente
  // Un contact en attente : un dossier « lead » (le client attend votre appel ou votre rendez-vous) ; son échéance est le
  // jour où il prendra un autre avocat.
  CR.contactsEnAttente = function (s) {
    const out = [];
    for (const id of s.order || []) {
      const cs = s.cases[id];
      if (!cs || cs.status !== "lead") continue;
      const ev = (s.pending || []).filter((e) => e.caseId === id && e.key === "_leadExpire").sort((a, b) => a.day - b.day)[0];
      out.push({ cs, nom: CR.clientName(cs) || (CR.caseDef(cs) || {}).caller || "Un client", expire: ev ? ev.day : null });
    }
    return out.sort((a, b) => (a.expire == null ? 1e9 : a.expire) - (b.expire == null ? 1e9 : b.expire));
  };
  const quand = (s, d) => (d == null ? "bientôt" : d <= s.day ? "aujourd'hui" : d === s.day + 1 ? "demain" : CR.fmtDate(d, "dow"));
  P.phraseContact = (s, c) => `${c.nom} attend votre réponse : sans nouvelles, il prendra un autre avocat ${quand(s, c.expire)}.`.replace(/ il prendra/, CR.client(c.cs).g === "f" ? " elle prendra" : " il prendra");

  // « Avancer » le dit avant de partir…
  const reste0 = CR.resteAujourdhui;
  CR.resteAujourdhui = function (s) {
    const out = reste0(s);
    if (s.night) return out;
    for (const c of CR.contactsEnAttente(s)) out.push(P.phraseContact(s, c));
    return out;
  };
  // … et s'arrête sur tout contact en attente (il avance au plus d'un jour, et dit pourquoi il s'arrête)
  const skip0 = CR.skipAhead;
  CR.skipAhead = function (s, maxDays = 30) {
    P.arret = null;
    if (!CR.contactsEnAttente(s).length) {
      // jour par jour, pour s'arrêter dès qu'un contact arrive ou prévient
      let n = 0;
      const limite = maxDays;
      while (n < limite && !s.gameOver) {
        const k = skip0(s, 1); n += k;
        if (!k) break;
        if (s.night) break;
        const c = CR.contactsEnAttente(s);
        if (c.length) { P.arret = P.phraseContact(s, c[0]); break; }
        if (P.doitArreter(s)) break;
      }
      return n;
    }
    const n = skip0(s, 1);
    const c = CR.contactsEnAttente(s);
    if (c.length) P.arret = P.phraseContact(s, c[0]);
    return n;
  };
  // ce que l'ancien « Avancer » regardait d'un jour à l'autre (nouveaux messages, agenda, audiences, premier du mois) :
  // skip0(s, 1) s'arrête toujours après un jour ; ici on refait ses tests de sortie pour ne pas les perdre
  P.doitArreter = function (s) {
    if (s.voicemails.some((v) => !v.heard && v.day === s.day)) return true;
    if ((s.inbox || []).some((m) => !m.read && m.day === s.day)) return true;
    if (s.agenda.some((a) => a.day === s.day || (a.day - s.day <= 3 && a.day >= s.day && a.created < s.day))) return true;
    if (CR.pendingToday(s)) return true;
    if (CR.hearingsToday && CR.hearingsToday(s).length) return true;
    if (CR.ymd(s.day).d === 1) return true;
    return false;
  };

  // La veille du jour où il prendra un autre avocat, le client laisse un message (une ligne au journal ne suffisait pas)
  const processDay0 = CR.processDay;
  CR.processDay = function (s, d, first) {
    const r = processDay0.apply(this, arguments);
    try {
      for (const e of s.pending || []) {
        if (e.key !== "_leadExpire" || e.day !== d + 1) continue;
        const cs = s.cases[e.caseId];
        if (!cs || cs.status !== "lead" || (cs.vars && cs.vars.prevenuVeille)) continue;
        cs.vars = cs.vars || {};
        cs.vars.prevenuVeille = d;
        const c = CR.client(cs), nom = CR.clientName(cs) || "Un client";
        CR.voicemail(s, { from: nom, caseId: cs.id, kind: "client", at: 9 * 60 + 10, day: d, vmText: `Maître, c'est ${nom}. Je vous ai laissé un message il y a quelques jours et je n'ai pas de nouvelles. Si vous ne pouvez pas me prendre, dites-le-moi : demain, je m'adresse à un autre avocat.`, veille: true });
        CR.toast(s, `${nom} vous a rappelé : sans réponse, ${c.g === "f" ? "elle" : "il"} prendra un autre avocat demain.`, "warn");
      }
    } catch (err) { console.error(err); }
    return r;
  };

  // ------------------------------------------------------------------ la première nuit
  // À la prestation de serment (écran de création) : inscription d'office à la garde à vue de nuit du premier soir, avec
  // un appel sûr ; Me Varenne vérifie au troisième jour ; le courrier de l'Ordre le dit et porte le bouton d'inscription.
  CR.premiereSemaine = function (s) {
    if (!s || s.mode !== "carriere" || s.flags.premiereSemaine) return;
    s.flags.premiereSemaine = true;
    if (CR.signDuty(s, s.day, "gav_nuit")) {
      const du = s.duty.find((x) => x.day === s.day && x.type === "gav_nuit"); if (du) du.office = true;
      // l'appel de la première nuit est sûr (une nuit de permanence ordinaire en compte un sur six sans appel)
      const deja = s.pending.some((e) => e.type === "fn" && e.key === "dutyCall" && e.day === s.day + 1 && e.data && e.data.night);
      if (!deja) { const r = CR.seeded("premiereNuit" + s.seed); CR.schedule(s, { day: s.day + 1, min: 60 + Math.floor(r() * 240), type: "fn", key: "dutyCall", data: { kind: "gav", night: true, day: s.day + 1 } }); }
    }
    const ordre = (s.inbox || []).find((m) => m.kind === "ordre" && /permanences/.test(m.subject || ""));
    if (ordre) {
      ordre.subject = "Votre première permanence : cette nuit";
      ordre.body = [["Mon cher confrère, vous êtes inscrit au tableau de l'Ordre depuis votre prestation de serment."], ["Selon l'usage du service des permanences pour les nouveaux inscrits, vous tenez cette nuit la permanence de garde à vue. Gardez votre téléphone près de vous : un commissariat vous appellera, et vous aurez trente minutes d'entretien avec la personne gardée à vue (art. 63-4 du code de procédure pénale)."]].concat(ordre.body.slice(1));
      ordre.important = true;
    }
    CR.schedule(s, { day: s.day + 3, min: 10 * 60 + 15, type: "fn", key: "varenneJ3" });
  };
  // Au troisième jour : aucune permanence prise par vous-même ? Me Varenne appelle
  P.inscritSeul = (s) => (s.duty || []).some((d) => !d.office);
  CR.GLOBAL_FN.varenneJ3 = function (s) {
    if (P.inscritSeul(s) || s.gameOver) return;
    const M = CR.MENTOR;
    CR.ringNow(s, { from: M.nom, kind: "mentor", vmText: "Mon cher confrère, Varenne à l'appareil. Trois jours, et pas une permanence à votre nom : les clients ne viennent pas tout seuls. Passez à la Maison du barreau, ou ouvrez le courrier de l'Ordre : il y a un bouton. Une garde à vue de jour, une nuit, une comparution immédiate : prenez-en deux cette semaine.", mentor: true }, false);
  };

  // ------------------------------------------------------------------ les courriers qui arrivent quand ils servent
  // La banque écrit la veille des premières charges ; la note sur le cabinet arrive avec le premier dossier.
  P.BANQUE = { from: "Banque du Palais", subject: "Votre prêt d'installation et votre découvert", kind: "courrier",
    body: [["Nous vous confirmons votre prêt d'installation de 15 000 € au taux de 3,5 % sur 60 mois (273 € par mois) et une autorisation de découvert de 5 000 € au taux de 9 %."], ["Demain, le 1er du mois, partent le loyer, les cotisations et la mensualité du prêt. Les fonds de vos clients ne transitent jamais par ce compte : ils passent par la CARPA."]] };
  P.NOTE = { from: "Vous (note pour vous-même)", subject: "Comment fonctionne le cabinet", kind: "note",
    body: [["• Pendant un appel ou un entretien, cliquez sur une phrase pour la noter dans votre carnet. Quand l'entretien se termine, il n'en reste que vos notes."], ["• Vos actes se rédigent à partir de gabarits ; les blancs se remplissent avec les lignes de votre carnet. Ce que vous n'avez pas noté ne peut pas y figurer."], ["• Dans une pièce, cliquez sur une phrase pour la noter, la relever comme irrégularité ou l'inscrire à l'agenda."], ["• L'agenda ne contient que ce que vous y mettez. Rien ne vous rappellera un délai."], ["• Chaque action coûte du temps et de l'énergie ; le soir et le week-end fatiguent davantage. Déposer un acte suppose d'aller au greffe, aux heures d'ouverture."], ["• Le loyer et les charges partent le 1er du mois. L'aide juridictionnelle est versée par la CARPA le mois suivant."]] };
  CR.GLOBAL_FN.introBanque = (s) => { if (!s.flags.banqueEcrite) { s.flags.banqueEcrite = true; CR.mail(s, P.BANQUE); } };
  const open0 = CR.openCase;
  CR.openCase = function (s) {
    const cs = open0.apply(this, arguments);
    try { if (s && s.mode === "carriere" && s.flags && !s.flags.noteCabinet && s.flags.introCourte) { s.flags.noteCabinet = true; CR.mail(s, P.NOTE); } } catch (e) { console.error(e); }
    return cs;
  };
})();
