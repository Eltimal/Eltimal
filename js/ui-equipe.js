/* La Permanence — page d'équipe du panneau Cabinet, et « Confier » dans chaque dossier (feuille de route, n° 14) */
(function () {
  const CR = window.CR;
  const UI = CR.UI;
  const { html, Portrait, Meter, Btn, Tag, Empty, cx } = UI;
  const { useState } = React;
  const bump = () => CR.store.bump();
  const ETATS = { attente: "en attente", en_cours: "en cours", oubli: "en cours", planifiee: "prévue", a_relire: "à relire", fait: "faite", echec: "non faite", annulee: "annulée", abandonnee: "abandonnée" };
  const etatTxt = (t) => (t.etat === "planifiee" ? `prévue le ${CR.fmtDate(t.jour, "dowshort")}` : ETATS[t.etat] || t.etat);
  const pct = (x) => `${Math.round(x * 100)} %`;
  const remuTxt = (st) => { const R = CR.ROLES[st.role]; return R.statut === "liberal" ? `${CR.money(st.salary)} HT de rétrocession` : R.statut === "stage" ? `${CR.money(st.salary)} de gratification` : `${CR.money(st.salary)} brut${st.temps < 1 ? ` (${Math.round(st.temps * 100)} %)` : ""}`; };
  const statutTxt = (s, st) => {
    if (st.depart && !st.depart.fait) return html`<${Tag} tone="bad">Part le ${CR.fmtDate(st.depart.jour, "short")} — ${st.depart.raison}</${Tag}>`;
    if (s.day < st.arrive) return html`<${Tag} tone="brass">Arrive le ${CR.fmtDate(st.arrive, "dowshort")}</${Tag}>`;
    if (CR.enConges(st, s.day)) return html`<${Tag}>En congé</${Tag}>`;
    if (CR.enEssai(s, st)) return html`<${Tag} tone="brass">Période d'essai jusqu'au ${CR.fmtDate(st.essaiFin, "short")}</${Tag}>`;
    if (st.stageFin) return html`<${Tag}>Stage jusqu'au ${CR.fmtDate(st.stageFin, "short")}</${Tag}>`;
    return null;
  };
  const tone = (v, inv) => ((inv ? 100 - v : v) > 60 ? "ok" : (inv ? 100 - v : v) > 35 ? "warn" : "bad");

  // ------------------------------------------------------------------ Fiche d'une personne
  const Parcours = ({ p, cv, incohVue }) => html`<div className="eq-col">
    <div className="pix">Parcours</div>
    <ul className="eq-cv">
      <li>${p.diplome}, ${p.univ}</li>
      ${p.crfpa ? html`<li>CRFPA ${cv && cv.crfpa ? cv.crfpa : p.crfpa}${p.ecole ? ` · ${p.ecole}${p.ecoleFin ? ` (${p.ecoleFin - 2}–${p.ecoleFin})` : " (en cours)"}` : ""}</li>` : null}
      <li>${cv && cv.ans !== p.ans ? html`${cv.ans} ans d'expérience annoncés${incohVue ? html` <span className="neg small">(réels : ${p.ans})</span>` : ""}` : p.ans ? `${p.ans} an${p.ans > 1 ? "s" : ""} d'expérience` : "Pas d'expérience professionnelle"}</li>
      ${p.cabinets.map((c, i) => html`<li key=${i}>${c.nom} <span className="small muted">${CR.CAB_TYPES[c.type]} · ${c.ans} an${c.ans > 1 ? "s" : ""}</span></li>`)}
      <li>Langues : ${(cv ? cv.langues : p.langues).map((l) => (cv && cv.langueEnjolivee === l ? `${l} (« courant »)` : l)).join(", ")}</li>
    </ul>
  </div>`;
  const ExpBars = ({ st, candidat }) => html`<div className="eq-col">
    <div className="pix">Expérience par domaine</div>
    <ul className="eq-exp">${CR.EXP.map(([k, l]) => {
      const vu = candidat ? false : st.vu.exp[k];
      const v = vu ? st.exp[k] : st.cv.exp[k];
      const ecart = !candidat && vu && st.cv.exp[k] - st.exp[k] >= 10;
      return html`<li key=${k}><span className="eq-exp-l">${l}</span><${Meter} value=${v} small=${true} tone=${vu ? "ok" : ""} /><span className=${cx("small", vu ? "" : "muted eq-annonce")}>${Math.round(v)}${ecart ? html` <span className="neg">(CV ${st.cv.exp[k]})</span>` : ""}</span></li>`;
    })}</ul>
    <p className="small muted">${candidat ? "Ce que dit le CV." : "En italique, ce qu'annonce le CV ; en vert, l'expérience constatée au cabinet."}</p>
  </div>`;
  const Perso = ({ st }) => html`<div className="eq-col">
    <div className="pix">Personnalité</div>
    <ul className="eq-traits">${CR.TRAITS.map(([k, l]) => {
      const etat = st.vu && st.vu.traits[k];
      return html`<li key=${k}><strong>${l}</strong> ${etat === "confirme" ? html`<${Tag} tone="ok">confirmée au travail : ${CR.niveauTrait(st.perso[k])}</${Tag}>` : st.indices && st.indices[k] ? html`<span className="small">${st.indices[k]}</span>` : html`<span className="small muted">inconnue</span>`}</li>`;
    })}</ul>
  </div>`;

  const Fiche = ({ s, st, go }) => {
    const ts = CR.tachesDe(s, st).slice(-8).reverse();
    const R = CR.ROLES[st.role];
    const rv = CR.revueDue(s, st) && st.revueDemande;
    const fin = st.depart ? null : CR.enEssai(s, st) || s.day < st.arrive ? "Rompre la période d'essai" : st.role === "eleve" ? "Mettre fin au stage" : R.statut === "liberal" ? "Mettre fin à la collaboration (3 mois)" : "Licencier (préavis)";
    return html`<div className="eq-fiche">
      <div className="eq-grid">
        <${Parcours} p=${st.parcours} cv=${st.cv} incohVue=${st.incohVue || st.taches >= 3} />
        <${ExpBars} st=${st} />
        <${Perso} st=${st} />
      </div>
      <div className="eq-grid">
        <div className="eq-col">
          <div className="pix">Travail</div>
          <p className="small">${CR.capaciteSemaine(st)} h par semaine pour le cabinet${st.role === "collaborateur" ? ", le reste pour sa clientèle personnelle" : ""}. ${CR.plural(st.taches, "tâche faite", "tâches faites")}, ${CR.plural(st.erreurs, "erreur")}${st.oublis ? `, ${CR.plural(st.oublis, "message oublié", "messages oubliés")}` : ""}${st.appels ? `, ${CR.plural(st.appels, "appel pris", "appels pris")}` : ""}.</p>
          ${R.avocat && html`<p className="small">Formation continue ${CR.ymd(s.day).y} : ${st.formation.h} h sur ${CR.chiffre("formation")}.</p>`}
          ${st.role === "collaborateur" && html`<p className="small">Clientèle personnelle : ${st.clientele.length ? st.clientele.map((c) => c.nom).join(", ") : "aucune pour l'instant"}.${st.cantonne >= 2 ? html` <span className="neg">Surchargé de dossiers du cabinet depuis ${st.cantonne} semaines.</span>` : ""}</p>`}
          ${st.incidents.length > 0 && html`<p className="small neg">${st.incidents.map((i) => i.text).join(" ")}</p>`}
          <ul className="log-list small">${ts.map((t) => html`<li key=${t.id}>${t.label} — <em>${etatTxt(t)}</em>${t.erreur ? html` <span className=${t.erreur.rattrapee ? "" : "neg"}>· ${t.erreur.rattrapee ? "erreur rattrapée" : t.erreur.texte.toLowerCase()}</span>` : ""}</li>`)}</ul>
        </div>
        <div className="eq-col">
          <div className="pix">Suivi</div>
          <ul className="log-list small">${(st.journal || []).slice(0, 6).map((j, i) => html`<li key=${i}><span className="muted">${CR.fmtDate(j.day, "short")}</span> ${j.text}</li>`)}</ul>
          ${rv && html`<div className="banner small"><strong>Entretien annuel :</strong> demande ${st.role === "collaborateur" ? "une hausse de rétrocession" : "une augmentation"} de ${rv.pct} %${rv.assoc ? " et une perspective d'association" : ""}.
            <div className="eq-actions"><${Btn} small kind="primary" onClick=${() => { CR.repondreRevue(s, st.id, "accorder"); bump(); }}>Accorder</${Btn}><${Btn} small onClick=${() => { CR.repondreRevue(s, st.id, "moitie"); bump(); }}>La moitié</${Btn}><${Btn} small onClick=${() => { CR.repondreRevue(s, st.id, "refuser"); bump(); }}>Refuser</${Btn}></div></div>`}
          <div className="eq-actions">
            <${Btn} small onClick=${() => { CR.feliciter(s, st.id); bump(); }}>Féliciter</${Btn}>
            <${Btn} small onClick=${() => { CR.reprocher(s, st.id); bump(); }}>Faire un reproche</${Btn}>
            ${(R.avocat || st.role === "juriste" || st.role === "eleve") && html`<${Btn} small onClick=${() => { CR.financerFormation(s, st.id); bump(); }}>Financer 7 h de formation (${CR.money(7 * CR.chiffre("coutFormation"))})</${Btn}>`}
            ${fin && html`<${Btn} small kind="danger" onClick=${() => { CR.finContrat(s, st.id); bump(); }}>${fin}</${Btn}>`}
          </div>
        </div>
      </div>
    </div>`;
  };

  // ------------------------------------------------------------------ Annonce et candidatures
  const AnnonceForm = ({ s }) => {
    const [role, setRole] = useState("assistante");
    const [niveau, setNiveau] = useState("confirme");
    const [dom, setDom] = useState([]);
    const [temps, setTemps] = useState(1);
    const tps = CR.ROLES[role].statut === "salarie" ? temps : 1;
    const [remu, setRemu] = useState(null);
    const [msg, setMsg] = useState(null);
    const min = CR.minimumLegal(role, tps, niveau, s);
    const marche = Math.round(CR.MARCHE[role][role === "eleve" ? "debutant" : niveau] * tps);
    const v = remu != null ? remu : marche;
    return html`<div className="eq-form">
      <label>Poste <select value=${role} onChange=${(e) => { setRole(e.target.value); setRemu(null); }}>${Object.entries(CR.ROLES).map(([k, r]) => html`<option key=${k} value=${k}>${r.label}</option>`)}</select></label>
      ${role !== "eleve" && html`<label>Niveau <select value=${niveau} onChange=${(e) => { setNiveau(e.target.value); setRemu(null); }}>${CR.NIVEAUX.map(([k, l]) => html`<option key=${k} value=${k}>${l}</option>`)}</select></label>`}
      ${CR.ROLES[role].statut === "salarie" && html`<label>Temps <select value=${temps} onChange=${(e) => { setTemps(+e.target.value); setRemu(null); }}><option value=${1}>Temps plein</option><option value=${0.8}>80 %</option><option value=${0.5}>Mi-temps</option></select></label>`}
      <label>${CR.ROLES[role].statut === "liberal" ? "Rétrocession HT" : CR.ROLES[role].statut === "stage" ? "Gratification" : "Salaire brut"} par mois <input type="number" step="50" min=${min} value=${v} onChange=${(e) => setRemu(+e.target.value)} /></label>
      <div className="eq-doms"><span className="small muted">Domaines recherchés (trois au plus) :</span> ${CR.EXP.map(([k, l]) => html`<button key=${k} className=${cx("chip", dom.includes(k) && "on")} onClick=${() => setDom(dom.includes(k) ? dom.filter((x) => x !== k) : dom.length < 3 ? dom.concat(k) : dom)}>${l}</button>`)}</div>
      <p className="small muted">Marché : environ ${CR.money(marche)}. Minimum : ${CR.money(min)}. Publication : 90 € HT, 20 min. Plus l'offre est généreuse et votre réputation bonne, plus les candidatures sont nombreuses.</p>
      <${Btn} kind="primary" small onClick=${() => { const r = CR.publierAnnonce(s, { role, niveau, domaines: dom, remu: v, temps: tps }); setMsg(r.ok ? "Annonce publiée. Les candidatures arrivent dans les jours qui viennent." : r.texte); bump(); }}>Publier l'annonce</${Btn}>
      ${msg && html`<p className="small">${msg}</p>`}
    </div>`;
  };
  const Candidat = ({ s, c }) => {
    const [open, setOpen] = useState(false);
    const [qs, setQs] = useState(["situation", "parcours", "pretentions"]);
    const a = CR.annonceOf(s, c);
    const [offre, setOffre] = useState(null);
    const [msg, setMsg] = useState(null);
    const v = offre != null ? offre : c.contre || (a ? a.remu : c.demande);
    return html`<li className="eq-cand">
      <div className="eq-cand-head">
        <${Portrait} look=${CR.px.lookFrom(c.seed)} size=${40} blink=${false} />
        <div><strong>${c.prenom} ${c.nom}</strong>, ${c.age} ans <span className="small muted">· ${CR.roleLabel(c)} · ${c.parcours.ans ? `${c.cv.ans} ans d'expérience` : "débutant" + (c.g === "f" ? "e" : "")} · ${c.etat === "entretien" ? `entretien le ${CR.fmtDate(c.entretien.day, "short")}` : c.lu ? "CV lu" : "nouveau"}</span></div>
        <${Btn} small onClick=${() => { if (!c.lu) CR.lireCV(s, c.id); setOpen(!open); bump(); }}>${open ? "Fermer" : c.lu ? "Ouvrir" : "Lire le CV (5 min)"}</${Btn}>
      </div>
      ${open && html`<div className="eq-cand-body">
        <div className="eq-grid"><${Parcours} p=${c.parcours} cv=${c.cv} incohVue=${c.incohVue} /><${ExpBars} st=${c} candidat=${true} /></div>
        ${!c.entretien ? html`<div className="eq-int"><span className="small muted">Entretien de 30 minutes : trois questions.</span>
            <div className="eq-doms">${CR.QUESTIONS_ENTRETIEN.map((q) => html`<button key=${q.id} className=${cx("chip", qs.includes(q.id) && "on")} onClick=${() => setQs(qs.includes(q.id) ? qs.filter((x) => x !== q.id) : qs.length < 3 ? qs.concat(q.id) : qs)}>${q.label}</button>`)}</div>
            <${Btn} small kind="primary" onClick=${() => { CR.entretien(s, c.id, qs); bump(); }}>Convoquer et mener l'entretien</${Btn}></div>`
          : html`<div className="eq-int"><div className="pix">Entretien</div><ul className="eq-rep">${c.reponses.map((r, i) => html`<li key=${i}><strong>${r.q}.</strong> ${r.t}</li>`)}</ul>${c.expVue && html`<p className="small">Expérience constatée : ${Object.entries(c.expVue).map(([k, n]) => `${(CR.EXP.find((x) => x[0] === k) || [0, k])[1].toLowerCase()} ${n}`).join(", ")}.</p>`}</div>`}
        <div className="eq-offre">
          <label>Offre par mois <input type="number" step="50" value=${v} onChange=${(e) => setOffre(+e.target.value)} /></label>
          <${Btn} small kind="primary" onClick=${() => { const r = CR.proposer(s, c.id, v); setMsg(r.texte); bump(); }}>Proposer</${Btn}>
          <${Btn} small onClick=${() => { CR.ecarter(s, c.id); bump(); }}>Écarter</${Btn}>
          ${c.demandeVue && html`<span className="small muted">Demande ${CR.money(c.demande)}.</span>`}
          <span className="small muted">Répond avant le ${CR.fmtDate(Math.max(s.day, c.expire), "short")} environ.</span>
        </div>
        ${msg && html`<p className="small">${msg}</p>`}
      </div>`}
    </li>`;
  };

  // ------------------------------------------------------------------ Liste des tâches confiées
  const TacheLigne = ({ s, t, avecDossier }) => {
    const st = s.staff.find((x) => x.id === t.staffId) || (s.team.partis || []).find((x) => x.id === t.staffId);
    const cs = t.caseId ? s.cases[t.caseId] : null;
    const D = CR.DELEG[t.type];
    const [msg, setMsg] = useState(null);
    return html`<tr>
      <td>${t.label}${t.relire ? html` <span className="small muted">· relecture</span>` : ""}${t.resultat && ["fait", "echec", "abandonnee"].includes(t.etat) ? html`<div className="small muted">${t.resultat}</div>` : ""}${msg ? html`<div className="small">${msg}</div>` : ""}</td>
      ${avecDossier && html`<td className="small">${cs ? CR.caseTitle(s, cs) : "Cabinet"}</td>`}
      <td className="small">${st ? st.name || st.prenom : "—"}</td>
      <td className="small"><span className=${cx(t.etat === "a_relire" && "eq-relire", t.erreur && !t.erreur.rattrapee && "neg")}>${etatTxt(t)}</span>${t.erreur ? html`<div className="small">${t.erreur.rattrapee ? "erreur rattrapée" : t.erreur.texte}</div>` : ""}${["attente", "en_cours", "oubli"].includes(t.etat) && t.prevu ? html`<div className="small muted">vers le ${CR.fmtDate(t.prevu, "dowshort")}</div>` : ""}</td>
      <td>${t.etat === "a_relire" ? html`<${Btn} small kind="primary" onClick=${() => { const r = CR.relire(s, t.id); setMsg(r && r.texte); bump(); }}>Relire (${D.relecture} min)</${Btn}>` : t.type === "plaidoirie" && t.etat === "planifiee" && !t.prepare ? html`<${Btn} small onClick=${() => { const r = CR.relire(s, t.id); setMsg(r && r.texte); bump(); }}>Préparer avec ${st ? st.prenom : ""} (${D.relecture} min)</${Btn}>` : ["attente", "planifiee"].includes(t.etat) ? html`<button className="link small" onClick=${() => { CR.annulerTache(s, t.id); bump(); }}>reprendre</button>` : null}</td>
    </tr>`;
  };
  UI.TachesTable = ({ s, taches, avecDossier }) => html`<div className="tbl-wrap"><table className="tbl eq-taches"><thead><tr><th>Tâche</th>${avecDossier && html`<th>Dossier</th>`}<th>Confiée à</th><th>État</th><th></th></tr></thead><tbody>
    ${taches.map((t) => html`<${TacheLigne} key=${t.id} s=${s} t=${t} avecDossier=${avecDossier} />`)}
  </tbody></table></div>`;

  // ------------------------------------------------------------------ La page d'équipe
  UI.EquipePanel = ({ s, go }) => {
    CR.equipe(s);
    const [vue, setVue] = useState("equipe");
    const [sel, setSel] = useState(null);
    const staff = s.staff;
    const taches = s.team.taches.slice().reverse();
    const actives = taches.filter((t) => !["fait", "annulee", "abandonnee", "echec"].includes(t.etat) || s.day - (t.fin || t.created) < 10);
    const cands = CR.candidatsVisibles(s);
    const aRelire = taches.filter((t) => t.etat === "a_relire").length;
    const col = staff.find((x) => x.role === "collaborateur" && !x.depart);
    const ast = staff.find((x) => x.role === "assistante" && !x.depart);
    const impayes = s.order.map((id) => s.cases[id]).filter((c) => c && c.flags && c.flags.impaye && c.facture && c.facture.reste > 0);
    const perms = col ? CR.permanencesConfiables(s) : [];
    const anc = s.team.ancienStagiaire;
    return html`<div className="equipe">
      <div className="eq-top">
        <div className="kpi"><span className="pix">Équipe</span><strong>${staff.length ? CR.plural(staff.length, "personne") : "Vous seul"}</strong></div>
        <div className="kpi"><span className="pix">Coût mensuel</span><strong>${CR.money(CR.coutEquipe(s))}</strong><span className="small muted">salaires, charges, rétrocessions</span></div>
        <div className="kpi"><span className="pix">Appels pris</span><strong>${s.team.appelsPris || 0}</strong></div>
        ${staff.length > 0 && html`<${Btn} kind=${CR.reunionPossible(s) ? "primary" : ""} disabled=${!CR.reunionPossible(s)} title=${CR.dow(s.day) !== 1 ? "Le lundi" : ""} onClick=${() => { CR.reunion(s); bump(); }}>${s.team.reunion === CR.weekOf(s.day) ? "Réunion tenue cette semaine" : "Réunion d'équipe du lundi (45 min)"}</${Btn}>`}
      </div>
      <div className="eq-tabs">${[["equipe", "Équipe"], ["taches", `Tâches confiées${aRelire ? ` · ${aRelire} à relire` : ""}`], ["recrutement", `Recrutement${cands.length ? ` · ${cands.length}` : ""}`], ["chiffres", "Chiffres"]].map(([k, l]) => html`<button key=${k} className=${cx("chip", vue === k && "on")} onClick=${() => setVue(k)}>${l}</button>`)}</div>
      ${vue === "equipe" && html`<div>
        ${staff.length === 0 && html`<${Empty}>Vous seul. Chaque appel, chaque acte, chaque audience. Publiez une annonce dans « Recrutement ».</${Empty}>`}
        ${anc && html`<div className="banner small">${anc.prenom} ${anc.nomF} a fini son stage. <${Btn} small kind="primary" onClick=${() => { CR.proposerCollaboration(s); bump(); }}>Lui proposer une collaboration (${CR.money(CR.chiffre("retroMin"))} HT)</${Btn}></div>`}
        <ul className="eq-cards">${staff.map((st) => html`<li key=${st.id} className=${cx("eq-card", sel === st.id && "on")}>
          <button className="eq-card-head" onClick=${() => setSel(sel === st.id ? null : st.id)} aria-expanded=${sel === st.id}>
            <${Portrait} look=${CR.px.lookFrom(st.seed)} size=${48} blink=${false} />
            <span className="eq-card-txt"><strong>${st.name}</strong><span className="small muted">${CR.roleLabel(st)}${st.age ? `, ${st.age} ans` : ""} · ${remuTxt(st)}</span>${statutTxt(s, st)}</span>
            <span className="eq-meters"><span className="small">Charge ${pct(CR.charge(s, st))}</span><${Meter} value=${Math.min(100, CR.charge(s, st) * 70)} tone=${tone(CR.charge(s, st) * 70, true)} small=${true} /><span className="small">Moral</span><${Meter} value=${st.morale} tone=${tone(st.morale)} small=${true} /></span>
          </button>
          ${sel === st.id && html`<${Fiche} s=${s} st=${st} go=${go} />`}
        </li>`)}</ul>
        ${perms.length > 0 && html`<${UI.Section} title="Permanences inscrites">
          <ul className="log-list">${perms.slice(0, 6).map((p) => html`<li key=${p.day + p.type}>${CR.fmtDate(p.day, "dowshort")} — ${CR.DUTY_LABEL[p.type]} <button className="link small" onClick=${() => { CR.confier(s, null, col.id, { type: "permanence", label: `${CR.DUTY_LABEL[p.type]}, ${CR.fmtDate(p.day, "dowshort")}`, ref: { day: p.day, dtype: p.type }, jour: p.day }); bump(); }}>confier à ${col.name}</button></li>`)}</ul>
        </${UI.Section}>`}
        ${ast && impayes.length > 0 && html`<p className="small">${CR.plural(impayes.length, "facture impayée", "factures impayées")}. <button className="link small" onClick=${() => { CR.confier(s, null, ast.id, { type: "relances", label: "Relances de facturation", ref: { k: "relances" } }); bump(); }}>Confier les relances à ${ast.prenom}</button></p>`}
        ${s.team.partis.length > 0 && html`<${UI.Section} title="Ils sont partis"><ul className="log-list small">${s.team.partis.slice(0, 6).map((p, i) => html`<li key=${i}>${p.name} (${CR.roleLabel(p).toLowerCase()}) — ${CR.fmtDate(p.arrive, "short")} au ${CR.fmtDate(p.fin, "short")} : ${p.raison}${p.emmene ? `, avec ${p.emmene}` : ""}.</li>`)}</ul></${UI.Section}>`}
      </div>`}
      ${vue === "taches" && (actives.length ? html`<${UI.TachesTable} s=${s} taches=${actives} avecDossier=${true} />` : html`<${Empty}>Rien de confié. Dans un dossier, « Confier à l'équipe ».</${Empty}>`)}
      ${vue === "recrutement" && html`<div>
        <${UI.Section} title="Publier une annonce"><${AnnonceForm} s=${s} /></${UI.Section}>
        ${s.team.annonces.filter((a) => s.day <= a.fin + 20).length > 0 && html`<${UI.Section} title="Annonces"><ul className="log-list small">${s.team.annonces.filter((a) => s.day <= a.fin + 20).map((a) => html`<li key=${a.id}>${CR.ROLES[a.role].label}, ${CR.money(a.remu)}${a.domaines.length ? ` · ${a.domaines.map((k) => (CR.EXP.find((x) => x[0] === k) || [0, k])[1].toLowerCase()).join(", ")}` : ""} — publiée le ${CR.fmtDate(a.day, "short")}${a.pourvue ? " · pourvue" : s.day > a.fin ? " · close" : ""}</li>`)}</ul></${UI.Section}>`}
        <${UI.Section} title="Candidatures">
          ${cands.length === 0 ? html`<${Empty}>Aucune candidature en attente.</${Empty}>` : html`<ul className="eq-cands">${cands.map((c) => html`<${Candidat} key=${c.id} s=${s} c=${c} />`)}</ul>`}
          <p className="small muted">Un bon candidat n'attend pas : sans réponse, il signe ailleurs. Leurs erreurs seront les vôtres : vous répondez de ceux que vous encadrez.</p>
        </${UI.Section}>
      </div>`}
      ${vue === "chiffres" && html`<div><p className="small muted">Chiffres du jeu, vérifiés en novembre 2026 (SMIC, convention collective des cabinets d'avocats, Ordre de Paris, règlement intérieur national). Ils changent chaque année : à revoir avant tout usage réel.</p>
        <table className="tbl"><tbody>${CR.EQ_CHIFFRES.map((c) => html`<tr key=${c.k}><td>${c.label}</td><td>${c.val}</td><td><${Tag} tone=${c.etat === "verifie" ? "ok" : "brass"}>${c.etat === "verifie" ? "vérifié" : "estimation du jeu"}</${Tag}></td></tr>`)}</tbody></table></div>`}
    </div>`;
  };

  // ------------------------------------------------------------------ « Confier à l'équipe » dans un dossier
  UI.ConfierBox = ({ s, cs }) => {
    CR.equipe(s);
    const items = CR.tachesDelegables(s, cs);
    const [i, setI] = useState(0);
    const [who, setWho] = useState(null);
    const [relire, setRelire] = useState(true);
    const [msg, setMsg] = useState(null);
    const it = items[Math.min(i, items.length - 1)];
    const staff = s.staff.filter((st) => !st.depart);
    const ok = it ? staff.filter((st) => CR.peutFaire(st, it.type)) : [];
    const deja = it ? CR.dejaConfiee(s, cs, it) : null;
    const D = it ? CR.DELEG[it.type] : null;
    const tCase = s.team.taches.filter((t) => t.caseId === cs.id).slice(-6).reverse();
    return html`<div className="confier">
      <div className="sub-head">Confier à l'équipe</div>
      ${items.length > 0 && html`<div className="confier-row">
        <select value=${i} onChange=${(e) => { setI(+e.target.value); setWho(null); setMsg(null); }}>${items.map((x, k) => html`<option key=${k} value=${k}>${x.label}</option>`)}</select>
        ${deja ? html`<span className="small muted">Déjà confiée.</span>` : ok.length === 0 ? html`<span className="small muted">Personne au cabinet ne peut s'en charger.</span>` : null}
      </div>`}
      ${it && !deja && ok.length > 0 && html`<ul className="confier-who">${ok.map((st) => { const e = CR.estimer(s, st, it, cs); return html`<li key=${st.id}><label className=${cx(!e.dispo && "off")}><input type="radio" name=${"who" + cs.id} checked=${who === st.id} disabled=${!e.dispo} onChange=${() => setWho(st.id)} /> <strong>${st.name}</strong> <span className="small muted">${CR.roleLabel(st, true)} · qualité ${e.label} · risque d'erreur ${e.risque} % · ${e.dispo ? (it.jour != null ? `le ${CR.fmtDate(e.jour, "dowshort")}` : `prêt vers le ${CR.fmtDate(e.jour, "dowshort")}`) : "absent ce jour-là"} · charge ${pct(CR.charge(s, st))}</span></label></li>`; })}</ul>`}
      ${it && !deja && ok.length > 0 && html`<div className="confier-row">
        ${D.relecture > 0 && !D.fixe && html`<label className="small"><input type="checkbox" checked=${relire} onChange=${(e) => setRelire(e.target.checked)} /> Relire avant envoi (${D.relecture} min pour vous ; rattrape la plupart des erreurs)</label>`}
        <${Btn} small kind="primary" disabled=${!who} onClick=${() => { const r = CR.confier(s, cs, who, it, { relire }); setMsg(r.ok ? `Confié. ${r.est.jour != null ? `Prévu vers le ${CR.fmtDate(r.est.jour, "dowshort")}.` : ""}` : r.texte); setWho(null); bump(); }}>Confier</${Btn}>
      </div>`}
      ${msg && html`<p className="small">${msg}</p>`}
      ${tCase.length > 0 && html`<${UI.TachesTable} s=${s} taches=${tCase} avecDossier=${false} />`}
    </div>`;
  };
})();
