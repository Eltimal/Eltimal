/* La Permanence — la carrière : les grades, la spécialité, la collaboration et l'association (version 1.0).
   s.car = { grade, spec, debut: "compte" | "collab", collab, assoc, offre, favorables, hist }.
   - CAR.GRADES : cinq grades, franchis d'après les dossiers menés à terme, la réputation moyenne et les issues favorables.
     Le prochain grade et ce qu'il demande sont les objectifs affichés dans Cabinet › Carrière.
   - CAR.SPECS : la spécialité (dominante d'activité), choisie à partir du deuxième grade. Elle amène davantage de dossiers
     de ce domaine et les clients y acceptent des honoraires plus élevés (CR.fairForfait).
   - Début en collaboration libérale (CAR.demarrerCollab) : pas de prêt ni de loyer, une rétrocession mensuelle au minimum
     de l'Ordre de Paris (3 700 € HT la première année, 4 100 € ensuite : montants 2026), mais les dossiers du cabinet
     prennent de l'énergie chaque jour ouvré. On peut s'installer à son compte dès le deuxième grade.
   - Association (quatrième grade) : une offre à accepter ou refuser, avec un apport ; charges partagées, dossiers apportés.
   Rien ne change pour une partie sans spécialité, à son compte et avant le deuxième grade : les facteurs valent 1. */
