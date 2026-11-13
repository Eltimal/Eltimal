// La Permanence — refonte du gameplay, lot 5 (premier jet) : le canal de chaque acte (CR.CANAUX, UI.CanalScene)
// Tout acte rédigé se transmet par un canal que le joueur choisit parmi tous les canaux de la pratique ; la loi n'en admet
// que certains (dev/ref/actes-canaux.md, vérifié le 12 novembre 2026). Un mauvais canal rend l'acte irrecevable : le greffe
// le fait savoir quelques jours plus tard, avec le motif exact. Un canal admis prend date à son heure : e-Barreau à
// l'accusé de réception (après 17 heures ou un jour non ouvrable, le premier jour ouvrable suivant, D. 591), le recommandé
// à son arrivée, le greffe quand on s'y présente.
// Mode libre seulement : le mode assisté et les parties automatiques gardent le dépôt en un clic.
(function () {
  "use strict";
  const CR = window.CR;
  const C = (CR.CANAUX = {});
  C.LISTE = [
    ["greffe", "Déclaration ou dépôt au greffe", "Un trajet, aux heures d'ouverture. Le greffier date et signe."],
    ["cep", "e-Barreau — communication électronique pénale", "Depuis votre poste. L'accusé de réception date l'envoi."],
    ["lrar", "Lettre recommandée avec avis de réception", "Deux à trois jours ouvrés d'acheminement, 8 €."],
    ["fax", "Télécopie au greffe", "Depuis le cabinet ; enregistrée à réception."],
    ["chef", "Déclaration au chef d'établissement pénitentiaire", "Le client détenu la signe ; elle est transmise au greffe."],
    ["cj", "Acte de commissaire de justice", "Délivré par l'étude : un coût et quelques jours."],
  ];
  C.lib = (k) => (C.LISTE.find((x) => x[0] === k) || [null, k])[1];
  // canaux admis, acte par acte (table du lot 0)
  C.ADMIS = {
    conclusions_nullite: ["greffe"], requete_nullite: ["greffe"], plainte_simple: ["greffe", "lrar", "cep"], pcpc: ["greffe", "cep"],
    citation: ["cj"], constitution_pc: ["lrar", "fax", "cep"], demande_actes: ["greffe", "lrar", "chef", "cep"], dml: ["greffe", "chef"], appel: ["greffe", "chef"],
  };
  const TEXTE = { conclusions_nullite: "art. 385 et 459", requete_nullite: "art. 173", plainte_simple: "art. 85 et D. 591", pcpc: "art. 85 et D. 591", citation: "art. 550", constitution_pc: "art. 420-1", demande_actes: "art. 82-1 et D. 591", dml: "art. 148-6 et D. 593", appel: "art. 502 et 503" };
  C.MOTIF = (key, canal, titre) => ({
    "dml|cep": "La demande de mise en liberté ne peut pas être adressée par la voie électronique (art. D. 593) ; elle se forme par déclaration au greffier (art. 148-6). Elle est irrecevable : votre client reste détenu.",
    "dml|lrar": "La demande de mise en liberté se forme par déclaration au greffier, ou au chef d'établissement pour un détenu (art. 148-6) ; une lettre ne la saisit pas. Irrecevable.",
    "appel|cep": "L'appel se forme par déclaration au greffier de la juridiction qui a statué (art. 502) ; un message ne vaut pas déclaration. Irrecevable.",
    "appel|lrar": "L'appel se forme par déclaration au greffier de la juridiction qui a statué (art. 502) ; une lettre ne vaut pas déclaration. Irrecevable.",
    "conclusions_nullite|cep": "Les conclusions se déposent au greffe et sont visées par le président et le greffier (art. 459) ; la voie électronique ne les reçoit pas. Le tribunal n'en est pas saisi.",
  })[key + "|" + canal] || `${titre} ne peut pas être transmis par ${C.lib(canal).toLowerCase()} (${TEXTE[key] || "texte applicable"}). L'acte est irrecevable.`;
  C.gere = (s, key) => !!(CR.libre && CR.libre(s) && C.ADMIS[key]);
  C.detenu = (s, cs) => !!(s.detenus || []).find((d) => d.caseId === cs.id) || (cs.proc && cs.proc.detention && cs.proc.detention.statut === "dp");

  // transmettre : rend { ok, effet (jour), msg }
  C.transmettre = function (s, cs, key, canal) {
    const d = CR.drafted(cs, key);
    if (!d || d.depose) return { ok: false, msg: "Rien à transmettre." };
    const tpl = CR.getTpl(s, cs, key);
    const admis = (C.ADMIS[key] || []).includes(canal);
    d.canal = canal;
    if (canal === "greffe" || canal === "cj") { cs.vars.canalChoisi = Object.assign({}, cs.vars.canalChoisi, { [key]: canal }); if (!admis) d.irrecevablePrevu = true; return { ok: true, trajet: true, msg: `Il reste à vous rendre ${canal === "cj" ? "à l'étude" : "au greffe"} : ${tpl.depotLabel || "le lieu du dépôt"}.` }; }
    if (canal === "chef" && !C.detenu(s, cs)) return { ok: false, msg: "Votre client n'est pas détenu : il n'y a pas de chef d'établissement pour recevoir sa déclaration." };
    CR.spend(s, canal === "cep" ? 10 : canal === "fax" ? 8 : canal === "lrar" ? 20 : 15, "admin");
    if (canal === "lrar") CR.payOut ? CR.payOut(s, 8, "Recommandé avec avis de réception", cs.id) : null;
    let jour = s.day, min = s.min;
    if (canal === "cep" && (min >= 17 * 60 || !CR.isOuvrable(jour))) jour = CR.addOuvrables(jour, 1);
    if (canal === "lrar") jour = CR.addBusinessDays(jour, 2 + (CR.hash(cs.id + key) % 2));
    if (canal === "chef") jour = CR.addBusinessDays(jour, 1);
    d.depose = true; d.deposeDay = jour; d.transmis = { canal, day: s.day, min };
    CR.timeline(s, cs, `${tpl.title} : transmis par ${C.lib(canal).toLowerCase()}${canal === "cep" ? ` (accusé de réception à ${CR.fmtTime(min)})` : ""}.`);
    if (!admis) {
      d.irrecevable = canal;
      CR.erreur(s, cs, { id: "canal_" + key, texte: `${tpl.title} transmis par ${C.lib(canal).toLowerCase()}.`, sanction: C.MOTIF(key, canal, tpl.title), regul: "Refaire l'acte par un canal admis, si le délai court encore." });
      CR.schedule(s, { day: CR.addBusinessDays(s.day, 2), min: 11 * 60, type: "fn", key: "canalIrrecevable", data: { caseId: cs.id, key } });
      return { ok: true, msg: canal === "cep" ? `Message parti. Accusé de réception à ${CR.fmtTime(min)}.` : "Envoyé." };
    }
    // un canal admis : l'acte prend effet au jour qu'il fixe
    if (jour === s.day) CR.deposer(s, cs, key, { sansTemps: true, deja: true });
    else CR.schedule(s, { day: jour, min: 9 * 60, type: "fn", key: "canalEffet", data: { caseId: cs.id, key } });
    return { ok: true, msg: canal === "cep" ? `Message parti. Accusé de réception à ${CR.fmtTime(min)}${jour !== s.day ? ` : l'acte prend date le ${CR.fmtDate(jour, "long")}` : ""}.` : canal === "lrar" ? `Envoyé. Arrivée prévue le ${CR.fmtDate(jour, "long")}.` : "Envoyé." };
  };
  // au greffe ou à l'étude : l'acte prend date ici, sauf si ce lieu n'est pas une voie admise pour cet acte
  C.deposerSurPlace = function (s, cs, key) {
    const d = CR.drafted(cs, key), tpl = CR.getTpl(s, cs, key);
    if (!d || d.depose) return null;
    const canal = (cs.vars.canalChoisi || {})[key] || "greffe";
    if ((C.ADMIS[key] || []).includes(canal)) return CR.deposer(s, cs, key);
    CR.spend(s, tpl.depotTime || 15, "admin");
    d.depose = true; d.irrecevable = canal; d.deposeDay = s.day;
    CR.timeline(s, cs, `${tpl.title} : remis ${canal === "cj" ? "à l'étude" : "au greffe"}.`);
    CR.erreur(s, cs, { id: "canal_" + key, texte: `${tpl.title} remis ${canal === "cj" ? "à un commissaire de justice" : "au greffe"}.`, sanction: C.MOTIF(key, canal, tpl.title), regul: "Refaire l'acte par un canal admis, si le délai court encore." });
    CR.schedule(s, { day: CR.addBusinessDays(s.day, 2), min: 11 * 60, type: "fn", key: "canalIrrecevable", data: { caseId: cs.id, key } });
    return d;
  };
  CR.GLOBAL_FN = CR.GLOBAL_FN || {};
  CR.GLOBAL_FN.canalEffet = (s, x) => { const cs = s.cases[x.caseId]; if (cs) CR.deposer(s, cs, x.key, { sansTemps: true, deja: true }); };
  CR.GLOBAL_FN.canalIrrecevable = (s, x) => {
    const cs = s.cases[x.caseId]; if (!cs) return;
    const tpl = CR.getTpl(s, cs, x.key), d = CR.drafted(cs, x.key);
    CR.mail(s, { from: "Greffe", subject: `${tpl.title} — irrecevable`, kind: "greffe", caseId: cs.id, important: true, body: [[`Maître, ${C.MOTIF(x.key, d ? d.irrecevable : "", tpl.title)}`]] });
  };

  // ------------------------------------------------------------------ Le choix du canal (fenêtre)
  const UI = CR.UI;
  if (UI && UI.html) {
    const { html, Btn } = UI;
    UI.CanalScene = function CanalScene({ s, cs, tplKey, onDone }) {
      const tpl = CR.getTpl(s, cs, tplKey);
      const [res, setRes] = React.useState(null);
      const choisir = (k) => { const r = C.transmettre(s, cs, tplKey, k); setRes(r); CR.store.bump(); };
      return html`<${UI.Modal} title=${`Transmettre : ${tpl.title}`} onClose=${onDone} footer=${html`<${Btn} kind="primary" onClick=${onDone}>${res && res.ok ? "Fermer" : "Annuler"}</${Btn}>`}>
        ${!res || !res.ok ? html`<div className="canaux">
          <p className="small muted">Par quelle voie transmettez-vous l'acte ? Il prend date selon la voie choisie ; une voie que la loi n'admet pas pour cet acte le rend irrecevable.</p>
          ${C.LISTE.map(([k, l, sub]) => html`<button type="button" key=${k} className="canal" onClick=${() => choisir(k)}><b>${l}</b><span className="small muted">${sub}</span></button>`)}
          ${res && !res.ok && html`<p className="warn-txt small">${res.msg}</p>`}
        </div>` : html`<p>${res.msg}</p>`}
      </${UI.Modal}>`;
    };
  }
})();
