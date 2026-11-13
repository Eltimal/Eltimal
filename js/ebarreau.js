// La Permanence — refonte du gameplay, B1 bis : e-Barreau sur l'ordinateur du cabinet (CR.EB, UI.EBarreau)
// La communication électronique pénale se pratique comme en vrai : tableau de bord, messages reçus, envoyés, brouillons,
// corbeille ; « Nouveau message pénal » avec l'annuaire CEP (type de juridiction, juridiction, structure), l'annuaire des
// avocats en copie, l'objet, le client (statut, nom, prénom), la procédure (identification, numéro, service enquêteur,
// dates), puis le message généré, les pièces jointes et la confirmation ; l'avis de réception arrive dans les messages
// reçus, et on l'ajoute au dossier. Rien n'indique quelle structure reçoit quel acte : c'est à l'avocat de le savoir.
// Règles (dev/ref/actes-canaux.md, vérifié) : adresse hors liste = irrecevable (D. 591) ; après 17 heures ou un jour non
// ouvrable, l'acte prend date au premier jour ouvrable suivant ; demande de mise en liberté, appel, conclusions : la voie
// électronique n'est pas admise. Choix du jeu (pas une règle lue) : mauvaise juridiction ou structure, numéro de procédure
// inconnu, acte non joint : le service répond que rien n'a été enregistré, et l'acte peut être renvoyé.
// Les structures reprennent la forme de l'annuaire (TJ-VILLE/CEP/BO…, cep.bo.tj-ville@justice.fr) : liste du jeu, non
// exhaustive. Mode libre seulement (le mode assisté garde le dépôt en un clic).
(function () {
  "use strict";
  const CR = window.CR;
  const EB = (CR.EB = {});
  const C = () => CR.CANAUX;
  const slug = (v) => v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]+/g, "-");
  // structures d'un tribunal judiciaire, puis d'une cour d'appel ; code → service du moteur des canaux
  const STRUCT_TJ = [["BO", "bop"], ["CORR01", "correc"], ["CORR02", "correc"], ["DOYEN", "doyen"], ["INSTRUCTION01", "ji"], ["INSTRUCTION02", "ji"], ["JLD", "jld"], ["JAP01", null], ["JE01", null], ["COURDASSISES", null]];
  const STRUCT_CA = [["CHINS", "chins"], ["CHAPPELS", null], ["PG", null]];
  EB.tribunaux = function () {
    const M = CR.MONDE && CR.MONDE.TJ ? CR.MONDE.TJ : { paris: { ville: "Paris", ca: "Cour d'appel de Paris" } };
    const tj = Object.values(M).map((T) => ({ type: "Tribunal judiciaire", ville: T.ville }));
    const cas = [...new Set(Object.values(M).map((T) => (T.ca || "Cour d'appel de Paris").replace(/^Cour d'appel de /, "")))].map((v) => ({ type: "Cour d'appel", ville: v }));
    return tj.concat(cas);
  };
  EB.annuaire = function (type, ville) {
    const ca = type === "Cour d'appel";
    return (ca ? STRUCT_CA : STRUCT_TJ).map(([code, svc]) => ({
      code, svc, ville, type,
      nom: `${ca ? "CA" : "TJ"}-${ville.toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}/CEP/${code}`,
      adresse: `cep.${code.toLowerCase()}.${ca ? "ca" : "tj"}-${slug(ville)}@justice.fr`,
    }));
  };
  EB.parAdresse = function (adr) {
    const a = String(adr || "").trim().toLowerCase();
    for (const T of EB.tribunaux()) for (const x of EB.annuaire(T.type, T.ville)) if (x.adresse === a) return x;
    return null;
  };
  EB.OBJETS = ["ap-communication-de-piece", "Plainte", "Plainte avec constitution de partie civile", "Constitution de partie civile", "Demande d'actes", "Demande de renvoi", "Observations", "Autre demande"];
  EB.STATUTS = ["Prévenu", "Mis en examen", "Témoin assisté", "Gardé à vue", "Partie civile", "Victime", "Plaignant"];
  EB.IDENT = ["N° de parquet", "N° d'instruction", "N° de procès-verbal"];
  EB.etat = (s) => (s.eb = s.eb || { n: 8000, ar: 13900, recus: [], envoyes: [], brouillons: [], corbeille: [] });
  // le tribunal et le numéro de procédure de l'affaire (affaires générées ; sinon Paris)
  EB.tjDe = function (s, cs) {
    const p = CR.GEN && CR.GEN.paramsOf ? CR.GEN.paramsOf(s, cs.id) : null;
    const t = p && p.t;
    const T = t && CR.MONDE && CR.MONDE.lieuxDe ? CR.MONDE.lieuxDe(t).TJ : null;
    return { ville: T ? T.ville : "Paris", ca: T && T.ca ? T.ca.replace(/^Cour d'appel de /, "") : "Paris", proc: t && t.proc ? t.proc : null };
  };
  // les actes rédigés et pas encore transmis : ce qu'on peut joindre
  EB.joignables = function (s) {
    const out = [];
    for (const id of s.order || []) {
      const cs = s.cases[id];
      if (!cs || !cs.drafted || cs.status === "closed") continue;
      for (const key of Object.keys(cs.drafted)) {
        const d = CR.drafted(cs, key);
        if (!d || d.depose || !(C() && C().ADMIS[key])) continue;
        let tpl; try { tpl = CR.getTpl(s, cs, key); } catch (e) { continue; }
        out.push({ caseId: cs.id, key, nom: `${tpl.title} — ${CR.clientName(cs)}.pdf`, titre: tpl.title });
      }
    }
    return out;
  };
  // la météo des services : un tribunal est parfois indisponible pour la journée (tiré par jour)
  EB.indispo = function (s) {
    const r = CR.seeded("eb:meteo:" + s.day + ":" + (s.seed || 0));
    const T = EB.tribunaux().filter((x) => x.type === "Tribunal judiciaire");
    return r() < 0.08 ? [T[Math.floor(r() * T.length)].ville] : [];
  };
  const recu = (s, m) => { const E = EB.etat(s); E.recus.unshift(Object.assign({ id: CR.uid("ebr"), day: s.day, min: s.min, lu: false }, m)); };
  EB.recu = recu;

  // envoyer : m = { a: [adresses], cc: [...], objet, client: {statut, nom, prenom, naissance}, proc: {ident, numero, service,
  // audience, jugement, nature, mcNom, mcPrenom}, pj: [{caseId, key}], caseId } ; rend { ok, msg, erreur }
  EB.envoyer = function (s, m) {
    const E = EB.etat(s);
    if (!m.a || !m.a.length) return { ok: false, erreur: "Destinataire obligatoire." };
    if (!m.objet) return { ok: false, erreur: "Objet obligatoire." };
    if (!m.client || !m.client.statut || !m.client.nom || !m.client.prenom) return { ok: false, erreur: "Statut, nom et prénom du client sont obligatoires." };
    if (!m.confirme) return { ok: false, erreur: "Confirmez que le contenu du message et les pièces jointes sont conformes." };
    const dests = m.a.map((x) => ({ adresse: x, st: EB.parAdresse(x) }));
    const indis = EB.indispo(s);
    const enPanne = dests.find((d) => d.st && d.st.type === "Tribunal judiciaire" && indis.includes(d.st.ville));
    if (enPanne) return { ok: false, erreur: `Le service du tribunal judiciaire de ${enPanne.st.ville} est indisponible. Le message est conservé dans vos brouillons ; réessayez plus tard.`, panne: true };
    const num = ++E.n;
    const env = { id: CR.uid("ebe"), num, day: s.day, min: s.min, a: m.a.slice(), cc: (m.cc || []).slice(), objet: m.objet, client: m.client, proc: m.proc || {}, pj: (m.pj || []).map((p) => ({ caseId: p.caseId, key: p.key, nom: p.nom })), caseId: m.caseId || (m.pj && m.pj[0] && m.pj[0].caseId) || null };
    E.envoyes.unshift(env);
    CR.spend(s, 10, "admin");
    const corps = `${env.objet} — ${m.client.statut} ${m.client.nom.toUpperCase()} ${m.client.prenom}`;
    // l'avis de réception de chaque structure de la liste (pas d'avis pour une adresse hors liste)
    for (const d of dests) if (d.st) recu(s, { de: d.adresse, objet: `Avis de réception ${++E.ar} du message ${num} : ${corps}`, ar: true, envoi: env.id, caseId: env.caseId, corps: [`Nous accusons réception de votre courrier du ${CR.fmtDate(s.day, "num")} à ${CR.fmtTime(s.min)} dont l'objet est :`, corps] });
    // chaque acte joint : sa transmission par la voie électronique, à la structure choisie
    const principal = dests[0];
    const cs0 = env.caseId ? s.cases[env.caseId] : null;
    const pjs = env.pj.length ? env.pj : m.acteAttendu ? [Object.assign({ manque: true }, m.acteAttendu)] : [];
    for (const p of pjs) {
      const cs = s.cases[p.caseId]; if (!cs) continue;
      const lieu = EB.tjDe(s, cs);
      let dest;
      if (!principal.st) dest = "hors";
      else {
        const bonneVille = principal.st.type === "Cour d'appel" ? principal.st.ville === lieu.ca : principal.st.ville === lieu.ville;
        const bonNum = !lieu.proc || !m.proc || !m.proc.numero || String(m.proc.numero).replace(/\s+/g, "") === lieu.proc.replace(/\s+/g, "");
        dest = !bonneVille ? "ailleurs" : !bonNum ? "numero" : principal.st.svc || "autre";
      }
      const r = C().transmettre(s, cs, p.key, "cep", { dest, pj: !p.manque, adresse: principal.adresse });
      p.resultat = r && r.msg;
    }
    if (cs0) CR.timeline(s, cs0, `e-Barreau : message n° ${num} envoyé à ${m.a.join(", ")} (${env.objet}).`);
    return { ok: true, msg: `Message n° ${num} envoyé à ${CR.fmtTime(s.min)}.`, env };
  };
  EB.brouillon = function (s, m) { const E = EB.etat(s); const b = Object.assign({ id: m.id || CR.uid("ebb"), day: s.day, min: s.min }, m); E.brouillons = E.brouillons.filter((x) => x.id !== b.id); E.brouillons.unshift(b); return b; };
  EB.nonLus = (s) => EB.etat(s).recus.filter((m) => !m.lu).length;
  // ajouter l'avis de réception au dossier : la preuve de la date
  EB.ajouterAR = function (s, msg) {
    const cs = msg.caseId ? s.cases[msg.caseId] : null;
    msg.ajoute = true;
    if (cs) { cs.vars.arCep = (cs.vars.arCep || []).concat([{ objet: msg.objet, day: msg.day, min: msg.min, de: msg.de }]); CR.timeline(s, cs, `Avis de réception e-Barreau ajouté au dossier : ${msg.objet}.`); }
  };

  // ------------------------------------------------------------------ Interface
  const UI = CR.UI;
  if (!UI || !UI.html) return;
  const { html, Btn, cx } = UI;
  const { useState } = React;
  const bump = () => CR.store.bump();
  const date = (m) => `${CR.fmtDate(m.day, "short")} ${CR.fmtTime(m.min)}`;

  function Annuaire({ s, onPick, onClose, avocats }) {
    const T = EB.tribunaux();
    const [type, setType] = useState(""), [ville, setVille] = useState(""), [q, setQ] = useState(""), [sel, setSel] = useState([]);
    const villes = T.filter((x) => x.type === type);
    const liste = avocats ? EB.avocats(s).filter((x) => !q || x.nom.toLowerCase().includes(q.toLowerCase())) : type && ville ? EB.annuaire(type, ville).filter((x) => !q || (x.nom + x.adresse).toLowerCase().includes(q.toLowerCase())) : [];
    return html`<div className="eb-annu" role="dialog" aria-label="Destinataires">
      <div className="eb-annu-head"><b>Destinataires</b><button className="link" onClick=${onClose}>Fermer</button></div>
      ${!avocats && html`<div className="eb-row"><select value=${type} onChange=${(e) => { setType(e.target.value); setVille(""); }}><option value="">Type de juridiction</option><option>Tribunal judiciaire</option><option>Cour d'appel</option></select>
        <select value=${ville} onChange=${(e) => setVille(e.target.value)} disabled=${!type}><option value="">Juridiction</option>${villes.map((v) => html`<option key=${v.ville}>${v.ville}</option>`)}</select></div>`}
      <input className="eb-q" placeholder="Que voulez-vous rechercher ?" value=${q} onInput=${(e) => setQ(e.target.value)} />
      <p className="eb-annu-t">${avocats ? "Annuaire des avocats" : "Annuaire pour Communication Électronique Pénale (CEP)"}</p>
      <div className="eb-annu-list">${liste.length === 0 ? html`<p className="small muted">Aucun résultat pour votre recherche</p>` : liste.map((x) => html`<button key=${x.adresse} type="button" className=${cx("eb-annu-l", sel.includes(x.adresse) && "on")} onClick=${() => setSel(sel.includes(x.adresse) ? sel.filter((y) => y !== x.adresse) : sel.concat(x.adresse))}><span>${x.nom}</span><span className="small">${x.adresse}</span><span className="small muted">${x.ville || x.barreau || ""}</span></button>`)}</div>
      <div className="eb-annu-foot"><${Btn} kind="ghost" onClick=${onClose}>Annuler</${Btn}><${Btn} kind="primary" disabled=${!sel.length} onClick=${() => onPick(sel)}>Ajouter</${Btn}></div>
    </div>`;
  }
  EB.avocats = function (s) {
    const L = (CR.ACTEURS || []).filter((a) => a.role === "adverse" || a.role === "avocat").map((a) => ({ nom: a.nom.replace(/^Me /, ""), adresse: `${slug(a.nom.replace(/^Me /, "")).replace(/-/g, ".")}@avocat-conseil.fr`.replace(/^\./, ""), barreau: "Paris" }));
    return L.length ? L : [{ nom: "Lucas Pernot", adresse: "lucas.pernot@avocat-conseil.fr", barreau: "Paris" }];
  };

  // Nouveau message pénal : deux temps, comme en vrai (formulaire, puis message généré, pièces et confirmation)
  function Composer({ s, init, onDone, onCancel }) {
    const [m, setM] = useState(() => Object.assign({ a: [], cc: [], objet: "", client: { statut: "", nom: "", prenom: "", naissance: "" }, proc: { ident: "", numero: "", service: "", audience: "", jugement: "", nature: "", mcNom: "", mcPrenom: "" }, pj: [], confirme: false, libre: "" }, init || {}));
    const [etape, setEtape] = useState(1), [annu, setAnnu] = useState(null), [err, setErr] = useState(null), [res, setRes] = useState(null);
    const set = (k, v) => setM(Object.assign({}, m, { [k]: v }));
    const setIn = (g, k, v) => setM(Object.assign({}, m, { [g]: Object.assign({}, m[g], { [k]: v }) }));
    const joign = EB.joignables(s);
    const pret1 = m.a.length && m.objet && m.client.statut && m.client.nom && m.client.prenom;
    const envoyer = () => { const r = EB.envoyer(s, m); if (!r.ok) { setErr(r.erreur); if (r.panne) EB.brouillon(s, m); bump(); return; } setRes(r); bump(); };
    if (res) return html`<div className="eb-card"><h3>Message envoyé</h3><p>${res.msg}</p><p className="small muted">L'avis de réception arrive dans les messages reçus.</p><${Btn} kind="primary" onClick=${onDone}>Retour à la messagerie</${Btn}></div>`;
    const champ = (g, k, label, o = {}) => html`<label className="eb-f"><span className="small">${label}</span><input type=${o.type || "text"} maxLength=${o.max || 200} value=${m[g][k]} onInput=${(e) => setIn(g, k, e.target.value)} /></label>`;
    const genere = [`Client`, `${m.client.statut} - ${m.client.nom.toUpperCase()} ${m.client.prenom}`, "", "Procédure", m.proc.ident && m.proc.numero ? `${m.proc.ident} : ${m.proc.numero}` : "", m.proc.service, m.proc.nature, m.proc.audience ? `Audience du ${m.proc.audience}` : ""].filter((x, i) => x || i < 4);
    return html`<div className="eb-card eb-compose">
      <h3>Nouveau message pénal</h3>
      ${annu && html`<${Annuaire} s=${s} avocats=${annu === "cc"} onClose=${() => setAnnu(null)} onPick=${(l) => { set(annu, [...new Set(m[annu].concat(l))]); setAnnu(null); }} />`}
      <div className="eb-dests"><span className="small">Destinataire(s) *</span>
        <div className="eb-chips">${m.a.map((x) => html`<span key=${x} className="eb-chip">${x}<button aria-label="Retirer" onClick=${() => set("a", m.a.filter((y) => y !== x))}>×</button></span>`)}
          <input className="eb-adr" placeholder="adresse" value=${m.libre} onInput=${(e) => set("libre", e.target.value)} onKeyDown=${(e) => { if (e.key === "Enter" && m.libre.trim()) { setM(Object.assign({}, m, { a: m.a.concat(m.libre.trim()), libre: "" })); } }} />
        </div><button className="eb-annu-b" title="Annuaire" onClick=${() => setAnnu("a")}>Annuaire</button></div>
      <div className="eb-dests"><span className="small">Destinataire(s) en copie</span><div className="eb-chips">${m.cc.map((x) => html`<span key=${x} className="eb-chip">${x}<button aria-label="Retirer" onClick=${() => set("cc", m.cc.filter((y) => y !== x))}>×</button></span>`)}</div><button className="eb-annu-b" onClick=${() => setAnnu("cc")}>Annuaire</button></div>
      <label className="eb-f eb-objet"><span className="small">Objet *</span><select value=${m.objet} onChange=${(e) => set("objet", e.target.value)}><option value=""></option>${EB.OBJETS.map((o) => html`<option key=${o}>${o}</option>`)}</select></label>
      ${etape === 1 ? html`<div>
        <p className="small muted">Le message sera généré automatiquement à partir de la complétion des champs suivants.</p>
        <h4>Client</h4>
        <div className="eb-grid"><label className="eb-f"><span className="small">Statut *</span><select value=${m.client.statut} onChange=${(e) => setIn("client", "statut", e.target.value)}><option value=""></option>${EB.STATUTS.map((o) => html`<option key=${o}>${o}</option>`)}</select></label>
          ${champ("client", "nom", "Nom *", { max: 60 })}${champ("client", "prenom", "Prénom *", { max: 35 })}${champ("client", "naissance", "Date de naissance")}</div>
        <h4>Procédure</h4>
        <div className="eb-grid"><label className="eb-f"><span className="small">Identification</span><select value=${m.proc.ident} onChange=${(e) => setIn("proc", "ident", e.target.value)}><option value=""></option>${EB.IDENT.map((o) => html`<option key=${o}>${o}</option>`)}</select></label>
          ${champ("proc", "numero", "Numéro d'identification", { max: 15 })}${champ("proc", "service", "Commissariat ou gendarmerie en charge")}${champ("proc", "audience", "Date d'audience")}${champ("proc", "jugement", "Date du jugement")}${champ("proc", "nature", "Nature de l'infraction")}${champ("proc", "mcNom", "Nom du mis en cause")}${champ("proc", "mcPrenom", "Prénom du mis en cause")}</div>
        <p className="small muted">* Champs nécessaires</p>
        <div className="eb-actions"><${Btn} kind="ghost" onClick=${onCancel}>Annuler</${Btn}><${Btn} onClick=${() => { EB.brouillon(s, m); bump(); onCancel(); }}>Enregistrer</${Btn}><${Btn} kind="primary" disabled=${!pret1} onClick=${() => setEtape(2)}>Suivant</${Btn}></div>
      </div>` : html`<div>
        <div className="eb-gen-h"><b>Message généré automatiquement</b><button className="link" onClick=${() => setEtape(1)}>Modifier les informations pré-remplies</button></div>
        <pre className="eb-gen">${genere.join("\n")}</pre>
        <div className="eb-pj"><span className="small">Ajouter votre (vos) fichier(s)</span>
          ${joign.length === 0 ? html`<p className="small muted">Aucun acte rédigé en attente de transmission.</p>` : joign.map((j) => { const on = m.pj.some((p) => p.caseId === j.caseId && p.key === j.key); return html`<label key=${j.caseId + j.key} className="eb-pj-l"><input type="checkbox" checked=${on} onChange=${() => set("pj", on ? m.pj.filter((p) => !(p.caseId === j.caseId && p.key === j.key)) : m.pj.concat(j))} /> ${j.nom}</label>`; })}
        </div>
        <label className="eb-conf"><input type="checkbox" checked=${m.confirme} onChange=${() => set("confirme", !m.confirme)} /> Je confirme que le contenu du message et le(s) document(s) joint(s) sont conformes à ce que je désire envoyer. *</label>
        ${err && html`<p className="warn-txt small">${err}</p>`}
        <div className="eb-actions"><${Btn} kind="ghost" onClick=${onCancel}>Annuler</${Btn}><${Btn} onClick=${() => { EB.brouillon(s, m); bump(); onCancel(); }}>Enregistrer</${Btn}><${Btn} kind="primary" disabled=${!m.confirme} onClick=${envoyer}>Envoyer</${Btn}></div>
      </div>`}
    </div>`;
  }

  function Lecture({ s, m, boite, onClose }) {
    const env = boite === "envoyes";
    return html`<div className="eb-card eb-lecture">
      <div className="eb-lect-h"><b>${env ? "Envoyé" : m.de}</b><span className="small muted">${env ? "Envoyé" : "Reçu"} le ${date(m)}</span></div>
      <p><b>${env ? m.objet : m.objet}</b></p>
      ${env ? html`<p className="small">À : ${m.a.join(", ")}${m.cc.length ? ` · Copie : ${m.cc.join(", ")}` : ""}</p><pre className="eb-gen">${["Client", `${m.client.statut} - ${m.client.nom.toUpperCase()} ${m.client.prenom}`, "", "Procédure", m.proc.ident && m.proc.numero ? `${m.proc.ident} : ${m.proc.numero}` : ""].join("\n")}</pre>${m.pj.length ? html`<ul className="small">${m.pj.map((p) => html`<li key=${p.key}>${p.nom}</li>`)}</ul>` : html`<p className="small muted">Aucune pièce jointe.</p>`}`
        : html`<div className="eb-corps">${(m.corps || []).map((l, i) => html`<p key=${i}>${l}</p>`)}</div>`}
      <div className="eb-actions">
        ${m.ar && html`<${Btn} disabled=${m.ajoute} onClick=${() => { EB.ajouterAR(s, m); bump(); }}>${m.ajoute ? "AR ajouté au dossier" : "Ajouter l'AR aux documents"}</${Btn}>`}
        <${Btn} kind="ghost" onClick=${() => { const E = EB.etat(s); E[boite] = E[boite].filter((x) => x !== m); E.corbeille.unshift(m); bump(); onClose(); }}>Supprimer</${Btn}>
        <${Btn} kind="primary" onClick=${onClose}>Fermer</${Btn}>
      </div>
    </div>`;
  }

  // le poste e-Barreau : menu, tableau de bord, boîtes
  UI.EBarreau = function EBarreau({ s, init, onClose }) {
    const E = EB.etat(s);
    const [vue, setVue] = useState(init ? "nouveau" : "tableau"), [ouvert, setOuvert] = useState(null), [brou, setBrou] = useState(init || null);
    const indis = EB.indispo(s);
    const MENU = [["tableau", "Tableau de bord"], ["recus", `Reçus (${EB.nonLus(s)})`], ["envoyes", "Envoyés"], ["brouillons", "Brouillons"], ["corbeille", "Corbeille"], ["partage", "e-Partage sécurisé"], ["aide", "Aide"]];
    const liste = (boite) => {
      const L = E[boite] || [];
      return html`<div className="eb-liste">
        <div className="eb-liste-h"><h3>Messages ${{ recus: "reçus", envoyes: "envoyés", brouillons: "brouillons", corbeille: "supprimés" }[boite]}</h3><${Btn} kind="primary" onClick=${() => { setBrou(null); setVue("nouveau"); }}>+ Nouveau message pénal</${Btn}></div>
        ${L.length === 0 ? html`<p className="small muted">Aucun message.</p>` : html`<table className="tbl eb-tbl"><thead><tr><th>Dossier</th><th>${boite === "recus" ? "Expéditeur" : "Destinataire"}</th><th>Objet du message</th><th>Date</th></tr></thead><tbody>
          ${L.map((m) => html`<tr key=${m.id} className=${cx(boite === "recus" && !m.lu && "eb-nonlu")} onClick=${() => { if (boite === "brouillons") { setBrou(m); setVue("nouveau"); return; } m.lu = true; setOuvert({ m, boite }); bump(); }}>
            <td>${m.caseId && s.cases[m.caseId] ? CR.clientName(s.cases[m.caseId]) : html`<span className="small muted">Associer à un dossier</span>`}</td>
            <td className="small">${boite === "recus" ? m.de : (m.a || []).join(", ")}</td><td>${m.objet || "(sans objet)"}</td><td className="small">${date(m)}</td></tr>`)}
        </tbody></table>`}
      </div>`;
    };
    return html`<div className="ebarreau-poste">
      <aside className="eb-menu"><div className="eb-moi">Maître ${s.player ? s.player.nom.toUpperCase() : ""}</div>
        ${MENU.map(([k, l]) => html`<button key=${k} className=${cx("eb-m", vue === k && "on")} onClick=${() => { setVue(k); setOuvert(null); }}>${l}</button>`)}
        ${onClose && html`<button className="eb-m eb-quit" onClick=${onClose}>Fermer e-Barreau</button>`}
      </aside>
      <main className="eb-main">
        ${ouvert ? html`<${Lecture} s=${s} m=${ouvert.m} boite=${ouvert.boite} onClose=${() => setOuvert(null)} />`
          : vue === "tableau" ? html`<div><h3>Bonjour Maître ${s.player ? s.player.nom.toUpperCase() : ""}</h3><p className="small muted">Ravi de vous revoir sur e-Barreau</p>
            <div className="eb-tuiles"><button className="eb-tuile" onClick=${() => setVue("recus")}><b>${EB.nonLus(s)}</b><span>Nouveaux messages reçus</span></button>
              <div className="eb-tuile"><b>0</b><span>Nouvelles notifications</span></div>
              <div className="eb-tuile"><b>${indis.length} TJ indisponible${indis.length > 1 ? "s" : ""}</b><span>${indis.length ? indis.join(", ") : "Tous les services répondent"}</span><span className="small">Météo des services</span></div></div>
            <${Btn} kind="primary" onClick=${() => { setBrou(null); setVue("nouveau"); }}>+ Nouveau message pénal</${Btn}></div>`
          : vue === "nouveau" ? html`<${Composer} key=${brou ? brou.id || "init" : "neuf"} s=${s} init=${brou} onDone=${() => { if (brou && brou.id) E.brouillons = E.brouillons.filter((x) => x.id !== brou.id); setBrou(null); setVue("envoyes"); bump(); }} onCancel=${() => { setBrou(null); setVue("tableau"); }} />`
          : vue === "partage" ? html`<div><h3>e-Partage sécurisé</h3><p className="small muted">Aucun partage reçu.</p></div>`
          : vue === "aide" ? html`<div><h3>Aide</h3><p className="small">La communication électronique pénale s'adresse aux structures de l'annuaire CEP de la juridiction. Un message prend date à l'accusé de réception ; après 17 heures ou un jour non ouvrable, au premier jour ouvrable suivant.</p></div>`
          : liste(vue)}
      </main>
    </div>`;
  };
  UI.EBarreauPanel = ({ s }) => html`<div className="panel"><${UI.EBarreau} s=${s} /></div>`;
})();
