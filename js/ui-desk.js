/* La Permanence — le bureau : en-tête, navigation, panneaux */
(function () {
  const CR = window.CR;
  const UI = CR.UI;
  const { html, Icon, Portrait, Meter, Money, Paper, Carnet, Btn, Tag, Empty, cx } = UI;
  const { useState, useEffect, useRef, useMemo } = React;
  const bump = () => CR.store.bump();

  // =================================================================== Conseils du mentor (première rencontre)
  CR.COACH = {
    bureau: "Votre bureau. L'horloge tourne à chaque action : lire, appeler, rédiger, vous déplacer. Le soir et la nuit fatiguent davantage. « Finir la journée » vous envoie dormir ; « Avancer » saute jusqu'au prochain événement.",
    messagerie: "Le greffe, les confrères, les clients vous écrivent ici. Ouvrir un message non lu prend du temps : vous le lisez. Dans une pièce, cliquez une phrase pour la surligner, la noter, la relever comme irrégularité ou l'inscrire à l'agenda. Le jeu ne signale rien : lisez les heures, les mentions, les signatures, et comparez les pièces.",
    enquete: "La défense ne perquisitionne pas et ne saisit rien, mais elle enquête : retrouver un témoin et recueillir son attestation, faire conserver des images avant leur effacement (un mois au plus, souvent moins), faire relire une expertise. Le temps et l'argent sont les vôtres ; le délai d'effacement, lui, n'attend personne.",
    telephone: "Votre portable sonne partout, même à 2 heures du matin si vous êtes de permanence. Un appel manqué devient un message vocal.",
    dossiers: "Chaque dossier a ses actions, votre carnet, ses pièces, les irrégularités que vous avez relevées et l'état de la procédure. Aucun délai n'y est affiché : c'est à vous de compter.",
    agenda: "L'agenda ne contient que ce que vous y inscrivez. Un délai qui expire un samedi, un dimanche ou un jour férié est prorogé au premier jour ouvrable suivant (art. 801 du code de procédure pénale).",
    carte: "Paris et sa périphérie ; les établissements plus lointains sont signalés au bord du plan, avec la route qui y mène et la distance. Chaque trajet coûte du temps ; le taxi va plus vite et coûte de l'argent. Greffes et parloirs ont leurs horaires : arriver trop tard, c'est revenir le lendemain pendant que le délai court.",
    bibliotheque: "Les textes et les fiches du code du jeu. Un texte lu s'enregistre dans un dossier : il reste dans le panneau de l'affaire pendant les entretiens et la rédaction, et à côté de vous à l'audience. Un texte que vous n'avez pas enregistré pendant la préparation n'est pas à la barre. Les textes sont à revérifier sur Légifrance avant tout usage réel.",
    saisie: "Les articles se tapent : choisissez le code dans le menu, tapez le numéro (63-1, R. 625-1, 434-15 bis), vérifiez ce que le jeu a compris, puis citez. Un numéro inconnu est une faute de frappe, sans pénalité. Un article voisin ou un mauvais code coûtent peu ; un article faux ou absent fait tomber le point. Le mode se règle dans le menu : assisté, libre, examen ou liste.",
    entretien: "Un entretien : chaque question coûte des minutes. Cliquez sur une phrase de votre interlocuteur pour la noter. Quand vous raccrochez, il ne reste que votre carnet.",
    redaction: "Un gabarit d'acte : cliquez sur un blanc, puis choisissez la ligne de votre carnet ou la formule qui convient. Un blanc mal rempli devient un défaut que le moteur sanctionne, parfois des semaines plus tard.",
    audience: "L'audience se joue en direct. Ordre de parole : la partie civile, puis les réquisitions du parquet, puis la défense ; le prévenu a toujours la parole en dernier (art. 460). Demandez la parole quand quelqu'un se trompe ; ne coupez pas un président sans raison.",
    limine: "Les exceptions de nullité se soulèvent avant toute défense au fond. Devant le tribunal correctionnel, hors comparution immédiate, elles doivent avoir été déposées au greffe trois jours avant l'audience (art. 385).",
    plaidoirie: "Construisez votre plaidoirie : un angle, puis vos arguments dans l'ordre. Un argument pertinent, appuyé sur une pièce ou un texte de votre main, pèse. Un argument hors sujet coûte de la crédibilité.",
    gav: "Garde à vue : l'entretien confidentiel dure trente minutes au plus (art. 63-4). Vous pouvez consulter la notification des droits, le certificat médical et les procès-verbaux d'audition de votre client, prendre des notes, mais pas de copie (art. 63-4-1). Lisez les heures.",
    debrief: "Le débrief : la décision, le corrigé façon cas pratique, les faits que vous avez manqués et vos erreurs avec leur régime. La fiche de révision rejoint votre classeur.",
    honoraires: "La convention d'honoraires est obligatoire, sauf urgence et aide juridictionnelle. Forfait ou temps passé ; un honoraire de résultat n'est permis qu'en complément (art. 10 de la loi de 1971).",
  };

  // ce qu'on dit de vous (mode libre : pas de chiffre, une appréciation)
  CR.repDit = (k, v) => {
    const n = v >= 80 ? 4 : v >= 65 ? 3 : v >= 45 ? 2 : v >= 30 ? 1 : 0;
    return ({
      clients: ["Votre nom fait fuir les clients.", "On hésite à vous recommander.", "Quelques clients vous recommandent.", "On vous recommande volontiers.", "On vient vous voir de la part d'anciens clients."],
      confreres: ["Les confrères vous évitent.", "Au vestiaire, on parle de vos faux pas.", "On vous connaît peu au barreau.", "Les confrères vous estiment.", "On vous passe des dossiers."],
      siege: ["Les juges se méfient de vos écritures.", "Le siège vous trouve approximatif.", "Le siège ne vous connaît pas encore.", "Le siège vous écoute.", "Le siège vous tient pour sérieux."],
      parquet: ["Le parquet ne vous fait aucun crédit.", "Le parquet vous trouve peu fiable.", "Le parquet ne vous connaît pas encore.", "Le parquet vous trouve fiable.", "Le parquet vous fait confiance."],
    }[k] || ["", "", "", "", ""])[n];
  };

  // =================================================================== En-tête
  UI.HUD = ({ s, onMenu, onNav }) => {
    const hol = CR.holidayName(s.day);
    const weekend = CR.isWeekend(s.day);
    const duty = CR.dutyOn(s, s.day);
    return html`<header className="hud">
      <div className="hud-brand"><span className="hud-firm">${s.player.cabinet}</span><span className="hud-name">Me ${s.player.prenom} ${s.player.nom}${CR.CAR && CR.CAR.titre(s) ? " · " + CR.CAR.titre(s) : ""}</span></div>
      <div className="hud-clock">
        <span className="pix">${CR.fmtDate(s.day)}</span>
        <span className="hud-time">${CR.fmtTime(s.min)}${s.night ? html` <${Tag} tone="warn">Nuit</${Tag}>` : hol ? html` <${Tag} tone="brass">${hol}</${Tag}>` : weekend ? html` <${Tag}>Week-end</${Tag}>` : null}${duty.length ? html` <${Tag} tone="brass" title=${duty.map((d) => CR.DUTY_LABEL[d.type]).join(", ")}>Permanence</${Tag}>` : null}</span>
      </div>
      <button className="hud-stat hud-where" onClick=${() => onNav("carte")} title="Où vous êtes">
        <span className="pix lbl"><${Icon} n="pin" /> Lieu</span><span className="hud-place">${CR.whereLabel(s)}</span>
      </button>
      <div className="hud-stat" title=${"Énergie : " + CR.energyLabel(s.energy)}>
        <span className="pix lbl"><${Icon} n="bolt" /> ${CR.libre(s) ? "Vous êtes" : "Énergie"}</span>
        ${!CR.libre(s) && html`<${Meter} value=${s.energy} tone=${s.energy < 25 ? "bad" : s.energy < 50 ? "warn" : "ok"} />`}
        <span className="hud-sub">${CR.energyLabel(s.energy)}</span>
      </div>
      <button className="hud-stat hud-money" onClick=${() => onNav("cabinet")} title="Compte professionnel, CARPA, découvert">
        <span className="pix lbl">Compte</span><${Money} v=${s.cash} />
        <span className="hud-sub">CARPA ${CR.money(s.carpa)}${s.decouvert.used ? ` · découvert ${CR.money(s.decouvert.used)}` : ""}</span>
      </button>
      <button className="hud-reps" hidden=${CR.libre(s)} onClick=${() => onNav("cabinet", "rep")} title="Réputation">
        ${Object.entries(s.reps).map(([k, v]) => html`<div key=${k} className="rep-mini"><span className="pix">${CR.REP_LABEL[k]}</span><${Meter} value=${v} small /></div>`)}
      </button>
      <button className="icon-btn hud-menu" onClick=${onMenu} aria-label="Menu"><${Icon} n="menu" size=${20} /></button>
    </header>`;
  };

  // =================================================================== Décor
  // Le bandeau change avec le lieu : un décor par lieu (CR.dec), panorama sur toute la largeur, pluie, saison, heure.
  // Au cabinet, c'est une scène cliquable : ordinateur → messagerie, téléphone → décroche ou journal d'appels,
  // dossiers, bibliothèque, horloge → agenda, fenêtre → carte (objets déclarés dans S.hot, decor-int.js).
  UI.Stage = ({ s, onNav, onAnswer }) => {
    const o = CR.dec.stageOpts(s), name = CR.dec.sceneFor(s);
    const onHot = name === "cabinet" && onNav ? (id) => { if (id === "telephone" && s.ring && onAnswer) { onAnswer(true); return; } onNav(id); } : null;
    return html`<div className="stage">
      <${UI.Panorama} name=${name} opts=${o} onHot=${onHot} />
      <div className="stage-label pix">${CR.whereLabel(s)} · ${UI.timeOfDay(s.min)}${o.rain ? " · pluie" : ""}</div>
    </div>`;
  };

  // =================================================================== Navigation
  const NAV = [
    ["bureau", "desk", "Bureau"], ["messagerie", "inbox", "Messagerie"], ["telephone", "phone", "Téléphone"], ["dossiers", "cases", "Dossiers"],
    ["agenda", "calendar", "Agenda"], ["carte", "map", "Carte"], ["bibliotheque", "library", "Bibliothèque"], ["cabinet", "firm", "Cabinet"],
    ["classeur", "binder", "Classeur"], ["journal", "journal", "Journal"],
  ];
  UI.Rail = ({ s, panel, onNav }) => {
    const badge = { messagerie: CR.unreadCount(s), telephone: s.voicemails.filter((v) => !v.heard).length + (s.ring ? 1 : 0), cabinet: s.disc.open.filter((g) => !g.response).length };
    return html`<nav className="rail" aria-label="Navigation">${NAV.map(([id, ic, label]) => html`<button key=${id} className=${cx("rail-btn", panel === id && "on")} onClick=${() => onNav(id)} aria-current=${panel === id ? "page" : null}>
      <${Icon} n=${ic} size=${18} /><span>${label}</span>${badge[id] ? html`<b className="badge">${badge[id]}</b>` : null}
    </button>`)}</nav>`;
  };

  // =================================================================== Téléphone qui sonne
  UI.RingBar = ({ s, onAnswer }) => {
    if (!s.ring) return null;
    const r = s.ring;
    const cs = r.caseId ? s.cases[r.caseId] : null;
    const look = r.look || (cs ? CR.px.clientLook(CR.client(cs), cs.def) : CR.px.lookFrom(r.from));
    const sub = { lead: "Nouvel appel", greffe: "Le greffe", permanence: "Permanence pénale — commission d'office", client: cs ? CR.caseTitle(s, cs) : "" }[r.kind] || (cs ? CR.caseTitle(s, cs) : "");
    return html`<div className="ringbar" role="alert">
      <${Portrait} look=${look} size=${40} />
      <div className="ring-txt"><span className="pix">Appel entrant · ${CR.fmtTime(s.min)}</span><strong>${r.from}</strong><span>${sub}</span>${r.filtre && html`<span className="small ring-filtre">${r.filtre}</span>`}</div>
      <${Btn} kind="primary" icon="phone" onClick=${() => onAnswer(true)}>Répondre</${Btn}>
      <${Btn} onClick=${() => onAnswer(false)}>${r.prisPar ? `${r.prisPar} prend un message` : "Messagerie vocale"}</${Btn}>
    </div>`;
  };

  // =================================================================== BUREAU
  UI.TodayPanel = ({ s, go }) => {
    const today = CR.agendaOn(s, s.day);
    const upcoming = s.agenda.filter((a) => a.day > s.day && a.day <= s.day + 21);
    const overdue = s.agenda.filter((a) => a.day < s.day && a.day >= s.day - 7);
    const active = s.order.map((id) => s.cases[id]).filter((c) => c && ["active", "prospect", "lead"].includes(c.status));
    const hearings = CR.hearingsToday(s);
    const duty = CR.dutyOn(s, s.day);
    return html`<div className="panel today">
      <${UI.Coach} k="bureau" s=${s} />
      <div className="today-head">
        <div>
          <h2>${CR.cap(CR.fmtDate(s.day, "dow"))}</h2>
          <p className="muted">${CR.fmtTime(s.min)} · ${CR.isBusinessDay(s.day) ? "Juridictions ouvertes" : CR.holidayName(s.day) ? "Jour férié" : "Week-end"}${CR.isEvening(s) ? " · Travailler tard fatigue davantage" : ""}</p>
        </div>
        <div className="today-actions">
          ${s.night ? html`<${Btn} kind="primary" icon="moon" onClick=${() => go.backToBed()}>Retourner dormir</${Btn}>` : html`<${Btn} kind="primary" icon="moon" onClick=${() => go.endDay()}>Finir la journée</${Btn}>`}
          <${Btn} icon="clock" onClick=${() => { CR.spend(s, 30, "admin"); bump(); }} disabled=${CR.tooLate(s)} title="Classement, comptabilité, courriels : le temps passe.">Paperasse · 30 min</${Btn}>
          ${!s.night && html`<${Btn} icon="skip" onClick=${() => go.skip()} title="Se reposer jusqu'à ce que quelque chose réclame votre attention">Avancer</${Btn}>`}
        </div>
      </div>
      ${s.night && html`<div className="banner warn">Il est ${CR.fmtTime(s.min)}. Vous avez été réveillé par la permanence. Chaque heure passée debout est une heure de sommeil en moins.</div>`}
      ${s.burnout && html`<div className="banner bad">Arrêt de travail jusqu'au ${CR.fmtDate(s.burnout.until, "dow")}. Les appels vont sur la messagerie. Les délais continuent de courir.</div>`}
      ${s.lastMonthly && s.lastMonthly.day === s.day && html`<div className="banner">Les charges du mois sont parties ce matin : ${CR.money(s.lastMonthly.total)}. Compte professionnel : ${CR.money(s.cash)}.</div>`}
      ${s.lastDayStats && s.min === CR.DAY_START && !s.night && html`<p className="muted small">Vous avez dormi et récupéré ${Math.round(s.lastDayStats.rec)} points d'énergie.</p>`}
      ${duty.length > 0 && html`<div className="banner">${duty.map((d) => CR.DUTY_LABEL[d.type]).join(" · ")} : gardez votre téléphone à portée de main.</div>`}
      ${UI.CassationBandeau && html`<${UI.CassationBandeau} s=${s} go=${go} />`}
      <div className="grid2">
        <${UI.Section} title="Aujourd'hui">
          ${hearings.map(({ c, h }) => html`<div key=${h.id} className="court-call">
            <${Icon} n="gavel" /><div><strong>${h.title}</strong><div className="muted small">${CR.caseTitle(s, c)} · ${CR.fmtTime(h.min)} · ${h.where || ""}</div></div>
            <${Btn} kind="primary" onClick=${() => go.runTask(c, { id: "court", kind: "court", label: h.title, enabled: true, where: h.lieu || "palais", run: () => ({ scene: h.scene || "court", hid: h.id }) })}>Y aller</${Btn}>
          </div>`)}
          ${today.length ? today.map((a) => html`<${AgendaRow} key=${a.id} a=${a} s=${s} go=${go} />`) : !hearings.length && html`<${Empty}>Rien à l'agenda. L'agenda ne contient que ce que vous y mettez.</${Empty}>`}
          ${overdue.length > 0 && html`<div className="sub-head">Cette semaine, déjà passé</div>`}
          ${overdue.map((a) => html`<${AgendaRow} key=${a.id} a=${a} s=${s} go=${go} past />`)}
        </${UI.Section}>
        <${UI.Section} title="À venir" right=${html`<button className="link" onClick=${() => go.nav("agenda")}>Agenda</button>`}>
          ${upcoming.length ? upcoming.slice(0, 10).map((a) => html`<${AgendaRow} key=${a.id} a=${a} s=${s} go=${go} />`) : html`<${Empty}>Rien dans les trois semaines.</${Empty}>`}
        </${UI.Section}>
      </div>
      <${UI.Section} title="Vos dossiers">
        ${active.length === 0 && html`<${Empty}>Aucun dossier pour l'instant. Le téléphone va sonner.</${Empty}>`}
        <div className="matter-list">
          ${active.map((c) => html`<button key=${c.id} className="matter" onClick=${() => go.openCase(c.id)}>
            <${Portrait} look=${CR.px.clientLook(CR.client(c), c.def)} size=${36} blink=${false} />
            <div className="matter-txt"><strong>${CR.caseTitle(s, c)}</strong><span className="muted small">${c.camp === "pc" ? "Partie civile · " : "Défense · "}${statusLabel(c)}</span></div>
            <${Mood} c=${c} />
          </button>`)}
        </div>
      </${UI.Section}>
      <div className="inbox-glance">
        <button className="glance" onClick=${() => go.nav("messagerie")}><${Icon} n="inbox" /> ${CR.plural(CR.unreadCount(s), "non lu", "non lus")}</button>
        <button className="glance" onClick=${() => go.nav("telephone")}><${Icon} n="phone" /> ${CR.plural(s.voicemails.filter((v) => !v.heard).length, "message vocal", "messages vocaux")}</button>
        ${s.detenus.length > 0 && html`<button className="glance" onClick=${() => go.nav("carte")}><${Icon} n="pin" /> ${CR.plural(s.detenus.length, "client détenu", "clients détenus")}</button>`}
        ${s.disc.open.length > 0 && html`<button className="glance bad" onClick=${() => go.nav("cabinet", "disc")}><${Icon} n="warn" /> ${CR.plural(s.disc.open.length, "réclamation")} au bâtonnier</button>`}
      </div>
    </div>`;
  };
  function statusLabel(c) {
    if (c.status === "lead") return "Message laissé — à rappeler";
    if (c.status === "prospect") return c.fee ? "Honoraires convenus — convention à signer" : "Premier entretien fait";
    return CR.PROC.stadeLabel(c) || c.stage || "En cours";
  }
  UI.statusLabel = statusLabel;
  const Mood = ({ c }) => {
    if (c.status !== "active") return null;
    const t = c.trust;
    return html`<span className=${cx("mood", t > 65 ? "ok" : t > 35 ? "warn" : "bad")} title="Confiance du client">${t > 65 ? "Confiant" : t > 35 ? "Inquiet" : "Mécontent"}</span>`;
  };
  UI.Mood = Mood;
  const AgendaRow = ({ a, s, go, past }) => {
    const c = a.caseId ? s.cases[a.caseId] : null;
    const days = a.day - s.day;
    return html`<div className=${cx("agenda-row", past && "past", days <= 2 && days >= 0 && "soon")}>
      <div className="agenda-date"><span className="pix">${UI.relDay(s, a.day)}</span>${a.min != null && html`<span className="small">${CR.fmtTime(a.min)}</span>`}</div>
      <div className="agenda-txt"><strong>${a.title}</strong>${c && html`<button className="link small" onClick=${() => go.openCase(c.id)}>${CR.caseTitle(s, c)}</button>`}</div>
      ${days > 0 && html`<span className="agenda-left small">J−${days}</span>`}
    </div>`;
  };

  // =================================================================== MESSAGERIE
  const KIND = { greffe: "Greffe", courrier: "Courrier", email: "Courriel", sms: "SMS", presse: "Presse", ordre: "Ordre", note: "Note", pv: "PV" };
  UI.InboxPanel = ({ s, go, sel, setSel }) => {
    const [filter, setFilter] = useState("all");
    const list = s.inbox.filter((m) => filter === "all" || (filter === "unread" ? !m.read : filter === "greffe" ? ["greffe", "ordre"].includes(m.kind) : filter === "dossiers" ? m.caseId && !["presse"].includes(m.kind) : filter === "presse" ? ["presse", "sms"].includes(m.kind) && !m.caseId : true));
    const m = s.inbox.find((x) => x.id === sel);
    return html`<div className="panel">
      <${UI.Coach} k="messagerie" s=${s} />
      <div className="split">
        <div className="list-pane">
          <div className="chips">${[["all", "Tout"], ["unread", "Non lus"], ["greffe", "Greffe et Ordre"], ["dossiers", "Dossiers"], ["presse", "Nouvelles"]].map(([k, l]) => html`<button key=${k} className=${cx("chip", filter === k && "on")} onClick=${() => setFilter(k)}>${l}</button>`)}</div>
          <ul className="mail-list">
            ${list.length === 0 && html`<li className="empty">Aucun message.</li>`}
            ${list.map((x) => html`<li key=${x.id}><button className=${cx("mail", !x.read && "unread", sel === x.id && "on", x.important && "important")} onClick=${() => { if (!x.read) { CR.readMail(s, x.id); bump(); } setSel(x.id); }}>
              <span className=${cx("kind", "k-" + x.kind)}>${KIND[x.kind] || "Courrier"}</span>
              <span className="mail-from">${x.from}</span>
              <span className="mail-subj">${x.subject}</span>
              <span className="mail-date small">${UI.relDay(s, x.day)}</span>
            </button></li>`)}
          </ul>
        </div>
        <div className="read-pane">${m ? html`<${MailReader} s=${s} m=${m} go=${go} />` : html`<${Empty}>Choisissez un message. Ouvrir un message non lu prend du temps : vous le lisez.</${Empty}>`}</div>
      </div>
    </div>`;
  };
  const MailReader = ({ s, m, go }) => {
    const cs = m.caseId ? s.cases[m.caseId] : null;
    let doc;
    if (m.docId && cs) {
      const d = cs.docs.find((x) => x.id === m.docId);
      doc = d ? CR.renderDoc(s, cs, d) : null;
      if (doc) doc = Object.assign({}, doc, { paras: UI.segmentize(doc.paras), hid: d.vars && d.vars.hid, ref: { doc: d.id, key: d.key, titre: d.title } });
    } else doc = { title: m.subject, paras: UI.segmentize(m.body || []), kind: m.kind === "note" ? "note" : m.kind === "sms" ? "sms" : null, ref: { mail: m.id, titre: m.subject } };
    return html`<div className="reader">
      <div className="reader-head">
        <div><span className=${cx("kind", "k-" + m.kind)}>${KIND[m.kind] || "Courrier"}</span> <strong>${m.from}</strong> <span className="muted small">${CR.fmtDate(m.day)} · ${CR.fmtTime(m.min)}</span></div>
        <div className="reader-actions">
          <${Btn} small icon="calendar" onClick=${() => go.agenda({ caseId: m.caseId, title: m.subject, ref: doc && doc.hid })}>Inscrire à l'agenda</${Btn}>
          ${cs && html`<${Btn} small icon="cases" onClick=${() => go.openCase(cs.id)}>Ouvrir le dossier</${Btn}>`}
          ${m.grievance && s.disc.open.find((g) => g.id === m.grievance && !g.response) && html`<${Btn} small kind="primary" onClick=${() => go.scene({ type: "grievance", gid: m.grievance })}>Répondre au bâtonnier</${Btn}>`}
          ${m.action && cs && html`<${Btn} small kind="primary" onClick=${() => { const r = CR.runHook(s, cs, m.action.hook, m.action.data || {}); if (r && r.scene) go.scene(Object.assign({ caseId: cs.id, type: r.scene }, r)); bump(); }}>${m.action.label}</${Btn}>`}
        </div>
      </div>
      <h3 className="reader-subj">${m.subject}</h3>
      <${DocView} s=${s} cs=${cs} doc=${doc} go=${go} kind=${m.kind} />
    </div>`;
  };
  UI.MailReader = MailReader;

  // Une phrase d'une pièce : surligner, noter, relever une irrégularité (qualifiée, envoyée au bloc-notes), agenda.
  // refInfo : { doc, key, titre, hid } de la pièce. Utilisé par les pièces du dossier, la messagerie et la garde à vue.
  UI.SegPop = ({ s, cs, seg, refInfo, x, y, src, onClose, go }) => {
    const [form, setForm] = useState(false);
    const [type, setType] = useState("autre");
    const [avec, setAvec] = useState("");
    const [comment, setComment] = useState("");
    const text = CR.segText(seg);
    const surl = !!cs && CR.isSurl(cs, text);
    const deja = !!cs && cs.issues.some((i) => i.text === text);
    const autres = cs ? (cs.surl || []).filter((h) => h.t !== text) : [];
    const style = { left: Math.max(0, Math.min(x, 420)), top: y };
    if (form) return html`<div className="pop pop-form" style=${style}>
      <p className="pop-quote small">« ${text.length > 140 ? text.slice(0, 137) + "…" : text} »</p>
      <span className="pix">Ce qui ne va pas</span>
      <div className="pop-types">${CR.IRREG_TYPES.map(([k, l]) => html`<button key=${k} type="button" className=${cx("nchip", type === k && "on")} onClick=${() => setType(k)}>${l}</button>`)}</div>
      ${type === "incoherence" && (autres.length ? html`<label className="small pop-avec">À comparer avec <select aria-label="Passage à comparer" value=${avec} onChange=${(e) => setAvec(e.target.value)}><option value="">— un passage surligné —</option>${autres.map((h) => html`<option key=${h.id} value=${h.id}>${(h.ref && h.ref.titre ? h.ref.titre + " : " : "") + (h.t.length > 60 ? h.t.slice(0, 57) + "…" : h.t)}</option>`)}</select></label>` : html`<p className="small muted">Surlignez d'abord le passage de l'autre pièce, puis revenez ici.</p>`)}
      <textarea rows="2" aria-label="Votre remarque" placeholder="Votre remarque (facultatif)" value=${comment} onChange=${(e) => setComment(e.target.value)}></textarea>
      <div className="pop-row"><${Btn} small kind="primary" onClick=${() => { CR.releverIrreg(s, cs, { seg, ref: refInfo, type, avec: avec || null, comment }); bump(); onClose(); }}>Envoyer au bloc-notes</${Btn}><${Btn} small onClick=${() => setForm(false)}>Annuler</${Btn}></div>
    </div>`;
    return html`<div className="pop" style=${style}>
      ${cs && html`<button onClick=${() => { if (surl) CR.desurligner(cs, text); else CR.surligner(s, cs, seg, refInfo); bump(); onClose(); }}><${Icon} n="pen" /> ${surl ? "Retirer le surlignage" : "Surligner"}</button>`}
      ${cs && html`<button onClick=${() => { CR.addNote(s, cs, { text, fact: typeof seg === "object" ? seg.f || null : null, src: src || "doc" }); bump(); onClose(); }}><${Icon} n="pen" /> Noter dans le carnet</button>`}
      ${cs && !deja && html`<button onClick=${() => setForm(true)}><${Icon} n="flag" /> Relever une irrégularité</button>`}
      ${cs && deja && html`<span className="pop-info small">Irrégularité déjà relevée.</span>`}
      ${go && html`<button onClick=${() => { go.agenda({ caseId: cs && cs.id, title: text.slice(0, 80), ref: refInfo && refInfo.hid }); onClose(); }}><${Icon} n="calendar" /> Inscrire à l'agenda…</button>`}
    </div>`;
  };
  // Mode assisté (réglage facultatif) : un indice de méthode, puis un indice propre à la pièce, après un temps de lecture
  UI.IndiceBox = ({ s, cs, doc, k }) => {
    const on = !!(cs && k && CR.indicesOn(s));
    const [lu, setLu] = useState(() => (cs && cs.lu && cs.lu[k]) || 0);
    useEffect(() => { setLu((cs && cs.lu && cs.lu[k]) || 0); }, [k]);
    useEffect(() => {
      if (!on) return;
      const t = setInterval(() => setLu(CR.lecture(cs, k, 5)), 5000);
      return () => clearInterval(t);
    }, [on, k]);
    if (!on || lu < CR.INDICE_T1) return null;
    const spec = lu >= CR.INDICE_T2 ? CR.indicesPiece(cs, doc) : [];
    return html`<div className="indice" role="note"><span className="pix">Indice · mode assisté</span><p>${CR.INDICE_METHODE}</p>${spec.map((t, i) => html`<p key=${i}>${t}</p>`)}</div>`;
  };
  // Une pièce lue au bureau. Dossier de travail (lot 2) : cliquer une phrase la propose entière ; sélectionner à la souris
  // annote au mot près ; cliquer une annotation la rouvre (UI.SegPop, ui-travail.js).
  const DocView = ({ s, cs, doc, go, kind }) => {
    const [pop, setPop] = useState(null);
    const selT = useRef(0);
    const posPop = (el) => {
      const r = el.getBoundingClientRect();
      const host = el.closest(".docview").getBoundingClientRect();
      return { x: r.left - host.left, y: r.bottom - host.top + 4 };
    };
    const onSeg = (seg, e) => {
      if (Date.now() - selT.current < 400) return; // la sélection vient d'ouvrir la fenêtre
      const el = e.currentTarget, mk = e.target.closest && e.target.closest("[data-an]");
      const p = +el.dataset.p, sI = +el.dataset.s, t = CR.segText(seg) ? (typeof seg === "string" ? seg : seg.t) : "";
      const range = isNaN(p) ? null : { debut: { p, s: sI, o: 0 }, fin: { p, s: sI, o: t.length } };
      setPop(Object.assign({ seg, range, annot: mk ? mk.dataset.an : null }, posPop(el)));
    };
    // sélection libre : la position (paragraphe, phrase, caractère) de chaque bout de la sélection
    const posDe = (node, off) => {
      const el = (node.nodeType === 3 ? node.parentElement : node).closest(".seg");
      if (!el || el.dataset.p == null) return null;
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n = 0, x;
      while ((x = w.nextNode())) { if (x === node) return { p: +el.dataset.p, s: +el.dataset.s, o: n + off, el }; n += x.textContent.length; }
      return node === el ? { p: +el.dataset.p, s: +el.dataset.s, o: 0, el } : null;
    };
    const onUp = () => {
      const sel = window.getSelection && window.getSelection();
      if (!sel || sel.isCollapsed || !sel.anchorNode) return;
      const a = posDe(sel.anchorNode, sel.anchorOffset), b = posDe(sel.focusNode, sel.focusOffset);
      if (!a || !b) return;
      selT.current = Date.now();
      const range = { debut: { p: a.p, s: a.s, o: a.o }, fin: { p: b.p, s: b.s, o: b.o } };
      setPop(Object.assign({ seg: null, range }, posPop(b.el)));
    };
    const ref = doc && doc.ref;
    const k = ref && (ref.doc || ref.mail);
    const vig = CR.dec && CR.dec.docScene ? CR.dec.docScene(doc) : null;
    return html`<div className="docview" onMouseUp=${onUp} onClick=${(e) => { if (!e.target.closest(".seg") && !e.target.closest(".pop") && Date.now() - selT.current > 400) setPop(null); }}>
      ${vig && html`<div className="doc-vignette"><${UI.Panorama} name=${vig} opts=${Object.assign(CR.dec.stageOpts(s), { nom: "" })} /></div>`}
      <${Paper} doc=${doc} cs=${cs} interactive=${true} onSeg=${onSeg} kind=${kind} />
      <${UI.IndiceBox} s=${s} cs=${cs} doc=${doc} k=${k} />
      ${pop && html`<${UI.SegPop} key=${JSON.stringify(pop.range) + (pop.annot || "")} s=${s} cs=${cs} seg=${pop.seg} doc=${doc} range=${pop.range} annotId=${pop.annot} refInfo=${Object.assign({ hid: doc.hid }, ref)} x=${pop.x} y=${pop.y} go=${go} onClose=${() => { setPop(null); if (window.getSelection) window.getSelection().removeAllRanges(); }} />`}
    </div>`;
  };
  UI.DocView = DocView;

  // =================================================================== TÉLÉPHONE
  UI.PhonePanel = ({ s, go }) => {
    const people = s.order.map((id) => s.cases[id]).filter((c) => c && ["lead", "prospect", "active"].includes(c.status));
    return html`<div className="panel phone">
      <${UI.Coach} k="telephone" s=${s} />
      <div className="grid2">
        <${UI.Section} title="Messagerie vocale">
          ${s.voicemails.length === 0 && html`<${Empty}>Aucun message.</${Empty}>`}
          <ul className="vm-list">${s.voicemails.slice(0, 20).map((v) => html`<li key=${v.id} className=${cx("vm", !v.heard && "new")}>
            <div className="vm-head"><strong>${v.from}</strong><span className="small muted">${UI.relDay(s, v.day)} · ${CR.fmtTime(v.min)}</span></div>
            <p className="vm-text">${v.heard ? v.text : html`<button className="link" onClick=${() => { v.heard = true; CR.spend(s, 1, "admin", { fixed: true }); bump(); }}>${v.taken ? `▶ Lire le message pris par ${v.prisPar || "l'assistante"}` : "▶ Écouter le message"}</button>`}</p>
            ${v.heard && v.caseId && s.cases[v.caseId] && s.cases[v.caseId].status !== "closed" && v.kind !== "greffe" && html`<${Btn} small icon="phone" onClick=${() => go.callCase(v.caseId, v)}>Rappeler</${Btn}>`}
          </li>`)}</ul>
        </${UI.Section}>
        <${UI.Section} title="Contacts">
          <ul className="contact-list">
            ${people.map((c) => html`<li key=${c.id}><${Portrait} look=${CR.px.clientLook(CR.client(c), c.def)} size=${32} blink=${false} /><div><strong>${CR.caseDef(c).caller || CR.clientName(c)}</strong><span className="small muted">${CR.caseTitle(s, c)}</span></div><${Btn} small icon="phone" onClick=${() => go.callCase(c.id)}>Appeler</${Btn}></li>`)}
            <li><${Portrait} look=${Object.assign({}, CR.px.lookFrom("mentor", CR.MENTOR.look), CR.MENTOR.look)} size=${32} blink=${false} /><div><strong>${CR.MENTOR.nom}</strong><span className="small muted">${CR.MENTOR.blurb}</span></div><${Btn} small icon="phone" onClick=${() => go.scene({ type: "mentor" })}>Appeler</${Btn}></li>
          </ul>
        </${UI.Section}>
      </div>
      <${UI.Section} title="Derniers appels">
        ${s.callLog.length === 0 ? html`<${Empty}>Pas encore d'appel.</${Empty}>` : html`<ul className="log-list">${s.callLog.slice(0, 12).map((l, i) => html`<li key=${i}><span className="small muted">${CR.fmtDate(l.day, "short")}</span> ${l.text}</li>`)}</ul>`}
      </${UI.Section}>
    </div>`;
  };

  // =================================================================== DOSSIERS
  UI.CasesPanel = ({ s, go, caseId, setCase }) => {
    const [tab, setTab] = useState("open");
    if (caseId && s.cases[caseId]) return html`<${UI.CaseFile} s=${s} cs=${s.cases[caseId]} go=${go} onBack=${() => setCase(null)} />`;
    const all = s.order.map((id) => s.cases[id]).filter(Boolean);
    const groups = { open: all.filter((c) => ["active", "prospect", "lead"].includes(c.status)), closed: all.filter((c) => c.status === "closed") };
    return html`<div className="panel">
      <${UI.Coach} k="dossiers" s=${s} />
      <div className="chips"><button className=${cx("chip", tab === "open" && "on")} onClick=${() => setTab("open")}>En cours (${groups.open.length})</button><button className=${cx("chip", tab === "closed" && "on")} onClick=${() => setTab("closed")}>Clos (${groups.closed.length})</button></div>
      ${groups[tab].length === 0 && html`<${Empty}>${tab === "open" ? "Aucun dossier en cours." : "Aucun dossier clos."}</${Empty}>`}
      <div className="case-grid">
        ${groups[tab].map((c) => html`<button key=${c.id} className="case-card" onClick=${() => setCase(c.id)}>
          <div className="case-card-top"><${Portrait} look=${CR.px.clientLook(CR.client(c), c.def)} size=${44} blink=${false} /><div><strong>${CR.caseTitle(s, c)}</strong><span className="small muted">${CR.clientName(c)} · ${c.camp === "pc" ? "partie civile" : "défense"}</span></div></div>
          <div className="case-card-foot"><span className="small">${c.status === "closed" ? CR.outcomeLabel(c.outcome) : statusLabel(c)}</span><${Mood} c=${c} /></div>
        </button>`)}
      </div>
    </div>`;
  };

  UI.TaskButton = ({ s, cs, t, go }) => {
    const pl = t.where && t.where !== s.at ? CR.placeOf(s, t.where) : null;
    const travel = pl ? CR.travelTime(s, s.at, t.where, "metro") : 0;
    return html`<button className=${cx("task", t.urgent && "urgent", t.danger && "danger", !t.enabled && "off")} disabled=${!t.enabled} onClick=${() => go.runTask(cs, t)}>
      <span className="task-ico"><${Icon} n=${{ draft: "pen", call: "phone", meet: "user", admin: "check", research: "library", court: "gavel", travel: "walk" }[t.kind] || "check"} /></span>
      <span className="task-txt"><strong>${t.label}</strong><span className="small muted">${t.enabled ? t.sub : t.why || t.sub}</span>${pl && html`<span className="small task-where"><${Icon} n="pin" /> ${pl.nom} · ${travel} min de trajet</span>`}</span>
      ${t.time ? html`<span className="task-time small">${CR.fmtDuration(t.time)}</span>` : null}
    </button>`;
  };

  UI.CaseFile = ({ s, cs, go, onBack }) => {
    const [tab, setTab] = useState(cs.status === "closed" ? "debrief" : "actions");
    const [docSel, setDocSel] = useState(null);
    const [lecteur, setLecteur] = useState(false); // le dossier lu en feuillets (ui-dossier.js)
    const c = CR.client(cs);
    const tasks = CR.caseTasks(s, cs);
    const textes = CR.pinnedTexts(s, cs);
    const tabs = [["actions", "Actions"], ["carnet", `Bloc-notes (${cs.notes.length})`], ["textes", `Textes (${textes.length})`], ["pieces", `Pièces (${cs.docs.length})`], ["travail", `Dossier de travail (${(cs.travail && cs.travail.annots.length) || 0})`], ["irreg", `Irrégularités (${cs.issues.length})`], ["enquete", "Enquête"], ["proc", "Procédure"], ["chrono", "Historique"]];
    if (cs.status === "closed" && cs.debrief) tabs.unshift(["debrief", "Débrief"]);
    const pres = CR.acteur(cs.actors.president);
    return html`<div className="panel casefile">
      <div className="cf-head">
        <button className="icon-btn" onClick=${onBack} aria-label="Retour"><${Icon} n="back" /></button>
        <${Portrait} look=${CR.px.clientLook(c, cs.def)} size=${64} />
        <div className="cf-title">
          <h2>${CR.caseTitle(s, cs)}</h2>
          <div className="muted small">${c.prenom} ${c.nom}${c.age ? `, ${c.age} ans` : ""}${c.metier ? ` · ${c.metier}` : ""}${c.tel ? ` · ${c.tel}` : ""}</div>
          <div className="cf-tags">
            <${Tag} tone=${cs.status === "active" ? "ok" : cs.status === "closed" ? "" : "brass"}>${cs.status === "closed" ? CR.outcomeLabel(cs.outcome) : statusLabel(cs)}</${Tag}>
            <${Tag}>${cs.camp === "pc" ? "Partie civile" : "Défense"}</${Tag}>
            ${cs.aj && html`<${Tag}>Aide juridictionnelle</${Tag}>`}
            ${cs.fee && html`<${Tag}>${CR.offerShort(cs.fee)}</${Tag}>`}
            ${pres && html`<${Tag}>${pres.nom}</${Tag}>`}
            ${CR.caseDef(cs) && CR.caseDef(cs).code && html`<${UI.CodeAffaire} code=${CR.caseDef(cs).code} />`}
          </div>
        </div>
        ${cs.status === "active" && !CR.libre(s) && html`<div className="cf-trust"><span className="pix">Confiance du client</span><${Meter} value=${cs.trust} tone=${cs.trust > 65 ? "ok" : cs.trust > 35 ? "warn" : "bad"} /></div>`}
      </div>
      <div className="tabs" role="tablist">${tabs.map(([k, l]) => html`<button key=${k} role="tab" aria-selected=${tab === k} className=${cx("tab", tab === k && "on")} onClick=${() => { setTab(k); setDocSel(null); }}>${l}</button>`)}</div>
      ${tab === "actions" && html`<div className="tasks">
        ${tasks.length === 0 && html`<${Empty}>Rien à faire sur ce dossier pour l'instant.</${Empty}>`}
        ${tasks.map((t) => html`<${UI.TaskButton} key=${t.id} s=${s} cs=${cs} t=${t} go=${go} />`)}
        ${cs.status === "active" && UI.ConfierBox && ((s.staff || []).length > 0 || (s.team && s.team.taches.some((t) => t.caseId === cs.id))) ? html`<${UI.ConfierBox} s=${s} cs=${cs} />` : null}
        ${cs.costs > 0 || cs.collected > 0 || cs.fee ? html`<div className="cf-money small muted">${cs.facture ? `Facturé ${CR.money(cs.facture.total)} HT · ` : ""}${cs.fee && cs.fee.type === "temps" ? `Temps passé ${CR.fmtDuration(cs.worked || 0)} (${CR.money(Math.round(cs.fee.rate * (cs.worked || 0) / 60))} HT) · ` : ""}Frais avancés ${CR.money(cs.costs)} · Encaissé ${CR.money(cs.collected)}${s.carpaBy[cs.id] ? ` · En CARPA ${CR.money(s.carpaBy[cs.id])}` : ""}</div>` : null}
      </div>`}
      ${tab === "carnet" && html`<${Carnet} s=${s} cs=${cs} full=${true} title="Bloc-notes du dossier" onOpenLink=${(l) => { if (l.k === "doc") { setTab("pieces"); setDocSel(l.id); } else setTab("textes"); }} />`}
      ${tab === "textes" && html`<div className="cf-textes">
        <p className="small muted">Les textes enregistrés dans ce dossier vous suivent pendant les entretiens, la rédaction et l'audience. Au procès, seuls ceux-là sont à portée de main.${!cs.textesParDossier ? " (Dossier ouvert avant cette règle : tous vos textes lus y figurent.)" : ""}</p>
        ${cs.status !== "closed" && html`<${Btn} small icon="library" onClick=${() => go.scene({ type: "library", caseId: cs.id, area: CR.caseDef(cs).domaineLib })}>Chercher dans la bibliothèque</${Btn}>`}
        <${UI.TextesList} s=${s} cs=${cs} ids=${textes} onRemove=${cs.status !== "closed" ? (id) => { CR.unpinText(s, cs, id); bump(); } : null} />
      </div>`}
      ${tab === "pieces" && (docSel ? html`<div className="reader">
          <button className="link" onClick=${() => setDocSel(null)}>← Toutes les pièces</button>
          ${(() => { const d = cs.docs.find((x) => x.id === docSel); const doc = d ? CR.renderDoc(s, cs, d) : null; return doc ? html`<${DocView} s=${s} cs=${cs} doc=${Object.assign({}, doc, { paras: UI.segmentize(doc.paras), hid: d.vars && d.vars.hid, ref: { doc: d.id, key: d.key, titre: d.title } })} go=${go} kind=${d.dir === "out" ? "out" : doc.kind} />` : null; })()}
        </div>` : html`<div className="doc-lire">${UI.DossierReel && cs.docs.some((d) => d.dir !== "out") && html`<${Btn} small icon="cases" onClick=${() => setLecteur(true)}>Lire en feuillets</${Btn}>`}</div><ul className="doc-list">
          ${cs.docs.length === 0 && html`<li className="empty">Aucune pièce.</li>`}
          ${cs.docs.slice().reverse().sort((x, y) => (CR.TRAV && CR.TRAV.aOnglet(cs, y.id) ? 1 : 0) - (CR.TRAV && CR.TRAV.aOnglet(cs, x.id) ? 1 : 0)).map((d) => html`<li key=${d.id}><button className=${cx("doc-row", CR.TRAV && CR.TRAV.aOnglet(cs, d.id) && "doc-onglet")} onClick=${() => setDocSel(d.id)}><span className=${cx("dir", d.dir)}>${d.dir === "out" ? "Envoyé" : "Reçu"}</span><span>${d.title}</span><span className="small muted">${CR.fmtDate(d.day, "short")}</span></button></li>`)}
        </ul>`)}
      ${tab === "pieces" && lecteur && UI.DossierReel && (() => {
        // pièces reçues, dans l'ordre des cotes quand elles en ont, sinon dans l'ordre d'arrivée
        // la cote : celle de la pièce composée, sinon celle de son titre (« Exploitation vidéo (D11) »)
        const coteDe = (d, r) => (r && r.cote) || ((/\((D\d+)\)$/.exec(d.title) || [])[1]) || null;
        const recues = cs.docs.filter((d) => d.dir !== "out").map((d) => { const r = CR.renderDoc(s, cs, d); return { d, r, cote: coteDe(d, r) }; });
        const num = (x) => (x.cote ? +String(x.cote).replace(/\D/g, "") : 1e6 + x.d.day);
        recues.sort((a, b) => num(a) - num(b));
        const pr = ((recues.find((x) => x.r && x.r.bandeau) || {}).r || {}).bandeau;
        const proc = pr ? (pr.grille.find(([k]) => k === "Procédure") || [])[1] : null;
        const docs = recues.map((x) => UI.lecteurDe(x.r, { id: x.d.id, cote: x.cote, titre: x.d.title.replace(/ \(D\d+\)$/, ""), date: CR.fmtDate(x.d.day, "num").slice(0, 5), proc }));
        return html`<${UI.DossierReel} docs=${docs} proc=${proc} titre="Le dossier" sousTitre=${`${CR.caseTitle(s, cs)} · ${docs.length} pièces`} onClose=${(min) => { setLecteur(false); if (min > 0 && cs.status !== "closed") { CR.spend(s, min, "desk", { caseId: cs.id }); bump(); } }} />`;
      })()}
      ${tab === "irreg" && html`<div className="cf-irreg">
        <p className="small muted">Le jeu ne signale rien : c'est en lisant les pièces que vous trouvez ce qui cloche. Une nullité ne se soulève que sur ce que vous avez relevé ici.</p>
        <ul className="issue-list">
          ${cs.issues.length === 0 && html`<li className="empty">Rien de relevé. Dans une pièce, cliquez une phrase ou sélectionnez un passage, puis « Relever une irrégularité ».</li>`}
          ${cs.issues.map((i) => html`<li key=${i.id}><${Icon} n="flag" /> ${i.type ? html`<${Tag}>${CR.irregTypeLabel(i.type)}</${Tag}> ` : null}« ${i.text} »${i.avec ? html` <span className="small">— à comparer avec « ${i.avec} »</span>` : null}${i.comment ? html` <span className="small muted">${i.comment}</span>` : null}${i.article ? html` <span className="small">— art. ${i.article}${i.regime && CR.TRAV ? " · " + CR.TRAV.label(CR.TRAV.REGIMES, i.regime) : ""}${i.grief && CR.TRAV ? " · " + CR.TRAV.label(CR.TRAV.GRIEFS, i.grief).toLowerCase() : ""}</span>` : null} <span className="small muted">${i.ref && i.ref.titre ? i.ref.titre + " · " : ""}${CR.fmtDate(i.day, "short")}</span>${i.ref && i.ref.doc && cs.docs.some((d) => d.id === i.ref.doc) ? html` <button className="link small" onClick=${() => { setTab("pieces"); setDocSel(i.ref.doc); }}>voir la pièce</button>` : null} <button className="link small" onClick=${() => { const ir = cs.travail && cs.travail.irregs.find((z) => z.issue === i.id); if (ir) CR.TRAV.retirerIrreg(cs, ir.id); else CR.retirerIrreg(cs, i.id); bump(); }}>retirer</button></li>`)}
        </ul>
        ${cs.issues.length > 0 && cs.status !== "closed" && html`<p><${Btn} small icon="library" onClick=${() => go.scene({ type: "library", caseId: cs.id, focus: CR.planFocus(cs) })}>Chercher le fondement dans le code annoté</${Btn}></p>`}
        ${(cs.surl || []).length > 0 && html`<div className="sub-head">Passages surlignés</div><ul className="issue-list">${cs.surl.map((h) => html`<li key=${h.id}><span className="surl-mark">${h.t}</span> <span className="small muted">${h.ref && h.ref.titre ? h.ref.titre : ""}</span> <button className="link small" onClick=${() => { CR.desurligner(cs, h.t); bump(); }}>retirer</button></li>`)}</ul>`}
      </div>`}
      ${tab === "travail" && UI.TravailPanel && html`<${UI.TravailPanel} s=${s} cs=${cs} openDoc=${(id) => { setTab("pieces"); setDocSel(id); }} />`}
      ${tab === "enquete" && html`<${UI.EnquetePanel} s=${s} cs=${cs} openDoc=${(id) => { setTab("pieces"); setDocSel(id); }} />`}
      ${tab === "proc" && html`<div className="proc">
        <table className="tbl"><tbody>${CR.PROC.resume(s, cs).map(([k, v]) => html`<tr key=${k}><td className="muted">${k}</td><td>${v}</td></tr>`)}</tbody></table>
        <p className="small muted">Les délais ne sont pas affichés : à vous de les calculer et de les inscrire à l'agenda.</p>
        <div className="sub-head">Actes et décisions</div>
        <ul className="timeline">${(cs.proc ? cs.proc.events : []).slice().sort((a, b) => a.day - b.day).map((e, i) => html`<li key=${i}><span className="small muted">${CR.fmtDate(e.day, "short")}</span> ${e.text}</li>`)}</ul>
      </div>`}
      ${tab === "chrono" && html`<ul className="timeline">
        <li><span className="small muted">${CR.fmtDate(cs.opened, "short")}</span> Premier contact.</li>
        ${cs.timeline.map((t, i) => html`<li key=${i}><span className="small muted">${CR.fmtDate(t.day, "short")}</span> ${t.text}</li>`)}
      </ul>`}
      ${tab === "debrief" && cs.debrief && html`<${UI.DebriefBody} s=${s} cs=${cs} />`}
    </div>`;
  };

  // =================================================================== ENQUÊTE DE LA DÉFENSE (n° 2)
  UI.EnquetePanel = ({ s, cs, openDoc }) => {
    const L = CR.enqueteVisibles(s, cs);
    const ST = { attente: "En cours", obtenu: "Obtenu", perdu: "Trop tard" };
    return html`<div className="enq">
      <${UI.Coach} k="enquete" s=${s} />
      <p className="small muted">Retrouver un témoin, faire conserver des images avant leur effacement, faire contrôler une expertise : chaque démarche coûte du temps ou de l'argent. Les pistes apparaissent ici quand le client ou les pièces vous les révèlent.</p>
      ${L.length === 0 && html`<${Empty}>Aucune piste pour l'instant.</${Empty}>`}
      ${L.map((e) => {
        const st = CR.enqueteEtat(cs, e.id);
        const m = st && e.modes.find((x) => x.id === st.mode);
        const d = st && st.statut === "obtenu" && cs.docs.find((x) => x.key === e.doc);
        return html`<div key=${e.id} className=${cx("enq-card", st && "enq-" + st.statut)}>
          <div className="enq-head"><${Tag} tone="brass">${CR.ENQ_TYPES[e.type] || "Enquête"}</${Tag}><strong>${e.titre}</strong></div>
          <p className="small">${e.desc}</p>
          ${st ? html`<p className="small enq-st"><b>${ST[st.statut]}</b> — ${m ? m.label.toLowerCase() : "démarche"}, le ${CR.fmtDate(st.day, "short")}${st.statut === "attente" ? ` ; réponse attendue vers le ${CR.fmtDate(st.due, "short")}.` : st.statut === "obtenu" ? ` ; pièce reçue le ${CR.fmtDate(st.fin, "short")}.` : " ; les images n'existaient plus."}${d ? html` <button className="link small" onClick=${() => openDoc(d.id)}>Lire la pièce</button>` : null}</p>`
          : html`<div className="enq-modes">${e.modes.map((md) => { const ok = CR.enqueteModeOk(s, cs, md); return html`<button key=${md.id} className=${cx("task", !ok.ok && "off")} disabled=${!ok.ok} onClick=${() => { CR.enqueteLancer(s, cs, e.id, md.id); bump(); }}>
              <span className="task-ico"><${Icon} n=${md.argent ? "coin" : e.type === "temoin" ? "user" : e.type === "video" ? "clock" : "library"} /></span>
              <span className="task-txt"><strong>${md.label}</strong><span className="small muted">${ok.ok ? md.sub : ok.why}</span></span>
              <span className="task-time small">${md.argent ? CR.money(md.argent) : CR.fmtDuration(md.temps || 0)}</span>
            </button>`; })}</div>`}
        </div>`;
      })}
    </div>`;
  };

  // =================================================================== AGENDA
  UI.CalendarPanel = ({ s, go }) => {
    const [month, setMonth] = useState(CR.monthIndex(s.day));
    const y = Math.floor(month / 12), m = month % 12;
    const first = CR.dayOf(y, m + 1, 1);
    const startDow = (CR.dow(first) + 6) % 7;
    const daysIn = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 0; d < daysIn; d++) cells.push(first + d);
    return html`<div className="panel calendar">
      <${UI.Coach} k="agenda" s=${s} />
      <div className="cal-head">
        <button className="icon-btn" onClick=${() => setMonth(month - 1)} aria-label="Mois précédent"><${Icon} n="back" /></button>
        <h2>${CR.cap(CR.MONTHS[m])} ${y}</h2>
        <button className="icon-btn flip" onClick=${() => setMonth(month + 1)} aria-label="Mois suivant"><${Icon} n="back" /></button>
        <${Btn} small icon="plus" onClick=${() => go.agenda({})}>Nouvelle entrée</${Btn}>
      </div>
      <div className="cal-grid">
        ${["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."].map((d) => html`<div key=${d} className="cal-dow pix">${d}</div>`)}
        ${cells.map((d, i) => d == null ? html`<div key=${"x" + i} className="cal-cell blank"></div>` : html`<button key=${d} className=${cx("cal-cell", d === s.day && "today", d < s.day && "past", !CR.isBusinessDay(d) && "off")} onClick=${() => d >= s.day && go.agenda({ day: d })}>
          <span className="cal-num">${CR.ymd(d).d}</span>
          ${CR.holidayName(d) && html`<span className="cal-hol">${CR.holidayName(d)}</span>`}
          ${CR.agendaOn(s, d).slice(0, 3).map((a) => html`<span key=${a.id} className="cal-ev">${a.min != null ? CR.fmtTime(a.min).replace(" h 00", " h") + " " : ""}${a.title}</span>`)}
          ${CR.agendaOn(s, d).length > 3 && html`<span className="cal-more">+${CR.agendaOn(s, d).length - 3}</span>`}
        </button>`)}
      </div>
      <${UI.Section} title="Toutes les entrées à venir">
        ${s.agenda.filter((a) => a.day >= s.day).length === 0 && html`<${Empty}>Vide. Rien ne vous rappellera ce que vous n'y inscrivez pas.</${Empty}>`}
        <ul className="agenda-list">${s.agenda.filter((a) => a.day >= s.day).map((a) => html`<li key=${a.id}><span className="pix">${CR.fmtDate(a.day)}</span>${a.min != null ? " " + CR.fmtTime(a.min) : ""} — ${a.title}${a.caseId && s.cases[a.caseId] ? html` <span className="muted small">(${CR.caseTitle(s, s.cases[a.caseId])})</span>` : ""} <button className="link small" onClick=${() => { CR.removeAgenda(s, a.id); bump(); }}>supprimer</button></li>`)}</ul>
      </${UI.Section}>
    </div>`;
  };
  UI.AgendaDialog = ({ s, init, onClose }) => {
    const [date, setDate] = useState(CR.fmtDate(init.day != null ? init.day : s.day, "iso"));
    const [time, setTime] = useState("");
    const [title, setTitle] = useState(init.title || "");
    const [caseId, setCaseId] = useState(init.caseId || "");
    const open = s.order.map((id) => s.cases[id]).filter((c) => c && c.status !== "closed");
    const save = () => {
      const day = CR.parseISO(date);
      if (day == null || !title.trim()) return;
      let min = null;
      if (time) { const [h, mm] = time.split(":").map(Number); min = h * 60 + mm; }
      CR.addAgenda(s, { day, min, title: title.trim(), caseId: caseId || null, ref: init.ref || null });
      bump();
      onClose();
    };
    const day = CR.parseISO(date);
    return html`<${UI.Modal} title="Inscrire à l'agenda" onClose=${onClose} footer=${html`<${Btn} onClick=${onClose}>Annuler</${Btn}><${Btn} kind="primary" onClick=${save} disabled=${!title.trim() || day == null}>Enregistrer</${Btn}>`}>
      <form className="form" onSubmit=${(e) => { e.preventDefault(); save(); }}>
        <label htmlFor="ag-date">Date</label>
        <input id="ag-date" type="date" value=${date} min=${CR.fmtDate(s.day, "iso")} onChange=${(e) => setDate(e.target.value)} />
        ${day != null && html`<p className="small muted">${CR.cap(CR.fmtDate(day, "dow"))}${!CR.isBusinessDay(day) ? (CR.holidayName(day) ? ` — ${CR.holidayName(day)}, jour férié` : " — week-end") : ""} · ${day - s.day >= 0 ? `dans ${CR.plural(day - s.day, "jour")}` : "passé"}</p>`}
        <label htmlFor="ag-time">Heure (facultatif)</label>
        <input id="ag-time" type="time" value=${time} onChange=${(e) => setTime(e.target.value)} />
        <label htmlFor="ag-title">Quoi</label>
        <input id="ag-title" type="text" value=${title} placeholder="ex. Conclusions de nullité au greffe" onChange=${(e) => setTitle(e.target.value)} />
        <label htmlFor="ag-case">Dossier</label>
        <select id="ag-case" value=${caseId} onChange=${(e) => setCaseId(e.target.value)}><option value="">— aucun —</option>${open.map((c) => html`<option key=${c.id} value=${c.id}>${CR.caseTitle(s, c)}</option>`)}</select>
        <p className="small muted">Comptez vous-même. Le jour du point de départ ne compte pas ; le délai expire le dernier jour à minuit et passe au premier jour ouvrable s'il tombe un samedi, un dimanche ou un jour férié (art. 801).</p>
      </form>
    </${UI.Modal}>`;
  };

  // =================================================================== CARTE
  UI.MapPanel = ({ s, go }) => {
    const [sel, setSel] = useState(s.at === "domicile" ? "cabinet" : s.at);
    const active = CR.activeCases(s);
    const tasksAt = (pid) => {
      const out = [];
      for (const cs of active) for (const t of CR.caseTasks(s, cs)) if (t.where === pid && t.enabled) out.push({ cs, t });
      return out;
    };
    const urgent = new Set();
    for (const cs of active) for (const t of CR.caseTasks(s, cs)) if (t.where && t.urgent) urgent.add(t.where);
    const model = CR.mapModel(s, sel, urgent);
    const pl = CR.placeOf(s, sel);
    const here = s.at === sel;
    const open = pl ? CR.isOpen(pl, s.day, s.min) : true;
    const detenusHere = s.detenus.filter((d) => d.etab === sel);
    const PH = { jour: "Jour", soir: "Crépuscule", nuit: "Nuit" };
    const W = CR.MAP_W, H = CR.MAP_H;
    const legend = [["cabinet", "cabinet", "Votre cabinet"], ["palais", "palais", "Juridictions"], ["ordre", "ordre", "Ordre des avocats"], ["commissariat", "commissariat", "Police et gendarmerie"], ["prison", "prison", "Établissements pénitentiaires"], ["autre", "umj", "Services"], ["faits", "faits", "Lieux des faits"]];
    return html`<div className="panel carte">
      <${UI.Coach} k="carte" s=${s} />
      <div className="carte-grid">
      <div className="map-wrap">
        <div className=${cx("map", "map-" + model.phase)}>
          <${UI.MapCanvas} model=${model} />
          <div className="map-hud" aria-hidden="true"><span className="mh-t">Paris</span><span className="mh-s">${PH[model.phase]} · ${CR.fmtTime(s.min)}</span></div>
          ${model.pins.map((p) => {
            const px = p.x + p.dx, py = p.y + p.dy;
            const name = p.nom + (p.far ? ` · ${p.far.route}, ${p.far.km} km` : "");
            return html`<button key=${p.id} className=${cx("mp-hit", p.sel && "on", p.here && "here", px > W * 0.72 && "tip-l", px < W * 0.22 && "tip-r", py < H * 0.16 && "tip-b")} style=${{ left: ((px / W) * 100).toFixed(2) + "%", top: (((py - 7) / H) * 100).toFixed(2) + "%" }} onClick=${() => setSel(p.id)} aria-label=${name + (p.here ? " (vous êtes ici)" : "") + (p.urgent ? " (urgent)" : "")} aria-pressed=${p.sel ? "true" : "false"}>
              <span className="mp-tip">${p.here && html`<b>Vous êtes ici · </b>`}${name}</span>
            </button>`;
          })}
        </div>
        <div className="map-legend small muted">${legend.map(([t, g, l]) => html`<span key=${t}><${UI.PinIcon} type=${t} glyph=${g} />${l}</span>`)}</div>
      </div>
      <div className="carte-side">
      ${pl && html`<${UI.Section} title=${pl.nom} right=${here ? html`<${Tag} tone="ok">Vous êtes ici</${Tag}>` : null}>
        <p className="muted small">${pl.sous}${pl.prison ? " · " + CR.PRISON_LABEL[pl.prison] : ""}</p>
        ${pl.desc && html`<p>${pl.desc}</p>`}
        ${pl.horaires && html`<p className="small">Horaires : ${CR.HORAIRES[pl.horaires].label} ${open ? html`<${Tag} tone="ok">ouvert</${Tag}>` : html`<${Tag} tone="bad">fermé</${Tag}>`}</p>`}
        ${!here && html`<div className="map-go">
          <${Btn} kind="primary" icon="walk" onClick=${() => { go.travel(sel, "metro"); }}>Y aller en métro · ${CR.travelTime(s, s.at, sel, "metro")} min</${Btn}>
          <${Btn} onClick=${() => { go.travel(sel, "taxi"); }}>Taxi · ${CR.travelTime(s, s.at, sel, "taxi")} min · ${CR.money(CR.taxiCost(s, s.at, sel))}</${Btn}>
        </div>`}
        ${!here && CR.METRO && (() => { const et = CR.METRO.etapes(CR.METRO.itin(s, s.at, sel)); return et.length ? html`<ol className="itin" aria-label="Itinéraire en transports">${et.map((e, i) => html`<li key=${i}><span className=${UI.cx("itin-l", !e.c && "pied", e.kind && e.kind !== "M" && "rer")} style=${e.c ? { background: e.c, color: e.fg } : null}>${e.c ? e.ligne : "·"}</span><span className="itin-t">${e.t}${e.d && html`<span>${e.d}</span>`}</span><span className="itin-m">${e.min} min</span></li>`)}</ol>` : null; })()}
        ${detenusHere.length > 0 && html`<div className="sub-head">Vos clients ici</div><ul className="log-list">${detenusHere.map((d) => html`<li key=${d.caseId}><strong>${d.nom}</strong> — ${d.statut === "prevenu" ? "prévenu, en détention provisoire" : "condamné"}${d.since != null ? `, depuis le ${CR.fmtDate(d.since, "long")}` : ""}${d.sortie != null ? ` · sortie prévue le ${CR.fmtDate(d.sortie, "long")}` : ""} · ${d.humeur > 60 ? "tient le coup" : d.humeur > 35 ? "inquiet" : "abattu"}${d.statut === "prevenu" && !d.permis ? " · permis de communiquer requis" : ""}</li>`)}</ul>`}
        ${(() => { const ts = tasksAt(sel); return ts.length ? html`<div className="sub-head">${here ? "À faire ici" : "À faire là-bas"}</div><div className="tasks">${ts.map(({ cs, t }) => html`<${UI.TaskButton} key=${cs.id + t.id} s=${s} cs=${cs} t=${Object.assign({}, t, { label: `${t.label} — ${CR.clientName(cs)}` })} go=${go} />`)}</div>` : null; })()}
        ${sel === "ordre" && html`<div className="sub-head">L'Ordre</div><div className="tasks"><button className="task" onClick=${() => go.permanences()}><span className="task-ico"><${Icon} n="calendar" /></span><span className="task-txt"><strong>S'inscrire aux permanences pénales</strong><span className="small muted">Garde à vue de jour et de nuit, comparutions immédiates. Rétribuées à l'aide juridictionnelle.</span></span></button></div>`}
        ${sel === "palais" && here && html`<div className="sub-head">Au Palais</div><div className="tasks"><button className="task" onClick=${() => { CR.spend(s, 30, "meet"); if (!s.flags.salleAvocats || s.flags.salleAvocats !== s.day) { s.flags.salleAvocats = s.day; CR.rep(s, "confreres", 1); } CR.toast(s, CR.R.pick(s, ["Un confrère vous glisse que la 10e chambre lit tous les procès-verbaux de garde à vue, heure par heure.", "On dit que le JLD de permanence cette semaine place facilement en détention.", "« La 23e finit rarement avant 21 heures. Prenez un sandwich. »", "Un confrère se plaint d'un délai d'appel manqué par son prédécesseur : dix jours, pas dix jours ouvrables."]), "info"); bump(); }}><span className="task-ico"><${Icon} n="user" /></span><span className="task-txt"><strong>Passer à la salle des avocats</strong><span className="small muted">Croiser des confrères, glaner des nouvelles. 30 min.</span></span></button></div>`}
      </${UI.Section}>`}
      </div>
      </div>
    </div>`;
  };

  // =================================================================== BIBLIOTHÈQUE
  // Le code annoté est dans ui-biblio.js (UI.LibraryPanel), ses données dans code-annote.js.

  // =================================================================== CABINET
  UI.FirmPanel = ({ s, go, sub }) => {
    const [tab, setTab] = useState(sub || "comptes");
    useEffect(() => { if (sub) setTab(sub); }, [sub]);
    const f = s.fixed;
    const staffCost = CR.coutEquipe ? CR.coutEquipe(s) : 0;
    const mensuel = f.loyer + f.urssaf + f.ordre + f.logiciels + f.telephone + f.prelevement + s.pret.payment + staffCost;
    const ajAttente = CR.sum(s.ajDue.filter((x) => !x.paid), (x) => x.montant);
    return html`<div className="panel firm">
      <div className="tabs">${[["comptes", "Comptes"]].concat(CR.CAR && s.mode === "carriere" ? [["carriere", "Carrière"]] : []).concat([["permanences", "Permanences"], ["equipe", "Équipe"], ["rep", "Réputation"], ["disc", "Discipline"]]).map(([k, l]) => html`<button key=${k} className=${cx("tab", tab === k && "on")} onClick=${() => setTab(k)}>${l}</button>`)}</div>
      ${tab === "comptes" && html`<div>
        <div className="kpis">
          <div className="kpi"><span className="pix">Compte professionnel</span><${Money} v=${s.cash} /></div>
          <div className="kpi"><span className="pix">CARPA</span><${Money} v=${s.carpa} /><span className="small muted">Fonds des clients. Pas les vôtres.</span></div>
          <div className="kpi"><span className="pix">Découvert</span><${Money} v=${s.decouvert.used} /><span className="small muted">sur ${CR.money(s.decouvert.limit)} à ${CR.pct(s.decouvert.rate, 1)}</span></div>
          <div className="kpi"><span className="pix">Prêt d'installation</span><${Money} v=${s.pret.balance} /><span className="small muted">${CR.money(s.pret.payment)} par mois</span></div>
          <div className="kpi"><span className="pix">Charges mensuelles</span><${Money} v=${mensuel} /><span className="small muted">Trésorerie ≈ ${Math.max(0, Math.floor((s.cash + s.decouvert.limit - s.decouvert.used) / mensuel * 10) / 10).toString().replace(".", ",")} mois</span></div>
          <div className="kpi"><span className="pix">Aide juridictionnelle à percevoir</span><${Money} v=${ajAttente} /><span className="small muted">Versée par la CARPA le mois suivant</span></div>
        </div>
        <${UI.Section} title="Charges (prélevées le 1er du mois)">
          <table className="tbl"><tbody>${[["Loyer du bureau", f.loyer], ["URSSAF et CNBF", f.urssaf], ["Cotisation ordinale et RCP", f.ordre], ["Logiciels et bases juridiques", f.logiciels], ["Téléphone et internet", f.telephone], ["Prélèvement personnel", f.prelevement], ["Prêt d'installation", s.pret.payment], ["Équipe (salaires et charges, rétrocessions)", staffCost]].map(([l, v]) => html`<tr key=${l}><td>${l}</td><td className="num">${CR.money(v)}</td></tr>`)}</tbody></table>
        </${UI.Section}>
        <${UI.Section} title="Grand livre">
          <div className="tbl-wrap"><table className="tbl ledger"><thead><tr><th>Date</th><th>Compte</th><th>Écriture</th><th className="num">Montant</th></tr></thead><tbody>
            ${s.ledger.slice(0, 40).map((l, i) => html`<tr key=${i} className=${l.improper ? "improper" : ""}><td>${CR.fmtDate(l.day, "short")}</td><td>${l.acct === "carpa" ? "CARPA" : "Professionnel"}</td><td>${l.label}</td><td className=${cx("num", l.amount < 0 && "neg")}>${CR.money(l.amount)}</td></tr>`)}
          </tbody></table></div>
        </${UI.Section}>
      </div>`}
      ${tab === "carriere" && UI.CarrierePanel && html`<${UI.CarrierePanel} s=${s} />`}
      ${tab === "permanences" && html`<${UI.PermanencesBody} s=${s} />`}
      ${tab === "equipe" && html`<${UI.EquipePanel} s=${s} go=${go} />`}
      ${tab === "rep" && html`<div className="rep-grid">
        ${[["clients", "Clients", "Le bouche-à-oreille. Fait sonner le téléphone et accepter vos tarifs."], ["confreres", "Confrères", "L'avis du barreau sur vous. Apporte des dossiers et des informations."], ["siege", "Siège", "Ponctualité, écritures sérieuses, délais tenus. Votre crédit devant les juges."], ["parquet", "Parquet", "Votre fiabilité aux yeux du ministère public. Ouvre la porte aux alternatives."]].map(([k, l, d]) => html`<div key=${k} className="rep-card"><span className="pix">${l}</span>${CR.libre(s) ? html`<p className="rep-dit">${CR.repDit(k, s.reps[k])}</p>` : html`<div className="rep-val">${Math.round(s.reps[k])}</div><${Meter} value=${s.reps[k]} />`}<p className="small muted">${d}</p></div>`)}
      </div>`}
      ${tab === "rep" && UI.MemoList && html`<${UI.MemoList} s=${s} />`}
      ${tab === "disc" && html`<div>
        <${UI.Section} title="Réclamations en cours">
          ${s.disc.open.length === 0 && html`<${Empty}>Aucune. Gardez-le ainsi.</${Empty}>`}
          ${s.disc.open.map((g) => html`<div key=${g.id} className="grievance"><p>${g.text}</p><p className="small muted">Reçue le ${CR.fmtDate(g.day)} · ${g.response ? `Explications envoyées le ${CR.fmtDate(g.responseDay, "short")}` : "Explications attendues sous quinze jours"}</p>${!g.response && html`<${Btn} small kind="primary" onClick=${() => go.scene({ type: "grievance", gid: g.id })}>Répondre au bâtonnier</${Btn}>`}</div>`)}
        </${UI.Section}>
        <${UI.Section} title="Antécédents">
          ${s.disc.record.length === 0 ? html`<${Empty}>Dossier vierge.</${Empty}>` : html`<ul className="log-list">${s.disc.record.map((r, i) => html`<li key=${i}><span className="small muted">${CR.fmtDate(r.day, "short")}</span> <strong>${r.sanction}</strong> — ${r.text}</li>`)}</ul>`}
        </${UI.Section}>
      </div>`}
    </div>`;
  };
  UI.PermanencesBody = ({ s }) => {
    const days = [];
    for (let d = s.day + 1; d <= s.day + 21; d++) days.push(d);
    return html`<div>
      <p className="muted">Inscription auprès du service des permanences de l'Ordre. Une permanence de garde à vue de nuit peut vous réveiller ; une permanence de comparution immédiate occupe l'après-midi au Palais.</p>
      <div className="tbl-wrap"><table className="tbl perm"><thead><tr><th>Jour</th><th>Garde à vue (jour)</th><th>Garde à vue (nuit)</th><th>Comparutions immédiates</th></tr></thead><tbody>
        ${days.map((d) => html`<tr key=${d}><td>${CR.fmtDate(d, "dowshort")}${!CR.isBusinessDay(d) ? html` <span className="small muted">${CR.holidayName(d) || "week-end"}</span>` : ""}</td>
          ${["gav_jour", "gav_nuit", "ci"].map((t) => { const on = s.duty.some((x) => x.day === d && x.type === t); const possible = t !== "ci" || CR.isBusinessDay(d); return html`<td key=${t}>${on ? html`<${Tag} tone="ok">Inscrit</${Tag}>` : possible ? html`<button className="link small" onClick=${() => { CR.signDuty(s, d, t); bump(); }}>S'inscrire</button>` : "—"}</td>`; })}
        </tr>`)}
      </tbody></table></div>
    </div>`;
  };

  // =================================================================== CLASSEUR (fiches de révision)
  UI.ClasseurPanel = ({ s, go }) => {
    const [sel, setSel] = useState(null);
    const [tab, setTab] = useState("fiches");
    const f = s.classeur.find((x) => x.id === sel);
    if (f) return html`<div className="panel"><button className="link" onClick=${() => setSel(null)}>← Toutes les fiches</button><${UI.FicheView} s=${s} f=${f} /></div>`;
    const lex = {};
    for (const fi of s.classeur) for (const n of fi.notions || []) { const k = n.prog || "pp_jugement"; (lex[k] = lex[k] || []).push(Object.assign({ affaire: fi.titre }, n)); }
    return html`<div className="panel">
      <div className="tabs">${[["fiches", `Fiches d'affaires (${s.classeur.length})`], ["articles", `Articles à revoir (${new Set((s.revision || []).map((r) => r.attendu)).size})`], ["lexique", "Lexique personnel"]].map(([k, l]) => html`<button key=${k} className=${cx("tab", tab === k && "on")} onClick=${() => setTab(k)}>${l}</button>`)}</div>
      ${tab === "articles" && html`<${UI.RevisionArticles} s=${s} rows=${s.revision || []} />`}
      ${tab === "fiches" && CR.casBilan && CR.casBilan(s).faits > 0 && html`<p className="cas-bilan">Cas pratiques : <strong>${CR.casBilan(s).ok} / ${CR.casBilan(s).n}</strong> bonnes réponses sur ${CR.casBilan(s).faits} fiche${CR.casBilan(s).faits > 1 ? "s" : ""} travaillée${CR.casBilan(s).faits > 1 ? "s" : ""} (${CR.casBilan(s).fiches} au classeur).</p>`}
      ${tab === "fiches" && (s.classeur.length === 0 ? html`<${Empty}>Chaque affaire terminée se conclut par une fiche de révision, rangée ici.</${Empty}>` : html`<ul className="doc-list">${s.classeur.map((x) => html`<li key=${x.id}><button className="doc-row" onClick=${() => setSel(x.id)}><span className="dir">Fiche</span><span>${x.titre}</span><span className="small muted">${CR.fmtDate(x.day, "short")}</span></button></li>`)}</ul>`)}
      ${tab === "lexique" && (Object.keys(lex).length === 0 ? html`<${Empty}>Les notions rencontrées se classent ici selon le programme du CRFPA.</${Empty}>` : Object.entries(CR.PROGRAMME).filter(([k]) => lex[k]).map(([k, l]) => html`<${UI.Section} key=${k} title=${l}><dl className="glossary">${lex[k].map((n, i) => html`<div key=${i}><dt>${n.titre}</dt><dd>${n.regle} <span className="small muted">— ${n.art || ""} · ${n.affaire}</span></dd></div>`)}</dl></${UI.Section}>`))}
    </div>`;
  };
  // Phase 3 : le code d'affaire, à copier pour rejouer, partager ou signaler un bug
  UI.CodeAffaire = ({ code }) => {
    const [copie, setCopie] = useState(false);
    if (!code) return null;
    const copier = () => {
      const ok = () => { setCopie(true); setTimeout(() => setCopie(false), 1600); };
      try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(ok, ok); else ok(); } catch (e) { ok(); }
    };
    return html`<span className="code-aff" title="Ce code rejoue cette affaire à l'identique (écran titre, « Jouer une affaire par son code »)."><span className="small muted">Code d'affaire</span> <code>${code}</code> <button type="button" className="link small" onClick=${copier}>${copie ? "Copié" : "Copier"}</button></span>`;
  };
  UI.FicheView = ({ s, f }) => html`<div className="fiche-revision paper paper-note">
    <h3 className="paper-title">Fiche de révision</h3>
    ${f.code && html`<p><${UI.CodeAffaire} code=${f.code} /></p>`}
    <p><strong>${f.titre}.</strong> ${f.phrase}</p>
    ${UI.CasPratique && html`<${UI.CasPratique} key=${f.id} s=${s} f=${f} />`}
    <p className="fr-h">Les notions</p>
    <ul>${(f.notions || []).map((n, i) => html`<li key=${i}><strong>${n.titre}</strong> : ${n.regle} <em>(${n.art || ""}${n.prog ? " — " + CR.PROGRAMME[n.prog] : ""})</em></li>`)}</ul>
    ${f.corrige && f.corrige.length > 0 && html`<p className="fr-h">Le corrigé</p>${f.corrige.map((c, i) => html`<div key=${i} className="fr-cas"><p><strong>Problème.</strong> ${c.probleme}</p><p><strong>Règle.</strong> ${c.regle}</p><p><strong>Application.</strong> ${c.application}</p></div>`)}`}
    <p className="fr-h">Ce que vous avez fait</p>
    <ul>${f.fait.bons.map((b, i) => html`<li key=${"b" + i}>✓ ${b}</li>`)}${f.fait.erreurs.map((e, i) => html`<li key=${"e" + i}>✗ ${e.texte} <em>Sanction : ${e.sanction}${e.regul ? ` Régularisation : ${e.regul}` : ""}</em></li>`)}${!f.fait.bons.length && !f.fait.erreurs.length ? html`<li>Rien de notable.</li>` : null}</ul>
    ${f.articles && f.articles.length > 0 && html`<p className="fr-h">Les articles à revoir</p><ul>${f.articles.map((a, i) => html`<li key=${i}><strong>${CR.keyLabel(a.attendu)}</strong>${a.tape ? ` — vous aviez cité l'${CR.keyLabel(a.tape)}` : " — rien cité"} <em>(${CR.CITE_LABEL[a.g] || a.g}${a.ctx ? ", " + a.ctx : ""})</em></li>`)}</ul>`}
    ${f.piege && html`<p className="fr-h">Le piège à retenir</p><p>${f.piege}</p>`}
    ${f.devenir && html`<p className="fr-h">Ce qu'est devenue la personne</p><p>${f.devenir}</p>`}
    ${f.plusLoin && html`<p className="fr-h">Pour aller plus loin</p><p>${f.plusLoin}</p>`}
  </div>`;

  // =================================================================== JOURNAL
  UI.JournalPanel = ({ s, go }) => {
    const [tab, setTab] = useState("log");
    const closed = s.order.map((id) => s.cases[id]).filter((c) => c && c.status === "closed" && c.debrief);
    const [deb, setDeb] = useState(null);
    return html`<div className="panel journal">
      <div className="tabs">${[["log", "Carrière"], ["closed", "Dossiers clos"], ["promo", "La promotion"], ["sources", "Sources"], ["lexique", "Lexique"]].map(([k, l]) => html`<button key=${k} className=${cx("tab", tab === k && "on")} onClick=${() => setTab(k)}>${l}</button>`)}</div>
      ${tab === "log" && html`<div>
        <div className="kpis">
          <div className="kpi"><span className="pix">Jours d'exercice</span><strong>${s.day}</strong></div>
          <div className="kpi"><span className="pix">Honoraires</span><${Money} v=${s.stats.honoraires} /></div>
          <div className="kpi"><span className="pix">Aide juridictionnelle</span><${Money} v=${s.stats.aj} /></div>
          <div className="kpi"><span className="pix">Relaxes</span><strong>${s.stats.relaxes}</strong></div>
          <div className="kpi"><span className="pix">Nullités obtenues</span><strong>${s.stats.nullites}</strong></div>
          <div className="kpi"><span className="pix">Victimes indemnisées</span><${Money} v=${s.stats.indemnisations} /></div>
        </div>
        <ul className="log-list">${s.log.slice().reverse().slice(0, 80).map((l, i) => html`<li key=${i} className=${"lk-" + l.kind}><span className="small muted">${CR.fmtDate(l.day, "short")}</span> ${l.text}</li>`)}</ul>
      </div>`}
      ${tab === "closed" && (deb ? html`<div><button className="link" onClick=${() => setDeb(null)}>← Tous les dossiers clos</button><${UI.DebriefBody} s=${s} cs=${s.cases[deb]} /></div>` : html`<ul className="doc-list">${closed.length === 0 && html`<li className="empty">Aucun dossier clos.</li>`}${closed.map((c) => html`<li key=${c.id}><button className="doc-row" onClick=${() => setDeb(c.id)}><span>${CR.caseTitle(s, c)}</span><span className="small">${CR.outcomeLabel(c.outcome)}</span><span className="small muted">${CR.fmtDate(c.outcome.day, "short")}</span></button></li>`)}</ul>`)}
      ${tab === "promo" && html`<div>
        <p className="muted">Vous avez prêté serment le même jour que quatre camarades de l'école d'avocats, devant la première chambre de la cour d'appel de Paris.</p>
        <div className="cohort-grid">
          <div className="cohort-card you"><${Portrait} look=${s.player.look || CR.px.lookFrom(s.player.nom)} size=${56} /><strong>${s.player.prenom} ${s.player.nom}</strong><span className="small">${s.player.cabinet}</span></div>
          ${s.cohort.map((c) => { const def = CR.COHORT.find((x) => x.id === c.id); return html`<div key=${c.id} className="cohort-card"><${Portrait} look=${CR.px.lookFrom(c.id, Object.assign({ age: 27 }, def.look))} size=${56} /><strong>${c.name}</strong><span className="small">${c.status}</span></div>`; })}
        </div>
      </div>`}
      ${tab === "sources" && html`<div>
        <p className="small muted">Les réformes récentes intégrées et leurs sources, vérifiées en novembre 2026. Les textes du jeu restent des résumés : à relire sur Légifrance avant tout usage réel.</p>
        <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Texte</th><th>Ce que le jeu en fait</th><th>Source</th></tr></thead><tbody>
          ${CR.SOURCES.map((r, i) => html`<tr key=${i}><td><strong>${r.regle}</strong></td><td>${r.usage}</td><td className="small">${r.src}</td></tr>`)}
        </tbody></table></div>
      </div>`}
      ${tab === "lexique" && html`<dl className="glossary">${Object.entries(CR.GLOSSAIRE).map(([k, v]) => html`<div key=${k}><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>`}
    </div>`;
  };

  // =================================================================== Débrief
  UI.DebriefBody = ({ s, cs }) => {
    const d = cs.debrief;
    if (!d) return null;
    const clues = d.items.filter((i) => i.kind === "clue");
    const others = d.items.filter((i) => i.kind !== "clue" && i.kind !== "calc");
    const calc = d.items.filter((i) => i.kind === "calc");
    const fiche = s.classeur.find((f) => f.caseId === cs.id);
    return html`<div className="debrief">
      <${UI.Coach} k="debrief" s=${s} />
      <div className="deb-outcome"><span className="pix">Issue</span><strong>${CR.outcomeLabel(cs.outcome)}</strong>${cs.outcome.note && html`<span className="small">${cs.outcome.note}</span>`}</div>
      ${d.epilogue && html`<div className="epilogue"><span className="pix">Ce qu'il est advenu</span><p>${d.epilogue}</p></div>`}
      ${others.length > 0 && html`<${UI.Section} title="Ce qui a compté">
        <ul className="deb-list">${others.map((i, k) => html`<li key=${k} className=${"deb-" + i.kind}><span className="deb-k">${{ rule: "Règle", good: "Bon réflexe", bad: "Erreur", info: "Note", surprise: "Raté" }[i.kind] || i.kind}</span><span>${i.text}</span></li>`)}</ul>
      </${UI.Section}>`}
      ${cs.vars && cs.vars.corrige && Object.values(cs.vars.corrige).some((l) => l.length) && html`<${UI.Section} title="Ce qu'il fallait demander">${Object.entries(cs.vars.corrige).filter(([, l]) => l.length).map(([sc, l]) => html`<div key=${sc}><p className="small muted">${sc}</p><ul className="deb-list">${l.map((x, k) => html`<li key=${k} className="deb-bad"><span className="deb-k">${x.sujet}</span><span>Une question ${x.angle ? "« " + x.angle.toLowerCase() + " »" : ""}, ouverte, aurait livré : ${x.fait || "un élément du dossier"}.</span></li>`)}</ul></div>`)}</${UI.Section}>`}
      ${calc.length > 0 && html`<${UI.Section} title=${cs.vars && cs.vars.raisonnement ? "Le raisonnement du tribunal" : "Le calcul du délibéré"}><ul className="deb-list">${calc.map((i, k) => html`<li key=${k} className="deb-info"><span className="deb-k">Calcul</span><span>${i.text}</span></li>`)}</ul></${UI.Section}>`}
      ${cs.vars && cs.vars.decision && cs.vars.decision.motifsPeine && html`<${UI.Section} title="La peine et ses motifs"><ul className="deb-list">
        <li className="deb-info"><span className="deb-k">Prononcé</span><span>${cs.vars.decision.peine}</span></li>
        ${(cs.vars.decision.motifsPeine.regles || []).map((t, k) => html`<li key=${"r" + k} className="deb-rule"><span className="deb-k">Motif</span><span>${t}</span></li>`)}
        ${(cs.vars.decision.motifsPeine.manques || []).map((t, k) => html`<li key=${"m" + k} className="deb-bad"><span className="deb-k">À faire</span><span>${t}</span></li>`)}
      </ul></${UI.Section}>`}
      ${cs.erreurs.length > 0 && html`<${UI.Section} title="Vos erreurs et leur régime"><ul className="deb-list">${cs.erreurs.map((e, k) => html`<li key=${k} className="deb-bad"><span className="deb-k">Erreur</span><span>${e.texte} <span className="muted">— ${e.sanction}${e.regul ? ` Régularisation : ${e.regul}` : ""}</span></span></li>`)}</ul></${UI.Section}>`}
      ${clues.length > 0 && html`<${UI.Section} title="Les faits clés"><ul className="deb-list">${clues.map((i, k) => html`<li key=${k} className=${i.ok ? "deb-good" : "deb-bad"}><span className="deb-k">${i.ok ? "Noté" : "Manqué"}</span><span>${i.text}${i.why && html` <span className="muted small">— ${i.why}</span>`}</span></li>`)}</ul></${UI.Section}>`}
      ${cs.facture && html`<${UI.FactureView} s=${s} cs=${cs} />`}
      ${!fiche && cs.citeLog && cs.citeLog.length > 0 && html`<${UI.Section} title="Les articles à revoir"><${UI.RevisionArticles} s=${s} rows=${cs.citeLog.slice().reverse()} /></${UI.Section}>`}
      ${fiche && html`<${UI.FicheView} s=${s} f=${fiche} />`}
    </div>`;
  };
  // La facture de clôture : forfait ou temps passé, honoraire de résultat, provision, solde
  UI.FactureView = ({ s, cs }) => {
    const f = cs.facture;
    const reste = Math.round(cs.billed - cs.collected);
    const etat = cs.flags.impaye ? "Solde impayé : une relance s'impose ; le bâtonnier tranche les contestations d'honoraires." : f.reste < 0 ? `Trop-perçu de provision restitué au client : ${CR.money(-f.reste)}.` : reste <= 0 ? "Réglé." : `Facture envoyée le ${CR.fmtDate(f.day, "long")} : solde de ${CR.money(reste)} attendu dans les semaines qui viennent.`;
    return html`<${UI.Section} title="Honoraires facturés à la clôture">
      <table className="tbl"><tbody>
        ${f.lignes.map((l, i) => html`<tr key=${i}><td>${l.label}</td><td className="num">${CR.money(l.amount)} HT</td></tr>`)}
        <tr><td><strong>Total facturé</strong></td><td className="num"><strong>${CR.money(f.total)} HT</strong></td></tr>
        <tr><td>Provision et acomptes encaissés à la clôture</td><td className="num">${CR.money(f.deja)}</td></tr>
        <tr><td>Encaissé à ce jour</td><td className="num">${CR.money(cs.collected)}</td></tr>
      </tbody></table>
      ${f.resultat === false && html`<p className="small">Honoraire de résultat non dû : le résultat prévu par la convention (${cs.fee && cs.fee.resultat}) n'est pas atteint.</p>`}
      <p className="small muted">${etat}</p>
    </${UI.Section}>`;
  };
  // Les articles ratés, regroupés : le numéro attendu, le texte, ce qui a été tapé
  UI.RevisionArticles = ({ s, rows }) => {
    const by = {};
    for (const r of rows) (by[r.attendu] = by[r.attendu] || []).push(r);
    const keys = Object.keys(by).sort((a, b) => by[b].length - by[a].length);
    if (!keys.length) return html`<${Empty}>Les articles que vous ratez dans vos actes et à l'audience se rangent ici, avec leur texte, pour les apprendre.</${Empty}>`;
    return html`<ul className="rev-list">${keys.map((k) => { const l = CR.lib(k) || {}; const last = by[k][0]; return html`<li key=${k} className="rev-item"><details>
      <summary><strong>${CR.keyLabel(k)}</strong>${l.titre ? html` <span className="small muted">— ${l.titre}</span>` : ""} <${Tag} tone="warn">raté ${by[k].length} fois</${Tag}></summary>
      ${l.texte && html`<p className="tx-body">${l.texte}</p>`}
      <p className="small muted">Dernière fois le ${CR.fmtDate(last.day, "short")}${last.ctx ? " (" + last.ctx + ")" : ""} : ${last.tape ? "vous aviez cité l'" + CR.keyLabel(last.tape) : "rien cité"} — ${(CR.CITE_LABEL[last.g] || last.g).toLowerCase()}.</p>
    </details></li>`; })}</ul>`;
  };
})();