(function () {
  const CR = window.CR, UI = CR.UI;
  const CAR = (CR.CAR = {});
  CAR.RETRO = [3700, 4100];
  CAR.APPORT = 8000;
  CAR.DRAIN = 20;

  CAR.SPECS = {
    urgence: { t: "Défense d'urgence", sub: "Gardes à vue et comparutions immédiates.", effet: "L'Ordre vous rappelle plus souvent en permanence de garde à vue de jour." },
    victimes: { t: "Victimes", sub: "Parties civiles, chiffrage des préjudices.", effet: "Deux fois plus de victimes poussent la porte du cabinet." },
    affaires: { t: "Pénal des affaires et numérique", sub: "Escroqueries, abus de confiance, infractions numériques.", effet: "Ces dossiers vous arrivent en priorité." },
    criminel: { t: "Instruction et assises", sub: "Informations judiciaires, cour criminelle, cour d'assises.", effet: "Les affaires criminelles reviennent plus vite." },
  };
  CAR.GRADES = [
    { id: "debut", t: "Avocat de permanence", tc: "Collaborateur libéral", need: null, gain: "Les permanences de l'Ordre, les commissions d'office, vos premiers clients." },
    { id: "installe", t: "Avocat installé", tc: "Collaborateur confirmé", need: { dossiers: 3 }, gain: "Vous pouvez choisir une spécialité." },
    { id: "confirme", t: "Pénaliste confirmé", tc: "Collaborateur senior", need: { dossiers: 10, moy: 30, favorables: 3 }, gain: "Votre nom circule : les clients acceptent des honoraires plus élevés (+8 %)." },
    { id: "associe", t: "Pénaliste reconnu", ta: "Associé", need: { dossiers: 22, moy: 42, favorables: 8 }, gain: "Une proposition d'association vous est faite." },
    { id: "tenor", t: "Ténor du barreau", need: { dossiers: 40, moy: 58, criminel: 1 }, gain: "On vient vous chercher : honoraires encore relevés (+18 % au total)." },
  ];
  const NEED = {
    dossiers: (n) => `${n} dossiers menés à terme`, moy: (n) => `Réputation moyenne de ${n}`,
    favorables: (n) => `${n} issues favorables (relaxe, nullité, alternative, indemnisation…)`, criminel: () => "Une affaire criminelle menée à terme",
  };
  const BON = ["relaxe", "acquittement", "requalification_favorable", "classement", "alternative", "non_lieu", "indemnise", "crpc"];

  CAR.actif = (s) => !!s && s.mode === "carriere";
  CAR.etat = function (s) {
    if (!s.car) {
      const st = s.stats || {};
      s.car = { grade: 0, spec: null, debut: "compte", collab: null, assoc: null, offre: null, favorables: (st.relaxes || 0) + (st.nullites || 0) + (st.acquittements || 0), hist: [] };
    }
    return s.car;
  };
  CAR.mesure = function (s) {
    const c = CAR.etat(s), r = s.reps || {};
    const vals = Object.values(r);
    return {
      dossiers: (s.stats && s.stats.dossiers) || 0, moy: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0,
      favorables: c.favorables || 0, criminel: ((s.competence && s.competence.criminel) || 0) + ((s.competence && s.competence.instruction) || 0),
    };
  };
  CAR.manque = function (s, g) {
    const m = CAR.mesure(s), G = CAR.GRADES[g];
    if (!G || !G.need) return [];
    return Object.entries(G.need).map(([k, n]) => ({ k, n, a: m[k], ok: m[k] >= n, label: NEED[k](n) }));
  };
  CAR.titre = function (s) {
    if (!CAR.actif(s)) return "";
    const c = CAR.etat(s), G = CAR.GRADES[c.grade];
    if (c.assoc && c.grade < 4) return "Associé";
    if (c.collab) return G.tc || G.t;
    return G.t;
  };
  CAR.specDe = (s) => (CAR.actif(s) && s.car && s.car.spec) || null;

  // ------------------------------------------------------------ un dossier relève-t-il de la spécialité ?
  const famDe = (s, id) => { const p = (s.generated || []).find((x) => x.id === id); const inf = p && ((p.t && p.t.inf) || p.inf); return (inf && CR.CAT && CR.CAT.INF[inf] && CR.CAT.INF[inf].fam) || null; };
  CAR.dansSpec = function (s, def, cs) {
    const sp = CAR.specDe(s);
    if (!sp || !def) return false;
    const dom = def.domaine, fam = famDe(s, def.id || (cs && cs.id)) || def.famille || "";
    const camp = (cs && cs.camp) || def.camp;
    if (sp === "urgence") return dom === "gav" || dom === "ci";
    if (sp === "victimes") return camp === "pc" || dom === "pc";
    if (sp === "affaires") return fam === "affaires" || fam === "numerique";
    if (sp === "criminel") return dom === "criminel" || dom === "instruction" || /^crim_/.test(fam);
    return false;
  };
  CAR.primeGrade = (s) => { if (!CAR.actif(s) || !s.car) return 1; return s.car.grade >= 4 ? 1.18 : s.car.grade >= 2 ? 1.08 : 1; };
  // l'associé, ou le cabinet devenu le vôtre, vous adresse des dossiers
  CAR.apport = (s) => (CAR.actif(s) && s.car && s.car.assoc ? 1.3 : 1);

  // ------------------------------------------------------------ branchements sur l'économie et le générateur
  const ft = CR.fairTaux, ff = CR.fairForfait;
  CR.fairTaux = (s) => { const k = CAR.primeGrade(s); return k === 1 ? ft(s) : Math.round(ft(s) * k / 5) * 5; };
  CR.fairForfait = (s, def) => { const k = CAR.primeGrade(s) * (CAR.dansSpec(s, def) ? 1.15 : 1); return k === 1 ? ff(s, def) : Math.round(ff(s, def) * k / 50) * 50; };

  if (CR.GEN2) {
    const lk = CR.GEN2.leadKind;
    CR.GEN2.leadKind = function (s) {
      if (CAR.specDe(s) !== "victimes") return lk(s);
      const base = CR.GEN2.LEADS, sauve = base.pc;
      base.pc = sauve * 2;
      try { return lk(s); } finally { base.pc = sauve; }
    };
    if (CR.GEN2.DIR) {
      const sc = CR.GEN2.DIR.score;
      CR.GEN2.DIR.score = function (s, t, rang, kind) {
        let v = sc(s, t, rang, kind);
        if (CAR.specDe(s) === "affaires") { const f = (CR.CAT.INF[t.inf] || {}).fam; if (f === "affaires" || f === "numerique") v += 14; }
        return v;
      };
    }
    const due = CR.GEN2.infoDue;
    if (due) CR.GEN2.infoDue = function (s, d) {
      const r = due(s, d);
      // spécialité criminelle : la prochaine information judiciaire arrive un tiers plus tôt
      if (r && CAR.specDe(s) === "criminel" && s.genInfo) s.genInfo.next = d + Math.max(12, Math.round((s.genInfo.next - d) * 0.65));
      return r;
    };
  }
  const pd = CR.planDuty;
  if (pd) CR.planDuty = function (s, day, type) {
    pd(s, day, type);
    if (CAR.specDe(s) === "urgence" && type === "gav_jour" && day > s.day) {
      const r = CR.seeded("carurg" + day + s.seed);
      CR.schedule(s, { day, min: 15 * 60 + Math.floor(r() * 150), type: "fn", key: "dutyCall", data: { kind: "gav", day } });
    }
  };

  // ------------------------------------------------------------ grades
  const para = (...ps) => ps.map((p) => [p]);
  CAR.verifier = function (s) {
    if (!CAR.actif(s) || s.gameOver) return;
    const c = CAR.etat(s);
    while (c.grade < CAR.GRADES.length - 1 && CAR.manque(s, c.grade + 1).every((x) => x.ok)) {
      c.grade++;
      c.hist.push({ day: s.day, grade: c.grade });
      const G = CAR.GRADES[c.grade], titre = CAR.titre(s);
      CR.log(s, `Carrière : vous êtes désormais « ${titre} ». ${G.gain}`, "good");
      CR.toast(s, `Nouveau grade : ${titre}`, "good");
      CR.mail(s, {
        from: c.collab ? c.collab.patron : "Me Varenne", subj: `${titre}`, kind: "email",
        body: para(c.collab ? "Cher confrère," : "Mon cher confrère,",
          c.grade === 1 ? "Trois dossiers menés au bout : vous n'êtes plus tout à fait un débutant. C'est le moment de vous demander ce que vous voulez plaider dans dix ans. Regardez l'onglet Carrière de votre cabinet : vous pouvez y choisir une spécialité."
            : c.grade === 2 ? "On commence à me parler de vous au vestiaire, et pas pour s'en plaindre. Vos clients le sentent aussi : vous pouvez demander davantage."
            : c.grade === 3 ? "Vous avez maintenant un nom. Attendez-vous à ce qu'on vous propose de vous associer ; lisez bien ce qu'on vous demande d'apporter avant de signer."
            : "Il y a des confrères qu'on appelle quand tout est perdu. Vous en êtes. Ne l'oubliez pas le jour où l'on vous demandera de l'oublier.",
          "Bien confraternellement."),
      });
      if (c.grade === 3) CAR.proposer(s);
    }
    // une offre refusée ou expirée revient après quelques mois
    if (c.grade >= 3 && !c.assoc && !c.offre && c.refus != null && s.day - c.refus >= 90) CAR.proposer(s);
    if (c.offre && s.day > c.offre.until) { c.offre = null; c.refus = s.day; CR.log(s, "La proposition d'association est restée sans réponse : elle est caduque.", "warn"); }
  };
  CAR.proposer = function (s) {
    const c = CAR.etat(s);
    if (c.assoc || c.offre) return;
    const qui = c.collab ? c.collab.patron : "Me Solène Kerbrat";
    c.offre = { day: s.day, until: s.day + 45, apport: CAR.APPORT, qui };
    CR.mail(s, {
      from: qui, subj: "Une proposition d'association", kind: "email", important: true,
      body: para("Cher confrère,",
        c.collab ? "Vos dossiers personnels pèsent désormais autant que ceux que je vous confie. Je ne veux pas vous voir partir : je vous propose de devenir mon associé."
          : "Nous nous croisons depuis des mois à la 23e chambre, et je sous-loue deux bureaux dont un reste vide. Je vous propose de nous associer : locaux et abonnements partagés, dossiers adressés de l'un à l'autre quand l'agenda déborde.",
        `L'apport demandé est de ${CR.money(CAR.APPORT)}. La proposition tient quarante-cinq jours ; la réponse se donne dans l'onglet Carrière de votre cabinet.`,
        "Votre bien dévoué."),
    });
    CR.toast(s, "Une proposition d'association vous attend (Cabinet › Carrière).", "info");
  };
  CAR.repondre = function (s, oui) {
    const c = CAR.etat(s), o = c.offre;
    if (!o) return false;
    if (!oui) { c.offre = null; c.refus = s.day; CR.log(s, "Vous avez décliné la proposition d'association.", "info"); return true; }
    if (s.cash < o.apport) { CR.toast(s, `L'apport est de ${CR.money(o.apport)} : votre compte ne le permet pas encore.`, "warn"); return false; }
    s.cash -= o.apport;
    CR.ledgerAdd(s, { day: s.day, label: "Apport en association", amount: -o.apport, acct: "op" });
    const nomAssoc = o.qui.replace(/^Me\s+\S+\s+/, "");
    if (c.collab) { s.fixed.loyer = 950; s.fixed.logiciels = 70; c.collab = null; } else { s.fixed.loyer = Math.round(s.fixed.loyer * 0.6 / 10) * 10; s.fixed.logiciels = Math.round(s.fixed.logiciels / 2); }
    s.decouvert.limit += 5000;
    c.assoc = { day: s.day, qui: o.qui };
    c.offre = null;
    if (!s.player.cabinet.includes(nomAssoc)) s.player.cabinet = `${s.player.nom} & ${nomAssoc}`;
    CR.rep(s, "confreres", 4, "association");
    CR.log(s, `Vous êtes associé avec ${o.qui} : charges partagées, dossiers adressés entre vous.`, "good");
    return true;
  };
  CAR.choisirSpec = function (s, id) {
    const c = CAR.etat(s);
    if (c.grade < 1 || (id && !CAR.SPECS[id]) || c.spec === id) return false;
    // changer d'étiquette fait perdre des prescripteurs ; la première fois, rien
    if (c.spec && id !== c.spec) CR.rep(s, "confreres", -3, "changement de spécialité");
    c.spec = id || null;
    c.specDay = s.day;
    CR.log(s, id ? `Spécialité : ${CAR.SPECS[id].t}.` : "Vous redevenez généraliste.", "info");
    return true;
  };

  // ------------------------------------------------------------ la collaboration libérale
  CAR.demarrerCollab = function (s) {
    const c = CAR.etat(s);
    c.debut = "collab";
    c.collab = { cabinet: "Vasseur Avocats", patron: "Me Hélène Vasseur", depuis: s.day };
    s.pret = { balance: 0, rate: s.pret.rate, payment: 0 };
    s.fixed.loyer = 0; s.fixed.logiciels = 0;
    s.cash = 2500; s.decouvert.limit = 2000;
    s.player.cabinet = c.collab.cabinet;
    CR.mail(s, {
      from: c.collab.patron, subj: "Bienvenue au cabinet", kind: "email",
      body: para("Cher confrère,",
        `Votre contrat de collaboration libérale est signé. La rétrocession d'honoraires est de ${CR.money(CAR.RETRO[0])} hors taxes par mois la première année, le minimum fixé par l'Ordre, et de ${CR.money(CAR.RETRO[1])} ensuite.`,
        "Mes dossiers vous prendront vos matinées. Le reste du temps est à vous : le contrat vous garantit de pouvoir développer votre clientèle personnelle, et je vous y encourage. Inscrivez-vous aux permanences.",
        "Bien à vous."),
    });
    return s;
  };
  CAR.retro = (s) => { const c = s.car && s.car.collab; return c ? CAR.RETRO[s.day - c.depuis >= 365 ? 1 : 0] : 0; };
  CAR.sInstaller = function (s) {
    const c = CAR.etat(s);
    if (!c.collab || c.grade < 1) return false;
    const ancien = c.collab;
    c.collab = null; c.installe = s.day;
    s.pret = { balance: 15000, rate: s.pret.rate || 0.035, payment: 273 };
    s.cash += 6200;
    CR.ledgerAdd(s, { day: s.day, label: "Prêt d'installation (15 000 €), frais d'installation déduits", amount: 6200, acct: "op" });
    s.fixed.loyer = 850; s.fixed.logiciels = 140; s.decouvert.limit = 5000;
    s.player.cabinet = `Cabinet ${s.player.nom}`;
    CR.rep(s, "confreres", 2, "installation");
    CR.log(s, `Vous quittez ${ancien.cabinet} et vous vous installez à votre compte : plus de rétrocession, mais vos journées sont à vous.`, "info");
    return true;
  };

  // ------------------------------------------------------------ branchements sur le déroulé de la partie
  const cc = CR.closeCase;
  CR.closeCase = function (s, cs, outcome) {
    const deja = cs.status === "closed";
    const r = cc.apply(this, arguments);
    try {
      if (CAR.actif(s) && !deja && cs.status === "closed" && cs.outcome) {
        const c = CAR.etat(s);
        if (BON.includes(cs.outcome.type)) { c.favorables = (c.favorables || 0) + 1; if (CAR.dansSpec(s, CR.caseDef(cs), cs)) CR.rep(s, "clients", 1, "spécialité"); }
        CAR.verifier(s);
      }
    } catch (e) { console.error(e); }
    return r;
  };
  const mo = CR.monthly;
  CR.monthly = function (s, d) {
    const r = mo.apply(this, arguments);
    try {
      if (CAR.actif(s)) {
        const m = CAR.retro(s);
        if (m) { s.cash += m; CR.ledgerAdd(s, { day: d, label: `Rétrocession d'honoraires — ${s.car.collab.cabinet}`, amount: m, acct: "op" }); if (CR.settleDecouvert) CR.settleDecouvert(s); }
        CAR.verifier(s);
      }
    } catch (e) { console.error(e); }
    return r;
  };
  const ed = CR.endDay;
  CR.endDay = function (s) {
    const r = ed.apply(this, arguments);
    if (CAR.actif(s) && s.car && s.car.collab && !s.gameOver && !s.burnout && !s.night && CR.isBusinessDay(s.day)) {
      s.energy = Math.max(25, s.energy - CAR.DRAIN);
      if (s.lastDayStats) s.lastDayStats.cabinet = CAR.DRAIN;
    }
    return r;
  };

  // ------------------------------------------------------------ l'onglet Carrière du cabinet
  if (!UI) return;
  const { html, Btn, Tag, Meter, cx } = UI;
  const { useState } = React;
  UI.CarrierePanel = function CarrierePanel({ s }) {
    const [confirme, setConfirme] = useState(null);
    const [inst, setInst] = useState(false);
    const bump = () => CR.store.bump();
    if (!CAR.actif(s)) return html`<p className="empty">La carrière ne se suit pas dans une affaire jouée par son code.</p>`;
    const c = CAR.etat(s), m = CAR.mesure(s), G = CAR.GRADES[c.grade], suivant = CAR.GRADES[c.grade + 1];
    const need = suivant ? CAR.manque(s, c.grade + 1) : [];
    return html`<div className="carriere">
      <div className="car-tete">
        <div><span className="pix">Votre grade</span><strong className="car-grade">${CAR.titre(s)}</strong><span className="small muted">${G.gain}</span></div>
        <ol className="car-echelle" aria-label="Les grades">${CAR.GRADES.map((g, i) => html`<li key=${g.id} className=${cx(i < c.grade && "fait", i === c.grade && "ici")}>${i === 3 && c.assoc ? "Associé" : (c.collab && g.tc) || g.t}</li>`)}</ol>
      </div>
      ${c.offre && html`<div className="banner warn car-offre">
        <p><strong>${c.offre.qui} vous propose de vous associer.</strong> Apport : ${CR.money(c.offre.apport)}. ${c.collab ? "Votre rétrocession s'arrête, les dossiers du cabinet ne vous prennent plus vos matinées, et vous payez votre part des charges (950 € de loyer)." : "Loyer et abonnements partagés (loyer ramené à " + CR.money(Math.round(s.fixed.loyer * 0.6 / 10) * 10) + "), découvert autorisé relevé de 5 000 €."} Votre associé vous adresse des dossiers : le téléphone sonne environ un tiers plus souvent. Offre valable jusqu'au ${CR.fmtDate(c.offre.until, "long")}.</p>
        <div className="car-btns"><${Btn} kind="primary" disabled=${s.cash < c.offre.apport} onClick=${() => { CAR.repondre(s, true); bump(); }}>Accepter et verser l'apport</${Btn}><${Btn} onClick=${() => { CAR.repondre(s, false); bump(); }}>Décliner</${Btn}>${s.cash < c.offre.apport && html`<span className="small muted">Il vous manque ${CR.money(c.offre.apport - s.cash)} sur le compte professionnel.</span>`}</div>
      </div>`}
      ${c.assoc && html`<p className="banner ok">Associé avec ${c.assoc.qui} depuis le ${CR.fmtDate(c.assoc.day, "long")}.</p>`}
      <${UI.Section} title=${suivant ? `Objectifs : ${c.collab && suivant.tc ? suivant.tc : suivant.t}` : "Objectifs"}>
        ${!suivant ? html`<p>Vous avez atteint le dernier grade. Il reste à durer.</p>` : html`<ul className="car-obj">${need.map((x) => html`<li key=${x.k} className=${cx(x.ok && "ok")}><span className="car-coche" aria-hidden="true">${x.ok ? "✓" : ""}</span><span className="car-lab">${x.label}</span><span className="car-val num">${Math.min(x.a, x.n)} / ${x.n}</span><${Meter} small value=${Math.min(x.a, x.n)} max=${x.n} tone=${x.ok ? "ok" : null} /></li>`)}</ul><p className="small muted">À la clé : ${suivant.gain}</p>`}
      </${UI.Section}>
      <${UI.Section} title="Spécialité">
        ${c.grade < 1 ? html`<p className="muted">Menez trois dossiers à terme pour choisir une spécialité. D'ici là, vous prenez ce qui vient.</p>` : html`<div>
          <p className="small muted">La dominante de votre activité. Les dossiers de ce domaine vous arrivent plus souvent, les clients y acceptent des honoraires plus élevés (+15 %) et une issue favorable y nourrit le bouche-à-oreille.${c.spec ? " En changer coûte un peu de crédit auprès des confrères qui vous adressaient des dossiers." : ""}</p>
          <div className="car-specs">
            <button type="button" className=${cx("car-spec", !c.spec && "on")} aria-pressed=${!c.spec} onClick=${() => { if (c.spec) setConfirme("aucune"); }}><strong>Généraliste</strong><span className="small muted">Tout le pénal, sans préférence.</span></button>
            ${Object.entries(CAR.SPECS).map(([k, sp]) => html`<button type="button" key=${k} className=${cx("car-spec", c.spec === k && "on")} aria-pressed=${c.spec === k} onClick=${() => { if (c.spec === k) return; if (c.spec) setConfirme(k); else { CAR.choisirSpec(s, k); bump(); } }}><strong>${sp.t}</strong><span className="small muted">${sp.sub} ${sp.effet}</span></button>`)}
          </div>
          ${confirme && html`<div className="banner warn car-btns"><span>Changer pour « ${confirme === "aucune" ? "Généraliste" : CAR.SPECS[confirme].t} » ? Réputation auprès des confrères : −3.</span><${Btn} small kind="primary" onClick=${() => { CAR.choisirSpec(s, confirme === "aucune" ? null : confirme); setConfirme(null); bump(); }}>Changer</${Btn}><${Btn} small onClick=${() => setConfirme(null)}>Annuler</${Btn}></div>`}
          <p className="small muted">Dans la réalité, la mention de spécialisation en droit pénal est un certificat délivré par le Conseil national des barreaux, après plusieurs années de pratique et un entretien devant un jury.</p>
        </div>`}
      </${UI.Section}>
      ${c.collab && html`<${UI.Section} title=${`Collaboration — ${c.collab.cabinet}`}>
        <p>Rétrocession d'honoraires : <strong>${CR.money(CAR.retro(s))}</strong> hors taxes, versée le 1er du mois. Les dossiers de ${c.collab.patron} prennent vos matinées : vous commencez chaque jour ouvré avec ${CAR.DRAIN} points d'énergie en moins. Ni loyer, ni prêt.</p>
        <p className="small muted">La collaboration libérale laisse à l'avocat le temps de développer sa clientèle personnelle : c'est ce qui la distingue du salariat.</p>
        ${c.grade >= 1 ? html`<div className="car-btns">${inst ? html`<span>Prêt d'installation de 15 000 € (273 € par mois), loyer de 850 €, plus de rétrocession. C'est sans retour.</span><${Btn} small kind="danger" onClick=${() => { CAR.sInstaller(s); setInst(false); bump(); }}>Confirmer</${Btn}><${Btn} small onClick=${() => setInst(false)}>Annuler</${Btn}>` : html`<${Btn} onClick=${() => setInst(true)}>S'installer à son compte</${Btn}>`}</div>` : html`<p className="small muted">Vous pourrez vous installer à votre compte une fois trois dossiers personnels menés à terme.</p>`}
      </${UI.Section}>`}
      <${UI.Section} title="Parcours">
        <div className="kpis">
          <div className="kpi"><span className="pix">Dossiers menés à terme</span><strong>${m.dossiers}</strong></div>
          <div className="kpi"><span className="pix">Issues favorables</span><strong>${m.favorables}</strong></div>
          <div className="kpi"><span className="pix">Réputation moyenne</span><strong>${m.moy}</strong></div>
          <div className="kpi"><span className="pix">Affaires criminelles</span><strong>${m.criminel}</strong></div>
        </div>
        ${c.hist.length > 0 && html`<ul className="log-list">${c.hist.slice().reverse().map((h, i) => html`<li key=${i}><span className="small muted">${CR.fmtDate(h.day, "long")}</span> — ${CAR.GRADES[h.grade].t}</li>`)}</ul>`}
      </${UI.Section}>
    </div>`;
  };
})();
